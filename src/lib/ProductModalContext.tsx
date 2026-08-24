"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Product } from "@/types";

interface ProductModalContextType {
  selectedProduct: Product | null;
  openProductModal: (product: Product) => void;
  closeProductModal: () => void;
}

const ProductModalContext = createContext<ProductModalContextType | undefined>(undefined);

export function ProductModalProvider({ children }: { children: React.ReactNode }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const openProductModal = useCallback((product: Product) => {
    setSelectedProduct(product);
    document.body.style.overflow = "hidden";
  }, []);

  const closeProductModal = useCallback(() => {
    setSelectedProduct(null);
    document.body.style.overflow = "";
  }, []);

  return (
    <ProductModalContext.Provider value={{ selectedProduct, openProductModal, closeProductModal }}>
      {children}
    </ProductModalContext.Provider>
  );
}

export function useProductModal() {
  const context = useContext(ProductModalContext);
  if (context === undefined) {
    throw new Error("useProductModal must be used within a ProductModalProvider");
  }
  return context;
}
