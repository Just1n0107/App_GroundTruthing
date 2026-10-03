import { Directory, File, Paths } from "expo-file-system";
import { photoBucket, supabase } from "@/lib/supabase";
import type { PhotoRef } from "@/types";

function photoError(message: string) {
  if (/bucket not found|nosuchbucket/i.test(message)) {
    return "Photographs cannot reach the central database yet. Run supabase/storage.sql in the Supabase SQL editor to create the plant-photos bucket. This record stays on the phone.";
  }
  return message;
}

export async function copyPhotoIntoApp(localId: string, sourceUri: string) {
  const directory = new Directory(Paths.document, "photos");
  directory.create({ intermediates: true, idempotent: true });
  const destination = new File(directory, `${localId}.jpg`);
  const source = new File(sourceUri);
  await source.copy(destination, { overwrite: true });
  return destination.uri;
}

export async function deleteLocalPhoto(uri: string | null) {
  if (!uri || uri.startsWith("http")) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // The field record is still valid if the local file is already gone.
  }
}

export async function uploadPlantPhoto(userId: string, localId: string, uri: string) {
  try {
    const file = new File(uri);
    const bytes = await file.bytes();
    const path = `${userId}/${localId}.jpg`;
    const { error } = await supabase.storage.from(photoBucket).upload(path, bytes, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (error) return { url: null, error: photoError(error.message) };
    const { data } = supabase.storage.from(photoBucket).getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not read the photograph.";
    return { url: null, error: photoError(message) };
  }
}

function fileNameForUrl(url: string) {
  let hash = 0;
  for (let index = 0; index < url.length; index += 1) {
    hash = (hash * 31 + url.charCodeAt(index)) >>> 0;
  }
  return `${hash.toString(16)}.jpg`;
}

async function cacheRemotePhoto(url: string) {
  if (!url.startsWith("http")) return url;
  const directory = new Directory(Paths.document, "reference-photos");
  directory.create({ intermediates: true, idempotent: true });
  const destination = new File(directory, fileNameForUrl(url));
  if (destination.exists && (destination.size ?? 0) > 0) return destination.uri;
  try {
    const downloaded = await File.downloadFileAsync(url, destination, { idempotent: true });
    return downloaded.uri;
  } catch {
    return url;
  }
}

export async function cachePhotoFiles(photos: PhotoRef[]) {
  const cached: PhotoRef[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < photos.length) {
      const photo = photos[cursor];
      cursor += 1;
      if (!photo) continue;
      const storagePath = await cacheRemotePhoto(photo.storage_path);
      cached.push({ storage_path: storagePath, caption: photo.caption });
    }
  }
  const workers = Math.min(3, photos.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return cached;
}
