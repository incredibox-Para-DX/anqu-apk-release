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
        if (!u) return Promise.resolve();
        return rpc('get_entitlements', { p_uid: u }).then(function (list) {
            applyList(list);
        }).catch(function () {});
    }

    function serverRedeem(code) {
        var u = uid();
        if (!u) return Promise.reject(new Error('no uid'));
        return rpc('redeem_code', { p_uid: u, p_code: code });
    }

    w.Entitlements = { sync: sync, serverRedeem: serverRedeem, apply: applyList };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(sync, 1500); });
    else setTimeout(sync, 1500);
})(window);
