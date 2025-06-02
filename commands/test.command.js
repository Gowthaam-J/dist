"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testCommand = void 0;
const commander_1 = require("commander");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const SpaceDownloader_1 = require("../modules/SpaceDownloader");
const Util_1 = require("../utils/Util");
const command = new commander_1.Command('test')
    .description('Test!');
exports.testCommand = command;
command
    .command('download <SPACE_IDS>')
    .alias('d')
    .description('Test download space by id(s)')
    .action((ids) => {
    const spaces = Array
        // eslint-disable-next-line no-eval
        .from(eval((0, fs_1.readFileSync)(path_1.default.join(__dirname, '../../test/data/spaces.ts'), { encoding: 'utf8' })))
        .filter((space) => space.playlist_url);
    const spaceIds = ids.split(',').filter((v) => v);
    const filteredSpaces = spaces.filter((v) => spaceIds.some((id) => id === v.id));
    if (!filteredSpaces.length) {
        // eslint-disable-next-line no-console
        console.debug('No space(s) found');
        return;
    }
    const users = Array
        // eslint-disable-next-line no-eval
        .from(eval((0, fs_1.readFileSync)(path_1.default.join(__dirname, '../../test/data/users.ts'), { encoding: 'utf8' })));
    filteredSpaces.forEach((space) => {
        const user = users.find((v) => v.username === space.username);
        const time = Util_1.Util.getDateTimeString(space.started_at);
        const name = `[${space.username}][${time}] ${space.title || 'NA'} (${space.id})`;
        const metadata = {
            title: space.title,
            author: user.name,
            artist: user.name,
            episode_id: space.id,
        };
        new SpaceDownloader_1.SpaceDownloader(space.playlist_url, name, space.username, metadata).download();
    });
});
//# sourceMappingURL=test.command.js.map