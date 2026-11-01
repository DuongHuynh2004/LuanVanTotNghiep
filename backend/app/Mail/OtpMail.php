<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;

class OtpMail extends Mailable
{
    public function __construct(public string $code, public string $purpose) {}

    public function build(): static
    {
        return $this->from(config('mail.from.address'), config('mail.from.name', 'LUMIQ'))
            ->subject($this->purpose === 'register' ? 'LUMIQ — Xác minh tài khoản' : 'LUMIQ — Đặt lại mật khẩu')
            ->view('mail.otp');
    }
}
