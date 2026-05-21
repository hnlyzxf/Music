localforage.config({ driver: localforage.INDEXEDDB, name: 'muzibai-music-db', storeName: 'muzibai-music-store' });

async function getStorage(key) {
  const data = await localforage.getItem(key);
  if (!data) return null;
  try {
    const text = pako.inflate(data, { to: 'string' });
    return JSON.parse(text);
  } catch (error) {
    console.log('parse error', error);
    return null;
  }
}

function setStorage(key, val) {
  if (!val && val !== 0) return localforage.removeItem(key);
  const text = JSON.stringify(val);
  const data = pako.deflate(new TextEncoder().encode(text), { level: 9 });
  return localforage.setItem(key, data).catch(console.error);
}

function setStorageExp(key, val, ttl) {
  localStorage.setItem(key, JSON.stringify({ val, exp: !ttl ? 0 : (Date.now() + ttl * 1000) }));
}

function getStorageExp(key) {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;
  try {
    const item = JSON.parse(itemStr);
    return Date.now() < item.exp || item.exp == 0 ? item.val : localStorage.removeItem(key);
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function downloadText(text, name) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(link).click();
  link.remove();
  URL.revokeObjectURL(url);
}

function showNotification(message, type = 'info', duration = 2) {
  const notification = Object.assign(document.createElement('div'), {
    textContent: message,
    className: `toast ${type}`,
  });
  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add('show'), 20);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 240);
  }, duration * 1000);
}

function genRandomIndexes(len) {
  const arr = [];
  while (arr.length < len) {
    const randomIndex = Math.floor(Math.random() * len);
    if (!arr.includes(randomIndex)) arr.push(randomIndex);
  }
  return arr;
}

function toggleLoading(isShow) {
  document.getElementById('loadingRef')?.classList.toggle('hide', !isShow);
}

window.API_BASE = 'https://music-api.gdstudio.xyz/api.php';
window.albumSbgImg = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 2056 2056"><rect width="2056" height="2056" rx="420" fill="#ecf3ff"/><path fill="#465fff" d="M1420.001 512H1484v735.996c0 88.369-100.289 160.007-224.006 160.007s-224.006-71.638-224.006-160.007c0-88.37 100.289-160.008 224.006-160.008 62.688 0 119.335 18.391 160.007 48.046v-368.04L908.011 881.78v494.214c0 88.37-100.288 160.007-224.005 160.007S460 1464.362 460 1375.993s100.289-160.007 224.006-160.007c62.688 0 119.334 18.39 160.007 48.045V639.997z"/></svg>')}`;
window.searchOptions = [
  { k: '网易云音乐', v: 'netease' },
  { k: '酷我音乐', v: 'kuwo' },
  { k: 'JOOX', v: 'joox' },
  { k: 'QQ音乐', v: 'tencent' },
  { k: 'TIDAL', v: 'tidal' },
  { k: 'Qobuz', v: 'qobuz' },
  { k: 'Apple Music', v: 'apple' },
  { k: 'YouTube Music', v: 'ytmusic' },
  { k: 'Spotify', v: 'spotify' },
  { k: 'Bilibili', v: 'bilibili' },
];
window.cacheKey = {
  searchHistory: 'searchHistory',
  lyricHistory: 'lyricHistory',
  playList: 'playList',
  playMode: 'dm_playMode',
  fontSize: 'dm_fontSize',
  currInd: 'dm_currInd',
  currTime: 'dm_currTime',
  uiTemplate: 'dm_uiTemplate',
};

window.templateOptions = [
  { key: 'default', label: 'default' },
  { key: 'mengkun', label: 'mengkun' },
  { key: 'maicong', label: 'maicong' },
];

function normalizeTemplateKey(template) {
  const legacyMap = { modern: 'default', mk: 'mengkun', music177: 'maicong' };
  const normalized = legacyMap[template] || template;
  return templateOptions.some(item => item.key === normalized) ? normalized : 'default';
}

