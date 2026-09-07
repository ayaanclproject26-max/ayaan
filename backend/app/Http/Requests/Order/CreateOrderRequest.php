<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class CreateOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:255'],
            'shipping_name' => ['required', 'string', 'max:255'],
            'shipping_phone' => ['nullable', 'string', 'max:50'],
            'shipping_address1' => ['required', 'string', 'max:255'],
            'shipping_address2' => ['nullable', 'string', 'max:255'],
            'shipping_city' => ['required', 'string', 'max:100'],
            'shipping_region' => ['nullable', 'string', 'max:100'],
            'shipping_postal_code' => ['required', 'string', 'max:30'],
            'shipping_country_code' => ['nullable', 'string', 'max:10'],
            'payment_method' => ['nullable', 'string', 'in:card,transfer,bank_transfer,cod,net_30,net_60,terms'],

            'shipping_method' => ['nullable', 'string', 'max:100'],
            'carrier' => ['nullable', 'string', 'max:100'],
            'shipping_cost' => ['nullable', 'numeric', 'min:0'],
            'shipping_quote_id' => ['nullable', 'string', 'max:100'],
            'shipping_snapshot' => ['nullable', 'array'],
            'other_charges' => ['nullable', 'numeric', 'min:0'],

            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['nullable', 'array'],
            'items.*.product_id' => ['nullable', 'exists:products,id'],
            'items.*.variant_id' => ['nullable', 'exists:product_variants,id'],
            'items.*.size' => ['nullable', 'string'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
