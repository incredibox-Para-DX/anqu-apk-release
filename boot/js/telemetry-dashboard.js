/* 遥测看板（GM）：读取 Supabase ab_error_logs / ab_events 并展示 */
(function (w) {
    'use strict';
    var SUPA_URL = 'https://fgkfgyudwbhmmrqvtfup.supabase.co';
    var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZna2ZneXVkd2JobW1ycXZ0ZnVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MTkyODAsImV4cCI6MjA5NzI5NTI4MH0.zcnusHgHSUK3AogYAXaR-9Q2KWuGK6_V7wwhgj1D1PI';
    function $(id) { return document.getElementById(id); }
    function T(k) { return (w.I18N && w.I18N.t) ? w.I18N.t(k) : ''; }
    function hdr() { return { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY }; }
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function status(t, c) { var el = $('tl-status'); if (el) { el.textContent = t || ''; el.style.color = c || '#94a3b8'; } }
    function card(label, val) {
        return '<div class="tl-card"><div class="tl-num">' + val + '</div><div class="tl-lbl">' + label + '</div></div>';
    }
    function load() {
        status(T('tl_loading'));
        Promise.all([
            fetch(SUPA_URL + '/rest/v1/ab_error_logs?select=message,version,url,ts&order=ts.desc&limit=100', { headers: hdr() }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
            fetch(SUPA_URL + '/rest/v1/ab_events?select=name,version,ts&order=ts.desc&limit=1000', { headers: hdr() }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
        ]).then(function (res) {
            var errors = res[0], events = res[1];
            if (errors === null && events === null) { status(T('tl_no_perm'), '#f87171'); return; }
            errors = errors || []; events = events || [];
            var uniq = {}; errors.forEach(function (e) { uniq[String(e.message || '').slice(0, 80)] = 1; });
            var evmap = {}; events.forEach(function (e) { evmap[e.name] = (evmap[e.name] || 0) + 1; });
            var top = Object.keys(evmap).map(function (k) { return [k, evmap[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 10);
            var s = $('tl-summary');
            if (s) s.innerHTML = card(T('tl_err_recent'), errors.length) + card(T('tl_unique_err'), Object.keys(uniq).length) + card(T('tl_evt_recent'), events.length);
            var el = $('tl-errors');
            if (el) el.innerHTML = errors.length ? errors.slice(0, 40).map(function (e) {
                var t = e.ts ? new Date(e.ts).toLocaleString() : '';
                return '<div class="tl-item"><div class="tl-msg">' + esc(e.message) + '</div><div class="tl-meta">' + esc(e.version || '') + ' · ' + esc(t) + '</div></div>';
            }).join('') : '<div class="tl-empty">' + T('tl_no_err') + '</div>';
            var ev = $('tl-events');
            if (ev) ev.innerHTML = top.length ? top.map(function (x) {
                return '<div class="tl-row"><span>' + esc(x[0]) + '</span><b>' + x[1] + '</b></div>';
            }).join('') : '<div class="tl-empty">' + T('tl_no_evt') + '</div>';
            status(T('tl_updated') + new Date().toLocaleTimeString());
        }).catch(function (e) { status(T('tl_load_fail') + (e && e.message || e), '#f87171'); });
    }
    function open() {
        load();
        try { if (w.ModalRegistry && w.ModalRegistry.open) { w.ModalRegistry.open('telemetry-modal'); return; } } catch (e) {}
        var m = $('telemetry-modal'); if (m) { m.style.display = 'flex'; setTimeout(function () { m.classList.add('show'); }, 10); }
    }
    function close() {
        try { if (w.ModalRegistry && w.ModalRegistry.close) return w.ModalRegistry.close('telemetry-modal'); } catch (e) {}
        var m = $('telemetry-modal'); if (m) { m.classList.remove('show'); setTimeout(function () { m.style.display = 'none'; }, 300); }
    }
    function bind() {
        var b = $('gm-telemetry-btn'); if (b && !b._b) { b._b = true; b.addEventListener('click', open); }
        [$('telemetry-close'), $('telemetry-close2')].forEach(function (c) { if (c && !c._b) { c._b = true; c.addEventListener('click', close); } });
        var r = $('telemetry-refresh'); if (r && !r._b) { r._b = true; r.addEventListener('click', function () { load(); }); }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
    w.TelemetryDash = { open: open, load: load };
})(window);
