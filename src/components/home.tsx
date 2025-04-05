import React from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ContentInputPanel from "./ContentInputPanel";
import TransformationDashboard from "./TransformationDashboard";
import OutputPreview from "./OutputPreview";
import ProcessingQueue from "./ProcessingQueue";

const Home = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Main Content */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Content Repurposing Dashboard</h2>
        <div className="flex gap-3">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-6">
          <ContentInputPanel />
          <ProcessingQueue />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 space-y-6">
          <TransformationDashboard />
          <OutputPreview />
        </div>
      </div>
    </div>
  );
};

export default Home;
