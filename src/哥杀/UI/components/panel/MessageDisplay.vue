<template>
  <div class="message-scroll-area" ref="scrollContainer">
    <div class="message-paper">
      <div class="message-content" :style="{ fontSize: fontSize + 'px' }">
        <div class="text-body" v-html="processedHtml"></div>
        <span v-if="isStreaming" class="typing-cursor">_</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, nextTick, computed } from 'vue';
  import { getCharacterInfo } from './characterConfig';

  const props = defineProps<{
    displayHtml: string;
    isStreaming: boolean;
    fontSize: number;
  }>();

  const scrollContainer = ref<HTMLElement | null>(null);

  const formatStaggeredName = (name: string) => {
    let result = '';
    let charIndex = 0;

    for (let i = 0; i < name.length; i++) {
      const char = name[i];
      if (char === '·') {
        result += `<span class="name-dot">${char}</span>`;
        charIndex = 0;
        continue;
      }

      const isFirst = charIndex === 0;
      const offsetClass = charIndex % 2 === 0 ? 'name-char-even' : 'name-char-odd';
      const charClass = isFirst ? 'name-first-char' : offsetClass;

      result += `<span class="name-char ${charClass}">${char}</span>`;
      charIndex++;
    }
    return result;
  };

  const processedHtml = computed(() => {
    if (!props.displayHtml) return '';

    const defaultSvg = `
    <svg class="avatar-fallback-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4" stroke-dasharray="2 4"/>
      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/>
      <polygon points="50,15 80,67 20,67" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" opacity="0.8"/>
      <polygon points="50,85 80,33 20,33" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" opacity="0.8"/>
      <circle cx="50" cy="50" r="23" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
      <circle cx="50" cy="50" r="18" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="4 2" opacity="0.4"/>
      <circle cx="50" cy="50" r="4" fill="currentColor" opacity="0.9"/>
      <circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/>
    </svg>
  `;

    const regex = /【([^】]+)】\s*(?:<q>(.*?)<\/q>|([「『].*?[」』])|<em>\s*\*?(.*?)\*?\s*<\/em>|\*(.*?)\*)/gs;

    let html = props.displayHtml.replace(regex, (match, rawName, qText, quoteText, emText, starText) => {
      let content = '';
      let isDialogue = false;

      if (qText !== undefined) { content = qText; isDialogue = true; }
      else if (quoteText !== undefined) { content = quoteText; isDialogue = true; }
      else if (emText !== undefined) { content = emText; }
      else if (starText !== undefined) { content = starText; }

      content = content.trim().replace(/^([「『"])|([」』"])$/g, '').trim();
      const charInfo = getCharacterInfo(rawName);

      const avatarHtml = charInfo.avatarUrl
        ? `<img src="${charInfo.avatarUrl}" class="avatar-img" alt="${charInfo.fixedName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
         <span class="avatar-fallback-wrapper" style="display:none;">${defaultSvg}</span>`
        : `<span class="avatar-fallback-wrapper">${defaultSvg}</span>`;

      const textClass = isDialogue ? 'role-text is-dialogue' : 'role-text is-thought';

      return `
      <span class="role-block">
        <span class="role-avatar">${avatarHtml}</span>
        <span class="role-main">
          <span class="role-name-wrapper ${charInfo.cssClass}">${formatStaggeredName(charInfo.fixedName)}</span>
          <span class="${textClass}">${content}</span>
        </span>
      </span>
    `;
    });

    return html;
  });

  const scrollToBottom = () => {
    nextTick(() => {
      if (scrollContainer.value) {
        scrollContainer.value.scrollTo({ top: scrollContainer.value.scrollHeight, behavior: 'smooth' });
      }
    });
  };

  defineExpose({ scrollContainer, scrollToBottom });
</script>

