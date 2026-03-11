// AudioStore.ts
import { defineStore } from 'pinia';

// 匹配 API 的类型定义
type AudioWithOptionalTitle = {
  title?: string;
  url: string;
};

export const useAudioStore = defineStore('audio-resources', {
  state: () => ({
    // 将音频资源按 ID 映射，方便组件通过 ID 获取
    tracks: {
      burnBgm: { title: '火烧纸', url: 'https://gitgud.io/mouse789/dust-laden-obdurant/-/raw/main/bgm/火烧纸.mp3', type: 'ambient' },
      libBgm: { title: '图书馆之梦', url: 'https://gitgud.io/mouse789/dust-laden-obdurant/-/raw/main/bgm/图书馆之梦.mp3', type: 'bgm' }
    },
    isListLoaded: false,
  }),

  actions: {
    /**
     * 初始化音频资源
     * 将配置好的音频列表推送到原生的播放列表中
     */
    initAudioResources() {
      if (this.isListLoaded) return;

      try {
        // 将字典转换为 API 需要的数组格式，并按 bgm 和 ambient 分类
        const bgmList: AudioWithOptionalTitle[] = [];
        const ambientList: AudioWithOptionalTitle[] = [];

        for (const key in this.tracks) {
          const track = this.tracks[key as keyof typeof this.tracks];
          const audioObj = { title: track.title, url: track.url };

          if (track.type === 'bgm') {
            bgmList.push(audioObj);
          } else if (track.type === 'ambient') {
            ambientList.push(audioObj);
          }
        }

        // 调用底层 API 批量将音频加入播放列表 (不会重复添加)
        if (bgmList.length > 0) appendAudioList('bgm', bgmList);
        if (ambientList.length > 0) appendAudioList('ambient', ambientList);

        this.isListLoaded = true;
        console.log('[AudioStore] 音频列表已注入底层播放器');
      } catch (error) {
        console.error('[AudioStore] 音频列表注入失败:', error);
      }
    },

    /**
     * 供组件获取特定音频的播放参数
     */
    getTrack(id: keyof typeof this.tracks): AudioWithOptionalTitle {
      const track = this.tracks[id];
      if (!track) console.warn(`[AudioStore] 未找到音频 ID: ${id}`);
      return { title: track?.title, url: track?.url };
    }
  }
});
