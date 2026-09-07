<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quote extends Model
{
    use HasFactory;

    protected $fillable = [
        'rfq_number',
        'user_id',
        'buyer_name',
        'buyer_email',
        'buyer_phone',
        'company_name',
        'business_type',
        'website',
        'tax_number',
        'destination_country',
        'destination_city',
        'shipping_port',
        'target_delivery_date',
        'request_title',
        'general_notes',
        'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(QuoteItem::class);
    }
}
