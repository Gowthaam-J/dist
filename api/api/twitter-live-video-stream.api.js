"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitterLiveVideoStreamApi = void 0;
const twitter_base_api_1 = require("../base/twitter-base.api");
class TwitterLiveVideoStreamApi extends twitter_base_api_1.TwitterBaseApi {
    async status(mediaKey) {
        const url = `status/${mediaKey}`;
        const headers = this.getAuthHeaders();
        const res = await this.client.get(url, {
            headers,
        });
        return res;
    }
}
exports.TwitterLiveVideoStreamApi = TwitterLiveVideoStreamApi;
//# sourceMappingURL=twitter-live-video-stream.api.js.map