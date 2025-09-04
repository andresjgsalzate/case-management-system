import { authService } from "./auth.service";

// Types para Disposiciones
export interface Disposition {
  id: string;
  date: string;
  caseId: string | null;
  caseNumber: string;
  scriptName: string;
  svnRevisionNumber: string | null;
  applicationId: string;
  observations: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  // Relaciones
  case?: {
    id: string;
    numeroCaso: string;
    descripcion: string;
    clasificacion: string;
  } | null;
  application?: {
    id: string;
    nombre: string;
    descripcion?: string;
  };
  user?: {
    id: string;
    email: string;
    fullName: string;
  };
}

export interface CreateDispositionData {
  date: string;
  caseNumber: string;
  caseId?: string;
  scriptName: string;
  svnRevisionNumber?: string;
  applicationId: string;
  observations?: string;
}

export interface UpdateDispositionData {
  date?: string;
  caseNumber?: string;
  caseId?: string;
  scriptName?: string;
  svnRevisionNumber?: string;
  applicationId?: string;
  observations?: string;
}

export interface DispositionFilters {
  year?: number;
  month?: number;
  applicationId?: string;
  caseNumber?: string;
  search?: string;
}

export interface MonthlyStats {
  month: number;
  year: number;
  totalDispositions: number;
  uniqueCases: number;
  uniqueApplications: number;
}

// Tipo para agrupamiento mensual (para las tarjetas)
export interface DispositionMensual {
  year: number;
  month: number;
  monthName: string;
  dispositions: DispositionPorCaso[];
  totalDispositions: number;
}

export interface DispositionPorCaso {
  caseNumber: string;
  applicationName: string;
  quantity: number;
  caseId?: string;
  applicationId: string;
}

class DispositionApi {
  // Obtener todas las disposiciones con filtros
  async getAll(filters?: DispositionFilters): Promise<Disposition[]> {
    const params = new URLSearchParams();

    if (filters?.year) params.append("year", filters.year.toString());
    if (filters?.month) params.append("month", filters.month.toString());
    if (filters?.applicationId)
      params.append("applicationId", filters.applicationId);
    if (filters?.caseNumber) params.append("caseNumber", filters.caseNumber);
    if (filters?.search) params.append("search", filters.search);

    const queryString = params.toString();
    const endpoint = `/dispositions${queryString ? `?${queryString}` : ""}`;

    const response = await authService.authenticatedRequest<Disposition[]>(
      endpoint
    );
    return Array.isArray(response.data) ? response.data : [];
  }

  // Obtener una disposición por ID
  async getById(id: string): Promise<Disposition> {
    const response = await authService.authenticatedRequest<Disposition>(
      `/dispositions/${id}`
    );
    if (!response.success || !response.data) {
      throw new Error("Disposition not found");
    }
    return response.data;
  }

  // Crear nueva disposición
  async create(data: CreateDispositionData): Promise<Disposition> {
    const response = await authService.authenticatedRequest<Disposition>(
      "/dispositions",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to create disposition");
    }
    return response.data;
  }

  // Actualizar disposición
  async update(id: string, data: UpdateDispositionData): Promise<Disposition> {
    const response = await authService.authenticatedRequest<Disposition>(
      `/dispositions/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to update disposition");
    }
    return response.data;
  }

  // Eliminar disposición
  async delete(id: string): Promise<void> {
    await authService.authenticatedRequest(`/dispositions/${id}`, {
      method: "DELETE",
    });
  }

  // Obtener estadísticas mensuales
  async getMonthlyStats(year: number): Promise<MonthlyStats[]> {
    const response = await authService.authenticatedRequest<MonthlyStats[]>(
      `/dispositions/stats/monthly/${year}`
    );
    return Array.isArray(response.data) ? response.data : [];
  }

  // Obtener años disponibles
  async getAvailableYears(): Promise<number[]> {
    const response = await authService.authenticatedRequest<number[]>(
      "/dispositions/years"
    );
    return Array.isArray(response.data) ? response.data : [];
  }

  // Método helper para agrupar disposiciones por mes (para la vista de tarjetas)
  async getDispositionsByMonth(year: number): Promise<DispositionMensual[]> {
    try {
      const dispositions = await this.getAll({ year });

      // Verificar que dispositions sea un array
      if (!Array.isArray(dispositions)) {
        console.warn(
          "getDispositionsByMonth: dispositions no es un array",
          dispositions
        );
        return [];
      }

      // Agrupar por mes
      const monthlyGroups: { [key: string]: Disposition[] } = {};

      dispositions.forEach((disposition) => {
        const date = new Date(disposition.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

        if (!monthlyGroups[monthKey]) {
          monthlyGroups[monthKey] = [];
        }
        monthlyGroups[monthKey].push(disposition);
      });

      // Convertir a formato DispositionMensual
      const result: DispositionMensual[] = [];

      for (const [monthKey, monthDispositions] of Object.entries(
        monthlyGroups
      )) {
        const [yearStr, monthStr] = monthKey.split("-");
        const month = parseInt(monthStr);
        const yearNum = parseInt(yearStr);

        // Agrupar por caso dentro del mes
        const caseGroups: { [key: string]: DispositionPorCaso } = {};

        monthDispositions.forEach((disposition) => {
          const key = `${disposition.caseNumber}-${disposition.applicationId}`;

          if (!caseGroups[key]) {
            caseGroups[key] = {
              caseNumber: disposition.caseNumber,
              applicationName: disposition.application?.nombre || "Unknown",
              quantity: 0,
              caseId: disposition.caseId || undefined,
              applicationId: disposition.applicationId,
            };
          }
          caseGroups[key].quantity++;
        });

        const monthNames = [
          "Enero",
          "Febrero",
          "Marzo",
          "Abril",
          "Mayo",
          "Junio",
          "Julio",
          "Agosto",
          "Septiembre",
          "Octubre",
          "Noviembre",
          "Diciembre",
        ];

        result.push({
          year: yearNum,
          month,
          monthName: monthNames[month - 1],
          dispositions: Object.values(caseGroups),
          totalDispositions: monthDispositions.length,
        });
      }

      // Ordenar por mes
      return result.sort((a, b) => a.month - b.month);
    } catch (error) {
      console.error("Error en getDispositionsByMonth:", error);
      return [];
    }
  }
}

export const dispositionApi = new DispositionApi();
export default dispositionApi;
