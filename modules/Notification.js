"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const crypto_1 = require("crypto");
const fs_1 = __importDefault(require("fs"));
const node_notifier_1 = __importDefault(require("node-notifier"));
const open_1 = __importDefault(require("open"));
const path_1 = __importDefault(require("path"));
const Downloader_1 = require("../Downloader");
const logger_1 = require("../logger");
const Util_1 = require("../utils/Util");
class Notification {
    constructor(notification, url) {
        this.notification = notification;
        this.url = url;
        this.logger = logger_1.logger.child({ label: '[Notification]' });
    }
    async notify() {
        this.logger.debug('notify', { notification: this.notification, url: this.url });
        try {
            await this.downloadIcon();
            node_notifier_1.default.notify(this.notification, (error, response) => {
                this.logger.debug('Notification callback', { response, error });
                // Tested on win32/macOS, response can be undefined, activate, timeout
                if (!error && (!response || response === 'activate')) {
                    (0, open_1.default)(this.url);
                }
            });
        }
        catch (error) {
            this.logger.debug(`notify: ${error.message}`);
        }
    }
    async downloadIcon() {
        const url = this.notification.icon;
        if (!url) {
            return;
        }
        const requestId = (0, crypto_1.randomUUID)();
        try {
            const imgPathname = url.replace('https://pbs.twimg.com/', '');
            Util_1.Util.createCacheDir(path_1.default.dirname(imgPathname));
            const imgPath = path_1.default.join(Util_1.Util.getCacheDir(), imgPathname);
            this.notification.icon = imgPath;
            if (fs_1.default.existsSync(imgPath)) {
                return;
            }
            this.logger.debug('--> downloadIcon', { requestId, url });
            await Downloader_1.Downloader.downloadImage(url, imgPath);
            this.logger.debug('<-- downloadIcon', { requestId });
        }
        catch (error) {
            this.logger.error(`downloadIcon: ${error.message}`, { requestId });
        }
    }
}
exports.Notification = Notification;
//# sourceMappingURL=Notification.js.map