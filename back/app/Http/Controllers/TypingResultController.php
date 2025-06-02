<?php

namespace App\Http\Controllers;

use App\Models\UserStat;
use Illuminate\Http\Request;
use App\Models\TypingResult;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class TypingResultController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'wpm' => 'required|numeric',
            'accuracy' => 'required|numeric',
            'errors' => 'required|numeric',
            'duration' => 'required|numeric',
            'raw_text' => 'required|string',
            'input_text' => 'required|string',
            'error_log' => 'nullable|array',
            'error_log.*.char_index' => 'required|integer',
            'error_log.*.expected' => 'nullable|string|size:1',
            'error_log.*.actual' => 'nullable|string|size:1',
        ]);

        $userId = Auth::id();
        $typingResult = TypingResult::create([
            'user_id' => $userId,
            'wpm' => $validated['wpm'],
            'accuracy' => $validated['accuracy'],
            'errors' => $validated['errors'],
            'duration' => $validated['duration'],
            'raw_text' => $validated['raw_text'],
            'input_text' => $validated['input_text'],
        ]);
        if (!empty($validated['error_log'])) {
            foreach ($validated['error_log'] as $error) {
                if (!empty($error['expected']) && !empty($error['actual'])) {
                    $typingResult->errorLogs()->create($error);
                }
            }
        }
        $oldResults = TypingResult::where('user_id', $userId)
            ->orderByDesc('created_at')
            ->skip(5)
            ->take(PHP_INT_MAX)
            ->get();

        foreach ($oldResults as $result) {
            $result->errorLogs()->delete();
            $result->delete();
        }
        $stat = UserStat::firstOrNew(['user_id' => $userId]);
        if (!$stat->best_wpm || $validated['wpm'] > $stat->best_wpm) {
            $stat->best_wpm = $validated['wpm'];
        }
        $stat->total_tests = ($stat->total_tests ?? 0) + 1;
        $lastAccuracies = TypingResult::where('user_id', $userId)
            ->orderByDesc('created_at')
            ->take(5)
            ->pluck('accuracy');

        $stat->avg_accuracy = $lastAccuracies->avg();

        $stat->save();

        return response()->json([
            'message' => 'Result saved successfully!',
            'data' => $typingResult
        ], 201);
    }


    public function index(Request $request)
    {
        $results = TypingResult::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(5);

        return response()->json($results);
    }
     public function stats()
    {
        $user = Auth::user();

        $stats = UserStat::where('user_id', $user->id)->first();

        if (!$stats) {
            return response()->json([
                'best_wpm' => 0,
                'avg_accuracy' => 0,
                'total_tests' => 0
            ]);
        }

        return response()->json($stats);
    }
        public function leaderboard()
    {
    $leaders = UserStat::with('user')->orderBy('best_wpm', 'desc')->limit(10)->get();


        return response()->json(['data' => $leaders]);
    }

        private function filterWords(array $words): array
    {
        return array_values(array_filter($words, function($word) {
            return preg_match('/^[а-яёa-z]+$/iu', $word);
        }));
    }
    private function loadDictionary(string $lang): array
    {
        $path = storage_path("app/dictionaries/{$lang}.txt");
        if (!File::exists($path)) {
            return [];
        }

        $words = File::lines($path)
            ->filter(fn($line) => trim($line) !== '')
            ->map(fn($line) => trim($line))
            ->toArray();
        $words = $this->filterWords($words);
        
        return $words;
    }
    private function getRandomText(string $lang, int $wordCount = 50): string
    {
        $words = $this->loadDictionary($lang);
        if (empty($words)) {
            return '';
        }
        shuffle($words);
        return implode(' ', array_slice($words, 0, $wordCount));
    }

    public function getText(Request $request): JsonResponse
    {
        $lang = $request->query('lang', 'ru');
        $text = $this->getRandomText($lang, 50);
        if (!$text) {
            return response()->json(['error' => 'Словарь для выбранного языка не найден.'], 404);
        }

        return response()->json(['text' => $text]);
    }

    public function getAdaptiveText(Request $request): JsonResponse
    {   
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Необходимо войти в систему.'], 401);
        }
        $lang = $request->query('lang', 'ru');
        $words = $this->loadDictionary($lang);
        if (empty($words)) {
            return response()->json(['error' => 'Словарь для выбранного языка не найден.'], 404);
        }
        $user = $request->user();
        $errors = DB::table('error_logs')
            ->join('typing_results', 'error_logs.result_id', '=', 'typing_results.id')
            ->where('typing_results.user_id', $user->id)
            ->select('error_logs.expected')
            ->groupBy('error_logs.expected')
            ->orderByRaw('COUNT(*) DESC')
            ->limit(5)
            ->pluck('expected')
            ->toArray();

        if (empty($errors)) {
            return response()->json(['text' => 'Нет данных об ошибках. Сначала пройдите обычный тест.']);
        }

        $text = $this->generateTextWithErrors($words, $errors, 300);

        return response()->json(['text' => $text]);
    }
        private function generateTextWithErrors(array $words, array $errors, int $length = 300): string
    {
        $text = '';

        while (mb_strlen($text) < $length) {
            $word = $words[array_rand($words)];
            $insertErrorChar = false;
            foreach ($errors as $char) {
                if (mb_stripos($word, $char) !== false) {
                    $insertErrorChar = true;
                    break;
                }
            }

            if ($insertErrorChar || rand(0, 1)) {
                $text .= $word . ' ';
            } else {
                $insertPos = rand(0, mb_strlen($word));
                $errorChar = $errors[array_rand($errors)];
                $wordWithError = mb_substr($word, 0, $insertPos) . $errorChar . mb_substr($word, $insertPos);
                $text .= $wordWithError . ' ';
            }
        }

        return trim($text);
    }
    public function frequentErrors(Request $request): JsonResponse
    {
        $user = $request->user();

        $errors = DB::table('error_logs')
            ->join('typing_results', 'error_logs.result_id', '=', 'typing_results.id')
            ->where('typing_results.user_id', $user->id)
            ->select('error_logs.expected', DB::raw('count(*) as total'))
            ->groupBy('error_logs.expected')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        return response()->json($errors);
    }
    public function getTextByWords(Request $request): JsonResponse
    {
        $lang = $request->query('lang', 'en');
        $count = (int) $request->query('count', 35);
        $words = $this->loadDictionary($lang);

        if (empty($words)) {
            return response()->json(['error' => 'Словарь для выбранного языка не найден.'], 404);
        }
        shuffle($words);
        $text = implode(' ', array_slice($words, 0, $count));

        return response()->json(['text' => $text]);
    }

}
