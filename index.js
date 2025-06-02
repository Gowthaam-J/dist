#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const commander_1 = require("commander");
const dotenv_1 = __importDefault(require("dotenv"));
require("dotenv/config");
const cc_command_1 = require("./commands/cc.command");
const test_command_1 = require("./commands/test.command");
const logger_1 = require("./logger");
const ConfigManager_1 = require("./modules/ConfigManager");
const MainManager_1 = require("./modules/MainManager");
const SpaceDownloader_1 = require("./modules/SpaceDownloader");
const UserManager_1 = require("./modules/UserManager");
const CommandUtil_1 = require("./utils/CommandUtil");
const TwitterUtil_1 = require("./utils/TwitterUtil");
const Util_1 = require("./utils/Util");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../package.json');
const checkVersion = async () => {
    const url = 'https://registry.npmjs.org/-/package/twspace-crawler/dist-tags';
    try {
        const { data } = await axios_1.default.get(url);
        const latestVersion = data.latest;
        if (latestVersion === pkg.version) {
            return;
        }
        logger_1.logger.info(`New version: ${latestVersion}`);
        logger_1.logger.info(`To update, run: npm i -g ${pkg.name}@latest`);
    }
    catch (error) {
        // Ignore
    }
};
commander_1.program
    .version(pkg.version)
    .description('CLI app to monitor & download Twitter Spaces.')
    .option('-d, --debug', 'Show debug logs')
    .option('--env <ENV_PATH>', 'Path to .env file, default to current working folder (See .env.example)')
    .option('--config <CONFIG_PATH>', 'Path to config file (See config.example.json)')
    .option('--user <USER>', 'Monitor & download live Spaces from users, separate by comma (,)')
    .option('--id <SPACE_ID>', 'Monitor & download live Space with its id')
    .option('-surl, --space-url <SPACE_URL>', 'Monitor & download live Space with its URL')
    .option('--force', 'Force download Space when using with --id')
    .option('--url <PLAYLIST_ID>', 'Download Space using playlist url')
    .option('--skip-download', 'Do not download anything')
    .option('--skip-download-audio', 'Do not download audio')
    .option('--skip-download-caption', 'Do not download caption')
    .option('--notification', 'Show notification about new live Space')
    .option('--force-open', 'Force open Space in browser')
    .addCommand(cc_command_1.ccCommand)
    .addCommand(test_command_1.testCommand);
commander_1.program.action(async (args, cmd) => {
    logger_1.logger.info(Array(80).fill('=').join(''));
    logger_1.logger.info(`Version: ${pkg.version}`);
    CommandUtil_1.CommandUtil.detectDebugOption(cmd);
    await checkVersion();
    logger_1.logger.debug('Args', args);
    if (args.env) {
        dotenv_1.default.config({ path: args.env });
    }
    const envKeys = ['TWITTER_AUTHORIZATION', 'TWITTER_AUTH_TOKEN'];
    envKeys.forEach((key) => {
        const limit = 16;
        let value = (process.env[key] || '').substring(0, limit);
        if (value) {
            value += '****';
        }
        logger_1.logger.debug(`env.${key}=${value}`);
    });
    // config
    ConfigManager_1.configManager.load();
    ConfigManager_1.configManager.update({
        skipDownload: args.skipDownload ?? ConfigManager_1.configManager.config.skipDownload,
        skipDownloadAudio: args.skipDownloadAudio ?? ConfigManager_1.configManager.config.skipDownloadAudio,
        skipDownloadCaption: args.skipDownloadCaption ?? ConfigManager_1.configManager.config.skipDownloadCaption,
    });
    const { url, id, spaceUrl, user, } = args;
    if (url && !id && !spaceUrl) {
        logger_1.logger.info('Starting in playlist url mode', { url });
        new SpaceDownloader_1.SpaceDownloader(url, Util_1.Util.getDateTimeString()).download();
        return;
    }
    if (id) {
        logger_1.logger.info('Starting in space id mode', { id });
        MainManager_1.mainManager.addSpaceWatcher(id);
        return;
    }
    if (spaceUrl) {
        logger_1.logger.info('Starting in space url mode', { spaceUrl });
        const spaceId = TwitterUtil_1.TwitterUtil.getSpaceId(spaceUrl);
        if (!spaceId) {
            logger_1.logger.error(`Space URL invalid: ${spaceUrl}`);
            return;
        }
        MainManager_1.mainManager.addSpaceWatcher(spaceId);
        return;
    }
    const usernames = [...new Set((user || '')
            .split(',')
            .concat((ConfigManager_1.configManager.config.users || []).map((v) => (typeof v === 'string' ? v : v?.username)))
            .filter((v) => v))];
    if (usernames.length) {
        logger_1.logger.info('Starting in user mode', { userCount: usernames.length, users: usernames });
        await UserManager_1.userManager.add(usernames);
        if (Util_1.Util.getTwitterAuthorization() || Util_1.Util.getTwitterAuthToken()) {
            MainManager_1.mainManager.runUserListWatcher();
        }
        else {
            usernames.forEach((username) => MainManager_1.mainManager.addUserWatcher(username));
        }
    }
});
commander_1.program.parse();
//# sourceMappingURL=index.js.map