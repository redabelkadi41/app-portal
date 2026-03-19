<?php

declare(strict_types=1);

function validateBureauId(string $id): string
{
    $id = trim($id);
    if ($id === '' || strlen($id) > 50 || !preg_match('/^[a-zA-Z0-9_\-]+$/', $id)) {
        Response::badRequest('Invalid bureau ID');
    }
    return $id;
}

function validateCandidateName(string $name): string
{
    $name = trim($name);
    if (strlen($name) > 255) {
        Response::badRequest('Candidate name too long');
    }
    return $name;
}

function validateUnsignedInt(mixed $value): int
{
    $v = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
    if ($v === false) {
        Response::badRequest('Invalid integer value');
    }
    return $v;
}

function getJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) {
        Response::badRequest('Empty request body');
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        Response::badRequest('Invalid JSON');
    }
    return $data;
}
