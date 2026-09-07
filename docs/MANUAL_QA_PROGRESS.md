# Manual QA Progress & Checkpoint Log

**Project:** Ayaan Clothing B2B Export Platform  
**Base URL:** `http://localhost:3000`  
**API URL:** `http://localhost:8000/api/v1`  
**Last Updated:** 2026-09-01  

---

## Current Status & Checkpoint

- **LAST COMPLETED:** Environment Preparation & Automated Baseline Checks
- **CURRENT TEST:** A01 Homepage
- **NEXT TEST:** A02 Header
- **KNOWN BUGS:** None (BUG-001 Resolved in previous session)
- **CURRENT USER ROLE:** Logged Out (Public Guest)
- **CURRENT ORDER:** N/A
- **CURRENT PRODUCT:** N/A
- **CURRENT URL:** `http://localhost:3000`

---

## Test Metrics Summary

| Category | Count |
| :--- | :--- |
| **Total Tests Planned** | 127 |
| **Total Tested** | 0 |
| **PASS (✅)** | 0 |
| **ISSUE (⚠️)** | 0 |
| **FAIL (❌)** | 0 |
| **DEFERRED (⏸)** | 0 |
| **NOT TESTED** | 127 |

| Bug Severity | Count |
| :--- | :--- |
| **Critical** | 0 |
| **High** | 0 |
| **Medium** | 0 |
| **Low** | 0 |

---

## Test Credentials & Reference Data

- **Admin Account:** `admin@ayaanclothing.com` / `admin123`
- **Retail Customer Account:** `testuser@example.com` / `testpass`
- **B2B Buyer Account:** `buyer@ayaanclothing.com` / `password`
- **Official WhatsApp:** `+8801826304930` (`https://wa.me/8801826304930`)
- **Official Exporter Identity:**
  - Ayaan Clothing
  - Ready-made Garments Manufacturer & Exporter
  - House #33 (2nd floor), Road #12, Sector #11, Uttara, Dhaka-1230, Bangladesh
  - Established 2010

---

## Master Checklist by Phase

### PHASE A — ENVIRONMENT & PUBLIC SITE
- [ ] **A01 — Homepage:** `http://localhost:3000`
- [ ] **A02 — Header:** Logo, search bar, navigation links, cart icon, auth trigger
- [ ] **A03 — Footer:** Company info, exporter address, quick links, WhatsApp contact
- [ ] **A04 — Main Navigation:** Category menus and routing
- [ ] **A05 — Search:** Instant search input, search overlay, search results page
- [ ] **A06 — Product Listing:** `/products` grid, USD ($) pricing, product cards
- [ ] **A07 — Infinite Scroll:** Page 1 -> scroll -> page 2 append verification
- [ ] **A08 — Filtering:** Category, brand, price filters
- [ ] **A09 — Sorting:** Newest, price low-to-high, price high-to-low
- [ ] **A10 — Shop By Brand:** Brand grid & brand-filtered catalog
- [ ] **A11 — New Arrivals:** New arrivals collection navigation & section
- [ ] **A12 — Product Detail:** Product detail page load & layout

### PHASE B — PRODUCT EXPERIENCE
- [ ] **B01 — Product Images:** Image loading and rendering
- [ ] **B02 — Cover Image:** Main hero/cover showcase
- [ ] **B03 — Additional Image Gallery:** Thumbnails & gallery switcher
- [ ] **B04 — Brand Logo:** Brand logo display on detail page
- [ ] **B05 — Unit Price:** Base unit price displayed in USD ($)
- [ ] **B06 — MOQ:** Minimum Order Quantity badge & restriction
- [ ] **B07 — Buy More Save More:** Volume pricing tier visual container
- [ ] **B08 — Standard Pricing:** Standard tier evaluation & threshold
- [ ] **B09 — Bulk Pricing:** Bulk tier evaluation & discounted rate
- [ ] **B10 — Full Stock Pricing:** Full stock buyout pricing option & live stock
- [ ] **B11 — Pricing Row Click:** Interactive tier selector click behavior
- [ ] **B12 — Quantity Stepper:** Increment/decrement by MOQ steps
- [ ] **B13 — Package Breakdown:** Breakdown matrix (Cartons, Polybags, Blister packs, Singles)
- [ ] **B14 — Display-Only Colors:** Available colors visual display
- [ ] **B15 — Display-Only Sizes:** Available sizes visual display
- [ ] **B16 — YouTube Video:** Embedded video showcase / preview
- [ ] **B17 — Add to Cart:** Action adds configured quantity & options to cart

### PHASE C — CART
- [ ] **C01 — Cart Drawer / Page:** Drawer open & `/cart` page view
- [ ] **C02 — Quantity:** Stepper update in cart
- [ ] **C03 — Pricing:** Dynamic tier recalculation on quantity change
- [ ] **C04 — Package Breakdown:** Package allocation in cart
- [ ] **C05 — Subtotal:** Real-time subtotal in USD ($)
- [ ] **C06 — Remove Item:** Item removal and state update
- [ ] **C07 — Clear Cart:** Empty cart action
- [ ] **C08 — Guest Cart:** LocalStorage guest cart persistence
- [ ] **C09 — Login Cart Merge:** Guest cart auto-merge on customer login

