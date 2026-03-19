<?php

declare(strict_types=1);

class VoteController
{
    /**
     * Get votes for a single bureau: candidate votes + blancs/nuls + version.
     */
    public static function getBureau(string $bureauId): void
    {
        $bureauId = validateBureauId($bureauId);
        $db = Database::get();

        // Candidate votes
        $stmt = $db->prepare(
            'SELECT candidate_id, vote_count, version
             FROM votes WHERE bureau_id = ?'
        );
        $stmt->execute([$bureauId]);
        $voteRows = $stmt->fetchAll();

        // Special votes
        $stmt = $db->prepare(
            'SELECT blancs, nuls, version
             FROM bureau_special_votes WHERE bureau_id = ?'
        );
        $stmt->execute([$bureauId]);
        $special = $stmt->fetch();

        $votes = [];
        $voteVersion = 0;
        foreach ($voteRows as $row) {
            $votes[(int) $row['candidate_id']] = (int) $row['vote_count'];
            $voteVersion = max($voteVersion, (int) $row['version']);
        }

        Response::json([
            'bureau_id' => $bureauId,
            'votes'     => (object) $votes,
            'blancs'    => $special ? (int) $special['blancs'] : 0,
            'nuls'      => $special ? (int) $special['nuls'] : 0,
            'version'   => $special ? (int) $special['version'] : $voteVersion,
        ]);
    }

    /**
     * Bulk fetch votes for multiple bureaux (by comma-separated IDs).
     */
    public static function getByBureaux(): void
    {
        $ids = $_GET['ids'] ?? '';
        if ($ids === '') {
            Response::badRequest('Missing ids parameter');
        }

        $idList = array_map('trim', explode(',', $ids));
        $idList = array_filter($idList, fn($id) => $id !== '');

        if (count($idList) > 500) {
            Response::badRequest('Too many bureau IDs (max 500)');
        }

        foreach ($idList as $id) {
            validateBureauId($id);
        }

        $db = Database::get();
        $placeholders = implode(',', array_fill(0, count($idList), '?'));

        // Candidate votes
        $stmt = $db->prepare(
            "SELECT bureau_id, candidate_id, vote_count, version
             FROM votes WHERE bureau_id IN ($placeholders)"
        );
        $stmt->execute($idList);
        $voteRows = $stmt->fetchAll();

        // Special votes
        $stmt = $db->prepare(
            "SELECT bureau_id, blancs, nuls, version
             FROM bureau_special_votes WHERE bureau_id IN ($placeholders)"
        );
        $stmt->execute($idList);
        $specialRows = $stmt->fetchAll();

        // Build response keyed by bureau_id
        $result = [];
        foreach ($idList as $id) {
            $result[$id] = ['votes' => (object) [], 'blancs' => 0, 'nuls' => 0, 'version' => 0];
        }

        foreach ($voteRows as $row) {
            $bid = $row['bureau_id'];
            $result[$bid]['votes']->{(int) $row['candidate_id']} = (int) $row['vote_count'];
            $result[$bid]['version'] = max($result[$bid]['version'], (int) $row['version']);
        }

        foreach ($specialRows as $row) {
            $bid = $row['bureau_id'];
            $result[$bid]['blancs'] = (int) $row['blancs'];
            $result[$bid]['nuls'] = (int) $row['nuls'];
            $result[$bid]['version'] = (int) $row['version'];
        }

        Response::json($result);
    }

    /**
     * Upsert all votes for a bureau atomically with optimistic locking.
     */
    public static function saveBureau(string $bureauId): void
    {
        $bureauId = validateBureauId($bureauId);
        $input = getJsonBody();

        $blancs = validateUnsignedInt($input['blancs'] ?? 0);
        $nuls = validateUnsignedInt($input['nuls'] ?? 0);
        $clientVersion = isset($input['version']) ? (int) $input['version'] : 0;
        $votes = $input['votes'] ?? [];

        if (!is_array($votes) && !is_object($votes)) {
            Response::badRequest('votes must be an object');
        }

        $db = Database::get();
        $db->beginTransaction();

        try {
            // Lock and check version
            $stmt = $db->prepare(
                'SELECT version FROM bureau_special_votes WHERE bureau_id = ? FOR UPDATE'
            );
            $stmt->execute([$bureauId]);
            $existing = $stmt->fetch();

            if ($existing) {
                $currentVersion = (int) $existing['version'];
                if ($clientVersion > 0 && $clientVersion !== $currentVersion) {
                    $db->rollBack();
                    Response::conflict(
                        'Les donnees ont ete modifiees par un autre utilisateur. Veuillez rafraichir.'
                    );
                }
            }

            $newVersion = ($existing ? (int) $existing['version'] : 0) + 1;

            // Upsert blancs/nuls
            $stmt = $db->prepare(
                'INSERT INTO bureau_special_votes (bureau_id, blancs, nuls, version)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE blancs = VALUES(blancs), nuls = VALUES(nuls), version = VALUES(version)'
            );
            $stmt->execute([$bureauId, $blancs, $nuls, $newVersion]);

            // Upsert candidate votes
            if (!empty($votes)) {
                $stmt = $db->prepare(
                    'INSERT INTO votes (bureau_id, candidate_id, vote_count, version)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE vote_count = VALUES(vote_count), version = VALUES(version)'
                );

                foreach ($votes as $candidateId => $count) {
                    $cid = filter_var($candidateId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
                    if ($cid === false) continue;
                    $count = max(0, (int) $count);
                    $stmt->execute([$bureauId, $cid, $count, $newVersion]);
                }
            }

            $db->commit();
            Response::json(['version' => $newVersion]);
        } catch (Exception $e) {
            $db->rollBack();
            if ($e instanceof PDOException && str_contains($e->getMessage(), 'fk_votes_candidate')) {
                Response::badRequest('Unknown candidate ID');
            }
            Response::error(500, 'Failed to save votes');
        }
    }
}
