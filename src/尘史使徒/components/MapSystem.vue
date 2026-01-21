<template>
  <div class="map-container">
    <!-- 地图控制栏 -->
    <div class="map-controls">
      <div class="breadcrumbs">
        <span :class="{ active: currentLayer === 'world' }" @click="setLayer('world')">泰拉大陆</span>
        <span v-if="currentLayer !== 'world'" class="separator">/</span>
        <span v-if="currentLayer !== 'world'" :class="{ active: currentLayer === 'kingdom' }" @click="setLayer('kingdom')">埃布尔王国</span>
        <span v-if="currentLayer === 'city'" class="separator">/</span>
        <span v-if="currentLayer === 'city'" class="active">{{ currentCityName }}</span>
      </div>
      <div class="controls-right">
        <div class="coordinates-display">
          CURSOR: [N:{{ hoverCoords.x }}, E:{{ hoverCoords.y }}]
        </div>
      </div>
    </div>

    <!-- 地图视口 -->
    <div ref="viewportRef" class="viewport"
         @wheel.prevent="handleWheel"
         @mousedown="handleMouseDown"
         @mousemove="handleMouseMove"
         @mouseup="handleMouseUp"
         @mouseleave="handleMouseUp"
         @touchstart="handleTouchStart"
         @touchmove="handleTouchMove"
         @touchend="handleTouchEnd"
         @click="handleBackgroundClick">

      <!-- 变换层：仅负责平移 (Panning)，缩放由子元素位置计算处理 -->
      <div class="map-transform-layer" :style="translateStyle">

        <!-- 背景网格：通过 background-size 模拟缩放 -->
        <div class="grid-lines" :class="{ dense: currentLayer === 'city' }" :style="gridStyle"></div>

        <!-- 1. 宏观世界层 (World Layer) -->
        <transition name="map-fade">
          <div v-if="currentLayer === 'world'" class="map-layer">
            <!-- 边疆区域 -->
            <div v-for="loc in mapData.world" :key="loc.name"
                 class="map-node frontier-node"
                 :style="getPositionStyle(loc, 1.2)"
                 @click.stop="handleNodeClick(loc)">
              <div class="node-icon" :class="loc.type"></div>
              <span class="node-label">{{ loc.name }}</span>
            </div>
            <!-- 埃布尔王国入口 -->
            <div class="map-node kingdom-entry"
                 :style="getPositionStyle({x:0, y:0}, 1.2)"
                 @click.stop="handleNodeClick(kingdomSummary)">
              <div class="pulse-ring"></div>
              <div class="center-point"></div>
              <span class="node-label main-kingdom">埃布尔王国</span>
            </div>
          </div>
        </transition>

        <!-- 2. 王国广域层 (Kingdom Layer) -->
        <transition name="map-zoom">
          <div v-if="currentLayer === 'kingdom'" class="map-layer">
            <!-- 城市节点 -->
            <div v-for="city in mapData.kingdom.cities" :key="city.id"
                 class="map-node wide-city-node"
                 :style="getPositionStyle(city, 6)"
                 @click.stop="handleNodeClick(city)">
              <div class="city-icon" :class="city.id"></div>
              <span class="node-label city-label">{{ city.name }}</span>
            </div>
            <!-- 地理节点 -->
            <div v-for="geo in mapData.kingdom.geography" :key="geo.name"
                 class="map-node wide-geo-node"
                 :style="getPositionStyle(geo, 6)"
                 @click.stop="handleNodeClick(geo)">
              <div class="node-icon" :class="geo.type"></div>
              <span class="node-label">{{ geo.name }}</span>
            </div>
          </div>
        </transition>

        <!-- 3. 城市微观层 (City Layer) -->
        <transition name="map-zoom">
          <div v-if="currentLayer === 'city'" class="map-layer">
            <div v-for="loc in currentCityNodes" :key="loc.name"
                 class="map-node city-node"
                 :style="getPositionStyle(loc, 80, currentCityOffset)"
                 @click.stop="handleNodeClick(loc)">
              <!-- 特殊样式判断 -->
              <div v-if="loc.name.includes('王宫') || loc.name.includes('圣殿')" class="shape-star"></div>
              <div v-else-if="loc.name.includes('贵族')" class="shape-ring"></div>
              <div v-else class="node-point" :class="{ 'sub-point': loc.z < 0 }"></div>
              <span class="node-label">{{ loc.name }}</span>
            </div>
          </div>
        </transition>
      </div>

      <!-- UI 元素 -->
      <button v-if="currentLayer === 'kingdom'" class="back-btn" @click.stop="setLayer('world')">← 返回世界地图</button>
      <button v-if="currentLayer === 'city'" class="back-btn" @click.stop="setLayer('kingdom')">← 返回王国全境</button>

      <!-- 详情弹窗 (改为点击触发) -->
      <transition name="fade">
        <div v-if="tooltip.visible" class="map-tooltip" @click.stop>
          <button class="close-btn" @click="closeTooltip">×</button>
          <h3 class="tooltip-title">{{ tooltip.data.name }}</h3>
          <div class="tooltip-coords">
            N:{{ tooltip.data.x }}km / E:{{ tooltip.data.y }}km / Alt:{{ tooltip.data.z }}km
          </div>
          <p class="tooltip-desc">{{ tooltip.data.desc }}</p>

          <div class="tooltip-actions">
            <!-- 进入按钮 (仅针对可进入的节点) -->
            <button v-if="canEnter(tooltip.data)" class="action-btn enter-btn" @click="enterArea(tooltip.data)">
              进入区域
            </button>
            <!-- 前往按钮 -->
            <button class="action-btn travel-btn" @click="handleTravel(tooltip.data.name)">
              前往此处
            </button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

