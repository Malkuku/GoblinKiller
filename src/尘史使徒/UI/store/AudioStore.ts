import { defineStore } from 'pinia';

export const useAudioStore = defineStore('audio-resources', {
  state: () => ({
    resources: {
      burnBgm: 'https://gitgud.io/mouse789/dust-laden-obdurant/-/raw/main/bgm/火烧纸.mp3',
      libBgm: 'https://gitgud.io/mouse789/dust-laden-obdurant/-/raw/main/bgm/图书馆之梦.mp3'
    },
    _cache: {},
    // 记录加载状态：'idle' | 'loading' | 'ready' | 'error'
    loadStatus: {
      burnBgm: 'idle',
      libBgm: 'idle'
    }
  }),

  actions: {
    // 后台静默预加载，不返回 Promise，不阻塞
    preloadAll() {
      for (const [key, url] of Object.entries(this.resources)) {
        if (this.loadStatus[key] !== 'idle') continue; // 已经在下或者下好了，跳过

        this.loadStatus[key] = 'loading';
        const audio = new Audio();
        audio.src = url;
        audio.preload = 'auto';

        // 监听下载完成
        audio.addEventListener('canplaythrough', () => {
          console.log(`[AudioStore] ${key} 下载完成`);
          this.loadStatus[key] = 'ready';
        }, { once: true });

        // 监听下载失败
        audio.addEventListener('error', () => {
          this.loadStatus[key] = 'error';
        }, { once: true });

        audio.load(); // 触发后台下载
        this._cache[key] = audio;
      }
    },

    getUrl(key) {
      return this.resources[key] || '';
    }
  }
});
