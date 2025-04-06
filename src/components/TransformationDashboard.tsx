import React, { useState, useEffect } from "react";
import { supabase } from "@/services/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  Settings,
  Wand2,
  Sparkles,
  FileText,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Facebook,
  Mic,
  Video,
  Loader2,
} from "lucide-react";

interface TransformationDashboardProps {
  onAddToQueue?: (transformation: TransformationConfig) => void;
  contentType?: "article" | "video" | "podcast";
  contentTitle?: string;
  targetType?: "audio" | "video" | null;
  contentId?: string;
  contentText?: string;
}

interface TransformationConfig {
  sourceType: string;
  targetFormat: string;
  method: "manual" | "ai";
  targetType?: "audio" | "video" | null;
  sampleOutput?: string;
  jobId?: string;
  contentId?: string;
  settings: {
    tone?: string;
    length?: number;
    platforms?: string[];
    preserveKeyPoints?: boolean;
  };
}

interface ContentItem {
  id: string;
  title: string;
  content_type: string;
  content: string | null;
  created_at: string;
}

// Helper function to fetch content from database
async function fetchContentFromDatabase(contentId: string): Promise<string> {
  try {
    console.log(
      "[TransformationDashboard] Fetching content from database for ID:",
      contentId,
    );
    const { data, error } = await supabase
      .from("content_items")
      .select("content")
      .eq("id", contentId)
      .single();

    if (error) {
      console.error("[TransformationDashboard] Error fetching content:", error);
      return "This is a sample article about content repurposing. Content repurposing is the practice of taking existing content and transforming it into new formats to reach different audiences or serve different purposes.";
    }

    if (!data || !data.content) {
      console.warn(
        "[TransformationDashboard] No content found in database, using sample",
      );
      return "This is a sample article about content repurposing. Content repurposing is the practice of taking existing content and transforming it into new formats to reach different audiences or serve different purposes.";
    }

    console.log(
      "[TransformationDashboard] Successfully fetched content from database",
    );
    return data.content;
  } catch (error) {
    console.error(
      "[TransformationDashboard] Error in fetchContentFromDatabase:",
      error,
    );
    return "This is a sample article about content repurposing. Content repurposing is the practice of taking existing content and transforming it into new formats to reach different audiences or serve different purposes.";
  }
}

