<?php

namespace App\Http\Requests\User;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user()->load('roles');
        $role = $user->roles->first()?->slug ?? '';

        if (!in_array($role, ['dean', 'area-coordinator', 'program-coordinator'])) {
            return false;
        }

        if ($user->program_id != $this->program_id) {
            return false;
        }

        if ($role === 'area-coordinator') {
            $subArea = \App\Models\SubArea::find($this->sub_area_id);
            if (!$subArea || !in_array($subArea->area_id, $user->areaAssignments()->pluck('area_id')->toArray())) {
                return false;
            }
        }

        return true;
    }

    public function rules(): array
    {
        return [
            'sub_area_id' => 'required|exists:sub_areas,id',
            'program_id'  => 'required|exists:programs,id',
            'doc_type'    => 'required|in:input,process,outcome',
            'file'        => [
                'required',
                'file',
                'max:51200', // 50MB
                'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,gif',
            ],
            'title'       => 'required|string|max:255',
            'notes'       => 'nullable|string|max:1000',
        ];
    }
}
