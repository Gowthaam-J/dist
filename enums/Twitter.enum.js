"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioSpaceMetadataState = exports.SpaceState = void 0;
var SpaceState;
(function (SpaceState) {
    SpaceState["SCHEDULED"] = "scheduled";
    SpaceState["LIVE"] = "live";
    SpaceState["ENDED"] = "ended";
    SpaceState["CANCELED"] = "canceled";
})(SpaceState || (exports.SpaceState = SpaceState = {}));
var AudioSpaceMetadataState;
(function (AudioSpaceMetadataState) {
    AudioSpaceMetadataState["NOT_STARTED"] = "NotStarted";
    AudioSpaceMetadataState["PRE_PUBLISHED"] = "PrePublished";
    AudioSpaceMetadataState["RUNNING"] = "Running";
    AudioSpaceMetadataState["ENDED"] = "Ended";
    AudioSpaceMetadataState["CANCELED"] = "Canceled";
    AudioSpaceMetadataState["TIMED_OUT"] = "TimedOut";
})(AudioSpaceMetadataState || (exports.AudioSpaceMetadataState = AudioSpaceMetadataState = {}));
//# sourceMappingURL=Twitter.enum.js.map