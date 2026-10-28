/* 轻量遥测：错误上报 + 埋点。
 * 设计原则：fire-and-forget、绝不阻塞游戏、限流去重、失败静默。
 * 落库：Supabase ab_error_logs / ab_events（见 tools/supabase-telemetry.sql）。
 */
(function (w) {
    'use strict';
    var SUPA_URL = 'https://fgkfgyudwbhmmrqvtfup.supabase.co';
    var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZna2ZneXVkd2JobW1ycXZ0ZnVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MTkyODAsImV4cCI6MjA5NzI5NTI4MH0.zcnusHgHSUK3AogYAXaR-9Q2KWuGK6_V7wwhgj1D1PI';
    var MAX_UNIQUE_ERR = 20;   // 每会话最多上报的不同错误数
    var MAX_SAME_ERR = 5;      // 同一错误最多上报次数
    var MAX_EVT = 60;          // 每会话最多埋点数
    var errCount = {};
    var errQueue = [];
    var evtQueue = [];
    var flushTimer = null;

    function uid() {
        try {
            return localStorage.getItem('ab_uid') || localStorage.getItem('leaderboard_uid') || localStorage.getItem('uid') || '';
        } catch (e) { return ''; }
    }
    function version() {
        try {
            if (w.__APP_VERSION__) return String(w.__APP_VERSION__);
            var el = document.getElementById('metaVersionDisplay');
            return el && el.textContent ? el.textContent.trim() : '';
        } catch (e) { return ''; }
    }
    function lang() {
        try { return (w.I18N && I18N.getLang && I18N.getLang()) || ''; } catch (e) { return ''; }
    }
    function post(table, rows) {
        if (!rows || !rows.length) return;
        try {
            fetch(SUPA_URL + '/rest/v1/' + table, {
                method: 'POST',
                headers: {
                    'apikey': SUPA_KEY,
                    'Authorization': 'Bearer ' + SUPA_KEY,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(rows),
                keepalive: true
            }).catch(function () {});
        } catch (e) {}
    }
    function scheduleFlush() {
        if (flushTimer) return;
        flushTimer = setTimeout(flush, 4000);
    }
    function flush() {
        if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
        var e = errQueue; errQueue = [];
        var v = evtQueue; evtQueue = [];
        if (e.length) post('ab_error_logs', e);
        if (v.length) post('ab_events', v);
    }
    function captureError(message, stack, ctx) {
        try {
            var msg = String(message == null ? '' : message).slice(0, 500);
            if (!msg) return;
            var key = msg.slice(0, 120);
            var c = errCount[key] || 0;
            if (c >= MAX_SAME_ERR) return;
            errCount[key] = c + 1;
            if (Object.keys(errCount).length > MAX_UNIQUE_ERR) return;
            var row = {
                uid: uid(), version: version(), lang: lang(),
                message: msg, stack: String(stack || '').slice(0, 4000),
                url: String(location.href).slice(0, 300),
                ts: new Date().toISOString()
            };
            if (ctx != null) {
                try { row.ctx = (typeof ctx === 'string' ? ctx : JSON.stringify(ctx)).slice(0, 1000); } catch (e) {}
            }
            errQueue.push(row);
            scheduleFlush();
        } catch (e) {}
    }
    function event(name, props) {
        try {
            if (!name) return;
            if (evtQueue.length >= MAX_EVT) return;
            var row = { uid: uid(), version: version(), lang: lang(), name: String(name).slice(0, 60), ts: new Date().toISOString() };
            if (props != null) {
                try { row.props = (typeof props === 'string' ? props : JSON.stringify(props)).slice(0, 1000); } catch (e) {}
            }
            evtQueue.push(row);
            scheduleFlush();
        } catch (e) {}
    }
    function init() {
        if (w.__TELEMETRY_INIT__) return;
        w.__TELEMETRY_INIT__ = true;
        w.addEventListener('error', function (ev) {
            try {
                if (ev && ev.message) {
                    captureError(ev.message, ev.error && ev.error.stack, (ev.filename || '') + ':' + (ev.lineno || 0) + ':' + (ev.colno || 0));
                } else if (ev && ev.target && (ev.target.src || ev.target.href)) {
                    captureError('resource error: ' + (ev.target.src || ev.target.href), '', 'resource');
                }
            } catch (e) {}
        }, true);
        w.addEventListener('unhandledrejection', function (ev) {
            try {
                var r = ev && ev.reason;
                captureError('unhandledrejection: ' + (r && (r.message || r)), r && r.stack, 'promise');
            } catch (e) {}
        });
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'hidden') flush();
        });
        w.addEventListener('pagehide', flush);
        event('app_start', { href: location.href, w: w.innerWidth, h: w.innerHeight });
        setInterval(flush, 15000);
    }

    w.Telemetry = { init: init, captureError: captureError, event: event, flush: flush };
    init();
})(window);
