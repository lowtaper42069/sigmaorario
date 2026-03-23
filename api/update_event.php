<?php
require_once 'config.php';

// Solo metodo PUT
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    jsonResponse(['success' => false, 'error' => 'Metodo non consentito'], 405);
}

// Leggi i dati JSON
$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['id'])) {
    jsonResponse(['success' => false, 'error' => 'ID evento obbligatorio'], 400);
}

try {
    // Prepara i dati
    $id = $input['id'];
    $titolo = validateInput($input['title']);
    $data = $input['date'];
    $ora = !empty($input['time']) ? $input['time'] : null;
    $tipo = in_array($input['type'], ['verifica', 'compito', 'progetto', 'laboratorio', 'riunione', 'altro']) 
            ? $input['type'] : 'verifica';
    $materia = !empty($input['subject']) ? validateInput($input['subject']) : null;
    $descrizione = !empty($input['description']) ? validateInput($input['description']) : null;
    $colore = !empty($input['color']) ? $input['color'] : '#6366f1';
    
    // Query di aggiornamento - PostgreSQL
    $sql = "UPDATE eventi 
            SET titolo = :titolo,
                data_evento = :data_evento,
                ora_evento = :ora_evento,
                tipo = :tipo,
                materia = :materia,
                descrizione = :descrizione,
                colore = :colore,
                aggiornato_il = CURRENT_TIMESTAMP
            WHERE id = :id
            RETURNING id, titolo, data_evento, ora_evento, tipo, materia, descrizione, colore, aggiornato_il";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id' => $id,
        ':titolo' => $titolo,
        ':data_evento' => $data,
        ':ora_evento' => $ora,
        ':tipo' => $tipo,
        ':materia' => $materia,
        ':descrizione' => $descrizione,
        ':colore' => $colore
    ]);
    
    $updated = $stmt->fetch();
    
    if ($updated) {
        jsonResponse([
            'success' => true,
            'message' => 'Evento aggiornato con successo',
            'event' => [
                'id' => $updated['id'],
                'title' => $updated['titolo'],
                'date' => $updated['data_evento'],
                'time' => $updated['ora_evento'],
                'type' => $updated['tipo'],
                'subject' => $updated['materia'],
                'description' => $updated['descrizione'],
                'color' => $updated['colore'],
                'updatedAt' => $updated['aggiornato_il']
            ]
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
        'error' => 'Errore nell\'aggiornamento evento: ' . $e->getMessage()
    ], 500);
}
?>
