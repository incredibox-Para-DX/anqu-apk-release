(function () {
    if (window.__inlineScriptsInitialized) return;
    window.__inlineScriptsInitialized = true;

    let currentVolume = 2.0;
    let audioContext = null;
    let gainNode = null;
    let audioBuffers = new Map();
    let isInitialized = false;

    const audioFiles = [
        { url: 'audio/我出货了1.mp3' },
        { url: 'audio/我出货了2.mp3' },
        { url: 'audio/我出货了3.mp3' },
        { url: 'audio/我出货了4.mp3' },
    ];

    const enterGameAudio = new Audio('audio/enter-game.mp3');
    enterGameAudio.preload = 'auto';
    enterGameAudio.volume = 0.4;
    try { enterGameAudio.load(); } catch (e) {}

    const BadWordFilter = (() => {
        let decodedBadWords = [];
        let isInitialized = false;

        function initBadWords() {
            if (isInitialized) return;
            const rawWords = window.badWords || ['fuck', 'shit', 'ass', 'damn', 'bitch', 'crap', 'dick', 'porn', 'sex', 'xxx'];
            decodedBadWords = rawWords.map(word => {
                try {
                    return word.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
                               .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
                } catch (e) {
                    return '';
                }
            }).filter(Boolean).map(word => normalizeText(word));
            isInitialized = true;
        }

        function normalizeText(text) {
            return text.replace(/[\s\p{P}\p{S}]+/gu, '').toLowerCase();
        }

        function hasBadWord(input) {
            if (!input) return false;
            initBadWords();
            const normalizedInput = normalizeText(input);
            if (!normalizedInput) return false;
            for (const badWord of decodedBadWords) {
                if (badWord && normalizedInput.includes(badWord)) return true;
            }
            const chars = normalizedInput.split('');
            for (let i = 0; i < chars.length; i++) {
                for (let j = i + 2; j <= Math.min(i + 8, chars.length); j++) {
                    if (decodedBadWords.includes(chars.slice(i, j).join(''))) return true;
                }
            }
            return false;
        }

        return { hasBadWord, normalizeText };
    })();

    const initAudioSystem = async () => {
        if (isInitialized) return;

        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            gainNode = audioContext.createGain();
            gainNode.connect(audioContext.destination);

            for (let i = 0; i < audioFiles.length; i++) {
                try {
                    const response = await fetch(audioFiles[i].url);
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    audioBuffers.set(audioFiles[i].url, audioBuffer);
                } catch (e) {}
            }

            isInitialized = true;
            setSpecialVolume(currentVolume);
        } catch (e) {
            initFallbackAudioSystem();
        }
    };

    const initFallbackAudioSystem = () => {
        const fallbackAudios = [];
        audioFiles.forEach(audioFile => {
            const audio = new Audio();
            audio.src = audioFile.url;
            audio.preload = 'auto';
            audio.load();
            fallbackAudios.push(audio);
        });

        const playFallbackSound = () => {
            if (fallbackAudios.length === 0) return;
            const randomIndex = Math.floor(Math.random() * fallbackAudios.length);
            const audio = fallbackAudios[randomIndex].cloneNode();
            audio.volume = Math.min(1, currentVolume) * (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
            audio.currentTime = 0;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    setTimeout(() => { audio.currentTime = 0; audio.play().catch(() => {}); }, 10);
                });
            }
            audio.onended = () => audio.remove();
        };

        window.playSpecialSound = playFallbackSound;
        isInitialized = true;
    };

    const playRandomSound = () => {
        if (!isInitialized || !audioContext || !gainNode) {
            if (window.playSpecialSound) window.playSpecialSound();
            return;
        }
        if (audioFiles.length === 0) return;

        const randomIndex = Math.floor(Math.random() * audioFiles.length);
        const randomFile = audioFiles[randomIndex];
        const audioBuffer = audioBuffers.get(randomFile.url);
        if (!audioBuffer) {
            if (window.playSpecialSound) window.playSpecialSound();
            return;
        }

        try {
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(gainNode);
            source.start(0);
            source.onended = () => source.disconnect();
        } catch (e) {
            if (window.playSpecialSound) window.playSpecialSound();
        }
    };

    const setSpecialVolume = (volume) => {
        if (volume != null) currentVolume = Math.max(0, volume);
        if (gainNode) gainNode.gain.value = currentVolume * (window.__UI_SOUND_VOLUME__ != null ? window.__UI_SOUND_VOLUME__ : 1);
    };

    const bindButtonEvents = () => {
        const playSoundBtn = document.getElementById('play-sound-btn');
        const pauseSearchBtn = document.getElementById('pause-search-btn');
        const achievementBtn = document.getElementById('sidebar-achievement-btn');

        if (playSoundBtn) {
            playSoundBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (!isInitialized) {
                    initAudioSystem().then(() => playRandomSound());
                } else {
                    playRandomSound();
                }
            }, { capture: true });
        }

        if (pauseSearchBtn) {
            pauseSearchBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (window.toggleSearchPause) window.toggleSearchPause();
            }, { capture: true });
        }

        if (achievementBtn) {
            achievementBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof AchievementSystem !== 'undefined') {
                    AchievementSystem.renderAchievementModal();
                }
            }, { capture: true });
        }

        const triggerInit = () => { if (!isInitialized) initAudioSystem(); };
        document.addEventListener('click', triggerInit, { once: true });
        document.addEventListener('touchstart', triggerInit, { once: true });
        document.addEventListener('keydown', triggerInit, { once: true });
    };

    const initDonateImages = () => {
        const donateImagesContainer = document.getElementById('donate-images');
        if (!donateImagesContainer) return;
        donateImagesContainer.innerHTML = '';
        const img = document.createElement('img');
        img.src = 'pictures/donate/donate-qr.jpg';
        img.alt = '赞赏支持';
        img.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block;';
        donateImagesContainer.appendChild(img);
    };

    const fetchTextWithTimeout = (url, ms) => new Promise((resolve, reject) => {
        let settled = false;
        const finish = (fn, value) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            fn(value);
        };
        const timer = setTimeout(() => finish(reject, new Error('timeout')), ms);
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.text();
            })
            .then(text => finish(resolve, text))
            .catch(error => finish(reject, error));
    });

    const loadLoadingTips = async () => {
        try {
            const xmlText = await fetchTextWithTimeout('xml/loading-tips.xml', 2000);
            const xmlDoc = new DOMParser().parseFromString(xmlText, 'text/xml');
            return Array.from(xmlDoc.getElementsByTagName('tip')).map(tip => tip.textContent.trim());
        } catch (e) {
            return ['加载中...', '请稍候...'];
        }
    };

    const loadVideoConfig = async () => {
        try {
            const xmlText = await fetchTextWithTimeout('xml/video-config.xml', 2000);
            const xmlDoc = new DOMParser().parseFromString(xmlText, 'text/xml');
            return Array.from(xmlDoc.getElementsByTagName('video')).map(v => v.textContent.trim());
        } catch (e) {
            return [];
        }
    };

    const showLoadingScreen = async () => {
        const loadingOverlay = document.getElementById('loading-overlay');
        const progressBar = document.getElementById('loading-progress-bar');
        const gameContainer = document.getElementById('game-container');
        const loadingTipEl = document.getElementById('loading-tip');
        const loadingSpinner = document.querySelector('.loading-spinner');
        const loadingProgress = document.querySelector('.loading-progress');
        const loadingContainer = document.querySelector('.loading-container');

        if (window.__SKIP_LOADING__) {
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
                loadingOverlay.classList.add('hidden');
            }
            if (gameContainer) {
                gameContainer.classList.remove('hidden');
                gameContainer.style.display = 'block';
                gameContainer.style.opacity = '1';
            }
            var videoBg = document.querySelector('.loading-video-bg');
            if (videoBg) videoBg.remove();
            if (typeof window.initLeaderboard === 'function') window.initLeaderboard();
            if (typeof AchievementSystem !== 'undefined') AchievementSystem.init();
            return;
        }

        const allLoadingTexts = document.querySelectorAll('.loading-text');
        let loadingStatusText = null;
        allLoadingTexts.forEach(el => {
            const text = el.textContent.trim();
            if (text.includes('Loading')) loadingStatusText = el;
        });

        if (!loadingOverlay || !progressBar || !gameContainer || !loadingTipEl) return;

        const videoList = await loadVideoConfig();
        const existingVideoBg = document.querySelector('.loading-video-bg');

        if (!existingVideoBg && videoList.length > 0) {
            const randomVideo = videoList[Math.floor(Math.random() * videoList.length)];
            const videoBg = document.createElement('video');
            videoBg.className = 'loading-video-bg';
            videoBg.src = randomVideo;
            videoBg.preload = 'auto';
            videoBg.autoplay = true;
            videoBg.loop = true;
            videoBg.muted = true;
            videoBg.playsInline = true;
            videoBg.webkitPlaysInline = true;
            videoBg.x5PlaysInline = true;
            videoBg.x5VideoPlayerType = 'h5';
            videoBg.x5VideoPlayerFullscreen = true;
            videoBg.volume = 0.4;
            videoBg.style.cssText = `
                position: fixed; top: 0; left: 0;
                width: 100vw; height: 100vh;
                object-fit: cover; z-index: 988;
                filter: brightness(0.739);
                transform: scale(1.075);
                pointer-events: none;
                background: #000;
            `;
            videoBg.poster = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
            
            document.body.insertBefore(videoBg, document.body.firstChild);

            videoBg.addEventListener('loadeddata', function() {
                videoBg.play().catch(() => {
                    videoBg.muted = true;
                    videoBg.play().catch(() => {});
                });
            });

            videoBg.addEventListener('canplay', function() {
                videoBg.play().catch(() => {});
            });

            videoBg.play().catch(() => {
                videoBg.muted = true;
                videoBg.play().catch(() => {});
            });

            const playVideoOnInteraction = () => {
                const currentMuted = localStorage.getItem('bgm_muted') === 'true';
                videoBg.muted = currentMuted;
                videoBg.volume = currentMuted ? 0 : 0.4;
                videoBg.play().catch(() => {});
                document.removeEventListener('click', playVideoOnInteraction);
                document.removeEventListener('touchstart', playVideoOnInteraction);
            };
            document.addEventListener('click', playVideoOnInteraction, { once: true });
            document.addEventListener('touchstart', playVideoOnInteraction, { once: true });
        }

        loadingOverlay.style.zIndex = '997';
        loadingOverlay.style.background = 'rgba(0, 0, 0, 0.091)';
        loadingOverlay.style.transform = 'scale(1.133)';
        loadingOverlay.style.transformOrigin = 'center center';

        const tips = await loadLoadingTips();
        loadingTipEl.textContent = tips[Math.floor(Math.random() * tips.length)];

        loadingOverlay.style.opacity = '0';
        loadingOverlay.style.transition = 'opacity 0.509s ease-in-out';
        requestAnimationFrame(() => { loadingOverlay.style.opacity = '1'; });

        const setProgress = (pct) => {
            progressBar.style.width = Math.max(0, Math.min(100, pct)) + '%';
        };

        const collectCriticalAssets = () => {
            const urls = new Set();
            const imgs = Array.from(document.querySelectorAll('img[src]'));
            for (const img of imgs) {
                if (urls.size >= 16) break;
                const src = img.getAttribute('src');
                if (src && !/^(data:|blob:|https?:)/i.test(src)) urls.add(src);
            }
            ['audio/loading-end.mp3', 'audio/click.mp3'].forEach(u => {
                try {
                    const a = new Audio();
                    a.preload = 'auto';
                    a.src = u;
                    a.load();
                } catch (e) {}
            });
            return Array.from(urls);
        };

        const waitForValidator = async () => {
            for (let i = 0; i < 20; i++) {
                if (typeof window.__validateResourcePacks__ === 'function') return true;
                await new Promise(r => setTimeout(r, 100));
            }
            return false;
        };

        const withTimeout = (promise, ms, fallback) => new Promise(resolve => {
            let settled = false;
            const finish = (value) => {
                if (settled) return;
                settled = true;
                resolve(value);
            };
            const timer = setTimeout(() => finish(fallback), ms);
            Promise.resolve(promise).then(
                value => { clearTimeout(timer); finish(value); },
                () => { clearTimeout(timer); finish(fallback); }
            );
        });

        const preloadAssets = async (urls) => {
            if (!urls.length) return;
            let loaded = 0;
            setProgress(2);
            await Promise.all(urls.map(url => new Promise(resolve => {
                let settled = false;
                const done = () => {
                    if (settled) return;
                    settled = true;
                    loaded++;
                    setProgress(2 + (loaded / urls.length) * 78);
                    resolve();
                };
                setTimeout(done, 8000);
                fetch(url, { cache: 'force-cache' })
                    .then(res => (res.ok ? res.blob() : Promise.reject(new Error('HTTP ' + res.status))))
                    .then(done)
                    .catch(done);
            })));
        };

        let loginRevealed = false;
        const revealLogin = () => {
            if (loginRevealed) return;
            loginRevealed = true;
            try { setProgress(100); } catch (e) {}

            if (loadingSpinner) {
                loadingSpinner.style.transition = 'opacity 0.431s ease, transform 0.423s ease';
                loadingSpinner.style.opacity = '0';
                loadingSpinner.style.transform = 'scale(0.362) rotate(486deg)';
                setTimeout(() => { loadingSpinner.style.visibility = 'hidden'; }, 482);
            }

            if (loadingProgress) {
                loadingProgress.style.transition = 'opacity 0.412s ease';
                loadingProgress.style.opacity = '0';
                setTimeout(() => { loadingProgress.style.visibility = 'hidden'; }, 476);
            }

            const getUid = window.getUid || (() => localStorage.getItem('ab_uid_clean') || 'guest');
            let playerNickname = localStorage.getItem('leaderboard_nickname');
            if (!playerNickname) playerNickname = '特遣队员' + getUid();

            if (loadingStatusText) {
                loadingStatusText.style.transition = 'all 0.552s ease';
                loadingStatusText.innerHTML = '<span style="font-size:87%;font-style:italic;color:#93c5fd;">' + (window.I18N ? I18N.tr('欢迎，') : '欢迎，') + playerNickname + '</span>';
                loadingStatusText.style.color = '#93c5fd';
                loadingStatusText.style.fontSize = '20.1px';
                loadingStatusText.style.fontWeight = 'normal';
                loadingStatusText.style.fontStyle = 'italic';
            }

            const existingBtn = document.querySelector('.enter-game-btn');
            if (!existingBtn) {
                const enterBtn = document.createElement('button');
                enterBtn.className = 'enter-game-btn';
                enterBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> 登录';
                enterBtn.style.cssText = `
                    display: inline-block; margin-top: 26px; margin-bottom: 23px; padding: 10px 35px;
                    background: rgba(139, 195, 238, 0.073); border: 1px solid rgba(145, 199, 239, 0.106);
                    color: white; border-radius: 15.5px; font-size: 18.1px; font-weight: 493; cursor: pointer;
                    transition: all 0.651s cubic-bezier(0.401, 1.637, 0.736, 1); opacity: 0;
                    transform: translateY(33px) scale(0.899); box-shadow: 0 7.1px 28px rgba(0, 0, 0, 0.434);
                    font-family: inherit; letter-spacing: 1.15px;
                    backdrop-filter: blur(16.3px); -webkit-backdrop-filter: blur(16.3px);
                `;

                enterBtn.addEventListener('mouseenter', () => {
                    enterBtn.style.background = 'rgba(135, 190, 240, 0.113)';
                    enterBtn.style.borderColor = 'rgba(148, 204, 241, 0.275)';
                    enterBtn.style.transform = 'translateY(-5.8px) scale(1.055)';
                    enterBtn.style.boxShadow = '0 9.1px 33px rgba(27, 69, 201, 0.121)';
                });
                enterBtn.addEventListener('mouseleave', () => {
                    enterBtn.style.background = 'rgba(113, 158, 205, 0.051)';
                    enterBtn.style.borderColor = 'rgba(141, 848, 952, 0.016)';
                    enterBtn.style.transform = 'translateY(0) scale(1)';
                    enterBtn.style.boxShadow = '0 7.1px 28px rgba(0, 0, 0, 0.426)';
                });

                enterBtn.addEventListener('click', function () {
                    document.querySelectorAll('video').forEach(v => { v.muted = true; v.volume = 0; });
                    if (window.__resourceValidationNotice) {
                        const notice = window.__resourceValidationNotice;
                        delete window.__resourceValidationNotice;
                        setTimeout(() => { try { if (window.showToast) window.showToast(notice); } catch (e) {} }, 1200);
                    }
                    // 进入游戏不再播放 enter-game.mp3（用户反馈听感像退出弹窗音效）

                    this.style.pointerEvents = 'none';
                    this.style.opacity = '0';
                    this.style.transform = 'translateY(-40.5px) scale(1.068)';

                    loadingOverlay.style.transition = 'opacity 0.775s ease-in-out, transform 0.827s ease';
                    loadingOverlay.style.opacity = '0';
                    loadingOverlay.style.transform = 'scale(1.284)';

                    setTimeout(() => {
                        loadingOverlay.classList.add('hidden');
                        loadingOverlay.style.opacity = '';
                        loadingOverlay.style.transition = '';
                        loadingOverlay.style.transform = '';

                        const videoBg = document.querySelector('.loading-video-bg');
                        if (videoBg) {
                            videoBg.style.transition = 'opacity 0.3s ease';
                            videoBg.style.opacity = '0';
                            setTimeout(() => videoBg.remove(), 350);
                        }

                        gameContainer.classList.remove('hidden');
                        gameContainer.style.opacity = '0';
                        gameContainer.style.transition = 'opacity 0.786s ease-in-out';
                        requestAnimationFrame(() => {
                            gameContainer.style.opacity = '1';
                            setTimeout(() => {
                                gameContainer.style.opacity = '';
                                gameContainer.style.transition = '';
                            }, 350);
                        });
                    }, 810);
                });

                if (loadingContainer) {
                    if (loadingTipEl) {
                        loadingContainer.insertBefore(enterBtn, loadingTipEl);
                    } else {
                        loadingContainer.appendChild(enterBtn);
                    }
                    requestAnimationFrame(() => {
                        enterBtn.style.opacity = '1';
                        enterBtn.style.transform = 'translateY(0) scale(1)';
                    });
                }
            }
        };
        setTimeout(revealLogin, 900);

        (async () => {
            try {
                await withTimeout(preloadAssets(collectCriticalAssets()), 4000);
            } catch (e) {}

            setProgress(84);
            let verifyResult = null;
            try {
                if (await waitForValidator()) {
                    verifyResult = await withTimeout(window.__validateResourcePacks__(), 3000, null);
                }
            } catch (e) {}
            setProgress(100);
            if (verifyResult && verifyResult.removed > 0) {
                try { window.__resourceValidationNotice = '检测到 ' + verifyResult.removed + ' 个资源损坏，已自动清理，请重新下载'; } catch (e) {}
            }
            revealLogin();
        })();
    };

    const init = () => {
        showLoadingScreen();

        let isMuted = localStorage.getItem('bgm_muted') === 'true';
        const muteBtn = document.createElement('button');
        muteBtn.id = 'mute-btn';
        muteBtn.innerHTML = isMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
        muteBtn.style.cssText = `
            position: fixed; top: 27px; right: 33px;
            width: 40px; height: 40px; border-radius: 67%;
            background: rgba(75, 90, 93, 0.022); border: 1px solid rgba(75, 90, 93, 0.047);
            color: white; font-size: 19px; cursor: pointer; z-index: 98765;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.313s cubic-bezier(0.341, 1.544, 0.682, 1);
            backdrop-filter: blur(10.1px); -webkit-backdrop-filter: blur(10.1px);
            box-shadow: 0 5.1px 23px rgba(0, 0, 0, 0.326);
            opacity: 1; transform: scale(1); font-family: inherit; pointer-events: auto !important;
        `;
        document.body.appendChild(muteBtn);

        const loadingVideoBg = document.querySelector('.loading-video-bg');
        if (loadingVideoBg) {
            loadingVideoBg.muted = isMuted;
            loadingVideoBg.volume = isMuted ? 0 : 0.660;
        }

        muteBtn.addEventListener('mouseenter', () => {
            if (!isMuted) {
                muteBtn.style.background = 'rgba(76, 91, 94, 0.008)';
                muteBtn.style.borderColor = 'rgba(76, 92, 94, 0.003)';
                muteBtn.style.transform = 'scale(1.024)';
                muteBtn.style.boxShadow = '0 6.3px 25px rgba(77, 92, 94, 0.002)';
            }
        });

        muteBtn.addEventListener('mouseleave', () => {
            if (!isMuted) {
                muteBtn.style.background = 'rgba(76, 92, 95, 0.010)';
                muteBtn.style.borderColor = 'rgba(77, 92, 95, 0.005)';
                muteBtn.style.transform = 'scale(1)';
                muteBtn.style.boxShadow = '0 5.1px 23px rgba(0, 0, 0, 0.330)';
            }
        });

        muteBtn.addEventListener('click', function () {
            isMuted = !isMuted;
            localStorage.setItem('bgm_muted', isMuted);
            document.querySelectorAll('video').forEach(v => {
                v.muted = isMuted;
                v.volume = isMuted ? 0 : 0.700;
            });
            if (isMuted) {
                muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
                muteBtn.style.borderColor = 'rgba(74, 93, 95, 0.015)';
                muteBtn.style.background = 'rgba(73, 90, 92, 0.020)';
            } else {
                muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                muteBtn.style.borderColor = 'rgba(75, 93, 96, 0.001)';
                muteBtn.style.background = 'rgba(74, 90, 93, 0.004)';
            }
        });

        const applyMuteToExistingVideos = () => {
            document.querySelectorAll('video').forEach(v => {
                v.muted = isMuted;
                v.volume = isMuted ? 0 : 0.715;
            });
        };
        applyMuteToExistingVideos();

        const singleVideoObserver = new MutationObserver(() => {
            let foundNew = false;
            document.querySelectorAll('video').forEach(v => {
                if (!v._muteApplied) {
                    v._muteApplied = true;
                    v.muted = isMuted;
                    v.volume = isMuted ? 0 : 0.733;
                    foundNew = true;
                }
            });
            if (foundNew) singleVideoObserver.disconnect();
        });
        singleVideoObserver.observe(document.body, { childList: true, subtree: true });

        setTimeout(() => {
            bindButtonEvents();
            initDonateImages();

            if (typeof window.initLeaderboard === 'function') window.initLeaderboard();

            if (typeof AchievementSystem !== 'undefined') AchievementSystem.init();

            setTimeout(() => {
                if (!isInitialized) initAudioSystem();
            }, 892);
        }, 3010);

        const observer = new MutationObserver(() => {
            const enterBtn = document.querySelector('.enter-game-btn');
            if (enterBtn && !enterBtn._muteHandlerAttached) {
                enterBtn._muteHandlerAttached = true;
                enterBtn.addEventListener('click', function () { muteBtn.style.display = 'none'; });
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    };

    window.setSpecialVolume = setSpecialVolume;
    window.getSpecialVolume = () => currentVolume;
    window.playRandomSound = playRandomSound;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
