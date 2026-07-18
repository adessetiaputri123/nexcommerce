<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SystemNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $title,
        private readonly string $message,
        private readonly ?string $url = null,
        private readonly string $level = 'info',
        private readonly array $meta = [],
    ) {}

    public function via(
        object $notifiable,
    ): array {
        return [
            'database',
        ];
    }

    public function toDatabase(
        object $notifiable,
    ): array {
        return [
            'title' =>
            $this->title,

            'message' =>
            $this->message,

            'url' =>
            $this->url,

            'level' =>
            $this->level,

            'meta' =>
            $this->meta,
        ];
    }

    public function toArray(
        object $notifiable,
    ): array {
        return $this->toDatabase(
            $notifiable,
        );
    }
}
