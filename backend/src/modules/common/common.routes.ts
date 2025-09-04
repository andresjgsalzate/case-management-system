import { Router } from "express";
import { Repository } from "typeorm";
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../config/database";
import { Origin } from "../../entities/Origin";
import { Application } from "../../entities/Application";
import { authenticateToken } from "../../middleware/auth";

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Controlador para Orígenes
class OriginController {
  private originRepository: Repository<Origin>;

  constructor() {
    this.originRepository = AppDataSource.getRepository(Origin);
  }

  async getOrigenes(req: Request, res: Response, next: NextFunction) {
    try {
      const origenes = await this.originRepository.find({
        where: { activo: true },
        order: { nombre: "ASC" },
      });

      res.json({
        success: true,
        data: origenes,
      });
    } catch (error) {
      next(error);
    }
  }

  async createOrigen(req: Request, res: Response, next: NextFunction) {
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
    } catch (error) {
      next(error);
    }
  }
}

// Controlador para Aplicaciones
class ApplicationController {
  private applicationRepository: Repository<Application>;

  constructor() {
    this.applicationRepository = AppDataSource.getRepository(Application);
  }

  async getAplicaciones(req: Request, res: Response, next: NextFunction) {
    try {
      const aplicaciones = await this.applicationRepository.find({
        where: { activo: true },
        order: { nombre: "ASC" },
      });

      res.json({
        success: true,
        data: aplicaciones,
      });
    } catch (error) {
      next(error);
    }
  }

  async createAplicacion(req: Request, res: Response, next: NextFunction) {
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

      const savedAplicacion = await this.applicationRepository.save(
        newAplicacion
      );

      res.status(201).json({
        success: true,
        message: "Aplicación creada exitosamente",
        data: savedAplicacion,
      });
    } catch (error) {
      next(error);
    }
  }
}

// Crear instancias de controladores
const originController = new OriginController();
const applicationController = new ApplicationController();

// Rutas para orígenes
router.get("/origenes", originController.getOrigenes.bind(originController));
router.post("/origenes", originController.createOrigen.bind(originController));

// Rutas para aplicaciones
router.get(
  "/aplicaciones",
  applicationController.getAplicaciones.bind(applicationController)
);
router.post(
  "/aplicaciones",
  applicationController.createAplicacion.bind(applicationController)
);

export default router;
