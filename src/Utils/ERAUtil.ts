import { ERAEvents } from '@/Constants/ERAEvent';

/**
 * 发送删除ERA对象事件
 */
const DeleteByObject = async (object: any) => {
  await eventEmit(ERAEvents.DELETE_BY_OBJECT, object);
}

/**
 * 发送更新ERA对象的事件
 */
const UpdateByObject = async (object: any) => {
  await eventEmit(ERAEvents.UPDATE_BY_OBJECT, object);
}

/**
 * 发送插入ERA对象的事件
 */
const InsertByObject = async (object: any) => {
  await eventEmit(ERAEvents.INSERT_BY_OBJECT, object);
}

/**
 * 发送获取ERA快照的事件
 */
const EmitEraSnapshot = async () => {
  const chat_message = getChatMessages(-1)[0];
  const match = chat_message.message.match(/"era-message-key"="([^"]+)"/);
  if (match) {
    const key = match[1];
    await eventEmit(ERAEvents.GET_SNAPSHOT_AT_MK, { mk: key });
    return;
  }
  console.error(`未找到位于第${chat_message.message_id}楼层的旧数据`);
  return null;
}


export const ERAUtil = {
  DeleteByObject,
  UpdateByObject,
  InsertByObject,
  EmitEraSnapshot
}
