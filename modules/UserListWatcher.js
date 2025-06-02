"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserListWatcher = void 0;
const events_1 = __importDefault(require("events"));
const Limiter_1 = require("../Limiter");
const TwitterApi_1 = require("../apis/TwitterApi");
const twitter_constant_1 = require("../constants/twitter.constant");
const Twitter_enum_1 = require("../enums/Twitter.enum");
const logger_1 = require("../logger");
const Util_1 = require("../utils/Util");
const UserManager_1 = require("./UserManager");
class UserListWatcher extends events_1.default {
    constructor() {
        super();
        this.logger = logger_1.logger.child({ label: '[UserListWatcher]' });
    }
    watch() {
        this.logger.info('Watching...');
        this.getUserSpaces();
    }
    async getUserSpaces() {
        const users = UserManager_1.userManager.getUsersWithId();
        if (users.length) {
            this.logger.debug('getUserSpaces', { userCount: users.length });
            const userChunks = Util_1.Util.splitArrayIntoChunk(users, twitter_constant_1.TWITTER_API_LIST_SIZE);
            await Promise.allSettled(userChunks.map((userChunk) => Limiter_1.twitterSpaceApiLimiter.schedule(() => this.getSpaces(userChunk))));
        }
        setTimeout(() => this.getUserSpaces(), Util_1.Util.getUserRefreshInterval());
    }
    async getSpaces(users) {
        const usernames = users.map((v) => v.username);
        const userIds = users.map((v) => v.id);
        this.logger.debug('--> getSpaces', { userCount: usernames.length, usernames });
        try {
            const liveSpaceIds = [];
            if (Util_1.Util.getTwitterAuthorization()) {
                const { data: spaces } = await TwitterApi_1.TwitterApi.getSpacesByCreatorIds(userIds, { authorization: Util_1.Util.getTwitterAuthorization() });
                this.logger.debug('<-- getSpaces');
                liveSpaceIds.push(...(spaces || [])
                    .filter((v) => v.state === Twitter_enum_1.SpaceState.LIVE)
                    .map((v) => v.id));
            }
            else if (Util_1.Util.getTwitterAuthToken()) {
                const data = await TwitterApi_1.TwitterApi.getSpacesByFleetsAvatarContent(userIds, {
                    authorization: twitter_constant_1.TWITTER_PUBLIC_AUTHORIZATION,
                    cookie: [`auth_token=${Util_1.Util.getTwitterAuthToken()}`].join(';'),
                });
                this.logger.debug('<-- getSpaces');
                liveSpaceIds.push(...Object.values(data.users)
                    .map((v) => v.spaces?.live_content?.audiospace?.broadcast_id)
                    .filter((v) => v));
            }
            if (liveSpaceIds.length) {
                this.logger.debug(`Live space ids: ${liveSpaceIds.join(',')}`);
                liveSpaceIds.forEach((id) => this.emit('data', id));
            }
        }
        catch (error) {
            this.logger.error(`getSpaces: ${error.message}`, {
                response: {
                    data: error.response?.data,
                    // headers: error.response?.headers,
                },
            });
        }
    }
}
exports.UserListWatcher = UserListWatcher;
//# sourceMappingURL=UserListWatcher.js.map