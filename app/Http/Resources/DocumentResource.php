<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'title'            => $this->title,
            'doc_type'         => $this->doc_type,
            'status'           => $this->status,
            'approval_status'  => $this->approval_status ?? 'pending',
            'rejection_reason' => $this->rejection_reason,
            'version'          => 'v' . $this->current_version,
            'uploader'         => $this->uploader?->name,
            'can_edit'         => $this->when(isset($this->can_edit), $this->can_edit),
            'can_download'     => $this->when(isset($this->can_download), $this->can_download),
            'can_approve'      => $this->when(isset($this->can_approve), $this->can_approve),
            'doc_id'           => $this->id,
            'versions'         => DocumentVersionResource::collection($this->whenLoaded('versions')),
            'sub_area'         => $this->when($this->relationLoaded('subArea'), $this->subArea?->name),
            'area'             => $this->when($this->relationLoaded('subArea'), $this->subArea?->area?->name),
            'program'          => $this->when($this->relationLoaded('program'), $this->program?->name),
            'program_code'     => $this->when($this->relationLoaded('program'), $this->program?->code),
            'updated_at'       => $this->updated_at?->format('M j, Y'),
        ];
    }
}
