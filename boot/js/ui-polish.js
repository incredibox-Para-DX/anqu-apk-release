(function () {
    var targetX = 0;
    var targetY = 0;
    var curX = 0;
    var curY = 0;
    var raf = null;
    var lastBgUpdate = 0;

    function apply(now) {
        curX += (targetX - curX) * 0.12;
        curY += (targetY - curY) * 0.12;
        var video = document.getElementById('bg-video');
        if (video) {
            video.style.transform = 'translate3d(' + curX.toFixed(2) + 'px,' + curY.toFixed(2) + 'px,0) scale(1.04)';
        } else if (now - lastBgUpdate > 66) {
            lastBgUpdate = now;
            if (document.body && document.body.style.backgroundImage && document.body.style.backgroundImage !== 'none') {
                document.body.style.backgroundPosition = 'calc(50% + ' + curX.toFixed(2) + 'px) calc(50% + ' + curY.toFixed(2) + 'px)';
            }
        }
        if (Math.abs(targetX - curX) > 0.05 || Math.abs(targetY - curY) > 0.05) {
            raf = requestAnimationFrame(apply);
        } else {
            raf = null;
        }
    }

    function setTarget(x, y) {
        targetX = Math.max(-14, Math.min(14, x));
        targetY = Math.max(-10, Math.min(10, y));
        if (!raf) raf = requestAnimationFrame(apply);
    }

    window.addEventListener('mousemove', function (e) {
        setTarget((e.clientX / window.innerWidth - 0.5) * 18, (e.clientY / window.innerHeight - 0.5) * 12);
    }, { passive: true });

    window.addEventListener('touchmove', function (e) {
        if (!e.touches || !e.touches.length) return;
        setTarget((e.touches[0].clientX / window.innerWidth - 0.5) * 18, (e.touches[0].clientY / window.innerHeight - 0.5) * 12);
    }, { passive: true });

    var orientationBound = false;
    function bindOrientation() {
        if (orientationBound) return;
        orientationBound = true;
        window.addEventListener('deviceorientation', function (e) {
            if (e.gamma == null || e.beta == null) return;
            var x = Math.max(-1, Math.min(1, e.gamma / 30)) * 12;
            var y = Math.max(-1, Math.min(1, (e.beta - 45) / 35)) * 8;
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
