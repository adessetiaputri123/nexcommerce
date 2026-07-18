<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorOrder;
use Illuminate\Support\Collection;

class VendorOrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->accessibleVendorIds($user)
            ->isNotEmpty();
    }

    public function view(
        User $user,
        VendorOrder $vendorOrder,
    ): bool {
        return $this->accessibleVendorIds($user)
            ->contains((int) $vendorOrder->vendor_id);
    }

    public function updateStatus(
        User $user,
        VendorOrder $vendorOrder,
    ): bool {
        return $this->view($user, $vendorOrder);
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
