/* 兑换码模块：
 * - Camona     → 累计价值 +20,000,000，仅一次
 * - hefunadmin → 进入 GM 模式，仅一次
 * - Destiny    → 解锁技能「命运保底」，仅一次
 * - ItemPool   → 解锁「物品池管理」功能，仅一次
 * 已用码持久化在 localStorage.ab_redeem_codes_v1
 */
(function (w) {
    'use strict';

    var USED_KEY = 'ab_redeem_codes_v1';

    // ===== 按 UID 的物品池授权码（远程下发用） =====
    var IP_SECRET = 'anqu_itempool_2026_v1';
    function fnv(str) {
        var h = 0x811c9dc5;
        for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
        return h >>> 0;
    }
    function ipGrantCode(uid) {
        uid = String(uid || '').trim();
        if (!uid) return '';
        var a = fnv(IP_SECRET + '|ip|' + uid);
        var b = fnv(uid + '|ip|' + IP_SECRET + '|x');
        var raw = (a.toString(36) + b.toString(36)).toUpperCase().replace(/[^A-Z0-9]/g, '');
        while (raw.length < 10) raw += 'X';
        return 'IP' + raw.slice(0, 4) + '-' + raw.slice(4, 8);
    }
    function normCode(s) { return String(s || '').toUpperCase().replace(/[\s\-]/g, ''); }

    var CODES = {
        'Camona': {
            once: true,
            grant: function () {
                if (typeof w.__addAccumulatedValue === 'function') {
                    w.__addAccumulatedValue(20000000);
                }
                return '兑换成功！累计价值 +20M';
            }
        },
        'hefunadmin': {
            once: true,
            grant: function () {
                if (typeof w.__enableGM === 'function') {
                    w.__enableGM();
                } else {
                    try { localStorage.setItem('ab_gm_unlocked', 'true'); } catch (e) {}
                }
                return 'GM 模式已开启';
            }
        },
        'ItemPool': {
            once: true,
            grant: function () {
                try { localStorage.setItem('ab_item_control_unlocked', '1'); } catch (e) {}
                return '「物品池管理」已解锁';
            }
        },
        'Destiny': {
            once: true,
            grant: function () {
                if (typeof w.__unlockSkillByRedeem === 'function') {
                    const r = w.__unlockSkillByRedeem('destiny_pity');
                    return r.success ? r.message : '技能解锁失败';
                }
                // 兜底：直接写入技能状态
                try {
                    var st = JSON.parse(localStorage.getItem('ab_shop_skills_v1') || '{}');
                    if (!st.destiny_pity) st.destiny_pity = { owned: true, enabled: true, remaining: 0 };
                    localStorage.setItem('ab_shop_skills_v1', JSON.stringify(st));
                    return '技能「命运保底」已解锁';
                } catch (e) { return '技能解锁失败'; }
            }
        },
        'CARD030': { once: true, grant: function () { if (window.Cards) window.Cards.unlock('card_030'); return '名片「极夜」已解锁'; } },
        'CARD052': { once: true, grant: function () { if (window.Cards) window.Cards.unlock('card_052'); return '名片「黎明」已解锁'; } },
        'CARD047': { once: true, grant: function () { if (window.Cards) window.Cards.unlock('card_047'); return '名片「赤霞」已解锁'; } },
        'CARD017': { once: true, grant: function () { if (window.Cards) window.Cards.unlock('card_017'); return '名片「幽蓝」已解锁'; } }
    };

    function getUsed() {
        try {
            var raw = localStorage.getItem(USED_KEY);
            var arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }
    }

    function markUsed(code) {
        var used = getUsed();
        if (used.indexOf(code) === -1) used.push(code);
        try { localStorage.setItem(USED_KEY, JSON.stringify(used)); } catch (e) {}
    }

    function isUsed(code) {
        return getUsed().indexOf(code) !== -1;
    }

    function showResult(msg, ok) {
        var el = document.getElementById('redeem-code-result');
        if (el) { el.textContent = msg; el.style.color = ok ? '#34d399' : '#f87171'; }
        try { if (w.showToast) w.showToast(msg); } catch (e) {}
    }

    function redeem(input) {
        var code = (input || '').trim();
        if (!code) {
            showResult('请输入兑换码', false);
            return;
        }
        var def = CODES[code];
        if (!def) {
            // 针对单个 UID 的物品池授权码（远程下发，仅该设备有效）
            try {
                var myUid = (typeof w.getUid === 'function' && w.getUid()) || localStorage.getItem('ab_uid_clean') || '';
                if (myUid && normCode(code) === normCode(ipGrantCode(myUid))) {
                    localStorage.setItem('ab_item_control_unlocked', '1');
                    showResult('「物品池管理」已解锁', true);
                    return;
                }
            } catch (e) {}
            showResult('兑换码无效', false);
            return;
        }
        if (def.once && isUsed(code)) {
            showResult('该兑换码已使用', false);
            return;
        }
        try {
            var msg = def.grant();
            if (def.once) markUsed(code);
            showResult(msg, true);
        } catch (e) {
            showResult('兑换失败，请稍后重试', false);
        }
    }

    function bind() {
        var btn = document.getElementById('sidebar-redeem-btn');
        var modal = document.getElementById('redeem-code-modal');
        var close = document.getElementById('redeem-code-close');
        var submit = document.getElementById('redeem-code-submit');
        var input = document.getElementById('redeem-code-input');
        var result = document.getElementById('redeem-code-result');

        if (btn) {
            btn.addEventListener('click', function () {
                if (w.ModalRegistry) w.ModalRegistry.open('redeem-code-modal');
                else if (modal) { modal.style.display = 'flex'; setTimeout(function () { modal.classList.add('show'); }, 10); }
                if (input) { input.value = ''; input.focus(); }
                if (result) { result.textContent = ''; }
            });
        }
        if (close) {
            close.addEventListener('click', function () {
                if (w.ModalRegistry) w.ModalRegistry.close('redeem-code-modal');
                else if (modal) { modal.classList.remove('show'); setTimeout(function () { modal.style.display = 'none'; }, 300); }
            });
        }
        // 事件委托：即使按钮被重渲染、或点到内部图标/文字，也能触发兑换
        document.addEventListener('click', function (e) {
            if (e.target && e.target.closest && e.target.closest('#redeem-code-submit')) {
                var i2 = document.getElementById('redeem-code-input');
                redeem(i2 ? i2.value : '');
            }
        });
        if (input) {
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') { redeem(input.value); }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }

    w.RedeemCode = { redeem: redeem, isUsed: isUsed, list: function () { return Object.keys(CODES); }, ipGrantCode: ipGrantCode };
})(window);
