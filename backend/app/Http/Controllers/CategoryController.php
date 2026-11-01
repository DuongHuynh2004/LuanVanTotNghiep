<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    private function requireSchema(): void
    {
        abort_unless(Category::isInstalled(), 503, 'Hãy nhập file database/add_categories.sql vào database lumiq bằng phpMyAdmin để bật quản lý danh mục.');
    }

    public function options(Request $request)
    {
        if (! Category::isInstalled()) {
            return ['ready' => false, 'data' => []];
        }
        $query = Category::orderBy('sort_order')->orderBy('name');
        if (! $request->is('api/admin/*')) {
            $query->where('status', 'active');
        }

        return ['ready' => true, 'data' => $query->get(['id', 'name', 'slug', 'status'])];
    }

    public function index(Request $request)
    {
        $this->requireSchema();
        $query = Category::withCount('products');
        if ($request->filled('q')) {
            $query->where('name', 'like', '%'.$request->string('q').'%');
        }
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return $query->orderBy('sort_order')->orderByDesc('id')->paginate(12);
    }

    public function save(Request $request, ?int $category = null)
    {
        $this->requireSchema();
        $model = $category ? Category::findOrFail($category) : new Category;
        $data = $request->validate([
            'name' => 'required|string|max:150',
            'slug' => ['required', 'string', 'max:191', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('categories')->ignore($model->id)],
            'status' => 'required|in:active,inactive',
            'sort_order' => 'required|integer|min:0|max:4294967295',
        ]);
        $model->fill($data)->save();

        return $model->loadCount('products');
    }

    public function destroy(int $category)
    {
        $this->requireSchema();
        Category::findOrFail($category)->delete();

        return ['message' => 'Đã xóa danh mục. Các sản phẩm được giữ lại và chuyển thành chưa phân loại.'];
    }
}
