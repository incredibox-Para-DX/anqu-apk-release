/* 网络层：统一超时、重试、离线短路与错误归一化。
 * 只做请求封装，不改写全局 fetch；下载类大文件请求（Range 续传）仍走原生 fetch。
 */
(function (w) {
    'use strict';

    var DEFAULT_TIMEOUT = 12000;
    var DEFAULT_RETRY_DELAY = 600;

    var stats = {
        total: 0,
        ok: 0,
        failed: 0,
        retries: 0,
        timeouts: 0,
        offline: 0,
        lastUrl: '',
        lastError: ''
    };

    function NetError(kind, message, extra) {
        var err = new Error(message || kind);
        err.name = 'NetError';
        err.kind = kind;
        if (extra) {
            for (var k in extra) {
                if (Object.prototype.hasOwnProperty.call(extra, k)) err[k] = extra[k];
            }
        }
        return err;
    }

    function isOffline() {
        return typeof navigator !== 'undefined' && navigator.onLine === false;
    }

    // 相对路径（xml/、minigame 等）属于本地资源，离线也要能读
    function isRemote(url) {
        return /^(https?:)?\/\//i.test(String(url || ''));
    }

    function sleep(ms) {
        return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }

    function copyOptions(options) {
        var out = {};
        for (var k in options) {
            if (!Object.prototype.hasOwnProperty.call(options, k)) continue;
            if (k === 'timeout' || k === 'retries' || k === 'retryDelay' || k === 'allowOffline' || k === 'cacheBust') continue;
            out[k] = options[k];
        }
        return out;
    }

    function request(url, options) {
        options = options || {};
        var timeout = options.timeout == null ? DEFAULT_TIMEOUT : options.timeout;
        var retries = Math.max(0, options.retries == null ? 0 : options.retries);
        var retryDelay = options.retryDelay == null ? DEFAULT_RETRY_DELAY : options.retryDelay;
        var method = String(options.method || 'GET').toUpperCase();
        var canRetry = method === 'GET' || method === 'HEAD';
        var attempt = 0;

        var finalUrl = url;
        if (options.cacheBust) {
            finalUrl = url + (url.indexOf('?') === -1 ? '?' : '&') + 't=' + Date.now();
        }

        function once() {
            if (isOffline() && isRemote(finalUrl) && !options.allowOffline) {
                stats.offline++;
                stats.failed++;
                stats.lastUrl = finalUrl;
                stats.lastError = 'offline';
                return Promise.reject(NetError('offline', '网络已断开'));
            }

            stats.total++;
            var opts = copyOptions(options);
            var controller = null;
            var timer = null;
            var timedOut = false;

            if (typeof AbortController !== 'undefined' && !opts.signal) {
                controller = new AbortController();
                opts.signal = controller.signal;
                timer = setTimeout(function () {
                    timedOut = true;
                    try { controller.abort(); } catch (e) {}
                }, timeout);
            }

            var pending = new Promise(function (resolve, reject) {
                if (!controller) {
                    // 无 AbortController 的旧 WebView：超时只丢弃结果，底层请求仍在后台跑完
                    timer = setTimeout(function () {
                        timedOut = true;
                        reject(NetError('timeout', '请求超时'));
                    }, timeout);
                }
                fetch(finalUrl, opts).then(resolve, reject);
            });

            return pending.then(function (res) {
                if (timer) clearTimeout(timer);
                if (!res.ok) {
                    var httpErr = NetError('http', 'HTTP ' + res.status, { status: res.status, response: res });
                    if (canRetry && (res.status >= 500 || res.status === 429) && attempt < retries) {
                        throw httpErr;
                    }
                    stats.failed++;
                    stats.lastUrl = finalUrl;
                    stats.lastError = httpErr.kind + ': ' + httpErr.message;
                    throw httpErr;
                }
                stats.ok++;
                return res;
            }).catch(function (e) {
                if (timer) clearTimeout(timer);
                var err = e;
                if (!(err && err.name === 'NetError')) {
                    var kind = timedOut || (err && /abort/i.test(err.name || '')) ? 'timeout' : 'network';
                    err = NetError(kind, (err && err.message) || '网络异常', { cause: e });
                }
                if (err.kind === 'timeout') stats.timeouts++;

                var retryable = canRetry && err.kind !== 'offline';
                if (err.kind === 'http') retryable = canRetry && (err.status >= 500 || err.status === 429);
                if (retryable && attempt < retries) {
                    attempt++;
                    stats.retries++;
                    return sleep(retryDelay * attempt).then(once);
                }

                stats.failed++;
                stats.lastUrl = finalUrl;
                stats.lastError = err.kind + ': ' + err.message;
                throw err;
            });
        }

        return once();
    }

    function getText(url, options) {
        return request(url, options).then(function (res) { return res.text(); });
    }

    function getJSON(url, options) {
        return request(url, options).then(function (res) { return res.json(); });
    }

    function sendJSON(method, url, body, options) {
        var opts = options || {};
        var headers = {};
        for (var k in (opts.headers || {})) {
            if (Object.prototype.hasOwnProperty.call(opts.headers, k)) headers[k] = opts.headers[k];
        }
        if (!headers['Content-Type'] && !headers['content-type']) headers['Content-Type'] = 'application/json';
        opts.method = method;
        opts.headers = headers;
        opts.body = typeof body === 'string' ? body : JSON.stringify(body);
        return request(url, opts);
    }

    function postJSON(url, body, options) {
        return sendJSON('POST', url, body, options);
    }

    function putJSON(url, body, options) {
        return sendJSON('PUT', url, body, options);
    }

    // 在线状态：统一从一个地方取，避免各模块各自读 navigator.onLine
    var stateListeners = [];
    function notifyState() {
        var online = !isOffline();
        for (var i = 0; i < stateListeners.length; i++) {
            try { stateListeners[i](online); } catch (e) {}
        }
        try {
            w.dispatchEvent(new CustomEvent('ab-net-state', { detail: { online: online } }));
        } catch (e) {}
    }
    w.addEventListener('online', notifyState);
    w.addEventListener('offline', notifyState);

    w.Net = {
        request: request,
        getText: getText,
        getJSON: getJSON,
        postJSON: postJSON,
        putJSON: putJSON,
        isOffline: isOffline,
        isRemote: isRemote,
        onStateChange: function (fn) {
            if (typeof fn === 'function') stateListeners.push(fn);
        },
        stats: stats,
        NetError: NetError
    };
})(window);
