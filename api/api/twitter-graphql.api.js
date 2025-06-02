"use strict";
/* eslint-disable camelcase */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitterGraphqlApi = void 0;
const twitter_base_api_1 = require("../base/twitter-base.api");
const twitter_graphql_endpoint_constant_1 = require("../constant/twitter-graphql-endpoint.constant");
const twitter_graphql_param_constant_1 = require("../constant/twitter-graphql-param.constant");
class TwitterGraphqlApi extends twitter_base_api_1.TwitterBaseApi {
    // #region User
    async UserByRestId(userId) {
        const url = this.toUrl(twitter_graphql_endpoint_constant_1.twitterGraphqlEndpoints.UserByRestId);
        const headers = await this.getGuestV2Headers();
        const params = this.cloneParams(twitter_graphql_param_constant_1.twitterGraphqlParams.UserByRestId, { variables: { userId } });
        const res = await this.client.get(url, { headers, params });
        return res;
    }
    async UserByScreenName(username) {
        const url = this.toUrl(twitter_graphql_endpoint_constant_1.twitterGraphqlEndpoints.UserByScreenName);
        const headers = await this.getGuestV2Headers();
        const params = this.cloneParams(twitter_graphql_param_constant_1.twitterGraphqlParams.UserByScreenName, { variables: { screen_name: username } });
        const res = await this.client.get(url, { headers, params });
        return res;
    }
    async UserTweets(userId, count = 20) {
        const url = this.toUrl(twitter_graphql_endpoint_constant_1.twitterGraphqlEndpoints.UserTweets);
        const headers = await this.getGuestV2Headers();
        const params = this.cloneParams(twitter_graphql_param_constant_1.twitterGraphqlParams.UserTweets, { variables: { userId, count } });
        const res = await this.client.get(url, { headers, params });
        return res;
    }
    async UserTweetsAndReplies(userId, count = 20) {
        const url = this.toUrl(twitter_graphql_endpoint_constant_1.twitterGraphqlEndpoints.UserTweetsAndReplies);
        const headers = await this.getGuestV2Headers();
        const params = this.cloneParams(twitter_graphql_param_constant_1.twitterGraphqlParams.UserTweetsAndReplies, { variables: { userId, count } });
        const res = await this.client.get(url, { headers, params });
        return res;
    }
    async UserMedia(userId, count = 20) {
        const url = this.toUrl(twitter_graphql_endpoint_constant_1.twitterGraphqlEndpoints.UserMedia);
        const headers = await this.getGuestV2Headers();
        const params = this.cloneParams(twitter_graphql_param_constant_1.twitterGraphqlParams.UserMedia, { variables: { userId, count } });
        const res = await this.client.get(url, { headers, params });
        return res;
    }
    async UserWithProfileTweetsQueryV2(userId) {
        const url = this.toUrl(twitter_graphql_endpoint_constant_1.twitterGraphqlEndpoints.UserWithProfileTweetsQueryV2);
        const headers = await this.getGuestV2Headers();
        const params = this.cloneParams(twitter_graphql_param_constant_1.twitterGraphqlParams.UserWithProfileTweetsQueryV2, { variables: { rest_id: userId } });
        const res = await this.client.get(url, { headers, params });
        return res;
    }
    async UserWithProfileTweetsAndRepliesQueryV2(userId) {
        const url = this.toUrl(twitter_graphql_endpoint_constant_1.twitterGraphqlEndpoints.UserWithProfileTweetsAndRepliesQueryV2);
        const headers = await this.getGuestV2Headers();
        const params = this.cloneParams(twitter_graphql_param_constant_1.twitterGraphqlParams.UserWithProfileTweetsAndRepliesQueryV2, { variables: { rest_id: userId } });
        const res = await this.client.get(url, { headers, params });
        return res;
    }
    // #endregion
    // #region Tweet
    async TweetDetail(tweetId) {
        const url = this.toUrl(twitter_graphql_endpoint_constant_1.twitterGraphqlEndpoints.TweetDetail);
        const headers = await this.getGuestV2Headers();
        const params = this.cloneParams(twitter_graphql_param_constant_1.twitterGraphqlParams.TweetDetail, { variables: { focalTweetId: tweetId } });
        const res = await this.client.get(url, { headers, params });
        return res;
    }
    // #endregion
    // #region Home
    async HomeLatestTimeline(count = 20) {
        const url = this.toUrl(twitter_graphql_endpoint_constant_1.twitterGraphqlEndpoints.HomeLatestTimeline);
        const headers = this.getAuthHeaders();
        const params = this.cloneParams(twitter_graphql_param_constant_1.twitterGraphqlParams.HomeLatestTimeline, { variables: { count } });
        const res = await this.client.get(url, { headers, params });
        return res;
    }
    // #endregion
    // #region AudioSpace
    async AudioSpaceById(id) {
        const url = this.toUrl(twitter_graphql_endpoint_constant_1.twitterGraphqlEndpoints.AudioSpaceById);
        const headers = this.getAuthHeaders();
        const params = this.cloneParams(twitter_graphql_param_constant_1.twitterGraphqlParams.AudioSpaceById, { variables: { id } });
        const res = await this.client.get(url, { headers, params });
        return res;
    }
    async AudioSpaceById_Legacy(id) {
        const url = this.toUrl(twitter_graphql_endpoint_constant_1.twitterGraphqlEndpoints.AudioSpaceById_Legacy);
        const headers = this.getAuthHeaders();
        const params = this.cloneParams(twitter_graphql_param_constant_1.twitterGraphqlParams.AudioSpaceById_Legacy, { variables: { id } });
        const res = await this.client.get(url, { headers, params });
        return res;
    }
    async AudioSpaceByRestId(id) {
        const url = this.toUrl(twitter_graphql_endpoint_constant_1.twitterGraphqlEndpoints.AudioSpaceByRestId);
        const headers = this.getAuthHeaders();
        const params = this.cloneParams(twitter_graphql_param_constant_1.twitterGraphqlParams.AudioSpaceByRestId, { variables: { audio_space_id: id } });
        const res = await this.client.get(url, { headers, params });
        return res;
    }
    // #endregion
    // #region Helper
    // eslint-disable-next-line class-methods-use-this
    toUrl(endpoint) {
        const url = [endpoint.queryId, endpoint.operationName].join('/');
        return url;
    }
    // eslint-disable-next-line class-methods-use-this
    cloneParams(src, value) {
        const obj = JSON.parse(JSON.stringify(src));
        if (value) {
            Object.keys(value).forEach((key) => {
                Object.assign(obj, { [key]: { ...obj[key], ...value[key] } });
            });
        }
        return obj;
    }
}
exports.TwitterGraphqlApi = TwitterGraphqlApi;
//# sourceMappingURL=twitter-graphql.api.js.map