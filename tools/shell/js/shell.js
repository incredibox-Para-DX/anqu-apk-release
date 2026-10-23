(function () {
  'use strict';

  // 代码：raw 为主线路（jsDelivr 的 @main 会长期缓存旧文件），boot2 用于下载不完整时强制重下
  var CODE_BASES = [
    'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-apk-release/main/boot',
    'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-apk-release@main/boot',
    'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-apk-release/main/boot2',
    'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-apk-release@main/boot2'
  ];
  // 物品图 / 收藏室图：仓库 media/ 目录，清单 media/manifest.json，图片在两子目录
  var MEDIA_BASES = [
    'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-apk-release/main/media',
    'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-apk-release@main/media'
  ];
  var MEDIA_KEY = 'ab_media_ver';
  var SHELL_MARK = 'anqu-shell';

  var CODE_TIMEOUT = 120000;
  var MEDIA_TIMEOUT = 600000;
  var PROBE_TIMEOUT = 8000;

  var VERIFY_CODE = [
    'index.html',
    'css/main.css',
    'js/script_new.js',
    'js/main.js',
    'xml/items.xml'
  ];

  // 拿不到图片清单时的兜底抽检文件
  var SENTINELS = [
    'images/img_b353ca7f64.png',
    'images/img_a9db6da1e9.png',
    'collect/img_e3e8e2a20c.png'
  ];

  var stage = 'media';
  var mi = 0;
  var ci = 0;
  var done = false;
  var failed = false;
  var timer = null;
  var progTimer = null;
  var width = 0;
  var mediaVer = '';
  var mediaFiles = null;

  function $(id) { return document.getElementById(id); }

  function setTip(text) {
    var el = $('loading-tip');
    if (el) el.textContent = text;
  }

  function setBar(w) {
    width = w;
    var el = $('loading-progress-bar');
    if (el) el.style.width = w + '%';
  }

  function startProgress(from) {
    if (progTimer) clearInterval(progTimer);
    setBar(from || 0);
    progTimer = setInterval(function () {
      if (width >= 90) return;
      setBar(Math.min(90, width + (90 - width) * 0.06));
    }, 140);
  }

  function stopProgress() {
    if (progTimer) { clearInterval(progTimer); progTimer = null; }
  }

  function lsGet(k) {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  }

  function lsSet(k, v) {
    try { localStorage.setItem(k, v); } catch (e) {}
  }

  function enter() {
    if (done) return;
    done = true;
    clearTimeout(timer);
    stopProgress();
    setBar(100);
    setTip('资源更新完成，正在进入…');
    setTimeout(function () {
      // 相对地址；带参数强制 WebView 重新读取内部存储里刚下载好的入口页
      location.replace('index.html?r=' + Date.now());
    }, 350);
  }

  function fail(message) {
    clearTimeout(timer);
    stopProgress();
    setBar(0);
    failed = true;
    $('loading-overlay').className = 'loading-overlay failed';
    setTip(message || '资源获取失败，点击屏幕重试');
  }

  function get(url, cb, timeout, binary) {
    var xhr = new XMLHttpRequest();
    var finished = false;
    function finish(ok, text) {
      if (finished) return;
      finished = true;
      cb(ok, text);
    }
    try {
      xhr.open('GET', url + (url.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now(), true);
      xhr.setRequestHeader('Cache-Control', 'no-store');
      xhr.timeout = timeout || PROBE_TIMEOUT;
      if (binary) xhr.responseType = 'arraybuffer';
      xhr.onload = function () {
        finish(xhr.status === 200, binary ? '' : (xhr.responseText || ''));
      };
      xhr.onerror = function () { finish(false, ''); };
      xhr.ontimeout = function () { finish(false, ''); };
      xhr.send();
    } catch (e) {
      finish(false, '');
    }
  }

  function probe(paths, binary, cb) {
    var i = 0;
    function next() {
      if (done) return;
      if (i >= paths.length) { cb(true); return; }
      get(paths[i++], function (ok) {
        if (!ok) { cb(false); return; }
        next();
      }, PROBE_TIMEOUT, binary);
    }
    next();
  }

  function verifyCode(cb) {
    var i = 0;
    function next() {
      if (i >= VERIFY_CODE.length) { cb(true); return; }
      var rel = VERIFY_CODE[i++];
      get(rel, function (ok, text) {
        if (!ok) { cb(false); return; }
        if (rel === 'index.html' && text.indexOf(SHELL_MARK) >= 0) { cb(false); return; }
        next();
      }, PROBE_TIMEOUT);
    }
    next();
  }

  function mediaSample() {
    if (!mediaFiles || !mediaFiles.length) return SENTINELS;
    var n = mediaFiles.length;
    var idx = [0, Math.floor(n * 0.15), Math.floor(n * 0.3), Math.floor(n * 0.45),
               Math.floor(n * 0.6), Math.floor(n * 0.75), Math.floor(n * 0.9), n - 1];
    var out = [];
    for (var i = 0; i < idx.length; i++) {
      var f = mediaFiles[idx[i]];
      if (f && f.path && out.indexOf(f.path) < 0) out.push(f.path);
    }
    return out;
  }

  function fetchMediaManifest(cb) {
    get(MEDIA_BASES[0] + '/manifest.json', function (ok, text) {
      if (!ok) {
        get(MEDIA_BASES[1] + '/manifest.json', function (ok2, text2) { parse(ok2, text2); }, 20000);
        return;
      }
      parse(true, text);
    }, 20000);

    function parse(ok, text) {
      if (!ok) { cb(false); return; }
      try {
        var m = JSON.parse(text);
        if (m && m.version && m.files && m.files.length) {
          mediaVer = m.version;
          mediaFiles = m.files;
          cb(true);
          return;
        }
      } catch (e) {}
      cb(false);
    }
  }

  function call(base, timeout, next) {
    try {
      window.AndroidUpdate.check(base);
    } catch (e) {
      next();
      return;
    }
    clearTimeout(timer);
    timer = setTimeout(next, timeout);
  }

  function tryMedia() {
    if (done) return;
    if (mi >= MEDIA_BASES.length) {
      setTip('图片下载失败，先进入应用…');
      setTimeout(tryCode, 600);
      return;
    }
    stage = 'media';
    setTip('正在下载物品与收藏室图片…');
    call(MEDIA_BASES[mi++], MEDIA_TIMEOUT, tryMedia);
  }

  function tryCode() {
    if (done) return;
    if (ci >= CODE_BASES.length) { fail('资源获取失败，点击屏幕重试'); return; }
    stage = 'code';
    setTip(ci === 0 ? '正在获取运行资源…' : '正在切换线路…');
    call(CODE_BASES[ci++], CODE_TIMEOUT, tryCode);
  }

  function start() {
    if (done) return;
    stage = 'media';
    mi = 0;
    ci = 0;
    setTip('正在校验资源…');

    fetchMediaManifest(function (ok) {
      var local = lsGet(MEDIA_KEY);
      probe(mediaSample(), true, function (present) {
        if (done) return;
        var need = ok ? (local !== mediaVer) : !present;
        if (need) { tryMedia(); return; }
        if (ok) lsSet(MEDIA_KEY, mediaVer);
        setBar(70);
        tryCode();
      });
    });
  }

  window.__onUpdateCheckResult = function (res) {
    if (done) return;
    clearTimeout(timer);
    var updated = !!(res && res.updated);

    if (stage === 'media') {
      if (!updated) { tryCode(); return; }
      setTip('正在校验图片…');
      probe(mediaSample(), true, function (present) {
        if (present) {
          if (mediaVer) lsSet(MEDIA_KEY, mediaVer);
          setBar(88);
          tryCode();
        } else {
          tryMedia();
        }
      });
      return;
    }

    if (updated) {
      setTip('正在校验运行文件…');
      verifyCode(function (ok) {
        if (ok) { enter(); return; }
        setTip('运行文件不完整，正在重新获取…');
        tryCode();
      });
      return;
    }

    verifyCode(function (ok) {
      if (ok) { enter(); return; }
      tryCode();
    });
  };

  // 失败后点屏幕任意位置重试（保持原加载页外观，不额外加按钮）
  $('loading-overlay').addEventListener('click', function () {
    if (!failed || done) return;
    failed = false;
    $('loading-overlay').className = 'loading-overlay';
    mi = 0;
    ci = 0;
    startProgress(6);
    start();
  });

  startProgress(6);
  start();
})();
