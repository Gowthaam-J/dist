"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Downloader = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const stream_1 = __importDefault(require("stream"));
const util_1 = require("util");
class Downloader {
    static async downloadImage(url, filePath) {
        const response = await axios_1.default.get(url, { responseType: 'stream' });
        const writer = fs_1.default.createWriteStream(filePath);
        response.data.pipe(writer);
        await (0, util_1.promisify)(stream_1.default.finished)(writer);
    }
}
exports.Downloader = Downloader;
//# sourceMappingURL=Downloader.js.map