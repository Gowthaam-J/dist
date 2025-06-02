"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserWatcher = void 0;
const events_1 = __importDefault(require("events"));
const Limiter_1 = require("../Limiter");
const TwitterApi_1 = require("../apis/TwitterApi");
const twitter_constant_1 = require("../constants/twitter.constant");
const Twitter_enum_1 = require("../enums/Twitter.enum");
const logger_1 = require("../logger");
const Util_1 = require("../utils/Util");
const ConfigManager_1 = require("./ConfigManager");
const UserManager_1 = require("./UserManager");
class UserWatcher extends events_1.default {
    constructor(username) {
        super();
        this.username = username;
        this.cacheSpaceIds = new Set();
        this.logger = logger_1.logger.child({ label: `[UserWatcher@${username}]` });
    }
    get user() {
        return UserManager_1.userManager.getUserByUsername(this.username);
    }
    // eslint-disable-next-line class-methods-use-this
    get headers() {
        return {
            authorization: twitter_constant_1.TWITTER_PUBLIC_AUTHORIZATION,
            'x-guest-token': ConfigManager_1.configManager.guestToken,
        };
    }
    watch() {
        this.logger.info('Watching...');
        this.getSpaces();
    }
    async getSpaces() {
        if (this.user.id) {
            try {
                await ConfigManager_1.configManager.getGuestToken();
                await this.getUserTweets();
            }
            catch (error) {
                this.logger.error(`getSpaces: ${error.message}`);
            }
        }
        setTimeout(() => this.getSpaces(), Util_1.Util.getUserRefreshInterval());
    }
    async getUserTweets() {
        this.logger.debug('--> getUserTweets');
        const data = await Limiter_1.twitterApiLimiter.schedule(() => TwitterApi_1.TwitterApi.getUserTweets(this.user.id, this.headers));
        const instructions = data?.data?.user?.result?.timeline?.timeline?.instructions || [];
        const instruction = instructions.find((v) => v?.type === 'TimelineAddEntries');
        const tweets = instruction?.entries
            ?.filter((v) => v?.content?.entryType === 'TimelineTimelineItem')
            ?.map((v) => v?.content?.itemContent?.tweet_results?.result)
            ?.filter((v) => v?.card) || [];
        const spaceIds = [...new Set(tweets
                .map((tweet) => tweet?.card?.legacy?.binding_values?.find?.((v) => v?.key === 'id')?.value?.string_value)
                .filter((v) => v))];
        spaceIds.forEach((id) => this.getAudioSpaceById(id));
        this.cleanCacheSpaceIds(spaceIds);
        const meta = {};
        if (spaceIds.length) {
            Object.assign(meta, { spaceIds });
        }
        this.logger.debug('<-- getUserTweets', meta);
    }
    async getAudioSpaceById(id) {
        if (this.cacheSpaceIds.has(id)) {
            return;
        }
        try {
            this.logger.debug('--> getAudioSpaceById', { id });
            const data = await Limiter_1.twitterApiLimiter.schedule(() => TwitterApi_1.TwitterApi.getAudioSpaceById(id, this.headers));
            const { state } = data.data.audioSpace.metadata;
            this.logger.debug('<-- getAudioSpaceById', { id, state });
            this.cacheSpaceIds.add(id);
            if (state !== Twitter_enum_1.AudioSpaceMetadataState.RUNNING) {
                return;
            }
            this.emit('data', id);
        }
        catch (error) {
            this.logger.error(`getAudioSpaceById: ${error.message}`, { id });
        }
    }
    cleanCacheSpaceIds(keepIds) {
        Array.from(this.cacheSpaceIds).forEach((id) => {
            if (keepIds.includes(id)) {
                return;
            }
            this.cacheSpaceIds.delete(id);
        });
    }
}
exports.UserWatcher = UserWatcher;
//# sourceMappingURL=UserWatcher.js.map