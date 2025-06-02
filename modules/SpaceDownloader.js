"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpaceDownloader = void 0;
const axios_1 = __importDefault(require("axios"));
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const PeriscopeApi_1 = require("../apis/PeriscopeApi");
const logger_1 = require("../logger");
const PeriscopeUtil_1 = require("../utils/PeriscopeUtil");
const Util_1 = require("../utils/Util");
const ConfigManager_1 = require("./ConfigManager");
class SpaceDownloader {
    constructor(originUrl, filename, subDir = '', metadata) {
        this.originUrl = originUrl;
        this.filename = filename;
        this.subDir = subDir;
        this.metadata = metadata;
        this.logger = logger_1.logger.child({ label: '[SpaceDownloader]' });
        this.logger.debug('constructor', {
            originUrl, filename, subDir, metadata,
        });
        this.playlistFile = path_1.default.join(Util_1.Util.getMediaDir(subDir), `${filename}.m3u8`);
        this.audioFile = path_1.default.join(Util_1.Util.getMediaDir(subDir), `${filename}.m4a`);
        this.logger.verbose(`Playlist path: "${this.playlistFile}"`);
        this.logger.verbose(`Audio path: "${this.audioFile}"`);
    }
    async download() {
        this.logger.debug('download', { playlistUrl: this.playlistUrl, originUrl: this.originUrl });
        if (!this.playlistUrl) {
            this.playlistUrl = await PeriscopeApi_1.PeriscopeApi.getFinalPlaylistUrl(this.originUrl);
            this.logger.info(`Final playlist url: ${this.playlistUrl}`);
        }
        Util_1.Util.createMediaDir(this.subDir);
        await this.saveFinalPlaylist();
        this.spawnFfmpeg();
    }
    async saveFinalPlaylist() {
        try {
            this.logger.debug(`--> saveFinalPlaylist: ${this.playlistUrl}`);
            const { data } = await axios_1.default.get(this.playlistUrl);
            this.logger.debug(`<-- saveFinalPlaylist: ${this.playlistUrl}`);
            const prefix = PeriscopeUtil_1.PeriscopeUtil.getChunkPrefix(this.playlistUrl);
            this.logger.debug(`Chunk prefix: ${prefix}`);
            const newData = data.replace(/^chunk/gm, `${prefix}chunk`);
            (0, fs_1.writeFileSync)(this.playlistFile, newData);
            this.logger.verbose(`Playlist saved to "${this.playlistFile}"`);
        }
        catch (error) {
            this.logger.debug(`saveFinalPlaylist: ${error.message}`);
            const status = error.response?.status;
            if (status === 404 && this.originUrl !== this.playlistUrl) {
                this.playlistUrl = null;
            }
            throw error;
        }
    }
    spawnFfmpeg() {
        const cmd = 'ffmpeg';
        const args = [
            '-protocol_whitelist',
            'file,https,tls,tcp',
            '-i',
            // this.playlistFile,
            this.playlistUrl,
            '-c',
            'copy',
        ];
        if (this.metadata) {
            this.logger.debug('Audio metadata', this.metadata);
            Object.keys(this.metadata).forEach((key) => {
                const value = this.metadata[key];
                if (!value) {
                    return;
                }
                args.push('-metadata', `${key}=${value}`);
            });
        }
        const { config } = ConfigManager_1.configManager;
        if (config?.ffmpegArgs?.length) {
            args.push(...config.ffmpegArgs);
        }
        args.push(this.audioFile);
        this.logger.verbose(`Audio is saving to "${this.audioFile}"`);
        this.logger.verbose(`${cmd} ${args.join(' ')}`);
        // https://github.com/nodejs/node/issues/21825
        const spawnOptions = {
            cwd: process.cwd(),
            stdio: 'ignore',
            detached: false,
            windowsHide: true,
        };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const cp = process.platform === 'win32'
            ? (0, child_process_1.spawn)(process.env.comspec, ['/c', cmd, ...args], spawnOptions)
            : (0, child_process_1.spawn)(cmd, args, spawnOptions);
        // cp.unref()
        return cp;
    }
}
exports.SpaceDownloader = SpaceDownloader;
//# sourceMappingURL=SpaceDownloader.js.map