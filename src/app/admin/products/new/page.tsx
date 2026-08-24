"use client";

import ProductForm from "@/components/admin/ProductForm";
import { createProduct } from "@/lib/services/products";
import { B2BProductInput } from "@/types/b2b";

export default function AddProductPage() {
  const handleCreate = async (data: B2BProductInput) => {
    await createProduct(data);
  };

  return (
    <div className="w-full">
      <ProductForm onSubmit={handleCreate} />
    </div>
  );
}
