import React, { useState } from "react";
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
  settings: {
    tone?: string;
    length?: number;
    platforms?: string[];
    preserveKeyPoints?: boolean;
  };
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

  const handleAddToQueue = async () => {
    setIsProcessing(true);
    setProcessingError(null);

    const transformationConfig: TransformationConfig = {
      sourceType: contentType,
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

    try {
      // Create processing options
      const processingOptions = {
        contentType,
        targetFormat,
        tone: contentTone,
        length: contentLength,
        preserveKeyPoints,
        platforms: selectedPlatforms,
        customInstructions:
          sampleOutput.trim() !== "" ? sampleOutput : undefined,
      };

      // First, check if the content_id exists in content_items table
      let actualContentId = contentId;

      if (actualContentId) {
        // Verify the content_id exists
        const { data: contentExists, error: contentCheckError } = await supabase
          .from("content_items")
          .select("id")
          .eq("id", actualContentId)
          .single();

        if (contentCheckError || !contentExists) {
          console.log("Content ID not found, creating a new content item");
          actualContentId = null; // Reset to create a new one
        }
      }

      // If no valid content_id, create a new content item first
      if (!actualContentId) {
        const { data: newContent, error: newContentError } = await supabase
          .from("content_items")
          .insert({
            title: contentTitle,
            content_type: contentType,
            status: "pending",
          })
          .select()
          .single();

        if (newContentError) throw newContentError;
        actualContentId = newContent.id;
      }

      // Create a processing job in the database
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

      if (error) throw error;

      // If we have content text, process it directly using OpenAI
      if (contentText) {
        try {
          // Import the OpenAI service
          const { processTextContent } = await import(
            "../services/openaiService"
          );

          // Process the content
          const result = await processTextContent(
            contentText,
            processingOptions,
          );

          // Update the processing job with the result
          await supabase
            .from("processing_jobs")
            .update({
              status: "completed",
              result,
              updated_at: new Date().toISOString(),
            })
            .eq("id", data.id);

          // Set the processed content
          setProcessedContent(result);

          // Update the content item with the processed content
          await supabase
            .from("content_items")
            .update({
              processed_content: result,
              status: "processed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", actualContentId);
        } catch (openaiError) {
          console.error("Error processing with OpenAI:", openaiError);
          setProcessingError(
            openaiError.message || "Failed to process content with OpenAI",
          );

          // Update the processing job with the error
          await supabase
            .from("processing_jobs")
            .update({
              status: "failed",
              error: openaiError.message,
              updated_at: new Date().toISOString(),
            })
            .eq("id", data.id);
        }
      }

      // Notify parent component
      onAddToQueue(transformationConfig);
    } catch (error) {
      console.error("Error adding to queue:", error);
      setProcessingError(error.message || "Failed to add to processing queue");
      console.log(
        "Detailed error information:",
        JSON.stringify(error, null, 2),
      );
    } finally {
      setIsProcessing(false);
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

  return (
    <Card className="w-full max-w-3xl bg-white shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          Transformation Dashboard
        </CardTitle>
        <CardDescription>
          Configure how you want to transform your {contentType}:{" "}
          <span className="font-medium">{contentTitle}</span>
          {targetType && (
            <span className="ml-2 text-primary">
              (Converting to{" "}
              {targetType === "audio" ? "Audio Podcast" : "Video"})
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                disabled={isProcessing}
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
                {contentType}
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
