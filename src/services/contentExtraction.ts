import * as cheerio from "cheerio";

export interface ExtractedContent {
  title: string;
  content: string;
  description?: string;
  imageUrl?: string;
  author?: string;
  publishDate?: string;
  contentType: "article" | "video" | "podcast" | "unknown";
}

/**
 * Detects if a file is a PDF based on its type
 */
export const isPdfFile = (file: File): boolean => {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
};

/**
 * Detects content type based on URL
 */
export const detectContentTypeFromUrl = (
  url: string,
): "article" | "video" | "podcast" | "unknown" => {
  const lowerUrl = url.toLowerCase();

  // Video platforms detection
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
    return "video";
  }

  // Podcast platforms detection
  if (
    lowerUrl.includes("spotify.com/episode") ||
    lowerUrl.includes("apple.com/podcast") ||
    lowerUrl.includes("soundcloud.com") ||
    lowerUrl.includes("anchor.fm") ||
    lowerUrl.includes(".mp3") ||
    lowerUrl.includes(".wav") ||
    lowerUrl.includes(".ogg") ||
    lowerUrl.includes("podcast")
  ) {
    return "podcast";
  }

  // Default to article
  return "article";
};

/**
 * Extracts content from HTML
 */
export const extractContentFromHtml = (
  html: string,
  url: string,
): ExtractedContent => {
  const $ = cheerio.load(html);
  const contentType = detectContentTypeFromUrl(url);

  // Default values
  let title = $("title").text().trim() || new URL(url).hostname;
  let content = "";
  let description =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    "";
  let imageUrl =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content");
  let author =
    $('meta[name="author"]').attr("content") ||
    $('meta[property="article:author"]').attr("content");
  let publishDate = $('meta[property="article:published_time"]').attr(
    "content",
  );

  // Extract main content based on common content containers
  const contentSelectors = [
    "article",
    '[role="main"]',
    ".post-content",
    ".article-content",
    ".entry-content",
    ".content",
    "#content",
    "main",
  ];

  for (const selector of contentSelectors) {
    const element = $(selector);
    if (element.length > 0) {
      // Remove scripts, styles, and comments
      element.find("script, style, noscript, iframe").remove();
      content = element.text().trim();
      break;
    }
  }

  // If no content found, try to get content from paragraphs
  if (!content) {
    const paragraphs = $("p");
    if (paragraphs.length > 0) {
      content = paragraphs
        .map((_, el) => $(el).text().trim())
        .get()
        .join("\n\n");
    } else {
      // Fallback: use body text
      content = $("body").text().trim();
    }
  }

  // Clean up content
  content = content
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();

  return {
    title,
    content,
    description,
    imageUrl,
    author,
    publishDate,
    contentType,
  };
};

/**
 * Extracts YouTube video information
 */
export const extractYouTubeInfo = (
  url: string,
): {
  videoId: string;
  thumbnailUrl: string;
} => {
  const lowerUrl = url.toLowerCase();
  let videoId = "";

  if (lowerUrl.includes("v=")) {
    videoId = url.split("v=")[1].split("&")[0];
  } else if (lowerUrl.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1].split("?")[0];
  }

  return {
    videoId,
    thumbnailUrl: videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : "",
  };
};

/**
 * Fetches and extracts content from a URL
 * In a real implementation, this would use a proxy server to avoid CORS issues
 */
export const fetchAndExtractContent = async (
  url: string,
): Promise<ExtractedContent> => {
  try {
    const contentType = detectContentTypeFromUrl(url);

    // For video content, handle specialized extraction
    if (contentType === "video") {
      if (
        url.toLowerCase().includes("youtube.com") ||
        url.toLowerCase().includes("youtu.be")
      ) {
        const { videoId, thumbnailUrl } = extractYouTubeInfo(url);
        return {
          title: "YouTube Video",
          content:
            "This is a YouTube video. The content would be extracted from the video description and metadata.",
          description:
            "YouTube video description would be fetched here in a real implementation.",
          imageUrl: thumbnailUrl,
          contentType: "video",
        };
      }

      return {
        title: `Video from ${new URL(url).hostname}`,
        content:
          "This is a video. The content would be extracted from the video metadata.",
        imageUrl:
          "https://images.unsplash.com/photo-1626379953822-baec19c3accd?w=800&q=80",
        contentType: "video",
      };
    }

    // For podcast content, handle specialized extraction
    if (contentType === "podcast") {
      return {
        title: `Podcast from ${new URL(url).hostname}`,
        content:
          "This is a podcast. The content would be extracted from the podcast description and metadata.",
        description:
          "Podcast description would be extracted here in a real implementation.",
        imageUrl:
          "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80",
        contentType: "podcast",
      };
    }

    // In a real implementation, we would use a proxy server to fetch the HTML
    // For now, we'll simulate the HTML content
    const simulatedHtml = `
      <html>
        <head>
          <title>Article from ${new URL(url).hostname}</title>
          <meta name="description" content="This is a simulated article description for ${url}" />
          <meta property="og:image" content="https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&q=80" />
        </head>
        <body>
          <article>
            <p>This is simulated article content that would be extracted from ${url}. In a real implementation, we would fetch the HTML content, parse it, and extract the main article text, title, and description.</p>
            <p>The content extraction would use techniques like readability algorithms or HTML parsing to identify the main content.</p>
          </article>
        </body>
      </html>
    `;

    return extractContentFromHtml(simulatedHtml, url);
  } catch (error) {
    console.error("Error extracting content:", error);
    return {
      title: `Content from ${new URL(url).hostname}`,
      content: "Failed to extract content from this URL.",
      contentType: "unknown",
    };
  }
};
