<?php

/**
 * Authoritative Business Profile Configuration
 * 
 * Source of truth for all business branding, exporter information,
 * addresses, origin routing, and commercial document exporter profiles.
 */

return [
    'name' => 'AYAAN CLOTHING',
    'brand_mark' => 'AYC',
    'business_type' => 'Ready-made Garments Manufacturer & Exporter',
    'description' => 'Ready-made Garments Manufacturer & Exporter',
    'established_year' => 2010,

    'address' => [
        'line1' => 'House #33 (2nd floor)',
        'line2' => 'Road #12, Sector #11',
        'area' => 'Uttara',
        'city' => 'Dhaka',
        'postal_code' => '1230',
        'country' => 'Bangladesh',
        'country_code' => 'BD',
        'formatted' => 'House #33 (2nd floor), Road #12, Sector #11, Uttara, Dhaka-1230, Bangladesh',
    ],

    // Unconfirmed legal identifiers - left configurable/empty rather than fabricated
    'legal' => [
        'registration_number' => env('BUSINESS_REG_NUMBER', null),
        'tin_number' => env('BUSINESS_TIN_NUMBER', null),
        'bin_number' => env('BUSINESS_BIN_NUMBER', null),
        'vat_number' => env('BUSINESS_VAT_NUMBER', null),
        'bgmea_reg' => env('BUSINESS_BGMEA_REG', null),
    ],

    // Official contact channels
    'contact' => [
        'phone' => env('BUSINESS_PHONE', null),
        'email' => env('BUSINESS_EMAIL', null),
        'whatsapp' => env('BUSINESS_WHATSAPP', '+8801826304930'),
        'whatsapp_number' => env('BUSINESS_WHATSAPP_NUMBER', '8801826304930'),
        'whatsapp_url' => env('BUSINESS_WHATSAPP_URL', 'https://wa.me/8801826304930'),
        'website' => env('BUSINESS_WEBSITE', 'www.ayaanclothing.com'),
    ],

    // Banking details - unconfigured by default until confirmed by business owner
    'banking' => [
        'is_configured' => env('BUSINESS_BANK_CONFIGURED', false),
        'beneficiary_name' => 'AYAAN CLOTHING',
        'bank_name' => env('BUSINESS_BANK_NAME', null),
        'account_number' => env('BUSINESS_BANK_ACCOUNT', null),
        'swift_code' => env('BUSINESS_SWIFT_CODE', null),
        'branch' => env('BUSINESS_BANK_BRANCH', null),
        'routing_no' => env('BUSINESS_ROUTING_NO', null),
    ],

    // Default logistics origin ports
    'logistics' => [
        'country_of_origin' => 'Bangladesh',
        'air_port_of_loading' => 'Hazrat Shahjalal International Airport (DAC), Dhaka',
        'sea_port_of_loading' => 'Chattogram Sea Port (CGP), Bangladesh',
        'place_of_receipt' => 'Uttara Corporate Office / Dhaka Hub, Bangladesh',
    ],
];
