(function () {
    var targetX = 0;
    var targetY = 0;
    var curX = 0;
    var curY = 0;
    var raf = null;

    function enabled() {
        try { return localStorage.getItem('ab_parallax_enabled') !== '0'; } catch (e) { return true; }
    }

    function apply() {
        curX += (targetX - curX) * 0.12;
        curY += (targetY - curY) * 0.12;
        var transform = 'translate3d(' + curX.toFixed(2) + 'px,' + curY.toFixed(2) + 'px,0)';
        var video = document.getElementById('bg-video');
        var image = document.getElementById('bg-image');
        if (video) video.style.transform = transform;
        if (image) image.style.transform = transform;
        if (Math.abs(targetX - curX) > 0.05 || Math.abs(targetY - curY) > 0.05) {
            raf = requestAnimationFrame(apply);
        } else {
            raf = null;
        }
    }

    function setTarget(x, y) {
        if (!enabled()) return;
        targetX = Math.max(-40, Math.min(40, x));
        targetY = Math.max(-32, Math.min(32, y));
        if (!raf) raf = requestAnimationFrame(apply);
    }

    var orientationBound = false;

    function screenAngle() {
        try {
            if (window.screen && screen.orientation && typeof screen.orientation.angle === 'number') return screen.orientation.angle;
            if (typeof window.orientation === 'number') return window.orientation;
        } catch (e) {}
        return 0;
    }

    function bindOrientation() {
        if (orientationBound) return;
        orientationBound = true;
        window.addEventListener('deviceorientation', function (e) {
            if (!enabled()) return;
            if (e.beta == null || e.gamma == null) return;
            var angle = screenAngle();
            var x;
            var y;
            if (angle === 90) {
                x = e.beta;
                y = -e.gamma;
            } else if (angle === -90 || angle === 270) {
                x = -e.beta;
                y = e.gamma;
            } else if (angle === 180) {
                x = -e.gamma;
                y = -e.beta;
            } else {
                x = e.gamma;
                y = e.beta - 45;
            }
            setTarget((x / 45) * 40, (y / 45) * 32);
        }, { passive: true });
    }

    function requestOrientation() {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission().then(function (state) {
                if (state === 'granted') bindOrientation();
            }).catch(function () {});
        } else {
            bindOrientation();
        }
    }

    function bindToggle() {
        var toggle = document.getElementById('parallax-toggle');
        if (!toggle) return;
        try { toggle.checked = enabled(); } catch (e) {}
        toggle.addEventListener('change', function () {
            try { localStorage.setItem('ab_parallax_enabled', toggle.checked ? '1' : '0'); } catch (e) {}
            targetX = 0;
            targetY = 0;
            if (!raf) raf = requestAnimationFrame(apply);
        });
    }

    var SIMILAR = {
        'A': '4Λ', 'B': '8ß', 'C': '(G', 'D': 'OÐ', 'E': 'F3', 'F': 'E7', 'G': '6C', 'H': 'N#',
        'I': '1l', 'J': 'J)', 'K': '|<', 'L': '|_', 'M': 'N', 'N': 'MИ', 'O': '0Q', 'P': 'R9',
        'Q': 'O9', 'R': 'P8', 'S': '5$', 'T': '7+', 'U': 'V∪', 'V': 'U∨', 'W': 'V', 'X': '×X',
        'Y': 'V¥', 'Z': '2Z',
        '0': 'OQ', '1': 'lI', '2': 'Z2', '3': '8E', '4': 'A4', '5': 'S5', '6': 'G6', '7': 'T7',
        '8': 'B8', '9': 'g9'
    };
    var CN_SIMILAR = '田日目口回国固图因困甲申由电白百自且旦旧早旮旯黯匹空究堡检摸膜似';

    function similarChar(ch) {
        var pool = SIMILAR[ch] || SIMILAR[ch.toUpperCase()];
        if (pool) return pool[Math.floor(Math.random() * pool.length)];
        if (/[\u4e00-\u9fa5]/.test(ch)) return CN_SIMILAR[Math.floor(Math.random() * CN_SIMILAR.length)];
        return ch;
    }

    function decodeTextNode(node, duration) {
        if (!node || node.nodeType !== 3) return;
        var text = node.nodeValue;
        if (!text || !text.trim()) return;
        var start = performance.now();
        var len = text.length;
        var tick = function (now) {
            var p = Math.min(1, (now - start) / duration);
            var reveal = Math.floor(p * len);
            var out = '';
            for (var i = 0; i < len; i++) {
                if (i < reveal || text[i] === ' ') out += text[i];
                else out += similarChar(text[i]);
            }
            node.nodeValue = out;
            if (p < 1) requestAnimationFrame(tick);
            else node.nodeValue = text;
        };
        requestAnimationFrame(tick);
    }

    function decodeElement(el, duration) {
        if (!el) return;
        for (var i = 0; i < el.childNodes.length; i++) {
            var n = el.childNodes[i];
            if (n.nodeType === 3 && n.nodeValue.trim()) decodeTextNode(n, duration);
        }
    }

    function decodeTitles() {
        decodeElement(document.querySelector('.game-title h1'), 1100);
        var loadings = document.querySelectorAll('.loading-text');
        for (var i = 0; i < loadings.length; i++) decodeElement(loadings[i], 900);
    }

    function watch() {
        var observer = new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var el = mutations[i].target;
                if (!el || !el.classList) continue;
                if (el.classList.contains('modal-overlay') && el.classList.contains('show')) {
                    var now = Date.now();
                    if (el._decodeAt && now - el._decodeAt < 1200) continue;
                    el._decodeAt = now;
                    decodeElement(el.querySelector('.modal-title'), 900);
                }
                if (el.id === 'game-container' && !el.classList.contains('hidden')) {
                    var t = Date.now();
                    if (el._decodeAt && t - el._decodeAt < 1200) continue;
                    el._decodeAt = t;
                    decodeElement(el.querySelector('.game-title h1'), 1100);
                }
            }
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });
    }

    document.addEventListener('touchstart', requestOrientation, { once: true, passive: true });
    document.addEventListener('click', requestOrientation, { once: true });
    bindOrientation();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            bindToggle();
            decodeTitles();
            watch();
        });
    } else {
        bindToggle();
        decodeTitles();
        watch();
    }
})();
