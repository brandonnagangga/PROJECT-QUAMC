<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = Notification::with(['document.subArea.area', 'document.program'])

            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(function ($n) {
                return [
                    'id' => $n->id,
                    'type' => $n->type,
                    'message' => $n->message,
                    'is_read' => $n->is_read,
                    'document_id' => $n->document_id,
                    'document_title' => $n->document?->title,
                    'created_at' => $n->created_at->format('M j, Y H:i'),
                    'time_ago' => $n->created_at->diffForHumans(),
                ];
            });

        $unreadCount = Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)->count();

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
            'unreadCount' => $unreadCount,
        ]);
    }

    public function markRead(Request $request, Notification $notification)
    {
        if ($notification->user_id !== $request->user()->id) {
            abort(403);
        }
        $notification->update(['is_read' => true, 'read_at' => now()]);
        return back()->with('success', 'Notification marked as read.');
    }

    public function markAllRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);
        return back()->with('success', 'All notifications marked as read.');
    }
}
