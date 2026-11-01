<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = User::where('role', 'customer');
        if ($request->query('status') === 'deleted') {
            $query->onlyTrashed();
        } elseif ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }
        if ($request->filled('q')) {
            $term = '%'.$request->string('q').'%';
            $query->where(fn ($q) => $q->where('name', 'like', $term)->orWhere('email', 'like', $term)->orWhere('phone', 'like', $term));
        }

        return $query->latest('id')->paginate(12);
    }

    public function save(Request $request, ?int $customer = null)
    {
        $user = $customer ? User::where('role', 'customer')->findOrFail($customer) : new User;
        $rules = [
            'name' => 'required|string|max:100',
            'email' => ['required', 'email', 'max:191', Rule::unique('users')->ignore($user->id)],
            'phone' => 'nullable|string|regex:/\A0[0-9]{9}\z/',
            'status' => 'required|in:active,locked',
        ];
        if (! $customer) {
            $rules['password'] = ['required', 'confirmed', Password::min(8)->letters()->numbers()];
        }
        $data = $request->validate($rules);
        if ($user->exists && $user->email !== $data['email']) {
            $user->email_verified_at = null;
        }
        $user->fill(collect($data)->except('status')->all());
        $user->status = $data['status'];
        $user->role = 'customer';
        $user->save();

        return response()->json($user->fresh(), $customer ? 200 : 201);
    }

    public function status(Request $request, int $customer)
    {
        $data = $request->validate(['status' => 'required|in:active,locked']);
        $user = User::where('role', 'customer')->findOrFail($customer);
        $user->status = $data['status'];
        $user->save();

        return $user;
    }

    public function destroy(int $customer)
    {
        User::where('role', 'customer')->findOrFail($customer)->delete();

        return ['message' => 'Đã chuyển khách hàng vào thùng rác. Có thể khôi phục từ bộ lọc Đã xóa.'];
    }

    public function restore(int $customer)
    {
        $user = User::onlyTrashed()->where('role', 'customer')->findOrFail($customer);
        $user->restore();

        return $user;
    }
}
