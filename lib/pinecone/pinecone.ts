// import { Pinecone } from "@pinecone-database/pinecone";
// import { downloadFromS3 } from "../s3/s3-server";
// import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
// import { Document } from "langchain/document";
// import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
// import md5 from "md5";
// import { getEmbedding } from "../embedding/embedding";
// import { Vector } from "../type";
// import { convertToAscii } from "../utils";
// import fs from "fs";

// let pinecone: Pinecone | null = null;

// export async function initPinecone() {
//   if (!pinecone) {
//     pinecone = new Pinecone({
//       apiKey: process.env.PINECONE_API_KEY!,
//     });
//   }
//   return pinecone;
// }

// type PDFPage = {
//   pageContent: string;
//   metadata: {
//     loc: { pageNumber: number };
//   };
// };

// export async function loadS3ToPinecone(fileKey: string) {
//   console.log("Downloading file from S3...");
//   const file_name = await downloadFromS3(fileKey);

//   // Validation
//   if (
//     !file_name ||
//     !fs.existsSync(file_name) ||
//     fs.statSync(file_name).size === 0
//   ) {
//     throw new Error("Downloaded file is missing or empty.");
//   }
//   if (!file_name.endsWith(".pdf")) {
//     throw new Error("File is not a valid PDF.");
//   }

//   // Load PDF
//   let docs: PDFPage[];
//   try {
//     const loader = new PDFLoader(file_name);
//     docs = (await loader.load()) as PDFPage[];
//   } catch (err: any) {
//     console.error("PDF loading failed:", err.message || err);
//     throw new Error("Invalid PDF structure or failed to parse.");
//   }

//   // Process documents
//   console.log("Splitting PDF content...");
//   const documents = await Promise.all(docs.map(prepareDocument));
//   const flattenedDocs = documents.flat();
//   console.log(`Total chunks to embed: ${flattenedDocs.length}`);
//   flattenedDocs.forEach((doc, i) =>
//     console.log(`Chunk ${i + 1}: ${doc.pageContent.slice(0, 100)}...`)
//   );

//   // Generate embeddings
//   console.log("Generating embeddings...");
//   const vectors = (await Promise.all(flattenedDocs.map(embededDocument)))
//     .filter((v): v is Vector => v !== null)
//     .map((v) => ({
//       ...v,
//       metadata: {
//         ...v.metadata,
//         source: fileKey, // Add source to metadata for filtering
//       },
//     }));

//   if (!vectors.length) {
//     throw new Error("No valid vectors to upload to Pinecone.");
//   }

//   // Upload to Pinecone
//   const client = await initPinecone();
//   const index = client.index("chatpdf002");
//   const namespace = convertToAscii(fileKey);

//   console.log(
//     `🚀 Uploading ${vectors.length} vectors to namespace: ${namespace}`
//   );

//   const batchSize = 100;
//   for (let i = 0; i < vectors.length; i += batchSize) {
//     const batch = vectors.slice(i, i + batchSize);
//     try {
//       await index.upsert(batch, { namespace });
//       console.log(
//         `✅ Uploaded batch ${i / batchSize + 1}/${Math.ceil(
//           vectors.length / batchSize
//         )}`
//       );
//     } catch (error) {
//       console.error(`Failed to upload batch ${i / batchSize + 1}:`, error);
//       throw new Error("Failed to upload vectors to Pinecone");
//     }
//   }

//   console.log("PDF embedded and uploaded to Pinecone successfully.");
//   return vectors.length;
// }

// export async function embededDocument(doc: Document): Promise<Vector | null> {
//   const text = doc.pageContent?.trim();

//   if (!text || text.length < 10) {
//     console.warn("Skipping empty or too short chunk");
//     return null;
//   }

//   try {
//     const embeddings = await getEmbedding(text);
//     const hash = md5(text);

//     return {
//       id: hash,
//       values: embeddings,
//       metadata: {
//         text: doc.metadata.text || "",
//         pageNumber: doc.metadata.pageNumber || 0,
//         chunkHash: hash,
//       },
//     };
//   } catch (error) {
//     console.error("Embedding failed for a chunk:", error);
//     return null;
//   }
// }

// async function prepareDocument(page: PDFPage): Promise<Document[]> {
//   let { pageContent } = page;
//   const { metadata } = page;

//   pageContent = pageContent.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

//   if (!pageContent || pageContent.length < 10) {
//     console.warn("Skipping empty page content");
//     return [];
//   }

//   const splitter = new RecursiveCharacterTextSplitter({
//     chunkSize: 1000,
//     chunkOverlap: 200,
//   });

//   const docs = await splitter.splitDocuments([
//     new Document({
//       pageContent,
//       metadata: {
//         pageNumber: metadata.loc.pageNumber,
//         text: await truncateStringByBytes(pageContent, 36000),
//         originalLength: pageContent.length,
//       },
//     }),
//   ]);

//   return docs;
// }

// export async function truncateStringByBytes(
//   str: string,
//   bytes: number
// ): Promise<string> {
//   const encoder = new TextEncoder();
//   return new TextDecoder("utf-8").decode(encoder.encode(str).slice(0, bytes));
// }
import { Pinecone } from "@pinecone-database/pinecone";
import { downloadFromS3 } from "../s3/s3-server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import md5 from "md5";
import { getEmbeddings } from "../embedding/embedding"; // Changed to plural
import { Vector } from "../type";
import { convertToAscii } from "../utils";
import fs from "fs";

