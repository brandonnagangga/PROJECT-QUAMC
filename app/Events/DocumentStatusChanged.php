<?php

namespace App\Events;

use App\Models\Document;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DocumentStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $message;
    public string $documentTitle;
    public string $status;
    public string $documentId;

    public function __construct(
        public Document $document,
        public User $actor,
        string $action
    ) {
        $this->documentId = $document->id;
        $this->documentTitle = $document->title;
        $this->status = $action;
        $this->message = $actor->name . ' ' . $action . ' "' . $document->title . '"';
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('documents'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'status.changed';
    }

    public function broadcastWith(): array
    {
        return [
            'message' => $this->message,
            'document_id' => $this->documentId,
            'document_title' => $this->documentTitle,
            'status' => $this->status,
            'actor' => $this->actor->name,
        ];
    }
}
