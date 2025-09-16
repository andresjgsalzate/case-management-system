import { Router } from "express";
import { SystemInfoController } from "../controllers/SystemInfoController";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const systemInfoController = new SystemInfoController();

/**
 * @route GET /api/system/version
 * @desc Obtener versión del sistema
 * @access Public
 */
router.get(
  "/version",
  systemInfoController.getVersion.bind(systemInfoController)
);

/**
 * @route GET /api/system/info
 * @desc Obtener información completa del sistema
 * @access Private
 */
router.get(
  "/info",
  authenticateToken,
  systemInfoController.getSystemInfo.bind(systemInfoController)
);

/**
 * @route GET /api/system/modules
 * @desc Obtener módulos disponibles del sistema
 * @access Private
 */
router.get(
  "/modules",
  authenticateToken,
  systemInfoController.getModules.bind(systemInfoController)
);

/**
 * @route GET /api/system/changelog
 * @desc Obtener changelog del sistema
 * @access Private
 */
router.get(
  "/changelog",
  authenticateToken,
  systemInfoController.getChangelog.bind(systemInfoController)
);

/**
 * @route GET /api/system/stats
 * @desc Obtener estadísticas del sistema
 * @access Private
 */
router.get(
  "/stats",
  authenticateToken,
  systemInfoController.getStats.bind(systemInfoController)
);

export default router;
