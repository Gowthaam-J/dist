"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpaceCaptionsExtractor = void 0;
const fs_1 = __importDefault(require("fs"));
const readline_1 = __importDefault(require("readline"));
const Periscope_enum_1 = require("../enums/Periscope.enum");
const logger_1 = require("../logger");
const Util_1 = require("../utils/Util");
class SpaceCaptionsExtractor {
    constructor(inpFile, outFile, startedAt) {
        this.inpFile = inpFile;
        this.outFile = outFile;
        this.startedAt = startedAt;
        this.logger = logger_1.logger.child({ label: '[SpaceCaptionsExtractor]' });
        this.inpFile = inpFile;
        this.outFile = outFile === inpFile
            ? `${outFile}.txt`
            : (outFile || `${inpFile}.txt`);
    }
    async extract() {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            try {
                if (!fs_1.default.existsSync(this.inpFile)) {
                    this.logger.warn(`Input file not found at ${this.inpFile}`);
                    return;
                }
                fs_1.default.writeFileSync(this.outFile, '');
                await this.processFile();
                resolve(this.outFile);
            }
            catch (error) {
                this.logger.error(error.message);
                reject(error);
            }
        });
    }
    async processFile() {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve) => {
            this.logger.info(`Loading captions from ${this.inpFile}`);
            const fileStream = fs_1.default.createReadStream(this.inpFile);
            const rl = readline_1.default.createInterface({ input: fileStream });
            let lineCount = 0;
            rl.on('line', (line) => {
                lineCount += 1;
                try {
                    this.processLine(line);
                }
                catch (error) {
                    this.logger.error(`Failed to process line ${lineCount}: ${error.message}`);
                }
            });
            rl.once('close', () => {
                this.logger.info(`Captions saved to ${this.outFile}`);
                resolve();
            });
        });
    }
    processLine(payload) {
        const obj = JSON.parse(payload);
        if (obj.kind !== Periscope_enum_1.MessageKind.CHAT) {
            return;
        }
        this.processChat(obj.payload);
    }
    processChat(payload) {
        const obj = JSON.parse(payload);
        if (!obj.uuid) {
            return;
        }
        this.processChatData(obj.body);
    }
    processChatData(payload) {
        const obj = JSON.parse(payload);
        if (!obj.final || !obj.body) {
            return;
        }
        const time = this.startedAt
            ? `${Util_1.Util.getDisplayTime(Math.max(0, obj.timestamp - this.startedAt))} | `
            : '';
        const msg = `${time}${obj.username}: ${obj.body.trim()}\n`;
        fs_1.default.appendFileSync(this.outFile, msg);
    }
}
exports.SpaceCaptionsExtractor = SpaceCaptionsExtractor;
//# sourceMappingURL=SpaceCaptionsExtractor.js.map