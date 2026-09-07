<?php

namespace App\Http\Resources\Api\V1\Admin;

use Illuminate\Http\Resources\Json\JsonResource;

class DashboardResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray($request): array
    {
        return [
            'total_products' => $this['total_products'] ?? null,
            'active_products' => $this['active_products'] ?? null,
            'total_customers' => $this['total_customers'] ?? null,
            'total_orders' => $this['total_orders'] ?? null,
            'pending_orders' => $this['pending_orders'] ?? null,
            'processing_orders' => $this['processing_orders'] ?? null,
            'delivered_orders' => $this['delivered_orders'] ?? null,
            'revenue' => $this['revenue'] ?? null,
            'low_stock_items' => $this['low_stock_items'] ?? null,
            'recent_orders' => $this['recent_orders'] ?? [],
            'recent_rfqs' => $this['recent_rfqs'] ?? [],
        ];
    }
}
?>
