export const getCurrentMessage = () => {
  const message_id = getCurrentMessageId();
  const chat_messages = getChatMessages(message_id);

  if (!chat_messages || chat_messages.length === 0) {
    return '';
  }
  return String(chat_messages[0].message);
}


export const getOldStatData = async (message_id: number) => {
  const chatMessage  = getChatMessages(message_id)[0];
  const match = chatMessage.message.match(/"era-message-key"="([^"]+)"/);
  if (match) {
    const key = match[1];
    await eventEmit('era:getSnapshotAtMk', { mk: key });
    return;
  }
  console.error(`未找到位于第${chatMessage.message_id}楼层的旧数据`);
  return null;
}
