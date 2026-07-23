"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorize = authorize;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("@config/env");
const ApiError_1 = require("@utils/ApiError");
function authenticate(req, _res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        throw ApiError_1.ApiError.unauthorized('Missing or malformed authorization header');
    }
    const token = header.slice('Bearer '.length);
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.jwt.accessSecret);
        req.user = payload;
        next();
    }
    catch {
        throw ApiError_1.ApiError.unauthorized('Invalid or expired token');
    }
}
function authorize(...allowedRoles) {
    return (req, _res, next) => {
        if (!req.user) {
            throw ApiError_1.ApiError.unauthorized();
        }
        if (!allowedRoles.includes(req.user.role)) {
            throw ApiError_1.ApiError.forbidden('Insufficient permissions for this action');
        }
        next();
    };
}
//# sourceMappingURL=auth.middleware.js.map