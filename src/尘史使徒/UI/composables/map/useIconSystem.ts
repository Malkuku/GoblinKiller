// @/composables/map/useIconSystem.js
const ICON_PATHS = {
  'Default': 'M12 2L2 12l10 10 10-10L12 2zm0 4v2m0 8v2m-4-6h2m4 0h2',
  '王国': 'M2 18h20M4 14l3-8 5 5 5-5 3 8H4z',
  // ... (此处省略其他图标路径，保持原样即可) ...
  '藏宝地': 'M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 4v10h14V8H5zm7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
};

export const useIconSystem = () => {
  const getIconPath = (type) => {
    if (!type) return ICON_PATHS['Default'];
    if (ICON_PATHS[type]) return ICON_PATHS[type];
    const cleanName = type.replace('_Icon', '').replace('Icon', '');
    return ICON_PATHS[cleanName] || ICON_PATHS['Default'];
  };

  return { getIconPath };
};
