/* 通行证核心：经验=本周累计价值；5M/级；每周上限 12 级；每级 10 赛季币 */
(function (w) {
    var S = {
        id: 'S1',
        weeks: 8,
        levels: 80,
        perLevel: 5000000,
        weeklyCapLevels: 12,
        coinPerLevel: 10,
        premiumCost: 150000000
    };
    var K = {
        xp: 'ab_pass_xp',
        week: 'ab_pass_week',
        weekXp: 'ab_pass_week_xp',
        start: 'ab_pass_start',
        premium: 'ab_pass_premium',
        coins: 'ab_pass_coins',
        claimedCoins: 'ab_pass_coins_claimed',
        claims: 'ab_pass_claims',
        lastWeekly: 'ab_pass_last_weekly'
    };
    function num(k) { try { return Number(localStorage.getItem(k) || 0) || 0; } catch (e) { return 0; } }
    function str(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
    function set(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }
    function monday(d) {
        var x = new Date(d); var day = (x.getDay() + 6) % 7;
        x.setDate(x.getDate() - day); x.setHours(0, 0, 0, 0);
        return x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2);
    }
    function weekNow() { return monday(new Date()); }
    function seasonWeekIndex() {
        var st = str(K.start);
        if (!st) { st = weekNow(); set(K.start, st); }
        var a = new Date(st + 'T00:00:00'), b = new Date(weekNow() + 'T00:00:00');
        return Math.max(0, Math.floor((b - a) / 604800000));
    }
    function level() { return Math.min(S.levels, Math.floor(num(K.xp) / S.perLevel)); }
    function isPremium() { return str(K.premium) === '1'; }

    function tick() {
        var wk = weekNow();
        if (str(K.week) !== wk) { set(K.week, wk); set(K.weekXp, 0); set(K.lastWeekly, 0); }
        var cur = 0;
        try { cur = Number(w.__getWeeklyAccumulatedValue && w.__getWeeklyAccumulatedValue()) || 0; } catch (e) { cur = 0; }
        var last = num(K.lastWeekly);
        if (cur > last) {
            var delta = cur - last;
            var cap = S.weeklyCapLevels * S.perLevel;
            var wx = Math.min(cap, num(K.weekXp) + delta);
            var add = wx - num(K.weekXp);
            if (add > 0) { set(K.weekXp, wx); set(K.xp, num(K.xp) + add); }
            set(K.lastWeekly, cur);
        }
        if (num(K.xp) > S.levels * S.perLevel) set(K.xp, S.levels * S.perLevel);

        var lv = level();
        var totalCoins = lv * S.coinPerLevel;
        var claimed = num(K.claimedCoins);
        var coins = num(K.coins) + Math.max(0, totalCoins - claimed);
        set(K.coins, coins);
        if (totalCoins > claimed) set(K.claimedCoins, totalCoins);
    }
    setInterval(tick, 3000);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(tick, 1200); });
    else setTimeout(tick, 1200);

    var STEPS = [
        { lv: 10, free: { key: 'cyberorange', name: '名称色·赛博橙' }, prem: { key: 'cyberblue', name: '名称色·赛博蓝' } },
        { lv: 20, free: { key: 'vpurple', name: '名称色·紫罗兰' }, prem: { key: 'vaurora', name: '名称色·极光' } },
        { lv: 30, free: { key: 'bg_pulse', name: '背景·脉冲极客' }, prem: { key: 'bg_jiuke', name: '背景·九课特工' } },
        { lv: 40, free: { key: 'card_wolf', name: '名片·白狼连队' }, prem: { key: 'card_bhj', name: '名片·黑金国际' } },
        { lv: 50, free: { key: 'bg_laizhan', name: '背景·来战' }, prem: { key: 'bg_jixi', name: '背景·急袭·近身战' } },
        { lv: 60, free: { key: 'card_gjzb', name: '名片·国际装备' }, prem: { key: 'card_qxys', name: '名片·前线要塞' } },
        { lv: 70, free: { key: 'card_yinghe', name: '名片·硬核行旅' }, prem: { key: 'card_zsxf', name: '名片·战术先锋' } },
        { lv: 80, free: { key: 'bg_jinshen', name: '背景·近身战' }, prem: { key: 'ability_devil', name: '恶魔契约购买权' } }
    ];
    function claims() { try { return JSON.parse(localStorage.getItem(K.claims) || '{}') || {}; } catch (e) { return {}; } }
    function saveClaims(o) { try { localStorage.setItem(K.claims, JSON.stringify(o)); } catch (e) {} }
    function grant(step, kind) {
        var item = kind === 'prem' ? step.prem : step.free;
        if (!item) return;
        if (kind === 'prem' && !isPremium()) return;
        var c = claims();
        var id = step.lv + ':' + kind;
        if (c[id]) return;
        c[id] = 1; saveClaims(c);
        try { localStorage.setItem('ab_pass_' + item.key, '1'); } catch (e) {}
        if (w.showToast) w.showToast('已领取：' + item.name);
        render();
    }

    /* ------- UI ------- */
    var mask = null, body = null;
    function el(tag, css, text) { var d = document.createElement(tag); if (css) d.style.cssText = css; if (text != null) d.textContent = text; return d; }
    function fmt(n) { return Math.floor(n).toLocaleString('en-US'); }
    function render() {
        if (!body) return;
        body.innerHTML = '';
        var lv = level(), lvXp = num(K.xp) % S.perLevel;
        var h = el('div', 'font-size:18px;font-weight:700;color:#f8fafc;', '通行证 · ' + S.id);
        body.appendChild(h);
        var sub = el('div', 'font-size:12px;color:#94a3b8;margin-top:4px;',
            '等级 ' + lv + '/' + S.levels + ' · 本周经验 ' + fmt(num(K.weekXp)) + ' / ' + fmt(S.weeklyCapLevels * S.perLevel));
        body.appendChild(sub);
        var bar = el('div', 'height:10px;border-radius:6px;background:rgba(255,255,255,.12);margin-top:10px;overflow:hidden;');
        var fill = el('div', 'height:100%;width:' + Math.round(lvXp / S.perLevel * 100) + '%;background:linear-gradient(90deg,#f59e0b,#fbbf24);');
        bar.appendChild(fill); body.appendChild(bar);
        var coin = el('div', 'font-size:13px;color:#fbbf24;margin-top:10px;', '赛季币：' + fmt(num(K.coins)));
        body.appendChild(coin);

        var pre = el('div', 'margin-top:12px;display:flex;gap:8px;align-items:center;');
        if (isPremium()) {
            pre.appendChild(el('div', 'font-size:13px;color:#34d399;', '典藏已解锁'));
        } else {
            var b = el('button', 'flex:1;padding:10px;border-radius:10px;border:1px solid rgba(59,130,246,.5);background:rgba(59,130,246,.18);color:#dbeafe;font-size:13px;', '消耗 150M 解锁典藏');
            b.onclick = function () {
                if (w.__spendTotalValue && w.__spendTotalValue(S.premiumCost)) {
                    set(K.premium, '1');
                    if (w.showToast) w.showToast('典藏通行证已解锁');
                    render();
                } else if (w.showToast) w.showToast('累计价值不足 150M');
            };
            pre.appendChild(b);
        }
        body.appendChild(pre);

        STEPS.forEach(function (st) {
            var row = el('div', 'margin-top:10px;border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:10px;background:rgba(255,255,255,.03);');
            row.appendChild(el('div', 'font-size:13px;color:#e2e8f0;font-weight:600;', 'Lv.' + st.lv));
            [['free', '普通', st.free, '#94a3b8'], ['prem', '高级', st.prem, '#fbbf24']].forEach(function (x) {
                var kind = x[0], label = x[1], item = x[2];
                if (!item) return;
                var c = claims(); var done = !!c[st.lv + ':' + kind];
                var line = el('div', 'display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px;');
                line.appendChild(el('div', 'font-size:12px;color:' + x[3] + ';', label + '：' + item.name));
                var btn = el('button', 'padding:5px 10px;border-radius:8px;border:1px solid rgba(148,163,184,.4);background:rgba(148,163,184,.12);color:#e2e8f0;font-size:12px;', done ? '已领取' : '领取');
                btn.disabled = done;
                btn.onclick = function () { grant(st, kind); };
                line.appendChild(btn);
                row.appendChild(line);
            });
            body.appendChild(row);
        });
    }
    function open() {
        if (!mask) {
            mask = el('div', 'position:fixed;inset:0;z-index:12000;background:rgba(6,8,12,.75);display:flex;align-items:flex-end;justify-content:center;');
            var panel = el('div', 'width:100%;max-width:560px;max-height:82vh;overflow:auto;background:#0f1319;border-radius:16px 16px 0 0;padding:16px 14px calc(20px + env(safe-area-inset-bottom));color:#e2e8f0;');
            var head = el('div', 'display:flex;justify-content:space-between;align-items:center;');
            head.appendChild(el('div', 'font-size:13px;color:#94a3b8;', ''));
            var x = el('button', 'background:transparent;border:0;color:#94a3b8;font-size:22px;', '\u00d7');
            x.onclick = function () { mask.style.display = 'none'; };
            head.appendChild(x);
            panel.appendChild(head);
            body = el('div', '');
            panel.appendChild(body);
            mask.appendChild(panel);
            mask.addEventListener('click', function (e) { if (e.target === mask) mask.style.display = 'none'; });
            document.body.appendChild(mask);
        }
        mask.style.display = 'flex';
        render();
    }

    function bind() {
        var sec = document.getElementById('section-other');
        if (!sec) return;
        if (document.getElementById('sidebar-pass-btn')) return;
        var btn = el('button', 'margin-top:6px;', '');
        btn.className = 'sidebar-btn full-width';
        btn.id = 'sidebar-pass-btn';
        btn.innerHTML = '<i class="fas fa-ticket"></i> 通行证';
        btn.onclick = open;
        sec.insertBefore(btn, sec.firstChild);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
    w.PassSeason = { open: open, level: level, xp: function () { return num(K.xp); }, coins: function () { return num(K.coins); }, isPremium: isPremium, steps: STEPS };
})(window);
