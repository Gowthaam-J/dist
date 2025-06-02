"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.TwitterApi = void 0;
const twitter_fleet_api_1 = require("./api/twitter-fleet.api");
const twitter_graphql_api_1 = require("./api/twitter-graphql.api");
const twitter_guest_api_1 = require("./api/twitter-guest.api");
const twitter_live_video_stream_api_1 = require("./api/twitter-live-video-stream.api");
const twitter_api_data_1 = require("./twitter.api.data");
class TwitterApi {
    constructor() {
        this.createData();
        this.createApis();
    }
    createData() {
        this.data = new twitter_api_data_1.TwitterApiData(this);
    }
    createApis() {
        this.graphql = new twitter_graphql_api_1.TwitterGraphqlApi(this, 'graphql');
        this.fleet = new twitter_fleet_api_1.TwitterFleetApi(this, 'fleets/v1');
        this.guest = new twitter_guest_api_1.TwitterGuestApi(this, '1.1/guest');
        this.liveVideoStream = new twitter_live_video_stream_api_1.TwitterLiveVideoStreamApi(this, '1.1/live_video_stream');
    }
}
exports.TwitterApi = TwitterApi;
exports.api = new TwitterApi();
//# sourceMappingURL=twitter.api.js.map