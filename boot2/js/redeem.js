/* 兑换码模块：本地码表已移除，改为服务端校验（Supabase redeem_code）
 * 保留：按 UID 的物品池授权码（本地算法，仅解锁物品池）
 * 已用码持久化在 localStorage.ab_redeem_codes_v1（仅用于提示，服务端为准）
 */
(function (w) {
    'use strict';

    var USED_KEY = 'ab_redeem_codes_v1';

    // ===== 按 UID 的物品池授权码（保留）=====
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

    function getUsed() {
        try { var raw = localStorage.getItem(USED_KEY); var arr = raw ? JSON.parse(raw) : []; return Array.isArray(arr) ? arr : []; }
        catch (e) { return []; }
    }
    function markUsed(code) {
        var used = getUsed();
        if (used.indexOf(code) === -1) used.push(code);
        try { localStorage.setItem(USED_KEY, JSON.stringify(used)); } catch (e) {}
    }
    function isUsed(code) {
        var c = normCode(code);
        return getUsed().some(function (u) { return normCode(u) === c; });
    }

    function showResult(msg, ok) {
        var el = document.getElementById('redeem-code-result');
        if (el) { el.textContent = msg; el.style.color = ok ? '#34d399' : '#f87171'; }
        try { if (w.showToast) w.showToast(msg); } catch (e) {}
    }

    function applyServerGrant(res) {
        var kind = res && res.kind;
        var p = (res && res.payload) || {};
        function setFlag(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
        function one(key) {
            if (key === 'gm') { setFlag('ab_gm_unlocked', 'true'); if (typeof w.__enableGM === 'function') { try { w.__enableGM(); } catch (e) {} } }
            else if (key === 'item_pool') { setFlag('ab_item_control_unlocked', '1'); }
            else if (key === 'gold_name') { setFlag('ab_gold_name', '1'); }
            else if (key.indexOf('card:') === 0) { try { if (w.Cards) w.Cards.unlock(key.slice(5)); } catch (e) {} }
        }
        try {
            if (kind === 'bundle') { (p.items || []).forEach(one); }
            else if (kind === 'card') { if (p.card_id && w.Cards) w.Cards.unlock(p.card_id); }
            else if (kind === 'value') { if (typeof w.__addAccumulatedValue === 'function') w.__addAccumulatedValue(p.amount || 0); }
            else if (kind === 'skill') { if (p.skill && typeof w.__unlockSkillByRedeem === 'function') w.__unlockSkillByRedeem(p.skill); }
            else { one(kind); }
        } catch (e) {}
    }

    function redeem(input) {
        var code = (input || '').trim();
        if (!code) { showResult('请输入兑换码', false); return; }

        var myUid = (typeof w.getUid === 'function' && w.getUid()) || localStorage.getItem('ab_uid_clean') || '';
        if (myUid && normCode(code) === normCode(ipGrantCode(myUid))) {
            try { localStorage.setItem('ab_item_control_unlocked', '1'); } catch (e) {}
            markUsed(code);
            showResult('物品池管理已解锁', true);
            return;
        }

        if (isUsed(code)) { showResult('该兑换码你已使用过', false); return; }

        var E = w.Entitlements;
        if (!E || !E.serverRedeem) { showResult('服务端校验未就绪，请稍后再试', false); return; }

        showResult('验证中…', true);
        E.serverRedeem(code).then(function (res) {
            if (res && res.ok) {
                try { applyServerGrant(res); } catch (e) {}
                markUsed(code);
                showResult(res.message || '兑换成功', true);
                try { if (E.sync) E.sync(); } catch (e) {}
            } else {
                showResult((res && res.message) || '兑换失败', false);
            }
        }).catch(function () {
            showResult('网络异常，请稍后再试', false);
        });
    }

    function bind() {
        var btn = document.getElementById('sidebar-redeem-btn');
        var modal = document.getElementById('redeem-code-modal');
        var close = document.getElementById('redeem-code-close');
        var submit = document.getElementById('redeem-code-submit');
        var input = document.getElementById('redeem-code-input');
        if (!btn || !modal) return;

        function open() {
            if (w.ModalRegistry) { try { ModalRegistry.open('redeem-code-modal'); return; } catch (e) {} }
            modal.style.display = 'flex';
            requestAnimationFrame(function () { modal.classList.add('show'); });
        }
        function closeM() {
            if (w.ModalRegistry) { try { ModalRegistry.close('redeem-code-modal'); return; } catch (e) {} }
            modal.classList.remove('show');
            setTimeout(function () { modal.style.display = 'none'; }, 300);
        }
        btn.addEventListener('click', open);
        if (close) close.addEventListener('click', closeM);
        if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closeM(); });
        if (submit) submit.addEventListener('click', function () {
            var i2 = document.getElementById('redeem-code-input');
            redeem(i2 ? i2.value : '');
        });
        if (input) {
            input.addEventListener('keydown', function (e) { if (e.key === 'Enter') redeem(input.value); });
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();

    w.RedeemCode = { redeem: redeem, isUsed: isUsed, list: function () { return []; }, ipGrantCode: ipGrantCode };
})(window);