<style scoped>
  .message-scroll-area {
    flex: 1; overflow-y: auto; padding: 20px 0;
    scrollbar-width: thin; scrollbar-color: var(--accent-gold, #c6a664) transparent;
  }
  .message-paper { max-width: 1024px; margin: 0 auto; padding: 0 30px; }
  .message-content {
    line-height: 1.7;
    color: var(--text-main, #4a3f35);
    font-family: 'EB Garamond', 'Noto Serif SC', serif;
    transition: font-size 0.2s ease;
  }

  .text-body :deep(q) {
    quotes: none; display: inline; background: rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(198, 166, 100, 0.3); border-radius: 4px;
    padding: 2px 6px; margin: 0 2px; color: var(--text-main, #4a3f35);
    font-family: 'EB Garamond', serif; font-style: italic;
  }
  .text-body :deep(q)::before { content: ""; color: var(--accent-gold, #c6a664); margin-right: 3px; font-weight: bold; }
  .text-body :deep(q)::after { content: ""; color: var(--accent-gold, #c6a664); margin-left: 3px; font-weight: bold; }
  .text-body :deep(p) { margin-bottom: 1em; text-align: justify; }
  .text-body :deep(em) { color: var(--accent-gold, #c6a664); font-style: italic; }
  .text-body :deep(strong) { color: #8c3a3a; font-weight: 600; }

  /* 角色气泡 - 卷轴风格 */
  .text-body :deep(.role-block) {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin: 1.2em 0;
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 8px;
    border: 1px solid var(--scroll-border, #d4c4a8);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .text-body :deep(.role-block:hover) {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
  }

  .text-body :deep(.role-avatar) {
    width: 65px; height: 65px; flex-shrink: 0;
    border-radius: 50%;
    border: 2px solid var(--scroll-border, #d4c4a8);
    background: var(--scroll-paper, #fffcf5);
    overflow: hidden; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  }

  .text-body :deep(.avatar-img) { width: 100%; height: 100%; object-fit: cover; display: block; }
  .text-body :deep(.avatar-fallback-wrapper) { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--accent-gold, #c6a664); }
  .text-body :deep(.avatar-fallback-svg) { width: 65%; height: 65%; display: block; opacity: 0.8; }

  .text-body :deep(.role-main) {
    flex: 1; display: flex; flex-direction: column; gap: 6px;
  }

  .text-body :deep(.role-name-wrapper) {
    display: flex; align-items: baseline; font-weight: 700;
    letter-spacing: 1px; text-transform: capitalize;
    font-family: 'Georgia', 'Noto Serif SC', serif;
    color: #5c4e40;
  }
  .text-body :deep(.name-char) { display: inline-block; }
  .text-body :deep(.name-first-char) { font-size: 1.15em; margin-right: 1px; font-style: italic; }
  .text-body :deep(.name-char-even) { font-size: 0.95em; }
  .text-body :deep(.name-char-odd) { font-size: 0.88em; transform: translateY(-1.5px); }
  .text-body :deep(.name-dot) { font-size: 0.8em; margin: 0 2px; opacity: 0.7; transform: translateY(-2px); }

  .text-body :deep(.is-dialogue) {
    color: #4a3f35; font-size: 1.08em; font-weight: 500;
    line-height: 1.75; letter-spacing: 0.5px; display: block; position: relative;
  }
  .text-body :deep(.is-dialogue::before) { content: '「'; color: var(--accent-gold, #c6a664); font-size: 1.25em; margin-right: 2px; vertical-align: -0.1em; }
  .text-body :deep(.is-dialogue::after) { content: '」'; color: var(--accent-gold, #c6a664); font-size: 1.25em; margin-left: 2px; vertical-align: -0.15em; }

  .text-body :deep(.is-thought) {
    color: var(--text-muted, #8b7e70); font-size: 0.98em; font-style: italic;
    line-height: 1.65; display: block; padding-left: 12px;
    border-left: 2px dashed var(--scroll-border, #d4c4a8);
  }

  .typing-cursor { display: inline-block; color: var(--accent-gold, #c6a664); font-weight: bold; animation: blink 1s step-end infinite; }
  @keyframes blink { 50% { opacity: 0; } }
</style>
