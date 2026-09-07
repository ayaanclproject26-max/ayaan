# Frontend-First Product Development Mode & Architecture Guide

**Project:** Ayaan Clothing B2B Export Platform  
**Mode:** Standalone Frontend Prototype (Zero Backend Dependency)  
**Configuration Flag:** `NEXT_PUBLIC_FRONTEND_ONLY=true`  
**Last Updated:** 2026-09-02  

---

## 1. Executive Summary & Objective

In **Frontend-First Product Development Mode**, the complete Ayaan Clothing B2B export platform runs 100% locally in the browser with rich, reactive mock data. The application requires **zero running backend services** (no Laravel server, no PostgreSQL database, no Redis queue, and no external carrier APIs needed for normal UI development and design refinement).

All storefront and admin flows operate with realistic business data, instant local state updates, persistent `localStorage` cache across page refreshes, and seamless 3-tier volume pricing recalculations.

---

## 2. Architecture & Data Flow

The codebase implements a decoupled data provider architecture:

```
                  ┌──────────────────────────────┐
                  │    React UI Components &     │
                  │        Next.js Pages         │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │       Frontend Services      │
                  │ (productService, authService,│
                  │  cartService, orderService)  │
                  └──────────────┬───────────────┘
                                 │
                   isFrontendOnly() Switch
                   ┌─────────────┴─────────────┐
                   ▼                           ▼
      ┌─────────────────────────┐  ┌─────────────────────────┐
      │  Frontend Mock Store    │  │    Laravel REST API     │
      │   (LocalStorage +       │  │ (http://localhost:8000/ │
      │    In-Memory Cache)     │  │         api/v1)         │
      │                         │  │                         │
      │ * ACTIVE IN THIS PHASE  │  │ * FROZEN FOR LATER      │
      └─────────────────────────┘  └─────────────────────────┘
```

### Key Architectural Principles:
1. **Zero UI Rewrite on Backend Reconnection:** Frontend components call service functions with standard interfaces (`productService.getProducts()`, `cartService.addToCart()`, `orderService.createOrder()`).
2. **Deterministic Data:** When `NEXT_PUBLIC_FRONTEND_ONLY=true`, services bypass network requests and query the unified `mockStore`.
3. **Reactive Synchronization:** When admin creates or edits products, categories, or brands, `mockStore` updates `localStorage` and emits window events (`ayaan:data-updated`), instantly updating listening storefront and admin views without needing page refreshes.

---

## 3. Configuration & Switching Modes

### Enable Frontend-Only Mode (Default):
In `.env.local`:
```env
NEXT_PUBLIC_FRONTEND_ONLY=true
```

