// --- 类型定义 ---
export interface PortraitImage {
  url: string;
  priority?: number;
  caption?: string;
}

export interface PortraitGroup {
  images?: PortraitImage[];
}

export interface PortraitScope {
  '按名称'?: Record<string, PortraitGroup>;
  '按职业'?: Record<string, PortraitGroup>;
  '按种族'?: Record<string, PortraitGroup>;
}

export interface PortraitDatabase extends PortraitScope {
  '按所处地点'?: Record<string, PortraitScope>;
}

export interface PortraitResult {
  key: string;
  url: string;
}

// --- 核心管理类 ---
export class PortraitManager {
  private portraitDatabase: PortraitDatabase | null = null;

  /**
   * 核心：从世界书中异步加载立绘数据库
   */
  public async loadPortraitDatabase(): Promise<void> {
    try {
      if (typeof getCharWorldbookNames !== 'function') return;
      const charBooks = getCharWorldbookNames('current') || {};
      const primaryBookName = charBooks?.primary;
      if (!primaryBookName) return;

      // 1. 获取该世界书的所有条目
      const entries = await getWorldbook(primaryBookName) || [];
      if (!Array.isArray(entries)) return;

      // 2. 寻找关键词包含 'relations_image_database' 的条目
      const imgEntry = entries.find(entry => {
        const keys = entry.strategy?.keys || [];
        return keys.includes('relations_image_database');
      });

      // 3. 解析并缓存
      if (imgEntry && imgEntry.content) {
        try {
          this.portraitDatabase = JSON.parse(imgEntry.content);
        } catch (je) {
          console.error("解析立绘数据库JSON失败:", je);
        }
      }
    } catch (e) {
      console.error("加载立绘数据库失败:", e);
    }
  }

  /**
   * 辅助方法：拆分检索 Token
   */
  private _splitTokens(str?: string): string[] {
    if (!str || typeof str !== 'string') return [];
    return str.split(/[/|\\,，、\s]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
  }

  /**
   * 辅助方法：按职业或种族分组检索
   */
  private _selectByGroups(scope: PortraitScope | undefined, profession?: string, race?: string): PortraitImage[] {
    if (!scope) return [];
    const tokens = [...this._splitTokens(profession), ...this._splitTokens(race)];
    let list: PortraitImage[] = [];
    for (const token of tokens) {
      const found = scope['按职业']?.[token] || scope['按种族']?.[token];
      if (found && found.images) {
        list = [...list, ...found.images];
      }
    }
    return list;
  }

  /**
   * 智能化立绘匹配：回退检索算法 (核心逻辑重构)
   */
  public getMatchPortrait(name?: string, profession?: string, race?: string, location?: string): PortraitImage | null {
    const db = this.portraitDatabase || {};
    const sanitize = (s?: string) => String(s || '').trim().toLowerCase();
    const sName = sanitize(name);
    const sLoc = sanitize(location);

    let list: PortraitImage[] = [];

    // 优先级 1：当前地点特有的角色图
    const locScope = db['按所处地点']?.[sLoc] || {};
    list = locScope['按名称']?.[sName]?.images || [];

    // 优先级 2：当前地点特有的职业/种族图 (回退)
    if (!list.length) {
      list = this._selectByGroups(locScope, profession, race);
    }

    // 优先级 3：全局角色图 (回退)
    if (!list.length) {
      list = db['按名称']?.[sName]?.images || [];
    }

    // 优先级 4：全局职业/种族通用图 (最终保底)
    if (!list.length) {
      list = this._selectByGroups(db, profession, race);
    }

    // 结果处理：过滤无效链接并按优先级排序
    const validImgs = (list || []).filter(img => img && typeof img.url === 'string' && /^https?:\/\//i.test(img.url));
    validImgs.sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));

    return validImgs.length ? validImgs[0] : null;
  }

  /**
   * 提取并输出所有角色 key 值 + 图片完整链接的 list 列表
   */
  public getAllPortraitsList(): PortraitResult[] {
    const db = this.portraitDatabase;
    if (!db) return [];

    const result: PortraitResult[] = [];
    const addedKeys = new Set<string>();

    // 内部提取器
    const extractImages = (key: string, images?: PortraitImage[]) => {
      if (!images || !images.length) return;

      // 过滤有效链接并按优先级排序
      const validImgs = images.filter(img => img && typeof img.url === 'string' && /^https?:\/\//i.test(img.url));
      if (validImgs.length > 0) {
        validImgs.sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));

        // 取最高优先级的一张图作为代表
        const topImageUrl = validImgs[0].url;
        const uniqueId = `${key}_${topImageUrl}`;

        if (!addedKeys.has(uniqueId)) {
          result.push({ key, url: topImageUrl });
          addedKeys.add(uniqueId);
        }
      }
    };

    // 1. 提取全局 [按名称]
    if (db['按名称']) {
      for (const [name, group] of Object.entries(db['按名称'])) {
        extractImages(name, group.images);
      }
    }

    // 2. 提取 [按所处地点] 下的 [按名称]
    if (db['按所处地点']) {
      for (const [loc, scope] of Object.entries(db['按所处地点'])) {
        if (scope['按名称']) {
          for (const [name, group] of Object.entries(scope['按名称'])) {
            extractImages(`[${loc}] ${name}`, group.images);
          }
        }
      }
    }

    // 3. 提取泛用 [按职业] / [按种族] (作为备用 Key)
    const extractGroups = (record?: Record<string, PortraitGroup>, prefix: string = '') => {
      if (!record) return;
      for (const [key, group] of Object.entries(record)) {
        extractImages(`${prefix}${key}`, group.images);
      }
    };

    extractGroups(db['按职业'], '职业:');
    extractGroups(db['按种族'], '种族:');

    return result;
  }
}
