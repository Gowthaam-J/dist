"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitterApi = void 0;
/* eslint-disable max-len */
const axios_1 = __importDefault(require("axios"));
const twitter_constant_1 = require("../constants/twitter.constant");
class TwitterApi {
    static async getGuestToken() {
        const { data } = await axios_1.default.request({
            method: 'POST',
            url: 'https://api.twitter.com/1.1/guest/activate.json',
            headers: { authorization: twitter_constant_1.TWITTER_PUBLIC_AUTHORIZATION },
        });
        return data.guest_token;
    }
    static async getUsersLookup(usernames, headers) {
        const { data } = await axios_1.default.get('https://api.twitter.com/1.1/users/lookup.json', {
            headers,
            params: { screen_name: usernames.join(',') },
        });
        return data;
    }
    /**
     * @see https://developer.twitter.com/en/docs/twitter-api/users/lookup/api-reference/get-users-by
     */
    static async getUsersByUsernames(usernames, headers) {
        const { data } = await axios_1.default.get('https://api.twitter.com/2/users/by', {
            headers,
            params: { usernames: usernames.join(',') },
        });
        return data;
    }
    /**
     * @see https://developer.twitter.com/en/docs/twitter-api/spaces/lookup/api-reference/get-spaces-by-creator-ids
     */
    static async getSpacesByCreatorIds(userIds, headers) {
        const { data } = await axios_1.default.get('https://api.twitter.com/2/spaces/by/creator_ids', {
            headers,
            params: { user_ids: userIds.join(',') },
        });
        return data;
    }
    static async getSpacesByFleetsAvatarContent(userIds, headers) {
        const { data } = await axios_1.default.get('https://twitter.com/i/api/fleets/v1/avatar_content', {
            headers,
            params: {
                user_ids: userIds.join(','),
                only_spaces: true,
            },
        });
        return data;
    }
    static async getUserByFollowButtonInfo(username) {
        const { data } = await axios_1.default.get('https://cdn.syndication.twimg.com/widgets/followbutton/info.json', {
            params: { screen_names: username },
        });
        return data?.[0];
    }
    static async getUserByScreenName(username, headers) {
        const { data } = await axios_1.default.get('https://twitter.com/i/api/graphql/7mjxD3-C6BxitPMVQ6w0-Q/UserByScreenName', {
            headers,
            params: {
                variables: {
                    screen_name: username,
                    withSafetyModeUserFields: false,
                    withSuperFollowsUserFields: false,
                },
            },
        });
        return data;
    }
    static async getUserTweets(userId, headers) {
        const { data } = await axios_1.default.get('https://twitter.com/i/api/graphql/QvCV3AU7X1ZXr9JSrH9EOA/UserTweets', {
            headers,
            params: {
                variables: {
                    userId,
                    count: 10,
                    withTweetQuoteCount: false,
                    includePromotedContent: false,
                    withQuickPromoteEligibilityTweetFields: false,
                    withSuperFollowsUserFields: false,
                    withBirdwatchPivots: false,
                    withDownvotePerspective: false,
                    withReactionsMetadata: false,
                    withReactionsPerspective: false,
                    withSuperFollowsTweetFields: false,
                    withVoice: false,
                    withV2Timeline: false,
                },
            },
        });
        return data;
    }
    static async getAudioSpaceById(spaceId, headers) {
        const url = 'https://api.twitter.com/graphql/xjTKygiBMpX44KU8ywLohQ/AudioSpaceById';
        const { data } = await axios_1.default.get(url, {
            headers,
            params: {
                variables: {
                    id: spaceId,
                    isMetatagsQuery: true,
                    withSuperFollowsUserFields: true,
                    withDownvotePerspective: false,
                    withReactionsMetadata: false,
                    withReactionsPerspective: false,
                    withSuperFollowsTweetFields: true,
                    withReplays: true,
                },
                features: {
                    spaces_2022_h2_clipping: true,
                    spaces_2022_h2_spaces_communities: true,
                    responsive_web_twitter_blue_verified_badge_is_enabled: true,
                    verified_phone_label_enabled: false,
                    view_counts_public_visibility_enabled: true,
                    longform_notetweets_consumption_enabled: false,
                    tweetypie_unmention_optimization_enabled: true,
                    responsive_web_uc_gql_enabled: true,
                    vibe_api_enabled: true,
                    responsive_web_edit_tweet_api_enabled: true,
                    graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
                    view_counts_everywhere_api_enabled: true,
                    standardized_nudges_misinfo: true,
                    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false,
                    responsive_web_graphql_timeline_navigation_enabled: true,
                    interactive_text_enabled: true,
                    responsive_web_text_conversations_enabled: false,
                    responsive_web_enhance_cards_enabled: false,
                },
            },
        });
        return data;
    }
    static async getSpaceMetadata(spaceId, headers) {
        const data = await this.getAudioSpaceById(spaceId, headers);
        const { metadata } = data.data.audioSpace;
        return metadata;
    }
    static async getLiveVideoStreamStatus(mediaKey, headers) {
        const url = `https://twitter.com/i/api/1.1/live_video_stream/status/${mediaKey}`;
        const { data } = await axios_1.default.get(url, { headers });
        return data;
    }
}
exports.TwitterApi = TwitterApi;
//# sourceMappingURL=TwitterApi.js.map