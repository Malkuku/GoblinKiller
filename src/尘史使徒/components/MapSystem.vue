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
    <!-- 添加事件监听：滚轮、鼠标拖拽、触摸 -->
    <div ref="viewportRef" class="viewport"
         @wheel.prevent="handleWheel"
         @mousedown="handleMouseDown"
         @mousemove="handleMouseMove"
         @mouseup="handleMouseUp"
         @mouseleave="handleMouseUp"
         @touchstart="handleTouchStart"
         @touchmove="handleTouchMove"
         @touchend="handleTouchEnd">

      <!-- 变换层：所有会被缩放和平移的内容都放在这里 -->
      <div class="map-transform-layer" :style="transformStyle">

        <!-- 背景网格 -->
        <div class="grid-lines" :class="{ dense: currentLayer === 'city' }"></div>

        <!-- 1. 宏观世界层 (World Layer) -->
        <transition name="map-fade">
          <div v-if="currentLayer === 'world'" class="map-layer">
            <!-- 边疆区域 -->
            <div v-for="loc in mapData.world" :key="loc.name"
                 class="map-node frontier-node" :style="getStyle(loc, 0.08)"
                 @mouseenter="setTooltip(loc)">
              <div class="node-icon" :class="loc.type"></div>
              <span class="node-label">{{ loc.name }}</span>
            </div>
            <!-- 埃布尔王国入口 -->
            <div class="map-node kingdom-entry" :style="getStyle({x:0, y:0}, 0.08)"
                 @click.stop="setLayer('kingdom')" @mouseenter="setTooltip(kingdomSummary)">
              <div class="pulse-ring"></div>
              <div class="center-point"></div>
              <span class="node-label main-kingdom">埃布尔王国</span>
            </div>
          </div>
        </transition>

        <!-- 2. 王国广域层 (Kingdom Layer) -->
        <transition name="map-zoom">
          <div v-if="currentLayer === 'kingdom'" class="map-layer">
            <!-- 城市节点 (可点击进入) -->
            <div v-for="city in mapData.kingdom.cities" :key="city.id"
                 class="map-node wide-city-node" :style="getStyle(city, 0.4)"
                 @click.stop="enterCity(city.id)"
                 @mouseenter="setTooltip(city)">
              <div class="city-icon" :class="city.id"></div>
              <span class="node-label city-label">{{ city.name }}</span>
            </div>
            <!-- 地理节点 (不可进入) -->
            <div v-for="geo in mapData.kingdom.geography" :key="geo.name"
                 class="map-node wide-geo-node" :style="getStyle(geo, 0.4)"
                 @mouseenter="setTooltip(geo)">
              <div class="node-icon" :class="geo.type"></div>
              <span class="node-label">{{ geo.name }}</span>
            </div>
          </div>
        </transition>

        <!-- 3. 城市微观层 (City Layer) -->
        <transition name="map-zoom">
          <div v-if="currentLayer === 'city'" class="map-layer">
            <div v-for="loc in currentCityNodes" :key="loc.name"
                 class="map-node city-node" :style="getStyle(loc, 6, currentCityOffset)"
                 @mouseenter="setTooltip(loc)">
              <!-- 特殊样式判断 -->
              <div v-if="loc.name.includes('王宫') || loc.name.includes('圣殿')" class="shape-star"></div>
              <div v-else-if="loc.name.includes('贵族')" class="shape-ring"></div>
              <div v-else class="node-point" :class="{ 'sub-point': loc.z < 0 }"></div>
              <span class="node-label">{{ loc.name }}</span>
            </div>
          </div>
        </transition>
      </div>

      <!-- UI 元素 (不随地图缩放) -->
      <button v-if="currentLayer === 'kingdom'" class="back-btn" @click.stop="setLayer('world')">← 返回世界地图</button>
      <button v-if="currentLayer === 'city'" class="back-btn" @click.stop="setLayer('kingdom')">← 返回王国全境</button>

      <!-- 悬浮信息框 -->
      <div v-if="tooltip.visible" class="map-tooltip">
        <h3 class="tooltip-title">{{ tooltip.data.name }}</h3>
        <div class="tooltip-coords">
          N:{{ tooltip.data.x }}km / E:{{ tooltip.data.y }}km / Alt:{{ tooltip.data.z }}km
        </div>
        <p class="tooltip-desc">{{ tooltip.data.desc }}</p>
      </div>
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
const transform = reactive({ k: 1, x: 0, y: 0 }); // k=scale, x/y=translate
const isDragging = ref(false);
const dragStart = { x: 0, y: 0 };
const lastTransform = { x: 0, y: 0 }; // 记录拖拽前的偏移
// 触摸状态
const touchState = {
  dist: 0, // 双指距离
  center: { x: 0, y: 0 } // 双指中心点
};

