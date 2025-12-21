export async function uploadToS3PresignedPost(opts: {
  url: string;
  fields: Record<string, string>;
  file: File;
}) {
  const { url, fields, file } = opts;

  console.log("uploadToS3PresignedPost", opts);
  const fd = new FormData();
  // Important: fields FIRST, then file LAST for S3 POST
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
  fd.append("file", file);

  const res = await fetch(url, { method: "POST", body: fd });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`S3 upload failed (${res.status}): ${text.slice(0, 300)}`);
  }
}

export function s3KeyToPublicUrl(key?: string | null) {
  if (!key) return null;

  if (key.startsWith("http")) return key;

  const bucket = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME;
  const region = process.env.NEXT_PUBLIC_AWS_REGION;

  if (!bucket || !region) {
    console.error("Missing NEXT_PUBLIC_AWS_* env vars");
    return null;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}
