import { ref, onMounted, onUnmounted, readonly } from 'vue';
import { KatEvents } from '@/Constants/KatEvent';
import * as toastr from 'toastr';

export function useTavernInteraction() {
  const isTavernBusy = ref(false);
  const rawHtml = ref('');
  const isStreaming = ref(false);

  let pollingInterval: any = null;
  let sendButtonObserver: MutationObserver | null = null;

  const checkTavernBusy = (btn: HTMLElement) => {
    const style = window.getComputedStyle(btn);
    const isHidden = style.display === 'none' || style.visibility === 'hidden';
    const isDisabled = btn.hasAttribute('disabled');
    // 注意：原代码中包含 fa-circle-stop 类名检查，这里予以保留
    const isStopIcon = btn.classList.contains('fa-circle-stop');
    const busy = isHidden || isDisabled || isStopIcon;
    if (isTavernBusy.value !== busy) {
      isTavernBusy.value = busy;
    }
  };

  const setupTavernObserver = () => {
    try {
      const parentDoc = window.parent.document;
      const tavernSendBtn = parentDoc.getElementById('send_but');
      if (tavernSendBtn) {
        checkTavernBusy(tavernSendBtn);
        if (sendButtonObserver) sendButtonObserver.disconnect();
        sendButtonObserver = new MutationObserver(() => {
          const currentBtn = parentDoc.getElementById('send_but');
          if (currentBtn) checkTavernBusy(currentBtn);
        });
        sendButtonObserver.observe(tavernSendBtn, { attributes: true, attributeFilter: ['style', 'class', 'disabled'] });
      }
    } catch (e) {
      console.warn('设置Tavern父窗口观察器失败', e);
    }
  };

  const fetchLatestMessage = () => {
    try {
      const parentDoc = window.parent.document;
      // 检查按钮状态的逻辑也放在轮询中，作为一种兜底
      const tavernSendBtn = parentDoc.getElementById('send_but');
      if (tavernSendBtn) checkTavernBusy(tavernSendBtn);

      const chatContainer = parentDoc.getElementById('chat');
      if (!chatContainer) return;

      const lastMessageDiv = chatContainer.querySelector('.last_mes .mes_text');
      if (lastMessageDiv) {
        const currentHtml = lastMessageDiv.innerHTML;
        if (currentHtml !== rawHtml.value) {
          rawHtml.value = currentHtml;
          isStreaming.value = true;
        } else {
          isStreaming.value = false;
        }
      }
    } catch (e) {
      // 在跨域或父窗口不存在时，此错误是预期的，静默处理
      // console.warn('轮询父窗口失败', e);
    }
  };

  const sendMessage = async (textToSend: string) => {
    try {
      const parentDoc = window.parent.document;
      const stInput = parentDoc.querySelector('#send_textarea') as HTMLTextAreaElement;
      const stSendBtn = parentDoc.querySelector('#send_but') as HTMLElement;

      if (stInput && stSendBtn) {
        stInput.value = textToSend;
        stInput.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 50)); // 严格复刻50ms延迟
        stSendBtn.click();
      } else {
        console.warn("未找到酒馆发送按钮或输入框");
        // 如果找不到，需要手动重置繁忙状态，否则UI会卡住
        isTavernBusy.value = false;
      }
    } catch (e) {
      console.error('发送消息错误:', e);
      isTavernBusy.value = false;
    }
  };

  const stopGeneration = () => {
    try {
      const parentWin = window.parent as any;
      const stopBtn = parentWin.document.querySelector('#form_sheld .mes_stop');
      if (stopBtn) {
        const eventOpts = { bubbles: true, cancelable: true, view: parentWin };
        stopBtn.dispatchEvent(new MouseEvent('mousedown', eventOpts));
        stopBtn.dispatchEvent(new MouseEvent('click', eventOpts));
      }
    } catch (e) {
      console.error('停止生成错误:', e);
    }
  };

  const rerollCurrent = () => {
    try {
      const parentWin = window.parent as any;
      const swipeButtons = parentWin.document.querySelectorAll('.swipe_right');
      if (swipeButtons.length > 0) {
        const lastSwipeBtn = swipeButtons[swipeButtons.length - 1] as HTMLElement;
        // 严格复刻 jQuery trigger 回退逻辑
        if (parentWin.jQuery) {
          parentWin.jQuery(lastSwipeBtn).trigger('click');
        } else {
          lastSwipeBtn.click();
        }
      } else {
        console.error('未找到任何 .swipe_right 按钮');
      }
    } catch (e) {
      console.error('重roll错误:', e);
    }
  };

  const recalculateVariables = async () => {
    try {
      await eventEmit(KatEvents.kat_resend_mvu_update);
      toastr.success("已发送变量重算");
    } catch (e) {
      console.error('变量重算错误:', e);
      toastr.error("变量重算失败");
    }
  };

  onMounted(() => {
    fetchLatestMessage();
    pollingInterval = setInterval(fetchLatestMessage, 200); // 严格复刻200ms轮询
    setupTavernObserver();
  });

  onUnmounted(() => {
    if (pollingInterval) clearInterval(pollingInterval);
    if (sendButtonObserver) sendButtonObserver.disconnect();
  });

  return {
    isTavernBusy: readonly(isTavernBusy),
    rawHtml: readonly(rawHtml),
    isStreaming: readonly(isStreaming),
    sendMessage,
    stopGeneration,
    rerollCurrent,
    recalculateVariables,
  };
}
