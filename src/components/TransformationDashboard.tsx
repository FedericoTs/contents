import React, { useState } from "react";
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
}) => {
  const [selectedTab, setSelectedTab] = useState("format");
  const [targetFormat, setTargetFormat] = useState("social-posts");
  const [transformMethod, setTransformMethod] = useState<"manual" | "ai">("ai");
  const [contentLength, setContentLength] = useState(50);
  const [contentTone, setContentTone] = useState("professional");
  const [preserveKeyPoints, setPreserveKeyPoints] = useState(true);
  const [sampleOutput, setSampleOutput] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "instagram",
    "twitter",
  ]);

  const handleAddToQueue = () => {
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

    onAddToQueue(transformationConfig);
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
              <Button onClick={handleAddToQueue} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Add to Processing Queue
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div>
          <p className="text-sm font-medium">Selected Transformation:</p>
          <div className="flex flex-wrap gap-1 mt-1">
            <Badge variant="outline" className="text-xs">
              {contentType}
            </Badge>
            <Badge variant="outline" className="text-xs">
              →
            </Badge>
            <Badge className="text-xs">{targetFormat.replace("-", " ")}</Badge>
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
      </CardFooter>
    </Card>
  );
};

export default TransformationDashboard;
