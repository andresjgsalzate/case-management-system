import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { ThemeProvider } from "./providers/ThemeProvider";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AdvancedDashboardPage } from "./pages/dashboard/AdvancedDashboardPage";
import { CasesPage, NewCasePage, CaseDetailPage } from "./pages/cases";
import { CaseControlPage } from "./pages/cases/CaseControlPage";
import { DispositionsPage } from "./pages/dispositions/DispositionsPage";
import { UsersPage } from "./pages/users/UsersPage";
import { RolesPage } from "./pages/roles/RolesPage";
import { SystemStatusPage } from "./pages/system/SystemStatusPage";
import { NotesPage } from "./pages/notes/NotesPage";
import { ArchivePage } from "./pages/archive/ArchivePage";
import {
  PermissionRoleAssignment,
  PermissionsGuide,
} from "./pages/permissions";
import PermissionsManagement from "./pages/admin/PermissionsManagement";
import TodosPage from "./pages/TodosPage";
import ModernTodosPage from "./pages/ModernTodosPage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";
import { initializeAuth } from "./stores/authStore";

function App() {
  // Inicializar el estado de autenticación al cargar la aplicación
  useEffect(() => {
    const initApp = async () => {
      try {
        await initializeAuth();
      } catch (error) {
        console.error("Error inicializando la aplicación:", error);
      }
    };

    initApp();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Rutas protegidas */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AdvancedDashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/cases"
              element={
                <ProtectedRoute requiredModule="casos">
                  <Layout>
                    <CasesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/cases/new"
              element={
                <ProtectedRoute requiredPermission="casos.crear.all">
                  <Layout>
                    <NewCasePage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/cases/edit/:id"
              element={
                <ProtectedRoute requiredPermission="casos.editar.all">
                  <Layout>
                    <NewCasePage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/cases/view/:id"
              element={
                <ProtectedRoute requiredPermission="casos.ver.all">
                  <Layout>
                    <CaseDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/case-control"
              element={
                <ProtectedRoute requiredModule="casos">
                  <Layout>
                    <CaseControlPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/notes"
              element={
                <ProtectedRoute requiredModule="notas">
                  <Layout>
                    <NotesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/todos"
              element={
                <ProtectedRoute requiredModule="todos">
                  <Layout>
                    <ModernTodosPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/todos-basic"
              element={
                <ProtectedRoute requiredModule="todos">
                  <Layout>
                    <TodosPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dispositions"
              element={
                <ProtectedRoute requiredModule="disposiciones">
                  <Layout>
                    <DispositionsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/archive"
              element={
                <ProtectedRoute requiredPermission="archive.view">
                  <Layout>
                    <ArchivePage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute requiredPermission="usuarios.ver.all">
                  <Layout>
                    <UsersPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/roles"
              element={
                <ProtectedRoute requiredPermission="roles:view:all">
                  <Layout>
                    <RolesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/permissions"
              element={
                <ProtectedRoute requiredPermission="permissions.read_all">
                  <Layout>
                    <PermissionsManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/permissions/role-assignment"
              element={
                <ProtectedRoute requiredPermission="permissions.assign_all">
                  <Layout>
                    <PermissionRoleAssignment />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/permissions/guide"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PermissionsGuide />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/system/status"
              element={
                <ProtectedRoute requiredPermission="dashboard.ver.all">
                  <Layout>
                    <SystemStatusPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
