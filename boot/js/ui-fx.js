/* UI 动效工具：流式打字 + 复制对勾自熄（铁律 4 / 10） */
(function (w) {
    'use strict';

    // 流式打字：逐字从 blur(6px) 到清晰，单字 90ms，相邻错开 30ms
    function streamText(el, text, opts) {
        if (!el) return;
        opts = opts || {};
        var stagger = opts.stagger == null ? 30 : opts.stagger;
        var str = String(text == null ? '' : text);
        el.textContent = '';
        el.classList.add('stream-text');
        var frag = document.createDocumentFragment();
        var i = 0;
        for (var idx = 0; idx < str.length; idx++) {
            var ch = str.charAt(idx);
            if (ch === '\n') { frag.appendChild(document.createElement('br')); continue; }
            var span = document.createElement('span');
            span.className = 'ch';
            span.textContent = ch === ' ' ? '\u00A0' : ch;
            span.style.animationDelay = (i * stagger) + 'ms';
            frag.appendChild(span);
            i++;
        }
        el.appendChild(frag);
    }

    // 复制反馈：显示对勾 2.5s 后淡出恢复
    function markCopied(btn, originalHTML, ms) {
        if (!btn) return;
        ms = ms || 2500;
        if (btn._cpT1) clearTimeout(btn._cpT1);
        if (btn._cpT2) clearTimeout(btn._cpT2);
        if (btn._cpOrig == null) btn._cpOrig = originalHTML != null ? originalHTML : btn.innerHTML;
        btn.classList.remove('copy-fade');
        btn.classList.add('copied');
        btn.innerHTML = '<i class="fas fa-check"></i> 已复制';
        btn._cpT1 = setTimeout(function () {
            btn.classList.add('copy-fade');
            btn._cpT2 = setTimeout(function () {
                btn.innerHTML = btn._cpOrig;
                btn.classList.remove('copied', 'copy-fade');
                btn._cpT1 = btn._cpT2 = null;
            }, 220);
        }, ms);
    }

    w.streamText = streamText;
    w.markCopied = markCopied;
})(window);
