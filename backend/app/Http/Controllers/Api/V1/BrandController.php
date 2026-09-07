<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\Api\V1\BrandResource;
use App\Models\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class BrandController extends ApiController
{
    /**
     * GET /api/v1/brands
     * 
     * Security Rule: Public and customer callers only receive active brands.
     * Only authenticated administrators may view inactive brands by passing ?all=true.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user('sanctum') ?? $request->user();
        $isAdmin = $user && $user->isAdmin();

        $query = Brand::withCount('products');

        if (!$isAdmin || !$request->boolean('all')) {
            $query->where('is_active', true);
        }

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('slug', 'ilike', "%{$search}%");
            });
        }

        $brands = $query->orderBy('sort_order', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        return $this->success(BrandResource::collection($brands), 'Brands retrieved');
    }

    /**
     * GET /api/v1/brands/{slugOrId}
     */
    public function show(Request $request, string $slugOrId): JsonResponse
    {
        $user = $request->user('sanctum') ?? $request->user();
        $isAdmin = $user && $user->isAdmin();

        $query = Brand::withCount('products')
            ->where(function ($q) use ($slugOrId) {
                $q->where('slug', $slugOrId)
                  ->orWhere('id', is_numeric($slugOrId) ? (int)$slugOrId : -1);
            });

        if (!$isAdmin) {
            $query->where('is_active', true);
        }

        $brand = $query->first();

        if (!$brand) {
            return $this->notFound('Brand not found');
        }

        return $this->success(new BrandResource($brand), 'Brand retrieved');
    }

    /**
     * POST /api/v1/brands (Admin)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'logo_url' => ['nullable', 'string'],
            'website' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        // Auto-generate collision-resistant unique slug if not provided or collision
        $baseSlug = !empty($validated['slug'])
            ? Str::slug($validated['slug'])
            : Str::slug($validated['name']);

        if (empty($baseSlug)) {
            $baseSlug = 'brand-' . time();
        }

        $slug = $baseSlug;
        $counter = 1;
        while (Brand::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }
        $validated['slug'] = $slug;

        $validated['sort_order'] = $validated['sort_order'] ?? 0;
        $validated['is_active'] = $validated['is_active'] ?? true;

        $brand = Brand::create($validated);

        $this->invalidateBrandCache();

        return $this->success(new BrandResource($brand->loadCount('products')), 'Brand created successfully', 201);
    }

    /**
     * PUT /api/v1/brands/{id} (Admin)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $brand = Brand::findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255'],
            'logo_url' => ['nullable', 'string'],
            'website' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        // Handle slug collision safely if updated
        if (isset($validated['slug'])) {
            $baseSlug = Str::slug($validated['slug']);
            if (empty($baseSlug)) {
                $baseSlug = 'brand-' . $id;
            }
            $slug = $baseSlug;
            $counter = 1;
            while (Brand::where('slug', $slug)->where('id', '!=', $id)->exists()) {
                $slug = "{$baseSlug}-{$counter}";
                $counter++;
            }
            $validated['slug'] = $slug;
        }

        $brand->update($validated);

        $this->invalidateBrandCache();

        return $this->success(new BrandResource($brand->fresh()->loadCount('products')), 'Brand updated successfully');
    }

    /**
     * DELETE /api/v1/brands/{id} (Admin - Safe Deletion)
     * 
     * Prevents deleting brands that have active product references.
     */
    public function destroy(int $id): JsonResponse
    {
        $brand = Brand::withCount('products')->findOrFail($id);

        if ($brand->products_count > 0) {
            return $this->error(
                "Cannot delete brand '{$brand->name}': it is associated with {$brand->products_count} product(s). Please reassign or remove the products first, or deactivate the brand.",
                422
            );
        }

        $brand->delete();

        $this->invalidateBrandCache();

        return $this->success(null, "Brand '{$brand->name}' deleted successfully");
    }

    /**
     * Invalidate brand-related caches
     */
    private function invalidateBrandCache(): void
    {
        Cache::forget('storefront_brands');
        Cache::forget('active_brands_list');
    }
}
