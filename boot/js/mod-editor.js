/* MOD 编辑器：物品 / 音乐 / 背景 三类，表单填写 + 上传 → 生成 mod.json + 打包 → 安装/导出 */
(function (w) {
    'use strict';
    function $(id) { return document.getElementById(id); }
    var TYPES = {
        item: { list: 'me_item_list', add: 'me_add_item' },
        music: { list: 'me_track_list', add: 'me_add_track' },
        background: { list: 'me_bg_list', add: 'me_add_bg' }
    };
    function T(key) { return (w.I18N && w.I18N.t) ? w.I18N.t(key) : ''; }
    function TN(key, n) { return T(key).replace('{n}', n); }
    function tf(s) { return (w.I18N && w.I18N.trFull) ? w.I18N.trFull(s) : s; }

    function openModal() {
        try { if (w.ModalRegistry && w.ModalRegistry.open) return w.ModalRegistry.open('mod-editor-modal', { zIndex: 10050 }); } catch (e) {}
        var m = $('mod-editor-modal');
        if (m) { m.style.zIndex = 10050; m.style.display = 'flex'; setTimeout(function () { m.classList.add('show'); }, 10); }
    }
    function closeModal() {
        try { if (w.ModalRegistry && w.ModalRegistry.close) return w.ModalRegistry.close('mod-editor-modal'); } catch (e) {}
        var m = $('mod-editor-modal');
        if (m) { m.classList.remove('show'); setTimeout(function () { m.style.display = 'none'; }, 300); }
    }
    function setMsg(t, ok) {
        var m = $('me-msg');
        if (m) { m.textContent = t || ''; m.style.color = ok ? '#34d399' : '#f87171'; }
    }
    function downloadLink(blob, filename) {
        try {
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click();
            setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
            setMsg(T('me_dl_start'), true);
        } catch (e) { setMsg(T('me_export_fail') + String(e && e.message || e)); }
    }
    function downloadBlob(blob, filename) {
        try {
            var file = new File([blob], filename, { type: 'application/zip' });
            if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
                navigator.share({ files: [file], title: filename }).then(function () { setMsg(T('me_saved'), true); })
                    .catch(function () { downloadLink(blob, filename); });
                return;
            }
        } catch (e) {}
        downloadLink(blob, filename);
    }

    function currentType() {
        var t = $('me-type');
        return t ? t.value : 'item';
    }
    function lbl(t) { return '<label class="me-label">' + t + '</label>'; }
    function readFile(file) {
        return new Promise(function (res, rej) {
            var r = new FileReader();
            r.onload = function () { res(r.result); };
            r.onerror = rej;
            r.readAsArrayBuffer(file);
        });
    }
    function extOf(file, allow, def) {
        var ext = ((file.name || '').split('.').pop() || '').toLowerCase();
        return allow.indexOf(ext) !== -1 ? ext : def;
    }

    function wirePreview(el) {
        var prev = el.querySelector('.me-preview');
        if (!prev) return;
        var inputs = el.querySelectorAll('input[type="file"]');
        Array.prototype.forEach.call(inputs, function (inp) {
            inp.addEventListener('change', function () {
                var f = inp.files && inp.files[0];
                prev.innerHTML = '';
                if (!f) return;
                var url = URL.createObjectURL(f);
                var type = f.type || '';
                if (type.indexOf('image') === 0) {
                    var img = document.createElement('img'); img.className = 'me-thumb-img'; img.src = url; prev.appendChild(img);
                } else if (type.indexOf('video') === 0) {
                    var v = document.createElement('video'); v.className = 'me-thumb-img'; v.src = url; v.muted = true; v.playsInline = true; prev.appendChild(v);
                } else if (type.indexOf('audio') === 0) {
                    var b = document.createElement('button'); b.type = 'button'; b.className = 'me-play'; b.innerHTML = '▶ 试听';
                    b.addEventListener('click', function () { try { var a = new Audio(url); a.play(); } catch (e) {} });
                    var s = document.createElement('span'); s.className = 'me-filename'; s.textContent = '🎵 ' + f.name;
                    prev.appendChild(b); prev.appendChild(s);
                } else {
                    var t = document.createElement('span'); t.className = 'me-filename'; t.textContent = f.name; prev.appendChild(t);
                }
            });
        });
    }

    function rowShell(n, title, inner) {
        var el = document.createElement('div');
        el.className = 'me-item';
        el.innerHTML = '<div class="me-item-head"><b>' + title + ' ' + n + '</b><button type="button" class="me-del">删除</button></div>' + inner;
        el.querySelector('.me-del').addEventListener('click', function () { el.remove(); });
        if (el.querySelector('.me-preview')) wirePreview(el);
        return el;
    }

    function addItemRow() {
        var box = $('me-items'); if (!box) return;
        var el = rowShell(box.children.length + 1, T('me_row_item'),
            '<div class="me-grid2">'
            + '<div>' + lbl('名称') + '<input class="input-field" data-k="name" maxlength="12" placeholder="物品名"></div>'
            + '<div>' + lbl('稀有度') + '<select class="input-field" data-k="rarity"><option value="purple">紫</option><option value="gold">金</option><option value="orange">橙</option><option value="red">红</option></select></div>'
            + '<div>' + lbl('宽 (1-5)') + '<input type="number" class="input-field" data-k="width" min="1" max="5" value="1"></div>'
            + '<div>' + lbl('高 (1-6)') + '<input type="number" class="input-field" data-k="height" min="1" max="6" value="1"></div>'
            + '<div>' + lbl('价值') + '<input type="number" class="input-field" data-k="value" min="1" value="1000"></div>'
            + '<div>' + lbl('爆率权重') + '<input type="number" class="input-field" data-k="weight" min="1" placeholder="可不填"></div>'
            + '</div>'
            + lbl('描述') + '<textarea class="input-field" data-k="desc" placeholder="描述（不限字数）"></textarea>'
            + lbl('图片') + '<input type="file" class="input-field" data-k="image" accept="image/*">'
            + lbl('音效（可不填）') + '<input type="file" class="input-field" data-k="sound" accept="audio/*">'
            + '<div class="me-preview"></div>');
        box.appendChild(el);
    }
    function addTrackRow() {
        var box = $('me-items'); if (!box) return;
        var el = rowShell(box.children.length + 1, T('me_row_track'),
            '<div class="me-grid2">'
            + '<div>' + lbl('标题') + '<input class="input-field" data-k="title" maxlength="40" placeholder="曲目标题"></div>'
            + '<div>' + lbl('作者') + '<input class="input-field" data-k="artist" maxlength="40" placeholder="演唱/作者（可不填）"></div>'
            + '</div>'
            + lbl('音频文件') + '<input type="file" class="input-field" data-k="audio" accept="audio/*">'
            + lbl('封面（可不填）') + '<input type="file" class="input-field" data-k="cover" accept="image/*">'
            + '<div class="me-preview"></div>');
        box.appendChild(el);
    }
    function addBgRow() {
        var box = $('me-items'); if (!box) return;
        var el = rowShell(box.children.length + 1, T('me_row_bg'),
            lbl('名称') + '<input class="input-field" data-k="name" maxlength="16" placeholder="背景名称">'
            + lbl('文件（图片/视频）') + '<input type="file" class="input-field" data-k="file" accept="image/*,video/*">'
            + '<div class="me-preview"></div>');
        box.appendChild(el);
    }

    function addRowForType() {
        var t = currentType();
        if (t === 'music') addTrackRow();
        else if (t === 'background') addBgRow();
        else addItemRow();
    }
    function refreshListUI() {
        var t = currentType();
        var cfg = TYPES[t] || TYPES.item;
        var lt = $('me-list-title-text'); if (lt) lt.textContent = T(cfg.list);
        var al = $('me-add-label'); if (al) al.textContent = T(cfg.add);
    }
    function resetListForType() {
        var box = $('me-items'); if (box) box.innerHTML = '';
        refreshListUI();
        addRowForType();
    }

    function gv(el, k) { var n = el.querySelector('[data-k="' + k + '"]'); return n ? n.value : ''; }
    function gf(el, k) { var n = el.querySelector('[data-k="' + k + '"]'); return n && n.files ? n.files[0] : null; }

    async function build(install) {
        if (!w.JSZip) { setMsg('ZIP 组件未加载'); return; }
        var type = currentType();
        var name = ($('me-name').value || '').trim();
        var author = ($('me-author').value || '').trim();
        var version = ($('me-version').value || '').trim() || '1.0.0';
        var desc = $('me-desc').value || '';
        if (!name) return setMsg(T('me_err_name'));
        if (!author) return setMsg(T('me_err_author'));
        var rows = Array.prototype.slice.call(document.querySelectorAll('#me-items .me-item'));
        if (!rows.length) return setMsg(T('me_err_empty'));

        var zip = new w.JSZip();
        var modJson = { name: name.slice(0, 20), author: author.slice(0, 16), version: version.slice(0, 16), type: type, desc: desc };
        try {
            if (type === 'music') {
                var tracks = [];
                for (var i = 0; i < rows.length; i++) {
                    var el = rows[i];
                    var title = (gv(el, 'title') || '').trim();
                    if (!title) return setMsg(TN('me_err_track_title', i + 1));
                    var af = gf(el, 'audio');
                    if (!af) return setMsg(TN('me_err_track_audio', i + 1));
                    var aext = extOf(af, ['mp3', 'm4a', 'aac', 'wav', 'ogg', 'flac'], 'mp3');
                    var an = 'track_' + i + '.' + aext;
                    zip.file(an, await readFile(af));
                    var t = { title: title.slice(0, 40), artist: (gv(el, 'artist') || '').slice(0, 40), file: an };
                    var cf = gf(el, 'cover');
                    if (cf) { var cext = extOf(cf, ['png', 'jpg', 'jpeg', 'webp'], 'jpg'); var cn = 'cover_' + i + '.' + cext; zip.file(cn, await readFile(cf)); t.cover = cn; }
                    tracks.push(t);
                }
                modJson.tracks = tracks;
            } else if (type === 'background') {
                var bgs = [];
                for (var j = 0; j < rows.length; j++) {
                    var be = rows[j];
                    var bn = (gv(be, 'name') || '').trim();
                    if (!bn) return setMsg(TN('me_err_bg_name', j + 1));
                    var bf = gf(be, 'file');
                    if (!bf) return setMsg(TN('me_err_bg_file', j + 1));
                    var bext = extOf(bf, ['png', 'jpg', 'jpeg', 'webp', 'mp4', 'webm'], 'png');
                    var bname = 'bg_' + j + '.' + bext;
                    zip.file(bname, await readFile(bf));
                    bgs.push({ name: bn.slice(0, 16), file: bname });
                }
                modJson.backgrounds = bgs;
            } else {
                var items = [];
                for (var k = 0; k < rows.length; k++) {
                    var ie = rows[k];
                    var nm = (gv(ie, 'name') || '').trim();
                    if (!nm) return setMsg(TN('me_err_item_name', k + 1));
                    var img = gf(ie, 'image');
                    if (!img) return setMsg(TN('me_err_item_img', k + 1));
                    var iext = extOf(img, ['png', 'jpg', 'jpeg', 'webp'], 'png');
                    var iname = 'item_' + k + '.' + iext;
                    zip.file(iname, await readFile(img));
                    var it = {
                        id: k + 1, name: nm.slice(0, 12), desc: gv(ie, 'desc') || '',
                        width: parseInt(gv(ie, 'width'), 10) || 1, height: parseInt(gv(ie, 'height'), 10) || 1,
                        value: parseInt(gv(ie, 'value'), 10) || 1000, rarity: gv(ie, 'rarity') || 'purple', image: iname
                    };
                    var wt = parseInt(gv(ie, 'weight'), 10); if (wt > 0) it.weight = wt;
                    var sf = gf(ie, 'sound');
                    if (sf) {
                        var sext = extOf(sf, ['mp3', 'm4a', 'aac', 'wav', 'ogg'], 'mp3');
                        var sname = 'sound_' + k + '.' + sext;
                        zip.file(sname, await readFile(sf));
                        it.sound = sname;
                    }
                    items.push(it);
                }
                modJson.items = items;
            }
        } catch (e) { return setMsg(T('me_read_fail') + String(e && e.message || e)); }

        zip.file('mod.json', JSON.stringify(modJson));
        setMsg(T('me_packing'), true);
        var blob;
        try { blob = await zip.generateAsync({ type: 'blob' }); }
        catch (e) { return setMsg(T('me_pack_fail') + String(e && e.message || e)); }

        if (install) {
            try {
                var meta = await w.ModManager.installFromZip(blob, null);
                setMsg(T('me_installed') + (meta && meta.name || name), true);
                try { if (w.showToast) w.showToast(T('me_mod_installed')); } catch (e) {}
                if (w.ModManager) w.ModManager.renderMineList();
                closeModal();
            } catch (e) { setMsg(T('me_inst_fail') + String(e && e.message || e)); }
        } else {
            downloadBlob(blob, (name || 'mod') + '.zip');
        }
    }

    function bind() {
        var open = $('mod-editor-open-btn');
        if (open && !open._bound) {
            open._bound = true;
            open.addEventListener('click', function () {
                openModal();
                if (!document.querySelector('#me-items .me-item')) resetListForType();
                else refreshListUI();
            });
        }
        var close = $('mod-editor-close');
        if (close && !close._bound) { close._bound = true; close.addEventListener('click', closeModal); }
        var typeSel = $('me-type');
        if (typeSel && !typeSel._bound) { typeSel._bound = true; typeSel.addEventListener('change', resetListForType); }
        var add = $('me-add-item');
        if (add && !add._bound) { add._bound = true; add.addEventListener('click', addRowForType); }
        var inst = $('me-install');
        if (inst && !inst._bound) { inst._bound = true; inst.addEventListener('click', function () { build(true); }); }
        var exp = $('me-export');
        if (exp && !exp._bound) { exp._bound = true; exp.addEventListener('click', function () { build(false); }); }

        // 防滑动误触输入框：拖拽位移后点击输入框不聚焦（避免键盘开/关引起的界面抽搐）
        var bodyEl = document.querySelector('#mod-editor-modal .me-body');
        if (bodyEl && !bodyEl._scrollBound) {
            bodyEl._scrollBound = true;
            var sx = 0, sy = 0, moved = false;
            bodyEl.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; moved = false; }, true);
            bodyEl.addEventListener('pointermove', function (e) { if (Math.abs(e.clientX - sx) > 8 || Math.abs(e.clientY - sy) > 8) moved = true; }, true);
            bodyEl.addEventListener('click', function (e) {
                var t = e.target;
                if (moved && t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.type === 'file')) {
                    e.preventDefault(); e.stopPropagation();
                }
            }, true);
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();

    w.ModEditor = { open: openModal, close: closeModal, addRow: addRowForType };
})(window);
