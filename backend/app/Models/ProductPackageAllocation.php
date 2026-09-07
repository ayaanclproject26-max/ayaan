<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductPackageAllocation extends Model
{
    protected $fillable = [
        'product_id',
        'product_variant_id',
        'quantity',
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}
