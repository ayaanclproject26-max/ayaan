"use client";

import { useState } from "react";
import Link from "next/link";
import { Product } from "@/types";
import { useProductModal } from "@/lib/ProductModalContext";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { openProductModal } = useProductModal();
  const [imgError, setImgError] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openProductModal(product);
  };

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : null;

  return (
    <div className="group flex flex-col relative transition-all duration-300 hover:-translate-y-1">
      <div className="relative aspect-[4/5] overflow-hidden bg-secondary mb-3 rounded-xl transition-shadow duration-300 group-hover:shadow-lg">
        <Link href={`#product-${product.slug}`}>
          {!imgError ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover block transition-transform duration-[600ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
              <span className="text-muted-foreground/40 text-sm font-medium text-center px-4">{product.name}</span>
            </div>
          )}
        </Link>
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.isNew && <span className="text-[0.5625rem] font-bold uppercase py-0.5 px-2 bg-background/90 text-primary tracking-[0.1em] backdrop-blur-sm rounded-sm">New</span>}
          {product.isHot && <span className="text-[0.5625rem] font-bold uppercase py-0.5 px-2 bg-destructive/90 text-destructive-foreground tracking-[0.1em] backdrop-blur-sm rounded-sm">Hot</span>}
          {discount && discount >= 10 && (
            <span className="text-[0.5625rem] font-bold uppercase py-0.5 px-2 bg-[#111827]/85 text-white tracking-[0.1em] backdrop-blur-sm rounded-sm">
              -{discount}%
            </span>
          )}
        </div>
        <div className="absolute bottom-0 left-0 w-full p-3 translate-y-5 opacity-0 transition-all duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] z-10 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            className="w-full bg-background/95 text-foreground border border-transparent p-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300 backdrop-blur-md rounded-full hover:bg-foreground hover:text-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            onClick={handleQuickAdd}
          >
            Quick Add
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 px-0.5">
        <Link href={`#product-${product.slug}`}>
          <h3 className="text-[0.8125rem] font-medium text-foreground transition-colors group-hover:text-muted-foreground line-clamp-1">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="text-[0.8125rem] font-semibold">${product.price.toFixed(2)}</span>
          {product.oldPrice && (
            <span className="text-xs text-muted-foreground line-through">${product.oldPrice.toFixed(2)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
