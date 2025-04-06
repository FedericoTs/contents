import React, { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  Video,
  Mic,
  AlertCircle,
  Link as LinkIcon,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  uploadContentFile,
  saveContentItem,
  supabase,
} from "@/services/supabase";
import { useToast } from "@/components/ui/use-toast";

interface ContentInputPanelProps {
  onContentUploaded?: (content: {
    type: "article" | "video" | "podcast" | "unknown";
    file: File;
    preview?: string;
    targetType?: "audio" | "video" | null;
    title?: string;
  }) => void;
}

const ContentInputPanel = ({
  onContentUploaded = () => {},
}: ContentInputPanelProps) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [contentType, setContentType] = useState<
    "article" | "video" | "podcast" | "unknown" | null
  >(null);
  const [targetType, setTargetType] = useState<"audio" | "video" | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string>("");
  const [isProcessingUrl, setIsProcessingUrl] = useState<boolean>(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const detectContentType = (
    file: File,
  ): "article" | "video" | "podcast" | "unknown" => {
    const fileType = file.type.toLowerCase();

    if (
      fileType.includes("text") ||
      fileType.includes("pdf") ||
      fileType.includes("doc")
    ) {
      return "article";
    } else if (fileType.includes("video")) {
      return "video";
    } else if (fileType.includes("audio")) {
      return "podcast";
    } else {
      return "unknown";
    }
  };

  const simulateUpload = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const processFile = async (file: File) => {
    setError(null);
    setUploadedFile(file);
    const detectedType = detectContentType(file);
    setContentType(detectedType);

    if (detectedType === "unknown") {
      setError("Unable to detect content type. Please select manually.");
      return;
    }

    try {
      // Start upload progress animation
      simulateUpload();

      // Upload file to Supabase storage
      const { filePath, publicUrl } = await uploadContentFile(
        file,
        detectedType,
      );

      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      // Save content metadata to database
      await saveContentItem({
        title: file.name,
        contentType: detectedType,
        filePath,
        previewUrl: publicUrl,
        targetType: detectedType === "article" ? targetType : null,
        user_id: userId || null,
      });

      // Notify parent component
      onContentUploaded({
        type: detectedType,
        file: file,
        preview: publicUrl,
        targetType: detectedType === "article" ? targetType : null,
        title: file.name,
      });

      toast({
        title: "Content uploaded",
        description: `Your ${detectedType} has been uploaded successfully.`,
      });
    } catch (err) {
      console.error("Error processing file:", err);
      console.log("Detailed error information:", JSON.stringify(err, null, 2));
      setError(
        `Failed to upload content: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      setUploadProgress(0);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        processFile(file);
      }
    },
    [onContentUploaded],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const handleManualTypeSelection = async (
    type: "article" | "video" | "podcast",
  ) => {
    if (uploadedFile) {
      setContentType(type);
      setError(null);
      simulateUpload();

      try {
        // Upload file to Supabase storage
        const { filePath, publicUrl } = await uploadContentFile(
          uploadedFile,
          type,
        );

        // Get current user
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;

        // Save content metadata to database
        await saveContentItem({
          title: uploadedFile.name,
          contentType: type,
          filePath,
          previewUrl: publicUrl,
          targetType: type === "article" ? targetType : null,
          user_id: userId || null,
        });

        // Notify parent component
        onContentUploaded({
          type: type,
          file: uploadedFile,
          preview: publicUrl,
          targetType: type === "article" ? targetType : null,
          title: uploadedFile.name,
        });

        toast({
          title: "Content uploaded",
          description: `Your ${type} has been uploaded successfully.`,
        });
      } catch (err) {
        console.error("Error processing file:", err);
        setError("Failed to upload content. Please try again.");
        setUploadProgress(0);
      }
    }
  };

  const getContentTypeIcon = () => {
    switch (contentType) {
      case "article":
        return <FileText className="h-10 w-10 text-blue-500" />;
      case "video":
        return <Video className="h-10 w-10 text-red-500" />;
      case "podcast":
        return <Mic className="h-10 w-10 text-purple-500" />;
      case "unknown":
        return <AlertCircle className="h-10 w-10 text-yellow-500" />;
      default:
        return <Upload className="h-10 w-10 text-muted-foreground" />;
    }
  };

  const fetchContentFromUrl = async (inputUrl: string) => {
    if (!inputUrl) {
      setError("Please enter a valid URL");
      return;
    }

    // Reset states
    setError(null);
    setIsProcessingUrl(true);
    setUploadProgress(0);

    try {
      // Validate URL format and add protocol if missing
      let processedUrl = inputUrl.trim();
      if (
        !processedUrl.startsWith("http://") &&
        !processedUrl.startsWith("https://")
      ) {
        processedUrl = "https://" + processedUrl;
      }

      try {
        new URL(processedUrl);
      } catch (e) {
        setError("Invalid URL format. Please enter a valid web address.");
        setIsProcessingUrl(false);
        return;
      }

      // Simulate initial processing
      setUploadProgress(20);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setUploadProgress(40);

      // Determine content type based on URL (enhanced logic)
      let detectedType: "article" | "video" | "podcast" | "unknown" = "unknown";
      const lowerUrl = processedUrl.toLowerCase();
      let contentTitle = "Content from " + new URL(processedUrl).hostname;
      let previewImage: string | undefined = undefined;

      // Enhanced content type detection
      if (
        lowerUrl.includes("youtube.com") ||
        lowerUrl.includes("youtu.be") ||
        lowerUrl.includes("vimeo.com") ||
        lowerUrl.includes("dailymotion.com") ||
        lowerUrl.includes(".mp4") ||
        lowerUrl.includes(".mov") ||
        lowerUrl.includes(".avi") ||
        lowerUrl.includes(".webm")
      ) {
        detectedType = "video";
        contentTitle = "Video from " + new URL(processedUrl).hostname;

        // For YouTube, we can extract a better title and thumbnail
        if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
          // Extract video ID (simplified)
          const videoId = lowerUrl.includes("v=")
            ? lowerUrl.split("v=")[1].split("&")[0]
            : lowerUrl.includes("youtu.be/")
              ? lowerUrl.split("youtu.be/")[1].split("?")[0]
              : "";

          if (videoId) {
            // Use YouTube thumbnail
            previewImage = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            contentTitle = "YouTube Video";
          }
        }
      } else if (
        lowerUrl.includes("spotify.com/episode") ||
        lowerUrl.includes("apple.com/podcast") ||
        lowerUrl.includes("soundcloud.com") ||
        lowerUrl.includes("anchor.fm") ||
        lowerUrl.includes(".mp3") ||
        lowerUrl.includes(".wav") ||
        lowerUrl.includes(".ogg") ||
        lowerUrl.includes("podcast")
      ) {
        detectedType = "podcast";
        contentTitle = "Podcast from " + new URL(processedUrl).hostname;
        previewImage =
          "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80";
      } else if (
        lowerUrl.includes("medium.com") ||
        lowerUrl.includes("blog") ||
        lowerUrl.includes("article") ||
        lowerUrl.includes("news") ||
        lowerUrl.includes(".pdf") ||
        lowerUrl.includes(".doc") ||
        lowerUrl.includes(".txt") ||
        lowerUrl.includes("substack.com") ||
        // Common news and article sites
        lowerUrl.includes("nytimes.com") ||
        lowerUrl.includes("washingtonpost.com") ||
        lowerUrl.includes("bbc.com") ||
        lowerUrl.includes("cnn.com") ||
        lowerUrl.includes("theguardian.com")
      ) {
        detectedType = "article";
        contentTitle = "Article from " + new URL(processedUrl).hostname;
        previewImage =
          "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&q=80";
      }

      // Simulate more processing
      setUploadProgress(60);
      await new Promise((resolve) => setTimeout(resolve, 700));
      setUploadProgress(80);

      // Create a mock file object from the URL
      const mockFile = new File(
        ["dummy content"],
        `content-from-${new URL(processedUrl).hostname}`,
        {
          type:
            detectedType === "article"
              ? "text/plain"
              : detectedType === "video"
                ? "video/mp4"
                : detectedType === "podcast"
                  ? "audio/mp3"
                  : "application/octet-stream",
        },
      );

      setContentType(detectedType);
      setUploadedFile(mockFile);
      setUploadProgress(100);

      if (detectedType === "unknown") {
        setError(
          "Unable to detect content type from URL. Please select manually.",
        );
      } else {
        try {
          // Get current user
          const { data: userData } = await supabase.auth.getUser();
          const userId = userData.user?.id;

          // Save content metadata to database
          await saveContentItem({
            title: contentTitle,
            contentType: detectedType,
            url: processedUrl,
            previewUrl: previewImage || processedUrl,
            targetType: detectedType === "article" ? targetType : null,
            user_id: userId || null,
          });

          // Notify parent component
          onContentUploaded({
            type: detectedType,
            file: mockFile,
            preview: previewImage || processedUrl,
            targetType: detectedType === "article" ? targetType : null,
            title: contentTitle,
          });

          toast({
            title: "Content processed",
            description: `Your ${detectedType} from URL has been processed successfully.`,
          });
        } catch (err) {
          console.error("Error saving URL content:", err);
          setError("Failed to save content from URL. Please try again.");
        }
      }
    } catch (error) {
      setError("Failed to process the URL. Please try again.");
      console.error("Error processing URL:", error);
      setUploadProgress(0);
    } finally {
      setIsProcessingUrl(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-white shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium">Content Input</CardTitle>
        <CardDescription className="text-xs mt-1">
          Upload your content to begin the repurposing process
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-3">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="url">From URL</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <div
              className={`relative flex flex-col items-center justify-center h-40 border border-dashed rounded-md p-5 transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted hover:border-primary"}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {uploadedFile ? (
                <div className="flex flex-col items-center space-y-1.5">
                  {getContentTypeIcon()}
                  <p className="text-xs font-medium">{uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {contentType !== "unknown"
                      ? `Detected as ${contentType}`
                      : "Content type not detected"}
                  </p>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full mt-2">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-center mt-1 text-muted-foreground">
                        {uploadProgress}% uploaded
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-xs font-medium">
                    Drag and drop your content here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports articles, videos, and podcasts
                  </p>
                  <div className="mt-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 px-3"
                        type="button"
                        onClick={() =>
                          document.getElementById("file-upload")?.click()
                        }
                      >
                        Browse Files
                      </Button>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileInput}
                        accept=".txt,.pdf,.doc,.docx,.mp4,.mov,.mp3,.wav"
                      />
                    </label>
                  </div>
                </>
              )}
            </div>

            {error && (
              <Alert variant="destructive" className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {contentType === "unknown" && uploadedFile && (
              <div className="mt-3">
                <p className="text-xs font-medium mb-2">
                  Select content type manually:
                </p>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleManualTypeSelection("article")}
                    className="text-xs h-8 px-3"
                  >
                    <FileText className="h-3.5 w-3.5 mr-1.5" /> Article
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleManualTypeSelection("video")}
                    className="text-xs h-8 px-3"
                  >
                    <Video className="h-3.5 w-3.5 mr-1.5" /> Video
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleManualTypeSelection("podcast")}
                    className="text-xs h-8 px-3"
                  >
                    <Mic className="h-3.5 w-3.5 mr-1.5" /> Podcast
                  </Button>
                </div>
              </div>
            )}

            {contentType === "article" && uploadedFile && (
              <div className="mt-3">
                <p className="text-xs font-medium mb-2">
                  Convert this text to:
                </p>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant={targetType === "audio" ? "default" : "outline"}
                    onClick={() => setTargetType("audio")}
                    className="text-xs h-8 px-3"
                  >
                    <Mic className="h-3.5 w-3.5 mr-1.5" /> Audio Podcast
                  </Button>
                  <Button
                    size="sm"
                    variant={targetType === "video" ? "default" : "outline"}
                    onClick={() => setTargetType("video")}
                    className="text-xs h-8 px-3"
                  >
                    <Video className="h-3.5 w-3.5 mr-1.5" /> Video
                  </Button>
                  <Button
                    size="sm"
                    variant={targetType === null ? "default" : "outline"}
                    onClick={() => setTargetType(null)}
                    className="text-xs h-8 px-3"
                  >
                    <FileText className="h-3.5 w-3.5 mr-1.5" /> Text Only
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="url">
            <div className="flex flex-col space-y-3">
              <div className="flex space-x-2">
                <Input
                  type="url"
                  placeholder="Enter content URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1"
                  disabled={isProcessingUrl}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && url && !isProcessingUrl) {
                      fetchContentFromUrl(url);
                    }
                  }}
                />
                <Button
                  onClick={() => fetchContentFromUrl(url)}
                  disabled={!url || isProcessingUrl}
                  className="h-9"
                >
                  {isProcessingUrl ? (
                    <span className="flex items-center">
                      <Loader2 className="animate-spin h-4 w-4 mr-1.5" />
                      Processing
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <LinkIcon className="h-4 w-4 mr-1.5" />
                      Fetch
                    </span>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1 mb-2">
                Enter a URL to an article, video, or podcast to process its
                content
              </p>

              {uploadedFile && contentType && url && (
                <div className="mt-2 p-3 border rounded-md bg-muted/20">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">{getContentTypeIcon()}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium truncate max-w-[200px]">
                          {contentType !== "unknown"
                            ? `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} from URL`
                            : "Unknown content"}
                        </p>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary flex items-center hover:underline"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open
                        </a>
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                        {url}
                      </p>

                      {uploadProgress > 0 && (
                        <div className="w-full mt-2">
                          <Progress value={uploadProgress} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {uploadProgress < 100
                              ? `${uploadProgress}% processed`
                              : "Processing complete"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {contentType === "article" && uploadedFile && (
                <div className="mt-3">
                  <p className="text-xs font-medium mb-2">
                    Convert this text to:
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant={targetType === "audio" ? "default" : "outline"}
                      onClick={() => setTargetType("audio")}
                      className="text-xs h-8 px-3"
                    >
                      <Mic className="h-3.5 w-3.5 mr-1.5" /> Audio Podcast
                    </Button>
                    <Button
                      size="sm"
                      variant={targetType === "video" ? "default" : "outline"}
                      onClick={() => setTargetType("video")}
                      className="text-xs h-8 px-3"
                    >
                      <Video className="h-3.5 w-3.5 mr-1.5" /> Video
                    </Button>
                    <Button
                      size="sm"
                      variant={targetType === null ? "default" : "outline"}
                      onClick={() => setTargetType(null)}
                      className="text-xs h-8 px-3"
                    >
                      <FileText className="h-3.5 w-3.5 mr-1.5" /> Text Only
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        {uploadedFile && (
          <Button
            variant="outline"
            onClick={() => {
              setUploadedFile(null);
              setContentType(null);
              setUploadProgress(0);
              setError(null);
            }}
            className="text-xs h-8 px-3"
          >
            Clear
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ContentInputPanel;
