(function () {
  var STYLE_ID = 'DTStyle';
  var FAB_ID = 'DTFab';
  var PANEL_ID = 'DTPanel';
  var MAX_LOG = 800;
  var currentTab = 'monitor';
  var capture = { console: true, error: true, fetch: true, xhr: true, click: false, ws: false, storage: false };
  var L = [];
  var netLogs = [];
  var mockRules = [];
  var snippetList = [];
  var perfLines = [];
  var confirmCb = null;
  var fps = false;
  var fpsRAF = null;
  var fpsLast = performance.now();
  var fpsFrame = 0;
  var fpsVal = 0;
  var autoTimer = null;
  var clsVal = 0;
  var longTaskObserver = null;
  var memAutoTimer = null;
  var autoFarmTimer = null;
  var gameItems = [];
  var origConsole = {};
  var origFetch = window.fetch;
  var origOpen = XMLHttpRequest.prototype.open;
  var origSend = XMLHttpRequest.prototype.send;
  var origWS = window.WebSocket;

  function nowT() { return new Date().toLocaleTimeString('en-US', { hour12: false }); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function MAXZ() { return 2147483647; }

  function addLog(level, msg, extra) {
    L.push({ t: nowT(), l: level, m: String(msg == null ? '' : msg), e: extra ? String(extra) : '' });
    if (L.length > MAX_LOG) L.shift();
    if (currentTab === 'log') renderLog();
    updateBadge();
  }

  function updateBadge() {
    var errs = 0;
    for (var i = 0; i < L.length; i++) if (L[i].l === 'error') errs++;
    var el = document.getElementById('DTBadge');
    if (el) { el.textContent = errs > 0 ? String(errs) : ''; el.style.display = errs > 0 ? 'block' : 'none'; }
  }

  function buildStyle() {
    var cssId = 'DTExternalCSS';
    if (!document.getElementById(cssId)) {
      var link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = (window.__DT_CSS__ || 'debug-console.css');
      (document.head || document.body).appendChild(link);
    }
  }

  function buildHTML() {
    var root = document.createElement('div');
    root.id = 'DTRoot';
    root.innerHTML =
      '<div id="DTBackdrop"></div>' +
      '<button id="' + FAB_ID + '" title="调试控制台">' +
        '<img id="DTFabImg" src="debug/debug.png" alt="">' +
        '<span id="DTFabFallback" style="display:none">🧪</span>' +
      '</button>' +
      '<div id="DTBadge"></div>' +
      '<div id="' + PANEL_ID + '">' +
        '<div id="DTHead"><h3>⚡ GM debug</h3><button id="DTClose">✕</button></div>' +
        '<div id="DTTabs">' +
          '<button data-tab="monitor" class="active">监控</button>' +
          '<button data-tab="log">日志</button>' +
          '<button data-tab="tool">工具</button>' +
          '<button data-tab="dom">DOM</button>' +
          '<button data-tab="storage">存储</button>' +
          '<button data-tab="game">游戏</button>' +
          '<button data-tab="device">设备</button>' +
          '<button data-tab="network">网络</button>' +
          '<button data-tab="perf">性能</button>' +
          '<button data-tab="mock">Mock</button>' +
        '</div>' +
        '<div id="DTBody">' +
          panelMonitor() + panelLog() + panelTool() + panelDom() + panelDevice() + panelStorage() + panelNetwork() + panelPerf() + panelMock() + panelGame() +
        '</div>' +
      '</div>' +
      '<div id="DTConfirm"><div class="box"><div id="DTConfirmText"></div><div class="btns"><button class="dt-btn ok" id="DTConfirmOk">确认</button><button class="dt-btn warn" id="DTConfirmCancel">取消</button></div></div></div>';
    document.body.appendChild(root);
  }

  function panelMonitor() {
    return '<section class="dt-panel active" data-panel="monitor">' +
      '<div class="dt-scroll">' +
        '<div class="dt-card"><span class="dt-label">捕获开关</span><div class="dt-row" id="captureBtns"></div></div>' +
        '<div class="dt-card"><span class="dt-label">页面操作</span><div class="dt-row">' +
          '<button class="dt-btn" id="reloadBtn">🔄 刷新</button>' +
          '<button class="dt-btn" id="topBtn">⬆ 顶部</button>' +
          '<button class="dt-btn" id="bottomBtn">⬇ 底部</button>' +
          '<button class="dt-btn" id="stackBtn">调用栈</button>' +
          '<button class="dt-btn" id="highlightLinks">高亮链接</button>' +
        '</div></div>' +
        '<div class="dt-card"><span class="dt-label">显示 / 缩放 / 夜间</span><div class="dt-row">' +
          '<input type="range" id="brightnessRange" min="20" max="150" value="100" style="flex:1">' +
          '<select id="zoomSel" class="dt-in" style="flex:0 0 110px"><option value="90">90%</option><option value="100" selected>100%</option><option value="110">110%</option><option value="125">125%</option></select>' +
          '<button class="dt-btn" id="nightBtn">夜间: 关</button>' +
        '</div></div>' +
        '<div class="dt-card"><span class="dt-label">FPS 实时</span><div class="dt-row"><button class="dt-btn" id="fpsBtn">FPS: 关</button><span id="fpsPill" class="dt-pill">--</span></div><div id="perfOut" class="dt-kv" style="margin-top:6px"></div></div>' +
      '</div></section>';
  }

  function panelLog() {
    return '<section class="dt-panel" data-panel="log">' +
      '<div id="DTLogHead">' +
        '<div class="dt-log-btns">' +
          '<select id="logFilter" class="dt-in" style="width:auto"><option value="all">全部</option><option value="error">错误</option><option value="warn">警告</option><option value="info">信息</option><option value="success">成功</option><option value="debug">调试</option></select>' +
          '<button id="clearLog">清空</button>' +
          '<button id="copyLog">复制JSON</button>' +
          '<button id="exportLog">导出log</button>' +
          '<button id="assertLog">断言测试</button>' +
        '</div>' +
      '</div>' +
      '<input type="text" id="logSearch" class="dt-in" placeholder="🔍 搜索日志…" style="margin:0 12px 8px">' +
      '<div id="DTLogList"></div>' +
    '</section>';
  }

  function panelTool() {
    return '<section class="dt-panel" data-panel="tool"><div class="dt-scroll">' +
      '<div class="dt-card"><span class="dt-label">执行任意 JS</span><textarea id="jsInput" class="dt-in" placeholder="document.title"></textarea><div class="dt-row" style="margin-top:6px"><button class="dt-btn ok" id="runJs">运行</button><button class="dt-btn" id="clearJs">清空</button></div><div id="jsOut" class="dt-kv" style="margin-top:6px"></div></div>' +
      '<div class="dt-card"><span class="dt-label">保存的片段（点击执行，长按删除）</span><div id="snippetList" class="dt-row"></div><div class="dt-row" style="margin-top:6px"><input type="text" id="snippetName" class="dt-in" placeholder="名称" style="flex:1"><input type="text" id="snippetCode" class="dt-in" placeholder="代码" style="flex:2"><button class="dt-btn ok" id="saveSnippet">保存</button></div></div>' +
      '<div class="dt-card"><span class="dt-label">检测 / 选取</span><div class="dt-row"><button class="dt-btn" id="detectLibs">检测库</button><button class="dt-btn" id="globalBtn">全局变量</button><button class="dt-btn" id="pickElBtn">🎯 点选元素</button><button class="dt-btn" id="measureBtn">📐 测量模式</button></div><div id="toolOut" class="dt-kv" style="margin-top:6px"></div></div>' +
      '<div class="dt-card"><span class="dt-label">URL / 剪贴板</span><div class="dt-row"><button class="dt-btn" id="parseUrl">解析当前URL</button><button class="dt-btn" id="copyUrl">复制URL</button><button class="dt-btn" id="readClip">读取剪贴板</button></div><div id="urlOut" class="dt-kv" style="margin-top:6px"></div></div>' +
      '<div class="dt-card"><span class="dt-label">快捷入口</span><div class="dt-row"><button class="dt-btn" data-dt-open="sidebar-item-control-btn">物品池</button><button class="dt-btn" data-dt-open="sidebar-shop-btn">技能商店</button><button class="dt-btn" data-dt-open="sidebar-synthesis-btn">合成台</button><button class="dt-btn" data-dt-open="sidebar-mod-library-btn">MOD库</button><button class="dt-btn" data-dt-open="sidebar-collect-btn">收藏室</button></div></div>' +
      '<div class="dt-card"><span class="dt-label">存储用量</span><div class="dt-row"><button class="dt-btn" id="storageUsageBtn">统计 localStorage</button></div><div id="storageUsageOut" class="dt-net-body" style="margin-top:6px"></div></div>' +
      '<div class="dt-card"><span class="dt-label">维护</span><div class="dt-row"><button class="dt-btn warn" id="clearCachesBtn">清缓存并重载</button></div></div>' +
    '</div></section>';
  }

  function panelDom() {
    return '<section class="dt-panel" data-panel="dom"><div class="dt-scroll">' +
      '<div class="dt-row"><button class="dt-btn" id="refreshDom">刷新DOM树</button><button class="dt-btn" id="domStats">元素统计</button><button class="dt-btn" id="highlightLinks2">高亮链接</button></div>' +
      '<div id="domTree" class="dt-kv" style="background:#0b1220;border-radius:8px;padding:8px;max-height:45%;overflow:auto"></div>' +
      '<div id="domStatOut" class="dt-kv"></div>' +
    '</div></section>';
  }

  function panelDevice() {
    return '<section class="dt-panel" data-panel="device"><div class="dt-scroll">' +
      '<div class="dt-card dt-kv" id="devInfo"></div>' +
      '<div class="dt-row" style="margin-top:8px"><button class="dt-btn ok" id="freshDev">🔄 刷新设备</button><button class="dt-btn" id="gpsBtn">📍 定位</button><button class="dt-btn" id="batteryBtn">🔋 电量</button><button class="dt-btn" id="orientBtn">🧭 朝向</button><button class="dt-btn" id="permBtn">🔒 权限</button></div>' +
      '<div id="gpsOut" class="dt-kv" style="margin-top:8px"></div>' +
    '</div></section>';
  }

  function panelStorage() {
    return '<section class="dt-panel" data-panel="storage"><div class="dt-scroll">' +
      '<div class="dt-row"><select id="storageType" class="dt-in" style="flex:1"><option value="ls">LocalStorage</option><option value="ss">SessionStorage</option><option value="ck">Cookie</option></select><button class="dt-btn ok" id="storageRefresh">刷新</button><button class="dt-btn warn" id="storageClearAll">清空</button></div>' +
      '<div class="dt-card" style="margin-top:8px"><span class="dt-label">🔑 新增 / 编辑 Key</span><div class="dt-row"><input type="text" id="storageNewKey" class="dt-in" placeholder="key" style="flex:1"><input type="text" id="storageNewVal" class="dt-in" placeholder="value" style="flex:1.5"><button class="dt-btn ok" id="storageAdd">添加</button></div></div>' +
      '<div class="dt-card" style="margin-top:8px"><span class="dt-label">📥 导入 JSON</span><textarea id="storageImport" class="dt-in" placeholder=\'{"key":"value"}\'></textarea><button class="dt-btn" id="storageImportBtn" style="margin-top:6px">导入</button></div>' +
      '<div class="dt-card" style="margin-top:8px"><span class="dt-label">📤 存档备份 (LocalStorage 全量)</span><div class="dt-row" style="margin-top:6px"><button class="dt-btn ok" id="storageExportBtn">导出存档</button><button class="dt-btn" id="storageSnapBtn">立即快照</button><button class="dt-btn warn" id="storageRestoreBtn">恢复最近快照</button></div><div class="dt-label" id="storageSnapInfo" style="margin-top:6px;text-align:left;line-height:1.7"></div></div>' +
      '<div id="storageList" style="margin-top:8px"></div>' +
      '<div id="storageMsg" class="dt-label" style="text-align:center;padding:6px"></div>' +
    '</div></section>';
  }

  function panelNetwork() {
    return '<section class="dt-panel" data-panel="network"><div class="dt-scroll">' +
      '<div class="dt-row"><button class="dt-btn" id="netRefresh">刷新</button><button class="dt-btn" id="netClear">清空</button><button class="dt-btn ok" id="netTest">测试请求</button><button class="dt-btn warn" id="netOffline">模拟离线</button><button class="dt-btn" id="netHar">导出HAR</button><span class="dt-label" style="margin:0">状态: <b id="netStatus"></b></span></div>' +
      '<div id="netOut" class="dt-kv" style="margin-top:8px"></div>' +
      '<div class="dt-card" style="margin-top:10px"><span class="dt-label">线路测速（worker / jsDelivr / raw）</span><div class="dt-row"><button class="dt-btn ok" id="speedTestBtn">开始测速</button></div><div id="speedTestOut" class="dt-net-body" style="margin-top:6px"></div></div>' +
    '</div></section>';
  }

  function panelPerf() {
    return '<section class="dt-panel" data-panel="perf"><div class="dt-scroll">' +
      '<div class="dt-card dt-kv" id="perfInfo"></div>' +
      '<div class="dt-row" style="margin-top:8px"><button class="dt-btn ok" id="perfRefresh">刷新指标</button><button class="dt-btn" id="clsBtn">监听CLS</button><button class="dt-btn" id="longTaskBtn">长任务: 关</button><button class="dt-btn" id="memAutoBtn">内存趋势: 关</button></div>' +
      '<div class="dt-card" style="margin-top:8px"><span class="dt-label">内存趋势 (MB)</span><div id="memChart" style="height:60px;display:flex;align-items:flex-end;gap:2px"></div></div>' +
    '</div></section>';
  }

  function panelMock() {
    return '<section class="dt-panel" data-panel="mock"><div class="dt-scroll">' +
      '<div class="dt-card"><span class="dt-label">🧪 拦截规则（URL包含匹配 → 返回假数据）</span><div class="dt-row"><input type="text" id="mockUrl" class="dt-in" placeholder="匹配URL(如 /api/user)" style="flex:2"><input type="text" id="mockResp" class="dt-in" placeholder="{&quot;ok&quot;:1}" style="flex:2"><button class="dt-btn ok" id="mockAdd">添加</button></div><div class="dt-row" style="margin-top:6px"><span class="dt-label" style="margin:0">模拟延迟:</span><input type="range" id="mockDelay" min="0" max="3000" value="0" style="flex:1"><span id="mockDelayVal" class="dt-label" style="margin:0">0ms</span></div></div>' +
      '<div id="mockList" style="margin-top:8px"></div>' +
      '<div class="dt-row"><button class="dt-btn" id="mockExport">导出规则</button><button class="dt-btn warn" id="mockClear">清空规则</button></div>' +
    '</div></section>';
  }

  function panelGame() {
    return '<section class="dt-panel" data-panel="game"><div class="dt-scroll">' +
      '<div id="gameNotDetected" class="dt-label" style="text-align:center;padding:20px;color:#f87171">未检测到暗区游戏 (需加载 script.js)</div>' +
      '<div id="gameBody" style="display:none">' +
        '<div class="dt-card"><span class="dt-label">💰 累计价值 (柯恩币)</span>' +
          '<div class="dt-row" style="margin-top:6px"><span class="dt-label" style="margin:0;flex:1">当前: <b id="gameCurVal" style="color:#facc15">0</b></span>' +
            '<button class="dt-btn" id="gameRefreshVal">刷新</button></div>' +
          '<div class="dt-row" style="margin-top:6px"><input type="text" id="gameAddVal" class="dt-in" placeholder="数量 (支持 K/M 后缀, 如 5M)" style="flex:2"><button class="dt-btn ok" id="gameAddBtn">增加</button><button class="dt-btn" id="gameSetBtn">设为</button></div>' +
          '<div class="dt-row" style="margin-top:6px"><button class="dt-btn" id="gameVal1m">+1M</button><button class="dt-btn" id="gameVal10m">+10M</button><button class="dt-btn" id="gameVal100m">+100M</button><button class="dt-btn warn" id="gameValZero">清零</button></div>' +
        '</div>' +

        '<div class="dt-card"><span class="dt-label">⚡ 技能 & 加速</span>' +
          '<div class="dt-row" style="margin-top:6px"><button class="dt-btn ok" id="gameUnlockSkills">一键解锁全部技能</button><button class="dt-btn" id="gameResetSkills">重置技能</button></div>' +
          '<div class="dt-row" style="margin-top:6px"><button class="dt-btn" id="gameSpeedMode">开启极速模式 (迅捷巧手+物资潮汐)</button></div>' +
          '<div class="dt-label" style="margin-top:6px;font-size:11px;opacity:.7">极速模式会修改技能存档后自动刷新页面</div>' +
        '</div>' +

        '<div class="dt-card"><span class="dt-label">🏆 收藏 & 背景</span>' +
          '<div class="dt-row" style="margin-top:6px"><button class="dt-btn ok" id="gameUnlockCollect">解锁全部收藏品</button><button class="dt-btn ok" id="gameUnlockBg">解锁全部背景</button></div>' +
        '</div>' +

        '<div class="dt-card"><span class="dt-label">🔄 自动农场</span>' +
          '<div class="dt-row" style="margin-top:6px"><button class="dt-btn ok" id="gameAutoFarm">自动开保险: 关</button><button class="dt-btn" id="gameOpenOnce">立即开保险</button><button class="dt-btn warn" id="gameReset">清空背包</button></div>' +
          '<div class="dt-label" style="margin-top:6px;font-size:11px;opacity:.7">自动农场会循环点击「打开保险」按钮，配合极速模式使用</div>' +
        '</div>' +

        '<div class="dt-card"><span class="dt-label">🎯 精确刷物品</span>' +
          '<div class="dt-row" style="margin-top:6px">' +
            '<input type="text" id="gameItemSearch" class="dt-in" placeholder="搜索物品名…" style="flex:2">' +
            '<button class="dt-btn ok" id="gameLoadItems">加载物品</button>' +
          '</div>' +
          '<div class="dt-label" style="margin-top:6px;font-size:11px;opacity:.7">点击物品立即生成到保险中（不刷新页面），保险放不下时提示</div>' +
          '<div id="gameItemList" class="dt-kv" style="margin-top:6px;max-height:35%;overflow:auto;background:#0b1220;border-radius:8px;padding:8px"></div>' +
        '</div>' +

        '<div class="dt-card"><span class="dt-label">💾 存档管理</span>' +
          '<div class="dt-row" style="margin-top:6px"><button class="dt-btn ok" id="gameExportSave">导出存档</button><button class="dt-btn" id="gameImportSave">导入存档</button><button class="dt-btn warn" id="gameWipeSave">清空存档</button></div>' +
          '<textarea id="gameSaveData" class="dt-in" placeholder="粘贴存档JSON以导入" style="margin-top:6px;min-height:60px"></textarea>' +
        '</div>' +
      '</div>' +
    '</div></section>';
  }

  var Q, S, fabImg, fabFallback, panelEl, backdrop, closeBtn, tabs, panels, logListEl, filterEl, searchEl;

  function init() {
    if (window.__DT_INJECTED__) return;
    window.__DT_INJECTED__ = true;
    buildStyle();
    buildHTML();
    Q = function (sel) { return document.querySelector(sel); };
    S = function (sel) { return document.querySelectorAll(sel); };
    fabImg = Q('#DTFabImg');
    fabFallback = Q('#DTFabFallback');
    panelEl = Q('#' + PANEL_ID);
    backdrop = Q('#DTBackdrop');
    closeBtn = Q('#DTClose');
    tabs = S('#DTTabs button');
    panels = S('.dt-panel');
    logListEl = Q('#DTLogList');
    filterEl = Q('#logFilter');
    searchEl = Q('#logSearch');

    fabImg.addEventListener('error', function () { fabImg.style.display = 'none'; fabFallback.style.display = 'flex'; });
    Q('#' + FAB_ID).addEventListener('click', function (e) { e.stopPropagation(); openDev(true); });
    closeBtn.addEventListener('click', function () { openDev(false); });
    backdrop.addEventListener('click', function () { openDev(false); });
    panelEl.addEventListener('touchmove', function (e) { e.stopPropagation(); }, { passive: false });

    tabs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentTab = btn.getAttribute('data-tab');
        tabs.forEach(function (b) { b.classList.toggle('active', b === btn); });
        panels.forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-panel') === currentTab); });
        if (currentTab === 'log') renderLog();
        if (currentTab === 'device') refreshDevice();
        if (currentTab === 'storage') { renderStorage(); renderSnapInfo(); }
        if (currentTab === 'dom') refreshDom();
        if (currentTab === 'network') renderNetwork();
        if (currentTab === 'perf') refreshPerf();
        if (currentTab === 'mock') renderMock();
        if (currentTab === 'game') refreshGame();
      });
    });

    hookConsole();
    hookError();
    hookFetch();
    hookXHR();
    hookClick();
    hookWS();
    hookStorage();
    captureGameState();
    buildCaptureBtns();
    bindCommon();
    bindLog();
    bindTool();
    bindDom();
    bindDevice();
    bindStorage();
    bindNetwork();
    bindPerf();
    bindMock();
    bindGame();
    refreshDevice();
    renderLog();
    addLog('success', 'DevTools 已就绪 v' + '2.0.0');
  }

  function openDev(open) {
    panelEl.classList.toggle('open', open);
    backdrop.style.display = open ? 'block' : 'none';
    if (open && currentTab === 'log') renderLog();
  }

  function safeStringify(x) {
    try {
      if (x instanceof Error) return x.stack || x.message;
      if (typeof x === 'object' && x !== null) {
        var seen = new WeakSet();
        return JSON.stringify(x, function (k, v) {
          if (typeof v === 'object' && v !== null) {
            if (seen.has(v)) return '[Circular]';
            seen.add(v);
          }
          if (v instanceof Error) return v.message;
          if (typeof v === 'function') return '[Function]';
          if (typeof v === 'bigint') return v.toString();
          return v;
        });
      }
      return String(x);
    } catch (e) { return String(x); }
  }

  function hookConsole() {
    var methods = ['log', 'info', 'debug', 'warn', 'error', 'trace'];
    methods.forEach(function (m) {
      origConsole[m] = console[m];
      console[m] = function () {
        var args = Array.prototype.slice.call(arguments);
        if (capture.console) {
          var txt = args.map(function (x) { return typeof x === 'object' ? safeStringify(x) : String(x); }).join(' ');
          var lv = m === 'error' ? 'error' : m === 'warn' ? 'warn' : m === 'debug' ? 'debug' : m === 'trace' ? 'debug' : 'info';
          addLog(lv, txt);
        }
        origConsole[m].apply(console, args);
      };
    });
  }

  function hookError() {
    window.addEventListener('error', function (e) { if (capture.error) addLog('error', 'JS错误: ' + e.message + ' (' + (e.filename || '') + ':' + (e.lineno || 0) + ')', e.error && e.error.stack || ''); });
    window.addEventListener('unhandledrejection', function (e) { if (capture.error) addLog('error', 'Promise: ' + (e.reason && e.reason.message || e.reason), ''); });
    window.addEventListener('securitypolicyviolation', function (e) { addLog('warn', 'CSP违规: ' + e.violatedDirective + ' → ' + e.blockedURI, ''); });
  }

  function hookFetch() {
    if (!window.fetch) return;
    window.fetch = function () {
      var args = Array.prototype.slice.call(arguments);
      var url = args[0] && args[0].url ? args[0].url : args[0];
      var method = (args[1] && args[1].method) || (args[0] && args[0].method) || 'GET';
      var reqBody = args[1] && args[1].body ? args[1].body : null;

      var hit = mockRules.find(function (r) { return r.url && String(url).includes(r.url); });
      if (hit) {
        if (capture.fetch) addLog('warn', '🧪 Mock拦截: ' + method + ' ' + url);
        var delay = parseInt(Q('#mockDelay').value, 10) || 0;
        var body = JSON.stringify(hit.response || {});
        var init = { status: 200, headers: { 'Content-Type': 'application/json' } };
        return new Promise(function (resolve) { setTimeout(function () { resolve(new Response(body, init)); }, delay); });
      }
      if (capture.fetch) {
        var reqInfo = '🌐 fetch: ' + method + ' ' + url;
        if (reqBody && typeof reqBody === 'string') reqInfo += ' body=' + reqBody.slice(0, 150);
        addLog('info', reqInfo);
      }
      var t = performance.now();
      return origFetch.apply(this, args).then(function (r) {
        var dur = Math.round(performance.now() - t);
        if (capture.fetch) addLog('info', '✅ fetch ' + r.status + ' ' + dur + 'ms');
        var cloned = r.clone();
        cloned.text().then(function (txt) {
          netLogs.push({ method: method, url: String(url), status: r.status, time: dur, resBody: txt.slice(0, 500), reqBody: reqBody ? String(reqBody).slice(0, 300) : '' });
          if (currentTab === 'network') renderNetwork();
        }).catch(function () {
          netLogs.push({ method: method, url: String(url), status: r.status, time: dur, resBody: '', reqBody: reqBody ? String(reqBody).slice(0, 300) : '' });
          if (currentTab === 'network') renderNetwork();
        });
        return r;
      }).catch(function (e) { if (capture.fetch) addLog('error', '❌ fetch ' + url + ' ' + e.message); throw e; });
    };
  }

  function hookXHR() {
    XMLHttpRequest.prototype.open = function (m, u) { this.__m = m; this.__u = u; return origOpen.apply(this, arguments); };
    XMLHttpRequest.prototype.send = function () {
      var x = this;
      var args = Array.prototype.slice.call(arguments);
      var reqBody = args[0] ? args[0] : null;
      try {
        x.addEventListener('load', function () {
          if (capture.xhr) {
            addLog('info', '📡 XHR ' + x.__m + ' ' + x.__u + ' ' + x.status);
            netLogs.push({ method: x.__m, url: x.__u, status: x.status, time: 0, resBody: (x.responseText || '').slice(0, 500), reqBody: reqBody ? String(reqBody).slice(0, 300) : '' });
            if (currentTab === 'network') renderNetwork();
          }
        });
        x.addEventListener('error', function () { if (capture.xhr) addLog('error', '❌ XHR ' + x.__m + ' ' + x.__u); });
      } catch (e) { }
      return origSend.apply(this, arguments);
    };
  }

  function hookClick() {
    document.addEventListener('click', function (e) {
      if (!capture.click) return;
      var t = e.target || document;
      var tag = t.tagName ? t.tagName.toLowerCase() : '?';
      var id = t.id ? '#' + t.id : '';
      var cls = (t.classList && t.classList.length) ? '.' + Array.prototype.slice.call(t.classList).slice(0, 2).join('.') : '';
      addLog('debug', '👆 <' + tag + id + cls + '> ' + (t.textContent && t.textContent.trim().slice(0, 30) || ''), pPath(t));
    }, true);
  }

  function hookWS() {
    if (!origWS) return;
    window.WebSocket = function (url, protocols) {
      var ws = protocols ? new origWS(url, protocols) : new origWS(url);
      if (capture.ws) addLog('info', '🔌 WS 连接: ' + url);
      ws.addEventListener('open', function () { if (capture.ws) addLog('success', '🔌 WS 已打开: ' + url); });
      ws.addEventListener('message', function (e) { if (capture.ws) { var d = typeof e.data === 'string' ? e.data.slice(0, 200) : '[Binary]'; addLog('debug', '⬇ WS 收: ' + d); } });
      var origSend = ws.send.bind(ws);
      ws.send = function (data) { if (capture.ws) { var d = typeof data === 'string' ? data.slice(0, 200) : '[Binary]'; addLog('debug', '⬆ WS 发: ' + d); } return origSend(data); };
      ws.addEventListener('close', function (e) { if (capture.ws) addLog('warn', '🔌 WS 关闭 code=' + e.code); });
      ws.addEventListener('error', function () { if (capture.ws) addLog('error', '🔌 WS 错误: ' + url); });
      return ws;
    };
    window.WebSocket.prototype = origWS.prototype;
  }

  function hookStorage() {
    window.addEventListener('storage', function (e) {
      if (!capture.storage) return;
      addLog('info', '💾 存储变化 [' + (e.storageArea === localStorage ? 'local' : 'session') + '] ' + (e.key || '(全部)') + ' = ' + (e.newValue == null ? '(删除)' : String(e.newValue).slice(0, 100)));
    });
    var lsSet = Storage.prototype.setItem, lsRem = Storage.prototype.removeItem, lsClr = Storage.prototype.clear;
    Storage.prototype.setItem = function (k, v) { if (capture.storage && this === localStorage) addLog('info', '💾 localStorage set: ' + k); return lsSet.apply(this, arguments); };
    Storage.prototype.removeItem = function (k) { if (capture.storage && this === localStorage) addLog('info', '💾 localStorage remove: ' + k); return lsRem.apply(this, arguments); };
    Storage.prototype.clear = function () { if (capture.storage && this === localStorage) addLog('warn', '💾 localStorage clear'); return lsClr.apply(this, arguments); };
  }

  function pPath(el) {
    var a = []; var p = el;
    while (p && p !== document.body && p !== document.documentElement) { a.push((p.tagName ? p.tagName.toLowerCase() : '') + (p.id ? '#' + p.id : '')); p = p.parentElement; }
    return a.reverse().join(' < ');
  }

  function buildCaptureBtns() {
    var box = Q('#captureBtns');
    var defs = [
      { key: 'console', label: 'console' }, { key: 'error', label: 'JS错误' }, { key: 'fetch', label: 'fetch' },
      { key: 'xhr', label: 'XHR' }, { key: 'click', label: '点击' }, { key: 'ws', label: 'WebSocket' }, { key: 'storage', label: '存储变化' }
    ];
    box.innerHTML = '';
    defs.forEach(function (d) {
      var b = document.createElement('button');
      b.className = 'dt-btn';
      b.textContent = d.label + ': ' + (capture[d.key] ? '开' : '关');
      b.addEventListener('click', function () {
        capture[d.key] = !capture[d.key];
        b.textContent = d.label + ': ' + (capture[d.key] ? '开' : '关');
      });
      box.appendChild(b);
    });
  }

  function bindCommon() {
    Q('#reloadBtn').addEventListener('click', function () { location.reload(); });
    Q('#topBtn').addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    Q('#bottomBtn').addEventListener('click', function () { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); });
    Q('#stackBtn').addEventListener('click', function () { addLog('debug', '调用栈样本', new Error().stack); });
    var hl = function () { document.querySelectorAll('a,button,[onclick]').forEach(function (a) { a.style.outline = a.style.outline ? '' : '2px solid #38bdf8'; }); addLog('info', '高亮可点击元素'); };
    Q('#highlightLinks').addEventListener('click', hl);
    Q('#highlightLinks2').addEventListener('click', hl);

    Q('#nightBtn').addEventListener('click', function () {
      var on = this.textContent.includes('关');
      if (on) { document.body.style.filter = 'invert(0.9) hue-rotate(180deg)'; this.textContent = '夜间: 开'; } else { document.body.style.filter = ''; this.textContent = '夜间: 关'; }
    });
    Q('#brightnessRange').addEventListener('input', function () { document.body.style.filter = 'brightness(' + this.value + '%)'; });
    Q('#zoomSel').addEventListener('change', function () { document.body.style.zoom = this.value / 100; });

    Q('#fpsBtn').addEventListener('click', function () {
      fps = !fps;
      this.textContent = 'FPS: ' + (fps ? '开' : '关');
      if (fps) { fpsLast = performance.now(); fpsFrame = 0; loopFps(); } else { cancelAnimationFrame(fpsRAF); var p = Q('#fpsPill'); p.textContent = '--'; p.style.color = ''; }
    });

    // 键盘快捷键: Ctrl+Shift+D / Cmd+Shift+D 或 Ctrl+~ 切换面板
    document.addEventListener('keydown', function (e) {
      var mod = e.ctrlKey || e.metaKey;
      if (mod && e.shiftKey && e.key.toLowerCase() === 'd') { e.preventDefault(); openDev(!panelEl.classList.contains('open')); }
      else if (mod && e.key === '`') { e.preventDefault(); openDev(!panelEl.classList.contains('open')); }
      else if (e.key === 'Escape' && panelEl.classList.contains('open')) { openDev(false); }
    });

  }

  function loopFps() {
    fpsFrame++;
    var now = performance.now();
    var d = now - fpsLast;
    if (d >= 1000) { fpsVal = Math.round(fpsFrame * 1000 / d); fpsFrame = 0; fpsLast = now; var pill = Q('#fpsPill'); pill.textContent = fpsVal + ' FPS'; pill.style.color = fpsVal >= 50 ? '#4ade80' : fpsVal >= 30 ? '#facc15' : '#f87171'; }
    fpsRAF = requestAnimationFrame(loopFps);
  }

  function renderLog() {
    if (!logListEl) return;
    var f = filterEl ? filterEl.value : 'all';
    var kw = searchEl ? searchEl.value.trim().toLowerCase() : '';
    var rows = '';
    for (var i = 0; i < L.length; i++) {
      var it = L[i];
      if (f !== 'all' && it.l !== f) continue;
      if (kw && it.m.toLowerCase().indexOf(kw) === -1 && (it.e || '').toLowerCase().indexOf(kw) === -1) continue;
      var hasStk = !!it.e;
      rows += '<div class="dt-log-item ' + it.l + '" data-i="' + i + '" style="cursor:' + (hasStk ? 'pointer' : 'default') + '">' +
        '<span class="dt-t">[' + it.t + ']</span><span class="dt-lv">' + it.l.toUpperCase() + '</span>' + esc(it.m) +
        (hasStk ? '<div class="dt-stk" style="display:none;white-space:pre-wrap">' + esc(it.e) + '</div>' : '') +
        '</div>';
    }
    logListEl.innerHTML = rows || '<div class="dt-log-item info" style="border-color:#334155">暂无日志</div>';
    logListEl.querySelectorAll('.dt-log-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var stk = item.querySelector('.dt-stk');
        if (stk) stk.style.display = stk.style.display === 'none' ? 'block' : 'none';
      });
    });
    logListEl.scrollTop = logListEl.scrollHeight;
  }

  function bindLog() {
    if (filterEl) filterEl.addEventListener('change', renderLog);
    if (searchEl) searchEl.addEventListener('input', renderLog);
    Q('#clearLog').addEventListener('click', function () { L.length = 0; renderLog(); updateBadge(); });
    Q('#copyLog').addEventListener('click', function () { navigator.clipboard.writeText(JSON.stringify(L, null, 2)).then(function () { toast('日志已复制'); }).catch(function () { toast('复制失败', 'error'); }); });
    Q('#exportLog').addEventListener('click', function () {
      var blob = new Blob([L.map(function (l) { return '[' + l.t + '] [' + l.l + '] ' + l.m + (l.e ? '\n' + l.e : ''); }).join('\n')], { type: 'text/plain' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'debug_' + Date.now() + '.log'; a.click();
    });
    Q('#assertLog').addEventListener('click', function () {
      addLog('info', '=== 断言测试开始 ===');
      addLog(typeof window.jQuery !== 'undefined' ? 'success' : 'warn', 'jQuery 存在: ' + (typeof window.jQuery !== 'undefined'));
      addLog(typeof window.$ !== 'undefined' ? 'success' : 'warn', '$ 存在: ' + (typeof window.$ !== 'undefined'));
      addLog(document.readyState === 'complete' ? 'success' : 'warn', '文档加载完成: ' + document.readyState);
      addLog('success', 'localStorage 可用: ' + (function () { try { localStorage.setItem('__dt__', '1'); localStorage.removeItem('__dt__'); return true; } catch (e) { return false; } })());
      addLog('info', 'fetch 可用: ' + (typeof window.fetch === 'function'));
      var errs = 0; for (var i = 0; i < L.length; i++) if (L[i].l === 'error') errs++;
      addLog(errs === 0 ? 'success' : 'error', '未捕获错误数: ' + errs);
      addLog('info', '=== 断言测试结束 ===');
    });
  }

  function bindTool() {
    Q('#runJs').addEventListener('click', function () {
      var code = Q('#jsInput').value; if (!code) return;
      try { var r = eval(code); Q('#jsOut').textContent = typeof r === 'object' ? JSON.stringify(r, null, 2) : String(r); addLog('success', 'JS执行: ' + String(r)); }
      catch (e) { Q('#jsOut').textContent = '❌ ' + e.message; addLog('error', 'JS执行失败: ' + e.message, e.stack); }
    });
    Q('#clearJs').addEventListener('click', function () { Q('#jsInput').value = ''; Q('#jsOut').textContent = ''; });

    Q('#detectLibs').addEventListener('click', function () {
      var libs = ['jQuery', '$', 'React', 'Vue', 'Angular', 'axios', '_', 'lodash', 'THREE', 'Phaser', 'PIXI', 'gsap', 'io', 'Socket', 'cordova', 'Capacitor'];
      var found = libs.filter(function (n) { return typeof window[n] !== 'undefined'; });
      Q('#toolOut').textContent = found.length ? found.join(', ') : '未检测到常见库';
      addLog('info', '检测到: ' + (found.length ? found.join(',') : '无'));
    });
    Q('#globalBtn').addEventListener('click', function () {
      var keys = Object.getOwnPropertyNames(window).filter(function (k) { return !/^__/.test(k) && k !== 'DT'; }).slice(0, 60);
      Q('#toolOut').textContent = keys.join('\n');
      addLog('info', '全局变量 ' + keys.length + ' 个');
    });

    Q('#pickElBtn').addEventListener('click', function () { window.__DT_PICK__ = true; addLog('info', '🎯 点击页面元素'); });
    document.addEventListener('click', function (e) {
      if (window.__DT_PICK__) { window.__DT_PICK__ = false; var t = e.target; Q('#toolOut').textContent = '<' + t.tagName.toLowerCase() + (t.id ? '#' + t.id : '') + '>\n' + (t.outerHTML || '').slice(0, 400); addLog('debug', '选取: ' + pPath(t)); }
    });

    Q('#measureBtn').addEventListener('click', function () {
      window.__DT_MEASURE__ = !window.__DT_MEASURE__;
      toast(window.__DT_MEASURE__ ? '点击元素测量' : '测量关闭');
    });
    document.addEventListener('click', function (e) {
      if (window.__DT_MEASURE__) { var r = e.target.getBoundingClientRect(); Q('#toolOut').textContent = 'x:' + Math.round(r.x) + ' y:' + Math.round(r.y) + ' w:' + Math.round(r.width) + ' h:' + Math.round(r.height) + '\n字体:' + getComputedStyle(e.target).fontSize; }
    }, true);

    Q('#parseUrl').addEventListener('click', function () { var u = new URL(location.href); Q('#urlOut').textContent = '协议:' + u.protocol + '\n域名:' + u.host + '\n路径:' + u.pathname + '\n参数:' + JSON.stringify(Object.fromEntries(u.searchParams)); });
    Q('#copyUrl').addEventListener('click', function () { navigator.clipboard.writeText(location.href).then(function () { toast('已复制'); }); });
    Q('#readClip').addEventListener('click', function () { navigator.clipboard.readText().then(function (t) { Q('#urlOut').textContent = t; }).catch(function (e) { toast('无权限', 'error'); }); });
    // 快捷入口：直接打开对应页面
    document.querySelectorAll('[data-dt-open]').forEach(function (b) {
      b.addEventListener('click', function () {
        var el = document.getElementById(b.getAttribute('data-dt-open'));
        if (el) { try { el.click(); } catch (e) {} }
        openDev(false);
      });
    });
    // 存储用量（localStorage 各项大小排序）
    if (Q('#storageUsageBtn')) Q('#storageUsageBtn').addEventListener('click', function () {
      try {
        var arr = [], total = 0;
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i), v = localStorage.getItem(k) || '';
          var s = (k.length + v.length) * 2; total += s; arr.push([k, s]);
        }
        arr.sort(function (a, b) { return b[1] - a[1]; });
        Q('#storageUsageOut').textContent = '共 ' + localStorage.length + ' 项，约 ' + (total / 1024).toFixed(1) + ' KB\n' + arr.map(function (x) { return x[0] + '  ' + (x[1] / 1024).toFixed(1) + ' KB'; }).join('\n');
      } catch (e) { Q('#storageUsageOut').textContent = String(e); }
    });
    // 清缓存并重载
    if (Q('#clearCachesBtn')) Q('#clearCachesBtn').addEventListener('click', function () {
      confirmBox('清空所有 cache 缓存并重载?(不删 localStorage)', function () {
        try { if (window.caches && caches.keys) caches.keys().then(function (ks) { ks.forEach(function (k) { caches.delete(k); }); }); } catch (e) {}
        setTimeout(function () { location.reload(); }, 400);
      });
    });

    Q('#saveSnippet').addEventListener('click', function () {
      var name = Q('#snippetName').value.trim();
      var code = Q('#snippetCode').value.trim();
      if (!name || !code) { toast('名称和代码不能为空', 'error'); return; }
      snippetList.push({ name: name, code: code });
      saveSnippets();
      Q('#snippetName').value = ''; Q('#snippetCode').value = '';
      renderSnippets();
      toast('片段已保存');
    });

    // 加载持久化片段
    try { snippetList = JSON.parse(localStorage.getItem('__dt_snippets__') || '[]'); } catch (e) { snippetList = []; }
    renderSnippets();
  }

  function saveSnippets() {
    try { localStorage.setItem('__dt_snippets__', JSON.stringify(snippetList)); } catch (e) { }
  }

  function renderSnippets() {
    var box = Q('#snippetList'); if (!box) return;
    var html = '';
    snippetList.forEach(function (s, i) {
      html += '<button class="dt-btn" data-i="' + i + '" style="flex:0 0 auto">' + esc(s.name) + '</button>';
    });
    box.innerHTML = html || '<span class="dt-label">暂无片段</span>';
    box.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { try { eval(snippetList[parseInt(b.getAttribute('data-i'), 10)].code); addLog('success', '执行片段: ' + b.textContent); } catch (e) { addLog('error', e.message); } });
      b.addEventListener('contextmenu', function (ev) { ev.preventDefault(); confirmBox('删除片段「' + b.textContent + '」?', function () { snippetList.splice(parseInt(b.getAttribute('data-i'), 10), 1); saveSnippets(); renderSnippets(); }); });
    });
  }

  function bindDom() {
    Q('#refreshDom').addEventListener('click', refreshDom);
    Q('#domStats').addEventListener('click', function () {
      Q('#domStatOut').textContent = '元素:' + document.querySelectorAll('*').length + ' img:' + document.images.length + ' a:' + document.links.length + ' script:' + document.querySelectorAll('script').length + ' div:' + document.querySelectorAll('div').length + ' canvas:' + document.querySelectorAll('canvas').length;
    });
  }

  function refreshDom() {
    var tree = Q('#domTree'); if (!tree) return;
    var html = '';
    var walk = function (el, d) {
      if (d > 6) return;
      var tag = el.tagName ? el.tagName.toLowerCase() : '';
      if (!tag) return;
      var id = el.id ? '#' + el.id : '';
      var cls = (el.classList && el.classList.length) ? '.' + Array.prototype.slice.call(el.classList).slice(0, 2).join('.') : '';
      html += '<div style="margin-left:' + (d * 14) + 'px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><span style="color:#f87171">&lt;</span>' + tag + id + cls + '<span style="color:#f87171">&gt;</span></div>';
      var kids = el.children;
      for (var i = 0; i < Math.min(kids.length, 10); i++) walk(kids[i], d + 1);
    };
    walk(document.body, 0);
    tree.innerHTML = html || '无法读取DOM';
    Q('#domStatOut').textContent = '元素总数: ' + document.querySelectorAll('*').length;
  }

  function bindDevice() {
    Q('#freshDev').addEventListener('click', refreshDevice);
    Q('#gpsBtn').addEventListener('click', function () {
      if (!navigator.geolocation) { Q('#gpsOut').textContent = '不支持定位'; return; }
      navigator.geolocation.getCurrentPosition(function (p) { Q('#gpsOut').textContent = '纬度:' + p.coords.latitude.toFixed(5) + '\n经度:' + p.coords.longitude.toFixed(5) + '\n精度:±' + p.coords.accuracy.toFixed(0) + 'm'; }, function (e) { Q('#gpsOut').textContent = '失败:' + e.message; });
    });
    Q('#batteryBtn').addEventListener('click', function () {
      if (!navigator.getBattery) { Q('#gpsOut').textContent = '电量API不支持'; return; }
      navigator.getBattery().then(function (b) { Q('#gpsOut').textContent = '电量:' + Math.round(b.level * 100) + '% ' + (b.charging ? '充电中' : ''); });
    });
    Q('#orientBtn').addEventListener('click', function () {
      if (!window.DeviceOrientationEvent) { Q('#gpsOut').textContent = '不支持方向传感器'; return; }
      window.addEventListener('deviceorientation', function handler(e) { Q('#gpsOut').textContent = 'α:' + e.alpha.toFixed(1) + ' β:' + e.beta.toFixed(1) + ' γ:' + e.gamma.toFixed(1); window.removeEventListener('deviceorientation', handler); }, { once: true });
      toast('请转动设备');
    });
    Q('#permBtn').addEventListener('click', function () {
      var names = ['geolocation', 'notifications', 'camera', 'microphone', 'clipboard-read', 'clipboard-write'];
      var out = [];
      names.forEach(function (n) { if (navigator.permissions && navigator.permissions.query) { navigator.permissions.query({ name: n }).then(function (r) { out.push(n + ':' + r.state); Q('#gpsOut').textContent = out.join('\n'); }).catch(function () { }); } });
      if (!out.length) Q('#gpsOut').textContent = '权限API不支持';
    });
  }

  function refreshDevice() {
    var el = Q('#devInfo'); if (!el) return;
    var conn = navigator.connection || navigator.webkitConnection;
    el.innerHTML =
      '<b>UA</b> ' + esc(navigator.userAgent.slice(0, 90)) + '\n' +
      '<b>平台</b> ' + navigator.platform + ' | <b>语言</b> ' + navigator.language + '\n' +
      '<b>CPU</b> ' + (navigator.hardwareConcurrency || '?') + '核 | <b>内存</b> ' + (navigator.deviceMemory ? navigator.deviceMemory + 'GB' : '?') + '\n' +
      '<b>网络</b> ' + (conn ? conn.effectiveType : '?') + ' | <b>在线</b> ' + navigator.onLine + '\n' +
      '<b>屏幕</b> ' + screen.width + '×' + screen.height + ' | <b>视口</b> ' + innerWidth + '×' + innerHeight + '\n' +
      '<b>时区</b> ' + Intl.DateTimeFormat().resolvedOptions().timeZone + ' | <b>触屏</b> ' + ('ontouchstart' in window);
  }

  function storageKey() { return Q('#storageType').value; }
  function storageKeys() {
    if (storageKey() === 'ls') return Object.keys(localStorage);
    if (storageKey() === 'ss') return Object.keys(sessionStorage);
    return document.cookie.split(';').map(function (c) { return c.split('=')[0].trim(); }).filter(Boolean);
  }
  function storageGet(k) {
    try { if (storageKey() === 'ls') return localStorage.getItem(k); if (storageKey() === 'ss') return sessionStorage.getItem(k); var m = document.cookie.match(new RegExp('(^| )' + k + '=([^;]+)')); return m ? decodeURIComponent(m[2]) : null; } catch (e) { return null; }
  }
  function storageSet(k, v) {
    try { if (storageKey() === 'ls') localStorage.setItem(k, v); else if (storageKey() === 'ss') sessionStorage.setItem(k, v); else document.cookie = k + '=' + encodeURIComponent(v) + ';expires=' + new Date(Date.now() + 31536000000).toUTCString() + ';path=/'; toast('已保存'); } catch (e) { toast('写入失败:' + e.message, 'error'); }
  }
  function storageRemove(k) { try { if (storageKey() === 'ls') localStorage.removeItem(k); else if (storageKey() === 'ss') sessionStorage.removeItem(k); else document.cookie = k + '=;expires=Thu,01 Jan 1970 00:00:00 GMT;path=/'; } catch (e) { } }

  function bindStorage() {
    Q('#storageRefresh').addEventListener('click', renderStorage);
    Q('#storageType').addEventListener('change', renderStorage);
    Q('#storageAdd').addEventListener('click', function () {
      var k = Q('#storageNewKey').value.trim(); var v = Q('#storageNewVal').value;
      if (!k) { toast('key不能为空', 'error'); return; }
      storageSet(k, v); Q('#storageNewKey').value = ''; Q('#storageNewVal').value = ''; renderStorage();
    });
    Q('#storageClearAll').addEventListener('click', function () {
      confirmBox('清空当前存储 (' + storageKey() + ')? 此操作不可撤销', function () {
        var ks = storageKeys();
        ks.forEach(function (k) { storageRemove(k); });
        renderStorage(); addLog('warn', '清空存储: ' + ks.length + ' 项');
      });
    });
    Q('#storageImportBtn').addEventListener('click', function () {
      try { var obj = JSON.parse(Q('#storageImport').value); var n = 0; for (var k in obj) { storageSet(k, String(obj[k])); n++; } toast('导入 ' + n + ' 项'); renderStorage(); } catch (e) { toast('JSON解析失败:' + e.message, 'error'); }
    });
    Q('#storageExportBtn').addEventListener('click', function () {
      if (!window.Save) { toast('存档层未加载', 'error'); return; }
      try {
        var r = Save.exportAll();
        Q('#storageImport').value = r.text;
        toast('已导出 ' + r.count + ' 项' + (r.skipped.length ? '，跳过 ' + r.skipped.length + ' 项缓存' : '') + '，复制上方文本框保存');
        renderSnapInfo();
      } catch (e) { toast('导出失败:' + e.message, 'error'); }
    });
    Q('#storageSnapBtn').addEventListener('click', function () {
      if (!window.Save) { toast('存档层未加载', 'error'); return; }
      Save.snapshot('manual').then(function (r) {
        toast('快照完成，' + r.count + ' 项');
        renderSnapInfo();
      }).catch(function (e) { toast('快照失败:' + e.message, 'error'); });
    });
    Q('#storageRestoreBtn').addEventListener('click', function () {
      if (!window.Save) { toast('存档层未加载', 'error'); return; }
      Save.listSnapshots().then(function (list) {
        if (!list.length) { toast('还没有快照', 'error'); return; }
        var s = list[0];
        confirmBox('恢复 ' + new Date(s.ts).toLocaleString() + ' 的快照 (' + s.count + ' 项)？当前存档会先自动备份', function () {
          Save.restore(s.ts).then(function (r) {
            toast('已恢复 ' + r.restored + ' 项，请重载页面');
            renderStorage(); renderSnapInfo();
          }).catch(function (e) { toast('恢复失败:' + e.message, 'error'); });
        });
      });
    });
  }

  function renderSnapInfo() {
    var el = Q('#storageSnapInfo'); if (!el) return;
    if (!window.Save) { el.textContent = '存档层未加载 (js/storage.js)'; return; }
    var st = Save.status();
    var html = '代理: ' + (st.patched ? '已启用' : '未启用') + ' · 读 ' + st.reads + ' · 写 ' + st.writes;
    if (st.fails) html += ' · 写失败 ' + st.fails + ' (已兜底)';
    if (st.recovered) html += ' · 已补写 ' + st.recovered;
    if (st.pending) html += ' · <b style="color:#f59e0b">待写回 ' + st.pending + '</b>';
    if (st.lastError) html += '<br>最近错误: ' + esc(st.lastError);
    if (Save.syncKeys) html += '<br>云同步: ' + Save.syncKeys().length + ' 项（核心 ' + Save.syncCoreKeys().length + ' 项）';
    el.innerHTML = html + '<br>快照: 读取中…';
    Save.listSnapshots().then(function (list) {
      var line = list.length ? list.map(function (s) {
        return new Date(s.ts).toLocaleString() + ' (' + s.count + ' 项' + (s.skipped ? '，跳过 ' + s.skipped : '') + ')';
      }).join('<br>') : '暂无';
      el.innerHTML = html + '<br>快照: ' + line;
    });
  }

  function renderStorage() {
    var list = Q('#storageList'); if (!list) return;
    Q('#storageMsg').textContent = '';
    var keys = storageKeys();
    if (!keys.length) { list.innerHTML = '<div class="dt-label" style="text-align:center;padding:12px">空存储</div>'; return; }
    var html = '';
    keys.forEach(function (k) {
      var v = storageGet(k); var isImg = typeof v === 'string' && /^data:image/.test(v); var isJson = typeof v === 'string' && (/^\{/.test(v) || /^\[/.test(v));
      var shown = v && v.length > 200 ? v.slice(0, 200) + '…' : v;
      html += '<div class="dt-storage-item" data-k="' + esc(k) + '">' +
        '<div class="dt-storage-key">' + esc(k) + (isImg ? ' <span class="dt-pill">IMG</span>' : isJson ? ' <span class="dt-pill">JSON</span>' : '') + '</div>' +
        '<div class="dt-storage-val">' + esc(shown) + '</div>' +
        (isImg ? '<img src="' + v + '" class="dt-storage-thumb">' : '') +
        (isJson ? '<div class="dt-json">' + esc(fmtJSON(v)) + '</div>' : '') +
        '<div class="dt-actions"><button class="mini edit">✏️编辑</button><button class="mini del">🗑️删除</button><button class="mini copy">📋复制值</button></div>' +
      '</div>';
    });
    list.innerHTML = html;
    list.querySelectorAll('.dt-storage-item').forEach(function (item) {
      var key = item.getAttribute('data-k');
      item.querySelector('.edit').addEventListener('click', function () {
        var nv = prompt('编辑值 (' + key + ')', storageGet(key) || '');
        if (nv !== null) { storageSet(key, nv); renderStorage(); }
      });
      item.querySelector('.del').addEventListener('click', function () { confirmBox('删除 ' + key + '?', function () { storageRemove(key); renderStorage(); addLog('warn', '删除存储: ' + key); }); });
      item.querySelector('.copy').addEventListener('click', function () { navigator.clipboard.writeText(storageGet(key) || '').then(function () { toast('已复制'); }); });
    });
  }

  function fmtJSON(v) { try { return JSON.stringify(JSON.parse(v), null, 2); } catch (e) { return v; } }

  function bindNetwork() {
    Q('#netRefresh').addEventListener('click', renderNetwork);
    Q('#netClear').addEventListener('click', function () { netLogs.length = 0; renderNetwork(); });
    Q('#netTest').addEventListener('click', function () { fetch(location.href).then(function (r) { netLogs.push({ method: 'GET', url: location.href, status: r.status, time: 0 }); renderNetwork(); addLog('success', '测试请求完成'); }).catch(function (e) { addLog('error', '测试请求失败:' + e.message); }); });
    Q('#netOffline').addEventListener('click', function () { window.__DT_OFFLINE__ = !window.__DT_OFFLINE__; toast(window.__DT_OFFLINE__ ? '已模拟离线(fetch会被拒绝)' : '恢复'); });
    Q('#netHar').addEventListener('click', exportHAR);
    // 线路测速：并发测 worker / jsDelivr / raw 延迟
    if (Q('#speedTestBtn')) Q('#speedTestBtn').addEventListener('click', function () {
      var urls = [
        ['worker', 'https://anqu-raw.sdfgasdfgwe7.workers.dev/incredibox-Para-DX/anqu-apk-release/main/manifest.json'],
        ['jsDelivr', 'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-apk-release@main/manifest.json'],
        ['raw', 'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-apk-release/main/manifest.json']
      ];
      var out = Q('#speedTestOut');
      out.textContent = '测速中…\n';
      urls.forEach(function (u) {
        var name = u[0], url = u[1], t0 = Date.now(), done = false;
        var timer = setTimeout(function () { if (!done) { done = true; out.textContent += name + ': 超时(>6s)\n'; } }, 6000);
        fetch(url + '?t=' + Date.now(), { cache: 'no-store' }).then(function (r) {
          if (done) return; done = true; clearTimeout(timer);
          out.textContent += name + ': ' + (r.ok ? 'OK ' + (Date.now() - t0) + 'ms' : 'HTTP ' + r.status) + '\n';
        }).catch(function () {
          if (done) return; done = true; clearTimeout(timer);
          out.textContent += name + ': 失败 ' + (Date.now() - t0) + 'ms\n';
        });
      });
    });
    if (window.fetch && !window.__DT_NET_HOOKED__) {
      var orig = window.fetch;
      window.fetch = function () { if (window.__DT_OFFLINE__) return Promise.reject(new Error('Network offline (mocked)')); return orig.apply(this, arguments); };
      window.__DT_NET_HOOKED__ = true;
    }
    window.addEventListener('online', function () { Q('#netStatus').textContent = 'online'; addLog('success', '网络恢复'); });
    window.addEventListener('offline', function () { Q('#netStatus').textContent = 'offline'; addLog('warn', '网络断开'); });
  }

  function statusColor(s) {
    if (!s) return '#94a3b8';
    if (s >= 500) return '#f87171';
    if (s >= 400) return '#fb923c';
    if (s >= 300) return '#facc15';
    return '#4ade80';
  }

  function exportHAR() {
    var har = { log: { version: '1.2', creator: { name: 'GM debug', version: '2.0.0' }, entries: [] } };
    netLogs.forEach(function (x) {
      har.log.entries.push({
        request: { method: x.method, url: x.url, postData: x.reqBody ? { text: x.reqBody } : undefined },
        response: { status: x.status || 0, content: { text: x.resBody || '', size: (x.resBody || '').length } },
        time: x.time || 0
      });
    });
    var blob = new Blob([JSON.stringify(har, null, 2)], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'network_' + Date.now() + '.har'; a.click();
    toast('已导出 HAR');
  }

  function renderNetwork() {
    var out = Q('#netOut'); if (!out) return;
    Q('#netStatus').textContent = navigator.onLine ? 'online' : 'offline';
    if (!netLogs.length) { out.innerHTML = '<div class="dt-label" style="text-align:center;padding:12px">暂无请求记录</div>'; return; }
    var html = netLogs.slice().reverse().map(function (x, idx) {
      var realIdx = netLogs.length - 1 - idx;
      var st = x.status ? '✅' + x.status : '❌';
      var sc = statusColor(x.status);
      var reqB = x.reqBody ? '<div class="dt-json">REQ: ' + esc(fmtJSON(x.reqBody)) + '</div>' : '';
      var resB = x.resBody ? '<div class="dt-json">RES: ' + esc(fmtJSON(x.resBody)) + '</div>' : '';
      return '<div class="dt-storage-item" style="cursor:pointer" data-i="' + realIdx + '">' +
        '<div class="dt-storage-key"><b style="color:#38bdf8">' + esc(x.method) + '</b> ' + esc(x.url) + ' <b style="color:' + sc + '">' + st + '</b> ' + (x.time || 0) + 'ms</div>' +
        '<div class="dt-net-body" style="display:none">' + reqB + resB + '</div>' +
      '</div>';
    }).join('');
    out.innerHTML = html;
    out.querySelectorAll('.dt-storage-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var b = item.querySelector('.dt-net-body');
        b.style.display = b.style.display === 'none' ? 'block' : 'none';
      });
    });
  }

  function bindPerf() {
    Q('#perfRefresh').addEventListener('click', refreshPerf);
    Q('#clsBtn').addEventListener('click', function () {
      if (!('IntersectionObserver' in window)) { toast('不支持CLS监听', 'error'); return; }
      var cls = 0;
      try {
        var po = new PerformanceObserver(function (list) { list.getEntries().forEach(function (e) { if (!e.hadRecentInput) { cls += e.value; Q('#perfInfo').textContent = 'CLS: ' + cls.toFixed(4); } }); });
        po.observe({ type: 'layout-shift', buffered: true });
        toast('CLS监听中');
      } catch (e) { toast('CLS不可用', 'error'); }
    });
    Q('#longTaskBtn').addEventListener('click', function () {
      if (longTaskObserver) { longTaskObserver.disconnect(); longTaskObserver = null; this.textContent = '长任务: 关'; toast('长任务监听关闭'); return; }
      if (!('PerformanceObserver' in window)) { toast('不支持 PerformanceObserver', 'error'); return; }
      try {
        longTaskObserver = new PerformanceObserver(function (list) {
          list.getEntries().forEach(function (e) {
            addLog('warn', '🐌 长任务: ' + Math.round(e.duration) + 'ms (卡顿)');
          });
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.textContent = '长任务: 开';
        toast('长任务监听中');
      } catch (e) { toast('长任务不可用', 'error'); }
    });
    Q('#memAutoBtn').addEventListener('click', function () {
      if (memAutoTimer) { clearInterval(memAutoTimer); memAutoTimer = null; this.textContent = '内存趋势: 关'; return; }
      if (!performance.memory) { toast('内存API不支持', 'error'); return; }
      memAutoTimer = setInterval(refreshPerf, 2000);
      this.textContent = '内存趋势: 开';
      toast('内存趋势自动刷新中');
    });
  }

  function refreshPerf() {
    var el = Q('#perfInfo'); if (!el) return;
    var mem = performance.memory ? (performance.memory.usedJSHeapSize / 1048576).toFixed(1) + ' / ' + (performance.memory.jsHeapSizeLimit / 1048576).toFixed(0) + ' MB' : '不支持';
    var t = performance.timing;
    var ttfb = t ? (t.responseStart - t.requestStart) : 0;
    var fcp = t ? (t.domContentLoadedEventStart - t.navigationStart) : 0;
    el.textContent = '内存: ' + mem + '\n节点数: ' + document.querySelectorAll('*').length + '\n资源数: ' + performance.getEntriesByType('resource').length + '\nTTFB: ' + ttfb + 'ms\nDOMContentLoaded: ' + fcp + 'ms';
    var chart = Q('#memChart'); if (chart && performance.memory) {
      perfLines.push(performance.memory.usedJSHeapSize / 1048576);
      if (perfLines.length > 40) perfLines.shift();
      var max = Math.max.apply(null, perfLines.concat([1]));
      chart.innerHTML = perfLines.map(function (v) { return '<div style="flex:1;height:' + Math.round(v / max * 50) + 'px;background:#38bdf8;min-height:2px"></div>'; }).join('');
    }
  }

  function bindMock() {
    Q('#mockDelay').addEventListener('input', function () { Q('#mockDelayVal').textContent = this.value + 'ms'; });
    Q('#mockAdd').addEventListener('click', function () {
      var u = Q('#mockUrl').value.trim(); var r = Q('#mockResp').value.trim();
      if (!u) { toast('请输入匹配URL', 'error'); return; }
      try { var parsed = r ? JSON.parse(r) : {}; mockRules.push({ url: u, response: parsed }); renderMock(); toast('已添加规则'); Q('#mockUrl').value = ''; Q('#mockResp').value = ''; } catch (e) { toast('响应JSON无效:' + e.message, 'error'); }
    });
    Q('#mockClear').addEventListener('click', function () { confirmBox('清空全部Mock规则?', function () { mockRules.length = 0; renderMock(); }); });
    Q('#mockExport').addEventListener('click', function () { navigator.clipboard.writeText(JSON.stringify(mockRules, null, 2)).then(function () { toast('规则已复制'); }); });
  }

  function renderMock() {
    var list = Q('#mockList'); if (!list) return;
    list.innerHTML = mockRules.map(function (r, i) { return '<div class="dt-storage-item"><div class="dt-storage-key">' + esc(r.url) + '</div><div class="dt-json">' + esc(JSON.stringify(r.response)) + '</div><div class="dt-actions"><button class="mini del" data-i="' + i + '">🗑️删除</button></div></div>'; }).join('') || '<div class="dt-label" style="text-align:center;padding:12px">暂无规则</div>';
    list.querySelectorAll('.del').forEach(function (b) { b.addEventListener('click', function () { mockRules.splice(parseInt(b.getAttribute('data-i'), 10), 1); renderMock(); }); });
  }

  // ===== 暗区游戏调试功能 =====
  var GAME_STORAGE_KEYS = [
    'darkzone_simulator_stats', 'ab_shop_skills_v1', 'ab_collection_room_v1',
    'ab_selected_bg_path', 'ab_owned_backgrounds', 'ab_font_preference'
  ];
  var GAME_SKILL_IDS = ['swift_hands', 'bounty_agreement', 'supply_tide', 'prophet', 'lucky_streak'];
  // CollectionManager.COLLECT_MAP 的精确 名称→图片 映射（必须与游戏内一致，否则图片404）
  var GAME_COLLECT_MAP = {
    '机密文件': 'collect/img_737bbd84ed.jpg',
    '“理想国”': 'collect/img_271c408224.jpg',
    '“厄律西翁”': 'collect/img_55da8a9c7a.jpg',
    '金狮雕像': 'collect/img_8b4310f2d2.jpg',
    '阵列镜片': 'collect/img_6aeeaace20.jpg',
    '盛宴雕塑': 'collect/img_5a780ac719.jpg',
    '古董茶壶': 'collect/img_b3431e7295.jpg',
    '花瓶': 'collect/img_8c91545379.jpg',
    '“赤红暗星”模型': 'collect/400.jpg',
    '航天导航仪': 'collect/img_8d9ab9be88.jpg',
    '“鎏金羽宫”': 'collect/img_86be2efc8e.jpg',
    '《黎明》': 'collect/img_37150efe31.jpg',
    '验算模块': 'collect/img_c9984fa547.jpg',
    '参考球零件': 'collect/img_b867e932ea.jpg',
    '法厄同之钟': 'collect/img_f70f42c369.jpg',
    '黄金哑铃': 'collect/img_7b748eb857.jpg',
    '机械手臂': 'collect/img_f923762915.jpg',
    '原子钟核心': 'collect/img_93d5c9d9b5.jpg',
    '宝石项链': 'collect/img_31a2709271.jpg',
    '“新边疆”模型': 'collect/img_7c8eb5c849.jpg',
    '电磁弹射组件': 'collect/img_c90e5d6d40.jpg',
    '金驹跃岭雕像': 'collect/img_7610daa96c.jpg'
  };
  var GAME_COLLECTIBLES = Object.keys(GAME_COLLECT_MAP);

  function isGameDetected() {
    return typeof window.__addAccumulatedValue === 'function' || !!document.getElementById('open-safe-btn');
  }

  // ===== 精确刷物品：捕获游戏内部 State =====
  var gameState = null;
  var origAssign = null;

  function captureGameState() {
    if (origAssign) return;
    if (!window._ || !window._.assign) return;
    origAssign = window._.assign;
    window._.assign = function (target) {
      var result = origAssign.apply(this, arguments);
      if (!gameState && target && target.grid && Array.isArray(target.grid) && target.grid.length > 0 && Array.isArray(target.grid[0]) && Array.isArray(target.items)) {
        gameState = target;
      }
      return result;
    };
  }

  // 判断物品能否放在 grid 的 (row, col) 处（复刻 GameCore.canPlaceItem）
  function canPlaceAt(width, height, row, col, grid, rows, cols) {
    if (row + height > rows || col + width > cols) return false;
    for (var r = row; r < row + height; r++) {
      for (var c = col; c < col + width; c++) {
        if (grid[r][c] !== 0) return false;
      }
    }
    return true;
  }

  // 直接把物品注入 State 并重新渲染保险网格（不调用 openSafe，不会触发开保险/搜索）
  function spawnItem(item) {
    if (!gameState) {
      toast('游戏状态未就绪，请先手动打开一次保险', 'error');
      addLog('warn', '游戏: State 未捕获，请先开一次保险');
      return;
    }
    // 用 State.isSearching 判断，而不是按钮 disabled（按钮在首次开保险后会一直 disabled）
    // 兼容游戏搜索状态残留：isSearching=true 但队列/当前搜索都为空时，强制复位
    if (gameState.isSearching && (!gameState.searchQueue || gameState.searchQueue.length === 0) && !gameState.currentSearch) {
      gameState.isSearching = false;
      if (gameState.searchTimer) {
        try { cancelAnimationFrame(gameState.searchTimer); } catch (e) {}
        gameState.searchTimer = null;
      }
    }
    if (gameState.isSearching) {
      toast('保险正在搜索中，请稍后再试', 'error');
      return;
    }
    var safeGrid = document.getElementById('safe-grid');
    if (!safeGrid) { toast('未找到保险网格，请先打开一次保险', 'error'); return; }

    var width = parseInt(item.width, 10) || 1;
    var height = parseInt(item.height, 10) || 1;
    var rows = gameState.grid.length;
    var cols = (gameState.grid[0] || []).length;
    if (!rows || !cols) { toast('网格未初始化', 'error'); return; }

    // 游戏在生成网格时把「柯恩币」标记为 isCoin:true（见 script.js 生成保险逻辑），
    // items.xml 中没有 isCoin 字段，这里按名称兜底，确保刷出的柯恩币能显示价值数字。
    var isCoin = item.isCoin === true || item.name === '柯恩币';

    // 扫描整个网格，找第一个能放下的位置（柯恩币可叠在另一枚柯恩币上）
    var placed = null;
    var rotated = false;
    for (var r = 0; r < rows && !placed; r++) {
      for (var c = 0; c < cols && !placed; c++) {
        if (isCoin) { placed = { row: r, col: c }; }
        else if (canPlaceAt(width, height, r, c, gameState.grid, rows, cols)) { placed = { row: r, col: c }; }
      }
    }
    // 原方向放不下且非正方形，尝试变向（横↔竖）
    if (!placed && width !== height) {
      for (var r2 = 0; r2 < rows && !placed; r2++) {
        for (var c2 = 0; c2 < cols && !placed; c2++) {
          if (canPlaceAt(height, width, r2, c2, gameState.grid, rows, cols)) {
            placed = { row: r2, col: c2 };
            rotated = true;
          }
        }
      }
    }
    if (!placed) {
      toast('保险放不下该物品', 'error');
      addLog('warn', '游戏: 物品放不下 ' + item.name + ' (' + width + '×' + height + ')');
      return;
    }

    var finalW = rotated ? height : width;
    var finalH = rotated ? width : height;

    // 柯恩币：若目标格已有柯恩币，合并数值（不新建物品）
    if (isCoin) {
      var existCoin = gameState.items.find(function (it) { return it.isCoin && it.row === placed.row && it.col === placed.col; });
      if (existCoin) {
        existCoin.value = (parseInt(existCoin.value, 10) || 0) + (parseInt(item.value, 10) || 0);
        try {
          if (typeof window.SampleManager !== 'undefined' && window.SampleManager.onItemCollected) {
            window.SampleManager.onItemCollected(existCoin.name);
          }
        } catch (e) { }
        renderSafeGrid();
        toast('已合并柯恩币: ' + existCoin.value.toLocaleString('en-US'));
        addLog('success', '游戏: 合并柯恩币 总值=' + existCoin.value);
        return;
      }
    }

    // 生成唯一 id（避开游戏内部 1..n 的 id 段）
    var maxId = 0;
    gameState.items.forEach(function (it) { if (it.id > maxId) maxId = it.id; });
    var newId = Math.max(maxId + 1, 900000 + Math.floor(Math.random() * 100000));

    var newItem = {
      id: newId,
      name: item.name,
      width: finalW,
      height: finalH,
      value: parseInt(item.value, 10) || 0,
      image: item.image || '',
      rarity: item.rarity || 'white',
      sound: item.sound || '',
      desc: item.desc || '',
      row: placed.row,
      col: placed.col,
      searched: true,
      isFreshSearch: false,
      isCoin: isCoin,
      rotated: rotated
    };

    // 标记网格占用
    for (var rr = 0; rr < finalH; rr++) {
      for (var cc = 0; cc < finalW; cc++) {
        gameState.grid[placed.row + rr][placed.col + cc] = newId;
      }
    }
    gameState.items.push(newItem);

    // 记录到合成台 / 收藏室（复刻 completeSearch 中的记录逻辑）
    try {
      if (typeof window.SampleManager !== 'undefined' && window.SampleManager.onItemCollected) {
        window.SampleManager.onItemCollected(newItem.name);
      }
    } catch (e) { addLog('warn', 'SampleManager 记录失败: ' + e.message); }

    // 加入背包清单并更新统计，与正常搜索行为一致
    try {
      var searchTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      gameState.inventory = [{ id: newItem.id, name: newItem.name, value: newItem.value, rarity: newItem.rarity, image: newItem.image, searchedAt: searchTime }].concat(gameState.inventory || []);
      gameState.totalValue = (gameState.totalValue || 0) + newItem.value;
      if (newItem.value > (gameState.highestValue || 0)) gameState.highestValue = newItem.value;
    } catch (e) { }

    // 重新渲染保险网格
    renderSafeGrid();

    // 启用重置按钮
    var resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.disabled = false;
      resetBtn.classList.remove('disabled');
      resetBtn.style.opacity = '1';
      resetBtn.style.cursor = 'pointer';
    }

    toast('已生成: ' + item.name);
    addLog('success', '游戏: 生成物品 ' + item.name + ' (' + width + '×' + height + ') 于 (' + placed.row + ',' + placed.col + ')');
  }

  // 手动重绘 #safe-grid（复刻 UIManager.renderAllItems 的关键逻辑）
  function renderSafeGrid() {
    var safeGrid = document.getElementById('safe-grid');
    if (!safeGrid || !gameState) return;

    var rows = gameState.grid.length;
    var cols = (gameState.grid[0] || []).length;
    // 与游戏 Config.grid.width/height 保持一致（380×460），避免用 clientWidth 受边框/缩放影响
    var gridW = 380;
    var gridH = 460;
    var cellW = gridW / (cols || 5);
    var cellH = gridH / (rows || 6);

    // 移除旧物品元素
    var oldItems = safeGrid.querySelectorAll('.item');
    for (var i = 0; i < oldItems.length; i++) oldItems[i].remove();

    // 清理单元格状态类
    var cells = safeGrid.querySelectorAll('.grid-cell');
    for (var j = 0; j < cells.length; j++) cells[j].classList.remove('searching', 'searched');

    var spacing = 0; // Config.item.spacing
    var fontSize = 17; // Config.item.fontSize
    var imgBase = 52; // Config.item.imgBase

    gameState.items.forEach(function (item) {
      var w = parseInt(item.width, 10) || 1;
      var h = parseInt(item.height, 10) || 1;
      var left = (item.col || 0) * cellW;
      var top = (item.row || 0) * cellH;
      var iGridW = w * cellW;
      var iGridH = h * cellH;
      var actualW = Math.max(10, iGridW - spacing * 2);
      var actualH = Math.max(10, iGridH - spacing * 2);
      // 与游戏 createItemElement 完全一致：居中，无额外偏移
      var itemLeft = left + (iGridW - actualW) / 2;
      var itemTop = top + (iGridH - actualH) / 2;

      var el = document.createElement('div');
      el.className = 'item item-' + (item.rarity || 'white') + (item.searched ? ' searched' : '');
      el.setAttribute('data-id', item.id);
      // 与游戏 createItemElement 保持一致：直接使用浮点像素值（cellHeight=460/6≈76.67）。
      // 之前用 Math.floor 会让每行最多丢 ~0.67px，累积后造成物品在纵向错位。
      el.style.left = itemLeft + 'px';
      el.style.top = itemTop + 'px';
      el.style.width = actualW + 'px';
      el.style.height = actualH + 'px';
      el.style.fontSize = fontSize + 'px';
      el.style.opacity = '1';
      el.style.pointerEvents = item.searched ? 'auto' : 'none';

      if (item.searched) {
        var container = document.createElement('div');
        container.className = 'item-content-container';
        container.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;position:relative;';
        var imgBox = document.createElement('div');
        imgBox.style.cssText = 'display:flex;align-items:center;justify-content:center;height:100%;width:100%;';
        if (item.image && String(item.image) !== 'undefined') {
          var shrinkNames = new Set(["阵列镜片", "珐琅碗", "钻石原矿", "金座钟", "水平仪", "液压扳手", "游戏机", "生化样本箱", "螺丝刀套组", "便携式千斤顶", "气密性检测仪"]);
          var img = document.createElement('img');
          img.className = 'item-image' + (shrinkNames.has(item.name) ? ' item-image-shrink' : '');
          img.src = item.image;
          img.alt = item.name;
          var gridCells = w * h;
          var scale = Math.min(2.5, Math.max(1.0, 1 + (gridCells - 1) * 0.43));
          var imgSize = imgBase * scale;
          var imgTransform = item.rotated ? 'rotate(90deg)' : 'none';
          img.style.cssText = 'width:' + imgSize + 'px;height:' + imgSize + 'px;object-fit:contain;max-width:100%;max-height:100%;transform:' + imgTransform + ';';
          img.addEventListener('error', function () { this.style.display = 'none'; });
          imgBox.appendChild(img);
        }
        container.appendChild(imgBox);

        var nameEl = document.createElement('div');
        nameEl.className = 'item-name';
        nameEl.textContent = item.name;
        nameEl.style.cssText = 'position:absolute;top:2px;right:2px;font-weight:bold;text-align:right;color:#C0C0C0;padding:1px 3px;font-size:0.7em;text-shadow:0 0 2px black,0 0 2px black,0 0 2px black;z-index:3;max-width:90%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;';
        container.appendChild(nameEl);

        // 柯恩币显示价值数字（与游戏 createItemContent 中 isCoin 逻辑一致）
        if (item.isCoin) {
          var amountEl = document.createElement('div');
          amountEl.className = 'coin-amount';
          // 归一化为有限数值，避免字符串/NaN 导致 toLocaleString 报错或显示异常
          var coinValue = Number(item.value);
          if (!isFinite(coinValue)) coinValue = 0;
          amountEl.textContent = coinValue.toLocaleString('en-US');
          amountEl.style.cssText = 'position:absolute;bottom:2px;right:2px;background:transparent;color:#C0C0C0;padding:1px 3px;font-weight:bold;font-size:0.7em;text-shadow:0 0 2px black,0 0 2px black,0 0 2px black;z-index:3;';
          container.appendChild(amountEl);
        }

        el.appendChild(container);

        // 标记对应单元格为已搜索
        for (var rr = 0; rr < h; rr++) {
          for (var cc = 0; cc < w; cc++) {
            var cell = safeGrid.querySelector('.grid-cell[data-row="' + ((item.row || 0) + rr) + '"][data-col="' + ((item.col || 0) + cc) + '"]');
            if (cell) cell.classList.add('searched');
          }
        }
      } else {
        var cover = document.createElement('div');
        cover.className = 'searching-overlay';
        el.appendChild(cover);
      }

      safeGrid.appendChild(el);
    });
  }

  function parseGameVal(s) {
    if (s == null) return 0;
    s = String(s).trim().toUpperCase().replace(/,/g, '');
    if (!s) return 0;
    var mult = 1;
    if (s.slice(-1) === 'K') { mult = 1e3; s = s.slice(0, -1); }
    else if (s.slice(-1) === 'M') { mult = 1e6; s = s.slice(0, -1); }
    else if (s.slice(-1) === 'B') { mult = 1e9; s = s.slice(0, -1); }
    var n = parseFloat(s);
    return isNaN(n) ? 0 : Math.round(n * mult);
  }

  function refreshGame() {
    var nd = Q('#gameNotDetected'), body = Q('#gameBody');
    if (!nd || !body) return;
    if (!isGameDetected()) { nd.style.display = 'block'; body.style.display = 'none'; return; }
    nd.style.display = 'none'; body.style.display = 'block';
    var cur = Q('#gameCurVal');
    if (cur) cur.textContent = (window.__getAccumulatedValue ? window.__formatAccumulatedValue(window.__getAccumulatedValue()) : '?');
  }

  function bindGame() {
    if (Q('#gameRefreshVal')) Q('#gameRefreshVal').addEventListener('click', refreshGame);
    if (Q('#gameAddBtn')) Q('#gameAddBtn').addEventListener('click', function () {
      var n = parseGameVal(Q('#gameAddVal').value);
      if (!n) { toast('请输入有效数量', 'error'); return; }
      try { window.__addAccumulatedValue(n); refreshGame(); toast('已增加 ' + window.__formatAccumulatedValue(n)); addLog('success', '游戏: 增加价值 ' + n); }
      catch (e) { toast('失败:' + e.message, 'error'); }
    });
    if (Q('#gameSetBtn')) Q('#gameSetBtn').addEventListener('click', function () {
      var n = parseGameVal(Q('#gameAddVal').value);
      var cur = window.__getAccumulatedValue ? window.__getAccumulatedValue() : 0;
      try {
        if (n < cur) window.__spendAccumulatedValue(cur - n);
        else if (n > cur) window.__addAccumulatedValue(n - cur);
        refreshGame(); toast('已设为 ' + window.__formatAccumulatedValue(n));
      } catch (e) { toast('失败:' + e.message, 'error'); }
    });
    var quickAdd = function (n) { return function () { try { window.__addAccumulatedValue(n); refreshGame(); toast('+' + window.__formatAccumulatedValue(n)); } catch (e) { toast('失败', 'error'); } }; };
    if (Q('#gameVal1m')) Q('#gameVal1m').addEventListener('click', quickAdd(1e6));
    if (Q('#gameVal10m')) Q('#gameVal10m').addEventListener('click', quickAdd(1e7));
    if (Q('#gameVal100m')) Q('#gameVal100m').addEventListener('click', quickAdd(1e8));
    if (Q('#gameValZero')) Q('#gameValZero').addEventListener('click', function () {
      confirmBox('确定清零累计价值?', function () {
        var cur = window.__getAccumulatedValue ? window.__getAccumulatedValue() : 0;
        if (cur > 0) window.__spendAccumulatedValue(cur);
        refreshGame(); toast('已清零'); addLog('warn', '游戏: 清零累计价值');
      });
    });

    // 技能
    if (Q('#gameUnlockSkills')) Q('#gameUnlockSkills').addEventListener('click', function () {
      try {
        var st = {};
        GAME_SKILL_IDS.forEach(function (id) { st[id] = { owned: true, enabled: true, remaining: id === 'supply_tide' || id === 'lucky_streak' ? 100 : 0 }; });
        localStorage.setItem('ab_shop_skills_v1', JSON.stringify(st));
        toast('全部技能已解锁 (需刷新页面生效)'); addLog('success', '游戏: 解锁全部技能');
      } catch (e) { toast('失败:' + e.message, 'error'); }
    });
    if (Q('#gameResetSkills')) Q('#gameResetSkills').addEventListener('click', function () {
      confirmBox('重置全部技能?', function () { localStorage.removeItem('ab_shop_skills_v1'); toast('已重置 (需刷新)'); });
    });
    if (Q('#gameSpeedMode')) Q('#gameSpeedMode').addEventListener('click', function () {
      confirmBox('开启极速模式将解锁「迅捷巧手」+「物资潮汐」并刷新页面，确定?', function () {
        try {
          var st = {};
          GAME_SKILL_IDS.forEach(function (id) { st[id] = { owned: true, enabled: true, remaining: 100 }; });
          localStorage.setItem('ab_shop_skills_v1', JSON.stringify(st));
          addLog('success', '游戏: 开启极速模式');
          location.reload();
        } catch (e) { toast('失败:' + e.message, 'error'); }
      });
    });

    // 收藏 & 背景
    if (Q('#gameUnlockCollect')) Q('#gameUnlockCollect').addEventListener('click', function () {
      try {
        var list = GAME_COLLECTIBLES.map(function (n) { return { name: n, image: GAME_COLLECT_MAP[n], value: 0, rarity: 'orange', count: 1, firstTime: Date.now() }; });
        localStorage.setItem('ab_collection_room_v1', JSON.stringify(list));
        toast('全部收藏品已解锁 (' + list.length + '件, 需刷新)'); addLog('success', '游戏: 解锁全部收藏品');
      } catch (e) { toast('失败:' + e.message, 'error'); }
    });
    if (Q('#gameUnlockBg')) Q('#gameUnlockBg').addEventListener('click', function () {
      fetch('xml/backgrounds.xml').then(function (r) { return r.text(); }).then(function (txt) {
        try {
          var doc = new DOMParser().parseFromString(txt, 'text/xml');
          var ids = Array.prototype.slice.call(doc.getElementsByTagName('id')).map(function (n) { return parseInt(n.textContent, 10) || 0; }).filter(Boolean);
          if (!ids.length) ids = [1];
          localStorage.setItem('ab_owned_backgrounds', JSON.stringify(ids));
          toast('全部背景已解锁 (' + ids.length + '个, 需刷新)'); addLog('success', '游戏: 解锁全部背景');
        } catch (e) { toast('解析背景失败', 'error'); }
      }).catch(function () { toast('无法加载 backgrounds.xml', 'error'); });
    });

    // 自动农场
    if (Q('#gameAutoFarm')) Q('#gameAutoFarm').addEventListener('click', function () {
      if (autoFarmTimer) { clearInterval(autoFarmTimer); autoFarmTimer = null; this.textContent = '自动开保险: 关'; toast('自动农场已停止'); return; }
      var btn = document.getElementById('open-safe-btn');
      if (!btn) { toast('未找到打开保险按钮', 'error'); return; }
      autoFarmTimer = setInterval(function () {
        var b = document.getElementById('open-safe-btn');
        if (b && !b.disabled && b.offsetParent !== null) b.click();
      }, 1200);
      this.textContent = '自动开保险: 开';
      toast('自动农场已启动');
      addLog('info', '游戏: 自动农场启动');
    });
    if (Q('#gameOpenOnce')) Q('#gameOpenOnce').addEventListener('click', function () {
      var b = document.getElementById('open-safe-btn');
      if (b && !b.disabled) { b.click(); toast('已触发开保险'); } else toast('按钮不可用', 'error');
    });
    if (Q('#gameReset')) Q('#gameReset').addEventListener('click', function () {
      var b = document.getElementById('reset-btn');
      if (b && !b.disabled) { b.click(); toast('已清空背包'); } else toast('无背包可清', 'error');
    });

    // 精确刷物品
    if (Q('#gameLoadItems')) Q('#gameLoadItems').addEventListener('click', loadGameItems);
    if (Q('#gameItemSearch')) Q('#gameItemSearch').addEventListener('input', renderGameItems);

    // 保持收藏室背景图（游戏在有收藏品时会把背景设为 none）
    if (!document.getElementById('DTCollectBgFix')) {
      var st = document.createElement('style');
      st.id = 'DTCollectBgFix';
      st.textContent = '#collect-page{background-image:url("collect/img_e3e8e2a20c.png")!important;background-size:cover!important;background-position:center center!important}';
      (document.head || document.body).appendChild(st);
    }

    // 存档
    if (Q('#gameExportSave')) Q('#gameExportSave').addEventListener('click', function () {
      var data = {};
      GAME_STORAGE_KEYS.forEach(function (k) { var v = localStorage.getItem(k); if (v !== null) data[k] = v; });
      Q('#gameSaveData').value = JSON.stringify(data, null, 2);
      toast('存档已导出到文本框');
    });
    if (Q('#gameImportSave')) Q('#gameImportSave').addEventListener('click', function () {
      try {
        var data = JSON.parse(Q('#gameSaveData').value);
        Object.keys(data).forEach(function (k) { localStorage.setItem(k, data[k]); });
        toast('存档已导入 (建议刷新)'); addLog('success', '游戏: 导入存档');
      } catch (e) { toast('JSON 无效:' + e.message, 'error'); }
    });
    if (Q('#gameWipeSave')) Q('#gameWipeSave').addEventListener('click', function () {
      confirmBox('确定清空全部游戏存档? 此操作不可撤销', function () {
        GAME_STORAGE_KEYS.forEach(function (k) { localStorage.removeItem(k); });
        toast('存档已清空, 刷新页面生效'); addLog('warn', '游戏: 清空存档');
      });
    });
  }

  function loadGameItems() {
    fetch('xml/items.xml').then(function (r) { return r.text(); }).then(function (txt) {
      try {
        var doc = new DOMParser().parseFromString(txt, 'text/xml');
        var nodes = doc.getElementsByTagName('item');
        gameItems = Array.prototype.slice.call(nodes).map(function (n) {
          var g = function (t) { var e = n.getElementsByTagName(t)[0]; return e ? e.textContent : ''; };
          return { id: g('id'), name: g('name'), width: g('width'), height: g('height'), value: parseInt(g('value'), 10) || 0, rarity: g('rarity') || 'white', desc: g('desc'), sound: g('sound'), image: g('image'), weight: g('weight') };
        });
        // 加入已启用的 Mod 物品（否则调试面板刷不出 Mod 物品）
        try {
          var modItems = (window.ModManager && window.ModManager.getEnabledItems) ? window.ModManager.getEnabledItems() : [];
          if (modItems && modItems.length) {
            gameItems = gameItems.concat(modItems.map(function (x) {
              return { id: x.id, name: x.name, width: x.width, height: x.height, value: x.value, rarity: x.rarity || 'white', desc: x.desc || '', image: x.image, weight: x.weight };
            }));
          }
        } catch (e) {}
        renderGameItems();
        addLog('success', '游戏: 物品列表加载 ' + gameItems.length + ' 件');
      } catch (e) { toast('解析物品失败:' + e.message, 'error'); }
    }).catch(function () { toast('无法加载 items.xml', 'error'); });
  }

  function renderGameItems() {
    var list = Q('#gameItemList');
    if (!list) return;
    var kw = Q('#gameItemSearch') ? Q('#gameItemSearch').value.trim().toLowerCase() : '';
    var filtered = gameItems.filter(function (it) {
      if (kw && it.name.toLowerCase().indexOf(kw) === -1) return false;
      return true;
    });
    var colors = { red: '#FE806C', orange: '#FE806C', gold: '#f39c12', purple: '#9b59b6', white: '#cccccc' };
    list.innerHTML = filtered.map(function (it) {
      return '<div data-id="' + esc(it.id) + '" style="padding:6px 4px;border-bottom:1px dashed #1f2a37;display:flex;justify-content:space-between;gap:8px;cursor:pointer">' +
        '<span><b style="color:' + (colors[it.rarity] || '#ccc') + '">[' + it.rarity + ']</b> ' + esc(it.name) + ' <span style="opacity:.6;font-size:11px">(' + it.width + '×' + it.height + ')</span></span>' +
        '<span style="color:#facc15;white-space:nowrap">' + it.value.toLocaleString() + '</span></div>';
    }).join('') || '<div class="dt-label" style="text-align:center;padding:12px">无匹配物品</div>';
    list.querySelectorAll('[data-id]').forEach(function (el) {
      el.addEventListener('click', function () {
        var id = el.getAttribute('data-id');
        var item = gameItems.find(function (x) { return x.id === id; });
        if (!item) return;
        confirmBox('立即生成「' + item.name + '」到保险中?\n（不刷新页面，保险满时会提示）', function () {
          spawnItem(item);
        });
      });
    });
  }

  var confirmBound = false;
  function confirmBox(text, cb) {
    var box = Q('#DTConfirm'); var txt = Q('#DTConfirmText'); var ok = Q('#DTConfirmOk'); var cancel = Q('#DTConfirmCancel');
    txt.textContent = text; confirmCb = cb; box.classList.add('open');
    // 只绑定一次监听器，避免重复累加导致一次确认触发多次回调
    if (!confirmBound) {
      confirmBound = true;
      ok.addEventListener('click', function () {
        var cb2 = confirmCb;
        confirmCb = null;
        box.classList.remove('open');
        if (cb2) cb2();
      });
      cancel.addEventListener('click', function () {
        confirmCb = null;
        box.classList.remove('open');
      });
    }
  }

  function toast(msg, type) {
    if (window.showToast) { try { window.showToast(msg); return; } catch (e) {} }
    var o = document.createElement('div');
    o.style.cssText = 'position:fixed;left:50%;top:20px;transform:translateX(-50%);z-index:' + (MAXZ() + 2) + ';background:' + (type === 'error' ? '#7f1d1d' : '#14532d') + ';color:#fff;padding:8px 16px;border-radius:8px;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,.4);opacity:0;transition:opacity .2s';
    o.textContent = msg;
    document.body.appendChild(o);
    setTimeout(function () { o.style.opacity = '1'; }, 10);
    setTimeout(function () { o.style.opacity = '0'; setTimeout(function () { try { o.remove(); } catch (e) { } }, 200); }, 2200);
  }

  window.DT = {
    open: function () { openDev(true); },
    close: function () { openDev(false); },
    log: function (level, msg, extra) {
      var levels = ['log', 'info', 'debug', 'warn', 'error', 'success'];
      if (levels.indexOf(level) !== -1) {
        addLog(level === 'log' ? 'info' : level, msg, extra);
      } else {
        addLog('info', level, msg);
      }
    },
    mock: function (url, resp) { mockRules.push({ url: url, response: resp }); renderMock(); },
    export: function () { Q('#exportLog').click(); },
    clear: function () { L.length = 0; renderLog(); updateBadge(); },
    version: '2.0.0',
    // 暗区游戏调试 API
    game: {
      detected: isGameDetected,
      addValue: function (n) { if (window.__addAccumulatedValue) { window.__addAccumulatedValue(n); return window.__getAccumulatedValue(); } },
      setValue: function (n) {
        if (!window.__getAccumulatedValue) return null;
        var cur = window.__getAccumulatedValue();
        if (n < cur) window.__spendAccumulatedValue(cur - n);
        else if (n > cur) window.__addAccumulatedValue(n - cur);
        return window.__getAccumulatedValue();
      },
      getValue: function () { return window.__getAccumulatedValue ? window.__getAccumulatedValue() : null; },
      unlockSkills: function () {
        var st = {};
        GAME_SKILL_IDS.forEach(function (id) { st[id] = { owned: true, enabled: true, remaining: 100 }; });
        localStorage.setItem('ab_shop_skills_v1', JSON.stringify(st));
      },
      unlockCollection: function () {
        var list = GAME_COLLECTIBLES.map(function (n) { return { name: n, image: GAME_COLLECT_MAP[n], value: 0, rarity: 'orange', count: 1, firstTime: Date.now() }; });
        localStorage.setItem('ab_collection_room_v1', JSON.stringify(list));
      },
      openSafe: function () { var b = document.getElementById('open-safe-btn'); if (b && !b.disabled) b.click(); },
      reset: function () { var b = document.getElementById('reset-btn'); if (b && !b.disabled) b.click(); },
      spawn: function (item) { spawnItem(item); },
      getState: function () { return gameState; }
    }
  };

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();