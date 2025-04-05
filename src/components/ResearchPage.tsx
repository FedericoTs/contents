import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { X, AlertCircle } from "lucide-react";
import {
  fetchArticles,
  type Article,
  type SearchResults,
} from "../services/newsService";

export default function ResearchPage() {
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6; // Number of articles per page

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSearch = async () => {
    if (tags.length === 0 && !query.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await fetchArticles({
        tags,
        query: query.trim(),
        page: currentPage,
        pageSize,
      });

      setSearchResults(results);
      setArticles(results.articles);
    } catch (err) {
      setError("Failed to fetch articles. Please try again later.");
      console.error("Error fetching articles:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || (searchResults && newPage > searchResults.totalPages)) {
      return;
    }

    setCurrentPage(newPage);

    // If we have search parameters, fetch the new page
    if (tags.length > 0 || query.trim()) {
      setIsLoading(true);
      setError(null);

      try {
        const results = await fetchArticles({
          tags,
          query: query.trim(),
          page: newPage,
          pageSize,
        });

        setSearchResults(results);
        setArticles(results.articles);
      } catch (err) {
        setError("Failed to fetch articles. Please try again later.");
        console.error("Error fetching articles:", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Reset to page 1 when search parameters change
  useEffect(() => {
    setCurrentPage(1);
  }, [tags, query]);

  return (
    <div className="container mx-auto py-8 bg-background min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Research Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Search Parameters</CardTitle>
            <CardDescription>
              Add tags and queries to find relevant content for your research
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <div
                      key={tag}
                      className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center gap-1"
                    >
                      <span>{tag}</span>
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-secondary-foreground/70 hover:text-secondary-foreground"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag (e.g., AI, Marketing)"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                  />
                  <Button onClick={handleAddTag} variant="secondary">
                    Add
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Search Query
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter a search query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? "Searching..." : "Search for Content"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Research Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Active Tags:</span>
                <span className="font-medium">{tags.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Articles Found:</span>
                <span className="font-medium">
                  {searchResults?.totalResults || 0}
                </span>
              </div>
              {searchResults && searchResults.totalPages > 1 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pages:</span>
                  <span className="font-medium">
                    {currentPage} of {searchResults.totalPages}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mb-4">Research Results</h2>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Searching for relevant content...
          </p>
        </div>
      ) : articles.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Card key={article.id} className="overflow-hidden flex flex-col">
                {article.imageUrl && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-2">
                    {article.title}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {article.source} •{" "}
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {article.description}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Read More
                    </a>
                  </Button>
                  <Button variant="ghost" size="sm">
                    Save
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination controls */}
          {searchResults && searchResults.totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
              >
                Previous
              </Button>

              {/* Page numbers */}
              <div className="flex gap-1">
                {Array.from(
                  { length: searchResults.totalPages },
                  (_, i) => i + 1,
                )
                  .filter((page) => {
                    // Show first page, last page, current page, and pages around current page
                    return (
                      page === 1 ||
                      page === searchResults.totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, index, array) => {
                    // Add ellipsis between non-consecutive pages
                    const showEllipsisBefore =
                      index > 0 && array[index - 1] !== page - 1;

                    return (
                      <React.Fragment key={page}>
                        {showEllipsisBefore && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            className="px-3"
                          >
                            ...
                          </Button>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          disabled={isLoading}
                          className="px-3"
                        >
                          {page}
                        </Button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={
                  (searchResults && currentPage === searchResults.totalPages) ||
                  isLoading
                }
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-card">
          <p className="text-muted-foreground">
            No articles found. Try adding some tags or a search query and click
            "Search for Content".
          </p>
        </div>
      )}
    </div>
  );
}
