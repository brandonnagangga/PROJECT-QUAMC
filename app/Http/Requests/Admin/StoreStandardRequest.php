<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreStandardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['admin', 'director']) ?? false;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'code' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:2000',
            'area_id' => 'nullable|exists:areas,id',
            'sub_area_id' => 'nullable|exists:sub_areas,id',
            'doc_type' => 'nullable|in:input,process,outcome',
            'file' => 'required|file|max:51200|mimes:pdf',
        ];
    }
}
