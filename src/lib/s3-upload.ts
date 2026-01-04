"use server";

import crypto from "crypto";
import { headers } from "next/headers";
import { auth } from "@/src/lib/auth";
import {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

const REGION = process.env.AWS_REGION!;
const BUCKET = process.env.AWS_S3_BUCKET_NAME!;
const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const TMP_PREFIX = "tmp/uploads/";

function assertEnv() {
  if (!REGION || !BUCKET) throw new Error("Missing AWS env vars");
}

const s3 = new S3Client({ region: REGION });

export type OrgAssetKind = "logo" | "cover";
export type SponsorAssetKind = "logo" | "cover";

function extFrom(fileName: string, mime: string) {
  const dot = fileName.lastIndexOf(".");
  if (dot !== -1 && dot < fileName.length - 1)
    return fileName.slice(dot + 1).toLowerCase();
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
  };
  return map[mime] ?? "bin";
}

function extFromKey(key: string) {
  const lastDot = key.lastIndexOf(".");
  return lastDot === -1 ? "bin" : key.slice(lastDot + 1).toLowerCase();
}

function ensureTmpKey(tmpKey: string) {
  if (!tmpKey.startsWith(TMP_PREFIX)) throw new Error("INVALID_TMP_KEY");
}

/**
 * Step 1 (client calls this): get presigned POST + tmpKey
 */
export async function createOrgImageUpload(opts: {
  kind: OrgAssetKind;
  fileName: string;
  contentType: string;
}) {
  assertEnv();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");

  const { kind, fileName, contentType } = opts;
  const uuid = crypto.randomUUID();
  const ext = extFrom(fileName, contentType);

  // ✅ tmp key includes kind/v1 like you want
  const key = `tmp/uploads/${session.user.id}/${kind}/v1/${uuid}.${ext}`;

  const presigned = await createPresignedPost(s3, {
    Bucket: BUCKET,
    Key: key,
    Conditions: [
      ["content-length-range", 1, MAX_BYTES],
      ["starts-with", "$Content-Type", "image/"],
    ],
    Fields: {
      "Content-Type": contentType,
    },
    Expires: 60,
  });

  return { key, url: presigned.url, fields: presigned.fields };
}

/**
 * Step 2 (server calls this): copy tmp -> final, delete tmp, return finalKey for DB
 */
export async function finalizeOrgImageFromTmp(opts: {
  orgId: string;
  kind: OrgAssetKind;
  tmpKey: string;
}): Promise<string> {
  assertEnv();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");

  const { orgId, kind, tmpKey } = opts;
  ensureTmpKey(tmpKey);

  const ext = extFromKey(tmpKey);
  const uuid = crypto.randomUUID();

  const finalKey = `public/orgs/${orgId}/${kind}/v1/${uuid}.${ext}`;
  console.log("finalKey", finalKey);

  // ✅ Correct CopySource encoding:
  // encodeURIComponent encodes "/" too, AWS wants slashes preserved
  const encodedKey = encodeURIComponent(tmpKey).replace(/%2F/g, "/");
  const copySource = `${BUCKET}/${encodedKey}`;

  await s3.send(
    new CopyObjectCommand({
      Bucket: BUCKET,
      Key: finalKey,
      CopySource: copySource,
    })
  );

  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: tmpKey }));

  return finalKey;
}

export async function finalizeSponsorImageFromTmp(opts: {
  sponsorId: string;
  kind: SponsorAssetKind;
  tmpKey: string;
}): Promise<string> {
  assertEnv();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");

  const { sponsorId, kind, tmpKey } = opts;
  ensureTmpKey(tmpKey);

  const ext = extFromKey(tmpKey);
  const uuid = crypto.randomUUID();

  const finalKey = `public/sponsors/${sponsorId}/${kind}/v1/${uuid}.${ext}`;

  const encodedKey = encodeURIComponent(tmpKey).replace(/%2F/g, "/");
  const copySource = `${BUCKET}/${encodedKey}`;

  await s3.send(
    new CopyObjectCommand({
      Bucket: BUCKET,
      Key: finalKey,
      CopySource: copySource,
    })
  );

  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: tmpKey }));

  return finalKey;
}

export type EventAssetKind = "cover";

export async function finalizeEventImageFromTmp(opts: {
  eventId: string;
  kind: EventAssetKind;
  tmpKey: string;
}): Promise<string> {
  assertEnv();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");

  const { eventId, kind, tmpKey } = opts;
  ensureTmpKey(tmpKey);

  const ext = extFromKey(tmpKey);
  const uuid = crypto.randomUUID();

  const finalKey = `public/events/${eventId}/${kind}/v1/${uuid}.${ext}`;

  const encodedKey = encodeURIComponent(tmpKey).replace(/%2F/g, "/");
  const copySource = `${BUCKET}/${encodedKey}`;

  await s3.send(
    new CopyObjectCommand({
      Bucket: BUCKET,
      Key: finalKey,
      CopySource: copySource,
    })
  );

  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: tmpKey }));

  return finalKey;
}

export async function createEventImageUpload(opts: {
  kind: EventAssetKind;
  fileName: string;
  contentType: string;
}) {
  assertEnv();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");

  const { kind, fileName, contentType } = opts;
  const uuid = crypto.randomUUID();
  const ext = extFrom(fileName, contentType);

  const key = `tmp/uploads/${session.user.id}/${kind}/v1/${uuid}.${ext}`;

  const presigned = await createPresignedPost(s3, {
    Bucket: BUCKET,
    Key: key,
    Conditions: [
      ["content-length-range", 1, MAX_BYTES],
      ["starts-with", "$Content-Type", "image/"],
    ],
    Fields: { "Content-Type": contentType },
    Expires: 60,
  });

  return { key, url: presigned.url, fields: presigned.fields };
}

export type UserAssetKind = "profile" | "banner";

export async function createUserImageUpload(opts: {
  kind: UserAssetKind;
  fileName: string;
  contentType: string;
}) {
  assertEnv();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");

  const { kind, fileName, contentType } = opts;
  const uuid = crypto.randomUUID();
  const ext = extFrom(fileName, contentType);

  const key = `tmp/uploads/${session.user.id}/${kind}/v1/${uuid}.${ext}`;

  const presigned = await createPresignedPost(s3, {
    Bucket: BUCKET,
    Key: key,
    Conditions: [
      ["content-length-range", 1, MAX_BYTES],
      ["starts-with", "$Content-Type", "image/"],
    ],
    Fields: { "Content-Type": contentType },
    Expires: 60,
  });

  return { key, url: presigned.url, fields: presigned.fields };
}

export async function finalizeUserImageFromTmp(opts: {
  userId: string;
  kind: UserAssetKind;
  tmpKey: string;
}): Promise<string> {
  assertEnv();

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");

  // IMPORTANT: only allow finalizing YOUR tmp uploads
  if (!opts.tmpKey.startsWith(`tmp/uploads/${session.user.id}/`)) {
    throw new Error("INVALID_TMP_KEY_OWNER");
  }

  const { userId, kind, tmpKey } = opts;
  ensureTmpKey(tmpKey);

  const ext = extFromKey(tmpKey);
  const uuid = crypto.randomUUID();

  const finalKey = `public/users/${userId}/${kind}/v1/${uuid}.${ext}`;

  const encodedKey = encodeURIComponent(tmpKey).replace(/%2F/g, "/");
  const copySource = `${BUCKET}/${encodedKey}`;

  await s3.send(
    new CopyObjectCommand({
      Bucket: BUCKET,
      Key: finalKey,
      CopySource: copySource,
    })
  );
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: tmpKey }));

  return finalKey;
}
