import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CloseIcon } from "../ui/ActionIcons";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { TextArea } from "../ui/TextArea";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import {
  dispositionSchema,
  type DispositionFormData,
} from "../../lib/validations/dispositionValidations";
import { useCases } from "../../hooks/useCases";
import { useApplications } from "../../hooks/useApplications";
import type { Case } from "../../services/api";

interface DispositionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DispositionFormData) => void;
  initialData?: DispositionFormData;
  isEdit?: boolean;
  loading?: boolean;
}

export const DispositionForm: React.FC<DispositionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEdit = false,
  loading = false,
}) => {
  const { data: cases = [], isLoading: casesLoading } = useCases();
  const { data: applications = [], isLoading: applicationsLoading } =
    useApplications();

  const [caseSearch, setCaseSearch] = useState("");
  const [showCaseDropdown, setShowCaseDropdown] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<DispositionFormData>({
    resolver: zodResolver(dispositionSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      caseNumber: "",
      scriptName: "",
      svnRevisionNumber: "",
      applicationId: "",
      observations: "",
    },
  });

  const watchedCaseNumber = watch("caseNumber");

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (isOpen && initialData) {
      reset({
        date: initialData.date,
        caseNumber: initialData.caseNumber,
        scriptName: initialData.scriptName,
        svnRevisionNumber: initialData.svnRevisionNumber || "",
        applicationId: initialData.applicationId,
        observations: initialData.observations || "",
      });

      // Buscar el caso por número
      if (initialData.caseNumber) {
        setCaseSearch(initialData.caseNumber);
        if (cases.length > 0) {
          const foundCase = cases.find(
            (c) => c.numeroCaso === initialData.caseNumber
          );
          if (foundCase) {
            setSelectedCase(foundCase);
            setValue("caseId", foundCase.id);
          }
        }
      }
    } else if (isOpen && !initialData) {
      // Limpiar formulario para nueva disposición
      reset({
        date: new Date().toISOString().split("T")[0],
        caseNumber: "",
        scriptName: "",
        svnRevisionNumber: "",
        applicationId: "",
        observations: "",
      });
      setSelectedCase(null);
      setCaseSearch("");
    }
  }, [isOpen, initialData, cases, reset, setValue]);

  // Efecto para actualizar caso seleccionado cuando cambia caseNumber
  useEffect(() => {
    if (watchedCaseNumber && cases.length > 0) {
      const foundCase = cases.find((c) => c.numeroCaso === watchedCaseNumber);
      if (
        foundCase &&
        (!selectedCase || selectedCase.numeroCaso !== foundCase.numeroCaso)
      ) {
        setSelectedCase(foundCase);
        setValue("caseId", foundCase.id);
      } else if (!foundCase && selectedCase) {
        setSelectedCase(null);
        setValue("caseId", undefined);
      }
    }
  }, [watchedCaseNumber, cases, selectedCase, setValue]);

  // Filtrar casos basado en la búsqueda - Solo por número de caso
  const filteredCases = cases.filter((caso) =>
    caso.numeroCaso.toLowerCase().includes(caseSearch.toLowerCase())
  );

  const handleCaseSelect = (caso: Case) => {
    setSelectedCase(caso);
    setCaseSearch(caso.numeroCaso);
    setValue("caseNumber", caso.numeroCaso);
    setValue("caseId", caso.id);
    setShowCaseDropdown(false);
  };

  const handleCaseSearchChange = (value: string) => {
    setCaseSearch(value);
    setValue("caseNumber", value);
    setShowCaseDropdown(true);

    // Si el valor coincide exactamente con un caso, seleccionarlo
    const exactMatch = cases.find((c) => c.numeroCaso === value);
    if (exactMatch) {
      setSelectedCase(exactMatch);
      setValue("caseId", exactMatch.id);
    } else {
      setSelectedCase(null);
      setValue("caseId", undefined);
    }
  };

  const handleFormSubmit = (data: DispositionFormData) => {
    onSubmit(data);
  };

  const handleClose = () => {
    reset();
    setSelectedCase(null);
    setCaseSearch("");
    setShowCaseDropdown(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? "Editar Disposición" : "Nueva Disposición"}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Fecha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fecha *
          </label>
          <Input
            type="date"
            {...register("date")}
            error={errors.date?.message}
            max={new Date().toISOString().split("T")[0]}
          />
        </div>

        {/* Búsqueda de Caso */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Número de Caso *
          </label>
          <div className="relative">
            <Input
              value={caseSearch}
              onChange={(e) => handleCaseSearchChange(e.target.value)}
              placeholder="Buscar caso por número..."
              error={errors.caseNumber?.message}
              onFocus={() => setShowCaseDropdown(true)}
            />

            {/* Dropdown de casos */}
            {showCaseDropdown && caseSearch && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                {casesLoading ? (
                  <div className="p-4 text-center">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : filteredCases.length > 0 ? (
                  filteredCases.slice(0, 10).map((caso) => (
                    <Button
                      key={caso.id}
                      type="button"
                      onClick={() => handleCaseSelect(caso)}
                      variant="ghost"
                      size="sm"
                      className="w-full px-4 py-2 text-left justify-start h-auto"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">
                        {caso.numeroCaso}
                      </span>
                    </Button>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron casos
                  </div>
                )}
                <Button
                  type="button"
                  onClick={() => setShowCaseDropdown(false)}
                  variant="ghost"
                  size="sm"
                  className="w-full border-t border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-none"
                >
                  Cerrar
                </Button>
              </div>
            )}
          </div>

          {/* Información del caso seleccionado */}
          {selectedCase && (
            <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Caso: {selectedCase.numeroCaso}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    {selectedCase.descripcion}
                  </p>
                  <p className="text-xs text-green-500 dark:text-green-400 mt-1">
                    Clasificación: {selectedCase.clasificacion} | Estado:{" "}
                    {selectedCase.estado}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setSelectedCase(null);
                    setCaseSearch("");
                    setValue("caseNumber", "");
                    setValue("caseId", undefined);
                  }}
                  variant="ghost"
                  size="xs"
                  className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 p-1"
                >
                  <CloseIcon size="sm" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Nombre del Script */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre del Script *
          </label>
          <Input
            {...register("scriptName")}
            placeholder="Ej: migracion_datos_v1.sql"
            error={errors.scriptName?.message}
          />
        </div>

        {/* Número de Revisión SVN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Número de Revisión SVN
          </label>
          <Input
            {...register("svnRevisionNumber")}
            placeholder="Ej: 12345"
            error={errors.svnRevisionNumber?.message}
          />
        </div>

        {/* Aplicación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Aplicación *
          </label>
          <Select
            {...register("applicationId")}
            error={errors.applicationId?.message}
            disabled={applicationsLoading}
          >
            <option value="">Seleccionar aplicación</option>
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.nombre}
              </option>
            ))}
          </Select>
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Observaciones
          </label>
          <TextArea
            {...register("observations")}
            placeholder="Observaciones adicionales sobre la disposición..."
            rows={3}
            error={errors.observations?.message}
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="min-w-[120px]">
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : isEdit ? (
              "Actualizar"
            ) : (
              "Crear"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
