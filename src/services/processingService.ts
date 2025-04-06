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
  try {
    // Update job status to processing
    await updateJobStatus(contentId, "processing");

    // Get the content item
    const { data: contentItem, error: contentError } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", contentId)
      .single();

    if (contentError) throw contentError;
    if (!contentItem) throw new Error("Content item not found");

    let result;

    // Process based on content type
    switch (contentItem.content_type) {
      case "article":
        // For articles, we can directly process the text
        result = await processTextContent(contentItem.content || "", options);

        // If target type is audio or video, generate that as well
        if (contentItem.target_type === "audio") {
          const audioUrl = await generateAudioFromText(result);
          result = { text: result, audioUrl };
        } else if (contentItem.target_type === "video") {
          const videoUrl = await generateVideoFromText(result);
          result = { text: result, videoUrl };
        }
        break;

      case "video":
        // For video, we would need to transcribe first (placeholder)
        result = await processTextContent(
          "Transcription of video content would go here",
          options,
        );
        break;

      case "podcast":
        // For podcast, we would need to transcribe first (placeholder)
        result = await processTextContent(
          "Transcription of podcast content would go here",
          options,
        );
        break;

      default:
        throw new Error(
          `Unsupported content type: ${contentItem.content_type}`,
        );
    }

    // Save the processed result
    await saveProcessingResult(contentId, result);

    // Update job status to completed
    await updateJobStatus(contentId, "completed");

    return result;
  } catch (error) {
    console.error("Error processing content:", error);
    // Update job status to failed
    await updateJobStatus(contentId, "failed", error.message);
    throw error;
  }
}

// Create a new processing job
export async function createProcessingJob(
  contentId: string,
  options: ProcessingOptions,
): Promise<string> {
  try {
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

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error("Error creating processing job:", error);
    throw new Error("Failed to create processing job");
  }
}

// Update the status of a processing job
async function updateJobStatus(
  contentId: string,
  status: "pending" | "processing" | "completed" | "failed",
  error?: string,
) {
  try {
    const { data, error: updateError } = await supabase
      .from("processing_jobs")
      .update({
        status,
        error: error,
        updated_at: new Date().toISOString(),
      })
      .eq("content_id", contentId)
      .select();

    if (updateError) throw updateError;
    return data;
  } catch (error) {
    console.error("Error updating job status:", error);
  }
}

// Save the result of processing
async function saveProcessingResult(contentId: string, result: any) {
  try {
    // First, update the processing job with the result
    const { data: jobData, error: jobError } = await supabase
      .from("processing_jobs")
      .update({
        result,
        updated_at: new Date().toISOString(),
      })
      .eq("content_id", contentId)
      .select();

    if (jobError) throw jobError;

    // Then, update the content item with the processed content
    const { data: contentData, error: contentError } = await supabase
      .from("content_items")
      .update({
        processed_content: result,
        status: "processed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", contentId)
      .select();

    if (contentError) throw contentError;

    return { jobData, contentData };
  } catch (error) {
    console.error("Error saving processing result:", error);
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
