(function () {
    var targetX = 0;
    var targetY = 0;
    var curX = 0;
    var curY = 0;
    var raf = null;

    function apply() {
        curX += (targetX - curX) * 0.12;
        curY += (targetY - curY) * 0.12;
        var transform = 'translate3d(' + curX.toFixed(2) + 'px,' + curY.toFixed(2) + 'px,0) scale(1.14)';
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
        targetX = Math.max(-40, Math.min(40, x));
        targetY = Math.max(-32, Math.min(32, y));
        if (!raf) raf = requestAnimationFrame(apply);
    }

    window.addEventListener('mousemove', function (e) {
        setTarget((e.clientX / window.innerWidth - 0.5) * 72, (e.clientY / window.innerHeight - 0.5) * 56);
    }, { passive: true });

    var baseBeta = null;
    var baseGamma = null;
    var orientationBound = false;

    function screenAngle() {
        try {
            if (window.screen && screen.orientation && typeof screen.orientation.angle === 'number') return screen.orientation.angle;
            if (typeof window.orientation === 'number') return window.orientation;
        } catch (e) {}
        return 0;
    }

    function resetBase() {
        baseBeta = null;
        baseGamma = null;
    }

    function bindOrientation() {
        if (orientationBound) return;
        orientationBound = true;
        window.addEventListener('deviceorientation', function (e) {
            if (e.beta == null || e.gamma == null) return;
            if (baseBeta == null) {
                baseBeta = e.beta;
                baseGamma = e.gamma;
                return;
            }
            var dB = e.beta - baseBeta;
            var dG = e.gamma - baseGamma;
            var angle = screenAngle();
            var x = dG;
            var y = dB;
            if (angle === 90) { x = dB; y = -dG; }
            else if (angle === -90 || angle === 270) { x = -dB; y = dG; }
            else if (angle === 180) { x = -dG; y = -dB; }
            setTarget(x * 3.0, y * 3.4);
        }, { passive: true });
        window.addEventListener('orientationchange', resetBase);
        try {
            if (window.screen && screen.orientation) screen.orientation.addEventListener('change', resetBase);
        } catch (e) {}
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

    document.addEventListener('touchstart', requestOrientation, { once: true, passive: true });
    document.addEventListener('click', requestOrientation, { once: true });
    bindOrientation();
})();