// =====================
// 状态管理
// =====================
const currentLayer = ref('world'); // 'world' | 'kingdom' | 'city'
const currentCityId = ref('');
const viewportRef = ref(null);
const hoverCoords = reactive({ x: 0, y: 0 });
const tooltip = reactive({ visible: false, data: {} });

// 视图变换状态
const transform = reactive({ k: 1, x: 0, y: 0 }); // k=scale, x/y=translate (pixels)
const isDragging = ref(false);
const dragStart = { x: 0, y: 0 };
const lastTransform = { x: 0, y: 0 };
const touchState = { dist: 0, center: { x: 0, y: 0 } };

const kingdomSummary = {
  name: "埃布尔王国", x: 0, y: 0, z: 0,
  desc: "人类文明的中心，由白金王宫统御的广袤疆域。",
  type: "kingdom" // 特殊类型标记
};

// =====================
// 地图数据
// =====================
const mapData = {
  world: [
    { name: "大荒漠", x: -125, y: -275, z: 0.2, desc: "龙牙山脉的另一侧，广袤无垠的焦土与沙海。黄沙漫天，生机绝迹。", type: "danger" },
    { name: "焚风之地", x: -115, y: -400, z: 0.5, desc: "位于龙牙山脉更西北方，毗邻大荒漠。永不停歇的灼热气流，扭曲着视线，干燥吞噬一切。", type: "danger" },
    { name: "邻近王国", x: -200, y: -525, z: 1, desc: "埃布尔王国西北方，与大荒漠接壤，具体形态未知。文明的另一面。", type: "unknown" },
    { name: "腐烂泥沼", x: 275, y: 0, z: 0, desc: "埃布尔王国正北方，一片广阔的沼泽地带。死寂腐朽，毒气弥漫，地面柔软易陷。", type: "swamp" },
    { name: "魔族聚集地", x: 375, y: -125, z: 0.1, desc: "位于腐烂泥沼的西北方，远离人类文明的荒芜之地。黑暗与邪恶的气息汇聚，扭曲着周围的现实。", type: "enemy" },
    { name: "永恒冻土", x: 500, y: -100, z: 0.3, desc: "埃布尔王国最北端，世界的尽头。亘古不化的冰雪覆盖大地，寒风呼啸，万物沉寂。", type: "ice" },
    { name: "龙牙山脉", x: 50, y: -105, z: 3, desc: "西部屏障。锯齿状黑色峰林，直刺天穹。", type: "mountain" },
    { name: "迷雾之海", x: 0, y: 290, z: 0, desc: "东部与东南部的白色虚无。液态的混沌。", type: "sea" },
    { name: "棱镜森林", x: 175, y: 225, z: 0.4, desc: "埃布尔王国东北方，迷雾之海以北的内陆区域。林木繁盛，光线在树叶与奇石间折射，色彩斑斓如幻象。", type: "forest" }
  ],
  kingdom: {
    cities: [
      { id: 'estrella', name: "艾斯特拉", x: 0, y: 0, z: 0.3, desc: "王都。权力与秩序的中枢。", type: "capital" },
      { id: 'qiming', name: "启明港", x: 25.5, y: 80.5, z: 0, desc: "东部沿海的吞吐口，贸易与信仰交汇。", type: "port" },
      { id: 'molten', name: "熔心城", x: 60, y: -120, z: 0.2, desc: "黑曜石与钢铁构成的工业巨兽。", type: "city" }
    ],
    geography: []
  },
  cities: {
    estrella: [
      { name: "白金王宫", x: 0, y: 0, z: 0.3, desc: "狮子之丘的冠冕。高耸于城市中心，纯白石材雕琢而成，它的存在俯瞰整个都城，彰显着王室权威与秩序。" },
      { name: "狮子之丘", x: 0.3, y: -0.2, z: 0.3, desc: "城市的脊柱，圆锥状隆起。" },
      { name: "贵族街", x: -1, y: 1, z: 0.05, desc: "环绕狮子之丘山脚的同心圆结构。建筑宏伟，道路宽阔如棋盘。是财富与权力的交汇点。" },
      { name: "菲尼克斯家族宅邸", x: -0.5, y: -0.8, z: 0.07, desc: "贵族街深处，靠近狮子之丘。由纯白大理石和晶体结构构成，其主塔如同竖琴，在阳光下折射出七彩的光芒。宅邸内部庭院宽阔，遍布罕见的花卉与鸣泉，四周高墙环绕。" },
      { name: "启明大礼拜堂", x: 0.5, y: -0.5, z: 0.06, desc: "贵族街外围，毗邻中央广场。首都灯教会的核心建筑，其主体为一座圆形穹顶建筑，白色石材搭建，简洁而庄严。教堂内部以采光和空旷感为主，没有神像，只有穹顶的彩绘玻璃在白昼时投下斑斓的光影，夜晚则依靠祭坛上的巨大水晶灯散发柔和白光。是王都民众进行每日祈祷和重要宗教仪式的场所。" },
      { name: "中央广场", x: 0.8, y: 0.8, z: 0.02, desc: "四通八达的道路在此汇聚，连接上城区与下城区的阀门。开阔的石板地，庆典与处刑的共用舞台。" },
      { name: "平民街", x: -2, y: 1.5, z: 0.01, desc: "街道狭窄、蜿蜒曲折，高密度的房屋紧密相连，层层叠叠。这里生活着城市的劳工与小商贩，是艾斯特拉真实而喧嚣的底层缩影。" },
      { name: "黑市巷", x: -1.5, y: 2, z: 0.01, desc: "平民街深处，一个隐藏在杂乱建筑之间的狭长小巷。这里没有固定的店铺，只有夜晚才会出现的流动摊位和窃窃私语的交易者。在这里，任何物品都能被找到，但也伴随着巨大的风险和秘密。" },
      { name: "王家四艺学院", x: 1.5, y: -1.2, z: 0.08, desc: "西北角，依山而建的堡垒式学府。培养王国的精英人才。" },
      { name: "雪落墓地", x: 3.2, y: 0, z: 0.02, desc: "北墙之外的阴冷洼地。碑林如齿。长年被冷风吹拂，即便无雪之时，也弥漫着一种永恒的冬日气息，是城市与死亡交界之地。" },
      { name: "下水道迷宫", x: -0.5, y: 0.5, z: -0.01, desc: "潜藏在艾斯特拉城市地面之下的巨大排水系统。它连接着城市的各个区域，却鲜为人知，是流浪者、盗贼和某些不法之徒的秘密通道与藏匿所。" },
      { name: "兽人村落", x: 4.5, y: -2, z: 0.05, desc: "散布于城市西北外围的粗糙营地。以简陋的木材和兽皮搭建，围成不规则的聚落。烟火与原始的气息在此弥漫，是异族文化在王都边缘的独特印记。" }
    ],
    qiming: [
      { name: "启明圣殿", x: 25.5, y: 80.5, z: 0.3, desc: "启明港最高处，“守望者之崖”上的白色尖塔。" },
      { name: "鲸骨码头", x: 23.5, y: 78.5, z: 0, desc: "启明港最古老的码头，用巨鲸肋骨作为支撑和加固。停靠着大量船，地面常年湿滑，弥漫着海水的咸腥与鱼类的鲜活气息。" },
      { name: "风语市集", x: 25, y: 80, z: 0.01, desc: "位于港口核心，由巨大帆布和临时搭建的木棚组成，是各种货物与信息交流的中心。空气中弥漫着鱼腥味、香料味和偶尔的争吵声。" },
      { name: "海鹰旅店", x: 26.2, y: 81.8, z: 0.03, desc: "紧邻风语市集,提供住宿餐食乃至娼妓。其顶楼能俯瞰港口，是水手和商人们打探消息、享受夜晚的好去处。常有吟游诗人在此驻唱，讲述传说。" },
      { name: "崖灯区", x: 25.6, y: 80.34, z: 0.1, desc: "沿着守望者之崖蜿蜒而建的富人区，拥有启明港最好的海景。一栋栋白色的石头别墅错落有致，夜晚灯火辉煌，与远处的指引之炬交相辉映。" }
    ],
    molten: [
      { name: "秩序熔炉", x: 60.1, y: -120, z: 0.2, desc: "紧邻城市核心，略微向北偏东，拔地而起。" },
      { name: "炉火区", x: 61, y: -121, z: 0.15, desc: "核心制造区域，无数巨大的锻炉日夜轰鸣，铁水流淌。高耸的烟囱喷吐着浓烟，将天空染成灰色。" },
      { name: "动力中枢", x: 59.2, y: -120.2, z: 0.25, desc: "城市的能源命脉，炉光从缝隙透出，将周围染上诡橙红色。" },
      { name: "黑铁市场", x: 60, y: -118.5, z: 0.1, desc: "庞大而混乱的交易场所，专门贩售来自各地的矿石、精炼金属、机械部件以及工业魔法材料。" },
      { name: "哀嚎矿洞", x: 60.2, y: -122, z: 0.05, desc: "城市北端，通向地下深处矿脉的巨大竖井。洞口常年冷风呼啸，形似哀嚎。" }
    ]
  }
};

