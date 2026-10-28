/* 主题切换：glass(液态玻璃) / nostalgic(怀旧) / flat(极简) / cyber(赛博) / warm(暖褐) */
(function (w) {
    'use strict';
    var KEY = 'ab_theme', DEFAULT = 'glass';
    var THEMES = ['glass', 'nostalgic', 'flat', 'cyber', 'warm'];

    function current() {
        try { var t = localStorage.getItem(KEY) || DEFAULT; return THEMES.indexOf(t) !== -1 ? t : DEFAULT; } catch (e) { return DEFAULT; }
    }
    function updateActive(t) {
        var els = document.querySelectorAll('#theme-grid .theme-card');
        for (var i = 0; i < els.length; i++) {
            els[i].classList.toggle('active', els[i].getAttribute('data-theme') === t);
        }
    }
    function apply(t) {
        try {
            if (t === 'glass') document.documentElement.removeAttribute('data-theme');
            else document.documentElement.setAttribute('data-theme', t);
        } catch (e) {}
        updateActive(t);
    }
    function set(t) {
        if (THEMES.indexOf(t) === -1) return;
        try { localStorage.setItem(KEY, t); } catch (e) {}
        apply(t);
        try { if (w.Telemetry) w.Telemetry.event('theme_change', { theme: t }); } catch (e) {}
    }
    function openModal() {
        try { if (w.ModalRegistry && w.ModalRegistry.open) return w.ModalRegistry.open('theme-modal'); } catch (e) {}
        var m = document.getElementById('theme-modal');
        if (m) { m.style.display = 'flex'; setTimeout(function () { m.classList.add('show'); }, 10); }
    }
    function closeModal() {
        try { if (w.ModalRegistry && w.ModalRegistry.close) return w.ModalRegistry.close('theme-modal'); } catch (e) {}
        var m = document.getElementById('theme-modal');
        if (m) { m.classList.remove('show'); setTimeout(function () { m.style.display = 'none'; }, 300); }
    }
    function bind() {
        var openBtn = document.getElementById('theme-open-btn');
        if (openBtn && !openBtn._bound) { openBtn._bound = true; openBtn.addEventListener('click', openModal); }
        var closeBtn = document.getElementById('theme-modal-close');
        if (closeBtn && !closeBtn._bound) { closeBtn._bound = true; closeBtn.addEventListener('click', closeModal); }
        var grid = document.getElementById('theme-grid');
        if (grid && !grid._bound) {
            grid._bound = true;
            grid.addEventListener('click', function (e) {
                var c = e.target && e.target.closest ? e.target.closest('.theme-card') : null;
                if (!c) return;
                var t = c.getAttribute('data-theme');
                if (t) set(t);
            });
        }
        updateActive(current());
    }

    apply(current());
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
    w.Themes = { set: set, current: current, apply: apply, open: openModal, close: closeModal };
})(window);
