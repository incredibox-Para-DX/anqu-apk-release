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
        }
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
        if (!el) return;
        el.textContent = msg;
        el.style.color = ok ? '#34d399' : '#f87171';
    }

    function redeem(input) {
        var code = (input || '').trim();
        if (!code) {
            showResult('请输入兑换码', false);
            return;
        }
        var def = CODES[code];
        if (!def) {
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
        if (submit) {
            submit.addEventListener('click', function () { redeem(input ? input.value : ''); });
        }
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

    w.RedeemCode = { redeem: redeem, isUsed: isUsed, list: function () { return Object.keys(CODES); } };
})(window);
