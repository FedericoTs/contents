import { supabase } from "./supabase";

// Function to get processing jobs for a user
export const getProcessingJobs = async (userId?: string) => {
  console.log("getProcessingJobs called with userId:", userId);

  try {
    // Get all processing jobs
    const { data, error } = await supabase
      .from("processing_jobs")
      .select(
        "id, content_id, target_format, status, options, created_at, updated_at, result, error, source_content_id, previous_transformation_id, content_items!inner(id, title, content_type, user_id)",
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error fetching processing jobs:", error);
      throw error;
    }

    // Map the data to the expected format
    const formattedData =
      data?.map((job) => ({
        id: job.id,
        title: job.content_items?.title || "Untitled",
        sourceType: job.content_items?.content_type || "unknown",
        targetFormat: job.target_format || "unknown",
        progress:
          job.status === "completed"
            ? 100
            : job.status === "processing"
              ? 50
              : 0,
        status: job.status,
        error: job.error,
        content_id: job.content_id,
      })) || [];

    console.log(`Retrieved ${formattedData.length} processing jobs`);
    return formattedData;
  } catch (err) {
    console.error("Exception in getProcessingJobs:", err);
    throw err;
  }
};

// Function to create a processing job
export const createProcessingJob = async (
  contentId: string,
  options: any,
  sourceContentId?: string,
  previousTransformationId?: string,
) => {
  try {
    const { data, error } = await supabase
      .from("processing_jobs")
      .insert({
        content_id: contentId,
        target_format: options.targetFormat,
        status: "pending",
        options: options,
        created_at: new Date().toISOString(),
        source_content_id: sourceContentId,
        previous_transformation_id: previousTransformationId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating processing job:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in createProcessingJob:", error);
    throw error;
  }
};

// Function to process a content item
export const processContentItem = async (contentId: string, options: any) => {
  try {
    // First update the job status to processing
    const { error: updateError } = await supabase
      .from("processing_jobs")
      .update({ status: "processing" })
      .eq("content_id", contentId);

    if (updateError) throw updateError;

    // Get the content item details
    const { data: contentItem, error: contentError } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", contentId)
      .single();

    if (contentError) throw contentError;
    if (!contentItem) throw new Error("Content item not found");

    // Process the content based on options
    // This would typically call OpenAI or other processing services
    // For now, we'll simulate processing with a delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Create a processed content result
    const processedContent = {
      title: `Transformed: ${contentItem.title}`,
      content: `This is the transformed content for ${contentItem.title}`,
      format: options.targetFormat || "blog",
    };

    // Update the job with the processed content and mark as completed
    const { data: updatedJob, error: completeError } = await supabase
      .from("processing_jobs")
      .update({
        status: "completed",
        processed_content: processedContent,
        completed_at: new Date().toISOString(),
      })
      .eq("content_id", contentId)
      .select()
      .single();

    if (completeError) throw completeError;

    return updatedJob;
  } catch (error) {
    console.error("Error processing content:", error);

    // Update the job status to failed
    await supabase
      .from("processing_jobs")
      .update({
        status: "failed",
        error: error.message,
      })
      .eq("content_id", contentId);

    throw error;
  }
};
