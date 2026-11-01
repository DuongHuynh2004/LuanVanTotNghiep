<?php

use App\Models\User;
use Illuminate\Support\Facades\Artisan;

Artisan::command('lumiq:admin {email}', function () {
    $user = User::where('email', $this->argument('email'))->first();
    if (! $user) {
        $this->error('Hãy đăng ký tài khoản trước, sau đó chạy lại lệnh.');

        return 1;
    }
    $user->role = 'admin';
    $user->save();
    $this->info('Đã cấp quyền quản trị cho '.$user->email);
})->purpose('Cấp quyền admin cho tài khoản đã tồn tại');
