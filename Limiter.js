"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.discordWebhookLimiter = exports.twitterSpaceApiLimiter = exports.twitterApiLimiter = exports.twitterGuestTokenLimiter = void 0;
const bottleneck_1 = __importDefault(require("bottleneck"));
exports.twitterGuestTokenLimiter = new bottleneck_1.default({ maxConcurrent: 1 });
exports.twitterApiLimiter = new bottleneck_1.default({ maxConcurrent: 2 });
exports.twitterSpaceApiLimiter = new bottleneck_1.default({
    maxConcurrent: 1,
    minTime: 1100,
});
exports.discordWebhookLimiter = new bottleneck_1.default({
    reservoir: 5,
    reservoirRefreshAmount: 5,
    reservoirRefreshInterval: 2 * 1000,
});
//# sourceMappingURL=Limiter.js.map