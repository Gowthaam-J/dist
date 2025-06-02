"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitterGuestApi = void 0;
const twitter_base_api_1 = require("../base/twitter-base.api");
class TwitterGuestApi extends twitter_base_api_1.TwitterBaseApi {
    async activate(authorization) {
        const url = 'activate.json';
        const headers = { authorization };
        const res = await this.client.request({
            method: 'POST',
            url,
            headers,
        });
        return res;
    }
}
exports.TwitterGuestApi = TwitterGuestApi;
//# sourceMappingURL=twitter-guest.api.js.map