// =====================
// 计算属性
// =====================

const currentCityName = computed(() => {
  const city = mapData.kingdom.cities.find(c => c.id === currentCityId.value);
  return city ? city.name : '未知城市';
});

const currentCityNodes = computed(() => mapData.cities[currentCityId.value] || []);

const currentCityOffset = computed(() => {
  if (currentLayer.value !== 'city') return { x: 0, y: 0 };
  const city = mapData.kingdom.cities.find(c => c.id === currentCityId.value);
  return city ? { x: city.x, y: city.y } : { x: 0, y: 0 };
});

// 1. 容器只负责平移，不负责缩放，保证文字清晰
const translateStyle = computed(() => ({
  transform: `translate(${transform.x}px, ${transform.y}px)`
}));

// 2. 网格通过 background-size 模拟缩放
const gridStyle = computed(() => {
  const size = 100 * transform.k;
  return {
    backgroundSize: `${size}px ${size}px`
  };
});

// =====================
// 核心逻辑：坐标计算
// =====================

// 计算节点位置：使用像素偏移而非百分比，确保在缩放时保持清晰
// 公式：中心点(50%) + (相对坐标 * 基础比例 * 缩放系数)px
const getPositionStyle = (loc, baseScalePx, offset = {x: 0, y: 0}) => {
  const relX = loc.x - offset.x; // 北向 (Bottom)
  const relY = loc.y - offset.y; // 东向 (Left)

  // baseScalePx: 1单位坐标对应的像素值 (在1倍缩放下)
  // transform.k: 当前缩放倍数
  const pixelX = relX * baseScalePx * transform.k;
  const pixelY = relY * baseScalePx * transform.k;

  return {
    bottom: `calc(50% + ${pixelX}px)`,
    left: `calc(50% + ${pixelY}px)`
  };
};

