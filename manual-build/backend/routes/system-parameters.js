"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const system_parameter_controller_1 = require("../controllers/system-parameter.controller");
const system_parameter_service_1 = require("../services/system-parameter.service");
const data_source_1 = __importDefault(require("../data-source"));
const SystemParameter_1 = require("../entities/SystemParameter");
const requireAuth = (req, res, next) => {
    req.user = { id: 1, role: "admin" };
    next();
};
const requireAdminRole = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "No tienes permisos para realizar esta acción",
        });
    }
    next();
};
const router = (0, express_1.Router)();
const systemParameterRepository = data_source_1.default.getRepository(SystemParameter_1.SystemParameter);
const systemParameterService = new system_parameter_service_1.SystemParameterService(systemParameterRepository);
const systemParameterController = new system_parameter_controller_1.SystemParameterController(systemParameterService);
router.get("/categories/:category/config", requireAuth, (req, res) => systemParameterController.getConfigByCategory(req, res));
router.get("/validation", requireAuth, (req, res) => systemParameterController.validateConfiguration(req, res));
router.use(requireAuth);
router.use(requireAdminRole);
router.get("/", (req, res) => systemParameterController.getAllParameters(req, res));
router.get("/categories/:category", (req, res) => systemParameterController.getParametersByCategory(req, res));
router.get("/key/:key", (req, res) => systemParameterController.getParameterByKey(req, res));
router.get("/key/:key/value", (req, res) => systemParameterController.getParameterValue(req, res));
router.post("/", (req, res) => systemParameterController.createParameter(req, res));
router.put("/:id", (req, res) => systemParameterController.updateParameter(req, res));
router.put("/key/:key/value", (req, res) => systemParameterController.setParameterValue(req, res));
router.delete("/:id", (req, res) => systemParameterController.deleteParameter(req, res));
router.get("/stats", (req, res) => systemParameterController.getConfigurationStats(req, res));
router.post("/cache/refresh", (req, res) => systemParameterController.refreshCache(req, res));
exports.default = router;
