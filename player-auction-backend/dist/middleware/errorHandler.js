"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
const ApiError_1 = require("@utils/ApiError");
const logger_1 = require("@utils/logger");
function notFoundHandler(req, res) {
    res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}
function errorHandler(err, _req, res, _next) {
    if (err instanceof ApiError_1.ApiError) {
        if (!err.isOperational) {
            logger_1.logger.error(err.message, { stack: err.stack });
        }
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            details: err.details,
        });
        return;
    }
    logger_1.logger.error('Unhandled error', { message: err.message, stack: err.stack });
    res.status(500).json({ success: false, message: 'Internal server error' });
}
//# sourceMappingURL=errorHandler.js.map