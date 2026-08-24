"use client";

import { X, ShoppingBag, FileText } from "lucide-react";
import { useCart } from "@/lib/CartContext";
import { useRfq } from "@/lib/RfqContext";
import { useRouter } from "next/navigation";
import Button from "../ui/Button";

export default function MiniCart() {
  const { isCartOpen, setIsCartOpen, items, updateQuantity, removeFromCart, subtotal } = useCart();
  const { addToRfq } = useRfq();
  const router = useRouter();

  const handleRequestQuoteFromCart = () => {
    for (const item of items) {
      addToRfq(
        {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          brand: item.product.brand,
          price: item.product.price,
          images: item.product.images,
          sku: item.product.sku,
          moq: 50,
        } as any,
        item.quantity,
        {
          size: item.size,
          color: (item as any).color || item.product.color,
        }
      );
    }
    setIsCartOpen(false);
    router.push("/rfq");
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-ink/30 backdrop-blur-sm z-[100] transition-opacity duration-300 ${
          isCartOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`} 
        onClick={() => setIsCartOpen(false)}
      />
      
      {/* Cart Sheet */}
      <div className={`fixed top-0 right-0 h-full w-[90vw] max-w-[400px] bg-background border-l border-border shadow-2xl z-[110] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
        isCartOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-display text-xl uppercase tracking-wider">Shopping Cart</h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mb-4 stroke-1" />
              <p className="text-sm font-medium">Your cart is empty</p>
              <p className="text-xs mt-1">Add items or request a wholesale quote</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.size}`} className="flex gap-4 items-center">
                  <img 
                    src={item.product.images[0]} 
                    alt={item.product.name} 
                    className="w-20 h-24 object-cover rounded-md bg-secondary shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate">{item.product.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.size ? `Size: ${item.size}` : ""} {item.product.color ? `• Color: ${item.product.color}` : ""}
                    </p>
                    <p className="text-sm font-medium mt-1">${item.product.price.toFixed(2)}</p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-border rounded-full h-8">
                        <button 
                          className="w-8 h-full flex items-center justify-center hover:bg-secondary rounded-l-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                        >-</button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button 
                          className="w-8 h-full flex items-center justify-center hover:bg-secondary rounded-r-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                        >+</button>
                      </div>
                      <button 
                        className="text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => removeFromCart(item.product.id, item.size)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-border bg-secondary/30 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between text-base font-semibold uppercase tracking-wider">
              <span>Estimated Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            <button
              type="button"
              onClick={handleRequestQuoteFromCart}
              className="w-full py-3 rounded-full bg-foreground text-background font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <FileText size={15} />
              <span>Request Wholesale Quote (RFQ)</span>
            </button>

            <button 
              type="button"
              className="w-full py-2.5 rounded-full border border-border hover:bg-secondary text-foreground text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              onClick={() => {
                setIsCartOpen(false);
                alert("Proceeding with sample retail checkout...");
              }}
            >
              Sample Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
