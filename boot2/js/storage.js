/* ============================================================
 * 存档层（第一阶段）
 * 原则：不改任何现有 key 名、不改任何现有数据格式。
 *   1) 代理层：包装 Storage.prototype，写满时不再静默失败，转 IndexedDB 兜底
 *   2) 快照：启动后把全部存档复制到 IndexedDB，滚动保留 3 份
 *   3) 导出 / 导入：供 GM 面板做手动备份
 * 兼容：任何一步失败都回落到原生 localStorage 行为。
 * ============================================================ */
(function (w) {
    'use strict';

    var SNAP_DB = 'ab_save_db';
    var SNAP_STORE = 'snap';
    var PENDING_STORE = 'pending';
    var SNAP_KEEP = 3;
    var SNAP_INTERVAL = 6 * 3600 * 1000; /* 距上一份快照超过 6 小时才再拍 */
    var BIG_ITEM_LIMIT = 3 * 1024 * 1024; /* 单项超过 3MB 不进快照（localStorage 总上限 5MB） */
    var SKIP_RE = /(_cache_v1$|^ab_downloaded_assets$|^__dt_|^__mg_)/;

    var LS = null;
    var nativeSet = null;
    var nativeGet = null;
    var nativeRemove = null;
    var nativeKey = null;

    var pending = Object.create(null);   /* 本次会话内写失败的值，读的时候优先返回 */
    var stat = { reads: 0, writes: 0, fails: 0, recovered: 0, patched: false, lastError: '' };

    try {
        LS = w.localStorage;
        if (LS) {
            LS.getItem('__ab_probe__');
            var proto0 = w.Storage && w.Storage.prototype;
            if (proto0) {
                nativeSet = proto0.setItem;
                nativeGet = proto0.getItem;
                nativeRemove = proto0.removeItem;
                nativeKey = proto0.key;
            }
        }
    } catch (e) {
        LS = null;
    }

    /* ---------------- IndexedDB 基础 ---------------- */

    function openDB() {
        return new Promise(function (resolve, reject) {
            if (!w.indexedDB) { reject(new Error('no indexedDB')); return; }
            var req = w.indexedDB.open(SNAP_DB, 1);
            req.onupgradeneeded = function () {
                var db = req.result;
                if (!db.objectStoreNames.contains(SNAP_STORE)) {
                    db.createObjectStore(SNAP_STORE, { keyPath: 'ts' });
                }
                if (!db.objectStoreNames.contains(PENDING_STORE)) {
                    db.createObjectStore(PENDING_STORE, { keyPath: 'k' });
                }
            };
            req.onsuccess = function () { resolve(req.result); };
            req.onerror = function () { reject(req.error || new Error('idb open failed')); };
        });
    }

    function idbRun(store, mode, fn) {
        return openDB().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(store, mode);
                var out = fn(tx.objectStore(store));
                tx.oncomplete = function () { resolve(out && out.result !== undefined ? out.result : undefined); };
                tx.onerror = function () { reject(tx.error || new Error('idb tx failed')); };
                tx.onabort = function () { reject(tx.error || new Error('idb tx aborted')); };
            });
        });
    }

    function idbList(store) {
        return openDB().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(store, 'readonly');
                var req = tx.objectStore(store).getAll();
                req.onsuccess = function () { resolve(req.result || []); };
                req.onerror = function () { reject(req.error || new Error('idb read failed')); };
            });
        });
    }

    /* ---------------- 写失败兜底 ---------------- */

    function stashPending(k, v) {
        pending[k] = v;
        idbRun(PENDING_STORE, 'readwrite', function (s) {
            s.put({ k: k, v: v, ts: Date.now() });
        }).catch(function () { /* IndexedDB 也不可用时，只能保留内存副本 */ });
    }

    function dropPending(k) {
        if (k in pending) delete pending[k];
        idbRun(PENDING_STORE, 'readwrite', function (s) { s.delete(k); }).catch(function () {});
    }

    /* 上次会话写失败、但没能写回 localStorage 的值，启动时补写 */
    function flushPending() {
        if (!nativeSet || !LS) return Promise.resolve(0);
        return idbList(PENDING_STORE).then(function (rows) {
            var done = 0;
            rows.forEach(function (row) {
                if (!row || !row.k) return;
                try {
                    nativeSet.call(LS, row.k, row.v);
                    stat.recovered++;
                    done++;
                    idbRun(PENDING_STORE, 'readwrite', function (s) { s.delete(row.k); }).catch(function () {});
                } catch (e) {
                    pending[row.k] = row.v;
                }
            });
            return done;
        }).catch(function () { return 0; });
    }

    /* ---------------- 包装 localStorage ---------------- */

    function patch() {
        if (!LS || !w.Storage || !w.Storage.prototype) return false;
        var proto = w.Storage.prototype;
        if (proto.__abSavePatched) { stat.patched = true; return true; }
        try {
            if (typeof nativeSet !== 'function' || typeof nativeGet !== 'function') return false;

            proto.setItem = function (k, v) {
                try {
                    nativeSet.call(this, k, v);
                    stat.writes++;
                    if (this === LS && k in pending) dropPending(k);
                } catch (e) {
                    /* sessionStorage 保持原生行为（继续抛） */
                    if (this !== LS) throw e;
                    stat.fails++;
                    stat.lastError = (e && e.name) || 'write failed';
                    stashPending(k, String(v));
                    if (stat.fails === 1) {
                        try { w.console && console.error('[storage] 写入失败(' + stat.lastError + ')，已转 IndexedDB 兜底:', k); } catch (_) {}
                    }
                    try { w.dispatchEvent(new CustomEvent('ab-storage-full', { detail: { key: k, error: stat.lastError } })); } catch (_) {}
                }
            };

            proto.getItem = function (k) {
                stat.reads++;
                if (this === LS && k in pending) return pending[k];
                return nativeGet.call(this, k);
            };

            proto.removeItem = function (k) {
                if (this === LS && k in pending) dropPending(k);
                return nativeRemove.call(this, k);
            };

            proto.__abSavePatched = true;
            stat.patched = true;
            return true;
        } catch (e) {
            stat.patched = false;
            return false;
        }
    }

    /* ---------------- 快照 ---------------- */

    function collectItems(filter) {
        var items = {};
        var skipped = [];
        if (!LS) return { items: items, skipped: skipped };
        for (var i = 0; i < LS.length; i++) {
            var k = nativeKey ? nativeKey.call(LS, i) : null;
            if (k == null) continue;
            if (filter && filter(k)) continue;
            var v = LS.getItem(k);
            if (v == null) continue;
            if (v.length > BIG_ITEM_LIMIT) { skipped.push(k); continue; }
            items[k] = v;
        }
        return { items: items, skipped: skipped };
    }

    function prune(db) {
        return new Promise(function (resolve) {
            var tx = db.transaction(SNAP_STORE, 'readwrite');
            var store = tx.objectStore(SNAP_STORE);
            var req = store.getAllKeys();
            req.onsuccess = function () {
                var keys = (req.result || []).slice().sort(function (a, b) { return b - a; });
                keys.slice(SNAP_KEEP).forEach(function (k) { store.delete(k); });
            };
            tx.oncomplete = function () { resolve(); };
            tx.onerror = function () { resolve(); };
        });
    }

    function snapshot(reason) {
        if (!LS) return Promise.reject(new Error('no localStorage'));
        var got = collectItems(function (k) { return SKIP_RE.test(k); });
        var rec = {
            ts: Date.now(),
            build: w.HU_BUILD_VERSION || '',
            reason: reason || '',
            count: Object.keys(got.items).length,
            skipped: got.skipped,
            items: got.items
        };
        return openDB().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(SNAP_STORE, 'readwrite');
                tx.objectStore(SNAP_STORE).put(rec);
                tx.oncomplete = function () { resolve(db); };
                tx.onerror = function () { reject(tx.error || new Error('snapshot failed')); };
            });
        }).then(function (db) { return prune(db); }).then(function () { return rec; });
    }

    function listSnapshots() {
        return idbList(SNAP_STORE).then(function (rows) {
            return (rows || []).sort(function (a, b) { return b.ts - a.ts; }).map(function (r) {
                return { ts: r.ts, build: r.build, reason: r.reason, count: r.count, skipped: (r.skipped || []).length };
            });
        }).catch(function () { return []; });
    }

    function restore(ts) {
        return idbList(SNAP_STORE).then(function (rows) {
            var rec = null;
            (rows || []).forEach(function (r) {
                if (ts) { if (r.ts === ts) rec = r; }
                else if (!rec || r.ts > rec.ts) rec = r;
            });
            if (!rec) throw new Error('找不到快照');
            /* 恢复前先给当前状态拍一份，防止二次误操作 */
            return snapshot('before-restore').catch(function () {}).then(function () {
                var n = 0;
                for (var k in rec.items) {
                    if (!Object.prototype.hasOwnProperty.call(rec.items, k)) continue;
                    try { nativeSet.call(LS, k, rec.items[k]); n++; } catch (e) {}
                }
                return { ts: rec.ts, restored: n, build: rec.build };
            });
        });
    }

    /* ---------------- 云同步登记表 ---------------- */
    /* 会被云同步的字段只在这里登记一次，script_new.js 自动跟随，避免漏同步。
       sync: 参与上传/下载；core: 参与「本机是否已有进度」的判定 */
    var SYNC_REGISTRY = {
        'darkzone_simulator_stats': { sync: true, core: true },
        'ab_shop_skills_v1': { sync: true, core: true },
        'ab_collection_room_v1': { sync: true, core: true },
        'ab_collection_room_v1_bak': { sync: true },
        'ab_owned_backgrounds': { sync: true },
        'ab_selected_bg_path': { sync: true },
        'disabled_items_list': { sync: true },
        'ab_skip_search_mask': { sync: true },
        'ab_fps_mode': { sync: true },
        'ab_font_preference': { sync: true }
    };

    function registryKeys(wantCore) {
        var out = [];
        for (var k in SYNC_REGISTRY) {
            if (!Object.prototype.hasOwnProperty.call(SYNC_REGISTRY, k)) continue;
            var cfg = SYNC_REGISTRY[k];
            if (wantCore ? cfg.core : cfg.sync) out.push(k);
        }
        return out;
    }

    /* ---------------- 导出 / 导入 ---------------- */

    function exportFlat() {
        var items = {};
        var skipped = [];
        if (!LS) return { text: '{}', count: 0, skipped: skipped };
        for (var i = 0; i < LS.length; i++) {
            var k = nativeKey ? nativeKey.call(LS, i) : null;
            if (k == null) continue;
            /* 可重建的缓存不进备份，避免几 MB 的公告 HTML 撑爆文本框 */
            if (SKIP_RE.test(k)) { skipped.push(k); continue; }
            var v = LS.getItem(k);
            if (v == null) continue;
            if (v.length > BIG_ITEM_LIMIT) { skipped.push(k); continue; }
            items[k] = v;
        }
        return { text: JSON.stringify(items), count: Object.keys(items).length, skipped: skipped };
    }

    function importFlat(text) {
        var obj;
        try { obj = JSON.parse(text); } catch (e) { throw new Error('JSON 解析失败'); }
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('格式不是 {key: value} 对象');
        return snapshot('before-import').catch(function () {}).then(function () {
            var n = 0, skip = 0;
            for (var k in obj) {
                if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
                if (typeof k !== 'string' || !k || k.length > 200) { skip++; continue; }
                var v = obj[k];
                try {
                    /* 走代理写入：配额不足时仍会转 IndexedDB 兜底 */
                    LS.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
                    n++;
                } catch (e) { skip++; }
            }
            return { imported: n, skipped: skip };
        });
    }

    /* ---------------- 对外接口 ---------------- */

    var Save = {
        get: function (k, fb) {
            if (!LS) return fb;
            var v = LS.getItem(k);
            return v == null ? fb : v;
        },
        getJSON: function (k, fb) {
            var raw = Save.get(k, null);
            if (raw == null) return fb;
            try { return JSON.parse(raw); } catch (e) { return fb; }
        },
        set: function (k, v) {
            if (!LS) return false;
            try {
                LS.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
                return true;
            } catch (e) { return false; }
        },
        setJSON: function (k, obj) {
            return Save.set(k, JSON.stringify(obj));
        },
        remove: function (k) {
            if (!LS) return;
            try { LS.removeItem(k); } catch (e) {}
        },
        keys: function () {
            if (!LS) return [];
            var out = [];
            for (var i = 0; i < LS.length; i++) {
                var k = nativeKey ? nativeKey.call(LS, i) : LS.key(i);
                if (k != null) out.push(k);
            }
            return out;
        },
        exportAll: exportFlat,
        importAll: importFlat,
        syncKeys: function () { return registryKeys(false); },
        syncCoreKeys: function () { return registryKeys(true); },
        snapshot: snapshot,
        listSnapshots: listSnapshots,
        restore: restore,
        status: function () {
            return {
                patched: stat.patched,
                reads: stat.reads,
                writes: stat.writes,
                fails: stat.fails,
                recovered: stat.recovered,
                pending: Object.keys(pending).length,
                lastError: stat.lastError
            };
        },
        /* 启动后空闲时自动拍一份，6 小时内不重复 */
        autoSnapshot: function () {
            var run = function () {
                listSnapshots().then(function (list) {
                    var newest = list.length ? list[0].ts : 0;
                    if (Date.now() - newest < SNAP_INTERVAL) return null;
                    return snapshot('auto').catch(function () { return null; });
                }).catch(function () {});
            };
            var idle = w.requestIdleCallback || function (fn) { return setTimeout(fn, 8000); };
            idle(run, { timeout: 15000 });
        }
    };

    w.Save = Save;

    patch();
    if (LS) {
        flushPending();
        if (w.document && w.document.readyState === 'complete') Save.autoSnapshot();
        else if (w.addEventListener) w.addEventListener('load', function () { Save.autoSnapshot(); });
    }
})(window);
