<?php

namespace Tests\Unit;

use App\Services\RouteDistanceService;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class PinnedDeliveryTest extends TestCase
{
    public function test_pin_quotes_without_geocoding(): void
    {
        config(['services.delivery.maximum_distance_km' => 40]);
        Http::preventStrayRequests();
        Http::fake(['*route/v1/driving/*' => Http::response([
            'code' => 'Ok', 'routes' => [['distance' => 40000]],
        ])]);
        $quote = app(RouteDistanceService::class)->quote(10.75, 106.68);
        $this->assertSame(200000, $quote['shipping_fee']);
        $this->assertSame(40000, $quote['distance_meters']);
        $this->assertSame(40, $quote['maximum_distance_km']);
        Http::assertSentCount(1);
    }

    public function test_route_over_forty_km_is_rejected(): void
    {
        config(['services.delivery.maximum_distance_km' => 40]);
        Http::fake(['*' => Http::response(['code' => 'Ok', 'routes' => [['distance' => 40001]]])]);
        $this->expectException(ValidationException::class);
        app(RouteDistanceService::class)->quote(10.75, 106.68);
    }

    public function test_far_pin_is_rejected_before_network_call(): void
    {
        Http::fake();
        try {
            app(RouteDistanceService::class)->quote(21.03, 105.85);
            $this->fail('Must reject distant point');
        } catch (ValidationException $e) {
            Http::assertNothingSent();
        }
    }
}