// =====================
// 交互逻辑
// =====================

const setLayer = (layer) => {
  currentLayer.value = layer;
  if (layer !== 'city') currentCityId.value = '';
  resetView();
};

const resetView = () => {
  transform.k = 1;
  transform.x = 0;
  transform.y = 0;
  closeTooltip();
};

// 点击节点：打开详情
const handleNodeClick = (data) => {
  if (isDragging.value) return;
  tooltip.data = data;
  tooltip.visible = true;
};

// 点击背景：关闭详情
const handleBackgroundClick = () => {
  if (!isDragging.value) closeTooltip();
};

const closeTooltip = () => {
  tooltip.visible = false;
};

// 判断是否可进入
const canEnter = (data) => {
  return data.type === 'kingdom' || data.type === 'capital' || data.type === 'city' || data.type === 'port';
};

// 进入区域逻辑
const enterArea = (data) => {
  if (data.type === 'kingdom') {
    setLayer('kingdom');
  } else if (['capital', 'city', 'port'].includes(data.type)) {
    currentCityId.value = data.id;
    currentLayer.value = 'city';
    resetView();
  }
};

// 发送指令到父窗口
const handleTravel = (locationName) => {
  const option = `<user>打算前往${locationName}`;
  try {
    const input = window.parent.document.querySelector('#send_textarea');
    if (!input) return;
    const currentValue = input.value.trim();
    input.value = currentValue ? `${currentValue} ${option}` : option;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
    closeTooltip(); // 点击前往后关闭弹窗
  } catch (error) {
    console.error("Interaction Error:", error);
  }
};

