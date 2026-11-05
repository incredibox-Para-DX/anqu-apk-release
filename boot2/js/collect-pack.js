
(function (w) {
    'use strict';
    var MANIFEST_URLS = [
        'https://raw.hefunovo.xyz/incredibox-Para-DX/anqu-collect-resources/main/manifest.json',
        'https://anqu-raw2.sdfgasdfgwe7.workers.dev/incredibox-Para-DX/anqu-collect-resources/main/manifest.json',
        'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-collect-resources@main/manifest.json',
        'https://fastly.jsdelivr.net/gh/incredibox-Para-DX/anqu-collect-resources@main/manifest.json',
        'https://gcore.jsdelivr.net/gh/incredibox-Para-DX/anqu-collect-resources@main/manifest.json',
        'https://anqu-raw.sdfgasdfgwe7.workers.dev/incredibox-Para-DX/anqu-collect-resources/main/manifest.json',
        'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-collect-resources/main/manifest.json'
    ];
    var BASE_URLS = [
        'https://raw.hefunovo.xyz/incredibox-Para-DX/anqu-collect-resources/main/',
        'https://anqu-raw2.sdfgasdfgwe7.workers.dev/incredibox-Para-DX/anqu-collect-resources/main/',
        'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-collect-resources@main/',
        'https://fastly.jsdelivr.net/gh/incredibox-Para-DX/anqu-collect-resources@main/',
        'https://gcore.jsdelivr.net/gh/incredibox-Para-DX/anqu-collect-resources@main/',
        'https://anqu-raw.sdfgasdfgwe7.workers.dev/incredibox-Para-DX/anqu-collect-resources/main/',
        'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-collect-resources/main/'
    ];
    var DONE_KEY = 'ab_collect_pack_v1';
    var state = { manifest: null, downloading: false, paused: false };

    function $(id) { return document.getElementById(id); }
    function toast(m) { if (w.showToast) w.showToast(m); }
    function rdm() { return w.ResourceDownloadManager; }

    function loadManifest() {
        if (state.manifest) return Promise.resolve(state.manifest);
        var i = 0;
        return new Promise(function (resolve, reject) {
            function next() {
                if (i >= MANIFEST_URLS.length) { reject(new Error('manifest')); return; }
                var url = MANIFEST_URLS[i++];
                fetch(url + (url.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now(), { cache: 'no-store' })
                    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
                    .then(function (m) {
                        if (!m || !Array.isArray(m.files) || !m.files.length) throw new Error('bad');
                        var files = m.files.filter(function (f) { return f && f.path && f.path.indexOf('lion/') !== 0; });
                        if (!files.length) throw new Error('bad');
                        state.manifest = { version: m.version || '1', files: files };
                        resolve(state.manifest);
                    })
                    .catch(function () { next(); });
            }
            next();
        });
    }

    function isDone() {
        try { return !!localStorage.getItem(DONE_KEY); } catch (e) { return false; }
    }

    function totalOf(m) { return (m && m.files) ? m.files.length : 0; }

    function setCount(done, total) {
        var el = $('rd-collect-count'); if (el) el.textContent = done + ' / ' + total;
    }
    function setBar(pct, text) {
        var bar = $('rd-collect-progress-bar'); if (bar) bar.style.width = Math.max(0, Math.min(100, pct)) + '%';
        if (text != null) { var t = $('rd-collect-progress-text'); if (t) t.textContent = text; }
    }
    function showProgress(show) { var w2 = $('rd-collect-progress-wrap'); if (w2) w2.style.display = show ? '' : 'none'; }
    function showDone(show) { var d = $('rd-collect-done'); if (d) d.style.display = show ? '' : 'none'; }

    function refreshUI() {
        var done = isDone();
        loadManifest().then(function (m) {
            var t = totalOf(m);
            var ver = m.version || '1';
            var saved = null;
            try { saved = localStorage.getItem(DONE_KEY); } catch (e) {}
            var R = w.ResourceDownloadManager;
            var allLocal = true;
            var anyLocal = false;
            (m.files || []).forEach(function (f) {
                var ok = !!(R && R.isDownloaded && R.isDownloaded(f.path));
                if (ok) anyLocal = true; else allLocal = false;
            });
            if (done && saved && saved !== ver) {
                if (allLocal) {
                    try { localStorage.setItem(DONE_KEY, ver); } catch (e) {}
                } else {
                    try { localStorage.removeItem(DONE_KEY); } catch (e) {}
                    done = false;
                    if (refreshUI._notified !== ver) {
                        refreshUI._notified = ver;
                        if (w.showToast) w.showToast((w.I18N && I18N.t) ? I18N.t('rd_pack_updated', '资源包有更新，请补充下载') : '资源包有更新，请补充下载');
                    }
                }
            } else if (!done && allLocal && t > 0) {
                try { localStorage.setItem(DONE_KEY, ver); } catch (e) {}
                done = true;
            }
            showDone(done);
            var btn = $('rd-download-collect-btn');
            if (btn) btn.style.display = done ? 'none' : '';
            var del = $('rd-delete-collect-btn');
            if (del) del.style.display = (done || anyLocal) ? '' : 'none';
            setCount(done ? t : 0, t);
        }).catch(function () {
            showDone(done);
            var btn = $('rd-download-collect-btn');
            if (btn) btn.style.display = done ? 'none' : '';
            var del = $('rd-delete-collect-btn');
            if (del) del.style.display = done ? '' : 'none';
        });
    }

    function deletePack() {
        var R = w.ResourceDownloadManager;
        if (!R) { toast('资源管理器未就绪'); return; }
        loadManifest().then(function (m) {
            var paths = (m.files || []).map(function (f) { return f.path; });
            R.confirmDeletePaths('收藏室资源包', function () {
                R.deletePathsAndUnmark(paths).then(function () {
                    try { localStorage.removeItem(DONE_KEY); } catch (e) {}
                    toast('收藏室资源包已删除');
                    refreshUI();
                });
            });
        }).catch(function () { toast('资源列表加载失败'); });
    }

    function download() {
        var R = rdm();
        if (!R) { toast('资源管理器未就绪，请稍后再试'); return; }
        if (state.downloading) { state.paused = !state.paused; var b = $('rd-download-collect-btn'); if (b) b.innerHTML = state.paused ? '<i class="fas fa-play"></i> 继续下载' : '<i class="fas fa-pause"></i> 暂停下载'; return; }
        loadManifest().then(function (m) {
            var files = (m.files || []).filter(function (f) { return f && f.path; });
            if (!files.length) { toast('收藏室资源列表加载失败，请检查网络'); return; }
            state.downloading = true; state.paused = false;
            var btn = $('rd-download-collect-btn'); if (btn) btn.innerHTML = '<i class="fas fa-pause"></i> 暂停下载';
            showProgress(true); showDone(false); setCount(0, files.length); setBar(0, '开始下载…');
            var done = 0, failed = 0;
            R._runConcurrentPool(files, function (f) {
                return R.waitWhilePaused(function () { return state.paused; }).then(function () {
                    var urls = BASE_URLS.map(function (b) { return b + f.path; });
                    return R.downloadFile(urls, f.path, f.path, f.size || 0, null, function () { return state.paused; });
                });
            }, function () {
                done++; setCount(done + failed, files.length);
                setBar(Math.round((done + failed) / files.length * 100), '已完成 ' + done + '/' + files.length);
            }, function () { failed++; setCount(done + failed, files.length); }, 6).then(function () {
                state.downloading = false;
                if (btn) btn.innerHTML = '<i class="fas fa-download"></i> 下载收藏室资源包';
                var total = files.length;
                if (failed === 0) {
                    try { localStorage.setItem(DONE_KEY, m.version || '1'); } catch (e) {}
                    setBar(100, '全部完成'); showDone(true); showProgress(false);
                    var b2 = $('rd-download-collect-btn'); if (b2) b2.style.display = 'none';
                    toast('收藏室资源包已下载完成');
                    refreshUI();
                } else {
                    setBar(Math.round(done / total * 100), '完成：' + done + '/' + total + '，失败 ' + failed + '（可再次点击重试）');
                    toast('部分失败，可再次点击重试');
                }
            });
        }).catch(function () { toast('收藏室资源列表加载失败，请检查网络'); });
    }

    function bind() {
        var b = $('rd-download-collect-btn');
        if (b && !b._b) { b._b = true; b.addEventListener('click', download); }
        var d = $('rd-delete-collect-btn');
        if (d && !d._b) { d._b = true; d.addEventListener('click', deletePack); }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { bind(); refreshUI(); });
    else { bind(); refreshUI(); }

    w.CollectPack = { download: download, deletePack: deletePack, isDone: isDone, loadManifest: loadManifest, refreshUI: refreshUI };
})(window);
