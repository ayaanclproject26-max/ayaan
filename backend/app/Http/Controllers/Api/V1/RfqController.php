<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Models\Quote;
use App\Models\QuoteItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RfqController extends ApiController
{
    /**
     * GET /api/v1/rfq
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Quote::with('items');

        if ($user && !$user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        $rfqs = $query->orderBy('created_at', 'desc')->get();

        return $this->success($rfqs, 'RFQs retrieved');
    }

    /**
     * GET /api/v1/rfq/{id}
     */
    public function show(int|string $id): JsonResponse
    {
        $query = Quote::with(['items.product.images', 'user']);

        if (is_numeric($id)) {
            $rfq = $query->where('id', (int) $id)->first();
        } else {
            $rfq = $query->where('rfq_number', $id)->first();
        }

        if (!$rfq) {
            return $this->notFound('RFQ record not found');
        }

        return $this->success($rfq, 'RFQ details retrieved');
    }

    /**
     * POST /api/v1/rfq
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'buyer_name' => ['required', 'string', 'max:255'],
            'buyer_email' => ['required', 'email'],
            'buyer_phone' => ['nullable', 'string', 'max:50'],
            'company_name' => ['required', 'string', 'max:255'],
            'business_type' => ['nullable', 'string'],
            'website' => ['nullable', 'string'],
            'tax_number' => ['nullable', 'string'],
            'destination_country' => ['nullable', 'string'],
            'destination_city' => ['nullable', 'string'],
            'shipping_port' => ['nullable', 'string'],
            'target_delivery_date' => ['nullable', 'string'],
            'request_title' => ['nullable', 'string'],
            'general_notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['nullable', 'exists:products,id'],
            'items.*.product_name' => ['required', 'string'],
            'items.*.product_slug' => ['nullable', 'string'],
            'items.*.brand' => ['nullable', 'string'],
            'items.*.sku' => ['nullable', 'string'],
            'items.*.image_url' => ['nullable', 'string'],
            'items.*.selected_color' => ['nullable', 'string'],
            'items.*.selected_size' => ['nullable', 'string'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.moq' => ['nullable', 'integer'],
            'items.*.unit_price' => ['nullable', 'numeric'],
            'items.*.target_price' => ['nullable', 'numeric'],
            'items.*.buyer_notes' => ['nullable', 'string'],
        ]);

        $user = $request->user();
        $rfqNumber = 'RFQ-' . date('Y') . '-' . str_pad((string) (Quote::count() + 101), 6, '0', STR_PAD_LEFT);

        $rfq = DB::transaction(function () use ($validated, $user, $rfqNumber) {
            $quote = Quote::create([
                'rfq_number' => $rfqNumber,
                'user_id' => $user ? $user->id : null,
                'buyer_name' => $validated['buyer_name'],
                'buyer_email' => $validated['buyer_email'],
                'buyer_phone' => $validated['buyer_phone'] ?? null,
                'company_name' => $validated['company_name'],
                'business_type' => $validated['business_type'] ?? null,
                'website' => $validated['website'] ?? null,
                'tax_number' => $validated['tax_number'] ?? null,
                'destination_country' => $validated['destination_country'] ?? 'United States',
                'destination_city' => $validated['destination_city'] ?? null,
                'shipping_port' => $validated['shipping_port'] ?? null,
                'target_delivery_date' => $validated['target_delivery_date'] ?? null,
                'request_title' => $validated['request_title'] ?? null,
                'general_notes' => $validated['general_notes'] ?? null,
                'status' => 'SUBMITTED',
            ]);

            foreach ($validated['items'] as $item) {
                QuoteItem::create([
                    'quote_id' => $quote->id,
                    'product_id' => $item['product_id'] ?? null,
                    'product_name' => $item['product_name'],
                    'product_slug' => $item['product_slug'] ?? null,
                    'brand' => $item['brand'] ?? null,
                    'sku' => $item['sku'] ?? null,
                    'image_url' => $item['image_url'] ?? null,
                    'selected_color' => $item['selected_color'] ?? null,
                    'selected_size' => $item['selected_size'] ?? null,
                    'quantity' => $item['quantity'],
                    'moq' => $item['moq'] ?? 1,
                    'unit_price' => $item['unit_price'] ?? null,
                    'target_price' => $item['target_price'] ?? null,
                    'buyer_notes' => $item['buyer_notes'] ?? null,
                ]);
            }

            return $quote;
        });

        return $this->success($rfq->load('items'), 'Quotation request submitted successfully', 201);
    }

    /**
     * PATCH /api/v1/rfq/{id}/status
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $rfq = Quote::findOrFail($id);

        $validated = $request->validate([
            'status' => ['required', 'string'],
            'note' => ['nullable', 'string'],
        ]);

        $rfq->update(['status' => $validated['status']]);

        return $this->success($rfq->load('items'), 'RFQ status updated successfully');
    }
}
