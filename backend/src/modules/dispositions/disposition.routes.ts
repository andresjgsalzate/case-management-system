import { Router } from "express";
import {
  createDisposition,
  getAllDispositions,
  getDispositionById,
  updateDisposition,
  deleteDisposition,
  getAvailableYears,
  getMonthlyStats,
} from "./disposition.controller";
import { authenticateToken } from "../../middleware/auth";

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// GET /api/dispositions - Obtener todas las disposiciones con filtros opcionales
router.get("/", getAllDispositions);

// GET /api/dispositions/years - Obtener años disponibles
router.get("/years", getAvailableYears);

// GET /api/dispositions/monthly/:year/:month - Obtener estadísticas mensuales
router.get("/monthly/:year/:month", getMonthlyStats);

// GET /api/dispositions/:id - Obtener una disposición por ID
router.get("/:id", getDispositionById);

// POST /api/dispositions - Crear una nueva disposición
router.post("/", createDisposition);

// PUT /api/dispositions/:id - Actualizar una disposición
router.put("/:id", updateDisposition);

// DELETE /api/dispositions/:id - Eliminar una disposición
router.delete("/:id", deleteDisposition);

export default router;
