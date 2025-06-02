"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const url_1 = __importDefault(require("url"));
const dotenv_1 = __importDefault(require("dotenv"));
const MainManager_1 = require("./modules/MainManager");
const TwitterUtil_1 = require("./utils/TwitterUtil");
const SpaceDownloader_1 = require("./modules/SpaceDownloader");
const Util_1 = require("./utils/Util");
dotenv_1.default.config();
const PORT = process.env.API_SERVER_PORT || 3000;
const API_KEY = process.env.API_KEY || '';
const sendJsonResponse = (res, statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
};
const authenticate = (req) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== API_KEY) {
        return false;
    }
    return true;
};
const server = http_1.default.createServer(async (req, res) => {
    if (!authenticate(req)) {
        sendJsonResponse(res, 401, { error: 'Unauthorized' });
        return;
    }
    const parsedUrl = url_1.default.parse(req.url || '', true);
    if (req.method === 'GET' && parsedUrl.pathname === '/space') {
        const spaceUrl = parsedUrl.query.spaceUrl;
        if (!spaceUrl) {
            sendJsonResponse(res, 400, { error: 'Missing spaceUrl query parameter' });
            return;
        }
        const spaceId = TwitterUtil_1.TwitterUtil.getSpaceId(spaceUrl);
        if (!spaceId) {
            sendJsonResponse(res, 400, { error: 'Invalid spaceUrl parameter' });
            return;
        }
        try {
            MainManager_1.mainManager.addSpaceWatcher(spaceId);
            sendJsonResponse(res, 200, { message: 'Space watcher started', spaceId });
        }
        catch (error) {
            sendJsonResponse(res, 500, { error: 'Failed to start space watcher', details: error.message });
        }
    }
    else if (req.method === 'POST' && parsedUrl.pathname === '/space') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const spaceUrl = data.spaceUrl;
                if (!spaceUrl) {
                    sendJsonResponse(res, 400, { error: 'Missing spaceUrl in request body' });
                    return;
                }
                const spaceId = TwitterUtil_1.TwitterUtil.getSpaceId(spaceUrl);
                if (!spaceId) {
                    sendJsonResponse(res, 400, { error: 'Invalid spaceUrl parameter' });
                    return;
                }
                MainManager_1.mainManager.addSpaceWatcher(spaceId);
                sendJsonResponse(res, 200, { message: 'Space watcher started', spaceId });
            }
            catch (error) {
                sendJsonResponse(res, 400, { error: 'Invalid JSON body', details: error.message });
            }
        });
    }
    else if (req.method === 'GET' && parsedUrl.pathname === '/download') {
        const downloadUrl = parsedUrl.query.url;
        if (!downloadUrl) {
            sendJsonResponse(res, 400, { error: 'Missing url query parameter' });
            return;
        }
        try {
            if (downloadUrl.includes('/i/spaces/')) {
                const spaceId = TwitterUtil_1.TwitterUtil.getSpaceId(downloadUrl);
                if (!spaceId) {
                    sendJsonResponse(res, 400, { error: 'Invalid space URL' });
                    return;
                }
                MainManager_1.mainManager.addSpaceWatcher(spaceId);
                sendJsonResponse(res, 200, { message: 'Space download started', spaceId });
            }
            else {
                const timestamp = Util_1.Util.getDateTimeString();
                const downloader = new SpaceDownloader_1.SpaceDownloader(downloadUrl, timestamp);
                downloader.download();
                sendJsonResponse(res, 200, { message: 'Playlist download started', url: downloadUrl });
            }
        }
        catch (error) {
            sendJsonResponse(res, 500, { error: 'Failed to start download', details: error.message });
        }
    }
    else if (req.method === 'POST' && parsedUrl.pathname === '/download') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const downloadUrl = data.url;
                if (!downloadUrl) {
                    sendJsonResponse(res, 400, { error: 'Missing url in request body' });
                    return;
                }
                if (downloadUrl.includes('/i/spaces/')) {
                    const spaceId = TwitterUtil_1.TwitterUtil.getSpaceId(downloadUrl);
                    if (!spaceId) {
                        sendJsonResponse(res, 400, { error: 'Invalid space URL' });
                        return;
                    }
                    MainManager_1.mainManager.addSpaceWatcher(spaceId);
                    sendJsonResponse(res, 200, { message: 'Space download started', spaceId });
                }
                else {
                    const timestamp = Util_1.Util.getDateTimeString();
                    const downloader = new SpaceDownloader_1.SpaceDownloader(downloadUrl, timestamp);
                    downloader.download();
                    sendJsonResponse(res, 200, { message: 'Playlist download started', url: downloadUrl });
                }
            }
            catch (error) {
                sendJsonResponse(res, 400, { error: 'Invalid JSON body', details: error.message });
            }
        });
    }
    else {
        sendJsonResponse(res, 404, { error: 'Not found' });
    }
});
server.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
});
//# sourceMappingURL=apiServer.js.map