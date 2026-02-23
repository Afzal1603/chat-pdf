import AWS from "aws-sdk";

export async function uploadToS3(
  file: File,
): Promise<{ file_key: string; file_name: string }> {
  if (!file) {
    throw new Error("File is required for upload");
  }

  if (!process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID) {
    throw new Error("AWS_ACCESS_KEY_ID is not set");
  }

  if (!process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY) {
    throw new Error("AWS_SECRET_ACCESS_KEY is not set");
  }

  if (!process.env.NEXT_PUBLIC_S3_BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME is not set");
  }

  if (!process.env.NEXT_PUBLIC_AWS_REGION) {
    throw new Error("AWS_REGION is not set");
  }

  try {
    AWS.config.update({
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    });

    const s3 = new AWS.S3({
      params: { Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME },
      region: process.env.NEXT_PUBLIC_AWS_REGION,
    });

    const sanitizedFileName = file.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9.\-_]/g, "");

    if (!sanitizedFileName) {
      throw new Error("Invalid file name after sanitization");
    }

    const file_key = `uploads/${Date.now()}-${sanitizedFileName}`;

    const params = {
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
      Key: file_key,
      Body: file,
    };

    console.log(`Uploading file to S3: ${file_key}`);

    const upload = s3
      .putObject(params)
      .on("httpUploadProgress", (evt) => {
        const percentage = Math.round((evt.loaded * 100) / evt.total);
        console.log(`Uploading to S3... ${percentage}%`);
      })
      .promise();

    await upload;

    console.log(`Successfully uploaded to S3: ${file_key}`);

    return {
      file_key,
      file_name: file.name,
    };
  } catch (error: any) {
    console.error("S3 upload error:", error);
    throw new Error(`Failed to upload file to S3: ${error.message || error}`);
  }
}

export function getS3Url(file_key: string) {
  const url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${file_key}`;
  return url;
}