### Reconnecting Laravel Backend (Future Phase):
In `.env.local`:
```env
NEXT_PUBLIC_FRONTEND_ONLY=false
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Runtime Toggle:
The application includes `src/lib/frontend-mode.ts` exposing:
- `isFrontendOnly(): boolean`
- `setFrontendOnly(enabled: boolean): void`

---

## 4. Mock Data Structure & Locations

All mock data is organized cleanly under [`src/lib/mock-data/`](file:///Users/luhasan/Documents/ayaan/src/lib/mock-data/):

| File | Description & Contents |
| :--- | :--- |
| [`mock-products.ts`](file:///Users/luhasan/Documents/ayaan/src/lib/mock-data/mock-products.ts) | 100+ rich apparel products with 3-tier pricing, Pexels CDN image galleries, YouTube videos, MOQ, specifications, and shipping package profiles. |
| [`mock-categories.ts`](file:///Users/luhasan/Documents/ayaan/src/lib/mock-data/mock-categories.ts) | 5 Primary Audience categories (`MEN`, `WOMEN`, `BOYS`, `GIRLS`, `UNISEX`) with the exact preserved Girls image, plus 10 expanded product categories (`Sweaters`, `T-Shirts`, `Hoodies`, `Trousers`, `Pants`, `Shorts`, `Jackets`, `Polo Shirts`, `Activewear`, `Knitwear`). |
| [`mock-brands.ts`](file:///Users/luhasan/Documents/ayaan/src/lib/mock-data/mock-brands.ts) | 8 real apparel brands (`Ayaan`, `Nike`, `Adidas`, `Levi's`, `Puma`, `Under Armour`, `Zara`, `H&M`) with logos and slugs. |
| [`mock-users.ts`](file:///Users/luhasan/Documents/ayaan/src/lib/mock-data/mock-users.ts) | Pre-configured simulation users: Retail Customer, B2B Wholesale Buyer, and Admin Manager. |
| [`mock-orders.ts`](file:///Users/luhasan/Documents/ayaan/src/lib/mock-data/mock-orders.ts) | Realistic export orders with package breakdowns, AWB tracking numbers, status history timelines, and fulfillment states. |
| [`mock-rfqs.ts`](file:///Users/luhasan/Documents/ayaan/src/lib/mock-data/mock-rfqs.ts) | B2B RFQ inquiries with message threads, customization notes, and quotation linkage. |
| [`mock-shipping.ts`](file:///Users/luhasan/Documents/ayaan/src/lib/mock-data/mock-shipping.ts) | Calculation engine for Priority Air (`Aramex Express Air` @ $6.50/kg) and Ocean Freight (`Akij Ocean Freight LCL` @ $185/CBM). |
| [`mock-inventory.ts`](file:///Users/luhasan/Documents/ayaan/src/lib/mock-data/mock-inventory.ts) | Dhaka Central Hub (`WH-DHK-01`) & Chittagong Port Facility (`WH-CTG-02`) with stock levels and audit logs. |
| [`mock-promotions.ts`](file:///Users/luhasan/Documents/ayaan/src/lib/mock-data/mock-promotions.ts) | Active promotional banners and discount coupons (`WELCOME10`, `BULK500`, `EXPORTSHIP`). |
| [`mock-documents.ts`](file:///Users/luhasan/Documents/ayaan/src/lib/mock-data/mock-documents.ts) | Commercial document generator for Order Sheet, Proforma Invoice (PI), Commercial Invoice (with HS codes & USD words), and Packing List. |
| [`mock-store.ts`](file:///Users/luhasan/Documents/ayaan/src/lib/mock-data/mock-store.ts) | Central reactive repository managing storage reads, writes, and reset operations. |

---

## 5. LocalStorage Keys & Persistence

All client-side state is stored deterministically under dedicated namespace keys:

| LocalStorage Key | Purpose |
| :--- | :--- |
| `ayaan_mock_products_v2` | Product catalog with user created/edited/deleted products |
| `ayaan_mock_categories_v2` | Primary audience & product categories |
| `ayaan_mock_brands_v2` | Brands dataset |
| `ayaan_mock_users_v2` | Simulated user directory |
| `ayaan_mock_active_user_v2` | Current active user profile |
| `ayaan_auth_token` | Active simulated session token |
| `ayaan_mock_orders_v2` | Orders created in checkout or admin |
| `ayaan_mock_rfqs_v2` | RFQ submissions and status history |
| `ayaan_mock_inventory_v2` | Warehouse stock allocations & adjustment history |
| `ayaan_mock_promotions_v2` | Promotional banners |
| `ayaan_mock_coupons_v2` | Discount coupon codes |
| `ayaan_cart` | Active customer cart items and package breakdown |
| `ayaan_wishlist` | Active user wishlist items |
| `ayaan_user_preferences` | Country, language, and USD currency configuration |

---

## 6. Simulated Authentication & Quick Role Switching

The platform supports 4 distinct user simulation states:

1. **Logged Out (Guest):**
   - Public storefront access, guest cart in `localStorage`, wishlist hidden or prompts login on trigger.
2. **Retail Customer:**
   - **Credentials:** `testuser@example.com` / `testpass`
   - **Name:** Sarah Jenkins (`Jenkins Apparel Boutique`)
   - Order history, addresses, standard pricing.
3. **B2B Wholesale Buyer:**
   - **Credentials:** `buyer@ayaanclothing.com` / `password`
   - **Name:** Marcus Vance (`Vance & Co Retail Ltd`)
   - Approved B2B status, Net 30 payment terms, $50,000 credit limit, RFQ tracking.
4. **Admin Manager:**
   - **Credentials:** `admin@ayaanclothing.com` / `admin123`
   - Full access to `/admin` dashboard, product form, inventory adjustment, order fulfillment, promotions, and commercial documents bypass.

### Development Toolbar & 1-Click Role Switcher:
A floating toolbar (`DevToolbar`) is mounted in the bottom-left corner during development. It allows:
- 1-click switching between Guest, Customer, B2B Buyer, and Admin roles.
- Instant feedback on the active simulation role.
- One-click **"Reset Demo Data"** action.

---

## 7. Reset Development Data Mechanism

To restore all mock data (products, categories, brands, orders, cart, wishlist, and users) back to their clean initial state:
1. Click the **"Reset Demo Data"** button in the floating Dev Toolbar (bottom-left), or
2. Call `mockStore.resetAllMockData()` from the developer console.

This resets all `ayaan_mock_*` localStorage keys and reloads the interface cleanly without affecting anything else.

---

## 8. Pexels Image Integration Audit

- **Discovery:** The catalog contains 100+ curated high-resolution apparel images hosted on Pexels CDN (`https://images.pexels.com/photos/...`).
- **Domain Whitelist:** Configured in `next.config.ts` to allow high-performance loading.
- **Security:** Images are loaded directly from public CDN links with full responsive fallback to `/placeholder.jpg` if offline. No private API keys are exposed to the client.
- **Preserved Approved Imagery:** The established Girls primary category image (`https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&q=80&w=800`) is strictly preserved across all category navigation and tiles.

---

## 9. Business Identity & Compliance

- **Company:** AYAAN CLOTHING
- **Subtitle:** Ready-made Garments Manufacturer & Exporter
- **Address:** House #33 (2nd floor), Road #12, Sector #11, Uttara, Dhaka-1230, Bangladesh
- **Established:** 2010
- **Official WhatsApp:** `+8801826304930` (`https://wa.me/8801826304930`)
- **Currency:** USD Only (`$`)

---

## 10. Summary of Frontend Interactive Behaviors

- **Homepage:** Hero banner, Shop By Category, Audience tiles, All Categories expansion, Featured Products, Best Deals, New Arrivals, Shop By Brand, Footer, floating WhatsApp CTA.
- **Product Detail:** 3-tier pricing (Standard, Bulk, Full Stock), clickable tier rows updating quantity, quantity stepper honoring MOQ, package breakdown matrix (Cartons, Polybags, Singles), display-only colors and sizes, YouTube modal, Add to Cart, Request Quote.
- **Cart & Drawer:** Dynamic tier recalculation on quantity change, subtotal in USD, item removal, clear cart, guest cart persistence.
- **Checkout:** Customer details, shipping address, method selection (Aramex Air vs Akij Sea Freight) with realistic CBM and weight calculation, order confirmation.
- **RFQ:** Quote request submission with items, notes, target delivery date, and instant simulated `RFQ-YYYY-XXXXXX` generation.
- **Admin Management:**
  - `/admin`: Dynamic live KPI metrics (Revenue, Orders, Products, RFQs, low stock items).
  - `/admin/products`: Product table, search, filters, create product with **inline + Add New Category and + Add New Brand modals without page reload**.
  - `/admin/categories`: Category CRUD with image URLs and active toggles.
  - `/admin/brands`: Brand CRUD with logo URLs and website links.
  - `/admin/inventory`: Warehouse stock levels and adjustment audit log.
  - `/admin/customers`: Customer list, details, B2B credit approval and payment terms setting.
  - `/admin/orders`: Order lifecycle management, fulfillment updates, Aramex shipment creation trigger, commercial document preview and download.
