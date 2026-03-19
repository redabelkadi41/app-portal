<?php

declare(strict_types=1);

class CandidateController
{
    public static function list(): void
    {
        $db = Database::get();
        $rows = $db->query('SELECT id, name, sort_order FROM candidates ORDER BY sort_order, id')
                    ->fetchAll();

        Response::json($rows);
    }

    public static function create(): void
    {
        $input = getJsonBody();
        $name = validateCandidateName($input['name'] ?? '');
        $sortOrder = isset($input['sort_order']) ? validateUnsignedInt($input['sort_order']) : 0;

        $db = Database::get();

        // Default sort_order to max + 1 if not specified
        if ($sortOrder === 0) {
            $max = $db->query('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM candidates')
                      ->fetch();
            $sortOrder = (int) $max['next'];
        }

        $stmt = $db->prepare('INSERT INTO candidates (name, sort_order) VALUES (?, ?)');
        $stmt->execute([$name, $sortOrder]);

        $id = (int) $db->lastInsertId();

        Response::json([
            'id'         => $id,
            'name'       => $name,
            'sort_order' => $sortOrder,
        ], 201);
    }

    public static function update(int $id): void
    {
        $input = getJsonBody();
        $db = Database::get();

        $fields = [];
        $params = [];

        if (array_key_exists('name', $input)) {
            $fields[] = 'name = ?';
            $params[] = validateCandidateName($input['name']);
        }

        if (array_key_exists('sort_order', $input)) {
            $fields[] = 'sort_order = ?';
            $params[] = validateUnsignedInt($input['sort_order']);
        }

        if (empty($fields)) {
            Response::badRequest('No fields to update');
        }

        $params[] = $id;
        $stmt = $db->prepare('UPDATE candidates SET ' . implode(', ', $fields) . ' WHERE id = ?');
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            Response::notFound('Candidate not found');
        }

        Response::json(['ok' => true]);
    }

    public static function delete(int $id): void
    {
        $db = Database::get();
        $stmt = $db->prepare('DELETE FROM candidates WHERE id = ?');
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            Response::notFound('Candidate not found');
        }

        Response::json(['ok' => true]);
    }

    public static function reorder(): void
    {
        $input = getJsonBody();
        $order = $input['order'] ?? null;

        if (!is_array($order) || empty($order)) {
            Response::badRequest('order must be a non-empty array of candidate IDs');
        }

        $db = Database::get();
        $db->beginTransaction();

        try {
            $stmt = $db->prepare('UPDATE candidates SET sort_order = ? WHERE id = ?');
            foreach ($order as $i => $candidateId) {
                $stmt->execute([$i, validateUnsignedInt($candidateId)]);
            }
            $db->commit();
            Response::json(['ok' => true]);
        } catch (Exception $e) {
            $db->rollBack();
            Response::error(500, 'Failed to reorder candidates');
        }
    }
}
