<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'delivery' => [
        'origin_address' => env(
            'STORE_ORIGIN_ADDRESS',
            '801/2 Phạm Thế Hiển, Phường Chánh Hưng, Thành phố Hồ Chí Minh, Việt Nam',
        ),
        'origin_latitude' => 10.7437859,
        'origin_longitude' => 106.6740334,
        'maximum_distance_km' => (int) env('DELIVERY_MAX_DISTANCE_KM', 40),
        'shipping_rate_per_km' => (int) env('SHIPPING_RATE_PER_KM', 5000),
        'routing_url' => env('OSRM_ROUTING_URL', 'https://router.project-osrm.org/route/v1/driving'),
    ],

];
