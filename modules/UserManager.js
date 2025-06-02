"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userManager = void 0;
const bottleneck_1 = __importDefault(require("bottleneck"));
const stream_1 = require("stream");
const Limiter_1 = require("../Limiter");
const twitter_api_1 = require("../api/twitter.api");
const TwitterApi_1 = require("../apis/TwitterApi");
const twitter_constant_1 = require("../constants/twitter.constant");
const logger_1 = require("../logger");
const Util_1 = require("../utils/Util");
const array_util_1 = require("../utils/array.util");
class UserManager extends stream_1.EventEmitter {
    constructor() {
        super();
        this.users = [];
        this.logger = logger_1.logger.child({ label: '[UserManager]' });
    }
    getUsers() {
        return this.users;
    }
    getUserById(id) {
        return this.users.find((v) => v.id === id);
    }
    getUserByUsername(username) {
        return this.users.find((v) => v.username.toLowerCase() === username.toLowerCase());
    }
    getUsersWithId() {
        return this.users.filter((v) => v.id);
    }
    getUsersWithoutId() {
        return this.users.filter((v) => !v.id);
    }
    async add(usernames) {
        this.logger.debug('add', { usernames });
        usernames.forEach((username) => {
            if (this.getUserByUsername(username)) {
                return;
            }
            this.users.push({ id: null, username });
        });
        await this.fetchUsers();
    }
    updateUser(user) {
        if (!user) {
            return;
        }
        const tmpUser = this.getUserByUsername(user.username);
        if (!tmpUser) {
            return;
        }
        Object.assign(tmpUser, user);
    }
    async fetchUsers() {
        try {
            if (Util_1.Util.getTwitterAuthorization()) {
                await this.fetchUsersByLookup();
            }
            else {
                await this.fetchUsersByScreenName();
            }
        }
        catch (error) {
            this.logger.error(`fetchUsers: ${error.message}`);
        }
        const users = this.getUsersWithoutId();
        if (users.length) {
            this.logger.warn(`fetchUsers: Found some users without id. Retry in ${twitter_constant_1.TWITTER_USER_FETCH_INTERVAL}ms`, { count: users.length, usernames: users.map((v) => v.username) });
            setTimeout(() => this.fetchUsers(), twitter_constant_1.TWITTER_USER_FETCH_INTERVAL);
        }
    }
    async fetchUsersByLookup() {
        this.logger.debug('--> fetchUsersByLookup');
        const chunks = Util_1.Util.splitArrayIntoChunk(this.getUsersWithoutId().map((v) => v.username), twitter_constant_1.TWITTER_API_LIST_SIZE);
        const responses = await Promise.allSettled(chunks.map((usernames, i) => Limiter_1.twitterApiLimiter.schedule(async () => {
            try {
                this.logger.debug(`--> getUsersByUsernames ${i + 1}`, { usernames });
                const { data: users } = await TwitterApi_1.TwitterApi.getUsersByUsernames(usernames, { authorization: Util_1.Util.getTwitterAuthorization() });
                this.logger.debug(`<-- getUsersByUsernames ${i + 1}`);
                return Promise.resolve(users);
            }
            catch (error) {
                this.logger.error(`getUsersByUsernames: ${error.message}`, { usernames, response: { data: error.response?.data } });
                throw error;
            }
        })));
        responses.forEach((response) => {
            if (response.status !== 'fulfilled' || !response.value) {
                return;
            }
            response.value.forEach((v) => {
                this.updateUser({
                    id: v.id,
                    username: v.username,
                });
            });
        });
        this.logger.debug('<-- fetchUsersByLookup');
    }
    async fetchUsersByScreenName() {
        this.logger.debug('--> fetchUsersByScreenName');
        const chunkLimiter = new bottleneck_1.default({ maxConcurrent: 1 });
        const userLimiter = new bottleneck_1.default({ maxConcurrent: 5 });
        const users = this.getUsersWithoutId();
        const size = 50;
        const chunks = array_util_1.ArrayUtil.splitIntoChunk(users, size);
        await Promise.allSettled(chunks.map((chunk, chunkIndex) => chunkLimiter.schedule(async () => {
            await twitter_api_1.api.data.getGuestToken(true);
            await Promise.allSettled(chunk.map((curUser, userIndex) => userLimiter.schedule(async () => {
                const { username } = curUser;
                this.logger.debug(`--> getUserByScreenName ${chunkIndex * size + userIndex + 1}`, { username });
                const user = await this.getUserByScreenName(username);
                this.logger.debug(`<-- getUserByScreenName ${chunkIndex * size + userIndex + 1}`, { username });
                this.updateUser(user);
                return user;
            })));
        })));
        this.logger.debug('<-- fetchUsersByScreenName');
    }
    async getUserByScreenName(username) {
        try {
            const { data } = await twitter_api_1.api.graphql.UserByScreenName(username);
            this.logger.debug('getUserByScreenName#data', { username, data });
            const result = data?.data?.user?.result;
            if (!result || !result.legacy) {
                return null;
            }
            const user = {
                id: result.rest_id,
                username: result.legacy.screen_name,
            };
            return user;
        }
        catch (error) {
            this.logger.error(`getUserByScreenName: ${error.message}`, { username });
        }
        return null;
    }
}
exports.userManager = new UserManager();
//# sourceMappingURL=UserManager.js.map