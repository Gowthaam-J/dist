"use strict";
/* eslint-disable class-methods-use-this */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitterBaseApi = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../../logger");
const twitter_constant_1 = require("../twitter.constant");
class TwitterBaseApi {
    constructor(api, path) {
        this.api = api;
        this.logger = logger_1.logger.child({ context: 'TwitterApi' });
        this.createClient(path);
    }
    async getGuestHeaders() {
        const headers = {
            authorization: twitter_constant_1.TWITTER_PUBLIC_AUTHORIZATION,
            'x-guest-token': await this.api.data.getGuestToken(),
        };
        return headers;
    }
    async getGuestV2Headers() {
        const headers = {
            authorization: twitter_constant_1.TWITTER_PUBLIC_AUTHORIZATION_2,
            'x-guest-token': await this.api.data.getGuestToken2(),
        };
        return headers;
    }
    getAuthHeaders() {
        const cookies = {
            auth_token: process.env.TWITTER_AUTH_TOKEN,
            ct0: process.env.TWITTER_CSRF_TOKEN,
        };
        const cookie = Object.keys(cookies)
            .filter((key) => cookies[key])
            .map((key) => `${key}=${cookies[key]}`)
            .join('; ');
        const headers = {
            authorization: twitter_constant_1.TWITTER_PUBLIC_AUTHORIZATION,
            cookie,
            'x-csrf-token': process.env.TWITTER_CSRF_TOKEN,
        };
        return headers;
    }
    createClient(path) {
        const baseUrl = [twitter_constant_1.TWITTER_API_URL, path].join('/');
        const client = axios_1.default.create({ baseURL: baseUrl });
        this.client = client;
        client.interceptors.request.use(async (config) => {
            this.logRequest(config);
            await this.handleRequest(config);
            return config;
        }, null);
        client.interceptors.response.use((response) => {
            this.logResponse(response);
            this.handleResponse(response);
            return response;
        }, (error) => {
            this.logResponse(error.response);
            this.handleResponse(error.response);
            return Promise.reject(error);
        });
    }
    logRequest(config) {
        const url = [config.baseURL, config.url]
            .join('/')
            .replace(twitter_constant_1.TWITTER_API_URL, '');
        this.logger.debug(['-->', url].join(' '));
    }
    logResponse(res) {
        if (!res?.config) {
            return;
        }
        const url = [res.config.baseURL, res.config.url]
            .join('/')
            .replace(twitter_constant_1.TWITTER_API_URL, '');
        const limit = Number(res.headers['x-rate-limit-limit']);
        if (!limit) {
            this.logger.debug(['<--', url].join(' '));
            return;
        }
        const remaining = Number(res.headers['x-rate-limit-remaining']);
        const reset = Number(res.headers['x-rate-limit-reset']);
        this.logger.debug(['<--', url, limit, remaining, new Date(reset * 1000).toISOString()].join(' '));
    }
    async handleRequest(config) {
        try {
            const guestToken = config.headers['x-guest-token'];
            if (guestToken) {
                const url = this.getRateLimitRequestUrl(config);
                const rateLimit = this.api.data.rateLimits[url];
                if (rateLimit && rateLimit.limit && rateLimit.remaining === 0) {
                    const newGuestToken = config.headers.authorization === twitter_constant_1.TWITTER_PUBLIC_AUTHORIZATION
                        ? await this.api.data.getGuestToken(true)
                        : await this.api.data.getGuestToken2(true);
                    // eslint-disable-next-line no-param-reassign
                    config.headers['x-guest-token'] = newGuestToken;
                }
            }
        }
        catch (error) {
            this.logger.error(`handleRequest: ${error.message}`);
        }
    }
    handleResponse(res) {
        const url = this.getRateLimitRequestUrl(res.config);
        const limit = Number(res.headers['x-rate-limit-limit']);
        const remaining = Number(res.headers['x-rate-limit-remaining']);
        const reset = Number(res.headers['x-rate-limit-reset']);
        if (limit) {
            const { rateLimits } = this.api.data;
            rateLimits[url] = rateLimits[url] || {};
            rateLimits[url].limit = limit;
            rateLimits[url].remaining = remaining;
            rateLimits[url].reset = reset * 1000;
        }
    }
    getRateLimitRequestUrl(config) {
        const url = config.baseURL?.includes?.('graphql')
            ? config.url.substring(config.url.indexOf('/') + 1)
            : config.url;
        return url;
    }
}
exports.TwitterBaseApi = TwitterBaseApi;
//# sourceMappingURL=twitter-base.api.js.map