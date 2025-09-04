import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CaseForm from "../../components/forms/CaseForm";
import { type CaseFormSchema } from "../../lib/validations";
import { origensApi, applicationsApi, caseService } from "../../services/api";
import { type Origin, type Application } from "../../types/case";
import { PageWrapper } from "../../components/layout/PageWrapper";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { calcularPuntuacion, clasificarCaso } from "../../utils/caseUtils";

export const NewCasePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  // Estados principales
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para datos del formulario
  const [origenes, setOrigenes] = useState<Origin[]>([]);
  const [aplicaciones, setAplicaciones] = useState<Application[]>([]);
  const [origenesLoading, setOrigenesLoading] = useState(true);
  const [aplicacionesLoading, setAplicacionesLoading] = useState(true);

  // Estado para caso existente (cuando se edita)
  const [existingCase, setExistingCase] = useState<any>(null);

  useEffect(() => {
    loadData();
    if (isEditing && id) {
      loadExistingCase(id);
    }
  }, [id, isEditing]);

  const loadData = async () => {
    try {
      setOrigenesLoading(true);
      setAplicacionesLoading(true);

      const [origenesData, aplicacionesData] = await Promise.all([
        origensApi.getAll(),
        applicationsApi.getAll(),
      ]);

      setOrigenes(origenesData || []);
      setAplicaciones(aplicacionesData || []);
    } catch (error) {
      console.error("Error loading form data:", error);
      setError("Error al cargar los datos del formulario");
    } finally {
      setOrigenesLoading(false);
      setAplicacionesLoading(false);
    }
  };

  const loadExistingCase = async (caseId: string) => {
    try {
      setIsLoading(true);
      const caseData = await caseService.getCaseById(caseId);
      setExistingCase(caseData);
    } catch (error) {
      console.error("Error loading case:", error);
      setError("Error al cargar el caso para editar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: CaseFormSchema) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Calcular puntuación y clasificación
      const puntuacion = calcularPuntuacion(
        data.historialCaso,
        data.conocimientoModulo,
        data.manipulacionDatos,
        data.claridadDescripcion,
        data.causaFallo
      );

      const clasificacion = clasificarCaso(puntuacion);

      // Preparar datos para enviar al backend
      const formData = {
        numeroCaso: data.numeroCaso,
        descripcion: data.descripcion,
        fecha: data.fecha,
        originId: data.originId || undefined,
        applicationId: data.applicationId || undefined,
        historialCaso: data.historialCaso,
        conocimientoModulo: data.conocimientoModulo,
        manipulacionDatos: data.manipulacionDatos,
        claridadDescripcion: data.claridadDescripcion,
        causaFallo: data.causaFallo,
        puntuacion,
        clasificacion,
        estado: data.estado || ("nuevo" as const),
        observaciones: data.observaciones || undefined,
      };

      if (isEditing && id) {
        await caseService.updateCase(id, formData);
      } else {
        await caseService.createCase(formData);
      }

      // Delay más largo para asegurar que la DB se actualice antes de navegar
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Navegar con estado para indicar que se debe refrescar la lista
      navigate("/cases", { state: { refresh: true, updated: true } });
    } catch (error) {
      console.error("Error al guardar el caso:", error);
      setError("Error al guardar el caso. Por favor, inténtelo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Estados de carga para edición
  if (isEditing && isLoading) {
    return (
      <PageWrapper>
        <div className="flex justify-center items-center min-h-64">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            Cargando caso...
          </span>
        </div>
      </PageWrapper>
    );
  }

  if (isEditing && error && !existingCase) {
    return (
      <PageWrapper>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Error al cargar el caso
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate("/cases")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Volver a casos
          </button>
        </div>
      </PageWrapper>
    );
  }

  // Preparar valores por defecto para edición
  const defaultValues =
    isEditing && existingCase
      ? {
          numeroCaso: existingCase.numeroCaso,
          descripcion: existingCase.descripcion,
          fecha: existingCase.fecha,
          originId: existingCase.originId,
          applicationId: existingCase.applicationId,
          historialCaso: existingCase.historialCaso,
          conocimientoModulo: existingCase.conocimientoModulo,
          manipulacionDatos: existingCase.manipulacionDatos,
          claridadDescripcion: existingCase.claridadDescripcion,
          causaFallo: existingCase.causaFallo,
          estado: existingCase.estado,
          observaciones: existingCase.observaciones,
        }
      : {
          fecha: new Date().toISOString().split("T")[0], // Fecha actual por defecto
          estado: "nuevo" as const,
        };

  return (
    <PageWrapper>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isEditing ? "Editar Caso" : "Nuevo Caso"}
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              {isEditing
                ? "Modifique los datos del caso"
                : "Registre un nuevo caso en el sistema con criterios de calificación"}
            </p>
          </div>
          <button
            onClick={() => navigate("/cases")}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 font-medium"
          >
            ← Volver a casos
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
        <CaseForm
          onSubmit={handleSubmit}
          defaultValues={defaultValues}
          isLoading={isSubmitting}
          submitText={isEditing ? "Actualizar Caso" : "Registrar Caso"}
          origenes={origenes}
          aplicaciones={aplicaciones}
          origenesLoading={origenesLoading}
          aplicacionesLoading={aplicacionesLoading}
        />
      </div>
    </PageWrapper>
  );
};
