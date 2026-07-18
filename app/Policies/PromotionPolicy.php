<?php

namespace App\Policies;

use App\Models\Promotion;
use App\Models\User;

class PromotionPolicy
{
    public function viewAny(
        User $user,
    ): bool {
        return $this->isSuperAdmin(
            $user,
        );
    }

    public function view(
        User $user,
        Promotion $promotion,
    ): bool {
        return $this->isSuperAdmin(
            $user,
        );
    }

    public function create(
        User $user,
    ): bool {
        return $this->isSuperAdmin(
            $user,
        );
    }

    public function update(
        User $user,
        Promotion $promotion,
    ): bool {
        return $this->isSuperAdmin(
            $user,
        );
    }

    public function delete(
        User $user,
        Promotion $promotion,
    ): bool {
        return $this->isSuperAdmin(
            $user,
        );
    }

    private function isSuperAdmin(
        User $user,
    ): bool {
        return $user->role === 'super_admin';
    }
}
