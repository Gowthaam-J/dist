"use strict";
/* eslint-disable camelcase */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitterFleetApi = void 0;
const twitter_base_api_1 = require("../base/twitter-base.api");
class TwitterFleetApi extends twitter_base_api_1.TwitterBaseApi {
    async avatar_content(userIds) {
        const url = 'avatar_content';
        const headers = this.getAuthHeaders();
        const res = await this.client.get(url, {
            headers,
            params: {
                only_spaces: true,
                user_ids: userIds.join(','),
            },
        });
        return res;
    }
    async fleetline() {
        const url = 'fleetline';
        const headers = this.getAuthHeaders();
        const res = await this.client.get(url, {
            headers,
            params: {
                only_spaces: true,
            },
        });
        return res;
    }
}
exports.TwitterFleetApi = TwitterFleetApi;
//# sourceMappingURL=twitter-fleet.api.js.map