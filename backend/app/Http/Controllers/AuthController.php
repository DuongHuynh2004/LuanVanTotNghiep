<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\EmailOtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request, EmailOtpService $otps): JsonResponse
    {
        $request->merge(['email' => Str::lower(trim((string) $request->input('email')))]);
        $data = $request->validate(['name' => 'required|string|max:100', 'email' => 'required|email|max:191|unique:users', 'phone' => 'nullable|string|regex:/\A0[0-9]{9}\z/', 'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()]]);
        $verificationRequired = (bool) config('auth.email_verification_required');
        DB::transaction(function () use ($data, $otps, $verificationRequired) {
            $user = User::create($data)->fresh();
            if ($verificationRequired) {
                $otps->send($user, 'register');
            }
        });

        if (! $verificationRequired) {
            return response()->json([
                'message' => 'Tạo tài khoản thành công. Bạn có thể đăng nhập ngay.',
                'requires_verification' => false,
            ], 201);
        }

        return response()->json(['requires_verification' => true, 'message' => 'Mã OTP đã được gửi đến email của bạn. Vui lòng xác minh để đăng nhập.', 'retry_after' => 60], 201);
    }

    public function login(Request $request): User
    {
        $data = $request->validate(['email' => 'required|email', 'password' => 'required|string']);
        $user = User::where('email', Str::lower(trim($data['email'])))->where('status', 'active')->first();
        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => 'Email hoặc mật khẩu không chính xác, hoặc tài khoản đã bị khóa.']);
        }
        if (config('auth.email_verification_required') && ! $user->email_verified_at) {
            throw ValidationException::withMessages(['email' => 'Vui lòng xác minh email trước khi đăng nhập. Chọn “Xác minh email” để nhận mã OTP.']);
        }
        Auth::login($user);
        $request->session()->regenerate();

        return $request->user();
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Đã đăng xuất.']);
    }

    public function update(Request $request): User
    {
        $data = $request->validate(['name' => 'required|string|max:100', 'phone' => 'nullable|string|regex:/\A0[0-9]{9}\z/', 'email' => ['required', 'email', 'max:191', Rule::unique('users')->ignore($request->user()->id)], 'current_password' => 'required_with:password|current_password', 'password' => ['nullable', 'confirmed', Password::min(8)->letters()->numbers()]]);
        unset($data['current_password']);
        if (empty($data['password'])) {
            unset($data['password']);
        }
        if ($data['email'] !== $request->user()->email) {
            $request->user()->email_verified_at = null;
        }
        $request->user()->fill($data)->save();

        return $request->user();
    }
}
