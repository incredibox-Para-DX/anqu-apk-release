(function () {
    var CARDS = [
        { id: 'card_030', img: 'cards/card_030.png', code: 'CARD030' },
        { id: 'card_052', img: 'cards/card_052.png', code: 'CARD052' },
        { id: 'card_047', img: 'cards/card_047.png', code: 'CARD047' },
        { id: 'card_017', img: 'cards/card_017.png', code: 'CARD017' }
    ];
    var UNLOCK_KEY = 'ab_cards_unlocked';
    var SEL_KEY = 'ab_card_selected';

    if (window.I18N && I18N.addEntries) {
        I18N.addEntries({
            card_label: ['名片', '名片', 'Card', 'Карточка'],
            card_title: ['名片', '名片', 'Profile Card', 'Визитка'],
            card_locked: ['未解锁', '未解鎖', 'Locked', 'Закрыто'],
            card_equip: ['装备', '裝備', 'Equip', 'Надеть'],
            card_equipped: ['使用中', '使用中', 'In use', 'Используется'],
            card_unlock_hint: ['使用兑换码解锁', '使用兌換碼解鎖', 'Unlock with a redeem code', 'Откройте кодом'],
            card_none: ['未装备', '未裝備', 'None', 'Нет'],
            card_need_download: ['请先到「资源下载」下载名片资源包', '請先到「資源下載」下載名片資源包', 'Download the card pack in Downloads first', 'Сначала скачайте набор визиток в «Загрузках»'],
            card_reset: ['恢复初始名片', '恢復初始名片', 'Reset card', 'Сбросить визитку'],
            nick_style: ['昵称样式', '暱稱樣式', 'Name style', 'Стиль ника'],
            nick_style_normal: ['普通', '普通', 'Normal', 'Обычный'],
            nick_style_gold: ['金色', '金色', 'Gold', 'Золотой'],
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
    function isUnlocked(id) { return getUnlocked().indexOf(id) >= 0; }
    function unlock(id) {
        var a = getUnlocked();
        if (a.indexOf(id) < 0) { a.push(id); try { localStorage.setItem(UNLOCK_KEY, JSON.stringify(a)); } catch (e) {} }
        return true;
    }
    function selected() { try { return localStorage.getItem(SEL_KEY) || ''; } catch (e) { return ''; } }
    function byId(id) { for (var i = 0; i < CARDS.length; i++) if (CARDS[i].id === id) return CARDS[i]; return null; }

    function resolveImg(c, cb) {
        if (!c) { cb(''); return; }
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
        var k = c ? c.id : 'card_none';
        if (nameEl) {
            nameEl.setAttribute('data-i18n', k);
            nameEl.textContent = t(k);
        }
        if (!layer) return;
        layer.classList.toggle('no-shine', !!c && c.id === 'card_052');
        if (!c) { layer.style.backgroundImage = ''; layer.classList.remove('show'); return; }
        resolveImg(c, function (url) {
            if (url) { layer.style.backgroundImage = 'url("' + url + '")'; layer.classList.add('show'); }
            else { layer.style.backgroundImage = ''; layer.classList.remove('show'); }
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
            var un = isUnlocked(c.id), sel = selected() === c.id;
            var d = document.createElement('div');
            d.style.cssText = 'border:1px solid ' + (sel ? '#3b82f6' : '#334155') + ';border-radius:10px;overflow:hidden;background:rgba(255,255,255,.03);';
            var thumb = document.createElement('div');
            thumb.style.cssText = 'height:78px;background:rgba(255,255,255,.06);background-size:cover;background-position:center;opacity:' + (un ? '1' : '.45') + ';';
            resolveImg(c, function (u) { if (u) thumb.style.backgroundImage = 'url("' + u + '")'; });
            var name = document.createElement('div');
            name.style.cssText = 'padding:8px 10px;font-size:12px;color:#e2e8f0;font-weight:600;';
            name.textContent = t(c.id);
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
                lock.textContent = t('card_locked') + ' · ' + t('card_unlock_hint');
                foot.appendChild(lock);
            }
            d.appendChild(thumb); d.appendChild(name); d.appendChild(foot);
            grid.appendChild(d);
        });
    }

    function open() {
        if (!packReady()) { if (window.showToast) showToast(t('card_need_download')); return; }
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
        apply();
        window.addEventListener('load', apply);
        setTimeout(apply, 1200);
        setTimeout(apply, 3000);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();

    window.Cards = {
        unlock: unlock, isUnlocked: isUnlocked, selected: selected, apply: apply,
        list: CARDS,
        imgOf: function (id) { var c = byId(id); return c ? c.img : ''; },
        resolveById: function (id, cb) { resolveImg(byId(id), cb); },
        refreshImages: function () { apply(); render(); }
    };
})();
