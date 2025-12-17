import { useToast } from "../contexts/ToastContext";
import { AxiosError } from "axios";

export interface ApiError extends AxiosError {
  userMessage?: string;
  technicalDetails?: string;
}

export const useErrorHandler = () => {
  const { error: showError } = useToast();

  const handleError = (error: ApiError, context?: string) => {
    console.error("🚨 Error Handler:", error);

    // Determinar el mensaje a mostrar al usuario
    let title = "Error";
    let description = "";

    if (error.userMessage) {
      // Usar mensaje personalizado del interceptor
      title = error.userMessage;
      description = context ? `Contexto: ${context}` : "";
    } else if (error.response) {
      // Error con respuesta del servidor
      const status = error.response.status;
      title = `Error ${status}`;

      if (
        error.response.data &&
        typeof error.response.data === "object" &&
        "message" in error.response.data
      ) {
        description = (error.response.data as { message: string }).message;
      } else {
        switch (status) {
          case 400:
            description = "Datos inválidos en la solicitud";
            break;
          case 401:
            description =
              "Sesión expirada. Por favor, inicia sesión nuevamente";
            break;
          case 403:
            description = "No tienes permisos para esta acción";
            break;
          case 404:
            description = "Recurso no encontrado";
            break;
          case 409:
            description = "Conflicto con el estado actual del recurso";
            break;
          case 422:
            description = "Error de validación en los datos enviados";
            break;
          case 429:
            description = "Demasiadas solicitudes. Inténtalo más tarde";
            break;
          case 500:
            description = "Error interno del servidor";
            break;
          case 502:
            description = "Error de conexión con el servidor";
            break;
          case 503:
            description = "Servicio temporalmente no disponible";
            break;
          case 504:
            description = "Tiempo de espera agotado";
            break;
          default:
            description = "Error desconocido del servidor";
        }
      }
    } else if (error.request) {
      // Error de red
      title = "Error de conexión";
      description =
        "No se pudo conectar con el servidor. Verifica tu conexión a internet";
    } else {
      // Error de configuración u otro tipo
      title = "Error inesperado";
      description = error.message || "Ha ocurrido un error inesperado";
    }

    // Agregar contexto si se proporciona
    if (context && !description.includes("Contexto:")) {
      description = description ? `${description} (${context})` : context;
    }

    // Mostrar el toast de error
    showError(title, description);

    // En desarrollo, mostrar detalles técnicos en consola
    if (false) {
      if (false) {
        console.group("🔍 Error Details:");
        console.log("URL:", error.config?.url);
        console.log("Status:", error.response?.status);
        console.log("Data:", error.response?.data);
        console.groupEnd();
      }
    }
  };

  const handleAsyncOperation = async <T>(
    operation: () => Promise<T>,
    context?: string,
    options?: {
      showSuccessToast?: boolean;
      successMessage?: string;
      suppressErrorToast?: boolean;
    }
  ): Promise<T | null> => {
    try {
      const result = await operation();

      if (options?.showSuccessToast && options?.successMessage) {
        const { success } = useToast();
        success(options.successMessage);
      }

      return result;
    } catch (error) {
      if (!options?.suppressErrorToast) {
        handleError(error as ApiError, context);
      }
      return null;
    }
  };

  return {
    handleError,
    handleAsyncOperation,
  };
};

// Hook específico para operaciones CRUD comunes
export const useCrudErrorHandler = () => {
  const { handleError } = useErrorHandler();

  return {
    handleCreateError: (error: ApiError, resourceName: string) =>
      handleError(error, `Error al crear ${resourceName}`),

    handleUpdateError: (error: ApiError, resourceName: string) =>
      handleError(error, `Error al actualizar ${resourceName}`),

    handleDeleteError: (error: ApiError, resourceName: string) =>
      handleError(error, `Error al eliminar ${resourceName}`),

    handleFetchError: (error: ApiError, resourceName: string) =>
      handleError(error, `Error al cargar ${resourceName}`),

    handleSearchError: (error: ApiError) =>
      handleError(error, "Error al realizar la búsqueda"),
  };
};
