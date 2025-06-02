<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ErrorLog extends Model
{
    use HasFactory;

    protected $fillable = ['result_id', 'char_index', 'expected', 'actual'];
        public function result()
    {
        return $this->belongsTo(TypingResult::class, 'result_id');
    }
}
