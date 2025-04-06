import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Plus,
  FileText,
  Video,
  Mic,
  ExternalLink,
  ArrowRight,
  Trash2,
  AlertCircle,
} from "lucide-react";
import ContentInputPanel from "./ContentInputPanel";
import TransformationDashboard from "./TransformationDashboard";
import OutputPreview from "./OutputPreview";
import ProcessingQueue from "./ProcessingQueue";
import { QueueItem } from "./ProcessingQueue";
import { createProcessingJob } from "@/services/processingService";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const Home = () => {
  const { user } = useAuth();
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleAddToQueue = async (transformationConfig: any) => {
    try {
      // In a real app, you would get the content ID from the selected content
      const contentId = "sample-content-id";

      // Create a processing job
      await createProcessingJob(contentId, {
        contentType: transformationConfig.sourceType,
        targetFormat: transformationConfig.targetFormat,
        tone: transformationConfig.settings.tone,
        length: transformationConfig.settings.length,
        preserveKeyPoints: transformationConfig.settings.preserveKeyPoints,
        platforms: transformationConfig.settings.platforms,
        customInstructions: transformationConfig.sampleOutput,
      });
    } catch (error) {
      console.error("Error creating processing job:", error);
    }
  };

  const handleItemProcessed = (result: any) => {
    setProcessingResult(result);
  };

  // Fetch content items from the database
  useEffect(() => {
    const fetchContentItems = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("content_items")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setContentItems(data || []);
      } catch (error) {
        console.error("Error fetching content items:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContentItems();

    // Set up real-time subscription for content updates
    const subscription = supabase
      .channel("content_items_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "content_items",
        },
        () => {
          fetchContentItems();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleSelectContent = (content: any) => {
    setSelectedContent(content);
  };

  const handleDeleteContent = async (
    contentId: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation(); // Prevent row selection when clicking delete
    setIsDeleting(true);
    setDeleteError(null);

    try {
      // First check if there are any processing jobs associated with this content
      const { data: jobs, error: jobsError } = await supabase
        .from("processing_jobs")
        .select("id")
        .eq("content_id", contentId);

      if (jobsError) throw jobsError;

      // Delete any associated processing jobs first
      if (jobs && jobs.length > 0) {
        const { error: deleteJobsError } = await supabase
          .from("processing_jobs")
          .delete()
          .eq("content_id", contentId);

        if (deleteJobsError) throw deleteJobsError;
      }

      // Now delete the content item
      const { error: deleteError } = await supabase
        .from("content_items")
        .delete()
        .eq("id", contentId);

      if (deleteError) throw deleteError;

      // If the deleted item was selected, clear the selection
      if (selectedContent && selectedContent.id === contentId) {
        setSelectedContent(null);
      }
    } catch (error) {
      console.error("Error deleting content:", error);
      setDeleteError("Failed to delete content. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "article":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "video":
        return <Video className="h-4 w-4 text-red-500" />;
      case "podcast":
        return <Mic className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-16 min-h-[calc(100vh-8rem)] h-full">
      {/* Main Content */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Content Repurposing Dashboard</h2>
        <div className="flex gap-3">
          <Button className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-6">
          <ContentInputPanel />
          <ProcessingQueue onItemProcessed={handleItemProcessed} />

          {/* Content Library Table */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3 pt-5 px-6">
              <CardTitle className="text-lg font-semibold">
                Content Library
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-5">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <svg
                    className="animate-spin h-5 w-5 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              ) : contentItems.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No content items found</p>
                </div>
              ) : deleteError ? (
                <div className="text-center py-2 text-destructive flex items-center justify-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <p>{deleteError}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contentItems.slice(0, 5).map((item) => (
                        <TableRow
                          key={item.id}
                          className={`cursor-pointer ${selectedContent && selectedContent.id === item.id ? "bg-muted/50" : ""}`}
                          onClick={() => handleSelectContent(item)}
                        >
                          <TableCell className="font-medium truncate max-w-[150px]">
                            {item.title || "Untitled"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {getContentTypeIcon(item.content_type)}
                              <span className="capitalize">
                                {item.content_type}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {new Date(item.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectContent(item);
                                }}
                                title="Select content"
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                                onClick={(e) => handleDeleteContent(item.id, e)}
                                disabled={isDeleting}
                                title="Delete content"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {contentItems.length > 5 && (
                    <div className="mt-3 text-center">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => (window.location.href = "/archive")}
                      >
                        View all ({contentItems.length})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            {selectedContent ? (
              <TransformationDashboard
                onAddToQueue={handleAddToQueue}
                contentId={selectedContent.id}
                contentType={selectedContent.content_type}
                contentTitle={selectedContent.title}
                targetType={selectedContent.target_type}
              />
            ) : (
              <TransformationDashboard onAddToQueue={handleAddToQueue} />
            )}
          </div>
          <OutputPreview processingResult={processingResult} />
        </div>
      </div>
    </div>
  );
};

export default Home;
