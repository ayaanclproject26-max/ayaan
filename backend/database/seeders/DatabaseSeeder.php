<?php

namespace Database\Seeders;

use App\Models\Address;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Inventory;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusEvent;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\Promotion;
use App\Models\Quote;
use App\Models\QuoteItem;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. USERS
        $admin = User::firstOrCreate(
            ['email' => 'admin@ayaanclothing.com'],
            [
                'name' => 'Ayaan Admin',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'phone' => '+1 (555) 019-2834',
                'company_name' => 'Ayaan Sourcing Ltd.',
                'email_verified_at' => now(),
            ]
        );

        $customer = User::firstOrCreate(
            ['email' => 'customer@ayaanclothing.com'],
            [
                'name' => 'Elena Rostova',
                'password' => Hash::make('password123'),
                'role' => 'customer',
                'phone' => '+1 (555) 392-8172',
                'company_name' => 'Rostova Retail Boutique',
                'email_verified_at' => now(),
            ]
        );

        $buyer = User::firstOrCreate(
            ['email' => 'buyer@ayaanclothing.com'],
            [
                'name' => 'Tariq Al-Mansoor',
                'password' => Hash::make('password123'),
                'role' => 'b2b_buyer',
                'phone' => '+971 50 123 4567',
                'company_name' => 'Gulf Apparel & Luxury LLC',
                'email_verified_at' => now(),
            ]
        );

        // 2. ADDRESSES
        Address::firstOrCreate(
            ['user_id' => $customer->id, 'address_line_1' => '742 Evergreen Terrace'],
            [
                'type' => 'shipping',
                'name' => 'Elena Rostova',
                'phone' => '+1 (555) 392-8172',
                'address_line_2' => 'Suite 400',
                'city' => 'Springfield',
                'state' => 'OR',
                'postal_code' => '97477',
                'country_code' => 'US',
                'is_default' => true,
            ]
        );

        // 3. CATEGORIES
        $categoriesData = [
            ['name' => 'Sweaters', 'slug' => 'sweaters', 'description' => 'Knits, pullovers, cardigans', 'accent_color' => '#8B5CF6'],
            ['name' => 'T-Shirts', 'slug' => 't-shirts', 'description' => 'Crew neck, oversized, graphic tees', 'accent_color' => '#3B82F6'],
            ['name' => 'Hoodies', 'slug' => 'hoodies', 'description' => 'Fleece, zip-up, pullover hoodies', 'accent_color' => '#10B981'],
            ['name' => 'Trousers', 'slug' => 'trousers', 'description' => 'Chinos, formal, joggers', 'accent_color' => '#F59E0B'],
            ['name' => 'Pants', 'slug' => 'pants', 'description' => 'Jeans, cargo, denim', 'accent_color' => '#6366F1'],
            ['name' => 'Shorts', 'slug' => 'shorts', 'description' => 'Casual, board, athletic shorts', 'accent_color' => '#EC4899'],
            ['name' => 'Shirts', 'slug' => 'shirts', 'description' => 'Button-down, oxford, polo shirts', 'accent_color' => '#14B8A6'],
            ['name' => 'Beachwear', 'slug' => 'beachwear', 'description' => 'Swimsuits, trunks, coverups', 'accent_color' => '#06B6D4'],
            ['name' => 'Socks', 'slug' => 'socks', 'description' => 'Ankle, crew, athletic socks', 'accent_color' => '#F97316'],
            ['name' => 'Blouse', 'slug' => 'blouse', 'description' => 'Silk, chiffon, formal tops', 'accent_color' => '#A855F7'],
            ['name' => 'Tank Top', 'slug' => 'tank-top', 'description' => 'Ribbed, athletic, casual tanks', 'accent_color' => '#EAB308'],
            ['name' => 'Tops', 'slug' => 'tops', 'description' => 'General tops and tees', 'accent_color' => '#64748B'],
            ['name' => 'Sports', 'slug' => 'sports', 'description' => 'Activewear, performance, gym wear', 'accent_color' => '#EF4444'],
            ['name' => 'Towels', 'slug' => 'towels', 'description' => 'Bath, face, beach towels', 'accent_color' => '#0EA5E9'],
        ];

        $categories = [];
        foreach ($categoriesData as $idx => $cat) {
            $categories[$cat['slug']] = Category::firstOrCreate(
                ['slug' => $cat['slug']],
                [
                    'name' => $cat['name'],
                    'description' => $cat['description'],
                    'accent_color' => $cat['accent_color'],
                    'sort_order' => $idx + 1,
                    'is_active' => true,
                ]
            );
        }

        // 4. BRANDS
        $brandsData = [
            ['name' => 'Ayaan', 'slug' => 'ayaan', 'website' => 'https://ayaanclothing.com', 'logo_url' => '/logo.png'],
            ['name' => "Levi's", 'slug' => 'levis', 'website' => 'https://levi.com', 'logo_url' => '/brands/levis.png'],
            ['name' => 'Hugo Boss', 'slug' => 'hugo-boss', 'website' => 'https://hugoboss.com', 'logo_url' => '/brands/hugo-boss.png'],
            ['name' => 'Walmart', 'slug' => 'walmart', 'website' => 'https://walmart.com', 'logo_url' => '/brands/walmart.png'],
            ['name' => 'Uniqlo', 'slug' => 'uniqlo', 'website' => 'https://uniqlo.com', 'logo_url' => '/brands/uniqlo.png'],
            ['name' => 'Ralph Lauren', 'slug' => 'ralph-lauren', 'website' => 'https://ralphlauren.com', 'logo_url' => '/brands/ralph-lauren.png'],
            ['name' => 'Puma', 'slug' => 'puma', 'website' => 'https://puma.com', 'logo_url' => '/brands/puma.png'],
            ['name' => 'Calvin Klein', 'slug' => 'calvin-klein', 'website' => 'https://calvinklein.us', 'logo_url' => '/brands/calvin-klein.png'],
            ['name' => 'Decathlon', 'slug' => 'decathlon', 'website' => 'https://decathlon.com', 'logo_url' => '/brands/decathlon.png'],
            ['name' => 'Zara', 'slug' => 'zara', 'website' => 'https://zara.com', 'logo_url' => '/brands/zara.png'],
            ['name' => 'U.S. Polo Assn.', 'slug' => 'us-polo-assn', 'website' => 'https://uspoloassn.com', 'logo_url' => '/brands/us-polo-assn.png'],
            ['name' => 'Tommy Hilfiger', 'slug' => 'tommy-hilfiger', 'website' => 'https://tommy.com', 'logo_url' => '/brands/tommy-hilfiger.png'],
            ['name' => 'Armani Exchange', 'slug' => 'armani-exchange', 'website' => 'https://armaniexchange.com', 'logo_url' => '/brands/armani-exchange.png'],
            ['name' => 'United Colors of Benetton', 'slug' => 'united-colors-of-benetton', 'website' => 'https://benetton.com', 'logo_url' => '/brands/united-colors-of-benetton.png'],
            ['name' => 'Banana Republic', 'slug' => 'banana-republic', 'website' => 'https://bananarepublic.gap.com', 'logo_url' => '/brands/banana-republic.png'],
            ['name' => '5.11', 'slug' => '5-11', 'website' => 'https://511tactical.com', 'logo_url' => '/brands/5-11.png'],
            ['name' => 'Jack Wolfskin', 'slug' => 'jack-wolfskin', 'website' => 'https://jack-wolfskin.com', 'logo_url' => '/brands/jack-wolfskin.png'],
            ['name' => 'Diesel', 'slug' => 'diesel', 'website' => 'https://diesel.com', 'logo_url' => '/brands/diesel.png'],
            ['name' => 'FILA', 'slug' => 'fila', 'website' => 'https://fila.com', 'logo_url' => '/brands/fila.png'],
            ['name' => 'M&S', 'slug' => 'm-and-s', 'website' => 'https://marksandspencer.com', 'logo_url' => '/brands/m-and-s.png'],
            ['name' => 'Esmara', 'slug' => 'esmara', 'website' => 'https://lidl.de', 'logo_url' => '/brands/esmara.png'],
            ['name' => 'Timberland', 'slug' => 'timberland', 'website' => 'https://timberland.com', 'logo_url' => '/brands/timberland.png'],
            ['name' => 'G-Star Raw', 'slug' => 'g-star-raw', 'website' => 'https://g-star.com', 'logo_url' => '/brands/g-star-raw.png'],
            ['name' => 'Mango', 'slug' => 'mango', 'website' => 'https://mango.com', 'logo_url' => '/brands/mango.png'],
            ['name' => 'Next', 'slug' => 'next', 'website' => 'https://next.co.uk', 'logo_url' => '/brands/next.png'],
            ['name' => 'Esprit', 'slug' => 'esprit', 'website' => 'https://esprit.com', 'logo_url' => '/brands/esprit.png'],
            ['name' => 'Patagonia', 'slug' => 'patagonia', 'website' => 'https://patagonia.com', 'logo_url' => '/brands/patagonia.png'],
            ['name' => 'Lee', 'slug' => 'lee', 'website' => 'https://lee.com', 'logo_url' => '/brands/lee.png'],
            ['name' => 'Guess', 'slug' => 'guess', 'website' => 'https://guess.com', 'logo_url' => '/brands/guess.png'],
            ['name' => 'H&M', 'slug' => 'hm', 'website' => 'https://hm.com', 'logo_url' => '/brands/hm.png'],
            ['name' => 'OVS', 'slug' => 'ovs', 'website' => 'https://ovsfashion.com', 'logo_url' => '/brands/ovs.png'],
            ['name' => 'The North Face', 'slug' => 'the-north-face', 'website' => 'https://thenorthface.com', 'logo_url' => '/brands/the-north-face.png'],
            ['name' => 'Columbia', 'slug' => 'columbia', 'website' => 'https://columbia.com', 'logo_url' => '/brands/columbia.png'],
            ['name' => 'Jack & Jones', 'slug' => 'jack-and-jones', 'website' => 'https://jackjones.com', 'logo_url' => '/brands/jack-and-jones.png'],
            ['name' => 'Primark', 'slug' => 'primark', 'website' => 'https://primark.com', 'logo_url' => '/brands/primark.png'],
            ['name' => "Arc'teryx", 'slug' => 'arcteryx', 'website' => 'https://arcteryx.com', 'logo_url' => '/brands/arcteryx.png'],
            ['name' => 'Carhartt', 'slug' => 'carhartt', 'website' => 'https://carhartt.com', 'logo_url' => '/brands/carhartt.png'],
            ['name' => 'Kappa', 'slug' => 'kappa', 'website' => 'https://kappa.com', 'logo_url' => '/brands/kappa.png'],
            ['name' => 'PVH', 'slug' => 'pvh', 'website' => 'https://pvh.com', 'logo_url' => '/brands/pvh.png'],
            ['name' => 'Salomon', 'slug' => 'salomon', 'website' => 'https://salomon.com', 'logo_url' => '/brands/salomon.png'],
            ['name' => 'Nike', 'slug' => 'nike', 'website' => 'https://nike.com', 'logo_url' => '/brands/nike.svg'],
            ['name' => 'Adidas', 'slug' => 'adidas', 'website' => 'https://adidas.com', 'logo_url' => '/brands/adidas.svg'],
            ['name' => 'Under Armour', 'slug' => 'under-armour', 'website' => 'https://underarmour.com', 'logo_url' => '/brands/under-armour.svg'],
            ['name' => 'New Balance', 'slug' => 'new-balance', 'website' => 'https://newbalance.com', 'logo_url' => '/brands/new-balance.svg'],
            ['name' => 'Gucci', 'slug' => 'gucci', 'website' => 'https://gucci.com', 'logo_url' => '/brands/generic.png'],
        ];

        $brands = [];
        foreach ($brandsData as $b) {
            $brands[$b['slug']] = Brand::firstOrCreate(
                ['slug' => $b['slug']],
                [
                    'name' => $b['name'],
                    'website' => $b['website'] ?? null,
                    'logo_url' => $b['logo_url'],
                    'is_active' => true,
                ]
            );
        }

        // 5. WAREHOUSES
        $mainWarehouse = Warehouse::firstOrCreate(
            ['code' => 'WH-MAIN-01'],
            [
                'name' => 'Primary Sourcing Hub',
                'address_line_1' => 'House #33 (2nd floor), Road #12, Sector #11, Uttara',
                'city' => 'Dhaka',
                'country_code' => 'BD',
                'is_active' => true,
            ]
        );

        $usWarehouse = Warehouse::firstOrCreate(
            ['code' => 'WH-US-01'],
            [
                'name' => 'North America Logistics Hub',
                'address_line_1' => '2100 Logistics Way',
                'city' => 'Los Angeles',
                'country_code' => 'US',
                'is_active' => true,
            ]
        );

        // 6. PRODUCTS & VARIANTS
        $productsSeed = [
            [
                'name' => 'Luxury Merino Wool Knit Sweater',
                'slug' => 'luxury-merino-wool-knit-sweater',
                'sku' => 'AYN-SWEAT-001',
                'brand_slug' => 'ayaan',
                'category_slug' => 'sweaters',
                'short_description' => '100% Australian Merino Wool with ribbed cuffs and tailored fit.',
                'description' => 'Crafted from ultra-fine 19.5-micron Merino wool, this knit sweater delivers unparalleled warmth, breathability, and natural temperature regulation. Features reinforced seams and anti-pilling treatment.',
                'material' => '100% Merino Wool',
                'color_name' => 'Midnight Charcoal',
                'color_hex' => '#2A2E33',
                'audience' => 'MEN',
                'wholesale_price' => 145.00,
                'msrp_price' => 220.00,
                'cost_price' => 65.00,
                'moq' => 5,
                'is_featured' => true,
                'is_hot' => true,
                'is_new' => true,
                'images' => [
                    'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?auto=format&fit=crop&w=800&q=80',
                ],
                'sizes' => ['S', 'M', 'L', 'XL', 'XXL'],
            ],
            [
                'name' => 'Heavyweight 240GSM Cotton Oversized Tee',
                'slug' => 'heavyweight-240gsm-cotton-oversized-tee',
                'sku' => 'AYN-TSHIRT-002',
                'brand_slug' => 'ayaan',
                'category_slug' => 't-shirts',
                'short_description' => '240GSM combed organic cotton boxy streetwear silhouette.',
                'description' => 'Premium heavyweight streetwear staple. Double-needle coverstitched collar and dropped shoulders provide a structured drape that maintains shape wash after wash.',
                'material' => '100% Combed Cotton (240 GSM)',
                'color_name' => 'Bone White',
                'color_hex' => '#F4F1EA',
                'audience' => 'UNISEX',
                'wholesale_price' => 28.00,
                'msrp_price' => 55.00,
                'cost_price' => 11.50,
                'moq' => 10,
                'is_featured' => true,
                'is_hot' => false,
                'is_new' => true,
                'images' => [
                    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
                ],
                'sizes' => ['XS', 'S', 'M', 'L', 'XL'],
            ],
            [
                'name' => 'Tech-Fleece Structured Pullover Hoodie',
                'slug' => 'tech-fleece-structured-pullover-hoodie',
                'sku' => 'NKE-HOOD-003',
                'brand_slug' => 'nike',
                'category_slug' => 'hoodies',
                'short_description' => 'Bonded double-sided spacer fleece with concealed zip pockets.',
                'description' => 'Lightweight warmth with a smooth, low-profile feel inside and out. Ergonomic sleeve panels and multi-panel hood provide natural freedom of movement.',
                'material' => '66% Cotton, 34% Polyester',
                'color_name' => 'Heather Slate',
                'color_hex' => '#475569',
                'audience' => 'MEN',
                'wholesale_price' => 65.00,
                'msrp_price' => 110.00,
                'cost_price' => 32.00,
                'moq' => 5,
                'is_featured' => true,
                'is_hot' => true,
                'is_new' => false,
                'images' => [
                    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
                ],
                'sizes' => ['S', 'M', 'L', 'XL'],
            ],
            [
                'name' => 'Tailored Wool Chino Trousers',
                'slug' => 'tailored-wool-chino-trousers',
                'sku' => 'ZRA-TROUS-004',
                'brand_slug' => 'zara',
                'category_slug' => 'trousers',
                'short_description' => 'Modern pleated slim-fit trousers in stretch-wool blend.',
                'description' => 'Versatile transitional trouser engineered for executive comfort. Features hidden hook waistband closure and double welt rear pockets.',
                'material' => '70% Wool, 28% Polyester, 2% Elastane',
                'color_name' => 'Navy Blue',
                'color_hex' => '#1E293B',
                'audience' => 'MEN',
                'wholesale_price' => 54.00,
                'msrp_price' => 95.00,
                'cost_price' => 24.00,
                'moq' => 5,
                'is_featured' => false,
                'is_hot' => true,
                'is_new' => false,
                'images' => [
                    'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
                ],
                'sizes' => ['30', '32', '34', '36', '38'],
            ],
            [
                'name' => 'Raw Selvedge 14oz Denim Pants',
                'slug' => 'raw-selvedge-14oz-denim-pants',
                'sku' => 'LEV-PANTS-005',
                'brand_slug' => 'levis',
                'category_slug' => 'pants',
                'short_description' => 'Authentic shuttle-loom red-line selvedge denim.',
                'description' => 'Unwashed 14oz Japanese shuttle-loom denim designed to develop custom high-contrast fade patterns unique to the wearer.',
                'material' => '100% Selvedge Cotton Denim',
                'color_name' => 'Indigo Raw',
                'color_hex' => '#0F172A',
                'audience' => 'MEN',
                'wholesale_price' => 78.00,
                'msrp_price' => 160.00,
                'cost_price' => 38.00,
                'moq' => 5,
                'is_featured' => true,
                'is_hot' => false,
                'is_new' => false,
                'images' => [
                    'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80',
                ],
                'sizes' => ['30', '32', '34', '36'],
            ],
            [
                'name' => 'Mulberry Silk Chiffon Blouse',
                'slug' => 'mulberry-silk-chiffon-blouse',
                'sku' => 'GCC-BLOUS-006',
                'brand_slug' => 'gucci',
                'category_slug' => 'blouse',
                'short_description' => 'Pure 16mm Mulberry silk with mother-of-pearl buttons.',
                'description' => 'Ethereal drape and featherlight touch. Hand-rolled hems and mother-of-pearl buttons bring refined craftsmanship to executive and evening attire.',
                'material' => '100% Mulberry Silk',
                'color_name' => 'Champagne Pearl',
                'color_hex' => '#FAF5EE',
                'audience' => 'WOMEN',
                'wholesale_price' => 195.00,
                'msrp_price' => 450.00,
                'cost_price' => 90.00,
                'moq' => 3,
                'is_featured' => true,
                'is_hot' => false,
                'is_new' => true,
                'images' => [
                    'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?auto=format&fit=crop&w=800&q=80',
                ],
                'sizes' => ['XS', 'S', 'M', 'L'],
            ],
        ];

        $seededProducts = [];
        foreach ($productsSeed as $pData) {
            $brand = $brands[$pData['brand_slug']] ?? null;
            $category = $categories[$pData['category_slug']] ?? null;

            $product = Product::firstOrCreate(
                ['slug' => $pData['slug']],
                [
                    'brand_id' => $brand ? $brand->id : null,
                    'name' => $pData['name'],
                    'sku' => $pData['sku'],
                    'short_description' => $pData['short_description'],
                    'description' => $pData['description'],
                    'material' => $pData['material'],
                    'color_name' => $pData['color_name'],
                    'color_hex' => $pData['color_hex'],
                    'audience' => $pData['audience'],
                    'wholesale_price' => $pData['wholesale_price'],
                    'msrp_price' => $pData['msrp_price'],
                    'cost_price' => $pData['cost_price'],
                    'moq' => $pData['moq'],
                    'status' => 'published',
                    'is_featured' => $pData['is_featured'],
                    'is_hot' => $pData['is_hot'],
                    'is_new' => $pData['is_new'],
                ]
            );

            if ($category) {
                $product->categories()->syncWithoutDetaching([$category->id]);
            }

            // Images
            foreach ($pData['images'] as $imgIdx => $imgUrl) {
                ProductImage::firstOrCreate(
                    ['product_id' => $product->id, 'image_url' => $imgUrl],
                    [
                        'alt_text' => "{$product->name} view " . ($imgIdx + 1),
                        'sort_order' => $imgIdx,
                        'is_primary' => $imgIdx === 0,
                    ]
                );
            }

            // Variants
            foreach ($pData['sizes'] as $vIdx => $size) {
                $vSku = "{$product->sku}-{$size}";
                $variant = ProductVariant::firstOrCreate(
                    ['sku' => $vSku],
                    [
                        'product_id' => $product->id,
                        'title' => "{$product->name} - Size {$size}",
                        'size' => $size,
                        'color' => $product->color_name,
                        'option_summary' => "Size: {$size}, Color: {$product->color_name}",
                        'price' => $product->wholesale_price,
                        'stock' => 150,
                        'is_default' => $vIdx === 0,
                        'is_active' => true,
                    ]
                );

                // Inventory in warehouses
                Inventory::firstOrCreate(
                    ['product_variant_id' => $variant->id, 'warehouse_id' => $mainWarehouse->id],
                    ['quantity' => 100, 'reserved_quantity' => 0]
                );

                Inventory::firstOrCreate(
                    ['product_variant_id' => $variant->id, 'warehouse_id' => $usWarehouse->id],
                    ['quantity' => 50, 'reserved_quantity' => 0]
                );
            }

            $seededProducts[] = $product;
        }

        // 7. SAMPLE ORDER & STATUS EVENTS
        $sampleOrder = Order::firstOrCreate(
            ['order_number' => 'ORD-2026-8801'],
            [
                'user_id' => $customer->id,
                'status' => 'processing',
                'payment_status' => 'paid',
                'fulfillment_status' => 'processing',
                'currency' => 'USD',
                'subtotal' => 290.00,
                'shipping_cost' => 0.00,
                'tax_amount' => 23.20,
                'total_amount' => 313.20,
                'email' => $customer->email,
                'shipping_name' => 'Elena Rostova',
                'shipping_phone' => '+1 (555) 392-8172',
                'shipping_address1' => '742 Evergreen Terrace',
                'shipping_address2' => 'Suite 400',
                'shipping_city' => 'Springfield',
                'shipping_region' => 'OR',
                'shipping_postal_code' => '97477',
                'shipping_country_code' => 'US',
                'payment_method' => 'card',
                'notes' => 'Urgent boutique delivery for showroom release.',
                'placed_at' => now()->subDays(2),
            ]
        );

        if (!empty($seededProducts)) {
            $firstProduct = $seededProducts[0];
            $variant = $firstProduct->variants()->first();

            OrderItem::firstOrCreate(
                ['order_id' => $sampleOrder->id, 'product_id' => $firstProduct->id],
                [
                    'product_variant_id' => $variant ? $variant->id : null,
                    'product_name' => $firstProduct->name,
                    'product_slug' => $firstProduct->slug,
                    'sku' => $firstProduct->sku,
                    'variant_title' => $variant ? $variant->title : 'Default',
                    'size' => $variant ? $variant->size : 'M',
                    'color' => $firstProduct->color_name,
                    'unit_price' => $firstProduct->wholesale_price,
                    'quantity' => 2,
                    'line_total' => $firstProduct->wholesale_price * 2,
                ]
            );

            OrderStatusEvent::firstOrCreate(
                ['order_id' => $sampleOrder->id, 'event_type' => 'order_placed'],
                [
                    'user_id' => $customer->id,
                    'message' => 'Order #ORD-2026-8801 confirmed into system queue.',
                    'created_at' => now()->subDays(2),
                ]
            );

            OrderStatusEvent::firstOrCreate(
                ['order_id' => $sampleOrder->id, 'event_type' => 'payment_succeeded'],
                [
                    'user_id' => $customer->id,
                    'message' => 'Payment authorized & captured successfully via Card.',
                    'created_at' => now()->subDays(2)->addMinutes(5),
                ]
            );

            OrderStatusEvent::firstOrCreate(
                ['order_id' => $sampleOrder->id, 'event_type' => 'fulfillment_processing'],
                [
                    'user_id' => $customer->id,
                    'message' => 'Warehouse team packing goods at Primary Sourcing Hub.',
                    'created_at' => now()->subDay(),
                ]
            );
        }

        // 8. SAMPLE B2B RFQ (QUOTE)
        $sampleQuote = Quote::firstOrCreate(
            ['rfq_number' => 'RFQ-2026-000101'],
            [
                'user_id' => $buyer->id,
                'buyer_name' => 'Tariq Al-Mansoor',
                'buyer_email' => 'buyer@ayaanclothing.com',
                'buyer_phone' => '+971 50 123 4567',
                'company_name' => 'Gulf Apparel & Luxury LLC',
                'business_type' => 'Wholesale Distributor',
                'website' => 'https://gulfapparel.ae',
                'tax_number' => 'AE-TRN-984710',
                'destination_country' => 'United Arab Emirates',
                'destination_city' => 'Dubai',
                'shipping_port' => 'Jebel Ali Port (AEJEA)',
                'target_delivery_date' => '2026-11-15',
                'request_title' => 'Winter 2026 Merino Wool & Heavyweight Streetwear Container Lot',
                'general_notes' => 'Requires custom woven neck labels and branded carton packaging.',
                'status' => 'SUBMITTED',
            ]
        );

        if (!empty($seededProducts)) {
            QuoteItem::firstOrCreate(
                ['quote_id' => $sampleQuote->id, 'product_id' => $seededProducts[0]->id],
                [
                    'product_name' => $seededProducts[0]->name,
                    'product_slug' => $seededProducts[0]->slug,
                    'brand' => 'Ayaan',
                    'sku' => $seededProducts[0]->sku,
                    'selected_color' => 'Midnight Charcoal',
                    'selected_size' => 'L',
                    'quantity' => 1200,
                    'moq' => 500,
                    'unit_price' => 145.00,
                    'target_price' => 110.00,
                    'buyer_notes' => 'Target FOB price based on 1,200 unit bulk volume.',
                ]
            );
        }

        // 9. PROMOTIONS & COUPONS
        Coupon::firstOrCreate(
            ['code' => 'WELCOME10'],
            [
                'discount_type' => 'percentage',
                'discount_value' => 10.00,
                'min_spend' => 100.00,
                'usage_limit' => 500,
                'is_active' => true,
            ]
        );

        Coupon::firstOrCreate(
            ['code' => 'BULK50'],
            [
                'discount_type' => 'fixed_amount',
                'discount_value' => 50.00,
                'min_spend' => 500.00,
                'usage_limit' => 100,
                'is_active' => true,
            ]
        );

        Promotion::firstOrCreate(
            ['title' => 'Spring/Summer 2026 Wholesale Sourcing Festival'],
            [
                'subtitle' => 'Exclusive factory-direct margins on top export knitwear',
                'type' => 'banner',
                'discount_percentage' => 15.00,
                'button_text' => 'Explore Sourcing Catalog',
                'button_action' => 'browse_catalog',
                'button_target' => '/search',
                'is_active' => true,
                'sort_order' => 1,
            ]
        );
    }
}
