# Configurazione Login

Questo progetto usa un sistema di autenticazione sicuro **senza database**, adatto per repository pubbliche.

## Come funziona

Le credenziali sono salvate in un file di configurazione locale **NON tracciato da git**.

## Prima configurazione

1. **Esegui il setup automatico:**

```bash
cd api
php config.example.php
```

Questo genererà un file `config.local.php` con:
- Password temporanea mostrata a schermo
- Chiave sessione sicura

2. **Oppure crea manualmente:**

```bash
# Genera un hash sicuro della tua password
php -r "echo password_hash('LaTuaPasswordSicura123', PASSWORD_DEFAULT);"
```

Copia l'hash generato e crea `api/config.local.php`:

```php
<?php
define('ADMIN_HASH', 'il_tuo_hash_qui');
define('SESSION_SECRET', 'una_chiave_casuale_di_almeno_32_caratteri');
```

3. **Accedi con:**
- Username: `admin`
- Password: la password che hai scelto

## Sicurezza

- Password mai salvata in chiaro (solo hash bcrypt)
- Sessioni sicure con flag HttpOnly, SameSite=Strict
- Protezione anti-brute-force (1 secondo di delay)
- File `.env` e `config.local.php` ignorati da git

## Modificare la password

```bash
# Genera nuovo hash
php -r "echo password_hash('nuova_password', PASSWORD_DEFAULT);"

# Modifica api/config.local.php con il nuovo hash
```
