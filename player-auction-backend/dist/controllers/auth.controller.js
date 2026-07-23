"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const ApiResponse_1 = require("@utils/ApiResponse");
const ApiError_1 = require("@utils/ApiError");
class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    register = async (req, res) => {
        const result = await this.authService.register(req.body);
        res.status(201).json(new ApiResponse_1.ApiResponse('Registration successful', result));
    };
    login = async (req, res) => {
        const result = await this.authService.login(req.body);
        res.status(200).json(new ApiResponse_1.ApiResponse('Login successful', result));
    };
    refresh = async (req, res) => {
        const { refreshToken } = req.body;
        const tokens = await this.authService.refresh(refreshToken);
        res.status(200).json(new ApiResponse_1.ApiResponse('Token refreshed', tokens));
    };
    logout = async (req, res) => {
        if (!req.user) {
            throw ApiError_1.ApiError.unauthorized();
        }
        await this.authService.logout(req.user.sub);
        res.status(200).json(new ApiResponse_1.ApiResponse('Logout successful'));
    };
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map