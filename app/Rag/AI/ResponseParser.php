<?php

namespace App\Rag\AI;

class ResponseParser
{
    public function parseJson(string $content): array
    {
        $content = trim($content);

        if (str_starts_with($content, '```')) {
            $content = preg_replace('/^```(?:json)?|```$/m', '', $content) ?? $content;
            $content = trim($content);
        }

        $decoded = json_decode($content, true);

        return is_array($decoded) ? $decoded : [];
    }
}
