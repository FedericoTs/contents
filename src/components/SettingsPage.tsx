import React, { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, Globe, Youtube, Rss } from "lucide-react";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("blog");
  const [blogConnected, setBlogConnected] = useState(false);
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [rssConnected, setRssConnected] = useState(false);

  const handleBlogConnect = () => {
    // This would be replaced with actual API connection logic
    setTimeout(() => {
      setBlogConnected(true);
    }, 1000);
  };

  const handleYoutubeConnect = () => {
    // This would be replaced with actual API connection logic
    setTimeout(() => {
      setYoutubeConnected(true);
    }, 1000);
  };

  const handleRssConnect = () => {
    // This would be replaced with actual API connection logic
    setTimeout(() => {
      setRssConnected(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-bold mb-6">Platform Settings</h1>
          <p className="text-muted-foreground mb-8">
            Connect to your content platforms to import and repurpose your
            existing content.
          </p>

          <Tabs
            defaultValue="blog"
            className="w-full"
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="blog" className="flex items-center gap-2">
                <Globe className="h-4 w-4" /> Blog/Website
              </TabsTrigger>
              <TabsTrigger value="youtube" className="flex items-center gap-2">
                <Youtube className="h-4 w-4" /> YouTube
              </TabsTrigger>
              <TabsTrigger value="rss" className="flex items-center gap-2">
                <Rss className="h-4 w-4" /> RSS Feeds
              </TabsTrigger>
            </TabsList>

            <TabsContent value="blog">
              <Card>
                <CardHeader>
                  <CardTitle>Blog/Website Connection</CardTitle>
                  <CardDescription>
                    Connect to your blog or website to import articles and
                    content.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!blogConnected ? (
                    <>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="blog-url">Blog URL</Label>
                          <Input
                            id="blog-url"
                            placeholder="https://yourblog.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="blog-api-key">
                            API Key (if required)
                          </Label>
                          <Input
                            id="blog-api-key"
                            type="password"
                            placeholder="Your API key"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="blog-auto-sync" />
                          <Label htmlFor="blog-auto-sync">
                            Auto-sync new content
                          </Label>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-green-500">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Connected to your blog</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  {!blogConnected ? (
                    <Button onClick={handleBlogConnect}>Connect Blog</Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setBlogConnected(false)}
                      >
                        Disconnect
                      </Button>
                      <Button>Import Content</Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="youtube">
              <Card>
                <CardHeader>
                  <CardTitle>YouTube Connection</CardTitle>
                  <CardDescription>
                    Connect to your YouTube channel to import videos for
                    repurposing.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!youtubeConnected ? (
                    <>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="youtube-channel">Channel ID</Label>
                          <Input
                            id="youtube-channel"
                            placeholder="Your YouTube channel ID"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="youtube-api-key">
                            YouTube API Key
                          </Label>
                          <Input
                            id="youtube-api-key"
                            type="password"
                            placeholder="Your YouTube API key"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="youtube-auto-sync" />
                          <Label htmlFor="youtube-auto-sync">
                            Auto-sync new videos
                          </Label>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-green-500">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Connected to your YouTube channel</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  {!youtubeConnected ? (
                    <Button onClick={handleYoutubeConnect}>
                      Connect YouTube
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setYoutubeConnected(false)}
                      >
                        Disconnect
                      </Button>
                      <Button>Import Videos</Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="rss">
              <Card>
                <CardHeader>
                  <CardTitle>RSS Feed Connection</CardTitle>
                  <CardDescription>
                    Connect to RSS feeds to automatically import content.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!rssConnected ? (
                    <>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="rss-url">RSS Feed URL</Label>
                          <Input
                            id="rss-url"
                            placeholder="https://example.com/feed.xml"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="rss-auto-sync" />
                          <Label htmlFor="rss-auto-sync">
                            Auto-sync new content
                          </Label>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-green-500">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Connected to RSS feed</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  {!rssConnected ? (
                    <Button onClick={handleRssConnect}>Connect RSS</Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setRssConnected(false)}
                      >
                        Disconnect
                      </Button>
                      <Button>Import Content</Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
