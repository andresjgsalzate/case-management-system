import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ActionIcon } from "../ui/ActionIcons";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { useAuth } from "../../contexts/AuthContext";
import { securityService } from "../../services/security.service";
import {
  createCaseControl,
  getCaseControls,
} from "../../services/api/caseControlApi";

// Tipos temporales - deberían estar en un archivo de tipos compartido
interface Case {
  id: string;
  numeroCaso: string;
  descripcion: string;
  clasificacion: string;
  estado: string;
  application?: {
    nombre: string;
  };
  origin?: {
    nombre: string;
  };
}

interface User {
  id: string;
  fullName: string;
  email: string;
}

interface CaseAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: () => void;
}

export const CaseAssignmentModal: React.FC<CaseAssignmentModalProps> = ({
  isOpen,
  onClose,
  onAssign,
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Obtener casos disponibles
  const { data: cases = [] } = useQuery({
    queryKey: ["cases"],
    queryFn: async (): Promise<Case[]> => {
      const tokens = securityService.getValidTokens();
      if (!tokens) {
        throw new Error("No valid authentication token");
      }

      const response = await fetch("http://localhost:3000/api/cases", {
        headers: {
          Authorization: `Bearer ${tokens.token}`,
        },
      });
      const result = await response.json();
      return result.data || [];
    },
    enabled: isOpen,
  });

  // Obtener casos ya asignados al control
  const { data: assignedCases = [] } = useQuery({
    queryKey: ["caseControls"],
    queryFn: getCaseControls,
    enabled: isOpen,
  });

  // Obtener usuarios disponibles
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<User[]> => {
      const tokens = securityService.getValidTokens();
      if (!tokens) {
        throw new Error("No valid authentication token");
      }

      const response = await fetch("http://localhost:3000/api/auth/users", {
        headers: {
          Authorization: `Bearer ${tokens.token}`,
        },
      });
      const result = await response.json();
      return result.data || [];
    },
    enabled: isOpen,
  });

  // Crear asignación de caso
  const createMutation = useMutation({
    mutationFn: createCaseControl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caseControls"] });
      onAssign();
      onClose();
      setSelectedCaseId("");
      setSelectedUserId("");
      setSearchTerm("");
    },
    onError: (error) => {
      console.error("Error al asignar caso:", error);
    },
  });

  // Filtrar casos por búsqueda y excluir los ya asignados
  const filteredCases = cases.filter((case_) => {
    // Excluir casos que ya están asignados al control
    const isAlreadyAssigned = assignedCases.some(
      (assignedCase) => assignedCase.case?.id === case_.id
    );

    if (isAlreadyAssigned) {
      return false;
    }

    // Filtrar por término de búsqueda
    return (
      case_.numeroCaso.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCaseId) {
      createMutation.mutate({
        caseId: selectedCaseId,
        userId: selectedUserId || user?.id, // Si no se selecciona usuario, usar el actual
      });
    }
  };

  const selectedCase = cases.find((c) => c.id === selectedCaseId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asignar Caso al Control"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Búsqueda de casos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Buscar Caso
          </label>
          <div className="relative">
            <ActionIcon
              action="search"
              size="sm"
              className="absolute left-3 top-1/2 transform -translate-y-1/2"
              color="neutral"
            />
            <Input
              placeholder="Buscar por número de caso o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Lista de casos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Seleccionar Caso *
          </label>
          <div className="max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md">
            {filteredCases.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No se encontraron casos
              </div>
            ) : (
              filteredCases.map((case_) => (
                <div
                  key={case_.id}
                  className={`p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selectedCaseId === case_.id
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
                      : ""
                  }`}
                  onClick={() => setSelectedCaseId(case_.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {case_.numeroCaso}
                        </span>
                        <Badge
                          variant={
                            case_.clasificacion === "Alta Complejidad"
                              ? "danger"
                              : case_.clasificacion === "Media Complejidad"
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {case_.clasificacion}
                        </Badge>
                        <Badge variant="info">{case_.estado}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {case_.descripcion}
                      </p>
                      <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-500">
                        {case_.application && (
                          <span>App: {case_.application.nombre}</span>
                        )}
                        {case_.origin && (
                          <span>Origen: {case_.origin.nombre}</span>
                        )}
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="selectedCase"
                      checked={selectedCaseId === case_.id}
                      onChange={() => setSelectedCaseId(case_.id)}
                      className="mt-1"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selección de usuario */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Asignar a Usuario
          </label>
          <Select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full"
          >
            <option value="">Auto-asignar al usuario actual</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName} ({user.email})
              </option>
            ))}
          </Select>
        </div>

        {/* Información del caso seleccionado */}
        {selectedCase && (
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Caso Seleccionado: {selectedCase.numeroCaso}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedCase.descripcion}
            </p>
          </Card>
        )}

        {/* Footer */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!selectedCaseId || createMutation.isPending}
          >
            {createMutation.isPending ? "Asignando..." : "Asignar Caso"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
