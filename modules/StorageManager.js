"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageManager = exports.StorageManager = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const fs_1 = __importDefault(require("fs"));
const pg_1 = require("pg");
const winston_1 = __importDefault(require("winston"));
class StorageManager {
    constructor() {
        this.logger = winston_1.default.createLogger({ level: 'info' });
        // Initialize S3 client with environment variables
        this.s3Client = new client_s3_1.S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            },
        });
        // Initialize PostgreSQL pool with environment variable
        // Disable SSL entirely if PG_DISABLE_SSL is set to 'true'
        if (process.env.PG_DISABLE_SSL === 'true') {
            this.pool = new pg_1.Pool({
                connectionString: process.env.POSTGRES_CONNECTION_STRING,
                ssl: false,
            });
        }
        else {
            const rejectUnauthorized = process.env.PG_SSL_REJECT_UNAUTHORIZED === 'true' ? true : false;
            let sslConfig = { rejectUnauthorized };
            if (process.env.PG_SSL_CA_CERT_PATH) {
                const fs = require('fs');
                try {
                    const caCert = fs.readFileSync(process.env.PG_SSL_CA_CERT_PATH).toString();
                    sslConfig.ca = caCert;
                }
                catch (err) {
                    this.logger.error(`Failed to read CA certificate from path: ${process.env.PG_SSL_CA_CERT_PATH}, error: ${err.message}`);
                }
            }
            this.pool = new pg_1.Pool({
                connectionString: process.env.POSTGRES_CONNECTION_STRING,
                ssl: sslConfig,
            });
        }
    }
    async uploadFileToS3(filePath, key) {
        const fileContent = fs_1.default.readFileSync(filePath);
        const bucketName = process.env.AWS_S3_BUCKET_NAME || '';
        const params = {
            Bucket: bucketName,
            Key: key,
            Body: fileContent,
        };
        try {
            const command = new client_s3_1.PutObjectCommand(params);
            await this.s3Client.send(command);
            const s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
            this.logger.info(`File uploaded successfully at ${s3Url}`);
            return s3Url;
        }
        catch (error) {
            this.logger.error(`S3 upload error: ${error.message}`);
            throw error;
        }
    }
    async saveSpaceLinkToDb(spaceId, s3Url) {
        const query = 'INSERT INTO spaces (space_id, s3_url) VALUES ($1, $2) ON CONFLICT (space_id) DO UPDATE SET s3_url = EXCLUDED.s3_url';
        try {
            await this.pool.query(query, [spaceId, s3Url]);
            this.logger.info(`Space link saved to DB for spaceId: ${spaceId}`);
        }
        catch (error) {
            this.logger.error(`DB save error: ${error.message}`);
            throw error;
        }
    }
}
exports.StorageManager = StorageManager;
exports.storageManager = new StorageManager();
//# sourceMappingURL=StorageManager.js.map