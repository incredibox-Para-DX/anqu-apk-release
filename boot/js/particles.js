(function () {
    var KEY = 'ab_particles_enabled';
    var canvas = null;
    var ctx = null;
    var raf = null;
    var parts = [];
    var running = false;
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

    function start() {
        if (!enabled()) return;
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'bg-particles';
            canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1;';
            document.body.appendChild(canvas);
            ctx = canvas.getContext('2d');
            resize();
            spawn();
            window.addEventListener('resize', function () {
                resize();
                spawn();
            });
        }
        if (running) return;
        canvas.style.display = 'block';
        running = true;
        tick();
    }

    function stop() {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = null;
        if (canvas) canvas.style.display = 'none';
    }

    window.__setParticlesEnabled = function (on) {
        try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
        if (on) start();
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
        document.addEventListener('DOMContentLoaded', start);
    } else {
        bind();
        start();
    }
})();
