<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ActiveUser
{
    public function handle(Request $request, Closure $next)
    {
        abort_unless($request->user() && $request->user()->status === 'active', 401, 'Vui lòng đăng nhập bằng tài khoản đang hoạt động.');

        return $next($request);
    }
}
