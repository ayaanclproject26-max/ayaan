<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\Api\V1\OrderResource;
use App\Models\Order;
use App\Models\OrderStatusEvent;
use App\Models\Payment;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends ApiController
{
    /**
     * GET /api/v1/admin/orders
     * List all orders across the system with server-side filters and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::with(['user', 'items', 'payments', 'statusEvents']);

        // Search by order number, customer name, email, or shipping name
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%")
                  ->orWhere('shipping_name', 'ilike', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'ilike', "%{$search}%")
                         ->orWhere('email', 'ilike', "%{$search}%")
                         ->orWhere('company_name', 'ilike', "%{$search}%");
                  });
            });
        }

        // Filter by order status
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        // Filter by payment status
        if ($request->filled('payment_status') && $request->input('payment_status') !== 'all') {
            $query->where('payment_status', $request->input('payment_status'));
        }

        // Filter by fulfillment status
        if ($request->filled('fulfillment_status') && $request->input('fulfillment_status') !== 'all') {
            $query->where('fulfillment_status', $request->input('fulfillment_status'));
        }

        // Filter by payment method
        if ($request->filled('payment_method') && $request->input('payment_method') !== 'all') {
            $query->where('payment_method', $request->input('payment_method'));
        }

        // Date range
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->input('start_date'));
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->input('end_date'));
        }

        // Sorting
        $sort = $request->input('sort', 'created_at');
        $direction = $request->input('direction', 'desc');
        if (in_array($sort, ['created_at', 'total_amount', 'status', 'order_number'])) {
            $query->orderBy($sort, $direction === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = min((int) $request->input('per_page', 20), 100);
        $orders = $query->paginate($perPage);

        return $this->success($orders, 'Admin orders retrieved successfully');
    }

    /**
     * GET /api/v1/admin/orders/{id}
     * Retrieve full order details.
     */
    public function show(int|string $id): JsonResponse
    {
        $query = Order::with(['user', 'items.variant', 'payments', 'statusEvents.user']);

        if (is_numeric($id)) {
            $order = $query->where('id', (int) $id)->first();
        } else {
            $order = $query->where('order_number', $id)->first();
        }

        if (!$order) {
            return $this->notFound('Order not found');
        }

        return $this->success(new OrderResource($order), 'Order details retrieved');
    }

    /**
     * PATCH /api/v1/admin/orders/{id}/status
     * Transition order status safely.
     */
    public function updateStatus(Request $request, int|string $id): JsonResponse
    {
        $order = Order::with('items')->where(function ($q) use ($id) {
            if (is_numeric($id)) {
                $q->where('id', (int) $id);
            } else {
                $q->where('order_number', $id);
            }
        })->firstOrFail();

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:pending,processing,shipped,delivered,cancelled,refunded'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        $newStatus = $validated['status'];
        $oldStatus = $order->status;
        $admin = $request->user();
        $note = $validated['note'] ?? "Status updated from {$oldStatus} to {$newStatus} by admin.";

        // Validate state transitions
        $validTransitions = [
            'pending' => ['processing', 'shipped', 'cancelled'],
            'processing' => ['shipped', 'delivered', 'cancelled'],
            'shipped' => ['delivered', 'cancelled', 'refunded'],
            'delivered' => ['refunded'],
            'cancelled' => [], // terminal
            'refunded' => [],
        ];

        if ($oldStatus === $newStatus) {
            return $this->success(new OrderResource($order->load(['items', 'payments', 'statusEvents'])), 'Order status unchanged');
        }

        if (isset($validTransitions[$oldStatus]) && !in_array($newStatus, $validTransitions[$oldStatus])) {
            return $this->error("Invalid status transition from '{$oldStatus}' to '{$newStatus}'.", 422);
        }

        DB::transaction(function () use ($order, $oldStatus, $newStatus, $admin, $note) {
            $order->update(['status' => $newStatus]);

            // If moving to cancelled from an active status, restore stock
            if ($newStatus === 'cancelled' && $oldStatus !== 'cancelled') {
                foreach ($order->items as $item) {
                    if ($item->product_variant_id) {
                        ProductVariant::where('id', $item->product_variant_id)->increment('stock', $item->quantity);
                    }
                }
            }

            OrderStatusEvent::create([
                'order_id' => $order->id,
                'user_id' => $admin->id,
                'event_type' => "status_changed_to_{$newStatus}",
                'message' => $note,
            ]);
        });

        return $this->success(new OrderResource($order->fresh(['items', 'payments', 'statusEvents'])), 'Order status updated successfully');
    }

    /**
     * PATCH /api/v1/admin/orders/{id}/fulfillment
     * Update fulfillment status.
     */
    public function updateFulfillment(Request $request, int|string $id): JsonResponse
    {
        $order = Order::where(function ($q) use ($id) {
            if (is_numeric($id)) {
                $q->where('id', (int) $id);
            } else {
                $q->where('order_number', $id);
            }
        })->firstOrFail();

        $validated = $request->validate([
            'fulfillment_status' => ['required', 'string', 'in:unfulfilled,partial,fulfilled'],
            'tracking_number' => ['nullable', 'string', 'max:100'],
            'carrier' => ['nullable', 'string', 'max:100'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        $admin = $request->user();

        $order->update([
            'fulfillment_status' => $validated['fulfillment_status'],
        ]);

        $msg = "Fulfillment status updated to {$validated['fulfillment_status']}.";
        if (!empty($validated['tracking_number'])) {
            $msg .= " Tracking: {$validated['tracking_number']} ({$validated['carrier']}).";
        }

        OrderStatusEvent::create([
            'order_id' => $order->id,
            'user_id' => $admin->id,
            'event_type' => 'fulfillment_updated',
            'message' => $msg,
        ]);

        return $this->success(new OrderResource($order->fresh(['items', 'payments', 'statusEvents'])), 'Fulfillment updated successfully');
    }

    /**
     * POST /api/v1/admin/orders/{id}/payment-proof/review
     * Review submitted offline payment proof (approve / reject).
     */
    public function reviewPaymentProof(Request $request, int|string $id): JsonResponse
    {
        $order = Order::with('payments')->where(function ($q) use ($id) {
            if (is_numeric($id)) {
                $q->where('id', (int) $id);
            } else {
                $q->where('order_number', $id);
            }
        })->firstOrFail();

        $validated = $request->validate([
            'action' => ['required', 'string', 'in:approve,reject'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        $admin = $request->user();
        $action = $validated['action'];
        $note = $validated['note'] ?? ($action === 'approve' ? 'Payment proof verified and approved.' : 'Payment proof rejected.');

        DB::transaction(function () use ($order, $action, $admin, $note) {
            if ($action === 'approve') {
                $order->update([
                    'payment_status' => 'paid',
                    'status' => $order->status === 'pending' ? 'processing' : $order->status,
                ]);

                // Update payment record if exists, or create one
                $payment = $order->payments->first();
                if ($payment) {
                    $payment->update(['status' => 'succeeded']);
                } else {
                    Payment::create([
                        'order_id' => $order->id,
                        'transaction_id' => 'admin_verified_' . $order->id,
                        'provider' => $order->payment_method,
                        'amount' => $order->total_amount,
                        'currency' => $order->currency ?? 'USD',
                        'status' => 'succeeded',
                    ]);
                }

                OrderStatusEvent::create([
                    'order_id' => $order->id,
                    'user_id' => $admin->id,
                    'event_type' => 'payment_proof_approved',
                    'message' => "Payment verified: {$note}",
                ]);
            } else {
                $order->update([
                    'payment_status' => 'failed',
                ]);

                $payment = $order->payments->first();
                if ($payment) {
                    $payment->update(['status' => 'failed']);
                }

                OrderStatusEvent::create([
                    'order_id' => $order->id,
                    'user_id' => $admin->id,
                    'event_type' => 'payment_proof_rejected',
                    'message' => "Payment proof rejected: {$note}",
                ]);
            }
        });

        return $this->success(new OrderResource($order->fresh(['items', 'payments', 'statusEvents'])), "Payment proof {$action}d successfully");
    }

    /**
     * POST /api/v1/admin/orders/{id}/shipment/aramex
     * Create official Aramex shipment using immutable order snapshot.
     */
    public function createAramexShipment(Request $request, int|string $id, \App\Services\Shipping\AramexShippingService $aramexService): JsonResponse
    {
        $order = Order::with(['items', 'user', 'payments', 'statusEvents'])->where(function ($q) use ($id) {
            if (is_numeric($id)) {
                $q->where('id', (int) $id);
            } else {
                $q->where('order_number', $id);
            }
        })->firstOrFail();

        // Check if order already has an active AWB / shipment
        if (!empty($order->tracking_number)) {
            return $this->success([
                'order' => new OrderResource($order),
                'tracking_number' => $order->tracking_number,
                'is_duplicate_prevented' => true,
                'message' => "Order #{$order->order_number} already has an active shipment (AWB: {$order->tracking_number}). Duplicate creation prevented.",
            ], 'Shipment already exists');
        }

        if (!$order->canCreateAramexShipment()) {
            return $this->error("Order #{$order->order_number} is not ready for shipment creation. Ensure payment is confirmed or commercial terms are approved.", 422);
        }

        try {
            $result = $aramexService->createShipment($order);
            return $this->success([
                'order' => new OrderResource($order->fresh(['items', 'payments', 'statusEvents'])),
                'tracking_number' => $result['tracking_number'],
                'shipment_id' => $result['shipment_id'],
                'label_url' => $result['label_url'] ?? null,
                'carrier' => 'Aramex',
                'carrier_status' => 'Shipment Created',
            ], 'Aramex shipment created successfully');
        } catch (\Throwable $e) {
            return $this->error("Failed to create Aramex shipment: {$e->getMessage()}", 422);
        }
    }

    /**
     * POST /api/v1/admin/orders/{id}/tracking/refresh
     * Refresh live carrier tracking status from Aramex.
     */
    public function refreshTracking(Request $request, int|string $id, \App\Services\Shipping\AramexShippingService $aramexService): JsonResponse
    {
        $order = Order::with(['items', 'user', 'payments', 'statusEvents'])->where(function ($q) use ($id) {
            if (is_numeric($id)) {
                $q->where('id', (int) $id);
            } else {
                $q->where('order_number', $id);
            }
        })->firstOrFail();

        if (empty($order->tracking_number)) {
            return $this->error("Order #{$order->order_number} has not been shipped yet and has no tracking number.", 422);
        }

        try {
            $trackingData = $aramexService->trackShipment($order->tracking_number, $order);
            return $this->success([
                'order' => new OrderResource($order->fresh(['items', 'payments', 'statusEvents'])),
                'tracking' => $trackingData,
            ], 'Carrier tracking updated successfully');
        } catch (\Throwable $e) {
            return $this->error("Failed to refresh carrier tracking: {$e->getMessage()}", 422);
        }
    }

    /**
     * PATCH /api/v1/admin/orders/{id}/shipping-quote
     * Update authoritative freight quote (e.g. Akij Sea freight quote confirmation)
     */
    public function updateShippingQuote(
        Request $request,
        int|string $id,
        \App\Services\Shipping\AkijSeaShippingService $akijService
    ): JsonResponse {
        $order = Order::with(['items', 'user', 'payments', 'statusEvents'])->where(function ($q) use ($id) {
            if (is_numeric($id)) {
                $q->where('id', (int) $id);
            } else {
                $q->where('order_number', $id);
            }
        })->firstOrFail();

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
            'quote_reference' => ['nullable', 'string', 'max:100'],
            'carrier' => ['nullable', 'string', 'max:100'],
            'valid_until' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $updatedOrder = $akijService->updateOrderFreightQuote($order, $validated);

        return $this->success([
            'order' => new OrderResource($updatedOrder->load(['items', 'payments', 'statusEvents'])),
            'shipping_snapshot' => $updatedOrder->shipping_snapshot,
            'message' => "Freight quote updated to \${$validated['amount']} USD successfully.",
        ], 'Shipping quote updated successfully');
    }
}
