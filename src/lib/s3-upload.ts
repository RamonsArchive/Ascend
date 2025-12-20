"use server";

import crypto from "crypto";
import {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const REGION = process.env.AWS_REGION!;
const BUCKET = process.env.AWS_S3_BUCKET_NAME!;

// Adjust to match your presigned tmp prefix exactly:
const TMP_PREFIX = "tmp/uploads/"; // e.g. "tmp/uploads/{userId}/logo/v1/uuid.ext"
const key = `tmp/uploads/${session.user.id}/${uuid}.${ext}`;

function assertEnv() {
  if (!REGION || !BUCKET)
    throw new Error("Missing AWS_REGION or AWS_S3_BUCKET_NAME");
}

const s3 = new S3Client({ region: REGION });

function extFromKey(key: string) {
  const lastDot = key.lastIndexOf(".");
  if (lastDot === -1) return "bin";
  return key.slice(lastDot + 1).toLowerCase();
}

function ensureTmpKey(tmpKey: string) {
  if (!tmpKey.startsWith(TMP_PREFIX)) {
    throw new Error("INVALID_TMP_KEY");
  }
}

export type OrgAssetKind = "logo" | "cover";

/**
 * Finalizes a tmp upload by moving it into the org's public folder.
 * - Copies tmpKey -> finalKey
 * - Deletes tmpKey
 * Returns finalKey for DB persistence.
 *
 * This is reusable for:
 * - create org
 * - update org logo/cover later
 */
export async function finalizeOrgImageFromTmp(opts: {
  orgId: string;
  kind: OrgAssetKind;
  tmpKey: string; // must be a key that exists in S3 under tmp/
}): Promise<string> {
  assertEnv();

  const { orgId, kind, tmpKey } = opts;
  ensureTmpKey(tmpKey);

  const ext = extFromKey(tmpKey);
  const uuid = crypto.randomUUID();

  // Your desired final structure:
  // public/orgs/{orgId}/logo/v1/{uuid}.{ext}
  const finalKey = `public/orgs/${orgId}/${kind}/v1/${uuid}.${ext}`;

  // CopyObject "CopySource" must include bucket + key (URL-encoded key)
  const copySource = `${BUCKET}/${encodeURI(tmpKey)}`;

  await s3.send(
    new CopyObjectCommand({
      Bucket: BUCKET,
      Key: finalKey,
      CopySource: copySource,
      // If you rely on ContentType, you can optionally set MetadataDirective,
      // but for images it’s usually fine to let the client/browser infer.
    })
  );

  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: tmpKey,
    })
  );

  return finalKey;
}
