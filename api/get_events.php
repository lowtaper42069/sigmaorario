<?php
require_once 'config.php';

try {
    // Controlla se c'è un filtro per data
    $where = "1=1";
    $params = [];
    
    if (isset($_GET['start_date']) && isset($_GET['end_date'])) {
        $where = "data_evento BETWEEN :start_date AND :end_date";
        $params = [
            ':start_date' => $_GET['start_date'],
            ':end_date' => $_GET['end_date']
        ];
    } elseif (isset($_GET['month'])) {
        // Filtra per mese - PostgreSQL usa EXTRACT
        $yearMonth = $_GET['month'];
        $where = "EXTRACT(YEAR FROM data_evento) || '-' || LPAD(EXTRACT(MONTH FROM data_evento)::text, 2, '0') = :month";
        $params = [':month' => $yearMonth];
    }
    
    // Query per ottenere eventi - PostgreSQL
    $sql = "SELECT 
                id,
                titolo as title,
                TO_CHAR(data_evento, 'YYYY-MM-DD') as date,
                TO_CHAR(ora_evento, 'HH24:MI') as time,
                tipo as type,
                materia as subject,
                descrizione as description,
                colore as color,
                creato_il as \"createdAt\"
            FROM eventi 
            WHERE $where
            ORDER BY data_evento ASC, ora_evento ASC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $events = $stmt->fetchAll();
    
    jsonResponse([
        'success' => true,
        'count' => count($events),
        'events' => $events
    ]);
    
} catch(PDOException $e) {
    jsonResponse([
        'success' => false,
        'error' => 'Errore nel recupero eventi: ' . $e->getMessage()
    ], 500);
}
?>
