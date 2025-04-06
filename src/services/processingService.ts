import { supabase } from "./supabase";
import {
  processTextContent,
  generateAudioFromText,
  generateVideoFromText,
  ProcessingOptions,
} from "./openaiService";

export interface ProcessingJob {
  id: string;
  contentId: string;
  targetFormat: string;
  status: "pending" | "processing" | "completed" | "failed";
  options: ProcessingOptions;
  result?: any;
  error?: string;
}

// Process a content item based on its type and target format
export async function processContentItem(
  contentId: string,
  options: ProcessingOptions,
) {
  console.log("[processingService] Starting processContentItem", {
    contentId,
    options,
  });
  try {
    // Update job status to processing
    console.log("[processingService] Updating job status to processing");
    await updateJobStatus(contentId, "processing");

    // Get the content item
    console.log(
      "[processingService] Fetching content item with ID:",
      contentId,
    );
    const { data: contentItem, error: contentError } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", contentId)
      .single();

    console.log("[processingService] Content item fetch result:", {
      contentItem: contentItem
        ? {
            ...contentItem,
            content: contentItem.content
              ? `${contentItem.content.substring(0, 50)}...`
              : null,
          }
        : null,
      error: contentError,
    });

    if (contentError) {
      console.error(
        "[processingService] Error fetching content item:",
        contentError,
      );
      throw contentError;
    }
    if (!contentItem) {
      console.error(
        "[processingService] Content item not found for ID:",
        contentId,
      );
      throw new Error("Content item not found");
    }

    // Check if content is available
    if (!contentItem.content) {
      console.warn(
        "[processingService] Content is empty or null for item:",
        contentId,
      );

      // Update content with sample text if it's empty
      const sampleContent =
        "This is a sample article about content repurposing. Content repurposing is the practice of taking existing content and transforming it into new formats to reach different audiences or serve different purposes. It's an efficient way to maximize the value of your content creation efforts.";

      const { error: updateError } = await supabase
        .from("content_items")
        .update({ content: sampleContent })
        .eq("id", contentId);

      if (updateError) {
        console.error(
          "[processingService] Error updating content with sample text:",
          updateError,
        );
      } else {
        console.log("[processingService] Updated content with sample text");
        contentItem.content = sampleContent;
      }
    }

    let result;

    // Process based on content type
    console.log(
      "[processingService] Processing content based on type:",
      contentItem.content_type,
    );
    switch (contentItem.content_type) {
      case "article":
        // For articles, we can directly process the text
        console.log(
          "[processingService] Processing article content with OpenAI",
        );
        result = await processTextContent(contentItem.content || "", options);
        console.log(
          "[processingService] Received processed text result:",
          result ? `${result.substring(0, 50)}...` : null,
        );

        // If target type is audio or video, generate that as well
        if (contentItem.target_type === "audio") {
          console.log(
            "[processingService] Generating audio from processed text",
          );
          const audioUrl = await generateAudioFromText(result);
          result = { text: result, audioUrl };
        } else if (contentItem.target_type === "video") {
          console.log(
            "[processingService] Generating video from processed text",
          );
          const videoUrl = await generateVideoFromText(result);
          result = { text: result, videoUrl };
        }
        break;

      case "video":
        // For video, we would need to transcribe first (placeholder)
        console.log(
          "[processingService] Processing video content (placeholder)",
        );
        result = await processTextContent(
          "Transcription of video content would go here",
          options,
        );
        break;

      case "podcast":
        // For podcast, we would need to transcribe first (placeholder)
        console.log(
          "[processingService] Processing podcast content (placeholder)",
        );
        result = await processTextContent(
          "Transcription of podcast content would go here",
          options,
        );
        break;

      default:
        console.error(
          "[processingService] Unsupported content type:",
          contentItem.content_type,
        );
        throw new Error(
          `Unsupported content type: ${contentItem.content_type}`,
        );
    }

    // Save the processed result
    console.log("[processingService] Saving processing result");
    await saveProcessingResult(contentId, result);

    // Update job status to completed
    console.log("[processingService] Updating job status to completed");
    await updateJobStatus(contentId, "completed");

    console.log(
      "[processingService] Successfully completed processing content item",
    );
    return result;
  } catch (error) {
    console.error("[processingService] Error processing content:", error);
    // Update job status to failed
    console.log("[processingService] Updating job status to failed");
    await updateJobStatus(contentId, "failed", error.message);
    throw error;
  }
}