window.getSongUrl = async function(song, br) {
  try {
    return (await fetch(`${API_BASE}?types=url&id=${song.id}&source=${song.source}&br=${br}`).then(res => res.json()) || {}).url;
  } catch (e) {
    console.error(e);
    return null;
  }
};

window.getSongLyric = async function(song) {
  try {
    return (await fetch(`${API_BASE}?types=lyric&source=${song.source}&id=${song.lyric_id || song.id}`).then(res => res.json()) || {}).lyric;
  } catch (e) {
    console.error(e);
    return null;
  }
};

window.getAlbumCoverUrl = async function(song, size = 300) {
  if (!song.pic_id) return albumSbgImg;
  try {
    return (await fetch(`${API_BASE}?types=pic&source=${song.source}&id=${song.pic_id}&size=${size}`).then(res => res.json()) || {}).url || albumSbgImg;
  } catch {
    return albumSbgImg;
  }
};

window.searchMusicBind = async function(keyword, source) {
  const cleanKeyword = (keyword || '').trim();
  if (!cleanKeyword) {
    this.searchResults = [];
    this.searchMessage = '输入关键词开始搜索音乐';
    this.showNotification('请输入搜索关键词', 'warning');
    return false;
  }
  const key = `${source}_${cleanKeyword}`;
  if (this.searchHistory[key]) {
    this.searchResults = this.searchHistory[key];
    this.searchMessage = this.searchResults.length ? '' : '未找到相关歌曲';
    return this.searchResults.length > 0;
  }
  try {
    const data = await fetch(`${API_BASE}?types=search&source=${source}&name=${encodeURIComponent(cleanKeyword)}&count=30`).then(res => res.json());
    this.searchResults = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error(e);
    this.searchResults = [];
    this.searchMessage = '搜索失败，请检查网络连接';
    throw e;
  }
  if (!this.searchResults.length) {
    this.searchMessage = '未找到相关歌曲，请尝试其他关键词';
    showNotification('未找到相关歌曲，请尝试其他关键词', 'warning');
    return false;
  }
  this.searchMessage = '';
  this.searchHistory[key] = this.searchResults;
  setStorage(cacheKey.searchHistory, this.searchHistory);
  return true;
};

window.refreshBind = async function() {};
window.sourceChangeBind = async function() {
  if ((this.searchKeyword || '').trim() && this.searchResults.length) await this.searchMusic();
};
window.uploadLyricBind = async function() {};
window.mixin = {};
window.syncCode = getStorageExp('dm_syncCode') || '';

function changeSyncCode() {
  const temp = prompt('请输入同步编码，4-10个字符', syncCode);
  if (!temp || temp.trim().length < 4) return;
  syncCode = temp;
  setStorageExp('dm_syncCode', syncCode);
  showNotification('同步编码已保存', 'success');
}

function ensureSyncCode() {
  if (syncCode) return true;
  const code = prompt('请输入同步编码，超过3个字符', '');
  if (!code || code.trim().length < 4) {
    showNotification('未配置同步编码', 'error');
    return false;
  }
  syncCode = code;
  setStorageExp('dm_syncCode', syncCode);
  return true;
}

function uploadList(data) {
  if (!confirm('确定要上传覆盖远端列表吗？')) return Promise.resolve();
  if (!ensureSyncCode()) return Promise.resolve();
  const uploadUrl = `//home.199311.xyz:40003/upload?name=muzibai_music_${syncCode}.dat`;
  const arr = pako.deflate(new TextEncoder().encode(JSON.stringify(data)), { level: 9 });
  const formData = new FormData();
  formData.append('file', new Blob([arr], { type: 'application/octet-stream' }));
  return fetch(uploadUrl, { method: 'POST', body: formData }).then(res => res.text());
}

async function downloadList() {
  if (!ensureSyncCode()) return null;
  const downloadUrl = `//home.199311.xyz:40003/download?name=muzibai_music_${syncCode}.dat&t=${Date.now()}`;
  try {
    const res = await fetch(downloadUrl, { method: 'GET' }).then(res => res.arrayBuffer());
    return JSON.parse(pako.inflate(new Uint8Array(res), { to: 'string' }));
  } catch {
    return null;
  }
}

