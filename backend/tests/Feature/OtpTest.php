<?php

namespace Tests\Feature;

use App\Mail\OtpMail;
use App\Models\User;
use App\Services\EmailOtpService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class OtpTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    private function user(bool $verified = false): User
    {
        $user = User::create(['name' => 'OTP Test', 'email' => uniqid().'@example.test', 'password' => 'Password123']);
        $user->email_verified_at = $verified ? now() : null;
        $user->save();

        return $user->fresh();
    }

    private function send(User $user, string $purpose = 'register'): string
    {
        app(EmailOtpService::class)->send($user, $purpose);

        return Mail::sent(OtpMail::class)->last()->code;
    }

    private function verify(User $user, string $code, string $purpose = 'register')
    {
        return $this->postJson('/api/otp/verify', ['email' => $user->email, 'purpose' => $purpose, 'otp' => $code]);
    }

    public function test_temporary_bypass_allows_registration_without_marking_email_verified(): void
    {
        config(['auth.email_verification_required' => false]);
        $email = uniqid().'@example.test';
        $this->postJson('/api/register', ['name' => 'New', 'email' => $email, 'password' => 'Password123', 'password_confirmation' => 'Password123', 'role' => 'admin'])
            ->assertCreated()->assertJsonPath('requires_verification', false);
        $user = User::where('email', $email)->firstOrFail();
        $this->assertSame('customer', $user->role);
        $this->assertNull($user->email_verified_at);
        $this->assertDatabaseMissing('email_otps', ['user_id' => $user->id]);
        Mail::assertNothingSent();
        $this->postJson('/api/login', ['email' => $email, 'password' => 'Password123'])->assertOk();
        $this->postJson('/api/logout')->assertOk();
        config(['auth.email_verification_required' => true]);
        $this->postJson('/api/login', ['email' => $email, 'password' => 'Password123'])->assertUnprocessable();
    }

    public function test_temporary_bypass_preserves_password_status_and_reset_checks(): void
    {
        config(['auth.email_verification_required' => false]);
        $user = $this->user();
        $user->role = 'admin';
        $user->save();
        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'wrong'])->assertUnprocessable();
        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'Password123'])->assertOk()->assertJsonPath('role', 'admin');
        $this->postJson('/api/logout')->assertOk();
        $user->status = 'locked';
        $user->save();
        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'Password123'])->assertUnprocessable();
        $this->postJson('/api/password/reset', ['password' => 'Changed123', 'password_confirmation' => 'Changed123'])->assertUnprocessable();
        $this->assertTrue(Hash::check('Password123', $user->fresh()->password));
    }

    public function test_registration_requires_verification_and_does_not_accept_admin_role(): void
    {
        $email = uniqid().'@example.test';
        $this->postJson('/api/register', ['name' => 'New', 'email' => $email, 'password' => 'Password123', 'password_confirmation' => 'Password123', 'role' => 'admin'])->assertCreated()->assertJsonMissingPath('password');
        $this->assertGuest();
        $user = User::where('email', $email)->firstOrFail();
        $this->assertSame('customer', $user->role);
        $this->assertNull($user->email_verified_at);
        $this->postJson('/api/login', ['email' => $email, 'password' => 'Password123'])->assertUnprocessable();
        $mail = Mail::sent(OtpMail::class)->last();
        $this->assertMatchesRegularExpression('/^[0-9]{6}$/', $mail->code);
        $otp = DB::table('email_otps')->where('user_id', $user->id)->first();
        $this->assertNotSame($mail->code, $otp->otp_hash);
        $this->assertTrue(Hash::check($mail->code, $otp->otp_hash));
        $this->verify($user, $mail->code)->assertOk();
        $this->verify($user, $mail->code)->assertUnprocessable();
        $this->postJson('/api/login', ['email' => $email, 'password' => 'Password123'])->assertOk();
    }

    public function test_five_wrong_attempts_lock_the_code(): void
    {
        $user = $this->user();
        $code = $this->send($user);
        $wrong = $code === '000000' ? '111111' : '000000';
        for ($i = 0; $i < 5; $i++) {
            $this->verify($user, $wrong)->assertUnprocessable();
        }
        $this->verify($user, $code)->assertUnprocessable();
        $this->assertDatabaseHas('email_otps', ['user_id' => $user->id, 'attempts' => 5]);
    }

    public function test_code_expires_at_five_minutes(): void
    {
        $user = $this->user();
        $code = $this->send($user);
        $this->travel(5)->minutes();
        $this->verify($user, $code)->assertUnprocessable();
    }

    public function test_resend_cooldown_and_old_code_invalidation(): void
    {
        $user = $this->user();
        $old = $this->send($user);
        $this->postJson('/api/otp/send', ['email' => $user->email, 'purpose' => 'register'])->assertUnprocessable();
        $this->travel(60)->seconds();
        $new = $this->send($user);
        $rows = DB::table('email_otps')->where('user_id', $user->id)->orderBy('id')->get();
        $this->assertNotNull($rows[0]->used_at);
        $this->assertNull($rows[1]->used_at);
        if ($new !== $old) {
            $this->verify($user, $old)->assertUnprocessable();
        }
        $this->verify($user, $new)->assertOk();
    }

    public function test_hourly_limit_survives_used_or_expired_codes(): void
    {
        $user = $this->user();
        for ($i = 0; $i < 5; $i++) {
            $this->send($user);
            $this->travel(61)->seconds();
        }
        $this->postJson('/api/otp/send', ['email' => $user->email, 'purpose' => 'register'])->assertUnprocessable();
        Mail::assertSentCount(5);
        $this->travel(1)->hours();
        $this->postJson('/api/otp/send', ['email' => $user->email, 'purpose' => 'register'])->assertOk();
        Mail::assertSentCount(6);
    }

    public function test_password_reset_requires_a_single_use_session_grant(): void
    {
        $user = $this->user(true);
        $payload = ['password' => 'Changed123', 'password_confirmation' => 'Changed123'];
        $this->postJson('/api/password/reset', $payload)->assertUnprocessable();
        $code = $this->send($user, 'forgot_password');
        $this->verify($user, $code, 'register')->assertUnprocessable();
        $this->verify($user, $code, 'forgot_password')->assertOk();
        $this->verify($user, $code, 'forgot_password')->assertUnprocessable();
        $this->postJson('/api/password/reset', $payload)->assertOk();
        $this->assertTrue(Hash::check('Changed123', $user->fresh()->password));
        $this->postJson('/api/password/reset', $payload)->assertUnprocessable();
        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'Password123'])->assertUnprocessable();
        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'Changed123'])->assertOk();
    }

    public function test_reset_grant_expires_and_resending_revokes_it(): void
    {
        $user = $this->user(true);
        $code = $this->send($user, 'forgot_password');
        $this->verify($user, $code, 'forgot_password')->assertOk();
        $this->travel(5)->minutes();
        $payload = ['password' => 'Changed123', 'password_confirmation' => 'Changed123'];
        $this->postJson('/api/password/reset', $payload)->assertUnprocessable();
        $code = $this->send($user, 'forgot_password');
        $this->verify($user, $code, 'forgot_password')->assertOk();
        $this->travel(61)->seconds();
        $this->send($user, 'forgot_password');
        $this->postJson('/api/password/reset', $payload)->assertUnprocessable();
    }

    public function test_ineligible_addresses_do_not_receive_mail(): void
    {
        $unverified = $this->user();
        $locked = $this->user(true);
        $locked->status = 'locked';
        $locked->save();
        $deleted = $this->user(true);
        $deleted->delete();
        foreach ([$unverified->email, $locked->email, $deleted->email, 'missing@example.test'] as $email) {
            $this->postJson('/api/otp/send', ['email' => $email, 'purpose' => 'forgot_password'])->assertOk();
        }
        Mail::assertNothingSent();
    }

    public function test_delivery_failure_rolls_back_registration(): void
    {
        Mail::shouldReceive('to')->andThrow(new \RuntimeException('SMTP unavailable'));
        $this->withoutExceptionHandling();
        $email = uniqid().'@example.test';
        try {
            $this->postJson('/api/register', ['name' => 'New', 'email' => $email, 'password' => 'Password123', 'password_confirmation' => 'Password123']);
            $this->fail('SMTP failure must not create an account.');
        } catch (\RuntimeException $e) {
            $this->assertSame('SMTP unavailable', $e->getMessage());
        }
        $this->assertDatabaseMissing('users', ['email' => $email]);
    }
}
