<?php
require_once 'config.php';

// Solo metodo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'error' => 'Metodo non consentito'], 405);
}

// Leggi i dati JSON
$input = json_decode(file_get_contents('php://input'), true);

// Validazione
$required = ['title', 'date'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        jsonResponse(['success' => false, 'error' => "Campo $field obbligatorio"], 400);
    }
}

try {
    // Prepara i dati
    $titolo = validateInput($input['title']);
    $data = $input['date'];
    $ora = !empty($input['time']) ? $input['time'] : null;
    $tipo = in_array($input['type'], ['verifica', 'compito', 'progetto', 'laboratorio', 'riunione', 'altro']) 
            ? $input['type'] : 'verifica';
    $materia = !empty($input['subject']) ? validateInput($input['subject']) : null;
    $descrizione = !empty($input['description']) ? validateInput($input['description']) : null;
    $colore = !empty($input['color']) ? $input['color'] : '#6366f1';
    
    // Query di inserimento - PostgreSQL
    $sql = "INSERT INTO eventi (titolo, data_evento, ora_evento, tipo, materia, descrizione, colore) 
            VALUES (:titolo, :data_evento, :ora_evento, :tipo, :materia, :descrizione, :colore) 
            RETURNING id, titolo, data_evento, ora_evento, tipo, materia, descrizione, colore, creato_il";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':titolo' => $titolo,
        ':data_evento' => $data,
        ':ora_evento' => $ora,
        ':tipo' => $tipo,
        ':materia' => $materia,
        ':descrizione' => $descrizione,
        ':colore' => $colore
    ]);
    
    $event = $stmt->fetch();
    
    jsonResponse([
        'success' => true,
        'message' => 'Evento creato con successo',
        'event' => [
            'id' => $event['id'],
            'title' => $event['titolo'],
            'date' => $event['data_evento'],
            'time' => $event['ora_evento'],
            'type' => $event['tipo'],
            'subject' => $event['materia'],
            'description' => $event['descrizione'],
            'color' => $event['colore'],
            'createdAt' => $event['creato_il']
        ]
    ]);
    
} catch(PDOException $e) {
    jsonResponse([
        'success' => false,
        'error' => 'Errore nella creazione evento: ' . $e->getMessage()
    ], 500);
}
?>