let currTimeFlag = Date.now();
window.__MUZIBAI_APP_LOADED__ = true;

Vue.createApp({
  mixins: [mixin],
  data() {
    const storedTemplate = normalizeTemplateKey(getStorageExp(cacheKey.uiTemplate) || 'default');
    return {
      uiTemplate: storedTemplate,
      templateOptions,
      sidebarOpen: storedTemplate === 'default' && window.innerWidth >= 1024,
      isMobile: window.innerWidth < 500,
      options: searchOptions,
      playMode: 'loop',
      searchKeyword: '',
      selectedSource: searchOptions[0].v,
      selectedQuality: '320',
      searchResults: [],
      searchMessage: '输入关键词开始搜索音乐',
      isSearching: false,
      isSongLoading: false,
      searchHistory: {},
      lyricHistory: {},
      playList: [],
      currentSong: {
        title: '',
        artist: '',
        cover: '',
        raw: null,
      },
      isPlaying: false,
      currentTime: 0,
      totalTime: 0,
      progress: 0,
      volume: 80,
      lyrics: [],
      currentLyricIndex: -1,
      lyricFontSize: window.innerWidth < 800 ? 18 : (getStorageExp(cacheKey.fontSize) || 50),
      lyricsEnd: null,
      lyricLock: true,
      lyricFull: false,
      historyTime: 0,
      mkPanel: 'playing',
      music177Mode: 'name',
      music177MainVisible: false,
      music177TipsExpanded: false,
      albumSbgImg,
    };
  },
  computed: {
    templateLabel() {
      return templateOptions.find(item => item.key === this.uiTemplate)?.label || this.uiTemplate;
    },
    volumeIconClass() {
      if (this.volume == 0) return 'cursor fas fa-volume-mute volume-icon';
      if (this.volume < 50) return 'cursor fas fa-volume-down volume-icon';
      return 'cursor fas fa-volume-up volume-icon';
    },
    currIndSh() {
      return this.searchResults.length ? this.searchResults.findIndex(x => `${x.source}_${x.id}` === this.currentSong.key) : -1;
    },
    currInd() {
      return this.playList.length ? this.playList.findIndex(x => `${x.source}_${x.id}` === this.currentSong.key) : -1;
    },
    playModeText() {
      return { loop: '列表循环', random: '随机播放', one: '单曲循环' }[this.playMode] || this.playMode;
    },
    searchEmptyText() {
      if (this.isSearching) return '正在搜索...';
      return this.searchMessage || ((this.searchKeyword || '').trim() ? '未找到相关歌曲' : '输入关键词开始搜索音乐');
    },
    music177Placeholder() {
      return {
        name: '例如: 不要说话 陈奕迅',
        id: '例如: 25906124',
        url: '例如: http://music.163.com/#/song?id=25906124',
      }[this.music177Mode] || '例如: 不要说话 陈奕迅';
    },
    music177Pattern() {
      return {
        name: '^.+$',
        id: '^[\\w\\/\\|]+$',
        url: '^https?:\\/\\/\\S+$',
      }[this.music177Mode] || '^.+$';
    },
  },
  methods: {
    goTo(selector) {
      document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (window.innerWidth < 1024) this.sidebarOpen = false;
    },
    syncTemplateClass() {
      const app = document.getElementById('app');
      if (!app) return;
      templateOptions.forEach(item => app.classList.remove(`template-${item.key}`));
      ['template-modern', 'template-mk', 'template-music177'].forEach(name => app.classList.remove(name));
      app.classList.add(`template-${this.uiTemplate}`);
    },
    focusPrimaryInput() {
      const selector = {
        default: '#searchPanel input[type="search"]',
        mengkun: this.mkPanel === 'search' ? '#search-area input[type="search"]' : '',
        maicong: '#j-input',
      }[this.uiTemplate];
      if (selector) document.querySelector(selector)?.focus();
    },
    setTemplate(template) {
      const normalized = normalizeTemplateKey(template);
      if (!normalized || this.uiTemplate === normalized) return;
      this.uiTemplate = normalized;
      setStorageExp(cacheKey.uiTemplate, normalized);
      this.sidebarOpen = normalized === 'default' && window.innerWidth >= 1024;
      this.$nextTick(() => {
        this.syncTemplateClass();
        this.focusPrimaryInput();
        window.dispatchEvent(new Event('resize'));
      });
    },
    setMkPanel(panel) {
      this.mkPanel = panel;
      if (panel === 'search') {
        this.$nextTick(() => document.querySelector('.template-mengkun #search-area input')?.focus());
      }
    },
    setMusic177Mode(mode) {
      this.music177Mode = mode;
      this.$nextTick(() => document.querySelector('.template-maicong #j-input')?.focus());
    },
    toggleMusic177Tips() {
      this.music177TipsExpanded = !this.music177TipsExpanded;
    },
    parseMusic177Url(input) {
      const text = (input || '').trim();
      const rules = [
        { source: 'netease', match: /music\.163\.com\/.*[?&]id=([^&#/]+)/i },
        { source: 'tencent', match: /y\.qq\.com\/.*\/song\/([^/.?#]+)/i },
        { source: 'kugou', match: /hash=([^&#/]+)/i },
        { source: 'kuwo', match: /kuwo\.cn\/play_detail\/([^/?#]+)/i },
        { source: 'migu', match: /music\.migu\.cn\/.*\/song\/([^/?#]+)/i },
        { source: 'baidu', match: /music\.taihe\.com\/song\/([^/?#]+)/i },
      ];
      for (const rule of rules) {
        const matched = text.match(rule.match);
        if (matched?.[1]) return { source: rule.source, id: matched[1] };
      }
      return null;
    },
    async submitMusic177() {
      const input = this.searchKeyword.trim();
      if (!input) return this.showNotification('请输入搜索关键词', 'warning');
      if (this.music177Mode === 'name') {
        await this.searchMusic();
        this.music177MainVisible = this.searchResults.length > 0;
        if (this.music177MainVisible) this.$nextTick(() => this.goTo('#j-main'));
        return;
      }

      const parsed = this.music177Mode === 'url'
        ? this.parseMusic177Url(input)
        : { source: this.selectedSource, id: input };
      if (!parsed?.id) return this.showNotification('暂不支持解析该音乐地址，请使用音乐名称搜索', 'warning');

      const sourceName = this.options.find(item => item.v === parsed.source)?.k || parsed.source;
      this.selectedSource = parsed.source;
      this.searchResults = [{
        id: parsed.id,
        source: parsed.source,
        name: `${sourceName} ${parsed.id}`,
        artist: ['ID 解析'],
        album: this.music177Mode === 'url' ? '音乐地址' : '音乐 ID',
      }];
      this.music177MainVisible = true;
      await this.playSong(0, true);
      this.$nextTick(() => this.goTo('#j-main'));
    },
    backMusic177() {
      if (this.$refs.audioPlayer && !this.$refs.audioPlayer.paused) this.$refs.audioPlayer.pause();
      this.music177MainVisible = false;
      this.searchKeyword = '';
      this.$nextTick(() => this.goTo('#j-validator'));
    },
    showSongInfo(song = this.currentSong.raw) {
      if (!song) return this.showNotification('请先选择歌曲', 'warning');
      const artist = Array.isArray(song.artist) ? song.artist.join(' / ') : (song.artist || this.currentSong.artist || '未知歌手');
      const album = song.album || '未知专辑';
      alert(`歌名：${song.name || this.currentSong.title || '未知歌曲'}\n歌手：${artist}\n专辑：${album}\n来源：${song.source || this.currentSong.source || ''}\nID：${song.id || this.currentSong.id || ''}`);
    },
    refresh: refreshBind,
    sourceChange: sourceChangeBind,
    uploadLyric: uploadLyricBind,
    formatArtist(song) {
      if (!song) return '';
      const artist = Array.isArray(song.artist) ? song.artist.join(' / ') : song.artist;
      return `${artist || '未知歌手'}${song.album ? ` · ${song.album}` : ''}`;
    },
    toTopList(isSearch) {
      if (isSearch === true) document.querySelector('#searchResults')?.scrollTo({ top: 0, behavior: 'smooth' });
    },
    focusList(isSearch) {
      const selector = isSearch ? '#searchResults .song-row.active' : '.queue-list .queue-row.active';
      document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    async searchMusic() {
      if (this.isSearching) return false;
      const keyword = (this.searchKeyword || '').trim();
      if (!keyword) {
        this.searchResults = [];
        this.searchMessage = '输入关键词开始搜索音乐';
        this.showNotification('请输入搜索关键词', 'warning');
        this.$nextTick(() => this.focusPrimaryInput());
        return false;
      }
      this.searchKeyword = keyword;
      this.isSearching = true;
      this.searchMessage = '正在搜索...';
      toggleLoading(true);
      try {
        const hasResult = await searchMusicBind.call(this, keyword, this.selectedSource);
        if (hasResult) {
          if (this.uiTemplate === 'mengkun') this.mkPanel = 'search';
          this.$nextTick(() => {
            document.querySelector('#searchResults')?.scrollTo({ top: 0 });
            document.querySelector('.template-mengkun #main-list')?.scrollTo({ top: 0 });
          });
        }
        return hasResult;
      } catch {
        this.showNotification('网络连接失败，请检查网络后重试', 'error');
        return false;
      } finally {
        this.isSearching = false;
        toggleLoading(false);
      }
    },
    async playSong(ind, isSearch, time = 0, isForce, shouldAutoPlay = true) {
      if (ind < 0 || (isSearch && ind >= this.searchResults.length) || (!isSearch && ind >= this.playList.length)) return;
      const song = isSearch ? this.searchResults[ind] : this.playList[ind];
      const key = `${song.source}_${song.id}`;
      if (this.currentSong.key === key && !isForce) {
        if (shouldAutoPlay && this.$refs.audioPlayer?.src && this.$refs.audioPlayer.paused) {
          this.$refs.audioPlayer.play().catch(e => console.error('play error', e));
        }
        return;
      }

      this.isSongLoading = true;
      this.currentSong = {
        key,
        id: song.id,
        source: song.source,
        title: song.name,
        lyric: song.lyric,
        raw: { ...song },
        artist: this.formatArtist(song),
        cover: await getAlbumCoverUrl(song),
      };
      this.loadLyrics(song);

      try {
        this.showNotification('正在加载音乐...', 'info');
        let songUrl = getStorageExp(key);
        if (!songUrl || isForce) {
          songUrl = await getSongUrl(song, this.selectedQuality);
          if (songUrl) setStorageExp(key, songUrl, 2 * 60 * 60);
        }
        if (!songUrl) return this.showNotification('无法获取音乐链接，请尝试其他歌曲或更换音质', 'error');

        this.addPlayList(song);
        this.$refs.audioPlayer.src = songUrl;
        const resumeTime = Number(time) || 0;
        this.historyTime = resumeTime;
        this.$refs.audioPlayer.addEventListener('loadedmetadata', () => {
          if (resumeTime && this.$refs.audioPlayer.duration) {
            this.$refs.audioPlayer.currentTime = Math.min(resumeTime, Math.max(0, this.$refs.audioPlayer.duration - 1));
          }
          if (shouldAutoPlay && resumeTime) {
            this.$refs.audioPlayer.play().then(() => {
              this.showNotification(`开始播放 ${this.formatArtist(song)} - ${song.name}`, 'success');
            }).catch(e => console.error('play error', e));
          }
        }, { once: true });
        this.$refs.audioPlayer.load();
        if (shouldAutoPlay && !resumeTime) {
          this.$refs.audioPlayer.play().then(() => {
            this.showNotification(`开始播放 ${this.formatArtist(song)} - ${song.name}`, 'success');
          }).catch(e => console.error('play error', e));
        }
      } catch {
        this.showNotification('播放失败，请检查网络连接', 'error');
      } finally {
        this.isSongLoading = false;
      }
    },
    addPlayList(song) {
      let ind = this.playList.findIndex(x => x.id === song.id && x.source === song.source);
      if (ind < 0) {
        this.playList.push(song);
        setStorage(cacheKey.playList, this.playList);
        ind = this.playList.length - 1;
      }
      if (this.playMode === 'random') this.randomIndexes = genRandomIndexes(this.playList.length);
      setStorageExp(cacheKey.currInd, ind);
    },
    delPlayList(index) {
      if (!confirm('确定要删除此歌曲吗？')) return;
      this.playList.splice(index, 1);
      setStorage(cacheKey.playList, this.playList);
      if (this.playMode === 'random') this.randomIndexes = genRandomIndexes(this.playList.length);
    },
    uploadList() {
      uploadList(this.playList).then(() => this.showNotification('同步歌曲列表成功', 'success'));
    },
    downloadList() {
      downloadList().then(data => {
        if (data && data.length) {
          if (data.length < this.playList.length && !confirm('远端歌曲比现在少，是否覆盖？')) return;
          this.playList = data;
          setStorage(cacheKey.playList, this.playList);
          this.showNotification('导入歌曲列表成功', 'success');
        } else {
          this.showNotification('导入歌曲列表失败', 'error');
        }
      });
    },
    toggleMode() {
      this.playMode = this.playMode === 'loop' ? 'random' : this.playMode === 'random' ? 'one' : 'loop';
      if (this.playMode === 'random') this.randomIndexes = genRandomIndexes(this.playList.length);
      this.showNotification(`切换播放模式为 ${this.playModeText}`);
      setStorageExp(cacheKey.playMode, this.playMode);
    },
    togglePlay() {
      if (!this.$refs.audioPlayer.src) return this.showNotification('请先选择要播放的歌曲', 'warning');
      this.isPlaying ? this.$refs.audioPlayer.pause() : this.$refs.audioPlayer.play();
      if (this.historyTime) this.$refs.audioPlayer.currentTime = this.historyTime;
      this.historyTime = 0;
    },
    prevSong() {
      const len = this.playList.length;
      if (!len) return;
      const cur = this.currInd;
      let ind = cur > 0 ? cur - 1 : len - 1;
      if (this.playMode === 'random') {
        const randomInd = this.randomIndexes.indexOf(cur);
        ind = this.randomIndexes[randomInd > 0 ? randomInd - 1 : this.randomIndexes.length - 1];
      }
      this.playSong(ind);
    },
    nextSong(isManual) {
      if (isManual === false && this.playMode === 'one') {
        this.$refs.audioPlayer.currentTime = 0;
        return this.$refs.audioPlayer.play();
      }
      const len = this.playList.length;
      if (!len) return;
      const cur = this.currInd < 0 ? 0 : this.currInd;
      let ind = (cur + 1) % len;
      if (this.playMode === 'random') ind = this.randomIndexes[(this.randomIndexes.indexOf(cur) + 1) % this.randomIndexes.length];
      this.playSong(ind);
    },
    seekTo(event) {
      if (!this.$refs.audioPlayer.duration) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const percent = (event.clientX - rect.left) / rect.width;
      this.$refs.audioPlayer.currentTime = percent * this.$refs.audioPlayer.duration;
    },
    seekToLyric(time) {
      if (this.lyricLock) return;
      this.$refs.audioPlayer.currentTime = time;
    },
    setVolume(value, isMute) {
      if (isMute) {
        value = value > 0 ? 0 : 80;
        this.volume = value;
      }
      this.$refs.audioPlayer.volume = value / 100;
    },
    updateProgress() {
      if (!this.$refs.audioPlayer.duration) return;
      this.progress = (this.$refs.audioPlayer.currentTime / this.$refs.audioPlayer.duration) * 100;
      this.currentTime = this.$refs.audioPlayer.currentTime;
      this.updateLyricHighlight();
      if (Date.now() - currTimeFlag < 1500) return;
      currTimeFlag = Date.now();
      setStorageExp(cacheKey.currTime, this.currentTime);
    },
    updateTotalTime() {
      this.totalTime = this.$refs.audioPlayer.duration;
    },
    changeQuality() {
      if (this.currInd === -1 || !this.$refs.audioPlayer.src) return;
      const currentTime = this.$refs.audioPlayer.currentTime;
      const wasPlaying = this.isPlaying;
      this.playSong(this.currInd, false, currentTime, true, wasPlaying);
    },
    async loadLyrics(song, isForce) {
      if (!song) return;
      this.lyrics = [];
      this.currentLyricIndex = -1;
      this.lyricsEnd = null;
      const key = `${song.source}_${song.id}`;
      if (this.lyricHistory[key] && !isForce) return this.parseLyrics(this.lyricHistory[key]);
      try {
        const lyric = await getSongLyric(song);
        if (lyric) {
          this.lyricHistory[key] = lyric;
          setStorage(cacheKey.lyricHistory, this.lyricHistory);
          this.parseLyrics(lyric);
        }
      } catch (e) {
        console.error('获取歌词失败:', e);
      }
    },
    parseLyrics(lrcText) {
      const lines = lrcText.split('\n');
      this.lyrics = [];
      lines.forEach(line => {
        const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
        if (!match) return;
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds = parseInt(match[3].padEnd(3, '0'), 10);
        const text = match[4].trim();
        if (text) this.lyrics.push({ time: minutes * 60 + seconds + milliseconds / 1000, text });
      });
      this.lyrics.sort((a, b) => a.time - b.time);
      if (this.lyrics.length) this.lyricsEnd = this.lyrics[this.lyrics.length - 1].time;
    },
    updateLyricHighlight() {
      const currentTime = this.$refs.audioPlayer.currentTime;
      let activeIndex = -1;
      for (let i = 0; i < this.lyrics.length; i++) {
        if (this.lyrics[i].time <= currentTime) activeIndex = i;
        else break;
      }
      if (activeIndex === this.currentLyricIndex) return;
      this.currentLyricIndex = activeIndex;
      if (!this.lyricLock || activeIndex < 0 || !this.$refs.lyricsContainer) return;
      const container = this.$refs.lyricsContainer;
      const activeLine = container.children[activeIndex];
      if (!activeLine) return;
      const targetScrollTop = activeLine.offsetTop - container.clientHeight / 2 + activeLine.offsetHeight / 2;
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.rafId = requestAnimationFrame(() => {
        container.scrollTop = Math.max(0, targetScrollTop);
      });
    },
    setFontSize(isBig) {
      this.lyricFontSize = Math.max(12, Math.min(72, this.lyricFontSize + (isBig ? 2 : -2)));
      setStorageExp(cacheKey.fontSize, this.lyricFontSize);
    },
    async downloadSong(ind, isSearch) {
      const song = isSearch ? this.searchResults[ind] : this.playList[ind];
      const key = `${song.source}_${song.id}`;
      try {
        this.showNotification('正在获取下载链接...', 'info');
        let songUrl = getStorageExp(key);
        if (!songUrl) {
          songUrl = await getSongUrl(song, this.selectedQuality);
          if (songUrl) setStorageExp(key, songUrl, 2 * 60 * 60);
        }
        if (!songUrl) return this.showNotification('无法获取音乐链接，请尝试其他歌曲或更换音质', 'error');
        const link = Object.assign(document.createElement('a'), {
          href: songUrl,
          target: '_blank',
          download: `${song.name} - ${Array.isArray(song.artist) ? song.artist.join(', ') : song.artist}.mp3`,
        });
        document.body.appendChild(link);
        link.click();
        link.remove();
        this.showNotification('开始下载音乐文件', 'success');
      } catch {
        this.showNotification('下载失败，请稍后重试', 'error');
      }
    },
    async downloadLyric(ind, isSearch) {
      const song = isSearch ? this.searchResults[ind] : this.playList[ind];
      try {
        this.showNotification('正在获取歌词...', 'info');
        const key = `${song.source}_${song.id}`;
        const lyricContent = this.lyricHistory[key] || await getSongLyric(song);
        if (!lyricContent) return this.showNotification('无法获取歌词', 'error');
        downloadText(lyricContent, `${Array.isArray(song.artist) ? song.artist.join(', ') : song.artist} - ${song.name}.lrc`);
        this.showNotification('歌词下载完成', 'success');
      } catch {
        this.showNotification('下载歌词失败，请稍后重试', 'error');
      }
    },
    downloadCurrentSong() {
      if (this.currInd === -1) return this.showNotification('请先选择要下载的歌曲', 'warning');
      this.downloadSong(this.currInd);
    },
    downloadCurrentLyric() {
      if (this.currInd === -1) return this.showNotification('请先选择要下载歌词的歌曲', 'warning');
      this.downloadLyric(this.currInd);
    },
    formatTime(seconds) {
      if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    showNotification,
    isTypingTarget(target) {
      return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName) || target?.isContentEditable;
    },
    handleKeyDown(e) {
      if (e.code === 'Space' && !this.isTypingTarget(e.target)) {
        e.preventDefault();
        this.togglePlay();
      } else if (e.code === 'ArrowLeft' && !this.isTypingTarget(e.target)) {
        e.preventDefault();
        if (e.ctrlKey) return this.prevSong();
        this.$refs.audioPlayer.currentTime = Math.max(0, this.$refs.audioPlayer.currentTime - 5);
      } else if (e.code === 'ArrowRight' && !this.isTypingTarget(e.target)) {
        e.preventDefault();
        if (e.ctrlKey) return this.nextSong();
        this.$refs.audioPlayer.currentTime = Math.min(this.$refs.audioPlayer.duration || Infinity, this.$refs.audioPlayer.currentTime + 5);
      } else if (e.key == '0' && !this.isTypingTarget(e.target) && e.ctrlKey) {
        e.preventDefault();
        this.lyricFull = !this.lyricFull;
      } else if (e.key == '1' && !this.isTypingTarget(e.target) && e.ctrlKey) {
        e.preventDefault();
        this.focusList(true);
      } else if (e.key == '2' && !this.isTypingTarget(e.target) && e.ctrlKey) {
        e.preventDefault();
        this.focusList(false);
      } else if ((e.key == '+' || e.key == '=') && !this.isTypingTarget(e.target) && this.lyricFull) {
        e.preventDefault();
        this.setFontSize(true);
      } else if (e.key == '-' && !this.isTypingTarget(e.target) && this.lyricFull) {
        e.preventDefault();
        this.setFontSize(false);
      } else if (e.code == 'Escape' && !this.isTypingTarget(e.target) && this.lyricFull) {
        e.preventDefault();
        this.lyricFull = false;
      }
    },
    handleResize() {
      this.isMobile = window.innerWidth < 500;
      if (this.uiTemplate === 'default' && window.innerWidth >= 1024) this.sidebarOpen = true;
    },
  },
  async mounted() {
    this.syncTemplateClass();
    this.setVolume(this.volume);
    document.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('resize', this.handleResize);
    this.searchHistory = await getStorage(cacheKey.searchHistory) || {};
    this.lyricHistory = await getStorage(cacheKey.lyricHistory) || {};
    this.playList = await getStorage(cacheKey.playList) || [];
    this.playMode = getStorageExp(cacheKey.playMode) || 'loop';
    this.uiTemplate = normalizeTemplateKey(getStorageExp(cacheKey.uiTemplate) || this.uiTemplate || 'default');
    setStorageExp(cacheKey.uiTemplate, this.uiTemplate);
    this.sidebarOpen = this.uiTemplate === 'default' && window.innerWidth >= 1024;
    this.syncTemplateClass();
    if (this.playMode === 'random') this.randomIndexes = genRandomIndexes(this.playList.length);
    this.$nextTick(() => {
      const currInd = getStorageExp(cacheKey.currInd);
      const currTime = getStorageExp(cacheKey.currTime);
      if (currInd || currInd === 0) setTimeout(() => this.playSong(currInd, false, currTime || 0, false, false), 500);
    });
    document.body.addEventListener('click', async () => {
      try {
        if (navigator.wakeLock) await navigator.wakeLock.request('screen');
      } catch {}
    }, { once: true });
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('resize', this.handleResize);
  },
}).mount('#app');