let pinecone: Pinecone | null = null;

export async function initPinecone() {
  if (!pinecone) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error("PINECONE_API_KEY environment variable is not set");
    }
    pinecone = new Pinecone({ apiKey });
    console.log("Pinecone client initialized");
  }
  return pinecone;
}

type PDFPage = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number };
  };
};

export async function loadS3ToPinecone(fileKey: string): Promise<number> {
  if (!fileKey) {
    throw new Error("File key is required");
  }

  console.log(`Starting PDF processing for: ${fileKey}`);

  // Download from S3
  const file_name = await downloadFromS3(fileKey);
  console.log(`File downloaded to: ${file_name}`);

  // Validation
  if (!fs.existsSync(file_name)) {
    throw new Error(`Downloaded file not found: ${file_name}`);
  }

  const fileStats = fs.statSync(file_name);
  if (fileStats.size === 0) {
    throw new Error("Downloaded file is empty");
  }

  console.log(`File size: ${fileStats.size} bytes`);

  if (!file_name.endsWith(".pdf")) {
    throw new Error("File is not a valid PDF");
  }

  // Load PDF
  let docs: PDFPage[];
  try {
    console.log("Loading PDF with PDFLoader...");
    const loader = new PDFLoader(file_name);
    docs = (await loader.load()) as PDFPage[];
    console.log(`PDF loaded successfully. Pages: ${docs.length}`);

    if (!docs || docs.length === 0) {
      throw new Error("PDF contains no pages");
    }
  } catch (err: any) {
    console.error("PDF loading failed:", err.message || err);
    throw new Error(`Failed to parse PDF: ${err.message || err}`);
  } finally {
    // Clean up temporary file
    try {
      if (fs.existsSync(file_name)) {
        fs.unlinkSync(file_name);
        console.log(`Cleaned up temporary file: ${file_name}`);
      }
    } catch (cleanupErr) {
      console.warn("Failed to clean up temporary file:", cleanupErr);
    }
  }

  // Process documents
  console.log("Splitting PDF content...");
  const documents = await Promise.all(docs.map(prepareDocument));
  const flattenedDocs = documents.flat();

  // Filter out empty chunks
  const validDocs = flattenedDocs.filter(
    (doc) => doc.pageContent && doc.pageContent.trim().length >= 10,
  );

  console.log(`Total chunks to embed: ${validDocs.length}`);
  validDocs
    .slice(0, 3)
    .forEach((doc, i) =>
      console.log(`Chunk ${i + 1}: ${doc.pageContent.slice(0, 100)}...`),
    );

  // 🚀 OPTIMIZED: Generate ALL embeddings in ONE batch call
  console.log("Generating embeddings in batch...");
  const startTime = Date.now();

  const allTexts = validDocs.map((doc) => doc.pageContent);
  const allEmbeddings = await getEmbeddings(allTexts);

  const embeddingDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(
    `✓ Generated ${allEmbeddings.length} embeddings in ${embeddingDuration}s`,
  );

  // Create vectors with embeddings
  const vectors: Vector[] = validDocs.map((doc, idx) => {
    const text = doc.pageContent.trim();
    const hash = md5(text);

    return {
      id: hash,
      values: allEmbeddings[idx],
      metadata: {
        text: doc.metadata.text || text.substring(0, 1000),
        pageNumber: doc.metadata.pageNumber || 0,
        chunkHash: hash,
        originalLength: doc.metadata.originalLength || text.length,
        source: fileKey, // Add source for filtering
      },
    };
  });

  if (!vectors.length) {
    throw new Error("No valid vectors to upload to Pinecone.");
  }

  // Upload to Pinecone
  const client = await initPinecone();
  const index = client.index("chatpdf005");
  const namespace = convertToAscii(fileKey);

  console.log(
    `🚀 Uploading ${vectors.length} vectors to namespace: ${namespace}`,
  );

  const batchSize = 100;
  const totalBatches = Math.ceil(vectors.length / batchSize);

  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    const batchNum = i / batchSize + 1;

    // Retry logic for Pinecone uploads
    let retries = 3;
    let success = false;

    while (retries > 0 && !success) {
      try {
        await index.namespace(namespace).upsert(batch);
        console.log(`✅ Uploaded batch ${batchNum}/${totalBatches}`);
        success = true;
      } catch (error: any) {
        retries--;
        console.error(
          `Failed to upload batch ${batchNum} (${retries} retries left):`,
          error.message || error,
        );

        if (retries === 0) {
          throw new Error(
            `Failed to upload batch ${batchNum} to Pinecone after 3 attempts: ${
              error.message || error
            }`,
          );
        }

        // Wait before retrying (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (4 - retries)),
        );
      }
    }
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(
    `✅ PDF processing complete in ${totalDuration}s. Uploaded ${vectors.length} vectors.`,
  );

  return vectors.length;
}

async function prepareDocument(page: PDFPage): Promise<Document[]> {
  let { pageContent } = page;
  const { metadata } = page;

  pageContent = pageContent.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

  if (!pageContent || pageContent.length < 10) {
    console.warn("Skipping empty page content");
    return [];
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
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
  bytes: number,
): Promise<string> {
  const encoder = new TextEncoder();
  return new TextDecoder("utf-8").decode(encoder.encode(str).slice(0, bytes));
}
