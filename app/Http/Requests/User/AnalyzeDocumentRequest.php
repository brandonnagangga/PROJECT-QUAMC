<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class AnalyzeDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'standard_id' => 'required|exists:standards,id',
        ];
    }
}
