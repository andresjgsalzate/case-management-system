import { useState, useEffect } from "react";
import { TEAM_ROLES_CONFIG, TeamRoleConfig } from "../config/teamRoles";

export interface UseTeamRolesReturn {
  roles: TeamRoleConfig[];
  getRoleConfig: (value: string) => TeamRoleConfig | undefined;
  getRoleLabel: (value: string) => string;
  getRoleColor: (value: string) => string;
  getRoleLevel: (value: string) => number;
  isHigherRole: (roleA: string, roleB: string) => boolean;
  canManageRole: (userRole: string, targetRole: string) => boolean;
  addCustomRole: (role: TeamRoleConfig) => void;
  removeCustomRole: (value: string) => void;
  resetToDefaults: () => void;
}

export const useTeamRoles = (): UseTeamRolesReturn => {
  const [roles, setRoles] = useState<TeamRoleConfig[]>(TEAM_ROLES_CONFIG);

  // Cargar roles personalizados del localStorage si existen
  useEffect(() => {
    const savedRoles = localStorage.getItem("customTeamRoles");
    if (savedRoles) {
      try {
        const customRoles = JSON.parse(savedRoles);
        setRoles(customRoles);
      } catch (error) {
        console.error("Error loading custom team roles:", error);
        setRoles(TEAM_ROLES_CONFIG);
      }
    }
  }, []);

  // Guardar roles personalizados en localStorage
  const saveRoles = (newRoles: TeamRoleConfig[]) => {
    setRoles(newRoles);
    localStorage.setItem("customTeamRoles", JSON.stringify(newRoles));
  };

  const getRoleConfig = (value: string) => {
    return roles.find((role) => role.value === value);
  };

  const getRoleLabel = (value: string) => {
    return getRoleConfig(value)?.label || value;
  };

  const getRoleColor = (value: string) => {
    return getRoleConfig(value)?.color || "bg-gray-100 text-gray-800";
  };

  const getRoleLevel = (value: string) => {
    return getRoleConfig(value)?.level || 0;
  };

  const isHigherRole = (roleA: string, roleB: string) => {
    return getRoleLevel(roleA) > getRoleLevel(roleB);
  };

  const canManageRole = (userRole: string, targetRole: string) => {
    const userLevel = getRoleLevel(userRole);
    const targetLevel = getRoleLevel(targetRole);
    return userLevel >= targetLevel;
  };

  const addCustomRole = (role: TeamRoleConfig) => {
    const newRoles = [...roles, role].sort((a, b) => a.level - b.level);
    saveRoles(newRoles);
  };

  const removeCustomRole = (value: string) => {
    const newRoles = roles.filter((role) => role.value !== value);
    saveRoles(newRoles);
  };

  const resetToDefaults = () => {
    localStorage.removeItem("customTeamRoles");
    setRoles(TEAM_ROLES_CONFIG);
  };

  return {
    roles,
    getRoleConfig,
    getRoleLabel,
    getRoleColor,
    getRoleLevel,
    isHigherRole,
    canManageRole,
    addCustomRole,
    removeCustomRole,
    resetToDefaults,
  };
};
