<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\Promotion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PromotionController extends ApiController
{
    /**
     * GET /api/v1/admin/promotions
     */
    public function index(Request $request): JsonResponse
    {
        $query = Promotion::query();

        if ($request->filled('type') && $request->input('type') !== 'all') {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                  ->orWhere('subtitle', 'ilike', "%{$search}%");
            });
        }

        $promotions = $query->orderBy('sort_order', 'asc')
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->success($promotions, 'Promotions retrieved');
    }

    /**
     * POST /api/v1/admin/promotions
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:500'],
            'type' => ['required', 'string', 'max:50'],
            'image_url' => ['nullable', 'string'],
            'discount_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'button_text' => ['nullable', 'string', 'max:100'],
            'button_action' => ['nullable', 'string', 'max:50'],
            'button_target' => ['nullable', 'string', 'max:255'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $promotion = Promotion::create($validated);

        return $this->success($promotion, 'Promotion created successfully', 201);
    }

    /**
     * GET /api/v1/admin/promotions/{id}
     */
    public function show(int $id): JsonResponse
    {
        $promotion = Promotion::findOrFail($id);
        return $this->success($promotion, 'Promotion retrieved');
    }

    /**
     * PUT /api/v1/admin/promotions/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $promotion = Promotion::findOrFail($id);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:500'],
            'type' => ['sometimes', 'string', 'max:50'],
            'image_url' => ['nullable', 'string'],
            'discount_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'button_text' => ['nullable', 'string', 'max:100'],
            'button_action' => ['nullable', 'string', 'max:50'],
            'button_target' => ['nullable', 'string', 'max:255'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $promotion->update($validated);

        return $this->success($promotion, 'Promotion updated successfully');
    }

    /**
     * DELETE /api/v1/admin/promotions/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $promotion = Promotion::findOrFail($id);
        $promotion->delete();

        return $this->success(null, 'Promotion deleted successfully');
    }
}
