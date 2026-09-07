<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $imagesList = $this->images && $this->images->isNotEmpty()
            ? $this->images->pluck('image_url')->filter()->values()->all()
            : [];

        $variantsCollection = $this->variants ?? collect();
        $totalStock = $variantsCollection->sum('stock');
        
        $sizes = $variantsCollection->pluck('size')->filter()->unique()->values()->all();
        if (empty($sizes)) {
            $sizes = ['S', 'M', 'L', 'XL', 'XXL'];
        }

        $colors = $variantsCollection->pluck('color')->filter()->unique()->values()->all();
        if (empty($colors) && $this->color_name) {
            $colors = [$this->color_name];
        }

        $firstCategory = $this->categories && $this->categories->isNotEmpty() ? $this->categories->first() : null;

        $user = $request->user();
        $isB2b = $user && ($user->isB2bBuyer() || $user->isAdmin());
        $effectivePrice = $isB2b 
            ? (float) $this->wholesale_price 
            : ($this->msrp_price !== null ? (float) $this->msrp_price : (float) $this->wholesale_price);

        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'sku' => $this->sku,
            'brand' => $this->brand ? $this->brand->name : 'Ayaan',
            'brand_id' => $this->brand_id ? (string) $this->brand_id : null,
            'brand_data' => $this->brand ? new BrandResource($this->brand) : null,
            'categoryId' => $firstCategory ? (string) $firstCategory->id : 'c_tops',
            'categoryName' => $firstCategory ? $firstCategory->name : 'Tops',
            'categories' => CategoryResource::collection($this->whenLoaded('categories')),
            'audience' => $this->audience ?: 'UNISEX',
            'productType' => $this->product_type ?: 'Apparel',
            'collectionSeason' => $this->collection_season ?: '2026 Core Collection',
            'shortDescription' => $this->short_description ?: '',
            'description' => $this->description ?: '',
            'material' => $this->material ?: '100% Cotton',
            'colorName' => $this->color_name ?: 'Black',
            'colorHex' => $this->color_hex ?: '#111827',
            'weightGrams' => (int) ($this->weight_grams ?? 250),
            'videoUrl' => $this->video_url ?: '',
            'images' => !empty($imagesList) ? $imagesList : ['/placeholder.jpg'],
            'price' => $effectivePrice,
            'wholesalePrice' => (float) $this->wholesale_price,
            'standardPrice' => (float) $this->wholesale_price,
            'bulkThreshold' => $this->bulk_threshold !== null ? (int) $this->bulk_threshold : null,
            'bulkPrice' => $this->bulk_price !== null ? (float) $this->bulk_price : null,
            'fullStockPrice' => $this->getResolvedFullStockPrice(),
            'configuredFullStockPrice' => $this->full_stock_price !== null ? (float) $this->full_stock_price : null,
            'msrpPrice' => $this->msrp_price !== null ? (float) $this->msrp_price : null,
            'isB2bTier' => $isB2b,
            'costPrice' => $this->cost_price !== null ? (float) $this->cost_price : null,
            'moq' => (int) ($this->moq ?? 1),
            'stock' => (int) $totalStock,
            'in_stock' => $totalStock > 0,
            'youtubeVideoId' => $this->getYoutubeVideoId(),
            'youtubeEmbedUrl' => $this->getYoutubeEmbedUrl(),

            'status' => $this->status ?: 'published',
            'isFeatured' => (bool) $this->is_featured,
            'isHot' => (bool) $this->is_hot,
            'isNew' => (bool) $this->is_new,
            'isLimitedDeal' => (bool) $this->is_limited_deal,
            'isBestDeal' => (bool) $this->is_best_deal,
            'sizes' => $sizes,
            'colors' => !empty($colors) ? $colors : ['Black'],
            'variants' => ProductVariantResource::collection($this->whenLoaded('variants')),
            'pricing_tiers' => $this->whenLoaded('pricingTiers', function () {
                return $this->pricingTiers->map(fn($t) => [
                    'min_quantity' => $t->min_quantity,
                    'max_quantity' => $t->max_quantity,
                    'unit_price' => (float) $t->unit_price,
                ]);
            }),
            'package_allocations' => $this->whenLoaded('packageAllocations', function () {
                return $this->packageAllocations->map(fn($pa) => [
                    'product_variant_id' => $pa->product_variant_id,
                    'quantity' => $pa->quantity,
                    'color' => $pa->variant ? $pa->variant->color : null,
                    'size' => $pa->variant ? $pa->variant->size : null,
                ]);
            }),
            'is_package_assortment' => $this->packageAllocations && $this->packageAllocations->isNotEmpty(),
            'shipping_package_profiles' => $this->whenLoaded('shippingPackageProfiles', function () {
                return $this->shippingPackageProfiles->map(fn($p) => [
                    'id' => (string) $p->id,
                    'product_id' => (string) $p->product_id,
                    'package_quantity' => (int) $p->package_quantity,
                    'quantity_max' => $p->quantity_max !== null ? (int) $p->quantity_max : null,
                    'carton_count' => (int) $p->carton_count,
                    'carton_length' => (float) $p->carton_length,
                    'carton_width' => (float) $p->carton_width,
                    'carton_height' => (float) $p->carton_height,
                    'dimension_unit' => $p->dimension_unit ?: 'cm',
                    'gross_weight' => (float) $p->gross_weight,
                    'net_weight' => $p->net_weight !== null ? (float) $p->net_weight : null,
                    'weight_unit' => $p->weight_unit ?: 'kg',
                    'total_cbm' => $p->calculateTotalCbm(),
                    'notes' => $p->notes,
                    'is_active' => (bool) $p->is_active,
                ]);
            }),
            'full_stock_quantity' => $totalStock,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
