"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeriscopeApi = void 0;
const axios_1 = __importDefault(require("axios"));
const PeriscopeUtil_1 = require("../utils/PeriscopeUtil");
class PeriscopeApi {
    static async getMasterPlaylist(originUrl) {
        const url = PeriscopeUtil_1.PeriscopeUtil.getMasterPlaylistUrl(originUrl);
        const { data } = await axios_1.default.get(url);
        return data;
    }
    static async getFinalPlaylistUrl(originUrl) {
        if (PeriscopeUtil_1.PeriscopeUtil.isFinalPlaylistUrl(originUrl)) {
            return originUrl;
        }
        const data = await this.getMasterPlaylist(originUrl);
        const url = PeriscopeUtil_1.PeriscopeUtil.getMasterPlaylistUrl(originUrl)
            .replace('master_playlist', PeriscopeUtil_1.PeriscopeUtil.getFinalPlaylistName(data));
        return url;
    }
    static async getFinalPlaylist(originUrl) {
        const { data } = await axios_1.default.get(await this.getFinalPlaylistUrl(originUrl));
        return data;
    }
    static async getAccessChat(chatToken) {
        const { data } = await axios_1.default.post('https://proxsee.pscp.tv/api/v2/accessChatPublic', { chat_token: chatToken });
        return data;
    }
    static async getChatHistory(endpoint, roomId, accessToken, cursor) {
        const url = new URL('chatapi/v1/history', endpoint).href;
        const { data } = await axios_1.default.post(url, { room: roomId, access_token: accessToken, cursor });
        return data;
    }
}
exports.PeriscopeApi = PeriscopeApi;
//# sourceMappingURL=PeriscopeApi.js.map