import { Pinecone } from "@pinecone-database/pinecone";
import { getEmbedding } from "./embedding/embedding";

const MIN_SCORE = 0.8;
const TOP_K = 5;

export async function getMatchesFromEmbeddings(
  embeddings: number[],
  fileKey: string
) {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) throw new Error("PINECONE_API_KEY is not set");

  const pinecone = new Pinecone({ apiKey });
  const index = pinecone.index("chatpdf002");

  try {
    const queryResult = await index.query({
      topK: TOP_K,
      vector: embeddings,
      filter: { source: { $eq: fileKey } },
      includeMetadata: true,
    });

    console.log(`Found ${queryResult.matches?.length} matches for ${fileKey}`);
    return queryResult.matches || [];
  } catch (error) {
    console.error("Error querying embeddings:", error);
    throw error; // Re-throw if you want calling code to handle
  }
}

type Metadata = {
  text: string;
  pageNumber: number;
};

export async function getContext(query: string, fileKey: string) {
  const queryEmbeddings = await getEmbedding(query);

  let matches = await getMatchesFromEmbeddings(queryEmbeddings, fileKey);

  if (matches.length === 0) {
    console.warn("No filtered matches found - trying unfiltered search");
    const index = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! }).index(
      "chatpdf"
    );
    const result = await index.query({
      topK: 5,
      vector: queryEmbeddings,
      includeMetadata: true,
    });
    matches = result.matches || [];
    console.log(
      "Unfiltered matches:",
      matches.map((m) => ({
        score: m.score,
        source: (m.metadata as any)?.source,
      }))
    );
  }

  // 3. Use lower threshold temporarily
  const qualifiedMatches = matches.filter(
    (match) => match.score && match.score > 0.3
  );

  return qualifiedMatches
    .map((match) => (match.metadata as Metadata).text)
    .join("\n")
    .substring(0, 3000);
}
