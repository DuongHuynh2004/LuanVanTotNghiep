<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\EmailOtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class OtpController extends Controller
{
    private function input(Request $request, bool $verify = false): array
    {
        $request->merge(['email' => Str::lower(trim((string) $request->input('email')))]);

        return $request->validate([
            'email' => 'required|email|max:191',
            'purpose' => ['required', Rule::in(['register', 'forgot_password'])],
            ...($verify ? ['otp' => ['required', 'string', 'regex:/\A[0-9]{6}\z/']] : []),
        ]);
    }

    public function send(Request $request, EmailOtpService $otps): JsonResponse
    {
        $data = $this->input($request);
        $user = User::where('email', $data['email'])->where('status', 'active')->first();
        $eligible = $user && ($data['purpose'] === 'register' ? ! $user->email_verified_at : $user->email_verified_at);
        if ($eligible) {
            $otps->send($user, $data['purpose']);
        }

        return response()->json(['message' => 'Nếu email đủ điều kiện, mã OTP đã được gửi. Vui lòng kiểm tra cả thư rác.', 'retry_after' => 60]);
    }

    public function verify(Request $request, EmailOtpService $otps): JsonResponse
    {
        $data = $this->input($request, true);
        $user = User::where('email', $data['email'])->first();
        if (! $user) {
            throw ValidationException::withMessages(['otp' => 'Mã OTP không đúng hoặc đã hết hạn.']);
        }
        $grant = $otps->verify($user, $data['purpose'], $data['otp']);
        if ($data['purpose'] === 'forgot_password') {
            $request->session()->regenerate();
            $request->session()->put('password_reset_grant', $grant);
        }

        return response()->json(['message' => $data['purpose'] === 'register'
            ? 'Xác minh thành công. Bạn có thể đăng nhập.' : 'Xác minh thành công. Hãy đặt mật khẩu mới trong 5 phút.']);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate(['password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()]]);
        $grant = $request->session()->get('password_reset_grant');
        $valid = DB::transaction(function () use ($grant, $data) {
            if (! $grant || now()->timestamp >= $grant['expires_at']) {
                return false;
            }
            $user = User::whereKey($grant['user_id'])->lockForUpdate()->first();
            $latest = DB::table('email_otps')->where('user_id', $grant['user_id'])->where('purpose', 'forgot_password')->max('id');
            if (! $user || $user->status !== 'active' || ! $user->email_verified_at
                || $user->email !== $grant['email'] || $user->password !== $grant['password_hash']
                || (int) $latest !== (int) $grant['otp_id']) {
                return false;
            }
            $user->password = $data['password'];
            $user->remember_token = Str::random(60);
            $user->save();
            DB::table('email_otps')->where('user_id', $user->id)->whereNull('used_at')->update(['used_at' => now()]);

            return true;
        });
        $request->session()->forget('password_reset_grant');
        if (! $valid) {
            throw ValidationException::withMessages(['otp' => 'Quyền đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu mã OTP mới.']);
        }
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Đã đổi mật khẩu. Vui lòng đăng nhập lại.']);
    }
}
