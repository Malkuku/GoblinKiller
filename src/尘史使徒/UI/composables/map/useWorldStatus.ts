// @/composables/map/useWorldStatus.js
import { computed } from 'vue';

export const useWorldStatus = (stat_data) => {
  const worldInfo = computed(() => stat_data.value?.['世界'] || {});
  const isDanger = computed(() => worldInfo.value?.['危险场景'] === true);

  const formattedTime = computed(() => {
    const rawTime = worldInfo.value?.['时间'];
    if (!rawTime) return { date: '--', clock: '--:--', weekday: '' };
    try {
      const match = rawTime.match(/^(.*?)\[(\d+)\]$/);
      let dateTimeStr = rawTime;
      let weekIndex = '1';
      if (match) { dateTimeStr = match[1]; weekIndex = match[2]; }
      const [datePart, timePart] = dateTimeStr.split('T');
      const weekMap = { '1': 'MON', '2': 'TUE', '3': 'WED', '4': 'THU', '5': 'FRI', '6': 'SAT', '7': 'SUN' };
      return { date: datePart, clock: timePart, weekday: weekMap[weekIndex] || `DAY ${weekIndex}` };
    } catch (e) { return { date: rawTime, clock: '', weekday: '' }; }
  });

  return { worldInfo, isDanger, formattedTime };
};
