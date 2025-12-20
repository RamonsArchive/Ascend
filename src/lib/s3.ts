// src/lib/s3.ts
import "server-only";
import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const REGION = process.env.AWS_REGION!;
const BUCKET = process.env.AWS_S3_BUCKET_NAME!;

if (!REGION || !BUCKET) {
  throw new Error("Missing AWS_REGION or AWS_S3_BUCKET_NAME env var");
}

const s3 = new S3Client({
  region: REGION,
  // If you are on an Oracle VM / EC2 / etc with an IAM role, you can omit creds.
  // If you're using static creds locally, AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY will be used automatically by the SDK.
});

function extFrom(file: File) {
  // Prefer filename ext, else fallback to content-type
  const name = file.name || "";
  const dot = name.lastIndexOf(".");
  if (dot !== -1 && dot < name.length - 1)
    return name.slice(dot + 1).toLowerCase();

  const ct = file.type || "";
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
  };
  return map[ct] ?? "bin";
}

export async function uploadOrgImage(opts: {
  orgId: string;
  kind: "logo" | "cover";
  file: File;
}) {
  const { orgId, kind, file } = opts;

  const uuid = crypto.randomUUID();
  const ext = extFrom(file);

  const key = `public/orgs/${orgId}/${kind}/v1/${uuid}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const body = Buffer.from(arrayBuffer);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: file.type || "application/octet-stream",
      // No ACL here (many buckets block ACLs). Make "public/" readable via bucket policy or CloudFront.
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return { key };
}
