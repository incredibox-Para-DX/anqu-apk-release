(function () {
    var CARDS = [
        { id: 'card_000', img: 'cards/card_000.png', nameKey: 'card_000_default', local: true },
        { id: 'card_030', img: 'cards/card_030.png', code: 'CARD030' },
        { id: 'card_052', img: 'cards/card_052.png', code: 'CARD052' },
        { id: 'card_047', img: 'cards/card_047.png', code: 'CARD047' },
        { id: 'card_017', img: 'cards/card_017.png', code: 'CARD017' },
        { id: 'card_wolf', img: 'cards/card_wolf.png', nameKey: 'pass_card_wolf', passOnly: true },
        { id: 'card_bhj', img: 'cards/card_bhj.png', nameKey: 'pass_card_bhj', passOnly: true },
        { id: 'card_gjzb', img: 'cards/card_gjzb.png', nameKey: 'pass_card_gjzb', passOnly: true },
        { id: 'card_qxys', img: 'cards/card_qxys.png', nameKey: 'pass_card_qxys', passOnly: true },
        { id: 'card_yinghe', img: 'cards/card_yinghe.png', nameKey: 'pass_card_yinghe', passOnly: true },
        { id: 'card_zsxf', img: 'cards/card_zsxf.png', nameKey: 'pass_card_zsxf', passOnly: true },
        { id: 'card_night', img: 'cards/card_night.png', nameKey: 'card_night_name', passOnly: true },
        { id: 'card_gm', img: 'cards/card_gm.png', nameKey: 'card_gm_name', gmOnly: true }
    ];
    var UNLOCK_KEY = 'ab_cards_unlocked';
    var SEL_KEY = 'ab_card_selected';

    if (window.I18N && I18N.addEntries) {
        I18N.addEntries({
            card_label: ['名片', '名片', 'Card', 'Карточка'],
            card_title: ['名片', '名片', 'Profile Card', 'Визитка'],
            card_000_default: ['默认名片', '預設名片', 'Default Card', 'Визитка по умолчанию'],
            card_night_name: ['长夜终烬', '長夜終燼', 'Endless Night', 'Вечная ночь'],
            card_gm_name: ['巡查员', '巡查員', 'Inspector', 'Инспектор'],
            card_locked: ['未解锁', '未解鎖', 'Locked', 'Закрыто'],
            card_equip: ['装备', '裝備', 'Equip', 'Надеть'],
            card_equipped: ['使用中', '使用中', 'In use', 'Используется'],
            card_unlock_hint: ['使用兑换码解锁', '使用兌換碼解鎖', 'Unlock with a redeem code', 'Откройте кодом'],
            card_pass_hint: ['需在通行证达到对应等级并领取', '需在通行證達到對應等級並領取', 'Claim it at the corresponding Pass level', 'Получите на соответствующем уровне пропуска'],
            card_none: ['未装备', '未裝備', 'None', 'Нет'],
            card_need_download: ['请先到「资源下载」下载名片资源包', '請先到「資源下載」下載名片資源包', 'Download the card pack in Downloads first', 'Сначала скачайте набор визиток в «Загрузках»'],
            card_reset: ['恢复初始名片', '恢復初始名片', 'Reset card', 'Сбросить визитку'],
            nick_style: ['昵称样式', '暱稱樣式', 'Name style', 'Стиль ника'],
            nick_style_normal: ['普通白', '普通白', 'Normal White', 'Обычный белый'],
            nick_style_gold: ['尊贵金', '尊貴金', 'Royal Gold', 'Благородное золото'],
            nick_style_red: ['质感红', '質感紅', 'Textured Red', 'Фактурный красный'],
            nick_style_blue: ['蓝宝石', '藍寶石', 'Sapphire', 'Сапфир'],
            nick_style_violet: ['紫罗兰·赞赏', '紫羅蘭·贊賞', 'Violet · Supporter', 'Фиолетовый · Спонсор'],
            nick_style_aurora: ['极光·赞赏', '極光·贊賞', 'Aurora · Supporter', 'Полярное сияние · Спонсор'],
            nick_style_rainbow: ['彩虹·赞赏', '彩虹·贊賞', 'Rainbow · Supporter', 'Радуга · Спонсор'],
            nick_style_cyberorange: ['赛博橙', '賽博橙', 'Cyber Orange', 'Кибер-оранжевый'],
            nick_style_cyberblue: ['赛博蓝', '賽博藍', 'Cyber Blue', 'Кибер-синий'],
            nick_style_vpurple: ['紫罗兰', '紫羅蘭', 'Violet', 'Фиолетовый'],
            nick_style_vaurora: ['极光', '極光', 'Aurora', 'Полярное сияние'],
            nick_style_dev_locked: ['此功能为赞赏专属，需要输入兑换码解锁', '此功能為贊賞專屬，需要輸入兌換碼解鎖', 'This style is for supporters only; enter a redeem code to unlock.', 'Этот стиль доступен спонсорам: введите код.'],
            nick_style_pass_locked: ['该名称色需在通行证达到对应等级并领取后使用', '該名稱色需在通行證達到對應等級並領取後使用', 'Claim this name color at the corresponding Pass level first.', 'Сначала получите этот цвет на нужном уровне пропуска.'],
            dev_badge: ['开发者', '開發者', 'DEV', 'DEV'],
            card_030: ['收藏家', '收藏家', 'Collector', 'Коллекционер'],
            card_052: ['招财进宝', '招財進寶', 'Fortune', 'Привлечение богатства'],
            card_047: ['黑金授信', '黑金授信', 'Black Gold Credit', 'Кредит «чёрное золото»'],
            card_017: ['殿堂', '殿堂', 'Hall', 'Зал']
        });
    }

    function t(k) { return window.I18N && I18N.t ? I18N.t(k) : k; }
    function packReady() { return !!(window.CardPack && CardPack.isDone()); }
    function getUnlocked() {
        try { var a = JSON.parse(localStorage.getItem(UNLOCK_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
    }
    function isGmUser() {
        try {
            var v = localStorage.getItem('ab_gm_unlocked');
            return v === 'true' || v === '1';
        } catch (e) { return false; }
    }
    function isUnlocked(id) {
        if (id === 'card_000') return true;
        if (id === 'card_gm') return isGmUser();
        if (getUnlocked().indexOf(id) >= 0) return true;
        try { return localStorage.getItem('ab_pass_' + id) === '1'; } catch (e) { return false; }
    }
    function unlock(id) {
        var a = getUnlocked();
        if (a.indexOf(id) < 0) { a.push(id); try { localStorage.setItem(UNLOCK_KEY, JSON.stringify(a)); } catch (e) {} }
        return true;
    }
    function selected() { try { return localStorage.getItem(SEL_KEY) || 'card_000'; } catch (e) { return 'card_000'; } }
    function byId(id) { for (var i = 0; i < CARDS.length; i++) if (CARDS[i].id === id) return CARDS[i]; return null; }

    function resolveImg(c, cb) {
        if (!c) { cb(''); return; }
        if (c.local) { cb(c.img); return; }
        var R = window.ResourceDownloadManager;
        if (!R || !R.resolvePath) { cb(''); return; }
        try {
            Promise.resolve(R.resolvePath(c.img)).then(function (u) {
                cb(u && u.indexOf('blob:') === 0 ? u : '');
            }).catch(function () { cb(''); });
        } catch (e) { cb(''); }
    }

    function apply() {
        var c = byId(selected());
        var layer = document.getElementById('profile-card-layer');
        var nameEl = document.getElementById('profile-card-name');
        var k = c ? (c.nameKey || c.id) : 'card_none';
        if (nameEl) {
            nameEl.setAttribute('data-i18n', k);
            nameEl.textContent = t(k);
        }
        if (!layer) return;
        var NO_SHINE = ['card_052', 'card_000', 'card_wolf', 'card_bhj', 'card_qxys', 'card_yinghe', 'card_zsxf'];
        layer.classList.toggle('no-shine', !!c && NO_SHINE.indexOf(c.id) >= 0);
        if (!c) { layer.style.backgroundImage = ''; delete layer.dataset.cardUrl; layer.classList.remove('show'); return; }
        resolveImg(c, function (url) {
            // 重复 apply（启动、可见性变化）不重新设置同一张图，避免闪一下
            if (url && layer.dataset.cardUrl === url) { layer.classList.add('show'); return; }
            if (url) {
                layer.dataset.cardUrl = url;
                layer.style.backgroundImage = 'url("' + url + '")';
                layer.classList.add('show');
            } else {
                delete layer.dataset.cardUrl;
                layer.style.backgroundImage = '';
                layer.classList.remove('show');
            }
        });
    }

    function equip(id) {
        if (!isUnlocked(id)) return;
        try { localStorage.setItem(SEL_KEY, id); } catch (e) {}
        apply();
        render();
    }

    function render() {
        var grid = document.getElementById('card-grid');
        if (!grid) return;
        grid.innerHTML = '';
        if (!packReady()) {
            var tip = document.createElement('div');
            tip.style.cssText = 'grid-column:1/-1;font-size:12px;color:#f59e0b;line-height:1.7;';
            tip.textContent = t('card_need_download');
            grid.appendChild(tip);
        }
        CARDS.forEach(function (c) {
            if (c.id === 'card_000') return; // 默认名片不作为选择项
            if (c.gmOnly && !isGmUser()) return; // GM 名片仅 GM 权益解锁后显示
            var un = isUnlocked(c.id), sel = selected() === c.id;
            var d = document.createElement('div');
            d.style.cssText = 'border:1px solid ' + (sel ? '#3b82f6' : '#334155') + ';border-radius:10px;overflow:hidden;background:rgba(255,255,255,.03);';
            var thumb = document.createElement('div');
            thumb.style.cssText = 'height:78px;background:rgba(255,255,255,.06);background-size:cover;background-position:center;opacity:' + (un ? '1' : '.45') + ';';
            resolveImg(c, function (u) { if (u) thumb.style.backgroundImage = 'url("' + u + '")'; });
            var name = document.createElement('div');
            name.style.cssText = 'padding:8px 10px;font-size:12px;color:#e2e8f0;font-weight:600;';
            name.textContent = t(c.nameKey || c.id);
            var foot = document.createElement('div');
            foot.style.cssText = 'padding:0 10px 10px;';
            if (un) {
                var btn = document.createElement('button');
                btn.className = 'modal-btn primary';
                btn.style.cssText = 'width:100%;padding:6px 0;font-size:12px;';
                btn.disabled = sel;
                btn.textContent = sel ? t('card_equipped') : t('card_equip');
                btn.onclick = function () { equip(c.id); };
                foot.appendChild(btn);
            } else {
                var lock = document.createElement('div');
                lock.style.cssText = 'font-size:11px;color:#94a3b8;line-height:1.5;';
                lock.textContent = t('card_locked') + ' · ' + (c.passOnly ? t('card_pass_hint') : t('card_unlock_hint'));
                foot.appendChild(lock);
                d.style.cursor = 'pointer';
                d.addEventListener('click', function () {
                    if (window.showToast) showToast(c.passOnly ? t('nick_style_pass_locked') : '此功能为赞赏专属，需要输入兑换码解锁');
                });
            }
            d.appendChild(thumb); d.appendChild(name); d.appendChild(foot);
            grid.appendChild(d);
        });
    }

    function open() {
        var m = document.getElementById('card-modal');
        if (!m) return;
        render();
        if (window.ModalRegistry) { try { ModalRegistry.open('card-modal'); return; } catch (e) {} }
        m.style.display = 'flex';
        requestAnimationFrame(function () { m.classList.add('show'); });
    }
    function close() {
        var m = document.getElementById('card-modal');
        if (!m) return;
        if (window.ModalRegistry) { try { ModalRegistry.close('card-modal'); return; } catch (e) {} }
        m.classList.remove('show');
        setTimeout(function () { m.style.display = 'none'; }, 300);
    }

    function bind() {
        var row = document.getElementById('profile-card-row');
        if (row) row.addEventListener('click', open);
        var c = document.getElementById('card-modal-close');
        if (c) c.addEventListener('click', close);
        var m = document.getElementById('card-modal');
        if (m) m.addEventListener('click', function (e) { if (e.target === m) close(); });
        var reset = document.getElementById('card-reset-btn');
        if (reset) reset.addEventListener('click', function () {
            try { localStorage.removeItem(SEL_KEY); } catch (e) {}
            apply();
            render();
        });
        var devBtn = document.getElementById('gm-devname-btn');
        var devModal = document.getElementById('gm-devname-modal');
        var devClose = document.getElementById('gm-devname-close');
        var devStatus = document.getElementById('gm-devname-status');
        if (devBtn && devModal) {
            devBtn.addEventListener('click', function () {
                devModal.style.display = 'flex';
                requestAnimationFrame(function () { devModal.classList.add('show'); });
            });
            function closeDev() {
                devModal.classList.remove('show');
                setTimeout(function () { devModal.style.display = 'none'; }, 300);
            }
            if (devClose) devClose.addEventListener('click', closeDev);
            devModal.addEventListener('click', function (e) { if (e.target === devModal) closeDev(); });
            var devBtns = devModal.querySelectorAll('.gm-devname-grant');
            for (var di = 0; di < devBtns.length; di++) {
                devBtns[di].addEventListener('click', function () {
                    var st = this.getAttribute('data-style');
                    try { localStorage.setItem('ab_dev_' + st, '1'); } catch (e) {}
                    if (devStatus) { devStatus.textContent = '已解锁：' + st + '（可在修改昵称中选择）'; devStatus.style.color = '#34d399'; }
                    if (window.showToast) showToast('已解锁开发者昵称：' + st);
                });
            }
        }
        apply();
        window.addEventListener('load', apply);
        setTimeout(apply, 1200);
        setTimeout(apply, 3000);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();

    try {
        document.addEventListener('visibilitychange', function () {
            if (document.body) document.body.classList.toggle('app-paused', document.hidden);
        });
    } catch (e) {}

    window.Cards = {
        unlock: unlock, isUnlocked: isUnlocked, selected: selected, apply: apply,
        list: CARDS,
        imgOf: function (id) { var c = byId(id); return c ? c.img : ''; },
        resolveById: function (id, cb) { resolveImg(byId(id), cb); },
        refreshImages: function () { apply(); render(); }
    };
})();
