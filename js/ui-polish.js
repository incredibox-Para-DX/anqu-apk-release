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
        var transform = 'translate3d(' + curX.toFixed(2) + 'px,' + curY.toFixed(2) + 'px,0) scale(1.08)';
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

    document.addEventListener('touchstart', requestOrientation, { once: true, passive: true });
    document.addEventListener('click', requestOrientation, { once: true });
    bindOrientation();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindToggle);
    else bindToggle();
})();
