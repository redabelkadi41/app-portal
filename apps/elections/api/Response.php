<?php

declare(strict_types=1);

class Response
{
    public static function json(mixed $data, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function noContent(): never
    {
        http_response_code(204);
        exit;
    }

    public static function error(int $status, string $message): never
    {
        self::json(['error' => $message], $status);
    }

    public static function conflict(string $message): never
    {
        self::error(409, $message);
    }

    public static function badRequest(string $message): never
    {
        self::error(400, $message);
    }

    public static function notFound(string $message = 'Not found'): never
    {
        self::error(404, $message);
    }
}
