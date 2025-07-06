import AWS from "aws-sdk";
import fs from "fs";
import path from "path";

// Set up AWS credentials (or rely on .env + AWS CLI config)
const s3 = new AWS.S3({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
});

export async function downloadFromS3(fileKey: string) {
  const params = {
    Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
    Key: fileKey,
  };

  try {
    const data = await s3.getObject(params).promise();

    // Define a safe temporary directory (cross-platform)
    const tmpDir = path.join(process.cwd(), "tmp");

    // Ensure the directory exists
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const filePath = path.join(tmpDir, `pdf-${Date.now()}.pdf`);

    fs.writeFileSync(filePath, data.Body as Buffer);

    return filePath;
  } catch (error) {
    console.error("Error downloading file from S3:", error);
    return null;
  }
}
