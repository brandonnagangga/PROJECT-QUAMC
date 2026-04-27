<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$file = \App\Models\AreaItemFile::where('mime_type', 'application/pdf')->first();
$absolutePath = storage_path('app/private/' . $file->file_path);
if (!file_exists($absolutePath)) $absolutePath = storage_path('app/' . $file->file_path);

echo "Path: " . $absolutePath . "\n";

$winBinPath = base_path('bin/poppler/bin/pdftotext.exe');
if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN' && file_exists($winBinPath)) {
    echo "Using binary: $winBinPath\n";
    $pdfExtractor = new \Spatie\PdfToText\Pdf($winBinPath);
} else {
    $pdfExtractor = new \Spatie\PdfToText\Pdf();
}

try {
    $text = $pdfExtractor->setPdf($absolutePath)
        ->setOptions(['-layout'])
        ->text();
    echo "Extracted:\n" . substr($text, 0, 200) . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
