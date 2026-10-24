/* 弹窗注册表：所有 modal 的开关音效、动画时长、显示方式只在这里定义一次。
 * 旧代码里 EventManager 与 ModalManager 各存了一份映射，这里合并为单一来源。
 */
(function (w) {
    'use strict';

    var OPEN_SOUNDS = {
        'bg-select-modal': 'audio/open-bg-select.mp3',
        'donate-modal': 'audio/buy.mp3',
        'credits-modal': 'audio/open-credits.mp3',
        'effect-settings-modal': 'audio/open-credits.mp3',
        'sound-settings-modal': 'audio/new-mail.mp3',
        'update-check-modal': 'audio/admin-open.mp3',
        'cloud-sync-modal': 'audio/open-leaderboard.mp3',
        'view-leaderboard-modal': 'audio/open-leaderboard.mp3',
        'music-playlist-modal': 'audio/open-music-playlist.mp3',
        'submit-score-modal': 'audio/open-submit-score.mp3',
        'title-modal': 'audio/open-title.mp3',
        'item-control-modal': 'audio/open-item-control.mp3',
        'custom-confirm-modal': 'audio/open-confirm-disable.mp3',
        'enable-confirm-modal': 'audio/open-confirm-enable.mp3',
        'accumulated-value-modal': 'audio/open-accumulated-value.mp3',
        'collect-page': 'audio/open-collect.mp3',
        'nickname-modal': 'audio/open-nickname.mp3',
        'notification-modal': 'audio/open-notification.mp3',
        'resource-download-modal': 'audio/delete-click.mp3'
    };

    var DEFAULT_OPEN_SOUND = 'audio/sidebar-open.mp3';
    var CLOSE_SOUND = 'audio/sidebar-close.mp3';
    var registry = {};
    var openIds = [];

    function el(id) {
        return document.getElementById(id);
    }

    function play(file, volume) {
        if (!file) return;
        try {
            var audio = new Audio(file);
            audio.volume = volume != null ? volume : (w.__UI_SOUND_VOLUME__ != null ? w.__UI_SOUND_VOLUME__ : 1);
            var p = audio.play();
            if (p && typeof p.catch === 'function') p.catch(function () {});
        } catch (e) {}
    }

    function defaults(id) {
        var node = el(id);
        var fullPage = !!(node && node.classList.contains('app-full-page'));
        return {
            kind: 'modal',
            openSound: OPEN_SOUNDS[id] || DEFAULT_OPEN_SOUND,
            closeSound: CLOSE_SOUND,
            showDelay: 10,
            hideDelay: fullPage ? 360 : 300,
            silent: false
        };
    }

    function register(id, cfg) {
        if (!id) return null;
        var merged = defaults(id);
        if (registry[id]) {
            for (var k in registry[id]) {
                if (Object.prototype.hasOwnProperty.call(registry[id], k)) merged[k] = registry[id][k];
            }
        }
        if (cfg) {
            for (var j in cfg) {
                if (Object.prototype.hasOwnProperty.call(cfg, j)) merged[j] = cfg[j];
            }
        }
        registry[id] = merged;
        return merged;
    }

    function cfgOf(id) {
        return registry[id] || register(id, null);
    }

    function open(id, options) {
        options = options || {};
        var node = el(id);
        if (!node) return false;
        var cfg = cfgOf(id);

        if (!options.silent && !cfg.silent) play(cfg.openSound);

        node.style.display = 'flex';
        if (cfg.kind === 'modal') {
            setTimeout(function () { node.classList.add('show'); }, cfg.showDelay);
        } else {
            node.classList.add('show');
        }
        if (openIds.indexOf(id) === -1) openIds.push(id);
        if (typeof cfg.onOpen === 'function') {
            try { cfg.onOpen(node, options); } catch (e) {}
        }
        return true;
    }

    function close(id, options) {
        options = options || {};
        var node = el(id);
        if (!node) return false;
        var cfg = cfgOf(id);

        if (!options.silent && !cfg.silent) play(cfg.closeSound);

        node.classList.remove('show');
        setTimeout(function () {
            // 期间被重新打开就不要隐藏，避免快速开关时闪一下
            if (!node.classList.contains('show')) node.style.display = 'none';
        }, cfg.hideDelay);
        var pos = openIds.indexOf(id);
        if (pos !== -1) openIds.splice(pos, 1);
        if (typeof cfg.onClose === 'function') {
            try { cfg.onClose(node, options); } catch (e) {}
        }
        return true;
    }

    function isOpen(id) {
        var node = el(id);
        if (!node) return false;
        return node.style.display !== 'none' && node.classList.contains('show');
    }

    function closeAll(exceptId) {
        openIds.slice().forEach(function (id) {
            if (id !== exceptId) close(id, { silent: true });
        });
    }

    // 浮层（物品详情等）定位：先量实际尺寸，再按锚点在视口内钳制。
    // 锚点无效时退回点击坐标，再退回屏幕中心，绝不依赖元素的静态位置。
    function positionPopup(node, anchor, margin) {
        if (!node) return null;
        margin = margin == null ? 8 : margin;
        var prevVisibility = node.style.visibility;

        node.style.visibility = 'hidden';
        if (!node.style.display || node.style.display === 'none') node.style.display = 'flex';
        node.style.left = '0px';
        node.style.top = '0px';

        var rect = node.getBoundingClientRect();
        var pw = rect.width || node.offsetWidth || 0;
        var ph = rect.height || node.offsetHeight || 0;
        var vw = w.innerWidth || document.documentElement.clientWidth || 0;
        var vh = w.innerHeight || document.documentElement.clientHeight || 0;

        var left;
        var top;
        var anchorRect = anchor && anchor.rect;

        if (anchorRect && (anchorRect.width > 0 || anchorRect.height > 0)) {
            left = anchorRect.right + margin;
            top = anchorRect.top + anchorRect.height / 2 - ph / 2;
            if (left + pw > vw - margin) left = anchorRect.left - pw - margin;
        } else if (anchor && isFinite(anchor.x) && isFinite(anchor.y)) {
            left = anchor.x + 12;
            top = anchor.y - ph - 12;
            if (top < margin) top = anchor.y + 16;
        } else {
            left = (vw - pw) / 2;
            top = (vh - ph) / 2;
        }

        left = Math.max(margin, Math.min(left, vw - pw - margin));
        top = Math.max(margin, Math.min(top, vh - ph - margin));

        node.style.left = Math.round(left) + 'px';
        node.style.top = Math.round(top) + 'px';
        node.style.visibility = prevVisibility || '';

        return { left: Math.round(left), top: Math.round(top), width: pw, height: ph };
    }

    function bootstrap() {
        var nodes = document.querySelectorAll('.modal-overlay[id]');
        for (var i = 0; i < nodes.length; i++) {
            register(nodes[i].id, null);
        }
        register('item-tooltip', { kind: 'popup', silent: true, hideDelay: 130 });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }

    w.ModalRegistry = {
        register: register,
        config: cfgOf,
        open: open,
        close: close,
        closeAll: closeAll,
        isOpen: isOpen,
        openList: function () { return openIds.slice(); },
        list: function () {
            var out = [];
            for (var k in registry) {
                if (Object.prototype.hasOwnProperty.call(registry, k)) out.push(k);
            }
            return out;
        },
        positionPopup: positionPopup,
        playSound: play
    };
})(window);
