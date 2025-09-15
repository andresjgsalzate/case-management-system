import React, { useEffect, useRef } from "react";
import { useAuthStore } from "../stores/authStore";

export const PermissionDebug: React.FC = () => {
  const {
    user,
    token,
    userPermissions,
    userModules,
    permissionsLoaded,
    isLoadingPermissions,
    loadUserPermissions,
    refreshPermissions,
    logout,
    hasPermission,
    canAccessModule,
  } = useAuthStore();

  const loadAttempted = useRef(false);
  const lastError = useRef<string | null>(null);

  useEffect(() => {
    // Solo intentar cargar una vez si hay usuario y no se han cargado
    if (
      user &&
      token &&
      !permissionsLoaded &&
      !isLoadingPermissions &&
      !loadAttempted.current
    ) {
      loadAttempted.current = true;
      lastError.current = null;

      loadUserPermissions().catch((error) => {
        console.error("❌ PermissionDebug - Error cargando permisos:", error);
        lastError.current = error.message;

        // NO reintentar si es error 401 (token inválido)
        if (error.message.includes("401")) {
          console.warn(
            "🚨 PermissionDebug - Error 401, token inválido. No reintentando."
          );
          // loadAttempted permanece en true para evitar reintentos
        } else {
          // Solo reintentar para otros tipos de error
          loadAttempted.current = false;
        }
      });
    }
  }, [
    user,
    token,
    permissionsLoaded,
    isLoadingPermissions,
    loadUserPermissions,
  ]);

  // Reset del flag cuando cambia el usuario
  useEffect(() => {
    loadAttempted.current = false;
  }, [user?.id]);

  if (!user) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong>🚫 Debug:</strong> No hay usuario autenticado
      </div>
    );
  }

  if (isLoadingPermissions) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        <strong>⏳ Debug:</strong> Cargando permisos...
      </div>
    );
  }

  return (
    <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
      <div className="font-bold mb-2">🔧 Debug de Permisos</div>
      <div className="text-sm space-y-1">
        <p>
          <strong>👤 Usuario:</strong> {user.fullName} ({user.email})
        </p>
        <p>
          <strong>🆔 ID:</strong> {user.id}
        </p>
        <p>
          <strong>👑 Rol:</strong> {user.roleName}
        </p>
        <p>
          <strong>🔑 Token:</strong>{" "}
          {token ? `Sí (${token.length} chars)` : "No"}
        </p>
        <p>
          <strong>✅ Permisos cargados:</strong>{" "}
          {permissionsLoaded ? "Sí" : "No"}
        </p>
        <p>
          <strong>⏳ Cargando permisos:</strong>{" "}
          {isLoadingPermissions ? "Sí" : "No"}
        </p>
        {lastError.current && (
          <p>
            <strong>❌ Último error:</strong>{" "}
            <span className="text-red-600">{lastError.current}</span>
          </p>
        )}
        <p>
          <strong>🔑 Total de permisos:</strong> {userPermissions.length}
        </p>
        <p>
          <strong>📦 Total de módulos:</strong> {userModules.length}
        </p>

        {permissionsLoaded && (
          <>
            <div className="mt-2">
              <strong>Permisos:</strong>
              <ul className="list-disc list-inside ml-4">
                {userPermissions.map((p) => (
                  <li
                    key={p.id}
                    className={p.isActive ? "text-green-600" : "text-red-600"}
                  >
                    {p.name} {p.isActive ? "✓" : "✗"}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-2">
              <strong>Módulos:</strong>
              <ul className="list-disc list-inside ml-4">
                {userModules.map((m) => (
                  <li key={m} className="text-green-600">
                    {m}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-2">
              <strong>Tests:</strong>
              <ul className="list-disc list-inside ml-4">
                <li>
                  hasPermission('casos.ver.all'):{" "}
                  {hasPermission("casos.ver.all") ? "✓" : "✗"}
                </li>
                <li>
                  canAccessModule('casos'):{" "}
                  {canAccessModule("casos") ? "✓" : "✗"}
                </li>
                <li>
                  hasPermission('permissions.read_all'):{" "}
                  {hasPermission("permissions.read_all") ? "✓" : "✗"}
                </li>
                <li>
                  canAccessModule('todos'):{" "}
                  {canAccessModule("todos") ? "✓" : "✗"}
                </li>
              </ul>
            </div>
          </>
        )}

        {/* Botones de acción */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              loadAttempted.current = false;
              lastError.current = null;
              refreshPermissions();
            }}
            className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
            disabled={isLoadingPermissions}
          >
            🔄 Recargar Permisos
          </button>

          {lastError.current && lastError.current.includes("401") && (
            <button
              onClick={() => {
                logout();
              }}
              className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
            >
              🚪 Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
