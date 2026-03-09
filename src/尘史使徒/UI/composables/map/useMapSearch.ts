// @/composables/map/useMapSearch.js
import { ref, nextTick } from 'vue';

export const useMapSearch = (stat_data) => {
  const isSearchOpen = ref(false);
  const searchQuery = ref('');
  const searchResults = ref([]);
  const searchInputRef = ref(null);

  const toggleSearch = () => {
    isSearchOpen.value = !isSearchOpen.value;
    if (isSearchOpen.value) {
      nextTick(() => searchInputRef.value?.focus());
    } else {
      searchQuery.value = '';
      searchResults.value = [];
    }
  };

  const globalSearch = (root, query, path = []) => {
    let results = [];
    if (!root) return results;
    for (const [key, value] of Object.entries(root)) {
      if (key.toLowerCase().includes(query.toLowerCase())) {
        results.push({ name: key, node: value, path: [...path, { name: key, node: value }] });
      }
      if (value['子地图']) {
        results = results.concat(globalSearch(value['子地图'], query, [...path, { name: key, node: value }]));
      }
    }
    return results;
  };

  const handleSearchInput = () => {
    if (!searchQuery.value?.trim()) {
      searchResults.value = [];
      return;
    }
    if (stat_data.value?.地图) {
      searchResults.value = globalSearch(stat_data.value.地图, searchQuery.value.trim());
    }
  };

  const formatPath = (pathArray) => pathArray.map(p => p.name).join(' > ');

  return {
    isSearchOpen, searchQuery, searchResults, searchInputRef,
    toggleSearch, handleSearchInput, formatPath
  };
};
