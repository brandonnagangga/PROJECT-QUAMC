<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['key', 'value'];
    public $timestamps = true;

    /**
     * Get a setting value by key, with an optional default.
     */
    public static function getValue(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    /**
     * Set a setting value by key (create or update).
     */
    public static function setValue(string $key, mixed $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
    }

    /**
     * Get all settings as a key-value array.
     */
    public static function allAsArray(): array
    {
        return static::pluck('value', 'key')->toArray();
    }
}
