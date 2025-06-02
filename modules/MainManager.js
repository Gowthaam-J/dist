"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainManager = void 0;
const logger_1 = require("../logger");
const SpaceWatcher_1 = require("./SpaceWatcher");
const UserListWatcher_1 = require("./UserListWatcher");
const UserWatcher_1 = require("./UserWatcher");
class MainManager {
    constructor() {
        this.userWatchers = {};
        this.spaceWatchers = {};
        this.logger = logger_1.logger.child({ label: '[MainManager]' });
    }
    addSpaceWatcher(spaceId) {
        const watchers = this.spaceWatchers;
        if (watchers[spaceId]) {
            return;
        }
        const watcher = new SpaceWatcher_1.SpaceWatcher(spaceId);
        watchers[spaceId] = watcher;
        watcher.watch();
        watcher.once('complete', () => {
            this.logger.debug(`SpaceWatcher@${spaceId} complete`);
            if (!watchers[spaceId]) {
                return;
            }
            delete watchers[spaceId];
            this.logger.debug(`SpaceWatcher@${spaceId} delete`);
        });
    }
    addUserWatcher(username) {
        const watchers = this.userWatchers;
        if (watchers[username]) {
            return;
        }
        const watcher = new UserWatcher_1.UserWatcher(username);
        watchers[username] = watcher;
        watcher.watch();
        watcher.on('data', (id) => {
            this.addSpaceWatcher(id);
        });
    }
    runUserListWatcher() {
        const watcher = new UserListWatcher_1.UserListWatcher();
        watcher.watch();
        watcher.on('data', (id) => {
            this.addSpaceWatcher(id);
        });
    }
}
exports.mainManager = new MainManager();
//# sourceMappingURL=MainManager.js.map