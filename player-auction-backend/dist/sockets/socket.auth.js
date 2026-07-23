"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuthMiddleware = socketAuthMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("@config/env");
function socketAuthMiddleware(socket, next) {
    const token = socket.handshake.auth?.token;
    if (!token) {
        next(new Error('Authentication token missing'));
        return;
    }
    try {
        socket.user = jsonwebtoken_1.default.verify(token, env_1.env.jwt.accessSecret);
        next();
    }
    catch {
        next(new Error('Invalid or expired token'));
    }
}
//# sourceMappingURL=socket.auth.js.map