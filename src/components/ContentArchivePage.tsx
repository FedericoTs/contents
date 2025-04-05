import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Archive, Filter, Download, Share2 } from "lucide-react";

const ContentArchivePage = () => {
  // Mock data for demonstration
  const archivedContent = [
    {
      id: 1,
      title: "10 Tips for Content Creation",
      type: "Blog Post",
      originalFormat: "Article",
      createdAt: "2023-08-15",
      platforms: ["Website", "Medium"],
      status: "Ready",
    },
    {
      id: 2,
      title: "How to Repurpose Your Content Effectively",
      type: "Social Media Thread",
      originalFormat: "Video",
      createdAt: "2023-08-10",
      platforms: ["Twitter", "LinkedIn"],
      status: "Ready",
    },
    {
      id: 3,
      title: "Content Marketing Strategy for 2023",
      type: "Newsletter",
      originalFormat: "Podcast",
      createdAt: "2023-08-05",
      platforms: ["Email", "Substack"],
      status: "Ready",
    },
    {
      id: 4,
      title: "The Future of AI in Content Creation",
      type: "Blog Post",
      originalFormat: "Article",
      createdAt: "2023-07-28",
      platforms: ["Website", "Dev.to"],
      status: "Ready",
    },
    {
      id: 5,
      title: "5 Ways to Improve Your Content Strategy",
      type: "Social Media Carousel",
      originalFormat: "Blog Post",
      createdAt: "2023-07-20",
      platforms: ["Instagram", "LinkedIn"],
      status: "Ready",
    },
  ];

  return (
    <div className="container mx-auto px-6 py-8 bg-background">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Content Archive</h2>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2 h-10">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-8">
        <TabsList className="w-full max-w-md grid grid-cols-4">
          <TabsTrigger value="all" className="px-4 py-2.5">
            All Content
          </TabsTrigger>
          <TabsTrigger value="blog" className="px-4 py-2.5">
            Blog Posts
          </TabsTrigger>
          <TabsTrigger value="social" className="px-4 py-2.5">
            Social Media
          </TabsTrigger>
          <TabsTrigger value="newsletter" className="px-4 py-2.5">
            Newsletters
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {archivedContent.map((content) => (
          <motion.div
            key={content.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="h-full shadow-sm flex flex-col">
              <CardHeader className="pb-3 pt-5 px-6">
                <CardTitle className="text-lg">{content.title}</CardTitle>
                <CardDescription className="mt-1">
                  {content.type} • Originally: {content.originalFormat}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 flex-grow">
                <div className="text-sm text-muted-foreground">
                  <p>Created: {content.createdAt}</p>
                  <p className="mt-3">
                    Platforms: {content.platforms.join(", ")}
                  </p>
                  <div className="mt-3 flex items-center">
                    <span className="text-sm font-medium mr-2">Status:</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {content.status}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between px-6 py-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1.5 h-9 px-3"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1.5 h-9 px-3"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ContentArchivePage;
