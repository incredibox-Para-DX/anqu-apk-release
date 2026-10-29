/* Mod 库核心：清单拉取 / ZIP 下载解析校验 / IndexedDB 存储 / 装载注入 / 本地导入 / UI 渲染
 * 依赖：JSZip（window.JSZip）、jQuery、lodash
 * 虚拟资源路径约定：mods/<modId>/<zip 内相对路径>，由 ModManager.resolvePath 转成 blob URL
 */
(function (w) {
    'use strict';

    var WORKER = 'https://anqu-raw.sdfgasdfgwe7.workers.dev';
    var GH = 'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-mods-resources/main';
    var JD = 'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-mods-resources@main';
    var GITEE_MODS = 'https://gitee.com/HeFunovo/anqu-mods-resources/raw/master';
    var REPO_RAW_MAIN = 'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-apk-release/main';
    var REPO_GITEE = 'https://gitee.com/HeFunovo/anqu-code/raw/master';

    var LIMITS = {
        items: 30,
        tracks: 10,
        bgs: 10,
        screens: 3,
        valueMax: 4000000,
        entries: 200
    };
    var RARITIES = ['purple', 'gold', 'orange', 'red'];
    var TYPES = ['item', 'music', 'background'];

    var DB_NAME = 'anqu_mods';
    var INSTALLED_KEY = 'ab_mods_installed_v1';
    var GUIDE_QQ = '2312367270';
    var TEMPLATE_URL = 'https://gofile.io/d/6L3o4zBS';

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function fmtSize(bytes) {
        bytes = Number(bytes) || 0;
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    }
    function openModal(id, zIndex) {
        var $m = $('#' + id);
        if (!$m.length) return;
        if (w.ModalRegistry) { w.ModalRegistry.open(id, zIndex ? { zIndex: zIndex } : undefined); return; }
        if (zIndex) $m.css('z-index', zIndex);
        $m.css('display', 'flex');
        setTimeout(function () { $m.addClass('show'); }, 10);
    }
    function closeModal(id) {
        var $m = $('#' + id);
        if (!$m.length) return;
        if (w.ModalRegistry) { w.ModalRegistry.close(id); return; }
        $m.removeClass('show');
        setTimeout(function () { $m.css('display', 'none'); }, 300);
    }
    function toast(msg) { if (w.showToast) w.showToast(msg); }

    var ModManager = {
        LIMITS: LIMITS,
        GUIDE_QQ: GUIDE_QQ,
        TEMPLATE_URL: TEMPLATE_URL,
        TEMPLATE_MIRROR: REPO_GITEE + '/tools/mod-template/anqu-mod-template-v1.zip',
        manifestUrls: [
            GITEE_MODS + '/mods.json',
            WORKER + '/incredibox-Para-DX/anqu-mods-resources/main/mods.json',
            GH + '/mods.json',
            JD + '/mods.json'
        ],
        baseUrls: [
            GITEE_MODS + '/',
            JD + '/',
            WORKER + '/incredibox-Para-DX/anqu-mods-resources/main/',
            GH + '/'
        ],
        _db: null,
        _manifest: null,
        _manifestTs: 0,
        MANIFEST_CACHE_KEY: 'ab_mods_manifest_cache_v2',
        SUPA_URL: 'https://fgkfgyudwbhmmrqvtfup.supabase.co',
        SUPA_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZna2ZneXVkd2JobW1ycXZ0ZnVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MTkyODAsImV4cCI6MjA5NzI5NTI4MH0.zcnusHgHSUK3AogYAXaR-9Q2KWuGK6_V7wwhgj1D1PI',
        _dlCounts: null,
        _dlCountsTs: 0,
        bumpDownload: function (modId) {
            if (!modId) return Promise.resolve();
            var self = this;
            return fetch(this.SUPA_URL + '/rest/v1/rpc/increment_mod_download', {
                method: 'POST',
                headers: { 'apikey': this.SUPA_KEY, 'Authorization': 'Bearer ' + this.SUPA_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({ p_mod_id: String(modId) })
            }).then(function (r) { return r.ok ? r.json().catch(function () { return null; }) : null; }).catch(function () { return null; }).then(function () {
                if (self._dlCounts) self._dlCounts[modId] = (self._dlCounts[modId] || 0) + 1;
            });
        },
        fetchDownloadCounts: function (force) {
            var self = this;
            var now = Date.now();
            if (!force && this._dlCounts && now - this._dlCountsTs < 60 * 1000) return Promise.resolve(this._dlCounts);
            return fetch(this.SUPA_URL + '/rest/v1/ab_mod_downloads?select=mod_id,count', {
                headers: { 'apikey': this.SUPA_KEY, 'Authorization': 'Bearer ' + this.SUPA_KEY }
            }).then(function (r) { return r.ok ? r.json() : []; }).then(function (rows) {
                var m = {};
                (rows || []).forEach(function (x) { if (x && x.mod_id != null) m[x.mod_id] = Number(x.count) || 0; });
                self._dlCounts = m; self._dlCountsTs = Date.now();
                return m;
            }).catch(function () { return self._dlCounts || {}; });
        },
        _blobUrls: {},
        _meta: {},        // modId -> meta（含 enabled）
        _itemsCache: null,
        _bgCache: null,
        _storeFilter: 'all',
        _storeSearch: '',
        _storeSort: 'default',
        SEEN_KEY: 'ab_mods_seen_v1',
        _modSig: function (x) { return String(x.id) + '@' + String(x.version || '') + '#' + String(x.updatedAt || x.publishedAt || x.time || x.hash || ''); },
        _setNewModDot: function (show) {
            var el = document.getElementById('mod-new-dot');
            if (el) el.style.display = show ? 'block' : 'none';
        },
        checkNewMods: function () {
            var self = this;
            return this.fetchManifest().then(function (m) {
                if (!m || !Array.isArray(m.mods)) return false;
                var seen = {};
                try { seen = JSON.parse(localStorage.getItem(self.SEEN_KEY) || '{}') || {}; } catch (e) {}
                var hasNew = m.mods.some(function (x) { return seen[x.id] !== self._modSig(x); });
                self._setNewModDot(hasNew);
                return hasNew;
            }).catch(function () { return false; });
        },
        markModsSeen: function (m) {
            if (!m || !Array.isArray(m.mods)) return;
            var seen = {};
            try { seen = JSON.parse(localStorage.getItem(this.SEEN_KEY) || '{}') || {}; } catch (e) {}
            var self = this;
            m.mods.forEach(function (x) { seen[x.id] = self._modSig(x); });
            try { localStorage.setItem(this.SEEN_KEY, JSON.stringify(seen)); } catch (e) {}
            this._setNewModDot(false);
        },
        _currentTab: 'mine',
        _detailId: null,

        /* ---------- IndexedDB ---------- */
        openDB: function () {
            var self = this;
            if (this._db) return Promise.resolve(this._db);
            return new Promise(function (resolve, reject) {
                if (!w.indexedDB) { reject(new Error('当前环境不支持本地存储')); return; }
                var req = indexedDB.open(DB_NAME, 1);
                req.onupgradeneeded = function (e) {
                    var db = e.target.result;
                    if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'id' });
                    if (!db.objectStoreNames.contains('assets')) db.createObjectStore('assets', { keyPath: 'path' });
                };
                req.onsuccess = function (e) { self._db = e.target.result; resolve(self._db); };
                req.onerror = function () { reject(req.error || new Error('打开本地存储失败')); };
            });
        },
        _tx: function (store, mode, fn) {
            return this.openDB().then(function (db) {
                return new Promise(function (resolve, reject) {
                    var tx = db.transaction(store, mode);
                    var os = tx.objectStore(store);
                    var out = fn(os);
                    tx.oncomplete = function () { resolve(out && out.result !== undefined ? out.result : out); };
                    tx.onerror = function () { reject(tx.error); };
                    tx.onabort = function () { reject(tx.error); };
                });
            });
        },
        getAllMeta: function () {
            return this._tx('meta', 'readonly', function (os) {
                var res = [];
                var o = { result: res };
                os.openCursor().onsuccess = function (e) {
                    var c = e.target.result;
                    if (!c) return;
                    res.push(c.value);
                    c.continue();
                };
                return o;
            });
        },
        getAsset: function (path) {
            return this._tx('assets', 'readonly', function (os) {
                return os.get(path);
            });
        },
        putAssets: function (records) {
            var self = this;
            if (!records.length) return Promise.resolve();
            return this.openDB().then(function (db) {
                return new Promise(function (resolve, reject) {
                    var tx = db.transaction('assets', 'readwrite');
                    var os = tx.objectStore('assets');
                    records.forEach(function (r) { os.put(r); });
                    tx.oncomplete = function () { resolve(); };
                    tx.onerror = function () { reject(tx.error); };
                });
            });
        },
        putMeta: function (meta) {
            var self = this;
            return this.openDB().then(function (db) {
                return new Promise(function (resolve, reject) {
                    var tx = db.transaction('meta', 'readwrite');
                    tx.objectStore('meta').put(meta);
                    tx.oncomplete = function () { resolve(); };
                    tx.onerror = function () { reject(tx.error); };
                });
            });
        },
        deleteMetaAndAssets: function (modId) {
            var self = this;
            return this.openDB().then(function (db) {
                return new Promise(function (resolve, reject) {
                    var tx = db.transaction(['meta', 'assets'], 'readwrite');
                    tx.objectStore('meta').delete(modId);
                    var os = tx.objectStore('assets');
                    var prefix = 'mods/' + modId + '/';
                    os.openCursor().onsuccess = function (e) {
                        var c = e.target.result;
                        if (!c) return;
                        if (String(c.key).indexOf(prefix) === 0) c.delete();
                        c.continue();
                    };
                    tx.oncomplete = function () { resolve(); };
                    tx.onerror = function () { reject(tx.error); };
                });
            });
        },

        /* ---------- 已安装注册表（localStorage 仅存开关状态） ---------- */
        getInstalled: function () {
            try { return JSON.parse(localStorage.getItem(INSTALLED_KEY) || '{}') || {}; } catch (e) { return {}; }
        },
        saveInstalled: function (obj) {
            try { localStorage.setItem(INSTALLED_KEY, JSON.stringify(obj)); } catch (e) {}
        },
        isInstalled: function (id) { return !!this._meta[id]; },
        isEnabled: function (id) { return !!(this._meta[id] && this._meta[id].enabled); },

        _fetchTimeout: function (url, ms) {
            if (typeof AbortController === 'undefined') return fetch(url, { cache: 'no-store' });
            var ctl = new AbortController();
            var t = setTimeout(function () { ctl.abort(); }, ms || 6000);
            return fetch(url, { cache: 'no-store', signal: ctl.signal }).then(function (r) {
                clearTimeout(t); return r;
            }, function (e) { clearTimeout(t); throw e; });
        },

        /* ---------- 清单 ---------- */
        fetchManifest: function (force) {
            var self = this;
            var now = Date.now();
            if (!force && this._manifest && now - this._manifestTs < 5 * 60 * 1000) {
                return Promise.resolve(this._manifest);
            }
            function tryOne(base) {
                return ModManager._fetchTimeout(base, 6000)
                    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
                    .then(function (m) { if (!m || !Array.isArray(m.mods)) throw new Error('bad manifest'); return m; })
                    .catch(function () { return null; });
            }
            // 三路并发取最高 version：各线路（raw / jsDelivr）缓存刷新时间不一致，
            // 串行取首个成功会拿到旧清单（例如只含早期模组）
            var tasks = this.manifestUrls.map(tryOne);
            return Promise.all(tasks).then(function (list) {
                var best = null;
                list.forEach(function (m) {
                    if (!m) return;
                    if (!best || (Number(m.version) || 0) > (Number(best.version) || 0)) best = m;
                });
                if (best) {
                    // 本地持久化的已知最佳清单：网络只拿到旧版本时用它，避免市场凭空少模组
                    var cached = null;
                    try { cached = JSON.parse(localStorage.getItem(self.MANIFEST_CACHE_KEY) || 'null'); } catch (e) {}
                    if (cached && Array.isArray(cached.mods) && (Number(cached.version) || 0) > (Number(best.version) || 0)) {
                        self._manifest = cached;
                        self._manifestTs = Date.now();
                        return cached;
                    }
                    self._manifest = best;
                    self._manifestTs = Date.now();
                    try { localStorage.setItem(self.MANIFEST_CACHE_KEY, JSON.stringify({ version: best.version, mods: best.mods })); } catch (e) {}
                    return best;
                }
                // 全部失败：优先用内存、再回退到本地缓存
                if (self._manifest && Array.isArray(self._manifest.mods) && self._manifest.mods.length) {
                    return self._manifest;
                }
                try {
                    var c2 = JSON.parse(localStorage.getItem(self.MANIFEST_CACHE_KEY) || 'null');
                    if (c2 && Array.isArray(c2.mods) && c2.mods.length) return c2;
                } catch (e) {}
                return { version: 0, mods: [] };
            });
        },

        /* ---------- ZIP 下载 ---------- */
        downloadZip: function (relFile) {
            var bases = this.baseUrls.slice();
            function tryOne(i) {
                if (i >= bases.length) return Promise.reject(new Error('全部下载线路失败'));
                var url = bases[i] + relFile;
                return ModManager._fetchTimeout(url, 8000).then(function (r) {
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    return r.blob();
                }).catch(function (e) { return tryOne(i + 1); });
            }
            return tryOne(0);
        },
        // 带进度的下载（XHR onprogress），多线路回退
        downloadZipProgress: function (relFile, onProgress) {
            var bases = this.baseUrls.slice();
            function tryOne(i) {
                if (i >= bases.length) return Promise.reject(new Error('全部下载线路失败'));
                var url = bases[i] + relFile;
                return new Promise(function (resolve, reject) {
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', url, true);
                    xhr.responseType = 'blob';
                    var stall = setTimeout(function () { try { xhr.abort(); } catch (e) {} reject(new Error('timeout')); }, 10000);
                    xhr.onprogress = function (e) {
                        if (e.lengthComputable && onProgress) { clearTimeout(stall); onProgress(e.loaded, e.total); }
                    };
                    xhr.onload = function () {
                        clearTimeout(stall);
                        if (xhr.status >= 200 && xhr.status < 300 && xhr.response && xhr.response.size > 1000) resolve(xhr.response);
                        else reject(new Error('HTTP ' + xhr.status + ' size ' + (xhr.response ? xhr.response.size : 0)));
                    };
                    xhr.onerror = function () { clearTimeout(stall); reject(new Error('network')); };
                    xhr.onabort = function () { clearTimeout(stall); reject(new Error('abort')); };
                    xhr.send();
                }).catch(function () { return tryOne(i + 1); });
            }
            return tryOne(0);
        },

        /* ---------- 校验 ---------- */
        _checkText: function (v, max, name) {
            v = String(v == null ? '' : v).trim();
            if (!v) return name + '不能为空';
            if ([...v].length > max) return name + '超过 ' + max + ' 字';
            return '';
        },
        validate: function (json, zip, zipSize) {
            var err = '';
            if (typeof json !== 'object' || !json) return 'mod.json 格式错误';
            if (!TYPES.includes(json.type)) return 'type 必须是 item / music / background';
            err = this._checkText(json.name, 20, '模组名称'); if (err) return err;
            err = this._checkText(json.author, 16, '作者名'); if (err) return err;
            err = this._checkText(json.version, 16, '版本号'); if (err) return err;
            // 模组简介不限字数（仅需为字符串）
            if (json.desc != null && typeof json.desc !== 'string') json.desc = String(json.desc);

            function normPath(p) {
                p = String(p || '').replace(/\\/g, '/').replace(/^\.\//, '');
                if (!p || p.indexOf('..') !== -1 || p.charAt(0) === '/') return '';
                return p;
            }
            function zipEntry(p) {
                var f = zip.file(p);
                return f || null;
            }
            function checkImage(p, label) {
                var f = zipEntry(p);
                if (!f) return (label || p) + ' 在 zip 内不存在';
                if (!/\.(png|jpe?g|webp)$/i.test(p)) return (label || p) + ' 必须是 png/jpg/webp';
                return '';
            }

            // 展示图（thumb.png / avatar.png 可选，缺失时用占位）
            var screenCount = 0;
            for (var s = 1; s <= LIMITS.screens; s++) if (zipEntry('screen-' + s + '.png')) screenCount++;

            if (json.type === 'item') {
                if (!Array.isArray(json.items) || !json.items.length) return 'items 不能为空';
                if (json.items.length > LIMITS.items) return '物品数量超过 ' + LIMITS.items + ' 个';
                for (var i = 0; i < json.items.length; i++) {
                    var it = json.items[i] || {};
                    var tag = '第 ' + (i + 1) + ' 个物品：';
                    err = this._checkText(it.name, 12, tag + '名称'); if (err) return err;
                    // 道具简介不限字数（仅需为字符串）
                    if (it.desc != null && typeof it.desc !== 'string') it.desc = String(it.desc);
                    var wd = parseInt(it.width, 10), ht = parseInt(it.height, 10);
                    if (!(wd >= 1 && wd <= 5)) return tag + 'width 必须是 1~5';
                    if (!(ht >= 1 && ht <= 6)) return tag + 'height 必须是 1~6';
                    var val = parseInt(it.value, 10);
                    if (!(val >= 1 && val <= LIMITS.valueMax)) return tag + 'value 必须是 1~' + LIMITS.valueMax;
                    if (!RARITIES.includes(it.rarity)) return tag + 'rarity 必须是 purple/gold/orange/red';
                    if (it.weight != null && it.weight !== '') {
                        var wt = parseInt(it.weight, 10);
                        if (!(wt >= 1 && wt <= 1000000)) return tag + 'weight 必须是 1~1000000 的整数';
                    }
                    var ip = normPath(it.image);
                    if (!ip) return tag + 'image 路径非法';
                    err = checkImage(ip, tag + '图片'); if (err) return err;
                    if (it.sound) {
                        var sp = normPath(it.sound);
                        if (!sp || !zipEntry(sp)) return tag + '音效文件不存在';
                        if (!/\.(mp3|m4a|aac|wav|ogg)$/i.test(sp)) return tag + '音效必须是 mp3/wav/ogg 等格式';
                    }
                }
            } else if (json.type === 'music') {
                if (!Array.isArray(json.tracks) || !json.tracks.length) return 'tracks 不能为空';
                if (json.tracks.length > LIMITS.tracks) return '曲目数量超过 ' + LIMITS.tracks + ' 首';
                for (var t = 0; t < json.tracks.length; t++) {
                    var tr = json.tracks[t] || {};
                    var tg = '第 ' + (t + 1) + ' 首：';
                    err = this._checkText(tr.title, 40, tg + '标题'); if (err) return err;
                    var tp = normPath(tr.file);
                    if (!tp || !zipEntry(tp)) return tg + '音频文件不存在';
                    if (!/\.(mp3|m4a|aac|wav|ogg|flac)$/i.test(tp)) return tg + '音频格式不支持';
                }
            } else {
                if (!Array.isArray(json.backgrounds) || !json.backgrounds.length) return 'backgrounds 不能为空';
                if (json.backgrounds.length > LIMITS.bgs) return '背景数量超过 ' + LIMITS.bgs + ' 个';
                for (var b = 0; b < json.backgrounds.length; b++) {
                    var bg = json.backgrounds[b] || {};
                    var bgTag = '第 ' + (b + 1) + ' 个背景：';
                    err = this._checkText(bg.name, 16, bgTag + '名称'); if (err) return err;
                    var bp = normPath(bg.file);
                    if (!bp || !zipEntry(bp)) return bgTag + '文件不存在';
                    if (!/\.(png|jpe?g|webp|mp4|webm)$/i.test(bp)) return bgTag + '必须是图片或视频';
                }
            }
            return '';
        },

        _mimeOf: function (p) {
            var m = /\.([a-z0-9]+)$/i.exec(p);
            var ext = m ? m[1].toLowerCase() : '';
            return {
                png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
                mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', wav: 'audio/wav',
                ogg: 'audio/ogg', flac: 'audio/flac',
                mp4: 'video/mp4', webm: 'video/webm'
            }[ext] || 'application/octet-stream';
        },

        /* ---------- 安装 ---------- */
        installFromZip: function (zipBlob, listMeta) {
            var self = this;
            if (!w.JSZip) return Promise.reject(new Error('ZIP 解析组件未加载'));
            var zip = null, modJson = null, modId = null, storedBytes = 0, wrote = false;
            var assetRecs = [];
            var idOverride = listMeta && listMeta.id ? String(listMeta.id) : null;

            function readFile(name) {
                var f = zip.file(name);
                if (!f) return Promise.resolve(null);
                return f.async('blob');
            }

            // 已上架模组用清单 id（稳定），本地导入用内容哈希（防重复安装）
            var hashReady = this._hashBlob(zipBlob);
            var idReady = idOverride ? Promise.resolve(idOverride)
                : hashReady.then(function (h) { return 'mod_' + h + '_' + zipBlob.size.toString(36); });
            var contentHash = '';

            return Promise.all([idReady, hashReady]).then(function (res) {
                modId = res[0];
                contentHash = res[1];
                if (self._meta[modId]) throw new Error('该模组已安装，如需重装请先删除');
                // 相同内容（换了个来源/id）也拦截
                var dupId = null;
                Object.keys(self._meta).forEach(function (k) {
                    if (!dupId && self._meta[k].hash && self._meta[k].hash === contentHash) dupId = k;
                });
                if (dupId) throw new Error('相同内容的模组已安装（' + self._meta[dupId].name + '），如需重装请先删除');
                return w.JSZip.loadAsync(zipBlob);
            }).then(function (z) {
                zip = z;
                var names = Object.keys(z.files).filter(function (n) { return !z.files[n].dir; });
                if (names.length > LIMITS.entries) throw new Error('zip 内文件数超过 ' + LIMITS.entries);
                var namesLow = names.map(function (n) { return n.toLowerCase(); });
                // mod.json 可能在根目录或唯一一级子目录
                var modPath = names.find(function (n) { return /^mod\.json$/i.test(n); });
                if (!modPath) {
                    var nested = names.find(function (n) { return /^[^/]+\/mod\.json$/i.test(n); });
                    if (nested) modPath = nested;
                }
                if (!modPath) throw new Error('zip 内缺少 mod.json');
                var rootDir = modPath.indexOf('/') === -1 ? '' : modPath.replace(/mod\.json$/i, '');
                // 统一把子目录根忽略：读取时优先 rootDir
                function resolveName(n) {
                    if (rootDir && zip.file(rootDir + n)) return rootDir + n;
                    if (zip.file(n)) return n;
                    return null;
                }
                return zip.file(modPath).async('string').then(function (txt) {
                    try { modJson = JSON.parse(txt); } catch (e) { throw new Error('mod.json 不是合法 JSON（常见原因：多写了逗号或引号）'); }
                    // 校验用 rootDir 映射后的 zip
                    var proxy = { file: function (n) { var real = resolveName(n); return real ? zip.file(real) : null; } };
                    var err = self.validate(modJson, proxy, zipBlob.size);
                    if (err) throw new Error(err);

                    // modId 已在入口确定（清单 id 或内容哈希）
                    var tasks = [];
                    // 展示资源
                    ['thumb.png', 'avatar.png', 'screen-1.png', 'screen-2.png', 'screen-3.png'].forEach(function (n) {
                        tasks.push(readFile(resolveName(n) || n).then(function (blob) {
                            if (!blob) return;
                            var path = 'mods/' + modId + '/' + n;
                            storedBytes += blob.size;
                            assetRecs.push({ path: path, blob: blob, mime: self._mimeOf(n) });
                        }));
                    });
                    // 内容资源
                    var contentFiles = [];
                    if (modJson.type === 'item') {
                        modJson.items.forEach(function (it) { contentFiles.push(it.image); if (it.sound) contentFiles.push(it.sound); });
                    } else if (modJson.type === 'music') {
                        modJson.tracks.forEach(function (tr) { if (tr.cover) contentFiles.push(tr.cover); contentFiles.push(tr.file); });
                    } else {
                        modJson.backgrounds.forEach(function (bg) { contentFiles.push(bg.file); });
                    }
                    contentFiles.forEach(function (rel) {
                        rel = String(rel || '').replace(/\\/g, '/').replace(/^\.\//, '');
                        if (!rel || rel.indexOf('..') !== -1) return;
                        tasks.push(readFile(resolveName(rel) || rel).then(function (blob) {
                            if (!blob) return;
                            var path = 'mods/' + modId + '/' + rel;
                            storedBytes += blob.size;
                            assetRecs.push({ path: path, blob: blob, mime: self._mimeOf(rel) });
                        }));
                    });
                    return Promise.all(tasks);
                }).then(function () {
                    var meta = {
                        id: modId,
                        hash: contentHash,
                        name: String(modJson.name).trim(),
                        author: String(modJson.author).trim(),
                        version: String(modJson.version).trim(),
                        type: modJson.type,
                        desc: String(modJson.desc).trim(),
                        size: zipBlob.size,
                        storedBytes: storedBytes,
                        installedAt: Date.now(),
                        enabled: true,
                        itemDefs: modJson.type === 'item' ? modJson.items : [],
                        trackDefs: modJson.type === 'music' ? modJson.tracks : [],
                        bgDefs: modJson.type === 'background' ? modJson.backgrounds : [],
                        thumbs: {
                            thumb: resolveNameStatic('thumb.png'),
                            avatar: resolveNameStatic('avatar.png'),
                            screens: screenList()
                        }
                    };
                    function resolveNameStatic(n) { return zip.file(n) ? n : null; }
                    function screenList() {
                        var out = [];
                        for (var i = 1; i <= LIMITS.screens; i++) {
                            var n = 'screen-' + i + '.png';
                            if (zip.file(n)) out.push(n);
                        }
                        return out;
                    }
                    // 修正展示资源路径（若 zip 有外层目录，上面 readFile 用的是 resolveName 的真实名，
                    // 但存 blob 时统一用标准名，故元数据里用标准名）
                    meta.thumbs = { thumb: zip.file('thumb.png') ? 'thumb.png' : null, avatar: zip.file('avatar.png') ? 'avatar.png' : null, screens: screenList() };

                    return self.putAssets(assetRecs).then(function () { return self.putMeta(meta); }).then(function () {
                        self._meta[modId] = meta;
                        wrote = true;
                        self.invalidateCache();
                        // 关键：预载新安装资源的 blob URL，否则物品图片为空
                        return self.preloadBlobs();
                    }).then(function () {
                        return self.applyMod(meta).then(function () {
                            return meta;
                        });
                    });
                });
            }).catch(function (e) {
                // 仅在已开始写入时清理，避免误删已安装的同 id 模组
                if (wrote && modId) {
                    self.deleteMetaAndAssets(modId).catch(function () {});
                    delete self._meta[modId];
                }
                throw e;
            });
        },

        _hashBlob: function (blob) {
            return blob.arrayBuffer().then(function (buf) {
                var a = new Uint8Array(buf), h = 2166136261 >>> 0;
                for (var i = 0; i < a.length; i++) { h ^= a[i]; h = Math.imul(h, 16777619) >>> 0; }
                return ('00000000' + h.toString(16)).slice(-8);
            });
        },

        /* ---------- GM：ZIP 直传 GitHub 仓库 ---------- */
        GM_REPO: 'incredibox-Para-DX/anqu-mods-resources',
        GM_BRANCH: 'main',
        _ghApi: function (token, method, path, body) {
            return fetch('https://api.github.com' + path, {
                method: method,
                headers: {
                    'Authorization': 'token ' + token,
                    'Accept': 'application/vnd.github+json',
                    'Content-Type': 'application/json'
                },
                body: body ? JSON.stringify(body) : undefined
            }).then(function (r) {
                if (!r.ok) return r.text().then(function (t) {
                    var msg = t;
                    try { msg = JSON.parse(t).message || t; } catch (e) {}
                    throw new Error('GitHub ' + r.status + '：' + String(msg).slice(0, 120));
                });
                return r.status === 204 ? {} : r.json();
            });
        },
        _b64: function (buf) {
            var bytes = new Uint8Array(buf), bin = '', chunk = 0x8000;
            for (var i = 0; i < bytes.length; i += chunk) {
                bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
            }
            return btoa(bin);
        },
        _ghPutFile: function (token, path, base64, message) {
            var self = this;
            var api = '/repos/' + this.GM_REPO + '/contents/' + path;
            return this._ghApi(token, 'GET', api + '?ref=' + this.GM_BRANCH).then(function (info) {
                return self._ghApi(token, 'PUT', api, { message: message, content: base64, branch: self.GM_BRANCH, sha: info.sha });
            }).catch(function (e) {
                // 文件不存在时直接新建
                if (String(e.message).indexOf('404') === -1) throw e;
                return self._ghApi(token, 'PUT', api, { message: message, content: base64, branch: self.GM_BRANCH });
            });
        },
        gmUploadZip: function (file, token, onStatus) {
            var self = this;
            var st = onStatus || function () {};
            if (!token) return Promise.reject(new Error('请先填写 GitHub Token'));
            if (!/\.zip$/i.test(file.name || '')) return Promise.reject(new Error('请选择 zip 文件'));
            st('解析 zip…');
            var createdEntry = null;
            return w.JSZip.loadAsync(file).then(function (zip) {
                var names = Object.keys(zip.files).filter(function (n) { return !zip.files[n].dir; });
                var modPath = names.find(function (n) { return /^mod\.json$/i.test(n); })
                    || names.find(function (n) { return /^[^/]+\/mod\.json$/i.test(n); });
                if (!modPath) throw new Error('zip 内缺少 mod.json');
                var rootDir = modPath.indexOf('/') === -1 ? '' : modPath.replace(/mod\.json$/i, '');
                function resolveName(n) {
                    if (rootDir && zip.file(rootDir + n)) return rootDir + n;
                    if (zip.file(n)) return n;
                    return null;
                }
                return zip.file(modPath).async('string').then(function (txt) {
                    var mod;
                    try { mod = JSON.parse(txt); } catch (e) { throw new Error('mod.json 不是合法 JSON'); }
                    var proxy = { file: function (n) { var real = resolveName(n); return real ? zip.file(real) : null; } };
                    var err = self.validate(mod, proxy, file.size);
                    if (err) throw new Error(err);
                    var slug = 'mod_' + Date.now().toString(36);
                    var jobs = [];
                    jobs.push({ path: 'mods/' + slug + '/mod.zip', asyncB64: file.arrayBuffer().then(function (b) { return self._b64(b); }) });
                    var screens = [];
                    function add(name, dest) {
                        var real = resolveName(name);
                        if (!real) return false;
                        jobs.push({ path: 'mods/' + slug + '/' + dest, asyncB64: zip.file(real).async('arraybuffer').then(function (b) { return self._b64(b); }) });
                        return true;
                    }
                    add('thumb.png', 'thumb.png');
                    add('avatar.png', 'avatar.png');
                    for (var i = 1; i <= 3; i++) {
                        if (add('screen-' + i + '.png', 'screen-' + i + '.png')) screens.push('mods/' + slug + '/screen-' + i + '.png');
                    }
                    var entry = {
                        id: slug,
                        name: String(mod.name).trim(),
                        type: mod.type,
                        author: String(mod.author).trim(),
                        version: String(mod.version).trim(),
                        desc: String(mod.desc).trim(),
                        size: file.size,
                        file: 'mods/' + slug + '/mod.zip',
                        thumb: 'mods/' + slug + '/thumb.png',
                        avatar: 'mods/' + slug + '/avatar.png',
                        screens: screens,
                        updatedAt: Date.now()
                    };
                    createdEntry = entry;
                    var seq = Promise.resolve();
                    jobs.forEach(function (job, idx) {
                        seq = seq.then(function () {
                            st('上传文件 ' + (idx + 1) + '/' + (jobs.length + 1) + '：' + job.path.split('/').pop());
                            return job.asyncB64.then(function (b64) {
                                return self._ghPutFile(token, job.path, b64, '上传模组文件 ' + job.path);
                            });
                        });
                    });
                    return seq.then(function () {
                        st('更新 mods.json…');
                        var api = '/repos/' + self.GM_REPO + '/contents/mods.json';
                        return self._ghApi(token, 'GET', api + '?ref=' + self.GM_BRANCH).then(function (info) {
                            var raw;
                            try { raw = decodeURIComponent(escape(atob(String(info.content || '').replace(/\n/g, '')))); } catch (e) { raw = '{}'; }
                            var manifest;
                            try { manifest = JSON.parse(raw); } catch (e) { manifest = { version: 0, mods: [] }; }
                            manifest.version = (Number(manifest.version) || 0) + 1;
                            manifest.mods = (manifest.mods || []).filter(function (m) { return m && m.id !== entry.id; }).concat([entry]);
                            var b64 = self._b64(new TextEncoder().encode(JSON.stringify(manifest, null, 2)).buffer);
                            return self._ghApi(token, 'PUT', api, { message: '发布模组：' + entry.name, content: b64, branch: self.GM_BRANCH, sha: info.sha });
                        });
                    });
                });
            }).then(function () {
                st('完成');
                self._manifestTs = 0;
                return self.fetchManifest(true);
            }).then(function () { return createdEntry; });
        },

        /* ---------- 资源路径解析 ---------- */
        resolvePath: function (path) {
            if (!path || typeof path !== 'string') return path;
            if (path.indexOf('mods/') !== 0) return path;
            if (this._blobUrls[path]) return this._blobUrls[path];
            return ''; // 异步预载未完成时返回空，调用方兜底
        },
        isModPath: function (path) { return typeof path === 'string' && path.indexOf('mods/') === 0; },
        isModVideo: function (path) {
            var rec = this.getBgRecord(path);
            return !!(rec && rec.isVideo);
        },
        getBgRecord: function (path) {
            var metas = this._meta;
            for (var id in metas) {
                var m = metas[id];
                if (m.type !== 'background') continue;
                for (var i = 0; i < m.bgDefs.length; i++) {
                    if ('mods/' + id + '/' + String(m.bgDefs[i].file).replace(/^\.\//, '') === path) {
                        return { isVideo: /\.(mp4|webm)$/i.test(m.bgDefs[i].file) };
                    }
                }
            }
            return null;
        },
        // 预载所有资源 blob URL（页面启动或安装后）
        preloadBlobs: function () {
            var self = this;
            return this.openDB().then(function (db) {
                return new Promise(function (resolve) {
                    var tx = db.transaction('assets', 'readonly');
                    var req = tx.objectStore('assets').openCursor();
                    req.onsuccess = function (e) {
                        var c = e.target.result;
                        if (!c) { resolve(); return; }
                        var rec = c.value;
                        if (rec && rec.path && !self._blobUrls[rec.path]) {
                            try {
                                self._blobUrls[rec.path] = URL.createObjectURL(
                                    rec.blob.type ? rec.blob : new Blob([rec.blob], { type: rec.mime || 'application/octet-stream' })
                                );
                            } catch (e2) {}
                        }
                        c.continue();
                    };
                    req.onerror = function () { resolve(); };
                });
            });
        },

        /* ---------- 注入 ---------- */
        invalidateCache: function () {
            this._itemsCache = null;
            this._bgCache = null;
        },
        getEnabledItems: function () {
            if (this._itemsCache) return this._itemsCache;
            var out = [];
            var self = this;
            var hook = w.__modHooks || {};
            Object.keys(this._meta).forEach(function (id) {
                var m = self._meta[id];
                if (m.type !== 'item' || !m.enabled) return;
                m.itemDefs.forEach(function (def, idx) {
                    var imgPath = 'mods/' + id + '/' + String(def.image).replace(/^\.\//, '');
                    var imgUrl = self.resolvePath(imgPath);
                    out.push({
                        id: 'mod_' + id + '_' + idx,
                        name: String(def.name),
                        fullName: String(def.name),
                        width: parseInt(def.width, 10),
                        height: parseInt(def.height, 10),
                        value: Math.min(parseInt(def.value, 10) || 1, LIMITS.valueMax),
                        image: imgUrl || '',
                        rarity: def.rarity,
                        sound: def.sound ? (self.resolvePath('mods/' + id + '/' + String(def.sound).replace(/^\.\//, '')) || '') : '',
                        desc: String(def.desc || ''),
                        imgScale: 1.0,
                        isSample: false,
                        isMod: true,
                        modId: id,
                        searchTime: hook.searchTime ? hook.searchTime(def.rarity) : 0.25,
                        weight: (def.weight != null && parseInt(def.weight, 10) > 0) ? parseInt(def.weight, 10) : (hook.calcWeight ? hook.calcWeight(parseInt(def.value, 10) || 1) : 10)
                    });
                });
            });
            this._itemsCache = out;
            return out;
        },
        getEnabledBackgrounds: function () {
            if (this._bgCache) return this._bgCache;
            var out = [];
            var self = this;
            Object.keys(this._meta).forEach(function (id) {
                var m = self._meta[id];
                if (m.type !== 'background' || !m.enabled) return;
                m.bgDefs.forEach(function (def, idx) {
                    out.push({
                        id: 'mod_' + id + '_bg_' + idx,
                        name: String(def.name),
                        path: 'mods/' + id + '/' + String(def.file).replace(/^\.\//, ''),
                        price: 0,
                        _isMod: true
                    });
                });
            });
            this._bgCache = out;
            return out;
        },
        // 追加背景（供 script_new 的 loadBackgrounds/初始化后调用）
        applyBackgroundsToManager: function () {
            if (w.__modHooks && w.__modHooks.appendModBackgrounds) {
                w.__modHooks.appendModBackgrounds(this.getEnabledBackgrounds());
            }
        },
        // 音乐：把启用中 Mod 的曲目写入 ab_custom_music 并挂到播放列表
        applyMusic: function (meta) {
            return this._applyMusicMeta(meta).catch(function () {});
        },
        _applyMusicMeta: function (meta) {
            var self = this;
            var player = w.musicPlayer;
            if (!player || !player.openCustomMusicDB) return Promise.resolve();
            return player.openCustomMusicDB().then(function (db) {
                var seq = Promise.resolve();
                meta.trackDefs.forEach(function (tr, i) {
                    seq = seq.then(function () {
                        var recId = 'mod_' + meta.id + '_' + i;
                        var audioPath = 'mods/' + meta.id + '/' + String(tr.file).replace(/^\.\//, '');
                        return self.getAsset(audioPath).then(function (rec) {
                            if (!rec || !rec.blob) return;
                            var coverPath = tr.cover ? 'mods/' + meta.id + '/' + String(tr.cover).replace(/^\.\//, '') : null;
                            var coverBlob = null, coverType = '';
                            var p = coverPath ? self.getAsset(coverPath).then(function (c) {
                                if (c && c.blob) { coverBlob = c.blob; coverType = c.mime || 'image/png'; }
                            }) : Promise.resolve();
                            return p.then(function () {
                                var record = {
                                    id: recId,
                                    title: String(tr.title || 'Mod 曲目'),
                                    artist: String(tr.artist || meta.author || 'Mod'),
                                    name: String(tr.title || 'Mod 曲目'),
                                    type: rec.mime || 'audio/mpeg',
                                    blob: rec.blob,
                                    size: rec.blob.size,
                                    coverBlob: coverBlob,
                                    coverType: coverType,
                                    addedAt: Date.now(),
                                    isMod: true,
                                    modId: meta.id
                                };
                                return new Promise(function (resolve) {
                                    var tx = db.transaction('tracks', 'readwrite');
                                    tx.objectStore('tracks').put(record);
                                    tx.oncomplete = function () { resolve(); };
                                    tx.onerror = function () { resolve(); };
                                }).then(function () {
                                    if (player.appendCustomTrack) player.appendCustomTrack(record);
                                });
                            });
                        });
                    });
                });
                return seq;
            });
        },
        unapplyMusic: function (meta) {
            var player = w.musicPlayer;
            if (!player) return Promise.resolve();
            var ids = {};
            meta.trackDefs.forEach(function (tr, i) { ids['mod_' + meta.id + '_' + i] = true; });
            var cur = player.playlist[player.currentTrackIndex];
            var removedCurrent = !!(cur && cur.isCustom && ids[cur.customId]);
            // 从播放列表 / customTracks 移除
            for (var i = player.playlist.length - 1; i >= 0; i--) {
                var t = player.playlist[i];
                if (t && t.isCustom && ids[t.customId]) {
                    try { if (t._blobUrl) URL.revokeObjectURL(t._blobUrl); } catch (e) {}
                    try { if (t._coverBlobUrl) URL.revokeObjectURL(t._coverBlobUrl); } catch (e) {}
                    player.playlist.splice(i, 1);
                }
            }
            try {
                player.customTracks = (player.customTracks || []).filter(function (t) { return !(t && ids[t.customId]); });
            } catch (e) {}
            if (removedCurrent) {
                // 删除/停用后不再播放：停止当前音频，不自动切歌
                try { player.audio.pause(); } catch (e) {}
                player.isPlaying = false;
                player.userPaused = true;
                try { player.audio.removeAttribute('src'); player.audio.load(); } catch (e) {}
                player.currentTrackIndex = 0;
                player._audioTrackIndex = 0;
                if (player.playlist.length && typeof player.loadTrack === 'function') {
                    try { player.loadTrack(0, false); } catch (e) {}
                }
            } else if (player.currentTrackIndex >= player.playlist.length) {
                player.currentTrackIndex = Math.max(0, player.playlist.length - 1);
            }
            return player.openCustomMusicDB().then(function (db) {
                return new Promise(function (resolve) {
                    var tx = db.transaction('tracks', 'readwrite');
                    var os = tx.objectStore('tracks');
                    Object.keys(ids).forEach(function (rid) { os.delete(rid); });
                    tx.oncomplete = function () { resolve(); };
                    tx.onerror = function () { resolve(); };
                });
            }).catch(function () {});
        },
        // 应用一个 Mod（安装后 / 启动恢复）
        applyMod: function (meta) {
            var self = this;
            var promises = [];
            if (meta.type === 'item') {
                self.invalidateCache();
                if (w.__modHooks && w.__modHooks.refreshItemPool) w.__modHooks.refreshItemPool();
                if (w.__modHooks && w.__modHooks.resetBoard) w.__modHooks.resetBoard();
            } else if (meta.type === 'background') {
                self.invalidateCache();
                self.applyBackgroundsToManager();
                if (w.__modHooks && w.__modHooks.clearModBackgroundIfCurrent) w.__modHooks.clearModBackgroundIfCurrent(meta.id);
            } else if (meta.type === 'music') {
                promises.push(self.applyMusic(meta));
            }
            return Promise.all(promises);
        },
        unapplyMod: function (meta) {
            if (meta.type === 'item') {
                this.invalidateCache();
                if (w.__modHooks && w.__modHooks.refreshItemPool) w.__modHooks.refreshItemPool();
                if (w.__modHooks && w.__modHooks.resetBoard) w.__modHooks.resetBoard();
            } else if (meta.type === 'background') {
                this.invalidateCache();
                this.applyBackgroundsToManager();
                if (w.__modHooks && w.__modHooks.clearModBackgroundIfCurrent) w.__modHooks.clearModBackgroundIfCurrent(meta.id);
            } else if (meta.type === 'music') {
                return this.unapplyMusic(meta);
            }
            return Promise.resolve();
        },

        /* ---------- 开关 / 删除 ---------- */
        toggle: function (id) {
            var meta = this._meta[id];
            if (!meta) return Promise.reject(new Error('模组不存在'));
            meta.enabled = !meta.enabled;
            var self = this;
            return this.putMeta(meta).then(function () {
                return meta.enabled ? self.applyMod(meta) : self.unapplyMod(meta);
            }).then(function () {
                toast(meta.enabled ? '已启用「' + meta.name + '」' : '已停用「' + meta.name + '」');
            });
        },
        remove: function (id) {
            var self = this;
            var meta = this._meta[id];
            if (!meta) return Promise.resolve();
            // 先移除注册与缓存并刷新物品池，避免残留（unapply 依赖 _meta 状态）
            delete this._meta[id];
            this.invalidateCache();
            if (w.__modHooks && w.__modHooks.refreshItemPool) {
                try { w.__modHooks.refreshItemPool(); } catch (e) {}
            }
            if (meta.type === 'background') {
                try { this.applyBackgroundsToManager(); } catch (e) {}
                if (w.__modHooks && w.__modHooks.clearModBackgroundIfCurrent) w.__modHooks.clearModBackgroundIfCurrent(id);
            }
            return this.unapplyMusicIfNeeded(meta).catch(function () {}).then(function () {
                Object.keys(self._blobUrls).forEach(function (p) {
                    if (p.indexOf('mods/' + id + '/') === 0) {
                        try { URL.revokeObjectURL(self._blobUrls[p]); } catch (e) {}
                        delete self._blobUrls[p];
                    }
                });
                return self.deleteMetaAndAssets(id).catch(function () {});
            }).then(function () {
                // 与 IndexedDB 对齐一次，避免内存与存储脱节导致列表错乱
                return self.getAllMeta().then(function (list) {
                    var fresh = {};
                    list.forEach(function (m) { fresh[m.id] = m; });
                    self._meta = fresh;
                    self.invalidateCache();
                }).catch(function () {});
            }).then(function () {
                self.renderMineList();
                self.renderStoreList();
            });
        },
        unapplyMusicIfNeeded: function (meta) {
            if (meta && meta.type === 'music') return this.unapplyMusic(meta).catch(function () {});
            return Promise.resolve();
        },
        getSpaceUsage: function () {
            var total = 0, count = 0;
            for (var id in this._meta) { total += Number(this._meta[id].storedBytes) || 0; count++; }
            return { bytes: total, count: count };
        },

        /* ---------- 启动 ---------- */
        init: function () {
            var self = this;
            // 启动时先载入本地缓存清单，市场可立即展示（网络回来后自动更新）
            try {
                var c = JSON.parse(localStorage.getItem(this.MANIFEST_CACHE_KEY) || 'null');
                if (c && Array.isArray(c.mods) && c.mods.length) { this._manifest = c; this._manifestTs = 0; }
            } catch (e) {}
            return this.openDB().then(function () { return self.getAllMeta(); }).then(function (list) {
                list.forEach(function (m) { self._meta[m.id] = m; });
                return self.preloadBlobs();
            }).then(function () {
                // 恢复启用中的 Mod
                var seq = Promise.resolve();
                Object.keys(self._meta).forEach(function (id) {
                    var m = self._meta[id];
                    if (m.enabled) seq = seq.then(function () { return self.applyMod(m); });
                });
                return seq;
            }).then(function () {
                self.renderMineList();
                self.renderStoreList();
                self.checkNewMods();
            }).catch(function () {});
        },

        /* ---------- UI ---------- */
        openLibrary: function () {
            this.switchTab(this._currentTab || 'mine');
            openModal('mod-library-page');
            this.renderMineList();
            this.renderStoreList();
        },
        switchTab: function (tab) {
            if (tab === 'import') tab = this._currentTab || 'mine'; // 导入不走页面切换
            this._currentTab = tab;
            $('#mod-library-page .mod-tab-btn').removeClass('active');
            $('#mod-library-page .mod-tab-btn[data-tab="' + tab + '"]').addClass('active');
            $('#mod-tab-mine, #mod-tab-store').hide();
            $('#mod-tab-' + tab).show();
            if (tab === 'store') { this.renderStoreList(); this.markModsSeen(this._manifest); }
            if (tab === 'mine') this.renderMineList();
        },
        /* 远程图片：离屏预载成功后再显示，彻底避免换线路时的闪动 */
        _imgResolved: {},
        _assetImg: function (path, cls, alt) {
            if (!path) return '';
            return '<img data-modpath="' + esc(path) + '" class="mod-img ' + (cls || '') + '" alt="' + esc(alt || '') + '">';
        },
        // 为 root 内所有待加载的模组远程图片做预载（优先用已验证线路）
        _loadModImgs: function (root) {
            var self = this;
            var imgs = (root || document).querySelectorAll('img[data-modpath]');
            Array.prototype.forEach.call(imgs, function (im) {
                if (im.getAttribute('data-loading') === '1') return;
                im.setAttribute('data-loading', '1');
                var path = im.getAttribute('data-modpath');
                var known = self._imgResolved[path];
                var candidates = known ? [known] : self.baseUrls.map(function (b) { return b + path; });
                (function tryNext(i) {
                    if (i >= candidates.length) { im.style.visibility = 'hidden'; return; }
                    var probe = new Image();
                    var done = false;
                    var timer = setTimeout(function () {
                        if (done) return;
                        done = true; probe.src = ''; tryNext(i + 1);
                    }, 3000);
                    probe.onload = function () {
                        if (done) return;
                        done = true; clearTimeout(timer);
                        if (!probe.naturalWidth) { tryNext(i + 1); return; }
                        self._imgResolved[path] = candidates[i];
                        im.src = candidates[i];
                        im.classList.add('mod-img-loaded');
                    };
                    probe.onerror = function () {
                        if (done) return;
                        done = true; clearTimeout(timer);
                        tryNext(i + 1);
                    };
                    probe.src = candidates[i];
                })(0);
            });
        },
        _bindImgFallback: function () { /* 旧回退机制已由 _loadModImgs 取代 */ },

        _metaToListShape: function (m) {
            return {
                id: m.id, name: m.name, type: m.type, author: m.author, version: m.version,
                desc: m.desc, size: m.size, file: '', thumb: '', avatar: '', screens: []
            };
        },
        // 统一风格确认弹窗（替代原生 confirm）
        _confirm: function (text, onOk) {
            var $m = $('#mod-confirm-modal');
            if (!$m.length) $m = $(this._confirmHtml());
            $m.find('#mod-confirm-text').text(text);
            $m.find('#mod-confirm-ok').off('click').on('click', function () {
                closeModal('mod-confirm-modal');
                setTimeout(onOk, 60);
            });
            openModal('mod-confirm-modal', 10100);
        },
        _confirmHtml: function () {
            var html = '<div class="modal-overlay" id="mod-confirm-modal">' +
                '<div class="modal-content mod-confirm-content">' +
                '<div class="modal-header"><div class="modal-title"><i class="fas fa-triangle-exclamation" style="color:#f59e0b"></i> 确认操作</div>' +
                '<button class="modal-close" id="mod-confirm-close">&times;</button></div>' +
                '<div class="modal-body" style="text-align:center;padding:18px 16px;"><div id="mod-confirm-text" class="mod-confirm-text"></div></div>' +
                '<div class="modal-footer" style="justify-content:center;gap:12px;padding:0 16px 16px;">' +
                '<button class="modal-btn" id="mod-confirm-cancel" style="min-width:110px;">取消</button>' +
                '<button class="modal-btn danger" id="mod-confirm-ok" style="min-width:110px;">确定</button></div>' +
                '</div></div>';
            var $m = $(html).appendTo('body');
            $m.find('#mod-confirm-close, #mod-confirm-cancel').on('click', function () { closeModal('mod-confirm-modal'); });
            $m.on('click', function (e) { if ($(e.target).is(this)) closeModal('mod-confirm-modal'); });
            return $m;
        },
        hideDetail: function () {
            if (this._detailTimer) { clearInterval(this._detailTimer); this._detailTimer = null; }
            closeModal('mod-detail-modal');
        },

        _thumbUrl: function (id, name) {
            var p = 'mods/' + id + '/' + name;
            return this._blobUrls[p] || '';
        },
        renderMineList: function () {
            var self = this;
            var $list = $('#mod-mine-list');
            if (!$list.length) return;
            var usage = this.getSpaceUsage();
            $('#mod-space-summary').text('已用 ' + fmtSize(usage.bytes) + ' · 共 ' + usage.count + ' 个模组');
            $list.empty();
            var ids = Object.keys(this._meta).sort(function (a, b) {
                return (Number(self._meta[a].installedAt) || 0) - (Number(self._meta[b].installedAt) || 0);
            });
            if (!ids.length) {
                $list.html('<div class="mod-empty">还没有安装的 Mod<br><span>去「MOD市场」下载，或在「从本地导入MOD」导入 zip</span></div>');
                return;
            }
            ids.forEach(function (id) {
                var m = self._meta[id];
                var thumb = m.thumbs && m.thumbs.thumb ? self._thumbUrl(id, m.thumbs.thumb) : '';
                var typeName = { item: '物品', music: '音乐', background: '背景' }[m.type] || m.type;
                var $row = $(
                    '<div class="mod-row" data-id="' + esc(id) + '">' +
                    '<div class="mod-row-thumb">' + (thumb ? '<img src="' + thumb + '" alt="">' : '<i class="fas fa-box"></i>') + '</div>' +
                    '<div class="mod-row-main">' +
                    '<div class="mod-row-name">' + esc(m.name) + ' <span class="mod-type-badge">' + typeName + '</span></div>' +
                    '<div class="mod-row-sub">' + fmtSize(m.storedBytes) + ' · ' + esc(m.author) + '</div>' +
                    '</div>' +
                    '<label class="switch mod-switch"><input type="checkbox" ' + (m.enabled ? 'checked' : '') + '><span class="slider round"></span></label>' +
                    '<button class="mod-del-btn" title="删除"><i class="fas fa-trash-alt"></i></button>' +
                    '</div>'
                );
                $row.find('.mod-switch').on('click', function (e) { e.stopPropagation(); });
                $row.find('.mod-switch input').on('change', function (e) {
                    e.stopPropagation();
                    self.toggle(id).then(function () { self.renderMineList(); self.renderStoreList(); }).catch(function (e2) { toast(String(e2.message || e2)); });
                });
                $row.find('.mod-del-btn').on('click', function (e) {
                    e.stopPropagation();
                    self._confirm('确定删除「' + m.name + '」？删除后需重新下载。', function () {
                        self.remove(id).then(function () {
                            toast('已删除');
                            self.renderMineList();
                            self.renderStoreList();
                        });
                    });
                });
                // 点击行主体 / 缩略图查看详情（已安装模组的详情）
                $row.on('click', function () { self.openDetail(self._metaToListShape(m)); });
                $row.find('.mod-row-thumb, .mod-row-main').css('cursor', 'pointer');
                $list.append($row);
            });
        },
        _storeSeq: 0,
        renderStoreList: function () {
            var self = this;
            var $list = $('#mod-store-list');
            if (!$list.length) return;
            var seq = ++this._storeSeq;
            Promise.all([this.fetchManifest(), this.fetchDownloadCounts()]).then(function (res) {
                var m0 = res[0], counts = res[1] || {};
                // 丢弃过期渲染（并发调用时只保留最新一次）
                if (seq !== self._storeSeq) return;
                // 拿到的清单为空但内存里还有上次成功的数据 → 用旧的，不清空列表
                var m = m0;
                if ((!m || !m.mods || !m.mods.length) && self._manifest && self._manifest.mods && self._manifest.mods.length) {
                    m = self._manifest;
                }
                if (!m || !Array.isArray(m.mods)) m = { version: 0, mods: [] };
                // 相同数据不重复渲染（避免切页缩略图闪动）；已安装状态变化会进 key
                var key = [m.version, self._storeFilter, self._storeSearch, self._storeSort, Object.keys(self._meta).join(',')].join('|');
                if (self._storeRenderKey === key && $list.children().length) return;
                self._storeRenderKey = key;
                var items = (m.mods || []).filter(function (x) {
                    if (self._storeFilter !== 'all' && x.type !== self._storeFilter) return false;
                    var kw = self._storeSearch.trim().toLowerCase();
                    if (!kw) return true;
                    // 搜索只匹配名称与作者，不包含简介
                    return (String(x.name || '') + ' ' + String(x.author || '')).toLowerCase().indexOf(kw) !== -1;
                });
                $list.empty();
                if (!items.length) {
                    $list.html('<div class="mod-empty">暂无模组<br><span>' + (m.mods && m.mods.length ? '没有符合筛选条件的模组' : '官方 Mod 仓库尚未配置或无内容') + '</span></div>');
                    return;
                }
                if (self._storeSort === 'new') {
                    items.sort(function (a, b) { return (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0); });
                } else if (self._storeSort === 'hot') {
                    items.sort(function (a, b) { return (counts[b.id] || 0) - (counts[a.id] || 0); });
                }
                items.forEach(function (x) {
                    var installed = self.isInstalled(x.id);
                    var typeName = { item: '物品', music: '音乐', background: '背景' }[x.type] || x.type;
                    var $row = $(
                        '<div class="mod-row" data-id="' + esc(x.id) + '">' +
                        '<div class="mod-row-thumb">' + (x.thumb ? self._assetImg(x.thumb) : '<i class="fas fa-box"></i>') + '</div>' +
                        '<div class="mod-row-main">' +
                        '<div class="mod-row-name">' + esc(x.name) + ' <span class="mod-type-badge">' + typeName + '</span>' + (installed ? '<span class="mod-installed-badge">已安装</span>' : '') + '<span class="mod-dl-count" style="font-size:11px;color:#8b949e;margin-left:6px;">⬇ ' + (counts[x.id] || 0) + '</span></div>' +
                        '<div class="mod-row-desc">' + esc(x.desc) + '</div>' +
                        '</div>' +
                        '<button class="mod-detail-btn">详情</button>' +
                        '</div>'
                    );
                    $row.find('.mod-detail-btn, .mod-row-thumb, .mod-row-main').on('click', function () { self.openDetail(x); });
                    $list.append($row);
                });
                // 列表图片可能插入前就已失败，插入后统一扫一次
                self._loadModImgs($list[0]);
            });
        },
        openDetail: function (x) {
            var self = this;
            this._detailId = x.id;
            var installed = this.isInstalled(x.id);
            var meta = this._meta[x.id];
            var typeName = { item: '物品', music: '音乐', background: '背景' }[x.type] || x.type;
            var avatarUrl = x.avatar ? (this.baseUrls[0] + x.avatar) : '';
            var avatarHtml = '';
            if (installed && meta && meta.thumbs && meta.thumbs.avatar) {
                avatarHtml = '<img src="' + esc(this._thumbUrl(x.id, meta.thumbs.avatar)) + '" alt="">';
            } else if (x.avatar) {
                avatarHtml = this._assetImg(x.avatar);
            }
            var screenUrls = [];
            if (installed && meta && meta.thumbs && meta.thumbs.screens) {
                meta.thumbs.screens.forEach(function (n) { screenUrls.push(self._thumbUrl(x.id, n)); });
            }
            screenUrls = screenUrls.filter(Boolean).slice(0, LIMITS.screens);
            var remoteScreens = [];
            if (!screenUrls.length && Array.isArray(x.screens)) {
                remoteScreens = x.screens.slice(0, LIMITS.screens);
            }

            var screensHtml = '';
            var screenCount = screenUrls.length || remoteScreens.length;
            if (screenCount) {
                var screenItems = screenUrls.length
                    ? screenUrls.map(function (u) { return '<div class="mod-screen"><img src="' + esc(u) + '" loading="lazy" alt=""></div>'; })
                    : remoteScreens.map(function (p) { return '<div class="mod-screen">' + self._assetImg(p, '', '') + '</div>'; });
                screensHtml = '<div class="mod-detail-screens">' + screenItems.join('') + '</div>' +
                    (screenCount > 1 ? '<div class="mod-screen-dots">' + screenItems.map(function (_, i) {
                        return '<i class="' + (i === 0 ? 'active' : '') + '"></i>';
                    }).join('') + '</div>' : '');
            }

            var actionHtml;
            if (installed) {
                var m = meta;
                actionHtml = '<div class="mod-detail-action">' +
                    '<label class="switch mod-switch"><input type="checkbox" id="mod-detail-toggle" ' + (m.enabled ? 'checked' : '') + '><span class="slider round"></span></label>' +
                    '<span class="mod-detail-toggle-label">' + (m.enabled ? '已启用' : '已停用') + '</span>' +
                    '<button class="modal-btn danger" id="mod-detail-del" style="margin-left:auto;"><i class="fas fa-trash-alt"></i> 删除</button>' +
                    '</div>';
            } else {
                actionHtml = '<button class="modal-btn primary full-width" id="mod-detail-download"><i class="fas fa-download"></i> 下载并安装</button>' +
                    '<div id="mod-dl-progress" style="display:none;margin-top:8px;"><div style="height:6px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden;"><div id="mod-dl-progress-bar" style="height:100%;width:0;background:#248DFB;transition:width .15s;"></div></div><div id="mod-dl-progress-text" style="font-size:11px;color:#94a3b8;margin-top:4px;"></div></div>';
            }

            $('#mod-detail-body').html(
                '<div class="mod-detail-author">' +
                '<div class="mod-detail-avatar">' + (avatarHtml || (avatarUrl ? '<img src="' + esc(avatarUrl) + '" alt="">' : '<i class="fas fa-user"></i>')) + '</div>' +
                '<div><div class="mod-detail-author-name">' + esc(x.author || '未知作者') + '</div>' +
                '<div class="mod-detail-meta">' + typeName + ' · ' + fmtSize(x.size) + ' · v' + esc(x.version || '1.0.0') + '</div></div></div>' +
                '<div class="mod-detail-name">' + esc(x.name) + '</div>' +
                screensHtml +
                '<div class="mod-detail-desc">' + esc(x.desc || '') + '</div>' +
                actionHtml
            );
            // 翻页圆点 + 5 秒自动轮播
            var $scr = $('#mod-detail-body .mod-detail-screens');
            if (this._detailTimer) { clearInterval(this._detailTimer); this._detailTimer = null; }
            if ($scr.length) {
                $scr.on('scroll', function () {
                    var idx = Math.round(this.scrollLeft / Math.max(1, this.clientWidth));
                    $scr.next('.mod-screen-dots').find('i').removeClass('active').eq(idx).addClass('active');
                });
                if (screenCount > 1) {
                    var total = screenCount;
                    this._detailTimer = setInterval(function () {
                        var el = $scr[0];
                        if (!el || !document.body.contains(el)) {
                            if (self._detailTimer) { clearInterval(self._detailTimer); self._detailTimer = null; }
                            return;
                        }
                        var idx = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
                        idx = (idx + 1) % total;
                        el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' });
                    }, 5000);
                }
            }
            var $dl = $('#mod-detail-download');
            if ($dl.length) {
                $dl.on('click', function () {
                    if ($dl.data('busy')) return;
                    $dl.data('busy', 1).prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> 下载中…');
                    var $prog = $('#mod-dl-progress'), $bar = $('#mod-dl-progress-bar'), $ptext = $('#mod-dl-progress-text');
                    if ($prog.length) $prog.show();
                    self.downloadZipProgress(x.file, function (loaded, total) {
                        var pct = total ? Math.round(loaded / total * 100) : 0;
                        $bar.css('width', pct + '%');
                        $ptext.text('下载中 ' + pct + '%（' + fmtSize(loaded) + ' / ' + fmtSize(total) + '）');
                    }).then(function (blob) {
                        $bar.css('width', '100%');
                        $ptext.text('安装中…');
                        $dl.html('<i class="fas fa-spinner fa-spin"></i> 安装中…');
                        return self.installFromZip(blob, x, 'download');
                    }).then(function () {
                        try { self.bumpDownload(x.id); } catch (e) {}
                        toast('已安装「' + x.name + '」');
                        try { if (window.Telemetry) Telemetry.event('mod_install', { id: x.id, type: x.type }); } catch (e) {}
                        self.hideDetail();
                        self.renderMineList();
                        self.renderStoreList();
                    }).catch(function (e) {
                        toast('下载失败：' + String(e.message || e));
                        $dl.data('busy', 0).prop('disabled', false).html('<i class="fas fa-download"></i> 下载并安装');
                    });
                });
            }
            $('#mod-detail-del').on('click', function () {
                self._confirm('确定删除「' + x.name + '」？删除后需重新下载。', function () {
                    self.remove(x.id).then(function () {
                        toast('已删除');
                        self.hideDetail();
                        self.renderMineList();
                        self.renderStoreList();
                    });
                });
            });
            $('#mod-detail-toggle').on('change', function () {
                self.toggle(x.id).then(function () {
                    self.hideDetail();
                    self.renderMineList();
                    self.renderStoreList();
                }).catch(function (e) { toast(String(e.message || e)); });
            });
            // 详情弹窗必须显示在 Mod 库整页（z-index 10001）之上
            openModal('mod-detail-modal', 10050);
            // 详情内远程图片同样挂超时兜底
            this._loadModImgs(document.getElementById('mod-detail-body'));
        },
        importLocalFile: function (file) {
            var self = this;
            if (!file) return;
            if (!/\.zip$/i.test(file.name || '')) { toast('请选择 zip 文件'); return; }
            toast('正在校验并安装…');
            this.installFromZip(file, null).then(function (meta) {
                toast('已导入「' + meta.name + '」' + (meta.enabled ? '（已启用）' : ''));
                self.renderMineList();
                self.renderStoreList();
                self.switchTab('mine');
            }).catch(function (e) {
                toast('导入失败：' + String(e.message || e));
            });
        },

        /* ---------- 事件绑定 ---------- */
        bind: function () {
            var self = this;
            if ($('#sidebar-mod-library-btn').length) {
                $('#sidebar-mod-library-btn').on('click', function () { self.openLibrary(); });
            }
            if ($('#mod-doc-btn').length) {
                $('#mod-doc-btn').on('click', function () { openModal('mod-guide-page', 10060); });
            }
            $('#mod-guide-close').on('click', function () { closeModal('mod-guide-page'); });
            $('#mod-library-close').on('click', function () { closeModal('mod-library-page'); });
            $('#mod-detail-close').on('click', function () { self.hideDetail(); });
            $('#mod-detail-modal').on('click', function (e) { if ($(e.target).is(this)) self.hideDetail(); });
            // 复制模板链接（仅允许复制访问，不提供内置直接下载）
            $('#mod-template-copy').on('click', function () {
                var url = self.TEMPLATE_URL;
                if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast('链接已复制'); });
                else toast(url);
            });
            $('#mod-qq-copy').on('click', function () {
                if (navigator.clipboard) navigator.clipboard.writeText(GUIDE_QQ).then(function () { toast('QQ 已复制：' + GUIDE_QQ); });
                else toast('QQ：' + GUIDE_QQ);
            });
            // tab 切换（导入按钮单独处理）
            $('#mod-library-page').on('click', '.mod-tab-btn[data-tab]', function () {
                self.switchTab($(this).data('tab'));
            });
            // 搜索 & 筛选
            $('#mod-store-search').on('input', function () {
                self._storeSearch = this.value || '';
                self.renderStoreList();
            });
            $('#mod-store-filter').on('click', '.mod-filter-btn', function () {
                $(this).addClass('active').siblings().removeClass('active');
                self._storeFilter = $(this).data('f') || 'all';
                self.renderStoreList();
            });
            // 排序：默认 / 最新 / 最热
            $('#mod-store-sort').on('click', '.mod-filter-btn[data-s]', function () {
                $(this).addClass('active').siblings().removeClass('active');
                self._storeSort = $(this).data('s') || 'default';
                self.renderStoreList();
            });
            // 刷新：强制重拉清单 + 下载量
            $('#mod-store-refresh').on('click', function () {
                var $b = $(this); if ($b.prop('disabled')) return;
                $b.prop('disabled', true);
                self._storeRenderKey = '';
                Promise.all([self.fetchManifest(true), self.fetchDownloadCounts(true)]).then(function () {
                    self.renderStoreList();
                    try { if (window.showToast) window.showToast('已刷新'); } catch (e) {}
                }).catch(function () {}).then(function () { $b.prop('disabled', false); });
            });
            // 筛选栏折叠/展开
            $('#mod-filter-toggle').on('click', function () {
                var $p = $('#mod-filter-panel');
                var open = $p.hasClass('open');
                $p.toggleClass('open', !open);
                $('#mod-filter-arrow').css('transform', open ? '' : 'rotate(180deg)');
            });
            // 从本地导入：直接唤起文件选择，不切页
            $('#mod-import-tab-btn').on('click', function () {
                var inp = document.getElementById('mod-import-file');
                if (inp) { inp.value = ''; inp.click(); }
            });
            $('#mod-import-file').on('change', function () {
                var f = this.files && this.files[0];
                if (f) self.importLocalFile(f);
            });
        }
    };

    w.ModManager = ModManager;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            ModManager.bind();
            setTimeout(function () { ModManager.init(); }, 1200);
        });
    } else {
        ModManager.bind();
        setTimeout(function () { ModManager.init(); }, 1200);
    }
})(window);
