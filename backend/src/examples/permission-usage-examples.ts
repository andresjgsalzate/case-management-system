/**
 * EJEMPLOS DE USO DEL SISTEMA DE PERMISOS
 *
 * Este archivo muestra cómo implementar el sistema de permisos
 * en diferentes controladores y rutas del sistema.
 */

import { Router, Request, Response } from "express";
import {
  requirePermission,
  requirePermissionWithScope,
  requireAllPermissions,
  requireAnyPermission,
  filterByScope,
  requireAdmin,
} from "../middleware/authorizationMiddleware";

const router = Router();

// ===========================
// EJEMPLOS PARA DISPOSICIONES
// ===========================

/**
 * Ver disposiciones con scope automático
 * El middleware determinará si el usuario puede ver:
 * - Solo sus disposiciones (own)
 * - Disposiciones de su equipo (team)
 * - Todas las disposiciones (all)
 */
router.get(
  "/dispositions",
  requirePermissionWithScope("dispositions", "read"),
  async (req: Request, res: Response) => {
    const user = req.userWithPermissions;
    const scope = user?.permissionScope;

    // Construir query según el scope
    const queryFilters: any = {};

    switch (scope) {
      case "own":
        if (user) queryFilters.userId = user.id;
        break;
      case "team":
        if (user) queryFilters.teamId = user.teamId;
        break;
      case "all":
        // Sin filtros adicionales
        break;
    }

    res.json({
      message: `Disposiciones con scope: ${scope}`,
      filters: queryFilters,
      scope,
    });
  }
);

/**
 * Crear disposición - permiso específico
 */
router.post(
  "/dispositions",
  requirePermission("dispositions.create.own"),
  async (req: Request, res: Response) => {
    // El usuario ya tiene permiso verificado
    res.json({
      message: "Disposición creada correctamente",
    });
  }
);

/**
 * Editar disposición específica con verificación de propiedad
 */
router.put(
  "/dispositions/:id",
  filterByScope("dispositions", "update", {
    getEntityId: (req: any) => req.params.id, // El ID de la disposición
    // getEntityTeamId: async (req) => {
    //     // Función para obtener el teamId de la disposición
    //     const disposition = await DispositionService.findById(req.params.id);
    //     return disposition?.teamId;
    // }
  }),
  async (req: Request, res: Response) => {
    // Si llegamos aquí, el usuario tiene permisos válidos
    res.json({
      message: "Disposición actualizada",
      dispositionId: req.params.id,
    });
  }
);

// ===========================
// EJEMPLOS PARA CASOS
// ===========================

/**
 * Dashboard de casos - requiere múltiples permisos
 */
router.get(
  "/cases/dashboard",
  requireAllPermissions(["cases.read.all", "dashboard.view.all"]),
  async (req: Request, res: Response) => {
    res.json({
      message: "Dashboard de casos - acceso completo",
    });
  }
);

/**
 * Ver casos - cualquiera de estos permisos es suficiente
 */
router.get(
  "/cases",
  requireAnyPermission(["cases.view.own", "cases.view.team", "cases.view.all"]),
  async (req: Request, res: Response) => {
    res.json({
      message: "Lista de casos según permisos del usuario",
    });
  }
);

/**
 * Asignar caso - solo team o all
 */
router.post(
  "/cases/:id/assign",
  requireAnyPermission(["cases.assign.team", "cases.assign.all"]),
  async (req: Request, res: Response) => {
    res.json({
      message: "Caso asignado correctamente",
      caseId: req.params.id,
    });
  }
);

// ===========================
// EJEMPLOS PARA TODOS (TAREAS)
// ===========================

/**
 * Ver todos con filtrado automático por scope
 */
router.get(
  "/todos",
  filterByScope("todos", "ver", {
    userIdField: "assignedTo", // Campo que contiene el ID del usuario
    teamIdField: "teamId", // Campo que contiene el ID del equipo
  }),
  async (req: Request, res: Response) => {
    const user = req.userWithPermissions;
    const filters = user?.scopeFilters;

    res.json({
      message: "Todos filtrados por scope",
      appliedFilters: filters,
      scope: user?.permissionScope,
    });
  }
);

// ===========================
// EJEMPLOS ADMINISTRATIVOS
// ===========================

/**
 * Panel de administración - solo administradores
 */
router.get(
  "/admin/panel",
  requireAdmin(),
  async (req: Request, res: Response) => {
    res.json({
      message: "Panel administrativo",
    });
  }
);

/**
 * Gestión de usuarios - permiso específico de administración
 */
router.get(
  "/admin/users",
  requirePermission("users.manage.all"),
  async (req: Request, res: Response) => {
    res.json({
      message: "Gestión de usuarios",
    });
  }
);

// ===========================
// EJEMPLO DE MIDDLEWARE PERSONALIZADO
// ===========================

/**
 * Función personalizada para verificar permisos complejos
 */
const checkComplexPermission = async (
  user: any,
  permissionService: any
): Promise<boolean> => {
  // Lógica personalizada de permisos
  const hasBasicAccess = await permissionService.hasPermission(
    user.roleId,
    "cases.read.own"
  );
  const hasAdvancedAccess = await permissionService.hasPermission(
    user.roleId,
    "reports.generate.team"
  );

  // Ejemplo: requiere ambos permisos
  return hasBasicAccess && hasAdvancedAccess;
};

/**
 * Usar middleware personalizado
 */
router.get(
  "/complex-operation",
  // requireCustomPermission(checkComplexPermission, 'Acceso denegado: requiere permisos especiales'),
  async (req: Request, res: Response) => {
    res.json({
      message: "Operación compleja autorizada",
    });
  }
);

// ===========================
// EJEMPLOS DE VERIFICACIÓN EN SERVICIOS
// ===========================

/**
 * Ejemplo de cómo verificar permisos en un servicio
 */
class ExampleService {
  async checkUserPermissions(userId: string, roleId: string) {
    const permissionService = new (
      await import("../services/PermissionService")
    ).PermissionService();

    // Verificar permiso específico
    const canCreateCases = await permissionService.hasPermission(
      roleId,
      "cases.create.own"
    );

    // Verificar scope más alto
    const highestScope = await permissionService.getHighestScope(
      roleId,
      "dispositions",
      "read"
    );

    // Verificar múltiples permisos
    const permissions = await permissionService.hasPermissions(roleId, [
      "cases.read.own",
      "dispositions.read.own",
      "todos.read.own",
    ]);

    return {
      canCreateCases,
      highestScope,
      permissions,
    };
  }
}

export { router as permissionExamplesRouter };
