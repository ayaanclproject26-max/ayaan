<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Catalog\ProductQueryRequest;
use App\Http\Resources\Api\V1\ProductResource;
use App\Models\Product;
use App\Models\ProductShippingPackageProfile;
use App\Services\Shipping\PackageCalculatorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends ApiController
{
    /**
     * GET /api/v1/products
     */
    public function index(ProductQueryRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $query = Product::with(['brand', 'categories', 'images', 'variants', 'pricingTiers', 'shippingPackageProfiles']);

        // Status filter (defaults to 'published' for public storefront)
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        } elseif (!$request->boolean('isAdmin')) {
            $query->where('status', 'published');
        }

        $likeOp = \Illuminate\Support\Facades\DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';

        // Search keyword (q or search)
        $searchTerm = $request->input('q') ?? $request->input('search');
        if (!empty($searchTerm)) {
            $searchTerm = trim($searchTerm);
            $query->where(function ($q) use ($searchTerm, $likeOp) {
                $q->where('name', $likeOp, "%{$searchTerm}%")
                  ->orWhere('description', $likeOp, "%{$searchTerm}%")
                  ->orWhere('short_description', $likeOp, "%{$searchTerm}%")
                  ->orWhere('sku', $likeOp, "%{$searchTerm}%")
                  ->orWhereHas('brand', function ($bq) use ($searchTerm, $likeOp) {
                      $bq->where('name', $likeOp, "%{$searchTerm}%");
                  })
                  ->orWhereHas('categories', function ($cq) use ($searchTerm, $likeOp) {
                      $cq->where('name', $likeOp, "%{$searchTerm}%");
                  });
            });
        }

        // Category filter (slug, id, or comma-separated list)
        if ($request->filled('category') && $request->input('category') !== 'all') {
            $categories = array_filter(array_map('trim', explode(',', $request->input('category'))));
            if (!empty($categories)) {
                $query->whereHas('categories', function ($q) use ($categories) {
                    $q->whereIn('slug', $categories)
                      ->orWhereIn('id', array_filter($categories, 'is_numeric'));
                });
            }
        }

        // Brand filter (slug, id, or comma-separated list)
        if ($request->filled('brand') && $request->input('brand') !== 'all') {
            $brands = array_filter(array_map('trim', explode(',', $request->input('brand'))));
            if (!empty($brands)) {
                $query->whereHas('brand', function ($q) use ($brands) {
                    $q->whereIn('slug', $brands)
                      ->orWhereIn('name', $brands)
                      ->orWhereIn('id', array_filter($brands, 'is_numeric'));
                });
            }
        }

        // Audience filter (MEN, WOMEN, BOYS, GIRLS, UNISEX)
        if ($request->filled('audience') && $request->input('audience') !== 'all') {
            $audiences = array_filter(array_map(function ($item) {
                return strtoupper(trim($item));
            }, explode(',', $request->input('audience'))));

            if (!empty($audiences)) {
                $query->whereIn('audience', $audiences);
            }
        }

        // Price range filtering
        if ($request->filled('price_min')) {
            $query->where('wholesale_price', '>=', (float) $request->input('price_min'));
        }
        if ($request->filled('price_max')) {
            $query->where('wholesale_price', '<=', (float) $request->input('price_max'));
        }

        // Color filter
        if ($request->filled('color') && $request->input('color') !== 'ALL') {
            $color = $request->input('color');
            $query->where(function ($q) use ($color, $likeOp) {
                $q->where('color_name', $likeOp, "%{$color}%")
                  ->orWhereHas('variants', function ($vq) use ($color, $likeOp) {
                      $vq->where('color', $likeOp, "%{$color}%");
                  });
            });
        }

        // Size filter
        if ($request->filled('size')) {
            $size = $request->input('size');
            $query->whereHas('variants', function ($vq) use ($size) {
                $vq->where('size', $size);
            });
        }

        // Flags
        if ($request->boolean('is_featured')) {
            $query->where('is_featured', true);
        }
        if ($request->boolean('is_hot')) {
            $query->where('is_hot', true);
        }
        if ($request->boolean('is_new')) {
            $query->where('is_new', true);
        }
        if ($request->boolean('is_best_deal')) {
            $query->where('is_best_deal', true);
        }
        if ($request->boolean('is_limited_deal')) {
            $query->where('is_limited_deal', true);
        }

        // In Stock filter
        if ($request->boolean('in_stock')) {
            $query->whereHas('variants', function ($vq) {
                $vq->where('stock', '>', 0);
            });
        }

        // Sorting whitelist
        $sortBy = $request->input('sort') ?? $request->input('sort_by') ?? 'newest';
        switch ($sortBy) {
            case 'price_asc':
                $query->orderBy('wholesale_price', 'asc');
                break;
            case 'price_desc':
                $query->orderBy('wholesale_price', 'desc');
                break;
            case 'popular':
            case 'hot':
                $query->orderBy('is_hot', 'desc')->orderBy('created_at', 'desc');
                break;
            case 'featured':
                $query->orderBy('is_featured', 'desc')->orderBy('created_at', 'desc');
                break;
            case 'name_asc':
                $query->orderBy('name', 'asc');
                break;
            case 'name_desc':
                $query->orderBy('name', 'desc');
                break;
            case 'newest':
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        $perPage = (int) $request->input('per_page', 20);
        $products = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => ProductResource::collection($products)->resolve(),
            'links' => [
                'first' => $products->url(1),
                'last' => $products->url($products->lastPage()),
                'prev' => $products->previousPageUrl(),
                'next' => $products->nextPageUrl(),
            ],
            'meta' => [
                'current_page' => $products->currentPage(),
                'from' => $products->firstItem(),
                'last_page' => $products->lastPage(),
                'path' => $products->path(),
                'per_page' => $products->perPage(),
                'to' => $products->lastItem(),
                'total' => $products->total(),
            ],
        ]);
    }

    /**
     * GET /api/v1/products/{slugOrId} or /api/v1/products/slug/{slug}
     */
    public function show(string $slugOrId): JsonResponse
    {
        $product = Product::with(['brand', 'categories', 'images', 'variants.inventories.warehouse', 'pricingTiers', 'packageAllocations.variant', 'shippingPackageProfiles'])
            ->where(function ($q) use ($slugOrId) {
                $q->where('slug', $slugOrId);
                if (is_numeric($slugOrId)) {
                    $q->orWhere('id', (int) $slugOrId);
                }
            })
            ->first();

        if (!$product) {
            return $this->notFound('Product not found');
        }

        return $this->success(new ProductResource($product), 'Product retrieved');
    }

    /**
     * POST /api/v1/products (Admin)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'unique:products,slug'],
            'sku' => ['required', 'string', 'unique:products,sku'],
            'brand_id' => ['nullable', 'exists:brands,id'],
            'brand' => ['nullable', 'string'],
            'new_brand_name' => ['nullable', 'string', 'max:255'],
            'new_brand_logo' => ['nullable', 'string'],
            'short_description' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'material' => ['nullable', 'string'],
            'color_name' => ['nullable', 'string'],
            'color_hex' => ['nullable', 'string'],
            'audience' => ['nullable', 'string'],
            'product_type' => ['nullable', 'string'],
            'collection_season' => ['nullable', 'string'],
            'wholesale_price' => ['required', 'numeric', 'min:0'],
            'bulk_threshold' => ['nullable', 'integer', 'min:1'],
            'bulk_price' => ['nullable', 'numeric', 'min:0'],
            'full_stock_price' => ['nullable', 'numeric', 'min:0'],
            'msrp_price' => ['nullable', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'moq' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', 'string', 'in:draft,published,archived'],
            'is_featured' => ['nullable', 'boolean'],
            'is_hot' => ['nullable', 'boolean'],
            'is_new' => ['nullable', 'boolean'],
            'is_limited_deal' => ['nullable', 'boolean'],
            'is_best_deal' => ['nullable', 'boolean'],
            'video_url' => ['nullable', 'string'],
            'weight_grams' => ['nullable', 'integer', 'min:0'],
            'categories' => ['nullable', 'array'],
            'categories.*' => ['exists:categories,id'],
            'images' => ['nullable', 'array'],
            'variants' => ['nullable', 'array'],
            'pricing_tiers' => ['nullable', 'array'],
            'package_allocations' => ['nullable', 'array'],
            'shipping_package_profiles' => ['nullable', 'array'],
        ]);

        $productData = collect($validated)->except([
            'categories', 'images', 'variants', 'pricing_tiers', 'package_allocations', 'shipping_package_profiles',
            'new_brand_name', 'new_brand_logo', 'brand'
        ])->toArray();

        // Inline brand creation / resolution
        if (!empty($validated['new_brand_name'])) {
            $brandName = trim($validated['new_brand_name']);
            $brandSlug = \Illuminate\Support\Str::slug($brandName);
            $brandLogo = $validated['new_brand_logo'] ?? null;
            $brand = \App\Models\Brand::firstOrCreate(
                ['slug' => $brandSlug],
                ['name' => $brandName, 'logo_url' => $brandLogo, 'is_active' => true]
            );
            $productData['brand_id'] = $brand->id;
        } elseif (!empty($validated['brand']) && empty($productData['brand_id']) && !is_numeric($validated['brand'])) {
            $brandName = trim($validated['brand']);
            $brandSlug = \Illuminate\Support\Str::slug($brandName);
            $brand = \App\Models\Brand::firstOrCreate(
                ['slug' => $brandSlug],
                ['name' => $brandName, 'is_active' => true]
            );
            $productData['brand_id'] = $brand->id;
        }

        // Validate bulk threshold against MOQ
        $moq = (int) ($productData['moq'] ?? 1);
        if (!empty($productData['bulk_threshold']) && (int) $productData['bulk_threshold'] <= $moq) {
            return $this->error("Bulk threshold ({$productData['bulk_threshold']}) must be strictly greater than MOQ ({$moq})", 422);
        }

        // Validate package allocation grand total against MOQ if provided
        if (!empty($validated['package_allocations']) && is_array($validated['package_allocations'])) {
            $allocSum = 0;
            foreach ($validated['package_allocations'] as $pa) {
                $qty = (int) ($pa['quantity'] ?? 0);
                if ($qty < 0) {
                    return $this->error("Package allocation quantity cannot be negative", 422);
                }
                $allocSum += $qty;
            }
            if ($allocSum !== $moq && $allocSum > 0) {
                return $this->error("Package allocation total ({$allocSum} pcs) must equal product MOQ ({$moq} pcs)", 422);
            }
        }

        $product = Product::create($productData);

        if (!empty($validated['categories'])) {
            $product->categories()->sync($validated['categories']);
        }

        // Sync images if provided
        if ($request->has('images') && is_array($request->input('images'))) {
            $order = 0;
            foreach ($request->input('images') as $img) {
                if (is_string($img)) {
                    \App\Models\ProductImage::create([
                        'product_id' => $product->id,
                        'image_url' => $img,
                        'sort_order' => $order,
                        'is_primary' => $order === 0,
                    ]);
                } elseif (is_array($img) && !empty($img['image_url'])) {
                    \App\Models\ProductImage::create([
                        'product_id' => $product->id,
                        'image_url' => $img['image_url'],
                        'alt_text' => $img['alt_text'] ?? null,
                        'sort_order' => $img['sort_order'] ?? $order,
                        'is_primary' => $img['is_primary'] ?? ($order === 0),
                    ]);
                }
                $order++;
            }
        }

        // Sync variants if provided
        $createdVariantsMap = []; // key: "color-size" => ProductVariant
        if ($request->has('variants') && is_array($request->input('variants'))) {
            foreach ($request->input('variants') as $var) {
                $vColor = $var['color'] ?? $product->color_name ?? 'Standard';
                $vSize = $var['size'] ?? 'Standard';
                $variantSku = $var['sku'] ?? ($product->sku . '-' . strtoupper(substr($vColor, 0, 3)) . '-' . strtoupper(substr($vSize, 0, 3)));
                
                $createdVariant = \App\Models\ProductVariant::create([
                    'product_id' => $product->id,
                    'sku' => $variantSku,
                    'title' => $var['title'] ?? "{$vColor} / {$vSize}",
                    'size' => $vSize,
                    'color' => $vColor,
                    'price' => $var['price'] ?? $product->wholesale_price,
                    'compare_at_price' => $var['compare_at_price'] ?? $product->msrp_price,
                    'stock' => $var['stock'] ?? 0,
                    'is_default' => $var['is_default'] ?? false,
                    'is_active' => $var['is_active'] ?? true,
                ]);

                $createdVariantsMap["{$vColor}-{$vSize}"] = $createdVariant;

                // Create initial default warehouse inventory for variant
                $mainWh = \App\Models\Warehouse::first();
                if ($mainWh) {
                    \App\Models\Inventory::create([
                        'product_variant_id' => $createdVariant->id,
                        'warehouse_id' => $mainWh->id,
                        'quantity' => $createdVariant->stock,
                        'reserved_quantity' => 0,
                    ]);
                }
            }
        }

        // Sync Pricing Tiers (auto-generated from standard/bulk or custom list)
        if ($request->has('pricing_tiers') && is_array($request->input('pricing_tiers')) && count($request->input('pricing_tiers')) > 0) {
            try {
                $this->validatePricingTiers($request->input('pricing_tiers'));
            } catch (\InvalidArgumentException $e) {
                return $this->error($e->getMessage(), 422);
            }

            foreach ($request->input('pricing_tiers') as $tier) {
                \App\Models\ProductPricingTier::create([
                    'product_id' => $product->id,
                    'min_quantity' => (int) $tier['min_quantity'],
                    'max_quantity' => isset($tier['max_quantity']) && $tier['max_quantity'] !== null ? (int) $tier['max_quantity'] : null,
                    'unit_price' => (float) $tier['unit_price'],
                ]);
            }
        } elseif (!empty($product->bulk_threshold) && !empty($product->bulk_price)) {
            // Auto create standard & bulk tiers
            \App\Models\ProductPricingTier::create([
                'product_id' => $product->id,
                'min_quantity' => $moq,
                'max_quantity' => (int) $product->bulk_threshold - 1,
                'unit_price' => (float) $product->wholesale_price,
            ]);
            \App\Models\ProductPricingTier::create([
                'product_id' => $product->id,
                'min_quantity' => (int) $product->bulk_threshold,
                'max_quantity' => null,
                'unit_price' => (float) $product->bulk_price,
            ]);
        }

        // Sync Package Allocations if provided
        if ($request->has('package_allocations') && is_array($request->input('package_allocations'))) {
            foreach ($request->input('package_allocations') as $alloc) {
                $variantId = $alloc['product_variant_id'] ?? null;
                $color = $alloc['color'] ?? null;
                $size = $alloc['size'] ?? null;

                if (!$variantId && $color && $size && isset($createdVariantsMap["{$color}-{$size}"])) {
                    $variantId = $createdVariantsMap["{$color}-{$size}"]->id;
                }

                if (!$variantId) {
                    $vMatch = \App\Models\ProductVariant::where('product_id', $product->id)
                        ->where('color', $color)
                        ->where('size', $size)
                        ->first();
                    $variantId = $vMatch?->id;
                }

                if ($variantId && (int) ($alloc['quantity'] ?? 0) > 0) {
                    \App\Models\ProductPackageAllocation::create([
                        'product_id' => $product->id,
                        'product_variant_id' => $variantId,
                        'quantity' => (int) $alloc['quantity'],
                    ]);
                }
            }
        }

        // Sync Shipping Package Profiles if provided
        if ($request->has('shipping_package_profiles') && is_array($request->input('shipping_package_profiles'))) {
            try {
                PackageCalculatorService::validateProfilesList($request->input('shipping_package_profiles'));
            } catch (\InvalidArgumentException $e) {
                return $this->error($e->getMessage(), 422);
            }

            foreach ($request->input('shipping_package_profiles') as $p) {
                ProductShippingPackageProfile::create([
                    'product_id' => $product->id,
                    'package_quantity' => (int) ($p['package_quantity'] ?? $p['min_quantity']),
                    'quantity_max' => isset($p['quantity_max']) && $p['quantity_max'] !== null ? (int) $p['quantity_max'] : null,
                    'carton_count' => max(1, (int) ($p['carton_count'] ?? 1)),
                    'carton_length' => (float) ($p['carton_length'] ?? 0),
                    'carton_width' => (float) ($p['carton_width'] ?? 0),
                    'carton_height' => (float) ($p['carton_height'] ?? 0),
                    'dimension_unit' => strtolower(trim($p['dimension_unit'] ?? 'cm')),
                    'gross_weight' => (float) ($p['gross_weight'] ?? 0),
                    'net_weight' => isset($p['net_weight']) && $p['net_weight'] !== null ? (float) $p['net_weight'] : null,
                    'weight_unit' => strtolower(trim($p['weight_unit'] ?? 'kg')),
                    'notes' => $p['notes'] ?? null,
                    'is_active' => $p['is_active'] ?? true,
                ]);
            }
        }

        $product->load(['brand', 'categories', 'images', 'variants', 'pricingTiers', 'packageAllocations', 'shippingPackageProfiles']);

        return $this->success(new ProductResource($product), 'Product created successfully', 201);
    }

    /**
     * PUT /api/v1/products/{id} (Admin)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'unique:products,slug,' . $id],
            'sku' => ['sometimes', 'string', 'unique:products,sku,' . $id],
            'brand_id' => ['nullable', 'exists:brands,id'],
            'brand' => ['nullable', 'string'],
            'new_brand_name' => ['nullable', 'string', 'max:255'],
            'new_brand_logo' => ['nullable', 'string'],
            'short_description' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'material' => ['nullable', 'string'],
            'color_name' => ['nullable', 'string'],
            'color_hex' => ['nullable', 'string'],
            'audience' => ['nullable', 'string'],
            'product_type' => ['nullable', 'string'],
            'collection_season' => ['nullable', 'string'],
            'wholesale_price' => ['sometimes', 'numeric', 'min:0'],
            'bulk_threshold' => ['nullable', 'integer', 'min:1'],
            'bulk_price' => ['nullable', 'numeric', 'min:0'],
            'full_stock_price' => ['nullable', 'numeric', 'min:0'],
            'msrp_price' => ['nullable', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'moq' => ['nullable', 'integer', 'min:1'],
            'status' => ['sometimes', 'string', 'in:draft,published,archived'],
            'is_featured' => ['sometimes', 'boolean'],
            'is_hot' => ['sometimes', 'boolean'],
            'is_new' => ['sometimes', 'boolean'],
            'is_limited_deal' => ['nullable', 'boolean'],
            'is_best_deal' => ['nullable', 'boolean'],
            'video_url' => ['nullable', 'string'],
            'weight_grams' => ['nullable', 'integer', 'min:0'],
            'categories' => ['nullable', 'array'],
            'images' => ['nullable', 'array'],
            'variants' => ['nullable', 'array'],
            'pricing_tiers' => ['nullable', 'array'],
            'package_allocations' => ['nullable', 'array'],
            'shipping_package_profiles' => ['nullable', 'array'],
        ]);

        $productData = collect($validated)->except([
            'categories', 'images', 'variants', 'pricing_tiers', 'package_allocations', 'shipping_package_profiles',
            'new_brand_name', 'new_brand_logo', 'brand'
        ])->toArray();

        // Inline brand creation / resolution
        if (!empty($validated['new_brand_name'])) {
            $brandName = trim($validated['new_brand_name']);
            $brandSlug = \Illuminate\Support\Str::slug($brandName);
            $brandLogo = $validated['new_brand_logo'] ?? null;
            $brand = \App\Models\Brand::firstOrCreate(
                ['slug' => $brandSlug],
                ['name' => $brandName, 'logo_url' => $brandLogo, 'is_active' => true]
            );
            $productData['brand_id'] = $brand->id;
        } elseif (!empty($validated['brand']) && empty($productData['brand_id']) && !is_numeric($validated['brand'])) {
            $brandName = trim($validated['brand']);
            $brandSlug = \Illuminate\Support\Str::slug($brandName);
            $brand = \App\Models\Brand::firstOrCreate(
                ['slug' => $brandSlug],
                ['name' => $brandName, 'is_active' => true]
            );
            $productData['brand_id'] = $brand->id;
        }

        $effectiveMoq = (int) ($productData['moq'] ?? $product->moq ?? 1);
        $effectiveBulkThresh = isset($productData['bulk_threshold']) ? (int)$productData['bulk_threshold'] : (int)$product->bulk_threshold;

        if ($effectiveBulkThresh > 0 && $effectiveBulkThresh <= $effectiveMoq) {
            return $this->error("Bulk threshold ({$effectiveBulkThresh}) must be strictly greater than MOQ ({$effectiveMoq})", 422);
        }

        // Validate package allocation grand total against MOQ if provided
        if ($request->has('package_allocations') && is_array($request->input('package_allocations'))) {
            $allocSum = 0;
            foreach ($request->input('package_allocations') as $pa) {
                $qty = (int) ($pa['quantity'] ?? 0);
                if ($qty < 0) {
                    return $this->error("Package allocation quantity cannot be negative", 422);
                }
                $allocSum += $qty;
            }
            if ($allocSum !== $effectiveMoq && $allocSum > 0) {
                return $this->error("Package allocation total ({$allocSum} pcs) must equal product MOQ ({$effectiveMoq} pcs)", 422);
            }
        }

        $product->update($productData);

        if ($request->has('categories')) {
            $product->categories()->sync($request->input('categories', []));
        }

        // Update images if provided
        if ($request->has('images') && is_array($request->input('images'))) {
            $product->images()->delete();
            $order = 0;
            foreach ($request->input('images') as $img) {
                if (is_string($img)) {
                    \App\Models\ProductImage::create([
                        'product_id' => $product->id,
                        'image_url' => $img,
                        'sort_order' => $order,
                        'is_primary' => $order === 0,
                    ]);
                } elseif (is_array($img) && !empty($img['image_url'])) {
                    \App\Models\ProductImage::create([
                        'product_id' => $product->id,
                        'image_url' => $img['image_url'],
                        'alt_text' => $img['alt_text'] ?? null,
                        'sort_order' => $img['sort_order'] ?? $order,
                        'is_primary' => $img['is_primary'] ?? ($order === 0),
                    ]);
                }
                $order++;
            }
        }

        // Update variants if provided
        $variantsMap = [];
        if ($request->has('variants') && is_array($request->input('variants'))) {
            foreach ($request->input('variants') as $var) {
                $vColor = $var['color'] ?? $product->color_name ?? 'Standard';
                $vSize = $var['size'] ?? 'Standard';

                if (!empty($var['id'])) {
                    $existingVar = \App\Models\ProductVariant::where('id', $var['id'])
                        ->where('product_id', $product->id)
                        ->first();
                    if ($existingVar) {
                        $existingVar->update([
                            'sku' => $var['sku'] ?? $existingVar->sku,
                            'title' => $var['title'] ?? $existingVar->title,
                            'size' => $vSize,
                            'color' => $vColor,
                            'price' => $var['price'] ?? $existingVar->price,
                            'compare_at_price' => $var['compare_at_price'] ?? $existingVar->compare_at_price,
                            'stock' => $var['stock'] ?? $existingVar->stock,
                            'is_default' => $var['is_default'] ?? $existingVar->is_default,
                            'is_active' => $var['is_active'] ?? $existingVar->is_active,
                        ]);
                        $variantsMap["{$vColor}-{$vSize}"] = $existingVar;
                    }
                } else {
                    $variantSku = $var['sku'] ?? ($product->sku . '-' . strtoupper(substr($vColor, 0, 3)) . '-' . strtoupper(substr($vSize, 0, 3)));
                    $newVar = \App\Models\ProductVariant::create([
                        'product_id' => $product->id,
                        'sku' => $variantSku,
                        'title' => $var['title'] ?? "{$vColor} / {$vSize}",
                        'size' => $vSize,
                        'color' => $vColor,
                        'price' => $var['price'] ?? $product->wholesale_price,
                        'compare_at_price' => $var['compare_at_price'] ?? $product->msrp_price,
                        'stock' => $var['stock'] ?? 0,
                        'is_default' => $var['is_default'] ?? false,
                        'is_active' => $var['is_active'] ?? true,
                    ]);

                    $variantsMap["{$vColor}-{$vSize}"] = $newVar;

                    $mainWh = \App\Models\Warehouse::first();
                    if ($mainWh) {
                        \App\Models\Inventory::create([
                            'product_variant_id' => $newVar->id,
                            'warehouse_id' => $mainWh->id,
                            'quantity' => $newVar->stock,
                            'reserved_quantity' => 0,
                        ]);
                    }
                }
            }
        }

        // Update pricing tiers
        if ($request->has('pricing_tiers') && is_array($request->input('pricing_tiers'))) {
            try {
                $this->validatePricingTiers($request->input('pricing_tiers'));
            } catch (\InvalidArgumentException $e) {
                return $this->error($e->getMessage(), 422);
            }

            $product->pricingTiers()->delete();
            foreach ($request->input('pricing_tiers') as $tier) {
                \App\Models\ProductPricingTier::create([
                    'product_id' => $product->id,
                    'min_quantity' => (int) $tier['min_quantity'],
                    'max_quantity' => isset($tier['max_quantity']) && $tier['max_quantity'] !== null ? (int) $tier['max_quantity'] : null,
                    'unit_price' => (float) $tier['unit_price'],
                ]);
            }
        } elseif ($product->bulk_threshold && $product->bulk_price) {
            $product->pricingTiers()->delete();
            \App\Models\ProductPricingTier::create([
                'product_id' => $product->id,
                'min_quantity' => $effectiveMoq,
                'max_quantity' => (int) $product->bulk_threshold - 1,
                'unit_price' => (float) $product->wholesale_price,
            ]);
            \App\Models\ProductPricingTier::create([
                'product_id' => $product->id,
                'min_quantity' => (int) $product->bulk_threshold,
                'max_quantity' => null,
                'unit_price' => (float) $product->bulk_price,
            ]);
        }

        // Update package allocations if provided
        if ($request->has('package_allocations') && is_array($request->input('package_allocations'))) {
            $product->packageAllocations()->delete();
            foreach ($request->input('package_allocations') as $alloc) {
                $variantId = $alloc['product_variant_id'] ?? null;
                $color = $alloc['color'] ?? null;
                $size = $alloc['size'] ?? null;

                if (!$variantId && $color && $size && isset($variantsMap["{$color}-{$size}"])) {
                    $variantId = $variantsMap["{$color}-{$size}"]->id;
                }

                if (!$variantId) {
                    $vMatch = \App\Models\ProductVariant::where('product_id', $product->id)
                        ->where('color', $color)
                        ->where('size', $size)
                        ->first();
                    $variantId = $vMatch?->id;
                }

                if ($variantId && (int) ($alloc['quantity'] ?? 0) > 0) {
                    \App\Models\ProductPackageAllocation::create([
                        'product_id' => $product->id,
                        'product_variant_id' => $variantId,
                        'quantity' => (int) $alloc['quantity'],
                    ]);
                }
            }
        }

        // Update shipping package profiles if provided
        if ($request->has('shipping_package_profiles') && is_array($request->input('shipping_package_profiles'))) {
            try {
                PackageCalculatorService::validateProfilesList($request->input('shipping_package_profiles'));
            } catch (\InvalidArgumentException $e) {
                return $this->error($e->getMessage(), 422);
            }

            $product->shippingPackageProfiles()->delete();
            foreach ($request->input('shipping_package_profiles') as $p) {
                ProductShippingPackageProfile::create([
                    'product_id' => $product->id,
                    'package_quantity' => (int) ($p['package_quantity'] ?? $p['min_quantity']),
                    'quantity_max' => isset($p['quantity_max']) && $p['quantity_max'] !== null ? (int) $p['quantity_max'] : null,
                    'carton_count' => max(1, (int) ($p['carton_count'] ?? 1)),
                    'carton_length' => (float) ($p['carton_length'] ?? 0),
                    'carton_width' => (float) ($p['carton_width'] ?? 0),
                    'carton_height' => (float) ($p['carton_height'] ?? 0),
                    'dimension_unit' => strtolower(trim($p['dimension_unit'] ?? 'cm')),
                    'gross_weight' => (float) ($p['gross_weight'] ?? 0),
                    'net_weight' => isset($p['net_weight']) && $p['net_weight'] !== null ? (float) $p['net_weight'] : null,
                    'weight_unit' => strtolower(trim($p['weight_unit'] ?? 'kg')),
                    'notes' => $p['notes'] ?? null,
                    'is_active' => $p['is_active'] ?? true,
                ]);
            }
        }

        $product->load(['brand', 'categories', 'images', 'variants', 'pricingTiers', 'packageAllocations', 'shippingPackageProfiles']);

        return $this->success(new ProductResource($product), 'Product updated successfully');
    }

    /**
     * GET /api/v1/products/{id}/shipping-specs
     * Calculate live physical shipment specifications for any selected quantity
     */
    public function shippingSpecs(Request $request, string $slugOrId): JsonResponse
    {
        $product = Product::with('shippingPackageProfiles')
            ->where(function ($q) use ($slugOrId) {
                $q->where('slug', $slugOrId);
                if (is_numeric($slugOrId)) {
                    $q->orWhere('id', (int) $slugOrId);
                }
            })
            ->first();

        if (!$product) {
            return $this->notFound('Product not found');
        }

        $quantity = max(1, (int) $request->input('quantity', $product->moq ?? 1));
        $isFullStock = $request->boolean('is_full_stock') || $request->boolean('full_stock');

        $specs = $product->calculateShipmentSpecsForQuantity($quantity, $isFullStock);
        return $this->success($specs, 'Shipment package specifications resolved');
    }

    /**
     * DELETE /api/v1/products/{id} (Admin)
     */
    public function destroy(int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return $this->success(null, 'Product deleted successfully');
    }

    /**
     * Validate pricing tiers for boundaries, overlaps, and positive prices
     */
    protected function validatePricingTiers(array $tiers): void
    {
        if (empty($tiers)) return;

        // Sort tiers by min_quantity ascending
        usort($tiers, fn($a, $b) => ($a['min_quantity'] ?? 0) <=> ($b['min_quantity'] ?? 0));

        $prevMax = 0;
        foreach ($tiers as $idx => $tier) {
            $min = (int) ($tier['min_quantity'] ?? 0);
            $max = isset($tier['max_quantity']) && $tier['max_quantity'] !== null ? (int) $tier['max_quantity'] : null;
            $price = (float) ($tier['unit_price'] ?? 0);

            if ($min <= 0) {
                throw new \InvalidArgumentException("Tier minimum quantity must be greater than 0");
            }
            if ($price <= 0) {
                throw new \InvalidArgumentException("Tier unit price must be greater than 0");
            }
            if ($max !== null && $max < $min) {
                throw new \InvalidArgumentException("Tier max quantity ({$max}) cannot be less than min quantity ({$min})");
            }
            if ($idx > 0) {
                if ($prevMax === null) {
                    throw new \InvalidArgumentException("Cannot have additional tiers after an unlimited tier");
                }
                if ($min <= $prevMax) {
                    throw new \InvalidArgumentException("Pricing tier starting at {$min} overlaps with previous tier ending at {$prevMax}");
                }
            }
            $prevMax = $max;
        }
    }
}
