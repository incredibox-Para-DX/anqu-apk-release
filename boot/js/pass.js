/* 通行证：8周/80级/5M一级/周上限12级/每级10赛季币 */
(function (w) {
    'use strict';
    var S = { id: 'S1', name: '启程', weeks: 8, levels: 80, perLevel: 5000000, capLevels: 12, coinPerLevel: 10, premiumCost: 150000000 };
    var SEASON_START = '2026-11-09';
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
        premium_unlocked: ['典藏已解锁', '典藏已解鎖', 'Premium unlocked', 'Премиум открыт'],
        premium_locked: ['典藏未解锁', '典藏未解鎖', 'Premium locked', 'Премиум закрыт'],
        rule_progress_title: ['赛季进度', '賽季進度', 'Season Progress', 'Прогресс сезона'],
        rule_progress_text: [
            '· 赛季持续 8 周，共 80 级；每级需要 5M 本周累计价值。<br>· 本周累计价值按自然周统计，每周一 00:00 重置。<br>· 每周最多提升 12 级，超出部分不计入本周进度。<br>· 赛季进度永久累积，未领取的奖励不会过期。',
            '· 賽季持續 8 週，共 80 級；每級需要 5M 本週累計價值。<br>· 本週累計價值按自然週統計，每週一 00:00 重置。<br>· 每週最多提升 12 級，超出部分不計入本週進度。<br>· 賽季進度永久累積，未領取的獎勵不會過期。',
            '· The season lasts 8 weeks with 80 levels; each level needs 5M weekly accumulated value.<br>· Weekly value is counted by calendar week and resets every Monday at 00:00.<br>· Up to 12 levels can be gained each week; excess does not count.<br>· Season progress is permanent; unclaimed rewards do not expire.',
            '· Сезон длится 8 недель, 80 уровней; каждый уровень требует 5M недельной накопленной стоимости.<br>· Недельная стоимость считается по календарной неделе и сбрасывается в понедельник в 00:00.<br>· За неделю можно получить не более 12 уровней; излишек не учитывается.<br>· Прогресс сезона сохраняется; неполученные награды не сгорают.'
        ],
        rule_claim_title: ['奖励领取', '獎勵領取', 'Rewards', 'Награды'],
        rule_claim_text: [
            '· 达到对应等级后，直接点击奖励卡片领取。<br>· 每个等级的普通轨、典藏轨各只能领取一次。<br>· 普通轨所有玩家可领取；典藏轨需要先解锁典藏通行证。<br>· 每提升 1 级获得 10 赛季币。',
            '· 達到對應等級後，直接點擊獎勵卡片領取。<br>· 每個等級的普通軌、典藏軌各只能領取一次。<br>· 普通軌所有玩家可領取；典藏軌需要先解鎖典藏通行證。<br>· 每提升 1 級獲得 10 賽季幣。',
            '· Reach the required level, then tap the reward card to claim it.<br>· Each level can be claimed once on the free track and once on the premium track.<br>· The free track is available to everyone; the premium track requires the Premium Pass.<br>· Each level grants 10 Season Coins.',
            '· Достигните нужного уровня и нажмите на карточку награды, чтобы получить её.<br>· На каждом уровне награду можно получить один раз в бесплатном и один раз в премиум-треке.<br>· Бесплатный трек доступен всем; премиум-трек требует Премиум-пропуск.<br>· За каждый уровень даётся 10 монет сезона.'
        ],
        rule_tier_title: ['典藏与尊享', '典藏與尊享', 'Premium & Supreme', 'Премиум и Люкс'],
        rule_tier_text: [
            '· 典藏通行证：消耗 150M 累计价值解锁，开放典藏轨。<br>· 尊享通行证：通过赞助兑换码解锁，包含典藏全部内容。<br>· 尊享额外内容：名片「长夜终烬」、立即提升 10 级，赛季限一次。<br>· 80 级典藏奖励为「恶魔契约」购买权。',
            '· 典藏通行證：消耗 150M 累計價值解鎖，開放典藏軌。<br>· 尊享通行證：透過贊助兌換碼解鎖，包含典藏全部內容。<br>· 尊享額外內容：名片「長夜終燼」、立即提升 10 級，賽季限一次。<br>· 80 級典藏獎勵為「惡魔契約」購買權。',
            '· Premium Pass: unlock with 150M accumulated value to open the premium track.<br>· Supreme Pass: unlock with a sponsor code; includes all Premium content.<br>· Supreme extras: "Endless Night" name card and +10 levels instantly, once per season.<br>· The level 80 premium reward is the "Demon Contract" purchase right.',
            '· Премиум-пропуск: открывается за 150M накопленной стоимости и даёт премиум-трек.<br>· Люкс-пропуск: открывается кодом спонсора и включает весь контент Премиум.<br>· Бонусы Люкс: визитка «Вечная ночь» и +10 уровней сразу, один раз за сезон.<br>· Премиум-награда 80 уровня — право покупки «Демонического контракта».'
        ],
        tier_free: ['普通版', '普通版', 'Free', 'Бесплатный'],
        tier_premium: ['典藏版', '典藏版', 'Premium', 'Премиум'],
        tier_supreme: ['尊享版', '尊享版', 'Supreme', 'Люкс'],
        tier_free_status: ['已解锁', '已解鎖', 'Unlocked', 'Открыто'],
        tier_premium_price: ['150M', '150M', '150M', '150M'],
        tier_supreme_price: ['赞助兑换码', '贊助兌換碼', 'Sponsor code', 'Код спонсора'],
        tier_free_desc: [
            '· 每级 10 赛季币<br>· 普通轨 10–80 级里程碑<br>· 赛季进度永久累积<br>· 不含典藏外观',
            '· 每級 10 賽季幣<br>· 普通軌 10–80 級里程碑<br>· 賽季進度永久累積<br>· 不含典藏外觀',
            '· 10 Season Coins per level<br>· Free track milestones 10–80<br>· Permanent season progress<br>· No premium cosmetics',
            '· 10 монет сезона за уровень<br>· Вехи бесплатного трека 10–80<br>· Постоянный прогресс сезона<br>· Без премиум-косметики'
        ],
        tier_premium_desc: [
            '· 普通版全部内容<br>· 典藏轨 10–80 级里程碑<br>· 典藏外观与奖励<br>· 80 级解锁恶魔契约购买权',
            '· 普通版全部內容<br>· 典藏軌 10–80 級里程碑<br>· 典藏外觀與獎勵<br>· 80 級解鎖惡魔契約購買權',
            '· Everything in Free<br>· Premium track milestones 10–80<br>· Premium cosmetics and rewards<br>· Level 80 unlocks the Demon Contract purchase right',
            '· Всё из Бесплатного<br>· Вехи премиум-трека 10–80<br>· Премиум-косметика и награды<br>· 80 уровень открывает право покупки Демонического контракта'
        ],
        tier_supreme_desc: [
            '· 典藏版全部内容<br>· 名片「长夜终烬」<br>· 立即提升 10 级<br>· 赛季限一次',
            '· 典藏版全部內容<br>· 名片「長夜終燼」<br>· 立即提升 10 級<br>· 賽季限一次',
            '· Everything in Premium<br>· "Endless Night" name card<br>· +10 levels instantly<br>· Once per season',
            '· Всё из Премиума<br>· Визитка «Вечная ночь»<br>· +10 уровней сразу<br>· Один раз за сезон'
        ],
        unlock_btn: ['150M 解锁', '150M 解鎖', 'Unlock for 150M', 'Открыть за 150M'],
        not_enough_value: ['累计价值不足 150M', '累計價值不足 150M', 'Not enough accumulated value (150M)', 'Недостаточно накопленной стоимости (150M)'],
        shop_locked_toast: ['赛季商店暂未开放', '賽季商店暫未開放', 'Season Shop is not open yet', 'Магазин сезона пока закрыт'],
        claimed_toast: ['已领取：%s', '已領取：%s', 'Claimed: %s', 'Получено: %s'],
        need_level: ['未达到 Lv.%s', '未達到 Lv.%s', 'Level %s not reached', 'Уровень %s не достигнут'],
        preview_rewards: ['预览奖励', '預覽獎勵', 'Preview Rewards', 'Просмотр наград'],
        pass_season_name: ['启程', '啟程', 'Departure', 'Начало'],
        pass_week_of: ['第 %s 周 / 共 %s 周', '第 %s 週 / 共 %s 週', 'Week %s of %s', 'Неделя %s из %s'],
        pass_season_starts_in: ['赛季将于 %s 天后开始', '賽季將於 %s 天後開始', 'Season starts in %s days', 'Сезон начнётся через %s дн.'],
        pass_reward: ['通行证奖励', '通行證獎勵', 'Pass reward', 'Награда пропуска'],
        pass_unlock: ['通行证解锁', '通行證解鎖', 'Pass unlock', 'Открыть пропуском'],
        pass_need_packs: ['请先在「资源下载」下载背景和名片资源包', '請先在「資源下載」下載背景和名片資源包', 'Download the background and card packs in Downloads first', 'Сначала скачайте наборы фонов и визиток в «Загрузках»'],
        pass_season_left: ['剩余 %s 天', '剩餘 %s 天', '%s days left', 'Осталось дней: %s'],
        pass_season_ended: ['赛季已结束', '賽季已結束', 'Season ended', 'Сезон завершён'],
        pass_bg_pulse: ['脉冲极客', '脈衝極客', 'Pulse Geek', 'Пульс-гик'],
        pass_bg_jiuke: ['九课特工', '九課特工', 'Section 9 Agent', 'Агент Девятого отдела'],
        pass_bg_laizhan: ['NOC S06', 'NOC S06', 'NOC S06', 'NOC S06'],
        pass_bg_jixi: ['急袭·近身战', '急襲·近身戰', 'Raid · Close Combat', 'Рейд · Ближний бой'],
        pass_bg_jinshen: ['危情响应', '危情響應', 'Crisis Response', 'Кризисный отклик'],
        pass_card_wolf: ['白狼连队', '白狼連隊', 'White Wolf Squad', 'Отряд «Белый волк»'],
        pass_card_bhj: ['黑金国际', '黑金國際', 'Black Gold International', '«Чёрное золото» Интернэшнл'],
        pass_card_gjzb: ['国际装备', '國際裝備', 'International Gear', 'Международное снаряжение'],
        pass_card_qxys: ['前线要塞', '前線要塞', 'Frontline Fortress', 'Фронтовая крепость'],
        pass_card_yinghe: ['硬核行旅', '硬核行旅', 'Hardcore Journey', 'Хардкорное путешествие'],
        pass_card_zsxf: ['战术先锋', '戰術先鋒', 'Tactical Vanguard', 'Тактический авангард'],
        pass_type_name: ['名称色', '名稱色', 'Name Color', 'Цвет ника'],
        pass_type_bg: ['背景', '背景', 'Background', 'Фон'],
        pass_type_card: ['名片', '名片', 'Name Card', 'Визитка'],
        pass_type_pass: ['购买权', '購買權', 'Purchase Right', 'Право покупки']
    };
    if (window.I18N && I18N.addEntries) I18N.addEntries(I18N_KEYS);
    function t(k) { try { return (window.I18N && I18N.t) ? I18N.t(k) : k; } catch (e) { return k; } }
    function set(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }
    function monday() { var x = new Date(); var d = (x.getDay() + 6) % 7; x.setDate(x.getDate() - d); x.setHours(0, 0, 0, 0); return x.toISOString().slice(0, 10); }
    function level() { return Math.min(S.levels, Math.floor(num(K.xp) / S.perLevel)); }
    function isPremium() { return str(K.premium) === '1'; }
    function fmt(n) { return Math.floor(n).toLocaleString('en-US'); }

    function tick() {
        var cur = 0;
        try { cur = Number(w.__getWeeklyAccumulatedValue && w.__getWeeklyAccumulatedValue()) || 0; } catch (e) {}

        // 本赛季固定从 2026-11-09 开始，开始前的本周累计不计入
        var startTs = new Date(SEASON_START + 'T00:00:00').getTime();
        if (str(K.start) !== SEASON_START) {
            set(K.start, SEASON_START);
            set(K.xp, 0);
            set(K.weekXp, 0);
            set(K.coins, 0);
            set(K.claimedCoins, 0);
            set(K.claims, '{}');
            set(K.lastW, cur);
            return;
        }
        if (Date.now() < startTs) {
            // 赛季未开始：本周累计不计入
            return;
        }

        var wk = monday();
        var rawLast = null;
        try { rawLast = localStorage.getItem(K.lastW); } catch (e) {}

        // 新周/首次启用：把当前本周累计作为基线，只计算之后的增量，
        // 不把已经存在的本周累计一次性算进通行证等级。
        if (str(K.week) !== wk) {
            set(K.week, wk);
            set(K.weekXp, 0);
            set(K.lastW, cur);
            rawLast = String(cur);
        } else if (rawLast === null) {
            set(K.lastW, cur);
            rawLast = String(cur);
        }

        var last = Number(rawLast) || 0;
        if (cur > last) {
            var cap = S.capLevels * S.perLevel;
            var wx = Math.min(cap, num(K.weekXp) + (cur - last));
            var add = wx - num(K.weekXp);
            if (add > 0) { set(K.weekXp, wx); set(K.xp, Math.min(S.levels * S.perLevel, num(K.xp) + add)); }
            set(K.lastW, cur);
        } else if (cur < last) {
            // 累计价值回落（清空/换周边缘）：重置基线，避免后续回升不计入
            set(K.lastW, cur);
        }

        var total = level() * S.coinPerLevel, claimed = num(K.claimedCoins);
        if (total > claimed) { set(K.coins, num(K.coins) + (total - claimed)); set(K.claimedCoins, total); }
        updatePassDot();
    }
    setInterval(tick, 5000);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(tick, 1200); });
    else setTimeout(tick, 1200);

    var STEPS = [
        { lv: 10, free: { key: 'cyberorange', name: '赛博橙', nameKey: 'nick_style_cyberorange', type: '名称色', typeKey: 'pass_type_name' }, prem: { key: 'cyberblue', name: '赛博蓝', nameKey: 'nick_style_cyberblue', type: '名称色', typeKey: 'pass_type_name' } },
        { lv: 20, free: { key: 'vpurple', name: '紫罗兰', nameKey: 'nick_style_vpurple', type: '名称色', typeKey: 'pass_type_name' }, prem: { key: 'vaurora', name: '极光', nameKey: 'nick_style_vaurora', type: '名称色', typeKey: 'pass_type_name' } },
        { lv: 30, free: { key: 'bg_pulse', name: '脉冲极客', nameKey: 'pass_bg_pulse', type: '背景', typeKey: 'pass_type_bg' }, prem: { key: 'bg_jiuke', name: '九课特工', nameKey: 'pass_bg_jiuke', type: '背景', typeKey: 'pass_type_bg' } },
        { lv: 40, free: { key: 'card_wolf', name: '白狼连队', nameKey: 'pass_card_wolf', type: '名片', typeKey: 'pass_type_card' }, prem: { key: 'card_bhj', name: '黑金国际', nameKey: 'pass_card_bhj', type: '名片', typeKey: 'pass_type_card' } },
        { lv: 50, free: { key: 'bg_laizhan', name: 'NOC S06', nameKey: 'pass_bg_laizhan', type: '背景', typeKey: 'pass_type_bg' }, prem: { key: 'bg_jixi', name: '急袭·近身战', nameKey: 'pass_bg_jixi', type: '背景', typeKey: 'pass_type_bg' } },
        { lv: 60, free: { key: 'card_gjzb', name: '国际装备', nameKey: 'pass_card_gjzb', type: '名片', typeKey: 'pass_type_card' }, prem: { key: 'card_qxys', name: '前线要塞', nameKey: 'pass_card_qxys', type: '名片', typeKey: 'pass_type_card' } },
        { lv: 70, free: { key: 'card_yinghe', name: '硬核行旅', nameKey: 'pass_card_yinghe', type: '名片', typeKey: 'pass_type_card' }, prem: { key: 'card_zsxf', name: '战术先锋', nameKey: 'pass_card_zsxf', type: '名片', typeKey: 'pass_type_card' } },
        { lv: 80, free: { key: 'bg_jinshen', name: '危情响应', nameKey: 'pass_bg_jinshen', type: '背景', typeKey: 'pass_type_bg' }, prem: { key: 'ability_devil', name: '恶魔契约', nameKey: 'skill_devil_name', type: '购买权', typeKey: 'pass_type_pass' } }
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
        passToast(t('claimed_toast').replace('%s', item.name));
        render();
        updatePassDot();
    }
    function toast(m) { try { if (w.showToast) w.showToast(m); } catch (e) {} }

    function playPassSfx(file) {
        if (!file) return;
        try {
            var a = new Audio(file);
            a.volume = 0.7 * ((w.__TOAST_VOLUME__ != null) ? w.__TOAST_VOLUME__ : 1);
            a.play().catch(function () {});
        } catch (e) {}
    }

    // 直接接管 toast 元素，不调用全局 showToast，避免旧页面继续播默认 toast 音效
    function showPassToast(msg, showSfx, hideSfx) {
        playPassSfx(showSfx);
        var el = document.getElementById('toast-message');
        if (!el) { toast(msg); return; }
        try {
            var txt = (w.I18N && I18N.trFull) ? I18N.trFull(msg) : msg;
            if (w.streamText) { try { w.streamText(el, txt); } catch (e) { el.textContent = txt; } }
            else { el.textContent = txt; }
            el.classList.add('show');
            clearTimeout(el._hideTimer);
            el._hideTimer = setTimeout(function () {
                playPassSfx(hideSfx);
                el.classList.remove('show');
            }, 5000);
        } catch (e) { toast(msg); }
    }

    function passToast(msg) {
        showPassToast(msg, 'audio/pass-toast-show.mp3', 'audio/pass-toast-hide.mp3');
    }

    // UI：统一走通用的全屏页面结构（modal-overlay app-full-page + modal-header/body），
    // 打开/关闭交给 ModalRegistry，复用通用过渡与音效。
    var root = null, bodyEl = null, view = { t: 'main' }, lastView = 'main';

    function el(tag, css, text) { var d = document.createElement(tag); if (css) d.style.cssText = css; if (text != null) d.textContent = text; return d; }

    function ensureStyle() {
        if (document.getElementById('pass-style')) return;
        var s = document.createElement('style');
        s.id = 'pass-style';
        s.textContent =
            '#pass-page .pass-pad{padding:0;}' +
            '#pass-page .pass-track{overflow-x:auto;padding:4px 0 0;}' +
            '#pass-page .pass-row{display:flex;align-items:center;gap:8px;margin-bottom:10px;}' +
            '#pass-page .pass-cell{min-width:176px;width:176px;height:84px;border-radius:10px;border:1px solid var(--panel-border);background:var(--panel-inner-bg);padding:8px 10px;display:flex;flex-direction:row;align-items:center;gap:8px;opacity:.55;transition:border-color .2s ease,opacity .2s ease,transform .12s ease,box-shadow .2s ease;}' +
            '#pass-page .pass-cell:active{transform:scale(.97);}' +
            '#pass-page .pass-cell-ready{opacity:1;border-color:rgba(209,162,74,.65);background:linear-gradient(135deg,rgba(209,162,74,.2),rgba(209,162,74,.05));box-shadow:0 0 10px rgba(209,162,74,.16);cursor:pointer;}' +
            '#pass-page .pass-cell-got{opacity:.3;filter:grayscale(.6);}' +
            '#pass-page .pass-rules{display:flex;flex-direction:column;gap:10px;}' +
            '#pass-page .pass-rule-box{border:1px solid var(--panel-border);border-radius:12px;padding:12px;background:var(--panel-bg);}' +
            '#pass-page .pass-bar{flex:1;height:8px;background:rgba(255,255,255,.12);border-radius:4px;overflow:hidden;}' +
            '#pass-page .pass-bar-fill{height:100%;background:var(--accent-color);transition:width .6s cubic-bezier(.22,.61,.36,1);}' +
            '#pass-page .pass-coin{display:flex;align-items:center;gap:4px;font-size:13px;color:var(--text-color);}' +
            '#pass-page .pass-coin img{width:18px;height:18px;}' +
            '#pass-page .pass-tier{flex:1;border:1px solid var(--panel-border);border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:10px;background:var(--panel-bg);}' +
            '#pass-page .pass-muted{font-size:11px;color:var(--text-light);line-height:1.7;}' +
            '#pass-page .pass-thumb{width:56px;height:56px;border-radius:8px;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;flex:0 0 auto;overflow:hidden;background-size:cover;background-position:center;}' +
            '#pass-page .pass-preview{display:grid;grid-template-columns:repeat(auto-fill,minmax(156px,1fr));gap:8px;}' +
            '#pass-page .pass-preview-card{display:flex;align-items:center;gap:8px;border:1px solid var(--panel-border);border-radius:10px;padding:8px;background:var(--panel-bg);}' +
            '#sidebar-pass-btn .pass-dot{position:absolute;top:6px;right:8px;width:8px;height:8px;border-radius:50%;background:#ef4444;box-shadow:0 0 0 2px rgba(0,0,0,.35);display:none;}' +
            '@keyframes passViewIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}' +
            '#pass-page .pass-view-in{animation:passViewIn .24s ease both;}' +            '#pass-debug-modal .modal-body .modal-btn{margin-top:8px;}';
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

        if (view.t !== 'main') {
            var title = el('div', '', '');
            title.className = 'modal-title';
            var icons = { upgrade: 'fa-crown', shop: 'fa-store', rules: 'fa-circle-info', preview: 'fa-gift' };
            var names = { upgrade: t('upgrade'), shop: t('season_shop'), rules: t('rules'), preview: t('preview_rewards') };
            title.innerHTML = '<i class="fas ' + (icons[view.t] || 'fa-ticket') + '"></i> ' + (names[view.t] || t('pass'));
            h.appendChild(title);
        }

        var actions = el('div', '', '');
        actions.className = 'app-page-actions';
        if (view.t === 'main') {
            actions.appendChild(appAction('fa-gift', t('preview_rewards'), function () { view = { t: 'preview' }; render(); }));
            actions.appendChild(appAction('fa-lock', t('season_shop'), function () { toast(t('shop_locked_toast')); }));
            actions.appendChild(appAction('fa-circle-info', t('rules'), function () { view = { t: 'rules' }; render(); }));
            actions.appendChild(coinTag(num(K.coins)));
        }
        h.appendChild(actions);
        return h;
    }

    function seasonInfo() {
        var startTs = new Date(SEASON_START + 'T00:00:00').getTime();
        var now = Date.now();
        if (now < startTs) {
            return { pending: true, week: 0, leftDays: Math.max(0, Math.ceil((startTs - now) / 86400000)), ended: false };
        }
        var week = Math.floor((now - startTs) / (7 * 86400000)) + 1;
        week = Math.max(1, Math.min(S.weeks, week));
        var endTs = startTs + S.weeks * 7 * 86400000;
        var leftMs = endTs - now;
        return { pending: false, week: week, leftDays: Math.max(0, Math.ceil(leftMs / 86400000)), ended: leftMs <= 0 };
    }

    function itemName(item) {
        return (item && item.nameKey) ? t(item.nameKey) : (item ? item.name : '');
    }

    function thumbEl(item, size) {
        var box = el('div', '', '');
        box.className = 'pass-thumb';
        if (size) { box.style.width = size + 'px'; box.style.height = size + 'px'; }
        if (!item) return box;
        if (item.typeKey === 'pass_type_name') {
            var demo = el('span', 'font-size:18px;font-weight:700;', 'Aa');
            demo.className = 'name-' + item.key;
            box.appendChild(demo);
        } else if (item.typeKey === 'pass_type_bg' || item.typeKey === 'pass_type_card') {
            var isBg = item.typeKey === 'pass_type_bg';
            box.innerHTML = '<i class="fas ' + (isBg ? 'fa-image' : 'fa-id-card') + '" style="color:' + (isBg ? '#60a5fa' : '#a78bfa') + ';font-size:20px;"></i>';
            try {
                var R = window.ResourceDownloadManager;
                var path = rewardResPath(item);
                var applyThumb = function (u) {
                    if (u) { box.style.backgroundImage = 'url("' + u + '")'; box.innerHTML = ''; }
                };
                if (R && R.resolvePath) {
                    R.resolvePath(path).then(function (u) {
                        if (u) { applyThumb(u); return; }
                        applyThumb(rewardRemoteUrl(item));
                    }).catch(function () { applyThumb(rewardRemoteUrl(item)); });
                } else {
                    applyThumb(rewardRemoteUrl(item));
                }
            } catch (e) {}
        } else if (item.typeKey === 'pass_type_pass') {
            if (item.key === 'ability_devil') {
                var ic = el('img', 'width:100%;height:100%;object-fit:cover;');
                ic.src = 'pictures/skills/devil_contract.webp';
                box.appendChild(ic);
            } else {
                box.innerHTML = '<i class="fas fa-crown" style="color:#fbbf24;font-size:20px;"></i>';
            }
        }
        return box;
    }

    function rewardCell(st, kind) {
        var item = kind === 'prem' ? st.prem : st.free;
        var reached = level() >= st.lv;
        var c = claims(), got = !!c[st.lv + ':' + kind];
        var locked = kind === 'prem' && !isPremium();
        var clickable = reached && !got && !locked;
        var cell = el('div', '', '');
        cell.className = 'pass-cell' + (got ? ' pass-cell-got' : (clickable ? ' pass-cell-ready' : ''));
        cell.style.animationDelay = Math.min(8, Math.round((st.lv - 10) / 10)) * 35 + 'ms';
        cell.appendChild(thumbEl(item, 56));
        var info = el('div', 'min-width:0;display:flex;flex-direction:column;gap:2px;');
        info.appendChild(el('div', 'font-size:11px;color:var(--text-light);', 'Lv.' + st.lv));
        info.appendChild(el('div', 'font-size:12px;color:var(--text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;', itemName(item)));
        cell.appendChild(info);
        cell.onclick = function () {
            if (got) return;
            if (locked) { toast(t('locked')); return; }
            if (!reached) { toast(t('need_level').replace('%s', st.lv)); return; }
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
        line1.appendChild(el('div', 'font-size:17px;font-weight:700;color:var(--title-color);letter-spacing:.5px;', S.id + '·' + t('pass_season_name')));
        line1.appendChild(coinTag(num(K.coins)));
        top.appendChild(line1);

        var si = seasonInfo();
        var metaText = si.pending
            ? t('pass_season_starts_in').replace('%s', si.leftDays)
            : (si.ended
                ? t('pass_season_ended')
                : t('pass_week_of').replace('%s', si.week).replace('%s', S.weeks) + ' · ' + t('pass_season_left').replace('%s', si.leftDays));
        top.appendChild(el('div', 'font-size:11px;color:var(--text-light);margin-top:4px;', metaText));

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
        row2.appendChild(el('div', '', t('weekly') + ' ' + fmt(num(K.weekXp)) + ' / ' + fmt(S.capLevels * S.perLevel) + (num(K.weekXp) >= S.capLevels * S.perLevel ? ' · ' + t('cap') : '')));
        var tier = el('button', 'border:1px solid ' + (isPremium() ? 'var(--panel-border)' : 'rgba(209,162,74,.65)') + ';background:' + (isPremium() ? 'rgba(255,255,255,.05)' : 'rgba(209,162,74,.16)') + ';color:' + (isPremium() ? 'var(--text-light)' : '#f1d38b') + ';font-size:11px;padding:4px 10px;border-radius:999px;display:inline-flex;align-items:center;gap:4px;', '');
        tier.innerHTML = '<i class="fas fa-crown"></i> ' + (isPremium() ? t('premium_unlocked') : t('upgrade'));
        tier.onclick = function () { view = { t: 'upgrade' }; render(); };
        row2.appendChild(tier);
        top.appendChild(row2);

        bodyEl.appendChild(top);
        bodyEl.appendChild(track());
    }

    function renderUpgrade() {
        var wrap = el('div', 'display:flex;gap:8px;padding:0;align-items:stretch;height:100%;box-sizing:border-box;');
        var tiers = [
            { name: t('tier_free'), price: t('tier_free_status'), color: 'var(--text-light)', desc: t('tier_free_desc') },
            { name: t('tier_premium'), price: t('tier_premium_price'), color: '#d1a24a', desc: t('tier_premium_desc'), unlock: true },
            { name: t('tier_supreme'), price: t('tier_supreme_price'), color: '#b9a7ff', desc: t('tier_supreme_desc') }
        ];
        tiers.forEach(function (x) {
            var col = el('div', '', '');
            col.className = 'pass-tier';
            col.appendChild(el('div', 'font-size:14px;font-weight:700;color:var(--title-color);', x.name));
            var ul = el('div', '', '');
            ul.className = 'pass-muted';
            ul.style.flex = '1';
            ul.style.display = 'flex';
            ul.style.flexDirection = 'column';
            ul.style.justifyContent = 'center';
            ul.innerHTML = x.desc;
            col.appendChild(ul);
            var foot = el('div', 'margin-top:auto;font-size:12px;color:' + x.color + ';');
            if (x.unlock) {
                var b = el('button', '', isPremium() ? t('premium_unlocked') : t('unlock_btn'));
                b.className = 'modal-btn primary full-width';
                b.disabled = isPremium();
                b.onclick = function () {
                    if (w.__spendTotalValue && w.__spendTotalValue(S.premiumCost)) {
                        set(K.premium, '1');
                        showPassToast(t('premium_unlocked'), 'audio/buy.mp3', 'audio/toastend.mp3');
                        view = { t: 'main' };
                        render();
                    } else toast(t('not_enough_value'));
                };
                foot.appendChild(b);
            } else {
                foot.textContent = x.price;
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

    function rewardResPath(item) {
        if (!item) return '';
        if (item.typeKey === 'pass_type_bg') return 'backgrounds/' + item.key + '.png';
        if (item.typeKey === 'pass_type_card') return 'cards/' + item.key + '.png';
        return '';
    }

    function rewardRemoteUrl(item) {
        if (!item) return '';
        if (item.typeKey === 'pass_type_bg') return 'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-bg-resources@main/backgrounds/' + item.key + '.png';
        if (item.typeKey === 'pass_type_card') return 'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-collect-resources@main/cards/' + item.key + '.png';
        return '';
    }

    function showMediaPreview(url, title, isVideo) {
        var ov = el('div', 'position:fixed;inset:0;z-index:100050;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;padding:20px;', '');
        var media;
        if (isVideo) {
            media = el('video', 'max-width:100%;max-height:90%;border-radius:12px;');
            media.src = url; media.autoplay = true; media.loop = true; media.muted = true;
            media.setAttribute('playsinline', ''); media.setAttribute('webkit-playsinline', '');
        } else {
            media = el('img', 'max-width:100%;max-height:90%;border-radius:12px;object-fit:contain;');
            media.src = url;
        }
        ov.appendChild(media);
        ov.appendChild(el('div', 'position:absolute;bottom:24px;left:50%;transform:translateX(-50%);font-size:12px;color:#e2e8f0;background:rgba(0,0,0,.5);padding:6px 14px;border-radius:999px;', title || ''));
        ov.onclick = function () { try { if (isVideo) media.pause(); } catch (e) {} ov.remove(); };
        document.body.appendChild(ov);
    }

    function previewReward(item) {
        var path = rewardResPath(item);
        if (!path) return;
        var label = itemName(item);
        var isVideo = /\.mp4($|\?)/i.test(path);
        var R = window.ResourceDownloadManager;
        function fallback() {
            var remote = rewardRemoteUrl(item);
            if (remote) showMediaPreview(remote, label, isVideo);
            else toast(item.typeKey === 'pass_type_bg' ? t('hu_bg_preview_unavailable') : t('hu_card_preview_unavailable'));
        }
        if (R && R.resolvePath) {
            R.resolvePath(path).then(function (u) {
                if (u) showMediaPreview(u, label, isVideo); else fallback();
            }).catch(fallback);
        } else fallback();
    }

    function renderPreview() {
        var wrap = el('div', '', '');
        wrap.className = 'pass-preview';
        STEPS.forEach(function (st) {
            [['free', t('normal')], ['prem', t('premium')]].forEach(function (pair) {
                var item = pair[0] === 'prem' ? st.prem : st.free;
                var card = el('div', '', '');
                card.className = 'pass-preview-card';
                card.appendChild(thumbEl(item, 48));
                var info = el('div', 'min-width:0;display:flex;flex-direction:column;gap:2px;');
                info.appendChild(el('div', 'font-size:11px;color:var(--text-light);', 'Lv.' + st.lv + ' · ' + pair[1]));
                info.appendChild(el('div', 'font-size:12px;color:var(--text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;', itemName(item)));
                card.appendChild(info);
                if (item.typeKey === 'pass_type_bg' || item.typeKey === 'pass_type_card') {
                    card.style.cursor = 'pointer';
                    card.onclick = function () { previewReward(item); };
                }
                wrap.appendChild(card);
            });
        });
        bodyEl.appendChild(wrap);
    }

    function renderRules() {
        var wrap = el('div', '', '');
        wrap.className = 'pass-rules';
        function section(title, html) {
            var box = el('div', '', '');
            box.className = 'pass-rule-box';
            box.appendChild(el('div', 'font-size:14px;font-weight:700;color:var(--title-color);margin-bottom:6px;', title));
            var ul = el('div', '', '');
            ul.className = 'pass-muted';
            ul.style.fontSize = '12px';
            ul.style.lineHeight = '1.9';
            ul.innerHTML = html;
            box.appendChild(ul);
            wrap.appendChild(box);
        }
        section(t('rule_progress_title'), t('rule_progress_text'));
        section(t('rule_claim_title'), t('rule_claim_text'));
        section(t('rule_tier_title'), t('rule_tier_text'));
        bodyEl.appendChild(wrap);
    }

    function render() {
        ensurePage();
        var content = root.querySelector('.modal-content');
        var oldTrack = content.querySelector('.pass-track');
        var keepScroll = (view.t === 'main' && lastView === 'main' && oldTrack) ? oldTrack.scrollLeft : 0;
        content.innerHTML = '';
        content.appendChild(buildHeader());
        bodyEl = el('div', '', '');
        bodyEl.className = 'modal-body';
        // 只有规则页允许上下滑动；主页面保留奖励轨横向滑动
        var scrollable = view.t === 'rules';
        bodyEl.style.overflowY = scrollable ? 'auto' : 'hidden';
        bodyEl.style.overflowX = 'hidden';
        bodyEl.style.touchAction = scrollable ? 'pan-y' : (view.t === 'main' ? 'pan-x' : 'none');
        if (view.t !== lastView) {
            bodyEl.className += ' pass-view-in';
            lastView = view.t;
        }
        content.appendChild(bodyEl);
        if (view.t === 'main') renderMain();
        else if (view.t === 'upgrade') renderUpgrade();
        else if (view.t === 'shop') renderShop();
        else if (view.t === 'preview') renderPreview();
        else renderRules();
        if (keepScroll) {
            var newTrack = bodyEl.querySelector('.pass-track');
            if (newTrack) newTrack.scrollLeft = keepScroll;
        }
    }

    function open() {
        var R = w.ResourceDownloadManager;
        var bgOk = !!(R && R.isBackgroundsDownloaded && R.isBackgroundsDownloaded());
        var cardOk = !!(w.CardPack && w.CardPack.isDone && w.CardPack.isDone());
        if (!bgOk || !cardOk) {
            toast(t('pass_need_packs'));
            try { if (R && R.openModal) R.openModal(); } catch (e) {}
            return;
        }
        ensurePage();
        view = { t: 'main' };
        lastView = 'main';
        render();
        if (w.ModalRegistry) ModalRegistry.open('pass-page');
        else {
            root.style.display = 'flex';
            setTimeout(function () { root.classList.add('show'); }, 10);
        }
    }

    function hasClaimable() {
        var lv = level(), c = claims(), prem = isPremium();
        for (var i = 0; i < STEPS.length; i++) {
            var st = STEPS[i];
            if (lv < st.lv) continue;
            if (!c[st.lv + ':free']) return true;
            if (prem && !c[st.lv + ':prem']) return true;
        }
        return false;
    }

    function updatePassDot() {
        var btn = document.getElementById('sidebar-pass-btn');
        if (!btn) return;
        var dot = btn.querySelector('.pass-dot');
        if (dot) dot.style.display = hasClaimable() ? 'block' : 'none';
    }

    function bind() {
        var sec = document.getElementById('section-other');
        if (sec && !document.getElementById('sidebar-pass-btn')) {
            var b = el('button', '', '');
            b.className = 'sidebar-btn full-width';
            b.id = 'sidebar-pass-btn';
            b.style.marginTop = '6px';
            b.style.position = 'relative';
            b.innerHTML = '<i class="fas fa-ticket"></i> 通行证<span class="pass-dot"></span>';
            b.onclick = open;
            sec.insertBefore(b, sec.firstChild);
            updatePassDot();
        }
        function syncGmBtn() {
            var gm = document.getElementById('section-gm') || document.getElementById('gm-debug-section');
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
        setInterval(syncGmBtn, 10000);
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
        add('清除获得的奖励', function () {
            try { localStorage.removeItem(K.claims); } catch (e) {}
            ['cyberorange', 'cyberblue', 'vpurple', 'vaurora', 'bg_pulse', 'bg_jiuke', 'bg_laizhan', 'bg_jixi', 'bg_jinshen', 'card_wolf', 'card_bhj', 'card_gjzb', 'card_qxys', 'card_yinghe', 'card_zsxf', 'ability_devil', 'card_night'].forEach(function (k) {
                try { localStorage.removeItem('ab_pass_' + k); } catch (e) {}
            });
            toast('已清除通行证奖励');
        });
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
