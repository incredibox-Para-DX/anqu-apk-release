
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
            '#thanks-overlay video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:blur(1px) brightness(.6);transform:scale(1.03)}',
            '#thanks-scroll{position:absolute;inset:0;display:flex;justify-content:center;overflow-y:auto;overflow-x:hidden;pointer-events:auto;touch-action:pan-y;-webkit-overflow-scrolling:touch;scrollbar-width:none}',
            '#thanks-scroll::-webkit-scrollbar{display:none}',
            '#thanks-names{color:#fff;text-align:center;font-size:19px;line-height:2.1;letter-spacing:.08em;text-shadow:0 2px 8px rgba(0,0,0,.8);padding-top:100vh;white-space:pre-line}',
            '#thanks-names .thanks-title{font-size:26px;font-weight:700;letter-spacing:.3em;margin-bottom:36px}',
            '#thanks-names .thanks-name{opacity:.92}',
            '#thanks-names .thanks-credit{font-size:14px;line-height:1.9;opacity:.75;letter-spacing:.05em}'
        ].join('\n');
        document.head.appendChild(s);
    }

    function tr(key, fallback) {
        try { if (window.I18N && I18N.t) return I18N.t(key, fallback); } catch (e) {}
        return fallback;
    }

    var THANKS_NAMES = [
        'HeFun',
        '阿利雅·伊利白',
        '蛇彪',
        '财零',
        '迷齿凤玛',
        'TR游戏评测',
        'Renoirs',
        '大黑简体',
        '香菜',
        'Rontan·Mouse',
        'Evita',
        '秋雨',
        'Волк Джек',
        '摔炮鼠鼠',
        'David Beaumont',
        '杰瑞',
        '学医救不了罗德岛',
        '꧁꫞꯭过往꯭꫞꧂',
        '4k32z',
        '星尘QwQ',
        'hunter'
    ];

    function placeholderNames() {
        var out = ['<div class="thanks-title">' + tr('thanks_title', '感谢名单') + '</div>'];
        THANKS_NAMES.forEach(function (n) {
            out.push('<div class="thanks-name">' + n + '</div>');
        });
        out.push('<div class="thanks-credit" style="margin-top:40px">' + tr('thanks_credit_1', '游戏为同人二创 · 非官方 · 非商用') + '</div>');
        out.push('<div class="thanks-credit">' + tr('thanks_credit_2', '《暗区突围》版权归腾讯/魔方工作室群') + '</div>');
        out.push('<div class="thanks-credit">' + tr('thanks_credit_3', '空值工作室Null Studio出品 · HeFun 开发 · 暗区保险模拟') + '</div>');
        return out.join('');
    }

    function fadeAudio(a, to, ms, done) {
        if (!a) { if (done) done(); return; }
        var from = Number(a.volume) || 0;
        var start = Date.now();
        var timer = setInterval(function () {
            var p = Math.min(1, (Date.now() - start) / ms);
            try { a.volume = Math.max(0, Math.min(1, from + (to - from) * p)); } catch (e) {}
            if (p >= 1) {
                clearInterval(timer);
                if (done) done();
            }
        }, 40);
    }

    function ThanksPlayer() {
        var overlay = null;
        var video = null;
        var audio = null;
        var closing = false;
        var scrollEl = null;
        var raf = null;
        var userPaused = false;
        var resumeTimer = null;
        var autoBase = 0;
        var autoMax = 0;
        var autoRemain = 0;
        var autoStart = 0;
        var AUTO_MS = 24250;

        function stopScroll() {
            if (raf) cancelAnimationFrame(raf);
            raf = null;
            if (resumeTimer) { clearTimeout(resumeTimer); resumeTimer = null; }
        }

        function scrollStep(now) {
            if (!overlay || closing) return;
            if (userPaused) { raf = requestAnimationFrame(scrollStep); return; }
            var p = autoRemain > 0 ? Math.min(1, (now - autoStart) / autoRemain) : 1;
            if (scrollEl) scrollEl.scrollTop = autoBase + (autoMax - autoBase) * p;
            if (p < 1) raf = requestAnimationFrame(scrollStep);
        }

        function startScroll() {
            if (!scrollEl) return;
            if (raf) cancelAnimationFrame(raf);
            autoMax = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);
            autoBase = scrollEl.scrollTop;
            autoRemain = autoMax > 0 ? (1 - autoBase / autoMax) * AUTO_MS : 0;
            autoStart = performance.now();
            raf = requestAnimationFrame(scrollStep);
        }

        function close() {
            if (!overlay || closing) return;
            closing = true;
            stopScroll();
            if (audio) {
                var a = audio;
                audio = null;
                a.onended = null;
                fadeAudio(a, 0, 800, function () { try { a.pause(); } catch (e) {} });
            }
            try { if (video) video.pause(); } catch (e) {}
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
                if (audio) {
                    var old = audio;
                    old.onended = null;
                    fadeAudio(old, 0, 800, function () { try { old.pause(); } catch (e) {} });
                }
                var targetVol = 0.9 * ((window.__UI_SOUND_VOLUME__ != null) ? window.__UI_SOUND_VOLUME__ : 1);
                audio = new Audio(srcAudio);
                audio.volume = 0;
                audio.onended = function () {
                    if (next) playSegment(next, null);
                    else close();
                };
                audio.play().then(function () {
                    fadeAudio(audio, targetVol, 1200);
                }).catch(function () {
                    
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
                scrollEl = overlay.querySelector('#thanks-scroll');
                overlay.addEventListener('click', close);
                
                scrollEl.addEventListener('touchstart', function () {
                    userPaused = true;
                    if (resumeTimer) { clearTimeout(resumeTimer); resumeTimer = null; }
                }, { passive: true });
                var resumeSoon = function () {
                    if (resumeTimer) clearTimeout(resumeTimer);
                    resumeTimer = setTimeout(function () {
                        userPaused = false;
                        startScroll();
                    }, 2500);
                };
                scrollEl.addEventListener('touchend', resumeSoon, { passive: true });
                scrollEl.addEventListener('wheel', resumeSoon, { passive: true });
                requestAnimationFrame(function () {
                    overlay.classList.add('show');
                    startScroll();
                });
                
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
