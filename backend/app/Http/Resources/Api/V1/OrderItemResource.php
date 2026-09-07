<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $unitPrice = (float) $this->unit_price;
        $lineTotal = (float) $this->line_total;

        return [
            'id' => (string) $this->id,
            'order_id' => (string) $this->order_id,
            'product_id' => $this->product_id ? (string) $this->product_id : null,
            'product_variant_id' => $this->product_variant_id ? (string) $this->product_variant_id : null,
            'product_name' => $this->product_name,
            'product_slug' => $this->product_slug,
            'sku' => $this->sku,
            'variant_title' => $this->variant_title,
            'size' => $this->size,
            'color' => $this->color,
            'product_image_url' => $this->product_image_url ?: '/placeholder.jpg',
            'unit_price' => $unitPrice,
            'unit_price_cents' => (int) round($unitPrice * 100),
            'quantity' => (int) $this->quantity,
            'line_total' => $lineTotal,
            'line_total_cents' => (int) round($lineTotal * 100),
            'package_breakdown' => $this->package_breakdown,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
