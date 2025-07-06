import { pipeline } from "@xenova/transformers";

let extractor: any;
export const getEmbedding = async (text: string): Promise<number[]> => {
  try {
    if (!extractor) {
      extractor = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
      );
    }
    const output = await extractor(text, { pooling: "mean", normalize: true });
    if (output.data.length !== 384) {
      throw new Error(`Unexpected dimension: ${output.data.length}`);
    }
    return Array.from(output.data);
  } catch (error) {
    console.error("Embedding generation failed:", error);
    throw new Error("Failed to generate embeddings");
  }
};
