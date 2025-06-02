"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ccCommand = void 0;
const commander_1 = require("commander");
const SpaceCaptionsDownloader_1 = require("../modules/SpaceCaptionsDownloader");
const SpaceCaptionsExtractor_1 = require("../modules/SpaceCaptionsExtractor");
const CommandUtil_1 = require("../utils/CommandUtil");
const command = new commander_1.Command('cc')
    .description('Process captions');
exports.ccCommand = command;
command
    .command('download <SPACE_ID> <ENDPOINT> <TOKEN>')
    .alias('d')
    .description('Download Space captions')
    .action((spaceId, endpoint, token, opts, cmd) => {
    CommandUtil_1.CommandUtil.detectDebugOption(cmd.parent.parent);
    new SpaceCaptionsDownloader_1.SpaceCaptionsDownloader(spaceId, endpoint, token).download();
});
command
    .command('extract <FILE> [STARTED_AT]')
    .alias('e')
    .description('Extract Space captions')
    .action((file, startedAt, opts, cmd) => {
    CommandUtil_1.CommandUtil.detectDebugOption(cmd.parent.parent);
    new SpaceCaptionsExtractor_1.SpaceCaptionsExtractor(file, null, startedAt).extract();
});
//# sourceMappingURL=cc.command.js.map