"use client";

import { X, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/CartContext";
import Button from "../ui/Button";

export default function MiniCart() {
  const { isCartOpen, setIsCartOpen, items, updateQuantity, removeFromCart, subtotal } = useCart();

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
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors press-feedback focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
              <ShoppingBag size={48} strokeWidth={1} className="mb-4 text-foreground/50" />
              <p className="text-sm uppercase tracking-wider font-semibold mb-6">Your cart is currently empty.</p>
              <Button onClick={() => setIsCartOpen(false)}>Continue Shopping</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.size}`} className="flex gap-4 border-b border-border pb-6 last:border-0 last:pb-0">
                  <div className="w-[80px] shrink-0 bg-secondary rounded-lg overflow-hidden aspect-[3/4]">
                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col grow justify-between">
                    <div>
                      <div className="text-sm font-semibold mb-1">{item.product.name}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Size: {item.size}</div>
                      <div className="text-sm font-semibold">${item.product.price.toFixed(2)}</div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
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
          <div className="p-6 border-t border-border bg-secondary/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2 text-lg font-semibold uppercase tracking-wider">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-6">
              Shipping and taxes calculated at checkout.
            </p>
            <Button 
              fullWidth 
              onClick={() => {
                setIsCartOpen(false);
                alert("Checkout functionality is disabled in this one-page demo.");
              }}
            >
              Checkout
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