// =====================
// 缩放与拖拽 (保持逻辑，但适配新的渲染方式)
// =====================

const MIN_SCALE = 0.5;
const MAX_SCALE = 4.0;

const handleWheel = (e) => {
  const rect = viewportRef.value.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const delta = -Math.sign(e.deltaY);
  const scaleFactor = 1 + (0.1 * delta);

  const oldScale = transform.k;
  let newScale = oldScale * scaleFactor;
  newScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);

  // 缩放中心计算
  transform.x = mouseX - (mouseX - transform.x) * (newScale / oldScale);
  transform.y = mouseY - (mouseY - transform.y) * (newScale / oldScale);
  transform.k = newScale;

  updateCursor(e);
};

const handleMouseDown = (e) => {
  isDragging.value = true;
  dragStart.x = e.clientX;
  dragStart.y = e.clientY;
  lastTransform.x = transform.x;
  lastTransform.y = transform.y;
};

const handleMouseMove = (e) => {
  updateCursor(e);
  if (!isDragging.value) return;
  const dx = e.clientX - dragStart.x;
  const dy = e.clientY - dragStart.y;
  transform.x = lastTransform.x + dx;
  transform.y = lastTransform.y + dy;
};

const handleMouseUp = () => {
  // 延迟一点重置 dragging，防止拖拽结束时触发 click
  setTimeout(() => { isDragging.value = false; }, 50);
};

// 触摸逻辑省略部分细节，保持与之前一致，核心是修改 transform.k/x/y
const handleTouchStart = (e) => {
  if (e.touches.length === 1) handleMouseDown(e.touches[0]);
  else if (e.touches.length === 2) {
    isDragging.value = false;
    touchState.dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    lastTransform.k = transform.k;
  }
};

const handleTouchMove = (e) => {
  e.preventDefault();
  if (e.touches.length === 1) handleMouseMove(e.touches[0]);
  else if (e.touches.length === 2) {
    const newDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    const scaleFactor = newDist / touchState.dist;
    transform.k = Math.min(Math.max(lastTransform.k * scaleFactor, MIN_SCALE), MAX_SCALE);
  }
};

const handleTouchEnd = (e) => {
  setTimeout(() => { isDragging.value = false; }, 50);
};

