/* 感谢名单：全屏滚动字幕 + 模糊循环视频，随机从 037/038 开始，按音频长度自动切换 */
(function () {
    'use strict';

    var OPENED = false;
    var TRANSPARENT_POSTER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    function injectStyle() {
        if (document.getElementById('thanks-style')) return;
        var s = document.createElement('style');
        s.id = 'thanks-style';
        s.textContent = [
            '#thanks-overlay{position:fixed;inset:0;z-index:12000;background:#000;opacity:0;transition:opacity 1.2s ease-in-out;overflow:hidden}',
            '#thanks-overlay.show{opacity:1}',
            '#thanks-overlay video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:blur(3px) brightness(.6);transform:scale(1.08)}',
            '#thanks-scroll{position:absolute;inset:0;display:flex;justify-content:center;overflow:hidden;pointer-events:none}',
            '#thanks-names{color:#fff;text-align:center;font-size:19px;line-height:2.1;letter-spacing:.08em;text-shadow:0 2px 8px rgba(0,0,0,.8);padding-top:100vh;animation:thanksScroll 43.6s linear forwards;white-space:pre-line}',
            '#thanks-names .thanks-title{font-size:26px;font-weight:700;letter-spacing:.3em;margin-bottom:36px}',
            '#thanks-names .thanks-name{opacity:.92}',
            '@keyframes thanksScroll{from{transform:translateY(0)}to{transform:translateY(-100%)}}'
        ].join('\n');
        document.head.appendChild(s);
    }

    function placeholderNames() {
        var out = ['<div class="thanks-title">感谢名单</div>'];
        for (var i = 1; i <= 30; i++) {
            out.push('<div class="thanks-name">姓名占位 ' + (i < 10 ? '0' + i : i) + '</div>');
        }
        out.push('<div class="thanks-title" style="margin-top:40px">感谢观看</div>');
        return out.join('');
    }

    function ThanksPlayer() {
        var overlay = null;
        var video = null;
        var audio = null;
        var closing = false;

        function stopMedia() {
            try { if (audio) { audio.onended = null; audio.pause(); audio.src = ''; } } catch (e) {}
            try { if (video) { video.pause(); video.removeAttribute('src'); video.load(); } } catch (e) {}
        }

        function close() {
            if (!overlay || closing) return;
            closing = true;
            stopMedia();
            overlay.classList.remove('show');
            setTimeout(function () {
                if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                overlay = null; video = null; audio = null;
                closing = false; OPENED = false;
            }, 1200);
        }

        function playSegment(idx, next) {
            var srcVideo = idx === 1 ? 'thanks/037.mp4' : 'thanks/038.mp4';
            var srcAudio = idx === 1 ? 'thanks/night.mp3' : 'thanks/xia.mp3';
            try {
                video.src = srcVideo;
                video.play().catch(function () {});
            } catch (e) {}
            try {
                if (audio) { audio.onended = null; audio.pause(); }
                audio = new Audio(srcAudio);
                audio.volume = 0.9 * ((window.__UI_SOUND_VOLUME__ != null) ? window.__UI_SOUND_VOLUME__ : 1);
                audio.onended = function () {
                    if (next) playSegment(next, null);
                    else close();
                };
                audio.play().catch(function () {
                    // 音频被拦截时按视频时长兜底推进
                    setTimeout(function () {
                        if (OPENED && !closing) {
                            if (next) playSegment(next, null);
                            else close();
                        }
                    }, next ? (idx === 1 ? 37000 : 36000) : 36000);
                });
            } catch (e) {}
        }

        return {
            open: function () {
                if (OPENED || closing) return;
                OPENED = true;
                injectStyle();
                overlay = document.createElement('div');
                overlay.id = 'thanks-overlay';
                overlay.innerHTML = '<video muted loop playsinline webkit-playsinline preload="auto" poster="' + TRANSPARENT_POSTER + '"></video>' +
                    '<div id="thanks-scroll"><div id="thanks-names">' + placeholderNames() + '</div></div>';
                document.body.appendChild(overlay);
                video = overlay.querySelector('video');
                overlay.addEventListener('click', close);
                requestAnimationFrame(function () { overlay.classList.add('show'); });
                // 每次打开随机从 037 或 038 开始，播完再切另一个
                var first = Math.random() < 0.5 ? 1 : 2;
                playSegment(first, first === 1 ? 2 : 1);
            },
            close: close
        };
    }

    var player = new ThanksPlayer();

    function bind() {
        var btn = document.getElementById('sidebar-thanks-btn');
        if (btn && !btn._thanksBound) {
            btn._thanksBound = true;
            btn.addEventListener('click', function () { player.open(); });
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
    window.ThanksList = player;
})();
