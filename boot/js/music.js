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
            // 当前音频源真正对应的曲目索引（切源过程中与 currentTrackIndex 解耦）
            _audioTrackIndex: 0,
            // 切源瞬间禁止落盘，避免把旧曲目的进度写到新曲目上
            _blockSave: false,
            // 本次会话是否有过用户主动操作（切歌 / 拖进度条）
            _userActed: false,
            // 切歌后待补写新曲目起点，避免退出后恢复到上一首
            _pendingSwitchCommit: false,
            _switchUnblockTimer: null,
            _restoreGuardTimer: null,
            // 本地导入的音乐：元数据与音频字节都存在独立的 IndexedDB
            customTracks: [],
            _customMusicDb: null,
            customMusicMaxSize: 40 * 1024 * 1024,
            // 导入的本地音乐在没有扫描到内嵌封面时使用这张默认封面
            // 注意：basePath 已是 'music-player/'，这里不要再加前缀，否则 getFullPath 会拼接成 music-player/music-player/...
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

    // 上次播放状态：曲目索引 / 进度 / 音量 / 播放模式
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
            // 恢复播放状态期间（init）不写，避免把进度覆盖成 0
            if (this._isRestoring) return;
            // 切源瞬间事件（pause / timeupdate）里的时间属于上一首，不能落盘
            if (this._blockSave) return;
            // seek 进行中位置不可信：只有强制保存（退出/暂停）且目标明确时按目标位置写
            if (this.isSeeking && (!force || this.seekTarget == null)) return;

            const now = Date.now();
            // 节流：非强制保存时最多每 2 秒写一次
            if (!force && now - this._lastSaveTime < 2000) return;
            this._lastSaveTime = now;

            const prev = this.loadPlayState() || {};
            const audio = this.audio;
            const hasMeta = audio && audio.readyState >= 1;

            // 索引与进度只有在元数据就绪时才更新；否则沿用上次保存值，
            // 避免音频未加载就把进度抹成 0。
            let index = _.isNumber(prev.index) ? prev.index : this._audioTrackIndex;
            let time = prev.time;

            if (hasMeta) {
                const t = this.isSeeking ? this.seekTarget : audio.currentTime;
                if (isFinite(t) && t >= 0) {
                    // 本次会话从未播放过、也未主动切歌/拖动（例如打开 App 看一眼就退出）：
                    // 此时的 currentTime 恒为 0，不能拿它覆盖上次的真实进度。
                    const keepProgress = !this.hasStartedPlayback && !this._userActed && _.isNumber(prev.time);
                    index = keepProgress ? prev.index : this._audioTrackIndex;
                    time = keepProgress ? prev.time : t;
                }
            }

            // 音量与播放模式始终保存，不依赖音频是否加载完成
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
        // 本地导入的曲目默认属于自己，且不写入 ownedTracks，
        // 这样删除任意一首都不会影响内置曲目的索引
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
                    // Object.entries 在旧版 WebView 上不稳定，手动遍历
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
            // Object.fromEntries 在旧版 WebView 不支持，手动遍历 Map
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
        // 音乐资源缓存在 IndexedDB 里，MusicPlayer 往往比它先启动；
        // 缓存为空时 getCachedMusicPath 会回退成默认音乐，导致恢复出错误曲目与进度。
        // 这里最多等 4 秒，拿不到就照常继续（后续由 RDM.reconcileMusicSource 自愈）。
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
        // 本地导入的曲目追加在内置曲目之后，索引因此保持稳定
        await this.loadCustomTracks();
        this.setupAudio();
        this.isInitialized = true;

        // 恢复上次播放的曲目与进度（不自动播放，保持暂停态）
        this._isRestoring = true;
        const saved = this.loadPlayState();
        let startIndex = 0;
        if (saved && _.isNumber(saved.index) && _.inRange(saved.index, 0, this.playlist.length)
            && this.isTrackOwned(saved.index)) {
            startIndex = saved.index;
        }
        if (saved && _.isNumber(saved.volume)) this.setVolume(saved.volume);
        if (saved && _.isNumber(saved.playMode)) this.playMode = saved.playMode;

        // 必须在 loadTrack 之前设好：本地音频可能极快返回 loadedmetadata，
        // 晚设置会错过这次事件，导致进度恢复失败
        if (saved && _.isNumber(saved.time) && saved.time > 1 && startIndex === saved.index) {
            this.pendingRestoreTime = saved.time;
        }

        this.loadTrack(startIndex, false);

        // 恢复保护兜底：无论 seek 是否成功，最多 6 秒后解除，避免永久禁写
        if (this._restoreGuardTimer) clearTimeout(this._restoreGuardTimer);
        this._restoreGuardTimer = setTimeout(() => this.endRestore(), 6000);

        this.preloadCurrentCover();
        this.startDiscRotation();
        this.bindUnloadSave();
    }

    // 切源稳定后补写新曲目起点（未播放时时间就是 0），
    // 否则用户切歌后直接退出，下次会恢复到上一首。
    commitSwitch() {
        if (!this._pendingSwitchCommit) return;
        if (this._isRestoring) return; // 恢复流程中先挂起，等 endRestore
        this._pendingSwitchCommit = false;
        this.savePlayState(true);
    }

    // 结束恢复态：只解除保护，不主动写盘。
    // 这样即使 seek 没落地，也不会把 localStorage 里的正确进度抹成 0。
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

    /* ============================================================
     * 本地导入音乐
     * 音频字节与元数据放在独立的 IndexedDB（ab_custom_music），
     * 不写 localStorage，避免几十 MB 的音频撑爆 5MB 配额。
     * ============================================================ */
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

    // 用游标读取，兼容旧版 WebView（不一定有 getAll）
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
        // 部分 WebView 读回来的 blob 会丢 type，补上保证能解码
        if (!blob.type) {
            try { blob = new Blob([blob], { type: record.type || 'audio/mpeg' }); } catch (e) {}
        }
        // 封面：优先用扫描到的内嵌封面，没有就用默认封面
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

    // 读取 mp3 的 ID3v2 标签，提取标题/作者/内嵌封面。
    // 没扫到就返回空字段，导入时用文件名当标题、默认封面兜底。
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
                    // UTF-16：终止符是 0x00 0x00，必须两字节两字节地找，否则会把 ASCII 字符的高字节 0x00 当成终止符
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
                    // v2.3 帧大小是 32 位大端，用乘法避免 <<24 在 JS 里变负数
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
                    j++; // picture type
                    if (j < frame.length) j++;
                    // description：UTF-16 的终止符是 0x00 0x00，需两字节步进
                    let k = j;
                    if (enc === 1 || enc === 2) {
                        while (k + 1 < frame.length && !(frame[k] === 0 && frame[k + 1] === 0)) k += 2;
                        k += 2; // 跳过 UTF-16 终止符 0x00 0x00
                    } else {
                        while (k < frame.length && frame[k] !== 0) k++;
                        k++; // 跳过单字节终止符
                    }
                    if (k < frame.length) {
                        const imgBytes = frame.subarray(k);
                        out.coverBlob = new Blob([imgBytes], { type: mime || 'image/png' });
                        out.coverType = mime || 'image/png';
                    }
                }
                pos += 10 + fsize;
            }
        } catch (e) { /* 解析失败就走默认值 */ }
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

    // 长按弹窗保存修改后的元数据/封面/音频
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
            // 释放旧的 blob url，按新数据重建
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
            // 只有更换了音频文件才需要切源；改名称/作者/封面不中断当前播放
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
        // 删的是当前曲目之前的：当前索引整体前移一位
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
            // 优先接替原位置，没有则退回最后一首已解锁曲目
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
        this.audio.preload = 'metadata'; // 只取时长信息，避免启动即缓冲整首曲子
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
                // seek 落地后立刻校验一次；seekTo 尚未接管时按普通 seek 收尾
                if (this.seekTarget == null) { this.isSeeking = false; return; }
                if (typeof this.seekCheck === 'function') this.seekCheck();
            },
            loadedmetadata: () => {
                // 新音源元数据就绪后，切源期间的事件已经消化完，可以恢复落盘
                this._blockSave = false;
                // 刚切到 blob 源：在这里恢复目标位置（blob 可 seek，写入即生效）
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
                // 启动时恢复上次播放进度：seekTo 会自动处理 blob / 非 blob 音源
                if (this.pendingRestoreTime != null) {
                    const t = this.pendingRestoreTime;
                    this.pendingRestoreTime = null;
                    this.seekTo(t);
                    // seek 落地后再解除恢复态；期间保持禁写，避免把 0 写回
                    setTimeout(() => this.endRestore(), 1500);
                    return;
                }
                if (this.isSeeking && this.pendingResume && !this.userPaused) {
                    this.pendingResume = false;
                    this.isSeeking = false;
                    this.play();
                }
                // 没有待恢复进度时，元数据就绪即视为恢复完成
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

        // 切源前先把上一首的真实进度落盘（此刻 currentTrackIndex 还是旧值）
        if (!this._isRestoring) this.savePlayState(true);
        // 切源会触发 pause / timeupdate，期间的 currentTime 属于上一首，一律不写
        this._blockSave = true;
        // 用户主动切歌：等切源稳定后补写新曲目的起点，否则退出会回到上一首
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
        // 音频源绑定的索引：只有真正换源成功后才更新，保存进度用它
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
        // 之前缓存的 blob 若来自另一个源（例如启动时缓存未就绪、按默认音乐转出来的），
        // 继续复用会播成默认音乐而界面还显示当前曲目，这里强制丢弃重建
        if (track._seekBlobUrl && track._seekBlobSrc && track._seekBlobSrc !== fileUrl) {
            try { URL.revokeObjectURL(track._seekBlobUrl); } catch (e) {}
            delete track._seekBlobUrl;
            delete track._seekBlobSrc;
        }
        // 同一首之前已转成 blob（例如单曲循环重启）：直接复用，保持可 seek
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
        
        // 直接用文件地址播放，首帧不等 fetch
        this.audio.src = playUrl;
        this.audio.load();
        if (autoPlay) {
            this.audio.play().catch(() => {});
        }
        // 包内音源由 WebViewAssetLoader 提供，不支持 Range，无法直接 seek；
        // 播放开始后后台取成同源 blob，供拖动进度条时切换（不影响当前播放）
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

    // 目标位置是否在浏览器给出的可 seek 区间内
    canSeekTo(target) {
        const audio = this.audio;
        if (!audio) return false;
        const ranges = audio.seekable;
        // 还没拿到区间信息（刚换源）时先放行，交给 seeked 事件判断
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
        // blob 源（已下载曲目 / 已转换的包内曲目）可直接原生 seek
        if (src.indexOf('blob:') === 0) return this.nativeSeek(target);

        // 包内曲目由 WebViewAssetLoader 提供，响应不带 Content-Length 与 Range，
        // 写 currentTime 会被静默忽略（表现就是进度条弹回）。先取成同源 blob，
        // 再从 blob 源跳转；已下载曲目本来就是 blob，不会走到这里。
        const track = this.playlist[this.currentTrackIndex];
        if (track) {
            this.seekViaBlob(track, target, src);
            return true;
        }
        return this.nativeSeek(target);
    }

    // 原生 seek：seek 期间只等待，绝不重写 currentTime。
    // 重写会把排队中的 seek 打断重启，听感上就是“卡两下”，最后还弹回原位。
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
            // 到位后若播放被中断才补一次 play；失败时不要再制造声音
            const needResume = shouldResume && audio.paused && (ok || this.seekPaused);
            this.seekPaused = false;
            if (needResume) audio.play().catch(() => {});
            // seek 真正落地，把最终位置写盘（此前 isSeeking 期间是禁写的）
            if (ok) this.savePlayState(true);
        };
        const write = () => {
            this.seekAttempts += 1;
            this.seekLastWrite = Date.now();
            try { audio.currentTime = target; } catch (e) {}
        };
        // 唯一的校验入口：由 seeked 事件和定时器共同驱动
        const check = () => {
            if (token !== this.seekToken) return;
            if (Date.now() > this.seekDeadline) { finish(false); return; }

            const drift = Math.abs((audio.currentTime || 0) - target);
            if (!audio.seeking && drift <= 0.75) { finish(true); return; }

            if (audio.seeking) {
                // 慢设备边播边 seek 会拖很久：超过 2.5 秒先暂停，让浏览器专心完成 seek
                if (!this.seekPaused && Date.now() - this.seekLastWrite > 2500) {
                    this.seekPaused = true;
                    try { audio.pause(); } catch (e) {}
                }
                arm(350);
                return;
            }

            // 刚写过、seek 可能还没启动，先给浏览器一点时间
            if (Date.now() - this.seekLastWrite < 900) { arm(350); return; }

            // 位置仍是旧的：补写一次（最多 2 次，每次都会让音频卡一下）
            if (this.seekAttempts < 2) { write(); arm(700); return; }

            finish(false);
        };
        this.seekCheck = check;

        // 元数据未就绪时写 currentTime 会被直接忽略，等 loadedmetadata 再写
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

    // 把不可 seek 的音源取成 blob 后再跳转
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

            // 切源到 blob，在 loadedmetadata 里恢复目标位置
            this.pendingSeek = target;
            this.pendingSeekResume = !audio.paused && !this.userPaused;
            this.isSeeking = true;
            this.seekTarget = target;
            try { audio.pause(); } catch (e) {}
            audio.src = blobUrl;
            audio.load();

            // 兜底：元数据迟迟不来也要放开锁，避免进度条一直卡住
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

    // 同一首只转换一次；并发调用复用同一个 Promise
    ensureSeekBlob(track, src) {
        if (!track) return Promise.resolve(null);
        if (track._seekBlobUrl) return Promise.resolve(track._seekBlobUrl);
        if (this.blobBuildTrack === track && this.blobBuildPromise) return this.blobBuildPromise;

        const url = src || this.getFullPath(track.file);
        // 解析结果被回退成了默认音乐，而曲目本身不是默认曲目：
        // 此时绝不能把这把字节缓存到该曲目上，否则会“封面是这首歌、声音是默认曲”
        if (this.isDefaultFallback(track, url)) return Promise.resolve(null);
        this.blobBuildTrack = track;
        const p = this.fetchAsBlobUrl(url).then(blobUrl => {
            if (blobUrl) {
                track._seekBlobUrl = blobUrl;
                // 记录这份 blob 对应的原始源，供 loadTrack 校验是否被错误复用
                track._seekBlobSrc = url;
                // 只有当它仍是当前曲目时才清理别人的 blob，避免误回收正在播放的那首
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

    // 只保留当前曲目的 blob，避免多首累计占用内存
    trimSeekBlobs(keep) {
        this.playlist.forEach(t => {
            if (t === keep || !t._seekBlobUrl) return;
            try { URL.revokeObjectURL(t._seekBlobUrl); } catch (e) {}
            delete t._seekBlobUrl;
            if (t._seekBlobSrc) delete t._seekBlobSrc;
        });
    }

    // 解析出的路径是默认音乐、但曲目本身不是默认曲目 → 说明资源缓存还没就绪或未下载
    isDefaultFallback(track, url) {
        try {
            const rdm = window.ResourceDownloadManager;
            if (!rdm || !rdm.defaultMusicFile) return false;
            const def = rdm.defaultMusicFile;
            if (String(url).indexOf(def) === -1) return false;
            // 曲目自己就是默认音乐时属于正常情况
            return (this.basePath + track.file).indexOf(def) === -1;
        } catch (e) {
            return false;
        }
    }

    // 播放开始后后台预取 blob，用户第一次拖动时无需等待
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
        // 页面若以 file:///android_asset 加载，再试 WebViewAssetLoader 的 https 入口
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

            // fetch 被拦时退回 XHR（部分 WebView 允许 file:// 的 XHR）
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

    // 进度条显示用：seek 尚未落地时显示目标位置，避免来回跳
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

    // 页面隐藏 / 卸载时立即保存当前播放进度
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

    // 曲名来自本地文件名，插进 HTML 前必须转义
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

    // 通用点击音效（歌曲列表点击唱片统一使用）
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

    // 拖动过程中只画预览，不碰 audio：旧实现每次 move 都写 currentTime，
    // 会不断打断缓冲，松手后进度条又被真实播放位置拉回去
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

        // 先播放音效，避免被DOM操作卡没（删除后重绘时静默）
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
        // 全屏歌曲列表页头部的统计
        const $pageCount = $('#playlist-page-count');
        if ($pageCount.length) {
            $pageCount.text(player.playlist.length ? ('共 ' + player.playlist.length + ' 首') : '');
        }

        let selectedIndex = player.currentTrackIndex;

        _.forEach(player.playlist, (track, index) => {
            // 未下载的内置曲目不显示（默认/导入曲目除外）
            if (!track.isCustom && track.file && window.ResourceDownloadManager &&
                window.ResourceDownloadManager.isDownloaded &&
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
            // 长按导入的音乐 → 弹出编辑弹窗
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
            // 切换选中项时重置删除两段式状态
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
            // 删除按钮只对导入的本地音乐显示
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

        // 操作栏删除按钮：两段式确认
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

        // 顶栏科恩币余额（与技能商店同款）
        if (window.__refreshCoinBalances) window.__refreshCoinBalances();
        $els.playlistModal.css('display', 'flex');
        setTimeout(() => $els.playlistModal.addClass('show'), 10);
    };

    // 长按导入的本地音乐 → 编辑弹窗：改名称/作者/封面/更换音频文件
    const openCustomMusicEdit = (index) => {
        const player = window.musicPlayer;
        if (!(player && player.isInitialized)) return;
        const track = player.playlist[index];
        if (!track || !track.isCustom) return;

        // 先移除可能存在的旧弹窗
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
        // 编辑弹窗必须始终在播放列表之上：播放列表可能从弹窗中心以 z-index 10003 打开，
        // 这里动态取播放列表当前层级 +1，避免硬编码被超过
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

    const openCoverModal = () => {
        const player = window.musicPlayer;
        if (!(player && player.isInitialized)) return;
        const track = _.get(player, `playlist[${player.currentTrackIndex}]`);
        if (!(track && track.cover && track.cover.trim())) return;

        const coverPath = player.getFullPath(track.cover);
        if (!$('#cover-modal').length) {
            $('body').append(`
                <div class="modal-overlay" id="cover-modal">
                    <div class="modal-content cover-modal-content">
                        <div class="modal-header">
                            <div class="modal-title"><i class="fas fa-image"></i> ${track.title}</div>
                            <button class="modal-close" id="cover-modal-close">&times;</button>
                        </div>
                        <div class="modal-body cover-modal-body">
                            <img id="cover-modal-img" src="${coverPath}" alt="${track.title}">
                        </div>
                    </div>
                </div>
            `);

            $('#cover-modal-close').on('click', () => closeCoverModal());
            $('#cover-modal').on('click', e => {
                if (e.target === $('#cover-modal')[0]) closeCoverModal();
            });
        } else {
            $('#cover-modal-img').attr('src', coverPath);
            $('#cover-modal .modal-title').html(`<i class="fas fa-image"></i> ${track.title}`);
        }

        $('#cover-modal').css('display', 'flex');
        setTimeout(() => $('#cover-modal').addClass('show'), 10);
        try {
            const coverOpenAudio = new Audio('audio/open-cover.mp3');
            coverOpenAudio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
            coverOpenAudio.play().catch(() => {});
        } catch (e) {}
    };

    const closeCoverModal = () => {
        $('#cover-modal').removeClass('show');
        setTimeout(() => {
            if (!$('#cover-modal').hasClass('show')) {
                $('#cover-modal').hide();
            }
        }, 200);
        try {
            const coverCloseAudio = new Audio('audio/sidebar-close.mp3');
            coverCloseAudio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
            coverCloseAudio.play().catch(() => {});
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

    // 音量滑块：支持点击 + 拖动（原仅 click，移动端难以精确调整）
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
            // 触摸后浏览器补发的 mousedown，忽略
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
            // 拖拽结束后的 click 已经提交过 seek，避免重复
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

    // 本地音乐导入：选择文件后直接进播放列表末尾
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
        openCoverModal();
    });

    $els.recordDisc.on('dblclick', e => {
        e.stopPropagation();
        playClickSound();
        openCoverModal();
    });

    let controlsRafId = null;
    const controlsLoop = () => {
        updateMusicControls();
        controlsRafId = requestAnimationFrame(controlsLoop);
    };
    controlsRafId = requestAnimationFrame(controlsLoop);
    updateMusicControls();

    // 暴露给 GM 弹窗中心等外部调用，保证走完整初始化流程
    window.__openMusicPlaylist = openPlaylist;
    window.__openCustomMusicEdit = openCustomMusicEdit;
});
