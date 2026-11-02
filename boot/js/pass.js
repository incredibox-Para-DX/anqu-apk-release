/* 通行证：8周/80级/5M一级/周上限12级/每级10赛季币 */
(function (w) {
    'use strict';
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
        render();
    }
    function toast(m) { try { if (w.showToast) w.showToast(m); } catch (e) {} }

    // UI：统一走通用的全屏页面结构（modal-overlay app-full-page + modal-header/body），
    // 打开/关闭交给 ModalRegistry，复用通用过渡与音效。
    var root = null, bodyEl = null, view = { t: 'main' };

    function el(tag, css, text) { var d = document.createElement(tag); if (css) d.style.cssText = css; if (text != null) d.textContent = text; return d; }

    function ensureStyle() {
        if (document.getElementById('pass-style')) return;
        var s = document.createElement('style');
        s.id = 'pass-style';
        s.textContent =
            '#pass-page .pass-pad{padding:0;}' +
            '#pass-page .pass-track{overflow-x:auto;padding:4px 0 0;}' +
            '#pass-page .pass-row{display:flex;align-items:center;gap:8px;margin-bottom:10px;}' +
            '#pass-page .pass-cell{min-width:92px;border-radius:10px;border:1px solid var(--panel-border);background:var(--panel-inner-bg);padding:8px;display:flex;flex-direction:column;gap:6px;transition:border-color .2s ease,transform .12s ease;animation:uiRise .26s ease backwards;}' +
            '#pass-page .pass-cell:active{transform:scale(.97);}' +
            '#pass-page .pass-cell-ready{border-color:rgba(209,162,74,.55);box-shadow:inset 0 0 0 1px rgba(209,162,74,.12);cursor:pointer;}' +
            '#pass-page .pass-cell-state{font-size:11px;text-align:center;}' +
            '#pass-page .pass-rules{display:flex;flex-direction:column;gap:10px;}' +
            '#pass-page .pass-rule-box{border:1px solid var(--panel-border);border-radius:12px;padding:12px;background:var(--panel-bg);}' +
            '#pass-page .pass-bar{flex:1;height:8px;background:rgba(255,255,255,.12);border-radius:4px;overflow:hidden;}' +
            '#pass-page .pass-bar-fill{height:100%;background:var(--accent-color);transition:width .6s cubic-bezier(.22,.61,.36,1);}' +
            '#pass-page .pass-coin{display:flex;align-items:center;gap:4px;font-size:13px;color:var(--text-color);}' +
            '#pass-page .pass-coin img{width:18px;height:18px;}' +
            '#pass-page .pass-tier{flex:1;border:1px solid var(--panel-border);border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:10px;background:var(--panel-bg);}' +
            '#pass-page .pass-muted{font-size:11px;color:var(--text-light);line-height:1.7;}' +
            '#pass-page .pass-actions{display:flex;gap:8px;margin-top:10px;}' +
            '#pass-page .pass-actions .modal-btn{flex:1;}' +
            '#pass-page .modal-body{animation:uiRise .26s ease both;}' +
            '#pass-debug-modal .modal-body .modal-btn{margin-top:8px;}';
        document.head.appendChild(s);
    }

    function ensurePage() {
        if (root) return;
        ensureStyle();
        root = el('div', '', '');
        root.className = 'modal-overlay app-full-page';
        root.id = 'pass-page';
        root.style.display = 'none';
        var content = el('div', '', '');
        content.className = 'modal-content';
        root.appendChild(content);
        document.body.appendChild(root);
        if (w.ModalRegistry) {
            try { ModalRegistry.register('pass-page', { openSound: 'audio/sidebar-open.mp3', hideDelay: 360 }); } catch (e) {}
        }
    }

    function closePage() {
        if (w.ModalRegistry) ModalRegistry.close('pass-page');
        else { root.style.display = 'none'; root.classList.remove('show'); }
    }

    function appAction(icon, label, fn) {
        var b = el('button', '', '');
        b.className = 'app-page-action-btn';
        b.innerHTML = '<i class="fas ' + icon + '"></i> ' + label;
        b.onclick = fn;
        return b;
    }

    function coinTag(n) {
        var d = el('div', '', '');
        d.className = 'pass-coin';
        var i = el('img', '', ''); i.src = 'images/season/coin.webp';
        d.appendChild(i);
        d.appendChild(el('span', '', fmt(n)));
        return d;
    }

    function buildHeader() {
        var h = el('div', '', '');
        h.className = 'modal-header';
        var back = el('button', '', '');
        back.className = 'app-page-back-btn';
        back.innerHTML = '<i class="fas fa-arrow-left"></i> ' + t('back');
        back.onclick = view.t === 'main' ? closePage : function () { view = { t: 'main' }; render(); };
        h.appendChild(back);

        var title = el('div', '', '');
        title.className = 'modal-title';
        var icons = { main: 'fa-ticket', upgrade: 'fa-crown', shop: 'fa-store', rules: 'fa-circle-info' };
        var names = { main: t('pass'), upgrade: t('upgrade'), shop: t('season_shop'), rules: t('rules') };
        title.innerHTML = '<i class="fas ' + (icons[view.t] || 'fa-ticket') + '"></i> ' + (names[view.t] || t('pass'));
        h.appendChild(title);

        var actions = el('div', '', '');
        actions.className = 'app-page-actions';
        if (view.t === 'main') {
            actions.appendChild(appAction('fa-lock', t('season_shop'), function () { toast('赛季商店暂未开放'); }));
            actions.appendChild(appAction('fa-circle-info', t('rules'), function () { view = { t: 'rules' }; render(); }));
            actions.appendChild(coinTag(num(K.coins)));
        }
        h.appendChild(actions);
        return h;
    }

    function rewardCell(st, kind) {
        var item = kind === 'prem' ? st.prem : st.free;
        var reached = level() >= st.lv;
        var c = claims(), got = !!c[st.lv + ':' + kind];
        var locked = kind === 'prem' && !isPremium();
        var cell = el('div', '', '');
        cell.className = 'pass-cell';
        cell.style.animationDelay = Math.min(8, Math.round((st.lv - 10) / 10)) * 35 + 'ms';
        cell.style.borderColor = reached ? 'rgba(209,162,74,.45)' : 'var(--panel-border)';
        cell.appendChild(el('div', 'font-size:11px;color:var(--text-light);', 'Lv.' + st.lv));
        cell.appendChild(el('div', 'height:52px;border-radius:8px;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--text-light);', (item && item.type) || ''));
        cell.appendChild(el('div', 'font-size:12px;color:var(--text-color);', item ? item.name : ''));
        var clickable = reached && !got && !locked;
        var state = el('div', '', got ? t('claimed') : (locked ? t('locked') : (reached ? t('claim') : t('not_reached'))));
        state.className = 'pass-cell-state';
        state.style.color = clickable ? '#d1a24a' : 'var(--text-light)';
        cell.appendChild(state);
        if (clickable) cell.className += ' pass-cell-ready';
        cell.onclick = function () {
            if (got) return;
            if (locked) { toast(t('locked')); return; }
            if (!reached) { toast(t('not_reached') + ' Lv.' + st.lv); return; }
            grant(st, kind);
        };
        return cell;
    }

    function track() {
        var wrap = el('div', '', '');
        wrap.className = 'pass-track';
        ['free', 'prem'].forEach(function (kind) {
            var row = el('div', '', '');
            row.className = 'pass-row';
            row.appendChild(el('div', 'width:36px;font-size:12px;color:' + (kind === 'prem' ? '#d1a24a' : 'var(--text-light)') + ';writing-mode:vertical-rl;letter-spacing:2px;', kind === 'prem' ? t('premium') : t('normal')));
            STEPS.forEach(function (st) { row.appendChild(rewardCell(st, kind)); });
            wrap.appendChild(row);
        });
        return wrap;
    }

    function renderMain() {
        var lv = level(), xp = num(K.xp);
        var top = el('div', '', '');
        top.className = 'pass-pad';

        var line1 = el('div', 'display:flex;align-items:center;justify-content:space-between;');
        line1.appendChild(el('div', 'font-size:17px;font-weight:700;color:var(--title-color);letter-spacing:.5px;', S.id + '·' + S.name));
        line1.appendChild(coinTag(num(K.coins)));
        top.appendChild(line1);

        var barWrap = el('div', 'display:flex;align-items:center;gap:8px;margin-top:8px;');
        var bar = el('div', '', '');
        bar.className = 'pass-bar';
        var fill = el('div', '', '');
        fill.className = 'pass-bar-fill';
        fill.style.width = Math.round((xp % S.perLevel) / S.perLevel * 100) + '%';
        bar.appendChild(fill);
        barWrap.appendChild(bar);
        barWrap.appendChild(el('div', 'font-size:11px;color:var(--text-light);', lv + '/' + S.levels));
        top.appendChild(barWrap);

        var row2 = el('div', 'display:flex;align-items:center;justify-content:space-between;margin-top:6px;font-size:11px;color:var(--text-light);');
        row2.appendChild(el('div', '', t('weekly') + ' ' + fmt(num(K.weekXp)) + ' / ' + fmt(S.capLevels * S.perLevel)));
        row2.appendChild(el('div', '', num(K.weekXp) >= S.capLevels * S.perLevel ? t('cap') : ''));
        top.appendChild(row2);

        var actions = el('div', '', '');
        actions.className = 'pass-actions';
        var up = el('button', '', isPremium() ? t('premium_unlocked') : t('upgrade'));
        up.className = 'modal-btn primary';
        up.onclick = function () { view = { t: 'upgrade' }; render(); };
        actions.appendChild(up);
        top.appendChild(actions);

        bodyEl.appendChild(top);
        bodyEl.appendChild(track());
    }

    function renderUpgrade() {
        var wrap = el('div', 'display:flex;gap:8px;padding:0;align-items:stretch;height:100%;box-sizing:border-box;');
        var tiers = [
            ['普通版', '已解锁', 'var(--text-light)', ['每级 10 赛季币', '普通轨 10–80 级里程碑', '赛季进度永久累积', '不含典藏外观与商店']],
            ['典藏版', '150M', '#d1a24a', ['普通版全部内容', '典藏轨 10–80 级里程碑', '开放赛季商店', '80 级解锁恶魔契约购买权']],
            ['尊享版', '赞助兑换码', '#b9a7ff', ['典藏版全部内容', '名片·长夜终烬', '立即提升 10 级', '赛季限一次']]
        ];
        tiers.forEach(function (x, i) {
            var col = el('div', '', '');
            col.className = 'pass-tier';
            col.appendChild(el('div', 'font-size:14px;font-weight:700;color:var(--title-color);', x[0]));
            var ul = el('div', '', '');
            ul.className = 'pass-muted';
            ul.style.flex = '1';
            ul.style.display = 'flex';
            ul.style.flexDirection = 'column';
            ul.style.justifyContent = 'center';
            ul.innerHTML = x[3].map(function (s) { return '· ' + s; }).join('<br>');
            col.appendChild(ul);
            var foot = el('div', 'margin-top:auto;font-size:12px;color:' + x[2] + ';');
            if (i === 1) {
                var b = el('button', '', isPremium() ? '已解锁' : '150M 解锁');
                b.className = 'modal-btn primary full-width';
                b.disabled = isPremium();
                b.onclick = function () {
                    if (w.__spendTotalValue && w.__spendTotalValue(S.premiumCost)) {
                        set(K.premium, '1');
                        toast('典藏已解锁');
                        view = { t: 'main' };
                        render();
                    } else toast('累计价值不足 150M');
                };
                foot.appendChild(b);
            } else {
                foot.textContent = x[1];
            }
            col.appendChild(foot);
            wrap.appendChild(col);
        });
        bodyEl.appendChild(wrap);
    }

    function renderShop() {
        var wrap = el('div', '', '');
        wrap.className = 'pass-pad';
        if (!isPremium()) {
            wrap.appendChild(el('div', 'font-size:13px;color:var(--danger-color);', t('shop_locked')));
        } else {
            var item = el('div', 'display:flex;gap:10px;border:1px solid var(--panel-border);border-radius:12px;padding:10px;background:var(--panel-bg);');
            item.appendChild(el('div', 'width:96px;height:64px;border-radius:8px;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--text-light);', '商品图'));
            var info = el('div', 'flex:1;display:flex;flex-direction:column;gap:6px;');
            info.appendChild(el('div', 'font-size:13px;color:var(--text-color);', '占位商品'));
            info.appendChild(coinTag(999));
            var b = el('button', '', '购买');
            b.className = 'modal-btn';
            b.disabled = true;
            b.style.alignSelf = 'flex-start';
            info.appendChild(b);
            item.appendChild(info);
            wrap.appendChild(item);
        }
        bodyEl.appendChild(wrap);
    }

    function renderRules() {
        var wrap = el('div', '', '');
        wrap.className = 'pass-rules';
        function section(title, items) {
            var box = el('div', '', '');
            box.className = 'pass-rule-box';
            box.appendChild(el('div', 'font-size:14px;font-weight:700;color:var(--title-color);margin-bottom:6px;', title));
            var ul = el('div', '', '');
            ul.className = 'pass-muted';
            ul.style.fontSize = '12px';
            ul.style.lineHeight = '1.9';
            ul.innerHTML = items.map(function (s) { return '· ' + s; }).join('<br>');
            box.appendChild(ul);
            wrap.appendChild(box);
        }
        section('赛季进度', [
            '赛季持续 8 周，共 80 级；每级需要 5M 本周累计价值。',
            '本周累计价值按自然周统计，每周一 00:00 重置。',
            '每周最多提升 12 级，超出部分不计入本周进度。',
            '赛季进度永久累积，未领取的奖励不会过期。'
        ]);
        section('奖励领取', [
            '达到对应等级后，直接点击奖励卡片领取。',
            '每个等级的普通轨、典藏轨各只能领取一次。',
            '普通轨所有玩家可领取；典藏轨需要先解锁典藏通行证。',
            '每提升 1 级获得 10 赛季币，可在赛季商店使用。'
        ]);
        section('典藏与尊享', [
            '典藏通行证：消耗 150M 累计价值解锁，开放典藏轨与赛季商店。',
            '尊享通行证：通过赞助兑换码解锁，包含典藏全部内容。',
            '尊享额外内容：名片「长夜终烬」、立即提升 10 级，赛季限一次。',
            '80 级典藏奖励为「恶魔契约」购买权。'
        ]);
        section('赛季商店', [
            '赛季商店暂未开放，开放后可使用赛季币兑换道具。',
            '返厂商店暂未开放。'
        ]);
        bodyEl.appendChild(wrap);
    }

    function render() {
        ensurePage();
        var content = root.querySelector('.modal-content');
        content.innerHTML = '';
        content.appendChild(buildHeader());
        bodyEl = el('div', '', '');
        bodyEl.className = 'modal-body';
        content.appendChild(bodyEl);
        if (view.t === 'main') renderMain();
        else if (view.t === 'upgrade') renderUpgrade();
        else if (view.t === 'shop') renderShop();
        else renderRules();
    }

    function open() {
        ensurePage();
        view = { t: 'main' };
        render();
        if (w.ModalRegistry) ModalRegistry.open('pass-page');
        else {
            root.style.display = 'flex';
            setTimeout(function () { root.classList.add('show'); }, 10);
        }
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

    function renderDebug() {
        var body = document.getElementById('pass-debug-body');
        if (!body) return;
        body.innerHTML = '';
        var st = el('div', 'font-size:12px;color:var(--text-light);white-space:pre-line;line-height:1.6;', dbgState());
        body.appendChild(st);
        function add(txt, fn) {
            var b = el('button', '', txt);
            b.className = 'modal-btn full-width';
            b.onclick = function () { try { fn(); } catch (e) {} st.textContent = dbgState(); if (root) render(); };
            body.appendChild(b);
        }
        add('+10 级（+50M 经验）', function () { set(K.xp, Math.min(S.levels * S.perLevel, num(K.xp) + S.perLevel * 10)); });
        add('+1000 赛季币', function () { set(K.coins, num(K.coins) + 1000); });
        add('解锁典藏', function () { set(K.premium, '1'); });
        add('解锁尊享（典藏+10级+长夜终烬）', function () { set(K.premium, '1'); set(K.xp, Math.min(S.levels * S.perLevel, num(K.xp) + S.perLevel * 10)); try { localStorage.setItem('ab_pass_card_night', '1'); } catch (e) {} });
        add('解锁恶魔契约购买权', function () { try { localStorage.setItem('ab_pass_ability_devil', '1'); } catch (e) {} });
        add('重置赛季进度', function () { [K.xp, K.weekXp, K.week, K.start, K.premium, K.coins, K.claimedCoins, K.claims, K.lastW].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} }); });
    }

    function openDebug() {
        ensureStyle();
        var m = document.getElementById('pass-debug-modal');
        if (!m) {
            m = el('div', '', '');
            m.className = 'modal-overlay';
            m.id = 'pass-debug-modal';
            m.style.display = 'none';
            var content = el('div', '', '');
            content.className = 'modal-content';
            content.style.maxWidth = '420px';
            var header = el('div', '', '');
            header.className = 'modal-header';
            var title = el('div', '', '');
            title.className = 'modal-title';
            title.innerHTML = '<i class="fas fa-flask"></i> 通行证调试';
            var close = el('button', '', '');
            close.className = 'modal-close';
            close.innerHTML = '&times;';
            close.onclick = function () { closeDebug(); };
            header.appendChild(title);
            header.appendChild(close);
            var body = el('div', '', '');
            body.className = 'modal-body';
            body.id = 'pass-debug-body';
            content.appendChild(header);
            content.appendChild(body);
            m.appendChild(content);
            m.addEventListener('click', function (e) { if (e.target === m) closeDebug(); });
            document.body.appendChild(m);
            if (w.ModalRegistry) {
                try { ModalRegistry.register('pass-debug-modal', { openSound: 'audio/admin-open.mp3' }); } catch (e) {}
            }
        }
        renderDebug();
        if (w.ModalRegistry) ModalRegistry.open('pass-debug-modal', { zIndex: 10002 });
        else { m.style.display = 'flex'; m.style.zIndex = '10002'; setTimeout(function () { m.classList.add('show'); }, 10); }
    }

    function closeDebug() {
        if (w.ModalRegistry) ModalRegistry.close('pass-debug-modal');
        else {
            var m = document.getElementById('pass-debug-modal');
            if (m) { m.classList.remove('show'); setTimeout(function () { m.style.display = 'none'; }, 300); }
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
    w.PassSeason = { open: open, level: level, isPremium: isPremium, coins: function () { return num(K.coins); } };
})(window);
