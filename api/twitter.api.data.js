"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitterApiData = void 0;
const bottleneck_1 = __importDefault(require("bottleneck"));
const twitter_constant_1 = require("./twitter.constant");
class TwitterApiData {
    constructor(api) {
        this.api = api;
        this.rateLimits = {};
        this.guestTokenLimiter = new bottleneck_1.default({ maxConcurrent: 1 });
    }
    async getGuestToken(forceRefresh = false) {
        const token = await this.guestTokenLimiter.schedule(async () => {
            const tokenAliveDuration = Date.now() - (this.guestTokenCreatedAt || 0);
            const canRefresh = forceRefresh
                || !this.guestToken
                || tokenAliveDuration >= twitter_constant_1.TWITTER_GUEST_TOKEN_DURATION;
            if (canRefresh) {
                const { data } = await this.api.guest.activate(twitter_constant_1.TWITTER_PUBLIC_AUTHORIZATION);
                this.guestToken = data.guest_token;
                this.guestTokenCreatedAt = Date.now();
            }
            return this.guestToken;
        });
        return token;
    }
    async getGuestToken2(forceRefresh = false) {
        const token = await this.guestTokenLimiter.schedule(async () => {
            const tokenAliveDuration = Date.now() - (this.guestTokenCreatedAt2 || 0);
            const canRefresh = forceRefresh
                || !this.guestToken2
                || tokenAliveDuration >= twitter_constant_1.TWITTER_GUEST_TOKEN_DURATION;
            if (canRefresh) {
                const { data } = await this.api.guest.activate(twitter_constant_1.TWITTER_PUBLIC_AUTHORIZATION_2);
                this.guestToken2 = data.guest_token;
                this.guestTokenCreatedAt2 = Date.now();
            }
            return this.guestToken2;
        });
        return token;
    }
}
exports.TwitterApiData = TwitterApiData;
//# sourceMappingURL=twitter.api.data.js.map