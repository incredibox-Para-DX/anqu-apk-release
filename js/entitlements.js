(function (w) {
    var FALLBACK_URL = 'https://fgkfgyudwbhmmrqvtfup.supabase.co';
    var FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZna2ZneXVkd2JobW1ycXZ0ZnVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MTkyODAsImV4cCI6MjA5NzI5NTI4MH0.zcnusHgHSUK3AogYAXaR-9Q2KWuGK6_V7wwhgj1D1PI';

    function base() {
        try { return typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL ? SUPABASE_URL : FALLBACK_URL; }
        catch (e) { return FALLBACK_URL; }
    }
    function key() {
        try { return typeof SUPABASE_ANON_KEY !== 'undefined' && SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY : FALLBACK_KEY; }
        catch (e) { return FALLBACK_KEY; }
    }
    function uid() {
        try { return (typeof getUid === 'function') ? getUid() : (localStorage.getItem('ab_uid') || ''); }
        catch (e) { return ''; }
    }
    function rpc(fn, body) {
        return fetch(base() + '/rest/v1/rpc/' + fn, {
            method: 'POST',
            headers: {
                'apikey': key(),
                'Authorization': 'Bearer ' + key(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }).then(function (r) {
            return r.text().then(function (t) {
                if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + String(t).slice(0, 120));
                return t ? JSON.parse(t) : null;
            });
        });
    }

    function applyList(list) {
        if (!Array.isArray(list)) return;
        list.forEach(function (e) {
            var k = String(e.ekey || '');
            var v = e.evalue;
            if (k === 'gm') {
                try { localStorage.setItem('ab_gm_unlocked', 'true'); } catch (x) {}
            } else if (k === 'item_pool') {
                try { localStorage.setItem('ab_item_control_unlocked', '1'); } catch (x) {}
            } else if (k === 'gold_name') {
                try { localStorage.setItem('ab_gold_name', '1'); } catch (x) {}
            } else if (k === 'value') {
                try {
                    if (!localStorage.getItem('ab_ent_value_applied')) {
                        var p = JSON.parse(v || '{}');
                        if (typeof w.__addAccumulatedValue === 'function') w.__addAccumulatedValue(p.amount || 0);
                        localStorage.setItem('ab_ent_value_applied', '1');
                    }
                } catch (x) {}
            } else if (k === 'skill') {
                try {
                    var ps = JSON.parse(v || '{}');
                    if (ps.skill && typeof w.__unlockSkillByRedeem === 'function') w.__unlockSkillByRedeem(ps.skill);
                } catch (x) {}
            } else if (k.indexOf('card:') === 0) {
                try { if (w.Cards && w.Cards.unlock) w.Cards.unlock(k.slice(5)); } catch (x) {}
            }
        });
    }

    function sync() {
        var u = uid();
        if (!u) return Promise.resolve(false);
        function attempt(n) {
            return rpc('get_entitlements', { p_uid: u }).then(function (list) {
                applyList(list);
                return true;
            }).catch(function () {
                if (n > 0) {
                    return new Promise(function (res) { setTimeout(res, 1200 * (4 - n)); })
                        .then(function () { return attempt(n - 1); });
                }
                return false;
            });
        }
        return attempt(3);
    }

    function serverRedeem(code) {
        var u = uid();
        if (!u) return Promise.reject(new Error('no uid'));
        return rpc('redeem_code', { p_uid: u, p_code: code });
    }

    function grant(secret, targetUid, ekey, evalue) {
        return rpc('grant_entitlement', { p_secret: secret, p_uid: targetUid, p_ekey: ekey, p_evalue: evalue });
    }

    w.Entitlements = { sync: sync, serverRedeem: serverRedeem, grant: grant, apply: applyList };

    function bindGrantUI() {
        var btn = document.getElementById('gm-grant-btn');
        if (!btn || btn._b) return;
        btn._b = true;
        var modal = document.getElementById('gm-grant-modal');
        var close = document.getElementById('gm-grant-close');
        var submit = document.getElementById('gm-grant-submit');
        var status = document.getElementById('gm-grant-status');
        function st(t, c) { if (status) { status.textContent = t; status.style.color = c || '#94a3b8'; } }
        function open() {
            if (!modal) return;
            modal.style.display = 'flex';
            requestAnimationFrame(function () { modal.classList.add('show'); });
        }
        function closeM() {
            if (!modal) return;
            modal.classList.remove('show');
            setTimeout(function () { modal.style.display = 'none'; }, 300);
        }
        btn.addEventListener('click', open);
        if (close) close.addEventListener('click', closeM);
        if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closeM(); });
        var syncBtn = document.getElementById('gm-sync-ent-btn');
        if (syncBtn) syncBtn.addEventListener('click', function () {
            if (w.showToast) w.showToast('正在同步权益…');
            sync().then(function (ok) { if (w.showToast) w.showToast(ok ? '权益已同步' : '同步失败，请检查网络'); });
        });
        if (submit) submit.addEventListener('click', function () {
            var uidEl = document.getElementById('gm-grant-uid');
            var typeEl = document.getElementById('gm-grant-type');
            var secretEl = document.getElementById('gm-grant-secret');
            var u = (uidEl && uidEl.value || '').trim();
            var type = (typeEl && typeEl.value || '').trim();
            var secret = (secretEl && secretEl.value || '').trim();
            if (!u) { st('请输入对方 UID', '#f87171'); return; }
            if (!secret) { st('请输入管理密钥', '#f87171'); return; }
            var ekey = type, evalue = '1';
            if (type.indexOf('skill:') === 0) { ekey = 'skill'; evalue = JSON.stringify({ skill: type.slice(6) }); }
            else if (type.indexOf('value:') === 0) { ekey = 'value'; evalue = JSON.stringify({ amount: Number(type.slice(6)) || 0 }); }
            st('授权中…');
            submit.disabled = true;
            grant(secret, u, ekey, evalue).then(function (res) {
                if (res && res.ok) { st(res.message || '已授权', '#34d399'); if (w.showToast) w.showToast('已授权：' + u); }
                else { st((res && res.message) || '授权失败', '#f87171'); }
            }).catch(function (e) { st('请求失败：' + String(e && e.message || e).slice(0, 80), '#f87171'); }).then(function () { submit.disabled = false; });
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindGrantUI);
    else bindGrantUI();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(sync, 1500); });
    else setTimeout(sync, 1500);

    // 网络恢复 / 回到前台 时自动补同步（网差时不会永久错过）
    try {
        window.addEventListener('online', function () { sync(); });
        document.addEventListener('visibilitychange', function () { if (!document.hidden) sync(); });
    } catch (e) {}
})(window);
