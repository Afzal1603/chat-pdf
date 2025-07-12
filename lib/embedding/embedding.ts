import { pipeline } from "@xenova/transformers";

// Lazy-loaded embedding pipeline
let extractor: any;

/**
 * Generates a 384-dimensional embedding for the given text.
 * @param text Input string to embed.
 * @returns An array of 384 normalized float values.
 */
export const getEmbedding = async (text: string): Promise<number[]> => {
  if (!text || typeof text !== "string" || text.trim().length < 10) {
    throw new Error(
      "Input text must be a non-empty string of at least 10 characters."
    );
  }

  try {
    if (!extractor) {
      console.log("📦 Loading embedding model: Xenova/all-MiniLM-L6-v2...");
      extractor = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
      );
      console.log("✅ Model loaded.");
    }

    const output = await extractor(text, { pooling: "mean", normalize: true });

    if (!output?.data || output.data.length !== 384) {
      throw new Error(
        `❌ Unexpected embedding dimension: ${output?.data?.length}`
      );
    }

    return Array.from(output.data);
  } catch (error) {
    console.error("❌ Embedding generation failed:", error);
    throw new Error("Failed to generate embeddings.");
  }
};
