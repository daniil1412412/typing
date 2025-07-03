<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->onDelete('cascade');
            $table->integer('total_tests')->default(0);
            $table->integer('best_wpm')->default(0);
            $table->float('avg_accuracy')->default(0);
            $table->timestamp('last_test_at')->nullable();
            $table->integer('errors')->default(0);
            $table->integer('duration')->default(60);
            $table->string('test_type');
            $table->timestamps();
        });
    }
    

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
