(function () {
  'use strict';

  // 主线路 + 备用线路；boot2 的 manifest 版本号与 boot 不同，用于“上次下载不完整”时强制重下
  var BASES = [
    'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-apk-release@main/boot',
    'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-apk-release/main/boot',
    'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-apk-release@main/boot2',
    'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-apk-release/main/boot2'
  ];
  var CHECK_TIMEOUT = 90000;
  var PROBE_TIMEOUT = 8000;
  var SHELL_MARK = 'anqu-shell';

  // 抽查关键文件，确认远端资源已完整落到内部存储
  var VERIFY = [
    'main.html',
    'index.html',
    'css/main.css',
    'js/script_new.js',
    'js/main.js',
    'xml/items.xml'
  ];

  var idx = 0;
  var done = false;
  var timer = null;
  var progTimer = null;

  function $(id) { return document.getElementById(id); }

  function setStatus(text, detail) {
    $('status').textContent = text;
    if (detail !== undefined) $('detail').textContent = detail;
  }

  function startProgress() {
    if (progTimer) clearInterval(progTimer);
    var w = 6;
    $('bar').style.width = w + '%';
    progTimer = setInterval(function () {
      w += (90 - w) * 0.05;
      if (w > 90) w = 90;
      $('bar').style.width = w.toFixed(1) + '%';
    }, 140);
  }

  function stopProgress() {
    if (progTimer) { clearInterval(progTimer); progTimer = null; }
  }

  function showVersion() {
    try {
      if (window.AndroidUpdate && typeof window.AndroidUpdate.currentVersion === 'function') {
        var v = window.AndroidUpdate.currentVersion();
        if (v) { $('ver').textContent = String(v).replace(/\.[mr]$/, ''); return; }
      }
    } catch (e) {}
    $('ver').textContent = 'v2.1.0';
  }

  function enter() {
    if (done) return;
    done = true;
    clearTimeout(timer);
    stopProgress();
    $('bar').style.width = '100%';
    setStatus('资源校验完成', '正在进入…');
    $('net').textContent = '已连接';
    $('net').className = '';
    setTimeout(function () {
      // 相对地址，避免硬编码域名；带参数强制重新读取内部存储中的入口页
      location.replace('main.html?r=' + Date.now());
    }, 400);
  }

  function fail(message) {
    clearTimeout(timer);
    stopProgress();
    $('bar').style.width = '0%';
    setStatus('启动失败', message || '无法连接资源服务器');
    $('net').textContent = '连接异常';
    $('net').className = 'bad';
    $('detail').textContent = '请检查网络后点击重试，可切换 Wi-Fi / 移动数据再试。若持续失败，可在系统设置中清除本应用数据后重新打开。';
    $('retry').style.display = 'inline-block';
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
      setStatus('正在校验运行文件', rel);
      get(rel, function (ok, text) {
        if (!ok) { cb(false); return; }
        // main.html 若还是壳自身，说明真实入口页没下载下来
        if (rel === 'main.html' && text.indexOf(SHELL_MARK) >= 0) { cb(false); return; }
        next();
      }, PROBE_TIMEOUT);
    }
    next();
  }

  function attempt() {
    if (done) return;
    if (idx >= BASES.length) { fail('资源下载失败，请检查网络后重试'); return; }

    var base = BASES[idx++];
    setStatus('正在获取运行资源', idx === 1 ? '正在连接服务器…' : '正在切换线路…');

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
      verifyAll(function (ok) {
        if (ok) { enter(); return; }
        // 下载成功但有文件缺失：换用版本号不同的备用清单，强制重新下载
        setStatus('运行文件不完整', '正在重新获取…');
        attempt();
      });
      return;
    }

    verifyAll(function (ok) {
      if (ok) { enter(); return; }
      attempt();
    });
  };

  $('retry').addEventListener('click', function () {
    idx = 0;
    done = false;
    $('retry').style.display = 'none';
    $('net').className = '';
    $('net').textContent = '正在连接';
    setStatus('正在获取运行资源', '');
    startProgress();
    attempt();
  });

  showVersion();
  startProgress();
  attempt();
})();
