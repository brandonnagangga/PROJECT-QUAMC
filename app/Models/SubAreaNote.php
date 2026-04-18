<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubAreaNote extends Model
{
    protected $table = 'sub_area_notes';

    protected $fillable = ['sub_area_id', 'program_id', 'notes', 'updated_by'];

    public function subArea()
    {
        return $this->belongsTo(SubArea::class);
    }

    public function program()
    {
        return $this->belongsTo(Program::class);
    }

    public function editor()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
