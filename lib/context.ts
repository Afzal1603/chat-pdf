import { Pinecone } from "@pinecone-database/pinecone";
import { getEmbedding } from "./embedding/embedding";
import { convertToAscii } from "./utils";

const MIN_SCORE = 0.1; // Increased from 0.3 for better relevance
const TOP_K = 5;
const INDEX_NAME = "chatpdf005";

export async function getMatchesFromEmbeddings(
  embeddings: number[],
  fileKey: string,
) {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error("PINECONE_API_KEY is not set");
  }

  if (!embeddings || embeddings.length === 0) {
    throw new Error("Embeddings array is empty");
  }

  if (!fileKey) {
    throw new Error("File key is required for querying");
  }

  const pinecone = new Pinecone({ apiKey });
  const index = pinecone.index(INDEX_NAME);
  const namespace = convertToAscii(fileKey);

  console.log(
    `Querying Pinecone index: ${INDEX_NAME}, namespace: ${namespace}, fileKey: ${fileKey}`,
  );

  try {
    const queryResult = await index.namespace(namespace).query({
      topK: TOP_K,
      vector: embeddings,
      includeMetadata: true,
    });

    console.log(
      `Found ${queryResult.matches?.length || 0} matches for ${fileKey}`,
    );

    if (queryResult.matches && queryResult.matches.length > 0) {
      console.log(
        "Match scores:",
        queryResult.matches.map((m) => ({
          id: m.id,
          score: m.score,
          pageNumber: (m.metadata as any)?.pageNumber,
        })),
      );
    }

    return queryResult.matches || [];
  } catch (error: any) {
    console.error("Error querying embeddings:", error);
    throw new Error(`Failed to query Pinecone: ${error.message || error}`);
  }
}

type Metadata = {
  text: string;
  pageNumber: number;
  chunkHash?: string;
  source?: string;
};

export async function getContext(query: string, fileKey: string) {
  if (!query || query.trim().length === 0) {
    throw new Error("Query cannot be empty");
  }

  if (!fileKey) {
    throw new Error("File key is required");
  }

  console.log(`Getting context for query: "${query.substring(0, 100)}..."`);

  try {
    const queryEmbeddings = await getEmbedding(query);
    const matches = await getMatchesFromEmbeddings(queryEmbeddings, fileKey);

    if (matches.length === 0) {
      console.warn(
        `No matches found for fileKey: ${fileKey}. This could mean:`,
      );
      console.warn("1. The PDF hasn't been processed yet");
      console.warn("2. The namespace doesn't exist in Pinecone");
      console.warn("3. The query is too different from the document content");
      return "";
    }

    // Filter by minimum score threshold
    const qualifiedMatches = matches.filter(
      (match) => match.score && match.score > MIN_SCORE,
    );

    console.log(
      `Qualified matches (score > ${MIN_SCORE}): ${qualifiedMatches.length}/${matches.length}`,
    );

    if (qualifiedMatches.length === 0) {
      console.warn(
        `No matches above threshold ${MIN_SCORE}. Best score: ${matches[0]?.score}`,
      );
      // Return best match even if below threshold, but log warning
      const bestMatch = matches[0];
      if (bestMatch && bestMatch.metadata) {
        return ((bestMatch.metadata as Metadata).text || "").substring(0, 3000);
      }
      return "";
    }

    // Combine context from all qualified matches
    const context = qualifiedMatches
      .map((match) => {
        const metadata = match.metadata as Metadata;
        const text = metadata?.text || "";
        const pageNum = metadata?.pageNumber || "unknown";
        return `[Page ${pageNum}] ${text}`;
      })
      .join("\n\n")
      .substring(0, 3000);

    console.log(`Returning context of length: ${context.length}`);
    return context;
  } catch (error: any) {
    console.error("Error getting context:", error);
    throw new Error(`Failed to get context: ${error.message || error}`);
  }
}
