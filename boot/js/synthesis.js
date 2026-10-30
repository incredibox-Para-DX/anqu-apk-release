(function () {
    'use strict';

    var SAMPLE_DEFS = [
        { name: '常规样本A', image: 'images/img_65e4998e93.jpg', rarity: '#9b59b6' },
        { name: '常规样本B', image: 'images/img_90657544f9.jpg', rarity: '#9b59b6' },
        { name: '常规样本C', image: 'images/img_6a8d629d7f.jpg', rarity: '#9b59b6' },
        { name: '常规样本D', image: 'images/img_6c0448da4d.jpg', rarity: '#9b59b6' },
        { name: '常规样本E', image: 'images/img_06e37968e0.jpg', rarity: '#9b59b6' },
        { name: '不稳定样本X', image: 'images/img_a0cb7eebc4.jpg', rarity: '#9b59b6' }
    ];
    var SAMPLE_NAMES = SAMPLE_DEFS.map(function (d) { return d.name; });

    var INCUBATOR_EMPTY = 'images/img_c01ff6e26c.jpg';
    var INCUBATOR_USED  = 'images/img_8b3f0db755.jpg';
    var ELS_RESULT = 'images/img_570f877cf5.jpg';
    var PREFIX = 'ab_synth_';

    function getUid() {
        try {
            var uid = localStorage.getItem('ab_uid_clean');
            if (!uid) {
                var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                uid = '';
                for (var i = 0; i < 8; i++) {
                    uid += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                localStorage.setItem('ab_uid_clean', uid);
            }
            return uid;
        } catch (e) {}
        return 'guest';
    }
    function keyOf(k) { return PREFIX + getUid() + '_' + k; }
    function load(k, def) {
        try { var v = localStorage.getItem(keyOf(k)); return v ? JSON.parse(v) : def; }
        catch (e) { return def; }
    }
    function save(k, v) { try { localStorage.setItem(keyOf(k), JSON.stringify(v)); } catch (e) {} }

    function getCollected() { return load('collected', {}); }
    function setCollected(obj) { save('collected', obj); }
    function getCount(name) { var c = getCollected(); return (c && c[name]) || 0; }
    function isCollected(name) { return getCount(name) > 0; }
    function getPlaced() { return load('placed', []); }
    function setPlaced(arr) { save('placed', arr); }
    function getSynthCount() { return load('synthCount', 0); }
    function setSynthCount(n) { save('synthCount', n); }
    function isCompleted() { return load('completed', false); }
    function setCompleted(v) { save('completed', v); }

    window.SampleManager = {
        onItemCollected: function (name) {
            if (!name || SAMPLE_NAMES.indexOf(name) === -1) return;
            var c = getCollected();
            c[name] = (c[name] || 0) + 1;
            setCollected(c);
            try { window.dispatchEvent(new CustomEvent('synthesisRefresh')); } catch (e) {}
        },
        isCollected: isCollected,
        getCollected: getCollected,
        getCount: getCount,
        SAMPLE_NAMES: SAMPLE_NAMES
    };

    function playOpen() { var a = new Audio('audio/open-synthesis.mp3'); a.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1); a.play().catch(function(){}); }
    function playClose() { var a = new Audio('audio/sidebar-close.mp3'); a.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1); a.play().catch(function(){}); }
    function toast(msg, dur) { if (window.showToast) window.showToast(msg, dur || 2600); }

    function applyFont() {
        var pref = localStorage.getItem('ab_font_preference') || 'arena1';
        var fontName = pref === 'arena1' ? 'Arena Breakout1' : 'Arena Breakout2';
        var page = document.getElementById('synthesis-page');
        if (!page) return;
        page.style.fontFamily = fontName + ', Microsoft YaHei, sans-serif';
        var all = page.querySelectorAll('*');
        for (var i = 0; i < all.length; i++) {
            var el = all[i];
            if (el.classList && (el.classList.contains('fas') || el.classList.contains('far') || el.classList.contains('fab') || el.classList.contains('fa'))) continue;
            el.style.setProperty('font-family', fontName + ', Microsoft YaHei, sans-serif', 'important');
        }
    }

    function injectStyle() {
        if (document.getElementById('synthesis-style')) return;
        var css = document.createElement('style');
        css.id = 'synthesis-style';
        css.textContent = `
            #synthesis-page {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: #0b0e13; z-index: 99999; display: none; flex-direction: column;
                font-family: inherit; overflow: hidden;
                opacity: 0; transition: opacity 0.25s ease;
            }
            #synthesis-page.show { display: flex; opacity: 1; }
            #synthesis-page .synth-topbar {
                display: flex; align-items: center; justify-content: space-between;
                padding: 10px 16px; background: #12161d; border-bottom: 1px solid rgba(255,255,255,0.08);
                flex-shrink: 0; min-height: 48px;
            }
            #synthesis-page .synth-back-btn {
                display: flex; align-items: center; gap: 6px; background: none; border: none;
                color: #94a3b8; font-size: 14px; cursor: pointer; padding: 6px 10px; border-radius: 6px;
            }
            #synthesis-page .synth-back-btn:hover { color: #e2e8f0; background: rgba(255,255,255,0.05); }
            #synthesis-page .synth-back-btn i { font-size: 18px; }
            #synthesis-page .synth-topbar-title { color: #e2e8f0; font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
            #synthesis-page .synth-topbar-stats { display: flex; gap: 16px; align-items: center; }
            #synthesis-page .synth-topbar-stats .stat-item { color: #94a3b8; font-size: 12px; }
            #synthesis-page .synth-topbar-stats .stat-item b { color: #f59e0b; font-size: 14px; font-weight: 700; }

            #synthesis-page .synth-main { flex: 1; display: flex; align-items: stretch; overflow: hidden; padding: 12px; gap: 12px; position: relative; }

            #synthesis-page .synth-left-zone { flex: 0 0 38%; display: flex; flex-direction: column; gap: 8px; overflow: hidden; }
            #synthesis-page .synth-left-label { color: #94a3b8; font-size: 12px; display: flex; justify-content: space-between; padding: 0 4px; flex-shrink: 0; }
            #synthesis-page .synth-sample-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; flex: 1; overflow-y: auto; align-content: start; }

            #synthesis-page .synth-sample-card {
                border-radius: 8px; background: transparent; border: 1px solid rgba(255,255,255,0.07);
                padding: 6px 4px; display: flex; flex-direction: column; align-items: center; gap: 3px;
                transition: all 0.15s; cursor: not-allowed; opacity: 0.35;
                -webkit-user-select: none; user-select: none; -webkit-touch-callout: none;
            }
            #synthesis-page .synth-sample-card .synth-smp-icon {
                width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
                border-radius: 6px; background: transparent; overflow: visible;
                -webkit-user-select: none; -webkit-touch-callout: none; -webkit-user-drag: none;
                touch-action: none; position: relative;
            }
            #synthesis-page .synth-sample-card .synth-smp-icon img {
                max-width: 100%; max-height: 100%; object-fit: contain;
                -webkit-user-drag: none; -webkit-touch-callout: none; pointer-events: none;
                background: transparent;
            }
            #synthesis-page .synth-sample-card .synth-smp-name { color: #cbd5e1; font-size: 10px; font-weight: 600; }
            #synthesis-page .synth-sample-card .synth-smp-tag { font-size: 9px; color: #64748b; }
            #synthesis-page .synth-sample-card.collected { cursor: grab; opacity: 1; border-color: rgba(155,89,182,0.45); background: linear-gradient(180deg, rgba(155,89,182,0.05), transparent); }
            #synthesis-page .synth-sample-card.collected .synth-smp-icon { cursor: grab; }
            #synthesis-page .synth-sample-card.collected .synth-smp-icon:active { cursor: grabbing; }
            #synthesis-page .synth-sample-card.collected .synth-smp-tag { color: #22c55e; }
            #synthesis-page .synth-sample-card.selected { border-color: #f59e0b; box-shadow: 0 0 8px rgba(245,158,11,0.35); transform: translateY(-1px); opacity: 1; }
            #synthesis-page .synth-sample-card.placed { opacity: 0.85; cursor: default; border-style: solid; border-color: rgba(34,197,94,0.55); background: rgba(34,197,94,0.08); }
            #synthesis-page .synth-sample-card.placed .synth-smp-tag { color: #22c55e; }
            #synthesis-page .synth-sample-card.placed .synth-smp-icon { cursor: default; }

            /* 数量：左下角纯数字，无背景 */
            #synthesis-page .synth-sample-card .synth-smp-count {
                position: absolute; left: 0; bottom: 0;
                color: #e2e8f0; font-size: 11px; font-weight: 700; line-height: 1;
                text-shadow: 0 1px 2px rgba(0,0,0,0.8); z-index: 2;
                pointer-events: none;
            }

            #synthesis-page .synth-right-zone { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; overflow: hidden; }
            #synthesis-page .synth-incubator-frame {
                width: 100%; max-width: 320px; border-radius: 12px;
                background: radial-gradient(circle at 30% 25%, rgba(255,255,255,0.10), rgba(0,0,0,0.35));
                border: 1px solid rgba(255,255,255,0.08); padding: 12px;
                display: flex; justify-content: center; align-items: center; min-height: 180px; flex: 1; overflow: hidden;
            }
            #synthesis-page .synth-incubator-frame img { max-width: 100%; max-height: 100%; object-fit: contain; transition: transform 0.25s ease; filter: drop-shadow(0 8px 18px rgba(0,0,0,0.5)); }
            #synthesis-page .synth-incubator-frame img.drag-over { transform: scale(1.05); filter: drop-shadow(0 0 15px rgba(255,255,255,0.7)); }
            #synthesis-page .synth-slots { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; width: 100%; max-width: 320px; flex-shrink: 0; }
            #synthesis-page .synth-slot { aspect-ratio: 1/1; border-radius: 6px; background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.14); display: flex; align-items: center; justify-content: center; overflow: hidden; }
            #synthesis-page .synth-slot img { width: 100%; height: 100%; object-fit: contain; background: transparent; }
            #synthesis-page .synth-slot.filled { border-style: solid; border-color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.08); box-shadow: 0 0 6px rgba(255,255,255,0.25); }
            #synthesis-page .synth-hint { color: #64748b; font-size: 11px; text-align: center; flex-shrink: 0; }
            #synthesis-page .synth-hint b { color: #f59e0b; }

            #synthesis-page .synth-done-banner { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); text-align: center; padding: 12px 20px; border-radius: 10px; background: #1a1f2e; border: 1px solid rgba(245,158,11,0.35); z-index: 10; display: none; max-width: 90%; box-shadow: 0 8px 24px rgba(0,0,0,0.6); }
            #synthesis-page .synth-done-banner.show { display: block; }
            #synthesis-page .synth-done-banner .banner-title { color: #ffffff; font-size: 16px; font-weight: 700; }
            #synthesis-page .synth-done-banner .banner-sub { color: #e2e8f0; font-size: 11px; margin-top: 3px; }
            #synthesis-page .synth-done-banner .banner-result-img { width: 120px; height: auto; margin: 8px auto 4px; border-radius: 8px; overflow: hidden; background: transparent; }
            #synthesis-page .synth-done-banner .banner-result-img img { width: 100%; height: 100%; object-fit: contain; background: transparent; }
            #synthesis-page .synth-reset-btn { margin-top: 8px; padding: 7px 14px; border-radius: 8px; background: linear-gradient(180deg, #2b6cb0, #24518f); color: #fff; font-size: 12px; font-weight: 600; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; }
            #synthesis-page .synth-reset-btn:hover { filter: brightness(1.1); }

            .synth-drag-clone { position: fixed; z-index: 100001; pointer-events: none; width: 44px; height: 44px; border-radius: 6px; background: transparent; overflow: hidden; display: flex; align-items: center; justify-content: center; opacity: 0.85; box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
            .synth-drag-clone img { max-width: 100%; max-height: 100%; object-fit: contain; background: transparent; }

            #sidebar-synthesis-btn { margin-top: 8px; width: 100%; }

            #synthesis-page img { background: transparent !important; }
        `;
        document.head.appendChild(css);
    }

    var dragData = null;

    function startDrag(name, clientX, clientY, $icon) {
        var $img = $icon.find('img');
        if (!$img.length) return;

        var clone = document.createElement('div');
        clone.className = 'synth-drag-clone';
        var cloneImg = $img[0].cloneNode(true);
        cloneImg.style.pointerEvents = 'none';
        clone.appendChild(cloneImg);
        document.body.appendChild(clone);

        clone.style.left = (clientX - 22) + 'px';
        clone.style.top  = (clientY - 22) + 'px';

        dragData = { name: name, clone: clone, startX: clientX, startY: clientY, moved: false };
    }

    function moveDrag(clientX, clientY) {
        if (!dragData) return;

        var page = document.getElementById('synthesis-page');
        if (page) {
            var rect = page.getBoundingClientRect();
            clientX = Math.max(rect.left + 22, Math.min(rect.right - 22, clientX));
            clientY = Math.max(rect.top + 22, Math.min(rect.bottom - 22, clientY));
        }

        dragData.clone.style.left = (clientX - 22) + 'px';
        dragData.clone.style.top  = (clientY - 22) + 'px';

        var dx = clientX - dragData.startX;
        var dy = clientY - dragData.startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragData.moved = true;

        var $dz = $('#synth-dropzone');
        if ($dz.length) {
            var r = $dz[0].getBoundingClientRect();
            if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
                $('#synth-incubator-img').addClass('drag-over');
            } else {
                $('#synth-incubator-img').removeClass('drag-over');
            }
        }
    }

    function endDrag() {
        if (!dragData) return;

        var name = dragData.name;
        var droppedOnZone = false;

        var $dz = $('#synth-dropzone');
        if ($dz.length) {
            var r = $dz[0].getBoundingClientRect();
            var cl = parseFloat(dragData.clone.style.left) + 22;
            var ct = parseFloat(dragData.clone.style.top) + 22;
            if (cl >= r.left && cl <= r.right && ct >= r.top && ct <= r.bottom) {
                droppedOnZone = true;
            }
        }

        $('#synth-incubator-img').removeClass('drag-over');

        if (dragData.clone && dragData.clone.parentNode) {
            dragData.clone.parentNode.removeChild(dragData.clone);
        }

        var moved = dragData.moved;
        dragData = null;

        if (droppedOnZone && moved) {
            controller.place(name);
        }
    }

    var controller = {
        _initDone: false,
        _isOpen: false,

        ensurePage: function () {
            if (document.getElementById('synthesis-page')) return;
            var html = [
                '<div id="synthesis-page">',
                '  <div class="synth-topbar">',
                '    <button class="synth-back-btn" id="synth-back-btn"><i class="fas fa-arrow-left"></i> 返回</button>',
                '    <div class="synth-topbar-title">离心机</div>',
                '    <div class="synth-topbar-stats">',
                '      <span class="stat-item">已合成 <b id="synth-page-synthcount">0</b> 次</span>',
                '    </div>',
                '  </div>',
                '  <div class="synth-main">',
                '    <div class="synth-left-zone">',
                '      <div class="synth-left-label"><span>样本</span></div>',
                '      <div class="synth-sample-grid" id="synth-sample-grid"></div>',
                '    </div>',
                '    <div class="synth-right-zone">',
                '      <div class="synth-incubator-frame" id="synth-dropzone">',
                '        <img id="synth-incubator-img" src="' + INCUBATOR_EMPTY + '" alt="保温箱">',
                '      </div>',
                '      <div class="synth-slots" id="synth-slots"></div>',
                '      <div class="synth-hint">拖拽 <b>样本</b> 到保温箱进行合成</div>',
                '    </div>',
                '  </div>',
                '  <div class="synth-done-banner" id="synth-done-banner">',
                '    <div class="banner-title">合成完成</div>',
                '    <div class="banner-result-img"><img src="' + ELS_RESULT + '" alt="ELS还原样本"></div>',
                '    <div class="banner-sub" id="synth-banner-sub"></div>',
                '    <button class="synth-reset-btn" id="synth-restart-btn"><i class="fas fa-sync-alt"></i> 重新合成</button>',
                '  </div>',
                '</div>'
            ].join('');
            $('body').append(html);
        },

        open: function () {
            playOpen();
            this.ensurePage();
            this._isOpen = true;
            this.render();
            applyFont();
            var $page = $('#synthesis-page');
            $page.css('opacity', 0);
            $page.addClass('show');
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    $page.css('opacity', 1);
                });
            });
        },

        close: function () {
            playClose();
            this._isOpen = false;
            var $page = $('#synthesis-page');
            $page.css('opacity', 0);
            var self = this;
            setTimeout(function () {
                $page.removeClass('show');
                $page.css('opacity', '');
            }, 260);
        },

        bindEvents: function () {
            var self = this;

            $(document).on('click', '#synth-back-btn', function () { self.close(); });

            $(document).on('click', '#synth-dropzone', function () {
                var sel = $('.synth-sample-card.selected').data('name');
                if (sel) {
                    $('.synth-sample-card').removeClass('selected');
                    self.place(sel);
                }
            });

            $(document).on('click', '.synth-sample-card.collected', function (e) {
                if (dragData && dragData.moved) { e.preventDefault(); return; }
                var name = $(this).data('name');
                var placed = getPlaced();
                if (placed.indexOf(name) !== -1) return;
                $('.synth-sample-card').removeClass('selected');
                $(this).addClass('selected');
                toast('已选中 ' + (window.I18N ? I18N.trFull(name) : name) + '，点击保温箱放入');
            });

            $(document).on('click', '#synth-restart-btn', function () {
                setPlaced([]);
                setCompleted(false);
                $('#synth-done-banner').removeClass('show');
                self.render();
            });

            $(document).on('touchstart', '#synthesis-page .synth-sample-card.collected .synth-smp-icon', function (e) {
                e.preventDefault(); e.stopPropagation();
                var name = $(this).closest('.synth-sample-card').data('name');
                var placed = getPlaced();
                if (placed.indexOf(name) !== -1) return;
                var t = e.originalEvent.touches[0];
                startDrag(name, t.clientX, t.clientY, $(this));
            });
            $(document).on('touchmove', function (e) {
                if (!dragData) return;
                e.preventDefault();
                var t = e.originalEvent.touches[0];
                moveDrag(t.clientX, t.clientY);
            });
            $(document).on('touchend', function (e) {
                if (!dragData) return;
                e.preventDefault();
                endDrag();
            });

            $(document).on('mousedown', '#synthesis-page .synth-sample-card.collected .synth-smp-icon', function (e) {
                e.preventDefault(); e.stopPropagation();
                var name = $(this).closest('.synth-sample-card').data('name');
                var placed = getPlaced();
                if (placed.indexOf(name) !== -1) return;
                startDrag(name, e.clientX, e.clientY, $(this));
            });
            $(document).on('mousemove', function (e) {
                if (!dragData) return;
                moveDrag(e.clientX, e.clientY);
            });
            $(document).on('mouseup', function () {
                if (!dragData) return;
                endDrag();
            });
        },

        render: function () {
            var self = this;
            this.ensurePage();

            var collected = getCollected();
            var placed = getPlaced();
            var synthCount = getSynthCount();
            var completed = isCompleted();

            $('#synth-page-synthcount').text(synthCount);

            var incubatorImg = INCUBATOR_EMPTY;
            if (completed) incubatorImg = ELS_RESULT;
            else if (placed.length > 0) incubatorImg = INCUBATOR_USED;
            $('#synth-incubator-img').attr('src', incubatorImg);

            var slotsHtml = '';
            for (var i = 0; i < 6; i++) {
                var filled = placed[i];
                if (filled) {
                    var img = SAMPLE_DEFS.filter(function (d) { return d.name === filled; })[0];
                    slotsHtml += '<div class="synth-slot filled"><img src="' + (img ? img.image : '') + '" alt="' + filled + '"></div>';
                } else {
                    slotsHtml += '<div class="synth-slot"></div>';
                }
            }
            $('#synth-slots').html(slotsHtml);

            var gridHtml = '';
            SAMPLE_DEFS.forEach(function (d) {
                var count = collected[d.name] || 0;
                var inIncubator = placed.indexOf(d.name) !== -1;
                var own = count > 0;
                var cls = 'synth-sample-card' + (own ? ' collected' : '') + (inIncubator ? ' placed' : '');
                var tag = inIncubator ? '已放入' : own ? '已收集' : '未收集';
                gridHtml += '<div class="' + cls + '" data-name="' + d.name + '">'
                    + '<span class="synth-smp-icon"><img src="' + d.image + '" alt="' + d.name + '">'
                    + (count > 0 ? '<span class="synth-smp-count">' + count + '</span>' : '')
                    + '</span>'
                    + '<span class="synth-smp-name">' + d.name + '</span>'
                    + '<span class="synth-smp-tag">' + tag + '</span>'
                    + '</div>';
            });
            $('#synth-sample-grid').html(gridHtml);

            if (completed) {
                $('#synth-banner-sub').text('六种样本已全部合成，已合成 ' + synthCount + ' 次');
                $('#synth-done-banner').addClass('show');
            }

            if (placed.length === 6 && !completed) {
                this.complete();
            }
            applyFont();
        },

        complete: function () {
            var count = getSynthCount() + 1;
            setSynthCount(count);
            setCompleted(true);
            // 组装完成ELS奖励 2M（仅计入总累计价值，不影响本周排行榜）
            if (window.__addAccumulatedValueNoWeekly) {
                window.__addAccumulatedValueNoWeekly(2000000);
            }

            $('#synth-incubator-img').attr('src', ELS_RESULT);

            $('#synth-banner-sub').text('六种样本已全部合成，已合成 ' + count + ' 次');
            $('#synth-done-banner').addClass('show');

            $('#synth-page-synthcount').text(count);

            this.render();
        },

        place: function (name) {
            if (SAMPLE_NAMES.indexOf(name) === -1) return;
            var placed = getPlaced();
            if (placed.indexOf(name) !== -1) return;
            if (!isCollected(name)) return;
            // 放入保温箱时立即消耗 1 个
            var collected = getCollected();
            if (!collected[name]) return;
            collected[name] -= 1;
            if (collected[name] <= 0) delete collected[name];
            setCollected(collected);

            placed.push(name);
            setPlaced(placed);
            this.render();
        },

        init: function () {
            if (this._initDone) return;
            this._initDone = true;
            injectStyle();
            this.ensurePage();
            this.bindEvents();

            $(document).on('click', '#sidebar-synthesis-btn', function () { controller.open(); });

            window.addEventListener('synthesisRefresh', function () {
                if (controller._isOpen) controller.render();
            });
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { controller.init(); });
    } else { controller.init(); }

    window.SynthesisController = controller;
})();