const TransformationDashboard: React.FC<TransformationDashboardProps> = ({
  onAddToQueue = () => {},
  contentType = "article",
  contentTitle = "Untitled Content",
  targetType = null,
  contentId,
  contentText,
}) => {
  const [selectedTab, setSelectedTab] = useState("format");
  const [targetFormat, setTargetFormat] = useState("social-posts");
  const [transformMethod, setTransformMethod] = useState<"manual" | "ai">("ai");
  const [contentLength, setContentLength] = useState(50);
  const [contentTone, setContentTone] = useState("professional");
  const [preserveKeyPoints, setPreserveKeyPoints] = useState(true);
  const [sampleOutput, setSampleOutput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedContent, setProcessedContent] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "instagram",
    "twitter",
  ]);

  // New state for content selection
  const [availableContent, setAvailableContent] = useState<ContentItem[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<
    string | undefined
  >(contentId);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [selectedContentTitle, setSelectedContentTitle] =
    useState<string>(contentTitle);
  const [selectedContentType, setSelectedContentType] =
    useState<string>(contentType);

  // Fetch available content from the database
  const fetchAvailableContent = async () => {
    setIsLoadingContent(true);
    try {
      const { data, error } = await supabase
        .from("content_items")
        .select("id, title, content_type, content, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log(
        "[TransformationDashboard] Fetched content items:",
        data?.length || 0,
      );
      setAvailableContent(data || []);
    } catch (error) {
      console.error(
        "[TransformationDashboard] Error fetching content items:",
        error,
      );
    } finally {
      setIsLoadingContent(false);
    }
  };

  // Load content when selected content changes
  useEffect(() => {
    const loadSelectedContent = async () => {
      if (!selectedContentId) return;

      try {
        const { data, error } = await supabase
          .from("content_items")
          .select("*")
          .eq("id", selectedContentId)
          .single();

        if (error) throw error;
        if (data) {
          console.log(
            "[TransformationDashboard] Loaded selected content:",
            data.title,
          );
          setSelectedContentType(data.content_type || "article");
          setSelectedContentTitle(data.title || "Untitled Content");

          // Set appropriate target format based on content type
          if (data.content_type === "article") {
            setTargetFormat("social-posts");
          } else if (data.content_type === "video") {
            setTargetFormat("blog-article");
          } else if (data.content_type === "podcast") {
            setTargetFormat("blog-article");
          }
        }
      } catch (error) {
        console.error(
          "[TransformationDashboard] Error loading selected content:",
          error,
        );
      }
    };

    loadSelectedContent();
  }, [selectedContentId]);

  // Initial setup
  useEffect(() => {
    // Set default values based on content type
    if (contentType === "article") {
      setTargetFormat("social-posts");
    } else if (contentType === "video") {
      setTargetFormat("blog-article");
    } else if (contentType === "podcast") {
      setTargetFormat("blog-article");
    }

    // Set selected content ID if provided
    if (contentId) {
      setSelectedContentId(contentId);
    }

    // Fetch available content
    fetchAvailableContent();
  }, [contentType, contentId]);

  const handleAddToQueue = async () => {
    setIsProcessing(true);
    setProcessingError(null);
    console.log("[TransformationDashboard] Starting handleAddToQueue", {
      contentType: selectedContentType || contentType,
      contentTitle: selectedContentTitle || contentTitle,
      targetFormat,
      contentId: selectedContentId || contentId,
      contentText: contentText ? `${contentText.substring(0, 50)}...` : null,
    });

    const transformationConfig: TransformationConfig = {
      sourceType: selectedContentType || contentType,
      targetFormat,
      method: transformMethod,
      targetType: targetType,
      sampleOutput: sampleOutput.trim() !== "" ? sampleOutput : undefined,
      settings: {
        tone: contentTone,
        length: contentLength,
        platforms: selectedPlatforms,
        preserveKeyPoints,
      },
    };
    console.log(
      "[TransformationDashboard] Created transformationConfig:",
      transformationConfig,
    );

    try {
      // Create processing options
      const processingOptions = {
        contentType: selectedContentType || contentType,
        targetFormat,
        tone: contentTone,
        length: contentLength,
        preserveKeyPoints,
        platforms: selectedPlatforms,
        customInstructions:
          sampleOutput.trim() !== "" ? sampleOutput : undefined,
      };
      console.log(
        "[TransformationDashboard] Created processingOptions:",
        processingOptions,
      );

      // First, check if the content_id exists in content_items table
      let actualContentId = selectedContentId || contentId;
      console.log(
        "[TransformationDashboard] Initial contentId:",
        actualContentId,
      );

      if (actualContentId) {
        // Verify the content_id exists
        console.log(
          "[TransformationDashboard] Verifying content_id exists in database",
        );
        const { data: contentExists, error: contentCheckError } = await supabase
          .from("content_items")
          .select("id")
          .eq("id", actualContentId)
          .single();

        console.log("[TransformationDashboard] Content verification result:", {
          contentExists,
          contentCheckError,
        });

        if (contentCheckError || !contentExists) {
          console.log(
            "[TransformationDashboard] Content ID not found, creating a new content item",
          );
          actualContentId = null; // Reset to create a new one
        }
      }

      // If no valid content_id, create a new content item first
      if (!actualContentId) {
        console.log(
          "[TransformationDashboard] Creating new content item with title:",
          selectedContentTitle || contentTitle,
        );
        // Create sample content if none is provided
        const sampleContent =
          contentText ||
          "This is a sample article about content repurposing. Content repurposing is the practice of taking existing content and transforming it into new formats to reach different audiences or serve different purposes. It's an efficient way to maximize the value of your content creation efforts.";

        const { data: newContent, error: newContentError } = await supabase
          .from("content_items")
          .insert({
            title: selectedContentTitle || contentTitle,
            content_type: selectedContentType || contentType,
            status: "pending",
            content: sampleContent,
          })
          .select()
          .single();

        if (newContentError) {
          console.error(
            "[TransformationDashboard] Error creating new content item:",
            newContentError,
          );
          throw newContentError;
        }
        console.log(
          "[TransformationDashboard] Created new content item:",
          newContent,
        );
        actualContentId = newContent.id;
      }

      // Create a processing job in the database
      console.log(
        "[TransformationDashboard] Creating processing job with content_id:",
        actualContentId,
      );
      const { data, error } = await supabase
        .from("processing_jobs")
        .insert({
          content_id: actualContentId,
          target_format: targetFormat,
          status: "pending",
          options: processingOptions,
        })
        .select()
        .single();

      if (error) {
        console.error(
          "[TransformationDashboard] Error creating processing job:",
          error,
        );
        throw error;
      }
      console.log("[TransformationDashboard] Created processing job:", data);

      // Process content directly using OpenAI
      // We'll process even if contentText is empty - we'll use sample content in that case
      console.log(
        "[TransformationDashboard] Processing content with OpenAI",
        contentText ? "(user provided content)" : "(using sample content)",
      );
      try {
        // Import the OpenAI service
        const { processTextContent } = await import(
          "../services/openaiService"
        );

        // Get the content to process - prioritize the uploaded content
        let contentToProcess;
        if (contentText) {
          console.log(
            "[TransformationDashboard] Using uploaded content for processing",
          );
          contentToProcess = contentText;
        } else {
          console.log(
            "[TransformationDashboard] Fetching content from database",
          );
          contentToProcess = await fetchContentFromDatabase(actualContentId);
        }

        // Process the content
        console.log(
          "[TransformationDashboard] Calling processTextContent with options:",
          processingOptions,
        );
        const result = await processTextContent(
          contentToProcess,
          processingOptions,
        );
        console.log(
          "[TransformationDashboard] Received result from OpenAI:",
          result ? `${result.substring(0, 100)}...` : null,
        );

        // Update the processing job with the result
        console.log(
          "[TransformationDashboard] Updating processing job with result",
        );
        const { error: updateJobError } = await supabase
          .from("processing_jobs")
          .update({
            status: "completed",
            result,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.id);

        if (updateJobError) {
          console.error(
            "[TransformationDashboard] Error updating processing job:",
            updateJobError,
          );
        }

        // Set the processed content
        setProcessedContent(result);

        // Update the content item with the processed content
        console.log(
          "[TransformationDashboard] Updating content item with processed content",
        );
        const { error: updateContentError } = await supabase
          .from("content_items")
          .update({
            processed_content: result,
            status: "processed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", actualContentId);

        if (updateContentError) {
          console.error(
            "[TransformationDashboard] Error updating content item:",
            updateContentError,
          );
        }
      } catch (openaiError) {
        console.error(
          "[TransformationDashboard] Error processing with OpenAI:",
          openaiError,
        );
        setProcessingError(
          openaiError.message || "Failed to process content with OpenAI",
        );

        // Update the processing job with the error
        console.log(
          "[TransformationDashboard] Updating processing job with error",
        );
        await supabase
          .from("processing_jobs")
          .update({
            status: "failed",
            error: openaiError.message,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.id);
      }

      // Notify parent component with the transformation config and job ID
      console.log(
        "[TransformationDashboard] Notifying parent component with config:",
        {
          ...transformationConfig,
          jobId: data?.id,
          contentId: actualContentId,
        },
      );
      onAddToQueue({
        ...transformationConfig,
        jobId: data?.id,
        contentId: actualContentId,
      });
    } catch (error) {
      console.error("[TransformationDashboard] Error adding to queue:", error);
      setProcessingError(error.message || "Failed to add to processing queue");
      console.log(
        "[TransformationDashboard] Detailed error information:",
        JSON.stringify(error, null, 2),
      );
    } finally {
      setIsProcessing(false);
      console.log("[TransformationDashboard] Finished handleAddToQueue");
    }
  };

  const togglePlatform = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return <Instagram className="h-4 w-4" />;
      case "twitter":
        return <Twitter className="h-4 w-4" />;
      case "linkedin":
        return <Linkedin className="h-4 w-4" />;
      case "youtube":
        return <Youtube className="h-4 w-4" />;
      case "facebook":
        return <Facebook className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
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
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full max-w-3xl bg-white shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          Transformation Dashboard
        </CardTitle>
        <CardDescription>
          Configure how you want to transform your content
          {selectedContentTitle && (
            <span className="font-medium"> {selectedContentTitle}</span>
          )}
          {targetType && (
            <span className="ml-2 text-primary">
              (Converting to{" "}
              {targetType === "audio" ? "Audio Podcast" : "Video"})
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Content Selection Dropdown */}
        <div className="mb-6">
          <Label
            htmlFor="content-selection"
            className="text-sm font-medium mb-2 block"
          >
            Select Content to Transform
          </Label>
          <Select
            value={selectedContentId}
            onValueChange={(value) => setSelectedContentId(value)}
            disabled={isLoadingContent}
          >
            <SelectTrigger id="content-selection" className="w-full">
              <SelectValue placeholder="Select content to transform" />
            </SelectTrigger>
            <SelectContent>
              {availableContent.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  <div className="flex items-center">
                    {getContentTypeIcon(item.content_type)}
                    <span className="ml-2 truncate">{item.title}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isLoadingContent && (
            <div className="flex items-center mt-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
              Loading content...
            </div>
          )}
        </div>

        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="format">Target Format</TabsTrigger>
            <TabsTrigger value="method">Transformation Method</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="format" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target-format">Select Target Format</Label>
              <Select value={targetFormat} onValueChange={setTargetFormat}>
                <SelectTrigger id="target-format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="social-posts">
                    Social Media Posts
                  </SelectItem>
                  <SelectItem value="blog-article">Blog Article</SelectItem>
                  <SelectItem value="newsletter">Email Newsletter</SelectItem>
                  <SelectItem value="video-script">Video Script</SelectItem>
                  <SelectItem value="podcast-script">Podcast Script</SelectItem>
                  <SelectItem value="infographic">
                    Infographic Content
                  </SelectItem>
                  {targetType === "audio" && (
                    <SelectItem value="audio-podcast">Audio Podcast</SelectItem>
                  )}
                  {targetType === "video" && (
                    <SelectItem value="video-content">Video Content</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {targetFormat === "social-posts" && (
              <div className="space-y-2 pt-2">
                <Label>Select Platforms</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    "instagram",
                    "twitter",
                    "linkedin",
                    "facebook",
                    "youtube",
                  ].map((platform) => (
                    <Button
                      key={platform}
                      variant={
                        selectedPlatforms.includes(platform)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => togglePlatform(platform)}
                      className="flex items-center gap-1 capitalize"
                    >
                      {getPlatformIcon(platform)}
                      {platform}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4">
              <Button
                onClick={() => setSelectedTab("method")}
                className="w-full"
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="method" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card
                className={`cursor-pointer border-2 ${transformMethod === "ai" ? "border-primary" : "border-muted"}`}
                onClick={() => setTransformMethod("ai")}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Wand2 className="mr-2 h-5 w-5 text-primary" />
                    Quick Transform
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Let AI recommend the best transformations based on your
                    content.
                  </p>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer border-2 ${transformMethod === "manual" ? "border-primary" : "border-muted"}`}
                onClick={() => setTransformMethod("manual")}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Settings className="mr-2 h-5 w-5 text-primary" />
                    Manual Selection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Customize every aspect of the transformation process.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="pt-4 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setSelectedTab("format")}
              >
                Back
              </Button>
              <Button onClick={() => setSelectedTab("settings")}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="content-tone">Content Tone</Label>
                <Select value={contentTone} onValueChange={setContentTone}>
                  <SelectTrigger id="content-tone">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="humorous">Humorous</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="content-length">Content Length</Label>
                  <span className="text-sm text-muted-foreground">
                    {contentLength}%
                  </span>
                </div>
                <Slider
                  id="content-length"
                  min={10}
                  max={200}
                  step={10}
                  value={[contentLength]}
                  onValueChange={(value) => setContentLength(value[0])}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Percentage relative to original content length
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="preserve-key-points"
                  checked={preserveKeyPoints}
                  onCheckedChange={setPreserveKeyPoints}
                />
                <Label htmlFor="preserve-key-points">
                  Preserve key points from original content
                </Label>
              </div>

              {transformMethod === "manual" && (
                <div className="space-y-2">
                  <Label htmlFor="custom-instructions">
                    Custom Instructions
                  </Label>
                  <Textarea
                    id="custom-instructions"
                    placeholder="Add any specific instructions for the transformation..."
                    className="min-h-[100px]"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="sample-output">Sample Output (Optional)</Label>
                <Textarea
                  id="sample-output"
                  value={sampleOutput}
                  onChange={(e) => setSampleOutput(e.target.value)}
                  placeholder="Provide a sample of the type of output you want to produce..."
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This helps the AI understand your desired output style and
                  format
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setSelectedTab("method")}
              >
                Back
              </Button>
              <Button
                onClick={handleAddToQueue}
                className="gap-2"
                disabled={isProcessing || (!selectedContentId && !contentText)}
              >
                {isProcessing ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Add to Processing Queue
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col border-t pt-4">
        <div className="flex justify-between w-full">
          <div>
            <p className="text-sm font-medium">Selected Transformation:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge variant="outline" className="text-xs">
                {selectedContentType || contentType}
              </Badge>
              <Badge variant="outline" className="text-xs">
                →
              </Badge>
              <Badge className="text-xs">
                {targetFormat.replace("-", " ")}
              </Badge>
              {targetFormat === "social-posts" &&
                selectedPlatforms.map((platform) => (
                  <Badge
                    key={platform}
                    variant="secondary"
                    className="text-xs flex items-center gap-1"
                  >
                    {getPlatformIcon(platform)}
                    {platform}
                  </Badge>
                ))}
            </div>
          </div>
        </div>

        {processingError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            <p className="font-medium">Error:</p>
            <p>{processingError}</p>
          </div>
        )}

        {processedContent && (
          <div className="mt-4 w-full">
            <p className="text-sm font-medium mb-2">Processed Content:</p>
            <div className="p-3 bg-muted/20 border rounded-md max-h-60 overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap">
                {processedContent}
              </pre>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default TransformationDashboard;
