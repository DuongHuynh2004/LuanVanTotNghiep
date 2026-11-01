<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class CustomerTest extends TestCase
{
    use DatabaseTransactions;

    public function test_customers_can_be_managed_without_exposing_admin_accounts(): void
    {
        $admin = User::create(['name' => 'Admin test', 'email' => uniqid().'@example.test', 'password' => 'Password123']);
        $admin->role = 'admin';
        $admin->save(); $admin->refresh();
        $this->actingAs($admin);
        $data = ['name' => 'Khách hàng test', 'email' => uniqid().'@example.test', 'phone' => '0901234567', 'password' => 'Password123', 'password_confirmation' => 'Password123', 'status' => 'active', 'role' => 'admin'];
        $id = $this->postJson('/api/admin/customers', $data)->assertCreated()->assertJsonPath('role', 'customer')->assertJsonMissingPath('password')->json('id');
        $this->getJson('/api/admin/customers?q='.$data['email'])->assertOk()->assertJsonPath('total', 1);
        $this->getJson('/api/admin/customers?q='.$admin->email)->assertOk()->assertJsonPath('total', 0);
        $this->putJson('/api/admin/customers/'.$admin->id, $data)->assertNotFound();
        $this->deleteJson('/api/admin/customers/'.$admin->id)->assertNotFound();
        $invalid = $data;
        $invalid['phone'] = '1901234567';
        $this->putJson('/api/admin/customers/'.$id, $invalid)->assertUnprocessable()->assertJsonValidationErrors('phone');
        $data['name'] = 'Tên đã sửa';
        $this->putJson('/api/admin/customers/'.$id, $data)->assertOk()->assertJsonPath('name', 'Tên đã sửa')->assertJsonPath('role', 'customer');
        $this->patchJson('/api/admin/customers/'.$id.'/status', ['status' => 'locked'])->assertOk();
        $this->actingAs(User::find($id))->getJson('/api/me')->assertUnauthorized();
        $this->actingAs($admin)->patchJson('/api/admin/customers/'.$id.'/status', ['status' => 'active'])->assertOk();
        $this->actingAs(User::find($id))->getJson('/api/admin/customers')->assertForbidden();
        $this->actingAs($admin)->deleteJson('/api/admin/customers/'.$id)->assertOk();
        $this->assertSoftDeleted('users', ['id' => $id]);
        $this->getJson('/api/admin/customers?q='.$data['email'])->assertJsonPath('total', 0);
        $this->getJson('/api/admin/customers?status=deleted&q='.$data['email'])->assertJsonPath('total', 1);
        $this->postJson('/api/admin/customers/'.$id.'/restore')->assertOk();
        $this->assertDatabaseHas('users', ['id' => $id, 'deleted_at' => null]);
    }
}

