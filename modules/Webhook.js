"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Webhook = void 0;
const builders_1 = require("@discordjs/builders");
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
const Limiter_1 = require("../Limiter");
const Twitter_enum_1 = require("../enums/Twitter.enum");
const logger_1 = require("../logger");
const SpaceUtil_1 = require("../utils/SpaceUtil");
const TwitterUtil_1 = require("../utils/TwitterUtil");
const twitter_space_util_1 = require("../utils/twitter-space.util");
const ConfigManager_1 = require("./ConfigManager");
class Webhook {
    constructor(space, audioSpace, s3Url) {
        this.space = space;
        this.audioSpace = audioSpace;
        this.logger = logger_1.logger.child({ label: `[Webhook] [${space?.creator?.username}] [${space.id}]` });
        this.s3Url = s3Url;
    }
    // eslint-disable-next-line class-methods-use-this
    get config() {
        return ConfigManager_1.configManager.config?.webhooks;
    }
    send() {
        this.sendDiscord();
    }
    async post(url, body) {
        const requestId = (0, crypto_1.randomUUID)();
        try {
            this.logger.debug('--> post', {
                requestId,
                url: url.replace(/.{60}$/, '****'),
                body,
            });
            const { data } = await axios_1.default.post(url, body);
            this.logger.debug('<-- post', { requestId });
            return data;
        }
        catch (error) {
            this.logger.error(`post: ${error.message}`, { requestId });
        }
        return null;
    }
    sendDiscord() {
        this.logger.debug('sendDiscord');
        const configs = Array.from(this.config?.discord || []);
        configs.forEach((config) => {
            if (!config.active) {
                return;
            }
            const urls = Array.from(config.urls || [])
                .filter((v) => v);
            const usernames = Array.from(config.usernames || [])
                .filter((v) => v)
                .map((v) => v.toLowerCase());
            if (!urls.length || !usernames.length) {
                return;
            }
            if (!usernames.find((v) => v === '<all>') && usernames.every((v) => !SpaceUtil_1.SpaceUtil.isParticipant(this.audioSpace, v))) {
                return;
            }
            try {
                // Build content with mentions
                let content = '';
                if (this.space.state === Twitter_enum_1.SpaceState.LIVE) {
                    Array.from(config.mentions?.roleIds || []).map((v) => v).forEach((roleId) => {
                        content += `<@&${roleId}> `;
                    });
                    Array.from(config.mentions?.userIds || []).map((v) => v).forEach((userId) => {
                        content += `<@${userId}> `;
                    });
                    content = [content, config.startMessage].filter((v) => v).map((v) => v.trim()).join(' ');
                }
                if (this.space.state === Twitter_enum_1.SpaceState.ENDED) {
                    content = [content, config.endMessage].filter((v) => v).map((v) => v.trim()).join(' ');
                }
                // Append S3 URL if available
                if (this.s3Url) {
                    content = `${content}\n\n[Space Download Link](${this.s3Url})`;
                }
                content = content.trim();
                // Build request payload
                const payload = {
                    content,
                    embeds: [this.getEmbed(usernames)],
                };
                // Send
                urls.forEach((url) => Limiter_1.discordWebhookLimiter.schedule(() => this.post(url, payload)));
            }
            catch (error) {
                this.logger.error(`sendDiscord: ${error.message}`);
            }
        });
    }
    getEmbedTitle(usernames) {
        const creator = this.space?.creator?.username;
        const creatorCode = (0, builders_1.inlineCode)(creator);
        if (this.space.state === Twitter_enum_1.SpaceState.CANCELED) {
            return `${creatorCode} Space canceled`;
        }
        if (this.space.state === Twitter_enum_1.SpaceState.ENDED) {
            return `${creatorCode} Space ended`;
        }
        if (!usernames.some((v) => v.toLowerCase() === creator.toLowerCase())
            && usernames.some((v) => SpaceUtil_1.SpaceUtil.isAdmin(this.audioSpace, v))) {
            const participants = usernames
                .map((v) => SpaceUtil_1.SpaceUtil.getParticipant(this.audioSpace.participants.admins, v))
                .filter((v) => v);
            if (participants.length) {
                const guests = participants
                    .map((v) => (0, builders_1.inlineCode)(v.user_results.result.legacy.screen_name || v.twitter_screen_name))
                    .join(', ');
                return `${guests} is co-hosting ${creatorCode}'s Space`;
            }
        }
        if (usernames.some((v) => SpaceUtil_1.SpaceUtil.isSpeaker(this.audioSpace, v))) {
            const participants = usernames
                .map((v) => SpaceUtil_1.SpaceUtil.getParticipant(this.audioSpace.participants.speakers, v))
                .filter((v) => v);
            if (participants.length) {
                const guests = participants
                    .map((v) => (0, builders_1.inlineCode)(v.user_results.result.legacy.screen_name || v.twitter_screen_name))
                    .join(', ');
                return `${guests} is speaking in ${creatorCode}'s Space`;
            }
        }
        if (usernames.some((v) => SpaceUtil_1.SpaceUtil.isListener(this.audioSpace, v))) {
            const participants = usernames
                .map((v) => SpaceUtil_1.SpaceUtil.getParticipant(this.audioSpace.participants.listeners, v))
                .filter((v) => v);
            if (participants.length) {
                const guests = participants
                    .map((v) => (0, builders_1.inlineCode)(v.user_results.result.legacy.screen_name || v.twitter_screen_name))
                    .join(', ');
                return `${guests} is listening in ${creatorCode}'s Space`;
            }
        }
        return `${creatorCode} is hosting a Space`;
    }
    getEmbed(usernames) {
        const { username, name } = this.space.creator;
        const fields = twitter_space_util_1.TwitterSpaceUtil.getEmbedFields(this.space);
        const embed = {
            type: 'rich',
            title: this.getEmbedTitle(usernames),
            description: twitter_space_util_1.TwitterSpaceUtil.getEmbedDescription(this.space),
            color: 0x1d9bf0,
            author: {
                name: `${name} (@${username})`,
                url: TwitterUtil_1.TwitterUtil.getUserUrl(username),
            },
            fields,
            footer: {
                text: 'Twitter',
                icon_url: 'https://abs.twimg.com/favicons/twitter.2.ico',
            },
        };
        if (this.space?.creator?.profileImageUrl) {
            embed.author.icon_url = this.space.creator.profileImageUrl;
        }
        return embed;
    }
}
exports.Webhook = Webhook;
//# sourceMappingURL=Webhook.js.map