class MusicPlayer {
    constructor() {
        _.assign(this, {
            audio: new Audio(),
            playlist: [],
            currentTrackIndex: 0,
            isPlaying: false,
            volume: 0.5,
            playMode: 0,
            playModes: [
                { name: "顺序播放", icon: "fas fa-retweet" },
                { name: "单曲循环", icon: "fas fa-redo" },
                { name: "随机播放", icon: "fas fa-random" }
            ],
            isInitialized: false,
            basePath: '',
            imageCacheKey: 'musicPlayer_imageCache',
            cacheVersion: 'v1',
            maxCacheSize: 20,
            isSeeking: false,
            pendingResume: false,
            seekTarget: null,
            seekToken: 0,
            seekTimer: null,
            seekDeadline: 0,
            seekLastWrite: 0,
            seekAttempts: 0,
            seekCheck: null,
            seekPaused: false,
            pendingSeek: null,
            pendingSeekResume: false,
            blobBuildTrack: null,
            blobBuildPromise: null,
            userPaused: false,
            discRotation: 0,
            discSpeed: 0.05,
            lastDiscTimestamp: performance.now(),
            _discAnimationId: null,
            hasStartedPlayback: false,
            pendingRestoreTime: null,
            _lastSaveTime: 0,
            _isRestoring: false,
            
            _audioTrackIndex: 0,
            
            _blockSave: false,
            
            _userActed: false,
            
            _pendingSwitchCommit: false,
            _switchUnblockTimer: null,
            _restoreGuardTimer: null,
            
            customTracks: [],
            _customMusicDb: null,
            customMusicMaxSize: 40 * 1024 * 1024,
            
            
            customMusicDefaultCover: 'covers/custom-music-default.png'
        });
        this.initImageCache();
        this.loadOwnedTracks();
    }

    getOwnedStorageKey() {
        return 'ab_music_owned_v1';
    }

    loadOwnedTracks() {
        try {
            const data = localStorage.getItem(this.getOwnedStorageKey());
            this.ownedTracks = data ? JSON.parse(data) : [0];
        } catch (e) {
            this.ownedTracks = [0];
        }
        if (!Array.isArray(this.ownedTracks)) this.ownedTracks = [0];
    }

    saveOwnedTracks() {
        try {
            localStorage.setItem(this.getOwnedStorageKey(), JSON.stringify(this.ownedTracks));
        } catch (e) {}
    }

    
    getLastStateKey() {
        return 'ab_music_last_state_v1';
    }

    loadPlayState() {
        try {
            const raw = localStorage.getItem(this.getLastStateKey());
            if (!raw) return null;
            const data = JSON.parse(raw);
            return data && typeof data === 'object' ? data : null;
        } catch (e) {
            return null;
        }
    }

    savePlayState(force) {
        try {
            
            if (this._isRestoring) return;
            
            if (this._blockSave) return;
            
            if (this.isSeeking && (!force || this.seekTarget == null)) return;

            const now = Date.now();
            
            if (!force && now - this._lastSaveTime < 2000) return;
            this._lastSaveTime = now;

            const prev = this.loadPlayState() || {};
            const audio = this.audio;
            const hasMeta = audio && audio.readyState >= 1;

            
            
            let index = _.isNumber(prev.index) ? prev.index : this._audioTrackIndex;
            let time = prev.time;

            if (hasMeta) {
                const t = this.isSeeking ? this.seekTarget : audio.currentTime;
                if (isFinite(t) && t >= 0) {
                    
                    
                    const keepProgress = !this.hasStartedPlayback && !this._userActed && _.isNumber(prev.time);
                    index = keepProgress ? prev.index : this._audioTrackIndex;
                    time = keepProgress ? prev.time : t;
                }
            }

            
            const data = {
                index: index,
                time: time,
                volume: this.volume,
                playMode: this.playMode
            };
            localStorage.setItem(this.getLastStateKey(), JSON.stringify(data));
        } catch (e) {}
    }

    isTrackOwned(index) {
        
        
        const track = this.playlist && this.playlist[index];
        if (track && track.isCustom) return true;
        return this.ownedTracks.includes(index);
    }

    getTrackPrice(index) {
        const track = _.get(this.playlist, index);
        return _.isNumber((track && track.price)) ? track.price : 5000000;
    }

    purchaseTrack(index) {
        if (this.isTrackOwned(index)) return { success: false, message: '已拥有该歌曲' };
        const price = this.getTrackPrice(index);
        const totalValue = window.__getAccumulatedValue ? window.__getAccumulatedValue() : 0;
        if (totalValue < price) {
            return { success: false, message: `总累计价值不足, 需要 ${window.__formatAccumulatedValue ? window.__formatAccumulatedValue(price) : (price / 1000000) + 'm'}` };
        }
        if (window.__spendAccumulatedValue) {
            window.__spendAccumulatedValue(price);
        }
        this.ownedTracks.push(index);
        this.saveOwnedTracks();
        return { success: true, message: '购买成功!' };
    }

    initImageCache() {
        try {
            const cached = localStorage.getItem(this.imageCacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                if (_.get(data, 'version') === this.cacheVersion && data.cache) {
                    
                    const _m = new Map();
                    for (const _k in data.cache) {
                        if (Object.prototype.hasOwnProperty.call(data.cache, _k)) _m.set(_k, data.cache[_k]);
                    }
                    this.imageCache = _m;
                    return;
                }
            }
        } catch (e) {}
        this.imageCache = new Map();
    }

    saveImageCache() {
        try {
            
            const _obj = {};
            this.imageCache.forEach(function(v, k) { _obj[k] = v; });
            localStorage.setItem(this.imageCacheKey, JSON.stringify({
                version: this.cacheVersion,
                cache: _obj,
                timestamp: Date.now()
            }));
        } catch (e) {}
    }

    async init() {
        
        
        
        try {
            const rdm = window.ResourceDownloadManager;
            if (rdm && rdm.musicCacheReady) {
                await Promise.race([
                    rdm.musicCacheReady,
                    new Promise(res => setTimeout(res, 4000))
                ]);
            }
        } catch (e) {}

        await this.loadPlaylistFromXML();
        
        await this.loadCustomTracks();
        this.setupAudio();
        this.isInitialized = true;

        
        this._isRestoring = true;
        const saved = this.loadPlayState();
        let startIndex = 0;
        if (saved && _.isNumber(saved.index) && _.inRange(saved.index, 0, this.playlist.length)
            && this.isTrackOwned(saved.index)) {
            startIndex = saved.index;
        }
        if (saved && _.isNumber(saved.volume)) this.setVolume(saved.volume);
        if (saved && _.isNumber(saved.playMode)) this.playMode = saved.playMode;

        
        
        if (saved && _.isNumber(saved.time) && saved.time > 1 && startIndex === saved.index) {
            this.pendingRestoreTime = saved.time;
        }

        this.loadTrack(startIndex, false);

        
        if (this._restoreGuardTimer) clearTimeout(this._restoreGuardTimer);
        this._restoreGuardTimer = setTimeout(() => this.endRestore(), 6000);

        this.preloadCurrentCover();
        this.startDiscRotation();
        this.bindUnloadSave();
    }

    
    
    commitSwitch() {
        if (!this._pendingSwitchCommit) return;
        if (this._isRestoring) return; 
        this._pendingSwitchCommit = false;
        this.savePlayState(true);
    }

    
    
    endRestore() {
        if (!this._isRestoring) return;
        this._isRestoring = false;
        if (this._restoreGuardTimer) {
            clearTimeout(this._restoreGuardTimer);
            this._restoreGuardTimer = null;
        }
        this.commitSwitch();
    }

    loadPlaylistFromXML() {
        return new Promise(resolve => {
            this.basePath = 'music-player/';
            this.playlist = [
                { title: 'Darkness', artist: 'S1大厅背景音乐', file: 'BGM_Main_UI_Loop_A.mp3', cover: 'covers/BGM_Main_UI_Loop_A.jpg', duration: 0, price: 0 },
                { title: 'DayBreak', artist: 'S4大厅背景音乐', file: 'BGM_Main_UI_Loop_V2.mp3', cover: 'covers/BGM_Main_UI_Loop_V2.jpg', duration: 0, price: 3000000 },
                { title: 'Detonation', artist: 'S9大厅背景音乐', file: 'BGM_Main_UI_Loop_V3.mp3', cover: 'covers/BGM_Main_UI_Loop_V3.jpg', duration: 0, price: 3500000 },
                { title: 'DeadPoint', artist: 'S12大厅背景音乐', file: 'BGM_Main_UI_Loop_V4.mp3', cover: 'covers/BGM_Main_UI_Loop_V4.jpg', duration: 0, price: 4000000 },
                { title: 'TALIA\'S THEME', artist: 'S13大厅背景音乐', file: 'TALIA\'S THEME V1.mp3', cover: 'covers/TALIA.jpg', duration: 0, price: 4500000 },
                { title: 'EXCALIBUR', artist: 'Cyberpunk2077联动专属背景音乐', file: 'EXCALIBUR.mp3', cover: 'covers/EXCALIBUR.jpg', duration: 0, price: 6000000 },
                { title: 'Blood Lament', artist: 'S14大厅背景音乐', file: 'Blood Lament_MatchPrepare.mp3', cover: 'covers/Blood Lament_MatchPrepare.jpg', duration: 0, price: 4500000 },
                { title: 'Fission', artist: 'S15大厅背景音乐', file: 'Fission.mp3', cover: 'covers/Fission.jpg', duration: 0, price: 4000000 },
                { title: 'Fusion', artist: 'S15大厅背景音乐', file: 'Fusion.mp3', cover: 'covers/Fusion.jpg', duration: 0, price: 4500000 },
                { title: 'Stay Away From This', artist: 'S16大厅背景音乐', file: 'Stay away form this.mp3', cover: 'covers/Stay away form this.jpg', duration: 0, price: 5000000 },
                { title: '塞下曲 · 长夜终尽', artist: 'S16大厅背景音乐', file: 'S16 塞下曲 · 长夜终尽 - Season Theme Lobby Theme 1.mp3', cover: 'covers/S16 塞下曲 · 长夜终尽 - Season Theme Lobby Theme 1.jpg', duration: 0, price: 6000000 },
                { title: 'Obstruction', artist: 'S17大厅背景音乐', file: 'Obstruction.mp3', cover: 'covers/Obstruction.jpg', duration: 0, price: 5000000 },
                { title: 'Infection', artist: 'S17大厅背景音乐', file: 'Infection.mp3', cover: 'covers/Infection.jpg', duration: 0, price: 5000000 },
                { title: 'Variant Positive', artist: 'S18大厅背景音乐', file: 'Variant Positive.mp3', cover: 'covers/Variant Positive.jpg', duration: 0, price: 5000000 },
                { title: 'Slient Gunsmoke', artist: 'S19大厅背景音乐', file: 'S19 Slient Gunsmoke Lobby Theme.mp3', cover: 'covers/S19 Slient Gunsmoke Lobby Theme.jpg', duration: 0, price: 5000000 },
                { title: 'Echoes of Dread', artist: 'S19大厅背景音乐', file: 'S19 Echoes of Dread Lobby Theme.mp3', cover: 'covers/S19 Echoes of Dread Lobby Theme.jpg', duration: 0, price: 5000000 },
                { title: 'Dusk To Dawn', artist: '暗区突围无限', file: 'Dusk To Dawn.mp3', cover: 'covers/Dusk To Dawn.jpg', duration: 0, price: 6000000 },
                { title: 'Freezing Winds', artist: '军港来客', file: 'Freezing Winds.mp3', cover: 'covers/Freezing Winds.jpg', duration: 0, price: 6000000 },
                { title: '全大厅背景音乐混音', artist: 'TR游戏评测', file: 'Lobby Theme Remix.mp3', cover: 'covers/Lobby Theme Remix.jpg', duration: 0, price: 10000000 },
                { title: '币币机', artist: '贩卖机音乐', file: '币币机.mp3', cover: 'covers/币币机.jpg', duration: 0, price: 100000 },
                { title: '奥特卡片机', artist: '贩卖机音乐', file: '奥特卡片机.mp3', cover: 'covers/奥特卡片机.jpg', duration: 0, price: 100000 },
                { title: '大力招财•2026', artist: '贩卖机音乐', file: '大力招财2026.mp3', cover: 'covers/大力招财2026.jpg', duration: 0, price: 100000 },
                { title: '末路狂飙', artist: '卡莫纳唱片', file: '混乱狂飙.mp3', cover: 'covers/混乱狂飙.jpg', duration: 0, price: 6000000 }
            ];
            resolve();
        });
    }

