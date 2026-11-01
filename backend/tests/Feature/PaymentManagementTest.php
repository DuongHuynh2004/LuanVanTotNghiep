<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class PaymentManagementTest extends TestCase
{
    use DatabaseTransactions;

    public function test_admin_can_confirm_and_list_payment_using_supplied_schema(): void
    {
        $admin = User::create([
            'name' => 'Payment admin',
            'email' => uniqid('payment-admin-').'@example.test',
            'password' => 'Password123',
        ]);
        $admin->role = 'admin';
        $admin->status = 'active';
        $admin->save();
        $admin->refresh();
        $order = Order::query()->create([
            'order_code' => 'TEST-'.strtoupper(bin2hex(random_bytes(5))),
            'customer_name' => 'Payment customer',
            'customer_email' => 'payment-customer@example.test',
            'customer_phone' => '0901234567',
            'shipping_address' => 'Test shipping address, Ho Chi Minh City',
            'subtotal' => 100000,
            'shipping_fee' => 5000,
            'shipping_distance_meters' => 1000,
            'discount_amount' => 0,
            'total' => 105000,
            'status' => 'processing',
        ]);
        $payment = $order->payment()->create([
            'method' => 'cod',
            'status' => 'unpaid',
        ]);

        $this->actingAs($admin)
            ->patchJson('/api/admin/payments/'.$payment->id, [
                'status' => 'paid',
                'transaction_reference' => 'COD-TEST-1',
            ])
            ->assertOk()
            ->assertJsonPath('status', 'paid')
            ->assertJsonPath('transaction_reference', 'COD-TEST-1')
            ->assertJsonPath('confirmed_by_user_id', $admin->id);

        $this->actingAs($admin)
            ->getJson('/api/admin/payments?q='.urlencode($order->order_code))
            ->assertOk()
            ->assertJsonPath('data.0.order.order_code', $order->order_code);
    }

    public function test_payment_cannot_be_marked_refunded_before_order_cancellation(): void
    {
        $admin = User::create([
            'name' => 'Payment admin',
            'email' => uniqid('payment-admin-').'@example.test',
            'password' => 'Password123',
        ]);
        $admin->role = 'admin';
        $admin->status = 'active';
        $admin->save();
        $admin->refresh();
        $order = Order::query()->create([
            'order_code' => 'TEST-'.strtoupper(bin2hex(random_bytes(5))),
            'customer_name' => 'Payment customer',
            'customer_email' => 'payment-customer@example.test',
            'customer_phone' => '0901234567',
            'shipping_address' => 'Test shipping address, Ho Chi Minh City',
            'subtotal' => 100000,
            'shipping_fee' => 5000,
            'shipping_distance_meters' => 1000,
            'discount_amount' => 0,
            'total' => 105000,
            'status' => 'processing',
        ]);
        $payment = $order->payment()->create([
            'method' => 'cod',
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        $this->actingAs($admin)
            ->patchJson('/api/admin/payments/'.$payment->id, [
                'status' => 'refund_pending',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');

        $this->assertSame('paid', $payment->fresh()->status);
    }
}
