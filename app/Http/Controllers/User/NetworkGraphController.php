<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NetworkGraphController extends Controller
{
    /**
     * Display the network graph visualization page.
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewNetworkGraph', $request->user());

        return Inertia::render('NetworkGraph/Index', [
            'title' => 'Network Graph Visualization',
        ]);
    }
}
