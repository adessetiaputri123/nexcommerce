<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use InvalidArgumentException;

class ActivityLogService
{
    public const PAYMENT_COMPLETED =
    'payment.completed';

    public const VENDOR_ORDER_STATUS_CHANGED =
    'vendor_order.status_changed';

    public const WITHDRAWAL_REQUESTED =
    'withdrawal.requested';

    public const WITHDRAWAL_APPROVED =
    'withdrawal.approved';

    public const WITHDRAWAL_REJECTED =
    'withdrawal.rejected';

    public const WITHDRAWAL_PAID =
    'withdrawal.paid';

    public function record(
        string $action,
        ?User $actor = null,
        ?Model $subject = null,
        ?Vendor $vendor = null,
        ?string $description = null,
        array $properties = [],
        ?Request $request = null,
    ): ActivityLog {
        $action = trim($action);

        if ($action === '') {
            throw new InvalidArgumentException(
                'Action activity log tidak boleh kosong.',
            );
        }

        $request ??= $this->resolveRequest();

        return ActivityLog::query()->create([
            'actor_id' => $actor?->id,

            'vendor_id' => $vendor?->id,

            'action' => $action,

            'subject_type' =>
            $subject?->getMorphClass(),

            'subject_id' =>
            $subject?->getKey(),

            'description' =>
            $description,

            'properties' =>
            $properties !== []
                ? $properties
                : null,

            'ip_address' =>
            $request?->ip(),

            'user_agent' =>
            $request?->userAgent(),
        ]);
    }

    private function resolveRequest(): ?Request
    {
        if (
            !app()->bound('request') ||
            app()->runningInConsole()
        ) {
            return null;
        }

        $request = request();

        return $request instanceof Request
            ? $request
            : null;
    }
}
