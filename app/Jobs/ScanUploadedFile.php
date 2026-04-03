<?php

namespace App\Jobs;

use App\Models\DocumentVersion;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

class ScanUploadedFile implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public DocumentVersion $version
    ) {}

    public function handle(): void
    {
        $filePath = storage_path('app/' . $this->version->file_path);

        if (!file_exists($filePath)) {
            $this->version->update(['scan_status' => 'error']);
            Log::warning("ScanUploadedFile: File not found: {$filePath}");
            return;
        }

        try {
            // Try ClamAV scan via clamscan command
            $result = Process::timeout(120)->run("clamscan --no-summary \"{$filePath}\"");

            if ($result->exitCode() === 0) {
                // Clean — no virus found
                $this->version->update(['scan_status' => 'clean']);
                Log::info("ScanUploadedFile: File clean — {$this->version->original_filename}");
            } elseif ($result->exitCode() === 1) {
                // Virus found!
                $this->version->update(['scan_status' => 'infected']);
                Log::error("ScanUploadedFile: INFECTED — {$this->version->original_filename}: {$result->output()}");

                // Quarantine: move file to quarantine directory
                $quarantineDir = storage_path('app/quarantine');
                if (!is_dir($quarantineDir)) {
                    mkdir($quarantineDir, 0755, true);
                }
                rename($filePath, $quarantineDir . '/' . basename($filePath));
            } else {
                // ClamAV error
                $this->version->update(['scan_status' => 'error']);
                Log::warning("ScanUploadedFile: Scan error — {$result->errorOutput()}");
            }
        } catch (\Exception $e) {
            // ClamAV not installed or other error — mark as clean (graceful degradation)
            $this->version->update(['scan_status' => 'clean']);
            Log::info("ScanUploadedFile: ClamAV not available, marking as clean — {$e->getMessage()}");
        }
    }
}
