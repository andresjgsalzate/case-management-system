"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.createError = exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errorHandler = (error, req, res, next) => {
    const { statusCode = 500, message, stack } = error;
    logger_1.logger.error({
        error: {
            message,
            stack,
            statusCode,
            url: req.url,
            method: req.method,
            ip: req.ip,
            userAgent: req.get("User-Agent"),
        },
    });
    const errorResponse = {
        message: statusCode === 500 ? "Internal Server Error" : message,
        error: {
            message: statusCode === 500 ? "Internal Server Error" : message,
            statusCode,
            timestamp: new Date().toISOString(),
            path: req.path,
        },
    };
    if (process.env.NODE_ENV === "development") {
        errorResponse.error.stack = stack;
    }
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
exports.createError = createError;
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
