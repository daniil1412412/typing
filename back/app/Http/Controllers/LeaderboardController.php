<?php

namespace App\Http\Controllers;

use App\Models\TypingResult;
use Illuminate\Http\Request;

class LeaderboardController extends Controller
{
    public function index()
    {
        $topUsers = TypingResult::selectRaw('user_id, MAX(wpm) as max_wpm')
            ->groupBy('user_id')
            ->orderByDesc('max_wpm')
            ->with('user:id,name')
            ->take(10)
            ->get();

        return response()->json($topUsers);
    }
}
