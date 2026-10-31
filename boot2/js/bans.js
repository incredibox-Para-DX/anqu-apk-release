(function (w) {
    var FALLBACK_URL = 'https://fgkfgyudwbhmmrqvtfup.supabase.co';
    var FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZna2ZneXVkd2JobW1ycXZ0ZnVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MTkyODAsImV4cCI6MjA5NzI5NTI4MH0.zcnusHgHSUK3AogYAXaR-9Q2KWuGK6_V7wwhgj1D1PI';

    function base() { try { return typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL ? SUPABASE_URL : FALLBACK_URL; } catch (e) { return FALLBACK_URL; } }
    function key() { try { return typeof SUPABASE_ANON_KEY !== 'undefined' && SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY : FALLBACK_KEY; } catch (e) { return FALLBACK_KEY; } }
    function uid() { try { return (typeof getUid === 'function') ? getUid() : (localStorage.getItem('ab_uid') || ''); } catch (e) { return ''; } }

    function rpc(fn, body) {
        return fetch(base() + '/rest/v1/rpc/' + fn, {
            method: 'POST',
            headers: { 'apikey': key(), 'Authorization': 'Bearer ' + key(), 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }).then(function (r) {
            return r.text().then(function (t) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return t ? JSON.parse(t) : null;
            });
        });
    }

    function fmtDuration(until) {
        if (!until) return '永久';
        var end = new Date(until).getTime();
        var now = Date.now();
        if (!isFinite(end) || end <= now) return '永久';
        var ms = end - now;
        var d = Math.floor(ms / 86400000);
        var h = Math.floor((ms % 86400000) / 3600000);
        var m = Math.floor((ms % 3600000) / 60000);
        var s = '剩余 ';
        if (d > 0) s += d + ' 天 ';
        if (h > 0) s += h + ' 小时 ';
        s += m + ' 分钟';
        return s;
    }

    var shown = false;
    function showBan(info) {
        if (shown) return;
        shown = true;
        try { document.body.style.overflow = 'hidden'; } catch (e) {}
        var el = document.createElement('div');
        el.id = 'ban-overlay';
        el.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#0b0e13;color:#e2e8f0;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;flex-direction:column;gap:14px;';
        var title = document.createElement('div');
        title.style.cssText = 'font-size:22px;font-weight:700;color:#ef4444;letter-spacing:1px;';
        title.textContent = '您已被封禁账号';
        var dur = document.createElement('div');
        dur.style.cssText = 'font-size:15px;color:#f59e0b;';
        dur.textContent = '封禁时长：' + fmtDuration(info && info.until);
        var reason = document.createElement('div');
        reason.style.cssText = 'font-size:13px;color:#94a3b8;max-width:420px;line-height:1.8;';
        reason.textContent = '原因：' + ((info && info.reason) || '违反用户协议');
        var tip = document.createElement('div');
        tip.style.cssText = 'font-size:12px;color:#475569;margin-top:8px;';
        tip.textContent = '如有疑问请联系管理员';
        el.appendChild(title); el.appendChild(dur); el.appendChild(reason); el.appendChild(tip);
        document.body.appendChild(el);
    }

    function check() {
        var u = uid();
        if (!u) return Promise.resolve(false);
        return rpc('get_ban', { p_uid: u }).then(function (r) {
            if (r && r.banned) { showBan(r); return true; }
            return false;
        }).catch(function () { return false; });
    }

    w.Bans = { check: check, show: showBan };
    function start() {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(check, 800); });
        else setTimeout(check, 800);
        setInterval(check, 60000);
        try {
            window.addEventListener('online', check);
            document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
        } catch (e) {}
    }
    start();
})(window);
