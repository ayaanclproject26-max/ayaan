<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Promotion extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'subtitle',
        'type',
        'image_url',
        'discount_percentage',
        'button_text',
        'button_action',
        'button_target',
        'starts_at',
        'ends_at',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'discount_percentage' => 'decimal:2',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'sort_order' => 'integer',
        'is_active' => 'boolean',
    ];
}
