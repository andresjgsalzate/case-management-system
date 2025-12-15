"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const case_control_routes_1 = __importDefault(require("./case-control.routes"));
const timer_routes_1 = __importDefault(require("./timer.routes"));
const case_status_routes_1 = __importDefault(require("./case-status.routes"));
const router = (0, express_1.Router)();
router.use("/case-statuses", case_status_routes_1.default);
router.use("/timer", timer_routes_1.default);
router.use("/", case_control_routes_1.default);
exports.default = router;