### PHASE D — AUTHENTICATION
- [ ] **D01 — Registration:** New customer registration flow
- [ ] **D02 — Login:** Customer login & token creation
- [ ] **D03 — Session Persistence:** Page refresh & auth state retention
- [ ] **D04 — Logout:** Session termination & state clear
- [ ] **D05 — Profile:** `/profile` account details
- [ ] **D06 — Profile Update:** Profile information and address update
- [ ] **D07 — Password Reset:** Password reset request flow
- [ ] **D08 — Wishlist Visibility:** Wishlist badge & item state
- [ ] **D09 — Wishlist Add/Remove:** Item toggle on wishlist

### PHASE E — CHECKOUT
- [ ] **E01 — Checkout Opens:** Access `/checkout`
- [ ] **E02 — Customer Information:** Contact fields & validation
- [ ] **E03 — Auto-filled Profile:** Pre-filled authenticated user details
- [ ] **E04 — Address:** Shipping address form & country selection
- [ ] **E05 — Quantity:** Verified order quantity
- [ ] **E06 — Product Price:** Locked unit price in USD
- [ ] **E07 — Shipping Package:** Packaging specification
- [ ] **E08 — Shipment Dimensions:** Carton dimensions calculation
- [ ] **E09 — Weight:** Gross & net weight calculation
- [ ] **E10 — CBM:** Total cubic meters calculation
- [ ] **E11 — Air Quote:** Aramex Express Air rate quote
- [ ] **E12 — Sea Quote:** Akij Ocean Freight LCL rate quote
- [ ] **E13 — Shipping Selection:** Method toggle & selection
- [ ] **E14 — Shipping Cost:** Accurate freight cost addition
- [ ] **E15 — Grand Total:** Accurate grand total in USD ($)
- [ ] **E16 — Confirmation:** Order review confirmation state
- [ ] **E17 — Duplicate-Click Protection:** Button disable / debounce during submit

### PHASE F — ORDER
- [ ] **F01 — Order Created:** Successful order submission
- [ ] **F02 — Order Number:** System-generated unique order number (e.g. `AYN-YYYYMMDD-XXXXXX`)
- [ ] **F03 — Order Total:** Immutable total record matching checkout
- [ ] **F04 — Product Data:** Frozen product snapshot
- [ ] **F05 — Package Snapshot:** Frozen package structure snapshot
- [ ] **F06 — Price Snapshot:** Frozen unit price & tier snapshot
- [ ] **F07 — Shipping Snapshot:** Frozen carrier, method, and freight cost
- [ ] **F08 — Order History:** `/profile/orders` display
- [ ] **F09 — Order Detail:** `/profile/orders/[id]` comprehensive view
- [ ] **F10 — Cancellation:** Order cancellation flow if eligible
- [ ] **F11 — Inventory Restoration:** Stock release upon cancellation

### PHASE G — DOCUMENTS
- [ ] **G01 — Order Sheet:** `ORDER_SHEET` generation with exporter identity
- [ ] **G02 — Proforma Invoice (PI):** `PROFORMA_INVOICE` with PI number & 30-day validity
- [ ] **G03 — Payment Gating:** Commercial Invoice & Packing List gated until paid
- [ ] **G04 — Commercial Invoice:** `COMMERCIAL_INVOICE` unlocked with HS codes & USD in words
- [ ] **G05 — Packing List:** `PACKING_LIST` unlocked with carton weights & CBM
- [ ] **G06 — Document Downloads:** PDF / print / download triggers
- [ ] **G07 — Document Email Attachments:** Safe email generation/dispatch
- [ ] **G08 — Historical Snapshot Consistency:** Document accuracy against frozen order data

### PHASE H — WHATSAPP
- [ ] **H01 — WhatsApp Button:** Floating / header contact CTA
- [ ] **H02 — Official Number:** Destination `+8801826304930`
- [ ] **H03 — Prefilled Order Message:** Prefilled message with inquiry/order context
- [ ] **H04 — Order Number:** WhatsApp prefill includes order number
- [ ] **H05 — Order/Tracking Link:** WhatsApp link includes direct portal tracking URL
- [ ] **H06 — Mobile Behavior:** `wa.me/8801826304930` deep link on mobile

### PHASE I — B2B
- [ ] **I01 — B2B Login:** B2B buyer account authentication
- [ ] **I02 — Wholesale Pricing:** Dynamic wholesale tier presentation
- [ ] **I03 — MOQ:** Wholesale MOQ verification
- [ ] **I04 — Bulk Pricing:** Bulk volume discounts
- [ ] **I05 — Full Stock:** Full stock buyout mechanism
- [ ] **I06 — RFQ:** `/rfq` quote request submission & `RFQ-YYYY-XXXXXX` generation
- [ ] **I07 — Net 30 Terms:** Net 30/60 commercial credit option for approved B2B
- [ ] **I08 — B2B Profile Information:** Company profile, VAT/Tax ID, credit limit view

