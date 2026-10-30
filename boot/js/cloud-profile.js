/* 玩家头像上云：Supabase Storage(avatars) + ab_profiles 表；榜单据此显示头像 */
(function (w) {
    'use strict';
    var SUPA_URL = 'https://fgkfgyudwbhmmrqvtfup.supabase.co';
    var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZna2ZneXVkd2JobW1ycXZ0ZnVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MTkyODAsImV4cCI6MjA5NzI5NTI4MH0.zcnusHgHSUK3AogYAXaR-9Q2KWuGK6_V7wwhgj1D1PI';

    function dataUrlToBlob(dataUrl) {
        var arr = String(dataUrl).split(',');
        var mime = (arr[0].match(/:(.*?);/) || [])[1] || 'image/png';
        var bstr = atob(arr[1] || '');
        var n = bstr.length, u8 = new Uint8Array(n);
        for (var i = 0; i < n; i++) u8[i] = bstr.charCodeAt(i);
        return new Blob([u8], { type: mime });
    }

    function uploadAvatar(uid, dataUrl) {
        if (!uid || !dataUrl) return Promise.resolve(false);
        return Promise.resolve().then(function () {
            return dataUrlToBlob(dataUrl);
        }).then(function (blob) {
            var path = encodeURIComponent(String(uid)) + '.png';
            return fetch(SUPA_URL + '/storage/v1/object/avatars/' + path, {
                method: 'POST',
                headers: {
                    'apikey': SUPA_KEY,
                    'Authorization': 'Bearer ' + SUPA_KEY,
                    'Content-Type': 'image/png',
                    'x-upsert': 'true'
                },
                body: blob
            }).then(function (up) {
                if (!up.ok) return false;
                var pub = SUPA_URL + '/storage/v1/object/public/avatars/' + path;
                return fetch(SUPA_URL + '/rest/v1/ab_profiles?on_conflict=uid', {
                    method: 'POST',
                    headers: {
                        'apikey': SUPA_KEY,
                        'Authorization': 'Bearer ' + SUPA_KEY,
                        'Content-Type': 'application/json',
                        'Prefer': 'resolution=merge-duplicates,return=minimal'
                    },
                    body: JSON.stringify([{ uid: String(uid), avatar_url: pub, updated_at: new Date().toISOString() }])
                }).then(function () { return pub; }).catch(function () { return pub; });
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
