<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

class Category extends Model
{
    protected $fillable = ['name', 'slug', 'status', 'sort_order'];

    public static function isInstalled(): bool
    {
        return Schema::hasTable('categories') && Schema::hasColumn('products', 'category_id');
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
