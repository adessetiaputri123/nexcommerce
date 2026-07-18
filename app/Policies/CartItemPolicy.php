<?php

namespace App\Policies;

use App\Models\CartItem;
use App\Models\User;

class CartItemPolicy
{
    public function update(User $user, CartItem $cartItem): bool
    {
        return $this->ownsCartItem($user, $cartItem);
    }

    public function delete(User $user, CartItem $cartItem): bool
    {
        return $this->ownsCartItem($user, $cartItem);
    }

    private function ownsCartItem(
        User $user,
        CartItem $cartItem,
    ): bool {
        if ($user->role !== 'customer') {
            return false;
        }

        return $cartItem->cart()
            ->where('customer_id', $user->id)
            ->exists();
    }
}
