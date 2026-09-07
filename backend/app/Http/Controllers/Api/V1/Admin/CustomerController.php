<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\ApiController;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends ApiController
{
    /**
     * GET /api/v1/admin/customers
     * List customers and B2B buyers with server-side search, filtering and stats.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::withCount(['orders', 'quotes'])
            ->withSum(['orders as total_spent' => function ($q) {
                $q->where('payment_status', 'paid')->orWhere('status', 'delivered');
            }], 'total_amount');

        // Search by name, email, phone, or company
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%")
                  ->orWhere('phone', 'ilike', "%{$search}%")
                  ->orWhere('company_name', 'ilike', "%{$search}%");
            });
        }

        // Filter by role
        if ($request->filled('role')) {
            $query->where('role', $request->input('role'));
        }

        // Sorting
        $sort = $request->input('sort', 'created_at');
        $direction = $request->input('direction', 'desc');
        if (in_array($sort, ['name', 'email', 'created_at', 'orders_count', 'total_spent'])) {
            $query->orderBy($sort, $direction === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = min((int) $request->input('per_page', 20), 100);
        $customers = $query->paginate($perPage);

        // Transform collection to ensure sensitive fields are strictly stripped
        $customers->getCollection()->transform(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'company_name' => $user->company_name,
                'tax_id' => $user->tax_id,
                'b2b_approval_status' => $user->b2b_approval_status,
                'b2b_payment_terms' => $user->b2b_payment_terms,
                'b2b_credit_limit' => (float) ($user->b2b_credit_limit ?? 0),
                'avatar_url' => $user->avatar_url,
                'orders_count' => (int) $user->orders_count,
                'quotes_count' => (int) $user->quotes_count,
                'total_spent' => round((float) ($user->total_spent ?? 0), 2),
                'created_at' => $user->created_at?->toISOString(),
            ];
        });

        return $this->success($customers, 'Customers retrieved successfully');
    }

    /**
     * GET /api/v1/admin/customers/{id}
     * Retrieve single customer details with addresses and order history.
     */
    public function show(int $id): JsonResponse
    {
        $user = User::with([
            'addresses',
            'orders' => function ($q) {
                $q->orderBy('created_at', 'desc')->limit(10);
            },
            'quotes' => function ($q) {
                $q->orderBy('created_at', 'desc')->limit(10);
            }
        ])
        ->withCount(['orders', 'quotes'])
        ->withSum(['orders as total_spent' => function ($q) {
            $q->where('payment_status', 'paid')->orWhere('status', 'delivered');
        }], 'total_amount')
        ->find($id);

        if (!$user) {
            return $this->notFound('Customer not found');
        }

        $data = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'phone' => $user->phone,
            'company_name' => $user->company_name,
            'tax_id' => $user->tax_id,
            'b2b_approval_status' => $user->b2b_approval_status,
            'b2b_payment_terms' => $user->b2b_payment_terms,
            'b2b_credit_limit' => (float) ($user->b2b_credit_limit ?? 0),
            'avatar_url' => $user->avatar_url,
            'orders_count' => (int) $user->orders_count,
            'quotes_count' => (int) $user->quotes_count,
            'total_spent' => round((float) ($user->total_spent ?? 0), 2),
            'addresses' => $user->addresses,
            'recent_orders' => $user->orders,
            'recent_quotes' => $user->quotes,
            'created_at' => $user->created_at?->toISOString(),
            'updated_at' => $user->updated_at?->toISOString(),
        ];

        return $this->success($data, 'Customer details retrieved');
    }

    /**
     * PUT /api/v1/admin/customers/{id}
     * Update customer details or role.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'unique:users,email,' . $id],
            'phone' => ['nullable', 'string', 'max:50'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'tax_id' => ['nullable', 'string', 'max:100'],
            'b2b_approval_status' => ['sometimes', 'string', 'in:pending,approved,rejected'],
            'b2b_payment_terms' => ['nullable', 'string', 'in:none,net_30,net_60,terms'],
            'b2b_credit_limit' => ['nullable', 'numeric', 'min:0'],
            'role' => ['sometimes', 'string', 'in:customer,b2b_buyer,admin,sales'],
        ]);

        $user->update($validated);

        return $this->success([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'phone' => $user->phone,
            'company_name' => $user->company_name,
            'tax_id' => $user->tax_id,
            'b2b_approval_status' => $user->b2b_approval_status,
            'b2b_payment_terms' => $user->b2b_payment_terms,
            'b2b_credit_limit' => (float) ($user->b2b_credit_limit ?? 0),
            'updated_at' => $user->updated_at?->toISOString(),
        ], 'Customer updated successfully');
    }

}
