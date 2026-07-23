"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("@config/env");
const ApiError_1 = require("@utils/ApiError");
const enums_1 = require("@constants/enums");
const SALT_ROUNDS = 12;
class AuthService {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async register(input) {
        const existing = await this.userRepository.findByEmail(input.email);
        if (existing) {
            throw ApiError_1.ApiError.conflict('An account with this email already exists');
        }
        const passwordHash = await bcryptjs_1.default.hash(input.password, SALT_ROUNDS);
        const user = await this.userRepository.create({
            name: input.name,
            email: input.email.toLowerCase(),
            passwordHash,
            role: enums_1.UserRole.VIEWER,
        });
        return this.issueSession(user);
    }
    async login(input) {
        const user = await this.userRepository.findByEmail(input.email, true);
        if (!user) {
            throw ApiError_1.ApiError.unauthorized('Invalid email or password');
        }
        const isValid = await bcryptjs_1.default.compare(input.password, user.passwordHash);
        if (!isValid) {
            throw ApiError_1.ApiError.unauthorized('Invalid email or password');
        }
        return this.issueSession(user);
    }
    async refresh(refreshToken) {
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(refreshToken, env_1.env.jwt.refreshSecret);
        }
        catch {
            throw ApiError_1.ApiError.unauthorized('Invalid or expired refresh token');
        }
        const user = await this.userRepository.findById(payload.sub);
        if (!user || !user.refreshTokenHash) {
            throw ApiError_1.ApiError.unauthorized('Session no longer valid');
        }
        const matches = await bcryptjs_1.default.compare(refreshToken, user.refreshTokenHash);
        if (!matches) {
            throw ApiError_1.ApiError.unauthorized('Session no longer valid');
        }
        return this.generateAndPersistTokens(user);
    }
    async logout(userId) {
        await this.userRepository.updateById(userId, { refreshTokenHash: undefined });
    }
    async issueSession(user) {
        const tokens = await this.generateAndPersistTokens(user);
        return {
            ...tokens,
            user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
        };
    }
    async generateAndPersistTokens(user) {
        const userId = user._id.toString();
        const accessToken = jsonwebtoken_1.default.sign({ sub: userId, role: user.role, team: user.team?.toString() }, env_1.env.jwt.accessSecret, { expiresIn: env_1.env.jwt.accessExpiry });
        const refreshToken = jsonwebtoken_1.default.sign({ sub: userId }, env_1.env.jwt.refreshSecret, {
            expiresIn: env_1.env.jwt.refreshExpiry,
        });
        const refreshTokenHash = await bcryptjs_1.default.hash(refreshToken, SALT_ROUNDS);
        await this.userRepository.updateById(userId, { refreshTokenHash });
        return { accessToken, refreshToken };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map