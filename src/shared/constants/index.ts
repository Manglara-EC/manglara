import { DeleteObjectCommand, NoSuchKey, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

export const BASE_URL =
  process.env.VERCEL_ENV === "production"
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_ENV === "preview"
      ? `https://${process.env.VERCEL_BRANCH_URL}`
      : "http://localhost:3000";

export const RATE_LIMIT_ERROR_CODE = 429;

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

export async function uploadImage(key: string, body: Buffer, contentType: string) {
  const upload = new Upload({
    client: r2Client,
    params: {
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: body,
      ContentType: contentType,
    },
  });
  return upload.done();
}

export async function deleteImage(key: string) {
  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      })
    );
  } catch (error) {
    if (!(error instanceof NoSuchKey || (error as { name?: string }).name === 'NoSuchKey')) {
      throw error;
    }
  }
}

export function getPublicImageUrl(key: string) {
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

export function buildImageKey(folder: string, filename: string) {
  const sanitized = filename.toLowerCase().replace(/[^a-z0-9.]/g, '-');
  return `${folder}/${crypto.randomUUID()}-${sanitized}`;
}