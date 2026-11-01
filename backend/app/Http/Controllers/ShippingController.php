<?php

namespace App\Http\Controllers;

use App\Services\RouteDistanceService;
use Illuminate\Http\Request;

class ShippingController extends Controller
{
    public function quote(Request $request, RouteDistanceService $routes)
    {
        $data = $request->validate([
            'shipping_address' => 'required|string|min:10|max:1000',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        return $routes->quote((float) $data['latitude'], (float) $data['longitude']);
    }
}
