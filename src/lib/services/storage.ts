import { apiClient } from "@/services/api-client";

export interface UploadResult {
  url: string;
  key: string;
  error?: any;
}

/**
 * Upload a product image via Laravel REST API (/upload or /products/images)
 * Falls back to local Object URL in development
 */
export async function uploadProductImage(file: File): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "products");

    const res = await apiClient.post<any>("/upload", formData);
    if (res?.url || res?.data?.url) {
      return {
        url: res.url || res.data.url,
        key: res.key || res.data.key || file.name,
      };
    }
  } catch {
    // Graceful fallback for offline / development
  }

  const localUrl = typeof window !== "undefined" ? URL.createObjectURL(file) : "/placeholder.jpg";
  return {
    url: localUrl,
    key: `local_${Date.now()}_${file.name}`,
  };
}

/**
 * Upload payment proof via Laravel REST API (/orders/:id/payment-proof)
 */
export async function uploadPaymentProof(file: File, orderId: string): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append("receipt", file);
    formData.append("order_id", orderId);

    const res = await apiClient.post<any>(`/orders/${orderId}/payment-proof`, formData);
    if (res?.url || res?.data?.url) {
      return {
        url: res.url || res.data.url,
        key: res.key || res.data.key || file.name,
      };
    }
  } catch {
    // Graceful fallback for offline / development
  }

  const localUrl = typeof window !== "undefined" ? URL.createObjectURL(file) : "/placeholder.jpg";
  return {
    url: localUrl,
    key: `local_proof_${orderId}_${Date.now()}`,
  };
}
