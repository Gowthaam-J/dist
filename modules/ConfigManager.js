"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configManager = void 0;
const commander_1 = require("commander");
const fs_1 = require("fs");
const js_yaml_1 = __importDefault(require("js-yaml"));
const TwitterApi_1 = require("../apis/TwitterApi");
const twitter_constant_1 = require("../constants/twitter.constant");
const Limiter_1 = require("../Limiter");
const logger_1 = require("../logger");
const boolean_util_1 = require("../utils/boolean.util");
class ConfigManager {
    constructor() {
        this.logger = logger_1.logger.child({ label: '[ConfigManager]' });
        this.config = {};
    }
    get skipDownload() {
        const env = process.env.SKIP_DOWNLOAD;
        return (env && boolean_util_1.BooleanUtil.fromString(env))
            ?? Boolean(this.config.skipDownload);
    }
    get skipDownloadAudio() {
        const env = process.env.SKIP_DOWNLOAD_AUDIO;
        return (env && boolean_util_1.BooleanUtil.fromString(env))
            ?? Boolean(this.config.skipDownloadAudio);
    }
    get skipDownloadCaption() {
        const env = process.env.SKIP_DOWNLOAD_CAPTION;
        return (env && boolean_util_1.BooleanUtil.fromString(env))
            ?? Boolean(this.config.skipDownloadCaption);
    }
    update(config) {
        Object.assign(this.config, config);
    }
    load() {
        const configPath = commander_1.program.getOptionValue('config');
        if (!configPath) {
            return this.config;
        }
        try {
            const payload = (0, fs_1.readFileSync)(configPath, 'utf-8');
            if (configPath.endsWith('yaml')) {
                this.update(js_yaml_1.default.load(payload));
            }
            else {
                this.update(JSON.parse(payload));
            }
        }
        catch (error) {
            this.logger.warn(`load: ${error.message}`);
        }
        return this.config;
    }
    async getGuestToken(forceRefresh = false) {
        const token = await Limiter_1.twitterGuestTokenLimiter.schedule(async () => {
            const tokenDeltaTime = Date.now() - (this.guestTokenTime || 0);
            if (forceRefresh || !(this.guestToken && tokenDeltaTime < twitter_constant_1.TWITTER_GUEST_TOKEN_DURATION)) {
                this.logger.debug('--> getGuestToken');
                this.guestToken = await TwitterApi_1.TwitterApi.getGuestToken();
                this.guestTokenTime = Date.now();
                this.logger.debug('<-- getGuestToken', { guestToken: this.guestToken });
            }
            return Promise.resolve(this.guestToken);
        });
        return token;
    }
}
exports.configManager = new ConfigManager();
//# sourceMappingURL=ConfigManager.js.map