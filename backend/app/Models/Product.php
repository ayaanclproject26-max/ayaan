<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'brand_id',
        'name',
        'slug',
        'sku',
        'short_description',
        'description',
        'material',
        'color_name',
        'color_hex',
        'audience',
        'product_type',
        'collection_season',
        'wholesale_price',
        'msrp_price',
        'cost_price',
        'moq',
        'bulk_threshold',
        'bulk_price',
        'full_stock_price',
        'status',
        'is_featured',
        'is_hot',
        'is_new',
        'is_limited_deal',
        'is_best_deal',
        'video_url',
        'weight_grams',
    ];

    protected $casts = [
        'wholesale_price' => 'decimal:2',
        'msrp_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'moq' => 'integer',
        'bulk_threshold' => 'integer',
        'bulk_price' => 'decimal:2',
        'full_stock_price' => 'decimal:2',
        'is_featured' => 'boolean',
        'is_hot' => 'boolean',
        'is_new' => 'boolean',
        'is_limited_deal' => 'boolean',
        'is_best_deal' => 'boolean',
        'weight_grams' => 'integer',
    ];

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'category_product');
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function primaryImage(): HasOne
    {
        return $this->hasOne(ProductImage::class)->where('is_primary', true);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->where('is_active', true);
    }

    public function allVariants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function pricingTiers(): HasMany
    {
        return $this->hasMany(ProductPricingTier::class)->orderBy('min_quantity', 'asc');
    }

    public function packageAllocations(): HasMany
    {
        return $this->hasMany(ProductPackageAllocation::class);
    }

    public function shippingPackageProfiles(): HasMany
    {
        return $this->hasMany(ProductShippingPackageProfile::class)->orderBy('package_quantity', 'asc');
    }

    /**
     * Exact Full Stock Price Resolution:
     * 1. available_stock < bulk_threshold -> applicable standard tier
     * 2. available_stock >= bulk_threshold -> bulk tier
     * 3. if configured full_stock_price exists and is LOWER than applicable normal price -> full_stock_price
     * Core Rule: Full Stock price must NEVER be worse than the valid price for that quantity.
     */
    public function getResolvedFullStockPrice(?int $customStock = null): float
    {
        $stock = $customStock ?? $this->getTotalAvailableStock();

        // 1. Normal applicable tier for this quantity
        if ($this->bulk_threshold !== null && $this->bulk_price !== null && $stock >= $this->bulk_threshold) {
            $applicableNormalPrice = (float) $this->bulk_price;
        } else {
            $applicableNormalPrice = (float) $this->wholesale_price;
        }

        // 2. Best valid price check with configured full_stock_price
        if ($this->full_stock_price !== null && (float) $this->full_stock_price > 0) {
            return (float) min((float) $this->full_stock_price, $applicableNormalPrice);
        }

        return $applicableNormalPrice;
    }

    /**
     * Resolve unit price based on three-price wholesale purchasing model:
     * 1. Standard Price (MOQ to Bulk Threshold - 1)
     * 2. Bulk Price (Bulk Threshold+)
     * 3. Full-Stock Price (special purchasing mode for 100% available stock)
     */
    public function getUnitPriceForQuantity(int $quantity, ?string $pricingMode = null): float
    {
        $totalStock = $this->getTotalAvailableStock();

        // 1. Full-Stock Mode or exact full inventory purchase (always uses resolved lowest valid price)
        if ($pricingMode === 'full_stock' || ($quantity === $totalStock && $totalStock > 0)) {
            return $this->getResolvedFullStockPrice($totalStock);
        }

        // 2. Explicit configured bulk threshold & price
        if ($this->bulk_threshold !== null && $this->bulk_price !== null) {
            if ($pricingMode === 'bulk' || $quantity >= $this->bulk_threshold) {
                return (float) $this->bulk_price;
            }
        }

        // 3. Fallback to product_pricing_tiers if defined
        $tiers = $this->relationLoaded('pricingTiers') ? $this->pricingTiers : $this->pricingTiers()->get();
        if ($tiers && $tiers->isNotEmpty()) {
            foreach ($tiers as $tier) {
                if ($quantity >= $tier->min_quantity && ($tier->max_quantity === null || $quantity <= $tier->max_quantity)) {
                    return (float) $tier->unit_price;
                }
            }
        }

        // 4. Default Standard Wholesale Price
        return (float) $this->wholesale_price;
    }

    /**
     * Compute package assortment allocation breakdown where SUM(cells) === $quantity
     * In full-stock mode, returns live warehouse inventory counts.
     */
    public function getPackageBreakdownForQuantity(int $quantity, bool $isFullStock = false): array
    {
        // 1. Full Stock Mode: use authoritative live inventory counts
        if ($isFullStock) {
            $variants = $this->relationLoaded('variants') ? $this->variants : $this->variants()->get();
            $breakdown = [];
            foreach ($variants as $v) {
                $breakdown[] = [
                    'product_variant_id' => $v->id,
                    'variant_sku' => $v->sku,
                    'color' => $v->color ?? $this->color_name ?? 'Standard',
                    'size' => $v->size ?? 'M',
                    'quantity' => (int) $v->stock,
                ];
            }
            return $breakdown;
        }

        // 2. Predefined Package Allocation Scaling
        $allocations = $this->relationLoaded('packageAllocations') 
            ? $this->packageAllocations 
            : $this->packageAllocations()->with('variant')->get();
        
        if ($allocations && $allocations->isNotEmpty()) {
            $baseMoq = max(1, (int) $this->moq);
            $mult = $quantity / $baseMoq;
            $breakdown = [];
            $runningTotal = 0;
            
            foreach ($allocations as $alloc) {
                $scaledQty = (int) round($alloc->quantity * $mult);
                $breakdown[] = [
                    'product_variant_id' => $alloc->product_variant_id,
                    'variant_sku' => $alloc->variant?->sku,
                    'color' => $alloc->color ?? $alloc->variant?->color ?? $this->color_name ?? 'Standard',
                    'size' => $alloc->size ?? $alloc->variant?->size ?? 'M',
                    'quantity' => $scaledQty,
                ];
                $runningTotal += $scaledQty;
            }

            // Guarantee SUM(all cells) === $quantity mathematically
            $diff = $quantity - $runningTotal;
            if ($diff !== 0 && count($breakdown) > 0) {
                $breakdown[count($breakdown) - 1]['quantity'] += $diff;
            }
            
            return $breakdown;
        }

        // 3. Fallback: distribute across active variants
        $variants = $this->relationLoaded('variants') ? $this->variants : $this->variants()->get();
        if ($variants && $variants->isNotEmpty()) {
            $count = $variants->count();
            $baseQty = intdiv($quantity, $count);
            $remainder = $quantity % $count;
            $breakdown = [];
            
            foreach ($variants as $i => $v) {
                $qty = $baseQty + ($i < $remainder ? 1 : 0);
                $breakdown[] = [
                    'product_variant_id' => $v->id,
                    'variant_sku' => $v->sku,
                    'color' => $v->color ?? $this->color_name ?? 'Standard',
                    'size' => $v->size ?? 'M',
                    'quantity' => $qty,
                ];
            }
            return $breakdown;
        }

        return [];
    }

    /**
     * Get total available stock across all active variants
     */
    public function getTotalAvailableStock(): int
    {
        $variants = $this->relationLoaded('variants') ? $this->variants : $this->variants()->get();
        return (int) ($variants->sum('stock') ?: 0);
    }

    /**
     * Extract YouTube video identifier safely
     */
    public function getYoutubeVideoId(): ?string
    {
        if (empty($this->video_url)) {
            return null;
        }

        $url = trim($this->video_url);

        // Pattern 1: youtu.be/VIDEO_ID
        if (preg_match('#youtu\.be/([a-zA-Z0-9_-]{11})#', $url, $matches)) {
            return $matches[1];
        }

        // Pattern 2: youtube.com/watch?v=VIDEO_ID
        if (preg_match('#(?:youtube\.com/(?:watch\?v=|embed/|v/|shorts/))([a-zA-Z0-9_-]{11})#', $url, $matches)) {
            return $matches[1];
        }

        // Pattern 3: direct 11-char ID
        if (preg_match('#^[a-zA-Z0-9_-]{11}$#', $url)) {
            return $url;
        }

        return null;
    }

    /**
     * Get privacy-conscious YouTube embed URL
     */
    public function getYoutubeEmbedUrl(): ?string
    {
        $id = $this->getYoutubeVideoId();
        return $id ? "https://www.youtube-nocookie.com/embed/{$id}" : null;
    }

    /**
     * Find matching shipping package profile for a specified order quantity.
     * Matches exact package quantity or valid range.
     * Does NOT guess or interpolate if unconfigured.
     */
    public function findShippingPackageProfileForQuantity(int $quantity, bool $isFullStock = false): ?ProductShippingPackageProfile
    {
        $profiles = $this->relationLoaded('shippingPackageProfiles')
            ? $this->shippingPackageProfiles
            : $this->shippingPackageProfiles()->where('is_active', true)->get();

        if ($profiles->isEmpty()) {
            return null;
        }

        // 1. Exact quantity match (package_quantity === quantity and quantity_max is null)
        $exactMatch = $profiles->first(function ($p) use ($quantity) {
            return (int) $p->package_quantity === $quantity && $p->quantity_max === null;
        });

        if ($exactMatch) {
            return $exactMatch;
        }

        // 2. Range match (package_quantity <= quantity <= quantity_max)
        $rangeMatch = $profiles->first(function ($p) use ($quantity) {
            return $p->quantity_max !== null 
                && $quantity >= (int) $p->package_quantity 
                && $quantity <= (int) $p->quantity_max;
        });

        return $rangeMatch;
    }

    /**
     * Calculate physical shipment specifications for a given quantity.
     * Returns full packaging dimensions, weight, CBM or explicit unavailable state.
     */
    public function calculateShipmentSpecsForQuantity(int $quantity, bool $isFullStock = false): array
    {
        $profile = $this->findShippingPackageProfileForQuantity($quantity, $isFullStock);

        if (!$profile) {
            return [
                'status' => 'unavailable',
                'message' => $isFullStock
                    ? "Shipping package configuration unavailable for Full Stock quantity ({$quantity} pcs)"
                    : "Shipping package configuration unavailable for the selected quantity ({$quantity} pcs)",
                'product_id' => $this->id,
                'quantity' => $quantity,
                'is_full_stock' => $isFullStock,
                'specs' => null,
            ];
        }

        $totalCbm = $profile->calculateTotalCbm();

        return [
            'status' => 'available',
            'product_id' => $this->id,
            'product_name' => $this->name,
            'product_sku' => $this->sku,
            'quantity' => $quantity,
            'is_full_stock' => $isFullStock,
            'profile_id' => $profile->id,
            'package_quantity' => (int) $profile->package_quantity,
            'quantity_max' => $profile->quantity_max !== null ? (int) $profile->quantity_max : null,
            'carton_count' => (int) $profile->carton_count,
            'carton_dimensions' => [
                'length' => (float) $profile->carton_length,
                'width' => (float) $profile->carton_width,
                'height' => (float) $profile->carton_height,
                'unit' => $profile->dimension_unit ?: 'cm',
            ],
            'total_cbm' => $totalCbm,
            'gross_weight' => (float) $profile->gross_weight,
            'net_weight' => $profile->net_weight !== null ? (float) $profile->net_weight : null,
            'weight_unit' => $profile->weight_unit ?: 'kg',
            'notes' => $profile->notes,
        ];
    }
}
