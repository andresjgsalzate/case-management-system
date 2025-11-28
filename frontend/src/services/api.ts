import { authService } from "./auth.service";

// Tipos para los datos de casos
export interface CaseStatus {
  id: string;
  name: string;
  description: string;
  color: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Case {
  id: string;
  numeroCaso: string;
  descripcion: string;
  fecha: string;
  historialCaso: number;
  conocimientoModulo: number;
  manipulacionDatos: number;
  claridadDescripcion: number;
  causaFallo: number;
  puntuacion: number;
  clasificacion: "Baja Complejidad" | "Media Complejidad" | "Alta Complejidad";
  estado:
    | "nuevo"
    | "en_progreso"
    | "en_curso"
    | "pendiente"
    | "resuelto"
    | "cerrado"
    | "cancelado"
    | "asignado";
  statusId?: string; // ID del estado en la tabla case_statuses
  isArchived?: boolean; // Indica si el caso está archivado
  observaciones?: string;
  originId?: string;
  applicationId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  // Relaciones populadas
  origin?: {
    id: string;
    nombre: string;
    descripcion?: string;
  };
  application?: {
    id: string;
    nombre: string;
    descripcion?: string;
  };
  user?: {
    id: string;
    email: string;
    fullName?: string;
  };
  assignedTo?: {
    id: string;
    email: string;
    fullName?: string;
  };
  status?: CaseStatus; // Objeto de estado completo desde case_statuses
}

export interface Origin {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface Application {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface CreateCaseDTO {
  numeroCaso: string;
  descripcion: string;
  fecha: string;
  historialCaso: number;
  conocimientoModulo: number;
  manipulacionDatos: number;
  claridadDescripcion: number;
  causaFallo: number;
  estado?:
    | "nuevo"
    | "en_progreso"
    | "pendiente"
    | "resuelto"
    | "cerrado"
    | "cancelado";
  observaciones?: string;
  originId?: string;
  applicationId?: string;
}

// Servicios para casos
export const caseService = {
  // Obtener todos los casos con filtros opcionales
  getAllCases: async (filters?: any): Promise<Case[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await authService.authenticatedRequest<Case[]>(
      `/cases${params.toString() ? `?${params.toString()}` : ""}`
    );
    return response.data || [];
  },

  // Obtener un caso por ID
  getCaseById: async (id: string): Promise<Case> => {
    const response = await authService.authenticatedRequest<Case>(
      `/cases/${id}`
    );
    if (!response.data) {
      throw new Error("Case not found");
    }
    return response.data;
  },

  // Crear un nuevo caso
  createCase: async (caseData: any): Promise<Case> => {
    console.log("Sending create request:", caseData);
    const response = await authService.authenticatedRequest<any>("/cases", {
      method: "POST",
      body: JSON.stringify(caseData),
    });
    console.log("Create response received:", response);

    // El backend devuelve { success: true, data: case, message: string }
    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to create case");
    }
    return response.data;
  },

  // Actualizar un caso
  updateCase: async (id: string, caseData: any): Promise<Case> => {
    console.log("Sending update request for case:", id, caseData);
    const response = await authService.authenticatedRequest<any>(
      `/cases/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(caseData),
      }
    );
    console.log("Update response received:", response);

    // El backend devuelve { success: true, data: case, message: string }
    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to update case");
    }
    return response.data;
  },

  // Eliminar un caso
  deleteCase: async (id: string): Promise<void> => {
    await authService.authenticatedRequest(`/cases/${id}`, {
      method: "DELETE",
    });
  },
};
export const cases = {
  // Obtener todos los casos
  getAll: async (): Promise<Case[]> => {
    // Agregar timestamp para evitar caché
    const timestamp = new Date().getTime();
    const response = await authService.authenticatedRequest<Case[]>(
      `/cases?_t=${timestamp}`
    );
    return response.data || [];
  },

  // Obtener un caso por ID
  getById: async (id: string): Promise<Case> => {
    const response = await authService.authenticatedRequest<Case>(
      `/cases/${id}`
    );
    if (!response.data) {
      throw new Error("Case not found");
    }
    return response.data;
  },

  // Crear un nuevo caso
  create: async (data: CreateCaseDTO): Promise<Case> => {
    const response = await authService.authenticatedRequest<Case>("/cases", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!response.data) {
      throw new Error("Failed to create case");
    }
    return response.data;
  },

  // Actualizar un caso
  update: async (id: string, data: Partial<CreateCaseDTO>): Promise<Case> => {
    const response = await authService.authenticatedRequest<Case>(
      `/cases/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
    if (!response.data) {
      throw new Error("Failed to update case");
    }
    return response.data;
  },

  // Eliminar un caso
  delete: async (id: string): Promise<void> => {
    await authService.authenticatedRequest(`/cases/${id}`, {
      method: "DELETE",
    });
  },
};

// API para orígenes
export const origensApi = {
  getAll: async (): Promise<Origin[]> => {
    const response = await authService.authenticatedRequest<Origin[]>(
      "/origenes"
    );
    return response.data || [];
  },

  create: async (data: {
    nombre: string;
    descripcion?: string;
  }): Promise<Origin> => {
    const response = await authService.authenticatedRequest<Origin>(
      "/origenes",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    if (!response.data) {
      throw new Error("Failed to create origin");
    }
    return response.data;
  },
};

// API para aplicaciones
export const applicationsApi = {
  getAll: async (): Promise<Application[]> => {
    const response = await authService.authenticatedRequest<Application[]>(
      "/aplicaciones"
    );
    return response.data || [];
  },

  create: async (data: {
    nombre: string;
    descripcion?: string;
  }): Promise<Application> => {
    const response = await authService.authenticatedRequest<Application>(
      "/aplicaciones",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
    if (!response.data) {
      throw new Error("Failed to create application");
    }
    return response.data;
  },
};

// Hook personalizado para gestión de errores
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

// Función auxiliar para manejo de errores
export const handleApiError = (error: any): string => {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 404:
        return "Recurso no encontrado";
      case 400:
        return "Datos inválidos";
      case 401:
        return "No autorizado";
      case 403:
        return "Sin permisos";
      case 500:
        return "Error interno del servidor";
      default:
        return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Error desconocido";
};

// Alias para compatibilidad con código existente
export const casesApi = caseService;