// 光标坐标更新 (适配新的像素计算逻辑)
const updateCursor = (e) => {
  if(!viewportRef.value) return;
  const rect = viewportRef.value.getBoundingClientRect();
  const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
  const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

  const mouseX = clientX - rect.left;
  const mouseY = clientY - rect.top;

  // 逆向计算：(鼠标位置 - 平移 - 中心偏移) / (缩放 * 基础比例)
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  // 基础比例 (需与 getPositionStyle 中的 baseScalePx 保持一致)
  let baseScale = 1.2;
  let offsetX = 0;
  let offsetY = 0;

  if (currentLayer.value === 'kingdom') baseScale = 6;
  else if (currentLayer.value === 'city') {
    baseScale = 80;
    offsetX = currentCityOffset.value.y;
    offsetY = currentCityOffset.value.x;
  }

  const rawX = (mouseX - transform.x - centerX) / (baseScale * transform.k); // 对应 Left (Y坐标)
  const rawY = (mouseY - transform.y - centerY) / (baseScale * transform.k); // 对应 Bottom (X坐标, 需反转)

  // 坐标系转换：屏幕Y向下增加，地图X(Bottom)向上增加 -> 取反
  const mapX = -rawY + offsetY;
  const mapY = rawX + offsetX;

  hoverCoords.x = mapX.toFixed(1);
  hoverCoords.y = mapY.toFixed(1);
};
</script>

<style scoped>
.map-container {
  width: 100%; height: 100%; display: flex; flex-direction: column;
  background-color: var(--bg-primary); position: relative; overflow: hidden;
  user-select: none; /* 防止文字被选中 */
}

.map-controls {
  height: 40px; display: flex; justify-content: space-between; align-items: center;
  padding: 0 15px; background: var(--bg-secondary); border-bottom: 1px solid var(--border-color); z-index: 5;
}

