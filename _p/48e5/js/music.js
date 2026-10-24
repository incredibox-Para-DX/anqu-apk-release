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
            _isRestoring: false
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
            const now = Date.now();
            // 节流：非强制保存时最多每 2 秒写一次
            if (!force && now - this._lastSaveTime < 2000) return;
            this._lastSaveTime = now;
            const data = {
                index: this.currentTrackIndex,
                time: this.audio && isFinite(this.audio.currentTime) ? this.audio.currentTime : 0,
                volume: this.volume,
                playMode: this.playMode
            };
            localStorage.setItem(this.getLastStateKey(), JSON.stringify(data));
        } catch (e) {}
    }

    isTrackOwned(index) {
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
        await this.loadPlaylistFromXML();
        this.setupAudio();
        this.isInitialized = true;

        // 恢复上次播放的曲目与进度（不自动播放，保持暂停态）
        this._isRestoring = true;
        const saved = this.loadPlayState();
        let startIndex = 0;
        if (saved && _.isNumber(saved.index) && _.inRange(saved.index, 0, this.playlist.length)) {
            startIndex = saved.index;
        }
        if (saved && _.isNumber(saved.volume)) this.setVolume(saved.volume);
        if (saved && _.isNumber(saved.playMode)) this.playMode = saved.playMode;

        this.loadTrack(startIndex, false);

        if (saved && _.isNumber(saved.time) && saved.time > 1) {
            this.pendingRestoreTime = saved.time;
        }

        this.preloadCurrentCover();
        this.startDiscRotation();
        this.bindUnloadSave();
        this._isRestoring = false;
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
        if (_.startsWith(filename, '/') || /^https?:\/\//.test(filename)) return filename;
        return this.basePath + filename;
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
                    return;
                }
                if (this.isSeeking && this.pendingResume && !this.userPaused) {
                    this.pendingResume = false;
                    this.isSeeking = false;
                    this.play();
                }
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
        
        this.discRotation = 0;
        this.updateDiscDisplay();
        
        const track = this.playlist[index];
        this.currentTrackIndex = index;
        this.isSeeking = false;
        this.pendingResume = false;
        this.seekTarget = null;
        this.seekCheck = null;
        this.seekPaused = false;
        this.pendingSeek = null;
        this.pendingSeekResume = false;
        this.seekToken += 1;
        if (this.seekTimer) { clearTimeout(this.seekTimer); this.seekTimer = null; }
        
        const fileUrl = this.getFullPath(track.file);
        // 同一首之前已转成 blob（例如单曲循环重启）：直接复用，保持可 seek
        const playUrl = track._seekBlobUrl || fileUrl;
        
        if (track._blobUrl) {
            this.audio.src = track._blobUrl;
            this.audio.load();
            if (autoPlay) {
                this.audio.play().catch(() => {});
            }
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
        this.blobBuildTrack = track;
        const p = this.fetchAsBlobUrl(url).then(blobUrl => {
            if (blobUrl) {
                track._seekBlobUrl = blobUrl;
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
        });
    }

    // 播放开始后后台预取 blob，用户第一次拖动时无需等待
    prefetchSeekBlob(track, url) {
        if (!track || !url || url.indexOf('blob:') === 0) return;
        if (track._seekBlobUrl) return;
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

    const openPlaylist = () => {
        const player = window.musicPlayer;
        if (!(player && player.isInitialized)) return;

        // 先播放音效，避免被DOM操作卡没
        try {
            const openAudio = new Audio('audio/open-music-playlist.mp3');
            openAudio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
            openAudio.play().catch(() => {});
        } catch (e) {}

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
            const coverPath = player.getFullPath(track.cover);
            const owned = player.isTrackOwned(index);
            const isActive = index === player.currentTrackIndex && owned;
            const coverHtml = coverPath
                ? `<img class="playlist-cover-img" src="${coverPath}" alt="${track.title}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                   <div style="display:none;align-items:center;justify-content:center;width:100%;height:100%;font-size:24px;background:linear-gradient(135deg,#667eea,#764ba2);">🎵</div>`
                : `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:24px;background:linear-gradient(135deg,#667eea,#764ba2);">🎵</div>`;
            $els.playlistContainer.append(
                $(`<div class="playlist-item ${isActive ? 'active' : ''} ${owned ? '' : 'playlist-item-locked'}" data-index="${index}">
                    <div class="playlist-item-cover">
                        ${coverHtml}
                        ${!owned ? '<div class="playlist-lock-icon"><i class="fas fa-lock"></i></div>' : ''}
                    </div>
                    <div class="playlist-item-title">${track.title}</div>
                    <div class="playlist-item-artist">${track.artist}</div>
                </div>`).on('click', function() {
                    playItemClickSound();
                    selectedIndex = index;
                    $els.playlistContainer.find('.playlist-item').removeClass('active');
                    $(this).addClass('active');
                    updateActionBar();
                })
            );
        });

        const $actionBar = $(`
            <div class="playlist-action-bar">
                <div class="playlist-selected-info">
                    <div class="playlist-selected-title" id="pl-sel-title">请选择歌曲</div>
                    <div class="playlist-selected-price" id="pl-sel-price"></div>
                </div>
                <button class="playlist-action-btn" id="pl-action-btn" disabled>播放</button>
            </div>
        `);
        $els.playlistContainer.append($actionBar);

        const updateActionBar = () => {
            const track = player.playlist[selectedIndex];
            if (!track) return;
            const owned = player.isTrackOwned(selectedIndex);
            const $title = $('#pl-sel-title');
            const $price = $('#pl-sel-price');
            const $btn = $('#pl-action-btn');
            $title.text(track.title);
            if (owned) {
                $price.text('已解锁');
                $price.css('color', '#4ade80');
                $btn.text('播放').removeClass('buy').addClass('play').prop('disabled', false);
            } else {
                $price.html(`<i class="fas fa-coins"></i> ${player.formatPrice(player.getTrackPrice(selectedIndex))}`);
                $price.css('color', '#f5c34d');
                $btn.text('购买').removeClass('play').addClass('buy').prop('disabled', false);
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
                    if (window.showToast) window.showToast(result.message);
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

        if (selectedIndex >= 0 && selectedIndex < player.playlist.length) {
            updateActionBar();
        }

        // 顶栏科恩币余额（与技能商店同款）
        if (window.__refreshCoinBalances) window.__refreshCoinBalances();
        $els.playlistModal.css('display', 'flex');
        setTimeout(() => $els.playlistModal.addClass('show'), 10);
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

    $els.volumeSlider.on('click', e => { e.stopPropagation(); setVolume(e); });

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
});
