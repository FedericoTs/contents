// Define the Article interface for type safety
export interface Article {
  id: string;
  title: string;
  description: string;
  source: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
}

// Mock data for development purposes
const mockArticles: Article[] = [
  {
    id: "1",
    title: "The Future of AI in Content Creation",
    description:
      "How artificial intelligence is transforming the way we create and consume content.",
    source: "Tech Insights",
    url: "https://example.com/ai-content",
    imageUrl:
      "https://images.unsplash.com/photo-1677442135136-760c813a743d?w=800&q=80",
    publishedAt: "2023-06-15",
  },
  {
    id: "2",
    title: "Content Repurposing Strategies for 2023",
    description:
      "Learn how to maximize your content's reach by repurposing it across multiple platforms.",
    source: "Digital Marketing Weekly",
    url: "https://example.com/repurposing",
    imageUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
    publishedAt: "2023-05-22",
  },
  {
    id: "3",
    title: "How to Research Effectively for Content Creation",
    description:
      "Tips and tools for gathering high-quality information for your content projects.",
    source: "Content Creator Hub",
    url: "https://example.com/research-tips",
    imageUrl:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
    publishedAt: "2023-04-10",
  },
  {
    id: "4",
    title: "Video Content: Why It's Essential for Your Marketing Strategy",
    description:
      "Discover why video content is becoming increasingly important for brands and how to leverage it effectively.",
    source: "Marketing Trends",
    url: "https://example.com/video-marketing",
    imageUrl:
      "https://images.unsplash.com/photo-1626379953822-baec19c3accd?w=800&q=80",
    publishedAt: "2023-07-05",
  },
  {
    id: "5",
    title: "The Psychology Behind Viral Content",
    description:
      "Understanding what makes content go viral and how to apply these principles to your own content strategy.",
    source: "Content Psychology",
    url: "https://example.com/viral-content",
    imageUrl:
      "https://images.unsplash.com/photo-1516321165247-4aa89a48be28?w=800&q=80",
    publishedAt: "2023-06-28",
  },
  {
    id: "6",
    title: "SEO Techniques for Content Creators in 2023",
    description:
      "The latest search engine optimization strategies to help your content rank higher and reach more people.",
    source: "SEO Weekly",
    url: "https://example.com/seo-techniques",
    imageUrl:
      "https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=800&q=80",
    publishedAt: "2023-05-15",
  },
];

// Interface for search parameters
export interface SearchParams {
  tags?: string[];
  query?: string;
  page?: number;
  pageSize?: number;
}

// Interface for search results
export interface SearchResults {
  articles: Article[];
  totalResults: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Fetches articles based on search parameters
 * In a real application, this would call an actual news API
 */
export const fetchArticles = async (
  params: SearchParams,
): Promise<SearchResults> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const { tags = [], query = "", page = 1, pageSize = 10 } = params;

  // Filter articles based on tags and query
  let filteredArticles = [...mockArticles];

  if (tags.length > 0) {
    // In a real API, this would be part of the API request
    // Here we're just simulating tag filtering
    const lowerCaseTags = tags.map((tag) => tag.toLowerCase());
    filteredArticles = filteredArticles.filter((article) => {
      return lowerCaseTags.some(
        (tag) =>
          article.title.toLowerCase().includes(tag) ||
          article.description.toLowerCase().includes(tag),
      );
    });
  }

  if (query) {
    const lowerCaseQuery = query.toLowerCase();
    filteredArticles = filteredArticles.filter(
      (article) =>
        article.title.toLowerCase().includes(lowerCaseQuery) ||
        article.description.toLowerCase().includes(lowerCaseQuery),
    );
  }

  // Calculate pagination
  const totalResults = filteredArticles.length;
  const totalPages = Math.ceil(totalResults / pageSize);

  // Get articles for the current page
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

  return {
    articles: paginatedArticles,
    totalResults,
    page,
    pageSize,
    totalPages,
  };
};
