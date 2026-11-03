(function () {
    var KEY = 'ab_particles_enabled';
    var canvas = null;
    var ctx = null;
    var raf = null;
    var parts = [];
    var running = false;
    var fadeTimer = null;
    var w = 0;
    var h = 0;

    function enabled() {
        try { return localStorage.getItem(KEY) !== '0'; } catch (e) { return true; }
    }

    function resize() {
        if (!canvas) return;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn() {
        parts = [];
        var count = Math.max(28, Math.min(64, Math.round((w * h) / 32000)));
        for (var i = 0; i < count; i++) {
            parts.push({
                x: Math.random() * w,
                y: Math.random() * h,
                r: 0.6 + Math.random() * 1.8,
                vx: (Math.random() - 0.5) * 0.18,
                vy: -0.12 - Math.random() * 0.22,
                a: 0.08 + Math.random() * 0.22,
                tw: Math.random() * Math.PI * 2
            });
        }
    }

    function tick() {
        if (!running) return;
        raf = requestAnimationFrame(tick);
        ctx.clearRect(0, 0, w, h);
        for (var i = 0; i < parts.length; i++) {
            var p = parts[i];
            p.x += p.vx;
            p.y += p.vy;
            p.tw += 0.02;
            if (p.y < -10) {
                p.y = h + 10;
                p.x = Math.random() * w;
            }
            if (p.x < -10) p.x = w + 10;
            if (p.x > w + 10) p.x = -10;
            var alpha = p.a * (0.65 + 0.35 * Math.sin(p.tw));
            ctx.beginPath();
            ctx.fillStyle = 'rgba(170,205,255,' + alpha.toFixed(3) + ')';
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function hasModal() {
        var modals = document.querySelectorAll('.modal-overlay');
        for (var i = 0; i < modals.length; i++) {
            var m = modals[i];
            if (!m.classList.contains('show')) continue;
            try {
                var cs = window.getComputedStyle(m);
                if (cs.display === 'flex' && cs.visibility !== 'hidden' && cs.opacity !== '0') return true;
            } catch (e) {}
        }
        return false;
    }

    function sync() {
        if (!enabled()) {
            stop();
            return;
        }
        if (hasModal()) start();
        else stop();
    }

    function start() {
        if (!enabled()) return;
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'bg-particles';
            canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483000;opacity:0;transition:opacity .45s ease;';
            document.body.appendChild(canvas);
            ctx = canvas.getContext('2d');
            resize();
            spawn();
            window.addEventListener('resize', function () {
                resize();
                spawn();
            });
        }
        if (fadeTimer) {
            clearTimeout(fadeTimer);
            fadeTimer = null;
        }
        canvas.style.display = 'block';
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                if (canvas) canvas.style.opacity = '1';
            });
        });
        if (running) return;
        running = true;
        tick();
    }

    function stop() {
        if (!canvas) {
            running = false;
            if (raf) cancelAnimationFrame(raf);
            raf = null;
            return;
        }
        canvas.style.opacity = '0';
        if (fadeTimer) clearTimeout(fadeTimer);
        fadeTimer = setTimeout(function () {
            fadeTimer = null;
            if (enabled() && hasModal()) return;
            running = false;
            if (raf) cancelAnimationFrame(raf);
            raf = null;
            if (canvas) canvas.style.display = 'none';
        }, 450);
    }

    window.__setParticlesEnabled = function (on) {
        try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
        if (on) sync();
        else stop();
    };

    function bind() {
        var toggle = document.getElementById('particle-toggle');
        if (!toggle) return;
        try { toggle.checked = enabled(); } catch (e) {}
        toggle.addEventListener('change', function () {
            window.__setParticlesEnabled(toggle.checked);
        });
    }

    function boot() {
        bind();
        sync();
        setInterval(sync, 300);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
