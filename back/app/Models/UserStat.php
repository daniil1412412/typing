<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserStat extends Model
{
    use HasFactory;
    protected $table = 'user_stats';
    public function user()
{
    return $this->belongsTo(User::class);
}
    protected $fillable = [
        'user_id',
        'best_wpm',
        'avg_accuracy',
        'total_tests',
    ];

    public $timestamps = false;
}
