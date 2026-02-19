<template>
  <div class="player-wrapper">
    <div class="player-bar">

      <!-- 左侧：图标与标题 -->
      <div class="left-section">
        <div class="disc-icon" :class="{ spinning: isPlaying }">
          <span>♫</span>
        </div>
        <div class="track-info">
          <span class="title">音乐播放</span>
          <span class="status" v-if="isPlaying">Playing...</span>
        </div>
      </div>

      <!-- 右侧：控制区 -->
      <div class="right-section">

        <!-- 音量滑块 -->
        <div class="volume-group">
          <span class="vol-icon">🔊</span>
          <input
            type="range"
            min="0"
            max="100"
            v-model.number="volume"
            @input="handleVolume"
            class="gold-slider"
            title="音量调节"
          >
        </div>

        <!-- 播放/暂停按钮 -->
        <button class="play-btn" @click="togglePlay" title="播放/暂停">
          {{ isPlaying ? '⏸' : '▶' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';


const musicUrl = "$1";
const fixedTitle = "音乐播放";

// ============================================================
// 2. 逻辑实现
// ============================================================

const isPlaying = ref(false);
const volume = ref(50);

// --- 修改点：在 onMounted 中添加自动播放逻辑 ---
onMounted(() => {
  // 1. 尝试同步初始音量
  if (typeof getAudioSettings !== 'undefined') {
    try {
      const settings = getAudioSettings('bgm');
      if (settings) volume.value = settings.volume;
    } catch (e) {
      console.warn("Audio API not ready");
    }
  }

  // 2. 自动播放：直接调用 togglePlay 触发播放
  // 注意：现代浏览器可能会拦截没有用户交互的自动播放，
  // 但如果在特定环境（如游戏引擎或已授权的App）中通常是有效的。
  togglePlay();
});

const togglePlay = () => {
  if (isPlaying.value) {
    // --- 暂停逻辑 ---
    if (typeof pauseAudio !== 'undefined') {
      pauseAudio('bgm');
    }
    isPlaying.value = false;
  } else {
    // --- 播放逻辑 ---
    if (typeof playAudio !== 'undefined') {
      // 1. 播放音频 (如果不在列表会自动加入)
      playAudio('bgm', {
        title: fixedTitle,
        url: musicUrl
      });

      // 2. 强制设定为单曲循环 + 应用音量
      if (typeof setAudioSettings !== 'undefined') {
        setAudioSettings('bgm', {
          mode: 'repeat_one', // 单曲循环
          muted: false,
          volume: volume.value
        });
      }
    } else {
      console.log("模拟播放:", musicUrl);
    }
    isPlaying.value = true;
  }
};

const handleVolume = () => {
  if (typeof setAudioSettings !== 'undefined') {
    setAudioSettings('bgm', { volume: volume.value });
  }
};
</script>

<style>
:root {
  --bg-bar: #2d2d2d;
  --text-main: #e0e0e0;
  --accent-gold: #d4af37;
  --accent-hover: #f4cf57;
  --border-color: #404040;
}

body {
  margin: 0;
  font-family: sans-serif;
  background: transparent;
}

.player-wrapper {
  padding: 10px;
  display: flex;
  justify-content: center;
}

.player-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--bg-bar);
  border: 1px solid var(--border-color);
  border-left: 4px solid var(--accent-gold); /* 左侧金色装饰条 */
  border-radius: 6px;
  padding: 8px 16px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
  height: 50px; /* 固定高度 */
}

/* --- 左侧区域 --- */
.left-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.disc-icon {
  width: 32px;
  height: 32px;
  background: #1a1a1a;
  border: 1px solid var(--accent-gold);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-gold);
  font-size: 14px;
  user-select: none;
}

.disc-icon.spinning {
  animation: spin 3s linear infinite;
}

.track-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.title {
  color: var(--text-main);
  font-weight: bold;
  font-size: 0.95rem;
}

.status {
  font-size: 0.7rem;
  color: var(--accent-gold);
  margin-top: 2px;
}

/* --- 右侧区域 --- */
.right-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

/* 音量条 */
.volume-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.vol-icon {
  font-size: 14px;
  color: #888;
}

.gold-slider {
  width: 80px;
  height: 4px;
  -webkit-appearance: none;
  background: #444;
  border-radius: 2px;
  outline: none;
}

.gold-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent-gold);
  cursor: pointer;
  transition: transform 0.1s;
}

.gold-slider::-webkit-slider-thumb:hover {
  transform: scale(1.3);
}

/* 播放按钮 */
.play-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--accent-gold);
  color: #1a1a1a;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding-left: 2px; /* 视觉修正 */
}

.play-btn:hover {
  background: var(--accent-hover);
  transform: scale(1.05);
}

.play-btn:active {
  transform: scale(0.95);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 移动端适配 */
@media (max-width: 400px) {
  .gold-slider {
    width: 50px;
  }
  .status {
    display: none;
  }
}
</style>
