import { Pinecone } from "@pinecone-database/pinecone";
import { downloadFromS3 } from "../s3/s3-server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import md5 from "md5";
import { getEmbedding } from "../embedding/embedding";
import { Vector } from "../type";
import { convertToAscii } from "../utils";
import fs from "fs";

let pinecone: Pinecone | null = null;

export async function initPinecone() {
  if (!pinecone) {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pinecone;
}

type PDFPage = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number };
  };
};

export async function loadS3ToPinecone(fileKey: string) {
  console.log("📥 Downloading file from S3...");
  const file_name = await downloadFromS3(fileKey);

  // Validation
  if (
    !file_name ||
    !fs.existsSync(file_name) ||
    fs.statSync(file_name).size === 0
  ) {
    throw new Error("Downloaded file is missing or empty.");
  }
  if (!file_name.endsWith(".pdf")) {
    throw new Error("File is not a valid PDF.");
  }

  // Load PDF
  let docs: PDFPage[];
  try {
    const loader = new PDFLoader(file_name);
    docs = (await loader.load()) as PDFPage[];
  } catch (err: any) {
    console.error("❌ PDF loading failed:", err.message || err);
    throw new Error("Invalid PDF structure or failed to parse.");
  }

  // Process documents
  console.log("✂️ Splitting PDF content...");
  const documents = await Promise.all(docs.map(prepareDocument));
  const flattenedDocs = documents.flat();
  console.log(`📄 Total chunks to embed: ${flattenedDocs.length}`);
  flattenedDocs.forEach((doc, i) =>
    console.log(`Chunk ${i + 1}: ${doc.pageContent.slice(0, 100)}...`)
  );

  // Generate embeddings
  console.log("🧠 Generating embeddings...");
  const vectors = (await Promise.all(flattenedDocs.map(embededDocument)))
    .filter((v): v is Vector => v !== null)
    .map((v) => ({
      ...v,
      metadata: {
        ...v.metadata,
        source: fileKey, // Add source to metadata for filtering
      },
    }));

  if (!vectors.length) {
    throw new Error("No valid vectors to upload to Pinecone.");
  }

  // Upload to Pinecone
  const client = await initPinecone();
  const index = client.index("chatpdf");
  const namespace = convertToAscii(fileKey);

  console.log(
    `🚀 Uploading ${vectors.length} vectors to namespace: ${namespace}`
  );

  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    try {
      await index.upsert(batch, { namespace });
      console.log(
        `✅ Uploaded batch ${i / batchSize + 1}/${Math.ceil(
          vectors.length / batchSize
        )}`
      );
    } catch (error) {
      console.error(`❌ Failed to upload batch ${i / batchSize + 1}:`, error);
      throw new Error("Failed to upload vectors to Pinecone");
    }
  }

  console.log("✅ PDF embedded and uploaded to Pinecone successfully.");
  return vectors.length;
}

export async function embededDocument(doc: Document): Promise<Vector | null> {
  const text = doc.pageContent?.trim();

  if (!text || text.length < 10) {
    console.warn("⚠️ Skipping empty or too short chunk");
    return null;
  }

  try {
    const embeddings = await getEmbedding(text);
    const hash = md5(text);

    return {
      id: hash,
      values: embeddings,
      metadata: {
        text: doc.metadata.text || "",
        pageNumber: doc.metadata.pageNumber || 0,
        chunkHash: hash,
      },
    };
  } catch (error) {
    console.error("❌ Embedding failed for a chunk:", error);
    return null;
  }
}

async function prepareDocument(page: PDFPage): Promise<Document[]> {
  let { pageContent } = page;
  const { metadata } = page;

  pageContent = pageContent.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

  if (!pageContent || pageContent.length < 10) {
    console.warn("⚠️ Skipping empty page content");
    return [];
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: await truncateStringByBytes(pageContent, 36000),
        originalLength: pageContent.length,
      },
    }),
  ]);

  return docs;
}

export async function truncateStringByBytes(
  str: string,
  bytes: number
): Promise<string> {
  const encoder = new TextEncoder();
  return new TextDecoder("utf-8").decode(encoder.encode(str).slice(0, bytes));
}
