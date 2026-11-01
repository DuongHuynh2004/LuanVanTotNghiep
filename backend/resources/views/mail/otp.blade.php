<!doctype html>
<html lang="vi">
<body>
<h1>LUMIQ</h1>
<p>Mã xác minh {{ $purpose === 'register' ? 'đăng ký tài khoản' : 'đặt lại mật khẩu' }} của bạn:</p>
<p style="font-size:32px;font-weight:bold;letter-spacing:6px">{{ $code }}</p>
<p>Mã có hiệu lực 5 phút và chỉ dùng được một lần. Không chia sẻ mã này với người khác.</p>
<p>Nếu bạn không yêu cầu mã, hãy bỏ qua email này.</p>
</body>
</html>
