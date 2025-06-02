"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpaceWatcher = void 0;
const axios_1 = __importDefault(require("axios"));
const commander_1 = require("commander");
const events_1 = __importDefault(require("events"));
const open_1 = __importDefault(require("open"));
const path_1 = __importDefault(require("path"));
const twitter_api_1 = require("../api/twitter.api");
const PeriscopeApi_1 = require("../apis/PeriscopeApi");
const app_constant_1 = require("../constants/app.constant");
const Twitter_enum_1 = require("../enums/Twitter.enum");
const logger_1 = require("../logger");
const PeriscopeUtil_1 = require("../utils/PeriscopeUtil");
const SpaceUtil_1 = require("../utils/SpaceUtil");
const TwitterUtil_1 = require("../utils/TwitterUtil");
const Util_1 = require("../utils/Util");
const twitter_entity_util_1 = require("../utils/twitter-entity.util");
const ConfigManager_1 = require("./ConfigManager");
const Notification_1 = require("./Notification");
const SpaceCaptionsDownloader_1 = require("./SpaceCaptionsDownloader");
const SpaceCaptionsExtractor_1 = require("./SpaceCaptionsExtractor");
const SpaceDownloader_1 = require("./SpaceDownloader");
const Webhook_1 = require("./Webhook");
class SpaceWatcher extends events_1.default {
    constructor(spaceId) {
        super();
        this.spaceId = spaceId;
        this.chunkVerifyCount = 0;
        this.isNotificationNotified = false;
        this.logger = logger_1.logger.child({ label: `[SpaceWatcher@${spaceId}]` });
        // Force open space url in browser (no need to wait for notification)
        if (commander_1.program.getOptionValue('forceOpen')) {
            (0, open_1.default)(this.spaceUrl);
        }
    }
    get spaceUrl() {
        return TwitterUtil_1.TwitterUtil.getSpaceUrl(this.spaceId);
    }
    get filename() {
        const time = Util_1.Util.getDateTimeString(this.space?.startedAt || this.space?.createdAt);
        const name = `[${this.space?.creator?.username}][${time}] ${Util_1.Util.getCleanFileName(this.space?.title) || 'NA'} (${this.spaceId})`;
        return name;
    }
    async watch() {
        this.logger.info('Watching...');
        this.logger.info(`Space url: ${this.spaceUrl}`);
        try {
            await this.initData();
        }
        catch (error) {
            if (this.audioSpace?.metadata) {
                this.logger.error(`watch: ${error.message}`);
            }
            const ms = app_constant_1.APP_SPACE_ERROR_RETRY_INTERVAL;
            this.logger.info(`Retry watch in ${ms}ms`);
            setTimeout(() => this.watch(), ms);
        }
    }
    // #region log
    logSpaceInfo() {
        const payload = {
            username: this.space?.creator?.username,
            id: this.spaceId,
            scheduled_start: this.space?.scheduledStart,
            started_at: this.space?.startedAt,
            ended_at: this.space?.endedAt,
            title: this.space?.title || null,
            playlist_url: PeriscopeUtil_1.PeriscopeUtil.getMasterPlaylistUrl(this.dynamicPlaylistUrl),
        };
        logger_1.spaceLogger.info(payload);
        this.logger.info('Space info', payload);
    }
    logSpaceAudioDuration() {
        if (!this.space?.endedAt || !this.space?.startedAt) {
            return;
        }
        const ms = Number(this.space.endedAt) - this.space.startedAt;
        const duration = Util_1.Util.getDisplayTime(ms);
        this.logger.info(`Expected audio duration: ${duration}`);
    }
    // #endregion
    // #region check
    async checkDynamicPlaylist() {
        this.logger.debug('--> checkDynamicPlaylist');
        try {
            const { data } = await axios_1.default.get(this.dynamicPlaylistUrl);
            this.logger.debug('<-- checkDynamicPlaylist');
            const chunkIndexes = PeriscopeUtil_1.PeriscopeUtil.getChunks(data);
            if (chunkIndexes.length) {
                this.logger.debug(`Found chunks: ${chunkIndexes.join(',')}`);
                this.lastChunkIndex = Math.max(...chunkIndexes);
            }
        }
        catch (error) {
            const status = error.response?.status;
            if (status === 404) {
                // Space ended / Host disconnected
                this.logger.info(`Dynamic playlist status: ${status}`);
                this.checkMasterPlaylist();
                return;
            }
            this.logger.error(`checkDynamicPlaylist: ${error.message}`);
        }
        this.checkDynamicPlaylistWithTimer();
    }
    async checkMasterPlaylist() {
        this.logger.debug('--> checkMasterPlaylist');
        try {
            const masterChunkSize = PeriscopeUtil_1.PeriscopeUtil.getChunks(await PeriscopeApi_1.PeriscopeApi.getFinalPlaylist(this.dynamicPlaylistUrl)).length;
            this.logger.debug(`<-- checkMasterPlaylist: master chunk size ${masterChunkSize}, last chunk index ${this.lastChunkIndex}`);
            const canDownload = !this.lastChunkIndex
                || this.chunkVerifyCount > app_constant_1.APP_PLAYLIST_CHUNK_VERIFY_MAX_RETRY
                || masterChunkSize >= this.lastChunkIndex;
            if (canDownload) {
                await this.processDownload();
                return;
            }
            this.logger.warn(`Master chunk size (${masterChunkSize}) lower than last chunk index (${this.lastChunkIndex})`);
            this.chunkVerifyCount += 1;
        }
        catch (error) {
            this.logger.error(`checkMasterPlaylist: ${error.message}`);
        }
        this.checkMasterPlaylistWithTimer();
    }
    checkDynamicPlaylistWithTimer(ms = app_constant_1.APP_PLAYLIST_REFRESH_INTERVAL) {
        setTimeout(() => this.checkDynamicPlaylist(), ms);
    }
    checkMasterPlaylistWithTimer(ms = app_constant_1.APP_PLAYLIST_REFRESH_INTERVAL) {
        this.logger.info(`Recheck master playlist in ${ms}ms`);
        setTimeout(() => this.checkMasterPlaylist(), ms);
    }
    async initData() {
        if (!this.audioSpace?.metadata) {
            await this.getSpaceData();
            if (this.space?.state === Twitter_enum_1.SpaceState.LIVE) {
                this.showNotification();
            }
        }
        // Download space by url with available metadata
        this.dynamicPlaylistUrl = commander_1.program.getOptionValue('url');
        if (this.dynamicPlaylistUrl) {
            this.downloadAudio();
            return;
        }
        if (this.space?.state === Twitter_enum_1.SpaceState.CANCELED) {
            this.logger.warn('Space canceled');
            return;
        }
        if (this.space?.state === Twitter_enum_1.SpaceState.ENDED && !this.space?.isAvailableForReplay) {
            this.logger.warn('Space archive not available');
            return;
        }
        if (!this.liveStreamStatus) {
            this.logger.debug('--> getLiveVideoStreamStatus');
            const { data } = await twitter_api_1.api.liveVideoStream.status(this.audioSpace.metadata.media_key);
            this.liveStreamStatus = data;
            this.logger.debug('<-- getLiveVideoStreamStatus');
            this.logger.debug('liveStreamStatus', this.liveStreamStatus);
        }
        if (!this.dynamicPlaylistUrl) {
            this.dynamicPlaylistUrl = this.liveStreamStatus.source.location;
            this.logger.info(`Master playlist url: ${PeriscopeUtil_1.PeriscopeUtil.getMasterPlaylistUrl(this.dynamicPlaylistUrl)}`);
            this.buildSpace();
            this.logSpaceInfo();
            if (this.space?.state === Twitter_enum_1.SpaceState.LIVE) {
                this.sendWebhooks();
            }
        }
        if (!this.accessChatData) {
            this.logger.debug('--> getAccessChat');
            this.accessChatData = await PeriscopeApi_1.PeriscopeApi.getAccessChat(this.liveStreamStatus.chatToken);
            this.logger.debug('<-- getAccessChat');
            this.logger.debug('accessChat data', this.accessChatData);
            this.logger.info(`Chat endpoint: ${this.accessChatData.endpoint}`);
            this.logger.info(`Chat access token: ${this.accessChatData.access_token}`);
        }
        if (this.space?.state === Twitter_enum_1.SpaceState.ENDED) {
            this.processDownload();
            return;
        }
        // Force download space
        if (commander_1.program.getOptionValue('force')) {
            this.downloadAudio();
            return;
        }
        this.checkDynamicPlaylist();
    }
    buildSpace() {
        const space = twitter_entity_util_1.TwitterEntityUtil.buildSpaceByAudioSpace(this.audioSpace);
        this.space = space;
        if (this.dynamicPlaylistUrl) {
            this.space.playlistUrl = PeriscopeUtil_1.PeriscopeUtil.getMasterPlaylistUrl(this.dynamicPlaylistUrl);
        }
    }
    // #endregion
    // #region audio space
    async getAudioSpaceById() {
        try {
            const { data } = await twitter_api_1.api.graphql.AudioSpaceById(this.spaceId);
            const audioSpace = data?.data?.audioSpace;
            delete audioSpace.sharings;
            this.logger.info('getAudioSpaceById', { audioSpace });
            logger_1.spaceRawLogger.info({ type: 'AudioSpaceById', data: audioSpace });
            return audioSpace;
        }
        catch (error) {
            this.logger.error(`getAudioSpaceById: ${error.message}`);
            return null;
        }
    }
    async getAudioSpaceByRestId() {
        try {
            const { data } = await twitter_api_1.api.graphql.AudioSpaceByRestId(this.spaceId);
            const audioSpace = data?.data?.audio_space_by_rest_id;
            delete audioSpace.sharings;
            this.logger.info('getAudioSpaceByRestId', { audioSpace });
            logger_1.spaceRawLogger.info({ type: 'AudiospaceByRestId', data: audioSpace });
            return audioSpace;
        }
        catch (error) {
            this.logger.error(`getAudioSpaceByRestId: ${error.message}`);
            return null;
        }
    }
    async getSpaceData() {
        this.logger.debug('--> getSpaceData');
        const audioSpaces = await Promise.all([
            this.getAudioSpaceById(),
            this.getAudioSpaceByRestId(),
        ]);
        const hasMetadata = audioSpaces.some((v) => v?.metadata);
        if (!hasMetadata) {
            this.logger.error('AudioSpace metadata not found');
            return;
        }
        this.audioSpace = audioSpaces.find((v) => v?.metadata);
        this.buildSpace();
        this.logger.debug('<-- getSpaceData');
    }
    // #endregion
    // #region download
    async processDownload() {
        this.logger.debug('processDownload');
        try {
            // Save metadata before refetch
            const prevState = this.space?.state;
            // Get latest metadata in case title changed
            await this.getSpaceData();
            this.logSpaceInfo();
            if (this.space?.state === Twitter_enum_1.SpaceState.LIVE) {
                // Recheck dynamic playlist in case host disconnect for a long time
                this.checkDynamicPlaylistWithTimer();
                return;
            }
            if (this.space?.state === Twitter_enum_1.SpaceState.ENDED && prevState === Twitter_enum_1.SpaceState.LIVE) {
                this.sendWebhooks();
            }
        }
        catch (error) {
            this.logger.warn(`processDownload: ${error.message}`);
        }
        this.downloadAudio();
        this.downloadCaptions();
    }
    async downloadAudio() {
        this.logSpaceAudioDuration();
        if (ConfigManager_1.configManager.skipDownload || ConfigManager_1.configManager.skipDownloadAudio) {
            return;
        }
        try {
            const metadata = {
                title: this.space?.title,
                author: this.space?.creator?.username,
                artist: this.space?.creator?.username,
                episode_id: this.spaceId,
            };
            this.logger.info(`File name: ${this.filename}`);
            this.logger.info(`File metadata: ${JSON.stringify(metadata)}`);
            if (!this.downloader) {
                this.downloader = new SpaceDownloader_1.SpaceDownloader(this.dynamicPlaylistUrl, this.filename, this.space?.creator?.username, metadata);
            }
            await this.downloader.download();
            this.emit('complete');
            // Upload audio and playlist to S3
            const { storageManager } = await Promise.resolve().then(() => __importStar(require('./StorageManager')));
            const filePath = path_1.default.join(Util_1.Util.getMediaDir(this.space?.creator?.username), `${this.filename}.m4a`);
            const playlistPath = path_1.default.join(Util_1.Util.getMediaDir(this.space?.creator?.username), `${this.filename}.m3u8`);
            // Upload captions files to S3
            const username = this.space?.creator?.username;
            const tmpFile = path_1.default.join(Util_1.Util.getMediaDir(username), `${this.filename} CC.jsonl`);
            const outFile = path_1.default.join(Util_1.Util.getMediaDir(username), `${this.filename} CC.txt`);
            try {
                const s3AudioKey = `spaces/${this.spaceId}/${this.filename}.m4a`;
                const s3PlaylistKey = `spaces/${this.spaceId}/${this.filename}.m3u8`;
                const s3JsonlKey = `spaces/${this.spaceId}/${this.filename} CC.jsonl`;
                const s3TxtKey = `spaces/${this.spaceId}/${this.filename} CC.txt`;
                const s3AudioUrl = await storageManager.uploadFileToS3(filePath, s3AudioKey);
                const s3PlaylistUrl = await storageManager.uploadFileToS3(playlistPath, s3PlaylistKey);
                const s3JsonlUrl = await storageManager.uploadFileToS3(tmpFile, s3JsonlKey);
                const s3TxtUrl = await storageManager.uploadFileToS3(outFile, s3TxtKey);
                // Construct folder URL for spaceId
                const bucketName = process.env.AWS_S3_BUCKET_NAME || '';
                const region = process.env.AWS_REGION || '';
                const folderUrl = `https://${bucketName}.s3.${region}.amazonaws.com/spaces/${this.spaceId}/`;
                this.logger.info(`Saving to DB: spaceId=${this.spaceId}, folderUrl=${folderUrl}`);
                await storageManager.saveSpaceLinkToDb(this.spaceId, folderUrl);
                this.logger.info(`Uploaded audio to S3: ${s3AudioUrl}`);
                this.logger.info(`Uploaded playlist to S3: ${s3PlaylistUrl}`);
                this.logger.info(`Uploaded captions jsonl to S3: ${s3JsonlUrl}`);
                this.logger.info(`Uploaded captions txt to S3: ${s3TxtUrl}`);
                // Send webhook with audio and playlist URLs (unchanged)
                this.sendWebhooksWithS3Url(s3AudioUrl, s3PlaylistUrl);
            }
            catch (error) {
                this.logger.error(`Error uploading to S3 or saving to DB: ${error.message}`);
            }
        }
        catch (error) {
            const ms = 10000;
            // Attemp to download transcode playlist right after space end could return 404
            this.logger.error(`downloadAudio: ${error.message}`);
            this.logger.info(`Retry download audio in ${ms}ms`);
            setTimeout(() => this.downloadAudio(), ms);
        }
    }
    sendWebhooksWithS3Url(s3AudioUrl, s3PlaylistUrl) {
        // Combine audio and playlist URLs into a single string separated by newline
        const combinedS3Url = s3PlaylistUrl ? `${s3AudioUrl}\n${s3PlaylistUrl}` : s3AudioUrl;
        const webhook = new Webhook_1.Webhook(this.space, this.audioSpace, combinedS3Url);
        webhook.send();
    }
    async downloadCaptions() {
        if (ConfigManager_1.configManager.skipDownload || ConfigManager_1.configManager.skipDownloadCaption) {
            return;
        }
        if (!this.accessChatData) {
            return;
        }
        try {
            const username = this.space?.creator?.username;
            const tmpFile = path_1.default.join(Util_1.Util.getMediaDir(username), `${this.filename} CC.jsonl`);
            const outFile = path_1.default.join(Util_1.Util.getMediaDir(username), `${this.filename} CC.txt`);
            Util_1.Util.createMediaDir(username);
            await new SpaceCaptionsDownloader_1.SpaceCaptionsDownloader(this.spaceId, this.accessChatData.endpoint, this.accessChatData.access_token, tmpFile).download();
            await new SpaceCaptionsExtractor_1.SpaceCaptionsExtractor(tmpFile, outFile, this.space?.startedAt).extract();
        }
        catch (error) {
            this.logger.error(`downloadCaptions: ${error.message}`);
        }
    }
    // #endregion
    // #region notification
    async showNotification() {
        if (!commander_1.program.getOptionValue('notification') || this.isNotificationNotified) {
            return;
        }
        this.isNotificationNotified = true;
        const notification = new Notification_1.Notification({
            title: `${this.space?.creator?.name || ''} Space Live!`.trim(),
            message: `${this.space?.title || ''}`,
            icon: SpaceUtil_1.SpaceUtil.getHostProfileImgUrl(this.audioSpace),
        }, this.spaceUrl);
        notification.notify();
    }
    // #endregion
    // #region webhook
    sendWebhooks() {
        const webhook = new Webhook_1.Webhook(this.space, this.audioSpace);
        webhook.send();
    }
}
exports.SpaceWatcher = SpaceWatcher;
//# sourceMappingURL=SpaceWatcher.js.map