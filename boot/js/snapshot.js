/* 跨设备完整快照：本机 localStorage 打包 → Supabase(ab_saves) 存快照码 → 换设备输入码恢复 */
(function (w) {
    'use strict';
    var SUPA_URL = 'https://fgkfgyudwbhmmrqvtfup.supabase.co';
    var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZna2ZneXVkd2JobW1ycXZ0ZnVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MTkyODAsImV4cCI6MjA5NzI5NTI4MH0.zcnusHgHSUK3AogYAXaR-9Q2KWuGK6_V7wwhgj1D1PI';
    var CODE_KEY = 'ab_snap_code';
    var BLOCK = ['ab_mods_manifest_cache_v2', 'musicPlayer_imageCache', 'ab_leaderboard_cache_v1', 'ab_snap_code'];
    function $(id) { return document.getElementById(id); }
    function T(k) { return (w.I18N && w.I18N.t) ? w.I18N.t(k) : ''; }
    function status(t, c) { var el = $('snapshot-status'); if (el) { el.textContent = t || ''; el.style.color = c || '#94a3b8'; } }
    function hdr() { return { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY, 'Content-Type': 'application/json' }; }
    function genCode() {
        var c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
        for (var i = 0; i < 8; i++) s += c.charAt(Math.floor(Math.random() * c.length));
        return s;
    }
    function collect() {
        var data = {};
        try {
            for (var i = 0; i < localStorage.length; i++) {
                var k = localStorage.key(i);
                if (!k || BLOCK.indexOf(k) !== -1) continue;
                if (k.indexOf('ab_mods_seen') === 0) continue;
                data[k] = localStorage.getItem(k);
            }
        } catch (e) {}
        return data;
    }
    function upload() {
        var code;
        try { code = localStorage.getItem(CODE_KEY) || genCode(); } catch (e) { code = genCode(); }
        var snap = collect();
        status(T('snap_uploading'));
        fetch(SUPA_URL + '/rest/v1/ab_saves?on_conflict=code', {
            method: 'POST',
            headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal' },
            body: JSON.stringify([{ code: code, data: JSON.stringify(snap), updated_at: new Date().toISOString() }])
        }).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            try { localStorage.setItem(CODE_KEY, code); } catch (e) {}
            var el = $('snapshot-code'); if (el) el.textContent = code;
            status(T('snap_uploaded') + code, '#34d399');
        }).catch(function (e) { status(T('snap_upload_fail') + (e && e.message || e), '#f87171'); });
    }
    function restore() {
        var inp = $('snapshot-input');
        var code = (inp ? inp.value : '').trim().toUpperCase();
        if (!code) { status(T('snap_need_code'), '#f87171'); return; }
        status(T('snap_reading'));
        fetch(SUPA_URL + '/rest/v1/ab_saves?code=eq.' + encodeURIComponent(code) + '&select=data,updated_at', { headers: hdr() })
            .then(function (r) { return r.json(); })
            .then(function (rows) {
                if (!rows || !rows.length) { status(T('snap_notfound'), '#f87171'); return; }
                var data;
                try { data = JSON.parse(rows[0].data); } catch (e) { status(T('snap_corrupt'), '#f87171'); return; }
                var n = 0;
                for (var k in data) {
                    if (!Object.prototype.hasOwnProperty.call(data, k)) continue;
                    if (BLOCK.indexOf(k) !== -1) continue;
                    try { localStorage.setItem(k, data[k]); n++; } catch (e) {}
                }
                status(T('snap_restored').replace('{n}', n), '#34d399');
                setTimeout(function () { location.reload(); }, 800);
            })
            .catch(function (e) { status(T('snap_restore_fail') + (e && e.message || e), '#f87171'); });
    }
    function open() {
        try { var c = localStorage.getItem(CODE_KEY); var el = $('snapshot-code'); if (c && el) el.textContent = c; } catch (e) {}
        try { if (w.ModalRegistry && w.ModalRegistry.open) return w.ModalRegistry.open('snapshot-modal'); } catch (e) {}
        var m = $('snapshot-modal'); if (m) { m.style.display = 'flex'; setTimeout(function () { m.classList.add('show'); }, 10); }
    }
    function close() {
        try { if (w.ModalRegistry && w.ModalRegistry.close) return w.ModalRegistry.close('snapshot-modal'); } catch (e) {}
        var m = $('snapshot-modal'); if (m) { m.classList.remove('show'); setTimeout(function () { m.style.display = 'none'; }, 300); }
    }
    function bind() {
        var b = $('sidebar-snapshot-btn'); if (b && !b._b) { b._b = true; b.addEventListener('click', open); }
        var cs = [$('snapshot-close'), $('snapshot-close2')];
        cs.forEach(function (c) { if (c && !c._b) { c._b = true; c.addEventListener('click', close); } });
        var u = $('snapshot-upload'); if (u && !u._b) { u._b = true; u.addEventListener('click', upload); }
        var r = $('snapshot-restore'); if (r && !r._b) { r._b = true; r.addEventListener('click', restore); }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
    w.Snap = { upload: upload, restore: restore, open: open, close: close };
})(window);
