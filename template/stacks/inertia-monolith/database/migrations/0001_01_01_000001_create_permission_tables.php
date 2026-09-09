<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['permissions', 'roles'] as $name) {
            Schema::create($name, function (Blueprint $table): void {
                $table->bigIncrements('id');
                $table->string('name');
                $table->string('guard_name');
                $table->timestamps();
                $table->unique(['name', 'guard_name']);
            });
        }
        foreach (['permission' => 'permissions', 'role' => 'roles'] as $singular => $plural) {
            Schema::create('model_has_'.$plural, function (Blueprint $table) use ($singular, $plural): void {
                $table->foreignId($singular.'_id')->constrained($plural)->cascadeOnDelete();
                $table->string('model_type');
                $table->uuid('model_id');
                $table->index(['model_id', 'model_type']);
                $table->primary([$singular.'_id', 'model_id', 'model_type']);
            });
        }
        Schema::create('role_has_permissions', function (Blueprint $table): void {
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->primary(['permission_id', 'role_id']);
        });
    }

    public function down(): void
    {
        foreach (['role_has_permissions', 'model_has_roles', 'model_has_permissions', 'roles', 'permissions'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
