/* 可视化 Mod 编辑器：表单填写 + 上传图片 → 生成 mod.json + 打包 → 安装/导出 */
(function (w) {
    'use strict';
    function $(id) { return document.getElementById(id); }

    function openModal() {
        try { if (w.ModalRegistry && w.ModalRegistry.open) return w.ModalRegistry.open('mod-editor-modal'); } catch (e) {}
        var m = $('mod-editor-modal');
        if (m) { m.style.display = 'flex'; setTimeout(function () { m.classList.add('show'); }, 10); }
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

    function lbl(t) { return '<div style="font-size:12px;color:#94a3b8;margin-top:6px;">' + t + '</div>'; }

    function addItemRow() {
        var box = $('me-items');
        if (!box) return;
        var n = box.children.length + 1;
        var el = document.createElement('div');
        el.className = 'me-item';
        el.style.cssText = 'border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px;margin-bottom:8px;';
        el.innerHTML =
            '<div style="display:flex;justify-content:space-between;align-items:center;">'
            + '<b style="font-size:13px;">物品 ' + n + '</b>'
            + '<button type="button" class="me-del" style="font-size:12px;color:#f87171;background:none;border:none;cursor:pointer;">删除</button></div>'
            + lbl('名称') + '<input class="input-field" data-k="name" maxlength="12" placeholder="物品名">'
            + lbl('描述') + '<textarea class="input-field" data-k="desc" placeholder="描述（不限字数）"></textarea>'
            + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">'
            + '<div>' + lbl('宽 (1-5)') + '<input type="number" class="input-field" data-k="width" min="1" max="5" value="1"></div>'
            + '<div>' + lbl('高 (1-6)') + '<input type="number" class="input-field" data-k="height" min="1" max="6" value="1"></div>'
            + '<div>' + lbl('价值') + '<input type="number" class="input-field" data-k="value" min="1" value="1000"></div>'
            + '<div>' + lbl('稀有度') + '<select class="input-field" data-k="rarity"><option value="purple">紫</option><option value="gold">金</option><option value="orange">橙</option><option value="red">红</option></select></div>'
            + '<div>' + lbl('爆率权重') + '<input type="number" class="input-field" data-k="weight" min="1" placeholder="可不填"></div>'
            + '<div>' + lbl('图片') + '<input type="file" class="input-field" data-k="image" accept="image/*"></div>'
            + '</div>'
            + '<div class="me-err" style="font-size:12px;color:#f87171;margin-top:4px;"></div>';
        el.querySelector('.me-del').addEventListener('click', function () { el.remove(); });
        box.appendChild(el);
    }

    function readFile(file) {
        return new Promise(function (res, rej) {
            var r = new FileReader();
            r.onload = function () { res(r.result); };
            r.onerror = rej;
            r.readAsArrayBuffer(file);
        });
    }

    async function build(install) {
        if (!w.JSZip) { setMsg('ZIP 组件未加载'); return; }
        var name = ($('me-name').value || '').trim();
        var author = ($('me-author').value || '').trim();
        var version = ($('me-version').value || '').trim() || '1.0.0';
        var desc = $('me-desc').value || '';
        if (!name) return setMsg('请填写 Mod 名称');
        if (!author) return setMsg('请填写作者');
        var rows = Array.prototype.slice.call(document.querySelectorAll('#me-items .me-item'));
        if (!rows.length) return setMsg('请至少添加一个物品');

        var zip = new w.JSZip();
        var items = [];
        for (var i = 0; i < rows.length; i++) {
            var el = rows[i];
            var g = function (k) { var n = el.querySelector('[data-k="' + k + '"]'); return n ? n.value : ''; };
            var nm = (g('name') || '').trim();
            if (!nm) return setMsg('第 ' + (i + 1) + ' 个物品缺少名称');
            var fEl = el.querySelector('[data-k="image"]');
            var f = fEl && fEl.files && fEl.files[0];
            if (!f) return setMsg('第 ' + (i + 1) + ' 个物品缺少图片');
            var ext = (f.name.split('.').pop() || 'png').toLowerCase();
            if (['png', 'jpg', 'jpeg', 'webp'].indexOf(ext) === -1) ext = 'png';
            var imgName = 'item_' + i + '.' + ext;
            var buf = await readFile(f);
            zip.file(imgName, buf);
            var it = {
                id: i + 1, name: nm, desc: g('desc') || '',
                width: parseInt(g('width'), 10) || 1, height: parseInt(g('height'), 10) || 1,
                value: parseInt(g('value'), 10) || 1000, rarity: g('rarity') || 'purple',
                image: imgName
            };
            var wt = parseInt(g('weight'), 10);
            if (wt > 0) it.weight = wt;
            items.push(it);
        }

        var modJson = { name: name.slice(0, 20), author: author.slice(0, 16), version: version.slice(0, 16), type: 'item', desc: desc, items: items };
        zip.file('mod.json', JSON.stringify(modJson));
        setMsg('打包中…', true);

        var blob;
        try { blob = await zip.generateAsync({ type: 'blob' }); }
        catch (e) { return setMsg('打包失败：' + String(e && e.message || e)); }

        if (install) {
            try {
                var meta = await w.ModManager.installFromZip(blob, null);
                setMsg('已安装：' + (meta && meta.name || name), true);
                try { if (w.showToast) w.showToast('Mod 已安装'); } catch (e) {}
                if (w.ModManager) w.ModManager.renderMineList();
                closeModal();
            } catch (e) {
                setMsg('安装失败：' + String(e && e.message || e));
            }
        } else {
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = (name || 'mod') + '.zip';
            document.body.appendChild(a);
            a.click();
            setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);
            setMsg('已导出 zip', true);
        }
    }

    function bind() {
        var open = $('mod-editor-open-btn');
        if (open && !open._bound) {
            open._bound = true;
            open.addEventListener('click', function () {
                openModal();
                if (!document.querySelector('#me-items .me-item')) addItemRow();
            });
        }
        var close = $('mod-editor-close');
        if (close && !close._bound) { close._bound = true; close.addEventListener('click', closeModal); }
        var add = $('me-add-item');
        if (add && !add._bound) { add._bound = true; add.addEventListener('click', addItemRow); }
        var inst = $('me-install');
        if (inst && !inst._bound) { inst._bound = true; inst.addEventListener('click', function () { build(true); }); }
        var exp = $('me-export');
        if (exp && !exp._bound) { exp._bound = true; exp.addEventListener('click', function () { build(false); }); }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();

    w.ModEditor = { open: openModal, close: closeModal, addItem: addItemRow };
})(window);
