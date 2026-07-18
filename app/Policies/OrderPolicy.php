<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    /**
     * Customer dapat melihat daftar pesanannya sendiri.
     */
    public function viewAny(User $user): bool
    {
        return $user->role === 'customer';
    }

    /**
     * Hanya customer yang dapat membuat pesanan.
     */
    public function create(User $user): bool
    {
        return $user->role === 'customer';
    }

    /**
     * Customer hanya dapat melihat pesanannya sendiri.
     */
    public function view(User $user, Order $order): bool
    {
        return $user->role === 'customer'
            && (int) $order->customer_id === (int) $user->id;
    }
}
