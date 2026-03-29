<template>
  <transition name="fade-overlay">
    <div class="loading-overlay">
      <div class="animus-loader">
        <div class="loader-ring"></div>
        <div class="loader-core"></div>
      </div>
      <div class="loading-text">SYNCHRONIZING...</div>
    </div>
  </transition>
</template>

<script setup lang="ts">
  // No script logic needed for this component
</script>

<style scoped>
  .loading-overlay {
    position: absolute; inset: 0; background: var(--scroll-paper, #fffcf5); z-index: 100;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px;
  }
  .animus-loader { position: relative; width: 60px; height: 60px; }
  .loader-ring {
    position: absolute; inset: 0; border: 2px solid transparent;
    border-top-color: var(--accent-gold, #c6a664); border-right-color: var(--accent-gold, #c6a664);
    border-radius: 50%; animation: spin 1.5s linear infinite;
  }
  .loader-core {
    position: absolute; inset: 15px; background: var(--accent-gold, #c6a664); opacity: 0.2;
    border-radius: 50%; animation: pulse 1s ease-in-out infinite alternate;
  }
  .loading-text {
    font-family: 'Cinzel', serif; color: var(--text-main, #4a3f35); letter-spacing: 2px;
    font-size: 0.9rem; animation: blink 1s infinite;
  }

  .fade-overlay-enter-active, .fade-overlay-leave-active { transition: opacity 0.5s ease; }
  .fade-overlay-enter-from, .fade-overlay-leave-to { opacity: 0; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { from { transform: scale(0.8); opacity: 0.5; } to { transform: scale(1.2); opacity: 1; } }
  @keyframes blink { 50% { opacity: 0; } }
</style>
