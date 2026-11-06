// Direct-to-S3 upload via a presigned URL issued by the backend (compress images client-side first).
export async function compressImage(file: File, maxEdge = 1600, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith('image/')) return file;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), 'image/webp', quality));
}

export async function uploadToPresignedUrl(url: string, blob: Blob): Promise<void> {
  const res = await fetch(url, { method: 'PUT', body: blob, headers: { 'Content-Type': blob.type } });
  if (!res.ok) throw new Error('Upload failed');
}
