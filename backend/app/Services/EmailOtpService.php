<?php

namespace App\Services;

use App\Mail\OtpMail;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

class EmailOtpService
{
    public const LIFETIME_MINUTES = 5;

    public const RESEND_SECONDS = 60;

    public const HOURLY_LIMIT = 5;

    public const MAX_ATTEMPTS = 5;

    // Every operation locks the user row, including when no OTP exists yet.
    public function send(User $user, string $purpose): void
    {
        DB::transaction(function () use ($user, $purpose) {
            $user = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $this->ensureEligible($user, $purpose);
            $history = DB::table('email_otps')->where('user_id', $user->id);
            if ((clone $history)->where('created_at', '>', now()->subSeconds(self::RESEND_SECONDS))->exists()) {
                $this->fail('Vui lòng chờ 60 giây trước khi gửi lại mã.');
            }
            if ((clone $history)->where('created_at', '>', now()->subHour())->count() >= self::HOURLY_LIMIT) {
                $this->fail('Email này đã nhận 5 mã trong một giờ. Vui lòng thử lại sau.');
            }
            // Fail explicitly instead of claiming a log entry is a delivered email.
            if (! app()->environment('testing') && config('mail.default') !== 'smtp') {
                $this->fail('Cửa hàng chưa cấu hình SMTP. Vui lòng liên hệ cửa hàng để được hỗ trợ.');
            }
            $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            DB::table('email_otps')->where('user_id', $user->id)->where('purpose', $purpose)
                ->whereNull('used_at')->update(['used_at' => now()]);
            DB::table('email_otps')->insert([
                'user_id' => $user->id, 'purpose' => $purpose, 'otp_hash' => Hash::make($code),
                'attempts' => 0, 'expires_at' => now()->addMinutes(self::LIFETIME_MINUTES),
                'created_at' => now(), 'updated_at' => now(),
            ]);
            // Synchronous delivery: SMTP failure rolls back the new code and invalidation.
            try {
                Mail::to($user->email)->send(new OtpMail($code, $purpose));
            } catch (TransportExceptionInterface $e) {
                report($e);
                $this->fail('Chưa gửi được email. Vui lòng thử lại sau.');
            }
        });
    }

    public function verify(User $user, string $purpose, string $code): array
    {
        $result = DB::transaction(function () use ($user, $purpose, $code) {
            $user = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $this->ensureEligible($user, $purpose);
            $otp = DB::table('email_otps')->where('user_id', $user->id)->where('purpose', $purpose)
                ->orderByDesc('id')->first();
            if (! $otp || $otp->used_at || now()->gte($otp->expires_at) || $otp->attempts >= self::MAX_ATTEMPTS) {
                return null;
            }
            $record = DB::table('email_otps')->where('id', $otp->id);
            if (! Hash::check($code, $otp->otp_hash)) {
                $record->update(['attempts' => $otp->attempts + 1, 'updated_at' => now()]);

                return null; // Commit failed attempts before returning the validation error.
            }
            $record->update(['used_at' => now(), 'updated_at' => now()]);
            if ($purpose === 'register') {
                $user->email_verified_at = now();
                $user->save();
            }

            return ['user_id' => $user->id, 'otp_id' => $otp->id, 'password_hash' => $user->password,
                'email' => $user->email, 'expires_at' => now()->addMinutes(5)->timestamp];
        });
        if (! $result) {
            $this->fail('Mã OTP không đúng, đã hết hạn hoặc đã bị vô hiệu hóa.');
        }

        return $result;
    }

    private function ensureEligible(User $user, string $purpose): void
    {
        if ($user->status !== 'active' || ($purpose === 'register' && $user->email_verified_at)
            || ($purpose === 'forgot_password' && ! $user->email_verified_at)) {
            $this->fail('Tài khoản không đủ điều kiện xác minh.');
        }
    }

    private function fail(string $message): never
    {
        throw ValidationException::withMessages(['otp' => $message]);
    }
}
