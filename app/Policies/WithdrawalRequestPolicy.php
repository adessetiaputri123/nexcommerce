<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WithdrawalRequest;

class WithdrawalRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isAdmin($user);
    }

    public function view(
        User $user,
        WithdrawalRequest $withdrawalRequest,
    ): bool {
        return $this->isAdmin($user);
    }

    public function update(
        User $user,
        WithdrawalRequest $withdrawalRequest,
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
