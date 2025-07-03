<?php

namespace App\Http\Controllers;

use App\Models\TypingResult;
use Illuminate\Http\Request;

class LeaderboardController extends Controller
{
    public function index()
{
    $topUsers = TypingResult::select('user_id', 'wpm', 'test_type', 'duration')
        ->with('user:id,name')
        ->orderByDesc('wpm')
        ->get()
        ->unique('user_id')
        ->take(10)
        ->values(); 

    return response()->json($topUsers);
}
}
