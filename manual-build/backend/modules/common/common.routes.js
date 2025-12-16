"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../../config/database");
const Origin_1 = require("../../entities/Origin");
const Application_1 = require("../../entities/Application");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
class OriginController {
    constructor() {
        this.originRepository = database_1.AppDataSource.getRepository(Origin_1.Origin);
    }
    async getOrigenes(req, res, next) {
        try {
            const origenes = await this.originRepository.find({
                where: { activo: true },
                order: { nombre: "ASC" },
            });
            res.json({
                success: true,
                data: origenes,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async createOrigen(req, res, next) {
        try {
            const { nombre, descripcion } = req.body;
            if (!nombre) {
                return res.status(400).json({
                    success: false,
                    message: "El nombre es requerido",
                });
            }
            const newOrigen = this.originRepository.create({
                nombre,
                descripcion,
                activo: true,
            });
            const savedOrigen = await this.originRepository.save(newOrigen);
            res.status(201).json({
                success: true,
                message: "Origen creado exitosamente",
                data: savedOrigen,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
class ApplicationController {
    constructor() {
        this.applicationRepository = database_1.AppDataSource.getRepository(Application_1.Application);
    }
    async getAplicaciones(req, res, next) {
        try {
            const aplicaciones = await this.applicationRepository.find({
                where: { activo: true },
                order: { nombre: "ASC" },
            });
            res.json({
                success: true,
                data: aplicaciones,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async createAplicacion(req, res, next) {
        try {
            const { nombre, descripcion } = req.body;
            if (!nombre) {
                return res.status(400).json({
                    success: false,
                    message: "El nombre es requerido",
                });
            }
            const newAplicacion = this.applicationRepository.create({
                nombre,
                descripcion,
                activo: true,
            });
            const savedAplicacion = await this.applicationRepository.save(newAplicacion);
            res.status(201).json({
                success: true,
                message: "Aplicación creada exitosamente",
                data: savedAplicacion,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
const originController = new OriginController();
const applicationController = new ApplicationController();
router.get("/origenes", originController.getOrigenes.bind(originController));
router.post("/origenes", originController.createOrigen.bind(originController));
router.get("/aplicaciones", applicationController.getAplicaciones.bind(applicationController));
router.post("/aplicaciones", applicationController.createAplicacion.bind(applicationController));
exports.default = router;
