import { Routes, Route, useRoutes } from "react-router-dom";
import routes from "tempo-routes";
import Home from "./components/home";
import ContentInputPanel from "./components/ContentInputPanel";
import TransformationDashboard from "./components/TransformationDashboard";
import OutputPreview from "./components/OutputPreview";
import ProcessingQueue from "./components/ProcessingQueue";
import ResearchPage from "./components/ResearchPage";
import SettingsPage from "./components/SettingsPage";
import ContentArchivePage from "./components/ContentArchivePage";
import NavigationBar from "./components/NavigationBar";

export default function App() {
  // Call useRoutes unconditionally at the top level
  const tempoRoutes = import.meta.env.VITE_TEMPO ? useRoutes(routes) : null;

  return (
    <>
      {/* Render the tempo routes conditionally */}
      {tempoRoutes}

      <div className="min-h-screen bg-background flex flex-col">
        <NavigationBar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/input" element={<ContentInputPanel />} />
            <Route path="/transform" element={<TransformationDashboard />} />
            <Route path="/preview" element={<OutputPreview />} />
            <Route path="/queue" element={<ProcessingQueue />} />
            <Route path="/research" element={<ResearchPage />} />
            <Route path="/archive" element={<ContentArchivePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <footer className="border-t py-3 bg-background mt-auto">
          <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
            © 2023 Content Repurposer. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}
