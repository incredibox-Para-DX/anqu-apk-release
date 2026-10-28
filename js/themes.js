/* 主题切换：glass(默认/液态玻璃) / nostalgic(怀旧) / midnight(午夜) / warm(暖褐) */
(function (w) {
    'use strict';
    var KEY = 'ab_theme', DEFAULT = 'glass';
    var THEMES = ['glass', 'nostalgic', 'midnight', 'warm'];

    function current() {
        try { var t = localStorage.getItem(KEY) || DEFAULT; return THEMES.indexOf(t) !== -1 ? t : DEFAULT; } catch (e) { return DEFAULT; }
    }
    function updateActive(t) {
        var els = document.querySelectorAll('#theme-select .lang-opt');
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
    function bind() {
        var box = document.getElementById('theme-select');
        if (!box || box._bound) return;
        box._bound = true;
        box.addEventListener('click', function (e) {
            var b = e.target && e.target.closest ? e.target.closest('.lang-opt') : null;
            if (!b) return;
            var t = b.getAttribute('data-theme');
            if (t) set(t);
        });
        updateActive(current());
    }

    apply(current());
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
    w.Themes = { set: set, current: current, apply: apply };
})(window);
