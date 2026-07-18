<?php

namespace App\Policies;

use App\Models\ActivityLog;
use App\Models\User;

class ActivityLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isAdmin($user);
    }

    public function view(
        User $user,
        ActivityLog $activityLog,
    ): bool {
        return $this->isAdmin($user);
    }

    private function isAdmin(User $user): bool
    {
        return in_array(
            (string) $user->role,
            [
                'admin',
                'super_admin',
            ],
            true,
        );
    }
}
