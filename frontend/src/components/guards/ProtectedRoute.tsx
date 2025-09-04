import { Outlet, Navigate } from "react-router-dom";

export const ProtectedRoute = () => {
  // Temporal: siempre permitir acceso hasta que tengamos auth
  const isAuthenticated = true; // useAuth().isAuthenticated;

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
