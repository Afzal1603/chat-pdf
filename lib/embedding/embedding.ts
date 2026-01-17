import { pipeline } from "@xenova/transformers";

// Lazy-loaded embedding pipeline
let extractor: any;

export const getEmbedding = async (text: string): Promise<number[]> => {
  if (!text || typeof text !== "string" || text.trim().length < 10) {
    throw new Error(
      "Input text must be a non-empty string of at least 10 characters."
    );
  }

  try {
    if (!extractor) {
      console.log("Loading embedding model: Xenova/all-MiniLM-L6-v2...");
      extractor = await pipeline(
        "feature-extraction",
        "Xenova/all-mpnet-base-v2"
      );
      console.log("Model loaded.");
    }

    const output = await extractor(text, { pooling: "mean", normalize: true });

    if (!output?.data) {
      throw new Error(
        `Unexpected embedding dimension: ${output?.data?.length}`
      );
    }

    return Array.from(output.data);
  } catch (error) {
    console.error("Embedding generation failed:", error);
    throw new Error("Failed to generate embeddings.");
  }
};
