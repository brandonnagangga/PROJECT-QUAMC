<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentVersionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'version_number'    => $this->version_number,
            'original_filename' => $this->original_filename,
            'file_size_bytes'   => $this->file_size_bytes,
            'file_size'         => $this->when(method_exists($this->resource, 'fileSizeFormatted'), $this->fileSizeFormatted()),
            'uploaded_by'       => $this->uploader?->name,
            'uploaded_at'       => $this->created_at->format('M j, Y'),
            'scan_status'       => $this->scan_status,
            'notes'             => $this->notes,
        ];
    }
}
