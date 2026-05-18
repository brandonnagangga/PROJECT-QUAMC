<?php

namespace App\Http\Controllers;

use App\Models\AreaItem;
use App\Models\AreaItemFile;
use App\Models\AreaItemResponse;
use App\Models\AccreditationCycle;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AreaItemFileController extends Controller
{
    /**
     * Upload one or more files for an item (multi-upload).
     */
    public function store(Request $request)
    {
        $request->validate([
            'area_item_id' => 'required|exists:area_items,id',
            'files'        => 'required|array|min:1',
            'files.*'      => 'required|file|max:51200', // 50 MB per file
        ]);

        $user      = $request->user();
        $programId = $user->program_id;
        $cycle     = AccreditationCycle::active();
        $itemId    = $request->area_item_id;

        if (!$programId) {
            return response()->json(['message' => 'You are not assigned to a program.'], 403);
        }

        if (!$cycle) {
            return response()->json(['message' => 'No active accreditation cycle.'], 422);
        }

        // Find or create the response record so we can link files to it
        $response = AreaItemResponse::firstOrCreate(
            [
                'area_item_id' => $itemId,
                'program_id'   => $programId,
                'cycle_id'     => $cycle?->id,
            ],
            [
                'status'     => 'draft',
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ]
        );

        $created = [];
        foreach ($request->file('files') as $file) {
            $path = $file->store("item-files/{$itemId}/{$programId}", 'local');

            $record = AreaItemFile::create([
                'area_item_id'      => $itemId,
                'response_id'       => $response->id,
                'program_id'        => $programId,
                'cycle_id'          => $cycle?->id,
                'uploaded_by'       => $user->id,
                'original_filename' => $file->getClientOriginalName(),
                'file_path'         => $path,
                'file_size_bytes'   => $file->getSize(),
                'mime_type'         => $file->getMimeType(),
                'scan_status'       => 'pending',
            ]);

            $created[] = [
                'id'                => $record->id,
                'original_filename' => $record->original_filename,
                'file_size_bytes'   => $record->file_size_bytes,
                'size_formatted'    => $record->fileSizeFormatted(),
                'mime_type'         => $record->mime_type,
                'caption'           => $record->caption,
                'scan_status'       => $record->scan_status,
            ];
        }

        return response()->json([
            'message' => count($created) . ' file(s) uploaded.',
            'files'   => $created,
        ]);
    }

    /**
     * Update a supporting evidence file caption.
     */
    public function update(Request $request, AreaItemFile $file)
    {
        $user = $request->user();
        $role = $user->roles->first()?->slug;
        $canUpdateProgramFile = $file->program_id === $user->program_id
            && in_array($role, ['area-coordinator', 'program-coordinator']);

        if ($file->uploaded_by !== $user->id && !in_array($role, ['admin', 'dean', 'director']) && !$canUpdateProgramFile) {
            abort(403, 'You cannot update this file.');
        }

        $validated = $request->validate([
            'caption' => 'nullable|string|max:2000',
        ]);

        $file->update([
            'caption' => $validated['caption'] ?? null,
        ]);

        return response()->json([
            'message' => 'Caption saved.',
            'file' => [
                'id'      => $file->id,
                'caption' => $file->caption,
            ],
        ]);
    }

    /**
     * Delete a supporting evidence file (own uploads only, unless admin/dean).
     */
    public function destroy(Request $request, AreaItemFile $file)
    {
        $user = $request->user();
        $role = $user->roles->first()?->slug;

        if ($file->uploaded_by !== $user->id && !in_array($role, ['admin', 'dean', 'director'])) {
            abort(403, 'You can only delete your own files.');
        }

        Storage::disk('local')->delete($file->file_path);
        $file->delete();

        return response()->json(['message' => 'File deleted.']);
    }

    /**
     * Download / serve a file (forces download).
     */
    public function download(AreaItemFile $file)
    {
        if (!Storage::disk('local')->exists($file->file_path)) {
            abort(404, 'File not found.');
        }

        $file->loadMissing('item.subArea.area');
        ActivityLogService::log(request()->user(), 'document.item_file_downloaded', $file, [
            'filename'      => $file->original_filename,
            'file_id'       => $file->id,
            'item_label'    => $file->item?->label,
            'area_name'     => $file->item?->subArea?->area?->name,
            'sub_area_name' => $file->item?->subArea?->name,
        ]);

        return Storage::disk('local')->download($file->file_path, $file->original_filename);
    }

    /**
     * Preview a file inline in the browser (PDF/image renders; others fall back to download).
     */
    public function preview(AreaItemFile $file)
    {
        if (!Storage::disk('local')->exists($file->file_path)) {
            abort(404, 'File not found.');
        }

        $fullPath = Storage::disk('local')->path($file->file_path);
        $mime     = $file->mime_type ?: mime_content_type($fullPath) ?: 'application/octet-stream';

        return response()->file($fullPath, [
            'Content-Type'        => $mime,
            'Content-Disposition' => 'inline; filename="' . $file->original_filename . '"',
        ]);
    }
}