### PHASE J — ADMIN
- [ ] **J01 — Admin Login:** `/login` with admin credentials
- [ ] **J02 — Dashboard:** `/admin` live metrics (Revenue, Orders, Products, RFQs)
- [ ] **J03 — Products:** `/admin/products` product list & status
- [ ] **J04 — Product Creation:** `/admin/products/new` creation form
- [ ] **J05 — Product Editing:** `/admin/products/[id]/edit` update form
- [ ] **J06 — Pricing Configuration:** 3-tier price editor
- [ ] **J07 — Package Matrix:** Carton/pack ratio configuration
- [ ] **J08 — Shipping Profiles:** Weight, dimensions, and CBM config
- [ ] **J09 — Product Images:** Image upload & gallery manager
- [ ] **J10 — YouTube URL:** Video link manager
- [ ] **J11 — Inline Brand Creation:** Create brand directly in product flow
- [ ] **J12 — Categories:** `/admin/categories` listing & management
- [ ] **J13 — Category Hierarchy:** Parent-child category nesting
- [ ] **J14 — Brands:** `/admin/brands` brand management
- [ ] **J15 — Inventory:** `/admin/inventory` stock level view & adjustment audit
- [ ] **J16 — Warehouses:** Warehouse locations & inventory allocation
- [ ] **J17 — Customers:** `/admin/customers` customer list
- [ ] **J18 — B2B Management:** B2B account approval & credit terms setting
- [ ] **J19 — Orders:** `/admin/orders` order lifecycle management
- [ ] **J20 — Payment Confirmation:** Mark orders paid & approve payment proof
- [ ] **J21 — Shipping:** Shipment dispatch management
- [ ] **J22 — Aramex Shipment:** Aramex shipment creation trigger
- [ ] **J23 — AWB:** Air Waybill number recording & association
- [ ] **J24 — Tracking:** Admin tracking update
- [ ] **J25 — RFQ:** `/admin/rfq` RFQ quote response & management
- [ ] **J26 — Promotions:** `/admin/promotions` promo banner management
- [ ] **J27 — Coupons:** Coupon creation and discount codes
- [ ] **J28 — Documents:** Admin document preview & bypass

### PHASE K — SECURITY
- [ ] **K01 — Logged-out Admin Access:** Unauthenticated `/admin` redirects to login
- [ ] **K02 — Customer → Admin:** Customer role blocked from `/admin` and admin APIs
- [ ] **K03 — B2B → Admin:** B2B role blocked from `/admin` and admin APIs
- [ ] **K04 — Customer A → Customer B Order:** 403 Forbidden on foreign orders
- [ ] **K05 — Customer A → Customer B Documents:** 403 Forbidden on foreign documents
- [ ] **K06 — Unauthorized API Access:** 401 on protected endpoints without Sanctum token
- [ ] **K07 — Document Authorization:** Explicit ownership & admin-only bypass verification
- [ ] **K08 — Admin-Only Mutations:** Non-admins blocked from inventory/order mutations

### PHASE L — MOBILE / RESPONSIVE
- [ ] **L01 — Mobile Homepage:** Responsive hero, product grids, brand slider
- [ ] **L02 — Mobile Header:** Hamburger menu, mobile search toggle, cart badge
- [ ] **L03 — Mobile Search:** Full-screen mobile search overlay
- [ ] **L04 — Mobile Product Grid:** 2-column touch-friendly grid
- [ ] **L05 — Mobile Product Detail:** Touch gallery, sticky ATC, responsive typography
- [ ] **L06 — Mobile Package Matrix:** Responsive table/cards for package breakdown
- [ ] **L07 — Mobile Cart:** Mobile cart drawer & checkout action
- [ ] **L08 — Mobile Checkout:** Responsive multi-step / accordion checkout
- [ ] **L09 — Mobile Profile:** Mobile order history & account tabs
- [ ] **L10 — Mobile Admin Navigation:** Admin responsive layout on viewport resize

### PHASE M — SEO / PUBLIC TECHNICAL
- [ ] **M01 — Metadata:** Title, description, viewport tags
- [ ] **M02 — Product Metadata:** Dynamic product titles & descriptions
- [ ] **M03 — Canonical:** Canonical URL tags
- [ ] **M04 — OpenGraph:** og:title, og:image, og:description
- [ ] **M05 — Sitemap:** `/sitemap.xml` generated properly
- [ ] **M06 — Robots:** `/robots.txt` configuration
- [ ] **M07 — Structured Data:** Schema.org JSON-LD for Products & Organization
- [ ] **M08 — Manifest:** `/manifest.webmanifest` PWA metadata

---

## Log of Execution Sessions

### Session 2 — 2026-09-01 (Starting Now)
- **Environment:** Next.js (port 3000), Laravel API (port 8000), Redis (port 6379), PostgreSQL (port 5432) active.
- **Automated Check Results:**
  - `php artisan test`: 129 / 129 Passed (728 assertions, 0 failures)
  - `npx tsc --noEmit`: Clean (0 errors)
  - `npm run lint`: Clean (0 errors, 342 warnings)
  - `npm run build`: Production build succeeded (26 static pages generated)
- **Current Position:** Ready at **Phase A — A01 Homepage**.
