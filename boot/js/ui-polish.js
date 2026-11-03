(function () {
    var targetX = 0;
    var targetY = 0;
    var curX = 0;
    var curY = 0;
    var raf = null;

    function apply() {
        curX += (targetX - curX) * 0.12;
        curY += (targetY - curY) * 0.12;
        var transform = 'translate3d(' + curX.toFixed(2) + 'px,' + curY.toFixed(2) + 'px,0) scale(1.12)';
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
        targetY = Math.max(-24, Math.min(24, y));
        if (!raf) raf = requestAnimationFrame(apply);
    }

    window.addEventListener('mousemove', function (e) {
        setTarget((e.clientX / window.innerWidth - 0.5) * 70, (e.clientY / window.innerHeight - 0.5) * 40);
    }, { passive: true });

    window.addEventListener('touchmove', function (e) {
        if (!e.touches || !e.touches.length) return;
        setTarget((e.touches[0].clientX / window.innerWidth - 0.5) * 70, (e.touches[0].clientY / window.innerHeight - 0.5) * 40);
    }, { passive: true });

    var orientationBound = false;
    function bindOrientation() {
        if (orientationBound) return;
        orientationBound = true;
        window.addEventListener('deviceorientation', function (e) {
            if (e.gamma == null || e.beta == null) return;
            var x = Math.max(-1, Math.min(1, e.gamma / 25)) * 36;
            var y = Math.max(-1, Math.min(1, (e.beta - 45) / 30)) * 22;
            setTarget(x, y);
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

    document.addEventListener('touchstart', requestOrientation, { once: true, passive: true });
    document.addEventListener('click', requestOrientation, { once: true });
    bindOrientation();
})();
