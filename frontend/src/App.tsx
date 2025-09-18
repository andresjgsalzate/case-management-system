import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./providers/ThemeProvider";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SmartRedirect } from "./components/SmartRedirect";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardContainer } from "./pages/dashboard/DashboardContainer";
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
import OriginsPage from "./pages/admin/OriginsPage";
import ApplicationsPage from "./pages/admin/ApplicationsPage";
import CaseStatusesPage from "./pages/admin/CaseStatusesPage";
import TagsPage from "./pages/tags/TagsPage";
import DocumentTypesPage from "./pages/document-types/DocumentTypesPage";
import { TodoPrioritiesPage } from "./pages/admin/TodoPrioritiesPage";
// Audit imports
import { AuditLogsPage } from "./pages/audit";
// Knowledge Base imports
import KnowledgeBase from "./pages/KnowledgeBase";
import KnowledgeDocumentForm from "./pages/KnowledgeDocumentForm";
import KnowledgeDocumentView from "./pages/KnowledgeDocumentView";
// System imports
import { SystemInfoPage } from "./pages/SystemInfoPage";
// Security imports
import { useSecureAuth } from "./hooks/useSecureAuth";
import { SessionTimeoutWarning } from "./components/SessionTimeoutWarning";

function App() {
  // Inicializar el sistema de seguridad
  useSecureAuth();

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
                  <Layout>
                    <SmartRedirect />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredPermission="dashboard.ver.own">
                  <Layout>
                    <DashboardContainer />
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
                <ProtectedRoute requiredPermission="cases.create.all">
                  <Layout>
                    <NewCasePage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/cases/edit/:id"
              element={
                <ProtectedRoute requiredPermission="cases.edit.all">
                  <Layout>
                    <NewCasePage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/cases/view/:id"
              element={
                <ProtectedRoute requiredPermission="cases.view.all">
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
                <ProtectedRoute requiredPermission="archive.view.own">
                  <Layout>
                    <ArchivePage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Knowledge Base Routes */}
            <Route
              path="/knowledge"
              element={
                <ProtectedRoute
                  requiredPermissions={[
                    "knowledge.read.own",
                    "knowledge.read.team",
                    "knowledge.read.all",
                  ]}
                >
                  <Layout>
                    <KnowledgeBase />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/knowledge/new"
              element={
                <ProtectedRoute
                  requiredPermissions={[
                    "knowledge.create.own",
                    "knowledge.create.team",
                    "knowledge.create.all",
                  ]}
                >
                  <Layout>
                    <KnowledgeDocumentForm />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/knowledge/:id"
              element={
                <ProtectedRoute
                  requiredPermissions={[
                    "knowledge.read.own",
                    "knowledge.read.team",
                    "knowledge.read.all",
                  ]}
                >
                  <Layout>
                    <KnowledgeDocumentView />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/knowledge/:id/edit"
              element={
                <ProtectedRoute
                  requiredPermissions={[
                    "knowledge.update.own",
                    "knowledge.update.team",
                    "knowledge.update.all",
                  ]}
                >
                  <Layout>
                    <KnowledgeDocumentForm />
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
                <ProtectedRoute requiredPermission="roles.view.all">
                  <Layout>
                    <RolesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/permissions"
              element={
                <ProtectedRoute requiredPermission="permissions.read.all">
                  <Layout>
                    <PermissionsManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/permissions/role-assignment"
              element={
                <ProtectedRoute requiredPermission="permissions.assign.all">
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
              path="/admin/origins"
              element={
                <ProtectedRoute adminOnly>
                  <Layout>
                    <OriginsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/applications"
              element={
                <ProtectedRoute adminOnly>
                  <Layout>
                    <ApplicationsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/case-statuses"
              element={
                <ProtectedRoute adminOnly>
                  <Layout>
                    <CaseStatusesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/tags"
              element={
                <ProtectedRoute requiredPermission="tags.manage.all">
                  <Layout>
                    <TagsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/document-types"
              element={
                <ProtectedRoute requiredPermission="knowledge_types.read.all">
                  <Layout>
                    <DocumentTypesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/todo-priorities"
              element={
                <ProtectedRoute requiredPermission="todos.create.all">
                  <Layout>
                    <TodoPrioritiesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/audit"
              element={
                <ProtectedRoute requiredPermission="audit.view.all">
                  <Layout>
                    <AuditLogsPage />
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

            <Route
              path="/system/info"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SystemInfoPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
          <SessionTimeoutWarning />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
