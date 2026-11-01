<?php

use Illuminate\Contracts\Console\Kernel;

// Copy only the existing schema into a disposable test database. Never copy customer data.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
$config = config('database.connections.mysql');
$pdo = new PDO('mysql:host='.$config['host'].';port='.$config['port'].';charset=utf8mb4', $config['username'], $config['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$source = $config['database'];
if (! preg_match('/^[a-zA-Z0-9_]+$/', $source)) {
    throw new RuntimeException('Tên database không hợp lệ.');
}
$database = 'lumiq_qa_'.bin2hex(random_bytes(6));
$created = false;
$code = 1;
try {
    $pdo->exec("CREATE DATABASE `$database` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $created = true;
    $pdo->exec("USE `$database`");
    $tables = ['users', 'email_otps'];
    if ($pdo->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$source' AND TABLE_NAME='categories'")->fetchColumn()) {
        $tables[] = 'categories';
    }
    foreach ([...$tables, 'products', 'product_variants', 'product_images'] as $table) {
        $ddl = $pdo->query("SHOW CREATE TABLE `$source`.`$table`")->fetch(PDO::FETCH_NUM)[1];
        $pdo->exec($ddl);
    }
    $sql = str_replace('USE `lumiq`;', "USE `$database`;", file_get_contents(__DIR__.'/../../database/add_categories.sql'));
    // Verify first installation and safe re-import of exactly the delivered SQL.
    for ($i = 0; $i < 2; $i++) {
        $statement = $pdo->query($sql);
        while ($statement->nextRowset()) {
        }
        $statement->closeCursor();
    }
    $imageColorSql = file_get_contents(__DIR__.'/../../database/add_product_image_color.sql');
    for ($i = 0; $i < 2; $i++) {
        foreach (explode(';', $imageColorSql) as $statement) {
            if (trim($statement) !== '') {
                $result = $pdo->query($statement);
                $result->closeCursor();
            }
        }
    }
    putenv('DB_DATABASE='.$database);
    putenv('APP_ENV=testing');
    putenv('SESSION_DRIVER=array');
    putenv('CACHE_STORE=array');
    chdir(__DIR__.'/..');
    passthru(escapeshellarg(PHP_BINARY).' vendor/phpunit/phpunit/phpunit', $code);
} finally {
    if ($created && preg_match('/^lumiq_qa_[a-f0-9]{12}$/', $database)) {
        $pdo->exec("DROP DATABASE `$database`");
        echo "\nĐã xóa database kiểm thử tạm; database $source không thay đổi.\n";
    }
}
exit($code);
