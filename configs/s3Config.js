import "dotenv/config";

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import {
  getSignedUrl,
} from "@aws-sdk/s3-request-presigner";

const requiredEnvironmentVariables = [
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_ENDPOINT_URL_S3",
  "AWS_REGION",
  "NEON_STORAGE_BUCKET",
];

for (const variableName of requiredEnvironmentVariables) {
  if (!process.env[variableName]) {
    throw new Error(
      `Missing required environment variable: ${variableName}`
    );
  }
}

export const storageBucket =
  process.env.NEON_STORAGE_BUCKET;

export const s3Client = new S3Client({
  region: process.env.AWS_REGION,

  endpoint: process.env.AWS_ENDPOINT_URL_S3,

  credentials: {
    accessKeyId:
      process.env.AWS_ACCESS_KEY_ID,

    secretAccessKey:
      process.env.AWS_SECRET_ACCESS_KEY,
  },

  /*
   * Bắt buộc với Neon Storage.
   *
   * Dạng URL:
   * endpoint/bucket/key
   *
   * Thay vì:
   * bucket.endpoint/key
   */
  forcePathStyle: true,
});

export const uploadObjectToStorage = async ({
  key,
  body,
  contentType,
  metadata,
}) => {
  const command = new PutObjectCommand({
    Bucket: storageBucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata,
  });

  await s3Client.send(command);

  return key;
};

export const createSignedObjectUrl = async (
  key,
  expiresIn = Number(
    process.env.S3_SIGNED_URL_EXPIRES_IN ?? 3600
  )
) => {
  if (!key) {
    return null;
  }

  const command = new GetObjectCommand({
    Bucket: storageBucket,
    Key: key,
  });

  return getSignedUrl(s3Client, command, {
    expiresIn,
  });
};

export const deleteObjectFromStorage = async (
  key
) => {
  if (!key) {
    return;
  }

  const command = new DeleteObjectCommand({
    Bucket: storageBucket,
    Key: key,
  });

  await s3Client.send(command);
};
