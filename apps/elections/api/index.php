<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Response.php';
require_once __DIR__ . '/middleware/cors.php';
require_once __DIR__ . '/middleware/validate.php';
require_once __DIR__ . '/controllers/CandidateController.php';
require_once __DIR__ . '/controllers/VoteController.php';

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    Response::noContent();
}

// Parse route
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$basePath = '/elections/api';
$path = substr($uri, strlen($basePath)) ?: '/';
$path = rtrim($path, '/');
$method = $_SERVER['REQUEST_METHOD'];

// Simple router
match (true) {
    // Candidates
    $method === 'GET'    && $path === '/candidates'
        => CandidateController::list(),

    $method === 'POST'   && $path === '/candidates'
        => CandidateController::create(),

    $method === 'PUT'    && $path === '/candidates/reorder'
        => CandidateController::reorder(),

    $method === 'PUT'    && preg_match('#^/candidates/(\d+)$#', $path, $m) === 1
        => CandidateController::update((int) $m[1]),

    $method === 'DELETE' && preg_match('#^/candidates/(\d+)$#', $path, $m) === 1
        => CandidateController::delete((int) $m[1]),

    // Votes
    $method === 'GET'    && $path === '/votes/bulk'
        => VoteController::getByBureaux(),

    $method === 'GET'    && preg_match('#^/votes/bureau/([^/]+)$#', $path, $m) === 1
        => VoteController::getBureau($m[1]),

    $method === 'PUT'    && preg_match('#^/votes/bureau/([^/]+)$#', $path, $m) === 1
        => VoteController::saveBureau($m[1]),

    default => Response::notFound('Unknown route'),
};
