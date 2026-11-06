(function (w) {
    'use strict';
    var DB_NAME = 'anqu_resources';
    var STORE = 'assets';
    var DOWNLOADED_KEY = 'ab_downloaded_assets';
    var PACKS = [
        { name: 'collect', repo: 'anqu-collect-resources' },
        { name: 'cards', repo: 'anqu-collect-resources' },
        { name: 'bg', repo: 'anqu-bg-resources' },
        { name: 'music', repo: 'anqu-music-resources' },
        { name: 'title', repo: 'anqu-title-resources' },
        { name: 'minigame', repo: 'anqu-minigame-resources' }
    ];
    var MIRRORS = [
        'https://raw.hefunovo.xyz/incredibox-Para-DX/',
        'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/',
        'https://raw.githubusercontent.com/incredibox-Para-DX/'
    ];

    function bar(pct, text) {
        pct = Math.max(0, Math.min(100, pct));
        var f = document.getElementById('dl-fill'); if (f) f.style.width = pct + '%';
        var p = document.getElementById('dl-pct'); if (p) p.textContent = Math.round(pct);
        var m = document.getElementById('dl-msg'); if (m && text != null) m.textContent = text;
        var b = document.getElementById('loading-progress-bar'); if (b) b.style.width = pct + '%';
        var t = document.getElementById('loading-tip'); if (t && text != null) t.textContent = text;
    }

    function fetchJSON(urls, i) {
        i = i || 0;
        if (i >= urls.length) return Promise.reject(new Error('manifest'));
        var ctl = null, opts = { cache: 'no-store' };
        try { ctl = new AbortController(); } catch (e) {}
        if (ctl) opts.signal = ctl.signal;
        return fetch(urls[i] + '?t=' + Date.now(), opts).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        }).catch(function () { return fetchJSON(urls, i + 1); });
    }

    function manifestUrls(pack) {
        var sub = pack.name === 'cards' ? 'cards/manifest.json' : 'manifest.json';
        return MIRRORS.map(function (m) {
            return (m.indexOf('jsdelivr') >= 0 || m.indexOf('raw.githubusercontent') >= 0)
                ? m + pack.repo + '@main/' + sub
                : m + pack.repo + '/main/' + sub;
        });
    }

    function extractFiles(m, pack) {
        if (pack.name === 'bg') return (m.images || []).concat(m.videos || []).map(function (x) {
            return { path: x.path, size: x.size || 0, url: x.url || null };
        });
        if (pack.name === 'music') {
            var out = [];
            (m.tracks || []).forEach(function (t) {
                if (t.audio_path) out.push({ path: t.audio_path, size: t.audio_size || 0, source: t.audio });
                if (t.cover_path) out.push({ path: t.cover_path, size: t.cover_size || 0, source: t.cover });
            });
            return out;
        }
        if (pack.name === 'title') return (m.icons || []).map(function (x) {
            return { path: x.path, size: x.size || 0 };
        });
        return m.files || [];
    }

    function loadPack(pack) {
        var urls = manifestUrls(pack);
        return fetchJSON(urls).then(function (m) {
            var base = urls[0].replace('manifest.json', '');
            if (pack.name === 'cards') base = urls[0].replace('cards/manifest.json', '');
            var files = extractFiles(m, pack).filter(function (f) { return f && f.path; });
            return files.map(function (f) {
                return { path: f.path, size: f.size || 0, base: base, source: f.source, url: f.url };
            });
        }).catch(function () { return []; });
    }

    function openDB() {
        return new Promise(function (resolve, reject) {
            var req = indexedDB.open(DB_NAME, 2);
            req.onupgradeneeded = function (e) {
                var db = e.target.result;
                if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'path' });
                if (!db.objectStoreNames.contains('pending')) db.createObjectStore('pending', { keyPath: 'path' });
            };
            req.onsuccess = function () { resolve(req.result); };
            req.onerror = function () { reject(req.error); };
        });
    }

    function getDownloaded() {
        try { return JSON.parse(localStorage.getItem(DOWNLOADED_KEY) || '[]'); } catch (e) { return []; }
    }

    function mark(path) {
        var list = getDownloaded();
        if (list.indexOf(path) < 0) {
            list.push(path);
            try { localStorage.setItem(DOWNLOADED_KEY, JSON.stringify(list)); } catch (e) {}
        }
    }

    function saveBlob(db, f, blob) {
        return new Promise(function (resolve, reject) {
            var tx = db.transaction(STORE, 'readwrite');
            tx.objectStore(STORE).put({
                path: f.path, name: f.path, blob: blob, size: blob.size,
                expectedSize: f.size || 0, type: blob.type, downloadedAt: Date.now()
            });
            tx.oncomplete = function () { mark(f.path); resolve(blob.size); };
            tx.onerror = function () { reject(tx.error); };
        });
    }

    function alternateBase(base) {
        if (base.indexOf('raw.hefunovo.xyz') >= 0) {
            return base.replace('https://raw.hefunovo.xyz/', 'https://cdn.jsdelivr.net/gh/').replace('/main/', '@main/');
        }
        if (base.indexOf('raw.githubusercontent.com') >= 0) {
            return base.replace('https://raw.githubusercontent.com/', 'https://cdn.jsdelivr.net/gh/').replace('/main/', '@main/');
        }
        return null;
    }

    function downloadFile(f, db) {
        var bases = [f.base];
        var alt = alternateBase(f.base);
        if (alt) bases.push(alt);
        var attempts = 0;
        function tryOne() {
            if (attempts >= 4) return Promise.reject(new Error('download failed'));
            var url = f.url || encodeURI(bases[attempts % bases.length] + (f.source || f.path));
            attempts++;
            return fetch(url, { cache: 'no-store' }).then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.blob();
            }).then(function (blob) {
                return saveBlob(db, f, blob);
            }).catch(function (e) {
                return tryOne();
            });
        }
        return tryOne();
    }

    function runPool(list, worker, concurrency) {
        var i = 0, active = 0, failed = 0;
        return new Promise(function (resolve) {
            function next() {
                if (i >= list.length && active === 0) { resolve(failed); return; }
                while (active < concurrency && i < list.length) {
                    (function (f) {
                        active++;
                        worker(f).then(function () { active--; next(); })
                            .catch(function () { failed++; active--; next(); });
                    })(list[i++]);
                }
            }
            next();
        });
    }

    function downloadAll(cb) {
        cb = cb || function () {};
        bar(0, '正在获取资源清单…');
        Promise.all(PACKS.map(loadPack)).then(function (packLists) {
            var seen = {};
            var files = [];
            packLists.forEach(function (list) {
                list.forEach(function (f) {
                    if (!f.path || seen[f.path]) return;
                    seen[f.path] = 1;
                    files.push(f);
                });
            });
            var downloaded = getDownloaded();
            files = files.filter(function (f) { return downloaded.indexOf(f.path) < 0; });
            if (!files.length) {
                try { localStorage.setItem('ab_boot_full_done', '1'); } catch (e) {}
                bar(100, '资源已是最新');
                cb(true);
                return;
            }
            var total = files.reduce(function (a, f) { return a + (f.size || 0); }, 0);
            var doneBytes = 0, doneFiles = 0;
            bar(0, '正在下载完整资源 0/' + files.length);
            openDB().then(function (db) {
                runPool(files, function (f) {
                    return downloadFile(f, db).then(function (n) {
                        doneBytes += (f.size || n || 0);
                        doneFiles++;
                        var pct = total ? (doneBytes / total * 100) : (doneFiles / files.length * 100);
                        bar(pct, '正在下载完整资源 ' + doneFiles + '/' + files.length);
                    });
                }, 3).then(function (failed) {
                    if (failed === 0) {
                        try {
                            localStorage.setItem('ab_lion_pack_v1', '1');
                            localStorage.setItem('ab_card_pack_v1', '1');
                            localStorage.setItem('ab_collect_pack_v1', '1');
                        } catch (e) {}
                    }
                    try { localStorage.setItem('ab_boot_full_done', failed ? '0' : '1'); } catch (e) {}
                    bar(100, failed ? '有 ' + failed + ' 个资源下载失败，可稍后在资源下载补下' : '完整资源下载完成');
                    cb(failed === 0);
                });
            }).catch(function () { cb(false); });
        }).catch(function () { cb(false); });
    }

    w.__bootDownloadAll = downloadAll;
})(window);
