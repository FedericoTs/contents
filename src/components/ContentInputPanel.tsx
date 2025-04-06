import React, { useState, useCallback, useRef } from "react";
import {
  Upload,
  FileText,
  Video,
  Mic,
  AlertCircle,
  Link as LinkIcon,
  Loader2,
  ExternalLink,
  Clipboard,
  FileType,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
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
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  uploadContentFile,
  saveContentItem,
  supabase,
} from "@/services/supabase";
import { extractTextFromPdf } from "@/services/pdfExtraction";
import { isPdfFile } from "@/services/contentExtraction";
import { useToast } from "@/components/ui/use-toast";

interface ContentInputPanelProps {
  onContentUploaded?: (content: {
    type: "article" | "video" | "podcast" | "unknown";
    file: File;
    preview?: string;
    targetType?: "audio" | "video" | null;
    title?: string;
    content?: string;
    id?: string;
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
  const [pastedText, setPastedText] = useState<string>("");
  const [isPastingText, setIsPastingText] = useState<boolean>(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

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

      // For text files, read the content immediately to ensure it's available for transformation
      let textContent;
      if (detectedType === "article") {
        try {
          // Try to extract text from various file types
          if (file.type.includes("text") || file.type.includes("plain")) {
            textContent = await file.text();
          } else if (isPdfFile(file)) {
            // Extract text from PDF using the PDF extraction service
            console.log("[ContentInputPanel] Extracting text from PDF file");
            try {
              textContent = await extractTextFromPdf(file);
              console.log(
                "[ContentInputPanel] Successfully extracted text from PDF:",
                textContent
                  ? `${textContent.substring(0, 50)}...`
                  : "No content",
              );
            } catch (pdfError) {
              console.error(
                "[ContentInputPanel] PDF extraction error:",
                pdfError,
              );
              textContent = `Content from ${file.name}`; // Fallback if PDF extraction fails
            }
          } else if (file.type.includes("doc")) {
            // For docs, we'll just use the name as a fallback until we implement proper extraction
            textContent = `Content from ${file.name}`;
            console.log(
              "[ContentInputPanel] DOC extraction not implemented yet, using filename as placeholder",
            );
          }

          console.log(
            "[ContentInputPanel] Extracted text content from file:",
            textContent ? `${textContent.substring(0, 50)}...` : "No content",
            "File type:",
            file.type,
          );

          if (!textContent || textContent.trim() === "") {
            console.warn(
              "[ContentInputPanel] No content extracted from file. Using filename as fallback.",
            );
            textContent = `Content from ${file.name}`;
          }
        } catch (err) {
          console.error(
            "[ContentInputPanel] Error extracting text from file:",
            err,
          );
          textContent = `Content from ${file.name}`; // Fallback
        }
      }

      // Upload file to Supabase storage
      const { filePath, publicUrl } = await uploadContentFile(
        file,
        detectedType,
      );

      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      // Save content metadata to database
      const contentItem = await saveContentItem({
        title: file.name,
        contentType: detectedType,
        filePath,
        previewUrl: publicUrl,
        targetType: detectedType === "article" ? targetType : null,
        user_id: userId || null,
        content: textContent, // Ensure content is saved to database
      });

      console.log("[ContentInputPanel] Content item saved to database:", {
        id: contentItem?.id,
        type: detectedType,
        hasContent: !!textContent,
        contentLength: textContent ? textContent.length : 0,
      });

      // Notify parent component
      onContentUploaded({
        type: detectedType,
        file: file,
        preview: publicUrl,
        targetType: detectedType === "article" ? targetType : null,
        title: file.name,
        content: textContent,
        id: contentItem?.id,
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
        // For text files, read the content immediately
        let textContent;
        if (type === "article") {
          try {
            // Try to extract text from various file types
            if (
              uploadedFile.type.includes("text") ||
              uploadedFile.type.includes("plain")
            ) {
              textContent = await uploadedFile.text();
            } else if (isPdfFile(uploadedFile)) {
              // Extract text from PDF using the PDF extraction service
              console.log(
                "[ContentInputPanel] Extracting text from PDF file (manual selection)",
              );
              try {
                textContent = await extractTextFromPdf(uploadedFile);
                console.log(
                  "[ContentInputPanel] Successfully extracted text from PDF (manual selection):",
                  textContent
                    ? `${textContent.substring(0, 50)}...`
                    : "No content",
                );
              } catch (pdfError) {
                console.error(
                  "[ContentInputPanel] PDF extraction error (manual selection):",
                  pdfError,
                );
                textContent = `Content from ${uploadedFile.name}`; // Fallback if PDF extraction fails
              }
            } else if (uploadedFile.type.includes("doc")) {
              // For docs, we'll just use the name as a fallback until we implement proper extraction
              textContent = `Content from ${uploadedFile.name}`;
              console.log(
                "[ContentInputPanel] DOC extraction not implemented yet, using filename as placeholder",
              );
            }

            console.log(
              "[ContentInputPanel] Extracted text content from file (manual selection):",
              textContent ? `${textContent.substring(0, 50)}...` : "No content",
              "File type:",
              uploadedFile.type,
            );

            if (!textContent || textContent.trim() === "") {
              console.warn(
                "[ContentInputPanel] No content extracted from file (manual selection). Using filename as fallback.",
              );
              textContent = `Content from ${uploadedFile.name}`;
            }
          } catch (err) {
            console.error(
              "[ContentInputPanel] Error extracting text from file (manual selection):",
              err,
            );
            textContent = `Content from ${uploadedFile.name}`; // Fallback
          }
        }

        // Upload file to Supabase storage
        const { filePath, publicUrl } = await uploadContentFile(
          uploadedFile,
          type,
        );

        // Get current user
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;

        // Save content metadata to database
        const contentItem = await saveContentItem({
          title: uploadedFile.name,
          contentType: type,
          filePath,
          previewUrl: publicUrl,
          targetType: type === "article" ? targetType : null,
          user_id: userId || null,
          content: textContent, // Ensure content is saved to database
        });

        console.log(
          "[ContentInputPanel] Content item saved to database (manual selection):",
          {
            id: contentItem?.id,
            type: type,
            hasContent: !!textContent,
            contentLength: textContent ? textContent.length : 0,
          },
        );

        // Notify parent component
        onContentUploaded({
          type: type,
          file: uploadedFile,
          preview: publicUrl,
          targetType: type === "article" ? targetType : null,
          title: uploadedFile.name,
          content: textContent,
          id: contentItem?.id,
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

  // Function to fetch and extract content from a URL
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

      // Start processing
      setUploadProgress(20);

      // Import the content extraction service
      const { fetchAndExtractContent } = await import(
        "../services/contentExtraction"
      );

      // Extract content from URL
      setUploadProgress(40);
      const extractedData = await fetchAndExtractContent(processedUrl);
      setUploadProgress(60);

      // Map the extracted content type to our internal type
      const detectedType = extractedData.contentType as
        | "article"
        | "video"
        | "podcast"
        | "unknown";
      const contentTitle =
        extractedData.title || `Content from ${new URL(processedUrl).hostname}`;
      const previewImage = extractedData.imageUrl;
      const extractedContent = extractedData.content;
      const extractedDescription = extractedData.description;

      console.log("[ContentInputPanel] Extracted content from URL:", {
        url: processedUrl,
        type: detectedType,
        title: contentTitle,
        hasContent: !!extractedContent,
        contentLength: extractedContent ? extractedContent.length : 0,
      });

      setUploadProgress(80);

      // Ensure we have actual content to work with
      const finalContent =
        extractedContent && extractedContent.trim() !== ""
          ? extractedContent
          : `Content from ${new URL(processedUrl).hostname}`;

      console.log(
        "[ContentInputPanel] Final content from URL:",
        finalContent ? `${finalContent.substring(0, 50)}...` : "No content",
        "Content length:",
        finalContent ? finalContent.length : 0,
      );

      const contentBlob = new Blob([finalContent], { type: "text/plain" });

      const mockFile = new File(
        [contentBlob],
        `content-from-${new URL(processedUrl).hostname}.txt`,
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
          const contentItem = await saveContentItem({
            title: contentTitle,
            contentType: detectedType,
            url: processedUrl,
            previewUrl: previewImage || processedUrl,
            targetType: detectedType === "article" ? targetType : null,
            user_id: userId || null,
            content: finalContent, // Ensure content is saved to database
            description: extractedDescription,
            author: extractedData.author,
            publishDate: extractedData.publishDate,
          });

          console.log(
            "[ContentInputPanel] Content item from URL saved to database:",
            {
              id: contentItem?.id,
              type: detectedType,
              hasContent: !!finalContent,
              contentLength: finalContent ? finalContent.length : 0,
            },
          );

          // Notify parent component
          onContentUploaded({
            type: detectedType,
            file: mockFile,
            preview: previewImage || processedUrl,
            targetType: detectedType === "article" ? targetType : null,
            title: contentTitle,
            content: finalContent,
            id: contentItem?.id,
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
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="url">From URL</TabsTrigger>
            <TabsTrigger value="paste">Paste Text</TabsTrigger>
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

          <TabsContent value="paste">
            <div className="flex flex-col space-y-3">
              <div className="relative">
                <Textarea
                  ref={textAreaRef}
                  placeholder="Paste or type your content here..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="min-h-[150px] resize-none"
                  disabled={isPastingText}
                />
                {pastedText.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={() => setPastedText("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  {pastedText.length} characters
                </p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 px-3"
                        onClick={() => {
                          navigator.clipboard.readText().then(
                            (text) => {
                              setPastedText(text);
                              toast({
                                title: "Content pasted",
                                description:
                                  "Text has been pasted from clipboard",
                              });
                            },
                            () => {
                              toast({
                                title: "Paste failed",
                                description: "Could not access clipboard",
                                variant: "destructive",
                              });
                            },
                          );
                        }}
                      >
                        <Clipboard className="h-3.5 w-3.5 mr-1.5" /> Paste from
                        Clipboard
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Paste content from clipboard</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {pastedText.length > 0 && (
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

              <Button
                onClick={async () => {
                  if (!pastedText.trim()) {
                    setError("Please enter some text content");
                    return;
                  }

                  setError(null);
                  setIsPastingText(true);
                  simulateUpload();

                  try {
                    // Validate pasted text content
                    if (!pastedText || pastedText.trim() === "") {
                      setError(
                        "The pasted text is empty. Please enter some content.",
                      );
                      return;
                    }

                    console.log(
                      "[ContentInputPanel] Processing pasted text:",
                      pastedText
                        ? `${pastedText.substring(0, 50)}...`
                        : "No content",
                      "Content length:",
                      pastedText ? pastedText.length : 0,
                    );

                    // Create a text file from the pasted content
                    const textBlob = new Blob([pastedText], {
                      type: "text/plain",
                    });
                    const textFile = new File(
                      [textBlob],
                      "pasted-content.txt",
                      { type: "text/plain" },
                    );

                    // Get current user
                    const { data: userData } = await supabase.auth.getUser();
                    const userId = userData.user?.id;

                    console.log("[ContentInputPanel] Pasted text details:", {
                      contentLength: pastedText.length,
                      preview: pastedText.substring(0, 50) + "...",
                      targetType,
                      hasContent: !!pastedText && pastedText.trim() !== "",
                    });

                    // Save content metadata to database
                    const contentItem = await saveContentItem({
                      title: pastedText.substring(0, 30) + "...",
                      contentType: "article",
                      content: pastedText, // Ensure content is saved to database
                      targetType: targetType,
                      user_id: userId || null,
                    });

                    console.log(
                      "[ContentInputPanel] Pasted text saved to database:",
                      {
                        id: contentItem?.id,
                        contentLength: pastedText.length,
                      },
                    );

                    // Notify parent component
                    onContentUploaded({
                      type: "article",
                      file: textFile,
                      targetType: targetType,
                      title: pastedText.substring(0, 30) + "...",
                      content: pastedText,
                      id: contentItem?.id,
                    });

                    toast({
                      title: "Content processed",
                      description:
                        "Your pasted text has been processed successfully.",
                    });
                  } catch (err) {
                    console.error("Error processing pasted text:", err);
                    setError(
                      `Failed to process text: ${err instanceof Error ? err.message : "Unknown error"}`,
                    );
                  } finally {
                    setIsPastingText(false);
                  }
                }}
                disabled={!pastedText.trim() || isPastingText}
                className="mt-2"
              >
                {isPastingText ? (
                  <span className="flex items-center">
                    <Loader2 className="animate-spin h-4 w-4 mr-1.5" />
                    Processing
                  </span>
                ) : (
                  <span className="flex items-center">
                    <FileText className="h-4 w-4 mr-1.5" />
                    Process Text
                  </span>
                )}
              </Button>

              {error && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
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
