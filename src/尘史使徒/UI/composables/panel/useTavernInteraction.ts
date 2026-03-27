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
    try {
      const parentDoc = window.parent.document;

      // 首先检查是否存在停止按钮
      const stopBtn = parentDoc.querySelector('#form_sheld .mes_stop');
      const hasStopButton = stopBtn &&
        window.getComputedStyle(stopBtn).display !== 'none' &&
        window.getComputedStyle(stopBtn).visibility !== 'hidden';

      if (hasStopButton) {
        // 如果停止按钮存在且可见，优先认为处于繁忙状态
        if (!isTavernBusy.value) {
          isTavernBusy.value = true;
        }
        return;
      }

      // 如果没有停止按钮，再检查发送按钮的状态
      const style = window.getComputedStyle(btn);
      const isHidden = style.display === 'none' || style.visibility === 'hidden';
      const isDisabled = btn.hasAttribute('disabled');
      const busy = isHidden || isDisabled;

      if (isTavernBusy.value !== busy) {
        isTavernBusy.value = busy;
      }
    } catch (e) {
      console.warn('检查Tavern状态失败', e);
    }
  };

  const setupTavernObserver = () => {
    try {
      const parentDoc = window.parent.document;
      const tavernSendBtn = parentDoc.getElementById('send_but');
      const stopBtn = parentDoc.querySelector('#form_sheld .mes_stop');

      if (tavernSendBtn) {
        checkTavernBusy(tavernSendBtn);
        if (sendButtonObserver) sendButtonObserver.disconnect();

        sendButtonObserver = new MutationObserver(() => {
          const currentBtn = parentDoc.getElementById('send_but');
          if (currentBtn) checkTavernBusy(currentBtn);
        });

        sendButtonObserver.observe(tavernSendBtn, {
          attributes: true,
          attributeFilter: ['style', 'class', 'disabled']
        });

        // 如果停止按钮存在，也观察它的变化
        if (stopBtn) {
          sendButtonObserver.observe(stopBtn, {
            attributes: true,
            attributeFilter: ['style', 'class']
          });
        }
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
