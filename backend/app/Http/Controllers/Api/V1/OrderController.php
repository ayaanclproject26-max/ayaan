<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Order\CreateOrderRequest;
use App\Http\Resources\Api\V1\OrderResource;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusEvent;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends ApiController
{
    /**
     * GET /api/v1/orders
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->unauthorized();
        }

        $orders = $user->orders()
            ->with(['items', 'statusEvents', 'payments'])
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->success(OrderResource::collection($orders), 'Orders retrieved');
    }

    /**
     * GET /api/v1/orders/{id}
     */
    public function show(Request $request, int|string $id): JsonResponse
    {
        $user = $request->user();

        $query = Order::with(['items', 'statusEvents', 'payments']);

        if (is_numeric($id)) {
            $order = $query->where('id', (int) $id)->first();
        } else {
            $order = $query->where('order_number', $id)->first();
        }

        if (!$order) {
            return $this->notFound('Order not found');
        }

        // Enforce customer ownership (unless admin)
        if ($user && $order->user_id !== null && $order->user_id !== $user->id && $user->role !== 'admin') {
            return $this->forbidden('You are not authorized to view this order');
        }

        return $this->success(new OrderResource($order), 'Order details retrieved');
    }

    /**
     * POST /api/v1/orders
     */
    public function store(CreateOrderRequest $request): JsonResponse
    {
        $user = $request->user();

        // 1. Resolve Items to Purchase (from active cart or request payload)
        $itemsToProcess = [];
        $activeCart = null;

        if ($user) {
            $activeCart = Cart::where('user_id', $user->id)
                ->where('status', 'active')
                ->with(['items.product', 'items.variant'])
                ->first();
        } else {
            $sessionId = $request->header('X-Session-Id') ?? $request->input('session_id');
            if ($sessionId) {
                $activeCart = Cart::where('session_id', $sessionId)
                    ->where('status', 'active')
                    ->with(['items.product', 'items.variant'])
                    ->first();
            }
        }

        if ($activeCart && $activeCart->items->isNotEmpty()) {
            foreach ($activeCart->items as $cartItem) {
                $itemsToProcess[] = [
                    'product_id' => $cartItem->product_id,
                    'variant_id' => $cartItem->product_variant_id,
                    'size' => $cartItem->size,
                    'quantity' => (int) $cartItem->quantity,
                    'package_breakdown' => $cartItem->package_breakdown,
                ];
            }
        } elseif ($request->filled('items') && is_array($request->input('items'))) {
            foreach ($request->input('items') as $rawItem) {
                $itemsToProcess[] = [
                    'product_id' => $rawItem['product_id'] ?? $rawItem['productId'] ?? null,
                    'variant_id' => $rawItem['variant_id'] ?? $rawItem['variantId'] ?? null,
                    'size' => $rawItem['size'] ?? 'One Size',
                    'quantity' => (int) ($rawItem['quantity'] ?? 1),
                    'package_breakdown' => $rawItem['package_breakdown'] ?? $rawItem['packageBreakdown'] ?? null,
                ];
            }
        }

        if (empty($itemsToProcess)) {
            return $this->error('Your cart is empty. Please add items before placing an order.', 422);
        }

        $paymentMethod = $request->input('payment_method', 'card');

        // B2B Payment Terms Verification (Net 30 / Net 60 / Terms)
        $isTerms = in_array($paymentMethod, ['net_30', 'net_60', 'terms']);
        if ($isTerms) {
            if (!$user || !$user->isB2bBuyer() || $user->b2b_approval_status !== 'approved' || empty($user->b2b_payment_terms) || $user->b2b_payment_terms === 'none') {
                return $this->forbidden('Commercial payment terms (Net 30 / Net 60) are restricted to approved B2B wholesale accounts.');
            }
        }

        $email = $request->input('email');
        $shippingName = $request->input('shipping_name');
        $shippingPhone = $request->input('shipping_phone');
        $shippingAddress1 = $request->input('shipping_address1');
        $shippingAddress2 = $request->input('shipping_address2');
        $shippingCity = $request->input('shipping_city');
        $shippingRegion = $request->input('shipping_region');
        $shippingPostalCode = $request->input('shipping_postal_code');
        $shippingCountryCode = $request->input('shipping_country_code', 'US');
        $notes = $request->input('notes');

        $shippingMethodReq = $request->input('shipping_method');
        $carrierReq = $request->input('carrier', 'Aramex');
        $shippingCostReq = $request->input('shipping_cost');
        $shippingQuoteIdReq = $request->input('shipping_quote_id');
        $shippingSnapshotReq = $request->input('shipping_snapshot');
        $otherChargesReq = (float) $request->input('other_charges', 0.0);

        // 2. Execute Order Creation in a Database Transaction
        try {
            $order = DB::transaction(function () use (
                $itemsToProcess,
                $user,
                $activeCart,
                $paymentMethod,
                $isTerms,
                $email,
                $shippingName,
                $shippingPhone,
                $shippingAddress1,
                $shippingAddress2,
                $shippingCity,
                $shippingRegion,
                $shippingPostalCode,
                $shippingCountryCode,
                $notes,
                $shippingMethodReq,
                $carrierReq,
                $shippingCostReq,
                $shippingQuoteIdReq,
                $shippingSnapshotReq,
                $otherChargesReq
            ) {
                $validatedLines = [];
                $subtotal = 0.0;
                $isB2b = $user && ($user->isB2bBuyer() || $user->isAdmin());

                // Re-validate and lock stock for each item
                foreach ($itemsToProcess as $item) {
                    $productId = $item['product_id'];
                    $variantId = $item['variant_id'];
                    $size = $item['size'];
                    $quantity = $item['quantity'];
                    $packageBreakdown = $item['package_breakdown'];

                    $product = Product::with(['images', 'brand', 'pricingTiers', 'packageAllocations', 'variants', 'shippingPackageProfiles'])->find($productId);
                    if (!$product || $product->status !== 'published') {
                        throw new \Exception("Product '{$product?->name}' is currently unavailable.", 422);
                    }

                    $totalStock = (int) $product->variants->sum('stock');

                    // Server-Side MOQ and Increment Enforcement
                    if ($product->moq > 1) {
                        if ($quantity < $product->moq) {
                            throw new \Exception("Minimum order quantity (MOQ) for '{$product->name}' is {$product->moq} pcs.", 422);
                        }
                        if ($quantity % $product->moq !== 0 && $quantity !== $totalStock) {
                            throw new \Exception("Quantity for '{$product->name}' must be a multiple of {$product->moq} or exactly full stock ({$totalStock}).", 422);
                        }
                    }

                    if ($quantity > $totalStock) {
                        throw new \Exception("Insufficient stock for '{$product->name}' (Requested: {$quantity}, Available: {$totalStock}).", 422);
                    }

                    // Resolve variant ID if single size provided
                    if (!$variantId && !empty($size) && $size !== 'Assorted') {
                        $vMatch = ProductVariant::where('product_id', $product->id)->where('size', $size)->first();
                        if ($vMatch) {
                            $variantId = $vMatch->id;
                        }
                    }

                    $packageBreakdown = null;
                    $lockedVariants = [];

                    if ($variantId) {
                        // Single Variant Purchase
                        $variant = ProductVariant::where('id', $variantId)->lockForUpdate()->first();
                        if (!$variant || $variant->stock < $quantity) {
                            $av = $variant ? $variant->stock : 0;
                            throw new \Exception("Insufficient stock for '{$product->name}' size {$size} (Requested: {$quantity}, Available: {$av}).", 422);
                        }
                        $lockedVariants[] = [
                            'variant' => $variant,
                            'deduct_qty' => $quantity,
                        ];
                    } else {
                        // Wholesale Package Assortment Purchase
                        $isFullStock = ($quantity === $totalStock && $totalStock > 0);
                        $packageBreakdown = $product->getPackageBreakdownForQuantity($quantity, $isFullStock);
                        if (is_array($packageBreakdown) && count($packageBreakdown) > 0) {
                            foreach ($packageBreakdown as $bd) {
                                $vId = $bd['product_variant_id'] ?? null;
                                $qtyToDeduct = (int) ($bd['quantity'] ?? 0);
                                
                                if ($vId && $qtyToDeduct > 0) {
                                    $variant = ProductVariant::where('id', $vId)->lockForUpdate()->first();
                                    if (!$variant || $variant->stock < $qtyToDeduct) {
                                        $av = $variant ? $variant->stock : 0;
                                        $sizeLabel = $bd['size'] ?? '';
                                        throw new \Exception("Insufficient stock for '{$product->name}' size {$sizeLabel} (Requested: {$qtyToDeduct}, Available: {$av}).", 422);
                                    }
                                    $lockedVariants[] = [
                                        'variant' => $variant,
                                        'deduct_qty' => $qtyToDeduct
                                    ];
                                }
                            }
                        }
                    }

                    // Strict Server-Side Tiered Pricing Resolution (USD)
                    $unitPrice = $product->getUnitPriceForQuantity($quantity);

                    $lineTotal = round($unitPrice * $quantity, 2);
                    $subtotal += $lineTotal;

                    $image = $product->images->first()?->image_url ?: '/placeholder.jpg';

                    $validatedLines[] = [
                        'product_id' => $product->id,
                        'product' => $product,
                        'product_variant_id' => $variantId,
                        'product_name' => $product->name,
                        'product_slug' => $product->slug,
                        'sku' => $product->sku,
                        'variant_title' => $size ? "Size: {$size}" : null,
                        'size' => $size,
                        'color' => $product->color_name,
                        'product_image_url' => $image,
                        'unit_price' => $unitPrice,
                        'quantity' => $quantity,
                        'line_total' => $lineTotal,
                        'package_breakdown' => $packageBreakdown,
                        'locked_variants' => $lockedVariants,
                    ];
                }

                // Authoritative Calculations (USD)
                $shippingCost = $shippingCostReq !== null
                    ? (float) $shippingCostReq
                    : ($subtotal > 150 ? 0.00 : 15.00);
                
                $taxAmount = round($subtotal * 0.05, 2);
                $otherCharges = max(0.0, (float) $otherChargesReq);
                $totalAmount = round($subtotal + $shippingCost + $taxAmount + $otherCharges, 2);

                // Build Immutable Physical Shipping Snapshot
                $totalCartons = 0;
                $totalGrossWeight = 0.0;
                $totalNetWeight = 0.0;
                $totalCbm = 0.0;
                $primaryDims = ['length' => 60, 'width' => 40, 'height' => 30, 'unit' => 'cm'];

                if (is_array($shippingSnapshotReq) && !empty($shippingSnapshotReq)) {
                    $totalCartons = (int) ($shippingSnapshotReq['carton_count'] ?? 1);
                    $totalGrossWeight = (float) ($shippingSnapshotReq['gross_weight'] ?? 10.0);
                    $totalNetWeight = isset($shippingSnapshotReq['net_weight']) ? (float) $shippingSnapshotReq['net_weight'] : null;
                    $totalCbm = (float) ($shippingSnapshotReq['cbm'] ?? $shippingSnapshotReq['total_cbm'] ?? 0.072);
                    $primaryDims = $shippingSnapshotReq['carton_dimensions'] ?? $primaryDims;
                } else {
                    // Compute automatically from product shipping package profiles
                    foreach ($validatedLines as $vl) {
                        $p = $vl['product'];
                        $specs = $p->calculateShipmentSpecsForQuantity($vl['quantity']);
                        if ($specs['status'] === 'available') {
                            $totalCartons += (int) ($specs['carton_count'] ?? 1);
                            $totalGrossWeight += (float) ($specs['gross_weight'] ?? 0);
                            $totalNetWeight += (float) ($specs['net_weight'] ?? 0);
                            $totalCbm += (float) ($specs['total_cbm'] ?? 0);
                            $primaryDims = $specs['carton_dimensions'] ?? $primaryDims;
                        } else {
                            $totalCartons += 1;
                            $totalGrossWeight += round(($vl['quantity'] * ($p->weight_grams ?: 250)) / 1000, 2);
                            $totalCbm += round(0.06 * 0.04 * 0.03, 4);
                        }
                    }
                }

                $carrierName = $carrierReq ?: ($shippingSnapshotReq['carrier'] ?? 'Aramex');
                $shippingMethodName = $shippingMethodReq ?: ($shippingSnapshotReq['shipping_method'] ?? 'Aramex Priority Parcel Express (PPX)');

                $immutableShippingSnapshot = [
                    'shipping_method' => $shippingMethodName,
                    'carrier' => $carrierName,
                    'quoted_shipping_charge' => $shippingCost,
                    'currency' => 'USD',
                    'destination' => [
                        'name' => $shippingName,
                        'phone' => $shippingPhone,
                        'email' => $email,
                        'address1' => $shippingAddress1,
                        'address2' => $shippingAddress2,
                        'city' => $shippingCity,
                        'region' => $shippingRegion,
                        'postal_code' => $shippingPostalCode,
                        'country_code' => $shippingCountryCode,
                    ],
                    'package_quantity' => array_sum(array_column($validatedLines, 'quantity')),
                    'carton_count' => max(1, $totalCartons),
                    'carton_dimensions' => $primaryDims,
                    'gross_weight' => round(max(0.5, $totalGrossWeight), 2),
                    'net_weight' => $totalNetWeight > 0 ? round($totalNetWeight, 2) : null,
                    'weight_unit' => $shippingSnapshotReq['weight_unit'] ?? 'kg',
                    'cbm' => round(max(0.001, $totalCbm), 4),
                    'total_cbm' => round(max(0.001, $totalCbm), 4),
                    'chargeable_weight' => round(max(0.5, $totalGrossWeight), 2),
                    'quote_reference_id' => $shippingQuoteIdReq ?? ($shippingSnapshotReq['quote_reference_id'] ?? null),
                    'quoted_at' => now()->toIso8601String(),
                    'is_provisional' => (bool) ($shippingSnapshotReq['is_provisional'] ?? false),
                    'notes' => $shippingSnapshotReq['notes'] ?? "{$totalCartons} Master Export Carton(s)",
                ];

                // Generate Unique Order Number
                do {
                    $orderNumber = 'AYN-' . date('Ymd') . '-' . strtoupper(Str::random(6));
                } while (Order::where('order_number', $orderNumber)->exists());

                // Determine initial payment status
                $isPaid = $paymentMethod === 'card';
                $paymentStatus = $isPaid ? 'paid' : 'pending';
                $orderStatus = ($isPaid || $isTerms) ? 'processing' : 'pending';

                // Create Order
                $createdOrder = Order::create([
                    'order_number' => $orderNumber,
                    'user_id' => $user?->id,
                    'status' => $orderStatus,
                    'payment_status' => $paymentStatus,
                    'fulfillment_status' => 'unfulfilled',
                    'currency' => 'USD',
                    'subtotal' => $subtotal,
                    'shipping_cost' => $shippingCost,
                    'tax_amount' => $taxAmount,
                    'other_charges' => $otherCharges,
                    'discount_amount' => 0.00,
                    'total_amount' => $totalAmount,
                    'email' => $email,
                    'shipping_name' => $shippingName,
                    'shipping_phone' => $shippingPhone,
                    'shipping_address1' => $shippingAddress1,
                    'shipping_address2' => $shippingAddress2,
                    'shipping_city' => $shippingCity,
                    'shipping_region' => $shippingRegion,
                    'shipping_postal_code' => $shippingPostalCode,
                    'shipping_country_code' => $shippingCountryCode,
                    'shipping_method' => $shippingMethodName,
                    'carrier' => $carrierName,
                    'shipping_quote_id' => $shippingQuoteIdReq,
                    'shipping_snapshot' => $immutableShippingSnapshot,
                    'payment_method' => $paymentMethod,
                    'notes' => $notes,
                    'placed_at' => now(),
                ]);


                // Create Order Items and Decrement Inventory
                foreach ($validatedLines as $line) {
                    OrderItem::create([
                        'order_id' => $createdOrder->id,
                        'product_id' => $line['product_id'],
                        'product_variant_id' => $line['product_variant_id'],
                        'product_name' => $line['product_name'],
                        'product_slug' => $line['product_slug'],
                        'sku' => $line['sku'],
                        'variant_title' => $line['variant_title'],
                        'size' => $line['size'],
                        'color' => $line['color'],
                        'product_image_url' => $line['product_image_url'],
                        'unit_price' => $line['unit_price'],
                        'quantity' => $line['quantity'],
                        'line_total' => $line['line_total'],
                        'package_breakdown' => $line['package_breakdown'],
                    ]);

                    // Decrement variant stock
                    foreach ($line['locked_variants'] as $lv) {
                        $lv['variant']->decrement('stock', $lv['deduct_qty']);
                    }
                }

                // Create Payment Record
                Payment::create([
                    'order_id' => $createdOrder->id,
                    'transaction_id' => 'txn_' . strtolower(Str::random(16)),
                    'provider' => $paymentMethod,
                    'amount' => $totalAmount,
                    'currency' => 'USD',
                    'status' => $isPaid ? 'succeeded' : 'pending',
                ]);

                // Record Timeline Events
                OrderStatusEvent::create([
                    'order_id' => $createdOrder->id,
                    'user_id' => $user?->id,
                    'event_type' => 'order_placed',
                    'message' => "Order #{$orderNumber} placed successfully.",
                ]);

                if ($isPaid) {
                    OrderStatusEvent::create([
                        'order_id' => $createdOrder->id,
                        'user_id' => $user?->id,
                        'event_type' => 'payment_succeeded',
                        'message' => "Payment of \${$totalAmount} processed successfully.",
                    ]);
                } elseif ($isTerms) {
                    OrderStatusEvent::create([
                        'order_id' => $createdOrder->id,
                        'user_id' => $user?->id,
                        'event_type' => 'payment_terms_approved',
                        'message' => "Commercial credit terms ({$paymentMethod}) approved for B2B order. Processing initiated.",
                    ]);
                }


                // Clear Active Cart
                if ($activeCart) {
                    $activeCart->items()->delete();
                }

                return $createdOrder;
            });

            $order->load(['items', 'statusEvents', 'payments']);

            return $this->success(new OrderResource($order), 'Order placed successfully', 201);
        } catch (\Exception $e) {
            $status = $e->getCode() >= 400 && $e->getCode() < 500 ? $e->getCode() : 422;
            return $this->error($e->getMessage(), $status);
        }
    }

    /**
     * POST /api/v1/orders/{id}/cancel
     */
    public function cancel(Request $request, int|string $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->unauthorized();
        }

        $order = Order::with('items')->where(function ($q) use ($id) {
            if (is_numeric($id)) {
                $q->where('id', (int) $id);
            } else {
                $q->where('order_number', $id);
            }
        })->first();

        if (!$order) {
            return $this->notFound('Order not found');
        }

        if ($order->user_id !== $user->id && $user->role !== 'admin') {
            return $this->forbidden('You cannot cancel this order');
        }

        if (in_array($order->status, ['cancelled', 'delivered', 'shipped'])) {
            return $this->error("Cannot cancel an order with status '{$order->status}'", 422);
        }

        $reason = $request->input('reason', 'Buyer requested cancellation');

        DB::transaction(function () use ($order, $user, $reason) {
            $order->update(['status' => 'cancelled']);

            // Restore variant inventory
            foreach ($order->items as $item) {
                $breakdown = is_string($item->package_breakdown) ? json_decode($item->package_breakdown, true) : $item->package_breakdown;
                if (!empty($breakdown) && is_array($breakdown)) {
                    foreach ($breakdown as $bd) {
                        $vId = $bd['product_variant_id'] ?? null;
                        $qtyToRestore = (int) ($bd['quantity'] ?? 0);
                        if ($vId && $qtyToRestore > 0) {
                            ProductVariant::where('id', $vId)->increment('stock', $qtyToRestore);
                        }
                    }
                } else if ($item->product_variant_id) {
                    ProductVariant::where('id', $item->product_variant_id)->increment('stock', $item->quantity);
                }
            }

            OrderStatusEvent::create([
                'order_id' => $order->id,
                'user_id' => $user->id,
                'event_type' => 'order_cancelled',
                'message' => "Order cancelled: {$reason}",
            ]);
        });

        $order->load(['items', 'statusEvents', 'payments']);

        return $this->success(new OrderResource($order), 'Order cancelled successfully');
    }

    /**
     * POST /api/v1/orders/{id}/payment-proof
     */
    public function uploadPaymentProof(Request $request, int|string $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->unauthorized();
        }

        $order = Order::where(function ($q) use ($id) {
            if (is_numeric($id)) {
                $q->where('id', (int) $id);
            } else {
                $q->where('order_number', $id);
            }
        })->first();

        if (!$order) {
            return $this->notFound('Order not found');
        }

        if ($order->user_id !== $user->id && $user->role !== 'admin') {
            return $this->forbidden();
        }

        $request->validate([
            'receipt' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:10240'],
        ]);

        $path = $request->file('receipt')->store('order-receipts', 'public');
        $url = asset('storage/' . $path);

        $order->update(['payment_proof_url' => $url]);

        OrderStatusEvent::create([
            'order_id' => $order->id,
            'user_id' => $user->id,
            'event_type' => 'payment_proof_uploaded',
            'message' => 'Buyer attached payment verification proof.',
        ]);

        $order->load(['items', 'statusEvents', 'payments']);

        return $this->success(new OrderResource($order), 'Payment receipt uploaded successfully');
    }

    /**
     * GET /api/v1/orders/{id}/documents/{docType}
     * Generate official commercial document (PI, Order Sheet, Commercial Invoice, Packing List)
     * strictly from the immutable order and shipping snapshot.
     */
    public function document(Request $request, int|string $id, string $docType): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->unauthorized('Unauthenticated.');
        }

        $query = Order::with(['items', 'user', 'payments']);
        if (is_numeric($id)) {
            $order = $query->where('id', (int) $id)->first();
        } else {
            $order = $query->where('order_number', $id)->first();
        }

        if (!$order) {
            return $this->notFound('Order not found');
        }

        // Enforce access control: customer owner or admin
        if ($order->user_id !== null && $order->user_id !== $user->id && $user->role !== 'admin') {
            return $this->forbidden('You are not authorized to view commercial documents for this order');
        }

        $normalizedType = strtoupper(trim($docType));

        // Payment Gating: Commercial Invoice and Packing List require verified payment
        $isPaid = in_array($order->payment_status, ['paid'])
            || in_array($order->status, ['processing', 'shipped', 'delivered', 'confirmed'])
            || in_array($order->payment_method, ['net_30', 'net_60', 'terms']);

        $isAdmin = $user && $user->role === 'admin';

        if (in_array($normalizedType, ['COMMERCIAL_INVOICE', 'PACKING_LIST']) && !$isPaid && !$isAdmin) {
            return response()->json([
                'success' => false,
                'is_gated' => true,
                'message' => "Commercial Invoice and Packing List are generated exclusively upon payment confirmation. Please complete payment or view your Proforma Invoice (PI) / Commercial Order Sheet.",
                'data' => [
                    'order_id' => (string) $order->id,
                    'order_number' => $order->order_number,
                    'payment_status' => $order->payment_status,
                    'available_documents' => ['PROFORMA_INVOICE', 'ORDER_SHEET'],
                ],
            ], 403);
        }

        $docPayload = $order->getCommercialDocument($docType);

        return $this->success($docPayload, "Commercial document '{$docType}' generated successfully");
    }

    /**
     * GET /api/v1/orders/{id}/tracking
     * Get live carrier tracking status from Aramex or stored tracking timeline.
     */
    public function tracking(Request $request, int|string $id, \App\Services\Shipping\AramexShippingService $aramexService): JsonResponse
    {
        $user = $request->user();

        $query = Order::with(['statusEvents']);
        if (is_numeric($id)) {
            $order = $query->where('id', (int) $id)->first();
        } else {
            $order = $query->where('order_number', $id)->first();
        }

        if (!$order) {
            return $this->notFound('Order not found');
        }

        if ($user && $order->user_id !== null && $order->user_id !== $user->id && $user->role !== 'admin') {
            return $this->forbidden('You are not authorized to view tracking for this order');
        }

        if (empty($order->tracking_number)) {
            return $this->success([
                'order_number' => $order->order_number,
                'carrier' => $order->carrier ?: 'Aramex',
                'fulfillment_status' => $order->fulfillment_status ?: 'unfulfilled',
                'tracking_number' => null,
                'carrier_status' => 'Pending Dispatch',
                'events' => [],
                'direct_tracking_url' => null,
            ], 'Order has not been shipped yet');
        }

        // Try live Aramex tracking if AWB exists
        try {
            $liveData = $aramexService->trackShipment($order->tracking_number, $order);
            return $this->success($liveData, 'Live carrier tracking retrieved');
        } catch (\Throwable $e) {
            // Fallback to order snapshot status
            return $this->success([
                'order_number' => $order->order_number,
                'carrier' => $order->carrier ?: 'Aramex',
                'tracking_number' => $order->tracking_number,
                'carrier_status' => $order->carrier_status ?: 'Shipment Created',
                'direct_tracking_url' => $order->getDirectTrackingUrl(),
                'events' => [
                    [
                        'status' => $order->carrier_status ?: 'Shipment Created',
                        'location' => 'Dhaka Hub, Bangladesh',
                        'timestamp' => $order->last_carrier_update?->toISOString() ?: $order->updated_at?->toISOString(),
                        'comments' => 'Shipment registered with Aramex.',
                    ],
                ],
                'notice' => 'Carrier live update currently unavailable; showing last recorded milestone.',
            ], 'Recorded tracking status retrieved');
        }
    }
}
