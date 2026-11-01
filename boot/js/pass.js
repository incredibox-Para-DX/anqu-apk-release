/* 通行证：8周/80级/5M一级/周上限12级/每级10赛季币 */
(function (w) {
    var S = { id: 'S1', name: '启程', weeks: 8, levels: 80, perLevel: 5000000, capLevels: 12, coinPerLevel: 10, premiumCost: 150000000 };
    var K = { xp: 'ab_pass_xp', week: 'ab_pass_week', weekXp: 'ab_pass_week_xp', start: 'ab_pass_start', premium: 'ab_pass_premium', coins: 'ab_pass_coins', claimedCoins: 'ab_pass_coins_claimed', claims: 'ab_pass_claims', lastW: 'ab_pass_last_weekly' };
    function num(k) { try { return Number(localStorage.getItem(k) || 0) || 0; } catch (e) { return 0; } }
    function str(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
    var I18N_KEYS = {
        pass: ['通行证', '通行證', 'Pass', 'Пропуск'],
        season_shop: ['赛季商店', '賽季商店', 'Season Shop', 'Магазин сезона'],
        rules: ['规则', '規則', 'Rules', 'Правила'],
        back: ['返回', '返回', 'Back', 'Назад'],
        upgrade: ['升级典藏', '升級典藏', 'Upgrade', 'Улучшить'],
        claim_all: ['一键领取', '一鍵領取', 'Claim All', 'Забрать всё'],
        coin: ['赛季币', '賽季幣', 'Season Coins', 'Монеты сезона'],
        weekly: ['本周', '本週', 'This week', 'На этой неделе'],
        cap: ['已达上限', '已達上限', 'Cap reached', 'Лимит достигнут'],
        normal: ['普通', '普通', 'Free', 'Бесплатный'],
        premium: ['典藏', '典藏', 'Premium', 'Премиум'],
        supreme: ['尊享', '尊享', 'Supreme', 'Люкс'],
        claimed: ['已领取', '已領取', 'Claimed', 'Получено'],
        claim: ['领取', '領取', 'Claim', 'Забрать'],
        locked: ['典藏解锁', '典藏解鎖', 'Premium only', 'Только премиум'],
        not_reached: ['未达成', '未達成', 'Locked', 'Недоступно'],
        shop_locked: ['需先解锁典藏通行证才能开启赛季商店', '需先解鎖典藏通行證才能開啟賽季商店', 'Unlock Premium Pass to open the Season Shop', 'Сначала откройте премиум-пропуск'],
        reissue_locked: ['返厂商店暂未开放', '返廠商店暫未開放', 'Reissue shop is not open yet', 'Магазин возвратов пока закрыт'],
        premium_unlocked: ['典藏已解锁', '典藏已解鎖', 'Premium unlocked', 'Премиум открыт']
    };
    if (window.I18N && I18N.addEntries) I18N.addEntries(I18N_KEYS);
    function t(k) { try { return (window.I18N && I18N.t) ? I18N.t(k) : k; } catch (e) { return k; } }
    function set(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }
    function monday() { var x = new Date(); var d = (x.getDay() + 6) % 7; x.setDate(x.getDate() - d); x.setHours(0, 0, 0, 0); return x.toISOString().slice(0, 10); }
    function level() { return Math.min(S.levels, Math.floor(num(K.xp) / S.perLevel)); }
    function isPremium() { return str(K.premium) === '1'; }
    function fmt(n) { return Math.floor(n).toLocaleString('en-US'); }

    function tick() {
        var wk = monday();
        if (str(K.week) !== wk) { set(K.week, wk); set(K.weekXp, 0); set(K.lastW, 0); }
        var cur = 0;
        try { cur = Number(w.__getWeeklyAccumulatedValue && w.__getWeeklyAccumulatedValue()) || 0; } catch (e) {}
        var last = num(K.lastW);
        if (cur > last) {
            var cap = S.capLevels * S.perLevel;
            var wx = Math.min(cap, num(K.weekXp) + (cur - last));
            var add = wx - num(K.weekXp);
            if (add > 0) { set(K.weekXp, wx); set(K.xp, Math.min(S.levels * S.perLevel, num(K.xp) + add)); }
            set(K.lastW, cur);
        }
        var total = level() * S.coinPerLevel, claimed = num(K.claimedCoins);
        if (total > claimed) { set(K.coins, num(K.coins) + (total - claimed)); set(K.claimedCoins, total); }
    }
    setInterval(tick, 3000);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(tick, 1200); });
    else setTimeout(tick, 1200);

    var STEPS = [
        { lv: 10, free: { key: 'cyberorange', name: '赛博橙', type: '名称色' }, prem: { key: 'cyberblue', name: '赛博蓝', type: '名称色' } },
        { lv: 20, free: { key: 'vpurple', name: '紫罗兰', type: '名称色' }, prem: { key: 'vaurora', name: '极光', type: '名称色' } },
        { lv: 30, free: { key: 'bg_pulse', name: '脉冲极客', type: '背景' }, prem: { key: 'bg_jiuke', name: '九课特工', type: '背景' } },
        { lv: 40, free: { key: 'card_wolf', name: '白狼连队', type: '名片' }, prem: { key: 'card_bhj', name: '黑金国际', type: '名片' } },
        { lv: 50, free: { key: 'bg_laizhan', name: '来战', type: '背景' }, prem: { key: 'bg_jixi', name: '急袭·近身战', type: '背景' } },
        { lv: 60, free: { key: 'card_gjzb', name: '国际装备', type: '名片' }, prem: { key: 'card_qxys', name: '前线要塞', type: '名片' } },
        { lv: 70, free: { key: 'card_yinghe', name: '硬核行旅', type: '名片' }, prem: { key: 'card_zsxf', name: '战术先锋', type: '名片' } },
        { lv: 80, free: { key: 'bg_jinshen', name: '近身战', type: '背景' }, prem: { key: 'ability_devil', name: '恶魔契约', type: '购买权' } }
    ];
    function claims() { try { return JSON.parse(localStorage.getItem(K.claims) || '{}') || {}; } catch (e) { return {}; } }
    function grant(st, kind) {
        if (kind === 'prem' && !isPremium()) { toast('需解锁典藏'); return; }
        var item = kind === 'prem' ? st.prem : st.free;
        if (!item) return;
        var c = claims(), id = st.lv + ':' + kind;
        if (c[id]) return;
        c[id] = 1; try { localStorage.setItem(K.claims, JSON.stringify(c)); } catch (e) {}
        try { localStorage.setItem('ab_pass_' + item.key, '1'); } catch (e) {}
        toast('已领取：' + item.name);
        view = { t: view.t };
        render();
    }
    function claimAll() {
        STEPS.forEach(function (st) {
            if (level() >= st.lv) { grant(st, 'free'); if (isPremium()) grant(st, 'prem'); }
        });
    }
    function toast(m) { try { if (w.showToast) w.showToast(m); } catch (e) {} }

    // UI
    var mask, panel, view = { t: 'main' };
    function el(tag, css, text) { var d = document.createElement(tag); if (css) d.style.cssText = css; if (text != null) d.textContent = text; return d; }
    function ensureStyle() {
        if (document.getElementById('pass-style')) return;
        var s = document.createElement('style');
        s.id = 'pass-style';
        s.textContent = '@keyframes passIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
            '@keyframes cellIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}' +
            '@keyframes viewIn{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:none}}' +
            '.pass-view{animation:viewIn .22s ease both}' +
            '.pass-enter{animation:passIn .26s ease both}' +
            '.pass-cell{animation:cellIn .3s ease both;transition:border-color .2s ease, transform .12s ease}' +
            '.pass-cell:active{transform:scale(.97)}' +
            '.pass-bar-fill{transition:width .6s cubic-bezier(.22,.61,.36,1)}' +
            '.pass-btn{transition:opacity .15s ease, transform .12s ease}' +
            '.pass-btn:active{transform:scale(.97);opacity:.9}';
        document.head.appendChild(s);
    }
    function btn(txt, fn, css) { var b = el('button', 'border:0;background:transparent;color:#e2e8f0;font-size:13px;padding:8px 6px;' + (css || ''), txt); b.onclick = fn; return b; }
    function header(title, back, right) {
        var h = el('div', 'display:flex;align-items:center;justify-content:space-between;padding:calc(10px + env(safe-area-inset-top)) 10px 10px;background:#10141b;border-bottom:1px solid rgba(255,255,255,.08);');
        h.appendChild(btn(t('back'), back));
        h.appendChild(el('div', 'font-size:16px;font-weight:700;color:#f8fafc;', title));
        h.appendChild(right || el('div', 'width:40px;'));
        return h;
    }
    function coinTag(n) {
        var d = el('div', 'display:flex;align-items:center;gap:4px;font-size:13px;color:#e2e8f0;');
        var i = el('img', 'width:18px;height:18px;'); i.src = 'images/season/coin.webp';
        d.appendChild(i); d.appendChild(el('span', '', fmt(n)));
        return d;
    }
    function rewardCell(st, kind) {
        var item = kind === 'prem' ? st.prem : st.free;
        var reached = level() >= st.lv;
        var c = claims(), got = !!c[st.lv + ':' + kind];
        var locked = kind === 'prem' && !isPremium();
        var cell = el('div', 'min-width:92px;border-radius:10px;border:1px solid ' + (reached ? 'rgba(209,162,74,.45)' : 'rgba(255,255,255,.08)') + ';background:#141922;padding:8px;display:flex;flex-direction:column;gap:6px;');
        cell.className = 'pass-cell';
        cell.style.animationDelay = Math.min(8, Math.round((st.lv - 10) / 10)) * 35 + 'ms';
        cell.appendChild(el('div', 'font-size:11px;color:#94a3b8;', 'Lv.' + st.lv));
        var img = el('div', 'height:52px;border-radius:8px;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;font-size:10px;color:#64748b;', (item && item.type) || '');
        cell.appendChild(img);
        cell.appendChild(el('div', 'font-size:12px;color:#e2e8f0;', item ? item.name : ''));
        var b = el('button', 'padding:5px 0;border-radius:8px;border:1px solid ' + (got || locked || !reached ? 'rgba(148,163,184,.3)' : 'rgba(251,191,36,.55)') + ';background:' + (got || locked || !reached ? 'rgba(148,163,184,.10)' : 'linear-gradient(135deg,rgba(251,191,36,.35),rgba(245,158,11,.18))') + ';color:' + (got || locked || !reached ? '#94a3b8' : '#fde68a') + ';font-size:11px;', got ? t('claimed') : (locked ? t('locked') : (reached ? t('claim') : t('not_reached'))));
        b.disabled = got || locked || !reached;
        b.onclick = function () { grant(st, kind); };
        cell.appendChild(b);
        return cell;
    }
    function track() {
        var wrap = el('div', 'overflow-x:auto;padding:10px;');
        ['free', 'prem'].forEach(function (kind) {
            var row = el('div', 'display:flex;align-items:center;gap:8px;margin-bottom:10px;');
            row.appendChild(el('div', 'width:36px;font-size:12px;color:' + (kind === 'prem' ? '#d1a24a' : '#8b93a3') + ';writing-mode:vertical-rl;letter-spacing:2px;', kind === 'prem' ? t('premium') : t('normal')));
            STEPS.forEach(function (st) { row.appendChild(rewardCell(st, kind)); });
            wrap.appendChild(row);
        });
        return wrap;
    }
    function renderMain() {
        var lv = level(), xp = num(K.xp);
        var top = el('div', 'padding:10px;');
        var line1 = el('div', 'display:flex;align-items:center;justify-content:space-between;');
        line1.appendChild(el('div', 'font-size:17px;font-weight:700;color:#e6e9ef;letter-spacing:.5px;', S.id + '·' + S.name));
        line1.appendChild(coinTag(num(K.coins)));
        top.appendChild(line1);
        var barWrap = el('div', 'display:flex;align-items:center;gap:8px;margin-top:8px;');
        var bar = el('div', 'flex:1;height:8px;background:rgba(255,255,255,.12);border-radius:4px;overflow:hidden;');
        var fill = el('div', 'height:100%;width:' + Math.round((xp % S.perLevel) / S.perLevel * 100) + '%;background:#d1a24a;');
        fill.className = 'pass-bar-fill';
        bar.appendChild(fill); barWrap.appendChild(bar);
        barWrap.appendChild(el('div', 'font-size:11px;color:#94a3b8;', lv + '/' + S.levels));
        top.appendChild(barWrap);
        var row2 = el('div', 'display:flex;align-items:center;justify-content:space-between;margin-top:6px;font-size:11px;color:#94a3b8;');
        row2.appendChild(el('div', '', '本周 ' + fmt(num(K.weekXp)) + ' / ' + fmt(S.capLevels * S.perLevel)));
        row2.appendChild(el('div', '', num(K.weekXp) >= S.capLevels * S.perLevel ? '已达上限' : ''));
        top.appendChild(row2);
        var actions = el('div', 'display:flex;gap:8px;margin-top:10px;');
        var all = el('button', 'flex:1;padding:9px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:#171c25;color:#cfd6e2;font-size:12px;', t('claim_all'));
        all.className = 'pass-btn';
        all.onclick = claimAll;
        var up = el('button', 'flex:1;padding:9px;border-radius:10px;border:1px solid rgba(209,162,74,.55);background:rgba(209,162,74,.12);color:#e8c98a;font-size:12px;', isPremium() ? t('premium_unlocked') : t('upgrade'));
        up.className = 'pass-btn';
        up.onclick = function () { view = { t: 'upgrade' }; render(); };
        actions.appendChild(all); actions.appendChild(up);
        top.appendChild(actions);
        panel.appendChild(top);
        panel.appendChild(track());
    }
    function renderUpgrade() {
        panel.appendChild(header(t('upgrade'), function () { view = { t: 'main' }; render(); }));
        var wrap = el('div', 'display:flex;gap:8px;padding:12px;align-items:stretch;');
        var tiers = [
            ['普通版', '已解锁', '#8b93a3', ['每级 10 赛季币', '普通轨 10–80 级里程碑', '赛季进度永久累积', '不含典藏外观与商店']],
            ['典藏版', '150M', '#d1a24a', ['普通版全部内容', '典藏轨 10–80 级里程碑', '开放赛季商店', '80 级解锁恶魔契约购买权']],
            ['尊享版', '赞助兑换码', '#b9a7ff', ['典藏版全部内容', '名片·长夜终烬', '立即提升 10 级', '赛季限一次']]
        ];
        tiers.forEach(function (x, i) {
            var col = el('div', 'flex:1;border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:10px;background:rgba(255,255,255,.03);');
            col.appendChild(el('div', 'font-size:14px;font-weight:700;color:#f8fafc;', x[0]));
            var ul = el('div', 'font-size:11px;color:#94a3b8;line-height:1.7;');
            ul.innerHTML = x[3].map(function (t) { return '· ' + t; }).join('<br>');
            col.appendChild(ul);
            var foot = el('div', 'margin-top:auto;font-size:12px;color:' + x[2] + ';');
            if (i === 1) {
                var b = el('button', 'width:100%;padding:8px;border-radius:10px;border:1px solid rgba(251,191,36,.5);background:rgba(251,191,36,.15);color:#fde68a;font-size:12px;', isPremium() ? '已解锁' : '150M 解锁');
                b.disabled = isPremium();
                b.onclick = function () { if (w.__spendTotalValue && w.__spendTotalValue(S.premiumCost)) { set(K.premium, '1'); toast('典藏已解锁'); view = { t: 'main' }; render(); } else toast('累计价值不足 150M'); };
                foot.appendChild(b);
            } else { foot.textContent = x[1]; }
            col.appendChild(foot);
            wrap.appendChild(col);
        });
        panel.appendChild(wrap);
    }
    function renderShop() {
        panel.appendChild(header(t('season_shop'), function () { view = { t: 'main' }; render(); }, coinTag(num(K.coins))));
        var wrap = el('div', 'padding:12px;');
        if (!isPremium()) {
            wrap.appendChild(el('div', 'font-size:13px;color:#f87171;', t('shop_locked')));
        } else {
            var item = el('div', 'display:flex;gap:10px;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:10px;background:rgba(255,255,255,.03);');
            item.appendChild(el('div', 'width:96px;height:64px;border-radius:8px;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;font-size:10px;color:#64748b;', '商品图'));
            var info = el('div', 'flex:1;display:flex;flex-direction:column;gap:6px;');
            info.appendChild(el('div', 'font-size:13px;color:#e2e8f0;', '占位商品'));
            info.appendChild(coinTag(999));
            var b = el('button', 'align-self:flex-start;padding:6px 12px;border-radius:8px;border:1px solid rgba(148,163,184,.35);background:rgba(148,163,184,.1);color:#94a3b8;font-size:12px;', '购买');
            b.disabled = true;
            info.appendChild(b);
            item.appendChild(info);
            wrap.appendChild(item);
        }
        panel.appendChild(wrap);
    }
    function renderRules() {
        panel.appendChild(header(t('rules'), function () { view = { t: 'main' }; render(); }));
        var t = el('div', 'padding:12px;font-size:12px;color:#cbd5e1;line-height:1.9;');
        t.innerHTML = '1. 赛季 8 周，80 级，每级 5M 本周累计价值。<br>2. 每周最多升 12 级，周一重置当周经验。<br>3. 每级获得 10 赛季币，资料页显示余额。<br>4. 典藏：消耗 150M 累计价值解锁；尊享：赞助兑换码解锁（额外名片 + 直升 10 级）。<br>5. 赛季商店需典藏；返厂商店暂未开放。';
        panel.appendChild(t);
    }
    function render() {
        if (!panel) return;
        panel.innerHTML = '';
        if (panel.animate) {
            try { panel.animate([{ opacity: 0, transform: 'translateX(10px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'ease-out' }); } catch (e) {}
        }
        if (view.t === 'main') {
            var right = el('div', 'display:flex;gap:2px;');
            right.appendChild(btn(t('season_shop'), function () { view = { t: 'shop' }; render(); }));
            right.appendChild(btn(t('rules'), function () { view = { t: 'rules' }; render(); }));
            panel.appendChild(header(t('pass'), function () { mask.style.display = 'none'; }, right));
            renderMain();
        } else if (view.t === 'upgrade') renderUpgrade();
        else if (view.t === 'shop') renderShop();
        else renderRules();
    }
    function open() {
        if (!mask) {
            mask = el('div', 'position:fixed;inset:0;z-index:12000;background:#0b0e13;overflow:auto;');
            panel = el('div', 'width:100%;min-height:100%;margin:0;background:#10141b;color:#e6e9ef;padding-bottom:calc(24px + env(safe-area-inset-bottom));');
            mask.appendChild(panel);
            mask.addEventListener('click', function (e) { if (e.target === mask) mask.style.display = 'none'; });
            panel.className = 'pass-enter';
            document.body.appendChild(mask);
        }
        mask.style.display = 'block';
        view = { t: 'main' };
        ensureStyle();
        render();
    }
    function bind() {
        var sec = document.getElementById('section-other');
        if (sec && !document.getElementById('sidebar-pass-btn')) {
            var b = el('button', '', '');
            b.className = 'sidebar-btn full-width';
            b.id = 'sidebar-pass-btn';
            b.style.marginTop = '6px';
            b.innerHTML = '<i class="fas fa-ticket"></i> 通行证';
            b.onclick = open;
            sec.insertBefore(b, sec.firstChild);
        }
        function syncGmBtn() {
            var gm = document.getElementById('gm-debug-section');
            if (!gm) return;
            var unlocked = false;
            try { unlocked = document.body.getAttribute('data-gm') === '1' || localStorage.getItem('ab_gm_unlocked') === '1'; } catch (e) {}
            var exists = document.getElementById('gm-pass-debug-btn');
            if (unlocked && !exists) {
                var g = el('button', '', '');
                g.className = 'sidebar-btn full-width';
                g.id = 'gm-pass-debug-btn';
                g.style.marginTop = '6px';
                g.innerHTML = '<i class="fas fa-flask"></i> 通行证调试';
                g.onclick = openDebug;
                gm.appendChild(g);
            } else if (!unlocked && exists) {
                exists.remove();
            }
        }
        syncGmBtn();
        setInterval(syncGmBtn, 3000);
    }
    function dbgState() {
        return 'Lv ' + level() + ' / ' + S.levels + '\nXP ' + fmt(num(K.xp)) + '\n本周 ' + fmt(num(K.weekXp)) + '\n币 ' + fmt(num(K.coins)) + '\n典藏 ' + (isPremium() ? '已解锁' : '未解锁');
    }
    function openDebug() {
        var m = el('div', 'position:fixed;inset:0;z-index:13000;background:rgba(6,8,12,.9);display:flex;align-items:center;justify-content:center;padding:16px;');
        var p = el('div', 'width:100%;max-width:420px;max-height:82vh;overflow:auto;background:#11161f;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px;color:#e2e8f0;');
        p.appendChild(el('div', 'font-size:15px;font-weight:700;', '通行证调试'));
        var st = el('div', 'font-size:12px;color:#94a3b8;margin-top:8px;white-space:pre-line;line-height:1.6;', dbgState());
        p.appendChild(st);
        function add(txt, fn) {
            var b = el('button', 'width:100%;margin-top:8px;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,.14);background:#1a2029;color:#e2e8f0;font-size:12px;', txt);
            b.onclick = function () { try { fn(); } catch (e) {} st.textContent = dbgState(); render(); };
            p.appendChild(b);
        }
        add('+10 级（+50M 经验）', function () { set(K.xp, Math.min(S.levels * S.perLevel, num(K.xp) + S.perLevel * 10)); });
        add('+1000 赛季币', function () { set(K.coins, num(K.coins) + 1000); });
        add('解锁典藏', function () { set(K.premium, '1'); });
        add('解锁尊享（典藏+10级+长夜终烬）', function () { set(K.premium, '1'); set(K.xp, Math.min(S.levels * S.perLevel, num(K.xp) + S.perLevel * 10)); try { localStorage.setItem('ab_pass_card_night', '1'); } catch (e) {} });
        add('解锁恶魔契约购买权', function () { try { localStorage.setItem('ab_pass_ability_devil', '1'); } catch (e) {} });
        add('重置赛季进度', function () { [K.xp, K.weekXp, K.week, K.start, K.premium, K.coins, K.claimedCoins, K.claims, K.lastW].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} }); });
        var close = el('button', 'width:100%;margin-top:12px;padding:8px;border-radius:8px;border:0;background:#243040;color:#cbd5e1;font-size:12px;', '关闭');
        close.onclick = function () { m.remove(); };
        p.appendChild(close);
        m.appendChild(p);
        m.addEventListener('click', function (e) { if (e.target === m) m.remove(); });
        document.body.appendChild(m);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
    w.PassSeason = { open: open, level: level, isPremium: isPremium, coins: function () { return num(K.coins); } };
})(window);
