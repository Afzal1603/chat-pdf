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

  let docs: PDFPage[];
  try {
    const loader = new PDFLoader(file_name);
    docs = (await loader.load()) as PDFPage[];
  } catch (err: any) {
    console.error("PDF loading failed:", err.message || err);
    throw new Error("Invalid PDF structure or failed to parse.");
  }

  console.log("Splitting PDF content...");
  const documents = await Promise.all(docs.map(prepareDocument));
  const flattenedDocs = documents.flat();

  console.log("🧠 Generating embeddings...");
  const vectorsRaw = await Promise.all(flattenedDocs.map(embededDocument));
  const vectors = vectorsRaw.filter(
    (v): v is Vector =>
      v !== null &&
      typeof v.id === "string" &&
      Array.isArray(v.values) &&
      typeof v.metadata?.text === "string"
  );

  if (!vectors.length) {
    throw new Error("No valid vectors to upload to Pinecone.");
  }

  const client = await initPinecone();
  const index = client.Index("chatpdf");
  const namespace = convertToAscii(fileKey);

  console.log("Uploading to Pinecone...");
  console.log(`Uploading ${vectors.length} vectors to namespace ${namespace}`);

  try {
    // Corrected upsert call - pass vectors array directly
    await index.upsert(vectors, { namespace });
    console.log("✅ PDF embedded and uploaded to Pinecone successfully.");
  } catch (error) {
    console.error("Pinecone upload failed:", error);
    throw new Error("Failed to upload vectors to Pinecone");
  }
}

export async function embededDocument(doc: Document): Promise<Vector | null> {
  try {
    const embeddings = await getEmbedding(doc.pageContent);
    const hash = md5(doc.pageContent);
    return {
      id: hash,
      values: embeddings,
      metadata: {
        text: doc.metadata.text,
        pageNumber: doc.metadata.pageNumber,
      },
    };
  } catch (error) {
    console.error("Embedding failed for a document:", error);
    return null;
  }
}

export async function truncateStringByBytes(str: string, bytes: number) {
  const encoder = new TextEncoder();
  return new TextDecoder("utf-8").decode(encoder.encode(str).slice(0, bytes));
}

async function prepareDocument(page: PDFPage) {
  let { pageContent } = page;
  const { metadata } = page;
  pageContent = pageContent.replace(/\n/g, " ");

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 400,
    chunkOverlap: 50,
  });

  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: await truncateStringByBytes(pageContent, 360000),
      },
    }),
  ]);

  return docs;
}
