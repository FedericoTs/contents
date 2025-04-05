import React, { useState } from "react";
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
import { Download, Share2, Edit, Copy, Check } from "lucide-react";

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
  repurposedContent = [
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
}: OutputPreviewProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState("default");
  const [activeRepurposedContent, setActiveRepurposedContent] = useState(
    repurposedContent[0],
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(
    activeRepurposedContent?.content || "",
  );
  const [copied, setCopied] = useState(false);

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
    navigator.clipboard.writeText(activeRepurposedContent?.content || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <div className="w-full h-full bg-background p-6 rounded-lg">
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
            <Tabs defaultValue={repurposedContent[0].type} className="w-full">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="social">Social Media</TabsTrigger>
                <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
                <TabsTrigger value="blog">Blog</TabsTrigger>
                <TabsTrigger value="audio">Audio</TabsTrigger>
                <TabsTrigger value="video">Video</TabsTrigger>
              </TabsList>

              <TabsContent value="social" className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {repurposedContent
                    .filter((content) => content.type === "social")
                    .map((content, index) => (
                      <Badge
                        key={index}
                        variant={
                          activeRepurposedContent === content
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => handleContentSelect(content)}
                      >
                        {content.title}
                      </Badge>
                    ))}
                </div>
                {activeRepurposedContent &&
                  activeRepurposedContent.type === "social" && (
                    <div className="p-4 border rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">
                          {activeRepurposedContent.title}
                        </h3>
                        <Badge
                          className={`${getPlatformColor(activeRepurposedContent.platform)} text-white`}
                        >
                          {activeRepurposedContent.platform}
                        </Badge>
                      </div>
                      {isEditing ? (
                        <Textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="min-h-[120px]"
                        />
                      ) : (
                        <p className="text-sm">
                          {activeRepurposedContent.content}
                        </p>
                      )}
                    </div>
                  )}
              </TabsContent>

              <TabsContent value="newsletter" className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {repurposedContent
                    .filter((content) => content.type === "newsletter")
                    .map((content, index) => (
                      <Badge
                        key={index}
                        variant={
                          activeRepurposedContent === content
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => handleContentSelect(content)}
                      >
                        {content.title}
                      </Badge>
                    ))}
                </div>
                {activeRepurposedContent &&
                  activeRepurposedContent.type === "newsletter" && (
                    <div className="p-4 border rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">
                          {activeRepurposedContent.title}
                        </h3>
                        <Badge
                          className={`${getPlatformColor(activeRepurposedContent.platform)} text-white`}
                        >
                          {activeRepurposedContent.platform || "Email"}
                        </Badge>
                      </div>
                      {isEditing ? (
                        <Textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="min-h-[120px]"
                        />
                      ) : (
                        <p className="text-sm">
                          {activeRepurposedContent.content}
                        </p>
                      )}
                    </div>
                  )}
              </TabsContent>

              <TabsContent value="blog" className="mt-4">
                <div className="p-4 border rounded-md flex items-center justify-center h-[200px] text-muted-foreground">
                  No blog content generated yet
                </div>
              </TabsContent>

              <TabsContent value="audio" className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {repurposedContent
                    .filter((content) => content.type === "audio")
                    .map((content, index) => (
                      <Badge
                        key={index}
                        variant={
                          activeRepurposedContent === content
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => handleContentSelect(content)}
                      >
                        {content.title}
                      </Badge>
                    ))}
                </div>
                {activeRepurposedContent &&
                  activeRepurposedContent.type === "audio" && (
                    <div className="p-4 border rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">
                          {activeRepurposedContent.title}
                        </h3>
                        <Badge className="bg-purple-600 text-white">
                          Audio Podcast
                        </Badge>
                      </div>
                      <p className="text-sm mb-4">
                        {activeRepurposedContent.content}
                      </p>
                      {activeRepurposedContent.mediaUrl && (
                        <div className="mt-2">
                          <audio
                            controls
                            className="w-full"
                            src={activeRepurposedContent.mediaUrl}
                          >
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}
                    </div>
                  )}
              </TabsContent>

              <TabsContent value="video" className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {repurposedContent
                    .filter((content) => content.type === "video")
                    .map((content, index) => (
                      <Badge
                        key={index}
                        variant={
                          activeRepurposedContent === content
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => handleContentSelect(content)}
                      >
                        {content.title}
                      </Badge>
                    ))}
                </div>
                {activeRepurposedContent &&
                  activeRepurposedContent.type === "video" && (
                    <div className="p-4 border rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">
                          {activeRepurposedContent.title}
                        </h3>
                        <Badge className="bg-red-600 text-white">
                          Video Content
                        </Badge>
                      </div>
                      <p className="text-sm mb-4">
                        {activeRepurposedContent.content}
                      </p>
                      {activeRepurposedContent.mediaUrl && (
                        <div className="mt-2 aspect-video">
                          <video
                            controls
                            className="w-full h-full rounded-md"
                            src={activeRepurposedContent.mediaUrl}
                          >
                            Your browser does not support the video element.
                          </video>
                        </div>
                      )}
                    </div>
                  )}
              </TabsContent>
            </Tabs>
          </CardHeader>
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              {isEditing ? (
                <Button onClick={handleSave}>Save Changes</Button>
              ) : (
                <Button variant="outline" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              <Button variant="outline" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button>
                <Share2 className="h-4 w-4 mr-2" />
                Share
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
