"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function requireEnv(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}
exports.env = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 5000),
    mongodbUri: requireEnv('MONGODB_URI'),
    jwt: {
        accessSecret: requireEnv('JWT_ACCESS_SECRET'),
        refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
        accessExpiry: process.env.JWT_ACCESS_EXPIRY ?? '15m',
        refreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? '7d',
    },
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
        apiKey: process.env.CLOUDINARY_API_KEY ?? '',
        apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
    },
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
};
//# sourceMappingURL=env.js.map