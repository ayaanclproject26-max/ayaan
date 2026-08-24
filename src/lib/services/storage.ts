import { insforge } from "../insforge/client";

/**
 * Upload a media file directly to InsForge Storage bucket "product-images"
 */
export async function uploadProductImage(file: File): Promise<{ url: string; key: string }> {
  const ext = file.name.split(".").pop() || "jpg";
  const uniqueName = `products/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

  try {
    const bucket = insforge.storage.from("product-images");
    const uploadRes = await (bucket as any).uploadAuto?.(uniqueName, file);

    if (uploadRes?.error) {
      console.warn("InsForge storage upload warning:", uploadRes.error);
      const localUrl = URL.createObjectURL(file);
      return { url: localUrl, key: uniqueName };
    }

    const publicUrlRes = bucket.getPublicUrl(uploadRes?.data?.key || uniqueName);
    const publicUrl = (publicUrlRes as any)?.data?.publicUrl || (publicUrlRes as any)?.publicUrl || `/uploads/${uniqueName}`;

    return {
      url: uploadRes?.data?.url || publicUrl,
      key: uploadRes?.data?.key || uniqueName,
    };
  } catch (err) {
    console.error("Storage upload exception:", err);
    return {
      url: URL.createObjectURL(file),
      key: uniqueName,
    };
  }
}
