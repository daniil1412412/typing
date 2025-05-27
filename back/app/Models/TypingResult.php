<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TypingResult extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'wpm', 'accuracy', 'errors', 'duration', 'raw_text', 'input_text'];

    // Определение отношения "принадлежит пользователю"
    public function user()
    {
        return $this->belongsTo(User::class);
    }
public function errorLogs()
{
    return $this->hasMany(ErrorLog::class, 'result_id');
}

}
