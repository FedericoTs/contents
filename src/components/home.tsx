import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  FileText,
  Video,
  Mic,
  ExternalLink,
  ArrowRight,
  Trash2,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronRight,
  Repeat,
  Eye,
  X,
  Edit,
  Share2,
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
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const Home = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [filteredContentItems, setFilteredContentItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );
  const [expandedTransformations, setExpandedTransformations] = useState<
    Record<string, boolean>
  >({});
  const [transformedContents, setTransformedContents] = useState<
    Record<string, any[]>
  >({});
  const [nestedTransformations, setNestedTransformations] = useState<
    Record<string, any[]>
  >({});
  const [loadingTransformedContent, setLoadingTransformedContent] = useState<
    Record<string, boolean>
  >({});
  const [loadingNestedTransformations, setLoadingNestedTransformations] =
    useState<Record<string, boolean>>({});

  // New state for content viewer modal
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingContent, setViewingContent] = useState<{
    title: string;
    content: string;
    type: string;
    platform?: string;
    isEditing?: boolean;
    contentId?: string;
    transformedContentId?: string;
  } | null>(null);

  const handleAddToQueue = async (transformationConfig: any) => {
    try {
      // Use the content ID from the transformation config or from selected content
      const contentId = transformationConfig.contentId || selectedContent?.id;

      // If no content ID is available, show an error
      if (!contentId) {
        console.log("No content ID available for processing");
        toast({
          title: "Error",
          description:
            "Please select or upload content first before transforming.",
          variant: "destructive",
        });
        return;
      }

      console.log("Processing with content ID:", contentId);
      console.log(
        "Selected content:",
        selectedContent
          ? {
              id: selectedContent.id,
              title: selectedContent.title,
              content_type: selectedContent.content_type,
              content_preview: selectedContent.content
                ? selectedContent.content.substring(0, 100) + "..."
                : "No content",
            }
          : "None",
      );

      // Check if this is a chained transformation (transforming already transformed content)
      const isChainedTransformation =
        transformationConfig.isChainedTransformation;
      const sourceContentId = transformationConfig.sourceContentId;
      const previousTransformationId =
        transformationConfig.previousTransformationId;

      console.log("Transformation details:", {
        isChainedTransformation,
        sourceContentId,
        previousTransformationId,
      });

      // Create a processing job
      await createProcessingJob(
        contentId,
        {
          contentType: transformationConfig.sourceType,
          targetFormat: transformationConfig.targetFormat,
          tone: transformationConfig.settings.tone,
          length: transformationConfig.settings.length,
          preserveKeyPoints: transformationConfig.settings.preserveKeyPoints,
          platforms: transformationConfig.settings.platforms,
          customInstructions: transformationConfig.sampleOutput,
        },
        sourceContentId, // Pass source content ID for chained transformations
        previousTransformationId, // Pass previous transformation ID for chained transformations
      );

      // Show success message
      toast({
        title: "Transformation added to queue",
        description: `Your ${transformationConfig.sourceType} will be transformed to ${transformationConfig.targetFormat}.`,
      });
    } catch (error) {
      console.error("Error creating processing job:", error);
      toast({
        title: "Error",
        description:
          typeof error === "object" && error.message
            ? error.message
            : "Failed to add transformation to queue. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleItemProcessed = (result: any) => {
    setProcessingResult(result);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredContentItems(contentItems);
      return;
    }

    const filtered = contentItems.filter(
      (item) =>
        item.title?.toLowerCase().includes(term.toLowerCase()) ||
        item.content_type?.toLowerCase().includes(term.toLowerCase()),
    );
    setFilteredContentItems(filtered);
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
        const items = data || [];
        setContentItems(items);
        setFilteredContentItems(items);
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

  const handleViewContent = (content: any, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row selection

    setViewingContent({
      title: content.title || "Untitled Content",
      content: content.content || "No content available",
      type: content.content_type || "article",
      platform: content.platform || null,
      isEditing: false,
      contentId: content.id, // Store the content ID directly in the viewing content
    });
    setViewerOpen(true);
  };

  const toggleExpandItem = async (
    contentId: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation(); // Prevent row selection when clicking expand

    // Toggle the expanded state
    setExpandedItems((prev) => ({
      ...prev,
      [contentId]: !prev[contentId],
    }));

    // If expanding and we don't have transformed content yet, fetch it
    if (!expandedItems[contentId] && !transformedContents[contentId]) {
      setLoadingTransformedContent((prev) => ({
        ...prev,
        [contentId]: true,
      }));

      try {
        const { data, error } = await supabase
          .from("content_outputs")
          .select("*")
          .eq("content_id", contentId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setTransformedContents((prev) => ({
          ...prev,
          [contentId]: data || [],
        }));
      } catch (error) {
        console.error("Error fetching transformed content:", error);
        toast({
          title: "Error",
          description: "Failed to load transformed content",
          variant: "destructive",
        });
      } finally {
        setLoadingTransformedContent((prev) => ({
          ...prev,
          [contentId]: false,
        }));
      }
    }
  };

  const toggleExpandTransformation = async (
    transformationId: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation(); // Prevent row selection when clicking expand

    // Toggle the expanded state
    setExpandedTransformations((prev) => ({
      ...prev,
      [transformationId]: !prev[transformationId],
    }));

    // If expanding and we don't have nested transformations yet, fetch them
    if (
      !expandedTransformations[transformationId] &&
      !nestedTransformations[transformationId]
    ) {
      setLoadingNestedTransformations((prev) => ({
        ...prev,
        [transformationId]: true,
      }));

      try {
        // Fetch transformations where this transformation is the source
        const { data, error } = await supabase
          .from("content_outputs")
          .select("*")
          .eq("source_content_id", transformationId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setNestedTransformations((prev) => ({
          ...prev,
          [transformationId]: data || [],
        }));
      } catch (error) {
        console.error("Error fetching nested transformations:", error);
        toast({
          title: "Error",
          description: "Failed to load nested transformations",
          variant: "destructive",
        });
      } finally {
        setLoadingNestedTransformations((prev) => ({
          ...prev,
          [transformationId]: false,
        }));
      }
    }
  };

  const handleSelectTransformedContent = (content: any) => {
    // Create a content-like object from the transformed content
    const transformedContentObj = {
      id: content.content_id, // Use the original content ID
      title: `${content.target_format.replace(/-/g, " ")} (transformed)`,
      content_type: content.output_type,
      content: content.processed_content,
      transformed_content_id: content.id, // Store the transformed content ID
      is_transformed: true,
      target_format: content.target_format,
      source_content_id: content.source_content_id || content.content_id, // Store the original content ID
    };

    setSelectedContent(transformedContentObj);
  };

  const handleViewTransformedContent = (
    content: any,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation(); // Prevent row selection

    // Try to determine if this is a social media post and which platform
    let platform = null;
    if (
      content.target_format === "social-posts" &&
      content.options?.platforms?.length > 0
    ) {
      platform = content.options.platforms[0];
    } else if (
      content.processed_content &&
      typeof content.processed_content === "string"
    ) {
      // Try to parse the content if it's JSON
      try {
        const parsedContent = JSON.parse(content.processed_content);
        if (
          Array.isArray(parsedContent) &&
          parsedContent.length > 0 &&
          parsedContent[0].platform
        ) {
          platform = parsedContent[0].platform.toLowerCase();
        }
      } catch (e) {
        // Not JSON, check if the content mentions a platform
        if (
          content.processed_content.includes("Twitter") ||
          content.processed_content.includes("tweet")
        ) {
          platform = "twitter";
        } else if (content.processed_content.includes("Instagram")) {
          platform = "instagram";
        } else if (content.processed_content.includes("LinkedIn")) {
          platform = "linkedin";
        } else if (content.processed_content.includes("Facebook")) {
          platform = "facebook";
        }
      }
    }

    setViewingContent({
      title: `${content.target_format.replace(/-/g, " ")} (transformed)`,
      content: content.processed_content || "No content available",
      type: content.output_type || "article",
      platform: platform,
      isEditing: false,
      transformedContentId: content.id, // Store the transformed content ID directly
      contentId: content.content_id, // Store the original content ID
    });
    setViewerOpen(true);
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

  const onContentUploaded = () => {
    // This function can be implemented to handle content upload events
    // For now, it's just a placeholder
  };

  const handleShareContent = (platform: string) => {
    toast({
      title: `Share to ${platform}`,
      description: `Content will be shared to ${platform}`,
    });
  };

  // Function to save content changes
  const handleSaveContentChanges = async () => {
    if (!viewingContent) return;

    try {
      // Check if we're editing a transformed content or original content
      if (viewingContent.transformedContentId) {
        // Update transformed content in the database
        const { error } = await supabase
          .from("content_outputs")
          .update({
            processed_content: viewingContent.content,
          })
          .eq("id", viewingContent.transformedContentId);

        if (error) throw error;

        // Update the transformed content in state if it exists in our local state
        if (viewingContent.contentId) {
          setTransformedContents((prev) => {
            const updatedContents = { ...prev };
            const contentId = viewingContent.contentId;

            if (updatedContents[contentId]) {
              updatedContents[contentId] = updatedContents[contentId].map(
                (item) =>
                  item.id === viewingContent.transformedContentId
                    ? {
                        ...item,
                        processed_content: viewingContent.content,
                      }
                    : item,
              );
            }
            return updatedContents;
          });

          // Also update nested transformations if applicable
          setNestedTransformations((prev) => {
            const updatedNested = { ...prev };
            // Check all parent transformations
            Object.keys(updatedNested).forEach((parentId) => {
              if (updatedNested[parentId]) {
                updatedNested[parentId] = updatedNested[parentId].map((item) =>
                  item.id === viewingContent.transformedContentId
                    ? {
                        ...item,
                        processed_content: viewingContent.content,
                      }
                    : item,
                );
              }
            });
            return updatedNested;
          });
        }

        // Update selected content if it's the one being edited
        if (
          selectedContent?.transformed_content_id ===
          viewingContent.transformedContentId
        ) {
          setSelectedContent((prev) =>
            prev ? { ...prev, content: viewingContent.content } : null,
          );
        }
      } else if (viewingContent.contentId) {
        // Update original content in the database
        const { error } = await supabase
          .from("content_items")
          .update({ content: viewingContent.content })
          .eq("id", viewingContent.contentId);

        if (error) throw error;

        // Update the content items in state
        setContentItems((prev) =>
          prev.map((item) =>
            item.id === viewingContent.contentId
              ? { ...item, content: viewingContent.content }
              : item,
          ),
        );

        setFilteredContentItems((prev) =>
          prev.map((item) =>
            item.id === viewingContent.contentId
              ? { ...item, content: viewingContent.content }
              : item,
          ),
        );

        // Update selected content if it's the one being edited
        if (selectedContent?.id === viewingContent.contentId) {
          setSelectedContent((prev) =>
            prev ? { ...prev, content: viewingContent.content } : null,
          );
        }
      } else {
        throw new Error("No content ID available for saving changes");
      }

      toast({
        title: "Changes saved",
        description: "Your edits have been saved successfully.",
      });

      // Exit editing mode
      setViewingContent((prev) =>
        prev ? { ...prev, isEditing: false } : null,
      );
    } catch (error) {
      console.error("Error saving content:", error);
      toast({
        title: "Error saving changes",
        description:
          typeof error === "object" && error.message
            ? error.message
            : "There was a problem saving your changes. Please try again.",
        variant: "destructive",
      });
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
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Content Library Table - Moved to top */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3 pt-5 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                Content Library
              </CardTitle>
              <div className="relative w-64">
                <Input
                  type="text"
                  placeholder="Search content..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
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
              ) : filteredContentItems.length === 0 ? (
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
                        <TableHead>Origin</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContentItems.map((item) => (
                        <React.Fragment key={item.id}>
                          <TableRow
                            className={`cursor-pointer ${selectedContent && selectedContent.id === item.id && !selectedContent.transformed_content_id ? "bg-muted/50" : ""}`}
                            onClick={() => handleSelectContent(item)}
                          >
                            <TableCell className="font-medium truncate max-w-[150px]">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => toggleExpandItem(item.id, e)}
                                  title={
                                    expandedItems[item.id]
                                      ? "Collapse"
                                      : "Expand"
                                  }
                                >
                                  {expandedItems[item.id] ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                                {item.title || "Untitled"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                {getContentTypeIcon(item.content_type)}
                                <span className="capitalize">
                                  {item.content_type}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {item.url
                                  ? "URL"
                                  : item.file_path
                                    ? "Upload"
                                    : "Pasted"}
                              </Badge>
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
                                  onClick={(e) => handleViewContent(item, e)}
                                  title="View content"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                                  onClick={(e) =>
                                    handleDeleteContent(item.id, e)
                                  }
                                  disabled={isDeleting}
                                  title="Delete content"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Expanded transformed content rows */}
                          {expandedItems[item.id] && (
                            <TableRow>
                              <TableCell colSpan={5} className="p-0 border-t-0">
                                <div className="bg-muted/20 px-4 py-2">
                                  {loadingTransformedContent[item.id] ? (
                                    <div className="flex justify-center py-2">
                                      <svg
                                        className="animate-spin h-4 w-4 text-primary"
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
                                  ) : transformedContents[item.id]?.length >
                                    0 ? (
                                    <div className="space-y-1">
                                      <p className="text-xs font-medium mb-2">
                                        Transformations:
                                      </p>
                                      {transformedContents[item.id].map(
                                        (transformedItem) => (
                                          <React.Fragment
                                            key={transformedItem.id}
                                          >
                                            <div
                                              className={`flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer ${selectedContent?.transformed_content_id === transformedItem.id ? "bg-muted" : ""}`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectTransformedContent(
                                                  transformedItem,
                                                );
                                              }}
                                            >
                                              <div className="flex items-center gap-2">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-6 w-6 p-0"
                                                  onClick={(e) =>
                                                    toggleExpandTransformation(
                                                      transformedItem.id,
                                                      e,
                                                    )
                                                  }
                                                  title={
                                                    expandedTransformations[
                                                      transformedItem.id
                                                    ]
                                                      ? "Collapse"
                                                      : "Expand"
                                                  }
                                                >
                                                  {expandedTransformations[
                                                    transformedItem.id
                                                  ] ? (
                                                    <ChevronDown className="h-3.5 w-3.5" />
                                                  ) : (
                                                    <ChevronRight className="h-3.5 w-3.5" />
                                                  )}
                                                </Button>
                                                <Badge className="capitalize text-xs">
                                                  {transformedItem.target_format.replace(
                                                    /-/g,
                                                    " ",
                                                  )}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                  {new Date(
                                                    transformedItem.created_at,
                                                  ).toLocaleString()}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-7 w-7 p-0"
                                                  onClick={(e) =>
                                                    handleViewTransformedContent(
                                                      transformedItem,
                                                      e,
                                                    )
                                                  }
                                                  title="View content"
                                                >
                                                  <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-7 w-7 p-0"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectTransformedContent(
                                                      transformedItem,
                                                    );
                                                  }}
                                                  title="Transform this content"
                                                >
                                                  <Repeat className="h-3.5 w-3.5" />
                                                </Button>
                                              </div>
                                            </div>

                                            {/* Nested transformations */}
                                            {expandedTransformations[
                                              transformedItem.id
                                            ] && (
                                              <div className="ml-6 pl-2 border-l border-muted mt-1 mb-1">
                                                {loadingNestedTransformations[
                                                  transformedItem.id
                                                ] ? (
                                                  <div className="flex justify-center py-2">
                                                    <svg
                                                      className="animate-spin h-4 w-4 text-primary"
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
                                                ) : nestedTransformations[
                                                    transformedItem.id
                                                  ]?.length > 0 ? (
                                                  <div className="space-y-1 py-1">
                                                    <p className="text-xs font-medium mb-1 text-muted-foreground">
                                                      Further Transformations:
                                                    </p>
                                                    {nestedTransformations[
                                                      transformedItem.id
                                                    ].map((nestedItem) => (
                                                      <div
                                                        key={nestedItem.id}
                                                        className={`flex items-center justify-between p-1.5 rounded-md hover:bg-muted/70 cursor-pointer text-sm ${selectedContent?.transformed_content_id === nestedItem.id ? "bg-muted/70" : ""}`}
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleSelectTransformedContent(
                                                            nestedItem,
                                                          );
                                                        }}
                                                      >
                                                        <div className="flex items-center gap-2">
                                                          <Badge
                                                            variant="outline"
                                                            className="capitalize text-xs"
                                                          >
                                                            {nestedItem.target_format.replace(
                                                              /-/g,
                                                              " ",
                                                            )}
                                                          </Badge>
                                                          <span className="text-xs text-muted-foreground">
                                                            {new Date(
                                                              nestedItem.created_at,
                                                            ).toLocaleString()}
                                                          </span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                          <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                            onClick={(e) =>
                                                              handleViewTransformedContent(
                                                                nestedItem,
                                                                e,
                                                              )
                                                            }
                                                            title="View content"
                                                          >
                                                            <Eye className="h-3 w-3" />
                                                          </Button>
                                                          <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleSelectTransformedContent(
                                                                nestedItem,
                                                              );
                                                            }}
                                                            title="Transform this content"
                                                          >
                                                            <Repeat className="h-3 w-3" />
                                                          </Button>
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                ) : (
                                                  <p className="text-xs text-muted-foreground py-1.5 pl-2">
                                                    No further transformations
                                                    available
                                                  </p>
                                                )}
                                              </div>
                                            )}
                                          </React.Fragment>
                                        ),
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground text-center py-2">
                                      No transformations available for this
                                      content
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="bg-white rounded-lg border shadow-sm p-6">
            {selectedContent ? (
              <TransformationDashboard
                onAddToQueue={handleAddToQueue}
                contentId={selectedContent.id}
                contentType={selectedContent.content_type}
                contentTitle={selectedContent.title}
                targetType={selectedContent.target_type}
                contentText={selectedContent.content}
                isTransformedContent={selectedContent.is_transformed}
                transformedContentId={selectedContent.transformed_content_id}
                originalTargetFormat={selectedContent.target_format}
                sourceContentId={selectedContent.source_content_id}
              />
            ) : (
              <TransformationDashboard onAddToQueue={handleAddToQueue} />
            )}
          </div>
          <OutputPreview
            processingResult={processingResult}
            contentId={selectedContent?.id}
            contentType={selectedContent?.content_type}
            targetFormat={processingResult ? "custom" : undefined}
          />
        </div>
      </div>
      {/* Content Viewer Modal */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">
                  {viewingContent?.title}
                </DialogTitle>
                <DialogDescription>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="mt-1 capitalize">
                      {viewingContent?.type}
                    </Badge>
                    {viewingContent?.platform && (
                      <Badge variant="secondary" className="mt-1 capitalize">
                        {viewingContent.platform}
                      </Badge>
                    )}
                  </div>
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex items-center gap-1"
                    onClick={() => {
                      setViewingContent((prev) =>
                        prev ? { ...prev, isEditing: !prev.isEditing } : null,
                      );
                    }}
                  >
                    <Edit className="h-3.5 w-3.5" />
                    {viewingContent?.isEditing ? "Cancel" : "Edit"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex items-center gap-1"
                    onClick={() => {
                      // Handle transform action
                      if (selectedContent) {
                        handleSelectTransformedContent(selectedContent);
                        setViewerOpen(false);
                      }
                    }}
                  >
                    <Repeat className="h-3.5 w-3.5" />
                    Transform
                  </Button>

                  {viewingContent?.platform && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 flex items-center gap-1"
                      onClick={() => {
                        if (viewingContent?.platform) {
                          handleShareContent(viewingContent.platform);
                        }
                      }}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Share
                    </Button>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setViewerOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="view" className="w-full mt-4">
            <TabsList className="mb-4">
              <TabsTrigger value="view">View</TabsTrigger>
              {viewingContent?.isEditing && (
                <TabsTrigger value="edit">Edit</TabsTrigger>
              )}
            </TabsList>

            <TabsContent
              value="view"
              className="overflow-y-auto flex-grow bg-muted/20 p-6 rounded-md max-h-[60vh]"
            >
              {viewingContent?.type === "article" ? (
                <div className="prose prose-sm max-w-none">
                  {viewingContent?.content
                    .split("\n")
                    .map((paragraph, index) =>
                      paragraph.trim() ? (
                        <p key={index} className="mb-4">
                          {paragraph}
                        </p>
                      ) : (
                        <br key={index} />
                      ),
                    )}
                </div>
              ) : viewingContent?.platform ? (
                <div className="flex justify-center w-full">
                  {/* Social Media Post Preview */}
                  {viewingContent.platform === "twitter" && (
                    <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-start mb-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=twitter"
                            alt="Profile"
                            className="h-10 w-10 rounded-full"
                          />
                        </div>
                        <div>
                          <div className="font-bold">Twitter User</div>
                          <div className="text-gray-500 text-sm">
                            @twitteruser
                          </div>
                        </div>
                      </div>
                      <div className="mb-3 text-[15px]">
                        {viewingContent.content}
                      </div>
                      <div className="text-gray-500 text-sm">
                        12:45 PM · Jun 12, 2023
                      </div>
                      <div className="flex justify-between mt-3 text-gray-500 border-t border-gray-100 pt-3">
                        <div>💬 24</div>
                        <div>🔄 142</div>
                        <div>❤️ 892</div>
                        <div>📤</div>
                      </div>
                    </div>
                  )}

                  {viewingContent.platform === "facebook" && (
                    <div className="w-full max-w-md bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center mb-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=facebook"
                            alt="Profile"
                            className="h-10 w-10 rounded-full"
                          />
                        </div>
                        <div>
                          <div className="font-bold">Facebook User</div>
                          <div className="text-gray-500 text-xs">
                            2 hrs · 🌎
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">{viewingContent.content}</div>
                      <div className="flex justify-between mt-3 text-gray-500 border-t border-gray-100 pt-3">
                        <div>👍 Like</div>
                        <div>💬 Comment</div>
                        <div>↗️ Share</div>
                      </div>
                    </div>
                  )}

                  {viewingContent.platform === "instagram" && (
                    <div className="w-full max-w-md bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center p-3 border-b">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 p-0.5 mr-3">
                          <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=instagram"
                            alt="Profile"
                            className="h-7 w-7 rounded-full bg-white"
                          />
                        </div>
                        <div className="font-semibold">instagram_user</div>
                      </div>
                      <div className="aspect-square bg-gray-100 flex items-center justify-center">
                        <div className="text-center p-6 text-gray-500">
                          <div className="text-sm mb-2">
                            Image would appear here
                          </div>
                          <div className="text-xs">
                            Instagram posts typically include an image
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex space-x-4 mb-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                            />
                          </svg>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z"
                            />
                          </svg>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                            />
                          </svg>
                        </div>
                        <div className="font-bold mb-1">1,234 likes</div>
                        <div>
                          <span className="font-semibold mr-1">
                            instagram_user
                          </span>
                          <span>{viewingContent.content}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {viewingContent.platform === "linkedin" && (
                    <div className="w-full max-w-md bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-start mb-3">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=linkedin"
                            alt="Profile"
                            className="h-12 w-12 rounded-full"
                          />
                        </div>
                        <div>
                          <div className="font-bold">LinkedIn Professional</div>
                          <div className="text-gray-500 text-xs">
                            Marketing Director at Company Inc.
                          </div>
                          <div className="text-gray-500 text-xs">2d · 🌎</div>
                        </div>
                      </div>
                      <div className="mb-3 whitespace-pre-line">
                        {viewingContent.content}
                      </div>
                      <div className="flex justify-between mt-3 text-gray-500 border-t border-gray-100 pt-3">
                        <div>👍 Like</div>
                        <div>💬 Comment</div>
                        <div>↗️ Share</div>
                      </div>
                    </div>
                  )}

                  {/* Default social post if platform not specifically handled */}
                  {!["twitter", "facebook", "instagram", "linkedin"].includes(
                    viewingContent.platform,
                  ) && (
                    <div className="w-full max-w-md bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-center mb-3">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${viewingContent.platform || "social"}`}
                            alt="Profile"
                            className="h-10 w-10 rounded-full"
                          />
                        </div>
                        <div>
                          <div className="font-bold capitalize">
                            {viewingContent.platform || "Social"} User
                          </div>
                          <div className="text-gray-500 text-xs">
                            Posted recently
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">{viewingContent.content}</div>
                    </div>
                  )}
                </div>
              ) : (
                <pre className="whitespace-pre-wrap text-sm font-sans">
                  {viewingContent?.content}
                </pre>
              )}
            </TabsContent>

            {viewingContent?.isEditing && (
              <TabsContent
                value="edit"
                className="overflow-y-auto flex-grow bg-muted/20 p-6 rounded-md max-h-[60vh]"
              >
                <div className="w-full max-w-3xl mx-auto">
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Content
                    </label>
                    <Textarea
                      value={viewingContent.content}
                      onChange={(e) =>
                        setViewingContent((prev) =>
                          prev ? { ...prev, content: e.target.value } : null,
                        )
                      }
                      className="w-full min-h-[300px] font-mono text-sm"
                      placeholder="Edit your content here..."
                    />
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button onClick={handleSaveContentChanges}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;
