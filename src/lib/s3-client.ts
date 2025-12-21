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
