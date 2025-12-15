"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const environment_1 = require("./config/environment");
const database_1 = require("./config/database");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        environment: environment_1.config.env,
    });
});
const startServer = async () => {
    try {
        await (0, database_1.initializeDatabase)();
        app.listen(environment_1.config.port, () => {
            console.log(`🚀 Server running on port ${environment_1.config.port}`);
            console.log(`📝 Environment: ${environment_1.config.env}`);
            console.log(`🏥 Health check: http://localhost:${environment_1.config.port}/api/health`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};
startServer();
