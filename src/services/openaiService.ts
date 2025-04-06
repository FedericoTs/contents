import OpenAI from "openai";

// Initialize OpenAI client with fallback for missing API key
let openai: OpenAI;

// Check if API key is available
if (!import.meta.env.VITE_OPENAI_API_KEY) {
  console.warn(
    "OpenAI API key is missing. Please add it in the project settings.",
  );
  // Create a dummy client that will throw better errors when used
  openai = {
    chat: {
      completions: {
        create: async () => {
          throw new Error(
            "OpenAI API key is not configured. Please add it in the project settings.",
          );
        },
      },
    },
  } as unknown as OpenAI;
} else {
  // Initialize with the actual API key
  openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true, // For client-side usage
  });
}

export interface ProcessingOptions {
  contentType: string;
  targetFormat: string;
  tone?: string;
  length?: number;
  preserveKeyPoints?: boolean;
  platforms?: string[];
  customInstructions?: string;
}

export async function processTextContent(
  content: string,
  options: ProcessingOptions,
) {
  try {
    // Check if API key is available before attempting to process
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error(
        "OpenAI API key is not configured. Please add it in the project settings.",
      );
    }

    const systemPrompt = generateSystemPrompt(options);

    const response = await openai.chat.completions.create({
      model: "gpt-4", // or gpt-3.5-turbo for lower cost
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content },
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error processing content with OpenAI:", error);
    if (error.message?.includes("API key")) {
      throw new Error(
        "OpenAI API key is missing or invalid. Please check your project settings.",
      );
    }
    throw new Error("Failed to process content. Please try again later.");
  }
}

function generateSystemPrompt(options: ProcessingOptions): string {
  const {
    contentType,
    targetFormat,
    tone = "professional",
    length = 100,
    preserveKeyPoints = true,
    platforms = [],
    customInstructions = "",
  } = options;

  let prompt = `You are an expert content repurposer. Transform the following ${contentType} into ${targetFormat} format.`;

  // Add tone instructions
  prompt += `\nUse a ${tone} tone in the output.`;

  // Add length instructions
  if (length < 100) {
    prompt += `\nMake the output significantly shorter than the input (about ${length}% of original length).`;
  } else if (length > 100) {
    prompt += `\nExpand on the input to make the output longer (about ${length}% of original length).`;
  } else {
    prompt += `\nKeep the output approximately the same length as the input.`;
  }

  // Add key points preservation instruction
  if (preserveKeyPoints) {
    prompt += `\nEnsure all key points and important information from the original content are preserved.`;
  }

  // Add platform-specific instructions
  if (platforms.length > 0 && targetFormat === "social-posts") {
    prompt += `\nOptimize for the following platforms: ${platforms.join(", ")}.`;

    // Platform-specific formatting
    if (platforms.includes("twitter")) {
      prompt += `\nFor Twitter: Keep posts under 280 characters, use hashtags strategically, and create engaging hooks.`;
    }
    if (platforms.includes("linkedin")) {
      prompt += `\nFor LinkedIn: Use a professional tone, include a call to action, and format for readability with paragraph breaks.`;
    }
    if (platforms.includes("instagram")) {
      prompt += `\nFor Instagram: Create visually descriptive content, use emojis appropriately, and suggest image descriptions.`;
    }
    if (platforms.includes("facebook")) {
      prompt += `\nFor Facebook: Create conversational content that encourages engagement and discussion.`;
    }
  }

  // Add custom instructions if provided
  if (customInstructions) {
    prompt += `\n${customInstructions}`;
  }

  // Format instructions based on target format
  switch (targetFormat) {
    case "social-posts":
      prompt += `\nReturn a JSON array of social media posts, each with 'platform', 'content', and 'hashtags' fields.`;
      break;
    case "blog-article":
      prompt += `\nStructure the output as a blog article with a title, introduction, sections with subheadings, and a conclusion.`;
      break;
    case "newsletter":
      prompt += `\nFormat as an email newsletter with a subject line, greeting, main content with sections, and a call to action.`;
      break;
    case "video-script":
      prompt += `\nCreate a video script with clear scene directions, narration text, and visual cues in a two-column format.`;
      break;
    case "podcast-script":
      prompt += `\nDevelop a conversational podcast script with an intro, segments, and outro. Include speaker indicators.`;
      break;
    case "infographic":
      prompt += `\nProvide content organized into key statistics, facts, and brief explanations suitable for an infographic.`;
      break;
    default:
      prompt += `\nTransform the content while maintaining its core message and value.`;
  }

  return prompt;
}

export async function generateAudioFromText(text: string) {
  try {
    // Check if API key is available before attempting to process
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error(
        "OpenAI API key is not configured. Please add it in the project settings.",
      );
    }

    // This is a placeholder for actual TTS implementation
    // In a real implementation, you would call OpenAI's TTS API
    console.log("Generating audio from text:", text);
    return "https://example.com/sample-audio.mp3";
  } catch (error) {
    console.error("Error generating audio:", error);
    if (error.message?.includes("API key")) {
      throw new Error(
        "OpenAI API key is missing or invalid. Please check your project settings.",
      );
    }
    throw new Error("Failed to generate audio. Please try again later.");
  }
}

export async function generateVideoFromText(text: string) {
  try {
    // Check if API key is available before attempting to process
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error(
        "OpenAI API key is not configured. Please add it in the project settings.",
      );
    }

    // This is a placeholder for actual video generation implementation
    // In a real implementation, you would use a video generation service
    console.log("Generating video from text:", text);
    return "https://example.com/sample-video.mp4";
  } catch (error) {
    console.error("Error generating video:", error);
    if (error.message?.includes("API key")) {
      throw new Error(
        "OpenAI API key is missing or invalid. Please check your project settings.",
      );
    }
    throw new Error("Failed to generate video. Please try again later.");
  }
}
