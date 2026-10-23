(function () {
  'use strict';

  // 主线路 + 备用线路；boot2 的 manifest 版本号与 boot 不同，用于“上次下载不完整”时强制重下
  // 注意：jsDelivr 的 @main 会长期缓存旧文件，必须放在 raw 之后
  var BASES = [
    'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-apk-release/main/boot',
    'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-apk-release@main/boot',
    'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-apk-release/main/boot2',
    'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-apk-release@main/boot2'
  ];
  var CHECK_TIMEOUT = 90000;
  var PROBE_TIMEOUT = 8000;
  var SHELL_MARK = 'anqu-shell';

  // 抽查关键文件，确认远端资源已完整落到内部存储
  var VERIFY = [
    'index.html',
    'css/main.css',
    'js/script_new.js',
    'js/main.js',
    'xml/items.xml'
  ];

  var idx = 0;
  var done = false;
  var failed = false;
  var timer = null;
  var progTimer = null;
  var width = 0;

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

  function get(rel, cb, timeout) {
    var xhr = new XMLHttpRequest();
    var finished = false;
    function finish(ok, text) {
      if (finished) return;
      finished = true;
      cb(ok, text);
    }
    try {
      xhr.open('GET', rel + (rel.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now(), true);
      xhr.setRequestHeader('Cache-Control', 'no-store');
      xhr.timeout = timeout || PROBE_TIMEOUT;
      xhr.onload = function () {
        finish(xhr.status === 200, xhr.responseText || '');
      };
      xhr.onerror = function () { finish(false, ''); };
      xhr.ontimeout = function () { finish(false, ''); };
      xhr.send();
    } catch (e) {
      finish(false, '');
    }
  }

  function verifyAll(cb) {
    var i = 0;
    function next() {
      if (done) return;
      if (i >= VERIFY.length) { cb(true); return; }
      var rel = VERIFY[i++];
      get(rel, function (ok, text) {
        if (!ok) { cb(false); return; }
        // 入口页若还是加载页自身，说明真实 index.html 没下载下来
        if (rel === 'index.html' && text.indexOf(SHELL_MARK) >= 0) { cb(false); return; }
        next();
      }, PROBE_TIMEOUT);
    }
    next();
  }

  function attempt() {
    if (done) return;
    if (idx >= BASES.length) { fail('资源获取失败，点击屏幕重试'); return; }

    var base = BASES[idx++];
    setTip(idx === 1 ? '正在获取运行资源…' : '正在切换线路…');

    if (!window.AndroidUpdate || typeof window.AndroidUpdate.check !== 'function') {
      fail('当前环境缺少更新组件，请重新安装客户端');
      return;
    }

    try {
      window.AndroidUpdate.check(base);
    } catch (e) {
      attempt();
      return;
    }

    clearTimeout(timer);
    timer = setTimeout(attempt, CHECK_TIMEOUT);
  }

  window.__onUpdateCheckResult = function (res) {
    if (done) return;
    clearTimeout(timer);

    if (res && res.updated) {
      setTip('正在校验运行文件…');
      verifyAll(function (ok) {
        if (ok) { enter(); return; }
        // 下载成功但有文件缺失：换用版本号不同的备用清单，强制重新下载
        setTip('运行文件不完整，正在重新获取…');
        attempt();
      });
      return;
    }

    verifyAll(function (ok) {
      if (ok) { enter(); return; }
      attempt();
    });
  };

  // 失败后点屏幕任意位置重试（保持原加载页外观，不额外加按钮）
  $('loading-overlay').addEventListener('click', function () {
    if (!failed || done) return;
    failed = false;
    idx = 0;
    $('loading-overlay').className = 'loading-overlay';
    setTip('正在获取运行资源…');
    startProgress(6);
    attempt();
  });

  startProgress(6);
  setTip('正在校验运行文件…');
  attempt();
})();
