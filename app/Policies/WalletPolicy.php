<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Vendor;
use App\Models\Wallet;
use Illuminate\Support\Collection;

class WalletPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->accessibleVendorIds($user)
            ->isNotEmpty();
    }

    public function view(
        User $user,
        Wallet $wallet,
    ): bool {
        return $this->accessibleVendorIds($user)
            ->contains((int) $wallet->vendor_id);
    }

    private function accessibleVendorIds(
        User $user,
    ): Collection {
        $vendorIds = Vendor::query()
            ->where('owner_id', $user->id)
            ->pluck('id')
            ->map(fn($id): int => (int) $id);

        if ($user->vendor_id !== null) {
            $vendorIds->push(
                (int) $user->vendor_id,
            );
        }

        return $vendorIds
            ->unique()
            ->values();
    }
}
