import React from "react";
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  DocumentDuplicateIcon,
  KeyIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
  StarIcon,
  TagIcon,
  FolderIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  UsersIcon,
  BuildingOfficeIcon,
  DocumentIcon,
  PaperClipIcon,
  LinkIcon,
  GlobeAltIcon,
  BellIcon,
  ChatBubbleLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  PrinterIcon,
  ShareIcon,
  BookmarkIcon,
  FlagIcon,
  FireIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  BoltIcon,
  LockClosedIcon,
  LockOpenIcon,
  CameraIcon,
  PhotoIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  WifiIcon,
  PowerIcon,
  SunIcon,
  MoonIcon,
  Cog6ToothIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  HomeIcon,
  Bars3Icon,
  ListBulletIcon,
  EyeSlashIcon,
  WrenchScrewdriverIcon,
  BookOpenIcon,
  TableCellsIcon,
  Squares2X2Icon,
  ServerIcon,
  CpuChipIcon,
  DocumentArrowDownIcon,
  ClipboardDocumentListIcon,
  PlayIcon,
  PauseIcon,
  CheckIcon,
  StopIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

// Tipos para los iconos de acción
export type ActionType =
  | "view"
  | "hide"
  | "edit"
  | "delete"
  | "activate"
  | "deactivate"
  | "duplicate"
  | "changePassword"
  | "add"
  | "search"
  | "filter"
  | "settings"
  | "export"
  | "download"
  | "upload"
  | "save"
  | "cancel"
  | "close"
  | "confirm"
  | "archive"
  | "restore"
  | "favorite"
  | "share"
  | "print"
  | "info"
  | "warning"
  | "success"
  | "error"
  | "tag"
  | "folder"
  | "user"
  | "users"
  | "building"
  | "document"
  | "attachment"
  | "link"
  | "globe"
  | "notification"
  | "chat"
  | "email"
  | "phone"
  | "bookmark"
  | "flag"
  | "fire"
  | "thumbUp"
  | "thumbDown"
  | "bolt"
  | "lock"
  | "unlock"
  | "shield"
  | "camera"
  | "photo"
  | "video"
  | "microphone"
  | "speaker"
  | "desktop"
  | "mobile"
  | "wifi"
  | "power"
  | "time"
  | "calendar"
  | "sun"
  | "moon"
  | "sortUp"
  | "sortDown"
  | "back"
  | "dashboard"
  | "analytics"
  | "logout"
  | "dropdown"
  | "chevronUp"
  | "home"
  | "menu"
  | "list"
  | "tool"
  | "book"
  | "table"
  | "grid"
  | "server"
  | "cpu"
  | "report"
  | "clipboard"
  | "play"
  | "pause"
  | "check"
  | "stop"
  | "arrowRight"
  | "loading"
  | "star"
  | "case";

// Tipos para tamaños
export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

// Tipos para variantes de color
export type ColorVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "neutral"
  | "blue"
  | "orange"
  | "red"
  | "green"
  | "yellow"
  | "purple"
  | "gray";

