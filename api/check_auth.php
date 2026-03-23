<?php
/**
 * Verifica stato autenticazione
 */

header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) {
    session_name('CAL_SCHOOL');
    session_start();
}

if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
    echo json_encode([
        'logged_in' => true,
        'user' => [
            'username' => $_SESSION['username'] ?? null,
            'role' => $_SESSION['role'] ?? null
        ]
    ]);
} else {
    echo json_encode([
        'logged_in' => false,
        'user' => null
    ]);
}
