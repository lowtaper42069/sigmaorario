/* Sistema tema + selettore dropdown + loading screen — condiviso da tutte le pagine.
   Pensato per girare anche nell'<head>: imposta subito data-theme (nessun flash)
   e costruisce il selettore quando il DOM è pronto. */
(function () {
    var THEMES = [
        { value: 'brutal',       label: 'Brutal scuro',  icon: 'nf-fa-terminal', bg: '#1a1a1a', accent: '#cfcfcf' },
        { value: 'brutal-light', label: 'Brutal chiaro', icon: 'nf-fa-th',       bg: '#d9d9d9', accent: '#333333' },
        { value: 'dark',         label: 'Scuro',         icon: 'nf-fa-moon',     bg: '#0d1117', accent: '#44633F' },
        { value: 'light',        label: 'Chiaro',        icon: 'nf-fa-sun',      bg: '#f6f8fa', accent: '#6a8d60' }
    ];

    // Tema di default quando non c'è nulla di salvato (vedi bootstrap sotto).
    var DEFAULT_THEME = 'brutal';

    function isMemorized() {
        return localStorage.getItem('settingsMemorize') === '1';
    }

    function reducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function themeInfo(value) {
        for (var i = 0; i < THEMES.length; i++) {
            if (THEMES[i].value === value) return THEMES[i];
        }
        return null;
    }

    // --- Bootstrap immediato (gira anche nell'<head>): nessun flash di tema ---
    // FEATURE VOLUTA (NON "FIXARE"): tema salvato/letto SOLO con il lock attivo.
    // Senza lock (o primo accesso) si parte dal tema di default: brutal scuro.
    var initial = document.documentElement.getAttribute('data-theme');
    if (!themeInfo(initial)) {
        var saved = isMemorized() ? localStorage.getItem('theme') : null;
        initial = themeInfo(saved) ? saved : DEFAULT_THEME;
        document.documentElement.setAttribute('data-theme', initial);
    }

    function currentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'dark';
    }

    function refreshTrigger(value) {
        var btn = document.getElementById('themeToggle');
        if (!btn) return;
        var info = themeInfo(value);
        var icon = btn.querySelector('i');
        if (icon && info) icon.className = 'nf ' + info.icon;
        var label = info ? info.label : value;
        btn.title = 'Tema: ' + label;
        btn.setAttribute('aria-label', 'Tema: ' + label);
    }

    function refreshMenu(value) {
        var menu = document.querySelector('.theme-menu');
        if (!menu) return;
        var opts = menu.querySelectorAll('.theme-option');
        for (var i = 0; i < opts.length; i++) {
            opts[i].setAttribute('aria-checked', opts[i].getAttribute('data-value') === value ? 'true' : 'false');
        }
    }

    function applyTheme(value, originEl) {
        if (!themeInfo(value)) value = DEFAULT_THEME;

        // Cambio tema + ridisegno dentro il callback: così lo snapshot della View
        // Transition cattura già il layout finale (es. i rowSpan del tema brutal).
        var apply = function () {
            document.documentElement.setAttribute('data-theme', value);
            // FEATURE VOLUTA (NON "FIXARE"): scrittura tema solo con lock attivo.
            if (isMemorized()) localStorage.setItem('theme', value);
            refreshTrigger(value);
            refreshMenu(value);
            document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: value } }));
        };

        // Fallback istantaneo se l'API non c'è o se l'utente ha chiesto meno movimento.
        if (!document.startViewTransition || reducedMotion()) {
            apply();
            return;
        }

        if (originEl) {
            // Wipe radiale: il cerchio parte dal centro del selettore tema.
            var root = document.documentElement;
            var r = originEl.getBoundingClientRect();
            var x = r.left + r.width / 2;
            var y = r.top + r.height / 2;
            var dx = Math.max(x, window.innerWidth - x);
            var dy = Math.max(y, window.innerHeight - y);
            root.style.setProperty('--vt-x', x + 'px');
            root.style.setProperty('--vt-y', y + 'px');
            root.style.setProperty('--vt-r', Math.ceil(Math.sqrt(dx * dx + dy * dy)) + 'px');
            root.classList.add('vt-radial');
            document.startViewTransition(apply).finished.finally(function () {
                root.classList.remove('vt-radial');
            });
        } else {
            // Crossfade (es. cambio tema di sistema, senza punto d'origine).
            document.startViewTransition(apply);
        }
    }
    window.applyTheme = applyTheme;
    window.getTheme = currentTheme;
    window.isMemorized = isMemorized;

    function buildPicker(btn) {
        if (btn.dataset.themePicker === '1') return;
        btn.dataset.themePicker = '1';
        btn.setAttribute('aria-haspopup', 'true');
        btn.setAttribute('aria-expanded', 'false');

        if (!btn.querySelector('.theme-caret')) {
            var caret = document.createElement('i');
            caret.className = 'nf nf-fa-chevron_down theme-caret';
            caret.setAttribute('aria-hidden', 'true');
            btn.appendChild(caret);
        }

        var menu = document.createElement('div');
        menu.className = 'theme-menu';
        menu.id = 'themeMenu';
        menu.setAttribute('role', 'menu');
        menu.hidden = true;

        THEMES.forEach(function (t) {
            var opt = document.createElement('button');
            opt.type = 'button';
            opt.className = 'theme-option';
            opt.setAttribute('role', 'menuitemradio');
            opt.setAttribute('data-value', t.value);
            opt.innerHTML = '<span class="theme-swatch" style="--sw-bg:' + t.bg + ';--sw-accent:' + t.accent + '"></span>'
                          + '<span class="theme-option-label">' + t.label + '</span>';
            opt.addEventListener('click', function () {
                close();                 // nascondi il menu prima dello snapshot del tema
                applyTheme(t.value, btn); // wipe radiale con origine dal selettore
                btn.focus();
            });
            menu.appendChild(opt);
        });

        document.body.appendChild(menu);

        var isOpen = false;

        function position() {
            var r = btn.getBoundingClientRect();
            var mw = menu.offsetWidth;
            var mh = menu.offsetHeight;
            var vw = window.innerWidth;
            var vh = window.innerHeight;
            var left = r.right - mw;
            var top = r.bottom + 6;
            if (left < 8) left = 8;
            if (left + mw > vw - 8) left = vw - mw - 8;
            if (top + mh > vh - 8) top = r.top - mh - 6;
            if (top < 8) top = 8;
            menu.style.left = left + 'px';
            menu.style.top = top + 'px';
        }

        function open() {
            refreshMenu(currentTheme());
            // Riavvia lo spin dell'icona a ogni apertura
            btn.classList.remove('spinning');
            void btn.offsetWidth;
            btn.classList.add('spinning');
            menu.hidden = false;
            isOpen = true;
            btn.setAttribute('aria-expanded', 'true');
            position();
            var sel = menu.querySelector('.theme-option[aria-checked="true"]') || menu.firstChild;
            if (sel && sel.focus) sel.focus();
        }

        function close() {
            if (!isOpen) return;
            menu.hidden = true;
            isOpen = false;
            btn.setAttribute('aria-expanded', 'false');
        }

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (isOpen) close(); else open();
        });
        menu.addEventListener('click', function (e) { e.stopPropagation(); });
        btn.addEventListener('animationend', function (e) {
            if (e.animationName === 'theme-spin') btn.classList.remove('spinning');
        });
        document.addEventListener('click', close);
        window.addEventListener('resize', close);
        window.addEventListener('scroll', close, true);
        document.addEventListener('keydown', function (e) {
            if (!isOpen) return;
            if (e.key === 'Escape') { close(); btn.focus(); return; }
            var opts = Array.prototype.slice.call(menu.querySelectorAll('.theme-option'));
            var idx = opts.indexOf(document.activeElement);
            if (e.key === 'ArrowDown') { e.preventDefault(); opts[(idx + 1) % opts.length].focus(); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); opts[(idx - 1 + opts.length) % opts.length].focus(); }
        });
    }

    function setup() {
        var btn = document.getElementById('themeToggle');
        if (btn) {
            buildPicker(btn);
            refreshTrigger(currentTheme());
            refreshMenu(currentTheme());
        }

        var screen = document.getElementById('loadingScreen');
        if (screen) {
            var spinner = document.getElementById('spinner');
            var chars = ['\\', '|', '/', '-'];
            var i = 0;
            var start = performance.now();
            var interval = setInterval(function () {
                if (spinner) spinner.textContent = chars[i++ % 4];
            }, 100);
            function hide() {
                clearInterval(interval);
                var elapsed = performance.now() - start;
                setTimeout(function () { screen.remove(); }, Math.max(0, 200 - elapsed));
            }
            if (document.readyState === 'complete') hide();
            else window.addEventListener('load', hide);
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
    else setup();
})();
