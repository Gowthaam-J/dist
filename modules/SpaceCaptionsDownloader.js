"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpaceCaptionsDownloader = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const PeriscopeApi_1 = require("../apis/PeriscopeApi");
const logger_1 = require("../logger");
class SpaceCaptionsDownloader {
    constructor(spaceId, endpoint, accessToken, file) {
        this.spaceId = spaceId;
        this.endpoint = endpoint;
        this.accessToken = accessToken;
        this.file = file;
        this.chunkCount = 1;
        this.cursor = '';
        this.msgCountAll = 0;
        this.logger = logger_1.logger.child({ label: `[SpaceCaptionsDownloader@${spaceId}]` });
        this.file = this.file || `${new Date().toISOString().replace(/[^\d]/g, '').substring(2, 14)} (${spaceId}) CC.jsonl`;
    }
    async download() {
        this.logger.info(`Downloading chat to "${this.file}"`);
        fs_1.default.mkdirSync(path_1.default.dirname(this.file), { recursive: true });
        fs_1.default.writeFileSync(this.file, '');
        do {
            try {
                // eslint-disable-next-line no-await-in-loop
                const { messages, cursor } = await this.getChatHistory();
                messages?.forEach?.((message) => {
                    fs_1.default.appendFileSync(this.file, `${JSON.stringify(message)}\n`);
                });
                this.chunkCount += 1;
                this.cursor = cursor;
            }
            catch (error) {
                const msg = error.message;
                const status = error.response?.status;
                if (status === 503) {
                    break;
                }
                if (!['socket hang up', 'connect ETIMEDOUT'].some((v) => msg.includes(v))) {
                    break;
                }
            }
        } while (this.cursor || this.chunkCount <= 1);
        this.logger.info(`Chat downloaded to "${this.file}"`);
    }
    async getChatHistory() {
        this.logger.debug('--> getChatHistory', { chunkCount: this.chunkCount, cursor: this.cursor });
        try {
            const history = await PeriscopeApi_1.PeriscopeApi.getChatHistory(this.endpoint, this.spaceId, this.accessToken, this.cursor);
            const { messages } = history;
            const msgCount = messages?.length || 0;
            this.msgCountAll += msgCount;
            this.logger.debug('<-- getChatHistory', { msgCount, msgCountAll: this.msgCountAll });
            return history;
        }
        catch (error) {
            this.logger.error(`getChatHistory: ${error.message}`, { cursor: this.cursor });
            throw error;
        }
    }
}
exports.SpaceCaptionsDownloader = SpaceCaptionsDownloader;
//# sourceMappingURL=SpaceCaptionsDownloader.js.map