const kingdomSummary = {
  name: "埃布尔王国", x: 0, y: 0, z: 0,
  desc: "人类文明的中心，由白金王宫统御的广袤疆域。点击进入查看全境。",
  type: "kingdom"
};

// =====================
// 地图数据 (保持不变)
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
      { name: "狮子之丘", x: 0, y: 0, z: 0.3, desc: "城市的脊柱，圆锥状隆起。" },
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
// 计算属性与逻辑
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

const transformStyle = computed(() => ({
  transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`
}));

// 切换层级
const setLayer = (layer) => {
  currentLayer.value = layer;
  if (layer !== 'city') currentCityId.value = '';
  resetView(); // 切换层级时重置视图
};

// 进入城市
const enterCity = (cityId) => {
  currentCityId.value = cityId;
  currentLayer.value = 'city';
  resetView();
};

// 样式计算
const getStyle = (loc, scale, offset = {x: 0, y: 0}) => {
  const relX = loc.x - offset.x;
  const relY = loc.y - offset.y;
  return {
    bottom: `${50 + (relX * scale)}%`,
    left: `${50 + (relY * scale)}%`
  };
};

// =====================
// 与父窗口交互 (新增)
// =====================
const handleTravel = (locationName) => {
  const option = `<user>打算前往${locationName}`;
  
  try {
    // 尝试获取 SillyTavern 的输入框
    const input = window.parent.document.querySelector('#send_textarea');
    if (!input) {
      console.warn('未能在父窗口中找到 SillyTavern 输入框 #send_textarea');
      return;
    }

    const currentValue = input.value.trim();
    // 追加文本
    input.value = currentValue ? `${currentValue} ${option}` : option;

    // 触发 input 事件以更新 Vue 绑定
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // 聚焦输入框
    input.focus();

  } catch (error) {
    console.error("与父窗口交互时出错:", error);
  }
};

// =====================
// 鼠标交互
// =====================
const setTooltip = (data) => {
  if(isDragging.value) return;
  tooltip.data = data;
  tooltip.visible = true;
};
// const clearTooltip = () => { tooltip.visible = false; }; // 移除或注释掉此函数，不再需要自动清除

// =====================
// 缩放与拖拽逻辑 (核心新增)
// =====================

// 限制缩放范围
const MIN_SCALE = 0.5;
const MAX_SCALE = 4.0;

// 鼠标滚轮缩放
const handleWheel = (e) => {
  const rect = viewportRef.value.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // 计算缩放系数
  const delta = -Math.sign(e.deltaY);
  const scaleFactor = 1 + (0.1 * delta);

  const oldScale = transform.k;
  let newScale = oldScale * scaleFactor;

  // 限制范围
  newScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);

  // 以鼠标为中心进行缩放的数学推导：
  // (mouseX - newX) / newScale = (mouseX - oldX) / oldScale
  // newX = mouseX - (mouseX - oldX) * (newScale / oldScale)
  transform.x = mouseX - (mouseX - transform.x) * (newScale / oldScale);
  transform.y = mouseY - (mouseY - transform.y) * (newScale / oldScale);
  transform.k = newScale;

  updateCursor(e); // 缩放时更新坐标显示
};

// 鼠标/单指拖拽开始
const handleMouseDown = (e) => {
  isDragging.value = true;
  dragStart.x = e.clientX;
  dragStart.y = e.clientY;
  lastTransform.x = transform.x;
  lastTransform.y = transform.y;
};

// 鼠标移动 (拖拽 + 更新坐标)
const handleMouseMove = (e) => {
  updateCursor(e);

  if (!isDragging.value) return;

  const dx = e.clientX - dragStart.x;
  const dy = e.clientY - dragStart.y;

  transform.x = lastTransform.x + dx;
  transform.y = lastTransform.y + dy;
};

const handleMouseUp = () => {
  isDragging.value = false;
};

// 触摸事件处理 (支持双指缩放)
const getDistance = (t1, t2) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
const getCenter = (t1, t2) => ({
  x: (t1.clientX + t2.clientX) / 2,
  y: (t1.clientY + t2.clientY) / 2
});

const handleTouchStart = (e) => {
  if (e.touches.length === 1) {
    // 单指拖拽
    handleMouseDown(e.touches[0]);
  } else if (e.touches.length === 2) {
    // 双指缩放初始化
    isDragging.value = false; // 双指时不视为拖拽
    touchState.dist = getDistance(e.touches[0], e.touches[1]);
    const rect = viewportRef.value.getBoundingClientRect();
    const center = getCenter(e.touches[0], e.touches[1]);
    touchState.center = {
      x: center.x - rect.left,
      y: center.y - rect.top
    };
    // 记录当前状态作为基准
    lastTransform.k = transform.k;
    lastTransform.x = transform.x;
    lastTransform.y = transform.y;
  }
};

const handleTouchMove = (e) => {
  e.preventDefault(); // 防止页面滚动

  if (e.touches.length === 1) {
    // 单指拖拽
    handleMouseMove(e.touches[0]);
  } else if (e.touches.length === 2) {
    // 双指缩放
    const newDist = getDistance(e.touches[0], e.touches[1]);
    const scaleFactor = newDist / touchState.dist;

    const oldScale = lastTransform.k;
    let newScale = oldScale * scaleFactor;
    newScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);

    // 以双指中心为基准缩放
    const centerX = touchState.center.x;
    const centerY = touchState.center.y;

    transform.x = centerX - (centerX - lastTransform.x) * (newScale / oldScale);
    transform.y = centerY - (centerY - lastTransform.y) * (newScale / oldScale);
    transform.k = newScale;
  }
};

const handleTouchEnd = (e) => {
  isDragging.value = false;
  if (e.touches.length === 1) {
    // 如果松开一根手指，重置拖拽起始点，防止跳变
    handleMouseDown(e.touches[0]);
  }
};

// 更新光标坐标 (需考虑缩放和偏移)
const updateCursor = (e) => {
  if(!viewportRef.value) return;
  const rect = viewportRef.value.getBoundingClientRect();

  // 1. 获取鼠标在视口中的像素位置
  const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
  const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
  const mouseX = clientX - rect.left;
  const mouseY = clientY - rect.top;

  // 2. 逆向变换：从视口像素 -> 变换层内部像素
  // (mouseX - translate) / scale
  const internalX = (mouseX - transform.x) / transform.k;
  const internalY = (mouseY - transform.y) / transform.k;

  // 3. 变换层内部像素 -> 地图百分比 (中心点为 rect.width/2, rect.height/2)
  // 注意：内部内容的原始尺寸等于视口尺寸
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const deltaX = internalX - centerX;
  const deltaY = centerY - internalY; // Y轴翻转

  // 4. 百分比 -> 公里
  let scale = 0.08; // World scale
  let offsetX = 0;
  let offsetY = 0;

  if (currentLayer.value === 'kingdom') {
    scale = 0.4;
  } else if (currentLayer.value === 'city') {
    scale = 6;
    offsetX = currentCityOffset.value.y;
    offsetY = currentCityOffset.value.x;
  }

  // 视口宽度对应 100%
  // 像素距离 / 总宽度 * 100 / scale = km
  const kmPerPixel = (100 / rect.width) / scale;

  const xKm = (deltaY * kmPerPixel) + offsetY;
  const yKm = (deltaX * kmPerPixel) + offsetX;

  hoverCoords.x = xKm.toFixed(1);
  hoverCoords.y = yKm.toFixed(1);
};
</script>

<style scoped>
.map-container {
  width: 100%; height: 100%; display: flex; flex-direction: column;
  background-color: var(--bg-primary); position: relative; overflow: hidden;
}

.map-controls {
  height: 40px; display: flex; justify-content: space-between; align-items: center;
  padding: 0 15px; background: var(--bg-secondary); border-bottom: 1px solid var(--border-color); z-index: 5;
}

.controls-right { display: flex; align-items: center; gap: 15px; }
.reset-btn {
  background: none; border: 1px solid var(--border-color); color: var(--text-secondary);
  cursor: pointer; width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.reset-btn:hover { color: #fff; border-color: #fff; }

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
  touch-action: none; /* 禁止浏览器默认触摸行为 */
}

/* 变换层 */
.map-transform-layer {
  width: 100%; height: 100%;
  position: absolute; top: 0; left: 0;
  transform-origin: 0 0; /* 变换原点设为左上角，便于计算 */
  will-change: transform; /* 性能优化 */
}

/* 网格 */
.grid-lines {
  position: absolute; inset: -100%; /* 扩大网格范围，防止缩放后露馅 */
  width: 300%; height: 300%;
  background-image: linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px);
  background-size: 100px 100px; opacity: 0.08; pointer-events: none;
  transition: background-size 0.5s;
}
.grid-lines.dense { background-size: 40px 40px; opacity: 0.12; }

/* 节点通用 */
.map-node {
  position: absolute; transform: translate(-50%, 50%);
  display: flex; flex-direction: column; align-items: center;
  transition: opacity 0.5s; /* 移除 transform transition，避免与缩放冲突 */
  z-index: 2;
}
/* 仅在hover时放大节点本身，不影响位置 */
.map-node:hover { z-index: 10; }
.map-node:hover .node-icon, .map-node:hover .city-icon { transform: scale(1.3) rotate(45deg); }
.map-node:hover .node-label { color: #fff; font-weight: bold; }

.node-icon {
  width: 8px; height: 8px; background-color: var(--text-secondary);
  border-radius: 50%; box-shadow: 0 0 5px var(--shadow-color); margin-bottom: 4px;
  transition: transform 0.3s;
}
.node-label {
  font-size: 0.75rem; color: var(--text-secondary); text-shadow: 0 1px 3px #000;
  white-space: nowrap; pointer-events: none; transition: color 0.3s;
}

/* === World Layer Styles === */
.kingdom-entry { cursor: pointer; }
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
.wide-city-node { cursor: pointer; }
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
.city-node .node-point.sub-point { background: #7f8c8d; border: 1px solid #fff; } /* 地下/低处 */

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

.map-tooltip {
  position: absolute; top: 20px; right: 20px; width: 240px;
  background: rgba(26, 29, 36, 0.95); border: 1px solid var(--accent-primary);
  padding: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.6); 
  /* 修改这里：从 none 改为 auto，允许点击交互 */
  pointer-events: auto; 
  z-index: 100;
  backdrop-filter: blur(5px);
}
.tooltip-title { margin: 0 0 5px 0; font-family: 'Cinzel', serif; color: var(--accent-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 5px; font-size: 1.1rem; }
.tooltip-coords { font-size: 0.75rem; font-family: monospace; color: var(--text-secondary); margin-bottom: 8px; }
.tooltip-desc { font-size: 0.9rem; line-height: 1.5; margin: 0; color: #ddd; }

/* 新增按钮样式 */
.travel-btn {
  margin-top: 12px;
  width: 100%;
  padding: 6px 0;
  background: transparent;
  border: 1px solid var(--accent-primary);
  color: var(--accent-primary);
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
}

.travel-btn:hover {
  background: var(--accent-primary);
  color: var(--bg-primary);
  box-shadow: 0 0 8px var(--accent-primary);
}

/* Animations */
@keyframes pulse { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(1.6); opacity: 0; } }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.map-fade-enter-active, .map-fade-leave-active { transition: opacity 0.6s ease; }
.map-fade-enter-from, .map-fade-leave-to { opacity: 0; }

.map-zoom-enter-active, .map-zoom-leave-active { transition: opacity 0.6s ease; }
.map-zoom-enter-from { opacity: 0; }
.map-zoom-leave-to { opacity: 0; }
</style>
