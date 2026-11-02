

(function (w) {
    'use strict';
    var SUPA_URL = 'https://fgkfgyudwbhmmrqvtfup.supabase.co';
    var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZna2ZneXVkd2JobW1ycXZ0ZnVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MTkyODAsImV4cCI6MjA5NzI5NTI4MH0.zcnusHgHSUK3AogYAXaR-9Q2KWuGK6_V7wwhgj1D1PI';
    var AVATAR_WORKER = 'https://anqu-raw.sdfgasdfgwe7.workers.dev';
    var AVATAR_KEY = '';

    function dataUrlMime(dataUrl) {
        var m = String(dataUrl || '').match(/^data:([^;,]+)[;,]/);
        return m ? m[1] : 'image/png';
    }

    function isGmUser() {
        try {
            var v = localStorage.getItem('ab_gm_unlocked');
            return v === 'true' || v === '1';
        } catch (e) { return false; }
    }

    function dataUrlToBlob(dataUrl) {
        var arr = String(dataUrl).split(',');
        var mime = (arr[0].match(/:(.*?);/) || [])[1] || 'image/png';
        var bstr = atob(arr[1] || '');
        var n = bstr.length, u8 = new Uint8Array(n);
        for (var i = 0; i < n; i++) u8[i] = bstr.charCodeAt(i);
        return new Blob([u8], { type: mime });
    }

    function compressAvatar(dataUrl) {
        return new Promise(function (resolve) {
            try {
                var img = new Image();
                img.onload = function () {
                    try {
                        var max = 128;
                        var scale = Math.min(max / img.width, max / img.height, 1);
                        var c = document.createElement('canvas');
                        c.width = Math.max(1, Math.round(img.width * scale));
                        c.height = Math.max(1, Math.round(img.height * scale));
                        var ctx = c.getContext('2d');
                        ctx.drawImage(img, 0, 0, c.width, c.height);
                        resolve(c.toDataURL('image/png'));
                    } catch (e) { resolve(dataUrl); }
                };
                img.onerror = function () { resolve(dataUrl); };
                img.src = dataUrl;
            } catch (e) { resolve(dataUrl); }
        });
    }

    function saveProfileUrl(uid, url) {
        return fetch(SUPA_URL + '/rest/v1/ab_profiles?on_conflict=uid', {
            method: 'POST',
            headers: {
                'apikey': SUPA_KEY,
                'Authorization': 'Bearer ' + SUPA_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates,return=minimal'
            },
            body: JSON.stringify([{ uid: String(uid), avatar_url: url, updated_at: new Date().toISOString() }])
        }).then(function () { return url; }).catch(function () { return url; });
    }

    function uploadToWorker(uid, dataUrl, mime) {
        var blob = dataUrlToBlob(dataUrl);
        var headers = { 'Content-Type': mime || dataUrlMime(dataUrl) };
        if (AVATAR_KEY) headers['x-avatar-key'] = AVATAR_KEY;
        return fetch(AVATAR_WORKER + '/avatar/' + encodeURIComponent(uid), {
            method: 'POST',
            headers: headers,
            body: blob
        }).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        }).then(function (j) {
            if (!j || !j.url) throw new Error('bad response');
            return saveProfileUrl(uid, j.url);
        });
    }

    function uploadToSupabase(uid, dataUrl, mime) {
        var blob = dataUrlToBlob(dataUrl);
        var ext = (mime === 'image/gif') ? 'gif' : 'png';
        var path = encodeURIComponent(String(uid)) + '.' + ext;
        return fetch(SUPA_URL + '/storage/v1/object/avatars/' + path, {
            method: 'POST',
            headers: {
                'apikey': SUPA_KEY,
                'Authorization': 'Bearer ' + SUPA_KEY,
                'Content-Type': mime || 'image/png',
                'x-upsert': 'true'
            },
            body: blob
        }).then(function (up) {
            if (!up.ok) return false;
            var pub = SUPA_URL + '/storage/v1/object/public/avatars/' + path;
            return saveProfileUrl(uid, pub);
        });
    }

    function uploadAvatar(uid, dataUrl) {
        if (!uid || !dataUrl) return Promise.resolve(false);
        var mime = dataUrlMime(dataUrl);
        var isGif = mime === 'image/gif';
        
        if (isGif && !isGmUser()) return Promise.resolve(false);
        var prepare = isGif ? Promise.resolve(dataUrl) : compressAvatar(dataUrl);
        return prepare.then(function (payload) {
            var type = isGif ? 'image/gif' : 'image/png';
            return uploadToWorker(uid, payload, type).catch(function () {
                return uploadToSupabase(uid, payload, type);
            });
        }).catch(function () { return false; });
    }

    function fetchProfiles() {
        return fetch(SUPA_URL + '/rest/v1/ab_profiles?select=uid,avatar_url', {
            headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY }
        }).then(function (r) { return r.ok ? r.json() : []; }).then(function (rows) {
            var m = {};
            (rows || []).forEach(function (x) { if (x && x.uid) m[x.uid] = x.avatar_url; });
            return m;
        }).catch(function () { return {}; });
    }

    w.CloudProfile = { uploadAvatar: uploadAvatar, fetchProfiles: fetchProfiles };
})(window);