.controls-right { display: flex; align-items: center; gap: 15px; }
.breadcrumbs span {
  font-family: 'Cinzel', serif; font-size: 0.9rem; cursor: pointer; color: var(--text-secondary);
}
.breadcrumbs span.active { color: var(--accent-primary); cursor: default; }
.breadcrumbs span:hover:not(.active) { color: #fff; text-decoration: underline; }
.breadcrumbs .separator { margin: 0 8px; color: var(--border-color); }
.coordinates-display { font-family: monospace; font-size: 0.8rem; color: var(--text-secondary); }

.viewport {
  flex: 1; position: relative;
  background: radial-gradient(circle at center, #2a2f3a 0%, #1a1d24 100%);
  overflow: hidden; cursor: crosshair;
  touch-action: none;
}

/* 变换层：现在只处理 translate，不处理 scale */
.map-transform-layer {
  width: 100%; height: 100%;
  position: absolute; top: 0; left: 0;
  will-change: transform;
}

/* 网格 */
.grid-lines {
  position: absolute; inset: -200%; /* 足够大以覆盖拖拽区域 */
  width: 500%; height: 500%;
  background-image: linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px);
  opacity: 0.08; pointer-events: none;
}
.grid-lines.dense { opacity: 0.12; }

/* 节点通用：不再受父级 scale 影响，文字始终清晰 */
.map-node {
  position: absolute;
  transform: translate(-50%, 50%); /* 锚点居中 */
  display: flex; flex-direction: column; align-items: center;
  cursor: pointer;
  z-index: 2;
}
.map-node:hover { z-index: 10; }
.map-node:hover .node-icon, .map-node:hover .city-icon { transform: scale(1.3) rotate(45deg); box-shadow: 0 0 15px var(--accent-primary); }
.map-node:hover .node-label { color: #fff; font-weight: bold; }

.node-icon {
  width: 8px; height: 8px; background-color: var(--text-secondary);
  border-radius: 50%; box-shadow: 0 0 5px var(--shadow-color); margin-bottom: 4px;
  transition: transform 0.3s, box-shadow 0.3s;
}
.node-label {
  font-size: 0.75rem; color: var(--text-secondary); text-shadow: 0 1px 3px #000;
  white-space: nowrap; pointer-events: none; transition: color 0.3s;
  /* 确保文字清晰 */
  -webkit-font-smoothing: antialiased;
}

/* === World Layer Styles === */
.kingdom-entry .center-point {
  width: 16px; height: 16px; background: var(--accent-primary); border: 2px solid #fff;
  transform: rotate(45deg); box-shadow: 0 0 20px var(--accent-primary);
}
.kingdom-entry .pulse-ring {
  position: absolute; top: -12px; left: -12px; width: 40px; height: 40px;
  border: 1px solid var(--accent-primary); border-radius: 50%; animation: pulse 2s infinite;
}
.main-kingdom { color: var(--accent-primary); font-size: 1rem; font-weight: bold; margin-top: 10px; }

.frontier-node .node-icon.danger { background: #e74c3c; transform: rotate(45deg); }
.frontier-node .node-icon.ice { background: #a8d8ea; box-shadow: 0 0 8px #a8d8ea; }
.frontier-node .node-icon.swamp { background: #5d4037; }

/* === Kingdom Layer Styles === */
.wide-city-node .city-icon {
  width: 12px; height: 12px; border: 2px solid #fff; transform: rotate(45deg); margin-bottom: 6px;
  transition: transform 0.3s;
}
.wide-city-node .city-icon.estrella { background: var(--accent-primary); box-shadow: 0 0 10px var(--accent-primary); }
.wide-city-node .city-icon.qiming { background: #3498db; box-shadow: 0 0 10px #3498db; }
.wide-city-node .city-icon.molten { background: #e67e22; box-shadow: 0 0 10px #e67e22; }
.city-label { font-size: 0.9rem; color: #fff; font-weight: bold; }

.wide-geo-node .node-icon.mountain {
  width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 10px solid #7f8c8d; background: none; border-radius: 0;
}

/* === City Layer Styles === */
.city-node .node-point { width: 6px; height: 6px; background: #fff; border-radius: 50%; }
.city-node .node-point.sub-point { background: #7f8c8d; border: 1px solid #fff; }

.city-node .shape-star {
  width: 14px; height: 14px; background: #f1c40f; clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  box-shadow: 0 0 10px #f1c40f;
}
.city-node .shape-ring {
  width: 40px; height: 40px; border: 1px dashed rgba(255,255,255,0.5); border-radius: 50%;
  position: absolute; top: -20px; left: -20px; animation: spin 30s linear infinite; pointer-events: none;
}

/* UI Components */
.back-btn {
  position: absolute; bottom: 30px; left: 30px;
  background: rgba(0,0,0,0.7); border: 1px solid var(--accent-primary); color: var(--accent-primary);
  padding: 8px 16px; cursor: pointer; font-family: 'Cinzel', serif; transition: all 0.3s; z-index: 20;
}
.back-btn:hover { background: var(--accent-primary); color: var(--bg-primary); }

/* 弹窗样式优化 */
.map-tooltip {
  position: absolute; top: 20px; right: 20px; width: 260px;
  background: rgba(26, 29, 36, 0.98); border: 1px solid var(--accent-primary);
  padding: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.8);
  pointer-events: auto; z-index: 100;
  backdrop-filter: blur(5px);
  animation: slideIn 0.2s ease-out;
}

.close-btn {
  position: absolute; top: 5px; right: 5px; background: none; border: none;
  color: var(--text-secondary); font-size: 1.2rem; cursor: pointer;
}
.close-btn:hover { color: #fff; }

.tooltip-title { margin: 0 0 5px 0; font-family: 'Cinzel', serif; color: var(--accent-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 5px; font-size: 1.1rem; }
.tooltip-coords { font-size: 0.75rem; font-family: monospace; color: var(--text-secondary); margin-bottom: 8px; }
.tooltip-desc { font-size: 0.9rem; line-height: 1.5; margin: 0 0 15px 0; color: #ddd; }

.tooltip-actions { display: flex; flex-direction: column; gap: 8px; }

.action-btn {
  width: 100%; padding: 8px 0;
  background: transparent; border: 1px solid var(--border-color);
  color: var(--text-secondary); font-family: 'Cinzel', serif; font-size: 0.85rem;
  cursor: pointer; transition: all 0.2s; text-transform: uppercase;
}
.action-btn:hover { color: #fff; border-color: #fff; background: rgba(255,255,255,0.05); }

.enter-btn { border-color: var(--accent-primary); color: var(--accent-primary); font-weight: bold; }
.enter-btn:hover { background: var(--accent-primary); color: var(--bg-primary); }

.travel-btn { border-style: dashed; }

/* Animations */
@keyframes pulse { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(1.6); opacity: 0; } }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

.map-fade-enter-active, .map-fade-leave-active { transition: opacity 0.6s ease; }
.map-fade-enter-from, .map-fade-leave-to { opacity: 0; }

.map-zoom-enter-active, .map-zoom-leave-active { transition: opacity 0.6s ease; }
.map-zoom-enter-from { opacity: 0; }
.map-zoom-leave-to { opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
