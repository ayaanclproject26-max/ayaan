<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Cart\AddCartItemRequest;
use App\Http\Requests\Cart\UpdateCartItemRequest;
use App\Http\Resources\Api\V1\CartResource;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends ApiController
{
    /**
     * Helper to get or create active cart for user or guest
     */
    protected function getActiveCart(Request $request): Cart
    {
        $user = $request->user('sanctum') ?? $request->user();

        if ($user) {
            return Cart::firstOrCreate(
                ['user_id' => $user->id, 'status' => 'active'],
                ['session_id' => null]
            );
        }

        $sessionId = (string) ($request->header('X-Session-Id') ?? $request->input('session_id') ?? session()->getId());
        
        if (empty($sessionId)) {
            $sessionId = 'sess_' . bin2hex(random_bytes(16));
        }

        return Cart::firstOrCreate(
            ['session_id' => $sessionId, 'status' => 'active'],
            ['user_id' => null]
        );
    }

    /**
     * GET /api/v1/cart
     */
    public function index(Request $request): JsonResponse
    {
        $cart = $this->getActiveCart($request);
        $cart->load(['items.product.images', 'items.product.brand', 'items.variant']);

        return $this->success(new CartResource($cart), 'Cart retrieved successfully');
    }

    /**
     * POST /api/v1/cart or POST /api/v1/cart/items
     */
    public function addItem(AddCartItemRequest $request): JsonResponse
    {
        $cart = $this->getActiveCart($request);

        $productId = (int) $request->input('product_id');
        $size = trim((string) $request->input('size'));
        $quantity = (int) $request->input('quantity', 1);
        $variantId = $request->input('variant_id') ?? $request->input('product_variant_id');

        $product = Product::with(['variants', 'pricingTiers', 'packageAllocations'])->findOrFail($productId);

        if ($product->status !== 'published') {
            return $this->error('This product is currently unavailable', 422);
        }

        // Resolve variant if specific size provided
        $variant = null;
        if ($variantId) {
            $variant = ProductVariant::where('product_id', $productId)->where('id', (int) $variantId)->first();
        }
        if (!$variant && !empty($size) && $size !== 'Assorted') {
            $variant = ProductVariant::where('product_id', $productId)->where('size', $size)->first();
        }

        $availableStock = $variant ? (int) $variant->stock : (int) $product->variants->sum('stock');
        if ($availableStock <= 0) {
            return $this->error('This item is currently out of stock', 422);
        }

        // Check if item already exists in cart
        $cartItemQuery = $cart->items()->where('product_id', $productId);
        if ($variant) {
            $cartItemQuery->where('size', $variant->size);
        } elseif (!empty($size)) {
            $cartItemQuery->where('size', $size);
        }
        $cartItem = $cartItemQuery->first();

        $newQuantity = $cartItem ? ($cartItem->quantity + $quantity) : $quantity;

        // Server-Side MOQ and Increment Enforcement
        if ($product->moq > 1) {
            if ($newQuantity < $product->moq) {
                return $this->error("Minimum order quantity (MOQ) for '{$product->name}' is {$product->moq} units.", 422);
            }
            if (!$variant || $product->packageAllocations->isNotEmpty()) {
                if ($newQuantity % $product->moq !== 0 && $newQuantity !== $availableStock) {
                    return $this->error("Order quantity for '{$product->name}' must be an increment of {$product->moq} units or full stock ({$availableStock} units).", 422);
                }
            }
        }

        if ($newQuantity > $availableStock) {
            return $this->error("Requested quantity ({$newQuantity}) exceeds available stock ({$availableStock})", 422);
        }

        // Generate automatic package allocation breakdown
        $packageBreakdown = $product->getPackageBreakdownForQuantity($newQuantity);

        if ($cartItem) {
            $cartItem->update([
                'quantity' => $newQuantity,
                'package_breakdown' => $packageBreakdown,
                'product_variant_id' => $variant ? $variant->id : $cartItem->product_variant_id,
                'size' => $variant ? $variant->size : ($size ?: ($cartItem->size ?: 'Assorted')),
            ]);
        } else {
            $cart->items()->create([
                'product_id' => $productId,
                'product_variant_id' => $variant ? $variant->id : null,
                'size' => $variant ? $variant->size : ($size ?: 'Assorted'),
                'quantity' => $newQuantity,
                'package_breakdown' => $packageBreakdown,
            ]);
        }

        $cart->load(['items.product.images', 'items.product.brand', 'items.variant']);

        return $this->success(new CartResource($cart), 'Item added to cart', 200);
    }

    /**
     * PUT /api/v1/cart/{itemId} or PUT /api/v1/cart/items
     */
    public function updateItem(UpdateCartItemRequest $request, ?string $itemId = null): JsonResponse
    {
        $cart = $this->getActiveCart($request);
        $quantity = (int) $request->input('quantity');

        // Locate item
        $cartItem = null;
        if ($itemId && is_numeric($itemId)) {
            $cartItem = $cart->items()->where('id', (int) $itemId)->first();
        } elseif ($request->filled('item_id')) {
            $cartItem = $cart->items()->where('id', (int) $request->input('item_id'))->first();
        } elseif ($request->filled('product_id') && $request->filled('size')) {
            $cartItem = $cart->items()
                ->where('product_id', (int) $request->input('product_id'))
                ->where('size', (string) $request->input('size'))
                ->first();
        } elseif ($request->filled('product_id')) {
            $cartItem = $cart->items()
                ->where('product_id', (int) $request->input('product_id'))
                ->first();
        }

        if (!$cartItem) {
            return $this->notFound('Cart item not found');
        }

        if ($quantity <= 0) {
            $cartItem->delete();
        } else {
            // Stock & MOQ verification
            $product = $cartItem->product()->with(['variants', 'pricingTiers', 'packageAllocations'])->first();
            $variant = $cartItem->variant;
            
            if ($product) {
                $availableStock = $variant ? (int) $variant->stock : (int) $product->variants->sum('stock');
                
                if ($product->moq > 1) {
                    if ($quantity < $product->moq) {
                        return $this->error("Minimum order quantity (MOQ) for '{$product->name}' is {$product->moq} units.", 422);
                    }
                    if (!$variant || $product->packageAllocations->isNotEmpty()) {
                        if ($quantity % $product->moq !== 0 && $quantity !== $availableStock) {
                            return $this->error("Order quantity for '{$product->name}' must be an increment of {$product->moq} units or full stock ({$availableStock} units).", 422);
                        }
                    }
                }

                if ($quantity > $availableStock) {
                    return $this->error("Requested quantity ({$quantity}) exceeds available stock ({$availableStock})", 422);
                }

                $packageBreakdown = $product->getPackageBreakdownForQuantity($quantity);
                $cartItem->update([
                    'quantity' => $quantity,
                    'package_breakdown' => $packageBreakdown,
                ]);
            } else {
                $cartItem->update(['quantity' => $quantity]);
            }
        }

        $cart->load(['items.product.images', 'items.product.brand', 'items.variant']);

        return $this->success(new CartResource($cart), 'Cart updated successfully');
    }

    /**
     * DELETE /api/v1/cart/{itemId} or DELETE /api/v1/cart/items
     */
    public function removeItem(Request $request, ?string $itemId = null): JsonResponse
    {
        $cart = $this->getActiveCart($request);

        $cartItem = null;
        if ($itemId && is_numeric($itemId)) {
            $cartItem = $cart->items()->where('id', (int) $itemId)->first();
        } elseif ($request->filled('item_id')) {
            $cartItem = $cart->items()->where('id', (int) $request->input('item_id'))->first();
        } else {
            $productId = $request->query('product_id', $request->input('product_id'));
            $size = $request->query('size', $request->input('size'));

            if ($productId && $size) {
                $cartItem = $cart->items()
                    ->where('product_id', (int) $productId)
                    ->where('size', (string) $size)
                    ->first();
            }
        }

        if ($cartItem) {
            $cartItem->delete();
        }

        $cart->load(['items.product.images', 'items.product.brand', 'items.variant']);

        return $this->success(new CartResource($cart), 'Item removed from cart');
    }

    /**
     * DELETE /api/v1/cart
     */
    public function clear(Request $request): JsonResponse
    {
        $cart = $this->getActiveCart($request);
        $cart->items()->delete();
        $cart->load(['items.product.images', 'items.product.brand', 'items.variant']);

        return $this->success(new CartResource($cart), 'Cart cleared successfully');
    }

    /**
     * POST /api/v1/cart/merge
     * Merges guest session cart into authenticated user cart
     */
    public function merge(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->unauthorized('Authentication required to merge cart');
        }

        $sessionId = (string) ($request->input('session_id') ?? $request->header('X-Session-Id') ?? '');
        
        $userCart = Cart::firstOrCreate(
            ['user_id' => $user->id, 'status' => 'active']
        );

        if (!empty($sessionId)) {
            $guestCart = Cart::where('session_id', $sessionId)
                ->where('status', 'active')
                ->whereNull('user_id')
                ->with('items.variant', 'items.product.variants')
                ->first();

            if ($guestCart && $guestCart->items->isNotEmpty()) {
                foreach ($guestCart->items as $guestItem) {
                    $availableStock = $guestItem->variant 
                        ? (int) $guestItem->variant->stock 
                        : (int) ($guestItem->product ? $guestItem->product->variants->sum('stock') : 9999);

                    $existing = $userCart->items()
                        ->where('product_id', $guestItem->product_id)
                        ->where('size', $guestItem->size)
                        ->first();

                    if ($existing) {
                        $combinedQty = min($availableStock, $existing->quantity + $guestItem->quantity);
                        $existing->update([
                            'quantity' => $combinedQty,
                            'product_variant_id' => $guestItem->product_variant_id ?: $existing->product_variant_id,
                        ]);
                    } else {
                        $userCart->items()->create([
                            'product_id' => $guestItem->product_id,
                            'product_variant_id' => $guestItem->product_variant_id,
                            'size' => $guestItem->size,
                            'quantity' => min($availableStock, $guestItem->quantity),
                        ]);
                    }
                }

                $guestCart->update(['status' => 'merged']);
            }
        }

        $userCart->load(['items.product.images', 'items.product.brand', 'items.variant']);

        return $this->success(new CartResource($userCart), 'Cart merged successfully');
    }
}
