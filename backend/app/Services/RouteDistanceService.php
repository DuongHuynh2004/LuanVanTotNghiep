<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class RouteDistanceService
{
    public function quote(float $latitude, float $longitude): array
    {
        $originAddress = (string) config('services.delivery.origin_address');
        if ($originAddress === '') {
            $this->fail('Cửa hàng chưa cấu hình địa chỉ để tính phí giao hàng.');
        }

        if (! is_finite($latitude) || ! is_finite($longitude)
            || abs($latitude) > 90 || abs($longitude) > 180) {
            $this->fail('Tọa độ giao hàng không hợp lệ.');
        }

        $origin = [
            'latitude' => (float) config('services.delivery.origin_latitude'),
            'longitude' => (float) config('services.delivery.origin_longitude'),
        ];
        $target = [
            'latitude' => $latitude,
            'longitude' => $longitude,
        ];

        $a = sin(deg2rad($latitude - $origin['latitude']) / 2) ** 2
            + cos(deg2rad($latitude)) * cos(deg2rad($origin['latitude']))
            * sin(deg2rad($longitude - $origin['longitude']) / 2) ** 2;
        $directMeters = 6371000 * 2 * asin(sqrt(min(1, max(0, $a))));
        $maximumDistance = (int) config('services.delivery.maximum_distance_km', 40);
        if ($directMeters > $maximumDistance * 1000) {
            $this->fail('Điểm giao nằm ngoài phạm vi giao hàng của cửa hàng.');
        }

        $url = rtrim((string) config('services.delivery.routing_url'), '/')
            .'/'.implode(',', [$origin['longitude'], $origin['latitude']])
            .';'.implode(',', [$target['longitude'], $target['latitude']])
            .'?overview=false';

        try {
            $response = Http::acceptJson()
                ->withOptions(['verify' => base_path('resources/certs/cacert.pem')])
                ->connectTimeout(8)
                ->timeout(12)
                ->get($url);
        } catch (ConnectionException $exception) {
            report($exception);
            $this->fail('Không kết nối được dịch vụ tính tuyến đường. Vui lòng thử lại.');
        }

        if (! $response->successful()) {
            report(new \RuntimeException(
                'OpenStreetMap routing service returned HTTP '.$response->status().'.',
            ));
            $this->fail('Chưa tính được tuyến giao hàng. Vui lòng thử lại sau.');
        }

        $meters = $response->json('routes.0.distance');
        if ($response->json('code') !== 'Ok' || ! is_numeric($meters) || $meters < 0) {
            $this->fail('Không tìm thấy tuyến đường giao hàng đến địa chỉ này.');
        }

        if ($meters > $maximumDistance * 1000) {
            $this->fail(sprintf(
                'Địa chỉ nằm ngoài phạm vi giao hàng %d km của LUMIQ.',
                $maximumDistance,
            ));
        }

        foreach ($response->json('waypoints', []) as $waypoint) {
            if (($waypoint['distance'] ?? 0) > 500) {
                $this->fail('Điểm ghim cách xa đường giao hàng. Vui lòng chọn lại gần lối vào.');
            }
        }

        $rate = (int) config('services.delivery.shipping_rate_per_km', 5000);
        $kilometers = (int) ceil($meters / 1000);

        return [
            'latitude' => $target['latitude'],
            'longitude' => $target['longitude'],
            'distance_meters' => (int) $meters,
            'kilometers_charged' => $kilometers,
            'maximum_distance_km' => $maximumDistance,
            'rate_per_km' => $rate,
            'shipping_fee' => $kilometers * $rate,
            'map_url' => 'https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route='
                .implode(',', [$origin['latitude'], $origin['longitude']])
                .';'.implode(',', [$target['latitude'], $target['longitude']]),
        ];
    }

    private function fail(string $message): never
    {
        throw ValidationException::withMessages([
            'shipping_address' => $message,
        ]);
    }
}
