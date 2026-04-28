<?php

namespace App\Http\Controllers\User;

use App\Actions\Quamc\AnalyzeSubmittedDocument;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\AnalyzeDocumentRequest;
use App\Models\Document;
use App\Models\Standard;

class DocumentEvaluationController extends Controller
{
    public function store(
        Document $document,
        AnalyzeDocumentRequest $request,
        AnalyzeSubmittedDocument $analyzeSubmittedDocument
    ) {
        $standard = Standard::query()
            ->whereKey($request->validated('standard_id'))
            ->where('is_active', true)
            ->where('index_status', 'indexed')
            ->firstOrFail();

        $analyzeSubmittedDocument($document, $standard, $request->user());

        return back()->with('success', 'Document analysis started. QUAMC will compute the final score after the comparison pipeline completes.');
    }
}
