import AWS from "aws-sdk";
import fs from "fs";
import path from "path";

// Set up AWS credentials (or rely on .env + AWS CLI config)
const s3 = new AWS.S3({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
});

export async function downloadFromS3(fileKey: string): Promise<string> {
  if (!fileKey) {
    throw new Error("File key is required for S3 download");
  }

  if (!process.env.NEXT_PUBLIC_S3_BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME environment variable is not set");
  }

  const params = {
    Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
    Key: fileKey,
  };

  try {
    console.log(`Downloading file from S3: ${fileKey}`);
    const data = await s3.getObject(params).promise();

    // Validate the downloaded data
    if (!data.Body) {
      throw new Error(`No data received from S3 for file: ${fileKey}`);
    }

    const buffer = data.Body as Buffer;
    if (buffer.length === 0) {
      throw new Error(`Downloaded file is empty: ${fileKey}`);
    }

    console.log(`Downloaded ${buffer.length} bytes from S3`);

    // Define a safe temporary directory (cross-platform)
    // const tmpDir = path.join(process.cwd(), "tmp");
    const tmpDir = "/tmp";

    // Ensure the directory exists
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const filePath = path.join(tmpDir, `pdf-${Date.now()}.pdf`);

    fs.writeFileSync(filePath, buffer);

    // Validate the written file
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
      throw new Error(`Failed to write file to disk: ${filePath}`);
    }

    console.log(`File saved to: ${filePath}`);
    return filePath;
  } catch (error: any) {
    console.error(`Error downloading file from S3 (${fileKey}):`, error);
    throw new Error(
      `Failed to download file from S3: ${error.message || error}`,
    );
  }
}
