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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.spaceRawLogger = exports.spaceLogger = exports.logger = void 0;
exports.toggleDebugConsole = toggleDebugConsole;
const winston_1 = __importStar(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const logger_constant_1 = require("./constants/logger.constant");
function getPrintFormat() {
    return winston_1.format.printf((info) => (Object.keys(info.metadata).length
        ? `${info.timestamp} | [${info.level}] ${[info.label, info.message].filter((v) => v).join(' ')} | ${JSON.stringify(info.metadata)}`
        : `${info.timestamp} | [${info.level}] ${[info.label, info.message].filter((v) => v).join(' ')}`));
}
function getFileName() {
    return `${process.env.NODE_ENV || 'dev'}.%DATE%`;
}
const consoleTransport = new winston_1.default.transports.Console({
    level: process.env.LOG_LEVEL || 'verbose',
    format: winston_1.format.combine(winston_1.format.colorize(), getPrintFormat()),
});
const logger = winston_1.default.createLogger({
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.metadata({ fillExcept: ['timestamp', 'level', 'message'] }), (0, winston_1.format)((info) => Object.assign(info, { level: info.level.toUpperCase() }))(), (0, winston_1.format)((info) => {
        const { metadata } = info;
        if (metadata.label) {
            Object.assign(info, { label: metadata.label });
            delete metadata.label;
        }
        return info;
    })()),
    transports: [
        consoleTransport,
        new winston_daily_rotate_file_1.default({
            level: 'verbose',
            format: winston_1.format.combine(getPrintFormat()),
            datePattern: logger_constant_1.LOGGER_DATE_PATTERN,
            dirname: logger_constant_1.LOGGER_DIR,
            filename: `${getFileName()}.log`,
        }),
        new winston_daily_rotate_file_1.default({
            level: 'error',
            format: winston_1.format.combine(getPrintFormat()),
            datePattern: logger_constant_1.LOGGER_DATE_PATTERN,
            dirname: logger_constant_1.LOGGER_DIR,
            filename: `${getFileName()}_error.log`,
        }),
        new winston_daily_rotate_file_1.default({
            level: 'silly',
            format: winston_1.format.combine(getPrintFormat()),
            datePattern: logger_constant_1.LOGGER_DATE_PATTERN,
            dirname: logger_constant_1.LOGGER_DIR,
            filename: `${getFileName()}_all.log`,
        }),
    ],
});
exports.logger = logger;
const spaceLogger = winston_1.default.createLogger({
    format: winston_1.format.printf((info) => (typeof info.message === 'string' ? info.message : JSON.stringify(info.message))),
    transports: [new winston_1.default.transports.File({ dirname: logger_constant_1.LOGGER_DIR, filename: 'spaces.jsonl' })],
});
exports.spaceLogger = spaceLogger;
const spaceRawLogger = winston_1.default.createLogger({
    format: winston_1.format.printf((info) => (typeof info.message === 'string' ? info.message : JSON.stringify(info.message))),
    transports: [new winston_1.default.transports.File({ dirname: logger_constant_1.LOGGER_DIR, filename: 'spaces.raw.jsonl' })],
});
exports.spaceRawLogger = spaceRawLogger;
function toggleDebugConsole() {
    consoleTransport.level = 'debug';
}
//# sourceMappingURL=logger.js.map