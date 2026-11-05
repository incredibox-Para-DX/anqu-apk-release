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
    var DONE_KEY = 'ab_lion_pack_v1';
    var state = { manifest: null, downloading: false, paused: false, waiters: [] };

    function $(id) { return document.getElementById(id); }
    function toast(m) { if (w.showToast) w.showToast(m); }
    function rdm() { return w.ResourceDownloadManager; }

    function isDone() {
        try { return !!localStorage.getItem(DONE_KEY); } catch (e) { return false; }
    }

    function loadManifest() {
        if (state.manifest) return Promise.resolve(state.manifest);
        function verNum(v) { var n = parseFloat(String(v || '').replace(/^v/i, '')); return isNaN(n) ? 0 : n; }
        var tasks = MANIFEST_URLS.map(function (url, idx) {
            var opts = { cache: 'no-store' };
            var ctl = null;
            try { ctl = new AbortController(); } catch (e) {}
            var timer = ctl ? setTimeout(function () { try { ctl.abort(); } catch (e) {} }, 8000) : null;
            if (ctl) opts.signal = ctl.signal;
            return fetch(url + '?t=' + Date.now(), opts)
                .then(function (r) { if (timer) clearTimeout(timer); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
                .then(function (m) {
                    var files = (m.files || []).filter(function (f) { return f.path.indexOf('lion/') === 0; });
                    if (!files.length) throw new Error('empty');
                    return { base: BASE_URLS[idx], manifest: { files: files, version: m.version || '1' } };
                })
                .catch(function () { return null; });
        });
        return Promise.all(tasks).then(function (list) {
            var best = null;
            list.forEach(function (x) {
                if (!x) return;
                if (!best || verNum(x.manifest.version) > verNum(best.manifest.version)) best = x;
            });
            if (!best) throw new Error('manifest');
            state.manifest = best.manifest;
            return state.manifest;
        });
    }

    function setBtnLabel(paused) {
        var b = $('rd-download-model-btn');
        if (!b) return;
        b.innerHTML = paused
            ? '<i class="fas fa-play"></i> 继续下载'
            : '<i class="fas fa-pause"></i> 暂停下载';
    }

    function waitWhilePaused() {
        if (!state.paused) return Promise.resolve();
        return new Promise(function (resolve) { state.waiters.push(resolve); });
    }

    function setPaused(p) {
        state.paused = p;
        if (!p) {
            var ws = state.waiters;
            state.waiters = [];
            ws.forEach(function (r) { r(); });
        }
        if (state.downloading) setBtnLabel(p);
    }

    function setBar(pct, text) {
        var bar = $('rd-model-progress-bar');
        if (bar) bar.style.width = Math.max(0, Math.min(100, pct)) + '%';
        if (text != null) { var t = $('rd-model-progress-text'); if (t) t.textContent = text; }
    }

    function showProgress(show) {
        var el = $('rd-model-progress-wrap');
        if (el) el.style.display = show ? '' : 'none';
    }

    function applyUI(done, hasLocal) {
        var dl = $('rd-download-model-btn');
        if (dl) {
            dl.style.display = done ? 'none' : '';
            if (!done) dl.innerHTML = '<i class="fas fa-download"></i> 下载模型资源包';
        }
        var del = $('rd-delete-model-btn');
        if (del) del.style.display = (done || hasLocal) ? '' : 'none';
        var doneEl = $('rd-model-done');
        if (doneEl) doneEl.style.display = done ? '' : 'none';
        if (done) showProgress(false);
    }

    function resetUrlMap() {
        w.__lionUrlMap = {};
        w.__lionUrlMapReady = false;
    }

    function refreshUI() {
        if (state.downloading) return;
        var R = rdm();
        var done = isDone();
        if (!R || typeof R.isDownloaded !== 'function') { applyUI(done, done); return; }
        loadManifest().then(function (m) {
            var files = m.files || [];
            if (!files.length) return;
            var all = files.every(function (f) { return R.isDownloaded(f.path); });
            var any = files.some(function (f) { return R.isDownloaded(f.path); });
            if (all) {
                try { localStorage.setItem(DONE_KEY, m.version); } catch (e) {}
                applyUI(true, true);
            } else {
                if (done) { try { localStorage.removeItem(DONE_KEY); } catch (e) {} }
                applyUI(false, any);
            }
        }).catch(function () { applyUI(done, done); });
    }

    function download() {
        if (state.downloading) { setPaused(!state.paused); return; }
        if (isDone()) { refreshUI(); return; }
        var R = rdm();
        if (!R || typeof R.downloadFile !== 'function') {
            toast('资源管理器未就绪，请稍后再试');
            return;
        }
        state.downloading = true;
        state.paused = false;
        setBtnLabel(false);
        showProgress(true);
        setBar(0, '准备中...');
        var doneCount = 0, failCount = 0;
        loadManifest().then(function (m) {
            var files = m.files || [];
            if (!files.length) throw new Error('empty');
            return R._runConcurrentPool(files, function (f) {
                return R.waitWhilePaused(function () { return state.paused; }).then(function () {
                    var urls = BASE_URLS.map(function (b) { return b + f.path; });
                    return R.downloadFile(urls, f.path, f.path, f.size || 0, null, function () { return state.paused; });
                });
            }, function () {
                doneCount++;
                setBar(Math.round((doneCount + failCount) / files.length * 100), '已完成 ' + doneCount + '/' + files.length);
            }, function () {
                failCount++;
                setBar(Math.round((doneCount + failCount) / files.length * 100), '失败 ' + failCount + ' 个');
            }, 6).then(function () {
                state.downloading = false;
                state.paused = false;
                resetUrlMap();
                if (failCount === 0) {
                    try { localStorage.setItem(DONE_KEY, m.version); } catch (e) {}
                    applyUI(true, true);
                    toast('模型资源包已下载完成');
                } else {
                    applyUI(false, true);
                    toast('部分文件下载失败，可再次点击重试');
                }
            });
        }).catch(function () {
            state.downloading = false;
            state.paused = false;
            showProgress(false);
            applyUI(false, false);
            toast('模型资源包下载失败，请检查网络后重试');
        });
    }

    function remove(paths) {
        var R = rdm();
        R.deletePathsAndUnmark(paths || []).then(function () {
            try { localStorage.removeItem(DONE_KEY); } catch (e) {}
            resetUrlMap();
            applyUI(false, false);
            toast('模型资源包已删除');
        });
    }

    function deletePack() {
        var R = rdm();
        if (!R || typeof R.confirmDeletePaths !== 'function') {
            toast('资源管理器未就绪');
            return;
        }
        R.confirmDeletePaths('模型资源包', function () {
            if (state.manifest && state.manifest.files) {
                remove(state.manifest.files.map(function (f) { return f.path; }));
                return;
            }
            loadManifest().then(function (m) {
                remove((m.files || []).map(function (f) { return f.path; }));
            }).catch(function () { toast('资源列表加载失败'); });
        });
    }

    function bind() {
        var btn = $('rd-download-model-btn');
        if (btn && !btn._b) { btn._b = true; btn.addEventListener('click', download); }
        var del = $('rd-delete-model-btn');
        if (del && !del._b) { del._b = true; del.addEventListener('click', deletePack); }
    }

    w.LionPack = {
        isDone: isDone,
        download: download,
        loadManifest: loadManifest,
        refreshUI: refreshUI,
        deletePack: deletePack,
        getManifest: function () { return state.manifest; }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { bind(); refreshUI(); });
    else { bind(); refreshUI(); }
})(window);
