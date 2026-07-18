<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AdminActivityLogController extends Controller
{
    public function index(
        Request $request,
    ): Response {
        Gate::authorize(
            'viewAny',
            ActivityLog::class,
        );

        $action = $request
            ->string('action')
            ->trim()
            ->toString();

        $search = $request
            ->string('search')
            ->trim()
            ->toString();

        $logs = ActivityLog::query()
            ->with([
                'actor:id,name,email,role',
                'vendor:id,shop_name',
            ])
            ->when(
                $action !== '',
                fn($query) =>
                $query->where(
                    'action',
                    $action,
                ),
            )
            ->when(
                $search !== '',
                function ($query) use ($search): void {
                    $query->where(
                        function ($subQuery) use (
                            $search,
                        ): void {
                            $subQuery
                                ->where(
                                    'description',
                                    'like',
                                    "%{$search}%",
                                )
                                ->orWhere(
                                    'action',
                                    'like',
                                    "%{$search}%",
                                )
                                ->orWhereHas(
                                    'actor',
                                    function ($actorQuery) use (
                                        $search,
                                    ): void {
                                        $actorQuery
                                            ->where(
                                                'name',
                                                'like',
                                                "%{$search}%",
                                            )
                                            ->orWhere(
                                                'email',
                                                'like',
                                                "%{$search}%",
                                            );
                                    },
                                )
                                ->orWhereHas(
                                    'vendor',
                                    fn($vendorQuery) =>
                                    $vendorQuery->where(
                                        'shop_name',
                                        'like',
                                        "%{$search}%",
                                    ),
                                );
                        },
                    );
                },
            )
            ->latest('id')
            ->paginate(25)
            ->withQueryString()
            ->through(
                function (
                    ActivityLog $log,
                ): array {
                    return [
                        'id' => $log->id,

                        'action' =>
                        $log->action,

                        'description' =>
                        $log->description,

                        'properties' =>
                        $log->properties ?? [],

                        'ip_address' =>
                        $log->ip_address,

                        'user_agent' =>
                        $log->user_agent,

                        'subject_type' =>
                        $log->subject_type,

                        'subject_label' =>
                        $log->subject_type
                            ? class_basename(
                                $log->subject_type,
                            )
                            : null,

                        'subject_id' =>
                        $log->subject_id,

                        'created_at' =>
                        $log->created_at
                            ?->toIso8601String(),

                        'actor' =>
                        $log->actor
                            ? [
                                'id' =>
                                $log->actor->id,

                                'name' =>
                                $log->actor->name,

                                'email' =>
                                $log->actor->email,

                                'role' =>
                                $log->actor->role,
                            ]
                            : null,

                        'vendor' =>
                        $log->vendor
                            ? [
                                'id' =>
                                $log->vendor->id,

                                'shop_name' =>
                                $log
                                    ->vendor
                                    ->shop_name,
                            ]
                            : null,
                    ];
                },
            );

        $actions = ActivityLog::query()
            ->whereNotNull('action')
            ->distinct()
            ->orderBy('action')
            ->pluck('action')
            ->values();

        return Inertia::render(
            'Admin/ActivityLogs/Index',
            [
                'logs' => $logs,

                'actions' => $actions,

                'filters' => [
                    'action' => $action,
                    'search' => $search,
                ],
            ],
        );
    }
}
