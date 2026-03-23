<?php
require_once 'config.php';

// Solo metodo DELETE
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    jsonResponse(['success' => false, 'error' => 'Metodo non consentito'], 405);
}

// Leggi i dati JSON
$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['id'])) {
    jsonResponse(['success' => false, 'error' => 'ID evento obbligatorio'], 400);
}

try {
    $sql = "DELETE FROM eventi WHERE id = :id RETURNING id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $input['id']]);
    
    $deleted = $stmt->fetch();
    
    if ($deleted) {
        jsonResponse([
            'success' => true,
            'message' => 'Evento eliminato con successo'
        ]);
    } else {
        jsonResponse([
            'success' => false,
            'error' => 'Evento non trovato'
        ], 404);
    }
    
} catch(PDOException $e) {
    jsonResponse([
        'success' => false,
        'error' => 'Errore nell\'eliminazione evento: ' . $e->getMessage()
    ], 500);
}
?>
