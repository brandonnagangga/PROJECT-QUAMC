<?php

namespace App\Rag\Retrieval;

use Illuminate\Support\Str;

class EmbeddingService
{
    /**
     * Local sparse vectors keep the retrieval layer functional even when
     * an external embedding provider has not been configured yet.
     */
    public function embedText(string $text): array
    {
        $tokens = collect(preg_split('/[^a-z0-9]+/i', Str::lower($text)) ?: [])
            ->filter(fn ($token) => Str::length($token) > 2)
            ->countBy()
            ->sortDesc()
            ->take((int) config('retrieval.embedding_dimensions', 64));

        $total = max(1, $tokens->sum());

        return $tokens
            ->map(fn ($count) => round($count / $total, 6))
            ->all();
    }

    public function cosineSimilarity(array $left, array $right): float
    {
        $keys = array_unique([...array_keys($left), ...array_keys($right)]);
        $dot = 0.0;
        $leftNorm = 0.0;
        $rightNorm = 0.0;

        foreach ($keys as $key) {
            $l = (float) ($left[$key] ?? 0);
            $r = (float) ($right[$key] ?? 0);
            $dot += $l * $r;
            $leftNorm += $l ** 2;
            $rightNorm += $r ** 2;
        }

        if ($leftNorm <= 0 || $rightNorm <= 0) {
            return 0.0;
        }

        return $dot / (sqrt($leftNorm) * sqrt($rightNorm));
    }
}
