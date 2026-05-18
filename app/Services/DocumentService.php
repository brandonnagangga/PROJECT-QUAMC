<?php

namespace App\Services;

use App\Events\DocumentStatusChanged;
use App\Jobs\Documents\IngestDocumentPipelineJob;
use App\Jobs\ScanUploadedFile;
use App\Models\Document;
use App\Models\DocumentVersion;
use App\Models\User;
use App\Traits\LogsActivity;
use Illuminate\Http\UploadedFile;

class DocumentService
{
    use LogsActivity;
    /**
     * Create a new document or add a version if it exists.
     */
    public function storeDocument(array $data, UploadedFile $file, User $user): Document
    {
        $existing = Document::where('sub_area_id', $data['sub_area_id'])
            ->where('program_id', $data['program_id'])
            ->where('doc_type', $data['doc_type'])
            ->first();

        if ($existing) {
            return $this->addVersion($existing, $file, $user, $data['notes'] ?? null);
        }

        return $this->createNewDocument($data, $file, $user);
    }

    /**
     * Create a brand new document with its first version.
     */
    private function createNewDocument(array $data, UploadedFile $file, User $user): Document
    {
        // Validate MIME type from file content (not just extension)
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file->getRealPath());
        finfo_close($finfo);

        $allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/jpeg',
            'image/png',
            'image/gif',
        ];

        if (!in_array($mimeType, $allowedMimes)) {
            abort(422, 'Invalid file type detected');
        }

        // Generate secure filename to prevent directory traversal
        $extension = $file->getClientOriginalExtension();
        $secureFilename = hash('sha256', uniqid() . time()) . '.' . $extension;
        $path = $file->storeAs('documents', $secureFilename, 'local');

        $document = Document::create([
            'sub_area_id'     => $data['sub_area_id'],
            'program_id'      => $data['program_id'],
            'doc_type'        => $data['doc_type'],
            'uploaded_by'     => $user->id,
            'title'           => $data['title'],
            'status'          => 'draft',
            'current_version' => 1,
        ]);

        $version = $this->createDocumentVersion($document, $file, $path, $user, 1, $data['notes'] ?? null);

        ScanUploadedFile::dispatch($version);
        IngestDocumentPipelineJob::dispatch(DocumentVersion::class, $version->id);
        event(new DocumentStatusChanged($document, $user, 'uploaded'));

        return $document;
    }

    /**
     * Add a new version to an existing document.
     */
    public function addVersion(Document $document, UploadedFile $file, User $user, ?string $notes = null): Document
    {
        // Validate MIME type from file content
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file->getRealPath());
        finfo_close($finfo);

        $allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/jpeg',
            'image/png',
            'image/gif',
        ];

        if (!in_array($mimeType, $allowedMimes)) {
            abort(422, 'Invalid file type detected');
        }

        // Generate secure filename
        $extension = $file->getClientOriginalExtension();
        $secureFilename = hash('sha256', uniqid() . time()) . '.' . $extension;
        $path = $file->storeAs('documents', $secureFilename, 'local');
        
        $newVersion = $document->current_version + 1;

        $version = $this->createDocumentVersion($document, $file, $path, $user, $newVersion, $notes);

        // New version uploaded → revert to draft (no separate approval state)
        $document->update([
            'current_version' => $newVersion,
            'status'          => 'draft',
        ]);

        ScanUploadedFile::dispatch($version);
        IngestDocumentPipelineJob::dispatch(DocumentVersion::class, $version->id);
        event(new DocumentStatusChanged($document, $user, 'uploaded new version'));

        return $document;
    }

    /**
     * Create a document version record.
     */
    private function createDocumentVersion(
        Document $document,
        UploadedFile $file,
        string $path,
        User $user,
        int $versionNumber,
        ?string $notes
    ): DocumentVersion {
        return DocumentVersion::create([
            'document_id'       => $document->id,
            'uploaded_by'       => $user->id,
            'version_number'    => $versionNumber,
            'file_path'         => $path,
            'original_filename' => $file->getClientOriginalName(),
            'file_size_bytes'   => $file->getSize(),
            'mime_type'         => $file->getMimeType(),
            'notes'             => $notes,
            'scan_status'       => 'pending',
        ]);
    }

    /**
     * Get download path for a document version.
     */
    public function getVersionDownloadPath(DocumentVersion $version): ?string
    {
        $path = storage_path('app/' . $version->file_path);
        return file_exists($path) ? $path : null;
    }

    /**
     * Get secure download path with path traversal protection.
     */
    public function getSecureDownloadPath(DocumentVersion $version): ?string
    {
        $filePath = $version->file_path;

        // Prevent path traversal attacks
        if (str_contains($filePath, '..') || str_contains($filePath, '//')) {
            abort(403, 'Invalid file path');
        }

        // Get real paths and validate file is within allowed directory
        $realPath = realpath(storage_path('app/' . $filePath));
        $allowedPath = realpath(storage_path('app/documents'));

        // Ensure paths are valid and file is within documents directory
        if (!$realPath || !$allowedPath || !str_starts_with($realPath, $allowedPath)) {
            abort(403, 'Access denied');
        }

        // Verify file exists
        if (!file_exists($realPath)) {
            return null;
        }

        return $realPath;
    }
}
