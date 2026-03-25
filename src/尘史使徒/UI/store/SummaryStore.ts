import { MvuUtil } from '@/Utils/MvuUtil';
import { useStatStore } from '@/尘史使徒/UI/store/StatStore';
import { defineStore } from 'pinia';
import { computed } from 'vue';
import { SummaryDetails, SummaryEvent, SummaryOverview } from '../types/StatData';

export const useSummaryStore = defineStore('summary', () => {
  const statStore = useStatStore();

  const summaryOverview = computed(() => {
    const data = statStore.stat_data as any;
    if (!data?.总结概括) return {};
    return data.总结概括 as Record<string, SummaryOverview>;
  });

  const summaryDetails = computed(() => {
    const data = statStore.stat_data as any;
    if (!data?.总结详细) return {};
    return data.总结详细 as Record<string, SummaryDetails>;
  });

  const overviewList = computed(() => {
    return Object.entries(summaryOverview.value)
      .filter(([key]) => key !== '$template')
      .map(([key, value]) => ({
        id: key,
        ...value
      }))
      .sort((a, b) => {
        if (a.重要度 !== b.重要度) {
          return b.重要度 - a.重要度;
        }
        return a.id.localeCompare(b.id);
      });
  });

  const detailsList = computed(() => {
    return Object.entries(summaryDetails.value)
      .filter(([key]) => key !== '$template')
      .map(([key, value]) => ({
        id: key,
        events: Object.entries(value).map(([eventName, eventData]) => ({
          name: eventName,
          ...eventData
        }))
      }));
  });

  const hasSummaryData = computed(() => {
    return overviewList.value.length > 0 || detailsList.value.length > 0;
  });

  const deleteOverview = async (id: string) => {
    const diffPayload = {
      总结概括: {
        [id]: null
      }
    };
    await MvuUtil.updateMvuDataByDiff(diffPayload);
  };

  const updateOverview = async (id: string, data: SummaryOverview) => {
    const diffPayload = {
      总结概括: {
        [id]: data
      }
    };
    await MvuUtil.updateMvuDataByDiff(diffPayload);
  };

  const deleteDetailSection = async (sectionId: string) => {
    const diffPayload = {
      总结详细: {
        [sectionId]: null
      }
    };
    await MvuUtil.updateMvuDataByDiff(diffPayload);
  };

  const deleteDetailEvent = async (sectionId: string, eventName: string) => {
    const currentDetails = summaryDetails.value[sectionId];
    if (!currentDetails) return;

    const diffPayload = {
      总结详细: {
        [sectionId]: {
          [eventName]: null
        }
      }
    };
    await MvuUtil.updateMvuDataByDiff(diffPayload);
  };

  const updateDetailEvent = async (sectionId: string, eventName: string, data: SummaryEvent) => {
    const diffPayload = {
      总结详细: {
        [sectionId]: {
          [eventName]: data
        }
      }
    };
    await MvuUtil.updateMvuDataByDiff(diffPayload);
  };

  return {
    summaryOverview,
    summaryDetails,
    overviewList,
    detailsList,
    hasSummaryData,
    deleteOverview,
    updateOverview,
    deleteDetailSection,
    deleteDetailEvent,
    updateDetailEvent
  };
});
