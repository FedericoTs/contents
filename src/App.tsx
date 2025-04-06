import { Routes, Route, useRoutes, Navigate } from "react-router-dom";
import routes from "tempo-routes";
import { useEffect } from "react";
import Home from "./components/home";
import ContentInputPanel from "./components/ContentInputPanel";
import TransformationDashboard from "./components/TransformationDashboard";
import OutputPreview from "./components/OutputPreview";
import ProcessingQueue from "./components/ProcessingQueue";
import ResearchPage from "./components/ResearchPage";
import SettingsPage from "./components/SettingsPage";
import ContentArchivePage from "./components/ContentArchivePage";
import NavigationBar from "./components/NavigationBar";
import LandingPage from "./components/LandingPage";
import { checkSupabaseConnection } from "./services/supabase";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Protected route component that redirects to landing page if not authenticated
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  // Show nothing while checking authentication
  if (isLoading) {
    return null;
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  // Call useRoutes unconditionally at the top level
  const tempoRoutes = import.meta.env.VITE_TEMPO ? useRoutes(routes) : null;

  // Check Supabase connection on app initialization
  useEffect(() => {
    checkSupabaseConnection();
  }, []);

  return (
    <AuthProvider>
      {/* Render the tempo routes conditionally */}
      {tempoRoutes}
      <Routes>
        <Route path="/login" element={<LandingPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background flex flex-col">
                <NavigationBar />
                <main className="flex-1">
                  <Home />
                </main>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/input"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background flex flex-col">
                <NavigationBar />
                <main className="flex-1">
                  <ContentInputPanel />
                </main>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/transform"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background flex flex-col">
                <NavigationBar />
                <main className="flex-1">
                  <TransformationDashboard />
                </main>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/preview"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background flex flex-col">
                <NavigationBar />
                <main className="flex-1">
                  <OutputPreview />
                </main>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/queue"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background flex flex-col">
                <NavigationBar />
                <main className="flex-1">
                  <ProcessingQueue />
                </main>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/research"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background flex flex-col">
                <NavigationBar />
                <main className="flex-1">
                  <ResearchPage />
                </main>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/archive"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background flex flex-col">
                <NavigationBar />
                <main className="flex-1">
                  <ContentArchivePage />
                </main>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-background flex flex-col">
                <NavigationBar />
                <main className="flex-1">
                  <SettingsPage />
                </main>
              </div>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
