(function () {
    function rotateLoadingText() {
        var list = ['正在加载资源…', '正在准备保险箱…', '正在校准视野…', '正在整理战利品…'];
        var idx = 0;
        var timer = setInterval(function () {
            var target = null;
            var texts = document.querySelectorAll('.loading-text');
            for (var i = 0; i < texts.length; i++) {
                if ((texts[i].textContent || '').indexOf('Loading') >= 0) { target = texts[i]; break; }
            }
            if (!target) { clearInterval(timer); return; }
            idx = (idx + 1) % list.length;
            target.textContent = list[idx];
        }, 1600);
    }

    var px = 0;
    var py = 0;
    var raf = null;

    function applyParallax() {
        raf = null;
        var body = document.body;
        if (body && body.style.backgroundImage && body.style.backgroundImage !== 'none') {
            body.style.backgroundPosition = 'calc(50% + ' + px.toFixed(2) + 'px) calc(50% + ' + py.toFixed(2) + 'px)';
        }
        var video = document.getElementById('bg-video');
        if (video) video.style.transform = 'translate(' + px.toFixed(2) + 'px, ' + py.toFixed(2) + 'px) scale(1.04)';
    }

    function onMove(x, y) {
        px = (x / window.innerWidth - 0.5) * 18;
        py = (y / window.innerHeight - 0.5) * 12;
        if (!raf) raf = requestAnimationFrame(applyParallax);
    }

    window.addEventListener('mousemove', function (e) {
        onMove(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener('touchmove', function (e) {
        if (!e.touches || !e.touches.length) return;
        onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', rotateLoadingText);
    else rotateLoadingText();
})();