// Mapeo de iconos
const iconMap: Record<ActionType, React.ComponentType<any>> = {
  view: EyeIcon,
  hide: EyeSlashIcon,
  edit: PencilIcon,
  delete: TrashIcon,
  activate: ShieldCheckIcon,
  deactivate: ShieldExclamationIcon,
  duplicate: DocumentDuplicateIcon,
  changePassword: KeyIcon,
  add: PlusIcon,
  search: MagnifyingGlassIcon,
  filter: FunnelIcon,
  settings: Cog6ToothIcon,
  export: ArrowDownTrayIcon,
  download: ArrowDownTrayIcon,
  upload: ArrowDownTrayIcon,
  save: CheckCircleIcon,
  cancel: XCircleIcon,
  close: XMarkIcon,
  confirm: CheckCircleIcon,
  archive: ArchiveBoxIcon,
  restore: ArrowPathIcon,
  favorite: StarIcon,
  share: ShareIcon,
  print: PrinterIcon,
  info: InformationCircleIcon,
  warning: ExclamationTriangleIcon,
  success: CheckCircleIcon,
  error: XCircleIcon,
  tag: TagIcon,
  folder: FolderIcon,
  time: ClockIcon,
  calendar: CalendarIcon,
  table: TableCellsIcon,
  grid: Squares2X2Icon,
  server: ServerIcon,
  cpu: CpuChipIcon,
  user: UserIcon,
  users: UsersIcon,
  building: BuildingOfficeIcon,
  document: DocumentIcon,
  attachment: PaperClipIcon,
  link: LinkIcon,
  globe: GlobeAltIcon,
  notification: BellIcon,
  chat: ChatBubbleLeftIcon,
  email: EnvelopeIcon,
  phone: PhoneIcon,
  bookmark: BookmarkIcon,
  flag: FlagIcon,
  fire: FireIcon,
  thumbUp: HandThumbUpIcon,
  thumbDown: HandThumbDownIcon,
  bolt: BoltIcon,
  lock: LockClosedIcon,
  unlock: LockOpenIcon,
  shield: ShieldCheckIcon,
  camera: CameraIcon,
  photo: PhotoIcon,
  video: VideoCameraIcon,
  microphone: MicrophoneIcon,
  speaker: SpeakerWaveIcon,
  desktop: ComputerDesktopIcon,
  mobile: DevicePhoneMobileIcon,
  wifi: WifiIcon,
  power: PowerIcon,
  sun: SunIcon,
  moon: MoonIcon,
  sortUp: ArrowUpIcon,
  sortDown: ArrowDownIcon,
  back: ArrowLeftIcon,
  dashboard: ChartBarIcon,
  analytics: DocumentChartBarIcon,
  logout: ArrowRightOnRectangleIcon,
  dropdown: ChevronDownIcon,
  chevronUp: ChevronUpIcon,
  home: HomeIcon,
  menu: Bars3Icon,
  list: ListBulletIcon,
  tool: WrenchScrewdriverIcon,
  book: BookOpenIcon,
  report: DocumentArrowDownIcon,
  clipboard: ClipboardDocumentListIcon,
  play: PlayIcon,
  pause: PauseIcon,
  check: CheckIcon,
  stop: StopIcon,
  arrowRight: ArrowRightIcon,
  loading: ArrowPathIcon,
  star: StarIcon,
  case: FolderIcon,
};

// Mapeo de tamaños
const sizeMap: Record<IconSize, string> = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
};

// Mapeo de colores estándar
const colorMap: Record<ColorVariant, string> = {
  primary:
    "text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300",
  secondary:
    "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300",
  success:
    "text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300",
  danger:
    "text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300",
  warning:
    "text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300",
  info: "text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300",
  neutral:
    "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
  blue: "text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300",
  orange:
    "text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300",
  red: "text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300",
  green:
    "text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300",
  yellow:
    "text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300",
  purple:
    "text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300",
  gray: "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300",
};

// Mapeo de colores por acción (configuración por defecto)
const actionColorMap: Record<ActionType, ColorVariant> = {
  view: "blue",
  hide: "gray",
  edit: "orange",
  delete: "red",
  activate: "green",
  deactivate: "red",
  duplicate: "green",
  changePassword: "yellow",
  add: "blue",
  search: "blue",
  filter: "gray",
  settings: "gray",
  export: "blue",
  download: "blue",
  upload: "blue",
  save: "green",
  cancel: "gray",
  close: "gray",
  confirm: "green",
  archive: "yellow",
  restore: "green",
  favorite: "yellow",
  share: "blue",
  print: "gray",
  info: "blue",
  warning: "yellow",
  success: "green",
  error: "red",
  tag: "purple",
  folder: "blue",
  time: "blue",
  calendar: "blue",
  user: "blue",
  users: "blue",
  building: "gray",
  document: "blue",
  attachment: "gray",
  link: "blue",
  globe: "blue",
  notification: "yellow",
  chat: "blue",
  email: "blue",
  phone: "green",
  bookmark: "yellow",
  flag: "red",
  fire: "red",
  thumbUp: "green",
  thumbDown: "red",
  bolt: "yellow",
  lock: "red",
  unlock: "green",
  shield: "green",
  camera: "blue",
  photo: "blue",
  video: "purple",
  microphone: "green",
  speaker: "blue",
  desktop: "gray",
  mobile: "gray",
  wifi: "blue",
  power: "red",
  sun: "yellow",
  moon: "blue",
  sortUp: "gray",
  sortDown: "gray",
  back: "blue",
  dashboard: "blue",
  analytics: "purple",
  logout: "red",
  dropdown: "gray",
  chevronUp: "gray",
  home: "blue",
  menu: "gray",
  list: "blue",
  tool: "orange",
  book: "blue",
  table: "gray",
  grid: "blue",
  server: "blue",
  cpu: "purple",
  report: "green",
  clipboard: "blue",
  play: "green",
  pause: "orange",
  check: "success",
  stop: "red",
  arrowRight: "blue",
  loading: "blue",
  star: "yellow",
  case: "blue",
};