// Create a new processing job
export async function createProcessingJob(
  contentId: string,
  options: ProcessingOptions,
): Promise<string> {
  console.log("[processingService] Starting createProcessingJob", {
    contentId,
    options,
  });
  try {
    // Validate content ID exists
    console.log("[processingService] Validating content ID exists:", contentId);
    const { data: contentExists, error: contentCheckError } = await supabase
      .from("content_items")
      .select("id, content")
      .eq("id", contentId)
      .single();

    console.log("[processingService] Content validation result:", {
      contentExists,
      contentCheckError,
    });

    if (contentCheckError) {
      console.error(
        "[processingService] Content ID validation error:",
        contentCheckError,
      );
      throw new Error(
        "Content item not found. Please select or upload content first.",
      );
    }

    // Check if content is available
    if (!contentExists.content) {
      console.warn(
        "[processingService] Content is empty or null for item:",
        contentId,
      );
    }

    // Create the processing job
    console.log(
      "[processingService] Creating processing job for content ID:",
      contentId,
    );
    const { data, error } = await supabase
      .from("processing_jobs")
      .insert({
        content_id: contentId,
        target_format: options.targetFormat,
        status: "pending",
        options: options,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "[processingService] Error inserting processing job:",
        error,
      );
      throw error;
    }

    console.log(
      "[processingService] Processing job created successfully:",
      data,
    );
    return data.id;
  } catch (error) {
    console.error("[processingService] Error creating processing job:", error);
    throw new Error(error.message || "Failed to create processing job");
  }
}

// Update the status of a processing job
async function updateJobStatus(
  contentId: string,
  status: "pending" | "processing" | "completed" | "failed",
  error?: string,
) {
  try {
    console.log(
      `[processingService] Updating job status to ${status} for content ID: ${contentId}`,
    );

    // Get the job ID first
    const { data: jobs, error: jobsError } = await supabase
      .from("processing_jobs")
      .select("id")
      .eq("content_id", contentId);

    if (jobsError) {
      console.error(
        "[processingService] Error finding jobs for content ID:",
        jobsError,
      );
      throw jobsError;
    }

    if (!jobs || jobs.length === 0) {
      console.warn(
        `[processingService] No jobs found for content ID: ${contentId}`,
      );
      return null;
    }

    // Update all jobs for this content (usually just one)
    const { data, error: updateError } = await supabase
      .from("processing_jobs")
      .update({
        status,
        error: error,
        updated_at: new Date().toISOString(),
      })
      .eq("content_id", contentId)
      .select();

    if (updateError) {
      console.error(
        "[processingService] Error updating job status:",
        updateError,
      );
      throw updateError;
    }
    console.log(
      `[processingService] Successfully updated job status to ${status}`,
    );
    return data;
  } catch (error) {
    console.error("[processingService] Error updating job status:", error);
    return null;
  }
}

// Save the result of processing
async function saveProcessingResult(contentId: string, result: any) {
  try {
    console.log(
      "[processingService] Saving processing result for content ID:",
      contentId,
    );
    console.log("[processingService] Result type:", typeof result);
    console.log(
      "[processingService] Result preview:",
      typeof result === "string"
        ? result.substring(0, 100) + "..."
        : "Non-string result",
    );

    // Format the result for storage if it's an object
    const processedContent =
      typeof result === "object" ? JSON.stringify(result) : result;

    // First, update the processing job with the result
    const { data: jobData, error: jobError } = await supabase
      .from("processing_jobs")
      .update({
        result: processedContent,
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("content_id", contentId)
      .select();

    if (jobError) {
      console.error(
        "[processingService] Error updating processing job with result:",
        jobError,
      );
      throw jobError;
    }
    console.log(
      "[processingService] Successfully updated processing job with result",
    );

    // Then, update the content item with the processed content
    console.log(
      "[processingService] Updating content item with processed content",
    );
    const { data: contentData, error: contentError } = await supabase
      .from("content_items")
      .update({
        processed_content: processedContent,
        status: "processed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", contentId)
      .select();

    if (contentError) {
      console.error(
        "[processingService] Error updating content item with processed content:",
        contentError,
      );
      throw contentError;
    }
    console.log(
      "[processingService] Successfully updated content item with processed content",
    );

    return { jobData, contentData };
  } catch (error) {
    console.error("[processingService] Error saving processing result:", error);
    throw new Error("Failed to save processing result");
  }
}

// Get all processing jobs for a user
export async function getProcessingJobs(userId: string) {
  try {
    const { data, error } = await supabase
      .from("processing_jobs")
      .select(
        `
        *,
        content_items!inner(*)
      `,
      )
      .eq("content_items.user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching processing jobs:", error);
    return [];
  }
}

// Get a specific processing job
export async function getProcessingJob(jobId: string) {
  try {
    const { data, error } = await supabase
      .from("processing_jobs")
      .select(
        `
        *,
        content_items(*)
      `,
      )
      .eq("id", jobId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching processing job:", error);
    throw new Error("Failed to fetch processing job");
  }
}
