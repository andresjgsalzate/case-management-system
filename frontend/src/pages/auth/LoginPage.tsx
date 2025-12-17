import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { securityService } from "../../services/security.service";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, error } = useAuthStore();
  const [credentials, setCredentials] = useState({
    email: "andresjgsalzate@gmail.com", // Prellenado para desarrollo
    password: "123456", // Prellenado para desarrollo
  });
  const [showManualLogin, setShowManualLogin] = useState(false);

  // Si ya está autenticado, redirigir al dashboard
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Auto-login para desarrollo
  useEffect(() => {
    if (!showManualLogin && !isAuthenticated && !isLoading) {
      handleAutoLogin();
    }
  }, [showManualLogin, isAuthenticated, isLoading]);

  const handleAutoLogin = async () => {
    try {
      // Limpiar completamente la sesión antes del login
      console.log("🧹 Limpiando sesión antes del auto-login...");
      localStorage.clear();
      sessionStorage.clear();
      securityService.clearSession();

      await login(credentials.email, credentials.password);
      navigate("/");
    } catch (error) {
      console.error("Auto-login falló:", error);
      setShowManualLogin(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Limpiar completamente la sesión antes del login
      console.log("🧹 Limpiando sesión antes del login manual...");
      localStorage.clear();
      sessionStorage.clear();
      securityService.clearSession();

      await login(credentials.email, credentials.password);
      navigate("/");
    } catch (error) {
      console.error("Login falló:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  // Mostrar formulario solo si el auto-login falló
  if (!showManualLogin) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">
              Iniciando sesión automáticamente...
            </p>
            <button
              onClick={() => setShowManualLogin(true)}
              className="mt-4 text-indigo-600 hover:text-indigo-500 text-sm underline"
            >
              Mostrar formulario de login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Iniciar sesión
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={credentials.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={credentials.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
