import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trash2,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";

interface QueueItem {
  id: string;
  title: string;
  sourceType: "article" | "video" | "podcast";
  targetFormat: string;
  targetType?: "audio" | "video" | null;
  progress: number;
  status: "pending" | "processing" | "completed" | "failed";
}

interface ProcessingQueueProps {
  items?: QueueItem[];
  onRemoveItem?: (id: string) => void;
  onStartProcessing?: (id: string) => void;
  onPauseProcessing?: (id: string) => void;
}

const ProcessingQueue = ({
  items = [
    {
      id: "1",
      title: "Blog post about AI trends",
      sourceType: "article",
      targetFormat: "Social Media Posts",
      progress: 75,
      status: "processing",
    },
    {
      id: "2",
      title: "Product demo video",
      sourceType: "video",
      targetFormat: "Blog Article",
      progress: 100,
      status: "completed",
    },
    {
      id: "3",
      title: "Interview with industry expert",
      sourceType: "podcast",
      targetFormat: "Newsletter",
      progress: 0,
      status: "pending",
    },
    {
      id: "5",
      title: "Research paper on AI ethics",
      sourceType: "article",
      targetFormat: "Audio Podcast",
      targetType: "audio",
      progress: 45,
      status: "processing",
    },
    {
      id: "6",
      title: "Marketing strategy document",
      sourceType: "article",
      targetFormat: "Video Content",
      targetType: "video",
      progress: 10,
      status: "processing",
    },
    {
      id: "4",
      title: "Technical tutorial",
      sourceType: "video",
      targetFormat: "How-to Guide",
      progress: 30,
      status: "failed",
    },
  ],
  onRemoveItem = () => {},
  onStartProcessing = () => {},
  onPauseProcessing = () => {},
}: ProcessingQueueProps) => {
  const [queueItems, setQueueItems] = useState<QueueItem[]>(items);

  const handleRemoveItem = (id: string) => {
    setQueueItems(queueItems.filter((item) => item.id !== id));
    onRemoveItem(id);
  };

  const handleStartProcessing = (id: string) => {
    onStartProcessing(id);
  };

  const handlePauseProcessing = (id: string) => {
    onPauseProcessing(id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case "processing":
        return <Play className="h-4 w-4 text-blue-500" />;
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
        <ScrollArea className="pr-4 h-full">
          <div className="space-y-4">
            {queueItems.length === 0 ? (
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
                        {item.progress}% complete
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