    getFullPath(filename) {
        if (!filename) return '';
        if (_.startsWith(filename, '/') || /^https?:\/\//.test(filename) || _.startsWith(filename, 'blob:')) return filename;
        return this.basePath + filename;
    }


    openCustomMusicDB() {
        if (!window.indexedDB) return Promise.reject(new Error('indexedDB unavailable'));
        if (this._customMusicDb) return Promise.resolve(this._customMusicDb);
        return new Promise((resolve, reject) => {
            const req = indexedDB.open('ab_custom_music', 1);
            req.onupgradeneeded = e => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('tracks')) {
                    db.createObjectStore('tracks', { keyPath: 'id' });
                }
            };
            req.onsuccess = e => {
                this._customMusicDb = e.target.result;
                resolve(this._customMusicDb);
            };
            req.onerror = e => reject(e.target.error || new Error('open db failed'));
        });
    }

    
    readCustomTrackRecords() {
        return this.openCustomMusicDB().then(db => new Promise((resolve, reject) => {
            const tx = db.transaction('tracks', 'readonly');
            const req = tx.objectStore('tracks').openCursor();
            const list = [];
            req.onsuccess = e => {
                const cursor = e.target.result;
                if (!cursor) { resolve(list); return; }
                if (cursor.value) list.push(cursor.value);
                cursor.continue();
            };
            req.onerror = () => reject(req.error);
        }));
    }

    async loadCustomTracks() {
        try {
            const records = await this.readCustomTrackRecords();
            records.sort((a, b) => (Number(a.addedAt) || 0) - (Number(b.addedAt) || 0));
            records.forEach(record => this.appendCustomTrack(record));
        } catch (e) {}
    }

    appendCustomTrack(record) {
        if (!record || !record.blob || !record.id) return null;
        if (_.some(this.customTracks, t => t && t.customId === record.id)) return null;
        let blob = record.blob;
        
        if (!blob.type) {
            try { blob = new Blob([blob], { type: record.type || 'audio/mpeg' }); } catch (e) {}
        }
        
        let cover = this.customMusicDefaultCover;
        let coverBlobUrl = '';
        if (record.coverBlob) {
            try {
                let cb = record.coverBlob;
                if (!cb.type) cb = new Blob([cb], { type: record.coverType || 'image/png' });
                coverBlobUrl = URL.createObjectURL(cb);
                cover = coverBlobUrl;
            } catch (e) { cover = this.customMusicDefaultCover; }
        }
        const track = {
            title: record.title || this.getCustomTitle(record.name || '本地音乐'),
            artist: record.artist || '本地导入',
            file: '',
            cover: cover,
            duration: 0,
            price: 0,
            isCustom: true,
            customId: record.id,
            _blobUrl: URL.createObjectURL(blob),
            _coverBlobUrl: coverBlobUrl
        };
        this.playlist.push(track);
        this.customTracks.push(track);
        return track;
    }

    getCustomTitle(name) {
        const raw = String(name || '本地音乐').replace(/\.[^.]+$/, '').trim();
        return (raw || '本地音乐').slice(0, 40);
    }

    async parseAudioTags(blob) {
        const out = { title: '', artist: '', coverBlob: null, coverType: '' };
        try {
            const head = await blob.slice(0, 10).arrayBuffer();
            const dv = new DataView(head);
            if (String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2)) !== 'ID3') return out;
            const major = dv.getUint8(3);
            const flags = dv.getUint8(5);
            const unsync = (flags & 0x80) !== 0;
            const size = ((dv.getUint8(6) & 0x7f) << 21) | ((dv.getUint8(7) & 0x7f) << 14)
                | ((dv.getUint8(8) & 0x7f) << 7) | (dv.getUint8(9) & 0x7f);
            const body = new Uint8Array(await blob.slice(10, 10 + size).arrayBuffer());
            const data = unsync ? this._unsyncBytes(body) : body;
            let pos = 0;
            const frameSizeIsSynchsafe = (major === 4);
            const readText = (arr, start, encoding) => {
                if (encoding === 1 || encoding === 2) {
                    
                    let i = start;
                    while (i + 1 < arr.length && !(arr[i] === 0 && arr[i + 1] === 0)) i += 2;
                    const slice = arr.slice(start, i);
                    try {
                        return new TextDecoder('utf-16').decode(slice).replace(/\u0000/g, '').trim();
                    } catch (e) { return ''; }
                }
                let i = start;
                while (i < arr.length && arr[i] !== 0) i++;
                const slice = arr.slice(start, i);
                try {
                    const enc = encoding === 3 ? 'utf-8' : 'iso-8859-1';
                    return new TextDecoder(enc).decode(slice).replace(/\u0000/g, '').trim();
                } catch (e) {
                    return '';
                }
            };
            while (pos + 10 <= data.length) {
                const id = String.fromCharCode(data[pos], data[pos + 1], data[pos + 2], data[pos + 3]);
                if (id.charCodeAt(0) === 0 || !/[A-Z0-9]{4}/.test(id)) break;
                let fsize;
                if (frameSizeIsSynchsafe) {
                    fsize = ((data[pos + 4] & 0x7f) << 21) | ((data[pos + 5] & 0x7f) << 14)
                        | ((data[pos + 6] & 0x7f) << 7) | (data[pos + 7] & 0x7f);
                } else {
                    fsize = data[pos + 4] * 0x1000000 + (data[pos + 5] << 16) + (data[pos + 6] << 8) + data[pos + 7];
                }
                if (fsize <= 0 || pos + 10 + fsize > data.length) break;
                const frame = data.subarray(pos + 10, pos + 10 + fsize);
                if (id === 'TIT2' && frame.length > 1) {
                    out.title = readText(frame, 1, frame[0]);
                } else if (id === 'TPE1' && frame.length > 1) {
                    out.artist = readText(frame, 1, frame[0]);
                } else if (id === 'APIC' && frame.length > 1) {
                    const enc = frame[0];
                    let j = 1;
                    while (j < frame.length && frame[j] !== 0) j++;
                    const mime = new TextDecoder('ascii').decode(frame.subarray(1, j));
                    j++; 
                    if (j < frame.length) j++;
                    
                    let k = j;
                    if (enc === 1 || enc === 2) {
                        while (k + 1 < frame.length && !(frame[k] === 0 && frame[k + 1] === 0)) k += 2;
                        k += 2; 
                    } else {
                        while (k < frame.length && frame[k] !== 0) k++;
                        k++; 
                    }
                    if (k < frame.length) {
                        const imgBytes = frame.subarray(k);
                        out.coverBlob = new Blob([imgBytes], { type: mime || 'image/png' });
                        out.coverType = mime || 'image/png';
                    }
                }
                pos += 10 + fsize;
            }
        } catch (e) {  }
        return out;
    }

    _unsyncBytes(arr) {
        const out = [];
        for (let i = 0; i < arr.length; i++) {
            out.push(arr[i]);
            if (arr[i] === 0xff && arr[i + 1] === 0x00) i++;
        }
        return new Uint8Array(out);
    }

    async importCustomMusicFiles(files) {
        const list = Array.prototype.slice.call(files || []);
        if (!list.length) return 0;
        let added = 0;
        let failed = 0;
        for (let i = 0; i < list.length; i++) {
            const file = list[i];
            if (!file) continue;
            const isAudio = /^audio\//.test(file.type || '')
                || /\.(mp3|m4a|aac|wav|ogg|flac)$/i.test(file.name || '');
            if (!isAudio) { failed++; continue; }
            if (file.size > this.customMusicMaxSize) {
                if (window.showToast) {
                    window.showToast('「' + (file.name || '文件') + '」超过 40MB，已跳过');
                }
                failed++;
                continue;
            }
            try {
                const tags = await this.parseAudioTags(file);
                const record = {
                    id: 'cm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
                    title: tags.title || this.getCustomTitle(file.name),
                    artist: tags.artist || '本地导入',
                    name: file.name || '本地音乐',
                    type: file.type || '',
                    blob: file,
                    size: file.size,
                    coverBlob: tags.coverBlob,
                    coverType: tags.coverType,
                    addedAt: Date.now()
                };
                const db = await this.openCustomMusicDB();
                await new Promise((resolve, reject) => {
                    const tx = db.transaction('tracks', 'readwrite');
                    tx.objectStore('tracks').put(record);
                    tx.oncomplete = () => resolve();
                    tx.onerror = () => reject(tx.error || new Error('write failed'));
                });
                if (this.appendCustomTrack(record)) added++;
                else failed++;
            } catch (e) {
                failed++;
            }
        }
        if (window.showToast) {
            if (added) {
                window.showToast('已导入 ' + added + ' 首本地音乐，长按曲目可修改名称/作者/封面' + (failed ? '，' + failed + ' 首失败' : ''));
            } else if (failed) {
                window.showToast('导入失败，可能是存储空间不足或格式不支持');
            }
        }
        return added;
    }

    async updateCustomTrack(index, patch) {
        const track = this.playlist[index];
        if (!track || !track.isCustom) return false;
        try {
            const db = await this.openCustomMusicDB();
            const rec = await new Promise((resolve, reject) => {
                const tx = db.transaction('tracks', 'readonly');
                const req = tx.objectStore('tracks').get(track.customId);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
            if (!rec) return false;
            if (patch.title != null) rec.title = String(patch.title).trim() || this.getCustomTitle(rec.name);
            if (patch.artist != null) rec.artist = String(patch.artist).trim() || '本地导入';
            if (patch.coverBlob) {
                rec.coverBlob = patch.coverBlob;
                rec.coverType = patch.coverBlob.type || 'image/png';
            }
            if (patch.blob) {
                rec.blob = patch.blob;
                rec.type = patch.blob.type || rec.type;
                rec.size = patch.blob.size;
                rec.name = patch.name || rec.name;
            }
            const blobChanged = !!patch.blob;
            await new Promise((resolve, reject) => {
                const tx = db.transaction('tracks', 'readwrite');
                tx.objectStore('tracks').put(rec);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
            
            if (track._blobUrl) { try { URL.revokeObjectURL(track._blobUrl); } catch (e) {} }
            if (track._coverBlobUrl) { try { URL.revokeObjectURL(track._coverBlobUrl); } catch (e) {} }
            let audioBlob = rec.blob;
            if (!audioBlob.type) audioBlob = new Blob([audioBlob], { type: rec.type || 'audio/mpeg' });
            track._blobUrl = URL.createObjectURL(audioBlob);
            let cover = this.customMusicDefaultCover;
            let coverUrl = '';
            if (rec.coverBlob) {
                let cb = rec.coverBlob;
                if (!cb.type) cb = new Blob([cb], { type: rec.coverType || 'image/png' });
                coverUrl = URL.createObjectURL(cb);
                cover = coverUrl;
            }
            track._coverBlobUrl = coverUrl;
            track.cover = cover;
            track.title = rec.title;
            track.artist = rec.artist;
            
            if (blobChanged && this.currentTrackIndex === index) {
                this.loadTrack(index, false);
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    async deleteCustomTrack(index) {
        const track = this.playlist[index];
        if (!track || !track.isCustom) return false;
        const wasCurrent = index === this.currentTrackIndex;
        if (wasCurrent) {
            try { this.audio.pause(); } catch (e) {}
            this.isPlaying = false;
        }
        if (track._blobUrl) {
            try { URL.revokeObjectURL(track._blobUrl); } catch (e) {}
            delete track._blobUrl;
        }
        this.playlist.splice(index, 1);
        this.customTracks = this.customTracks.filter(t => t !== track);
        
        if (!wasCurrent && index < this.currentTrackIndex) {
            this.currentTrackIndex -= 1;
            this._audioTrackIndex -= 1;
            this.savePlayState(true);
        }
        try {
            const db = await this.openCustomMusicDB();
            await new Promise((resolve, reject) => {
                const tx = db.transaction('tracks', 'readwrite');
                tx.objectStore('tracks').delete(track.customId);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } catch (e) {}
        if (wasCurrent) {
            
            const owned = this.getOwnedIndices();
            if (owned.length) {
                let target = owned[0];
                for (let i = 0; i < owned.length; i++) {
                    target = owned[i];
                    if (owned[i] >= index) break;
                }
                this.loadTrack(target, false);
            }
        }
        return true;
    }

    setupAudio() {
        this.audio.volume = this.volume;
        this.audio.preload = 'metadata'; 
        const audio = this.audio;
        
        $(audio).on({
            ended: () => this.handleTrackEnd(),
            error: () => {
                this.isPlaying = false;
            },
            play: () => {
                this.isPlaying = true;
                this.hasStartedPlayback = true;
                this.startDiscRotation();
            },
            pause: () => {
                this.isPlaying = false;
                this.savePlayState(true);
            },
            timeupdate: () => {
                this.savePlayState(false);
            },
            seeking: () => {
                this.isSeeking = true;
            },
            seeked: () => {
                
                if (this.seekTarget == null) { this.isSeeking = false; return; }
                if (typeof this.seekCheck === 'function') this.seekCheck();
            },
            loadedmetadata: () => {
                
                this._blockSave = false;
                
                if (this.pendingSeek != null) {
                    const target = this.pendingSeek;
                    const resume = this.pendingSeekResume;
                    this.pendingSeek = null;
                    this.pendingSeekResume = false;
                    try { this.audio.currentTime = target; } catch (e) {}
                    this.isSeeking = false;
                    this.seekTarget = null;
                    if (this.seekTimer) { clearTimeout(this.seekTimer); this.seekTimer = null; }
                    if (resume) this.audio.play().catch(() => {});
                    return;
                }
                
                if (this.pendingRestoreTime != null) {
                    const t = this.pendingRestoreTime;
                    this.pendingRestoreTime = null;
                    this.seekTo(t);
                    
                    setTimeout(() => this.endRestore(), 1500);
                    return;
                }
                if (this.isSeeking && this.pendingResume && !this.userPaused) {
                    this.pendingResume = false;
                    this.isSeeking = false;
                    this.play();
                }
                
                this.endRestore();
            }
        });
    }

    handleTrackEnd() {
        const actions = [
            () => {
                if (this.currentTrackIndex < this.playlist.length - 1) {
                    this.nextTrack();
                } else {
                    this.pause();
                    this.audio.currentTime = 0;
                }
            },
            () => {
                this.audio.currentTime = 0;
                this.play();
            },
            () => {
                this.randomTrack();
            }
        ];
        actions[this.playMode] && actions[this.playMode].call(this);
    }

    nextTrack() {
        const ownedIndices = this.getOwnedIndices();
        if (_.isEmpty(ownedIndices)) return;
        const pos = ownedIndices.indexOf(this.currentTrackIndex);
        const next = ownedIndices[(pos + 1) % ownedIndices.length];
        this.loadTrack(next, true);
    }

    previousTrack() {
        const ownedIndices = this.getOwnedIndices();
        if (_.isEmpty(ownedIndices)) return;
        const pos = ownedIndices.indexOf(this.currentTrackIndex);
        const prev = ownedIndices[(pos - 1 + ownedIndices.length) % ownedIndices.length];
        this.loadTrack(prev, true);
    }

    randomTrack() {
        const ownedIndices = this.getOwnedIndices();
        if (_.isEmpty(ownedIndices)) return;
        let newIndex;
        do {
            newIndex = _.sample(ownedIndices);
        } while (newIndex === this.currentTrackIndex && ownedIndices.length > 1);
        this.loadTrack(newIndex, true);
    }

    formatPrice(price) {
        if (!_.isNumber(price) || _.isNaN(price)) return '0';
        if (_.isFunction(window.__formatAccumulatedValue)) return window.__formatAccumulatedValue(price);
        if (price >= 1000000) return `${_.trimEnd((price / 1000000).toFixed(2), '0').replace(/\.$/, '')}m`;
        if (price >= 1000) return `${_.trimEnd((price / 1000).toFixed(2), '0').replace(/\.$/, '')}k`;
        return String(price);
    }

    getOwnedIndices() {
        const list = [];
        this.playlist.forEach((t, i) => {
            if (this.isTrackOwned(i)) list.push(i);
        });
        return list;
    }

    loadTrack(index, autoPlay = false) {
        if (_.isEmpty(this.playlist) || !_.inRange(index, 0, this.playlist.length)) return;

        
        if (!this._isRestoring) this.savePlayState(true);
        
        this._blockSave = true;
        
        if (!this._isRestoring) {
            this._userActed = true;
            this._pendingSwitchCommit = true;
        }
        const unblock = () => {
            if (this._switchUnblockTimer) clearTimeout(this._switchUnblockTimer);
            this._switchUnblockTimer = setTimeout(() => {
                this._blockSave = false;
                this.commitSwitch();
            }, 400);
        };

        this.discRotation = 0;
        this.updateDiscDisplay();

        const track = this.playlist[index];
        this.currentTrackIndex = index;
        
        this._audioTrackIndex = index;
        this.isSeeking = false;
        this.pendingResume = false;
        this.seekTarget = null;
        this.seekCheck = null;
        this.seekPaused = false;
        this.pendingSeek = null;
        this.pendingSeekResume = false;
        this.seekToken += 1;
        if (this.seekTimer) { clearTimeout(this.seekTimer); this.seekTimer = null; }
        
        const fileUrl = track._blobUrl || this.getFullPath(track.file);
        
        
        if (track._seekBlobUrl && track._seekBlobSrc && track._seekBlobSrc !== fileUrl) {
            try { URL.revokeObjectURL(track._seekBlobUrl); } catch (e) {}
            delete track._seekBlobUrl;
            delete track._seekBlobSrc;
        }
        
        const playUrl = track._seekBlobUrl || fileUrl;
        
        if (track._blobUrl) {
            this.audio.src = track._blobUrl;
            this.audio.load();
            if (autoPlay) {
                this.audio.play().catch(() => {});
            }
            unblock();
            return;
        }
        
        
        this.audio.src = playUrl;
        this.audio.load();
        if (autoPlay) {
            this.audio.play().catch(() => {});
        }
        
        
        if (playUrl.indexOf('blob:') !== 0) this.prefetchSeekBlob(track, fileUrl);
        unblock();
    }

    playTrackByIndex(index) {
        if (!_.inRange(index, 0, this.playlist.length)) return;
        if (!this.isTrackOwned(index)) {
            if (window.showToast) window.showToast('该歌曲未解锁, 需在播放列表中购买');
            return;
        }
        if (index !== this.currentTrackIndex) {
            this.loadTrack(index, true);
        } else {
            this.togglePlay();
        }
    }

    play() {
        if (this.isSeeking && this.pendingResume) {
            return;
        }
        
        this.userPaused = false;
        this._userActed = true;
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.hasStartedPlayback = true;
            this.startDiscRotation();
        }).catch(() => {});
    }

    pause() {
        this.userPaused = true;
        this.audio.pause();
        this.isPlaying = false;
    }

    togglePlay() {
        this.isPlaying ? this.pause() : this.play();
    }

    setVolume(volume) {
        this.volume = _.clamp(volume, 0, 1);
        this.audio.volume = this.volume;
        this.savePlayState(true);
    }

    togglePlayMode() {
        this.playMode = (this.playMode + 1) % this.playModes.length;
        this.savePlayState(true);
        return this.playModes[this.playMode];
    }

    getCurrentMode() {
        return this.playModes[this.playMode];
    }

    
    canSeekTo(target) {
        const audio = this.audio;
        if (!audio) return false;
        const ranges = audio.seekable;
        
        if (!ranges || ranges.length === 0) return true;
        for (let i = 0; i < ranges.length; i++) {
            if (target >= ranges.start(i) - 0.5 && target <= ranges.end(i) + 0.5) return true;
        }
        return false;
    }

    seekTo(time) {
        const audio = this.audio;
        if (!audio) return false;
        const duration = audio.duration;
        if (!duration || isNaN(duration) || !isFinite(duration)) return false;
        if (time === null || time === undefined || isNaN(time)) return false;

        const target = _.clamp(Number(time), 0, Math.max(0, duration - 0.25));
        if (!isFinite(target)) return false;

        const src = audio.currentSrc || audio.src || '';
        if (src.indexOf('blob:') === 0) return this.nativeSeek(target);

        const track = this.playlist[this.currentTrackIndex];
        if (track) {
            this.seekViaBlob(track, target, src);
            return true;
        }
        return this.nativeSeek(target);
    }

    nativeSeek(target) {
        const audio = this.audio;
        if (!audio) return false;

        if (!this.canSeekTo(target)) {
            console.warn('[MUSIC] 当前音源不可 seek，目标 ' + target.toFixed(1) + 's');
            return false;
        }

        const shouldResume = !audio.paused && !this.userPaused;
        const token = ++this.seekToken;

        this.seekTarget = target;
        this.isSeeking = true;
        this._userActed = true;
        this.seekAttempts = 0;
        this.seekLastWrite = 0;
        this.seekPaused = false;
        this.seekDeadline = Date.now() + 12000;

        const stopTimer = () => {
            if (this.seekTimer) { clearTimeout(this.seekTimer); this.seekTimer = null; }
        };
        const arm = ms => {
            stopTimer();
            this.seekTimer = setTimeout(() => check(), ms);
        };
        const finish = ok => {
            if (token !== this.seekToken) return;
            stopTimer();
            this.seekCheck = null;
            this.isSeeking = false;
            this.seekTarget = null;
            
            const needResume = shouldResume && audio.paused && (ok || this.seekPaused);
            this.seekPaused = false;
            if (needResume) audio.play().catch(() => {});
            
            if (ok) this.savePlayState(true);
        };
        const write = () => {
            this.seekAttempts += 1;
            this.seekLastWrite = Date.now();
            try { audio.currentTime = target; } catch (e) {}
        };
        
        const check = () => {
            if (token !== this.seekToken) return;
            if (Date.now() > this.seekDeadline) { finish(false); return; }

            const drift = Math.abs((audio.currentTime || 0) - target);
            if (!audio.seeking && drift <= 0.75) { finish(true); return; }

            if (audio.seeking) {
                
                if (!this.seekPaused && Date.now() - this.seekLastWrite > 2500) {
                    this.seekPaused = true;
                    try { audio.pause(); } catch (e) {}
                }
                arm(350);
                return;
            }

            
            if (Date.now() - this.seekLastWrite < 900) { arm(350); return; }

            
            if (this.seekAttempts < 2) { write(); arm(700); return; }

            finish(false);
        };
        this.seekCheck = check;

        
        if (audio.readyState < 1) {
            $(audio).one('loadedmetadata', () => {
                if (token !== this.seekToken) return;
                write();
                arm(500);
            });
            arm(2000);
            return true;
        }

        write();
        arm(300);
        return true;
    }

    
    seekViaBlob(track, target, src) {
        const token = ++this.seekToken;
        this.isSeeking = true;
        this.seekTarget = target;
        if (this.seekTimer) { clearTimeout(this.seekTimer); this.seekTimer = null; }

        const fail = () => {
            if (token !== this.seekToken) return;
            this.isSeeking = false;
            this.seekTarget = null;
            this.nativeSeek(target);
        };

        this.ensureSeekBlob(track, src).then(blobUrl => {
            if (token !== this.seekToken) return;
            if (!blobUrl) {
                console.warn('[MUSIC] 无法读取音频字节，seek 退回原生实现');
                fail();
                return;
            }

            const audio = this.audio;
            if ((audio.currentSrc || audio.src || '') === blobUrl) {
                this.nativeSeek(target);
                return;
            }

            this.pendingSeek = target;
            this.pendingSeekResume = !audio.paused && !this.userPaused;
            this.isSeeking = true;
            this.seekTarget = target;
            try { audio.pause(); } catch (e) {}
            audio.src = blobUrl;
            audio.load();

            this.seekTimer = setTimeout(() => {
                if (token !== this.seekToken) return;
                this.pendingSeek = null;
                this.pendingSeekResume = false;
                this.isSeeking = false;
                this.seekTarget = null;
                this.seekTimer = null;
            }, 8000);
        }).catch(fail);
    }

    ensureSeekBlob(track, src) {
        if (!track) return Promise.resolve(null);
        if (track._seekBlobUrl) return Promise.resolve(track._seekBlobUrl);
        if (this.blobBuildTrack === track && this.blobBuildPromise) return this.blobBuildPromise;

        const url = src || this.getFullPath(track.file);
        if (this.isDefaultFallback(track, url)) return Promise.resolve(null);
        this.blobBuildTrack = track;
        const p = this.fetchAsBlobUrl(url).then(blobUrl => {
            if (blobUrl) {
                track._seekBlobUrl = blobUrl;
                track._seekBlobSrc = url;
                if (this.playlist[this.currentTrackIndex] === track) this.trimSeekBlobs(track);
            }
            return blobUrl;
        }).catch(() => null).then(res => {
            this.blobBuildTrack = null;
            this.blobBuildPromise = null;
            return res;
        });
        this.blobBuildPromise = p;
        return p;
    }

    trimSeekBlobs(keep) {
        this.playlist.forEach(t => {
            if (t === keep || !t._seekBlobUrl) return;
            try { URL.revokeObjectURL(t._seekBlobUrl); } catch (e) {}
            delete t._seekBlobUrl;
            if (t._seekBlobSrc) delete t._seekBlobSrc;
        });
    }

    isDefaultFallback(track, url) {
        try {
            const rdm = window.ResourceDownloadManager;
            if (!rdm || !rdm.defaultMusicFile) return false;
            const def = rdm.defaultMusicFile;
            if (String(url).indexOf(def) === -1) return false;
            return (this.basePath + track.file).indexOf(def) === -1;
        } catch (e) {
            return false;
        }
    }

    prefetchSeekBlob(track, url) {
        if (!track || !url || url.indexOf('blob:') === 0) return;
        if (track._seekBlobUrl) return;
        if (this.isDefaultFallback(track, url)) return;
        setTimeout(() => {
            if (this.playlist[this.currentTrackIndex] !== track) return;
            this.ensureSeekBlob(track, url).catch(() => {});
        }, 1000);
    }

    async fetchAsBlobUrl(url) {
        if (!url || url.indexOf('blob:') === 0) return null;
        const type = /\.(m4a|mp4)$/i.test(url) ? 'audio/mp4' : 'audio/mpeg';
        const candidates = [url];
        
        const m = String(url).match(/^file:\/\/\/android_asset\/(.+)$/);
        if (m) candidates.push('https://appassets.androidplatform.net/assets/' + m[1]);

        for (const u of candidates) {
            try {
                const res = await fetch(u, { cache: 'force-cache' });
                if (res && res.ok) {
                    const buf = await res.arrayBuffer();
                    if (buf && buf.byteLength > 0) {
                        return URL.createObjectURL(new Blob([buf], { type }));
                    }
                }
            } catch (e) {}

            
            const viaXhr = await new Promise(resolve => {
                try {
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', u, true);
                    xhr.responseType = 'arraybuffer';
                    xhr.timeout = 15000;
                    xhr.onload = () => {
                        if ((xhr.status === 200 || xhr.status === 0) && xhr.response && xhr.response.byteLength > 0) {
                            try { resolve(URL.createObjectURL(new Blob([xhr.response], { type }))); return; } catch (e) {}
                        }
                        resolve(null);
                    };
                    xhr.onerror = () => resolve(null);
                    xhr.ontimeout = () => resolve(null);
                    xhr.send();
                } catch (e) { resolve(null); }
            });
            if (viaXhr) return viaXhr;
        }
        return null;
    }

    
    getDisplayTime() {
        if (this.isSeeking && this.seekTarget != null) return this.seekTarget;
        const t = this.audio ? this.audio.currentTime : 0;
        return isFinite(t) ? t : 0;
    }

    formatTime(seconds) {
        if (_.isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${_.padStart(secs, 2, '0')}`;
    }

    loadCoverImage(url, element, placeholder) {
        if (_.isEmpty((url && url.trim()))) {
            $(element).hide();
            $(placeholder).show();
            return;
        }

        if (this.imageCache.has(url)) {
            $(element).on({
                load: () => { $(element).show(); $(placeholder).hide(); },
                error: () => { $(element).hide(); $(placeholder).show(); this.imageCache.delete(url); this.saveImageCache(); }
            }).attr('src', this.imageCache.get(url));
            return;
        }

        $('<img>').attr({ src: url, crossOrigin: 'anonymous', referrerPolicy: 'no-referrer' })
            .on('load', _.bind(function() {
                this.imageCache.set(url, url);
                this.saveImageCache();
                $(element).attr('src', url).show();
                $(placeholder).hide();
            }, this))
            .on('error', () => { $(element).hide(); $(placeholder).show(); });
    }

    preloadCurrentCover() {
        if (_.isEmpty(this.playlist)) return;
        const track = this.playlist[this.currentTrackIndex];
        if ((track && track.cover && track.cover.trim())) {
            const url = this.getFullPath(track.cover);
            if (url && !this.imageCache.has(url)) {
                $('<img>').attr({ src: url, crossOrigin: 'anonymous' })
                    .on('load', _.bind(function() {
                        this.imageCache.set(url, url);
                        this.saveImageCache();
                    }, this));
            }
        }
    }

    updateDiscDisplay() {
        const disc = document.getElementById('record-disc');
        if (disc) {
            disc.style.setProperty('transform', `rotate(${this.discRotation}deg)`, 'important');
            disc.style.setProperty('animation', 'none', 'important');
            disc.style.setProperty('transition', 'none', 'important');
        }
    }

    startDiscRotation() {
        if (this._discAnimationId) return;
        const rotate = () => {
            const now = performance.now();
            const delta = (now - this.lastDiscTimestamp) / 1000;
            this.lastDiscTimestamp = now;
            
            if (this.isPlaying) {
                this.discRotation = (this.discRotation + delta * this.discSpeed * 360) % 360;
            }
            
            this.updateDiscDisplay();
            this._discAnimationId = requestAnimationFrame(rotate);
        };
        this.lastDiscTimestamp = performance.now();
        this._discAnimationId = requestAnimationFrame(rotate);
    }

    stopDiscRotation() {
        if (this._discAnimationId) {
            cancelAnimationFrame(this._discAnimationId);
            this._discAnimationId = null;
        }
    }

    
    bindUnloadSave() {
        const save = () => this.savePlayState(true);
        window.addEventListener('pagehide', save);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') save();
        });
        window.addEventListener('beforeunload', save);
    }
}

$(function() {
    if (!window.musicPlayer) {
        window.musicPlayer = new MusicPlayer();
        setTimeout(() => window.musicPlayer.init(), 100);
    }

    const $els = {
        toggleBtn: $('#music-toggle-btn'),
        playBtn: $('#music-play-btn'),
        prevBtn: $('#music-prev-btn'),
        nextBtn: $('#music-next-btn'),
        playlistBtn: $('#music-playlist-btn'),
        modeBtn: $('#music-mode-btn'),
        volumeSlider: $('#music-volume-slider'),
        volumeFill: $('#music-volume-fill'),
        volumeValue: $('#music-volume-value'),
        trackTitle: $('#current-track-title'),
        trackArtist: $('#current-track-artist'),
        cover: $('#music-cover'),
        coverDefault: $('#music-cover-default'),
        recordDisc: $('#record-disc'),
        progressSlider: $('#music-progress-slider'),
        progressFill: $('#music-progress-fill'),
        currentTime: $('#music-current-time'),
        totalTime: $('#music-total-time'),
        playlistModal: $('#music-playlist-modal'),
        playlistClose: $('#music-playlist-close'),
        playlistContainer: $('#playlist-container'),
        playlistEmpty: $('#playlist-empty')
    };

    let isDraggingProgress = false;
    let dragRatio = null;
    let suppressClick = false;
    let lastTouchTs = 0;

    const playClickSound = () => {
        if (_.isFunction((window.Utils && window.Utils.playAudio))) {
            window.Utils.playAudio('click-audio', { volume: 1 });
        }
    };

    const getEventX = e => {
        if (e.touches && e.touches.length > 0) return e.touches[0].clientX;
        if (e.changedTouches && e.changedTouches.length > 0) return e.changedTouches[0].clientX;
        if (e.clientX !== undefined) return e.clientX;
        if (e.pageX !== undefined) return e.pageX;
        return null;
    };

    
    const escapeHtml = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

    const playBuySound = () => {
        try {
            const buyAudio = new Audio('audio/buy.mp3');
            buyAudio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
            const promise = buyAudio.play();
            if (promise && _.isFunction(promise.catch)) promise.catch(_.noop);
        } catch (e) {}
    };

    
    const playItemClickSound = () => {
        try {
            const clickAudio = new Audio('audio/click.mp3');
            clickAudio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
            const promise = clickAudio.play();
            if (promise && _.isFunction(promise.catch)) promise.catch(_.noop);
        } catch (e) {}
    };

    const injectBuyButtonStyles = () => {
        if ($('#music-buy-glass-style').length) return;
        const css = [
            '.playlist-item-buy {',
            'position: relative;',
            'appearance: none;',
            '-webkit-appearance: none;',
            'display: inline-flex;',
            'align-items: center;',
            'gap: 6px;',
            'padding: 8px 18px;',
            'border: 1px solid rgba(255, 255, 255, 0.38);',
            'border-radius: 999px;',
            'font-size: 13px;',
            'font-weight: 600;',
            'letter-spacing: 0.5px;',
            'color: #ffffff;',
            'cursor: pointer;',
            'overflow: hidden;',
            'flex-shrink: 0;',
            'background: linear-gradient(135deg, rgba(255, 255, 255, 0.30), rgba(255, 255, 255, 0.06));',
            'backdrop-filter: blur(14px) saturate(180%);',
            '-webkit-backdrop-filter: blur(14px) saturate(180%);',
            'box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.60), inset 0 -1px 0 rgba(255, 255, 255, 0.14);',
            'text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);',
            'transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.18s ease, background 0.18s ease;',
            '}',
            '.playlist-item-buy::before {',
            'content: "";',
            'position: absolute;',
            'inset: 0;',
            'background: radial-gradient(120% 80% at 50% -25%, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0) 62%);',
            'pointer-events: none;',
            '}',
            '.playlist-item-buy::after {',
            'content: "";',
            'position: absolute;',
            'top: -60%;',
            'left: -25%;',
            'width: 45%;',
            'height: 220%;',
            'background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0));',
            'transform: rotate(18deg);',
            'pointer-events: none;',
            'transition: left 0.55s ease;',
            '}',
            '.playlist-item-buy:hover {',
            'transform: translateY(-1px) scale(1.04);',
            'background: linear-gradient(135deg, rgba(255, 255, 255, 0.40), rgba(255, 255, 255, 0.12));',
            'box-shadow: 0 10px 24px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.72), inset 0 -1px 0 rgba(255, 255, 255, 0.18);',
            '}',
            '.playlist-item-buy:hover::after {',
            'left: 105%;',
            '}',
            '.playlist-item-buy:active {',
            'transform: scale(0.95);',
            'box-shadow: 0 3px 10px rgba(0, 0, 0, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.45);',
            '}',
            '.playlist-item-price {',
            'color: #ffffff !important;',
            '-webkit-text-fill-color: #ffffff !important;',
            'text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);',
            '}',
            '.playlist-item-price i {',
            'color: #ffffff !important;',
            '}'
        ].join('\n');
        $('<style id="music-buy-glass-style"></style>').text(css).appendTo('head');
    };

    const setVolume = e => {
        const player = window.musicPlayer;
        if (!(player && player.isInitialized)) return;
        
        const x = getEventX(e);
        if (x === null || isNaN(x)) return;
        
        const offset = $els.volumeSlider.offset();
        if (!offset) return;
        
        const volume = _.clamp((x - offset.left) / $els.volumeSlider.width(), 0, 1);
        
        player.setVolume(volume);
        $els.volumeFill.css('width', `${volume * 100}%`);
        $els.volumeValue.text(`${Math.round(volume * 100)}%`);
    };

    const progressRatio = e => {
        const x = getEventX(e);
        if (x === null || isNaN(x)) return null;

        const offset = $els.progressSlider.offset();
        if (!offset) return null;

        const width = $els.progressSlider.width();
        if (width <= 0 || isNaN(width)) return null;

        return _.clamp((x - offset.left) / width, 0, 1);
    };

    
    
    const previewProgress = ratio => {
        const player = window.musicPlayer;
        const duration = (player && player.audio && player.audio.duration) || 0;
        if (!(duration > 0)) return;
        $els.progressFill.css('width', `${ratio * 100}%`);
        $els.currentTime.text(player.formatTime(ratio * duration));
    };

    const commitSeek = ratio => {
        const player = window.musicPlayer;
        if (!(player && player.isInitialized) || !player.audio) return;
        const duration = player.audio.duration || 0;
        if (!(duration > 0)) return;
        player.seekTo(ratio * duration);
        previewProgress(ratio);
    };

    const openPlaylist = (silent) => {
        const player = window.musicPlayer;
        if (!(player && player.isInitialized)) return;
        if (player.loadCustomTracks) {
            player.loadCustomTracks().then(function () { openPlaylistNow(silent); }).catch(function () { openPlaylistNow(silent); });
            return;
        }
        openPlaylistNow(silent);
    };

    const openPlaylistNow = (silent) => {
        const player = window.musicPlayer;
        if (!(player && player.isInitialized)) return;

        
        if (!silent) {
            try {
                const openAudio = new Audio('audio/open-music-playlist.mp3');
                openAudio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
                openAudio.play().catch(() => {});
            } catch (e) {}
        }

        injectBuyButtonStyles();

        $els.playlistContainer.empty();
        $els.playlistEmpty.toggle(_.isEmpty(player.playlist));
        
        const $pageCount = $('#playlist-page-count');
        if ($pageCount.length) {
            $pageCount.text(player.playlist.length ? ('共 ' + player.playlist.length + ' 首') : '');
        }

        let selectedIndex = player.currentTrackIndex;

        _.forEach(player.playlist, (track, index) => {
            if (!track.isCustom && track.file && track.file !== 'BGM_Main_UI_Loop_A.mp3' &&
                window.ResourceDownloadManager && window.ResourceDownloadManager.isDownloaded &&
                !window.ResourceDownloadManager.isDownloaded('music-player/' + track.file)) {
                return;
            }
            const coverPath = player.getFullPath(track.cover);
            const safeTitle = escapeHtml(track.title);
            const safeArtist = escapeHtml(track.artist);
            const owned = player.isTrackOwned(index);
            const isActive = index === player.currentTrackIndex && owned;
            const coverHtml = coverPath
                ? `<img class="playlist-cover-img" src="${coverPath}" alt="${safeTitle}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                   <div style="display:none;align-items:center;justify-content:center;width:100%;height:100%;font-size:24px;background:linear-gradient(135deg,#667eea,#764ba2);">🎵</div>`
                : `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:24px;background:linear-gradient(135deg,#667eea,#764ba2);">🎵</div>`;
            const $item = $(`<div class="playlist-item ${isActive ? 'active' : ''} ${owned ? '' : 'playlist-item-locked'}" data-index="${index}">
                    <div class="playlist-item-cover">
                        ${coverHtml}
                        ${!owned ? '<div class="playlist-lock-icon"><i class="fas fa-lock"></i></div>' : ''}
                    </div>
                    <div class="playlist-item-title">${safeTitle}</div>
                    <div class="playlist-item-artist">${safeArtist}</div>
                </div>`).on('click', function() {
                    playItemClickSound();
                    selectedIndex = index;
                    $els.playlistContainer.find('.playlist-item').removeClass('active');
                    $(this).addClass('active');
                    updateActionBar();
                });
            $item.find('.playlist-item-cover').on('dblclick', function (e) {
                e.stopPropagation();
                playClickSound();
                openCoverPreview(index);
            });
            
            if (track.isCustom) {
                (function() {
                    let pressTimer = null;
                    let pressed = false;
                    const startPress = () => {
                        pressed = true;
                        pressTimer = setTimeout(() => {
                            if (pressed) {
                                pressed = false;
                                openCustomMusicEdit(index);
                            }
                        }, 600);
                    };
                    const cancelPress = () => {
                        pressed = false;
                        if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
                    };
                    $item.on('touchstart mousedown', startPress);
                    $item.on('touchend touchmove mouseup mouseleave click', cancelPress);
                })();
            }
            $els.playlistContainer.append($item);
        });

        const $actionBar = $(`
            <div class="playlist-action-bar">
                <div class="playlist-selected-info">
                    <div class="playlist-selected-title" id="pl-sel-title">请选择歌曲</div>
                    <div class="playlist-selected-price" id="pl-sel-price"></div>
                </div>
                <button class="playlist-action-btn" id="pl-action-btn" disabled>播放</button>
                <button class="playlist-action-btn cover" id="pl-cover-btn"><i class="fas fa-image"></i> 查看歌曲封面</button>
                <button class="playlist-action-btn del" id="pl-del-btn" style="display:none;"><i class="fas fa-trash-alt"></i> 删除</button>
            </div>
        `);
        $els.playlistContainer.append($actionBar);

        let delArmed = false;
        let disarmTimer = null;

        const updateActionBar = () => {
            const track = player.playlist[selectedIndex];
            if (!track) return;
            const owned = player.isTrackOwned(selectedIndex);
            const $title = $('#pl-sel-title');
            const $price = $('#pl-sel-price');
            const $btn = $('#pl-action-btn');
            const $del = $('#pl-del-btn');
            $title.text(track.title);
            
            delArmed = false;
            if (disarmTimer) { clearTimeout(disarmTimer); disarmTimer = null; }
            $del.removeClass('del-armed').html('<i class="fas fa-trash-alt"></i> 删除');
            if (owned) {
                $price.text('已解锁');
                $price.css('color', '#4ade80');
                $btn.text('播放').removeClass('buy').addClass('play').prop('disabled', false);
            } else {
                $price.html(`<i class="fas fa-coins"></i> ${player.formatPrice(player.getTrackPrice(selectedIndex))}`);
                $price.css('color', '#f5c34d');
                $btn.text('购买').removeClass('play').addClass('buy').prop('disabled', false);
            }
            
            if (track.isCustom) {
                $del.css('display', '').prop('disabled', false);
            } else {
                $del.css('display', 'none');
            }
        };

        $('#pl-action-btn').on('click', () => {
            const owned = player.isTrackOwned(selectedIndex);
            if (owned) {
                player.playTrackByIndex(selectedIndex);
                updateMusicControls();
                closePlaylist();
            } else {
                playBuySound();
                setTimeout(() => {
                    const result = player.purchaseTrack(selectedIndex);
                    if (!result.success && window.showToast) window.showToast(result.message);
                    if (result.success) {
                        updateMusicControls();
                        const $item = $els.playlistContainer.find(`.playlist-item[data-index="${selectedIndex}"]`);
                        $item.removeClass('playlist-item-locked');
                        $item.find('.playlist-lock-icon').remove();
                        updateActionBar();
                    }
                }, 50);
            }
        });

        
        $('#pl-cover-btn').on('click', function () {
            playItemClickSound();
            openCoverPreview(selectedIndex);
        });

        $('#pl-del-btn').on('click', () => {
            const track = player.playlist[selectedIndex];
            if (!track || !track.isCustom) return;
            playItemClickSound();
            if (!delArmed) {
                delArmed = true;
                $('#pl-del-btn').addClass('del-armed').html('<i class="fas fa-exclamation-triangle"></i> 再点一次确认删除');
                disarmTimer = setTimeout(() => {
                    delArmed = false;
                    $('#pl-del-btn').removeClass('del-armed').html('<i class="fas fa-trash-alt"></i> 删除');
                }, 3000);
                return;
            }
            delArmed = false;
            if (disarmTimer) { clearTimeout(disarmTimer); disarmTimer = null; }
            player.deleteCustomTrack(selectedIndex).then(ok => {
                if (!ok) return;
                updateMusicControls();
                if (window.showToast) window.showToast('已删除本地音乐');
                openPlaylist(true);
            });
        });

        if (selectedIndex >= 0 && selectedIndex < player.playlist.length) {
            updateActionBar();
        }

        
        if (window.__refreshCoinBalances) window.__refreshCoinBalances();
        $els.playlistModal.css('display', 'flex');
        setTimeout(() => $els.playlistModal.addClass('show'), 10);
    };

    
    const openCustomMusicEdit = (index) => {
        const player = window.musicPlayer;
        if (!(player && player.isInitialized)) return;
        const track = player.playlist[index];
        if (!track || !track.isCustom) return;

        
        $('#custom-music-edit-modal').remove();

        const coverPath = player.getFullPath(track.cover);
        const coverPreview = coverPath ? coverPath : player.customMusicDefaultCover;

        const $modal = $(`
            <div class="modal-overlay" id="custom-music-edit-modal">
                <div class="modal-content custom-music-edit-content">
                    <div class="modal-header">
                        <div class="modal-title"><i class="fas fa-edit"></i> 编辑本地音乐</div>
                        <button class="modal-close" id="cm-edit-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body custom-music-edit-body">
                        <div class="cm-edit-row">
                            <label>歌曲名称</label>
                            <input type="text" id="cm-edit-title" maxlength="40" placeholder="歌曲名称">
                        </div>
                        <div class="cm-edit-row">
                            <label>作者</label>
                            <input type="text" id="cm-edit-artist" maxlength="40" placeholder="作者">
                        </div>
                        <div class="cm-edit-row cm-edit-cover-row">
                            <label>歌曲封面</label>
                            <div class="cm-edit-cover-area">
                                <img class="cm-edit-cover-preview" id="cm-edit-cover-preview" src="${coverPreview}" alt="封面预览">
                                <label class="cm-edit-cover-btn" for="cm-edit-cover-input">
                                    <i class="fas fa-image"></i> 选择图片
                                </label>
                                <input type="file" id="cm-edit-cover-input" accept="image/*" style="display:none;">
                            </div>
                        </div>
                        <div class="cm-edit-row">
                            <label>更换歌曲文件</label>
                            <label class="cm-edit-file-btn" for="cm-edit-audio-input">
                                <i class="fas fa-music"></i> <span id="cm-edit-audio-name">点击选择新的音频文件</span>
                            </label>
                            <input type="file" id="cm-edit-audio-input" accept="audio/*" style="display:none;">
                        </div>
                    </div>
                    <div class="modal-footer custom-music-edit-footer">
                        <button class="modal-btn cancel" id="cm-edit-cancel">取消</button>
                        <button class="modal-btn confirm" id="cm-edit-save">保存</button>
                    </div>
                </div>
            </div>
        `);
        $('body').append($modal);
        
        
        const plZ = parseInt($('#music-playlist-modal').css('z-index')) || 10001;
        $modal.css('z-index', plZ + 1);

        const $title = $('#cm-edit-title');
        const $artist = $('#cm-edit-artist');
        const $coverInput = $('#cm-edit-cover-input');
        const $coverPreview = $('#cm-edit-cover-preview');
        const $audioInput = $('#cm-edit-audio-input');
        const $audioName = $('#cm-edit-audio-name');

        $title.val(track.title);
        $artist.val(track.artist);

        let newCoverBlob = null;
        let newAudioBlob = null;
        let newAudioName = '';

        $coverInput.on('change', function() {
            const file = this.files && this.files[0];
            if (!file) return;
            if (!/^image\//.test(file.type || '')) {
                if (window.showToast) window.showToast('请选择图片文件');
                return;
            }
            newCoverBlob = file;
            try {
                $coverPreview.attr('src', URL.createObjectURL(file));
            } catch (e) {}
        });

        $audioInput.on('change', function() {
            const file = this.files && this.files[0];
            if (!file) return;
            const isAudio = /^audio\//.test(file.type || '')
                || /\.(mp3|m4a|aac|wav|ogg|flac)$/i.test(file.name || '');
            if (!isAudio) {
                if (window.showToast) window.showToast('请选择音频文件');
                return;
            }
            if (file.size > player.customMusicMaxSize) {
                if (window.showToast) window.showToast('文件超过 40MB，已忽略');
                return;
            }
            newAudioBlob = file;
            newAudioName = file.name || '本地音乐';
            $audioName.text(newAudioName);
        });

        const close = () => {
            $modal.removeClass('show');
            setTimeout(() => $modal.remove(), 200);
        };

        $('#cm-edit-close, #cm-edit-cancel').on('click', close);
        $modal.on('click', e => { if (e.target === $modal[0]) close(); });

        $('#cm-edit-save').on('click', () => {
            const patch = {
                title: $title.val(),
                artist: $artist.val()
            };
            if (newCoverBlob) {
                patch.coverBlob = newCoverBlob;
            }
            if (newAudioBlob) {
                patch.blob = newAudioBlob;
                patch.name = newAudioName;
            }
            player.updateCustomTrack(index, patch).then(ok => {
                if (!ok) {
                    if (window.showToast) window.showToast('保存失败');
                    return;
                }
                if (window.showToast) window.showToast('已保存修改');
                updateMusicControls();
                close();
                openPlaylist(true);
            });
        });

        setTimeout(() => $modal.addClass('show'), 10);
    };

    const closePlaylist = () => {
        $els.playlistModal.removeClass('show');
        setTimeout(() => {
            if (!$els.playlistModal.hasClass('show')) {
                $els.playlistModal.hide();
            }
        }, 200);
        try {
            const closeAudio = new Audio('audio/sidebar-close.mp3');
            closeAudio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
            closeAudio.play().catch(() => {});
        } catch (e) {}
    };

    let coverPreviewState = null;

    const closeCoverPreview = () => {
        if (!coverPreviewState) return;
        const st = coverPreviewState;
        coverPreviewState = null;
        st.overlay.style.opacity = '0';
        setTimeout(() => {
            st.cleanup();
            try { st.overlay.remove(); } catch (e) {}
        }, 800);
    };

    const openCoverPreview = (trackIndex) => {
        const player = window.musicPlayer;
        if (!(player && player.isInitialized)) return;
        const idx = trackIndex != null ? trackIndex : player.currentTrackIndex;
        const track = _.get(player, `playlist[${idx}]`);
        if (!(track && track.cover && track.cover.trim())) return;
        const coverPath = player.getFullPath(track.cover);

        if (coverPreviewState) closeCoverPreview();

        const overlay = document.createElement('div');
        overlay.id = 'cover-preview';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:12000;background:rgba(0,0,0,.22);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);opacity:0;transition:opacity .8s ease;overflow:hidden;touch-action:none;';
        const holder = document.createElement('div');
        holder.style.cssText = 'position:absolute;inset:0;';
        const title = document.createElement('div');
        title.textContent = track.title || '';
        title.style.cssText = 'position:absolute;left:0;right:0;top:24px;text-align:center;color:#fff;font-size:16px;letter-spacing:.1em;text-shadow:0 2px 10px #000;z-index:2;pointer-events:none;';
        overlay.appendChild(holder);
        overlay.appendChild(title);
        document.body.appendChild(overlay);
        requestAnimationFrame(() => { overlay.style.opacity = '1'; });

        let raf = null;
        let renderer = null;
        let texture = null;
        let dust = null;
        let onPointerMove = null;
        let onPointerUp = null;
        let idleTimer = null;
        let dragging = false;
        let lastX = 0;
        let lastY = 0;
        let rotX = 0.3;
        let rotY = 0;
        let targetX = 0.3;
        let targetY = 0;

        const cleanup = () => {
            if (raf) cancelAnimationFrame(raf);
            raf = null;
            if (idleTimer) clearTimeout(idleTimer);
            idleTimer = null;
            if (onPointerMove) window.removeEventListener('pointermove', onPointerMove);
            if (onPointerUp) {
                window.removeEventListener('pointerup', onPointerUp);
                window.removeEventListener('pointercancel', onPointerUp);
            }
            onPointerMove = null;
            onPointerUp = null;
            if (texture) {
                try { texture.dispose(); } catch (e) {}
                texture = null;
            }
            if (dust) {
                try { dust.geometry.dispose(); } catch (e) {}
                try { dust.material.dispose(); } catch (e) {}
                dust = null;
            }
            if (renderer) {
                try { renderer.dispose(); } catch (e) {}
                try { renderer.domElement.remove(); } catch (e) {}
                renderer = null;
            }
        };

        coverPreviewState = { overlay: overlay, cleanup: cleanup };
        overlay.addEventListener('click', closeCoverPreview);

        if (window.THREE) {
            try {
                renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;';
                holder.appendChild(renderer.domElement);

                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
                camera.position.set(0, 0.8, 5.8);
                camera.lookAt(0, 0, 0);

                scene.add(new THREE.AmbientLight(0xffffff, 1.2));
                const light = new THREE.DirectionalLight(0xffffff, 1.5);
                light.position.set(3, 4, 6);
                scene.add(light);

                const makeVinylTexture = () => {
                    const size = 1024;
                    const canvas = document.createElement('canvas');
                    canvas.width = canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#060606';
                    ctx.fillRect(0, 0, size, size);
                    const cx = size / 2;
                    const cy = size / 2;
                    for (let r = 92; r < size / 2 - 2; r += 2) {
                        ctx.beginPath();
                        ctx.arc(cx, cy, r, 0, Math.PI * 2);
                        ctx.strokeStyle = r % 8 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.55)';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                    for (let i = 0; i < 9000; i++) {
                        ctx.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.05) + ')';
                        ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
                    }
                    const tex = new THREE.CanvasTexture(canvas);
                    tex.colorSpace = THREE.SRGBColorSpace;
                    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
                    return tex;
                };

                const record = new THREE.Group();
                record.rotation.x = rotX;
                scene.add(record);

                const vinylTex = makeVinylTexture();
                const vinyl = new THREE.Mesh(
                    new THREE.CylinderGeometry(2.0, 2.0, 0.09, 96),
                    new THREE.MeshStandardMaterial({ map: vinylTex, color: 0xffffff, roughness: 0.82, metalness: 0.05 })
                );
                record.add(vinyl);

                const vinylTop = new THREE.Mesh(
                    new THREE.CircleGeometry(2.0, 128),
                    new THREE.MeshStandardMaterial({ map: vinylTex, color: 0xffffff, roughness: 0.82, metalness: 0.05 })
                );
                vinylTop.rotation.x = -Math.PI / 2;
                vinylTop.position.y = 0.046;
                record.add(vinylTop);

                const rim = new THREE.Mesh(
                    new THREE.TorusGeometry(2.0, 0.035, 12, 120),
                    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.45, metalness: 0.4 })
                );
                rim.rotation.x = Math.PI / 2;
                rim.position.y = 0.052;
                record.add(rim);

                const coverMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
                const cover = new THREE.Mesh(new THREE.CircleGeometry(1.45, 160), coverMat);
                cover.rotation.x = -Math.PI / 2;
                cover.position.y = 0.052;
                record.add(cover);

                const hole = new THREE.Mesh(
                    new THREE.CircleGeometry(0.05, 48),
                    new THREE.MeshBasicMaterial({ color: 0x000000 })
                );
                hole.rotation.x = -Math.PI / 2;
                hole.position.y = 0.058;
                record.add(hole);

                const holeRing = new THREE.Mesh(
                    new THREE.TorusGeometry(0.065, 0.012, 8, 48),
                    new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.9 })
                );
                holeRing.rotation.x = Math.PI / 2;
                holeRing.position.y = 0.06;
                record.add(holeRing);

                dust = null;
                if (localStorage.getItem('ab_particles_enabled') !== '0') {
                    const count = 420;
                    const positions = new Float32Array(count * 3);
                    for (let i = 0; i < count; i++) {
                        const radius = 2.6 + Math.random() * 2.4;
                        const theta = Math.random() * Math.PI * 2;
                        const phi = Math.acos(2 * Math.random() - 1);
                        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
                        positions[i * 3 + 1] = (Math.random() - 0.5) * 3.2;
                        positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
                    }
                    const dustGeo = new THREE.BufferGeometry();
                    dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                    const dustMat = new THREE.PointsMaterial({ color: 0x8ab4ff, size: 0.035, transparent: true, opacity: 0.65, depthWrite: false });
                    dust = new THREE.Points(dustGeo, dustMat);
                    scene.add(dust);
                }

                let analyser = null;
                let freqData = null;
                let spectrumBars = null;
                try {
                    const AC = window.AudioContext || window.webkitAudioContext;
                    const monitorEnabled = (() => {
                        try { return localStorage.getItem('ab_audio_monitor') !== '0'; } catch (e) { return true; }
                    })();
                    if (monitorEnabled && AC && player.audio) {
                        player._audioCtx = player._audioCtx || new AC();
                        if (player._audioCtx.state === 'suspended') player._audioCtx.resume().catch(() => {});
                        if (!player._analyser) {
                            player._analyser = player._audioCtx.createAnalyser();
                            player._analyser.fftSize = 512;
                            player._analyser.smoothingTimeConstant = 0.82;
                            player._audioSrc = player._audioCtx.createMediaElementSource(player.audio);
                            player._audioSrc.connect(player._analyser);
                            player._analyser.connect(player._audioCtx.destination);
                        }
                        analyser = player._analyser;
                        freqData = new Uint8Array(analyser.frequencyBinCount);
                        const count = 96;
                        const geo = new THREE.BoxGeometry(0.03, 0.02, 0.03);
                        const group = new THREE.Group();
                        spectrumBars = [];
                        for (let i = 0; i < count; i++) {
                            const mat = new THREE.MeshBasicMaterial({
                                color: new THREE.Color().setHSL(0.58 + (i / count) * 0.22, 0.85, 0.62),
                                transparent: true,
                                opacity: 0.85
                            });
                            const bar = new THREE.Mesh(geo, mat);
                            const ang = (i / count) * Math.PI * 2;
                            bar.position.set(Math.cos(ang) * 2.35, 0, Math.sin(ang) * 2.35);
                            group.add(bar);
                            spectrumBars.push(bar);
                        }
                        record.add(group);
                    }
                } catch (e) {
                    analyser = null;
                    spectrumBars = null;
                }

                const loader = new THREE.TextureLoader();
                loader.setCrossOrigin('anonymous');
                loader.load(coverPath, (tex) => {
                    texture = tex;
                    tex.colorSpace = THREE.SRGBColorSpace;
                    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
                    tex.minFilter = THREE.LinearFilter;
                    tex.magFilter = THREE.LinearFilter;
                    tex.generateMipmaps = false;
                    coverMat.map = tex;
                    coverMat.color.setHex(0xffffff);
                    coverMat.needsUpdate = true;
                });

                const resetIdle = () => {
                    if (idleTimer) clearTimeout(idleTimer);
                    idleTimer = setTimeout(() => { targetX = 0.3; }, 2500);
                };

                overlay.addEventListener('pointerdown', (e) => {
                    dragging = true;
                    lastX = e.clientX;
                    lastY = e.clientY;
                    if (idleTimer) clearTimeout(idleTimer);
                });

                onPointerMove = (e) => {
                    if (!dragging) return;
                    targetY += (e.clientX - lastX) * 0.008;
                    targetX = Math.max(-0.5, Math.min(1.2, targetX + (e.clientY - lastY) * 0.006));
                    lastX = e.clientX;
                    lastY = e.clientY;
                    resetIdle();
                };
                onPointerUp = () => {
                    if (!dragging) return;
                    dragging = false;
                    resetIdle();
                };
                window.addEventListener('pointermove', onPointerMove);
                window.addEventListener('pointerup', onPointerUp);
                window.addEventListener('pointercancel', onPointerUp);

                const clock = new THREE.Clock();
                const animate = () => {
                    raf = requestAnimationFrame(animate);
                    const dt = Math.min(0.05, clock.getDelta());
                    if (!dragging) targetY += dt * 0.35;
                    rotX += (targetX - rotX) * 0.12;
                    rotY += (targetY - rotY) * 0.15;
                    record.rotation.x = rotX;
                    record.rotation.y = rotY;
                    if (dust) {
                        dust.rotation.y = rotY * 0.35;
                        dust.rotation.x = rotX * 0.2;
                    }
                    if (analyser && spectrumBars) {
                        analyser.getByteFrequencyData(freqData);
                        const n = spectrumBars.length;
                        for (let i = 0; i < n; i++) {
                            const v = freqData[Math.floor((i / n) * freqData.length)] / 255;
                            const h = 0.04 + v * 1.0;
                            spectrumBars[i].scale.y = h / 0.02;
                            spectrumBars[i].position.y = h / 2;
                        }
                    }
                    renderer.render(scene, camera);
                };
                animate();
            } catch (e) {
                if (renderer) {
                    try { renderer.domElement.remove(); } catch (x) {}
                    renderer = null;
                }
            }
        }

        if (!renderer) {
            const img = document.createElement('img');
            img.src = coverPath;
            img.alt = track.title || '';
            img.style.cssText = 'max-width:86vw;max-height:70vh;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.8);object-fit:contain;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:1;';
            holder.appendChild(img);
        }

        try {
            const a = new Audio('audio/open-cover.mp3');
            a.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
            a.play().catch(() => {});
        } catch (e) {}
    };

    const updateMusicControls = () => {
        const player = window.musicPlayer;
        
        if (!(player && player.isInitialized)) {
            $els.playBtn.html('<i class="fas fa-play"></i>').prop('disabled', true);
            _.each(['prevBtn', 'nextBtn', 'playlistBtn', 'modeBtn'], key => $els[key].prop('disabled', true));
            $els.volumeSlider.css('pointer-events', 'none');
            $els.progressSlider.css('pointer-events', 'none');
            $els.cover.hide();
            $els.coverDefault.show();
            return;
        }

        $els.playBtn.html(player.isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>').prop('disabled', false);
        
        $els.prevBtn.prop('disabled', player.currentTrackIndex <= 0);
        $els.nextBtn.prop('disabled', player.currentTrackIndex >= player.playlist.length - 1);
        $els.playlistBtn.prop('disabled', false);
        $els.modeBtn.prop('disabled', false);
        
        $els.volumeSlider.css('pointer-events', 'auto');
        $els.progressSlider.css('pointer-events', 'auto');

        const track = _.get(player, `playlist[${player.currentTrackIndex}]`);
        if (track) {
            $els.trackTitle.text(track.title);
            $els.trackArtist.text(track.artist);
            
            const coverPath = player.getFullPath(track.cover);
            (coverPath && coverPath.trim()) ? player.loadCoverImage(coverPath, $els.cover[0], $els.coverDefault[0]) : ($els.cover.hide(), $els.coverDefault.show());
        }

        $els.volumeFill.css('width', `${player.volume * 100}%`);
        $els.volumeValue.text(`${Math.round(player.volume * 100)}%`);
        
        const mode = player.getCurrentMode();
        $els.modeBtn.html(`<i class="${mode.icon}"></i> ${mode.name}`);

        if ((player.audio && player.audio.duration) && !isDraggingProgress && !player.isSeeking) {
            const currentTime = player.getDisplayTime ? player.getDisplayTime() : (player.audio.currentTime || 0);
            const duration = player.audio.duration || 0;
            const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
            $els.progressFill.css('width', `${percent}%`);
            $els.currentTime.text(player.formatTime(currentTime));
            $els.totalTime.text(player.formatTime(duration));
        }
    };

    $els.toggleBtn.on('click', e => {
        e.stopPropagation();
        const player = window.musicPlayer;
        if (!player) return;
        
        if (!player.isInitialized) {
            player.init().then(updateMusicControls).catch(_.noop);
        } else {
            player.isPlaying ? player.pause() : player.play();
            updateMusicControls();
        }
    });

    _.each(['playBtn', 'prevBtn', 'nextBtn', 'playlistBtn', 'modeBtn'], key => {
        $els[key].on('click', e => {
            e.stopPropagation();
            playClickSound();
            const player = window.musicPlayer;
            if ((player && player.isInitialized)) {
                const actions = {
                    playBtn: () => player.togglePlay(),
                    prevBtn: () => player.previousTrack(),
                    nextBtn: () => player.nextTrack(),
                    playlistBtn: openPlaylist,
                    modeBtn: () => player.togglePlayMode()
                };
                actions[key]();
                updateMusicControls();
            }
        });
    });

    
    let isDraggingVolume = false;
    const handleVolumeEvent = e => {
        e.stopPropagation();
        const x = getEventX(e);
        if (x === null || isNaN(x)) return;
        const offset = $els.volumeSlider.offset();
        if (!offset) return;
        const volume = _.clamp((x - offset.left) / $els.volumeSlider.width(), 0, 1);
        window.musicPlayer.setVolume(volume);
        $els.volumeFill.css('width', `${volume * 100}%`);
        $els.volumeValue.text(`${Math.round(volume * 100)}%`);
    };
    $els.volumeSlider
        .on('mousedown touchstart', e => {
            e.preventDefault();
            isDraggingVolume = true;
            handleVolumeEvent(e);
        })
        .on('click', e => { e.stopPropagation(); handleVolumeEvent(e); });
    $(document).on('mousemove touchmove', e => {
        if (isDraggingVolume) handleVolumeEvent(e);
    });
    $(document).on('mouseup touchend', () => { isDraggingVolume = false; });

    $els.progressSlider
        .on('mousedown touchstart', e => {
            e.stopPropagation();
            e.preventDefault();
            if (e.type === 'touchstart') lastTouchTs = Date.now();
            
            else if (Date.now() - lastTouchTs < 800) return;
            const ratio = progressRatio(e);
            if (ratio === null) return;
            isDraggingProgress = true;
            dragRatio = ratio;
            previewProgress(ratio);
        })
        .on('click', e => {
            e.stopPropagation();
            e.preventDefault();
            
            if (suppressClick) return;
            const ratio = progressRatio(e);
            if (ratio === null) return;
            commitSeek(ratio);
        });

    $(document)
        .on('mousemove touchmove', e => {
            if (!isDraggingProgress) return;
            if (e.type === 'touchmove') lastTouchTs = Date.now();
            else if (Date.now() - lastTouchTs < 800) return;
            const ratio = progressRatio(e);
            if (ratio === null) return;
            dragRatio = ratio;
            previewProgress(ratio);
        })
        .on('mouseup touchend touchcancel', e => {
            if (!isDraggingProgress) return;
            if (e && e.type === 'touchend') lastTouchTs = Date.now();
            else if (e && e.type === 'mouseup' && Date.now() - lastTouchTs < 800) return;
            isDraggingProgress = false;
            suppressClick = true;
            setTimeout(() => { suppressClick = false; }, 400);
            if (dragRatio !== null) commitSeek(dragRatio);
            dragRatio = null;
        });

    
    const importInput = document.getElementById('playlist-import-input');
    const triggerImport = e => {
        e.stopPropagation();
        const player = window.musicPlayer;
        if (!(player && player.isInitialized)) return;
        if (!importInput) return;
        importInput.value = '';
        importInput.click();
    };
    $('#playlist-import-btn').on('click', triggerImport);
    if (importInput) {
        importInput.addEventListener('change', function() {
            const player = window.musicPlayer;
            const files = importInput.files;
            if (!(player && player.isInitialized) || !files || !files.length) return;
            player.importCustomMusicFiles(files).then(added => {
                updateMusicControls();
                if (added) openPlaylist(true);
            });
        });
    }

    $els.playlistClose.on('click', e => { e.stopPropagation(); closePlaylist(); });
    $els.playlistModal.on('click', e => { if (e.target === $els.playlistModal[0]) closePlaylist(); });

    $els.cover.on('dblclick', e => {
        e.stopPropagation();
        playClickSound();
        openCoverPreview();
    });

    $els.recordDisc.on('dblclick', e => {
        e.stopPropagation();
        playClickSound();
        openCoverPreview();
    });

    let controlsRafId = null;
    const controlsLoop = () => {
        updateMusicControls();
        controlsRafId = requestAnimationFrame(controlsLoop);
    };
    controlsRafId = requestAnimationFrame(controlsLoop);
    updateMusicControls();

    
    window.__openMusicPlaylist = openPlaylist;
    window.__openCustomMusicEdit = openCustomMusicEdit;

    const audioMonitorToggle = document.getElementById('audio-monitor-toggle');
    if (audioMonitorToggle) {
        try { audioMonitorToggle.checked = localStorage.getItem('ab_audio_monitor') !== '0'; } catch (e) {}
        audioMonitorToggle.addEventListener('change', () => {
            try { localStorage.setItem('ab_audio_monitor', audioMonitorToggle.checked ? '1' : '0'); } catch (e) {}
            const p = window.musicPlayer;
            if (p && p._audioSrc && p._audioCtx) {
                try { p._audioSrc.disconnect(); } catch (e) {}
                if (audioMonitorToggle.checked && p._analyser) p._audioSrc.connect(p._analyser);
                else p._audioSrc.connect(p._audioCtx.destination);
            }
        });
    }
});
