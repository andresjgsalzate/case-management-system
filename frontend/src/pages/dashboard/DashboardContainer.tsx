import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useAuthStore } from "../../stores/authStore";
import { AdvancedDashboardPage } from "./AdvancedDashboardPage";
import { LoadingPage } from "../../components/ui/LoadingPage";

export const DashboardContainer: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { isLoadingPermissions, permissionsLoaded } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);

  const loadingSteps = [
    "Autenticando usuario...",
    "Cargando permisos...",
    "Preparando dashboard...",
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentStep(0);
    } else if (isLoadingPermissions || !permissionsLoaded) {
      setCurrentStep(1);
    } else {
      setCurrentStep(2);
    }
  }, [isAuthenticated, isLoadingPermissions, permissionsLoaded]);

  // Si no está autenticado, no mostrar nada (el router se encargará)
  if (!isAuthenticated) {
    return null;
  }

  // Solo mostrar loading mientras cargan los permisos, NO las métricas
  if (isLoadingPermissions || !permissionsLoaded) {
    return (
      <LoadingPage
        title="Preparando Dashboard"
        subtitle={`Bienvenido ${
          user?.fullName || "Usuario"
        }, configurando tu dashboard...`}
        steps={loadingSteps}
        currentStep={currentStep}
      />
    );
  }

  // Permisos cargados, mostrar dashboard (las métricas se cargan en background)
  return <AdvancedDashboardPage />;
};
