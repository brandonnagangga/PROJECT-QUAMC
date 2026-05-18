<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;

class ActivityLogService
{
    /**
     * Log an accreditation workflow event with a human-readable description.
     *
     * @param \App\Models\User|null $user
     * @param string  $event       machine key, e.g. 'area.submitted_to_dean'
     * @param Model|null $target   the primary model involved (Area, AreaSubmission…)
     * @param array   $meta        extra data merged into changes column
     * @param string|null $ip
     */
    public static function log(
        $user,
        string $event,
        ?Model $target = null,
        array  $meta   = [],
        ?string $ip    = null
    ): void {
        ActivityLog::create([
            'user_id'    => $user?->id,
            'event'      => $event,
            'model_type' => $target ? get_class($target) : null,
            'model_id'   => $target?->getKey(),
            'changes'    => array_merge($meta, ['description' => static::describe($event, $user, $meta)]),
            'ip_address' => $ip ?? request()?->ip(),
        ]);
    }

    /**
     * Build a human-readable sentence for an event.
     */
    private static function describe(string $event, $user, array $meta): string
    {
        $name     = $user?->name ?? 'System';
        $area     = $meta['area_name']    ?? 'an area';
        $program  = $meta['program_name'] ?? '';
        $subArea  = $meta['sub_area_name'] ?? '';
        $document = $meta['document_title'] ?? 'a document';
        $filename = $meta['filename'] ?? 'a file';
        $version  = $meta['version_number'] ?? null;

        return match ($event) {
            'document.downloaded'
                => "{$name} downloaded \"{$filename}\" from document \"{$document}\"." . ($program ? " (Program: {$program})" : ''),
            'document.version_downloaded'
                => "{$name} downloaded version {$version} of \"{$document}\" as \"{$filename}\"." . ($program ? " (Program: {$program})" : ''),
            'document.item_file_downloaded'
                => "{$name} downloaded supporting evidence \"{$filename}\"." . ($area !== 'an area' ? " (Area: {$area}" . ($subArea ? " / {$subArea}" : '') . ")" : ''),
            'area.submitted_to_dean'
                => "Area coordinator {$name} submitted \"{$area}\" to the Dean for review." . ($program ? " (Program: {$program})" : ''),
            'area.returned_by_dean'
                => "Dean {$name} returned \"{$area}\" for revision." . ($program ? " (Program: {$program})" : ''),
            'area.approved_by_dean'
                => "Dean {$name} approved \"{$area}\"." . ($program ? " (Program: {$program})" : ''),
            'area.note_replied'
                => "{$name} replied to a return note for \"{$area}\".",
            'user.created'
                => "New user account created: {$name}.",
            'user.area_assigned'
                => "Area \"{$area}\" assigned to {$name}.",
            default
                => "{$name} performed action: {$event}.",
        };
    }
}
