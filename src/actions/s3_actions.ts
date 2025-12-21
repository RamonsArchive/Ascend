"use server";

import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import crypto from "crypto";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

const REGION = process.env.AWS_REGION!;
const BUCKET = process.env.AWS_S3_BUCKET_NAME!;
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

function assertEnv() {
  if (!REGION || !BUCKET)
    throw new Error("Missing AWS_REGION or AWS_S3_BUCKET_NAME");
}

function extFromMime(mime: string) {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
  };
  const ext = map[mime];
  if (!ext) throw new Error("Unsupported content type");
  return ext;
}

const s3 = new S3Client({ region: REGION });

export async function createOrgImageUpload(opts: {
  kind: "logo" | "cover";
  fileName: string;
  contentType: string;
}) {
  assertEnv();
  console.log("createOrgImageUpload", opts);

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  const { kind, contentType } = opts;

  // You can keep this simple or use orgId once org exists.
  // This uses userId and random UUID so it’s always unique.
  const uuid = crypto.randomUUID();
  const ext = extFromMime(contentType);

  const key = `tmp/uploads/${session.user.id}/${kind}/v1/${uuid}.${ext}`;

  // Presigned POST (best for browsers, supports size/type conditions)
  const presigned = await createPresignedPost(s3, {
    Bucket: BUCKET,
    Key: key,
    Conditions: [
      ["content-length-range", 1, MAX_BYTES],
      ["eq", "$Content-Type", contentType], // ✅ locks to "image/png" etc
    ],
    Fields: {
      "Content-Type": contentType,
    },
    Expires: 60, // seconds
  });

  return {
    key,
    url: presigned.url,
    fields: presigned.fields,
  };
}

/** Best-effort delete for old finalized objects. */
export async function deleteS3ObjectIfExists(key: string | null | undefined) {
  assertEnv();
  if (!key) return;

  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (e) {
    // Don't fail the request because an old image couldn't be deleted
    console.warn("Failed to delete S3 object:", key, e);
  }
}
