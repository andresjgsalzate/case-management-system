"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_controller_1 = require("./health.controller");
const router = (0, express_1.Router)();
const healthController = new health_controller_1.HealthController();
router.get("/", healthController.getHealth.bind(healthController));
exports.default = router;
