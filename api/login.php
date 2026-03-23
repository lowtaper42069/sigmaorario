<?php
/**
 * API Login - Sistema sicuro senza database
 * 
 * Autenticazione basata su password hashata bcrypt.
 * Gli utenti sono salvati in data/users.json (non tracciato da git).
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');

// Gestisci richieste OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Percorso file utenti
$usersFile = __DIR__ . '/../data/users.json';

// Avvia sessione sicura
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_samesite', 'Strict');
    session_name('CAL_SCHOOL');
    session_start();
}

/**
 * Risposta JSON
 */
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

/**
 * Verifica se l'utente è loggato
 */
function isLoggedIn() {
    return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
}

/**
 * Carica utenti
 */
function loadUsers() {
    global $usersFile;
    
    if (!file_exists($usersFile)) {
        return [];
    }
    
    $data = file_get_contents($usersFile);
    return json_decode($data, true) ?: [];
}

/**
 * Verifica credenziali
 */
function verifyCredentials($username, $password) {
    $users = loadUsers();
    
    foreach ($users as $user) {
        if ($user['username'] === $username) {
            return password_verify($password, $user['password']);
        }
    }
    
    return false;
}

// ====================
// GESTIONE RICHIESTE
// ====================

// GET: Verifica stato login
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    jsonResponse([
        'logged_in' => isLoggedIn(),
        'user' => isLoggedIn() ? [
            'username' => $_SESSION['username'] ?? null,
            'role' => $_SESSION['role'] ?? null
        ] : null
    ]);
    exit;
}

// POST: Login
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Metodo non consentito'], 405);
}

// Leggi credenziali
$input = json_decode(file_get_contents('php://input'), true);
$username = trim($input['username'] ?? '');
$password = $input['password'] ?? '';

// Validazione input
if (empty($username) || empty($password)) {
    jsonResponse(['error' => 'Username e password sono obbligatori'], 400);
}

// Verifica credenziali
if (!verifyCredentials($username, $password)) {
    // Ritardo anti-brute force
    sleep(1);
    jsonResponse(['error' => 'Credenziali non valide'], 401);
}

// Trova ruolo utente
$users = loadUsers();
$userRole = 'user';
foreach ($users as $u) {
    if ($u['username'] === $username) {
        $userRole = $u['role'] ?? 'user';
        break;
    }
}

// Login riuscito
$_SESSION['logged_in'] = true;
$_SESSION['username'] = $username;
$_SESSION['role'] = $userRole;
$_SESSION['login_time'] = time();

jsonResponse([
    'success' => true,
    'user' => [
        'username' => $username,
        'role' => $userRole
    ]
]);
