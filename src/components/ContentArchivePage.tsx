import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Archive,
  Filter,
  Download,
  Share2,
  Wand2,
  Eye,
  Trash2,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import { supabase } from "@/services/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ContentArchivePage = () => {
  const [archivedContent, setArchivedContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [previewContent, setPreviewContent] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or table
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contentToDelete, setContentToDelete] = useState(null);

  useEffect(() => {
    fetchArchivedContent();
  }, [activeTab]);

  const fetchArchivedContent = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("content_items")
        .select("*")
        .order("created_at", { ascending: false });

      // Filter by content type if not on "all" tab
      if (activeTab === "blog") {
        query = query.eq("content_type", "article");
      } else if (activeTab === "social") {
        query = query.eq("target_format", "social-posts");
      } else if (activeTab === "newsletter") {
        query = query.eq("target_format", "newsletter");
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform the data to match our UI format
      const formattedData = data.map((item) => ({
        id: item.id,
        title: item.title || "Untitled Content",
        type: item.target_format
          ? item.target_format.replace(/-/g, " ")
          : "Unknown",
        originalFormat: item.content_type || "Unknown",
        createdAt: new Date(item.created_at).toLocaleDateString(),
        updatedAt: item.updated_at
          ? new Date(item.updated_at).toLocaleDateString()
          : null,
        platforms: item.options?.platforms || [],
        status: item.status || "pending",
        processed_content: item.processed_content,
        hasProcessedContent: !!item.processed_content,
      }));

      setArchivedContent(formattedData);
    } catch (error) {
      console.error("Error fetching archived content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewContent = (content) => {
    setPreviewContent(content);
    setIsPreviewOpen(true);
  };

  const handleTransformContent = (contentId) => {
    // Navigate to transformation dashboard with this content ID
    window.location.href = `/transform?contentId=${contentId}`;
  };

  const handleDeleteContent = async (content) => {
    setContentToDelete(content);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!contentToDelete) return;

    try {
      const { error } = await supabase
        .from("content_items")
        .delete()
        .eq("id", contentToDelete.id);

      if (error) throw error;

      // Remove from local state
      setArchivedContent(
        archivedContent.filter((item) => item.id !== contentToDelete.id),
      );
      setDeleteDialogOpen(false);
      setContentToDelete(null);
    } catch (error) {
      console.error("Error deleting content:", error);
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "table" : "grid");
  };

  return (
    <div className="container mx-auto px-6 py-8 bg-background">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Content Archive</h2>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2 h-10"
            onClick={toggleViewMode}
          >
            {viewMode === "grid" ? (
              <>
                <TableIcon className="h-4 w-4" /> Table View
              </>
            ) : (
              <>
                <LayoutGrid className="h-4 w-4" /> Grid View
              </>
            )}
          </Button>
          <Button variant="outline" className="flex items-center gap-2 h-10">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="w-full max-w-md grid grid-cols-4">
          <TabsTrigger value="all" className="px-4 py-2.5">
            All Content
          </TabsTrigger>
          <TabsTrigger value="blog" className="px-4 py-2.5">
            Blog Posts
          </TabsTrigger>
          <TabsTrigger value="social" className="px-4 py-2.5">
            Social Media
          </TabsTrigger>
          <TabsTrigger value="newsletter" className="px-4 py-2.5">
            Newsletters
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : archivedContent.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-lg">
          <Archive className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No content found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Start creating content or adjust your filters to see items here.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {archivedContent.map((content) => (
            <motion.div
              key={content.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="h-full shadow-sm flex flex-col">
                <CardHeader className="pb-3 pt-5 px-6">
                  <CardTitle className="text-lg">{content.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {content.type} • Originally: {content.originalFormat}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 flex-grow">
                  <div className="text-sm text-muted-foreground">
                    <p>Created: {content.createdAt}</p>
                    {content.updatedAt && (
                      <p className="mt-1">Updated: {content.updatedAt}</p>
                    )}
                    {content.platforms && content.platforms.length > 0 && (
                      <p className="mt-3">
                        Platforms: {content.platforms.join(", ")}
                      </p>
                    )}
                    <div className="mt-3 flex items-center">
                      <span className="text-sm font-medium mr-2">Status:</span>
                      <Badge
                        variant={
                          content.status === "processed"
                            ? "default"
                            : content.status === "failed"
                              ? "destructive"
                              : "outline"
                        }
                        className="text-xs"
                      >
                        {content.status.charAt(0).toUpperCase() +
                          content.status.slice(1)}
                      </Badge>
                    </div>
                    {content.hasProcessedContent && (
                      <div className="mt-3">
                        <Badge variant="secondary" className="text-xs">
                          Processed Content Available
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 px-6 py-4 border-t">
                  <div className="flex flex-wrap gap-2 w-full">
                    {content.hasProcessedContent && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1.5 h-9 px-3"
                        onClick={() => handlePreviewContent(content)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5 h-9 px-3"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5 h-9 px-3"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Share
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5 h-9 px-3 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteContent(content)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex items-center gap-1.5 h-9 px-3"
                      onClick={() => handleTransformContent(content.id)}
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                      Transform
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Original Format</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archivedContent.map((content) => (
                <TableRow key={content.id}>
                  <TableCell className="font-medium">{content.title}</TableCell>
                  <TableCell>{content.type}</TableCell>
                  <TableCell>{content.originalFormat}</TableCell>
                  <TableCell>{content.createdAt}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        content.status === "processed"
                          ? "default"
                          : content.status === "failed"
                            ? "destructive"
                            : "outline"
                      }
                      className="text-xs"
                    >
                      {content.status.charAt(0).toUpperCase() +
                        content.status.slice(1)}
                    </Badge>
                    {content.hasProcessedContent && (
                      <Badge variant="secondary" className="text-xs ml-2">
                        Processed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {content.hasProcessedContent && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1.5 h-8 px-2"
                          onClick={() => handlePreviewContent(content)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Preview
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1.5 h-8 px-2"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1.5 h-8 px-2 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteContent(content)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex items-center gap-1.5 h-8 px-2"
                        onClick={() => handleTransformContent(content.id)}
                      >
                        <Wand2 className="h-3.5 w-3.5" />
                        Transform
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewContent?.title}</DialogTitle>
            <DialogDescription>
              Processed content from {previewContent?.originalFormat} to{" "}
              {previewContent?.type}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 bg-muted/20 rounded-md">
            {previewContent?.processed_content ? (
              <div className="whitespace-pre-wrap">
                {previewContent.processed_content}
              </div>
            ) : (
              <p>No processed content available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{contentToDelete?.title}" and all
              associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setContentToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContentArchivePage;
