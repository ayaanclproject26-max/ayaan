"use client";

import { use, useState, useEffect } from "react";
import ProductForm from "@/components/admin/ProductForm";
import { getProductBySlugOrId, updateProduct } from "@/lib/services/products";
import { B2BProductInput } from "@/types/b2b";
import Link from "next/link";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [product, setProduct] = useState<B2BProductInput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const p = await getProductBySlugOrId(id);
      setProduct(p);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleUpdate = async (data: B2BProductInput) => {
    if (!product) return;
    await updateProduct(product.id, data);
  };

  if (loading) {
    return (
      <div className="w-full py-20 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="w-full py-20 text-center">
        <h2 className="text-xl font-bold uppercase">Product Not Found</h2>
        <Link href="/admin/products" className="text-primary hover:underline mt-2 inline-block text-xs font-bold uppercase">
          ← Back to Product List
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ProductForm initialData={product} isEdit onSubmit={handleUpdate} />
    </div>
  );
}
