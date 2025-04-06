import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase";

// Initialize the Supabase client with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
}

// Create a single supabase client for the entire app
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to check if Supabase connection is working
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from("content_items")
      .select("count")
      .limit(1);
    if (error) throw error;
    console.log("Supabase connection successful");
    return true;
  } catch (error) {
    console.error("Supabase connection error:", error);
    return false;
  }
};

// Upload content file to Supabase storage
export const uploadContentFile = async (file: File, contentType: string) => {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${contentType}/${fileName}`;

    const { data, error } = await supabase.storage
      .from("content")
      .upload(filePath, file);

    if (error) throw error;

    // Get public URL for the file
    const {
      data: { publicUrl },
    } = supabase.storage.from("content").getPublicUrl(filePath);

    return { filePath, publicUrl };
  } catch (error) {
    console.error("Error uploading file:", error);
    console.log("Detailed upload error:", JSON.stringify(error, null, 2));
    throw error;
  }
};

// Save content item metadata to database
export const saveContentItem = async ({
  title,
  contentType,
  filePath = null,
  url = null,
  previewUrl = null,
  targetType = null,
  user_id = null,
}: {
  title: string;
  contentType: string;
  filePath?: string | null;
  url?: string | null;
  previewUrl?: string | null;
  targetType?: string | null;
  user_id?: string | null;
}) => {
  try {
    // Get current user if not provided
    let userId = user_id;
    if (!userId) {
      const { data: userData } = await supabase.auth.getUser();
      userId = userData.user?.id;
    }

    const { data, error } = await supabase
      .from("content_items")
      .insert({
        title,
        content_type: contentType,
        file_path: filePath,
        url,
        preview_url: previewUrl,
        target_type: targetType,
        status: "pending",
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error saving content item:", error);
    console.log("Detailed save error:", JSON.stringify(error, null, 2));
    throw error;
  }
};

// Get all content items for the current user
export const getContentItems = async () => {
  try {
    const { data, error } = await supabase
      .from("content_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching content items:", error);
    return [];
  }
};
