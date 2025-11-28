// Configuración de roles de equipo
// Este archivo permite configurar los roles disponibles de forma dinámica

export interface TeamRoleConfig {
  value: string;
  label: string;
  color: string;
  level: number; // Nivel jerárquico (mayor número = mayor autoridad)
  description: string;
}

// Configuración de roles disponibles
export const TEAM_ROLES_CONFIG: TeamRoleConfig[] = [
  {
    value: "member",
    label: "Miembro",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    level: 1,
    description: "Miembro regular del equipo",
  },
  {
    value: "senior",
    label: "Senior",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-300",
    level: 2,
    description: "Miembro senior con experiencia",
  },
  {
    value: "lead",
    label: "Lead",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-300",
    level: 3,
    description: "Líder técnico del equipo",
  },
  {
    value: "manager",
    label: "Manager",
    color: "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-300",
    level: 4,
    description: "Gerente del equipo",
  },
];

// Funciones utilitarias
export const getTeamRoleConfig = (
  value: string
): TeamRoleConfig | undefined => {
  return TEAM_ROLES_CONFIG.find((role) => role.value === value);
};

export const getTeamRoleLabel = (value: string): string => {
  return getTeamRoleConfig(value)?.label || value;
};

export const getTeamRoleColor = (value: string): string => {
  return getTeamRoleConfig(value)?.color || "bg-gray-100 text-gray-800";
};

export const getTeamRoleLevel = (value: string): number => {
  return getTeamRoleConfig(value)?.level || 0;
};

// Para mantener compatibilidad con el código existente
export enum TeamRole {
  MEMBER = "member",
  SENIOR = "senior",
  LEAD = "lead",
  MANAGER = "manager",
}

// Mapa de roles para compatibilidad
export const TeamRoleLabels: Record<string, string> = TEAM_ROLES_CONFIG.reduce(
  (acc, role) => {
    acc[role.value] = role.label;
    return acc;
  },
  {} as Record<string, string>
);
