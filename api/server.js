"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express = __importStar(require("express"));
// import bodyParser from 'body-parser'
const MainManager_1 = require("../modules/MainManager");
const TwitterUtil_1 = require("../utils/TwitterUtil");
const logger_1 = require("../logger");
const app = express.default();
const port = process.env.PORT || 3000;
app.use(express.default.json());
app.post('/download-space', (req, res) => {
    const { spaceUrl } = req.body;
    if (!spaceUrl || typeof spaceUrl !== 'string') {
        logger_1.logger.error('Invalid or missing spaceUrl in request body');
        return res.status(400).json({ error: 'Invalid or missing spaceUrl in request body' });
    }
    const spaceId = TwitterUtil_1.TwitterUtil.getSpaceId(spaceUrl);
    if (!spaceId) {
        logger_1.logger.error(`Invalid space URL: ${spaceUrl}`);
        return res.status(400).json({ error: 'Invalid space URL' });
    }
    try {
        MainManager_1.mainManager.addSpaceWatcher(spaceId);
        logger_1.logger.info(`Triggered download for space ID: ${spaceId}`);
        return res.status(200).json({ message: 'Download started', spaceId });
    }
    catch (error) {
        logger_1.logger.error('Error triggering space download', error);
        return res.status(500).json({ error: 'Failed to start download' });
    }
});
app.listen(port, () => {
    logger_1.logger.info(`API server listening on port ${port}`);
});
//# sourceMappingURL=server.js.map