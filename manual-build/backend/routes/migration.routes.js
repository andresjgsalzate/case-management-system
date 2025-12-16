"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const MigrationController_1 = require("../controllers/MigrationController");
const router = (0, express_1.Router)();
const migrationController = new MigrationController_1.MigrationController();
router.post("/update-case-scoring", migrationController.updateCaseScoring.bind(migrationController));
exports.default = router;
