import type { Metadata } from "next";
import { CartProvider } from "@/lib/CartContext";
import { RfqProvider } from "@/lib/RfqContext";
import { ProductModalProvider } from "@/lib/ProductModalContext";
import { PreferencesProvider } from "@/lib/PreferencesContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MiniCart from "@/components/cart/MiniCart";
import ProductQuickAddModal from "@/components/product/ProductQuickAddModal";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ayaan Clothing",
  description: "Modern, premium, mobile-first fashion eCommerce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
        <PreferencesProvider>
          <CartProvider>
            <RfqProvider>
              <ProductModalProvider>
                <Header />
                <MiniCart />
                <ProductQuickAddModal />
                <main className="min-h-screen pb-safe">{children}</main>
                <Footer />
              </ProductModalProvider>
            </RfqProvider>
          </CartProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}

