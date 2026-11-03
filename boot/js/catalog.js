(function () {
    var KEY = 'ab_catalog_counts';
    var counts = {};
    try { counts = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { counts = {}; }

    function save() {
        try { localStorage.setItem(KEY, JSON.stringify(counts)); } catch (e) {}
    }

    function items() {
        return Array.isArray(window.__ALL_ITEMS__) ? window.__ALL_ITEMS__ : [];
    }

    var RARITY = {
        white: '#cbd5e1', gray: '#94a3b8', blue: '#60a5fa', purple: '#c084fc', gold: '#fbbf24', red: '#ef4444'
    };

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function fmt(n) {
        try { return window.Utils && Utils.formatCurrency ? Utils.formatCurrency(n) : String(n); } catch (e) { return String(n); }
    }

    function render(filter) {
        var grid = document.getElementById('catalog-grid');
        if (!grid) return;
        var term = (filter || '').trim().toLowerCase();
        var list = items().slice().sort(function (a, b) {
            var ca = counts[a.id] || 0;
            var cb = counts[b.id] || 0;
            if (ca !== cb) return cb - ca;
            return (b.value || 0) - (a.value || 0);
        });
        var html = '';
        for (var i = 0; i < list.length; i++) {
            var it = list[i];
            var name = it.fullName || it.name || '';
            if (term && String(name).toLowerCase().indexOf(term) < 0 && String(it.desc || '').toLowerCase().indexOf(term) < 0) continue;
            var count = counts[it.id] || 0;
            var color = RARITY[it.rarity] || '#cbd5e1';
            var img = it.image || '';
            html += '<div class="catalog-card">' +
                '<div class="catalog-thumb">' + (img ? '<img src="' + esc(img) + '" loading="lazy" alt="">' : '<i class="fas fa-box"></i>') + '</div>' +
                '<div class="catalog-info">' +
                '<div class="catalog-name" style="color:' + color + '">' + esc(name) + '</div>' +
                '<div class="catalog-meta"><span>摸到 ' + count + ' 次</span><span>参考价 ' + esc(fmt(it.value || 0)) + '</span></div>' +
                '<div class="catalog-desc">' + esc(it.desc || '暂无简介') + '</div>' +
                '</div></div>';
        }
        grid.innerHTML = html || '<div style="grid-column:1/-1;text-align:center;color:#94a3b8;padding:30px;">没有找到物品</div>';
    }

    function open() {
        if (window.EventManager && EventManager.openModal) EventManager.openModal('catalog-modal');
        else {
            var m = document.getElementById('catalog-modal');
            if (m) { m.style.display = 'flex'; setTimeout(function () { m.classList.add('show'); }, 10); }
        }
        var search = document.getElementById('catalog-search');
        render(search ? search.value : '');
    }

    function bind() {
        var btn = document.getElementById('sidebar-catalog-btn');
        if (btn) btn.addEventListener('click', open);
        var close = document.getElementById('catalog-close');
        if (close) close.addEventListener('click', function () {
            if (window.EventManager && EventManager.closeModal) EventManager.closeModal('catalog-modal');
            else {
                var m = document.getElementById('catalog-modal');
                if (m) {
                    m.classList.remove('show');
                    setTimeout(function () { m.style.display = 'none'; }, 300);
                }
            }
        });
        var search = document.getElementById('catalog-search');
        if (search) search.addEventListener('input', function () { render(search.value); });
    }

    window.CatalogManager = {
        record: function (item) {
            if (!item || item.id == null) return;
            counts[item.id] = (counts[item.id] || 0) + 1;
            save();
        },
        open: open
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
})();
