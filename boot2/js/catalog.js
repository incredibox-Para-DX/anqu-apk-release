(function () {
    var KEY = 'ab_catalog_counts';
    var filterState = 'all';
    function loadCounts() {
        try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; }
    }
    var counts = loadCounts();

    function save() {
        try { localStorage.setItem(KEY, JSON.stringify(counts)); } catch (e) {}
    }

    function items() {
        var base = Array.isArray(window.__ALL_ITEMS__) ? window.__ALL_ITEMS__.slice() : [];
        try {
            if (window.ModManager && typeof ModManager.getEnabledItems === 'function') {
                var mods = ModManager.getEnabledItems() || [];
                var seen = {};
                for (var i = 0; i < base.length; i++) seen[base[i].id] = true;
                for (var j = 0; j < mods.length; j++) {
                    if (mods[j] && !seen[mods[j].id]) base.push(mods[j]);
                }
            }
        } catch (e) {}
        return base;
    }

    var RARITY = {
        white: '#cbd5e1', gray: '#94a3b8', blue: '#60a5fa', purple: '#c084fc', gold: '#fbbf24', orange: '#ef4444', red: '#ef4444'
    };

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function fmt(n) {
        var v = Math.round(Number(n) || 0);
        try { return v.toLocaleString('zh-CN'); } catch (e) { return String(v); }
    }

    function t(key, fallback) {
        try { return (window.I18N && I18N.t) ? I18N.t(key, fallback) : fallback; } catch (e) { return fallback; }
    }

    function showDetail(it) {
        var overlay = document.getElementById('catalog-detail');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'catalog-detail';
            overlay.className = 'catalog-detail-overlay';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) overlay.classList.remove('show');
            });
        }
        var count = counts[it.id] || 0;
        var name = it.fullName || it.name || '';
        var color = RARITY[it.rarity] || '#cbd5e1';
        var obtained = t('catalog_obtained', '摸到 {n} 次').replace('{n}', String(count));
        var priceLabel = t('catalog_price', '参考价');
        var noDesc = t('catalog_no_desc', '暂无简介');
        overlay.innerHTML = '<div class="catalog-detail-card">' +
            '<button class="catalog-detail-close" type="button">&times;</button>' +
            '<div class="catalog-detail-head">' +
            '<div class="catalog-detail-img">' + (it.image ? '<img src="' + esc(it.image) + '" alt="">' : '<i class="fas fa-box"></i>') + '</div>' +
            '<div><div class="catalog-detail-name" style="color:' + color + '">' + esc(name) + '</div>' +
            '<div class="catalog-detail-meta">' + esc(obtained) + ' · ' + esc(priceLabel) + ' ' + esc(fmt(it.value || 0)) + '</div></div>' +
            '</div>' +
            '<div class="catalog-detail-desc">' + esc(it.desc || noDesc) + '</div>' +
            '</div>';
        try {
            if (it.sound) {
                var audio = new Audio(it.sound);
                audio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
                audio.play().catch(function () {});
            }
        } catch (e) {}
        overlay.classList.remove('show');
        overlay.style.display = 'flex';
        void overlay.offsetWidth;
        requestAnimationFrame(function () { overlay.classList.add('show'); });
        var btn = overlay.querySelector('.catalog-detail-close');
        if (btn) btn.onclick = function () { overlay.classList.remove('show'); };
    }

    function render(filter) {
        var grid = document.getElementById('catalog-grid');
        if (!grid) return;
        counts = loadCounts();
        var term = (filter || '').trim().toLowerCase();
        var list = items().slice();
        if (filterState === 'owned') list = list.filter(function (it) { return (counts[it.id] || 0) > 0; });
        else if (filterState === 'unowned') list = list.filter(function (it) { return !(counts[it.id] || 0); });
        else if (filterState !== 'all') list = list.filter(function (it) { return it.rarity === filterState; });
        list.sort(function (a, b) {
            var ca = counts[a.id] || 0;
            var cb = counts[b.id] || 0;
            if (ca !== cb) return cb - ca;
            return (b.value || 0) - (a.value || 0);
        });
        var html = '';
        var cardIndex = 0;
        for (var i = 0; i < list.length; i++) {
            var it = list[i];
            var name = it.fullName || it.name || '';
            if (term && String(name).toLowerCase().indexOf(term) < 0 && String(it.desc || '').toLowerCase().indexOf(term) < 0) continue;
            var count = counts[it.id] || 0;
            var color = RARITY[it.rarity] || '#cbd5e1';
            var img = it.image || '';
            var obtained = t('catalog_obtained', '摸到 {n} 次').replace('{n}', String(count));
            var priceLabel = t('catalog_price', '参考价');
            var noDesc = t('catalog_no_desc', '暂无简介');
            html += '<div class="catalog-card" data-id="' + esc(it.id) + '" style="animation-delay:' + Math.min(cardIndex * 18, 260) + 'ms">' +
                '<div class="catalog-thumb">' + (img ? '<img src="' + esc(img) + '" loading="lazy" alt="">' : '<i class="fas fa-box"></i>') + '</div>' +
                '<div class="catalog-info">' +
                '<div class="catalog-name" style="color:' + color + '">' + esc(name) + '</div>' +
                '<div class="catalog-meta"><span>' + esc(obtained) + '</span><span>' + esc(priceLabel) + ' ' + esc(fmt(it.value || 0)) + '</span></div>' +
                '<div class="catalog-desc">' + esc(it.desc || noDesc) + '</div>' +
                '</div></div>';
            cardIndex++;
        }
        grid.innerHTML = html || '<div style="grid-column:1/-1;text-align:center;color:#94a3b8;padding:30px;">' + esc(t('catalog_empty', '没有找到物品')) + '</div>';
    }

    function open() {
        if (window.EventManager && EventManager.openModal) EventManager.openModal('catalog-modal');
        var modal = document.getElementById('catalog-modal');
        if (modal && !modal.classList.contains('show')) {
            modal.style.display = 'flex';
            void modal.offsetWidth;
            requestAnimationFrame(function () { modal.classList.add('show'); });
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
        if (search) {
            search.placeholder = t('catalog_search', '搜索物品名称或简介');
            search.addEventListener('input', function () { render(search.value); });
        }
        var filters = document.getElementById('catalog-filters');
        if (filters) {
            filters.addEventListener('click', function (e) {
                var btn = e.target && e.target.closest ? e.target.closest('.catalog-filter-btn') : null;
                if (!btn) return;
                filterState = btn.getAttribute('data-filter') || 'all';
                var all = filters.querySelectorAll('.catalog-filter-btn');
                for (var i = 0; i < all.length; i++) all[i].classList.toggle('active', all[i] === btn);
                var s = document.getElementById('catalog-search');
                render(s ? s.value : '');
            });
        }
        var grid = document.getElementById('catalog-grid');
        if (grid) {
            grid.addEventListener('click', function (e) {
                var card = e.target && e.target.closest ? e.target.closest('.catalog-card') : null;
                if (!card) return;
                var raw = card.getAttribute('data-id');
                var list = items();
                for (var i = 0; i < list.length; i++) {
                    if (String(list[i].id) === String(raw)) { showDetail(list[i]); return; }
                }
            });
        }
    }

    window.CatalogManager = {
        record: function (item) {
            if (!item) return;
            var id = item.catalogId != null ? item.catalogId : item.id;
            if (id == null) return;
            counts[id] = (counts[id] || 0) + 1;
            save();
        },
        open: open
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
})();
