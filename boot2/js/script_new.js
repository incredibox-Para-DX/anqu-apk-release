$(function() {
    if (window.__scriptInitialized) return;
    window.__scriptInitialized = true;

    const Config = {
        game: { sound: true, itemSound: true },
        grid: { rows: 6, cols: 5, width: 380, height: 460 },
        item: { 
            fontSize: 17,
            imgBase: 52,
            spacing: 0,
            minScale: 1.0,
            maxScale: 2.5,
            multiplier: 0.43
        },
        searchTimes: { red: 2.45, orange: 2.45, gold: 0.6, purple: 0.25 },
        coin: { positions: 3, chances: [100, 100, 100], min: 1000, max: 2999 },
        purpleSpawn: { min: 1, max: 2 },
        valueRange: { min: 1, max: 4000000, base: 1000 },
        valueWeight: { baseWeight: 100, decayFactor: 0.00005, minWeight: 10 },
        spawn: { red: 0.3, orange: 2.0, gold: 5.0, purple: 5 },
        storageKey: "darkzone_simulator_stats",
        titles: [
            { value: 0, name: '暗区新锐', icon: 'titles/XR.png', description: '初入暗区' },
            { value: 1000000, name: '暗区尖兵', icon: 'titles/JB.png', description: '累计价值突破1M' },
            { value: 10000000, name: '暗区精英', icon: 'titles/JY.png', description: '累计价值突破10M' },
            { value: 50000000, name: '暗区专家', icon: 'titles/ZJ.png', description: '累计价值突破50M' },
            { value: 100000000, name: '暗区大师', icon: 'titles/DS.png', description: '累计价值突破100M' },
            { value: 500000000, name: '暗区王牌', icon: 'titles/WP.png', description: '累计价值突破500M' },
            { value: 1000000000, name: '暗区传说', icon: 'titles/CS.png', description: '累计价值突破1000M' }
        ]
    };
    
    const State = _.assign({}, {
        items: [],
        searchQueue: [],
        currentSearch: null,
        searchedItems: 0,
        totalValue: 0,
        highestValue: 0,
        searchTime: 0,
        inventory: [],
        grid: _.times(Config.grid.rows, () => _.times(Config.grid.cols, () => 0)),
        isSearching: false,
        isGlobalSearching: false,
        isPaused: false,
        searchTimer: null,
        searchTransitionTimer: null,
        currentSearchTime: 0,
        isFirstOpen: true,
        isOpenSafeBtnDisabled: false,
        pauseStartTime: 0,
        pauseElapsed: 0,
        totalAccumulatedValue: 0,
        sessionAccumulatedValue: 0,
        weeklyAccumulatedValue: 0,
        weeklyAccumulatedWeek: '',
        totalSearchedItems: 0,
        highestValueEver: 0
    });

    let itemsConfig = [];
    let allItemsConfig = [];

    const Assets = {
        donate: ['pictures/donate/donate1.jpg']
    };

const BackgroundManager = {
    backgrounds: [],
    currentIndex: 0,
    selectedIndex: 0,
    configPath: 'xml/backgrounds.xml',
    storageKey: 'ab_selected_bg_path',
    ownedKey: 'ab_owned_backgrounds',

    getOwnedBackgrounds() {
        try {
            const data = localStorage.getItem(this.ownedKey);
            return data ? JSON.parse(data) : [1];
        } catch(e) {
            return [1];
        }
    },

    saveOwnedBackgrounds(ids) {
        localStorage.setItem(this.ownedKey, JSON.stringify(ids));
    },

    isBackgroundUnlocked(bgId) {
        // Mod 背景（字符串 id 带 mod_ 前缀）：始终解锁
        if (typeof bgId === 'string' && bgId.indexOf('mod_') === 0) return true;
        const owned = this.getOwnedBackgrounds();
        return owned.includes(Number(bgId));
    },

    purchaseBackground(bgId) {
        const bg = this.backgrounds.find(b => Number(b.id) === Number(bgId));
        if (!bg) return { success: false, message: '背景不存在' };
        if (this.isBackgroundUnlocked(bgId)) return { success: false, message: '已拥有此背景' };

        const price = Number(bg.price) || 0;
        if (State.totalAccumulatedValue < price) {
            return { success: false, message: `总累计价值不足，需要 ${Utils.formatCurrency(price)}` };
        }

        State.totalAccumulatedValue -= price;
        StatsManager.saveAccumulatedStats();
        StatsManager.updateAccumulatedValueDisplay();

        const owned = this.getOwnedBackgrounds();
        if (!owned.includes(Number(bgId))) {
            owned.push(Number(bgId));
            this.saveOwnedBackgrounds(owned);
        }

        return { success: true, message: `成功购买背景: ${bg.name}` };
    },

previewCurrentBackground() {
    const bg = this.backgrounds[this.currentIndex];
    if (!bg) {
        if (window.showToast) window.showToast('请选择一个背景');
        return;
    }
    
    const isVideo = (bg._origPath || bg.path).endsWith('.mp4');
    
    if (isVideo) {
        const existingPreview = document.getElementById('bg-preview-overlay');
        if (existingPreview) existingPreview.remove();
        
        const $overlay = $(`
            <div id="bg-preview-overlay" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;background:#000;display:flex;align-items:center;justify-content:center;">
                <video id="bg-preview-video" muted style="width:100%;height:100%;object-fit:cover;" playsinline poster="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=">
                    <source src="${bg.path}" type="video/mp4">
                </video>
                <div style="position:absolute;bottom:40px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,0.6);font-size:14px;background:rgba(0,0,0,0.5);padding:8px 20px;border-radius:20px;pointer-events:none;">
                    <i class="fas fa-eye"></i> 预览: ${bg.name} — 播放结束后自动关闭
                </div>
            </div>
        `);
        
        $('body').append($overlay);
        
        const video = document.getElementById('bg-preview-video');
        video.volume = 0;
        video.play().catch(() => {});
        
        video.addEventListener('ended', function() {
            $('#bg-preview-overlay').fadeOut(500, function() {
                $(this).remove();
            });
        });
        
        $overlay.on('click', function() {
            $(this).fadeOut(300, function() {
                $(this).remove();
                if (video) {
                    video.pause();
                    video.src = '';
                }
            });
        });
    } else {
        const $overlay = $(`
            <div id="bg-preview-overlay" style="position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;background:#000;display:flex;align-items:center;justify-content:center;">
                <img src="${bg.path}" style="width:100%;height:100%;object-fit:cover;" alt="${bg.name}">
                <div style="position:absolute;bottom:40px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,0.6);font-size:14px;background:rgba(0,0,0,0.5);padding:8px 20px;border-radius:20px;pointer-events:none;">
                    <i class="fas fa-eye"></i> 预览: ${bg.name} — 点击任意处关闭
                </div>
            </div>
        `);
        
        $('body').append($overlay);
        
        $overlay.on('click', function() {
            $(this).fadeOut(300, function() {
                $(this).remove();
            });
        });
    }
},

    async loadBackgrounds() {
        try {
            let text;
            if (window.Net && Net.getText) {
                text = await Net.getText(this.configPath, { timeout: 8000, retries: 1 });
            } else {
                const response = await fetch(this.configPath);
                if (!response.ok) {
                    this.backgrounds = [{ id: 1, name: '默认背景', path: 'pictures/background.mp4', price: 0 }];
                    return;
                }
                text = await response.text();
            }
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");
            const nodes = xmlDoc.getElementsByTagName('background');

            // 不使用可选链，兼容旧版 Android WebView
            const pickText = (node, tag) => {
                const el = node.getElementsByTagName(tag)[0];
                return el && el.textContent ? el.textContent : '';
            };
            this.backgrounds = Array.from(nodes).map(node => ({
                id: pickText(node, 'id') || '0',
                name: pickText(node, 'name') || '未知背景',
                path: pickText(node, 'path') || '',
                price: Number(pickText(node, 'price')) || 0
            }));

            if (this.backgrounds.length === 0) {
                this.backgrounds = [{ id: 1, name: '默认背景', path: 'pictures/background.mp4', price: 0 }];
            }
        } catch (e) {
            this.backgrounds = [{ id: 1, name: '默认背景', path: 'pictures/background.mp4', price: 0 }];
        }
    },

    applyBackground(path, isVideoHint, fallbackPath, skipSave) {
        const isVideo = isVideoHint !== undefined ? isVideoHint : /\.(mp4|webm)(\?|$)/i.test(path);

        $('#bg-video').remove();
        $('body').css({
            'background-image': 'none',
            'background-color': '#000'
        });

        if (isVideo) {
            // 直接使用 src 而非 <source>，便于监听 error 并回退
            const video = document.createElement('video');
            video.id = 'bg-video';
            video.muted = true;
            video.autoplay = true;
            video.loop = true;
            video.playsInline = true;
            video.setAttribute('playsinline', '');
            video.setAttribute('webkit-playsinline', '');
            video.preload = 'auto';
            video.volume = 0;
            // video 自己也用黑色背景，首帧没出来时不会显示 body 颜色
            video.style.cssText = 'width:100vw;height:100vh;object-fit:cover;background:#000;position:fixed;top:0;left:0;z-index:-1;';
            video.src = path;
            video.poster = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

            // 首帧 ready 后清 body 的黑色背景（消除启动黑屏闪一下）
            const clearBlack = () => {
                $('body').css('background-color', 'transparent');
                video.removeEventListener('loadeddata', onLoaded);
                video.removeEventListener('canplay', onLoaded);
                video.removeEventListener('playing', onLoaded);
            };
            const onLoaded = () => {
                try { video.currentTime = Math.min(0.1, video.duration || 0.1); } catch (e) {}
                clearBlack();
            };
            video.addEventListener('loadeddata', onLoaded, { once: true });
            video.addEventListener('canplay', onLoaded, { once: true });
            video.addEventListener('playing', clearBlack, { once: true });
            // readyState 已经 >= 2（HAVE_CURRENT_DATA）时立刻清
            if (video.readyState >= 2) {
                try { video.currentTime = 0.1; } catch (e) {}
                clearBlack();
            }

            if (fallbackPath && fallbackPath !== path) {
                video.addEventListener('error', function() {
                    if (this.dataset.fallbackApplied) return;
                    this.dataset.fallbackApplied = '1';
                    this.src = fallbackPath;
                    this.load();
                    this.play().catch(() => {});
                });
                setTimeout(function() {
                    const el = document.getElementById('bg-video');
                    if (!el || el.dataset.fallbackApplied) return;
                    if (el.readyState === 0) {
                        el.dataset.fallbackApplied = '1';
                        el.src = fallbackPath;
                        el.load();
                        el.play().catch(() => {});
                    }
                }, 2500);
            }
            $('body').prepend(video);
            try { video.load(); } catch (e) {}

            setTimeout(() => {
                const el = document.getElementById('bg-video');
                if (el) el.play().catch(() => {});
            }, 100);

            // 部分 WebView 禁止无手势自动播放，用户首次交互后恢复播放
            if (!window.__bgVideoInteractionBound) {
                window.__bgVideoInteractionBound = true;
                const resumeBgVideo = () => {
                    const el = document.getElementById('bg-video');
                    if (el) el.play().catch(() => {});
                };
                document.addEventListener('click', resumeBgVideo, { passive: true });
                document.addEventListener('touchstart', resumeBgVideo, { passive: true });
            }
        } else {
            const bgUrl = `url('${path}')`;
            $('body').css({
                'background-image': bgUrl,
                'background-size': 'cover',
                'background-position': 'center',
                'background-repeat': 'no-repeat'
            });
        }

        // 自定义（相册上传）背景由 CustomBackground 单独记录，不写入内置背景选择项
        if (!skipSave) localStorage.setItem(this.storageKey, path);
    },

    loadSavedBackground() {
        let savedPath = localStorage.getItem(this.storageKey);
        // 兼容旧版本错误写入的 blob URL / JSON 数组，避免背景设置失效
        if (savedPath && (savedPath.indexOf('blob:') === 0 || /^[\[{"']/.test(savedPath) || !this.backgrounds.some(b => b.path === savedPath))) {
            localStorage.removeItem(this.storageKey);
            savedPath = null;
        }
        if (savedPath) {
            const bg = this.backgrounds.find(b => b.path === savedPath);
            if (bg && this.isBackgroundUnlocked(bg.id)) {
                this.applyBackground(savedPath);
                return;
            }
        }
        const defaultBg = this.backgrounds.find(b => Number(b.id) === 1) || this.backgrounds[0];
        if (defaultBg) {
            this.applyBackground(defaultBg.path);
        }
    },

    openSelector() {
        if (this.backgrounds.length === 0) {
            if (window.showToast) {
                window.showToast('背景列表为空，请检查配置文件');
            }
            return;
        }

        const savedPath = localStorage.getItem(this.storageKey);
        if (savedPath) {
            const idx = this.backgrounds.findIndex(bg => bg.path === savedPath);
            if (idx !== -1) {
                this.currentIndex = idx;
                this.selectedIndex = idx;
            } else {
                this.currentIndex = 0;
                this.selectedIndex = 0;
            }
        } else {
            this.currentIndex = 0;
            this.selectedIndex = 0;
        }

        this.renderPreview();
        StatsManager.updateCoinBalances();
        EventManager.openModal('bg-select-modal');
    },

    renderPreview() {
        if (this.backgrounds.length === 0) return;

        const $grid = $('#bg-grid');

        if ($grid.children('.bg-thumb').length === 0) {
            this.buildGrid();
        }

        $grid.children('.bg-thumb').each(function(index) {
            const $thumb = $(this);
            const isSelected = index === BackgroundManager.currentIndex;
            $thumb.toggleClass('selected', isSelected);
            const video = $thumb.find('video')[0];
            if (video) {
                if (isSelected) {
                    video.play().catch(() => {});
                } else {
                    video.pause();
                }
            }
        });

        const bg = this.backgrounds[this.currentIndex];
        if (!bg) return;
        const unlocked = this.isBackgroundUnlocked(bg.id);

        const $buyBtn = $('#bg-buy-btn');
        if (unlocked) {
            $buyBtn.prop('disabled', true).html('<i class="fas fa-check"></i> 已拥有').css('opacity', '0.5');
        } else {
            $buyBtn.prop('disabled', false).html(`<i class="fas fa-shopping-cart"></i> 购买`).css('opacity', '1');
        }
    },

    buildGrid() {
        const $grid = $('#bg-grid');
        $grid.empty();
        const transparentPoster = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

        this.backgrounds.forEach((bg, index) => {
            const unlocked = this.isBackgroundUnlocked(bg.id);
            const isVideo = (bg._origPath || bg.path).endsWith('.mp4');

            const $thumb = $(`
                <div class="bg-thumb ${unlocked ? 'unlocked' : 'locked'}" data-index="${index}">
                    <div class="bg-thumb-img">
                        ${isVideo
                            ? `<video muted loop playsinline preload="auto" poster="${transparentPoster}" src="${bg.path}" style="background:#1a1a1a;"></video>`
                            : `<img src="${bg.path}" alt="${bg.name}" loading="lazy">`}
                        ${!unlocked ? '<div class="bg-thumb-lock"><i class="fas fa-lock"></i></div>' : ''}
                    </div>
                    <div class="bg-thumb-name">${bg.name}</div>
                    <div class="bg-thumb-price">${unlocked ? '<span style="color:#4ade80;">已解锁</span>' : Utils.formatCurrency(bg.price)}</div>
                </div>
            `);

            $thumb.on('click', () => {
                this.currentIndex = index;
                this.renderPreview();
            });

            $grid.append($thumb);

            if (isVideo) {
                const v = $thumb.find('video')[0];
                if (v) {
                    v.muted = true;
                    v.playsInline = true;
                    const showFirstFrame = () => {
                        try { v.currentTime = 0.1; } catch(e) {}
                    };
                    v.addEventListener('loadeddata', showFirstFrame, { once: true });
                    v.addEventListener('canplay', showFirstFrame, { once: true });
                    if (v.readyState >= 2) showFirstFrame();
                }
            }
        });
    },

    async confirmSelection() {
        const bg = this.backgrounds[this.currentIndex];
        if (!bg) {
            if (window.showToast) window.showToast('请选择一个背景');
            return;
        }

        if (!this.isBackgroundUnlocked(bg.id)) {
            if (window.showToast) window.showToast('该背景尚未解锁，请先购买');
            return;
        }

        // 切换到内置/解锁背景时，自动清除自定义背景（IndexedDB + blob URL）
        if (window.CustomBackground && typeof window.CustomBackground.clear === 'function') {
            await window.CustomBackground.clear(true).catch(() => {});
        }

        this.selectedIndex = this.currentIndex;
        this.applyBackground(bg.path);
        EventManager.closeModal('bg-select-modal');
    },

    buyCurrentBackground() {
        const bg = this.backgrounds[this.currentIndex];
        if (!bg) return;

        const result = this.purchaseBackground(bg.id);
        if (result.success) {
            const $thumb = $(`#bg-grid .bg-thumb[data-index="${this.currentIndex}"]`);
            $thumb.removeClass('locked').addClass('unlocked');
            $thumb.find('.bg-thumb-lock').remove();
            $thumb.find('.bg-thumb-price').html('<span style="color:#4ade80;">已解锁</span>');
            this.renderPreview();
        } else {
            if (window.showToast) window.showToast(result.message);
        }
    },

    prev() {
        if (this.backgrounds.length === 0) return;
        this.currentIndex = (this.currentIndex - 1 + this.backgrounds.length) % this.backgrounds.length;
        this.renderPreview();
    },

    next() {
        if (this.backgrounds.length === 0) return;
        this.currentIndex = (this.currentIndex + 1) % this.backgrounds.length;
        this.renderPreview();
    },

    getCurrentBackground() {
        const savedPath = localStorage.getItem(this.storageKey);
        if (savedPath) {
            return this.backgrounds.find(bg => bg.path === savedPath) || this.backgrounds[0];
        }
        return this.backgrounds[0];
    },

    getAllBackgrounds() {
        return this.backgrounds;
    },

    getBackgroundCount() {
        return this.backgrounds.length;
    },

    isVideoBackground(path) {
        return path && path.endsWith('.mp4');
    }
};

    /* ===== 自定义背景（调用系统相册上传图片 / 视频） =====
       图片与视频以 blob 形式保存在独立 IndexedDB 中，启动时若标记存在则自动恢复 */
    const CustomBackground = {
        dbName: 'ab_custom_bg',
        storeName: 'files',
        recordKey: 'custom',
        flagKey: 'ab_custom_bg_enabled',
        maxSize: 30 * 1024 * 1024,
        _db: null,
        _objectUrl: null,

        openDB() {
            if (this._db) return Promise.resolve(this._db);
            return new Promise((resolve, reject) => {
                if (!window.indexedDB) {
                    reject(new Error('当前环境不支持本地存储'));
                    return;
                }
                const req = indexedDB.open(this.dbName, 1);
                req.onupgradeneeded = e => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(this.storeName)) db.createObjectStore(this.storeName);
                };
                req.onsuccess = e => { this._db = e.target.result; resolve(this._db); };
                req.onerror = () => reject(req.error || new Error('打开本地存储失败'));
            });
        },

        hasCustom() {
            try { return localStorage.getItem(this.flagKey) === '1'; } catch (e) { return false; }
        },

        setFlag(on) {
            try {
                if (on) localStorage.setItem(this.flagKey, '1');
                else localStorage.removeItem(this.flagKey);
            } catch (e) {}
        },

        readRecord() {
            return this.openDB().then(db => new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readonly');
                const req = tx.objectStore(this.storeName).get(this.recordKey);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => reject(req.error);
            }));
        },

        writeRecord(record) {
            return this.openDB().then(db => new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readwrite');
                tx.objectStore(this.storeName).put(record, this.recordKey);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => reject(tx.error);
                tx.onabort = () => reject(tx.error);
            }));
        },

        deleteRecord() {
            return this.openDB().then(db => new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readwrite');
                tx.objectStore(this.storeName).delete(this.recordKey);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => reject(tx.error);
            }));
        },

        /* 把存储的 blob 应用为界面背景 */
        applyRecord(record) {
            if (!record || !record.blob) return false;
            if (this._objectUrl) {
                try { URL.revokeObjectURL(this._objectUrl); } catch (e) {}
                this._objectUrl = null;
            }
            this._objectUrl = URL.createObjectURL(record.blob);
            const isVideo = record.type === 'video' || /^video\//.test(record.mime || '');
            BackgroundManager.applyBackground(this._objectUrl, isVideo, null, true);
            this.setFlag(true);
            this.updateClearButton();
            return true;
        },

        /* 启动时恢复自定义背景（存在则覆盖默认背景） */
        restore() {
            // 轮放开启时不恢复自定义背景
            const playFavorites = typeof BackgroundFavorites !== 'undefined' && BackgroundFavorites.settings && BackgroundFavorites.settings.playFavorites;
            if (playFavorites) {
                this.setFlag(false);
                this.updateClearButton();
                return Promise.resolve(false);
            }
            if (!this.hasCustom()) {
                this.updateClearButton();
                return Promise.resolve(false);
            }
            return this.readRecord()
                .then(record => {
                    if (!record || !record.blob) {
                        this.setFlag(false);
                        this.updateClearButton();
                        return false;
                    }
                    return this.applyRecord(record);
                })
                .catch(() => { this.updateClearButton(); return false; });
        },

        pick() {
            // 优先用背景设置弹窗里的文件输入（移动端/新版入口）
            let input = document.getElementById('bg-settings-custom-file-input');
            if (!input) input = document.getElementById('custom-bg-file-input');
            if (!input) return;
            // 重置 value，保证重复选择同一个文件也能触发 change
            input.value = '';
            input.click();
        },

        handleFile(file) {
            if (!file) return;
            const isImage = /^image\//.test(file.type);
            const isVideo = /^video\//.test(file.type);
            if (!isImage && !isVideo) {
                if (window.showToast) window.showToast('请选择图片或视频文件');
                return;
            }
            if (file.size > this.maxSize) {
                const mb = Math.round(this.maxSize / 1024 / 1024);
                if (window.showToast) window.showToast(`文件过大，请选择小于 ${mb}MB 的图片或视频`);
                return;
            }
            const record = {
                blob: file,
                mime: file.type,
                type: isVideo ? 'video' : 'image',
                name: file.name || (isVideo ? '自定义视频背景' : '自定义图片背景'),
                size: file.size,
                ts: Date.now()
            };
            this.writeRecord(record)
                .then(() => {
                    this.applyRecord(record);
                    if (window.showToast) {
                        window.showToast(isVideo ? '已应用自定义视频背景' : '已应用自定义图片背景');
                    }
                })
                .catch(() => {
                    if (window.showToast) window.showToast('保存失败，请换一张体积更小的文件重试');
                });
        },

        clear(skipFallback) {
            return this.deleteRecord()
                .then(() => {
                    this.setFlag(false);
                    if (this._objectUrl) {
                        try { URL.revokeObjectURL(this._objectUrl); } catch (e) {}
                        this._objectUrl = null;
                    }
                    this.updateClearButton();
                    if (skipFallback) return;
                    // 回退到默认背景
                    const defaultBg = BackgroundManager.backgrounds.find(b => Number(b.id) === 1)
                        || BackgroundManager.backgrounds[0];
                    if (defaultBg) BackgroundManager.applyBackground(defaultBg.path);
                    if (window.showToast) window.showToast('已恢复默认背景');
                })
                .catch(() => {
                    if (!skipFallback && window.showToast) window.showToast('清除失败，请重试');
                });
        },

        updateClearButton() {
            const $btn = $('#sidebar-custom-bg-clear-btn');
            if ($btn.length) {
                if (this.hasCustom()) $btn.show(); else $btn.hide();
            }
            // 同步背景设置弹窗内的清除按钮状态
            const $settingsBtn = $('#bg-settings-custom-bg-clear-btn');
            if ($settingsBtn.length) {
                if (this.hasCustom()) $settingsBtn.show(); else $settingsBtn.hide();
            }
            const $settingsPickBtn = $('#bg-settings-custom-bg-btn');
            if ($settingsPickBtn.length) {
                if (this.hasCustom()) $settingsPickBtn.hide(); else $settingsPickBtn.show();
            }
        },

        bind() {
            $('#sidebar-custom-bg-btn').on('click', () => {
                this.pick();
            });
            $('#sidebar-custom-bg-clear-btn').on('click', () => this.clear());
            // 背景设置弹窗内的文件输入
            const settingsInput = document.getElementById('bg-settings-custom-file-input');
            if (settingsInput) {
                settingsInput.addEventListener('change', () => {
                    const file = settingsInput.files && settingsInput.files[0];
                    this.handleFile(file);
                    settingsInput.value = '';
                });
            }
            // 侧边栏旧入口（保留兼容）
            const input = document.getElementById('custom-bg-file-input');
            if (input) {
                input.addEventListener('change', () => {
                    const file = input.files && input.files[0];
                    this.handleFile(file);
                });
            }
            this.updateClearButton();
        }
    };
    window.CustomBackground = CustomBackground;

    const TooltipManager = {
        _hideTimer: null,
        
        show(item, element, anchor) {
            const $tooltip = $('#item-tooltip');
            const node = $tooltip[0];
            
            if (!item.searched || !node) {
                this.hide();
                return;
            }
            
            if (this._hideTimer) {
                clearTimeout(this._hideTimer);
                this._hideTimer = null;
            }
            
            $('#tooltip-img').attr('src', item.image || '');
            $('#tooltip-name').text(window.I18N ? I18N.tr(item.fullName || item.name || '') : (item.fullName || item.name || ''));
            $('#tooltip-desc').text(window.I18N ? I18N.tr(item.desc || '世界观内容待补充。') : (item.desc || '世界观内容待补充。'));
            
            /* 物品详情弹窗显示对应稀有度底色 */
            const rarityBgColors = {
                red: 'rgba(58, 32, 20, 0.9)',
                orange: 'rgba(58, 32, 20, 0.9)',
                gold: 'rgba(48, 42, 16, 0.9)',
                purple: 'rgba(40, 20, 56, 0.9)',
                white: 'rgba(20, 20, 20, 0.9)'
            };
            const $qualityBg = $('#tooltip-quality-bg');
            if ($qualityBg.length) {
                $qualityBg.css('background', rarityBgColors[item.rarity] || rarityBgColors.white);
            }
            
            if (item.isCoin) {
                $('#tooltip-price').closest('.tooltip-price-row').hide();
            } else {
                $('#tooltip-price').text(Number(item.value || 0).toLocaleString());
                $('#tooltip-price').closest('.tooltip-price-row').show();
            }

            // 锚点必须在点击瞬间取好：等 50ms 再取，物品可能已被重排/移除，
            // 拿到全 0 的 rect 就会把弹窗丢到屏幕角落
            if (!anchor) {
                anchor = {};
                if (element && element.getBoundingClientRect) {
                    const r = element.getBoundingClientRect();
                    if (r.width > 0 || r.height > 0) anchor.rect = r;
                }
            }

            $tooltip.removeClass('item-tooltip-show item-tooltip-hide');
            node.style.display = 'flex';

            const pos = (window.ModalRegistry && ModalRegistry.positionPopup)
                ? ModalRegistry.positionPopup(node, anchor, 8)
                : this.fallbackPosition(node, anchor);

            node.style.visibility = '';
            $tooltip.addClass('item-tooltip-show');

            if (pos) {
                $tooltip.data('initialLeft', pos.left);
                $tooltip.data('initialTop', pos.top);
            }
        },

        // 注册表不可用时的兜底定位（同样按实测尺寸钳制）
        fallbackPosition(node, anchor) {
            node.style.visibility = 'hidden';
            node.style.left = '0px';
            node.style.top = '0px';
            const w = node.offsetWidth || 260;
            const h = node.offsetHeight || 110;
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const r = anchor && anchor.rect;
            let left;
            let top;
            if (r && (r.width > 0 || r.height > 0)) {
                left = r.right + 8;
                top = r.top + r.height / 2 - h / 2;
            } else if (anchor && isFinite(anchor.x) && isFinite(anchor.y)) {
                left = anchor.x + 12;
                top = anchor.y - h - 12;
            } else {
                left = (vw - w) / 2;
                top = (vh - h) / 2;
            }
            left = Math.max(8, Math.min(left, vw - w - 8));
            top = Math.max(8, Math.min(top, vh - h - 8));
            node.style.left = Math.round(left) + 'px';
            node.style.top = Math.round(top) + 'px';
            node.style.visibility = '';
            return { left: Math.round(left), top: Math.round(top), width: w, height: h };
        },
        
        hide() {
            const $tooltip = $('#item-tooltip');
            if (!$tooltip.is(':visible')) return;
            
            $tooltip.removeClass('item-tooltip-show');
            $tooltip.addClass('item-tooltip-hide');
            
            this._hideTimer = setTimeout(() => {
                $tooltip.removeClass('item-tooltip-hide').hide();
                this._hideTimer = null;
            }, 130);
        },
        
        enableDrag() {
            const $tooltip = $('#item-tooltip');
            let isDragging = false;
            let startX, startY, originLeft, originTop;
            let longPressTimer = null;
            
            $tooltip.on('mousedown touchstart', function(e) {
                const touch = e.touches ? e.touches[0] : e;
                startX = touch.clientX;
                startY = touch.clientY;
                originLeft = parseInt($tooltip.css('left'));
                originTop = parseInt($tooltip.css('top'));
                
                longPressTimer = setTimeout(() => {
                    isDragging = true;
                    $tooltip.css('cursor', 'grabbing');
                    e.preventDefault();
                }, 550);
            });
            
            $(document).on('mousemove touchmove', function(e) {
                if (!isDragging) return;
                e.preventDefault();
                
                const touch = e.touches ? e.touches[0] : e;
                const dx = touch.clientX - startX;
                const dy = touch.clientY - startY;
                
                $tooltip.css({
                    left: (originLeft + dx) + 'px',
                    top: (originTop + dy) + 'px'
                });
            });
            
            $(document).on('mouseup touchend', function() {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
                
                if (isDragging) {
                    isDragging = false;
                    $tooltip.css('cursor', 'default');
                }            
            });
        }
    };

    const StatsManager = {
        getCurrentWeek() {
            const d = new Date();
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(d.setDate(diff));
            const y = monday.getFullYear();
            const m = String(monday.getMonth() + 1).padStart(2, '0');
            const dd = String(monday.getDate()).padStart(2, '0');
            return `${y}-${m}-${dd}`;
        },

        loadAccumulatedStats() {
            try {
                const saved = localStorage.getItem(Config.storageKey);
                if (saved) {
                    const stats = JSON.parse(saved);
                    State.totalAccumulatedValue = stats.totalAccumulatedValue || 0;
                    State.totalSearchedItems = stats.totalSearchedItems || 0;
                    State.highestValueEver = stats.highestValueEver || 0;
                    const currentWeek = this.getCurrentWeek();
                    if (stats.weeklyAccumulatedWeek === currentWeek) {
                        State.weeklyAccumulatedValue = stats.weeklyAccumulatedValue || 0;
                        // 必须把周次写回 State，否则重启后首次收益会被误判为跨周而清零
                        State.weeklyAccumulatedWeek = currentWeek;
                    } else {
                        State.weeklyAccumulatedValue = 0;
                        State.weeklyAccumulatedWeek = currentWeek;
                    }
                } else {
                    State.weeklyAccumulatedWeek = this.getCurrentWeek();
                }
            } catch (e) {
                State.totalAccumulatedValue = 0;
                State.weeklyAccumulatedValue = 0;
                State.weeklyAccumulatedWeek = this.getCurrentWeek();
            }
        },
        
        saveAccumulatedStats() {
            try {
                const stats = {
                    totalAccumulatedValue: State.totalAccumulatedValue,
                    weeklyAccumulatedValue: State.weeklyAccumulatedValue,
                    weeklyAccumulatedWeek: State.weeklyAccumulatedWeek || this.getCurrentWeek(),
                    totalSearchedItems: State.totalSearchedItems,
                    highestValueEver: State.highestValueEver
                };
                localStorage.setItem(Config.storageKey, JSON.stringify(stats));
            } catch (e) {}
        },
        
        updateAccumulatedValue(value) {
            State.totalAccumulatedValue += value;
            State.sessionAccumulatedValue += value;
            const currentWeek = this.getCurrentWeek();
            if (State.weeklyAccumulatedWeek !== currentWeek) {
                State.weeklyAccumulatedValue = 0;
                State.weeklyAccumulatedWeek = currentWeek;
            }
            // 物品池被改动（存在被禁用的物品）时，本次收益不计入本周累计价值（防刷榜）
            let poolModified = false;
            try {
                poolModified = ItemControlManager.getDisabledItems().length > 0;
            } catch (e) {}
            if (!poolModified) {
                State.weeklyAccumulatedValue += value;
            }
            this.saveAccumulatedStats();
            this.updateAccumulatedValueDisplay();
        },
        
        // 背景商店 / 歌曲列表顶栏的科恩币余额
        updateCoinBalances() {
            const text = Utils.formatCurrency(State.totalAccumulatedValue);
            $('#bg-coin-balance, #playlist-coin-balance').text(text);
        },
        
        updateAccumulatedValueDisplay() {
            this.updateCoinBalances();
            const $accumulatedValue = $('#accumulated-value');
            if ($accumulatedValue.length) {
                $accumulatedValue.html(`<img src="images/img_b353ca7f64.png" alt="柯恩币" style="display: inline-block; vertical-align: middle; height: 1.2em; width: auto; margin-right: 2px;">${Utils.formatCurrency(State.totalAccumulatedValue)}`);
            }
            const $weeklyValue = $('#weekly-accumulated-value');
            if ($weeklyValue.length) {
                $weeklyValue.html(`<img src="images/img_b353ca7f64.png" alt="柯恩币" style="display: inline-block; vertical-align: middle; height: 1.2em; width: auto; margin-right: 2px;">${Utils.formatCurrency(State.weeklyAccumulatedValue)}`);
            }
            TitleManager.updateTitleDisplay();
        },
        
        resetSessionStats() {
            State.sessionAccumulatedValue = 0;
        }
    };

    // 供 music.js 等外部模块刷新顶栏科恩币余额
    window.__refreshCoinBalances = () => StatsManager.updateCoinBalances();

    const TitleManager = {
        getCurrentTitle() {
            const value = State.totalAccumulatedValue;
            const titles = Config.titles;
            let current = titles[0];
            for (let i = titles.length - 1; i >= 0; i--) {
                if (value >= titles[i].value) {
                    current = titles[i];
                    break;
                }
            }
            return current;
        },
        
        getNextTitle() {
            const value = State.totalAccumulatedValue;
            const titles = Config.titles;
            for (let i = 0; i < titles.length; i++) {
                if (value < titles[i].value) {
                    return titles[i];
                }
            }
            return null;
        },
        
        getAllTitles() {
            return Config.titles;
        },
        
        isUnlocked(titleValue) {
            return State.totalAccumulatedValue >= titleValue;
        },
        
        getProgress() {
            const current = this.getCurrentTitle();
            const next = this.getNextTitle();
            if (!next) return { current: current, next: null, progress: 1, currentValue: State.totalAccumulatedValue, nextValue: State.totalAccumulatedValue };
            
            const currentThreshold = current.value;
            const nextThreshold = next.value;
            const progressValue = State.totalAccumulatedValue - currentThreshold;
            const range = nextThreshold - currentThreshold;
            const progress = range > 0 ? Math.min(1, progressValue / range) : 1;
            
            return {
                current: current,
                next: next,
                progress: progress,
                currentValue: State.totalAccumulatedValue,
                nextValue: nextThreshold
            };
        },
        
        updateTitleDisplay() {
            const current = this.getCurrentTitle();
            const $titleEl = $('#profile-title');
            if ($titleEl.length) {
                $titleEl.text(window.i18nRankName ? window.i18nRankName(current.name) : current.name);
            }
        },
        
        renderTitleModal() {
            const current = this.getCurrentTitle();
            const next = this.getNextTitle();
            const progress = this.getProgress();
            
            $('#title-current-name').text(window.i18nRankName ? window.i18nRankName(current.name) : current.name);
            const $icon = $('#title-current-icon');
            if ($icon.length) {
                // 未下载资源包时先用内置 SVG 占位图，已下载则替换为 IndexedDB blob
                const localIcon = window.ResourceDownloadManager
                    ? window.ResourceDownloadManager.getTitleLocalFallback(current.icon) : current.icon;
                $icon.attr('src', localIcon);
                if (window.ResourceDownloadManager && current.icon !== localIcon) {
                    window.ResourceDownloadManager.resolvePath(current.icon).then(resolved => {
                        if (resolved && resolved !== current.icon) $icon.attr('src', resolved);
                    }).catch(() => {});
                }
            }
            
            if (next) {
                const progressPercent = (progress.progress * 100).toFixed(1);
                $('#title-progress-bar').css('width', progressPercent + '%');
                $('#title-next-target').text(Utils.formatCurrency(next.value));
                $('#title-progress-text').text(`${Utils.formatCurrency(State.totalAccumulatedValue)} / ${Utils.formatCurrency(next.value)}`);
            } else {
                $('#title-progress-bar').css('width', '100%');
                $('#title-next-target').text('已最高段位');
                $('#title-progress-text').text('已达到最高段位');
            }
            
            const $list = $('#title-list');
            $list.empty();
            
            const titles = this.getAllTitles();
            titles.forEach((title, index) => {
                const unlocked = this.isUnlocked(title.value);
                const isCurrent = current.name === title.name;
                // 列表图标同样先用内置 SVG 占位图，已下载资源包时再异步替换
                const localIcon = window.ResourceDownloadManager
                    ? window.ResourceDownloadManager.getTitleLocalFallback(title.icon) : title.icon;
                
                const $item = $(`
                    <div class="title-list-item ${unlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}">
                        <div class="title-item-icon" data-icon-path="${title.icon}">
                            <img src="${localIcon}" alt="${title.name}" 
                                 style="width:32px;height:32px;object-fit:contain;display:block;margin:0 auto;"
                                 onerror="this.onerror=null;this.style.display='none';this.parentNode.innerHTML='<span style=\\'font-size:24px;color:#666;\\'>?</span>';">
                        </div>
                        <div class="title-item-info">
                            <div class="title-item-name">${title.name}</div>
                            <div class="title-item-desc">${title.description}</div>
                            <div class="title-item-requirement">需要总累计价值达到: ${Utils.formatCurrency(title.value).replace(/\.\d+/, '')}</div>
                        </div>
                        <div class="title-item-status">
                            ${isCurrent ? '<span class="title-status-badge current-badge">当前段位</span>' : (unlocked ? '<span class="title-status-badge unlocked-badge">已达到目标</span>' : '<span class="title-status-badge locked-badge">未达到目标</span>')}
                        </div>
                    </div>
                `);
                
                $list.append($item);
                
                if (window.ResourceDownloadManager && localIcon !== title.icon) {
                    window.ResourceDownloadManager.resolvePath(title.icon).then(resolved => {
                        if (resolved && resolved !== title.icon) {
                            $item.find('.title-item-icon img').attr('src', resolved);
                        }
                    }).catch(() => {});
                }
            });
        }
    };

    const ShopManager = {
        STORAGE_KEY: 'ab_shop_skills_v1',
        skills: [
            {
                id: 'swift_hands',
                name: '迅捷巧手',
                icon: 'pictures/skills/swift_hands.png',
                price: 50000000,
                desc: '增加保险的搜索速度',
                type: 'permanent'
            },
            {
                id: 'bounty_agreement',
                name: '赏金协议',
                icon: 'pictures/skills/bounty_agreement.png',
                price: 50000000,
                desc: '提前显示物品稀有度',
                type: 'permanent'
            },
            {
                id: 'supply_tide',
                name: '物资潮汐',
                icon: 'pictures/skills/supply_tide.png',
                price: 50000000,
                desc: '接下来20次搜索爆率双倍',
                type: 'limited',
                uses: 20
            },
            {
                id: 'prophet',
                name: '先知',
                icon: 'pictures/skills/prophet.png',
                price: 100000000,
                desc: '打开保险时提前知道本次最高价值物品',
                type: 'permanent'
            },
            {
                id: 'lucky_streak',
                name: '红运当头',
                icon: 'pictures/skills/lucky_streak.png',
                price: 20000000,
                desc: '接下来20次搜索必出高价值物品',
                type: 'limited',
                uses: 20
            },
            {
                id: 'destiny_pity',
                name: '命运保底',
                icon: 'pictures/skills/destiny_pity.png',
                price: 0,
                unlockBy: 'redeem',
                desc: '连续开保险未出橙色/红色道具时，第10次必出橙色及以上；触发保底后下次保底次数-1（最低3次）。若在保底前就开出橙/红，保底重置为10次。兑换码获取：前往交流群 1082453829',
                type: 'permanent'
            }
        ],
        state: {},

        load() {
            try {
                const saved = localStorage.getItem(this.STORAGE_KEY);
                this.state = saved ? JSON.parse(saved) : {};
            } catch (e) {
                this.state = {};
            }
            this.applyAllEffects();
        },

        save() {
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
            } catch (e) {}
        },

        getSkill(id) {
            return this.skills.find(s => s.id === id);
        },

        getSkillState(id) {
            if (!this.state[id]) {
                this.state[id] = { owned: false, enabled: false, remaining: 0 };
            }
            return this.state[id];
        },

        isOwned(id) {
            return this.getSkillState(id).owned;
        },

        isEnabled(id) {
            const st = this.getSkillState(id);
            if (!st.owned || !st.enabled) return false;
            const skill = this.getSkill(id);
            if (skill.type === 'limited' && st.remaining <= 0) return false;
            return true;
        },

        purchase(id) {
            const skill = this.getSkill(id);
            if (!skill) return { success: false, message: '技能不存在' };
            const st = this.getSkillState(id);
            // 兑换解锁项只能通过兑换码获得，不能用金币购买
            if (skill.unlockBy === 'redeem') {
                return { success: false, message: '该技能需通过兑换码解锁' };
            }

            if (skill.type === 'permanent' && st.owned) {
                return { success: false, message: '已拥有此技能' };
            }

            if (skill.type === 'limited') {
                const MAX_REMAINING = 100;
                const THRESHOLD = 20;
                if (st.remaining + skill.uses > MAX_REMAINING) {
                    return { success: false, message: `次数已达上限，需使用至${MAX_REMAINING - THRESHOLD}次以下才能购买` };
                }
            }

            if (State.totalAccumulatedValue < skill.price) {
                return { success: false, message: `总累计价值不足，需要 ${Utils.formatCurrency(skill.price)}` };
            }

            State.totalAccumulatedValue -= skill.price;
            StatsManager.saveAccumulatedStats();
            StatsManager.updateAccumulatedValueDisplay();

            st.owned = true;
            st.enabled = true;
            if (skill.type === 'limited') {
                st.remaining = (st.remaining || 0) + skill.uses;
            }
            this.save();
            this.applyAllEffects();

            return { success: true, message: `成功购买: ${skill.name}` };
        },

        toggle(id) {
            const skill = this.getSkill(id);
            if (!skill) return;
            const st = this.getSkillState(id);
            if (!st.owned) return;
            if (skill.type === 'limited' && st.remaining <= 0) {
                if (window.showToast) window.showToast('次数已用完，请重新购买');
                return;
            }
            st.enabled = !st.enabled;
            this.save();
            this.applyAllEffects();
        },

        consumeLimitedUse(id) {
            const skill = this.getSkill(id);
            if (!skill || skill.type !== 'limited') return;
            const st = this.getSkillState(id);
            if (st.remaining > 0) {
                st.remaining--;
                if (st.remaining <= 0) {
                    st.remaining = 0;
                    st.enabled = false;
                }
                this.save();
                this.applyAllEffects();
            }
        },

        applyAllEffects() {
            const swift = this.getSkillState('swift_hands');
            if (swift.owned && swift.enabled) {
                Config.searchTimes.purple = 0.0001;
                Config.searchTimes.gold = 0.0001;
                Config.searchTimes.orange = 0.5;
                Config.searchTimes.red = 0.5;
                Config.searchTimes.white = 0.0001;
            } else {
                Config.searchTimes.purple = 0.25;
                Config.searchTimes.gold = 0.6;
                Config.searchTimes.orange = 2.45;
                Config.searchTimes.red = 2.45;
                Config.searchTimes.white = 0.25;
            }
            if (allItemsConfig && allItemsConfig.length) {
                allItemsConfig.forEach(item => {
                    item.searchTime = _.get(Config.searchTimes, item.rarity, Config.searchTimes.purple);
                });
            }
            const tide = this.getSkillState('supply_tide');
            if (tide.owned && tide.enabled && tide.remaining > 0) {
                Config.spawn.red = 0.6;
                Config.spawn.orange = 4.0;
                Config.spawn.gold = 10.0;
                Config.spawn.purple = 10.0;
            } else {
                Config.spawn.red = 0.3;
                Config.spawn.orange = 2.0;
                Config.spawn.gold = 5.0;
                Config.spawn.purple = 5;
            }
        },

        getHighestValueItem() {
            if (!State.items || State.items.length === 0) return null;
            return _.maxBy(State.items, 'value');
        },

        openModal() {
            this.ensurePage();
            this.renderGrid();
            this.applyFont();
            const $page = $('#shop-page');
            $page.css('opacity', 0).addClass('shop-page-show');
            requestAnimationFrame(() => requestAnimationFrame(() => $page.css('opacity', 1)));
            const a = new Audio('audio/open-shop.mp3');
            a.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
            a.play().catch(() => {});
        },

        closeModal() {
            const $page = $('#shop-page');
            $page.css('opacity', 0);
            setTimeout(() => $page.removeClass('shop-page-show').css('opacity', ''), 260);
            const a = new Audio('audio/sidebar-close.mp3');
            a.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
            a.play().catch(() => {});
        },

        applyFont() {
            const pref = localStorage.getItem('ab_font_preference') || 'arena1';
            const fontName = pref === 'arena1' ? 'Arena Breakout1' : 'Arena Breakout2';
            const $page = $('#shop-page');
            if ($page.length) {
                $page.css('font-family', fontName + ', Microsoft YaHei, sans-serif');
                $page.find('*').each(function() {
                    if (!this.classList || (!this.classList.contains('fas') && !this.classList.contains('far') && !this.classList.contains('fab') && !this.classList.contains('fa'))) {
                        this.style.setProperty('font-family', fontName + ', Microsoft YaHei, sans-serif', 'important');
                    }
                });
            }
        },

        ensurePage() {
            if (document.getElementById('shop-page')) return;
            const html = `
                <div id="shop-page">
                    <div class="shop-topbar">
                        <button class="shop-back-btn" id="shop-back-top-btn"><i class="fas fa-arrow-left"></i> 返回</button>
                        <div class="shop-topbar-title"><i class="fas fa-store"></i> 技能商店</div>
                        <div class="shop-topbar-stats">
                            <span class="stat-item"><img src="images/img_b353ca7f64.png" style="height:1.2em;vertical-align:middle;margin-right:3px;"><b id="shop-coin-balance">0</b></span>
                        </div>
                    </div>
                    <div class="shop-main">
                        <div id="shop-grid" class="shop-grid"></div>
                        <div id="shop-detail" class="shop-detail"></div>
                    </div>
                </div>
            `;
            $('body').append(html);
            $(document).on('click', '#shop-back-top-btn', () => this.closeModal());
        },

        updateCoinBalance() {
            const $el = $('#shop-coin-balance');
            if ($el.length) $el.text(Utils.formatCurrency(State.totalAccumulatedValue));
        },

        renderGrid() {
            this.updateCoinBalance();
            const $grid = $('#shop-grid');
            const $detail = $('#shop-detail');
            $grid.show();
            $detail.hide();
            $grid.empty();

            this.skills.forEach(skill => {
                const st = this.getSkillState(skill.id);
                const isLimited = skill.type === 'limited';
                const isRedeemUnlocked = skill.unlockBy === 'redeem';
                const exhausted = isLimited && st.remaining <= 0;
                const showOwned = st.owned && (!isLimited || st.remaining > 0);
                const showPrice = !st.owned || exhausted;

                const ownedBadge = showOwned ? '<div class="shop-owned-badge">已拥有</div>' : '';
                const limitedInfo = (isLimited && st.owned) ? `<div class="shop-limited-info">剩余 ${st.remaining} 次</div>` : '';
                const permanentInfo = (skill.type === 'permanent' && st.owned) ? '<div class="shop-limited-info">永久</div>' : '';
                // 兑换解锁项在卡片上显示「兑换码解锁」而非金币价
                const priceInfo = showPrice && !isRedeemUnlocked ? `<div class="shop-price"><i class="fas fa-coins"></i> ${Utils.formatCurrency(skill.price)}</div>` : '';
                const redeemHint = isRedeemUnlocked && !st.owned ? '<div class="shop-price"><i class="fas fa-key"></i> 兑换码解锁</div>' : '';

                const $card = $(`
                    <div class="shop-skill-card" data-id="${skill.id}">
                        ${ownedBadge}
                        <img src="${skill.icon}" alt="${skill.name}" class="shop-skill-icon" onerror="this.style.display='none';">
                        <div class="shop-skill-name">${skill.name}</div>
                        ${limitedInfo}
                        ${permanentInfo}
                        ${priceInfo}
                        ${redeemHint}
                    </div>
                `);
                $card.on('click', () => this.showDetail(skill.id));
                $grid.append($card);
            });
            this.applyFont();
        },

        showDetail(id) {
            const skill = this.getSkill(id);
            if (!skill) return;
            const st = this.getSkillState(skill.id);
            const $grid = $('#shop-grid');
            const $detail = $('#shop-detail');
            $grid.hide();
            $detail.show().empty();

            const isLimited = skill.type === 'limited';
            const isRedeemOnly = skill.unlockBy === 'redeem';
            const exhausted = isLimited && st.remaining <= 0;
            const atMaxLimit = isLimited && (st.remaining + skill.uses > 100);
            // 兑换解锁项没有金币购买，只能通过兑换码获取
            const canBuy = (!isRedeemOnly) && ((skill.type === 'permanent' && !st.owned) || (isLimited && !atMaxLimit));

            let actionHtml = '';
            if (canBuy) {
                actionHtml = `<button id="shop-buy-btn" class="shop-buy-btn"><i class="fas fa-coins"></i> 购买 ${Utils.formatCurrency(skill.price)}</button>`;
            } else if (isRedeemOnly && !st.owned) {
                actionHtml = '<div class="shop-exhausted-text" style="color:#60a5fa;">该技能需通过兑换码解锁，请查看技能描述</div>';
            }

            let toggleHtml = '';
            if (st.owned && !exhausted) {
                const checked = st.enabled ? 'checked' : '';
                toggleHtml = `
                    <div class="shop-owned-text">已购买</div>
                    <label class="switch shop-skill-switch">
                        <input type="checkbox" id="shop-skill-toggle" ${checked}>
                        <span class="slider round"></span>
                    </label>
                `;
            } else if (exhausted) {
                toggleHtml = `<div class="shop-exhausted-text">次数已用完，可重新购买</div>`;
            } else if (atMaxLimit) {
                toggleHtml = `<div class="shop-exhausted-text">次数已达上限(100)，需使用至80次以下才能购买</div>`;
            }

            const limitedInfo = isLimited ? `<div class="shop-detail-remaining">剩余次数: ${st.remaining}</div>` : '';
            const permanentInfo = (skill.type === 'permanent' && st.owned) ? '<div class="shop-detail-remaining">永久</div>' : '';

            $detail.html(`
                <button id="shop-back-btn" class="shop-back-detail-btn"><i class="fas fa-arrow-left"></i> 返回</button>
                <img src="${skill.icon}" alt="${skill.name}" class="shop-detail-icon" onerror="this.style.display='none';">
                <h3 class="shop-detail-name">${skill.name}</h3>
                ${limitedInfo}
                ${permanentInfo}
                <div class="shop-detail-desc">${skill.desc}</div>
                ${canBuy ? `<div class="shop-detail-price">购买需要: ${Utils.formatCurrency(skill.price)}</div>` : ''}
                <div class="shop-action-area">${toggleHtml}${actionHtml}</div>
            `);

            $detail.find('#shop-back-btn').on('click', () => this.renderGrid());
            $detail.find('#shop-buy-btn').on('click', () => {
                const result = this.purchase(id);
                if (!result.success && window.showToast) window.showToast(result.message);
                const buySfx = new Audio('audio/buy.mp3');
                buySfx.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
                buySfx.play().catch(() => {});
                if (result.success) {
                    this.updateCoinBalance();
                    setTimeout(() => this.showDetail(id), 100);
                }
            });
            $detail.find('#shop-skill-toggle').on('change', () => {
                this.toggle(id);
                this.showDetail(id);
            });
            this.applyFont();
        }
    };

    const CollectionManager = {
        STORAGE_KEY: 'ab_collection_room_v1',
        BACKUP_KEY: 'ab_collection_room_v1_bak',

        COLLECT_MAP: {
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
        },

        list: [],
        currentIndex: 0,

        load() {
            // 尝试从主 key 读取，失败则从备份 key 读取
            const tryParse = (raw) => {
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed : null;
            };
            try {
                const saved = localStorage.getItem(this.STORAGE_KEY);
                const parsed = tryParse(saved);
                if (parsed && parsed.length > 0) {
                    this.list = parsed;
                } else {
                    // 主 key 为空或损坏，尝试备份
                    const backup = localStorage.getItem(this.BACKUP_KEY);
                    const backupParsed = tryParse(backup);
                    if (backupParsed && backupParsed.length > 0) {
                        this.list = backupParsed;
                        // 恢复主 key
                        this._write(this.STORAGE_KEY, this.list);
                    }
                }
            } catch (e) {
                // JSON 解析失败时，尝试备份
                try {
                    const backup = localStorage.getItem(this.BACKUP_KEY);
                    const backupParsed = backup ? JSON.parse(backup) : null;
                    if (Array.isArray(backupParsed) && backupParsed.length > 0) {
                        this.list = backupParsed;
                    }
                } catch (e2) {}
            }
            this.list = this._normalize(this.list);
            this.currentIndex = 0;
        },

        _normalize(list) {
            const out = [];
            (list || []).forEach(item => {
                if (!item || !item.name) return;
                // 旧版调试菜单写入的是“计算机验算模块”，与游戏内名称不一致，会多出一条重复项
                const name = item.name === '计算机验算模块' ? '验算模块' : item.name;
                // 已从收藏室下架的藏品，旧存档里丢掉，避免继续显示
                if (!this.COLLECT_MAP[name]) return;
                const image = this.COLLECT_MAP[name] || item.image;
                const exist = _.find(out, { name: name });
                if (exist) {
                    exist.count = (exist.count || 0) + (item.count || 1);
                } else {
                    out.push(_.assign({}, item, { name: name, image: image }));
                }
            });
            return out;
        },

        _write(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
            } catch (e) {}
        },

        save() {
            // 防止空列表覆盖已有数据（除非确实没有任何收藏品）
            if (this.list.length === 0) {
                try {
                    const existing = localStorage.getItem(this.STORAGE_KEY);
                    if (existing) {
                        const parsed = JSON.parse(existing);
                        if (Array.isArray(parsed) && parsed.length > 0) return;
                    }
                } catch (e) {}
            }
            // 同时写入主 key 和备份 key
            this._write(this.STORAGE_KEY, this.list);
            this._write(this.BACKUP_KEY, this.list);
        },

        isCollectible(itemName) {
            return !!this.COLLECT_MAP[itemName];
        },

        onCollected(item) {
            if (!item || !item.name) return;
            if (!this.isCollectible(item.name)) return;

            const existing = _.find(this.list, { name: item.name });
            if (existing) {
                existing.count = (existing.count || 0) + 1;
            } else {
                this.list.push({
                    name: item.name,
                    image: this.COLLECT_MAP[item.name],
                    value: item.value || 0,
                    rarity: item.rarity || 'orange',
                    count: 1,
                    firstTime: Date.now()
                });
            }
            this.save();
        },

        formatTime(ts) {
            if (!ts) return '';
            const d = new Date(ts);
            const lang = (window.I18N ? I18N.getLang() : 'zh-CN');
            const pad = n => String(n).padStart(2, '0');
            const hh = pad(d.getHours()), mm = pad(d.getMinutes());
            if (lang === 'en') {
                const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
                return mon + ' ' + d.getDate() + ', ' + d.getFullYear() + ' ' + hh + ':' + mm;
            }
            if (lang === 'ru') {
                return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + hh + ':' + mm;
            }
            return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${hh}:${mm}`;
        },

        open() {
            this.load();
            this.render();
            const $page = $('#collect-page');
            if (!$page.length) return;
            const audio = new Audio('audio/open-collect.mp3');
            audio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
            audio.play().catch(() => {});
            $page.css('opacity', 0);
            $page.addClass('show');
            requestAnimationFrame(() => requestAnimationFrame(() => $page.css('opacity', 1)));
        },

        close() {
            const $page = $('#collect-page');
            if (!$page.length) return;
            const audio = new Audio('audio/sidebar-close.mp3');
            audio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
            audio.play().catch(() => {});
            $page.css('opacity', 0);
            _.delay(() => {
                $page.removeClass('show');
                $page.css('opacity', '');
            }, 260);
        },

        buildGallery() {
            const unlocked = this.list.slice();
            unlocked.sort((a, b) => a.firstTime - b.firstTime);

            const gallery = [];
            const seen = {};
            unlocked.forEach(item => {
                seen[item.name] = true;
                gallery.push(_.assign({}, item, { locked: false }));
            });

            Object.keys(this.COLLECT_MAP).forEach(name => {
                if (!seen[name]) {
                    gallery.push({
                        name: name,
                        image: this.COLLECT_MAP[name],
                        value: 0,
                        rarity: 'orange',
                        count: 0,
                        firstTime: null,
                        locked: true
                    });
                }
            });
            return gallery;
        },

        render() {
            const $empty = $('#collect-empty');
            const $view = $('#collect-view');

            const gallery = this.buildGallery();

            if (this.list.length === 0) {
                $empty.css('display', 'flex');
                $view.css('display', 'flex');
                $('#collect-page').css({
                    'background-image': 'url("collect/img_e3e8e2a20c.png")',
                    'background-size': 'cover',
                    'background-position': 'center center'
                });
            } else {
                $empty.hide();
                $view.css('display', 'flex');
                $('#collect-page').css({
                    'background-image': 'none',
                    'background-size': 'auto',
                    'background-position': 'center'
                });
            }

            if (gallery.length === 0) return;

            if (this.currentIndex >= gallery.length) {
                this.currentIndex = gallery.length - 1;
            }
            if (this.currentIndex < 0) this.currentIndex = 0;

            const entry = gallery[this.currentIndex];
            $('#collect-img').attr('src', entry.image || '');
            $('#collect-name').text(entry.name);

            if (entry.locked) {
                $('#collect-img').css({ 'filter': 'grayscale(0.85) brightness(0.38)' });
                $('#collect-lock').show();
                $('#collect-name').hide();
                $('#collect-count-row').hide();
                $('#collect-time-row').hide();
            } else {
                $('#collect-img').css({ 'filter': 'none' });
                $('#collect-lock').hide();
                $('#collect-name').show();
                $('#collect-count-row').show();
                $('#collect-time-row').show();
                $('#collect-count').text(entry.count || 0);
                $('#collect-time').text(this.formatTime(entry.firstTime));
            }

            this.renderDots(gallery.length);

            if (gallery.length <= 1) {
                $('#collect-prev').hide();
                $('#collect-next').hide();
            } else {
                $('#collect-prev').toggle(this.currentIndex > 0);
                $('#collect-next').toggle(this.currentIndex < gallery.length - 1);
            }
        },

        renderDots(total) {
            const dotsEl = $('#collect-dots');
            dotsEl.empty();
            if (total <= 1) return;

            const MAX = 5;
            let dots = [];
            if (total <= MAX) {
                for (let i = 0; i < total; i++) dots.push(i);
            } else {
                for (let i = 0; i < 18; i++) dots.push(i);
            }
            dots.forEach(i => {
                const d = $('<span>', { 'class': 'collect-dot' + (i === this.currentIndex ? ' active' : '') });
                dotsEl.append(d);
            });
            if (total > MAX) {
                dotsEl.append($('<span>', { 'class': 'collect-dots-ellipsis', text: '…' }));
            }
        },

        prev() {
            const gallery = this.buildGallery();
            if (gallery.length === 0) return;
            if (this.currentIndex <= 0) {
                if (window.showToast) window.showToast('前面没有收藏品了');
                return;
            }
            this.currentIndex--;
            this.render();
        },

        next() {
            const gallery = this.buildGallery();
            if (gallery.length === 0) return;
            if (this.currentIndex >= gallery.length - 1) {
                if (window.showToast) window.showToast('后面没有收藏品了');
                return;
            }
            this.currentIndex++;
            this.render();
        }
    };

    window.Utils = {
        /* 振动：兼容浏览器 Vibration API 与 Cordova，支持数字或数组（振动模式） */
        vibrate(pattern) {
            try {
                /* Cordova 环境：同时尝试原生插件桥与 WebView 自带 Vibration API */
                if (window.cordova) {
                    if (window.cordova.exec) {
                        window.cordova.exec(null, null, 'Vibration', 'vibrate', [pattern]);
                    }
                    if (navigator.vibrate) {
                        navigator.vibrate(pattern);
                    }
                    return;
                }
                /* 旧版 Cordova 通知 API：不支持数组模式，退化为总时长 */
                if (navigator.notification && navigator.notification.vibrate) {
                    const total = Array.isArray(pattern) ? pattern.reduce((s, v) => s + v, 0) : pattern;
                    navigator.notification.vibrate(total);
                    return;
                }
                /* 浏览器 Vibration API：原生支持数组振动模式 */
                if (navigator.vibrate) {
                    navigator.vibrate(pattern);
                }
            } catch (e) {}
        },

        playAudio(audioId, options = {}) {
            if (!Config.game.sound || State.isPaused) return;
            const $audio = $(`#${audioId}`);
            if (!$audio.length) return;
            try {
                const audio = $audio[0];
                if (!audio.paused) {
                    audio.pause();
                    audio.currentTime = 0;
                }
                audio.currentTime = _.get(options, 'startTime', 0);
                audio.volume = _.get(options, 'volume', 1) * (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {});
                }
            } catch (e) {}
        },
        
        formatCurrency(value) {
            if (value < 1000) {
                return `${value.toFixed(2)}`;
            } else if (value < 100000) {
                return `${(value / 1000).toFixed(2)}k`;
            } else {
                return `${(value / 1000000).toFixed(2)}m`;
            }
        },

        getRarityColor(rarity) {
            const colors = {
                red: '#FE806C',
                orange: '#FE806C',
                gold: '#f39c12',
                purple: '#9b59b6',
                white: '#cccccc'
            };
            return _.get(colors, rarity, colors.white);
        },
        createElement(tag, options = {}) {
            const $element = $(`<${tag}>`);
            if (options.className) $element.addClass(options.className);
            if (options.textContent !== undefined) $element.text(options.textContent);
            if (options.innerHTML !== undefined) $element.html(options.innerHTML);
            if (options.style) $element.css(options.style);
            if (options.attributes) {
                _.each(options.attributes, (value, key) => {
                    $element.attr(key, value);
                });
            }
            if (options.dataset) {
                _.each(options.dataset, (value, key) => {
                    $element.data(key, value);
                });
            }
            if (options.on) {
                _.each(options.on, (handler, event) => {
                    $element.on(event, handler);
                });
            }
            if (options.click) $element.click(options.click);
            return $element;
        }
    };

    // 暴露给音乐商城(js/music.js)访问累计价值余额
    window.__getAccumulatedValue = () => State.totalAccumulatedValue;
    window.__getWeeklyAccumulatedValue = () => State.weeklyAccumulatedValue;
    window.__getTotalSearchedItems = () => State.totalSearchedItems;
    window.__getHighestValueEver = () => State.highestValueEver;
    window.__spendAccumulatedValue = (amount) => {
        State.totalAccumulatedValue -= amount;
        StatsManager.saveAccumulatedStats();
        StatsManager.updateAccumulatedValueDisplay();
    };
    window.__addAccumulatedValue = (amount) => {
        StatsManager.updateAccumulatedValue(amount);
    };
    /* 仅增加总累计价值，不影响本周累计价值（用于合成奖励等非搜索收益） */
    window.__addAccumulatedValueNoWeekly = (amount) => {
        State.totalAccumulatedValue += amount;
        State.sessionAccumulatedValue += amount;
        StatsManager.saveAccumulatedStats();
        StatsManager.updateAccumulatedValueDisplay();
    };
    window.__formatAccumulatedValue = (value) => Utils.formatCurrency(value);

    function parseAccumulatedValue(str) {
        str = str.trim().toUpperCase();
        if (str.endsWith('K')) {
            return parseFloat(str.slice(0, -1)) * 1000;
        } else if (str.endsWith('M')) {
            return parseFloat(str.slice(0, -1)) * 1000000;
        } else {
            return parseFloat(str);
        }
    }

    const SoundManager = {
        audioPool: [],
        specialAudioPool: [],
        
        initAudioPool() {
            let $poolContainer = $('#item-sound-pool');
            if (!$poolContainer.length) {
                $poolContainer = Utils.createElement('div', {
                    id: 'item-sound-pool',
                    style: { display: 'none' }
                });
                $('body').append($poolContainer);
            }
            $poolContainer.empty();
            
            this.audioPool = _.times(8, () => {
                const $audio = Utils.createElement('audio', {
                    attributes: { 
                        preload: 'auto',
                        type: 'audio/mpeg'
                    },
                    style: { display: 'none' }
                });
                $poolContainer.append($audio);
                return $audio[0];
            });
            
            this.specialAudioPool = _.filter([
                document.getElementById('open-safe-audio'),
                document.getElementById('reset-game-audio'),
                document.getElementById('click-audio'),
                document.getElementById('special-audio-1'),
                document.getElementById('special-audio-2'),
                document.getElementById('special-audio-3'),
                document.getElementById('special-audio-4')
            ]);
        },
        
        getAvailableAudio() {
            return _.find(this.audioPool, audio => 
                audio.paused || (audio.ended && !audio.src)
            );
        },
        
        playItemSound(soundUrl, volume = 1) {
            if (!Config.game.sound || !Config.game.itemSound || !soundUrl || _.trim(soundUrl) === '' || State.isPaused) {
                return;
            }
            
            try {
                const audio = this.getAvailableAudio();
                if (!audio) {
                    return;
                }
                
                audio.pause();
                audio.currentTime = 0;
                audio.volume = volume;
                
                const onLoaded = () => {
                    audio.removeEventListener('canplaythrough', onLoaded);
                    audio.play().catch(() => {});
                };
                
                const onError = () => {
                    audio.removeEventListener('error', onError);
                    audio.src = '';
                };
                
                audio.addEventListener('canplaythrough', onLoaded, { once: true });
                audio.addEventListener('error', onError, { once: true });
                
                audio.src = soundUrl;
                
            } catch (e) {}
        },
        
        playSpecialSoundRandom() {
            if (!Config.game.sound || State.isPaused) return;
            const randomNum = _.random(1, 4);
            const $audio = $(`#special-audio-${randomNum}`);
            if (!$audio.length) {
                this.playSpecialSound1();
                return;
            }
            try {
                const audio = $audio[0];
                audio.currentTime = 0;
                audio.volume = 1;
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {
                        this.playSpecialSound1();
                    });
                }
            } catch (e) {
                this.playSpecialSound1();
            }
        },
        
        playSpecialSound1() {
            if (!Config.game.sound || State.isPaused) return;
            const $audio = $('#special-audio-1');
            if (!$audio.length) {
                return;
            }
            try {
                const audio = $audio[0];
                audio.currentTime = 0;
                audio.volume = 1;
                audio.play().catch(() => {});
            } catch (e) {}
        },
        
        pauseAllSounds() {
            _.each(this.audioPool, audio => {
                if (!audio.paused) {
                    audio.pause();
                }
            });
            
            _.each(this.specialAudioPool, audio => {
                if (!audio.paused) {
                    audio.pause();
                }
            });
        },
        
        resumeAllSounds() {
            if (State.isPaused) return;
            
            _.each(this.audioPool, audio => {
                if (audio.paused && audio.currentTime > 0) {
                    audio.play().catch(() => {});
                }
            });
        },
        
        clearAllSounds() {
            _.each(this.audioPool, audio => {
                audio.pause();
                audio.currentTime = 0;
                audio.src = '';
            });
            
            _.each(this.specialAudioPool, audio => {
                audio.pause();
                audio.currentTime = 0;
            });
        },
        
        cleanupStalledAudio() {
            _.each(this.audioPool, (audio) => {
                if (audio.src && !audio.paused && audio.currentTime > 0) {
                    const currentTime = audio.currentTime;
                    _.delay(() => {
                        if (Math.abs(audio.currentTime - currentTime) < 0.1) {
                            audio.pause();
                            audio.currentTime = 0;
                            audio.src = '';
                        }
                    }, 5000);
                }
            });
        },
        
        startCleanupInterval() {
            setInterval(() => this.cleanupStalledAudio(), 9000);
        },
        
        clearCache() {
            this.clearAllSounds();
        }
    };

    const DOMBuilder = {
        createInventoryItem(item) {
            const rarityColor = Utils.getRarityColor(item.rarity);
            const $itemElement = Utils.createElement('div', {
                className: 'inventory-item',
                style: { borderLeftColor: rarityColor }
            });
            const $icon = Utils.createElement('div', {
                className: 'inventory-icon',
                style: { color: rarityColor }
            });
            const $info = Utils.createElement('div', { className: 'inventory-info' });
            const $name = Utils.createElement('div', {
                className: 'inventory-name',
                textContent: window.I18N ? I18N.tr(item.fullName || item.name) : (item.fullName || item.name),
                style: { color: rarityColor }
            });
            const $details = Utils.createElement('div', { className: 'inventory-details' });
            const $value = Utils.createElement('div', { 
                className: 'inventory-value',
                innerHTML: `<img src="images/img_b353ca7f64.png" alt="柯恩币" style="display: inline-block; vertical-align: middle; height: 1.2em; width: auto; margin-right: 2px;">${Utils.formatCurrency(item.value)}`
            });
            const $size = Utils.createElement('div', { className: 'inventory-size' });
            
            $details.append($value, $size);
            $info.append($name, $details);
            $itemElement.append($icon, $info);
            return $itemElement;
        },
        
        createItemElement(item, cellWidth, cellHeight) {
            const bountyOn = ShopManager.isEnabled('bounty_agreement');
            const showRarity = item.searched || (bountyOn && !State.isGlobalSearching);
            const extraClass = bountyOn && !item.searched ? ' item-bounty-flash' : '';
            const rarityColor = Utils.getRarityColor(item.rarity);
            const $element = Utils.createElement('div', {
                className: (showRarity ? `item item-${item.rarity}` : 'item item-white') + (item.searched ? ' searched' : '') + extraClass,
                dataset: { id: item.id }
            });
            if (bountyOn && !item.searched) {
                $element.get(0).style.setProperty('--flash-color', rarityColor);
            }

            const left = item.col * cellWidth;
            const top = item.row * cellHeight;
            const gridWidth = item.width * cellWidth;
            const gridHeight = item.height * cellHeight;
            const actualWidth = _.max([10, gridWidth - Config.item.spacing * 2]); 
            const actualHeight = _.max([10, gridHeight - Config.item.spacing * 2]);
            const itemLeft = left + (gridWidth - actualWidth)/ 2;
            const itemTop = top + (gridHeight - actualHeight)/ 2;
            
            $element.css({
                left: `${itemLeft}px`,
                top: `${itemTop}px`,
                width: `${actualWidth}px`,
                height: `${actualHeight}px`,
                fontSize: `${Config.item.fontSize}px`,
                opacity: 1,
                pointerEvents: item.searched ? 'auto' : 'none'
            });
            
            return $element;
        },
        
        createItemContent(item) {
            const $container = Utils.createElement('div', {
                className: 'item-content-container',
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    position: 'relative'
                }
            });
            
            // 变向物品的旋转放在父容器上，避免与 .item-image 的 quickReveal 动画 transform 冲突
            const $imageContainer = Utils.createElement('div', {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    width: '100%',
                    transform: item.rotated ? 'rotate(90deg)' : undefined
                }
            });
            
            if (item.image && _.trim(item.image) !== '' && item.image !== 'undefined') {
                const $image = Utils.createElement('img', {
                    className: "item-image",
                    attributes: { 
                        src: item.image,
                        alt: item.name
                    }
                });
                const gridScale = this.getImageScaleByGrid(item);
                const imgScale = item.imgScale || 1.0;
                let imageSize = Config.item.imgBase * gridScale * imgScale;
                const _shrinkNames = new Set(["阵列镜片", "珐琅碗", "钻石原矿", "金座钟", "水平仪", "液压扳手", "游戏机", "生化样本箱", "螺丝刀套组", "便携式千斤顶", "气密性检测仪"]);
                if (_shrinkNames.has(item.name)) {
                    $image.addClass("item-image-shrink");
                }
                $image.css({
                    width: `${imageSize}px`,
                    height: `${imageSize}px`,
                    objectFit: 'contain',
                    maxWidth: '100%',
                    maxHeight: '100%'
                });
                $image.on('error', function() {
                    $(this).hide();
                    $imageContainer.empty();
                });
                $imageContainer.append($image);
            } else {
                $imageContainer.empty();
            }
            
            $container.append($imageContainer);
            
            const $name = Utils.createElement('div', {
                className: 'item-name',
                textContent: window.I18N ? I18N.tr(item.name) : item.name,
                style: {
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    fontWeight: 'bold',
                    textAlign: 'right',
                    color: '#C0C0C0',
                    padding: '1px 3px',
                    fontSize: '0.7em',
                    textShadow: '0 0 2px black, 0 0 2px black, 0 0 2px black',
                    zIndex: '3',
                    maxWidth: '90%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'block'
                }
            });
            $container.append($name);
            
            if (item.isCoin) {
                const $amount = Utils.createElement('div', {
                    className: 'coin-amount',
                    textContent: item.value.toLocaleString('en-US'),
                    style: {
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        background: 'transparent',
                        color: '#C0C0C0',
                        padding: '1px 3px',
                        fontWeight: 'bold',
                        fontSize: '0.7em',
                        textShadow: '0 0 2px black, 0 0 2px black, 0 0 2px black',
                        zIndex: '3'
                    }
                });
                $container.append($amount);
            }
            
            return $container;
        },
        
        createSearchingOverlay(item, animate, isFirstWaiting = false) {
            let text = '';
            if (animate) {
                text = '';
            } else if (isFirstWaiting) {
                text = '';
            }
            
            if (State.isPaused) {
                return Utils.createElement('div', {
                    className: 'searching-overlay',
                    innerHTML: `
                        <div class="searching-icon-container"></div>
                        <div class="searching-text">${text}</div>
                    `
                });
            }
            
            return Utils.createElement('div', {
                className: 'searching-overlay',
                innerHTML: `
                    <div class="searching-icon-container">
                        <div class="searching-icon ${animate ? 'searching-animate' : ''}">
                            <i class="fas fa-search"></i>
                        </div>
                    </div>
                    <div class="searching-text">${text}</div>
                `
            });
        },
        
        getImageScaleByGrid(item) {
            const gridCells = item.width * item.height;
            const scaleFactor = 1 + (gridCells - 1) * Config.item.multiplier;
            return _.clamp(
                scaleFactor,
                Config.item.minScale,
                Config.item.maxScale
            );
        }
    };

    const ItemControlManager = {
        getDisabledItems() {
            try {
                const data = localStorage.getItem('disabled_items_list');
                return data ? JSON.parse(data) : [];
            } catch(e) {
                return [];
            }
        },
        
        saveDisabledItems(list) {
            localStorage.setItem('disabled_items_list', JSON.stringify(list));
        },
        
        isItemDisabled(itemId) {
            return this.getDisabledItems().includes(itemId);
        },
        
        toggleItem(itemId, disabled) {
            let list = this.getDisabledItems();
            if (disabled) {
                if (!list.includes(itemId)) {
                    list.push(itemId);
                }
            } else {
                list = list.filter(id => id !== itemId);
            }
            this.saveDisabledItems(list);
        },
        
        disableAll() {
            const ids = allItemsConfig.map(item => item.id);
            ids.push(-1);
            this.saveDisabledItems(ids);
        },
        
        enableAll() {
            this.saveDisabledItems([]);
        },

        setAccumulatedValue(value) {
            // GM 调试仅修改总累计价值（用于消耗系统），不影响本周累计价值
            State.totalAccumulatedValue = value;
            State.sessionAccumulatedValue = value;
            this.saveAccumulatedValue(value);
            StatsManager.updateAccumulatedValueDisplay();
            return true;
        },

        getAccumulatedValue() {
            return State.totalAccumulatedValue;
        },

        saveAccumulatedValue(value) {
            try {
                const stats = JSON.parse(localStorage.getItem(Config.storageKey) || '{}');
                stats.totalAccumulatedValue = value;
                stats.totalSearchedItems = State.totalSearchedItems;
                stats.highestValueEver = State.highestValueEver;
                if (stats.weeklyAccumulatedValue === undefined) stats.weeklyAccumulatedValue = State.weeklyAccumulatedValue;
                if (!stats.weeklyAccumulatedWeek) stats.weeklyAccumulatedWeek = State.weeklyAccumulatedWeek || StatsManager.getCurrentWeek();
                localStorage.setItem(Config.storageKey, JSON.stringify(stats));
            } catch (e) {}
        },
        
        renderItemList(searchTerm = '', rarityFilter = 'all') {
            const $list = $('#item-control-list');
            $list.empty();
            
            let items = [...allItemsConfig];
            
            const coinItem = {
                id: -1,
                name: '柯恩币',
                width: 1,
                height: 1,
                value: 1000,
                image: 'images/img_b353ca7f64.png',
                rarity: 'white',
                weight: 100
            };
            
            const hasCoin = items.some(item => item.name === '柯恩币' && item.rarity === 'white');
            if (!hasCoin) {
                items.unshift(coinItem);
            }
            
            if (rarityFilter !== 'all') {
                items = items.filter(item => item.rarity === rarityFilter);
            }
            
            if (searchTerm.trim()) {
                const term = searchTerm.trim().toLowerCase();
                items = items.filter(item => {
                    if (item.name.toLowerCase().includes(term)) return true;
                    if (item.id.toString() === term) return true;
                    if (item.rarity.toLowerCase().includes(term)) return true;
                    const formatStr = `${item.rarity} · ${item.width}x${item.height} · ID: ${item.id}`.toLowerCase();
                    if (formatStr.includes(term)) return true;
                    if (`${item.width}x${item.height}`.includes(term)) return true;
                    return false;
                });
            }
            
            const rarityOrder = { red: 0, orange: 1, gold: 2, purple: 3, white: 4 };
            items.sort((a, b) => (rarityOrder[a.rarity] || 99) - (rarityOrder[b.rarity] || 99));
            
            if (items.length === 0) {
                $list.html('<div style="text-align:center;padding:60px 20px;color:#64748b;font-size:14px;"><i class="fas fa-search" style="font-size:32px;display:block;margin-bottom:12px;color:#475569;"></i>没有找到匹配的物品</div>');
                return;
            }
            
            const disabledIds = this.getDisabledItems();
            
            items.forEach(item => {
                const isDisabled = disabledIds.includes(item.id);
                const rarityColors = {
                    red: '#FE806C',
                    orange: '#FE806C',
                    gold: '#f39c12',
                    purple: '#9b59b6',
                    white: '#cccccc'
                };
                const rarityNames = {
                    red: '红色',
                    orange: '橙色',
                    gold: '金色',
                    purple: '紫色',
                    white: '白色'
                };
                const color = rarityColors[item.rarity] || '#cccccc';
                const rarityLabel = rarityNames[item.rarity] || item.rarity;
                
                const $row = $(`
                    <div style="display:flex;align-items:center;padding:8px 12px;background:rgba(255,255,255,0.02);border-radius:8px;gap:10px;transition:all 0.2s;opacity:${isDisabled ? 0.4 : 1};border:1px solid ${isDisabled ? 'rgba(255,255,255,0.03)' : 'transparent'};">
                        <div style="width:38px;height:38px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-radius:6px;overflow:hidden;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.05);">
                            ${item.image && item.image !== 'undefined' && item.image !== '' 
                                ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:contain;">`
                                : `<span style="color:${color};font-size:16px;">?</span>`
                            }
                        </div>
                        <div style="flex:1;min-width:0;">
                            <div style="color:${color};font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${window.I18N ? I18N.tr(item.name) : item.name}</div>
                            <div style="color:#64748b;font-size:11px;">${window.I18N ? I18N.tr(rarityLabel) : rarityLabel} · ${item.width}x${item.height} · ID: ${item.id}</div>
                        </div>
                        <label class="item-toggle-switch">
                            <input type="checkbox" class="item-toggle" data-id="${item.id}" ${isDisabled ? '' : 'checked'}>
                            <span class="item-toggle-slider" style="background:${isDisabled ? '#374151' : '#2563eb'};box-shadow:${isDisabled ? 'none' : '0 0 6px rgba(37,99,235,0.4)'};">
                                <span class="item-toggle-knob" style="left:${isDisabled ? '3px' : '23px'};"></span>
                            </span>
                        </label>
                    </div>
                `);
                
                $row.find('.item-toggle').on('change', function() {
                    // 不能用 parseInt：Mod 物品 id 是字符串（mod_xxx_0），parseInt 会变 NaN 导致开关失效
                    const itemId = $(this).data('id');
                    const disabled = !$(this).is(':checked');
                    ItemControlManager.toggleItem(itemId, disabled);
                    $row.css('opacity', disabled ? 0.4 : 1);
                    $row.css('border-color', disabled ? 'rgba(255,255,255,0.03)' : 'transparent');
                    const $slider = $row.find('.item-toggle-slider');
                    const $knob = $row.find('.item-toggle-knob');
                    $slider.css({
                        'background': disabled ? '#374151' : '#2563eb',
                        'box-shadow': disabled ? 'none' : '0 0 6px rgba(37,99,235,0.4)'
                    });
                    $knob.css({
                        'left': disabled ? '3px' : '23px'
                    });
                });
                
                $list.append($row);
            });
        }
    };

    const GameCore = {
        async loadItemsFromXML() {
            try {
                let text;
                if (window.Net && Net.getText) {
                    text = await Net.getText('xml/items.xml', { timeout: 8000, retries: 1 });
                } else {
                    const response = await fetch('xml/items.xml');
                    if (!response.ok) {
                        return this.getDefaultItems();
                    }
                    text = await response.text();
                }
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(text, "text/xml");
                const nodes = xmlDoc.getElementsByTagName('item');
                
                const items = _.chain(nodes)
                    .map((node) => {
                        const getText = (tag) => _.get(node.getElementsByTagName(tag), '[0].textContent', '');
                        const item = {
                            id: _.parseInt(getText('id')),
                            name: getText('name'),
                            fullName: getText('fullName') || getText('name'),
                            width: _.parseInt(getText('width')),
                            height: _.parseInt(getText('height')),
                            value: _.parseInt(getText('value') || "0"),
                            image: getText('image'),
                            rarity: getText('rarity') || "white",
                            sound: getText('sound'),
                            desc: getText('desc'),
                            imgScale: parseFloat(getText('imgScale')) || 1.0,
                            isSample: getText('isSample') === '1'
                        };
                        
                        item.value = this.normalizeValue(item.value);
                        item.searchTime = _.get(Config.searchTimes, item.rarity, Config.searchTimes.purple);
                        const xmlWeight = getText('weight');
                        item.weight = xmlWeight !== '' ? _.parseInt(xmlWeight) : this.calculateItemWeight(item.value);
                        
                        return item.rarity !== 'white' ? item : null;
                    })
                    .compact()
                    .value();
                    
                return items;
            } catch (e) {
                return this.getDefaultItems();
            }
        },
        
        normalizeValue(value) {
            return _.clamp(value, Config.valueRange.min, Config.valueRange.max);
        },
        
        calculateItemWeight(value) {
            const normalizedValue = this.normalizeValue(value);
            const weight = Config.valueWeight.baseWeight * Math.exp(-Config.valueWeight.decayFactor * normalizedValue);
            return _.max([Config.valueWeight.minWeight, weight]);
        },
        
        getDefaultItems() {
            return [];
        },
        
        getRandomItemByRarity(rarity) {
            const disabledIds = ItemControlManager.getDisabledItems();
            const sampleEnabled = window.__SAMPLE_SPAWN_ENABLED__ !== false;
            const itemsOfRarity = _.filter(allItemsConfig, { rarity }).filter(item =>
                !disabledIds.includes(item.id) && (sampleEnabled || !item.isSample)
            );
            if (_.isEmpty(itemsOfRarity)) return null;
            
            const totalWeight = _.sumBy(itemsOfRarity, 'weight');
            let randomWeight = Math.random() * totalWeight;
            
            return _.find(itemsOfRarity, item => {
                randomWeight -= item.weight;
                return randomWeight <= 0;
            });
        },
        
        getRandomItem() {
            if (_.isEmpty(allItemsConfig)) return null;
            
            const roll = Math.random() * 100;
            
            if (roll < Config.spawn.red) {
                const redItem = this.getRandomItemByRarity('red');
                if (redItem) return _.cloneDeep(redItem);
            }
            
            if (roll < Config.spawn.red + Config.spawn.orange) {
                const orangeItem = this.getRandomItemByRarity('orange');
                if (orangeItem) return _.cloneDeep(orangeItem);
            }
            
            if (roll < Config.spawn.red + Config.spawn.orange + Config.spawn.gold) {
                const goldItem = this.getRandomItemByRarity('gold');
                if (goldItem) return _.cloneDeep(goldItem);
            }
            
            const purpleItem = this.getRandomItemByRarity('purple');
            if (purpleItem) return _.cloneDeep(purpleItem);
            
            return this.getWeightedRandomItem();
        },
        
        getWeightedRandomItem() {
            const disabledIds = ItemControlManager.getDisabledItems();
            const sampleEnabled = window.__SAMPLE_SPAWN_ENABLED__ !== false;
            const availableItems = _.filter(allItemsConfig, item =>
                !disabledIds.includes(item.id) && (sampleEnabled || !item.isSample)
            );
            
            if (_.isEmpty(availableItems)) return null;
            
            const totalWeight = _.sumBy(availableItems, 'weight');
            let randomWeight = Math.random() * totalWeight;
            
            const item = _.find(availableItems, item => {
                randomWeight -= item.weight;
                return randomWeight <= 0;
            });
            
            return _.cloneDeep(item || _.sample(availableItems));
        },
        
        canPlaceItem(item, row, col, grid) {
            if (row < 0 || col < 0) return false;
            if (row + item.height > Config.grid.rows || col + item.width > Config.grid.cols) return false;
            
            for (let r = row; r < row + item.height; r++) {
                for (let c = col; c < col + item.width; c++) {
                    if (grid[r][c] !== 0) return false;
                }
            }
            return true;
        },
        
        placeItem(item, row, col, grid) {
            _.times(item.height, r => {
                _.times(item.width, c => {
                    grid[row + r][col + c] = item.id;
                });
            });
            
            return _.assign(item, { row, col });
        },
        
        tryPlaceItem(item, grid) {
            for (let r = 0; r < Config.grid.rows; r++) {
                for (let c = 0; c < Config.grid.cols; c++) {
                    if (this.canPlaceItem(item, r, c, grid)) {
                        return this.placeItem(item, r, c, grid);
                    }
                }
            }
            return null;
        },

        // 物品变向：横↔竖，仅交换宽高，不做上下/左右翻转
        rotateItem(item) {
            const w = item.width;
            item.width = item.height;
            item.height = w;
            item.rotated = !item.rotated;
            return item;
        },

        // 从 grid 中清除某个物品占用的格子（不移除 items 数组中的对象）
        removeItemFromGrid(item, grid) {
            _.times(item.height, r => {
                _.times(item.width, c => {
                    if (grid[item.row + r] && grid[item.row + r][item.col + c] === item.id) {
                        grid[item.row + r][item.col + c] = 0;
                    }
                });
            });
        },

        // 自动变向放置：先尝试原方向，放不下再尝试变向（仅非正方形物品）
        tryPlaceItemWithRotation(item, grid) {
            const placed = this.tryPlaceItem(item, grid);
            if (placed) return placed;
            if (item.width !== item.height) {
                this.rotateItem(item);
                const rotated = this.tryPlaceItem(item, grid);
                if (rotated) return rotated;
                // 变向仍放不下，恢复原方向
                this.rotateItem(item);
            }
            return null;
        },

        // 查找占据 (row, col) 的柯恩币
        findCoinAt(row, col, items) {
            return _.find(items, it => it.isCoin && it.row === row && it.col === col);
        },

        // 把物品移动到 (newRow, newCol)。柯恩币允许与目标格的柯恩币重叠并合并数值。
        // 普通物品放不下时，若目标格被其他物品占据则尝试交换位置。
        // 移动成功返回 true；放不下且无法交换则恢复原位返回 false。
        moveItem(item, newRow, newCol, grid, items) {
            const oldRow = item.row, oldCol = item.col;
            this.removeItemFromGrid(item, grid);

            if (item.isCoin) {
                // 柯恩币：允许叠在另一枚柯恩币上，合并数值
                const targetCoin = this.findCoinAt(newRow, newCol, items);
                this.placeItem(item, newRow, newCol, grid);
                if (targetCoin && targetCoin.id !== item.id) {
                    item.value += targetCoin.value;
                    const idx = _.indexOf(items, targetCoin);
                    if (idx !== -1) items.splice(idx, 1);
                }
                return true;
            }

            if (this.canPlaceItem(item, newRow, newCol, grid)) {
                this.placeItem(item, newRow, newCol, grid);
                return true;
            }

            // 放不下：检查目标区域是否被某个物品占据，尝试交换
            const blocker = this.findBlockerAt(item, newRow, newCol, grid, items);
            if (blocker && blocker.id !== item.id) {
                this.removeItemFromGrid(blocker, grid);
                const blockerFits = this.canPlaceItem(blocker, oldRow, oldCol, grid);
                if (blockerFits && this.canPlaceItem(item, newRow, newCol, grid)) {
                    this.placeItem(blocker, oldRow, oldCol, grid);
                    this.placeItem(item, newRow, newCol, grid);
                    return true;
                }
                // 交换失败，恢复 blocker
                this.placeItem(blocker, blocker.row, blocker.col, grid);
            }

            // 放不下，恢复原位
            this.placeItem(item, oldRow, oldCol, grid);
            return false;
        },

        // 查找占据 (row, col) 区域的物品
        findBlockerAt(item, row, col, grid, items) {
            for (let r = row; r < row + item.height; r++) {
                for (let c = col; c < col + item.width; c++) {
                    if (r < 0 || r >= Config.grid.rows || c < 0 || c >= Config.grid.cols) continue;
                    const id = grid[r][c];
                    if (id && id !== item.id) {
                        return _.find(items, { id });
                    }
                }
            }
            return null;
        },

        createSearchQueue() {
            State.searchQueue = _.chain(State.items)
                .map(item => _.cloneDeep(item))
                .sortBy(['col', 'row'])
                .value();
        }
    };

    /* ===== 动画帧率限制器 =====
       效果设置中的「30 帧 / 60 帧 / 无上限」，作用于所有基于 requestAnimationFrame 的动画循环 */
    const FrameLimiter = {
        storageKey: 'ab_fps_mode',
        mode: 'unlimited',
        interval: 0,
        _last: 0,
        init() {
            let saved = null;
            try { saved = localStorage.getItem(this.storageKey); } catch (e) {}
            this.set(saved === '30' || saved === '60' ? saved : 'unlimited', true);
        },
        applyMode(mode) {
            this.mode = mode;
            this.interval = mode === '30' ? 33 : (mode === '60' ? 16 : 0);
            this._last = 0;
        },
        set(mode, silent) {
            this.applyMode(mode);
            if (!silent) {
                try { localStorage.setItem(this.storageKey, mode); } catch (e) {}
            }
        },
        // 返回 true 表示本帧应当渲染，false 表示跳过（由调用方继续排队下一帧）
        allow() {
            if (!this.interval) return true;
            const now = Date.now();
            if (now - this._last >= this.interval) {
                this._last = now;
                return true;
            }
            return false;
        }
    };
    FrameLimiter.init();
    window.FrameLimiter = FrameLimiter;

    const UIManager = {
        updateResetButtonState() {
            const $resetBtn = $('#reset-btn');
            const hasItems = State.items.length > 0 || State.inventory.length > 0;
            /* 只要场上有道具即可重置：搜索进行中也允许直接重置，
               resetGame 会取消 rAF 定时器并清空搜索队列，不会留下半截状态 */
            if (hasItems) {
                $resetBtn
                    .prop('disabled', false)
                    .removeClass('disabled')
                    .css({
                        'opacity': '1',
                        'cursor': 'pointer',
                        'background': 'rgba(255, 255, 255, 0.1)',
                        'border': '1px solid rgba(255, 255, 255, 0.2)',
                        'color': 'white'
                    });
            } else {
                $resetBtn
                    .prop('disabled', true)
                    .addClass('disabled')
                    .css({
                        'opacity': '0.5',
                        'cursor': 'not-allowed',
                        'background': 'rgba(255, 255, 255, 0.05)',
                        'border': '1px solid rgba(255, 255, 255, 0.1)',
                        'color': 'rgba(255, 255, 255, 0.5)'
                    });
            }
        },
        
        updatePauseButtonState() {
            const $pauseBtn = $('#pause-search-btn');
            if (State.isSearching || State.isGlobalSearching) {
                $pauseBtn
                    .prop('disabled', false)
                    .removeClass('disabled')
                    .css({
                        'opacity': '1',
                        'cursor': 'pointer',
                        'background': 'rgba(255, 255, 255, 0.1)',
                        'border': '1px solid rgba(255, 255, 255, 0.2)',
                        'color': 'white'
                    });
            } else {
                $pauseBtn
                    .prop('disabled', true)
                    .addClass('disabled')
                    .css({
                        'opacity': '0.5',
                        'cursor': 'not-allowed',
                        'background': 'rgba(255, 255, 255, 0.05)',
                        'border': '1px solid rgba(255, 255, 255, 0.1)',
                        'color': 'rgba(255, 255, 255, 0.5)'
                    });
            }
        },
        
        updateInventory() {
            const $inventoryList = $('#inventory-list');
            if (_.isEmpty(State.inventory)) {
                $inventoryList.html('<div class="inventory-empty">' + (window.I18N ? I18N.tr('点击"打开保险"开始搜索物品') : '点击"打开保险"开始搜索物品') + '</div>');
                return;
            }
            $inventoryList.empty();
            _.each(State.inventory, item => {
                $inventoryList.append(DOMBuilder.createInventoryItem(item));
            });
            
            this.updateResetButtonState();
        },
        
        updateStats() {
            const updates = {
                '#total-value': `<img src="images/img_b353ca7f64.png" alt="柯恩币" style="display: inline-block; vertical-align: middle; height: 1.2em; width: auto; margin-right: 2px;">${Utils.formatCurrency(State.totalValue)}`,
                '#highest-value': `<img src="images/img_b353ca7f64.png" alt="柯恩币" style="display: inline-block; vertical-align: middle; height: 1.2em; width: auto; margin-right: 2px;">${Utils.formatCurrency(State.highestValue)}`
            };

            _.each(updates, (value, selector) => {
                $(selector).html(value);
            });

            this.updateResetButtonState();
        },
        
        renderAllItems() {
            const $safeGrid = $('#safe-grid');
            $safeGrid.find('.item').remove();
            $safeGrid.find('.grid-cell').removeClass('searching searched');
            
            const cellWidth = Config.grid.width / Config.grid.cols;
            const cellHeight = Config.grid.height / Config.grid.rows;
            
            const nextItem = State.searchQueue.length > 0 ? State.searchQueue[0] : null;
            
            _.each(State.items, item => {
                const $itemElement = DOMBuilder.createItemElement(item, cellWidth, cellHeight);
                $safeGrid.append($itemElement);
                this.markGridCells(item);
                
                if (item.searched) {
                    this.showItemContent($itemElement, item);
                } else if (State.currentSearch && State.currentSearch.id === item.id) {
                    if (State.isSearching) {
                        this.showSearchingOverlay($itemElement, item, !State.isPaused, false);
                    } else {
                        this.showSearchingOverlay($itemElement, item, false, false);
                    }
                } else if (nextItem && item.id === nextItem.id) {
                    this.showSearchingOverlay($itemElement, item, false, true);
                } else {
                    this.showWaitingCover($itemElement);
                }
            });
            
            this.updateResetButtonState();
        },
        
        markGridCells(item) {
            _.times(item.height, r => {
                _.times(item.width, c => {
                    const $cell = $(`.grid-cell[data-row="${item.row + r}"][data-col="${item.col + c}"]`);
                    if ($cell.length) {
                        if (item.searched) {
                            $cell.addClass('searched');
                        } else if (State.currentSearch && State.currentSearch.id === item.id && State.isSearching) {
                            if (State.isPaused) {
                                $cell.removeClass('searching');
                            } else {
                                $cell.addClass('searching');
                            }
                        } else {
                            $cell.removeClass('searching');
                        }
                    }
                });
            });
        },
        
        showItemContent($element, item) {
            $element.addClass('searched').empty();
            const $content = DOMBuilder.createItemContent(item);
            $element.append($content);
            
            if (item.isFreshSearch) {
                const $itemImage = $content.find('.item-image');
                if ($itemImage.length) {
                    $itemImage.removeClass('icon-reveal-quick');
                    setTimeout(() => {
                        $itemImage.addClass('icon-reveal-quick');
                        // jQuery 的 .on(types, data, fn) 不支持 {once:true} 选项，改用原生监听
                        const imgEl = $itemImage[0];
                        if (imgEl && imgEl.addEventListener) {
                            const onEnd = function() {
                                imgEl.removeEventListener('animationend', onEnd);
                                $itemImage.removeClass('icon-reveal-quick');
                            };
                            imgEl.addEventListener('animationend', onEnd);
                        } else {
                            $itemImage.one('animationend', function() {
                                $itemImage.removeClass('icon-reveal-quick');
                            });
                        }
                    }, 10);
                }
                /* 物品揭示瞬间的白色闪光：照搬 index.html，在 #safe-grid 独立图层上覆盖物品位置，320ms 后移除 */
                if (window.__ITEM_FLASH_ENABLED__ !== false) {
                    const itemEl = $element[0];
                    const $flash = $('<div class="item-flash"></div>').css({
                        left: itemEl.style.left,
                        top: itemEl.style.top,
                        width: itemEl.style.width,
                        height: itemEl.style.height
                    });
                    $('#safe-grid').append($flash);
                    setTimeout(() => $flash.remove(), 320);
                }
                delete item.isFreshSearch;
            }
            
            this.updateResetButtonState();
        },
        
        showSearchingOverlay($element, item, animate) {
            $element.empty().append(DOMBuilder.createSearchingOverlay(item, animate));
        },
        
        showWaitingCover($element) {
            $element.removeClass('searched').empty();
            $element.append(Utils.createElement('div', {
                className: 'searching-overlay'
            }));
        },
        
        createGridCells() {
            const $safeGrid = $('#safe-grid');
            /* 保留中央"搜索中"覆盖层，避免被 empty() 清掉 */
            const $overlay = $('#searching-overlay').detach();
            $safeGrid.empty().css({
                gridTemplateColumns: `repeat(${Config.grid.cols}, 1fr)`,
                gridTemplateRows: `repeat(${Config.grid.rows}, 1fr)`,
                width: `${Config.grid.width}px`,
                height: `${Config.grid.height}px`
            });
            
            _.times(Config.grid.rows, row => {
                _.times(Config.grid.cols, col => {
                    const $cell = Utils.createElement('div', {
                        className: 'grid-cell',
                        dataset: { row, col }
                    });
                    $safeGrid.append($cell);
                });
            });
            
            if ($overlay.length) $safeGrid.append($overlay);
            
            this.updateResetButtonState();
        }
    };

    const GameController = {
openSafe() {
    if (State.isOpenSafeBtnDisabled) return;
    try {
        this._runOpenSafe();
    } catch (e) {
        /* 生成流程异常时不能让按钮永久停在"生成中..."，否则整局都无法再开保险 */
        console.error('[openSafe] 开保险流程异常：', e);
        State.isOpenSafeBtnDisabled = false;
        $('#open-safe-btn').prop('disabled', false).html('<i class="fas fa-hand-pointer"></i> 打开保险');
        if (window.showToast) window.showToast('开保险失败，请重试');
    }
},

_runOpenSafe() {
    State.isOpenSafeBtnDisabled = true;
    
    const $openButton = $('#open-safe-btn');
    $openButton.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> 生成中...');
    
    Utils.playAudio('open-safe-audio', { volume: 1 });
    this.resetGameState();
    /* resetGameState 会把防重入标志写回 false，这里补回，保证生成期间真正防重复点击 */
    State.isOpenSafeBtnDisabled = true;

    ShopManager.consumeLimitedUse('supply_tide');
    const tideActive = ShopManager.isEnabled('supply_tide');

    ShopManager.consumeLimitedUse('lucky_streak');
    const luckyActive = ShopManager.isEnabled('lucky_streak');

    State.grid = _.times(Config.grid.rows, () => _.times(Config.grid.cols, () => 0));
    
    let itemId = 1;
    const items = [];
    
    const coinDisabled = ItemControlManager.isItemDisabled(-1);
    
    if (!coinDisabled) {
        const coinStackCount = Math.random() < 0.5 ? 1 : 3;
        
        for (let i = 0; i < coinStackCount; i++) {
            const value = _.random(Config.coin.min, Config.coin.max);
            const coinItem = {
                name: "柯恩币",
                width: 1,
                height: 1,
                value: value,
                image: "images/img_b353ca7f64.png",
                rarity: "white",
                searchTime: Config.searchTimes.white || 0.25,
                id: itemId++,
                row: 0,
                col: i,
                isCoin: true,
                sound: "audio/items/柯恩币.mp3",
                desc: '由卡莫纳官方发行的货币，由于其与特维拉官方货币的锚定，市价坚挺，是市场上的硬通货。'
            };
            if (GameCore.canPlaceItem(coinItem, 0, i, State.grid)) {
                GameCore.placeItem(coinItem, 0, i, State.grid);
                items.push(coinItem);
            }
        }
    }
    
    const disabledPurpleIds = ItemControlManager.getDisabledItems();
    const sampleEnabled = window.__SAMPLE_SPAWN_ENABLED__ !== false;
    const purpleItems = _.filter(allItemsConfig, item =>
        item.rarity === 'purple' && !disabledPurpleIds.includes(item.id) && (sampleEnabled || !item.isSample)
    );
    
    if (!_.isEmpty(purpleItems)) {
        let purpleItemCount = _.random(Config.purpleSpawn.min, Config.purpleSpawn.max);
        if (tideActive) purpleItemCount *= 2;
        _.times(purpleItemCount, () => {
            const purpleItem = _.cloneDeep(_.sample(purpleItems));
            purpleItem.id = itemId++;
            const placedItem = GameCore.tryPlaceItemWithRotation(purpleItem, State.grid);
            if (placedItem) {
                items.push(placedItem);
            }
        });
    }
    
    const highQualityItems = _.filter(allItemsConfig, item =>
        _.includes(['red', 'orange', 'gold'], item.rarity) &&
        !disabledPurpleIds.includes(item.id) && (sampleEnabled || !item.isSample)
    );

    // 命运保底逻辑：连续 N 次未出橙/红，第 N 次保底触发；越靠近保底概率越高，触发后下次阈值 -1
    const DESTINY_KEY = 'ab_destiny_pity_state';
    let destinyState = { consecutive: 0, threshold: 10 };
    try {
        var ds = JSON.parse(localStorage.getItem(DESTINY_KEY));
        if (ds && typeof ds.consecutive === 'number' && typeof ds.threshold === 'number') {
            destinyState = ds;
        }
    } catch (e) {}
    const destinyOwned = ShopManager.isEnabled('destiny_pity');
    let destinyPityTriggered = false;
    let destinyForceOrange = false;
    if (destinyOwned && highQualityItems.length > 0 && destinyState.threshold > 0) {
        destinyState.consecutive++;
        if (destinyState.consecutive >= destinyState.threshold) {
            // 保底触发：必出橙色（不强制红，给玩家留一点惊喜空间）
            destinyPityTriggered = true;
            destinyForceOrange = true;
        } else {
            // 递增概率：从第 threshold-3 次开始有概率提前出
            var earlyChance = Math.max(0, (destinyState.consecutive - (destinyState.threshold - 3)) / 3);
            if (Math.random() < earlyChance) {
                destinyPityTriggered = true;
                destinyForceOrange = true;
            }
        }
    }
    try { localStorage.setItem(DESTINY_KEY, JSON.stringify(destinyState)); } catch (e) {}
    
    if (!_.isEmpty(highQualityItems)) {
        let hqCount = _.random(1, 4);
        if (tideActive) hqCount *= 2;
        let luckyPlaced = false;
        _.times(hqCount, (idx) => {
            let hqItem;
            if (luckyActive && !luckyPlaced) {
                const rarity = Math.random() < 0.99 ? 'orange' : 'red';
                hqItem = GameCore.getRandomItemByRarity(rarity);
                if (!hqItem) hqItem = GameCore.getRandomItemByRarity(rarity === 'orange' ? 'red' : 'orange');
                if (hqItem) {
                    hqItem = _.cloneDeep(hqItem);
                    luckyPlaced = true;
                }
            } else {
                hqItem = GameCore.getRandomItem();
            }
            if (hqItem) {
                hqItem.id = itemId++;
                const placedItem = GameCore.tryPlaceItemWithRotation(hqItem, State.grid);
                if (placedItem) {
                    items.push(placedItem);
                } else if (luckyActive && !luckyPlaced) {
                    luckyPlaced = false;
                }
            }
        });
    }

    // 命运保底：若触发保底，强制插入一个橙色物品（如已有则改为红色）
    if (destinyOwned && destinyPityTriggered) {
        // 已出橙/红则重置连续计数并恢复阈值；本次保底触发后下次阈值 -1
        let hasOrangeOrRed = _.some(items, function(it) { return it.rarity === 'red' || it.rarity === 'orange'; });
        var nextThreshold = destinyState.threshold - 1;
        if (nextThreshold < 3) nextThreshold = 3;
        if (hasOrangeOrRed || destinyForceOrange) {
            // 提前出了或保底触发，重置连续计数为 0
            destinyState.consecutive = 0;
            destinyState.threshold = 10;
        } else {
            // 没出橙/红，阈值降到 nextThreshold（保底次数缩短）
            destinyState.threshold = nextThreshold;
        }
        // 保底强制插入橙色（若格子满就放弃）
        if (destinyForceOrange) {
            const orangeItem = GameCore.getRandomItemByRarity('orange');
            if (orangeItem) {
                orangeItem.id = itemId++;
                const placed = GameCore.tryPlaceItemWithRotation(_.cloneDeep(orangeItem), State.grid);
                if (placed) items.push(placed);
            }
        }
        try { localStorage.setItem(DESTINY_KEY, JSON.stringify(destinyState)); } catch (e) {}
    }

    // 不再强行填充剩余空格，物品之间允许有空隙，避免过多单格物品填充
    
    if (_.isEmpty(items)) {
        State.isOpenSafeBtnDisabled = false;
        $openButton.prop('disabled', false).html('<i class="fas fa-hand-pointer"></i> 打开保险');
        // 失败时也保证可以重置：清理可能残留的搜索/遮罩状态
        try {
            $('#reset-btn').prop('disabled', false).removeClass('disabled').css({ opacity: '1', cursor: 'pointer' });
            UIManager.updatePauseButtonState();
            $('#searching-overlay').attr('hidden', '');
        } catch (e) {}
        if (window.showToast) window.showToast('所有物品已被禁用，请到物品池重新启用');
        return;
    }
    
    // 80% 概率将最高价值物品移到生成列表末尾（最后刷新）
    if (items.length > 1 && Math.random() < 0.8) {
        let maxIdx = 0;
        for (let i = 1; i < items.length; i++) {
            if (items[i].value > items[maxIdx].value) {
                maxIdx = i;
            }
        }
        if (maxIdx < items.length - 1) {
            const highest = items.splice(maxIdx, 1)[0];
            items.push(highest);
        }
    }

    State.items = items;
    GameCore.createSearchQueue();
    UIManager.renderAllItems();
    UIManager.updateStats();
    UIManager.updateInventory();
    State.isFirstOpen = false;

    /* 打开保险后立即显示全局搜索遮罩（由 startGlobalSearch 统一控制显示/隐藏/跳过） */

    if (ShopManager.isEnabled('prophet')) {
        const topItem = ShopManager.getHighestValueItem();
        if (topItem) {
            if (window.showToast) window.showToast(`本次最高价值物品为【${topItem.name}】，价值 ${Utils.formatCurrency(topItem.value)}`);
        }
    }
    
    $openButton.html('<i class="fas fa-hand-pointer"></i> 打开保险');
    
    this.startGlobalSearch();
},

        /* 全局搜索阶段（照搬 index.html：保险箱中央显示"搜索中 + 秒表"，持续 2.20s 后再逐个揭示物品） */
        startGlobalSearch() {
            if (State.isSearching || State.isGlobalSearching) return;

            State.isGlobalSearching = true;
            State.isPaused = false;
            State.pauseElapsed = 0;

            const $overlay = $('#searching-overlay');
            const $ssTime = $('#ss-time');

            let _skipMask = false;
            try { _skipMask = localStorage.getItem('ab_skip_search_mask') === '1'; } catch (e) {}

            if (_skipMask) {
                // 跳过遮罩：延迟 0.5s 后进入逐个搜索（给玩家一个短暂停顿）
                if ($overlay.length) $overlay.attr('hidden', '');
                UIManager.updatePauseButtonState();
                UIManager.renderAllItems();
                State.isGlobalSearching = false;
                const _self = this;
                setTimeout(() => {
                    if (!State.isPaused) _self.startSearch();
                }, 500);
                return;
            }

            // 正常模式：显示遮罩 2.2s
            if ($overlay.length) $overlay.removeAttr('hidden');
            if ($ssTime.length) $ssTime.text('0.00');

            UIManager.updatePauseButtonState();
            UIManager.renderAllItems();

            const SEARCH_MS = 2200;
            let startTime = performance.now();

            if (State.searchTimer) cancelAnimationFrame(State.searchTimer);

            const tick = () => {
                if (!State.isGlobalSearching) return;
                if (State.isPaused) {
                    startTime = performance.now() - State.pauseElapsed;
                    State.searchTimer = requestAnimationFrame(tick);
                    return;
                }
                // 帧率限制：跳过的帧不刷新读秒，但继续排队下一帧
                if (!FrameLimiter.allow()) {
                    State.searchTimer = requestAnimationFrame(tick);
                    return;
                }
                const elapsed = performance.now() - startTime;
                State.pauseElapsed = elapsed;
                if ($ssTime.length) $ssTime.text((elapsed / 1000).toFixed(2));

                if (elapsed >= SEARCH_MS) {
                    if ($ssTime.length) $ssTime.text('2.20');
                    if ($overlay.length) $overlay.attr('hidden', '');
                    State.isGlobalSearching = false;
                    /* 大遮罩消失后延迟 0.25s 再开始逐个搜索，避免视觉突兀 */
                    setTimeout(() => {
                        if (!State.isPaused) this.startSearch();
                    }, 250);
                } else {
                    State.searchTimer = requestAnimationFrame(tick);
                }
            };
            State.searchTimer = requestAnimationFrame(tick);
        },
        
        startSearch() {
            if (State.isSearching || _.isEmpty(State.searchQueue)) return;
            
            State.currentSearch = _.cloneDeep(_.first(State.searchQueue));
            State.isSearching = true;
            State.isPaused = false;
            State.currentSearchTime = State.currentSearch.searchTime;
            State.pauseElapsed = 0;
            
            UIManager.updatePauseButtonState();
            UIManager.renderAllItems();
            this.startSearchTimer();
        },
        
        startSearchTimer() {
            if (State.searchTimer) cancelAnimationFrame(State.searchTimer);
            
            /* 恢复时从已暂停的进度接着走，而非从零开始 */
            let startTime = performance.now() - (State.pauseElapsed || 0) * 1000;
            
            const updateTimer = () => {
                if (State.isPaused) {
                    startTime = performance.now() - State.pauseElapsed * 1000;
                    return;
                }
                // 帧率限制：跳过本帧但仍继续排队，保证计时链路不断
                if (!FrameLimiter.allow()) {
                    State.searchTimer = requestAnimationFrame(updateTimer);
                    return;
                }
                
                const elapsed = (performance.now() - startTime) / 1000;
                State.pauseElapsed = elapsed;
                const remainingTime = _.max([0, State.currentSearchTime - elapsed]);
                
                if (remainingTime <= 0) {
                    this.completeSearch();
                } else {
                    State.searchTimer = requestAnimationFrame(updateTimer);
                }
            };
            
            State.searchTimer = requestAnimationFrame(updateTimer);
        },
        
        toggleSearchPause() {
            if (!State.isSearching && !State.isGlobalSearching) return;
            
            State.isPaused = !State.isPaused;
            
            const $pauseBtn = $('#pause-search-btn');
            const $overlay = $('#searching-overlay');
            if (State.isPaused) {
                $pauseBtn.html('<i class="fas fa-play"></i> 继续搜索');
                SoundManager.pauseAllSounds();
                /* 暂停时仅隐藏"搜索中"文字与读秒，保留斑马线遮罩 */
                $overlay.find('.ss-text, .ss-time').hide();
                if (State.searchTimer) {
                    cancelAnimationFrame(State.searchTimer);
                    State.searchTimer = null;
                }
                /* 取消物品间的过渡定时器，防止恢复时用旧 currentSearch 重复计时 */
                if (State.searchTransitionTimer) {
                    clearTimeout(State.searchTransitionTimer);
                    State.searchTransitionTimer = null;
                }
            } else {
                $pauseBtn.html('<i class="fas fa-pause"></i> 暂停搜索');
                SoundManager.resumeAllSounds();
                /* 继续搜索时恢复"搜索中"文字与读秒 */
                $overlay.find('.ss-text, .ss-time').show();
                if (State.isGlobalSearching) {
                    /* 全局搜索阶段继续：重新启动 2.20s 全局秒表（从暂停处接着走） */
                    this.resumeGlobalSearch();
                } else if (State.currentSearch === null && State.searchQueue.length > 0) {
                    /* 处于物品间过渡间隙：直接开始搜索队列中下一个物品 */
                    State.currentSearch = _.cloneDeep(_.first(State.searchQueue));
                    State.currentSearchTime = State.currentSearch.searchTime;
                    State.pauseElapsed = 0;
                    this.startSearchTimer();
                    UIManager.renderAllItems();
                } else if (State.currentSearch) {
                    /* 正在搜索某个物品：从暂停处继续计时 */
                    this.startSearchTimer();
                }
            }
            
            UIManager.updatePauseButtonState();
            UIManager.renderAllItems();
        },

        resumeGlobalSearch() {
            const $overlay = $('#searching-overlay');
            const $ssTime = $('#ss-time');
            const SEARCH_MS = 2200;
            let startTime = performance.now() - State.pauseElapsed;

            if (State.searchTimer) cancelAnimationFrame(State.searchTimer);

            const tick = () => {
                if (!State.isGlobalSearching) return;
                if (State.isPaused) {
                    startTime = performance.now() - State.pauseElapsed;
                    State.searchTimer = requestAnimationFrame(tick);
                    return;
                }
                // 帧率限制：跳过的帧不刷新读秒，但继续排队下一帧
                if (!FrameLimiter.allow()) {
                    State.searchTimer = requestAnimationFrame(tick);
                    return;
                }
                const elapsed = performance.now() - startTime;
                State.pauseElapsed = elapsed;
                if ($ssTime.length) $ssTime.text((elapsed / 1000).toFixed(2));

                if (elapsed >= SEARCH_MS) {
                    if ($ssTime.length) $ssTime.text('2.20');
                    if ($overlay.length) $overlay.attr('hidden', '');
                    State.isGlobalSearching = false;
                    /* 大遮罩消失后延迟 0.25s 再开始逐个搜索，避免视觉突兀 */
                    setTimeout(() => {
                        if (!State.isPaused) this.startSearch();
                    }, 250);
                } else {
                    State.searchTimer = requestAnimationFrame(tick);
                }
            };
            State.searchTimer = requestAnimationFrame(tick);
        },
        
        completeSearch() {
            if (State.searchTimer) {
                cancelAnimationFrame(State.searchTimer);
                State.searchTimer = null;
            }
            if (State.searchTransitionTimer) {
                clearTimeout(State.searchTransitionTimer);
                State.searchTransitionTimer = null;
            }

            const itemIndex = _.findIndex(State.items, { id: State.currentSearch.id });
            if (itemIndex !== -1) {
                State.items[itemIndex].searched = true;
                State.items[itemIndex].isFreshSearch = true;
            }
            
            /* 金色、橙色、红色品质物品揭示时四连振动（兼容 Cordova 与浏览器） */
            const _rarity = State.currentSearch.rarity;
            const _hvVibrateOn = window.__HIGH_VALUE_VIBRATE_ENABLED__ !== false;
            if (_hvVibrateOn && (_rarity === 'gold' || _rarity === 'orange' || _rarity === 'red')) {
                Utils.vibrate([80, 40, 80, 40, 80, 40, 80]);
            }
            
            State.searchQueue = _.tail(State.searchQueue);
            State.searchedItems++;
            State.totalSearchedItems++;
            State.totalValue += State.currentSearch.value;
            State.searchTime += State.currentSearch.searchTime;
            
            StatsManager.updateAccumulatedValue(State.currentSearch.value);
            
            if (State.currentSearch.value > State.highestValue) {
                State.highestValue = State.currentSearch.value;
            }
            if (State.currentSearch.value > State.highestValueEver) {
                State.highestValueEver = State.currentSearch.value;
            }
            
            const searchTime = new Date().toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
            });
            
            State.inventory = _.concat([{ 
                ...State.currentSearch, 
                searchedAt: searchTime 
            }], State.inventory);
            
            try {
                if (typeof window.SampleManager !== 'undefined' && State.currentSearch.name) {
                    window.SampleManager.onItemCollected(State.currentSearch.name);
                }
            } catch (e) {
                console.error('SampleManager.onItemCollected error:', e);
            }
            
            CollectionManager.onCollected(State.currentSearch);
            
            if (State.currentSearch.sound && _.trim(State.currentSearch.sound) !== '' && !State.isPaused) {
                SoundManager.playItemSound(State.currentSearch.sound);
            }
            
            UIManager.updateStats();
            UIManager.updateInventory();
            UIManager.renderAllItems();
            
            if (_.isEmpty(State.searchQueue)) {
                State.isSearching = false;
                State.isPaused = false;
                State.currentSearch = null;
                /* 一轮搜完：恢复"打开保险"按钮，避免按钮一直 disabled 导致点了完全没反应 */
                State.isOpenSafeBtnDisabled = false;
                $('#open-safe-btn').prop('disabled', false).html('<i class="fas fa-hand-pointer"></i> 打开保险');
                $('#pause-search-btn').html('<i class="fas fa-pause"></i> 暂停搜索');
                UIManager.updatePauseButtonState();
                UIManager.updateResetButtonState();
                this.stopOpenSafeSound();
            } else {
                /* 清空 currentSearch，标记处于物品间过渡间隙，防止暂停时误用旧数据 */
                State.currentSearch = null;
                /* 正常搜索间隔 560ms，迅捷巧手时无延迟立即搜索下一个 */
                const swift = typeof SkillManager !== 'undefined' ? SkillManager.getSkillState('swift_hands') : { owned: false, enabled: false };
                const nextDelay = (swift.owned && swift.enabled) ? 0 : 560;
                State.searchTransitionTimer = setTimeout(() => {
                    State.searchTransitionTimer = null;
                    if (State.isPaused) return; /* 暂停期间不自动开始，由恢复按钮触发 */
                    State.currentSearch = _.cloneDeep(_.first(State.searchQueue));
                    State.currentSearchTime = State.currentSearch.searchTime;
                    State.pauseElapsed = 0;
                    this.startSearchTimer();
                    UIManager.renderAllItems();
                }, nextDelay);
            }
        },
        
        resetGame() {
            const hadItems = State.items.length > 0 || State.inventory.length > 0;
            
            if (State.searchTimer) {
                cancelAnimationFrame(State.searchTimer);
                State.searchTimer = null;
            }
            if (State.searchTransitionTimer) {
                clearTimeout(State.searchTransitionTimer);
                State.searchTransitionTimer = null;
            }
            
            this.stopOpenSafeSound();
            SoundManager.clearCache();
            
            if (hadItems) Utils.playAudio('reset-game-audio', { volume: 1 });
            
            this.resetGameState();
            
            $('#open-safe-btn')
                .prop('disabled', false)
                .html('<i class="fas fa-hand-pointer"></i> 打开保险');
            
            $('#pause-search-btn').html('<i class="fas fa-pause"></i> 暂停搜索');
            UIManager.updatePauseButtonState();
            UIManager.updateResetButtonState();
            
            UIManager.createGridCells();
            UIManager.updateStats();
            UIManager.updateInventory();
            $('#searching-overlay').attr('hidden', '');
        },
        
        resetGameState() {
            StatsManager.resetSessionStats();
            
            _.assign(State, {
                items: [],
                searchQueue: [],
                currentSearch: null,
                searchedItems: 0,
                totalValue: 0,
                highestValue: 0,
                searchTime: 0,
                inventory: [],
                grid: _.times(Config.grid.rows, () => _.times(Config.grid.cols, () => 0)),
                isSearching: false,
                isGlobalSearching: false,
                isPaused: false,
                searchTimer: null,
                searchTransitionTimer: null,
                currentSearchTime: 0,
                isFirstOpen: true,
                isOpenSafeBtnDisabled: false,
                pauseStartTime: 0,
                pauseElapsed: 0,
                sessionAccumulatedValue: 0
            });
        },
        
        stopOpenSafeSound() {
            const $audio = $('#open-safe-audio');
            if ($audio.length) {
                $audio[0].pause();
                $audio[0].currentTime = 0;
            }
        }
    };

    class ModalManager {
        constructor() {
            this.currentImageIndex = { donate: 0 };
        }
        
        openDonateModal() {
            this.setupImageCarousel('donate', Assets.donate);
            this.showModal('donate-modal');
        }
        
        setupImageCarousel(type, images) {
            const $imagesContainer = $(`#${type}-images`);
            const $indicatorsContainer = $(`#${type}-indicators`);
            
            $imagesContainer.empty();
            $indicatorsContainer.empty();
            
            if (!images || images.length === 0) {
                $imagesContainer.html('<div style="color:#999;padding:20px;">暂无图片</div>');
                return;
            }
            
            _.each(images, (image, index) => {
                const $img = Utils.createElement('img', {
                    className: 'carousel-image',
                    attributes: { 
                        src: _.isString(image) ? image : image.image,
                        alt: `${type} image ${index + 1}`
                    }
                });
                if (index === 0) $img.addClass('active');
                $imagesContainer.append($img);
            });
            
            _.each(images, (_, index) => {
                const $indicator = Utils.createElement('div', {
                    className: 'carousel-indicator',
                    attributes: { 'data-index': index }
                });
                if (index === 0) $indicator.addClass('active');
                $indicator.on('click', () => this.goToImage(type, index));
                $indicatorsContainer.append($indicator);
            });
            
            this.currentImageIndex[type] = 0;
        }
        
        goToImage(type, index) {
            const $images = $(`#${type}-images .carousel-image`);
            const $indicators = $(`#${type}-indicators .carousel-indicator`);
            
            $images.removeClass('active');
            $indicators.removeClass('active');
            
            if ($images.eq(index).length) $images.eq(index).addClass('active');
            if ($indicators.eq(index).length) $indicators.eq(index).addClass('active');
            
            this.currentImageIndex[type] = index;
        }
        
        prevImage(type) {
            const images = Assets[type] || [];
            const imageCount = images.length;
            if (imageCount === 0) return;
            const prevIndex = (this.currentImageIndex[type] - 1 + imageCount) % imageCount;
            this.goToImage(type, prevIndex);
        }
        
        nextImage(type) {
            const images = Assets[type] || [];
            const imageCount = images.length;
            if (imageCount === 0) return;
            const nextIndex = (this.currentImageIndex[type] + 1) % imageCount;
            this.goToImage(type, nextIndex);
        }
        
        // 开关音效 / 时长 / id 全部登记在 js/modal-registry.js
        showModal(modalId) {
            if (window.ModalRegistry) return ModalRegistry.open(modalId);
            const $modal = $(`#${modalId}`);
            if (!$modal.length) return;
            $modal.css('display', 'flex');
            _.delay(() => $modal.addClass('show'), 10);
        }
        
        closeModal(modalId) {
            if (window.ModalRegistry) return ModalRegistry.close(modalId);
            const $modal = $(`#${modalId}`);
            if (!$modal.length) return;
            const hideDelay = $modal.hasClass('app-full-page') ? 360 : 300;
            $modal.removeClass('show');
            _.delay(() => $modal.css('display', 'none'), hideDelay);
        }
    }

    const SettingsManager = {
        loadSettings() {
            this.updateItemPool();
        },
        
        updateItemPool() {
            allItemsConfig = itemsConfig.slice();
            // Mod 物品合并（启用中的物品类 Mod）
            if (window.ModManager && typeof window.ModManager.getEnabledItems === 'function') {
                try {
                    var modItems = window.ModManager.getEnabledItems();
                    if (modItems && modItems.length) allItemsConfig = allItemsConfig.concat(modItems);
                } catch (e) {}
            }
        }
    };

/* ========== 物品旋转 / 边缘换位 ==========
 * - 点击已搜索物品：横竖变向（旋转 90°）
 * - 旋转后原地放不下时，与阻挡物品交换位置（边缘换位）
 * - 交换失败则恢复原朝向，不做任何改动
 */
const ItemDragManager = {
    init() {
        // 已移除长按拖拽与选中移动机制，物品交互仅保留点击旋转/换位
    },

    // 点击物品：尝试旋转，放不下则与阻挡物品交换位置
    rotateOrSwap(item) {
        if (!item || item.width === item.height) return false; // 正方形无需变向

        const oldRow = item.row, oldCol = item.col;
        const oldW = item.width, oldH = item.height;
        const oldRotated = item.rotated;

        GameCore.removeItemFromGrid(item, State.grid);

        // 1. 尝试在原位旋转
        GameCore.rotateItem(item);
        if (GameCore.canPlaceItem(item, oldRow, oldCol, State.grid)) {
            GameCore.placeItem(item, oldRow, oldCol, State.grid);
            return true;
        }

        // 2. 原位放不下：找到阻挡物品，尝试交换（旋转后的 item 去 blocker 位置，blocker 来 item 原位）
        const blocker = this.findBlockerAt(item, oldRow, oldCol);
        if (blocker && blocker.id !== item.id) {
            GameCore.removeItemFromGrid(blocker, State.grid);
            const blockerOldRow = blocker.row, blockerOldCol = blocker.col;

            const itemFits = GameCore.canPlaceItem(item, blockerOldRow, blockerOldCol, State.grid);
            const blockerFits = GameCore.canPlaceItem(blocker, oldRow, oldCol, State.grid);

            if (itemFits && blockerFits) {
                GameCore.placeItem(item, blockerOldRow, blockerOldCol, State.grid);
                GameCore.placeItem(blocker, oldRow, oldCol, State.grid);
                return true;
            }

            // 交换失败，恢复 blocker
            GameCore.placeItem(blocker, blockerOldRow, blockerOldCol, State.grid);
        }

        // 3. 全部失败：恢复原朝向与位置
        item.width = oldW;
        item.height = oldH;
        item.rotated = oldRotated;
        GameCore.placeItem(item, oldRow, oldCol, State.grid);
        return false;
    },

    // 找到占据 (row, col) 起 item 尺寸区域的物品
    findBlockerAt(item, row, col) {
        for (let r = row; r < row + item.height; r++) {
            for (let c = col; c < col + item.width; c++) {
                if (r < 0 || r >= Config.grid.rows || c < 0 || c >= Config.grid.cols) continue;
                const id = State.grid[r][c];
                if (id && id !== item.id) {
                    return _.find(State.items, { id });
                }
            }
        }
        return null;
    }
};

const EventManager = {
    init() {
        this.bindGameEvents();
        this.bindModalEvents();
        this.bindTooltipEvents();
        this.bindItemControlEvents();
        this.bindRarityDropdown();
        ItemDragManager.init();
        
        $(document).on('click', function(e) {
            const $target = $(e.target);
            if ($target.closest('.item, .inventory-item, #ui-sound-volume-slider, .music-volume-slider, .music-volume-fill, #toast-toggle, .switch, .modal-overlay, #profile-nickname, #profile-edit-nickname-icon, #sidebar-notification-btn, #sidebar-view-leaderboard-btn').length) {
                return;
            }
            Utils.playAudio('click-audio', { volume: 1 });
        });
    },
    
    bindRarityDropdown() {
        const $trigger = $('#rarity-dropdown-trigger');
        const $menu = $('#rarity-dropdown-menu');
        const $text = $('#rarity-dropdown-text');
        
        $trigger.on('click', function(e) {
            e.stopPropagation();
            $menu.toggleClass('show');
        });
        
        $menu.find('.dropdown-item').on('click', function() {
            const value = $(this).data('value');
            const label = $(this).text().trim();
            
            $menu.find('.dropdown-item').removeClass('selected');
            $(this).addClass('selected');
            $text.text(label);
            $menu.removeClass('show');
            
            const searchTerm = $('#item-search-input').val();
            ItemControlManager.renderItemList(searchTerm, value);
        });
        
        $(document).on('click', function() {
            $menu.removeClass('show');
        });
    },
    
    bindGameEvents() {
        const gameEvents = {
            '#open-safe-btn': () => {
                Utils.playAudio('click-audio', { volume: 1 });
                GameController.openSafe();
            },
            '#reset-btn': (e) => {
                if ($(e.target).prop('disabled')) return;
                Utils.playAudio('click-audio', { volume: 1 });
                GameController.resetGame();
            },
            '#play-sound-btn': () => {
                Utils.playAudio('click-audio', { volume: 1 });
                SoundManager.playSpecialSoundRandom();
            },
            '#pause-search-btn': (e) => {
                if ($(e.target).prop('disabled')) return;
                Utils.playAudio('click-audio', { volume: 1 });
                GameController.toggleSearchPause();
            },
            '#more-button': () => {
                Utils.playAudio('click-audio', { volume: 1 });
                this.openSidebar();
            }
        };
        
        _.each(gameEvents, (handler, selector) => {
            $(selector).on('click', handler);
        });
    },
    
    bindTooltipEvents() {
        const $safeGrid = $('#safe-grid');
        
        $safeGrid.on('click', '.item.searched', function(e) {
            const itemId = $(this).data('id');
            const item = _.find(State.items, { id: itemId });
            if (!item || !item.searched) return;

            const $tooltip = $('#item-tooltip');
            const element = this;
            
            if ($tooltip.is(':visible') && $tooltip.data('currentItemId') === itemId) {
                TooltipManager.hide();
                $tooltip.removeData('currentItemId');
                return;
            }
            
            // 点击瞬间就把锚点定下来，避免 50ms 后元素已被重排导致弹窗落到屏幕角落
            const rect = element.getBoundingClientRect();
            const anchor = {
                rect: (rect.width > 0 || rect.height > 0) ? rect : null,
                x: e.clientX,
                y: e.clientY
            };
            
            TooltipManager.hide();
            
            setTimeout(() => {
                TooltipManager.show(item, element, anchor);
                $tooltip.data('currentItemId', itemId);
                
                if (item.sound && _.trim(item.sound) !== '' && !State.isPaused) {
                    SoundManager.playItemSound(item.sound);
                }
            }, 50);
        });
        
        $('#inventory-list').on('click', '.inventory-item', function(e) {
            const index = $(this).index();
            const item = State.inventory[index];
            if (!item) return;
            
            if (item.sound && _.trim(item.sound) !== '' && !State.isPaused) {
                SoundManager.playItemSound(item.sound);
            }
        });
        
        $(document).on('click touchstart', function(e) {
            const $tooltip = $('#item-tooltip');
            if ($tooltip.is(':visible') && !$(e.target).closest('#item-tooltip, .item.searched, .inventory-item').length) {
                TooltipManager.hide();
                $tooltip.removeData('currentItemId');
            }
        });
        
        TooltipManager.enableDrag();
    },
    
    bindModalEvents() {
        $('#sidebar-close, #sidebar-overlay').on('click', () => this.closeSidebar());
        this.bindSidebarEvents();
        this.bindModalCloseEvents();
        this.bindCarouselEvents();
        this.bindBgSelectEvents();
        this.bindCollectEvents();
    },
    
    bindSidebarEvents() {
        const sidebarEvents = {
            '#sidebar-credits-btn': () => { 
                this.openModal('credits-modal'); 
            },
            '#sidebar-donate-btn': () => { 
                modalManager.openDonateModal(); 
            },
            '#sidebar-bg-select-btn': () => { 
                BackgroundManager.openSelector(); 
            },
            '#sidebar-collect-btn': () => { 
                CollectionManager.open(); 
            },
            '#sidebar-shop-btn': () => {
                ShopManager.openModal();
            }
        };
        
        _.each(sidebarEvents, (handler, selector) => {
            $(selector).on('click', handler);
        });
        
        $(document).on('click', '#profile-title-row', function() {
            // 段位图标资源包未下载时阻止打开 —— 引导用户去资源下载
            const RDM = window.ResourceDownloadManager;
            if (RDM && typeof RDM.isTitlesDownloaded === 'function' && !RDM.isTitlesDownloaded()) {
                if (window.showToast) window.showToast('请先在资源下载中下载段位图标');
                if (RDM && typeof RDM.openModal === 'function') RDM.openModal();
                return;
            }
            const audio = new Audio('audio/open-title.mp3');
            audio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
            audio.play().catch(() => {});
            TitleManager.renderTitleModal();
            $('#title-modal').css('display', 'flex');
            _.delay(() => $('#title-modal').addClass('show'), 10);
        });
        
        $('#title-modal-close').on('click', function() {
            const audio = new Audio('audio/sidebar-close.mp3');
            audio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
            audio.play().catch(() => {});
            $('#title-modal').removeClass('show');
            _.delay(() => $('#title-modal').css('display', 'none'), 300);
        });
        
        $('#title-modal').on('click', function(e) {
            if ($(e.target).is(this)) {
                const audio = new Audio('audio/sidebar-close.mp3');
                audio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
                audio.play().catch(() => {});
                $('#title-modal').removeClass('show');
                _.delay(() => $('#title-modal').css('display', 'none'), 300);
            }
        });
    },
    
    bindBgSelectEvents() {
        $('#bg-select-close').on('click', () => {
            Utils.playAudio('click-audio', { volume: 1 });
            this.closeModal('bg-select-modal');
        });
        
        $('#bg-confirm-btn').on('click', () => {
            BackgroundManager.confirmSelection();
        });
        
        $('#bg-buy-btn').on('click', () => {
            try {
                const buyAudio = new Audio('audio/buy.mp3');
                buyAudio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
                buyAudio.play().catch(() => {});
            } catch (e) {}
            setTimeout(() => BackgroundManager.buyCurrentBackground(), 50);
        });
        
        $(document).on('click', '#bg-preview-btn', () => {
            BackgroundManager.previewCurrentBackground();
        });

        // 加入 / 取消喜好
        $('#bg-favorite-btn').on('click', () => {
            const bg = BackgroundManager.backgrounds[BackgroundManager.currentIndex];
            if (!bg) return;
            if (!BackgroundManager.isBackgroundUnlocked(bg.id)) {
                if (window.showToast) window.showToast('该背景尚未解锁，请先购买');
                return;
            }
            BackgroundFavorites.toggle(bg.id);
            BackgroundFavorites.updateFavoriteBtn();
            BackgroundManager.buildGrid();
            if (window.showToast) {
                window.showToast(BackgroundFavorites.has(bg.id) ? '已加入喜好' : '已取消喜好');
            }
        });

        // 背景设置弹窗
        $('#bg-settings-open-btn').on('click', () => {
            BackgroundFavorites.openSettingsModal();
        });
        $('#bg-settings-close').on('click', () => BackgroundFavorites.closeSettingsModal());
        $('#bg-settings-save').on('click', () => BackgroundFavorites.saveSettings());
        $('#bg-favorites-play').on('change', function () {
            BackgroundFavorites._syncCustomBgRow();
            // 立即处理：开启轮放则删自定义；关闭轮放保留自定义
            if (this.checked) {
                BackgroundFavorites._deleteCustomBg();
            }
            $('#bg-settings-desc').toggle(this.checked);
        });
        // 背景设置弹窗内自定义背景按钮
        $('#bg-settings-custom-bg-btn').on('click', () => {
            if (window.CustomBackground) window.CustomBackground.pick();
        });
        $('#bg-settings-custom-bg-clear-btn').on('click', () => {
            if (window.CustomBackground) window.CustomBackground.clear();
        });
        $('#bg-settings-custom-file-input').on('change', function () {
            const file = this.files && this.files[0];
            if (file && window.CustomBackground) window.CustomBackground.handleFile(file);
            // 重置让同一文件可重复选
            this.value = '';
        });
        $('#bg-settings-modal').on('click', function (e) {
            if ($(e.target).is(this)) BackgroundFavorites.closeSettingsModal();
        });

        $('#bg-select-modal').on('click', function(e) {
            if ($(e.target).is(this)) {
                Utils.playAudio('click-audio', { volume: 1 });
                EventManager.closeModal('bg-select-modal');
            }
        });

        $('#donate-modal').on('click', function(e) {
            if ($(e.target).is(this)) {
                modalManager.closeModal('donate-modal');
            }
        });
    },
    
    bindCollectEvents() {
        $('#collect-back').on('click', () => {
            CollectionManager.close();
        });
        
        $('#collect-prev').on('click', () => {
            Utils.playAudio('click-audio', { volume: 1 });
            CollectionManager.prev();
        });
        
        $('#collect-next').on('click', () => {
            Utils.playAudio('click-audio', { volume: 1 });
            CollectionManager.next();
        });
    },
    
    bindModalCloseEvents() {
        const modalCloses = {
            '#credits-close': () => this.closeModal('credits-modal'),
            '#donate-close': () => modalManager.closeModal('donate-modal'),
            '#submit-score-close': () => this.closeModal('submit-score-modal')
        };
        
        _.each(modalCloses, (handler, selector) => {
            $(selector).on('click', handler);
        });
    },
    
    bindCarouselEvents() {
        const carouselEvents = {
            '#donate-prev': () => { 
                Utils.playAudio('click-audio', { volume: 1 }); 
                modalManager.prevImage('donate'); 
            },
            '#donate-next': () => { 
                Utils.playAudio('click-audio', { volume: 1 }); 
                modalManager.nextImage('donate'); 
            }
        };
        
        _.each(carouselEvents, (handler, selector) => {
            $(selector).on('click', handler);
        });
    },
    
    bindItemControlEvents() {
        // 物品池管理不再需要密码校验，点开直接进入
        $('#sidebar-item-control-btn').on('click', () => {
            // 需解锁（赞助兑换码）
            var unlocked = false;
            try { unlocked = localStorage.getItem('ab_item_control_unlocked') === '1'; } catch (e) {}
            if (!unlocked) {
                if (window.ModalRegistry) ModalRegistry.open('item-unlock-modal');
                else { $('#item-unlock-modal').css('display', 'flex'); setTimeout(function(){ $('#item-unlock-modal').addClass('show'); }, 10); }
                return;
            }
            ItemControlManager.renderItemList();
            const audio = new Audio('audio/open-item-control.mp3');
            audio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
            audio.play().catch(() => {});
            $('#item-control-modal').css('display', 'flex');
            _.delay(() => $('#item-control-modal').addClass('show'), 10);
        });
        
        $('#item-unlock-close').on('click', () => {
            $('#item-unlock-modal').removeClass('show');
            _.delay(() => $('#item-unlock-modal').css('display', 'none'), 300);
        });
        $('#item-unlock-qq-copy').on('click', () => {
            if (navigator.clipboard) navigator.clipboard.writeText('2312367270').then(() => { if (window.showToast) window.showToast('QQ 已复制：2312367270'); });
            else if (window.showToast) window.showToast('QQ：2312367270');
        });
        $('#item-unlock-gotoredeem').on('click', () => {
            $('#item-unlock-modal').removeClass('show');
            _.delay(() => {
                $('#item-unlock-modal').css('display', 'none');
                if (window.ModalRegistry) ModalRegistry.open('redeem-code-modal');
                else { $('#redeem-code-modal').css('display', 'flex'); setTimeout(() => $('#redeem-code-modal').addClass('show'), 10); }
            }, 260);
        });

        $('#item-control-close').on('click', () => {
            const audio = new Audio('audio/sidebar-close.mp3');
            audio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
            audio.play().catch(() => {});
            $('#item-control-modal').removeClass('show');
            _.delay(() => $('#item-control-modal').css('display', 'none'), 300);
        });
        
        $('#item-search-input').on('input', () => {
            const searchTerm = $('#item-search-input').val();
            const rarityFilter = $('#rarity-dropdown-menu .dropdown-item.selected').data('value') || 'all';
            ItemControlManager.renderItemList(searchTerm, rarityFilter);
        });
        
        $('#disable-all-items-btn').on('click', () => {
            const $customConfirm = $('#custom-confirm-modal');
            if (!$customConfirm.length) {
                $('body').append(`
                    <div class="modal-overlay" id="custom-confirm-modal">
                        <div class="modal-content" style="max-width:380px;">
                            <div class="modal-header">
                                <div class="modal-title"><i class="fas fa-exclamation-triangle" style="color:#f59e0b;"></i> 确认操作</div>
                                <button class="modal-close" id="custom-confirm-close">&times;</button>
                            </div>
                            <div class="modal-body" style="padding:20px 0;text-align:center;">
                                <div style="font-size:48px;color:#f59e0b;margin-bottom:16px;"><i class="fas fa-ban"></i></div>
                                <div style="color:#e2e8f0;font-size:15px;margin-bottom:8px;font-weight:500;">确定要禁用所有物品吗？</div>
                                <div style="color:#94a3b8;font-size:13px;">这将导致无法生成任何物品。</div>
                            </div>
                            <div class="modal-footer" style="justify-content:center;gap:12px;">
                                <button class="modal-btn" id="custom-confirm-cancel" style="min-width:100px;">取消</button>
                                <button class="modal-btn danger" id="custom-confirm-ok" style="min-width:100px;background:#ef4444;border-color:#ef4444;">确认禁用</button>
                            </div>
                        </div>
                    </div>
                `);
                
                $('#custom-confirm-close, #custom-confirm-cancel').on('click', () => {
                    const audio = new Audio('audio/sidebar-close.mp3');
                    audio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
                    audio.play().catch(() => {});
                    $('#custom-confirm-modal').removeClass('show');
                    _.delay(() => $('#custom-confirm-modal').css('display', 'none'), 300);
                });
                
                $('#custom-confirm-ok').on('click', () => {
                    const audio = new Audio('audio/sidebar-close.mp3');
                    audio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
                    audio.play().catch(() => {});
                    $('#custom-confirm-modal').removeClass('show');
                    _.delay(() => $('#custom-confirm-modal').css('display', 'none'), 300);
                    ItemControlManager.disableAll();
                    const rarityFilter = $('#rarity-dropdown-menu .dropdown-item.selected').data('value') || 'all';
                    ItemControlManager.renderItemList($('#item-search-input').val(), rarityFilter);
                    if (window.showToast) window.showToast('所有物品已被禁用');
                });
            }
            
            const audio = new Audio('audio/open-confirm-disable.mp3');
            audio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
            audio.play().catch(() => {});
            $('#custom-confirm-modal').css({ display: 'flex', zIndex: 10100 });
            _.delay(() => $('#custom-confirm-modal').addClass('show'), 10);
        });
        
        $('#enable-all-items-btn').on('click', () => {
            const $customConfirm = $('#enable-confirm-modal');
            if (!$customConfirm.length) {
                $('body').append(`
                    <div class="modal-overlay" id="enable-confirm-modal">
                        <div class="modal-content" style="max-width:380px;">
                            <div class="modal-header">
                                <div class="modal-title"><i class="fas fa-check-circle" style="color:#22c55e;"></i> 确认操作</div>
                                <button class="modal-close" id="enable-confirm-close">&times;</button>
                            </div>
                            <div class="modal-body" style="padding:20px 0;text-align:center;">
                                <div style="font-size:48px;color:#22c55e;margin-bottom:16px;"><i class="fas fa-check-double"></i></div>
                                <div style="color:#e2e8f0;font-size:15px;margin-bottom:8px;font-weight:500;">确定要启用所有物品吗？</div>
                                <div style="color:#94a3b8;font-size:13px;">所有物品将恢复正常生成。</div>
                            </div>
                            <div class="modal-footer" style="justify-content:center;gap:12px;">
                                <button class="modal-btn" id="enable-confirm-cancel" style="min-width:100px;">取消</button>
                                <button class="modal-btn primary" id="enable-confirm-ok" style="min-width:100px;">确认启用</button>
                            </div>
                        </div>
                    </div>
                `);
                
                $('#enable-confirm-close, #enable-confirm-cancel').on('click', () => {
                    const audio = new Audio('audio/sidebar-close.mp3');
                    audio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
                    audio.play().catch(() => {});
                    $('#enable-confirm-modal').removeClass('show');
                    _.delay(() => $('#enable-confirm-modal').css('display', 'none'), 300);
                });
                
                $('#enable-confirm-ok').on('click', () => {
                    const audio = new Audio('audio/sidebar-close.mp3');
                    audio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
                    audio.play().catch(() => {});
                    $('#enable-confirm-modal').removeClass('show');
                    _.delay(() => $('#enable-confirm-modal').css('display', 'none'), 300);
                    ItemControlManager.enableAll();
                    const rarityFilter = $('#rarity-dropdown-menu .dropdown-item.selected').data('value') || 'all';
                    ItemControlManager.renderItemList($('#item-search-input').val(), rarityFilter);
                    if (window.showToast) window.showToast('所有物品已被启用');
                });
            }
            
            const audio = new Audio('audio/open-confirm-enable.mp3');
            audio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
            audio.play().catch(() => {});
            $('#enable-confirm-modal').css({ display: 'flex', zIndex: 10100 });
            _.delay(() => $('#enable-confirm-modal').addClass('show'), 10);
        });

        $('#edit-accumulated-value-btn').on('click', function() {
            const currentValue = ItemControlManager.getAccumulatedValue();
            $('#accumulated-value-input').val(currentValue);
            $('#accumulated-value-error').hide();
            const audio = new Audio('audio/open-accumulated-value.mp3');
            audio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
            audio.play().catch(() => {});
            $('#accumulated-value-modal').css('display', 'flex');
            _.delay(() => $('#accumulated-value-modal').addClass('show'), 10);
        });

        $('#accumulated-value-confirm').on('click', function() {
            const inputVal = $('#accumulated-value-input').val().trim();
            if (!inputVal) {
                $('#accumulated-value-error').text('请输入数值').show();
                return;
            }
            
            const value = parseAccumulatedValue(inputVal);
            if (isNaN(value) || value < 0) {
                $('#accumulated-value-error').text('请输入有效数值（支持 K/M 单位）').show();
                return;
            }
            
            ItemControlManager.setAccumulatedValue(Math.round(value));
            
            const audio = new Audio('audio/sidebar-close.mp3');
            audio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
            audio.play().catch(() => {});
            $('#accumulated-value-modal').removeClass('show');
            _.delay(() => $('#accumulated-value-modal').css('display', 'none'), 300);
            
            if (window.showToast) window.showToast('总累计价值已更新');
        });

        $('#accumulated-value-cancel, #accumulated-value-close').on('click', function() {
            const audio = new Audio('audio/sidebar-close.mp3');
            audio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
            audio.play().catch(() => {});
            $('#accumulated-value-modal').removeClass('show');
            _.delay(() => $('#accumulated-value-modal').css('display', 'none'), 300);
        });

        $('#accumulated-value-input').on('keydown', function(e) {
            if (e.key === 'Enter') {
                $('#accumulated-value-confirm').click();
            }
        });
    },
    
    openSidebar() {
        const audio = new Audio('audio/sidebar-open.mp3');
        audio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
        audio.play().catch(() => {});
        $('#sidebar').addClass('show');
        $('#sidebar-overlay').css('display', 'block');
    },
    
    closeSidebar() {
        const audio = new Audio('audio/sidebar-close.mp3');
        audio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
        audio.play().catch(() => {});
        $('#sidebar').removeClass('show');
        $('#sidebar-overlay').css('display', 'none');
    },
    
    // 开关音效 / 时长 / id 全部登记在 js/modal-registry.js
    openModal(modalId) {
        if (window.ModalRegistry) return ModalRegistry.open(modalId);
        const $modal = $(`#${modalId}`);
        if (!$modal.length) return;
        $modal.css('display', 'flex');
        _.delay(() => $modal.addClass('show'), 10);
    },
    
    closeModal(modalId) {
        if (window.ModalRegistry) return ModalRegistry.close(modalId);
        const $modal = $(`#${modalId}`);
        if (!$modal.length) return;
        $modal.removeClass('show');
        _.delay(() => $modal.css('display', 'none'), 300);
    }
};

    const modalManager = new ModalManager();
    window.modalManager = modalManager;

    async function init() {
        try {
            SoundManager.initAudioPool();
            SoundManager.startCleanupInterval();
            UIManager.createGridCells();
            SettingsManager.loadSettings();
            EventManager.init();
            
            StatsManager.loadAccumulatedStats();
            ShopManager.load();
            CollectionManager.load();

            itemsConfig = await GameCore.loadItemsFromXML();
            
            SettingsManager.updateItemPool();
            
            State.grid = _.times(Config.grid.rows, () => _.times(Config.grid.cols, () => 0));
            
            UIManager.updateStats();
            UIManager.updateInventory();
            UIManager.updatePauseButtonState();
            UIManager.updateResetButtonState();
            
            StatsManager.updateAccumulatedValueDisplay();
            TitleManager.updateTitleDisplay();
            
            await BackgroundManager.loadBackgrounds();
            // 「播放喜好的壁纸」：开启时每次进入随机切换一张喜好背景（确定性应用并持久化），
            // 此时跳过「上次保存/默认背景」与「自定义背景恢复」，避免覆盖随机结果
            const enteredFavorite = BackgroundFavorites.pickRandomFavoriteOnEntry();
            if (!enteredFavorite) {
                const savedPath = localStorage.getItem(BackgroundManager.storageKey);
                if (!savedPath) {
                    BackgroundManager.applyBackground(BackgroundManager.backgrounds[0].path);
                } else {
                    BackgroundManager.loadSavedBackground();
                }
            }
            // 自定义（相册上传）背景优先于内置背景
            CustomBackground.bind();
            if (!enteredFavorite) CustomBackground.restore();

            // 效果设置：动画帧率（30 / 60 / 无上限）
            (function initFpsOption() {
                const $group = $('#fps-option-group');
                if (!$group.length) return;
                const sync = () => {
                    $group.find('.fps-option-btn').removeClass('active');
                    $group.find('.fps-option-btn[data-fps="' + FrameLimiter.mode + '"]').addClass('active');
                };
                $group.on('click', '.fps-option-btn', function() {
                    FrameLimiter.set($(this).attr('data-fps'));
                    sync();
                });
                sync();
            })();

            // 效果设置：跳过搜索遮罩（默认显示遮罩，用户勾选后跳过）
            (function initSearchMaskToggle() {
                const STORAGE_KEY = 'ab_skip_search_mask';
                const $toggle = $('#search-mask-toggle');
                if (!$toggle.length) return;
                try {
                    $toggle.prop('checked', localStorage.getItem(STORAGE_KEY) === '1');
                } catch (e) {}
                $toggle.on('change', function() {
                    try {
                        localStorage.setItem(STORAGE_KEY, this.checked ? '1' : '0');
                    } catch (e) {}
                });
            })();

            window.toggleSearchPause = GameController.toggleSearchPause.bind(GameController);

            // 页面关闭/隐藏时自动保存收藏室数据
            const _saveCollection = () => CollectionManager.save();
            window.addEventListener('beforeunload', _saveCollection);
            window.addEventListener('pagehide', _saveCollection);
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') CollectionManager.save();
            });

            // 请求持久化存储，防止浏览器/WebView 自动清理 localStorage
            if (navigator.storage && navigator.storage.persist) {
                navigator.storage.persist().catch(() => {});
            }
        } catch (error) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /* ============================================================
     * 资源下载管理器 (ResourceDownloadManager)
     * - 从 GitHub 拉取背景与音乐 manifest
     * - 使用 IndexedDB 存储下载的资源 blob
     * - 覆盖 BackgroundManager / MusicPlayer 以从 IndexedDB 解析路径
     * ============================================================ */
    const ResourceDownloadManager = {
        // CDN 优先（国内可访问），GitHub raw 作为兜底
        bgManifestUrls: [
            'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-bg-resources@main/manifest.json',
            'https://anqu-raw.sdfgasdfgwe7.workers.dev/incredibox-Para-DX/anqu-bg-resources/main/manifest.json',
            'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-bg-resources/main/manifest.json'
        ],
        bgBaseUrls: [
            'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-bg-resources@main/',
            'https://anqu-raw.sdfgasdfgwe7.workers.dev/incredibox-Para-DX/anqu-bg-resources/main/',
            'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-bg-resources/main/'
        ],
        musicManifestUrls: [
            'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-music-resources@main/manifest.json',
            'https://anqu-raw.sdfgasdfgwe7.workers.dev/incredibox-Para-DX/anqu-music-resources/main/manifest.json',
            'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-music-resources/main/manifest.json'
        ],
        musicBaseUrls: [
            'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-music-resources@main/',
            'https://anqu-raw.sdfgasdfgwe7.workers.dev/incredibox-Para-DX/anqu-music-resources/main/',
            'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-music-resources/main/'
        ],
        // 段位徽章图标资源包（结构同背景/音乐：manifest.json + 图标文件）
        titleManifestUrls: [
            'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-title-resources@main/manifest.json',
            'https://anqu-raw.sdfgasdfgwe7.workers.dev/incredibox-Para-DX/anqu-title-resources/main/manifest.json',
            'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-title-resources/main/manifest.json'
        ],
        titleBaseUrls: [
            'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-title-resources@main/',
            'https://anqu-raw.sdfgasdfgwe7.workers.dev/incredibox-Para-DX/anqu-title-resources/main/',
            'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-title-resources/main/'
        ],
        minigameManifestUrls: [
            'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-minigame-resources@main/manifest.json',
            'https://anqu-raw.sdfgasdfgwe7.workers.dev/incredibox-Para-DX/anqu-minigame-resources/main/manifest.json',
            'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-minigame-resources/main/manifest.json'
        ],
        minigameBaseUrls: [
            'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-minigame-resources@main/',
            'https://anqu-raw.sdfgasdfgwe7.workers.dev/incredibox-Para-DX/anqu-minigame-resources/main/',
            'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-minigame-resources/main/'
        ],
        bgManifestCacheKey: 'ab_bg_manifest_cache_v1',
        musicManifestCacheKey: 'ab_music_manifest_cache_v1',
        titleManifestCacheKey: 'ab_title_manifest_cache_v1',
        minigameManifestCacheKey: 'ab_minigame_manifest_cache_v1',
        dbName: 'anqu_resources',
        storeName: 'assets',
        downloadedKey: 'ab_downloaded_assets',
        defaultBgPath: 'backgrounds/background.mp4',
        defaultMusicFile: 'music-player/BGM_Main_UI_Loop_A.mp3',
        defaultMusicCover: 'music-player/covers/BGM_Main_UI_Loop_A.jpg',
        bgManifest: null,
        musicManifest: null,
        titleManifest: null,
        minigameManifest: null,
        db: null,
        bgDownloading: false,
        musicDownloading: false,
        titleDownloading: false,
        minigameDownloading: false,
        bgPaused: false,
        musicPaused: false,
        titlePaused: false,
        minigamePaused: false,
        titleLastResult: null,
        minigameLastResult: null,

        init() {
            // 音乐缓存就绪信号（供 MusicPlayer 启动时等待，避免回退成默认音乐）
            if (!this.musicCacheReady) {
                this.musicCacheReady = new Promise(res => { this._musicCacheResolve = res; });
            }
            this.bindEvents();
            // 先用本地状态渲染，避免弱网/离线时下载界面长时间空白
            this.refreshUI();
            this.loadAllManifests()
                .then(() => {
                    this.refreshUI();
                    // 校验与音乐缓存属于重 IO 操作，放到空闲时执行，避免进入游戏/音效卡顿
                    const runDeferred = () => {
                        this.validateDownloads()
                            .then(() => this.preloadMusicCache())
                            .then(() => this.refreshUI())
                            .catch(() => {})
                            .then(() => this.notifyMusicCacheReady());
                    };
                    if (window.requestIdleCallback) {
                        window.requestIdleCallback(runDeferred, { timeout: 8000 });
                    } else {
                        setTimeout(runDeferred, 4000);
                    }
                })
                .catch(() => {
                    // 清单加载失败也要放行，避免 MusicPlayer 一直等缓存
                    this.notifyMusicCacheReady();
                });
        },

        bindEvents() {
            $(document).on('click', '#sidebar-resource-download-btn', () => { Utils.playAudio('click-audio', { volume: 1 }); this.openModal(); });
            $(document).on('click', '#resource-download-close, #rd-close-btn', () => { Utils.playAudio('click-audio', { volume: 1 }); EventManager.closeModal('resource-download-modal'); });
            $(document).on('click', '#rd-download-bg-btn', () => { Utils.playAudio('click-audio', { volume: 1 }); this.downloadBackgrounds(); });
            $(document).on('click', '#rd-download-music-btn', () => { Utils.playAudio('click-audio', { volume: 1 }); this.downloadMusic(); });
            $(document).on('click', '#rd-download-title-btn', () => { Utils.playAudio('click-audio', { volume: 1 }); this.downloadTitles(); });
            $(document).on('click', '#rd-download-minigame-btn', () => { Utils.playAudio('click-audio', { volume: 1 }); this.downloadMiniGame(); });
            $(document).on('click', '#rd-delete-bg-btn', () => { Utils.playAudio('click-audio', { volume: 1 }); this.deleteResource('bg'); });
            $(document).on('click', '#rd-delete-music-btn', () => { Utils.playAudio('click-audio', { volume: 1 }); this.deleteResource('music'); });
            $(document).on('click', '#rd-delete-title-btn', () => { Utils.playAudio('click-audio', { volume: 1 }); this.deleteResource('title'); });
            $('#resource-download-modal').on('click', function(e) {
                if ($(e.target).is(this)) EventManager.closeModal('resource-download-modal');
            });
        },

        async loadAllManifests() {
            await Promise.all([this.loadBgManifest(), this.loadMusicManifest(), this.loadTitleManifest(), this.loadMiniGameManifest()]);
        },

        async fetchManifestJson(urls) {
            let lastError = null;
            for (const url of urls) {
                const finalUrl = url + (url.indexOf('?') === -1 ? '?t=' + Math.floor(Date.now() / 60000) : '');
                try {
                    if (window.Net && Net.getJSON) {
                        return await Net.getJSON(finalUrl, { cache: 'no-store', timeout: 8000, retries: 0 });
                    }
                    // 网络层缺失时的兜底：竞速超时（旧版 WebView 无 AbortController）
                    return await new Promise((resolve, reject) => {
                        let settled = false;
                        const finish = (fn, value) => {
                            if (settled) return;
                            settled = true;
                            clearTimeout(timer);
                            fn(value);
                        };
                        const timer = setTimeout(() => finish(reject, new Error('timeout')), 8000);
                        fetch(finalUrl, { cache: 'no-store' }).then(resp => {
                            if (!resp.ok) throw new Error('HTTP ' + resp.status);
                            return resp.json();
                        }).then(json => finish(resolve, json))
                          .catch(err => finish(reject, err));
                    });
                } catch (e) {
                    lastError = e;
                    console.warn('[RDM] manifest load failed', url, e);
                }
            }
            throw lastError || new Error('manifest load failed');
        },

        readCachedManifest(key) {
            try {
                const raw = localStorage.getItem(key);
                return raw ? JSON.parse(raw) : null;
            } catch (e) { return null; }
        },

        async loadBgManifest() {
            if (this.bgManifest) return this.bgManifest;
            try {
                const data = await this.fetchManifestJson(this.bgManifestUrls);
                if (!data || (!Array.isArray(data.images) && !Array.isArray(data.videos))) throw new Error('invalid bg manifest');
                this.bgManifest = data;
                try { localStorage.setItem(this.bgManifestCacheKey, JSON.stringify(data)); } catch (e) {}
                return this.bgManifest;
            } catch (e) {
                console.warn('[RDM] bg manifest load failed', e);
                const cached = this.readCachedManifest(this.bgManifestCacheKey);
                this.bgManifest = cached && (Array.isArray(cached.images) || Array.isArray(cached.videos))
                    ? cached
                    : { images: [], videos: [] };
                return this.bgManifest;
            }
        },

        async loadMusicManifest() {
            if (this.musicManifest) return this.musicManifest;
            try {
                const data = await this.fetchManifestJson(this.musicManifestUrls);
                if (!data || !Array.isArray(data.tracks)) throw new Error('invalid music manifest');
                this.musicManifest = data;
                try { localStorage.setItem(this.musicManifestCacheKey, JSON.stringify(data)); } catch (e) {}
                return this.musicManifest;
            } catch (e) {
                console.warn('[RDM] music manifest load failed', e);
                const cached = this.readCachedManifest(this.musicManifestCacheKey);
                this.musicManifest = cached && Array.isArray(cached.tracks) ? cached : { tracks: [] };
                return this.musicManifest;
            }
        },

        // 段位图标清单：远程仓库加载失败时的兜底清单（安装包内已不再内置图片文件）
        builtinTitleManifest: {
            version: 1,
            icons: [
                { name: '暗区新锐', path: 'titles/XR.png' },
                { name: '暗区尖兵', path: 'titles/JB.png' },
                { name: '暗区精英', path: 'titles/JY.png' },
                { name: '暗区专家', path: 'titles/ZJ.png' },
                { name: '暗区大师', path: 'titles/DS.png' },
                { name: '暗区王牌', path: 'titles/WP.png' },
                { name: '暗区传说', path: 'titles/CS.png' }
            ]
        },

        async loadTitleManifest() {
            if (this.titleManifest) return this.titleManifest;
            try {
                const data = await this.fetchManifestJson(this.titleManifestUrls);
                if (!data || !Array.isArray(data.icons) || data.icons.length === 0) throw new Error('invalid title manifest');
                this.titleManifest = data;
                try { localStorage.setItem(this.titleManifestCacheKey, JSON.stringify(data)); } catch (e) {}
                return this.titleManifest;
            } catch (e) {
                console.warn('[RDM] title manifest load failed', e);
                const cached = this.readCachedManifest(this.titleManifestCacheKey);
                this.titleManifest = cached && Array.isArray(cached.icons) && cached.icons.length > 0
                    ? cached
                    : this.builtinTitleManifest;
                return this.titleManifest;
            }
        },

        // MiniGame（水果忍者）资源包清单：结构 files: [{path, size}]
        builtinMiniGameManifest: {
            version: 1,
            files: [
                { name: 'index.html', path: 'MiniGame/index.html', size: 1353 },
                { name: 'scripts/all.js', path: 'MiniGame/scripts/all.js', size: 189889 },
                { name: 'images/background.jpg', path: 'MiniGame/images/background.jpg', size: 593874 },
                { name: 'images/blank.gif', path: 'MiniGame/images/blank.gif', size: 43 },
                { name: 'images/flash.png', path: 'MiniGame/images/flash.png', size: 12709 },
                { name: 'images/game-over.png', path: 'MiniGame/images/game-over.png', size: 24288 },
                { name: 'images/home-desc.png', path: 'MiniGame/images/home-desc.png', size: 307761 },
                { name: 'images/home-mask.png', path: 'MiniGame/images/home-mask.png', size: 43 },
                { name: 'images/index.css', path: 'MiniGame/images/index.css', size: 2053 },
                { name: 'images/logo.png', path: 'MiniGame/images/logo.png', size: 43 },
                { name: 'images/lose.png', path: 'MiniGame/images/lose.png', size: 2680 },
                { name: 'images/new-game.png', path: 'MiniGame/images/new-game.png', size: 21375 },
                { name: 'images/new.png', path: 'MiniGame/images/new.png', size: 43 },
                { name: 'images/ninja.png', path: 'MiniGame/images/ninja.png', size: 43 },
                { name: 'images/score.png', path: 'MiniGame/images/score.png', size: 338791 },
                { name: 'images/shadow.png', path: 'MiniGame/images/shadow.png', size: 1751 },
                { name: 'images/smoke.png', path: 'MiniGame/images/smoke.png', size: 1051 },
                { name: 'images/x.png', path: 'MiniGame/images/x.png', size: 733 },
                { name: 'images/xf.png', path: 'MiniGame/images/xf.png', size: 860 },
                { name: 'images/xx.png', path: 'MiniGame/images/xx.png', size: 1087 },
                { name: 'images/xxf.png', path: 'MiniGame/images/xxf.png', size: 1250 },
                { name: 'images/xxx.png', path: 'MiniGame/images/xxx.png', size: 1332 },
                { name: 'images/xxxf.png', path: 'MiniGame/images/xxxf.png', size: 1584 },
                { name: 'images/fruit/apple.png', path: 'MiniGame/images/fruit/apple.png', size: 277077 },
                { name: 'images/fruit/apple-1.png', path: 'MiniGame/images/fruit/apple-1.png', size: 116679 },
                { name: 'images/fruit/apple-2.png', path: 'MiniGame/images/fruit/apple-2.png', size: 169651 },
                { name: 'images/fruit/banana.png', path: 'MiniGame/images/fruit/banana.png', size: 397654 },
                { name: 'images/fruit/banana-1.png', path: 'MiniGame/images/fruit/banana-1.png', size: 173092 },
                { name: 'images/fruit/banana-2.png', path: 'MiniGame/images/fruit/banana-2.png', size: 245064 },
                { name: 'images/fruit/basaha.png', path: 'MiniGame/images/fruit/basaha.png', size: 334930 },
                { name: 'images/fruit/basaha-1.png', path: 'MiniGame/images/fruit/basaha-1.png', size: 138329 },
                { name: 'images/fruit/basaha-2.png', path: 'MiniGame/images/fruit/basaha-2.png', size: 205039 },
                { name: 'images/fruit/boom.png', path: 'MiniGame/images/fruit/boom.png', size: 305683 },
                { name: 'images/fruit/peach.png', path: 'MiniGame/images/fruit/peach.png', size: 362032 },
                { name: 'images/fruit/peach-1.png', path: 'MiniGame/images/fruit/peach-1.png', size: 241370 },
                { name: 'images/fruit/peach-2.png', path: 'MiniGame/images/fruit/peach-2.png', size: 142841 },
                { name: 'images/fruit/sandia.png', path: 'MiniGame/images/fruit/sandia.png', size: 651445 },
                { name: 'images/fruit/sandia-1.png', path: 'MiniGame/images/fruit/sandia-1.png', size: 290295 },
                { name: 'images/fruit/sandia-2.png', path: 'MiniGame/images/fruit/sandia-2.png', size: 392639 },
                { name: 'sound/menu.mp3', path: 'MiniGame/sound/menu.mp3', size: 2427179 },
                { name: 'sound/menu.ogg', path: 'MiniGame/sound/menu.ogg', size: 2427179 },
                { name: 'sound/start.mp3', path: 'MiniGame/sound/start.mp3', size: 98884 },
                { name: 'sound/start.ogg', path: 'MiniGame/sound/start.ogg', size: 98884 },
                { name: 'sound/boom.mp3', path: 'MiniGame/sound/boom.mp3', size: 189596 },
                { name: 'sound/boom.ogg', path: 'MiniGame/sound/boom.ogg', size: 189596 },
                { name: 'sound/over.mp3', path: 'MiniGame/sound/over.mp3', size: 176648 },
                { name: 'sound/over.ogg', path: 'MiniGame/sound/over.ogg', size: 176648 },
                { name: 'sound/splatter.mp3', path: 'MiniGame/sound/splatter.mp3', size: 19684 },
                { name: 'sound/splatter.ogg', path: 'MiniGame/sound/splatter.ogg', size: 19684 },
                { name: 'sound/throw.mp3', path: 'MiniGame/sound/throw.mp3', size: 44154 },
                { name: 'sound/throw.ogg', path: 'MiniGame/sound/throw.ogg', size: 44154 }
            ]
        },

        async loadMiniGameManifest() {
            if (this.minigameManifest) return this.minigameManifest;
            try {
                const data = await this.fetchManifestJson(this.minigameManifestUrls);
                const hasFiles = data && (Array.isArray(data.files) && data.files.length > 0);
                if (!hasFiles) throw new Error('invalid minigame manifest');
                this.minigameManifest = data;
                try { localStorage.setItem(this.minigameManifestCacheKey, JSON.stringify(data)); } catch (e) {}
                return this.minigameManifest;
            } catch (e) {
                console.warn('[RDM] minigame manifest load failed', e);
                const cached = this.readCachedManifest(this.minigameManifestCacheKey);
                const cachedOk = cached && Array.isArray(cached.files) && cached.files.length > 0;
                this.minigameManifest = cachedOk ? cached : this.builtinMiniGameManifest;
                return this.minigameManifest;
            }
        },

        getMiniGameItems() {
            if (!this.minigameManifest) return [];
            return (this.minigameManifest.files || []).map(function(f, idx) {
                return {
                    id: f.id != null ? f.id : idx,
                    name: f.name || f.path,
                    path: f.path,
                    url: f.url || '',
                    size: f.size || 0
                };
            });
        },

        isMiniGameDownloaded() {
            // 已改为内置，始终返回 true
            return true;
        },

        getMiniGameDownloadUrls(item) {
            const urls = [];
            if (item.url) urls.push(item.url);
            this.minigameBaseUrls.forEach(function(base) { urls.push(base + item.path); });
            const seen = {};
            return urls.filter(function(u) { return seen[u] ? false : (seen[u] = true); });
        },

        getTitleItems() {
            if (!this.titleManifest || !Array.isArray(this.titleManifest.icons)) return [];
            return this.titleManifest.icons.map((i, idx) => ({
                id: i.id != null ? i.id : idx,
                name: i.name || i.path,
                path: i.path,
                file: i.file || '',
                url: i.url || '',
                size: i.size || 0
            }));
        },

        // 段位图标占位：安装包内已不内置图片，未下载资源包时用内置 SVG 占位（不同段位显示不同首字）
        _titlePlaceholderCache: {},
        titlePlaceholderIcon(path) {
            if (this._titlePlaceholderCache[path]) return this._titlePlaceholderCache[path];
            const item = this.getTitleItems().find(i => i.path === path)
                || (State.titles || []).find(i => i.icon === path)
                || {};
            const name = item.name || '段位';
            const label = String(name).replace(/^暗区/, '').charAt(0) || '段';
            const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">'
                + '<circle cx="64" cy="64" r="58" fill="#1b222c" stroke="#f5c34d" stroke-width="4"/>'
                + '<text x="64" y="84" font-size="56" text-anchor="middle" fill="#f5c34d"'
                + ' font-family="sans-serif" font-weight="bold">' + label + '</text></svg>';
            const uri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
            this._titlePlaceholderCache[path] = uri;
            return uri;
        },

        getTitleLocalFallback(path) {
            return this.titlePlaceholderIcon(path);
        },

        getTitleDownloadUrls(item) {
            const urls = [];
            if (item.url) urls.push(item.url);
            // manifest 里的 path 形如 titles/XR.png，仓库内实际路径也是 titles/XR.png
            this.titleBaseUrls.forEach(base => urls.push(base + item.path));
            const seen = {};
            return urls.filter(u => (seen[u] ? false : (seen[u] = true)));
        },

        isTitlesDownloaded() {
            const items = this.getTitleItems();
            if (items.length === 0) {
                return this.getDownloadedPaths().some(p => p.indexOf('titles/') === 0);
            }
            return items.every(item => this.isDownloaded(item.path));
        },

        // 合并背景清单：images + videos
        getBgItems() {
            if (!this.bgManifest) return [];
            const imgs = (this.bgManifest.images || []).map(i => ({ id: i.id, name: i.name, path: i.path, url: i.url, size: i.size, type: 'image' }));
            const vids = (this.bgManifest.videos || []).map(v => ({ id: v.id, name: v.name, path: v.path, url: v.url, size: v.size, type: 'video' }));
            return imgs.concat(vids);
        },

        // 背景原始路径对应的远程地址（用于 blob 播放失败时回退）
        getBgRemoteUrl(path) {
            const item = this.getBgItems().find(i => i.path === path);
            if (item && item.url) return item.url;
            return this.bgBaseUrls[0] + path;
        },

        // 背景下载地址列表：清单内 url → jsDelivr → GitHub raw
        getBgDownloadUrls(item) {
            const urls = [];
            if (item.url) urls.push(item.url);
            this.bgBaseUrls.forEach(base => urls.push(base + item.path));
            return Array.from(new Set(urls));
        },

        openDB() {
            return new Promise((resolve, reject) => {
                if (this.db) { resolve(this.db); return; }
                const req = indexedDB.open(this.dbName, 2);
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        db.createObjectStore(this.storeName, { keyPath: 'path' });
                    }
                    // pending store：存下载中断前已收到的 chunk 累积 blob，用于 Range 续传
                    if (!db.objectStoreNames.contains('pending')) {
                        db.createObjectStore('pending', { keyPath: 'path' });
                    }
                };
                req.onsuccess = (e) => { this.db = e.target.result; resolve(this.db); };
                req.onerror = (e) => reject(e.target.error);
            });
        },

        _DB_PENDING_FLUSH_BYTES: 524288, // 每累计 512KB 刷一次 pending，避免内存里 chunks 数组无限膨胀

        async _getPending(path) {
            try {
                const db = await this.openDB();
                return await new Promise((resolve, reject) => {
                    const tx = db.transaction('pending', 'readonly');
                    const req = tx.objectStore('pending').get(path);
                    req.onsuccess = () => resolve(req.result || null);
                    req.onerror = () => reject(req.error);
                });
            } catch (e) { return null; }
        },

        async _putPending(record) {
            try {
                const db = await this.openDB();
                await new Promise((resolve, reject) => {
                    const tx = db.transaction('pending', 'readwrite');
                    tx.objectStore('pending').put(record);
                    tx.oncomplete = () => resolve();
                    tx.onerror = () => reject(tx.error);
                });
            } catch (e) {}
        },

        async _clearPending(path) {
            try {
                const db = await this.openDB();
                await new Promise((resolve, reject) => {
                    const tx = db.transaction('pending', 'readwrite');
                    tx.objectStore('pending').delete(path);
                    tx.oncomplete = () => resolve();
                    tx.onerror = () => reject(tx.error);
                });
            } catch (e) {}
        },

        // 探测某个 URL 是否支持 Range 头（发 HEAD + Range: bytes=0-0，看是否回 206）
        async _supportsRange(url) {
            try {
                const resp = await fetch(url, { method: 'HEAD', headers: { Range: 'bytes=0-0' } });
                return resp.status === 206 && resp.headers.has('content-range');
            } catch (e) {
                try {
                    const resp = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' }, cache: 'no-store' });
                    if (resp.body) { try { resp.body.cancel && resp.body.cancel(); } catch (e) {} }
                    return resp.status === 206 && resp.headers.has('content-range');
                } catch (e2) {
                    return false;
                }
            }
        },

        getDownloadedPaths() {
            try {
                const data = localStorage.getItem(this.downloadedKey);
                return data ? JSON.parse(data) : [];
            } catch (e) { return []; }
        },

        saveDownloadedPaths(paths) {
            localStorage.setItem(this.downloadedKey, JSON.stringify(paths));
        },

        markDownloaded(path) {
            const list = this.getDownloadedPaths();
            if (!list.includes(path)) {
                list.push(path);
                this.saveDownloadedPaths(list);
            }
        },

        isDownloaded(path) {
            return this.getDownloadedPaths().includes(path);
        },

        isBackgroundsDownloaded() {
            const items = this.getBgItems();
            if (items.length === 0) {
                // 清单未加载（如离线）时，按已下载记录兜底判断
                return this.getDownloadedPaths().some(p => p.indexOf('backgrounds/') === 0);
            }
            return items.every(item => this.isDownloaded(item.path));
        },

        isMusicDownloaded() {
            const tracks = (this.musicManifest && this.musicManifest.tracks) || [];
            if (tracks.length === 0) {
                // 清单未加载（如离线）时，按已下载记录兜底判断
                return this.getDownloadedPaths().some(p => p.indexOf('music-player/') === 0);
            }
            return tracks.every(t => this.isDownloaded(t.audio_path) && this.isDownloaded(t.cover_path));
        },

        isAllDownloaded() {
            return this.isBackgroundsDownloaded() && this.isMusicDownloaded();
        },

        blobUrlCache: {},

        getMime(path) {
            const p = (path || '').toLowerCase();
            if (p.endsWith('.mp4')) return 'video/mp4';
            if (p.endsWith('.webm')) return 'video/webm';
            if (p.endsWith('.png')) return 'image/png';
            if (p.endsWith('.jpg') || p.endsWith('.jpeg')) return 'image/jpeg';
            if (p.endsWith('.webp')) return 'image/webp';
            if (p.endsWith('.gif')) return 'image/gif';
            if (p.endsWith('.mp3')) return 'audio/mpeg';
            if (p.endsWith('.m4a')) return 'audio/mp4';
            if (p.endsWith('.wav')) return 'audio/wav';
            if (p.endsWith('.ogg')) return 'audio/ogg';
            return 'application/octet-stream';
        },

        async resolvePath(path) {
            if (!path) return path;
            if (path === this.defaultBgPath) return path;
            if (path === this.defaultMusicFile || path === this.defaultMusicCover) return path;
            if (path.indexOf('blob:') === 0) return path;
            if (this.blobUrlCache[path]) return this.blobUrlCache[path];
            try {
                const db = await this.openDB();
                const record = await new Promise((resolve, reject) => {
                    const tx = db.transaction(this.storeName, 'readonly');
                    const req = tx.objectStore(this.storeName).get(path);
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = () => reject(req.error);
                });
                if (record && record.blob) {
                    // 重新构造带正确 MIME 的 blob，兼容部分 WebView 对空 type blob 的播放限制
                    const blob = record.blob.type ? record.blob : new Blob([record.blob], { type: this.getMime(path) });
                    const url = URL.createObjectURL(blob);
                    this.blobUrlCache[path] = url;
                    return url;
                }
            } catch (e) {}
            // 未下载时回退到对应默认资源，避免黑屏/无声
            if (path.indexOf('music-player/') === 0) {
                return path.indexOf('covers/') !== -1 ? this.defaultMusicCover : this.defaultMusicFile;
            }
            // 段位图标未下载时回退到安装包内置图标
            if (path.indexOf('titles/') === 0) {
                return this.getTitleLocalFallback(path) || path;
            }
            // 背景未下载时优先回退到远程地址（保持图片/视频类型正确），远程不可用再回退默认背景
            return this.getBgRemoteUrl(path) || this.defaultBgPath;
        },

        // 暂停等待：暂停期间每 150ms 检查一次，恢复后继续
        async waitWhilePaused(isPaused) {
            while (isPaused && isPaused()) {
                await new Promise(r => setTimeout(r, 150));
            }
        },

        // urls: 候选下载地址（按优先级）
        // storagePath: IndexedDB / 已下载标记使用的路径（与应用内引用路径保持一致）
        // isPaused: 可选，返回 true 时暂停下载
        async downloadFile(urls, storagePath, name, size, onProgress, isPaused) {
            if (!Array.isArray(urls)) urls = [urls];
            const maxAttempts = Math.max(3, urls.length + 1);
            let lastError = null;

            // 已下载且完整：直接返回主 store 里的 blob，不走网络
            try {
                const db = await this.openDB();
                const record = await new Promise((resolve, reject) => {
                    const tx = db.transaction(this.storeName, 'readonly');
                    const req = tx.objectStore(this.storeName).get(storagePath);
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = () => reject(req.error);
                });
                if (record && record.blob && record.blob.size > 0) {
                    const expected = Number(size) || 0;
                    if (expected === 0 || Math.abs(record.blob.size - expected) <= Math.max(2048, expected * 0.01)) {
                        this.markDownloaded(storagePath);
                        try { if (onProgress && onProgress.cancel) onProgress.cancel(); } catch (e) {}
                        return record.blob;
                    }
                }
            } catch (e) {}

            // 启动时读取 pending 记录（上次中断时留下来的累积 blob + 已收到字节数）
            let pending = await this._getPending(storagePath);
            let resumed = !!(pending && pending.received > 0 && pending.partialBlob);

            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                let abortTimer = null;
                let streamAborted = false;
                try {
                    const baseUrl = urls[attempt % urls.length];
                    const url = baseUrl + (attempt >= urls.length ? ('?r=' + Date.now()) : '');
                    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
                    if (controller) abortTimer = setTimeout(() => controller.abort(), 120000);

                    // 只有第一次 attempt 才尝试 Range 续传；后续 attempt 都走全量（换源了，不保证新源支持 Range）
                    let useRange = resumed && attempt === 0;
                    const headers = {};
                    if (useRange && pending.received > 0) {
                        headers['Range'] = 'bytes=' + pending.received + '-';
                    }

                    let resp;
                    try {
                        resp = await fetch(url, {
                            cache: attempt >= urls.length ? 'reload' : 'default',
                            signal: controller ? controller.signal : undefined,
                            headers: headers
                        });
                    } catch (e) {
                        // 网络异常也算可续传场景：保留 pending，下次重来
                        if (abortTimer) clearTimeout(abortTimer);
                        throw e;
                    }

                    // 416 Range Not Satisfiable：pending 里的字节已经被远端重算（文件变了），放弃 pending，全量重来
                    if (useRange && resp.status === 416) {
                        await this._clearPending(storagePath);
                        pending = null;
                        resumed = false;
                        delete headers['Range'];
                        resp = await fetch(url, {
                            cache: 'reload',
                            signal: controller ? controller.signal : undefined
                        });
                    }

                    if (!resp.ok) throw new Error('HTTP ' + resp.status);

                    let total = Number(resp.headers.get('content-length')) || size || 0;
                    // Range 成功（206）时，content-length 是剩余部分的长度，要加上 pending.received 才是总字节
                    if (useRange && resp.status === 206) {
                        const cl = Number(resp.headers.get('content-length')) || 0;
                        if (pending && Number(pending.received) > 0 && cl > 0) {
                            total = pending.received + cl;
                        }
                        // Range 成功后，从 pending.partialBlob 继续累积
                        pending.received = Number(pending.received) || 0;
                    } else if (useRange && resp.status !== 206) {
                        // 服务器宣称支持但实际忽略了 Range（回 200），全量重来
                        useRange = false;
                        await this._clearPending(storagePath);
                        pending = null;
                        resumed = false;
                    }

                    const reader = resp.body.getReader();
                    // 起始 received 来自 pending（续传）或 0（全量）
                    let received = (pending && Number(pending.received)) || 0;
                    let currentFlush = 0;
                    let partialBlob = pending ? pending.partialBlob : null;
                    const chunks = [];

                    while (true) {
                        await this.waitWhilePaused(isPaused);
                        let readResult;
                        try {
                            readResult = await reader.read();
                        } catch (e) {
                            // 中途 abort/断网 —— pending 保留用于下次续传
                            streamAborted = true;
                            throw e;
                        }
                        const { done, value } = readResult;
                        if (done) break;
                        chunks.push(value);
                        received += value.length;
                        currentFlush += value.length;
                        if (onProgress) onProgress(received, total, name);

                        // 每 512KB 刷一次 pending，避免内存里 chunks 累积过多
                        if (currentFlush >= this._DB_PENDING_FLUSH_BYTES) {
                            try {
                                const merged = partialBlob
                                    ? new Blob([partialBlob].concat(chunks), { type: this.getMime(storagePath) })
                                    : new Blob(chunks, { type: this.getMime(storagePath) });
                                await this._putPending({
                                    path: storagePath,
                                    partialBlob: merged,
                                    received: received,
                                    expected: Number(size) || 0,
                                    lastUpdated: Date.now()
                                });
                                partialBlob = merged;
                                chunks.length = 0;
                                currentFlush = 0;
                            } catch (e) {}
                        }
                    }

                    if (abortTimer) clearTimeout(abortTimer);

                    // 中途断流但 reader 正常 done（极少数 WebView 边界行为）：保留 pending 让下次续
                    if (streamAborted) {
                        throw new Error('stream interrupted');
                    }

                    // 合并最终 blob
                    const finalBlob = partialBlob
                        ? new Blob([partialBlob].concat(chunks), { type: this.getMime(storagePath) })
                        : new Blob(chunks, { type: this.getMime(storagePath) });
                    const finalSize = finalBlob.size;

                    // 完整性校验
                    const expected = Number(size) || 0;
                    if (expected > 0 && Math.abs(finalSize - expected) > Math.max(2048, expected * 0.01)) {
                        throw new Error('资源不完整 (' + finalSize + '/' + expected + ')');
                    }

                    // 落主 store
                    const db = await this.openDB();
                    await new Promise((resolve, reject) => {
                        const tx = db.transaction(this.storeName, 'readwrite');
                        tx.objectStore(this.storeName).put({
                            path: storagePath, name: name, blob: finalBlob,
                            size: finalSize, expectedSize: expected,
                            type: finalBlob.type, downloadedAt: Date.now()
                        });
                        tx.oncomplete = () => resolve();
                        tx.onerror = () => reject(tx.error);
                    });
                    this.markDownloaded(storagePath);

                    // 下载完成：清 pending，让下次不必再试续传
                    await this._clearPending(storagePath);

                    // 失效旧缓存
                    if (this.blobUrlCache[storagePath]) {
                        try { URL.revokeObjectURL(this.blobUrlCache[storagePath]); } catch (e) {}
                        delete this.blobUrlCache[storagePath];
                    }
                    if (this.musicBlobCache[storagePath]) {
                        try { URL.revokeObjectURL(this.musicBlobCache[storagePath]); } catch (e) {}
                        delete this.musicBlobCache[storagePath];
                    }
                    if (onProgress && onProgress.cancel) onProgress.cancel();
                    return finalBlob;
                } catch (e) {
                    if (abortTimer) clearTimeout(abortTimer);
                    if (onProgress && onProgress.cancel) onProgress.cancel();
                    lastError = e;
                    // 网络错误/中断：pending 已在刷盘循环里保留，下次 attempt 会从 received 续
                    // 如果中途还没来得及 flush 任何字节（pending 还空着），也保留 pending 结构让下次 attempt 续用
                    if (!pending) {
                        pending = await this._getPending(storagePath);
                        resumed = !!(pending && pending.received > 0);
                    }
                    console.warn('[RDM] download attempt failed (will resume from ' + (pending ? pending.received : 0) + ' bytes if possible)', storagePath, attempt + 1, e);
                    if (attempt < maxAttempts - 1) {
                        await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
                    }
                }
            }
            throw lastError || new Error('下载失败');
        },

        // 并发下载池：同时最多 concurrency 个 worker 跑，每个 worker 完成/失败会启动下一个补位
        // worker(item) → Promise；done/fail 是闭包更新外部计数的函数
        // 旧 WebView 兼容：不用 Promise.all / allSettled / Object.fromEntries
        _runConcurrentPool(items, worker, done, fail, concurrency) {
            concurrency = concurrency || 6;
            return new Promise(function(resolve) {
                var idx = 0;
                var active = 0;
                function next() {
                    if (idx >= items.length) {
                        if (active === 0) resolve();
                        return;
                    }
                    var item = items[idx++];
                    active++;
                    Promise.resolve()
                        .then(function() { return worker(item); })
                        .then(function() { if (done) done(); })
                        .catch(function(e) { if (fail) fail(e); })
                        .then(function() {
                            active--;
                            next(); // 补位
                        });
                }
                for (var i = 0; i < Math.min(concurrency, items.length); i++) next();
                if (items.length === 0) resolve();
            });
        },

        // 节流：120ms 内最多触发一次 UI 更新，避免高频进度回调卡死 WebView
        _wrapThrottledProgress(onProgress, interval) {
            interval = interval || 120;
            var lastEmit = 0;
            var lastArgs = null;
            var timer = null;
            var fn = function(recv, tot, name) {
                lastArgs = [recv, tot, name];
                var now = Date.now();
                if (now - lastEmit >= interval) {
                    lastEmit = now;
                    if (timer) { clearTimeout(timer); timer = null; }
                    try { onProgress(recv, tot, name); } catch (e) {}
                } else if (!timer) {
                    timer = setTimeout(function() {
                        lastEmit = Date.now();
                        timer = null;
                        if (lastArgs) { try { onProgress(lastArgs[0], lastArgs[1], lastArgs[2]); } catch (e) {} }
                    }, interval - (now - lastEmit));
                }
            };
            // 清掉挂起的尾部回调（下载结束时调用）
            fn.cancel = function() {
                if (timer) { clearTimeout(timer); timer = null; }
                lastArgs = null;
            };
            return fn;
        },

        // 启动时校验已下载资源，清理中断/损坏的记录，使其可以重新下载
        validateDownloads() {
            // 并发调用（启动初始化 + 登录加载校验）复用同一个任务，避免重复删除
            if (!this._validatePromise) {
                this._validatePromise = this._validateDownloads().then(result => {
                    this._validatePromise = null;
                    return result;
                }).catch(error => {
                    this._validatePromise = null;
                    throw error;
                });
            }
            return this._validatePromise;
        },

        async _validateDownloads() {
            const expected = {};
            // 校验只依赖本地清单缓存与 IndexedDB，不访问网络，避免登录前加载被弱网卡住
            try {
                const bgData = this.bgManifest || this.readCachedManifest(this.bgManifestCacheKey);
                if (bgData) {
                    if (!this.bgManifest) this.bgManifest = bgData;
                    this.getBgItems().forEach(i => { if (i.size) expected[i.path] = i.size; });
                }
                const musicData = this.musicManifest || this.readCachedManifest(this.musicManifestCacheKey);
                if (musicData) {
                    if (!this.musicManifest) this.musicManifest = musicData;
                    (musicData.tracks || []).forEach(t => {
                        if (t.audio_size) expected[t.audio_path] = t.audio_size;
                        if (t.cover_size) expected[t.cover_path] = t.cover_size;
                    });
                }
            } catch (e) {}

            let removed = 0;
            let checked = 0;
            try {
                const db = await this.openDB();
                // 使用游标逐条读取，只收集元数据，避免把几百 MB 的 blob 全部载入内存
                const records = await new Promise((resolve, reject) => {
                    const tx = db.transaction(this.storeName, 'readonly');
                    const req = tx.objectStore(this.storeName).openCursor();
                    const result = [];
                    req.onsuccess = (e) => {
                        const cursor = e.target.result;
                        if (!cursor) { resolve(result); return; }
                        const v = cursor.value || {};
                        result.push({
                            path: v.path,
                            size: Number(v.size) || 0,
                            blobSize: v.blob ? (Number(v.blob.size) || 0) : 0,
                            hasBlob: !!v.blob
                        });
                        cursor.continue();
                    };
                    req.onerror = () => reject(req.error);
                });

                const validPaths = new Set();
                for (const rec of records) {
                    checked++;
                    if (!rec.path) continue;
                    const exp = expected[rec.path];
                    // blob 缺失、记录大小与实际不一致、或与清单大小不一致 → 视为损坏
                    const blobOk = rec.hasBlob && rec.blobSize > 0 && rec.blobSize === rec.size;
                    const sizeOk = !exp || (Math.abs(rec.size - exp) <= Math.max(2048, exp * 0.01));
                    if (!blobOk || !sizeOk) {
                        await new Promise((resolve) => {
                            const tx = db.transaction(this.storeName, 'readwrite');
                            tx.objectStore(this.storeName).delete(rec.path);
                            tx.oncomplete = () => resolve();
                            tx.onerror = () => resolve();
                        });
                        removed++;
                    } else {
                        validPaths.add(rec.path);
                    }
                }

                // 清理 localStorage 中指向不存在/损坏记录的「已下载」标记
                const paths = this.getDownloadedPaths();
                const cleaned = paths.filter(p => validPaths.has(p));
                if (cleaned.length !== paths.length || removed > 0) {
                    this.saveDownloadedPaths(cleaned);
                    // 释放旧 blob URL，防止继续使用已损坏资源
                    Object.keys(this.blobUrlCache).forEach(k => {
                        try { URL.revokeObjectURL(this.blobUrlCache[k]); } catch (e) {}
                    });
                    Object.keys(this.musicBlobCache).forEach(k => {
                        try { URL.revokeObjectURL(this.musicBlobCache[k]); } catch (e) {}
                    });
                    this.blobUrlCache = {};
                    this.musicBlobCache = {};
                    // 清理后重新应用背景，避免页面仍引用已释放的 blob URL
                    if (removed > 0 && window.BackgroundManager) {
                        setTimeout(function() {
                            try { BackgroundManager.loadSavedBackground(); } catch (e) {}
                        }, 0);
                    }
                }

                // 清理 pending store：
                // - 已下载完整的文件如果还留 pending（理论上不应发生）→ 清掉占空间
                // - 孤儿 pending（没有 partialBlob 或 received=0）→ 清掉
                // - 超期 pending（超过 24h 未更新）→ 清掉，防止半成品堆积
                try {
                    const pendingRecords = await new Promise((resolve, reject) => {
                        const tx = db.transaction('pending', 'readonly');
                        const req = tx.objectStore('pending').openCursor();
                        const result = [];
                        req.onsuccess = (e) => {
                            const cursor = e.target.result;
                            if (!cursor) { resolve(result); return; }
                            result.push(cursor.value);
                            cursor.continue();
                        };
                        req.onerror = () => reject(req.error);
                    });
                    const now = Date.now();
                    for (const p of pendingRecords) {
                        const expired = !p || !p.path
                            || !p.partialBlob
                            || !p.received
                            || (now - (Number(p.lastUpdated) || 0) > 24 * 3600 * 1000);
                        const alreadyDone = p && p.path && validPaths.has(p.path);
                        if (expired || alreadyDone) {
                            await this._clearPending(p.path);
                        }
                    }
                } catch (e) {}
            } catch (e) {
                console.warn('[RDM] validateDownloads failed', e);
            }
            return { checked, removed };
        },

        setDownloadButton(kind) {
            const isBg = kind === 'bg';
            const isTitle = kind === 'title';
            const isMG = kind === 'minigame';
            const $btn = isBg ? $('#rd-download-bg-btn')
                : (isTitle ? $('#rd-download-title-btn')
                    : (isMG ? $('#rd-download-minigame-btn')
                        : $('#rd-download-music-btn')));
            if (!$btn.length) return;
            const downloading = isBg ? this.bgDownloading : (isTitle ? this.titleDownloading : (isMG ? this.minigameDownloading : this.musicDownloading));
            const paused = isBg ? this.bgPaused : (isTitle ? this.titlePaused : (isMG ? this.minigamePaused : this.musicPaused));
            if (downloading) {
                $btn.prop('disabled', false).html(paused
                    ? '<i class="fas fa-play"></i> 继续下载'
                    : '<i class="fas fa-pause"></i> 暂停下载');
            } else {
                $btn.prop('disabled', false).html(isBg
                    ? '<i class="fas fa-download"></i> 下载背景资源包'
                    : (isTitle
                        ? '<i class="fas fa-download"></i> 下载段位图标资源包'
                        : (isMG
                            ? '<i class="fas fa-download"></i> 下载小游戏资源包'
                            : '<i class="fas fa-download"></i> 下载音乐资源包')));
            }
        },

        async downloadBackgrounds() {
            // 下载中再次点击 → 暂停 / 继续
            if (this.bgDownloading) {
                this.bgPaused = !this.bgPaused;
                this.setDownloadButton('bg');
                $('#rd-bg-progress-text').text(this.bgPaused ? '已暂停 · 点击「继续下载」恢复' : '继续下载中...');
                return;
            }
            if (!this.bgManifest || this.getBgItems().length === 0) {
                // 允许清单加载失败后重新拉取
                this.bgManifest = null;
            }
            await this.loadBgManifest();
            const items = this.getBgItems();
            if (items.length === 0) {
                if (window.showToast) window.showToast('背景资源列表加载失败，请检查网络');
                this.refreshUI();
                return;
            }
            if (this.isBackgroundsDownloaded()) {
                if (window.showToast) window.showToast('背景资源包已下载完成');
                this.refreshUI();
                return;
            }
            this.bgDownloading = true;
            this.bgPaused = false;
            this.setDownloadButton('bg');
            $('#rd-bg-progress-wrap').show();
            $('#rd-bg-progress-text').text('正在下载...');
            const total = items.length;
            var done = 0;
            var failed = 0;
            var _self = this;
            await this._runConcurrentPool(items, function(item) {
                return _self.waitWhilePaused(function() { return _self.bgPaused; }).then(function() {
                    if (_self.isDownloaded(item.path)) return;
                    return _self.downloadFile(
                        _self.getBgDownloadUrls(item), item.path, item.name, item.size,
                        null, function() { return _self.bgPaused; }
                    );
                });
            }, function() {
                done++;
                $('#rd-bg-progress-bar').css('width', Math.round(done / total * 100) + '%');
                $('#rd-bg-count').text(done + ' / ' + total);
                $('#rd-bg-progress-text').text('已完成 ' + done + '/' + total);
            }, function(e) {
                failed++;
                console.warn('[RDM] bg download failed', e);
            }, 6);
            this.bgDownloading = false;
            this.bgPaused = false;
            this.setDownloadButton('bg');
            if (failed > 0) {
                $('#rd-bg-progress-text').text('完成：' + done + '/' + total + '，失败 ' + failed + ' 个（可再次点击重试）');
            } else {
                $('#rd-bg-progress-text').text('全部下载完成 (' + done + '/' + total + ')');
            }
            this.refreshUI();
        },

        updateBgProgress(done, total, name) {
            const pct = Math.round(done / total * 100);
            $('#rd-bg-progress-bar').css('width', pct + '%');
            $('#rd-bg-count').text(`${done} / ${total}`);
        },

        async downloadMusic() {
            // 下载中再次点击 → 暂停 / 继续
            if (this.musicDownloading) {
                this.musicPaused = !this.musicPaused;
                this.setDownloadButton('music');
                $('#rd-music-progress-text').text(this.musicPaused ? '已暂停 · 点击「继续下载」恢复' : '继续下载中...');
                return;
            }
            if (!this.musicManifest || !(this.musicManifest.tracks || []).length) {
                // 允许清单加载失败后重新拉取
                this.musicManifest = null;
            }
            await this.loadMusicManifest();
            const tracks = (this.musicManifest && this.musicManifest.tracks) || [];
            if (tracks.length === 0) {
                if (window.showToast) window.showToast('音乐资源列表加载失败，请检查网络');
                this.refreshUI();
                return;
            }
            if (this.isMusicDownloaded()) {
                if (window.showToast) window.showToast('音乐资源包已下载完成');
                this.refreshUI();
                return;
            }
            this.musicDownloading = true;
            this.musicPaused = false;
            this.setDownloadButton('music');
            $('#rd-music-progress-wrap').show();
            $('#rd-music-progress-text').text('正在下载...');
            const total = tracks.length;
            var done = 0;
            var failed = 0;
            var _self = this;
            await this._runConcurrentPool(tracks, function(track) {
                return _self.waitWhilePaused(function() { return _self.musicPaused; }).then(function() {
                    var audioOk = _self.isDownloaded(track.audio_path);
                    var coverOk = _self.isDownloaded(track.cover_path);
                    if (audioOk && coverOk) return;
                    var _audioTask = !audioOk ? _self.downloadFile(
                        _self.musicBaseUrls.map(function(b){ return b + track.audio; }),
                        track.audio_path, track.title + ' (音频)', track.audio_size,
                        null, function() { return _self.musicPaused; }
                    ).catch(function(e){ throw e; }) : Promise.resolve();
                    var _coverTask = !coverOk ? _self.downloadFile(
                        _self.musicBaseUrls.map(function(b){ return b + track.cover; }),
                        track.cover_path, track.title + ' (封面)', track.cover_size,
                        null, function() { return _self.musicPaused; }
                    ).catch(function(e){ throw e; }) : Promise.resolve();
                    return Promise.all([_audioTask, _coverTask]);
                });
            }, function() {
                done++;
                $('#rd-music-progress-bar').css('width', Math.round(done / total * 100) + '%');
                $('#rd-music-count').text(done + ' / ' + total);
                $('#rd-music-progress-text').text('已完成 ' + done + '/' + total);
            }, function(e) {
                failed++;
                console.warn('[RDM] music download failed', e);
            }, 4);
            this.musicDownloading = false;
            this.musicPaused = false;
            this.setDownloadButton('music');
            if (failed > 0) {
                $('#rd-music-progress-text').text('完成：' + done + '/' + total + '，失败 ' + failed + ' 个（可再次点击重试）');
            } else {
                $('#rd-music-progress-text').text('全部下载完成 (' + done + '/' + total + ')');
            }
            this.preloadMusicCache().then(() => {
                this.invalidateMusicBlobs();
                this.refreshUI();
            });
        },

        updateMusicProgress(done, total, name) {
            const pct = Math.round(done / total * 100);
            $('#rd-music-progress-bar').css('width', pct + '%');
            $('#rd-music-count').text(`${done} / ${total}`);
        },

        // 段位徽章图标资源包下载（与音乐/背景同一套机制：IndexedDB + 进度 + 暂停）
        async downloadTitles() {
            if (this.titleDownloading) {
                this.titlePaused = !this.titlePaused;
                this.setDownloadButton('title');
                $('#rd-title-progress-text').text(this.titlePaused ? '已暂停 · 点击「继续下载」恢复' : '继续下载中...');
                return;
            }
            if (!this.titleManifest || this.getTitleItems().length === 0) {
                this.titleManifest = null;
            }
            await this.loadTitleManifest();
            const items = this.getTitleItems();
            if (items.length === 0) {
                if (window.showToast) window.showToast('段位图标清单加载失败，请检查网络');
                this.refreshUI();
                return;
            }
            if (this.isTitlesDownloaded()) {
                if (window.showToast) window.showToast('段位图标资源包已下载完成');
                this.refreshUI();
                return;
            }
            this.titleDownloading = true;
            this.titlePaused = false;
            this.setDownloadButton('title');
            $('#rd-title-progress-wrap').show();
            $('#rd-title-progress-text').text('正在下载...');
            const total = items.length;
            var done = 0;
            var failed = 0;
            var _self = this;
            await this._runConcurrentPool(items, function(item) {
                return _self.waitWhilePaused(function() { return _self.titlePaused; }).then(function() {
                    if (_self.isDownloaded(item.path)) return;
                    return _self.downloadFile(
                        _self.getTitleDownloadUrls(item), item.path, item.name, item.size,
                        null, function() { return _self.titlePaused; }
                    );
                });
            }, function() {
                done++;
                $('#rd-title-progress-bar').css('width', Math.round(done / total * 100) + '%');
                $('#rd-title-count').text(done + ' / ' + total);
                $('#rd-title-progress-text').text('已完成 ' + done + '/' + total);
            }, function(e) {
                failed++;
                console.warn('[RDM] title icon download failed', e);
            }, 6);
            this.titleDownloading = false;
            this.titlePaused = false;
            this.setDownloadButton('title');
            this.titleLastResult = failed > 0
                ? (failed === total
                    ? '资源包暂不可用：远程资源未上传或网络异常（可点击重试，图标仍用安装包内置版）'
                    : ('完成：' + done + '/' + total + '，失败 ' + failed + ' 个（可再次点击重试）'))
                : null;
            if (this.titleLastResult) {
                $('#rd-title-progress-text').text(this.titleLastResult);
            } else {
                $('#rd-title-progress-text').text('全部下载完成 (' + done + '/' + total + ')');
            }
            try {
                if (window.TitleManager && window.TitleManager.renderTitleModal) window.TitleManager.renderTitleModal();
            } catch (e) {}
            this.refreshUI();
        },

        updateTitleProgress(done, total, name) {
            const pct = Math.round(done / total * 100);
            $('#rd-title-progress-bar').css('width', pct + '%');
            $('#rd-title-count').text(done + ' / ' + total);
        },

        async downloadMiniGame() {
            if (this.minigameDownloading) {
                this.minigamePaused = !this.minigamePaused;
                this.setDownloadButton('minigame');
                $('#rd-minigame-progress-text').text(this.minigamePaused ? '已暂停 · 点击「继续下载」恢复' : '继续下载中...');
                return;
            }
            if (!this.minigameManifest || this.getMiniGameItems().length === 0) {
                this.minigameManifest = null;
            }
            await this.loadMiniGameManifest();
            const items = this.getMiniGameItems();
            if (items.length === 0) {
                if (window.showToast) window.showToast('小游戏资源清单加载失败，请检查网络');
                this.refreshUI();
                return;
            }
            if (this.isMiniGameDownloaded()) {
                if (window.showToast) window.showToast('小游戏资源包已下载完成');
                this.refreshUI();
                return;
            }
            this.minigameDownloading = true;
            this.minigamePaused = false;
            this.setDownloadButton('minigame');
            $('#rd-minigame-progress-wrap').show();
            $('#rd-minigame-progress-text').text('正在下载...');
            const total = items.length;
            var done = 0;
            var failed = 0;
            var _self = this;
            await this._runConcurrentPool(items, function(item) {
                return _self.waitWhilePaused(function() { return _self.minigamePaused; }).then(function() {
                    if (_self.isDownloaded(item.path)) return;
                    return _self.downloadFile(
                        _self.getMiniGameDownloadUrls(item), item.path, item.name, item.size,
                        null, function() { return _self.minigamePaused; }
                    );
                });
            }, function() {
                done++;
                $('#rd-minigame-progress-bar').css('width', Math.round(done / total * 100) + '%');
                $('#rd-minigame-count').text(done + ' / ' + total);
                $('#rd-minigame-progress-text').text('已完成 ' + done + '/' + total);
            }, function(e) {
                failed++;
                console.warn('[RDM] minigame asset download failed', e);
            }, 6);
            this.minigameDownloading = false;
            this.minigamePaused = false;
            this.setDownloadButton('minigame');
            this.minigameLastResult = failed > 0
                ? (failed === total
                    ? '资源包暂不可用：远程资源未上传或网络异常'
                    : ('完成：' + done + '/' + total + '，失败 ' + failed + ' 个（可再次点击重试）'))
                : null;
            if (this.minigameLastResult) {
                $('#rd-minigame-progress-text').text(this.minigameLastResult);
            } else {
                $('#rd-minigame-progress-text').text('全部下载完成 (' + done + '/' + total + ')');
            }
            this.refreshUI();
        },

        updateMiniGameProgress(done, total, name) {
            const pct = Math.round(done / total * 100);
            $('#rd-minigame-progress-bar').css('width', pct + '%');
            $('#rd-minigame-count').text(done + ' / ' + total);
        },

        refreshUI() {
            const bgItems = this.getBgItems();
            const bgDone = bgItems.filter(i => this.isDownloaded(i.path)).length;
            $('#rd-bg-count').text(`${bgDone} / ${bgItems.length}`);
            const tracks = (this.musicManifest && this.musicManifest.tracks) || [];
            const musicDone = tracks.filter(t => this.isDownloaded(t.audio_path) && this.isDownloaded(t.cover_path)).length;
            $('#rd-music-count').text(`${musicDone} / ${tracks.length}`);
            const titleItems = this.getTitleItems();
            const titleDone = titleItems.filter(i => this.isDownloaded(i.path)).length;
            $('#rd-title-count').text(`${titleDone} / ${titleItems.length}`);

            const bgAll = bgItems.length > 0 && bgDone >= bgItems.length;
            const musicAll = tracks.length > 0 && musicDone >= tracks.length;
            const titleAll = titleItems.length > 0 && titleDone >= titleItems.length;

            // 下载完成后隐藏下载按钮，改为「已下载」提示，避免重复下载
            if (bgAll) {
                $('#rd-download-bg-btn').hide();
                $('#rd-delete-bg-btn').show();
                $('#rd-bg-done').show();
                $('#rd-bg-progress-wrap').show();
                $('#rd-bg-progress-bar').css('width', '100%');
                $('#rd-bg-progress-text').text(`全部下载完成 (${bgDone}/${bgItems.length})`);
            } else {
                $('#rd-delete-bg-btn').hide();
                $('#rd-bg-done').hide();
                // 未全部完成时进度条按实际比例显示，避免残留满格进度
                $('#rd-bg-progress-bar').css('width', (bgItems.length ? Math.round(bgDone / bgItems.length * 100) : 0) + '%');
                if (this.bgDownloading) {
                    this.setDownloadButton('bg');
                } else {
                    $('#rd-download-bg-btn').show().prop('disabled', false).html('<i class="fas fa-download"></i> 下载背景资源包');
                    // 未下载完成且未在下载：恢复为可下载状态提示
                    if (bgItems.length === 0) {
                        $('#rd-bg-progress-text').text('资源清单加载失败，请检查网络后点击下载重试');
                    } else if (bgDone > 0) {
                        $('#rd-bg-progress-text').text(`已下载 ${bgDone}/${bgItems.length}，点击继续下载`);
                    } else {
                        $('#rd-bg-progress-text').text('未下载');
                    }
                }
            }
            if (musicAll) {
                $('#rd-download-music-btn').hide();
                $('#rd-delete-music-btn').show();
                $('#rd-music-done').show();
                $('#rd-music-progress-wrap').show();
                $('#rd-music-progress-bar').css('width', '100%');
                $('#rd-music-progress-text').text(`全部下载完成 (${musicDone}/${tracks.length})`);
            } else {
                $('#rd-delete-music-btn').hide();
                $('#rd-music-done').hide();
                $('#rd-music-progress-bar').css('width', (tracks.length ? Math.round(musicDone / tracks.length * 100) : 0) + '%');
                if (this.musicDownloading) {
                    this.setDownloadButton('music');
                } else {
                    $('#rd-download-music-btn').show().prop('disabled', false).html('<i class="fas fa-download"></i> 下载音乐资源包');
                    if (tracks.length === 0) {
                        $('#rd-music-progress-text').text('资源清单加载失败，请检查网络后点击下载重试');
                    } else if (musicDone > 0) {
                        $('#rd-music-progress-text').text(`已下载 ${musicDone}/${tracks.length}，点击继续下载`);
                    } else {
                        $('#rd-music-progress-text').text('未下载');
                    }
                }
            }

            if (titleAll) {
                $('#rd-download-title-btn').hide();
                $('#rd-delete-title-btn').show();
                $('#rd-title-done').show();
                $('#rd-title-progress-wrap').show();
                $('#rd-title-progress-bar').css('width', '100%');
                $('#rd-title-progress-text').text(`全部下载完成 (${titleDone}/${titleItems.length})`);
            } else {
                $('#rd-delete-title-btn').hide();
                $('#rd-title-done').hide();
                $('#rd-title-progress-bar').css('width', (titleItems.length ? Math.round(titleDone / titleItems.length * 100) : 0) + '%');
                if (this.titleDownloading) {
                    this.setDownloadButton('title');
                } else {
                    $('#rd-download-title-btn').show().prop('disabled', false).html('<i class="fas fa-download"></i> 下载段位图标资源包');
                    if (titleItems.length === 0) {
                        // 清单还没加载完时不要显示「加载失败」，避免误导
                        $('#rd-title-progress-text').text(this.titleManifest ? '资源清单加载失败，请检查网络后点击下载重试' : '正在获取资源清单...');
                    } else if (this.titleLastResult) {
                        // 上次下载有失败项：保留失败提示
                        $('#rd-title-progress-text').text(this.titleLastResult);
                    } else if (titleDone > 0) {
                        $('#rd-title-progress-text').text(`已下载 ${titleDone}/${titleItems.length}，点击继续下载`);
                    } else {
                        $('#rd-title-progress-text').text('未下载');
                    }
                }
            }

            // 段位图标未下载时，主界面段位入口加锁标记，提示用户需要先下载
            try {
                var $row = $('#profile-title-row');
                if ($row.length) {
                    if (this.isTitlesDownloaded()) {
                        $row.removeClass('titles-locked');
                        $row.find('.titles-lock-badge').remove();
                    } else if (!$row.hasClass('titles-locked')) {
                        $row.addClass('titles-locked');
                        if (!$row.find('.titles-lock-badge').length) {
                            $row.append('<span class="titles-lock-badge" style="font-size:11px;color:#ef4444;margin-left:6px;"><i class="fas fa-lock"></i> 需下载</span>');
                        }
                    }
                }
            } catch (e) {}
        },
        openModal() {
            // 打开时重新校验：清理上次中断/退出留下的损坏记录，避免「显示已下载但无法再次下载」
            if (!this.bgManifest || this.getBgItems().length === 0) this.bgManifest = null;
            if (!this.musicManifest || !(this.musicManifest.tracks || []).length) this.musicManifest = null;
            if (!this.titleManifest || this.getTitleItems().length === 0) this.titleManifest = null;
            if (!this.minigameManifest || this.getMiniGameItems().length === 0) this.minigameManifest = null;
            this.loadAllManifests()
                .then(() => this.validateDownloads())
                .then(() => this.preloadMusicCache())
                .then(() => this.refreshUI())
                .catch(() => this.refreshUI());
            EventManager.openModal('resource-download-modal');
        },

        // 删除某类已下载的资源（从 IndexedDB 移除）
        deleteResource(type) {
            var labelMap = { bg: '背景资源包', music: '音乐资源包', title: '段位图标资源包', minigame: '小游戏资源包' };
            var label = labelMap[type] || '资源包';

            var modalId = '__rd-delete-confirm';
            $('#' + modalId).remove();

            var $modal = $(
                '<div class="modal-overlay" id="' + modalId + '">' +
                '<div class="modal-content" style="max-width:360px;">' +
                '<div class="modal-header">' +
                '<div class="modal-title"><i class="fas fa-exclamation-triangle" style="color:#f59e0b;"></i> 确认删除</div>' +
                '<button class="modal-close">&times;</button>' +
                '</div>' +
                '<div class="modal-body" style="padding:20px 0;text-align:center;">' +
                '<div style="font-size:48px;color:#f59e0b;margin-bottom:12px;"><i class="fas fa-trash"></i></div>' +
                '<div style="color:#e2e8f0;font-size:15px;margin-bottom:8px;font-weight:500;">确定要删除「' + label + '」吗？</div>' +
                '<div style="color:#94a3b8;font-size:13px;">删除后需要重新下载。</div>' +
                '</div>' +
                '<div class="modal-footer" style="justify-content:center;gap:12px;">' +
                '<button class="modal-btn" data-act="cancel" style="min-width:100px;">取消</button>' +
                '<button class="modal-btn danger" data-act="ok" style="min-width:100px;background:#ef4444;border-color:#ef4444;">确认删除</button>' +
                '</div>' +
                '</div>' +
                '</div>'
            );
            $('body').append($modal);
            // 关键：加 .show class 让 modal-overlay opacity 从 0 过渡到 1
            _.delay(function() { $modal.addClass('show'); }, 10);
            try { var _a = new Audio('audio/open-confirm-disable.mp3'); _a.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1); _a.play().catch(function(){}); } catch (e) {}

            var closeModal = function() {
                $modal.removeClass('show');
                _.delay(function() { $modal.remove(); }, 320);
            };

            $modal.on('click', function(e) {
                if ($(e.target).hasClass('modal-overlay')) closeModal();
            });
            $modal.find('.modal-close, [data-act="cancel"]').on('click', function() { Utils.playAudio('click-audio', { volume: 1 }); closeModal(); });
            $modal.find('[data-act="ok"]').on('click', function() {
                var audio = new Audio('audio/open-notification.mp3');
                audio.volume = (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
                audio.play().catch(function(){});
                closeModal();
                _.delay(function() { ResourceDownloadManager._doDeleteResource(type, label); }, 350);
            });
        },

        async _doDeleteResource(type, label) {
            try {
                var paths = [];
                if (type === 'bg') {
                    paths = this.getBgItems().map(function(i) { return i.path; });
                } else if (type === 'music') {
                    var tracks = (this.musicManifest && this.musicManifest.tracks) || [];
                    tracks.forEach(function(t) { if (t.audio_path) paths.push(t.audio_path); if (t.cover_path) paths.push(t.cover_path); });
                    this.musicBlobCache = {};
                } else if (type === 'title') {
                    paths = this.getTitleItems().map(function(i) { return i.path; });
                } else if (type === 'minigame') {
                    paths = this.getMiniGameItems().map(function(i) { return i.path; });
                    try { localStorage.removeItem('__mg_return_url'); } catch (e) {}
                }
                if (paths.length === 0) {
                    if (window.showToast) window.showToast('未检测到已下载资源，无需删除');
                    return;
                }

                var db = await this.openDB();
                // 主 store
                await new Promise(function(resolve, reject) {
                    var tx = db.transaction(this.storeName, 'readwrite');
                    var store = tx.objectStore(this.storeName);
                    for (var i = 0; i < paths.length; i++) {
                        try { store.delete(paths[i]); } catch (e) {}
                    }
                    tx.oncomplete = resolve;
                    tx.onerror = function() { reject(tx.error); };
                }.bind(this));

                // pending store（如果存在的话）
                try {
                    await new Promise(function(resolve) {
                        try {
                            var tx2 = db.transaction('pending', 'readwrite');
                            var store2 = tx2.objectStore('pending');
                            for (var j = 0; j < paths.length; j++) {
                                try { store2.delete(paths[j]); } catch (e) {}
                            }
                            tx2.oncomplete = resolve;
                            tx2.onerror = resolve;
                        } catch (e) { resolve(); }
                    });
                } catch (e) {}

                // 回退当前背景
                try {
                    var curBg = localStorage.getItem(BackgroundManager.storageKey);
                    if (type === 'bg' && curBg && paths.indexOf(curBg) >= 0) {
                        var defaultBg = BackgroundManager.backgrounds[0];
                        if (defaultBg) BackgroundManager.applyBackground(defaultBg.path);
                    }
                } catch (e) {}

                await this.preloadMusicCache();
                // 关键：删除后刷新清单状态 + UI，确保已删除项不会被误判为已下载
                await this.validateDownloads();
                this.refreshUI();
                if (window.showToast) window.showToast(label + ' 已删除（' + paths.length + ' 个文件）');
            } catch (e) {
                console.warn('[RDM] _doDeleteResource failed', e);
                if (window.showToast) window.showToast('删除失败：' + (e && e.message ? e.message : '未知错误'));
            }
        },

        // 取出 IndexedDB 里某条资源 blob，未找到则回退远程地址再不行返回 null
        async _getBlobOrRemote(path) {
            if (!path) return null;
            try {
                const db = await this.openDB();
                const record = await new Promise((resolve, reject) => {
                    const tx = db.transaction(this.storeName, 'readonly');
                    const req = tx.objectStore(this.storeName).get(path);
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = () => reject(req.error);
                });
                if (record && record.blob) return record.blob;
            } catch (e) {}
            return null;
        },

        // 启动 MiniGame：内置版直接跳转
        launchMiniGame() {
            try {
                // 注入返回按钮到 MiniGame/index.html，通过 location.href 跳转
                location.href = 'MiniGame/index.html';
            } catch (e) {
                console.warn('[RDM] launchMiniGame failed', e);
                if (window.showToast) window.showToast('小游戏启动失败');
            }
        },
        // 音乐路径缓存：预先把已下载的音乐 blob URL 缓存起来，供 MusicPlayer 同步使用
        musicBlobCache: {},
        // 缓存就绪信号：MusicPlayer 初始化时若在此前加载曲目，会回退成默认音乐
        musicCacheReady: null,
        _musicCacheResolve: null,
        musicCacheLoaded: false,

        async preloadMusicCache() {
            const tracks = (this.musicManifest && this.musicManifest.tracks) || [];
            const paths = [];
            tracks.forEach(t => { paths.push(t.audio_path); paths.push(t.cover_path); });
            for (const p of paths) {
                if (this.musicBlobCache[p]) continue;
                try {
                    const db = await this.openDB();
                    const record = await new Promise((resolve, reject) => {
                        const tx = db.transaction(this.storeName, 'readonly');
                        const req = tx.objectStore(this.storeName).get(p);
                        req.onsuccess = () => resolve(req.result);
                        req.onerror = () => reject(req.error);
                    });
                    if (record && record.blob) {
                        this.musicBlobCache[p] = URL.createObjectURL(record.blob);
                    }
                } catch (e) {}
            }
            if (tracks.length) this.musicCacheLoaded = true;
            // 缓存到位后校正可能已按默认资源加载的当前曲目
            this.reconcileMusicSource();
        },

        // 通知等待方：音乐缓存已就绪（或已确认无可加载资源）
        notifyMusicCacheReady() {
            if (this._musicCacheResolve) {
                this._musicCacheResolve();
                this._musicCacheResolve = null;
            }
            this.reconcileMusicSource();
        },

        // 曲目实际播放源与正确资源不一致时（常见于启动早于缓存就绪），重新加载并找回进度
        reconcileMusicSource() {
            try {
                const p = window.musicPlayer;
                if (!p || !p.isInitialized || !p.audio || !p.playlist) return;
                const track = p.playlist[p.currentTrackIndex];
                if (!track) return;
                const correct = p.getFullPath(track.file);
                const cur = p.audio.currentSrc || p.audio.src || '';
                if (!correct || !cur) return;
                // 已是正确资源，或正在用该曲目自己的 blob，则无需处理
                if (cur === correct) return;
                if (track._seekBlobUrl && cur === track._seekBlobUrl && track._seekBlobSrc === correct) return;
                // 清掉可能被污染的 blob（例如按默认音乐转出来的那份）
                if (track._seekBlobUrl) {
                    try { URL.revokeObjectURL(track._seekBlobUrl); } catch (e) {}
                    delete track._seekBlobUrl;
                    delete track._seekBlobSrc;
                }
                // 用已保存的原始进度；此时 audio.currentTime 可能已被短时长资源 clamp 坏
                const saved = typeof p.loadPlayState === 'function' ? p.loadPlayState() : null;
                const keepTime = (saved && saved.index === p.currentTrackIndex && _.isNumber(saved.time))
                    ? saved.time
                    : (p.audio.currentTime || 0);
                p.loadTrack(p.currentTrackIndex, false);
                if (keepTime > 1) {
                    p.pendingRestoreTime = keepTime;
                    const audio = p.audio;
                    // seekTo 返回 false（元数据未就绪）时保留 pendingRestoreTime，交给 loadedmetadata
                    if (audio && audio.readyState >= 1 && typeof p.seekTo === 'function') {
                        if (p.seekTo(keepTime)) p.pendingRestoreTime = null;
                    }
                }
                if (typeof p.preloadCurrentCover === 'function') p.preloadCurrentCover();
                console.log('[RDM] 已校正曲目播放源：' + (track.title || ''));
            } catch (e) {}
        },

        // 下载完成后清除旧的音频缓存，确保下次播放使用新下载的文件
        invalidateMusicBlobs() {
            const p = window.musicPlayer;
            if (!p || !p.playlist) return;
            p.playlist.forEach(t => {
                if (t._blobUrl) {
                    try { URL.revokeObjectURL(t._blobUrl); } catch (e) {}
                    delete t._blobUrl;
                }
                // seek 用的包内音源 blob 也一并失效
                if (t._seekBlobUrl) {
                    try { URL.revokeObjectURL(t._seekBlobUrl); } catch (e) {}
                    delete t._seekBlobUrl;
                }
            });
        },

        // 音乐资源路径解析（同步，从缓存取；未缓存则返回原路径或默认）
        getCachedMusicPath(path) {
            if (!path) return path;
            // blob: 是本地导入音乐的内嵌封面或音频，直接返回，不能回退成默认资源
            if (path.indexOf('blob:') === 0) return path;
            if (path === this.defaultMusicFile || path === this.defaultMusicCover) return path;
            // 本地导入音乐的默认封面是内置静态资源，不走音乐缓存回退
            if (path.indexOf('custom-music-default') !== -1) return path;
            if (this.musicBlobCache[path]) return this.musicBlobCache[path];
            // IndexedDB 缓存还没恢复完：先返回原路径。
            // 此时若回退成默认音乐，会出现“封面是当前曲目、声音却是默认曲目”的错位。
            if (!this.musicCacheLoaded) return path;
            // 未下载回退到默认
            return path.indexOf('covers/') !== -1 ? this.defaultMusicCover : this.defaultMusicFile;
        }
    };

    // 暴露到 window 供外部调用
    window.ResourceDownloadManager = ResourceDownloadManager;
    // 段位图标下载完成后需要刷新段位弹窗
    window.TitleManager = TitleManager;
    // 供 i18n 切换语言后重绘动态区域
    window.UIManager = UIManager;

    /* ============================================================
     * 覆盖 BackgroundManager 方法
     * 1. applyBackground - 从 IndexedDB 解析路径，localStorage 存原始路径
     * 2. openSelector - 资源未全部下载时跳转资源下载弹窗
     * 3. previewCurrentBackground - 解析路径
     * 4. buildGrid - 缩略图解析路径
     * ============================================================ */
    (function patchBackgroundManager() {
        const RDM = ResourceDownloadManager;

        // applyBackground
        const _origApplyBackground = BackgroundManager.applyBackground;
        BackgroundManager.applyBackground = function(path, isVideoHint) {
            const self = this;
            const originalPath = path;
            // 视频判断必须基于原始路径（解析后是 blob: URL，不含扩展名）
            const isVideo = isVideoHint !== undefined ? isVideoHint : /\.(mp4|webm)(\?|$)/i.test(originalPath);
            const fallback = RDM.getBgRemoteUrl(originalPath);

            const applyResolved = (resolved) => {
                if (isVideo) {
                    _origApplyBackground.call(self, resolved, true, fallback);
                    localStorage.setItem(self.storageKey, originalPath);
                    return;
                }
                // 图片：先探测能否加载，失败时回退默认背景视频，避免出现纯黑背景
                let settled = false;
                const apply = (url, asVideo) => {
                    if (settled) return;
                    settled = true;
                    _origApplyBackground.call(self, url, asVideo, asVideo ? fallback : undefined);
                    localStorage.setItem(self.storageKey, originalPath);
                };
                const probe = new Image();
                probe.onload = () => apply(resolved, false);
                probe.onerror = () => apply(RDM.defaultBgPath, true);
                probe.src = resolved;
                // 3 秒内没加载完也先应用，避免一直黑屏等待
                setTimeout(() => apply(resolved, false), 3000);
            };

            RDM.resolvePath(path).then(applyResolved).catch(() => {
                // 存储异常时直接走远程地址，保证只有已下载但索引损坏时也能显示
                applyResolved(isVideo ? fallback : RDM.getBgRemoteUrl(originalPath));
            });
        };

        // openSelector - 未下载也可打开；未下载的背景在网格里不显示
        const _origOpenSelector = BackgroundManager.openSelector;
        BackgroundManager.openSelector = function() {
            // 每次打开都重建网格，避免继续使用已失效的 blob URL（重新下载/校验清理后）
            const $grid = $('#bg-grid');
            if ($grid.length) $grid.empty();
            return _origOpenSelector.call(this);
        };

        // previewCurrentBackground - 解析路径
        const _origPreview = BackgroundManager.previewCurrentBackground;
        BackgroundManager.previewCurrentBackground = function() {
            const bg = this.backgrounds[this.currentIndex];
            if (!bg) {
                if (window.showToast) window.showToast('请选择一个背景');
                return;
            }
            const self = this;
            const remote = RDM.getBgRemoteUrl(bg.path);
            const isVideo = /\.(mp4|webm)(\?|$)/i.test(bg.path);
            const attachVideoFallback = () => {
                const v = document.getElementById('bg-preview-video');
                if (!v || !isVideo) return;
                v.addEventListener('error', function() {
                    if (this.dataset.fallbackApplied) return;
                    this.dataset.fallbackApplied = '1';
                    this.querySelectorAll('source').forEach(s => s.remove());
                    this.src = remote;
                    this.load();
                    this.play().catch(() => {});
                });
            };
            RDM.resolvePath(bg.path).then(resolved => {
                const tmp = Object.assign({}, bg, { path: resolved, _origPath: bg.path });
                const savedIndex = self.currentIndex;
                self.backgrounds[savedIndex] = tmp;
                _origPreview.call(self);
                self.backgrounds[savedIndex] = bg;
                attachVideoFallback();
            }).catch(() => {
                _origPreview.call(self);
                attachVideoFallback();
            });
        };

        // 视频首帧缓存 + 串行截图队列：只在卡片进入可视区域后截图，避免几十个视频同时解码
        const posterCache = Object.create(null);
        const posterQueue = [];
        let posterBusy = false;

        const captureVideoPoster = (src) => new Promise(resolve => {
            const video = document.createElement('video');
            video.muted = true;
            video.playsInline = true;
            video.preload = 'auto';
            // 关键：blob URL 同源不需要 crossOrigin，远程 CDN 加了反而可能因没 CORS 头导致 canvas taint
            // 先尝试不加 crossOrigin；如果 canvas 抛 SecurityError 再 fallback
            video.src = src;
            let settled = false;
            const finish = (url) => {
                if (settled) return;
                settled = true;
                try { video.removeAttribute('src'); video.load(); } catch (e) {}
                resolve(url || '');
            };
            const tryCapture = () => {
                if (settled) return;
                try {
                    if (!video.videoWidth || !video.videoHeight) { return; }
                    const canvas = document.createElement('canvas');
                    canvas.width = 320;
                    canvas.height = 180;
                    canvas.getContext('2d').drawImage(video, 0, 0, 320, 180);
                    finish(canvas.toDataURL('image/jpeg', 0.7));
                } catch (e) {
                    // canvas tainted（跨域）→ 用 video 元素的 poster 兜底
                    finish('');
                }
            };
            // 多事件兜底：loadeddata / canplay / seeked / timeupdate 都尝试截图
            video.addEventListener('loadeddata', () => {
                try { video.currentTime = Math.min(0.1, (video.duration || 0.1)); } catch (e) { finish(''); }
            }, { once: true });
            video.addEventListener('seeked', tryCapture, { once: true });
            video.addEventListener('canplay', tryCapture, { once: true });
            video.addEventListener('timeupdate', tryCapture, { once: true });
            video.addEventListener('playing', tryCapture, { once: true });
            video.addEventListener('error', () => finish(''), { once: true });
            setTimeout(() => finish(''), 4000);
            try { video.load(); } catch (e) {}
        });

        const runPosterQueue = () => {
            if (posterBusy) return;
            const job = posterQueue.shift();
            if (!job) return;
            posterBusy = true;
            captureVideoPoster(job.src).then(url => {
                posterBusy = false;
                if (url) {
                    posterCache[job.orig] = url;
                    if (job.img && job.img.parentNode) job.img.src = url;
                }
                runPosterQueue();
            });
        };

        /* ============================================================
         * 背景喜好 + 背景设置（定时切换 / 每次重开更换）
         * ============================================================ */
        const BG_FAV_KEY = 'ab_bg_favorites';
        const BG_SETTINGS_KEY = 'ab_bg_settings';
        window.BackgroundFavorites = {
            _ids: [],
            _timer: null,
            init() {
                try { this._ids = JSON.parse(localStorage.getItem(BG_FAV_KEY) || '[]'); } catch (e) { this._ids = []; }
                this.settings = this._loadSettings();
                this._applyReopenSwitch();
            },
            _loadSettings() {
                try { return JSON.parse(localStorage.getItem(BG_SETTINGS_KEY) || '{}'); } catch (e) { return {}; }
            },
            _saveSettings() {
                try { localStorage.setItem(BG_SETTINGS_KEY, JSON.stringify(this.settings)); } catch (e) {}
            },
            has(id) { return this._ids.indexOf(id) !== -1; },
            toggle(id) {
                const i = this._ids.indexOf(id);
                if (i === -1) this._ids.push(id); else this._ids.splice(i, 1);
                try { localStorage.setItem(BG_FAV_KEY, JSON.stringify(this._ids)); } catch (e) {}
            },
            getFavoriteBackgrounds() {
                return BackgroundManager.backgrounds.filter(bg => this.has(bg.id));
            },
            updateFavoriteBtn() {
                const bg = BackgroundManager.backgrounds[BackgroundManager.currentIndex];
                const $btn = $('#bg-favorite-btn');
                if (!bg) { $btn.prop('disabled', false).removeClass('active').html('<i class="fas fa-star"></i> 加入喜好'); return; }
                if (!BackgroundManager.isBackgroundUnlocked(bg.id)) {
                    $btn.prop('disabled', true).removeClass('active').html('<i class="fas fa-star"></i> 加入喜好');
                    return;
                }
                $btn.prop('disabled', false);
                if (this.has(bg.id)) {
                    $btn.addClass('active').html('<i class="fas fa-star"></i> 取消喜好');
                } else {
                    $btn.removeClass('active').html('<i class="fas fa-star"></i> 加入喜好');
                }
            },
            openSettingsModal() {
                const s = this.settings;
                $('#bg-favorites-play').prop('checked', !!s.playFavorites);
                $('#bg-settings-desc').toggle(!!s.playFavorites);
                const favCount = this._ids.length;
                $('#bg-settings-info').html(favCount
                    ? `当前已喜好 ${favCount} 个背景。`
                    : '还没有喜好的背景，请先在背景商店中加入喜好。');
                // 同步自定义背景按钮状态：轮放开启时隐藏自定义区，关闭时显示
                this._syncCustomBgRow();
                if (window.ModalRegistry) ModalRegistry.open('bg-settings-modal');
                else { $('#bg-settings-modal').css('display', 'flex'); setTimeout(() => $('#bg-settings-modal').addClass('show'), 10); }
            },
            _syncCustomBgRow() {
                const play = $('#bg-favorites-play').is(':checked');
                const hasCustom = window.CustomBackground && window.CustomBackground.hasCustom();
                if (play) {
                    $('#bg-settings-custom-row').hide();
                } else {
                    $('#bg-settings-custom-row').show();
                    if (window.CustomBackground) {
                        if (hasCustom) {
                            $('#bg-settings-custom-bg-clear-btn').show();
                            $('#bg-settings-custom-bg-btn').hide();
                        } else {
                            $('#bg-settings-custom-bg-clear-btn').hide();
                            $('#bg-settings-custom-bg-btn').show();
                        }
                    }
                }
            },
            closeSettingsModal() {
                if (window.ModalRegistry) ModalRegistry.close('bg-settings-modal');
                else { $('#bg-settings-modal').removeClass('show'); setTimeout(() => $('#bg-settings-modal').css('display', 'none'), 300); }
            },
            saveSettings() {
                const wasPlaying = this.settings.playFavorites;
                this.settings.playFavorites = $('#bg-favorites-play').is(':checked');
                this._saveSettings();
                this.applyCycling();
                // 轮放开启时：立即清除自定义背景
                if (this.settings.playFavorites && !wasPlaying) {
                    this._deleteCustomBg();
                }
                if (window.showToast) window.showToast('背景设置已保存');
                this.closeSettingsModal();
            },
            // 清除自定义背景并回退到默认/喜好背景
            _deleteCustomBg() {
                if (!window.CustomBackground || !window.CustomBackground.hasCustom()) return;
                try {
                    // 1. 清除 localStorage 标志（立即生效）
                    window.CustomBackground.setFlag(false);
                    // 2. 删除 IndexedDB 数据库
                    if (typeof indexedDB !== 'undefined') {
                        const dbReq = indexedDB.deleteDatabase(window.CustomBackground.dbName);
                        dbReq.onsuccess = () => { window.CustomBackground._db = null; };
                        dbReq.onerror = () => { window.CustomBackground._db = null; };
                    }
                    // 3. 清除内存中的 blob URL
                    if (window.CustomBackground._objectUrl) {
                        try { URL.revokeObjectURL(window.CustomBackground._objectUrl); } catch (e) {}
                        window.CustomBackground._objectUrl = null;
                    }
                    // 4. 更新按钮状态
                    if (window.CustomBackground.updateClearButton) {
                        window.CustomBackground.updateClearButton();
                    }
                    // 5. 回退到默认背景（关键：屏幕视觉也要同步清除）
                    if (window.BackgroundManager) {
                        const defaultBg = window.BackgroundManager.backgrounds.find(b => Number(b.id) === 1)
                            || window.BackgroundManager.backgrounds[0];
                        if (defaultBg) window.BackgroundManager.applyBackground(defaultBg.path);
                    }
                } catch (e) {}
            },
            applyCycling() {
                if (this._timer) { clearInterval(this._timer); this._timer = null; }
                // 已移除定时切换，仅保留"每次进入游戏随机切换"，无需定时器
            },
            // 每次进入游戏：若开启「播放喜好的壁纸」，则随机切换一张喜好背景并应用+持久化。
            // 返回选中的背景；未开启/无喜好/全部未解锁时返回 null（调用方回退到保存的或默认背景）。
            pickRandomFavoriteOnEntry() {
                if (!this.settings.playFavorites) return null;
                const favs = this.getFavoriteBackgrounds();
                if (favs.length === 0) return null;
                const pick = favs[Math.floor(Math.random() * favs.length)];
                const realIdx = BackgroundManager.backgrounds.indexOf(pick);
                if (realIdx === -1) return null;
                if (!BackgroundManager.isBackgroundUnlocked(pick.id)) return null;
                BackgroundManager.currentIndex = realIdx;
                BackgroundManager.selectedIndex = realIdx;
                // 应用喜好背景时清除自定义背景（避免两者冲突）
                BackgroundManager.applyBackground(pick.path);
                BackgroundFavorites._deleteCustomBg();
                return pick;
            },
            _switchToNextFavorite() {
                const favs = this.getFavoriteBackgrounds();
                if (favs.length < 2) return;
                const cur = BackgroundManager.backgrounds[BackgroundManager.currentIndex];
                let idx = favs.findIndex(b => b.id === (cur && cur.id));
                idx = (idx + 1) % favs.length;
                const realIdx = BackgroundManager.backgrounds.indexOf(favs[idx]);
                if (realIdx !== -1) {
                    BackgroundManager.currentIndex = realIdx;
                    BackgroundManager.confirmSelection();
                }
            },
            _applyReopenSwitch() {
                if (!this.settings.playFavorites) return;
                const favs = this.getFavoriteBackgrounds();
                if (favs.length === 0) return;
                // 随机选一个喜好背景
                const pick = favs[Math.floor(Math.random() * favs.length)];
                const realIdx = BackgroundManager.backgrounds.indexOf(pick);
                if (realIdx !== -1) {
                    BackgroundManager.currentIndex = realIdx;
                    BackgroundManager.confirmSelection();
                }
            }
        };
        BackgroundFavorites.init();
        // 「每次进入游戏随机切换喜好背景」由游戏启动流程调用 BackgroundFavorites.pickRandomFavoriteOnEntry() 处理，
        // 不再包装 loadBackgrounds（避免与启动处的 loadSavedBackground 竞态覆盖随机结果）
        // 卡片选中时更新喜好按钮状态
        const _origRenderPreview = BackgroundManager.renderPreview;
        BackgroundManager.renderPreview = async function () {
            const r = _origRenderPreview ? await _origRenderPreview.call(this) : undefined;
            BackgroundFavorites.updateFavoriteBtn();
            return r;
        };

        // buildGrid - 立即渲染卡片，缩略图按需异步加载（不再为每张卡创建 video）
        BackgroundManager.buildGrid = function() {
            const self = this;
            const $grid = $('#bg-grid');
            $grid.empty();
            if (this.backgrounds.length === 0) return;

            const frag = document.createDocumentFragment();
            // 喜好的背景置顶
            const favIds = BackgroundFavorites._ids;
            const sorted = this.backgrounds.slice().sort((a, b) => {
                const af = favIds.indexOf(a.id) !== -1 ? 1 : 0;
                const bf = favIds.indexOf(b.id) !== -1 ? 1 : 0;
                return bf - af;
            });
            sorted.forEach((bg) => {
                const available = bg.path === 'pictures/background.mp4' || bg.path === 'backgrounds/background.mp4' ||
                    (window.ResourceDownloadManager && window.ResourceDownloadManager.isDownloaded && window.ResourceDownloadManager.isDownloaded(bg.path));
                if (!available) return;
                const index = self.backgrounds.indexOf(bg);
                const isVideo = /\.(mp4|webm)(\?|$)/i.test(bg.path);
                const unlocked = self.isBackgroundUnlocked(bg.id);
                const el = document.createElement('div');
                el.className = 'bg-thumb' + (unlocked ? ' unlocked' : ' locked')
                    + (index === self.currentIndex ? ' selected' : '')
                    + (BackgroundFavorites.has(bg.id) ? ' favorited' : '');
                el.setAttribute('data-index', index);
                el.innerHTML =
                    '<div class="bg-thumb-img">' +
                        '<img alt="" decoding="async">' +
                        (!unlocked ? '<div class="bg-thumb-lock"><i class="fas fa-lock"></i></div>' : '') +
                    '</div>' +
                    '<div class="bg-thumb-name"></div>' +
                    '<div class="bg-thumb-price"></div>';
                el.querySelector('.bg-thumb-name').textContent = bg.name;
                el.querySelector('.bg-thumb-price').innerHTML = unlocked
                    ? '<span style="color:#4ade80;">已解锁</span>'
                    : Utils.formatCurrency(bg.price);
                frag.appendChild(el);
            });
            if (!frag.childElementCount) {
                $grid.html('<div style="padding:24px;text-align:center;color:#94a3b8;font-size:13px;line-height:1.8;">尚未下载背景资源<br><span style="font-size:12px;color:#6b7280;">请先到「资源下载」下载后再选择</span></div>');
                return;
            }
            $grid.append(frag);
            self._fillThumbs();
        };

        // 按可视区域填充缩略图
        BackgroundManager._fillThumbs = function() {
            const self = this;
            const grid = document.getElementById('bg-grid');
            if (!grid) return;
            const cards = Array.from(grid.children);
            if (cards.length === 0) return;

            const loadCard = (el) => {
                if (!el || el.dataset.loaded === '1') return;
                el.dataset.loaded = '1';
                const bg = self.backgrounds[Number(el.dataset.index)];
                if (!bg) return;
                const img = el.querySelector('.bg-thumb-img img');
                if (!img) return;
                // Mod 背景：直接从本地 blob 解析
                if (window.ModManager && window.ModManager.isModPath(bg.path)) {
                    const modUrl = window.ModManager.resolvePath(bg.path);
                    if (modUrl) {
                        if (window.ModManager.isModVideo(bg.path)) {
                            posterQueue.push({ el, img, orig: bg.path, src: modUrl });
                            runPosterQueue();
                        } else {
                            img.src = modUrl;
                        }
                    }
                    return;
                }
                const isVideo = /\.(mp4|webm)(\?|$)/i.test(bg.path);
                const remote = RDM.getBgRemoteUrl(bg.path);
                const applyImage = (src) => {
                    if (!src) return;
                    img.onerror = () => { img.onerror = null; img.src = remote; };
                    img.src = src;
                };

                if (!isVideo) {
                    RDM.resolvePath(bg.path).then(applyImage).catch(() => applyImage(remote));
                    return;
                }
                if (posterCache[bg.path]) {
                    applyImage(posterCache[bg.path]);
                    return;
                }
                // 已下载优先用 blob，未下载用远程地址；截图串行执行
                RDM.resolvePath(bg.path).then(src => {
                    posterQueue.push({ el, img, orig: bg.path, src: src || remote });
                    runPosterQueue();
                }).catch(() => {
                    posterQueue.push({ el, img, orig: bg.path, src: remote });
                    runPosterQueue();
                });
            };

            if ('IntersectionObserver' in window) {
                if (self._thumbObserver) self._thumbObserver.disconnect();
                self._thumbObserver = new IntersectionObserver(entries => {
                    entries.forEach(entry => {
                        if (!entry.isIntersecting) return;
                        self._thumbObserver.unobserve(entry.target);
                        loadCard(entry.target);
                    });
                }, { root: grid, rootMargin: '160px' });
                cards.forEach(card => self._thumbObserver.observe(card));
            } else {
                cards.forEach(loadCard);
            }
        };

        // 卡片点击使用事件委托，避免绑定几十个处理器
        $(document).off('click.bgGrid', '#bg-grid .bg-thumb').on('click.bgGrid', '#bg-grid .bg-thumb', function() {
            const index = Number(this.getAttribute('data-index'));
            if (isNaN(index)) return;
            BackgroundManager.currentIndex = index;
            BackgroundManager.renderPreview();
        });

        // renderPreview - buildGrid 现在是异步的，需要等待完成
        const _origRenderPreviewGrid = BackgroundManager.renderPreview;
        BackgroundManager.renderPreview = async function() {
            if (this.backgrounds.length === 0) return;
            const $grid = $('#bg-grid');
            if ($grid.children('.bg-thumb').length === 0) {
                await this.buildGrid();
            }
            return _origRenderPreviewGrid.call(this);
        };
    })();

    /* ============================================================
     * 覆盖 MusicPlayer.getFullPath，从 IndexedDB 缓存解析音乐路径
     * ============================================================ */
    (function patchMusicPlayer() {
        const RDM = ResourceDownloadManager;
        if (typeof MusicPlayer === 'undefined' || !MusicPlayer.prototype) return;

        const _origGetFullPath = MusicPlayer.prototype.getFullPath;
        MusicPlayer.prototype.getFullPath = function(filename) {
            if (!filename) return '';
            const full = _origGetFullPath.call(this, filename);
            // 用缓存解析（已下载→blob URL，未下载→默认资源）
            return RDM.getCachedMusicPath(full);
        };
    })();

    /* ============================================================
     * 未下载音乐资源包时禁止打开音乐列表
     * ============================================================ */
    document.addEventListener('click', function(e) {
        const target = e.target;
        const btn = target && target.closest ? target.closest('#music-playlist-btn') : null;
        if (!btn) return;
        // 未下载音乐资源也可打开列表；未下载曲目在列表里过滤（见 music.js）
    }, true);

    /* ============================================================
     * 效果设置 / 声音设置弹窗
     * ============================================================ */
    $('#sidebar-effect-settings-btn').on('click', function() {
        EventManager.openModal('effect-settings-modal');
    });
    $('#sidebar-sound-settings-btn').on('click', function() {
        EventManager.openModal('sound-settings-modal');
    });
    $('#effect-settings-close').on('click', function() {
        EventManager.closeModal('effect-settings-modal');
    });
    $('#sound-settings-close').on('click', function() {
        EventManager.closeModal('sound-settings-modal');
    });
    $('#effect-settings-modal, #sound-settings-modal').on('click', function(e) {
        if ($(e.target).is(this)) EventManager.closeModal($(this).attr('id'));
    });

    /* ============================================================
     * 热更新常量（安全增量：只加常量，不改旧代码逻辑）
     * ============================================================ */
    var HU_BASE_URL = 'https://raw.githubusercontent.com/incredibox-Para-DX/anqu-apk-release/main';
    var HU_MANIFEST_URL = HU_BASE_URL + '/manifest.json';
    // Cloudflare Worker 反代（供国内加速）；未部署时自动回落 raw，不影响发版
    var HU_PROXY_BASE = 'https://anqu-raw.sdfgasdfgwe7.workers.dev/incredibox-Para-DX/anqu-apk-release/main';
    // 最后兜底：jsDelivr。仓库体积控制不当会超 50MB 限制返回 403，只作末位候选
    var HU_JD_BASE = 'https://cdn.jsdelivr.net/gh/incredibox-Para-DX/anqu-apk-release@main';
    var HU_STORAGE_KEY = 'hotupdate_current_version';
    // 当前运行的构建版本（写死在脚本里 = 真实生效版本，不依赖 localStorage）。
    // ⚠ 必须与 manifest.json 的 version 同步升，否则自动检查会一直误判「有新版」（远程 manifest > 本地 HU_BUILD_VERSION）。
    window.HU_BUILD_VERSION = 'v2.3.0_hotfix.46';

    /* ============================================================
     * 检查更新
     * ============================================================ */
    $('#sidebar-update-check-btn').on('click', function() {
        window.__huBusy = false;
        $('#update-check-progress').hide();
        $('#update-check-progress-bar').css('width', '0%');
        $('#update-check-progress-text').text('0%');
        $('#update-check-confirm').hide();
        $('#update-check-later').hide();
        $('#update-check-cancel').show().text('关闭');
        $('#update-check-close').show();
        $('#update-check-status').html('<span style="color:#94a3b8;">正在检查更新…</span>');
        EventManager.openModal('update-check-modal');
        try {
            window.__huFetchAndCompare(function(m, hasUpdate) {
                if (!m) {
                    $('#update-check-status').html('<span style="color:#f87171;">检查失败：无法连接更新服务器</span>');
                    return;
                }
                var curVer = window.HU_BUILD_VERSION;
                if (hasUpdate) {
                    // 第一步：确认是否更新（此时还没有下载任何东西）
                    $('#update-check-status').html(
                        '<span style="color:#fbbf24;">发现新版本</span>' +
                        '<br>当前版本：' + curVer +
                        '<br>最新版本：' + m.version
                    );
                    $('#update-check-cancel').hide();
                    $('#update-check-later').show().text('稍后再说').off('click').on('click', function() {
                        EventManager.closeModal('update-check-modal');
                    });
                    $('#update-check-confirm').show().text('立即更新').off('click').on('click', function() {
                        // 第二步：用户确认后才开始下载
                        window.__huBusy = true;
                        $('#update-check-later').hide();
                        $('#update-check-confirm').hide();
                        $('#update-check-cancel').hide();
                        $('#update-check-close').hide();
                        $('#update-check-progress').show();
                        $('#update-check-status').html('正在下载更新包，请稍候…<br><span style="color:#64748b;font-size:11px;">更新过程中请勿退出</span>');
                        window.__huStartProgress();
                        if (!window.AndroidUpdate || typeof window.AndroidUpdate.check !== 'function') {
                            window.__huBusy = false;
                            window.__huStopProgress();
                            $('#update-check-progress').hide();
                            $('#update-check-close').show();
                            $('#update-check-cancel').show();
                            $('#update-check-status').html('<span style="color:#f87171;">当前版本不支持热更新，请安装最新版 APP</span>');
                            return;
                        }
                        try {
                            // 用刚才 manifest 竞速选中的 base（可能是 Worker 反代），保证下载与版本一致
                            window.AndroidUpdate.check(window.__huActiveBase || HU_BASE_URL);
                        } catch (e) {
                            window.__huBusy = false;
                            window.__huStopProgress();
                            $('#update-check-progress').hide();
                            $('#update-check-close').show();
                            $('#update-check-cancel').show();
                            $('#update-check-status').html('<span style="color:#f87171;">更新启动失败：' + e + '</span>');
                        }
                    });
                } else {
                    $('#update-check-status').html(
                        '<span style="color:#10b981;">当前已是最新版本</span>' +
                        '<br>当前版本：' + curVer +
                        '<br>最新版本：' + m.version
                    );
                }
            });
        } catch (e) {
            $('#update-check-status').html('<span style="color:#f87171;">检查失败：' + e + '</span>');
        }
    });
    $('#update-check-close, #update-check-cancel').on('click', function() {
        if (window.__huBusy) return;  // 更新过程中不允许关闭
        EventManager.closeModal('update-check-modal');
    });
    $('#update-check-modal').on('click', function(e) {
        if ($(e.target).is(this) && !window.__huBusy) EventManager.closeModal('update-check-modal');
    });
    window.__onUpdateCheckResult = function(result) {
        var updated = !!(result && result.updated);
        window.__huStopProgress();
        if (updated) {
            // 下载完成 → 直接刷新生效
            $('#update-check-progress').show();
            $('#update-check-progress-bar').css('width', '100%');
            $('#update-check-progress-text').text('100%');
            $('#update-check-status').html('<span style="color:#10b981;">更新完成，正在刷新…</span>');
            $('#update-check-later').hide();
            $('#update-check-confirm').hide();
            $('#update-check-cancel').hide();
            $('#update-check-close').hide();
            setTimeout(function() { location.reload(); }, 800);
        } else {
            window.__huBusy = false;
            $('#update-check-progress').hide();
            $('#update-check-close').show();
            $('#update-check-cancel').show().text('关闭');
            $('#update-check-status').html('<span style="color:#64748b;">当前已是最新版本</span>');
        }
    };

    /* ============================================================
     * GM：自定义地址热更新（正式版里的私有测试通道）
     * 只有解锁了 GM Debug 才看得到入口，不会影响普通玩家
     * ============================================================ */
    (function () {
        var GM_HU_URL_KEY = 'ab_gm_hu_url';
        var $btn = $('#gm-hotupdate-btn');
        var $input = $('#gm-hotupdate-url');
        var $status = $('#gm-hotupdate-status');
        if (!$btn.length || !$input.length) return;

        $('#gm-hotupdate-curver').text(window.HU_BUILD_VERSION || '-');
        // 不自动回填历史链接（每次测试手动输入，避免旧地址残留）
        try { localStorage.removeItem(GM_HU_URL_KEY); } catch (e) {}

        function showStatus(html, color) {
            $status.show().css('color', color || '#94a3b8').html(html);
        }

        // 允许填 base 目录，也允许直接贴 .../manifest.json
        function normalizeUrl(raw) {
            return String(raw || '').trim()
                .replace(/\/+$/, '')
                .replace(/\/manifest\.json$/i, '');
        }

        // 原生下载结束后会回调这里：成功会自动刷新，失败则把原因留在 GM 面板
        var origUpdateResult = window.__onUpdateCheckResult;
        window.__onUpdateCheckResult = function (result) {
            if (window.__gmHuBusy) {
                window.__gmHuBusy = false;
                $btn.prop('disabled', false);
                if (result && result.updated) {
                    showStatus('更新已应用，正在刷新…', '#10b981');
                } else {
                    showStatus('未应用：地址不可达 / 下载失败 / manifest 的 version 与本地相同被跳过。<br>测试时请把私有 manifest 的 version 改成新值（如 ' + (window.HU_BUILD_VERSION || '') + '-test1）', '#f87171');
                }
            }
            if (typeof origUpdateResult === 'function') return origUpdateResult.apply(this, arguments);
        };

        $btn.on('click', function () {
            if (window.__gmHuBusy) return;
            var url = normalizeUrl($input.val());
            if (!/^https?:\/\//i.test(url)) {
                showStatus('地址无效：必须以 http:// 或 https:// 开头', '#f87171');
                return;
            }
            if (!window.AndroidUpdate || typeof window.AndroidUpdate.check !== 'function') {
                showStatus('当前安装包不支持热更新（缺少 AndroidUpdate 桥）', '#f87171');
                return;
            }
            window.__gmHuBusy = true;
            $btn.prop('disabled', true);
            // 开始更新后清空输入框，避免链接残留
            $input.val('').blur();
            showStatus('正在拉取：<br><span style="color:#60a5fa;">' + url + '/manifest.json</span><br>下载完成后自动刷新，请勿退出', '#fbbf24');
            try {
                window.AndroidUpdate.check(url);
            } catch (e) {
                window.__gmHuBusy = false;
                $btn.prop('disabled', false);
                showStatus('启动失败：' + e, '#f87171');
            }
        });
    })();

    /* ============================================================
     * GM：Toast 中心（调用/测试全部 toast）
     * ============================================================ */
    (function () {
        var $btn = $('#gm-toast-center-btn');
        if (!$btn.length) return;
        var $list = $('#gm-toast-center-list');
        var $search = $('#gm-toast-search');
        function render(filter) {
            var arr = window.__TOAST_CATALOG__ || [];
            filter = (filter || '').trim();
            $list.empty();
            var shown = 0;
            arr.forEach(function (msg) {
                if (filter && msg.indexOf(filter) === -1) return;
                shown++;
                $('<div></div>')
                    .css({ padding: '9px 12px', marginBottom: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.06)', lineHeight: '1.5', wordBreak: 'break-word' })
                    .text(msg)
                    .on('click', function () { try { if (window.showToast) window.showToast(msg); } catch (e) {} })
                    .appendTo($list);
            });
            if (!shown) $list.html('<div style="color:#64748b;font-size:12px;text-align:center;padding:20px;">无匹配</div>');
        }
        $btn.on('click', function () {
            render('');
            if ($search.length) $search.val('');
            if (window.ModalRegistry) ModalRegistry.open('gm-toast-center-modal');
            else { $('#gm-toast-center-modal').css('display', 'flex'); setTimeout(function () { $('#gm-toast-center-modal').addClass('show'); }, 10); }
        });
        $('#gm-toast-center-close').on('click', function () {
            if (window.ModalRegistry) ModalRegistry.close('gm-toast-center-modal');
            else { $('#gm-toast-center-modal').removeClass('show'); setTimeout(function () { $('#gm-toast-center-modal').css('display', 'none'); }, 300); }
        });
        $search.on('input', function () { render(this.value); });
    })();

    /* ============================================================
     * GM：物品池授权码生成（按 UID 远程下发）
     * ============================================================ */
    (function () {
        var $btn = $('#gm-ipcode-gen-btn');
        if (!$btn.length) return;
        var lastCode = '';
        function openModal(id) {
            if (window.ModalRegistry) { try { ModalRegistry.open(id); return; } catch (e) {} }
            var $m = $('#' + id); $m.css('display', 'flex'); setTimeout(function () { $m.addClass('show'); }, 10);
        }
        function closeModal(id) {
            if (window.ModalRegistry) { try { ModalRegistry.close(id); return; } catch (e) {} }
            var $m = $('#' + id); $m.removeClass('show'); setTimeout(function () { $m.css('display', 'none'); }, 300);
        }
        function fallbackCopy(text) {
            try { var ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); } catch (e) {}
        }
        $('#gm-ipcode-open-btn').on('click', function () { openModal('gm-ipcode-modal'); });
        $('#gm-ipcode-close').on('click', function () { closeModal('gm-ipcode-modal'); });
        $btn.on('click', function () {
            var uid = ($('#gm-ipcode-uid').val() || '').trim();
            var $out = $('#gm-ipcode-out');
            if (!uid) { $out.css('color', '#f87171').text('请输入 UID'); $('#gm-ipcode-copy').hide(); return; }
            var code = (window.RedeemCode && window.RedeemCode.ipGrantCode) ? window.RedeemCode.ipGrantCode(uid) : '';
            if (!code) { $out.css('color', '#f87171').text('生成失败'); $('#gm-ipcode-copy').hide(); return; }
            lastCode = code;
            $out.css('color', '#34d399').html(uid + ' →<br><b>' + code + '</b><br><span style="color:#94a3b8;font-size:11px;">发给对方，在「兑换码」输入即可解锁（仅对该 UID 有效）</span>');
            $('#gm-ipcode-copy').show();
        });
        $('#gm-ipcode-copy').on('click', function () {
            if (!lastCode) return;
            var btn = this;
            var done = function () { try { if (window.markCopied) window.markCopied(btn); } catch (e) {} try { if (window.showToast) window.showToast('已复制：' + lastCode); } catch (e) {} };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(lastCode).then(done).catch(function () { fallbackCopy(lastCode); done(); });
            } else { fallbackCopy(lastCode); done(); }
        });
    })();

    /* ============================================================
     * GM：管理后台（资源管理 / 榜单管理）—— 整页 iframe
     * ============================================================ */
    (function () {
        var $page = $('#admin-frame-page');
        var iframe = document.getElementById('admin-frame');
        if (!$page.length || !iframe) return;
        function openAdmin(src, title) {
            $('#admin-frame-title').text(title);
            iframe.src = src;
            $page.css('display', 'flex');
            setTimeout(function () { $page.addClass('show'); }, 10);
        }
        $('#gm-resource-admin-btn').on('click', function () { openAdmin('admin/anqu-admin.html', '资源管理'); });
        $('#gm-leaderboard-admin-btn').on('click', function () { openAdmin('admin/leaderboard-admin.html', '榜单管理'); });
        $('#admin-frame-close').on('click', function () {
            $page.removeClass('show');
            setTimeout(function () {
                $page.css('display', 'none');
                iframe.src = 'about:blank';
            }, 320);
        });
    })();

    /* ============================================================
     * GM：Mod 上传（本地 zip → GitHub 仓库）
     * ============================================================ */
    (function () {
        var TOKEN_KEY = 'ab_gh_token';
        var $tok = $('#gm-mod-token');
        var $btn = $('#gm-mod-upload-btn');
        var $file = $('#gm-mod-upload-file');
        var $status = $('#gm-mod-upload-status');
        if (!$btn.length) return;
        $('#gm-mod-upload-open-btn').on('click', function () {
            if (window.ModalRegistry) { try { ModalRegistry.open('gm-mod-upload-modal'); return; } catch (e) {} }
            $('#gm-mod-upload-modal').css('display', 'flex'); setTimeout(function () { $('#gm-mod-upload-modal').addClass('show'); }, 10);
        });
        $('#gm-mod-upload-close').on('click', function () {
            if (window.ModalRegistry) { try { ModalRegistry.close('gm-mod-upload-modal'); return; } catch (e) {} }
            $('#gm-mod-upload-modal').removeClass('show'); setTimeout(function () { $('#gm-mod-upload-modal').css('display', 'none'); }, 300);
        });
        try { var savedTok = localStorage.getItem(TOKEN_KEY); if (savedTok) $tok.val(savedTok); } catch (e) {}
        function status(html, color) { $status.css('color', color || '#94a3b8').html(html); }
        $btn.on('click', function () {
            var token = ($tok.val() || '').trim();
            if (!token) { status('请先填写 GitHub Token', '#f87171'); return; }
            try { localStorage.setItem(TOKEN_KEY, token); } catch (e) {}
            $file.val(''); $file.click();
        });
        $file.on('change', function () {
            var f = this.files && this.files[0];
            if (!f) return;
            var token = ($tok.val() || '').trim();
            if (!window.ModManager || !window.ModManager.gmUploadZip) { status('ModManager 未就绪', '#f87171'); return; }
            $btn.prop('disabled', true);
            status('开始上传：' + f.name);
            window.ModManager.gmUploadZip(f, token, function (t) { status(t); }).then(function (entry) {
                status('✅ 上传成功：' + (entry && entry.name ? entry.name : '') + '<br>CDN 缓存生效后（约 1~10 分钟）市场可见', '#34d399');
                try { if (window.showToast) window.showToast('Mod 已上传并发布'); } catch (e) {}
                if (window.ModManager) { window.ModManager.renderStoreList(); }
            }).catch(function (e) {
                status('❌ ' + String(e && (e.message || e)), '#f87171');
            }).then(function () {
                $btn.prop('disabled', false);
            });
        });
    })();

    /* ============================================================
     * GM：私链热更新弹窗 / 弹窗中心
     * ============================================================ */
    (function () {
        // 私链热更新弹窗
        $('#gm-hotupdate-open-btn').on('click', function () {
            if (window.ModalRegistry) ModalRegistry.open('gm-hotupdate-modal');
            else {
                $('#gm-hotupdate-modal').css('display', 'flex');
                setTimeout(() => $('#gm-hotupdate-modal').addClass('show'), 10);
            }
        });
        $('#gm-hotupdate-modal-close').on('click', function () {
            if (window.ModalRegistry) ModalRegistry.close('gm-hotupdate-modal');
            else {
                $('#gm-hotupdate-modal').removeClass('show');
                setTimeout(() => $('#gm-hotupdate-modal').css('display', 'none'), 300);
            }
        });

        // 弹窗中心：列出游戏内所有弹窗，点击即可打开
        function buildModalCenterList() {
            var $list = $('#gm-modal-center-list').empty();
            var ids = window.ModalRegistry ? window.ModalRegistry.list() : [];
            // 排除自身和 item-tooltip
            ids = ids.filter(function (id) {
                return id !== 'gm-modal-center-modal' && id !== 'item-tooltip';
            });
            ids.sort();

            // 需要走专属打开流程（含初始化）的弹窗，直接显示 DOM 会内容为空或异常
            var SPECIAL_OPENERS = {
                'music-playlist-modal': function () {
                    if (window.__openMusicPlaylist) window.__openMusicPlaylist(false);
                },
                'bg-select-modal': function () {
                    if (window.BackgroundManager && BackgroundManager.openSelector) BackgroundManager.openSelector();
                }
            };

            ids.forEach(function (id) {
                // 优先读取弹窗内的中文标题，找不到则用 id
                var $node = $('#' + id);
                var title = '';
                if ($node.length) {
                    var $t = $node.find('.modal-title').first();
                    title = ($t.text() || '').trim();
                }
                var label = title ? (title + ' <span style="color:#64748b;font-size:11px;margin-left:6px;">(' + id + ')</span>') : id;
                var $btn = $('<button class="sidebar-btn" style="text-align:left;justify-content:flex-start;padding:8px 12px;"></button>')
                    .html('<i class="fas fa-window-maximize" style="margin-right:8px;color:#60a5fa;"></i>' + label)
                    .on('click', function () {
                        // 先立刻关掉弹窗中心（不等关闭动画，否则其 z-index 10002 会遮挡刚打开的弹窗）
                        var $center = $('#gm-modal-center-modal');
                        $center.removeClass('show').css('display', 'none');
                        var opener = SPECIAL_OPENERS[id];
                        if (opener) {
                            setTimeout(opener, 30);
                        } else if (window.ModalRegistry) {
                            ModalRegistry.open(id);
                        } else {
                            $('#' + id).css('display', 'flex');
                            setTimeout(() => $('#' + id).addClass('show'), 10);
                        }
                    });
                $list.append($btn);
            });
            if (!ids.length) {
                $list.html('<div style="color:#64748b;font-size:12px;">暂无已注册的弹窗</div>');
            }
        }
        $('#gm-modal-center-btn').on('click', function () {
            buildModalCenterList();
            if (window.ModalRegistry) ModalRegistry.open('gm-modal-center-modal');
            else {
                $('#gm-modal-center-modal').css('display', 'flex');
                setTimeout(() => $('#gm-modal-center-modal').addClass('show'), 10);
            }
        });
        $('#gm-modal-center-close').on('click', function () {
            if (window.ModalRegistry) ModalRegistry.close('gm-modal-center-modal');
            else {
                $('#gm-modal-center-modal').removeClass('show');
                setTimeout(() => $('#gm-modal-center-modal').css('display', 'none'), 300);
            }
        });
    })();

    /* ============================================================
     * 热更新：fetch manifest + 进度条 + 红点 + 自动检查
     * ============================================================ */
    window.__huProgressTimer = null;
    // 版本对比：支持 v2.3.0.hotfix.5 与 v2.1.0_hotfix.37（下划线/点均可）
    // 规则：依次比 major → minor → patch → hotfix（无 hotfix 视为 0）
    window.__huVersionGt = function(a, b) {
        if (!a) return false;
        if (!b) return true;  // 本地没存过版本 = 有更新
        function parse(v) {
            var hm = v.match(/[._]hotfix\.(\d+)/);
            var hotfix = hm ? parseInt(hm[1], 10) : 0;
            var main = v.replace(/[._]hotfix\.\d+/, '').replace(/[^0-9.]/g, '').split('.').map(Number);
            return { major: main[0] || 0, minor: main[1] || 0, patch: main[2] || 0, hotfix: hotfix };
        }
        var pa = parse(a);
        var pb = parse(b);
        if (pa.major !== pb.major) return pa.major > pb.major;
        if (pa.minor !== pb.minor) return pa.minor > pb.minor;
        if (pa.patch !== pb.patch) return pa.patch > pb.patch;
        if (pa.hotfix !== pb.hotfix) return pa.hotfix > pb.hotfix;
        return false;
    };
    // 右上角版本号立即同步为当前构建版本（不等 manifest 返回）
    try { $('#metaVersionDisplay').text('Arena Breakout Safebox Simulator ' + window.HU_BUILD_VERSION); } catch(e) {}
    // fetch manifest + 版本对比 + 回调 (供 sidebar 按钮和自动检查共用)
    // 主源并发竞速：Worker 反代（国内快）与 raw 直连同时请求，谁先回用谁；
    // 两路都失败才退到 jsDelivr 兜底。选中的 base 同时用于后续原生下载，保证版本一致。
    window.__huFetchAndCompare = function(onResult) {
        var done = typeof onResult === 'function' ? onResult : function() {};
        var finished = false;
        // 三路并发：Worker / raw GitHub / jsDelivr 同时请求，选版本号最大的有效结果
        // （避免 jsDelivr 缓存旧 manifest 导致误判「已是最新」）
        var curVer = window.HU_BUILD_VERSION || '';
        var bestM = null;
        var bestBase = null;
        var bestVer = '';
        var settle = function() {
            if (finished) return;
            finished = true;
            if (!bestM) {
                // 所有源都失败或返回的 manifest 版本异常（<= 本地版本），视为网络错误
                done(null, false);
                return;
            }
            // 最高版本等于本地版本 → 真的已最新
            var hasUpdate = window.__huVersionGt(bestVer, curVer);
            // 同版本优先走 Worker（国内可达）；否则用最高版本对应 base
            window.__huActiveBase = (workerM && bestM && workerM.version === bestM.version) ? HU_PROXY_BASE : bestBase;
            // 顶部版本号固定显示本地构建版本（服务器版本受各线路缓存影响会跳变，只在更新弹窗里展示）
            done(bestM, hasUpdate);
        };
        var workerM = null;
        var record = function(m, base) {
            if (base === HU_PROXY_BASE && m && m.version) workerM = m;
            if (!m || !m.version) return;
            // 拒绝异常旧版本（缓存回滚或脏数据），只有严格大于当前最佳才替换
            if (window.__huVersionGt(m.version, bestVer)) {
                bestM = m;
                bestBase = base;
                bestVer = m.version;
            }
        };
        var gotOne = function(m, base) {
            record(m, base);
            if (--pending <= 0) settle();
        };
        var getOnce = function(base, cb) {
            var url = base + '/manifest.json';
            var settled = false;
            function finish(m) { if (!settled) { settled = true; cb(m, base); } }
            if (window.Net && Net.getJSON) {
                Net.getJSON(url, { timeout: 8000, retries: 1, cache: 'no-store', cacheBust: true })
                    .then(function(m) { finish(m); })
                    .catch(function() { finish(null); });
                return;
            }
            $.ajax({
                url: url + '?t=' + Date.now(),
                dataType: 'json',
                cache: false,
                timeout: 8000,
                success: function(m) { finish(m); },
                error: function() { finish(null); }
            });
        };
        // 三路并发，全部返回（成功/失败）后再选最高版本，避免不同线路缓存新旧不一致导致版本号跳变
        var pending = 3;
        getOnce(HU_PROXY_BASE, gotOne);
        getOnce(HU_BASE_URL, gotOne);
        getOnce(HU_JD_BASE, gotOne);
        // 兜底：最长等 12s，超时直接结算（用已收到的最高版本）
        setTimeout(settle, 12000);
    };
    window.__huStartProgress = function() {
        window.__huStopProgress();
        var pct = 10;
        $('#update-check-progress-bar').css('width', pct + '%');
        $('#update-check-progress-text').text(pct + '%');
        window.__huProgressTimer = setInterval(function() {
            // 模拟原生下载进度：平滑上升到 90% 停下（等 callback）
            var prev = pct;
            var delta = Math.max(1, Math.floor(Math.random() * 5) + 1);
            pct = Math.min(90, prev + delta);
            $('#update-check-progress-bar').css('width', pct + '%');
            $('#update-check-progress-text').text(pct + '%');
            if (pct >= 90) {
                clearInterval(window.__huProgressTimer);
                window.__huProgressTimer = null;
            }
        }, 400);
    };
    window.__huStopProgress = function() {
        if (window.__huProgressTimer) {
            clearInterval(window.__huProgressTimer);
            window.__huProgressTimer = null;
        }
        $('#update-check-progress-bar').css('width', '100%');
        $('#update-check-progress-text').text('100%');
    };
    window.__huShowRedDot = function(show) {
        $('[data-hudot]').css('display', show ? 'block' : 'none');
    };
    // 自动检查（APP 启动 3s 后）
    setTimeout(function() {
        try {
            window.__huFetchAndCompare(function(m, hasUpdate) {
                if (hasUpdate) {
                    window.__huShowRedDot(true);
                    // 新增：toast 提示有更新
                    if (typeof window.showToast === 'function') {
                        window.showToast('检测到新版本，请点击「检查更新」');
                    }
                } else {
                    window.__huShowRedDot(false);
                }
            });
        } catch (e) {}
    }, 3000);

    /* ============================================================
     * 资源校验（供登录前加载界面调用）：清理中断下载产生的损坏记录
     * ============================================================ */
    window.__validateResourcePacks__ = function() {
        if (!window.__validateResourcePacksPromise) {
            window.__validateResourcePacksPromise = ResourceDownloadManager.validateDownloads();
        }
        return window.__validateResourcePacksPromise;
    };

    /* ============================================================
     * 云同步（免注册同步码）
     * ============================================================ */
    var SYNC_API = 'https://anqu-sync.sdfgasdfgwe7.workers.dev';  // Cloudflare Worker 云同步地址
    // 同步范围登记在 js/storage.js 的 SYNC_REGISTRY，新增存档字段只需改那一处
    var SYNC_KEYS = (window.Save && Save.syncKeys) ? Save.syncKeys() : [
        'darkzone_simulator_stats',
        'ab_shop_skills_v1',
        'ab_collection_room_v1',
        'ab_collection_room_v1_bak',
        'ab_owned_backgrounds',
        'ab_selected_bg_path',
        'disabled_items_list',
        'ab_skip_search_mask',
        'ab_fps_mode',
        'ab_font_preference'
    ];
    var SYNC_PROGRESS_KEYS = (window.Save && Save.syncCoreKeys) ? Save.syncCoreKeys() : ['darkzone_simulator_stats', 'ab_shop_skills_v1', 'ab_collection_room_v1'];
    var SYNC_CODE_KEY = 'ab_sync_code';
    var SYNC_TIME_KEY = 'ab_sync_updated_at';
    var SYNC_TIMER = null;
    var SYNC_PENDING = null;

    function syncStatus(text, color) {
        var $el = $('#cloud-sync-status');
        if (!$el.length) return;
        $el.css('color', color || '#94a3b8').text(text || '');
    }
    function syncNorm(raw) {
        return String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    }
    function syncFmt(raw) {
        var c = syncNorm(raw);
        return c.length === 12 ? c.slice(0, 4) + '-' + c.slice(4, 8) + '-' + c.slice(8) : c;
    }
    function syncGetCode() {
        try { return localStorage.getItem(SYNC_CODE_KEY) || ''; } catch (e) { return ''; }
    }
    function syncGenCode() {
        var ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        var out = '';
        for (var i = 0; i < 12; i++) out += ABC.charAt(Math.floor(Math.random() * ABC.length));
        return out;
    }
    function syncHasLocalProgress() {
        for (var i = 0; i < SYNC_PROGRESS_KEYS.length; i++) {
            try { if (localStorage.getItem(SYNC_PROGRESS_KEYS[i]) !== null) return true; } catch (e) {}
        }
        return false;
    }
    function syncCollect() {
        var out = {};
        for (var i = 0; i < SYNC_KEYS.length; i++) {
            var k = SYNC_KEYS[i];
            try {
                var v = localStorage.getItem(k);
                if (v !== null) out[k] = v;
            } catch (e) {}
        }
        return out;
    }
    function syncApply(remote) {
        if (!remote || typeof remote !== 'object') return 0;
        var n = 0;
        for (var k in remote) {
            if (!Object.prototype.hasOwnProperty.call(remote, k)) continue;
            if (SYNC_KEYS.indexOf(k) === -1) continue;
            try { localStorage.setItem(k, remote[k]); n++; } catch (e) {}
        }
        return n;
    }
    function syncApi(code) {
        return SYNC_API.replace(/\/+$/, '') + '/' + code;
    }
    function syncUpload(silent, cb) {
        var code = syncGetCode();
        if (!SYNC_API) {
            if (!silent) syncStatus('云端服务尚未部署，暂不可用', '#f87171');
            if (cb) cb(false);
            return;
        }
        if (!code) {
            if (!silent) syncStatus('尚未生成同步码', '#f87171');
            if (cb) cb(false);
            return;
        }
        var payload = { data: syncCollect(), updatedAt: Date.now() };
        if (!silent) syncStatus('正在上传…');
        var onOk = function () {
            try { localStorage.setItem(SYNC_TIME_KEY, String(payload.updatedAt)); } catch (e) {}
            if (!silent) syncStatus('已同步到云端 · ' + new Date().toLocaleTimeString(), '#10b981');
            if (cb) cb(true);
        };
        var onFail = function () {
            if (!silent) syncStatus('上传失败，请检查网络后重试', '#f87171');
            if (cb) cb(false);
        };
        if (window.Net && Net.putJSON) {
            Net.putJSON(syncApi(code), payload, { timeout: 10000, retries: 1 })
                .then(onOk, onFail);
            return;
        }
        $.ajax({
            url: syncApi(code),
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            dataType: 'json',
            timeout: 10000,
            success: onOk,
            error: onFail
        });
    }
    function syncDownload(code, cb) {
        if (window.Net && Net.getJSON) {
            Net.getJSON(syncApi(code), { cache: 'no-store', timeout: 10000 })
                .then(function (res) { cb(res || null, null); })
                .catch(function (e) {
                    cb(null, (e && e.status === 404) ? '该同步码不存在，请检查后重试' : '无法连接云端，请检查网络');
                });
            return;
        }
        $.ajax({
            url: syncApi(code),
            method: 'GET',
            dataType: 'json',
            cache: false,
            timeout: 10000,
            success: function (res) { cb(res || null, null); },
            error: function (xhr) {
                cb(null, xhr.status === 404 ? '该同步码不存在，请检查后重试' : '无法连接云端，请检查网络');
            }
        });
    }
    function syncMarkDirty() {
        if (!SYNC_API || !syncGetCode()) return;
        if (SYNC_TIMER) clearTimeout(SYNC_TIMER);
        SYNC_TIMER = setTimeout(function () { syncUpload(true); }, 3000);
    }
    function syncRefreshUi() {
        var code = syncGetCode();
        $('#cloud-sync-code').text(code ? syncFmt(code) : '尚未生成');
        $('#cloud-sync-copy').prop('disabled', !code);
    }
    function syncApplyAndReload(remote, code) {
        var n = syncApply(remote.data);
        try {
            localStorage.setItem(SYNC_CODE_KEY, code);
            localStorage.setItem(SYNC_TIME_KEY, String(remote.updatedAt || Date.now()));
        } catch (e) {}
        syncStatus('已恢复 ' + n + ' 项进度，正在刷新…', '#10b981');
        setTimeout(function () { location.reload(); }, 800);
    }

    // 监听本地进度变化 → 3 秒防抖自动上传
    try {
        var _syncOrigSet = Storage.prototype.setItem;
        Storage.prototype.setItem = function (k, v) {
            _syncOrigSet.call(this, k, v);
            if (SYNC_KEYS.indexOf(k) !== -1) syncMarkDirty();
        };
    } catch (e) {}

    if ($('#cloud-sync-modal').length) {
        $('#sidebar-cloud-sync-btn').on('click', function () {
            syncRefreshUi();
            $('#cloud-sync-choice').hide();
            $('#cloud-sync-input').val('');
            if (!SYNC_API) syncStatus('云端服务尚未部署，部署后填入地址即可使用', '#fbbf24');
            else syncStatus('');
            EventManager.openModal('cloud-sync-modal');
        });
        $('#cloud-sync-close, #cloud-sync-close2').on('click', function () {
            EventManager.closeModal('cloud-sync-modal');
        });
        $('#cloud-sync-modal').on('click', function (e) {
            if ($(e.target).is(this)) EventManager.closeModal('cloud-sync-modal');
        });
        $('#cloud-sync-create').on('click', function () {
            if (!SYNC_API) { syncStatus('云端服务尚未部署，部署后填入地址即可使用', '#f87171'); return; }
            var code = syncGenCode();
            try { localStorage.setItem(SYNC_CODE_KEY, code); } catch (e) {}
            syncRefreshUi();
            syncStatus('正在上传本地进度…');
            syncUpload(false, function (ok) {
                if (ok && typeof window.showToast === 'function') {
                    window.showToast('同步码已生成，请务必记下');
                }
            });
        });
        $('#cloud-sync-copy').on('click', function () {
            var code = syncGetCode();
            if (!code) return;
            var text = syncFmt(code);
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function () {
                    syncStatus('已复制：' + text, '#10b981');
                }, function () { syncStatus('复制失败，请长按同步码手动复制', '#f87171'); });
            } else {
                syncStatus('请长按同步码手动复制：' + text, '#fbbf24');
            }
        });
        $('#cloud-sync-now').on('click', function () { syncUpload(false); });
        $('#cloud-sync-restore').on('click', function () {
            if (!SYNC_API) { syncStatus('云端服务尚未部署，部署后填入地址即可使用', '#f87171'); return; }
            var raw = $('#cloud-sync-input').val();
            var code = syncNorm(raw);
            if (code.length !== 12) { syncStatus('同步码格式不正确，应为 12 位字母数字', '#f87171'); return; }
            $('#cloud-sync-choice').hide();
            syncStatus('正在读取云端进度…');
            syncDownload(code, function (res, err) {
                if (!res || !res.data) { syncStatus(err || '云端没有该同步码的进度', '#f87171'); return; }
                var time = res.updatedAt ? new Date(res.updatedAt).toLocaleString() : '未知时间';
                if (!syncHasLocalProgress()) {
                    syncApplyAndReload(res, code);
                    return;
                }
                SYNC_PENDING = { res: res, code: code };
                $('#cloud-sync-choice-text').html('本地已有进度，云端进度更新于 ' + time + '<br>请选择如何处理：');
                $('#cloud-sync-choice').show();
                syncStatus('');
            });
        });
        $('#cloud-sync-use-cloud').on('click', function () {
            if (!SYNC_PENDING) return;
            $('#cloud-sync-choice').hide();
            syncApplyAndReload(SYNC_PENDING.res, SYNC_PENDING.code);
        });
        $('#cloud-sync-keep-both').on('click', function () {
            if (!SYNC_PENDING) return;
            try {
                localStorage.setItem('ab_sync_local_backup_' + Date.now(), JSON.stringify(syncCollect()));
            } catch (e) {}
            $('#cloud-sync-choice').hide();
            syncApplyAndReload(SYNC_PENDING.res, SYNC_PENDING.code);
        });
        syncRefreshUi();
    }

    // 启动后检查云端是否有更新的进度
    setTimeout(function () {
        try {
            var code = syncGetCode();
            if (!SYNC_API || !code || !syncHasLocalProgress()) return;
            syncDownload(code, function (res) {
                if (!res || !res.updatedAt) return;
                var localTime = Number(localStorage.getItem(SYNC_TIME_KEY) || 0);
                if (res.updatedAt > localTime + 5000 && typeof window.showToast === 'function') {
                    window.showToast('云端有更新的进度，可在「云同步」中恢复');
                }
            });
        } catch (e) {}
    }, 5000);

    /* ============================================================
     * 输入框焦点修复
     * Android WebView 下首次点击输入框可能不聚焦/不弹键盘，
     * 这里做一次强制聚焦兜底（含 readonly 预热法）。
     * ============================================================ */
    (function () {
        function isField(el) {
            if (!el || !el.tagName) return false;
            var tag = el.tagName.toLowerCase();
            return tag === 'input' || tag === 'textarea' || el.getAttribute('contenteditable') === 'true';
        }
        function forceFocus(el) {
            try {
                if (!el || el.disabled) return;
                if (document.activeElement === el) return;
                el.focus();
                setTimeout(function () {
                    if (document.activeElement === el) return;
                    // 第二次尝试：readonly 预热法（可强制唤起输入法）
                    try {
                        el.setAttribute('readonly', 'readonly');
                        el.focus();
                        setTimeout(function () {
                            try { el.removeAttribute('readonly'); } catch (e) {}
                            el.focus();
                            try {
                                var len = (el.value || '').length;
                                if (el.setSelectionRange) el.setSelectionRange(len, len);
                            } catch (e) {}
                        }, 60);
                    } catch (e) {}
                }, 150);
            } catch (e) {}
        }
        document.addEventListener('touchend', function (e) {
            var t = e.target;
            if (!isField(t)) return;
            setTimeout(function () { forceFocus(t); }, 0);
        }, true);
        document.addEventListener('click', function (e) {
            var t = e.target;
            if (!isField(t)) return;
            forceFocus(t);
        }, true);
    })();

    // ===== Mod 库接入桥 =====
    window.__modHooks = {
        refreshItemPool: function () { SettingsManager.updateItemPool(); },
        // 开关/删除物品类 Mod 后清空当前局（否则盘面残留旧物品）
        resetBoard: function () {
            try { if (State.items && State.items.length) GameController.resetGame(); } catch (e) {}
        },
        // 背景类 Mod 被删除/停用：若当前正在使用它的背景，立即回退到默认背景
        clearModBackgroundIfCurrent: function (modId) {
            try {
                var key = BackgroundManager.storageKey;
                var cur = localStorage.getItem(key);
                if (cur && cur.indexOf('mods/' + modId + '/') === 0) {
                    localStorage.removeItem(key);
                    var def = BackgroundManager.backgrounds.find(function (b) { return Number(b.id) === 1; })
                        || BackgroundManager.backgrounds[0];
                    if (def) BackgroundManager.applyBackground(def.path);
                }
                if ($('#bg-select-modal').hasClass('show') && BackgroundManager.buildGrid) BackgroundManager.buildGrid();
            } catch (e) {}
        },
        calcWeight: function (v) { return GameCore.calculateItemWeight(v); },
        searchTime: function (r) { return _.get(Config.searchTimes, r, Config.searchTimes.purple); },
        // 替换 BackgroundManager.backgrounds 中的 Mod 背景部分
        appendModBackgrounds: function (list) {
            var base = BackgroundManager.backgrounds.filter(function (b) {
                return !(typeof b.id === 'string' && b.id.indexOf('mod_') === 0);
            });
            BackgroundManager.backgrounds = base.concat(list || []);
            // 若背景选择器正在显示，重建网格
            try {
                if ($('#bg-select-modal').hasClass('show') && BackgroundManager.buildGrid) BackgroundManager.buildGrid();
            } catch (e) {}
        }
    };
    // 背景类 Mod：加载完成后追加
    var __origLoadBgs = BackgroundManager.loadBackgrounds;
    BackgroundManager.loadBackgrounds = async function () {
        var r = await __origLoadBgs.call(this);
        if (window.ModManager && window.ModManager.getEnabledBackgrounds) {
            try {
                var modBgs = window.ModManager.getEnabledBackgrounds();
                if (modBgs && modBgs.length) this.backgrounds = this.backgrounds.concat(modBgs);
            } catch (e) {}
        }
        return r;
    };
    // 背景类 Mod：applyBackground 支持虚拟路径 mods/...（转 blob URL + 视频标记）
    var __origApplyBg = BackgroundManager.applyBackground;
    BackgroundManager.applyBackground = function (path, isVideoHint, fallbackPath, skipSave) {
        if (typeof path === 'string' && path.indexOf('mods/') === 0 && window.ModManager) {
            var rec = window.ModManager.getBgRecord(path);
            if (rec) isVideoHint = rec.isVideo;
            var resolved = window.ModManager.resolvePath(path);
            if (resolved) path = resolved;
        }
        return __origApplyBg.call(this, path, isVideoHint, fallbackPath, skipSave);
    };

    // 初始化资源下载管理器
    ResourceDownloadManager.init();

    // 暴露兑换解锁接口（供 redeem.js 调用）
    window.__unlockSkillByRedeem = function(id) {
        if (typeof ShopManager === 'undefined') return { success: false, message: '技能系统未就绪' };
        const skill = ShopManager.getSkill(id);
        if (!skill || skill.unlockBy !== 'redeem') return { success: false, message: '技能不存在或不是兑换解锁项' };
        const st = ShopManager.getSkillState(id);
        if (st.owned) return { success: false, message: '该技能已拥有' };
        st.owned = true;
        st.enabled = true;
        ShopManager.save();
        ShopManager.applyAllEffects();
        return { success: true, message: `已解锁技能「${skill.name}」` };
    };

});