// Props del componente
export interface ActionIconProps {
  /** Tipo de icono a mostrar */
  action: ActionType;
  /** Tamaño del icono (por defecto 'sm' = w-4 h-4) */
  size?: IconSize;
  /** Variante de color (si no se especifica, usa el color por defecto para la acción) */
  color?: ColorVariant;
  /** Clases CSS adicionales */
  className?: string;
  /** Título/tooltip del icono */
  title?: string;
  /** Función a ejecutar al hacer click */
  onClick?: () => void;
  /** Si el icono está deshabilitado */
  disabled?: boolean;
  /** Props adicionales para el elemento button/span */
  [key: string]: any;
}

/**
 * Componente de icono de acción estandarizado
 *
 * @example
 * // Icono básico de editar
 * <ActionIcon action="edit" />
 *
 * @example
 * // Icono de eliminar con click handler
 * <ActionIcon
 *   action="delete"
 *   onClick={() => handleDelete(item)}
 *   title="Eliminar elemento"
 * />
 *
 * @example
 * // Icono personalizado con tamaño y color específicos
 * <ActionIcon
 *   action="view"
 *   size="lg"
 *   color="purple"
 *   className="custom-class"
 * />
 */
export const ActionIcon: React.FC<ActionIconProps> = ({
  action,
  size = "sm",
  color,
  className = "",
  title,
  onClick,
  disabled = false,
  ...props
}) => {
  const IconComponent = iconMap[action];
  const sizeClass = sizeMap[size];
  const colorClass = colorMap[color || actionColorMap[action]];

  const combinedClassName = `
    ${sizeClass} 
    ${disabled ? "opacity-50 cursor-not-allowed" : colorClass} 
    ${onClick ? "cursor-pointer" : ""} 
    ${className}
  `.trim();

  if (onClick) {
    return (
      <button
        onClick={disabled ? undefined : onClick}
        className={`p-1 rounded transition-colors ${
          disabled
            ? "cursor-not-allowed"
            : "hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
        title={title}
        disabled={disabled}
        {...props}
      >
        <IconComponent className={combinedClassName} />
      </button>
    );
  }

  return (
    <span title={title} {...props}>
      <IconComponent className={combinedClassName} />
    </span>
  );
};

// Componentes de conveniencia para acciones comunes
export const ViewIcon = (props: Omit<ActionIconProps, "action">) => (
  <ActionIcon action="view" {...props} />
);

export const EditIcon = (props: Omit<ActionIconProps, "action">) => (
  <ActionIcon action="edit" {...props} />
);

export const DeleteIcon = (props: Omit<ActionIconProps, "action">) => (
  <ActionIcon action="delete" {...props} />
);

export const ActivateIcon = (props: Omit<ActionIconProps, "action">) => (
  <ActionIcon action="activate" {...props} />
);

export const DeactivateIcon = (props: Omit<ActionIconProps, "action">) => (
  <ActionIcon action="deactivate" {...props} />
);

export const DuplicateIcon = (props: Omit<ActionIconProps, "action">) => (
  <ActionIcon action="duplicate" {...props} />
);

export const ChangePasswordIcon = (props: Omit<ActionIconProps, "action">) => (
  <ActionIcon action="changePassword" {...props} />
);

export const AddIcon = (props: Omit<ActionIconProps, "action">) => (
  <ActionIcon action="add" {...props} />
);

export const SearchIcon = (props: Omit<ActionIconProps, "action">) => (
  <ActionIcon action="search" {...props} />
);

export const FilterIcon = (props: Omit<ActionIconProps, "action">) => (
  <ActionIcon action="filter" {...props} />
);

export const SettingsIcon = (props: Omit<ActionIconProps, "action">) => (
  <ActionIcon action="settings" {...props} />
);

export const ExportIcon = (props: Omit<ActionIconProps, "action">) => (
  <ActionIcon action="export" {...props} />
);

export const ArchiveIcon = (props: Omit<ActionIconProps, "action">) => (
  <ActionIcon action="archive" {...props} />
);

export const RestoreIcon = (props: Omit<ActionIconProps, "action">) => (
  <ActionIcon action="restore" {...props} />
);

export const ThemeSunIcon = (props: Omit<ActionIconProps, "action">) => (
  <ActionIcon action="sun" {...props} />
);

export const ThemeMoonIcon = (props: Omit<ActionIconProps, "action">) => (
  <ActionIcon action="moon" {...props} />
);

export const CloseIcon = (props: Omit<ActionIconProps, "action">) => (
  <ActionIcon action="close" {...props} />
);

export const SortUpIcon = (props: Omit<ActionIconProps, "action">) => (
  <ActionIcon action="sortUp" {...props} />
);

export const SortDownIcon = (props: Omit<ActionIconProps, "action">) => (
  <ActionIcon action="sortDown" {...props} />
);

export const CalendarActionIcon = (props: Omit<ActionIconProps, "action">) => (
  <ActionIcon action="calendar" {...props} />
);

export const EmailActionIcon = (props: Omit<ActionIconProps, "action">) => (
  <ActionIcon action="email" {...props} />
);

export const WarningIcon = (props: Omit<ActionIconProps, "action">) => (
  <ActionIcon action="warning" {...props} />
);

export const TimeIcon = (props: Omit<ActionIconProps, "action">) => (
  <ActionIcon action="time" {...props} />
);

// Componente para iconos de estado (activar/desactivar dinámico)
export interface StatusIconProps extends Omit<ActionIconProps, "action"> {
  /** Si el elemento está activo o no */
  isActive: boolean;
  /** Texto para el estado activo */
  activeTitle?: string;
  /** Texto para el estado inactivo */
  inactiveTitle?: string;
}

/**
 * Componente de icono de estado que cambia entre activar/desactivar
 *
 * @example
 * <StatusIcon
 *   isActive={user.isActive}
 *   onClick={() => toggleUserStatus(user)}
 *   activeTitle="Desactivar usuario"
 *   inactiveTitle="Activar usuario"
 * />
 */
export const StatusIcon: React.FC<StatusIconProps> = ({
  isActive,
  activeTitle = "Desactivar",
  inactiveTitle = "Activar",
  ...props
}) => {
  return (
    <ActionIcon
      action={isActive ? "deactivate" : "activate"}
      title={isActive ? activeTitle : inactiveTitle}
      {...props}
    />
  );
};

// Hook para usar iconos de acción en diferentes contextos
export const useActionIcons = () => {
  return {
    ActionIcon,
    ViewIcon,
    EditIcon,
    DeleteIcon,
    ActivateIcon,
    DeactivateIcon,
    DuplicateIcon,
    ChangePasswordIcon,
    AddIcon,
    SearchIcon,
    FilterIcon,
    SettingsIcon,
    ExportIcon,
    ArchiveIcon,
    RestoreIcon,
    StatusIcon,
    // Constantes útiles
    sizes: sizeMap,
    colors: colorMap,
    actionColors: actionColorMap,
  };
};

export default ActionIcon;
