<?php

namespace App\Policies;

use App\Models\Cart;
use App\Models\User;

class CartPolicy
{
    /**
     * Hanya customer yang dapat membuat keranjang.
     */
    public function create(User $user): bool
    {
        return $user->role === 'customer';
    }

    /**
     * Customer hanya dapat membuka keranjangnya sendiri.
     */
    public function view(User $user, Cart $cart): bool
    {
        return $user->role === 'customer'
            && (int) $cart->customer_id === (int) $user->id;
    }

    /**
     * Customer hanya dapat memperbarui keranjangnya sendiri.
     */
    public function update(User $user, Cart $cart): bool
    {
        return $this->view($user, $cart);
    }

    /**
     * Customer hanya dapat menghapus keranjangnya sendiri.
     */
    public function delete(User $user, Cart $cart): bool
    {
        return $this->view($user, $cart);
    }
}
