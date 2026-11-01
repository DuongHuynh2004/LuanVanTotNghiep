<?php

namespace Tests\Feature;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DashboardRevenueTest extends TestCase
{
    use DatabaseTransactions;

    public function test_admin_can_view_revenue_for_each_supported_period(): void
    {
        if (! Schema::hasTable('orders')
            || ! Schema::hasTable('order_items')
            || ! Schema::hasTable('order_status_histories')) {
            $this->markTestSkipped('Commerce tables are required for dashboard revenue periods.');
        }

        Carbon::setTestNow('2026-10-31 12:00:00');

        try {
            $admin = User::create([
                'name' => 'Dashboard admin',
                'email' => uniqid('dashboard-admin-').'@example.test',
                'password' => 'Password123',
            ]);
            $admin->role = 'admin';
            $admin->status = 'active';
            $admin->save();
            $admin->refresh();

            foreach ([
                ['2026-10-31 03:00:00', 100],
                ['2026-10-28 08:00:00', 200],
                ['2026-10-11 08:00:00', 300],
                ['2026-01-31 08:00:00', 400],
                ['2026-10-31 04:00:00', 9000000, 'pending'],
            ] as $orderData) {
                $createdAt = $orderData[0];
                $total = $orderData[1];
                $status = $orderData[2] ?? 'completed';
                DB::table('orders')->insert([
                    'order_code' => 'DASH-'.strtoupper(bin2hex(random_bytes(5))),
                    'customer_name' => 'Dashboard test customer',
                    'customer_email' => 'dashboard-customer@example.test',
                    'customer_phone' => '0901234567',
                    'shipping_address' => 'Test shipping address, Ho Chi Minh City',
                    'subtotal' => $total,
                    'shipping_fee' => 0,
                    'shipping_distance_meters' => 1000,
                    'discount_amount' => 0,
                    'total' => $total,
                    'status' => $status,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);
            }

            $expected = [
                'day' => [100, 1, 6],
                'week' => [300, 2, 7],
                'month' => [600, 3, 5],
                'year' => [1000, 4, 12],
            ];

            foreach ($expected as $period => [$total, $orders, $chartPoints]) {
                $this->actingAs($admin)
                    ->getJson('/api/admin/dashboard?period='.$period)
                    ->assertOk()
                    ->assertJsonPath('period', $period)
                    ->assertJsonPath('completed_value', $total)
                    ->assertJsonPath('completed_orders', $orders)
                    ->assertJsonCount($chartPoints, 'sales_chart');
            }

            $this->actingAs($admin)
                ->getJson('/api/admin/dashboard?period=decade')
                ->assertUnprocessable()
                ->assertJsonValidationErrors('period');
        } finally {
            Carbon::setTestNow();
        }
    }
}
