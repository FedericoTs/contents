import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Trash2,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react";
import {
  getProcessingJobs,
  processContentItem,
} from "@/services/processingService";
import { supabase } from "@/services/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface QueueItem {
  id: string;
  title: string;
  sourceType: "article" | "video" | "podcast";
  targetFormat: string;
  targetType?: "audio" | "video" | null;
  progress: number;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
}

interface ProcessingQueueProps {
  items?: QueueItem[];
  onRemoveItem?: (id: string) => void;
  onStartProcessing?: (id: string) => void;
  onPauseProcessing?: (id: string) => void;
  onItemProcessed?: (result: any) => void;
}

const ProcessingQueue = ({
  items: initialItems,
  onRemoveItem = () => {},
  onStartProcessing = () => {},
  onPauseProcessing = () => {},
  onItemProcessed = () => {},
}: ProcessingQueueProps) => {
  const { user } = useAuth();
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch processing jobs from the database
  useEffect(() => {
    if (initialItems) {
      setQueueItems(initialItems);
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    const fetchJobs = async () => {
      try {
        const jobs = await getProcessingJobs(user.id);
        const formattedJobs = jobs.map((job) => ({
          id: job.id,
          title: job.content_items?.title || "Untitled Content",
          sourceType: job.content_items?.content_type || "article",
          targetFormat: job.target_format,
          targetType: job.content_items?.target_type,
          progress:
            job.status === "completed"
              ? 100
              : job.status === "failed"
                ? 0
                : job.status === "processing"
                  ? 50
                  : 0,
          status: job.status,
          error: job.error,
        }));
        setQueueItems(formattedJobs);
      } catch (err) {
        console.error("Error fetching processing jobs:", err);
        setError("Failed to load processing queue");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();

    // Set up real-time subscription for job updates
    const subscription = supabase
      .channel("processing_jobs_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "processing_jobs",
        },
        (payload) => {
          // Refresh the jobs list when there's a change
          fetchJobs();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, initialItems]);

  const handleRemoveItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("processing_jobs")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setQueueItems(queueItems.filter((item) => item.id !== id));
      onRemoveItem(id);
    } catch (err) {
      console.error("Error removing job:", err);
      setError("Failed to remove job from queue");
    }
  };

  const handleStartProcessing = async (id: string) => {
    try {
      // Find the job in the queue
      const job = queueItems.find((item) => item.id === id);
      if (!job) return;

      // Update UI immediately to show processing
      setQueueItems((items) =>
        items.map((item) =>
          item.id === id
            ? { ...item, status: "processing", progress: 10 }
            : item,
        ),
      );

      // Get the content item ID and options from the database
      const { data: jobData, error: jobError } = await supabase
        .from("processing_jobs")
        .select("content_id, options")
        .eq("id", id)
        .single();

      if (jobError) throw jobError;
      if (!jobData) throw new Error("Job not found");

      // Start processing
      onStartProcessing(id);

      // Process the content
      const result = await processContentItem(
        jobData.content_id,
        jobData.options,
      );

      // Update UI to show completion
      setQueueItems((items) =>
        items.map((item) =>
          item.id === id
            ? { ...item, status: "completed", progress: 100 }
            : item,
        ),
      );

      // Notify parent component
      onItemProcessed(result);
    } catch (err) {
      console.error("Error processing content:", err);
      setError("Failed to process content");

      // Update UI to show failure
      setQueueItems((items) =>
        items.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "failed",
                progress: 0,
                error: err.message,
              }
            : item,
        ),
      );
    }
  };

  const handlePauseProcessing = (id: string) => {
    // In this implementation, we can't actually pause OpenAI processing
    // This would be implemented if using a different processing method
    onPauseProcessing(id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "processing":
        return <Badge variant="secondary">Processing</Badge>;
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full bg-background shadow-sm">
      <CardHeader className="pb-3 pt-5 px-6">
        <CardTitle className="text-lg font-semibold">
          Processing Queue
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-5">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <ScrollArea className="pr-4 h-full max-h-[400px]">
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[220px]">
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                <p className="text-muted-foreground">
                  Loading processing queue...
                </p>
              </div>
            ) : queueItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground">
                <p>No items in queue</p>
                <p className="text-sm mt-1">
                  Add transformations to get started
                </p>
              </div>
            ) : (
              queueItems.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-md p-4 bg-card shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-sm truncate max-w-[200px]">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-muted-foreground">
                          {item.sourceType} → {item.targetFormat}
                          {item.targetType && (
                            <span className="ml-1 text-primary">
                              ({item.targetType === "audio" ? "Audio" : "Video"}
                              )
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {getStatusBadge(item.status)}
                    </div>
                  </div>

                  <div className="mt-3">
                    <Progress value={item.progress} className="h-2.5" />
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-muted-foreground">
                        {item.status === "processing"
                          ? "Processing..."
                          : `${item.progress}% complete`}
                      </span>
                      <div className="flex gap-2">
                        {item.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleStartProcessing(item.id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {item.status === "processing" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handlePauseProcessing(item.id)}
                            disabled
                            title="Cannot pause OpenAI processing"
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {item.error && (
                      <div className="mt-2 text-xs text-destructive">
                        Error: {item.error}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ProcessingQueue;
