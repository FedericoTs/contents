import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Pause,
  Play,
  Trash2,
  XCircle,
} from "lucide-react";
import { getProcessingJobs } from "@/services/processingService";
import { supabase } from "@/services/supabase";

export type ProcessingStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "paused";

export interface ProcessingItem {
  id: string;
  title: string;
  sourceType: string;
  targetFormat: string;
  targetType?: string;
  progress: number;
  status: ProcessingStatus;
  error?: string;
  content_id?: string;
}

export interface ProcessingResult {
  id: string;
  success: boolean;
  output?: any;
  error?: string;
}

export interface ProcessingQueueProps {
  items?: ProcessingItem[];
  onRemoveItem?: (id: string) => void;
  onStartProcessing?: (id: string) => void;
  onPauseProcessing?: (id: string) => void;
  onItemProcessed?: (result: ProcessingResult) => void;
}

const getStatusIcon = (status: ProcessingStatus) => {
  switch (status) {
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "processing":
      return <Play className="h-4 w-4 text-blue-500" />;
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "paused":
      return <Pause className="h-4 w-4 text-gray-500" />;
    default:
      return null;
  }
};

const getStatusBadge = (status: ProcessingStatus) => {
  switch (status) {
    case "pending":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          {getStatusIcon(status)} Pending
        </Badge>
      );
    case "processing":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          {getStatusIcon(status)} Processing
        </Badge>
      );
    case "completed":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          {getStatusIcon(status)} Completed
        </Badge>
      );
    case "failed":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          {getStatusIcon(status)} Failed
        </Badge>
      );
    case "paused":
      return (
        <Badge
          variant="outline"
          className="bg-gray-50 text-gray-700 border-gray-200"
        >
          {getStatusIcon(status)} Paused
        </Badge>
      );
    default:
      return null;
  }
};

const ProcessingQueue = ({
  items: propItems,
  onRemoveItem,
  onStartProcessing,
  onPauseProcessing,
  onItemProcessed,
}: ProcessingQueueProps) => {
  const [items, setItems] = useState<ProcessingItem[]>(propItems || []);
  const [loading, setLoading] = useState(!propItems);
  const [error, setError] = useState<string | null>(null);

  // Import useAuth hook to get the current user
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // If items are provided as props, use those
    if (propItems) {
      setItems(propItems);
      return;
    }

    // Don't fetch if auth is still loading
    if (authLoading) {
      return;
    }

    // Only fetch if we have a user
    if (!user) {
      setError("You must be logged in to view processing jobs");
      setLoading(false);
      return;
    }

    // Otherwise, fetch from the database
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching processing jobs...");
        const jobs = await getProcessingJobs();
        console.log("Fetched jobs:", jobs);
        setItems(jobs);
      } catch (err) {
        console.error("Error fetching processing jobs:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load processing jobs",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();

    // Set up real-time subscription for job updates
    const subscription = supabase
      .channel("processing-jobs-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "processing_jobs",
        },
        (payload) => {
          console.log("Real-time update received:", payload);
          // Handle different types of changes
          if (payload.eventType === "INSERT") {
            setItems((current) => [...current, payload.new as ProcessingItem]);
          } else if (payload.eventType === "UPDATE") {
            setItems((current) =>
              current.map((item) =>
                item.id === payload.new.id
                  ? (payload.new as ProcessingItem)
                  : item,
              ),
            );

            // If job completed or failed, trigger the onItemProcessed callback
            if (
              (payload.new.status === "completed" ||
                payload.new.status === "failed") &&
              onItemProcessed
            ) {
              onItemProcessed({
                id: payload.new.id,
                success: payload.new.status === "completed",
                output: payload.new.output,
                error: payload.new.error,
              });
            }
          } else if (payload.eventType === "DELETE") {
            setItems((current) =>
              current.filter((item) => item.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [propItems, onItemProcessed]);

  const handleRemove = (id: string) => {
    if (onRemoveItem) {
      onRemoveItem(id);
    } else {
      // If no handler provided, just remove from local state
      setItems((current) => current.filter((item) => item.id !== id));
    }
  };

  const handleStartProcessing = (id: string) => {
    if (onStartProcessing) {
      onStartProcessing(id);
    }
  };

  const handlePauseProcessing = (id: string) => {
    if (onPauseProcessing) {
      onPauseProcessing(id);
    }
  };

  if (loading) {
    return (
      <Card className="w-full bg-white">
        <CardHeader>
          <CardTitle>Processing Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center p-6">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-slate-200 h-10 w-10"></div>
              <div className="flex-1 space-y-6 py-1">
                <div className="h-2 bg-slate-200 rounded"></div>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                    <div className="h-2 bg-slate-200 rounded col-span-1"></div>
                  </div>
                  <div className="h-2 bg-slate-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full bg-white">
        <CardHeader>
          <CardTitle>Processing Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>Error: {error}</span>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="w-full bg-white">
        <CardHeader>
          <CardTitle>Processing Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6 text-gray-500">
            <p>No items in the processing queue</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-white">
      <CardHeader>
        <CardTitle>Processing Queue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-900">{item.title}</h3>
                  <div className="text-sm text-gray-500 mt-1">
                    {item.sourceType} → {item.targetFormat}
                    {item.targetType && ` (${item.targetType})`}
                  </div>
                </div>
                <div className="flex space-x-2">
                  {getStatusBadge(item.status)}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(item.id)}
                    title="Remove from queue"
                  >
                    <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                  </Button>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{item.progress}%</span>
                </div>
                <Progress value={item.progress} className="h-2" />
              </div>

              {item.error && (
                <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
                  <AlertCircle className="h-4 w-4 inline mr-1" /> {item.error}
                </div>
              )}

              {(item.status === "pending" || item.status === "paused") && (
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleStartProcessing(item.id)}
                  >
                    <Play className="h-3 w-3 mr-1" /> Start Processing
                  </Button>
                </div>
              )}

              {item.status === "processing" && (
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handlePauseProcessing(item.id)}
                  >
                    <Pause className="h-3 w-3 mr-1" /> Pause
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessingQueue;
