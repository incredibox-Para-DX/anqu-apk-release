(function () {
    var CARDS = [
        { id: 'card_030', img: 'images/cards/card_030.png', code: 'CARD030' },
        { id: 'card_052', img: 'images/cards/card_052.png', code: 'CARD052' },
        { id: 'card_047', img: 'images/cards/card_047.png', code: 'CARD047' },
        { id: 'card_017', img: 'images/cards/card_017.png', code: 'CARD017' }
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
            card_reset: ['恢复初始名片', '恢復初始名片', 'Reset card', 'Сбросить визитку'],
            nick_style: ['昵称样式', '暱稱樣式', 'Name style', 'Стиль ника'],
            nick_style_normal: ['普通', '普通', 'Normal', 'Обычный'],
            nick_style_gold: ['金色', '金色', 'Gold', 'Золотой'],
            card_030: ['极夜', '極夜', 'Polar Night', 'Полярная ночь'],
            card_052: ['黎明', '黎明', 'Dawn', 'Рассвет'],
            card_047: ['赤霞', '赤霞', 'Crimson Dusk', 'Алый закат'],
            card_017: ['幽蓝', '幽藍', 'Deep Blue', 'Глубокая синь']
        });
    }

    function t(k) { return window.I18N && I18N.t ? I18N.t(k) : k; }
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

    function apply() {
        var c = byId(selected());
        var layer = document.getElementById('profile-card-layer');
        var nameEl = document.getElementById('profile-card-name');
        if (layer) {
            if (c) { layer.style.backgroundImage = 'url("' + c.img + '")'; layer.classList.add('show'); }
            else { layer.style.backgroundImage = ''; layer.classList.remove('show'); }
        }
        if (nameEl) {
            var k = c ? c.id : 'card_none';
            nameEl.setAttribute('data-i18n', k);
            nameEl.textContent = t(k);
        }
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
        CARDS.forEach(function (c) {
            var un = isUnlocked(c.id), sel = selected() === c.id;
            var d = document.createElement('div');
            d.style.cssText = 'border:1px solid ' + (sel ? '#3b82f6' : '#334155') + ';border-radius:10px;overflow:hidden;background:rgba(255,255,255,.03);';
            d.innerHTML =
                '<div style="height:78px;background:url(' + c.img + ') center/cover;opacity:' + (un ? '1' : '.45') + ';"></div>' +
                '<div style="padding:8px 10px;font-size:12px;color:#e2e8f0;font-weight:600;">' + t(c.id) + '</div>' +
                '<div style="padding:0 10px 10px;">' +
                (un
                    ? '<button class="modal-btn primary" data-id="' + c.id + '" style="width:100%;padding:6px 0;font-size:12px;" ' + (sel ? 'disabled' : '') + '>' + (sel ? t('card_equipped') : t('card_equip')) + '</button>'
                    : '<div style="font-size:11px;color:#94a3b8;line-height:1.5;">' + t('card_locked') + '<br>' + t('card_unlock_hint') + '</div>') +
                '</div>';
            grid.appendChild(d);
        });
        var btns = grid.querySelectorAll('button[data-id]');
        for (var i = 0; i < btns.length; i++) {
            btns[i].onclick = function () { equip(this.getAttribute('data-id')); };
        }
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
        apply();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();

    window.Cards = { unlock: unlock, isUnlocked: isUnlocked, selected: selected, apply: apply, list: CARDS, imgOf: function (id) { var c = byId(id); return c ? c.img : ''; } };
})();
