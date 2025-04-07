import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Share2,
  Edit,
  Copy,
  Check,
  History,
  FileText,
  Video,
  Mic,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/services/supabase";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface OutputPreviewProps {
  originalContent?: {
    type: "article" | "video" | "podcast";
    title: string;
    content: string;
    thumbnail?: string;
  };
  repurposedContent?: {
    type: string;
    title: string;
    content: string;
    platform?: string;
    mediaUrl?: string;
    mediaType?: "audio" | "video";
  }[];
  processingResult?: any;
  contentId?: string;
  contentType?: string;
  targetFormat?: string;
}

interface ContentOutput {
  id: string;
  content_id: string;
  output_type: string;
  target_format: string;
  processed_content: string;
  created_at: string;
  options: any;
}

const OutputPreview = ({
  originalContent = {
    type: "article",
    title: "How AI is Transforming Content Creation",
    content:
      "Artificial intelligence is revolutionizing how content creators work. From automated editing to smart content suggestions, AI tools are helping creators save time and improve quality...",
    thumbnail:
      "https://images.unsplash.com/photo-1677442135968-6d89469c5f97?w=800&q=80",
  },
  repurposedContent: initialRepurposedContent = [
    {
      type: "social",
      title: "Twitter Post",
      content:
        "AI is changing the game for content creators! Our new article explores how these tools can save you time and boost quality. #ContentCreation #AI",
      platform: "twitter",
    },
    {
      type: "social",
      title: "LinkedIn Post",
      content:
        "Excited to share our latest insights on how AI is transforming content creation workflows. From automated editing to smart suggestions, these tools are becoming essential for modern creators. What AI tools are you using in your content strategy?",
      platform: "linkedin",
    },
    {
      type: "newsletter",
      title: "Weekly Newsletter Excerpt",
      content:
        "This week, we dive into the world of AI-powered content creation. Discover how these innovative tools are helping creators work smarter, not harder, while maintaining their unique voice and style.",
      platform: "email",
    },
    {
      type: "audio",
      title: "Audio Podcast",
      content:
        "This is an AI-generated audio podcast based on your content. Listen to the full episode to hear your content in an engaging audio format.",
      mediaUrl: "https://example.com/sample-podcast.mp3",
      mediaType: "audio",
    },
    {
      type: "video",
      title: "Video Content",
      content:
        "This is an AI-generated video based on your content. Watch the full video to see your content brought to life with visuals and narration.",
      mediaUrl: "https://example.com/sample-video.mp4",
      mediaType: "video",
    },
  ],
  processingResult,
  contentId,
  contentType = "article",
  targetFormat = "social-posts",
}: OutputPreviewProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  const [previousOutputs, setPreviousOutputs] = useState<ContentOutput[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedOutput, setSelectedOutput] = useState<string | null>(
    processingResult,
  );

  // Process the result from OpenAI if available
  const repurposedContent = React.useMemo(() => {
    if (!processingResult) return initialRepurposedContent;

    try {
      // If the result is a JSON string, parse it
      if (
        typeof processingResult === "string" &&
        processingResult.trim().startsWith("[")
      ) {
        try {
          // Try to parse as JSON array of social posts
          const parsedContent = JSON.parse(processingResult);
          if (Array.isArray(parsedContent)) {
            return parsedContent.map((post) => ({
              type: "social",
              title: post.platform || "Social Post",
              content: post.content,
              platform: post.platform?.toLowerCase() || "generic",
              hashtags: post.hashtags,
            }));
          }
        } catch (e) {
          console.log("Not valid JSON, treating as text");
        }
      }

      // If it's a string but not JSON, or parsing failed
      if (typeof processingResult === "string") {
        // Determine the type based on content patterns
        let type = "blog-article";
        let title = "Generated Content";

        if (
          processingResult.includes("Subject:") ||
          processingResult.includes("Dear")
        ) {
          type = "newsletter";
          title = "Generated Newsletter";

          // Try to extract subject line
          const subjectMatch = processingResult.match(/Subject:\s*([^\n]+)/);
          if (subjectMatch && subjectMatch[1]) {
            title = subjectMatch[1];
          }
        } else if (
          processingResult.includes("SCENE") ||
          processingResult.includes("CUT TO:")
        ) {
          type = "video";
          title = "Video Script";
        } else if (
          processingResult.includes("HOST:") ||
          processingResult.includes("SPEAKER")
        ) {
          type = "podcast";
          title = "Podcast Script";
        }

        return [
          {
            type,
            title,
            content: processingResult,
            platform: type === "newsletter" ? "email" : undefined,
          },
        ];
      }

      // If it's an object with text/audioUrl/videoUrl properties
      if (typeof processingResult === "object" && processingResult !== null) {
        const results = [];

        if (processingResult.text) {
          results.push({
            type: "blog-article",
            title: "Generated Text Content",
            content: processingResult.text,
          });
        }

        if (processingResult.audioUrl) {
          results.push({
            type: "audio",
            title: "Generated Audio",
            content: "AI-generated audio based on your content.",
            mediaUrl: processingResult.audioUrl,
            mediaType: "audio",
          });
        }

        if (processingResult.videoUrl) {
          results.push({
            type: "video",
            title: "Generated Video",
            content: "AI-generated video based on your content.",
            mediaUrl: processingResult.videoUrl,
            mediaType: "video",
          });
        }

        return results.length > 0 ? results : initialRepurposedContent;
      }
    } catch (error) {
      console.error("Error processing result:", error);
    }

    return initialRepurposedContent;
  }, [processingResult, initialRepurposedContent]);

  const [selectedTemplate, setSelectedTemplate] = useState("default");
  const [activeRepurposedContent, setActiveRepurposedContent] = useState(
    repurposedContent[0],
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(
    activeRepurposedContent?.content || "",
  );

  // Fetch previous outputs for this content
  useEffect(() => {
    if (contentId) {
      fetchPreviousOutputs(contentId);
    }
  }, [contentId, processingResult]);

  // Reset selected output when processing result changes
  useEffect(() => {
    setSelectedOutput(processingResult);
  }, [processingResult]);

  const fetchPreviousOutputs = async (contentId: string) => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("content_outputs")
        .select("*")
        .eq("content_id", contentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPreviousOutputs(data || []);
    } catch (error) {
      console.error("Error fetching previous outputs:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value);
  };

  const handleContentSelect = (content: (typeof repurposedContent)[0]) => {
    setActiveRepurposedContent(content);
    setEditedContent(content.content);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // In a real app, this would update the content in state/database
    setIsEditing(false);
    // Update the active content with edited content
    if (activeRepurposedContent) {
      activeRepurposedContent.content = editedContent;
    }
  };

  const handleCopy = () => {
    if (selectedOutput) {
      navigator.clipboard.writeText(selectedOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to clipboard",
        description: "The processed content has been copied to your clipboard.",
      });
    }
  };

  const handleDownload = () => {
    if (selectedOutput) {
      const blob = new Blob([selectedOutput], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `processed-content-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Content downloaded",
        description:
          "The processed content has been downloaded as a text file.",
      });
    }
  };

  const getPlatformColor = (platform?: string) => {
    switch (platform) {
      case "twitter":
        return "bg-blue-500";
      case "linkedin":
        return "bg-blue-700";
      case "instagram":
        return "bg-purple-600";
      case "facebook":
        return "bg-blue-600";
      case "email":
        return "bg-green-600";
      default:
        return "bg-gray-500";
    }
  };

  const getContentTypeIcon = (type = contentType) => {
    switch (type) {
      case "article":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "video":
        return <Video className="h-5 w-5 text-red-500" />;
      case "podcast":
        return <Mic className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (!processingResult && previousOutputs.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-background p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Output Preview</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Content */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Original Content</CardTitle>
            <CardDescription>Your uploaded content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video relative rounded-md overflow-hidden bg-muted">
              {originalContent.thumbnail ? (
                <img
                  src={originalContent.thumbnail}
                  alt={originalContent.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No preview available
                </div>
              )}
              <Badge className="absolute top-2 right-2 capitalize">
                {originalContent.type}
              </Badge>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{originalContent.title}</h3>
              <p className="mt-2 text-muted-foreground line-clamp-6">
                {originalContent.content}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Repurposed Content */}
        <Card className="h-full">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Repurposed Content</CardTitle>
                <CardDescription>
                  AI-generated content variations
                </CardDescription>
              </div>
              <Select
                value={selectedTemplate}
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="branded">Branded</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="mt-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    {getContentTypeIcon()}
                    <span className="text-sm font-medium capitalize">
                      {contentType}
                    </span>
                  </div>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="outline" className="capitalize">
                    {targetFormat?.replace("-", " ") || "custom"}
                  </Badge>
                </div>

                <div className="p-4 border rounded-md bg-muted/20 min-h-[200px] max-h-[500px] overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {typeof selectedOutput === "string"
                      ? selectedOutput
                      : JSON.stringify(selectedOutput, null, 2)}
                  </pre>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1.5"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1.5"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-4 space-y-4">
                {isLoadingHistory ? (
                  <div className="flex justify-center py-8">
                    <svg
                      className="animate-spin h-6 w-6 text-primary"
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
                ) : previousOutputs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No previous transformations found</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {previousOutputs.map((output) => (
                      <AccordionItem key={output.id} value={output.id}>
                        <AccordionTrigger className="hover:bg-muted/50 px-3 rounded-md">
                          <div className="flex items-center gap-3 text-left">
                            <div className="flex items-center gap-1.5">
                              {getContentTypeIcon(output.output_type)}
                              <span className="text-sm font-medium capitalize">
                                {output.output_type}
                              </span>
                            </div>
                            <span className="text-muted-foreground">→</span>
                            <Badge variant="outline" className="capitalize">
                              {output.target_format.replace("-", " ")}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {formatDate(output.created_at)}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="p-3 border rounded-md bg-muted/10 mt-2 mb-3 max-h-[300px] overflow-y-auto">
                            <pre className="text-sm whitespace-pre-wrap">
                              {typeof output.processed_content === "string"
                                ? output.processed_content
                                : JSON.stringify(
                                    output.processed_content,
                                    null,
                                    2,
                                  )}
                            </pre>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOutput(output.processed_content);
                                setActiveTab("preview");
                                toast({
                                  title: "Output selected",
                                  description:
                                    "Previous output loaded in preview tab",
                                });
                              }}
                            >
                              View in Preview
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  output.processed_content,
                                );
                                toast({
                                  title: "Copied to clipboard",
                                  description:
                                    "The processed content has been copied to your clipboard.",
                                });
                              }}
                            >
                              <Copy className="h-4 w-4 mr-1.5" /> Copy
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </TabsContent>

              <TabsContent value="export" className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="cursor-pointer hover:border-primary transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        Download as Text
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      Download the processed content as a plain text file
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleDownload}
                      >
                        <Download className="h-4 w-4 mr-2" /> Download .txt
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card className="cursor-pointer hover:border-primary transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        Copy to Clipboard
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      Copy the processed content to your clipboard for easy
                      pasting
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleCopy}
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 mr-2" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" /> Copy All
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardHeader>
          <CardFooter className="flex justify-between">
            <div className="flex gap-1.5">
              {isEditing ? (
                <Button size="sm" onClick={handleSave}>
                  Save
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={handleEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4" />
              </Button>
              <Button size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
      <Separator className="my-8" />
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Content Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Original Tone & Style</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Formal and educational tone</li>
                <li>Detailed explanations with examples</li>
                <li>Technical terminology present</li>
                <li>Long-form content structure</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Repurposed Adaptations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Platform-specific tone adjustments</li>
                <li>Condensed key points for social media</li>
                <li>Simplified language for broader audience</li>
                <li>Call-to-action elements added</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OutputPreview;
