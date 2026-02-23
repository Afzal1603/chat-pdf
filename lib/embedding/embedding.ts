// import { pipeline } from "@xenova/transformers";

// // Lazy-loaded embedding pipeline
// let extractor: any;

// export const getEmbedding = async (text: string): Promise<number[]> => {
//   if (!text || typeof text !== "string" || text.trim().length < 10) {
//     throw new Error(
//       "Input text must be a non-empty string of at least 10 characters.",
//     );
//   }

//   try {
//     if (!extractor) {
//       console.log("Loading embedding model: Xenova/all-MiniLM-L6-v2...");
//       extractor = await pipeline(
//         "feature-extraction",
//         "Xenova/all-mpnet-base-v2",
//       );
//       console.log("Model loaded.");
//     }

//     const output = await extractor(text, { pooling: "mean", normalize: true });

//     if (!output?.data) {
//       throw new Error(
//         `Unexpected embedding dimension: ${output?.data?.length}`,
//       );
//     }

//     return Array.from(output.data);
//   } catch (error) {
//     console.error("Embedding generation failed:", error);
//     throw new Error("Failed to generate embeddings.");
//   }
// };
// lib/embedding/embedding.ts

// 🔴 IMPORTANT: disable AI SDK warnings
if (typeof globalThis !== "undefined") {
  (globalThis as any).AI_SDK_LOG_WARNINGS = false;
}

const EXPECTED_DIMENSION = 1024;
const JINA_API_URL = "https://api.jina.ai/v1/embeddings";

/**
 * Generate embeddings using Jina API directly
 * @param texts Array of text strings to embed
 * @returns Array of embedding vectors (number[][])
 */
export const getEmbeddings = async (texts: string[]): Promise<number[][]> => {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error("Input must be a non-empty array of strings");
  }

  // Validate each text
  texts.forEach((text, idx) => {
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      throw new Error(`Text at index ${idx} must be a non-empty string`);
    }
  });

  console.log(`Generating ${texts.length} embeddings in ONE batch...`);
  const startTime = Date.now();

  try {
    if (!process.env.JINA_API_KEY) {
      throw new Error("JINA_API_KEY is not set in environment variables");
    }

    const response = await fetch(JINA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.JINA_API_KEY}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: "jina-embeddings-v3",
        task: "retrieval.passage",
        dimensions: EXPECTED_DIMENSION,
        embedding_type: "float",
        input: texts,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Jina API Response:", errorText);

      // Better error message
      let errorMessage = `Jina API error (${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage += `: ${errorJson.detail || errorJson.message || errorText}`;
      } catch {
        errorMessage += `: ${errorText}`;
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data.data || !Array.isArray(data.data)) {
      throw new Error("Invalid response format from Jina API");
    }

    const embeddings = data.data.map((item: any) => item.embedding);

    if (embeddings.length !== texts.length) {
      throw new Error(
        `Expected ${texts.length} embeddings, got ${embeddings.length}`,
      );
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✓ Generated ${embeddings.length} embeddings in ${duration}s`);

    return embeddings;
  } catch (error: any) {
    console.error("Embedding generation error:", error);
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
};

/**
 * Generate embedding for a single text string
 * @param text Text string to embed
 * @returns Single embedding vector (number[])
 */
export const getEmbedding = async (text: string): Promise<number[]> => {
  const [embedding] = await getEmbeddings([text]);
  return embedding;
};
