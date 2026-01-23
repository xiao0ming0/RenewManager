/**
 * Cloudflare Worker: RenewManager (v1.4.5)
 * Author: LOSTFREE
 * Features: Multi-Channel Notify, Import/Export, Channel Test, Bilingual UI, Precise ICS Alarm
 * added: sort, filter v1.3.4
 * added: dockerfile v1.3.5
 * added: add lunar date tooltip v1.3.6
 * modified: modify lunar show logic v1.3.7
 * added: add next due preview v1.3.8
 * added: add webhook channels v1.3.9
 * added: add github actions deploy v1.4.0
 * modified: mobile layout v1.4.1
 * modified: add gotify/ntfy channels and refactor setup page v1.4.2
 * modified: fix previewDate logic v1.4.3
 */

const APP_VERSION = "v1.4.5";

// ==========================================
// 1. Core Logic (Lunar & Calc)
// ==========================================
// 定义一个全局缓存 (Request 级别)
const _lunarCache = new Map();
const LUNAR_DATA = {
  info: [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0,
    0x09ad0, 0x055d2, 0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540,
    0x0d6a0, 0x0ada2, 0x095b0, 0x14977, 0x04970, 0x0a4b0, 0x0b4b5, 0x06a50,
    0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, 0x06566, 0x0d4a0,
    0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
    0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2,
    0x0a950, 0x0b557, 0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573,
    0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, 0x0aea6, 0x0ab50, 0x04b60, 0x0aae4,
    0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, 0x096d0, 0x04dd5,
    0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46,
    0x0ab60, 0x09570, 0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58,
    0x055c0, 0x0ab60, 0x096d5, 0x092e0, 0x0c960, 0x0d954, 0x0d4a0, 0x0da50,
    0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, 0x0a950, 0x0b4a0,
    0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
    0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260,
    0x0ea65, 0x0d530, 0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0,
    0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, 0x0b5a0, 0x056d0, 0x055b2, 0x049b0,
    0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, 0x14b63, 0x09370,
    0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
    0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0,
    0x0a6d0, 0x055d4, 0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50,
    0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, 0x0b273, 0x06930, 0x07337, 0x06aa0,
    0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, 0x0e968, 0x0d520,
    0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
    0x0d520
  ],
  gan: "甲乙丙丁戊己庚辛壬癸".split(""),
  zhi: "子丑寅卯辰巳午未申酉戌亥".split(""),
  months: "正二三四五六七八九十冬腊".split(""),
  days: "初一,初二,初三,初四,初五,初六,初七,初八,初九,初十,十一,十二,十三,十四,十五,十六,十七,十八,十九,二十,廿一,廿二,廿三,廿四,廿五,廿六,廿七,廿八,廿九,三十".split(
    ","
  ),
  lYearDays(y) {
    let s = 348;
    for (let i = 0x8000; i > 0x8; i >>= 1) s += this.info[y - 1900] & i ? 1 : 0;
    return s + this.leapDays(y);
  },
  leapDays(y) {
    if (this.leapMonth(y)) return this.info[y - 1900] & 0x10000 ? 30 : 29;
    return 0;
  },
  leapMonth(y) {
    return this.info[y - 1900] & 0xf;
  },
  monthDays(y, m) {
    return this.info[y - 1900] & (0x10000 >> m) ? 30 : 29;
  },
  solar2lunar(y, m, d) {
    // 1. 生成缓存 Key
    const cacheKey = `${y}-${m}-${d}`;
    // 2. 命中缓存直接返回
    if (_lunarCache.has(cacheKey)) return _lunarCache.get(cacheKey);
    if (y < 1900 || y > 2100) return null;
    const base = new Date(1900, 0, 31),
      obj = new Date(y, m - 1, d);
    let offset = Math.round((obj - base) / 86400000);
    let ly = 1900,
      temp = 0;
    for (; ly < 2101 && offset > 0; ly++) {
      temp = this.lYearDays(ly);
      offset -= temp;
    }
    if (offset < 0) {
      offset += temp;
      ly--;
    }
    let lm = 1,
      leap = this.leapMonth(ly),
      isLeap = false;
    for (; lm < 13 && offset > 0; lm++) {
      if (leap > 0 && lm === leap + 1 && !isLeap) {
        --lm;
        isLeap = true;
        temp = this.leapDays(ly);
      } else {
        temp = this.monthDays(ly, lm);
      }
      if (isLeap && lm === leap + 1) isLeap = false;
      offset -= temp;
    }
    if (offset === 0 && leap > 0 && lm === leap + 1) {
      if (isLeap) isLeap = false;
      else {
        isLeap = true;
        --lm;
      }
    }
    if (offset < 0) {
      offset += temp;
      --lm;
    }
    const ld = offset + 1,
      gIdx = (ly - 4) % 10,
      zIdx = (ly - 4) % 12;
    const yStr =
      this.gan[gIdx < 0 ? gIdx + 10 : gIdx] +
      this.zhi[zIdx < 0 ? zIdx + 12 : zIdx];
    const mStr = (isLeap ? "闰" : "") + this.months[lm - 1] + "月";
    const result = {
      year: ly,
      month: lm,
      day: ld,
      isLeap,
      yearStr: yStr,
      monthStr: mStr,
      dayStr: this.days[ld - 1],
      fullStr: yStr + "年" + mStr + this.days[ld - 1],
    };
    // 3. 写入缓存
    _lunarCache.set(cacheKey, result);
    return result;
  },
};

const calcBiz = {
  // 极速版农历转公历 (L2S)
  l2s(l) {
    let days = 0;
    const { year, month, day, isLeap } = l;

    // 1. 累加年份天数 (1900 -> year-1)
    for (let i = 1900; i < year; i++) {
      days += LUNAR_DATA.lYearDays(i);
    }

    // 2. 累加月份天数 (1 -> month-1)
    const leap = LUNAR_DATA.leapMonth(year); // 该年闰哪个月 (0为不闰)
    for (let i = 1; i < month; i++) {
      days += LUNAR_DATA.monthDays(year, i);
      // 如果经过了闰月，需累加闰月天数
      if (leap > 0 && i === leap) {
        days += LUNAR_DATA.leapDays(year);
      }
    }

    // 3. 处理当前月
    // 如果是闰月，说明已经过完了该月的"正常月"，需加上正常月的天数
    if (isLeap) {
      days += LUNAR_DATA.monthDays(year, month);
    }

    // 4. 累加日数 (day - 1)
    days += day - 1;

    // 5. 计算公历日期 (基准日 1900-01-31)
    // 使用 UTC 避免时区干扰
    const base = new Date(Date.UTC(1900, 0, 31));
    const target = new Date(base.getTime() + days * 86400000);

    return {
      year: target.getUTCFullYear(),
      month: target.getUTCMonth() + 1,
      day: target.getUTCDate(),
    };
  },

  addPeriod(l, val, unit) {
    let { year, month, day, isLeap } = l;
    if (unit === "year") {
      year += val;
      const lp = LUNAR_DATA.leapMonth(year);
      // 如果目标年没有该闰月，或者目标月不是闰月，取消闰月标记
      isLeap = isLeap && lp === month;
    } else if (unit === "month") {
      let tot = (year - 1900) * 12 + (month - 1) + val;
      year = Math.floor(tot / 12) + 1900;
      month = (tot % 12) + 1;
      const lp = LUNAR_DATA.leapMonth(year);
      isLeap = isLeap && lp === month;
    } else if (unit === "day") {
      // 日增加直接转公历加天数再转回农历
      const s = this.l2s(l);
      const d = new Date(Date.UTC(s.year, s.month - 1, s.day + val));
      return LUNAR_DATA.solar2lunar(
        d.getUTCFullYear(),
        d.getUTCMonth() + 1,
        d.getUTCDate()
      );
    }

    // 修正日期有效性 (例如: 农历30日变29日)
    let max = isLeap
      ? LUNAR_DATA.leapDays(year)
      : LUNAR_DATA.monthDays(year, month);
    let td = Math.min(day, max);

    // 递归检查有效性
    while (td > 0) {
      if (this.l2s({ year, month, day: td, isLeap }))
        return { year, month, day: td, isLeap };
      td--;
    }
    return { year, month, day, isLeap };
  },
};

// ==========================================
// 2. Infrastructure & Utils - REVISED
// ==========================================

class Router {
  constructor() {
    this.routes = [];
  }
  handle(method, path, handler) {
    this.routes.push({ method, path, handler });
  }
  get(path, handler) {
    this.handle("GET", path, handler);
  }
  post(path, handler) {
    this.handle("POST", path, handler);
  }

  async route(req, env) {
    const url = new URL(req.url);
    const method = req.method;

    for (const route of this.routes) {
      if (route.method === method && route.path === url.pathname)
        return await route.handler(req, env, url);
    }
    return new Response("Not Found", { status: 404 });
  }
}

const response = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const error = (msg, status = 400) => response({ code: status, msg }, status);

// ==========================================
// 3. Business Logic (Services)
// ==========================================

const Auth = {
  async login(password, env) {
    const settings = await DataStore.getSettings(env);
    if (password === (env.AUTH_PASSWORD || "admin"))
      return await this.sign(settings.jwtSecret);
    throw new Error("PASSWORD_ERROR");
  },
  async verify(req, env) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return false;
    const settings = await DataStore.getSettings(env);
    return await this.verifyToken(
      authHeader.replace("Bearer ", ""),
      settings.jwtSecret
    );
  },
  async sign(secret) {
    const h = { alg: "HS256", typ: "JWT" },
      p = {
        u: "admin",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 604800,
      };
    const str = this.b64(h) + "." + this.b64(p);
    return str + "." + (await this.cryptoSign(str, secret));
  },
  async verifyToken(t, s) {
    try {
      const [h, p, sig] = t.split(".");
      if (!sig) return false;
      // 使用恒定时间比较，防止时序攻击
      const expectedSig = await this.cryptoSign(h + "." + p, s);
      if (!(await this.safeCompare(expectedSig, sig))) return false;

      const pl = JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
      return !(pl.exp && pl.exp < Math.floor(Date.now() / 1000));
    } catch {
      return false;
    }
  },
  async cryptoSign(t, s) {
    const k = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(s),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    return btoa(
      String.fromCharCode(
        ...new Uint8Array(
          await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(t))
        )
      )
    )
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  },
  // 恒定时间比较函数
  async safeCompare(a, b) {
    const enc = new TextEncoder();
    const aBuf = enc.encode(a);
    const bBuf = enc.encode(b);
    // 长度不同直接返回false（HMAC-SHA256长度通常固定，此处作为防御）
    if (aBuf.byteLength !== bBuf.byteLength) return false;
    return crypto.subtle.timingSafeEqual(aBuf, bBuf);
  },
  // 生成高强度随机密钥
  genSecret() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  },
  b64(o) {
    return btoa(JSON.stringify(o))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  },
};

const DataStore = {
  KEYS: { SETTINGS: "SYS_CONFIG", ITEMS: "DATA_ITEMS", LOGS: "LOGS" },

  async getSettings(env) {
    let s = {};
    const raw = await env.RENEW_KV.get(this.KEYS.SETTINGS);
    if (raw)
      try {
        s = JSON.parse(raw);
      } catch (e) { }

    const defaults = {
      enableNotify: true,
      autoDisableDays: 30,
      language: "zh",
      timezone: "Asia/Shanghai",
      jwtSecret: "",
      calendarToken: "",
      enabledChannels: [],
      notifyConfig: {
        telegram: { token: "", chatId: "" },
        bark: { server: "https://api.day.app", key: "" },
        pushplus: { token: "" },
        notifyx: { apiKey: "" },
        resend: { apiKey: "", from: "", to: "" },
        webhook: { url: "" },
        webhook2: { url: "" },
        webhook3: { url: "" },
        gotify: { server: "", token: "" },
        ntfy: { server: "https://ntfy.sh", topic: "", token: "" },
      },
    };

    s = { ...defaults, ...s };
    s.notifyConfig = { ...defaults.notifyConfig, ...(s.notifyConfig || {}) };

    let save = false;

    if (!s.jwtSecret) {
      s.jwtSecret = Auth.genSecret();
      save = true;
    }
    if (!s.calendarToken) {
      s.calendarToken = crypto.randomUUID();
      save = true;
    }

    if (save) await this.saveSettings(env, s);
    return s;
  },

  async saveSettings(env, data) {
    await env.RENEW_KV.put(this.KEYS.SETTINGS, JSON.stringify(data, null, 2));
  },

  async getItemsPackage(env) {

    const raw = await env.RENEW_KV.get(this.KEYS.ITEMS, { type: "text" });
    try {
      if (!raw) return { items: [], version: 0 };
      const parsed = JSON.parse(raw);

      // 兼容旧数据（纯数组格式）
      if (Array.isArray(parsed)) {
        return { items: parsed, version: 0 };
      }
      // 新数据格式
      return { items: parsed.items || [], version: parsed.version || 0 };
    } catch (e) {
      return { items: [], version: 0 };
    }
  },

  async getItems(env) {
    const pkg = await this.getItemsPackage(env);
    return pkg.items;
  },

  // 带乐观锁的保存
  async saveItems(env, newItems, expectedVersion = null, force = false) {
    // 1. 如果不是强制保存，先检查版本
    if (!force) {
      const currentPkg = await this.getItemsPackage(env);
      // 版本不匹配则抛出冲突
      if (expectedVersion !== null && currentPkg.version !== expectedVersion) {
        throw new Error("VERSION_CONFLICT");
      }
    }

    // 2. 生成新版本号 (时间戳)
    const newVersion = Date.now();
    const storageObj = {
      items: newItems,
      version: newVersion,
    };

    // 3. 写入 KV
    await env.RENEW_KV.put(this.KEYS.ITEMS, JSON.stringify(storageObj));
    return newVersion;
  },

  async getCombined(env) {
    const [settings, pkg] = await Promise.all([
      this.getSettings(env),
      this.getItemsPackage(env),
    ]);
    return { settings, items: pkg.items, version: pkg.version };
  },

  // 【修复】增加 try-catch 容错，防止日志数据损坏导致无法写入
  async getLogs(env) {
    try {
      const raw = await env.RENEW_KV.get(this.KEYS.LOGS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      // 如果解析失败（数据损坏），返回空数组，确保新日志能写入
      return [];
    }
  },

  async saveLog(env, entry) {
    try {
      const logs = await this.getLogs(env);
      logs.unshift(entry);
      // 限制保留最近 30 条
      await env.RENEW_KV.put(this.KEYS.LOGS, JSON.stringify(logs.slice(0, 30)));
    } catch (e) {
      console.log(`[ERR] Log save failed: ${e.message}`);
    }
  },
};

// ==========================================
// 全局内存缓存 (用于 1秒/次 极速限流)
// Worker 实例未销毁前，Map 会一直存在
// ==========================================
const _memLimitCache = new Map();

const RateLimiter = {
  async check(env, ip, action) {
    if (!ip) return true; // 开发环境或获取不到IP时放行

    const now = Date.now();

    // ------------------------------------------------
    // 层级 1: 内存限流 (1秒/次)
    // 作用: 防止瞬间并发/脚本爆破，不消耗 KV 额度
    // ------------------------------------------------
    const memKey = `${action}:${ip}`;
    const lastTime = _memLimitCache.get(memKey) || 0;

    if (now - lastTime < 1000) {
      return false; // 触发 1s 冷却
    }
    _memLimitCache.set(memKey, now); // 更新内存时间戳

    // ------------------------------------------------
    // 层级 2: KV 限流 (每日 100次)
    // 作用: 限制每日总调用量，持久化存储
    // ------------------------------------------------
    const today = new Date().toISOString().split("T")[0];
    const kvKey = `RATELIMIT:${today}:${action}:${ip}`;

    // 获取当前计数值 (如果不存在则为 0)
    let count = await env.RENEW_KV.get(kvKey);
    count = count ? parseInt(count) : 0;

    if (count >= 100) {
      return false; // 触发每日上限
    }

    // 增加计数并写入 KV (设置 24小时过期)
    // 使用 waitUntil 可以在后台写入，不阻塞响应速度（如果你的环境支持，否则直接 await）
    await env.RENEW_KV.put(kvKey, (count + 1).toString(), {
      expirationTtl: 86400,
    });

    return true;
  },
};

const Calc = {
  parseYMD(s) {
    if (!s) return new Date();
    const p = s.split("-");
    return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  },
  toYMD(d) {
    return d.toISOString().split("T")[0];
  },
  // 获取基于用户时区的“今天” (00:00:00 UTC)
  getTzToday(tz) {
    try {
      // 使用 en-CA 格式化出的就是 YYYY-MM-DD
      const f = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz || "UTC",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      return this.parseYMD(f.format(new Date()));
    } catch (e) {
      // 如果时区无效，回退到 UTC
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      return d;
    }
  },
};

// HTML转义工具
const escapeHtml = (unsafe) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const Notifier = {
  async send(settings, title, body) {
    if (!settings.enableNotify) return "NOTIFY_DISABLED";

    const channels = settings.enabledChannels || [];
    if (channels.length === 0 && settings.notifyUrl) {
      return await this.adapters.webhook(
        { url: settings.notifyUrl },
        title,
        body
      );
    }

    const tasks = [];
    const cfg = settings.notifyConfig || {};

    for (const ch of channels) {
      if (this.adapters[ch] && cfg[ch]) {
        tasks.push(
          this.adapters[ch](cfg[ch], title, body)
            .then((res) => `[${ch}: ${res}]`)
            .catch((err) => `[${ch}: ERR ${err.message}]`)
        );
      }
    }

    if (tasks.length === 0) return "NO_CHANNELS";
    const results = await Promise.all(tasks);
    return results.join(" ");
  },

  adapters: {
    telegram: async (c, title, body) => {
      if (!c.token || !c.chatId) return "MISSING_CONF";
      const text = `*${title}*\n\n${body}`;
      const r = await fetch(
        `https://api.telegram.org/bot${c.token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: c.chatId,
            text,
            parse_mode: "Markdown",
          }),
        }
      );
      return r.ok ? "OK" : "FAIL";
    },
    bark: async (c, title, body) => {
      if (!c.key) return "MISSING_CONF";
      const server = (c.server || "https://api.day.app").replace(/\/$/, "");
      const r = await fetch(
        `${server}/${c.key}/${encodeURIComponent(title)}/${encodeURIComponent(
          body
        )}?group=RenewManager`
      );
      return r.ok ? "OK" : "FAIL";
    },
    pushplus: async (c, title, body) => {
      if (!c.token) return "MISSING_CONF";
      const safeContent = escapeHtml(body).replace(/\n/g, "<br>");
      const r = await fetch("https://www.pushplus.plus/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: c.token,
          title,
          content: safeContent,
          template: "html",
        }),
      });
      return r.ok ? "OK" : "FAIL";
    },
    notifyx: async (c, title, body) => {
      if (!c.apiKey) return "MISSING_CONF";
      let description = "Alert";
      const content = body.replace(/\n/g, "\n\n"); // NotifyX 使用 Markdown
      const r = await fetch(`https://www.notifyx.cn/api/v1/send/${c.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, description }),
      });
      return r.ok ? "OK" : "FAIL";
    },
    resend: async (c, title, body) => {
      if (!c.apiKey || !c.to || !c.from) return "MISSING_CONF";
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${c.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: c.from,
          to: c.to,
          subject: title,
          text: body,
        }),
      });
      return r.ok ? "OK" : "FAIL";
    },
    webhook: webhookAdapterImpl,
    webhook2: webhookAdapterImpl,
    webhook3: webhookAdapterImpl,
    gotify: async (c, title, body) => {
      if (!c.server || !c.token) return "MISSING_CONF";
      const server = c.server.replace(/\/$/, "");
      const r = await fetch(`${server}/message`, {
        method: "POST",
        headers: { "X-Gotify-Key": c.token, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title,
          message: body,
          priority: 5,
        }),
      });
      return r.ok ? "OK" : "FAIL";
    },
    ntfy: async (c, title, body) => {
      if (!c.topic) return "MISSING_CONF";
      const server = (c.server || "https://ntfy.sh").replace(/\/$/, "");
      const headers = { "Title": title }; // Encode title in header to avoid encoding issues
      if (c.token) headers["Authorization"] = `Bearer ${c.token}`;

      const r = await fetch(`${server}/${c.topic}`, {
        method: "POST",
        headers: headers,
        body: body,
      });
      return r.ok ? "OK" : "FAIL";
    },
    wechat: async (c, title, body) => {
      if (!c.corpid || !c.secret || !c.agentid || !c.touser) return "MISSING_CONF";
      try {
        const baseUrl = "http://116.198.201.130:8000";
        const tokenRes = await fetch(`${baseUrl}/cgi-bin/gettoken?corpid=${c.corpid}&corpsecret=${c.secret}`);
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) return "AUTH_FAIL";

        const text = `${title}\n\n${body}`;
        const sendRes = await fetch(`${baseUrl}/cgi-bin/message/send?access_token=${tokenData.access_token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            touser: c.touser,
            msgtype: "text",
            agentid: c.agentid,
            text: { content: text },
            safe: 0
          })
        });
        const sendData = await sendRes.json();
        return sendData.errmsg === "ok" ? "OK" : "FAIL";
      } catch (e) {
        return "ERR";
      }
    },
  },
};

async function webhookAdapterImpl(c, title, body) {
  if (!c.url) return "MISSING_CONF";
  try {
    let headers = { "Content-Type": "application/json" };
    if (c.headers) {
      try {
        const h = JSON.parse(c.headers);
        headers = { ...headers, ...h };
      } catch { }
    }

    let reqBody = JSON.stringify({ title, content: body });
    if (c.body) {
      // Unescape JSON string placeholders safely
      // Users provide: {"text": "Title: {title}\nBody: {body}"}
      let raw = c.body
        .replace(/{title}/g, JSON.stringify(title).slice(1, -1))
        .replace(/{body}/g, JSON.stringify(body).slice(1, -1));
      reqBody = raw;
    }

    const r = await fetch(c.url, {
      method: "POST",
      headers: headers,
      body: reqBody,
    });
    return r.ok ? "OK" : "FAIL";
  } catch (e) {
    return "ERR";
  }
}

// ==========================================
// 4. Logic Controllers
// ==========================================

function calculateStatus(item, timezone = "Asia/Shanghai") {
  // 使用时区感知的"今天"，默认使用北京时间
  const today = Calc.getTzToday(timezone);

  const cDate = item.createDate || Calc.toYMD(today);
  
  // 必须要有 nextDueDate，如果没有则返回错误状态
  if (!item.nextDueDate) {
    // 如果没有 nextDueDate，返回一个错误状态，提示需要重新设置
    return {
      ...item,
      enabled: item.enabled !== false,
      cycleUnit: item.cycleUnit || "day",
      createDate: cDate,
      lastRenewDate: item.lastRenewDate || cDate,
      serviceDays: Math.floor((today - Calc.parseYMD(cDate)) / 86400000),
      daysLeft: 999999, // 标记为无效
      nextDueDate: "",
      nextDueDateLunar: "",
      lastRenewDateLunar: "",
      tags: Array.isArray(item.tags) ? item.tags : [],
      useLunar: !!item.useLunar,
      notifyTime: item.notifyTime || "08:00",
    };
  }

  // 基于 nextDueDate 计算
  const nextObj = Calc.parseYMD(item.nextDueDate);
  
  let lNext = "",
    lLast = "";
  if (item.useLunar) {
    const ln = LUNAR_DATA.solar2lunar(
      nextObj.getUTCFullYear(),
      nextObj.getUTCMonth() + 1,
      nextObj.getUTCDate()
    );
    if (ln) lNext = ln.fullStr;
    if (item.lastRenewDate) {
      const ll = LUNAR_DATA.solar2lunar(
        Calc.parseYMD(item.lastRenewDate).getUTCFullYear(),
        Calc.parseYMD(item.lastRenewDate).getUTCMonth() + 1,
        Calc.parseYMD(item.lastRenewDate).getUTCDate()
      );
      if (ll) lLast = ll.fullStr;
    }
  }

  return {
    ...item,
    enabled: item.enabled !== false,
    cycleUnit: item.cycleUnit || "day",
    createDate: cDate,
    lastRenewDate: item.lastRenewDate || cDate, // 保持记录，但不用于计算
    serviceDays: Math.floor((today - Calc.parseYMD(cDate)) / 86400000),
    daysLeft: Math.round((nextObj - today) / 86400000),
    nextDueDate: item.nextDueDate,
    nextDueDateLunar: lNext,
    lastRenewDateLunar: lLast,
    tags: Array.isArray(item.tags) ? item.tags : [],
    useLunar: !!item.useLunar,
    notifyTime: item.notifyTime || "08:00",
  };
}

const I18N = {
  zh: {
    scan: "扫描 %s 个服务",
    autoDisable: "🚫 [%s] 过期 %s 天，已自动禁用",
    autoRenew: "🔄 [%s] 自动续期成功",
    today: "今天到期",
    overdue: "过期 %s 天",
    left: "剩 %s 天",
    checkLog: "[CHECK] %s | %s",
    thres: "(阈值: %s)",
    pushTitle: "RenewManager 报告",
    secDis: "🚫 服务已禁用",
    secRen: "🔄 服务已续期",
    secAle: "⏳ 服务即将到期",
    note: "备注",
    lblEnable: "启用",
    lblToken: "令牌 (Token)",
    lblApiKey: "API Key",
    lblChatId: "会话ID",
    lblServer: "服务器URL",
    lblDevKey: "设备Key",
    lblFrom: "发件人",
    lblTo: "收件人",
    lblNotifyTime: "提醒时间",
    btnTest: "发送测试",
    lblCorpId: "企业ID (CorpID)",
    lblAgentId: "应用ID (AgentID)",
    lblSecret: "应用密钥 (Secret)",
    lblToUser: "用户账号 (ToUser)",
    lblRenewInfo: "续费信息：",
    lblRenewAmount: "💰 续费金额",
    lblRenewLink: "🔗 续费链接",
    lblAccount: "👤 账号",
    lblPassword: "🔑 密码",
  },
  en: {
    scan: "Scan %s items",
    autoDisable: "🚫 [%s] Overdue %sd, Disabled",
    autoRenew: "🔄 [%s] Auto Renewed",
    today: "Due Today",
    overdue: "Overdue %sd",
    left: "Left %sd",
    checkLog: "[CHECK] %s | %s",
    thres: "(Thres: %s)",
    pushTitle: "RenewManager Report",
    secDis: "🚫 Services Disabled",
    secRen: "🔄 Services Renewed",
    secAle: "⏳ Expiring Soon",
    note: "Note",
    lblEnable: "Enable",
    lblToken: "Token",
    lblApiKey: "API Key",
    lblChatId: "Chat ID",
    lblServer: "Server URL",
    lblDevKey: "Device Key",
    lblFrom: "From Email",
    lblTo: "To Email",
    lblNotifyTime: "Alarm Time",
    btnTest: "Send Test",
    lblCorpId: "CorpID",
    lblAgentId: "AgentID",
    lblSecret: "Secret",
    lblToUser: "ToUser",
    lblRenewInfo: "Renew Info:",
    lblRenewAmount: "💰 Amount",
    lblRenewLink: "🔗 Renew Link",
    lblAccount: "👤 Account",
    lblPassword: "🔑 Password",
  },
};
function t(k, l, ...a) {
  let s = (I18N[l] || I18N.zh)[k] || k;
  a.forEach((x) => (s = s.replace("%s", x)));
  return s;
}

// 构建服务详情通知内容
function buildServiceDetails(x, lang) {
  let details = [];
  // 金额
  if (x.renewAmount) {
    const currency = x.renewCurrency || "CNY";
    details.push(`${t("lblRenewAmount", lang)}: ${x.renewAmount} ${currency}`);
  }
  // 续费链接
  if (x.purchaseUrl) {
    details.push(`${t("lblRenewLink", lang)}: ${x.purchaseUrl}`);
  }
  // 账号密码
  if (x.purchaseAccount) {
    details.push(`${t("lblAccount", lang)}: ${x.purchaseAccount}`);
  }
  if (x.purchasePassword) {
    details.push(`${t("lblPassword", lang)}: ${x.purchasePassword}`);
  }
  if (details.length > 0) {
    return "\n" + t("lblRenewInfo", lang) + "\n" + details.join("\n");
  }
  return "";
}

async function checkAndRenew(env, isSched, lang = "zh") {
  // 使用 getItemsPackage 获取带版本的数据
  const [conf, pkg] = await Promise.all([
    DataStore.getSettings(env),
    DataStore.getItemsPackage(env),
  ]);

  const s = conf;
  const items = pkg.items; // 获取 items 数组
  const currentVersion = pkg.version; // 获取读取时的版本号

  const logs = [],
    log = (m) => {
      logs.push(m);
      console.log(m);
    };

  let trig = [],
    upd = [],
    dis = [],
    monitor = [],
    changed = false;

  log(`[SYSTEM] ${t("scan", lang, items.length)}`);

  // 1. 获取基于偏好时区的“今天”
  const today = Calc.getTzToday(s.timezone);

  // 2. 获取基于偏好时区的“当前时:分” (修复 Docker 环境兼容性)
  let nowH = 0, nowM = 0;
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: s.timezone || "Asia/Shanghai",
      hour12: false,
      hour: "numeric",
      minute: "numeric",
    });
    const parts = fmt.formatToParts(new Date());
    const find = (t) => {
      const p = parts.find(x => x.type === t);
      return p ? parseInt(p.value, 10) : 0;
    };
    nowH = find("hour");
    nowM = find("minute");

  } catch (e) {
    log(`[ERR] Time calc failed: ${e.message}`);
  }

  for (let i = 0; i < items.length; i++) {
    let it = items[i];
    if (!it.createDate) it.createDate = Calc.toYMD(new Date());
    if (!it.lastRenewDate) it.lastRenewDate = it.createDate;
    if (it.enabled === false) continue;

    let st = calculateStatus(it, s.timezone),
      days = st.daysLeft;
    const msg = it.message ? ` (${t("note", lang)}: ${it.message})` : "";

    const iAutoRenew = it.autoRenew !== false;
    const iRenewDays =
      typeof it.autoRenewDays === "number" ? it.autoRenewDays : 3;
    const iNotifyDays = typeof it.notifyDays === "number" ? it.notifyDays : 3;

    // --- 逻辑 A: 自动禁用 ---
    if (!iAutoRenew && days <= -Math.abs(s.autoDisableDays)) {
      log(t("autoDisable", lang, it.name, Math.abs(days), s.autoDisableDays));
      it.enabled = false;
      items[i] = it;
      dis.push({
        ...it,
        daysLeft: days,
        nextDueDate: st.nextDueDate,
        note: msg,
      });
      changed = true;
      continue;
    }
    // --- 逻辑 B: 自动续期 ---
    else if (iAutoRenew && days <= -Math.abs(iRenewDays)) {
      log(t("autoRenew", lang, it.name));
      // 基于 nextDueDate 往后推一个周期，而不是基于 lastRenewDate
      const nextDueObj = Calc.parseYMD(it.nextDueDate || it.lastRenewDate || it.createDate),
        unit = it.cycleUnit || "day",
        intv = Number(it.intervalDays);

      let newNextDueDate;

      if (it.useLunar) {
        let l = LUNAR_DATA.solar2lunar(
          nextDueObj.getUTCFullYear(),
          nextDueObj.getUTCMonth() + 1,
          nextDueObj.getUTCDate()
        );
        if (!l) {
          log(`[ERR] Lunar conversion failed for ${it.name}`);
          newNextDueDate = new Date(nextDueObj);
          if (unit === "year")
            newNextDueDate.setUTCFullYear(newNextDueDate.getUTCFullYear() + intv);
          else if (unit === "month")
            newNextDueDate.setUTCMonth(newNextDueDate.getUTCMonth() + intv);
          else newNextDueDate.setUTCDate(newNextDueDate.getUTCDate() + intv);
        } else {
          let nl = calcBiz.addPeriod(l, intv, unit);
          let sol = calcBiz.l2s(nl);
          if (!sol) {
            log(`[ERR] Lunar reverse calc failed for ${it.name}`);
            newNextDueDate = new Date(nextDueObj);
            if (unit === "year")
              newNextDueDate.setUTCFullYear(newNextDueDate.getUTCFullYear() + intv);
            else if (unit === "month")
              newNextDueDate.setUTCMonth(newNextDueDate.getUTCMonth() + intv);
            else newNextDueDate.setUTCDate(newNextDueDate.getUTCDate() + intv);
          } else {
            newNextDueDate = new Date(Date.UTC(sol.year, sol.month - 1, sol.day));
          }
        }
      } else {
        newNextDueDate = new Date(nextDueObj);
        if (unit === "year")
          newNextDueDate.setUTCFullYear(newNextDueDate.getUTCFullYear() + intv);
        else if (unit === "month")
          newNextDueDate.setUTCMonth(newNextDueDate.getUTCMonth() + intv);
        else newNextDueDate.setUTCDate(newNextDueDate.getUTCDate() + intv);
      }

      const oldNextDue = it.nextDueDate || Calc.toYMD(nextDueObj);
      const newNextDue = Calc.toYMD(newNextDueDate);
      
      if (newNextDue !== oldNextDue) {
        upd.push({
          name: it.name,
          old: oldNextDue,
          new: newNextDue,
          note: msg,
          renewAmount: it.renewAmount,
          renewCurrency: it.renewCurrency,
          purchaseUrl: it.purchaseUrl,
          purchaseAccount: it.purchaseAccount,
          purchasePassword: it.purchasePassword,
        });
        // 更新 nextDueDate，同时更新 lastRenewDate 作为记录
        it.nextDueDate = newNextDue;
        it.lastRenewDate = Calc.toYMD(today); // 记录续期日期为今天
        items[i] = it;
        changed = true;
      }
    }
    // --- 逻辑 C: 到期提醒 & 状态记录 ---
    else if (days <= iNotifyDays) {
      const statusText =
        days === 0
          ? t("today", lang)
          : days < 0
            ? t("overdue", lang, Math.abs(days))
            : t("left", lang, days);
      log(
        t(
          "checkLog",
          lang,
          it.name,
          `${statusText} ${t("thres", lang, iNotifyDays)}`
        )
      );

      let shouldPush = true;
      if (isSched) {
        const nTime = it.notifyTime || "08:00";
        const [tgtH, tgtM] = nTime.split(":").map(Number);
        const diffMinutes = Math.abs(nowH * 60 + nowM - (tgtH * 60 + tgtM));

        if (diffMinutes > 5) {
          shouldPush = false;
        }
      }

      if (shouldPush) {
        trig.push({ ...st, note: msg });
      } else {
        // 虽然不推送，但记入 monitor 列表，确保触发日志保存
        monitor.push({ ...st });
      }
    } else {
      const statusText = days === 0 ? t("today", lang) : t("left", lang, days);
      log(t("checkLog", lang, it.name, statusText));
    }
  }

  // 【修改】保存逻辑
  if (changed) {
    try {
      // 尝试保存，带上读取时的版本号
      await DataStore.saveItems(env, items, currentVersion);
      log(`[SYSTEM] Data saved successfully.`);
    } catch (e) {
      if (e.message === "VERSION_CONFLICT") {
        // 如果冲突，Cron 任务选择放弃，不覆盖数据，等待下次运行
        log(
          `[WARN] Data conflict detected during cron. Skipping save to protect data.`
        );
        // 重要：如果保存失败，不应该发送“已续期”的通知，因为实际上没存进去
        // 清空 upd 和 dis 数组，避免后续发通知误导
        upd = [];
        dis = [];
      } else {
        log(`[ERR] Save failed: ${e.message}`);
      }
    }
  }

  if (s.enableNotify) {
    let pushBody = [];
    if (dis.length) {
      pushBody.push(`【${t("secDis", lang)}】`);
      dis.forEach((x, i) => {
        let entry = `${i + 1}. ${x.name} (${t("overdue", lang, Math.abs(x.daysLeft))} / ${x.nextDueDate})`;
        if (x.note) entry += `\n${x.note}`;
        entry += buildServiceDetails(x, lang);
        pushBody.push(entry);
      });
      pushBody.push("");
    }
    if (upd.length) {
      pushBody.push(`【${t("secRen", lang)}】`);
      upd.forEach((x, i) => {
        let entry = `${i + 1}. ${x.name}: ${x.old} -> ${x.new}`;
        if (x.note) entry += `\n${x.note}`;
        entry += buildServiceDetails(x, lang);
        pushBody.push(entry);
      });
      pushBody.push("");
    }
    if (trig.length) {
      pushBody.push(`【${t("secAle", lang)}】`);
      trig.forEach((x, i) => {
        const dayStr =
          x.daysLeft === 0
            ? t("today", lang)
            : x.daysLeft < 0
              ? t("overdue", lang, Math.abs(x.daysLeft))
              : t("left", lang, x.daysLeft);
        let entry = `${i + 1}. ${x.name}: ${dayStr} (${x.nextDueDate})`;
        if (x.note) entry += `\n${x.note}`;
        entry += buildServiceDetails(x, lang);
        pushBody.push(entry);
      });
    }

    if (pushBody.length > 0) {
      const fullBody = pushBody.join("\n").trim();
      const pushRes = await Notifier.send(s, t("pushTitle", lang), fullBody);
      log(`[PUSH] ${pushRes}`);
    }
  }

  const act = [
    upd.length ? "renew" : null,
    dis.length ? "disable" : null,
    trig.length ? "alert" : null,
    monitor.length ? "normal" : null,
  ].filter(Boolean);

  const hasError = logs.some(l => l.includes('[WARN]') || l.includes('[ERR]'));

  if (act.length === 0) {
    act.push("normal"); // 无论手动还是 Cron，只要没动作都记为 Normal
  }
  // 如果有错误，确保升级为 Alert
  if (hasError && !act.includes("alert")) {
    act.push("alert");
  }

  if (act.length > 0) {
    await DataStore.saveLog(env, {
      time: new Date().toISOString(),
      trigger: isSched ? "CRON" : "MANUAL",
      content: logs,
      actions: act,
    });
  }

  // 返回时也带上 version
  return { logs, currentList: items, version: currentVersion };
}
// ==========================================
// 5. Worker Entry & Router
// ==========================================

const app = new Router();
const withAuth = (handler) => async (req, env, url) => {
  if (!(await Auth.verify(req, env))) return error("UNAUTHORIZED", 401);
  return handler(req, env, url);
};

app.get(
  "/",
  () =>
    new Response(HTML, {
      headers: { "content-type": "text/html;charset=UTF-8" },
    })
);
// 修改登录接口，增加限流
app.post("/api/login", async (req, env) => {
  const ip = req.headers.get("cf-connecting-ip");
  if (!(await RateLimiter.check(env, ip, "login")))
    return error("RATE_LIMIT_EXCEEDED: Try again later", 429);

  try {
    const body = await req.json();
    return response({ code: 200, token: await Auth.login(body.password, env) });
  } catch (e) {
    return error("AUTH_ERROR", 403);
  }
});
app.get(
  "/api/list",
  withAuth(async (req, env) => {
    const data = await DataStore.getCombined(env);
    delete data.settings.jwtSecret;
    // 传入时区配置
    data.items = data.items.map((i) =>
      calculateStatus(i, data.settings.timezone)
    );
    return response({ code: 200, data });
  })
);
app.post(
  "/api/check",
  withAuth(async (req, env) => {
    const body = await req.json().catch(() => ({}));
    const res = await checkAndRenew(env, false, body.lang);
    const settings = await DataStore.getSettings(env);
    // 重新计算状态
    const displayList = res.currentList.map((i) =>
      calculateStatus(i, settings.timezone)
    );

    // 【修改】如果 checkAndRenew 内部保存成功，版本号应该变了，但我们这里为了简单，
    // 可以让前端在 check 后自动刷新一次列表，或者这里返回新的 version（如果能获取到）。
    // 最稳妥的方式是让前端 check 完后重新 fetchList。
    return response({
      code: 200,
      logs: res.logs,
      data: displayList,
    });
  })
);
app.get(
  "/api/logs",
  withAuth(async (req, env) => {
    return response({ code: 200, data: await DataStore.getLogs(env) });
  })
);
app.post(
  "/api/logs/clear",
  withAuth(async (req, env) => {
    await env.RENEW_KV.delete(DataStore.KEYS.LOGS);
    return response({ code: 200, msg: "CLEARED" });
  })
);

app.post(
  "/api/save",
  withAuth(async (req, env) => {
    const body = await req.json();

    // 处理 items 数据清洗
    const items = body.items.map((i) => ({
      ...i,
      id: i.id || Date.now().toString(),
      intervalDays: Number(i.intervalDays),
      enabled: i.enabled !== false,
      tags: Array.isArray(i.tags) ? i.tags : [],
      useLunar: !!i.useLunar,
      notifyDays: i.notifyDays !== null ? Number(i.notifyDays) : null,
      notifyTime: i.notifyTime || "08:00",
      autoRenew: i.autoRenew !== false,
      autoRenewDays: i.autoRenewDays !== null ? Number(i.autoRenewDays) : null,
      transactionType: i.transactionType || 'expense',
      type: i.type || 'cycle', // 保持向后兼容，默认cycle
    }));

    const currentSettings = await DataStore.getSettings(env);
    const newSettings = {
      ...body.settings,
      jwtSecret: currentSettings.jwtSecret,
    };

    try {
      // 【修改】获取前端传来的 version，进行乐观锁保存
      // 如果前端没传 version (旧版前端)，视作 null，可能会导致覆盖，但在升级过渡期允许
      // 或者强制要求 version，这里假设前端会传
      const clientVersion =
        body.version !== undefined ? Number(body.version) : null;

      const newVersion = await DataStore.saveItems(env, items, clientVersion);
      await DataStore.saveSettings(env, newSettings);

      // 返回新版本号给前端
      return response({ code: 200, msg: "SAVED", version: newVersion });
    } catch (e) {
      if (e.message === "VERSION_CONFLICT") {
        return error("DATA_CHANGED_RELOAD_REQUIRED", 409); // 返回 409 状态码
      }
      throw e;
    }
  })
);

app.get(
  "/api/export",
  withAuth(async (req, env) => {
    const data = await DataStore.getCombined(env);
    delete data.settings.jwtSecret;
    const exportData = {
      meta: { version: APP_VERSION, exportedAt: new Date().toISOString() },
      ...data,
    };
    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="RenewManager_Backup_${new Date().toISOString().split("T")[0]
          }.json"`,
      },
    });
  })
);
app.post(
  "/api/import",
  withAuth(async (req, env) => {
    try {
      const body = await req.json();
      if (!Array.isArray(body.items) || !body.settings)
        throw new Error("INVALID_FILE_FORMAT");
      await DataStore.saveItems(env, body.items);
      const currentSettings = await DataStore.getSettings(env);
      const newSettings = {
        ...currentSettings,
        ...body.settings,
        jwtSecret: currentSettings.jwtSecret,
      };
      await DataStore.saveSettings(env, newSettings);
      return response({ code: 200, msg: "IMPORTED" });
    } catch (e) {
      return error("IMPORT_FAILED: " + e.message, 400);
    }
  })
);

// 修改测试通知接口，增加限流
app.post(
  "/api/test-notify",
  withAuth(async (req, env) => {
    const ip = req.headers.get("cf-connecting-ip");
    if (!(await RateLimiter.check(env, ip, "test_notify")))
      return error("RATE_LIMIT_EXCEEDED: Max 100/day, 1/sec", 429);

    try {
      const body = await req.json();
      const { channel, config } = body;
      if (!Notifier.adapters[channel]) return error("INVALID_CHANNEL");
      const res = await Notifier.adapters[channel](
        config,
        "RenewManager Test",
        `Test message for channel: ${channel}`
      );
      return res === "OK"
        ? response({ code: 200, msg: "SENT" })
        : error("SEND_FAILED: " + res);
    } catch (e) {
      return error("TEST_ERROR: " + e.message);
    }
  })
);

// ICS Calendar Subscription (UUID Auth + I18N + Custom Layout + Outlook Fix + Same Day Alert)
app.get("/api/calendar.ics", async (req, env, url) => {
  const token = url.searchParams.get("token");
  const settings = await DataStore.getSettings(env);
  if (!token || token !== settings.calendarToken)
    return new Response("Unauthorized: Invalid Calendar Token", {
      status: 401,
    });

  const items = await DataStore.getItems(env);
  const lang = settings.language === "en" ? "en" : "zh";

  const T = {
    zh: {
      lblCycle: "提醒周期",
      lblLast: "上次续费",
      note: "备注",
      unit: { day: "天", month: "月", year: "年" },
    },
    en: {
      lblCycle: "Cycle",
      lblLast: "Last Renew",
      note: "Note",
      unit: { day: " Days", month: " Months", year: " Years" },
    },
  }[lang];

  const userTz = settings.timezone || "Asia/Shanghai";

  // ICS 文本转义函数
  const formatIcsText = (str) => {
    if (!str) return "";
    return (
      String(str)
        // 1. 如果有 HTML 标签，先去除 (可选，视你的数据源而定)
        // .replace(/<[^>]+>/g, '')
        // 2. 转义 ICS 特殊字符 (反斜杠必须最先转义)
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        // 3. 处理换行符：将实际换行转换为 ICS 认可的 \n 字符串
        .replace(/\r\n/g, "\\n")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\n")
    );
  };

  const parts = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RenewManager//Calendar//EN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:RenewManager",
    "REFRESH-INTERVAL;VALUE=DURATION:P1D",
    "CALSCALE:GREGORIAN",
    `X-WR-TIMEZONE:${userTz}`,
  ];
  const dtStamp =
    new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  items.forEach((item) => {
    if (!item.enabled) return;

    // 计算基于用户时区的日期
    const st = calculateStatus(item, settings.timezone);
    const dueStr = st.nextDueDate.replace(/-/g, ""); // Start: YYYYMMDD

    // 计算结束时间 (DTSTART + 1天) 以符合全天事件规范
    const startDateObj = Calc.parseYMD(st.nextDueDate);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(endDateObj.getDate() + 1);
    const endStr = Calc.toYMD(endDateObj).replace(/-/g, "");

    parts.push("BEGIN:VEVENT");
    parts.push(`UID:${item.id}@renewmanager`);
    parts.push(`DTSTAMP:${dtStamp}`);
    parts.push(`DTSTART;VALUE=DATE:${dueStr}`);
    parts.push(`DTEND;VALUE=DATE:${endStr}`);
    parts.push(`SUMMARY:${formatIcsText(item.name)}`);
    parts.push("STATUS:CONFIRMED");
    parts.push("TRANSP:TRANSPARENT");

    const unitLabel = T.unit[item.cycleUnit] || item.cycleUnit;

    // 构建描述时，对动态内容应用转义
    let descParts = [];
    descParts.push(`${T.lblCycle}: ${item.intervalDays}${unitLabel}`);
    descParts.push(`${T.lblLast}: ${item.lastRenewDate}`);
    if (item.message) {
      descParts.push(`${T.note}: ${formatIcsText(item.message)}`);
    }

    // 使用 \n 连接各行，并作为 DESCRIPTION 的值
    parts.push(`DESCRIPTION:${descParts.join("\\n")}`);

    // 使用 notifyTime 在当天提醒
    const nTime = item.notifyTime || "08:00";
    const [nH, nM] = nTime.split(":").map(Number);

    // 构造 ISO8601 持续时间字符串 (PTnHnM)
    // 全天事件从 00:00 开始，PT8H 即代表当天 08:00
    let triggerStr = "PT";
    if (nH > 0) triggerStr += `${nH}H`;
    if (nM > 0) triggerStr += `${nM}M`;
    if (triggerStr === "PT") triggerStr = "PT0M"; // 防止 00:00 时为空

    parts.push("BEGIN:VALARM");
    parts.push(`TRIGGER:${triggerStr}`);
    parts.push("ACTION:DISPLAY");
    parts.push(`DESCRIPTION:${formatIcsText(item.name)}`);
    parts.push("END:VALARM");

    parts.push("END:VEVENT");
  });
  parts.push("END:VCALENDAR");

  return new Response(parts.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="renewmanager.ics"',
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
});

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(checkAndRenew(env, true));
  },
  async fetch(req, env, ctx) {
    return app
      .route(req, env)
      .catch((err) => error("SERVER ERROR: " + err.message, 500));
  },
};

// ==========================================
// 6. Frontend
// ==========================================

const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RenewManager ${APP_VERSION}</title>
    <link rel="icon" href="data:image/svg+xml,%3Csvg width='56' height='56' viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Cdefs%3E%3ClinearGradient id='c1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%232563eb'/%3E%3Cstop offset='100%25' style='stop-color:%2322d3ee'/%3E%3C/linearGradient%3E%3ClinearGradient id='h1' x1='108.5' y1='7.8' x2='122.4' y2='21.7' gradientTransform='matrix(0,0.433,-2.309,0,99.8,-0.06)' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0%25' style='stop-color:%232563eb'/%3E%3Cstop offset='100%25' style='stop-color:%2322d3ee'/%3E%3C/linearGradient%3E%3ClinearGradient id='b1' x1='30.4' y1='54.5' x2='30.4' y2='14.8' gradientTransform='scale(0.694,1.441)' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' style='stop-color:%2326afe1;stop-opacity:1'/%3E%3Cstop offset='1' style='stop-color:%23ee5a22;stop-opacity:0.7'/%3E%3C/linearGradient%3E%3ClinearGradient id='b2' xlink:href='%23b1' x1='16' y1='47.2' x2='71.3' y2='47.2' gradientUnits='userSpaceOnUse'/%3E%3Cfilter id='f1' x='-20%25' y='-20%25' width='140%25' height='140%25'%3E%3CfeGaussianBlur in='SourceGraphic' stdDeviation='1.5' result='blur'/%3E%3CfeMerge%3E%3CfeMergeNode in='blur'/%3E%3CfeMergeNode in='SourceGraphic'/%3E%3C/feMerge%3E%3C/filter%3E%3C/defs%3E%3Cpath d='M50 5 L93 30 V70 L50 95 L7 70 V30 Z' stroke='url(%23c1)' stroke-width='4' fill='none' filter='url(%23f1)' stroke-linejoin='round'/%3E%3Cpath d='M7 30 L30 50 M93 30 L70 50 M7 70 L30 50 M93 70 L70 50' stroke='url(%23c1)' stroke-width='1' opacity='0.3'/%3E%3Cg filter='url(%23f1)'%3E%3Ccircle cx='50' cy='50' r='38' stroke='url(%23c1)' stroke-width='1' opacity='0.2' stroke-dasharray='3 3'/%3E%3Ccircle cx='50' cy='50' r='26' stroke='url(%23c1)' stroke-width='3' fill='none'/%3E%3Cpath d='M50 18 V24 M82 50 H76 M50 82 V76 M18 50 H24 M72 28 L67 33 M72 72 L67 67 M28 72 L33 67 M28 28 L33 33' stroke='url(%23c1)' stroke-width='4' stroke-linecap='round'/%3E%3C/g%3E%3Cg filter='url(%23f1)'%3E%3Ccircle cx='50' cy='50' r='5' fill='url(%23c1)'/%3E%3Cpath d='M50 50 L47 20 L50 18 L53 20 Z' fill='url(%23c1)'/%3E%3Cpath d='M47 20 L50 12 L53 20 L50 18 Z' fill='white'/%3E%3Cpath d='m 49.8,49.9 30,-3 2,3 -2,3 z' style='fill:url(%23h1)'/%3E%3Cpath d='M 45.1,22 C 58.7,24.2 68.3,37.4 66.1,51 63.9,64.7 50.7,74.2 37,72 30.2,71 23.9,67 20,61.2' style='fill:none;stroke:url(%23b2);stroke-width:9.75;stroke-linecap:butt' transform='matrix(-0.122,0.691,-0.691,-0.122,87.8,27.7)'/%3E%3C/g%3E%3C/svg%3E">
    <script src="https://cdn.tailwindcss.com/3.4.1"></script>
    <script>
        tailwind.config={
            darkMode: 'class',
            theme:{
                extend:{
                    fontFamily:{sans:['Rajdhani','sans-serif'],mono:['JetBrains Mono','monospace']},
                    colors:{body:'var(--bg-body)',panel:'var(--bg-panel)',border:'var(--border)',textMain:'var(--text-main)',textDim:'var(--text-dim)'}
                }
            }
        }
    </script>
    <link href="https://fonts.loli.net/css2?family=JetBrains+Mono:wght@400;700&family=Rajdhani:wght@500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/element-plus@2.11.9/dist/index.css" />
    <link rel="stylesheet" href="https://unpkg.com/element-plus@2.11.9/theme-chalk/dark/css-vars.css">
    
    <script src="https://unpkg.com/vue@3.5.25/dist/vue.global.prod.js"></script>
    <script src="https://unpkg.com/element-plus@2.11.9/dist/index.full.min.js"></script>
    <script src="https://unpkg.com/@element-plus/icons-vue@2.3.2/dist/index.iife.min.js"></script>
    <script src="https://unpkg.com/element-plus@2.11.9/dist/locale/zh-cn.min.js"></script>
    <script>
        window.ElementPlusIconsVue = window.ElementPlusIconsVue || window.ElementPlusIcons;
        window.onload = function() {
            if (typeof Vue === 'undefined') alert('错误：Vue 加载失败，请检查网络或更换 CDN。');
            else if (typeof ElementPlus === 'undefined') alert('错误：ElementPlus 加载失败。');
        }
    </script>
    <style>
        :root {
            --bg-body: #f1f5f9;
            --bg-panel: #ffffff;
            --text-main: #0f172a;
            --text-dim: #64748b;
            --border: #cbd5e1;
            --el-bg-color: #ffffff;
        }
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes breathe-glow {
            0%, 100% { opacity: 0.5; filter: drop-shadow(0 0 0px rgba(34, 211, 238, 0)); }
            50% { opacity: 1; filter: drop-shadow(0 0 5px rgba(34, 211, 238, 0.8)); }
        }
        .anim-spin {
            transform-origin: center;
            transform-box: view-box;
            animation: spin-slow 30s linear infinite; /* 30秒转一圈 */
        }
        .anim-breathe {
            animation: breathe-glow 3s ease-in-out infinite;
        }
        /* --------------------------- */       
        html.dark {
            --bg-body: #020617; 
            --bg-panel: #0f172a; 
            --text-main: #f1f5f9; 
            --text-dim: #94a3b8; 
            --border: #1e293b;   
            --el-bg-color: #0f172a; 
            --el-text-color-primary: #f1f5f9;
            --el-text-color-regular: #cbd5e1;
            --el-border-color: #1e293b;
            --el-border-color-light: #334155;
            --el-fill-color-blank: #0f172a;
        }

        body { background: var(--bg-body); color: var(--text-main); font-family: 'Rajdhani', sans-serif; background-image: linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px); background-size: 40px 40px; transition: background-color 0.3s, color 0.3s; }
        /* Dark Mode Grid Background */
        html.dark body {
            background-image: linear-gradient(rgba(96, 165, 250, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(96, 165, 250, 0.1) 1px, transparent 1px);
            background-size: 40px 40px;
        }

        .mecha-panel { background: var(--bg-panel); border: 1px solid var(--border); clip-path: polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); transition: background-color 0.3s, border-color 0.3s; }
        
        .mecha-btn { clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); border-radius: 0!important; border: none!important; font-weight: 700!important; letter-spacing: 1px; text-transform: uppercase; transition: all 0.2s; }
        .mecha-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .mecha-btn.is-circle { clip-path: none !important; border-radius: 50% !important; width: 32px; height: 32px; padding: 8px; }
        
        .el-dialog, .el-drawer { --el-bg-color: var(--bg-panel); border: 1px solid var(--border); border-radius: 0!important; clip-path: polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%); }
        .el-dialog__title, .el-drawer__title { color: var(--text-main) !important; }
        .el-input__wrapper { background-color: var(--bg-body)!important; border-radius: 0!important; box-shadow: 0 0 0 1px var(--border) inset!important; }
        .el-input__inner { color: var(--text-main) !important; }
        
        .radio-group-fix { display: flex; width: 100%; gap: 8px; }
        .radio-item { flex: 1; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid var(--border); background: var(--bg-body); color: var(--text-dim); font-weight: 700; transition: all 0.3s; clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px); }
        .radio-item.active { background: rgba(37, 99, 235, 0.15); border-color: #2563eb; color: #2563eb; }
        
        .el-input-group__append { background-color: var(--bg-body) !important; box-shadow: none !important; padding: 0 !important; border-left: 1px solid var(--border); }
        .el-input-group__append .el-input__wrapper { box-shadow: none !important; background-color: transparent !important; }
        .el-input-group__append .el-select .el-input.is-focus .el-input__wrapper { box-shadow: none !important; }
        .el-input-group__append .el-select { margin: 0; }
        .el-input-group__append .el-select .el-input__inner { text-align: center; font-weight: bold; font-size: 12px; }
        
        .disabled-row { opacity: 0.5; filter: grayscale(1); }
        .tag-compact { display: inline-flex; height: 16px; padding: 0 6px; border-radius: 3px; font-size: 9px; font-weight: 600; background: var(--bg-body); color: var(--text-dim); border: 1px solid var(--border); align-items: center; }
        
        .filter-row { display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; }
        @media (min-width: 640px) { .filter-row { flex-direction: row; align-items: center; } }
        .search-box { width: 100%; max-width: 250px; }
        .filter-bar { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; align-items: center; flex: 1; }
        .filter-chip { position: relative; padding: 4px 12px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid var(--border); background: var(--bg-body); color: var(--text-dim); transition: all 0.2s; clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px); overflow: hidden; flex-shrink: 0; }
        .filter-chip.active { background: #2563eb; color: white; border-color: #2563eb; }
        .tag-count-badge { display: inline-flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.1); border-radius: 4px; padding: 0 4px; margin-left: 6px; font-size: 10px; height: 16px; font-family: 'JetBrains Mono', monospace; }
        html.dark .tag-count-badge { background: rgba(255,255,255,0.1); color: #fff; }
        .filter-chip.active .tag-count-badge { background: rgba(255,255,255,0.3); color: #fff; }
        .chip-active-bar { position: absolute; bottom: 0; left: 0; height: 3px; background: #22d3ee; box-shadow: 0 -1px 4px #22d3ee; width: 0%; animation: chipScan 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        @keyframes chipScan { from { width: 0%; opacity: 0.5; } to { width: 100%; opacity: 1; } }
        
        .hud-panel { margin-top: 10px; margin-bottom: 5px; background: linear-gradient(90deg, #0f172a 0%, #1e293b 100%); border-left: 4px solid #3b82f6; color: #fff; padding: 8px 16px; display: flex; align-items: center; justify-content: space-between; clip-path: polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%); box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideIn 0.3s ease-out; }
        .hud-text { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: bold; letter-spacing: 1px; }
        .hud-bar-container { display: flex; flex-direction: row; align-items: center; gap: 4px; height: 16px; }
        .hud-bar { width: 4px; background: #334155; transform: skewX(-20deg); flex-shrink: 0; animation: hud-equalizer 1s infinite ease-in-out; }
        @keyframes hud-equalizer { 0%,100% { height: 4px; opacity: 0.5; } 50% { height: 12px; background: #22d3ee; opacity: 1; box-shadow: 0 0 5px #22d3ee; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Lunar Popper Styles */
        .lunar-popper .el-date-table td { height: 40px!important; padding: 2px!important; }
        .lunar-popper .el-date-table td .el-date-table-cell { height: 100%!important; padding: 0!important; display: block; }
        .lunar-cell { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .lunar-cell .view-date { display: flex; flex-direction: column; align-items: center; gap: 0px !important; }
        .lunar-cell .view-month, .lunar-cell .view-year { display: none; }
        
        .lunar-popper .el-month-table .lunar-cell .view-date, .lunar-popper .el-month-table .lunar-cell .view-year { display: none!important; }
        .lunar-popper .el-month-table .lunar-cell .view-month { display: flex!important; align-items: center; justify-content: center; height: 100%; font-size: 14px; font-weight: bold; }
        .lunar-popper .el-year-table .lunar-cell .view-date, .lunar-popper .el-year-table .lunar-cell .view-month { display: none!important; }
        .lunar-popper .el-year-table .lunar-cell .view-year { display: flex!important; flex-direction: column; align-items: center; justify-content: center; height: 100%; }
        
        .view-year .y-num { font-size: 16px; font-weight: bold; } 
        .view-year .y-ganzhi { font-size: 12px; color: #909399; transform: scale(0.9); margin-top: -2px; display: block!important; }
        .lunar-cell .lunar { font-size: 10px; color: #94a3b8; line-height: 1.1 !important; margin-top: 0 !important; transform: scale(0.9); }
        .bar-scanner { background-color: #3b82f6; box-shadow: 0 0 2px rgba(59,130,246,0.3); transform: scaleX(1); animation: scanner-wave 3s ease-in-out infinite; }
        @keyframes scanner-wave { 0%,100% { background-color:#3b82f6; transform:scaleX(1); } 50% { background-color:#22d3ee; box-shadow:0 0 12px #22d3ee; transform:scaleX(1.3); } }
        .sys-beat-container { display: inline-flex; align-items: center; gap: 2px; margin-left: 12px; padding-left: 12px; border-left: 1px solid #cbd5e1; height: 16px; }
        .sys-beat-bar { width: 3px; height: 8px; background: #94a3b8; transform: skewX(-20deg); animation: sys-beat 1.2s infinite ease-in-out; }
        @keyframes sys-beat { 0%,100% { height:6px; background:#cbd5e1; } 50% { height:14px; background:#10b981; box-shadow:0 0 5px #10b981; } }
        .terminal-window { background-color: #0f172a; color: #4ade80; font-family: 'JetBrains Mono', monospace; padding: 16px; height: 320px; overflow-y: auto; border: 1px solid #334155; font-size: 13px; line-height: 1.5; box-shadow: inset 0 0 10px rgba(0,0,0,0.5); }
        .terminal-line { margin-bottom: 4px; display: flex; }
        .terminal-line::before { content: '>'; color: #3b82f6; margin-right: 8px; font-weight: bold; }
        .typing-cursor::after { content: '▋'; animation: blink 1s infinite; color: #4ade80; margin-left: 4px; }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        
        /* Date Picker Active States */
        .lunar-popper .el-date-table td.current, .lunar-popper .el-year-table td.current, .lunar-popper .el-month-table td.current { --el-datepicker-active-color: transparent !important; background-color: transparent !important; }
        
        /* The blue selection box for date view */
        .lunar-popper .el-date-table td.current .lunar-cell { background-color: #2563eb; border-radius: 4px; color: #ffffff !important; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4); }
        .lunar-popper .el-date-table td.current .el-date-table-cell__text { background-color: transparent !important; }
        .lunar-popper .el-date-table td.current .lunar-cell .solar, .lunar-popper .el-date-table td.current .lunar-cell .lunar { color: #ffffff !important; text-shadow: 0 1px 2px rgba(0,0,0,0.1); }
        
        /* Hover states for all views */
        .lunar-popper .el-date-table td.available:hover, .lunar-popper .el-year-table td.available:hover, .lunar-popper .el-month-table td.available:hover { background-color: transparent !important; }
        .lunar-popper .el-date-table td.available:not(.current):hover .lunar-cell { background-color: rgba(37, 99, 235, 0.05) !important; border-radius: 4px; box-shadow: 0 0 0 1px #2563eb inset; cursor: pointer; transition: all 0.2s; }
        .lunar-popper .el-date-table td.available:not(.current):hover .lunar-cell .solar, .lunar-popper .el-date-table td.available:not(.current):hover .lunar-cell .lunar { color: #2563eb !important; font-weight: bold; }        
        .lunar-cell .solar { line-height: 1.2 !important; font-size: 14px; font-weight: bold; }
        
        /* 年视图和月视图选中状态 - 使用 .lunar-cell 而不是 .cell */
        .lunar-popper .el-year-table td.current .lunar-cell, 
        .lunar-popper .el-month-table td.current .lunar-cell { 
            background-color: #2563eb !important; 
            color: #fff !important; 
            border-radius: 4px !important; 
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4) !important; 
        }
        
        /* 选中状态下的所有文字为白色 */
        .lunar-popper .el-year-table td.current .lunar-cell .y-num,
        .lunar-popper .el-year-table td.current .lunar-cell .y-ganzhi,
        .lunar-popper .el-month-table td.current .lunar-cell .view-month { 
            color: #ffffff !important; 
            text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        
        /* Hover 状态 - 年视图和月视图 */
        .lunar-popper .el-year-table td.available:not(.current):hover .lunar-cell,
        .lunar-popper .el-year-table td:not(.current):not(.disabled):hover .lunar-cell,
        .lunar-popper .el-month-table td.available:not(.current):hover .lunar-cell,
        .lunar-popper .el-month-table td:not(.current):not(.disabled):hover .lunar-cell { 
            background-color: rgba(37, 99, 235, 0.05) !important; 
            border-radius: 4px !important; 
            box-shadow: 0 0 0 1px #2563eb inset !important;
            cursor: pointer !important;
            transition: all 0.2s !important;
        }
        
        /* Hover 状态下的文字颜色 - 年视图 */
        .lunar-popper .el-year-table td:not(.current):not(.disabled):hover .lunar-cell .y-num,
        .lunar-popper .el-year-table td:not(.current):not(.disabled):hover .lunar-cell .y-ganzhi { 
            color: #2563eb !important; 
            font-weight: bold !important;
        }
        
        /* Hover 状态下的文字颜色 - 月视图 */
        .lunar-popper .el-month-table td:not(.current):not(.disabled):hover .lunar-cell .view-month { 
            color: #2563eb !important; 
            font-weight: bold !important;
        }
        .el-table { --el-table-bg-color: var(--bg-panel); --el-table-tr-bg-color: var(--bg-panel); --el-table-header-bg-color: var(--bg-body); --el-table-row-hover-bg-color: var(--bg-body); --el-table-border-color: var(--border); --el-table-text-color: var(--text-main); --el-table-header-text-color: var(--text-dim); }
        html.dark .lunar-popper .el-year-table td .cell, html.dark .lunar-popper .el-month-table td .cell { color: #cbd5e1; }
        
        .notify-tabs .el-tabs__header { margin-bottom: 20px; }
        .notify-tabs .el-tabs__nav-wrap::after { background-color: var(--border); }
        .notify-item-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .notify-label { width: 90px; text-align: right; font-size: 12px; color: var(--text-dim); font-weight: 600; flex-shrink: 0; }
        
        [v-cloak] { display: none !important; }
    </style>
</head>
<body>
    <div id="app" v-cloak class="min-h-screen p-4 sm:p-8 flex flex-col transition-colors duration-300">
        <el-config-provider :locale="locale">
            <div v-if="!isLoggedIn" class="fixed inset-0 bg-slate-500/50 backdrop-blur flex items-center justify-center z-50">
                <div class="mecha-panel p-12 w-full max-w-md text-center !border-t-4 !border-t-blue-500" style="clip-path: polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px);">
                    <h2 class="text-4xl mb-2 font-black tracking-[0.2em] text-blue-600">登录/LOGIN</h2>
                    <el-input v-model="password" type="password" :placeholder="t('passwordPlaceholder')" show-password class="mb-8" size="large" @keyup.enter="login"><template #prefix><el-icon><Lock /></el-icon></template></el-input>
                    <button class="w-full h-12 text-xl mecha-btn bg-blue-600 text-white" @click="login" :disabled="loading">{{ loading ? '验证中/AUTHENTICATING...' : '>> ' + t('unlockBtn') }}</button>
                </div>
            </div>

            <div v-else class="max-w-7xl mx-auto w-full">
                <div class="flex flex-col lg:flex-row justify-between items-center mb-10 gap-6">
                    <div class="flex items-center gap-5 self-start lg:self-center">
                        
                    <div class="relative w-14 h-14 shrink-0 drop-shadow-md">
                    <svg width="56" height="56" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                        <defs>
                            <linearGradient id="cGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#2563eb"/><stop offset="100%" style="stop-color:#22d3ee"/></linearGradient>
                            <linearGradient id="hGrad" x1="108.5" y1="7.8" x2="122.4" y2="21.7" gradientTransform="matrix(0,0.433,-2.309,0,99.8,-0.06)" gradientUnits="userSpaceOnUse"><stop offset="0%" style="stop-color:#2563eb"/><stop offset="100%" style="stop-color:#22d3ee"/></linearGradient>
                            <linearGradient id="bGradBase" x1="30.4" y1="54.5" x2="30.4" y2="14.8" gradientTransform="scale(0.694,1.441)" gradientUnits="userSpaceOnUse"><stop offset="0" style="stop-color:#26afe1;stop-opacity:1"/><stop offset="1" style="stop-color:#ee5a22;stop-opacity:0.7"/></linearGradient>
                            <linearGradient id="bGrad" xlink:href="#bGradBase" x1="16" y1="47.2" x2="71.3" y2="47.2" gradientUnits="userSpaceOnUse"/>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                        </defs>
                        
                        <path class="anim-breathe" d="M50 5 L93 30 V70 L50 95 L7 70 V30 Z" stroke="url(#cGrad)" stroke-width="4" fill="none" filter="url(#glow)" stroke-linejoin="round"/>
                        <path d="M7 30 L30 50 M93 30 L70 50 M7 70 L30 50 M93 70 L70 50" stroke="url(#cGrad)" stroke-width="1" opacity="0.3"/>
                        
                        <g class="anim-spin" filter="url(#glow)">
                            <circle cx="50" cy="50" r="38" stroke="url(#cGrad)" stroke-width="1" opacity="0.2" stroke-dasharray="3 3"/>
                            <circle cx="50" cy="50" r="26" stroke="url(#cGrad)" stroke-width="3" fill="none"/>
                            <path d="M50 18 V24 M82 50 H76 M50 82 V76 M18 50 H24 M72 28 L67 33 M72 72 L67 67 M28 72 L33 67 M28 28 L33 33" stroke="url(#cGrad)" stroke-width="4" stroke-linecap="round"/>
                        </g>
                        
                        <g filter="url(#glow)">
                            <circle cx="50" cy="50" r="5" fill="url(#cGrad)"/>
                            <path d="M50 50 L47 20 L50 18 L53 20 Z" fill="url(#cGrad)"/>
                            <path d="M47 20 L50 12 L53 20 L50 18 Z" fill="white"/>
                            <path d="m 49.8,49.9 30,-3 2,3 -2,3 z" style="fill:url(#hGrad)"/>
                            <path class="anim-breathe" d="M 45.1,22 C 58.7,24.2 68.3,37.4 66.1,51 63.9,64.7 50.7,74.2 37,72 30.2,71 23.9,67 20,61.2" style="fill:none;stroke:url(#bGrad);stroke-width:9.75;stroke-linecap:butt" transform="matrix(-0.122,0.691,-0.691,-0.122,87.8,27.7)"/>
                        </g>
                    </svg>
                </div>
                        <div class="flex flex-col">
                            <div class="flex items-baseline flex-wrap gap-x-3 gap-y-1">
                                <h1 class="text-4xl font-black tracking-tighter text-textMain">RenewManager</h1>
                                <span class="text-2xl text-slate-300 font-light hidden sm:inline-block">|</span>
                                <span class="text-2xl font-bold text-blue-600 tracking-wider" style="font-family: 'Microsoft YaHei', sans-serif;">时序·守望</span>
                                <div class="sys-beat-container ml-1 pl-3 border-l border-slate-300 self-center" title="SYSTEM ONLINE" style="height: 20px">
                                    <div class="sys-beat-bar" style="animation-delay:0s"></div><div class="sys-beat-bar" style="animation-delay:0.15s"></div><div class="sys-beat-bar" style="animation-delay:0.3s"></div>
                                </div>
                            </div>
                            <div class="flex items-center mt-1 flex-wrap gap-2">
                                <p class="text-[10px] text-gray-400 font-mono tracking-[0.15em] uppercase whitespace-nowrap">Service Lifecycle Management</p>
                                <span class="text-[10px] text-blue-400 font-bold font-mono">///</span>
                                <p class="text-[10px] text-gray-500 font-bold tracking-[0.1em] whitespace-nowrap" style="font-family: 'Microsoft YaHei', sans-serif;">分布式云资产全周期托管中枢</p>
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2 p-3 mecha-panel">
                        <el-button class="mecha-btn !bg-emerald-600 !text-white" :icon="VideoPlay" @click="runCheck" :loading="checking">{{ t('check') }}</el-button>
                        <el-button class="mecha-btn !bg-blue-600 !text-white" :icon="Plus" @click="openAdd">{{ t('add') }}</el-button>
                        <div class="w-px h-8 bg-border mx-1 self-center"></div>
                        <el-button class="mecha-btn !bg-indigo-600 !text-white" :icon="Setting" @click="openSettings">{{ t('settings') }}</el-button>
                        <el-button class="mecha-btn !bg-amber-600 !text-white" :icon="Document" @click="openHistoryLogs">{{ t('logs') }}</el-button>
                        <el-button class="mecha-btn !bg-cyan-700 !text-white font-mono" @click="toggleLang">{{ lang==='zh'?'EN':'ZH' }}</el-button>
                        <el-button class="mecha-btn !bg-slate-600 !text-white" circle :icon="isDark ? Sunny : Moon" @click="toggleTheme"></el-button>
                        <div class="w-px h-8 bg-border mx-1 self-center"></div>
                        <el-button class="mecha-btn !bg-red-600 !text-white" :icon="SwitchButton" @click="logout">{{ t('logout') }}</el-button>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <div class="mecha-panel p-4 pl-6 border-l-4 !border-l-blue-500"><div class="text-blue-600 text-xs font-bold font-mono mb-1 tracking-widest">{{ t('totalServices') }}</div><div class="text-4xl font-black font-mono text-textMain">{{ list.length }}</div></div>
                    <div class="mecha-panel p-4 pl-6 border-l-4 !border-l-amber-500"><div class="text-amber-600 text-xs font-bold font-mono mb-1 tracking-widest">{{ t('expiringSoon') }}</div><div class="text-4xl font-black font-mono text-amber-500">{{ expiringCount }}</div></div>
                    <div class="mecha-panel p-4 pl-6 border-l-4 !border-l-red-500"><div class="text-red-600 text-xs font-bold font-mono mb-1 tracking-widest">{{ t('expiredAlert') }}</div><div class="text-4xl font-black font-mono text-red-500">{{ expiredCount }}</div></div>
                    <div class="mecha-panel p-4 pl-6 border-l-4 !border-l-green-500">
                        <div class="text-green-600 text-xs font-bold font-mono mb-1 tracking-widest">{{ lang==='zh'?'收入统计':'INCOME' }}</div>
                        <div class="text-2xl font-black font-mono text-green-600 mb-0.5">{{ monthlyIncome.toFixed(2) }}</div>
                        <div class="text-[10px] text-textDim font-mono mb-1">{{ lang==='zh'?'每月':'MONTHLY' }}</div>
                        <div class="text-2xl font-black font-mono text-green-600">{{ yearlyIncome.toFixed(2) }}</div>
                        <div class="text-[10px] text-textDim font-mono">{{ lang==='zh'?'每年':'YEARLY' }}</div>
                    </div>
                    <div class="mecha-panel p-4 pl-6 border-l-4 !border-l-orange-500">
                        <div class="text-orange-600 text-xs font-bold font-mono mb-1 tracking-widest">{{ lang==='zh'?'支出统计':'EXPENSE' }}</div>
                        <div class="text-2xl font-black font-mono text-orange-600 mb-0.5">{{ monthlyExpense.toFixed(2) }}</div>
                        <div class="text-[10px] text-textDim font-mono mb-1">{{ lang==='zh'?'每月':'MONTHLY' }}</div>
                        <div class="text-2xl font-black font-mono text-orange-600">{{ yearlyExpense.toFixed(2) }}</div>
                        <div class="text-[10px] text-textDim font-mono">{{ lang==='zh'?'每年':'YEARLY' }}</div>
                    </div>
                </div>

                <div class="filter-row" v-if="list.length > 0">
                    <div class="filter-bar" v-if="allTags.length > 0">
                        <div class="filter-chip" :class="{active:currentTag===''}" @click="currentTag=''">{{ t('tagAll') }}<div v-if="currentTag===''" class="chip-active-bar"></div></div>
                        <div class="filter-chip" :class="{active:currentTag==='DISABLED'}" @click="currentTag='DISABLED'">{{ t('disabledFilter') }}<span class="tag-count-badge">{{ disabledCount }}</span><div v-if="currentTag==='DISABLED'" class="chip-active-bar"></div></div>
                        <div class="filter-chip" v-for="tag in allTags" :key="tag" :class="{active:currentTag===tag}" @click="currentTag=tag">{{ tag }} <span class="tag-count-badge">{{ getTagCount(tag) }}</span><div v-if="currentTag===tag" class="chip-active-bar"></div></div>
                    </div>
                </div>

                <div v-if="currentTag" class="hud-panel">
                    <div class="hud-text">MONITORING // TAG: <span class="hud-accent" style="color:#22d3ee">{{ currentTag }}</span></div>
                    <div class="hud-bar-container"><div class="hud-text" style="margin-right:12px;color:#94a3b8">MATCHED: <span class="text-white text-lg mx-1">{{ filteredList.length }}</span></div><div class="hud-bar" style="animation-delay:0s"></div><div class="hud-bar" style="animation-delay:0.1s"></div><div class="hud-bar" style="animation-delay:0.2s"></div><div class="hud-bar" style="animation-delay:0.3s"></div><div class="hud-bar" style="animation-delay:0.4s"></div></div>
                </div>
  <div class="mecha-panel p-1 !border-l-0">
    <el-table :key="tableKey" :data="filteredList" style="width:100%" v-loading="loading" :row-class-name="tableRowClassName" size="large" @sort-change="handleSortChange" @filter-change="handleFilterChange" :default-sort="sortState">       
        <el-table-column :label="t('serviceName')" min-width="230" sortable="custom" prop="name">
            <template #default="scope">
                <div class="flex items-center gap-4">
                    <div class="w-1 h-8 shrink-0 rounded-[1px] transition-all" :class="[scope.row.enabled?'bar-scanner':'bg-gray-300']" :style="scope.row.enabled?{animationDelay:(scope.$index*0.15)+'s'}:{}"></div>
                    <div class="min-w-0">
                        <div class="font-bold text-base leading-tight tracking-tight text-textMain break-words flex items-center gap-2">{{ scope.row.name }}</div>
                        <div class="text-xs text-textDim font-mono mt-0.5" v-if="scope.row.message">// {{ scope.row.message }}</div>
                    </div>
                </div>
            </template>
        </el-table-column>

        <el-table-column :label="lang==='zh'?'类型':'Type'" width="100" prop="transactionType" column-key="transactionType">
            <template #default="scope">
                <div class="flex items-center h-full">
                    <span v-if="scope.row.transactionType==='income'" class="text-[9px] font-bold bg-green-50 text-green-600 border border-green-200 px-1.5 py-0.5 tracking-wider whitespace-nowrap">{{ lang==='zh'?'收入':'INCOME' }}</span>
                    <span v-else class="text-[9px] font-bold bg-orange-50 text-orange-600 border border-orange-200 px-1.5 py-0.5 tracking-wider whitespace-nowrap">{{ lang==='zh'?'支出':'EXPENSE' }}</span>
                </div>
            </template>
        </el-table-column>

        <el-table-column :label="t('nextDue')" min-width="200" prop="daysLeft" sortable="custom" column-key="daysLeft" :filters="nextDueFilters">
            <template #default="scope">
                <div v-if="scope.row.enabled">
                    <div class="flex items-center gap-2">
                        <div class="font-mono text-xl font-bold leading-none tracking-tight" :class="getDaysClass(scope.row.daysLeft)">{{ formatDaysLeft(scope.row.daysLeft) }}</div>
                        <div v-if="scope.row.useLunar" class="text-[9px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-1 py-[2px] leading-none whitespace-nowrap">{{ t('lunarCal') }}</div>
                    </div>
                    <div class="text-[10px] text-textDim font-mono mt-1 flex flex-wrap items-center gap-1.5 leading-tight">
                        <span>TARGET: {{ scope.row.nextDueDate }}</span>
                        <span v-if="scope.row.useLunar && scope.row.nextDueDateLunar" class="text-blue-500/80">({{ scope.row.nextDueDateLunar }})</span>
                    </div>
                </div>
                <div v-else class="text-gray-400 font-mono text-xs tracking-widest">:: {{ t('lbOffline') }} ::</div>
            </template>
        </el-table-column>

        <el-table-column :label="t('uptime')" width="120" prop="serviceDays" sortable="custom" column-key="serviceDays" :filters="uptimeFilters">
            <template #default="scope">
                <span class="inline-block bg-body text-textDim border border-border px-2 py-1 font-mono text-sm font-bold">{{ scope.row.serviceDays }} {{ t('daysUnit') }}</span>
            </template>
        </el-table-column>

        <el-table-column :label="t('lastRenew')" width="140" prop="lastRenewDate" sortable="custom" column-key="lastRenewDate" :filters="lastRenewFilters">
            <template #default="scope">
                <div class="font-mono text-textDim text-sm font-bold">{{ scope.row.lastRenewDate }}</div>
                <div v-if="scope.row.useLunar && scope.row.lastRenewDateLunar" class="text-[10px] text-gray-400 font-mono">({{ scope.row.lastRenewDateLunar }})</div>
            </template>
        </el-table-column>

        <el-table-column :label="t('cyclePeriod')" width="90" sortable="custom" prop="intervalDays">
            <template #default="scope">
                <span class="font-mono font-bold text-lg text-textDim">{{ scope.row.intervalDays }}</span> 
                <span class="text-[10px] text-gray-400 uppercase align-top">{{ t('unit.'+(scope.row.cycleUnit||'day')) }}</span>
            </template>
        </el-table-column>

        <el-table-column :label="t('amount')" width="120" sortable="custom" prop="amount">
            <template #default="scope">
                <span v-if="scope.row.amount" class="font-mono font-bold text-textMain">{{ scope.row.amount }} <span class="text-[10px] text-gray-400">{{ scope.row.currency || 'CNY' }}</span></span>
                <span v-else class="text-gray-300">-</span>
            </template>
        </el-table-column>

        <el-table-column :label="t('colDetails')" width="80" align="center">
            <template #default="scope">
                <el-button class="!p-2 !rounded-none" size="small" type="info" plain :icon="View" @click="showDetails(scope.row)"></el-button>
            </template>
        </el-table-column>

        <el-table-column :label="t('actions')" :width="actionColWidth" fixed="right" align="right">
            <template #default="scope">
                <div class="flex justify-end items-center gap-2">
                    <el-tooltip :content="t('tipToggle')" placement="top" :hide-after="0">
                        <div class="inline-flex">
                            <el-switch v-model="scope.row.enabled" size="small" style="--el-switch-on-color:#2563eb;" @change="toggleEnable(scope.row)"></el-switch>
                        </div>
                    </el-tooltip>

                    <!-- Desktop View -->
                    <template v-if="windowWidth >= 640">
                        <el-popconfirm 
                            :title="t('msg.confirmRenew').replace('%s', scope.row.name)"
                            :confirm-button-text="t('yes')" 
                            :cancel-button-text="t('no')"
                            width="200"
                            @confirm="manualRenew(scope.row)">
                            <template #reference>
                                <div class="inline-flex">
                                    <el-tooltip :content="t('tipRenew')" placement="top" :hide-after="0">
                                        <el-button class="!p-2 !rounded-none !ml-0" size="small" type="success" plain :icon="RefreshRight"></el-button>
                                    </el-tooltip>
                                </div>
                            </template>
                        </el-popconfirm>
                        <el-tooltip :content="t('tipEdit')" placement="top" :hide-after="0">
                            <el-button class="!p-2 !rounded-none !ml-0" size="small" type="primary" plain :icon="Edit" @click="editItem(scope.row)"></el-button>
                        </el-tooltip>
                        <el-popconfirm 
                            :title="t('msg.confirmDel')"
                            :confirm-button-text="t('yes')" 
                            :cancel-button-text="t('no')"
                            width="200"
                            @confirm="deleteItem(scope.row)">
                            <template #reference>
                                <div class="inline-flex">
                                    <el-tooltip :content="t('tipDelete')" placement="top" :hide-after="0">
                                        <el-button class="!p-2 !rounded-none !ml-0" size="small" type="danger" plain :icon="Delete"></el-button>
                                    </el-tooltip>
                                </div>
                            </template>
                        </el-popconfirm>
                    </template>

                    <!-- Mobile View -->
                    <template v-else>
                         <el-dropdown trigger="click">
                            <el-button class="!p-2 !rounded-none !ml-0" size="small" type="primary" plain :icon="More"></el-button>
                            <template #dropdown>
                              <el-dropdown-menu>
                                <el-dropdown-item :icon="RefreshRight" @click="confirmRenew(scope.row)">{{ t('tipRenew') }}</el-dropdown-item>
                                <el-dropdown-item :icon="Edit" @click="editItem(scope.row)">{{ t('tipEdit') }}</el-dropdown-item>
                                <el-dropdown-item :icon="Delete" @click="confirmDelete(scope.row)" divided class="text-red-500">{{ t('tipDelete') }}</el-dropdown-item>
                              </el-dropdown-menu>
                            </template>
                          </el-dropdown>
                    </template>
                </div>
            </template>
        </el-table-column>
                    </el-table>
                </div>

                <div class="mt-8 py-6 text-center border-t border-slate-200/60">
                    <p class="text-[10px] text-gray-400 font-mono tracking-[0.2em] uppercase flex justify-center items-center gap-1">
                        &copy; 2025 <a href="https://github.com/xiao0ming0/renewmanager" target="_blank" class="font-bold text-slate-600 hover:text-blue-600 transition-colors border-b border-dashed border-slate-300 hover:border-blue-600 pb-0.5 mx-1 decoration-0">RenewManager</a>
                        <span class="text-blue-500 font-bold">${APP_VERSION}</span><span class="mx-2 opacity-30">|</span>DESIGNED BY <span class="font-bold text-slate-600">LOSTFREE</span>
                    </p>
                </div>                  
            </div>

            <el-dialog v-model="dialogVisible" :title="isEdit?t('editService'):t('newService')" width="680px" align-center class="!rounded-none mecha-panel" style="clip-path:polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px);">
                <el-form :model="form" label-position="top">
                    <el-form-item :label="t('formName')"><el-input v-model="form.name" size="large"></el-input></el-form-item>

                <div class="flex flex-col sm:flex-row items-end gap-4 mb-4">
                        <el-form-item :label="lang==='zh'?'类型':'Type'" class="!mb-0 flex-1 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm px-3 pt-2 pb-1">
                            <el-select v-model="form.transactionType" style="width:100%" size="large">
                                <el-option :label="lang==='zh'?'支出':'Expense'" value="expense"></el-option>
                                <el-option :label="lang==='zh'?'收入':'Income'" value="income"></el-option>
                            </el-select>
                        </el-form-item>
                        <div class="w-px h-8 bg-slate-300 hidden sm:block mb-1"></div>
                        <el-form-item :label="t('interval')" class="!mb-0 w-48">
                            <el-input v-model.number="form.intervalDays" type="number" :min="1">
                                <template #append>
                                    <el-select v-model="form.cycleUnit" style="width:80px" :teleported="false">
                                        <el-option :label="t('unit.day')" value="day"></el-option>
                                        <el-option :label="t('unit.month')" value="month"></el-option>
                                        <el-option :label="t('unit.year')" value="year"></el-option>
                                    </el-select>
                                </template>
                            </el-input>
                        </el-form-item>
                        <div class="w-px h-8 bg-slate-300 hidden sm:block mb-1"></div>
                        <el-form-item :label="t('useLunar')" class="!mb-0"><el-switch v-model="form.useLunar" style="--el-switch-on-color:#2563eb;"></el-switch></el-form-item>
                    </div>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <el-form-item class="!mb-0">
                            <template #label><div class="flex items-center gap-2"><span>{{ t('createDate') }}</span><span v-if="form.useLunar && form.createDate" class="text-[12px] font-bold text-purple-600 font-mono ml-1">{{ getLunarStr(form.createDate).replace('农历: ','') }}</span></div></template>
                            <el-date-picker v-if="form.useLunar" v-model="form.createDate" type="date" value-format="YYYY-MM-DD" style="width:100%" class="!w-full" :disabled="isEdit" popper-class="lunar-popper"><template #default="c"><div class="lunar-cell"><el-tooltip :content="getLunarTooltip(c)" placement="top" :hide-after="0" :enterable="false"><div class="view-date"><span class="solar font-bold">{{c.text}}</span><span class="lunar">{{getSmartLunarText(c)}}</span></div></el-tooltip><div class="view-month">{{getMonthStr(c.text)}}</div><div class="view-year"><span class="y-num">{{c.text}}</span><span class="y-ganzhi">{{getYearGanZhi(c.text)}}</span></div></div></template></el-date-picker>
                            <el-date-picker v-else v-model="form.createDate" type="date" value-format="YYYY-MM-DD" style="width:100%" class="!w-full" :disabled="isEdit" popper-class="lunar-popper"><template #default="c"><div class="lunar-cell"><div class="view-date"><span class="solar font-bold">{{c.text}}</span></div><div class="view-month">{{getMonthStr(c.text)}}</div><div class="view-year"><span class="y-num">{{c.text}}</span></div></div></template></el-date-picker>
                        </el-form-item>
                        <el-form-item class="!mb-0">
                            <template #label><div class="flex items-center gap-2"><span>{{ t('lastRenew') }}</span><span v-if="form.useLunar && form.lastRenewDate" class="text-[12px] font-bold text-purple-600 font-mono ml-1">{{ getLunarStr(form.lastRenewDate).replace('农历: ','') }}</span></div></template>
                            <el-date-picker v-if="form.useLunar" v-model="form.lastRenewDate" type="date" value-format="YYYY-MM-DD" style="width:100%" class="!w-full" popper-class="lunar-popper"><template #default="c"><div class="lunar-cell"><el-tooltip :content="getLunarTooltip(c)" placement="top" :hide-after="0" :enterable="false"><div class="view-date"><span class="solar font-bold">{{c.text}}</span><span class="lunar">{{getSmartLunarText(c)}}</span></div></el-tooltip><div class="view-month">{{getMonthStr(c.text)}}</div><div class="view-year"><span class="y-num">{{c.text}}</span><span class="y-ganzhi">{{getYearGanZhi(c.text)}}</span></div></div></template></el-date-picker>
                            <el-date-picker v-else v-model="form.lastRenewDate" type="date" value-format="YYYY-MM-DD" style="width:100%" class="!w-full" popper-class="lunar-popper"><template #default="c"><div class="lunar-cell"><div class="view-date"><span class="solar font-bold">{{c.text}}</span></div><div class="view-month">{{getMonthStr(c.text)}}</div><div class="view-year"><span class="y-num">{{c.text}}</span></div></div></template></el-date-picker>
                        </el-form-item>
                    </div>

                    <div v-if="previewData || (isEdit && form.nextDueDate)" class="relative mb-4 overflow-hidden rounded-sm border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900 shadow-sm group">
                        <div class="flex justify-between items-center p-3 pl-5">
                            <div>
                                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-0.5">{{ t('nextDue') }}</div>
                                <div class="text-xl font-bold text-slate-700 dark:text-slate-200 font-mono tracking-tight leading-none">{{ isEdit && form.nextDueDate ? form.nextDueDate : (previewData ? previewData.date : '') }}</div>
                            </div>
                            <div class="text-right">
                                 <div class="text-[10px] text-slate-400 font-mono mb-0.5">{{ isEdit ? (lang==='zh'?'当前到期时间':'Current Due Date') : t('previewCalc') }}</div>
                                 <div class="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono leading-none">{{ isEdit && form.nextDueDate ? editDueDiff : (previewData ? previewData.diff : '') }}</div>
                            </div>
                        </div>
                    </div>

                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 border-t border-slate-100 pt-4">
                        <el-form-item :label="t('policyNotify')" class="!mb-0">
                            <div class="flex gap-2">
                                <el-input-number v-model="form.notifyDays" :min="0" controls-position="right" class="!w-24"></el-input-number>
                                <el-time-select v-model="form.notifyTime" start="00:00" step="00:30" end="23:30" placeholder="08:00" class="!flex-1" :clearable="false"/>
                            </div>
                        </el-form-item>
                        <div class="flex items-end gap-3">
                            <el-form-item :label="t('policyAuto')" class="!mb-0 shrink-0"><el-switch v-model="form.autoRenew" style="--el-switch-on-color:#2563eb;"></el-switch></el-form-item>
                            <el-form-item v-if="form.autoRenew" :label="t('policyRenewDay')" class="!mb-0 flex-1"><el-input-number v-model="form.autoRenewDays" :min="0" controls-position="right" style="width:100%"></el-input-number></el-form-item>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 border-t border-slate-100 pt-4">
                        <el-form-item :label="t('amount')">
                            <el-input v-model="form.amount" type="number" step="0.01" size="large">
                                <template #append>
                                    <el-select v-model="form.currency" style="width: 90px" :teleported="false">
                                        <el-option label="CNY" value="CNY"></el-option>
                                        <el-option label="USD" value="USD"></el-option>
                                        <el-option label="EUR" value="EUR"></el-option>
                                    </el-select>
                                </template>
                            </el-input>
                        </el-form-item>
                        <el-form-item :label="t('purchaseUrl')">
                            <el-input v-model="form.purchaseUrl" size="large"></el-input>
                        </el-form-item>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <el-form-item :label="t('purchaseAccount')">
                            <el-input v-model="form.purchaseAccount" size="large"></el-input>
                        </el-form-item>
                        <el-form-item :label="t('purchasePassword')">
                            <el-input v-model="form.purchasePassword" type="password" show-password size="large"></el-input>
                        </el-form-item>
                    </div>

                    <el-form-item :label="t('note')"><el-input v-model="form.message" type="textarea" rows="2"></el-input></el-form-item>
                </el-form>
                
                <template #footer>
                    <div class="flex justify-between items-center w-full pt-2 border-t border-slate-100">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold text-slate-500">{{ t('status') }}</span>
                            <el-switch v-model="form.enabled" :active-text="t('active')" :inactive-text="t('disabledText')" style="--el-switch-on-color:#2563eb;"></el-switch>
                        </div>
                        <div class="flex gap-3">
                            <el-button @click="dialogVisible=false" size="large" class="mecha-btn">{{ t('cancel') }}</el-button>
                            <el-button type="primary" @click="saveItem" size="large" class="mecha-btn !bg-blue-600">{{ t('save') }}</el-button>
                        </div>
                    </div>
                </template>
            </el-dialog>
            
            <el-dialog v-model="settingsVisible" :title="t('settingsTitle')" width="800px" align-center class="!rounded-none mecha-panel" style="clip-path:polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px);">
                <el-form :model="settingsForm" label-position="left" label-width="120px">
                    <h4 class="text-xs font-bold text-blue-600 mb-4 border-b border-gray-300 pb-2 uppercase">{{ t('secPref') }}</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <el-form-item :label="t('timezone')">
                            <el-select v-model="settingsForm.timezone" style="width:100%" filterable placeholder="Select Timezone">
                                <el-option 
                                    v-for="item in timezoneList" 
                                    :key="item.value" 
                                    :label="item.label" 
                                    :value="item.value">
                                </el-option>
                            </el-select>
                        </el-form-item>
                        <el-form-item :label="t('autoDisableThreshold')"><el-input-number v-model="settingsForm.autoDisableDays" :min="1" class="!w-full"></el-input-number></el-form-item>
                    </div>

                    <h4 class="text-xs font-bold text-blue-600 mb-4 mt-4 border-b border-gray-300 pb-2 uppercase">{{ t('secNotify') }}</h4>
                    <div class="flex items-center gap-4 mb-4">
                        <span class="text-sm font-bold text-slate-700">{{ t('pushSwitch') }}</span>
                        <el-switch v-model="settingsForm.enableNotify" style="--el-switch-on-color:#2563eb;"></el-switch>
                    </div>
                    
                    <div v-if="settingsForm.enableNotify">
                    <div v-if="settingsForm.enableNotify">
                        <el-collapse v-model="expandedChannels" accordion>
                            <!-- Telegram -->
                            <el-collapse-item name="telegram">
                                <template #title>
                                    <div class="flex items-center w-full pr-4">
                                        <el-icon class="mr-2 text-lg"><Promotion /></el-icon>
                                        <span class="font-bold flex-1">Telegram</span>
                                        <el-switch v-model="channelMap.telegram" style="--el-switch-on-color:#2563eb;" @change="toggleChannel('telegram')" @click.stop></el-switch>
                                    </div>
                                </template>
                                <div class="p-2">
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblToken') }}</span><el-input v-model="settingsForm.notifyConfig.telegram.token" placeholder="123456:ABC-DEF..." size="small"></el-input></div>
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblChatId') }}</span><el-input v-model="settingsForm.notifyConfig.telegram.chatId" placeholder="-100xxxx" size="small"></el-input></div>
                                    <div class="flex justify-end mt-2"><el-button size="small" type="primary" link @click="testChannel('telegram')" :loading="testing.telegram">{{ t('btnTest') }}</el-button></div>
                                </div>
                            </el-collapse-item>
                            
                            <!-- Bark -->
                            <el-collapse-item name="bark">
                                <template #title>
                                    <div class="flex items-center w-full pr-4">
                                        <el-icon class="mr-2 text-lg"><Iphone /></el-icon>
                                        <span class="font-bold flex-1">Bark</span>
                                        <el-switch v-model="channelMap.bark" style="--el-switch-on-color:#2563eb;" @change="toggleChannel('bark')" @click.stop></el-switch>
                                    </div>
                                </template>
                                <div class="p-2">
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblServer') }}</span><el-input v-model="settingsForm.notifyConfig.bark.server" placeholder="https://api.day.app" size="small"></el-input></div>
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblDevKey') }}</span><el-input v-model="settingsForm.notifyConfig.bark.key" placeholder="Key" size="small"></el-input></div>
                                    <div class="flex justify-end mt-2"><el-button size="small" type="primary" link @click="testChannel('bark')" :loading="testing.bark">{{ t('btnTest') }}</el-button></div>
                                </div>
                            </el-collapse-item>

                            <!-- Gotify -->
                            <el-collapse-item name="gotify">
                                <template #title>
                                    <div class="flex items-center w-full pr-4">
                                        <el-icon class="mr-2 text-lg"><Bell /></el-icon>
                                        <span class="font-bold flex-1">Gotify</span>
                                        <el-switch v-model="channelMap.gotify" style="--el-switch-on-color:#2563eb;" @change="toggleChannel('gotify')" @click.stop></el-switch>
                                    </div>
                                </template>
                                <div class="p-2">
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblServer') }}</span><el-input v-model="settingsForm.notifyConfig.gotify.server" placeholder="https://gotify.example.com" size="small"></el-input></div>
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblToken') }}</span><el-input v-model="settingsForm.notifyConfig.gotify.token" placeholder="App Token" size="small"></el-input></div>
                                    <div class="flex justify-end mt-2"><el-button size="small" type="primary" link @click="testChannel('gotify')" :loading="testing.gotify">{{ t('btnTest') }}</el-button></div>
                                </div>
                            </el-collapse-item>

                            <!-- Ntfy -->
                            <el-collapse-item name="ntfy">
                                <template #title>
                                    <div class="flex items-center w-full pr-4">
                                        <el-icon class="mr-2 text-lg"><Promotion /></el-icon>
                                        <span class="font-bold flex-1">Ntfy</span>
                                        <el-switch v-model="channelMap.ntfy" style="--el-switch-on-color:#2563eb;" @change="toggleChannel('ntfy')" @click.stop></el-switch>
                                    </div>
                                </template>
                                <div class="p-2">
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblServer') }}</span><el-input v-model="settingsForm.notifyConfig.ntfy.server" placeholder="https://ntfy.sh" size="small"></el-input></div>
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblTopic') }}</span><el-input v-model="settingsForm.notifyConfig.ntfy.topic" placeholder="Topic" size="small"></el-input></div>
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblToken') }}</span><el-input v-model="settingsForm.notifyConfig.ntfy.token" placeholder="Optional Token" size="small"></el-input></div>
                                    <div class="flex justify-end mt-2"><el-button size="small" type="primary" link @click="testChannel('ntfy')" :loading="testing.ntfy">{{ t('btnTest') }}</el-button></div>
                                </div>
                            </el-collapse-item>

                            <!-- PushPlus -->
                            <el-collapse-item name="pushplus">
                                <template #title>
                                    <div class="flex items-center w-full pr-4">
                                        <el-icon class="mr-2 text-lg"><Message /></el-icon>
                                        <span class="font-bold flex-1">PushPlus</span>
                                        <el-switch v-model="channelMap.pushplus" style="--el-switch-on-color:#2563eb;" @change="toggleChannel('pushplus')" @click.stop></el-switch>
                                    </div>
                                </template>
                                <div class="p-2">
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblToken') }}</span><el-input v-model="settingsForm.notifyConfig.pushplus.token" placeholder="Token" size="small"></el-input></div>
                                    <div class="flex justify-end mt-2"><el-button size="small" type="primary" link @click="testChannel('pushplus')" :loading="testing.pushplus">{{ t('btnTest') }}</el-button></div>
                                </div>
                            </el-collapse-item>

                            <!-- NotifyX -->
                            <el-collapse-item name="notifyx">
                                <template #title>
                                    <div class="flex items-center w-full pr-4">
                                        <el-icon class="mr-2 text-lg"><Bell /></el-icon>
                                        <span class="font-bold flex-1">NotifyX</span>
                                        <el-switch v-model="channelMap.notifyx" style="--el-switch-on-color:#2563eb;" @change="toggleChannel('notifyx')" @click.stop></el-switch>
                                    </div>
                                </template>
                                <div class="p-2">
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblApiKey') }}</span><el-input v-model="settingsForm.notifyConfig.notifyx.apiKey" placeholder="API Key" size="small"></el-input></div>
                                    <div class="flex justify-end mt-2"><el-button size="small" type="primary" link @click="testChannel('notifyx')" :loading="testing.notifyx">{{ t('btnTest') }}</el-button></div>
                                </div>
                            </el-collapse-item>

                            <!-- Resend -->
                            <el-collapse-item name="resend">
                                <template #title>
                                    <div class="flex items-center w-full pr-4">
                                        <el-icon class="mr-2 text-lg"><Message /></el-icon>
                                        <span class="font-bold flex-1">Resend</span>
                                        <el-switch v-model="channelMap.resend" style="--el-switch-on-color:#2563eb;" @change="toggleChannel('resend')" @click.stop></el-switch>
                                    </div>
                                </template>
                                <div class="p-2">
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblApiKey') }}</span><el-input v-model="settingsForm.notifyConfig.resend.apiKey" placeholder="re_..." size="small"></el-input></div>
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblFrom') }}</span><el-input v-model="settingsForm.notifyConfig.resend.from" placeholder="From" size="small"></el-input></div>
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblTo') }}</span><el-input v-model="settingsForm.notifyConfig.resend.to" placeholder="To" size="small"></el-input></div>
                                    <div class="flex justify-end mt-2"><el-button size="small" type="primary" link @click="testChannel('resend')" :loading="testing.resend">{{ t('btnTest') }}</el-button></div>
                                </div>
                            </el-collapse-item>

                            <!-- Webhook 1 -->
                            <el-collapse-item name="webhook">
                                <template #title>
                                    <div class="flex items-center w-full pr-4">
                                        <el-icon class="mr-2 text-lg"><Link /></el-icon>
                                        <span class="font-bold flex-1">Webhook 1</span>
                                        <el-switch v-model="channelMap.webhook" style="--el-switch-on-color:#2563eb;" @change="toggleChannel('webhook')" @click.stop></el-switch>
                                    </div>
                                </template>
                                <div class="p-2">
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblServer') }}</span><el-input v-model="settingsForm.notifyConfig.webhook.url" placeholder="https://..." size="small"></el-input></div>
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblHeaders') }}</span><el-input v-model="settingsForm.notifyConfig.webhook.headers" type="textarea" :rows="2" placeholder="JSON" size="small"></el-input></div>
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblBody') }}</span><el-input v-model="settingsForm.notifyConfig.webhook.body" type="textarea" :rows="2" placeholder="JSON" size="small"></el-input></div>
                                    <div class="flex justify-end mt-2"><el-button size="small" type="primary" link @click="testChannel('webhook')" :loading="testing.webhook">{{ t('btnTest') }}</el-button></div>
                                </div>
                            </el-collapse-item>

                            <!-- Webhook 2 -->
                            <el-collapse-item name="webhook2">
                                <template #title>
                                    <div class="flex items-center w-full pr-4">
                                        <el-icon class="mr-2 text-lg"><Link /></el-icon>
                                        <span class="font-bold flex-1">Webhook 2</span>
                                        <el-switch v-model="channelMap.webhook2" style="--el-switch-on-color:#2563eb;" @change="toggleChannel('webhook2')" @click.stop></el-switch>
                                    </div>
                                </template>
                                <div class="p-2">
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblServer') }}</span><el-input v-model="settingsForm.notifyConfig.webhook2.url" placeholder="https://..." size="small"></el-input></div>
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblHeaders') }}</span><el-input v-model="settingsForm.notifyConfig.webhook2.headers" type="textarea" :rows="2" placeholder="JSON" size="small"></el-input></div>
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblBody') }}</span><el-input v-model="settingsForm.notifyConfig.webhook2.body" type="textarea" :rows="2" placeholder="JSON" size="small"></el-input></div>
                                    <div class="flex justify-end mt-2"><el-button size="small" type="primary" link @click="testChannel('webhook2')" :loading="testing.webhook2">{{ t('btnTest') }}</el-button></div>
                                </div>
                            </el-collapse-item>

                            <!-- Webhook 3 -->
                            <el-collapse-item name="webhook3">
                                <template #title>
                                    <div class="flex items-center w-full pr-4">
                                        <el-icon class="mr-2 text-lg"><Link /></el-icon>
                                        <span class="font-bold flex-1">Webhook 3</span>
                                        <el-switch v-model="channelMap.webhook3" style="--el-switch-on-color:#2563eb;" @change="toggleChannel('webhook3')" @click.stop></el-switch>
                                    </div>
                                </template>
                                <div class="p-2">
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblServer') }}</span><el-input v-model="settingsForm.notifyConfig.webhook3.url" placeholder="https://..." size="small"></el-input></div>
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblHeaders') }}</span><el-input v-model="settingsForm.notifyConfig.webhook3.headers" type="textarea" :rows="2" placeholder="JSON" size="small"></el-input></div>
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblBody') }}</span><el-input v-model="settingsForm.notifyConfig.webhook3.body" type="textarea" :rows="2" placeholder="JSON" size="small"></el-input></div>
                                    <div class="flex justify-end mt-2"><el-button size="small" type="primary" link @click="testChannel('webhook3')" :loading="testing.webhook3">{{ t('btnTest') }}</el-button></div>
                                </div>
                            </el-collapse-item>

                            <!-- WeChat -->
                            <el-collapse-item name="wechat">
                                <template #title>
                                    <div class="flex items-center w-full pr-4">
                                        <el-icon class="mr-2 text-lg"><Message /></el-icon>
                                        <span class="font-bold flex-1">WeChat</span>
                                        <el-switch v-model="channelMap.wechat" style="--el-switch-on-color:#2563eb;" @change="toggleChannel('wechat')" @click.stop></el-switch>
                                    </div>
                                </template>
                                <div class="p-2">
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblCorpId') }}</span><el-input v-model="settingsForm.notifyConfig.wechat.corpid" placeholder="CorpID" size="small"></el-input></div>
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblSecret') }}</span><el-input v-model="settingsForm.notifyConfig.wechat.secret" placeholder="Secret" size="small"></el-input></div>
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblAgentId') }}</span><el-input v-model="settingsForm.notifyConfig.wechat.agentid" placeholder="AgentID" size="small"></el-input></div>
                                    <div class="notify-item-row"><span class="notify-label">{{ t('lblToUser') }}</span><el-input v-model="settingsForm.notifyConfig.wechat.touser" placeholder="ToUser" size="small"></el-input></div>
                                    <div class="flex justify-end mt-2"><el-button size="small" type="primary" link @click="testChannel('wechat')" :loading="testing.wechat">{{ t('btnTest') }}</el-button></div>
                                </div>
                            </el-collapse-item>
                        </el-collapse>
                    </div>
                    </div>

					<h4 class="text-xs font-bold text-blue-600 mb-4 mt-8 border-b border-gray-300 pb-2">{{ t('lblIcsTitle') }}</h4>

					<div class="mt-2">
						<div class="flex justify-between items-center mb-2">
							<span class="text-xs font-bold text-gray-500">{{ t('lblIcsUrl') }}</span>
							<el-button 
								type="primary" 
								link 
								size="small" 
								@click="resetCalendarToken" 
								:loading="loading">
								{{ t('btnResetToken') }}
							</el-button>
						</div>

						<div class="flex gap-2 w-full">
							<el-input 
								v-model="calendarUrl" 
								readonly 
								id="icsUrlInput" 
								class="flex-1">
							</el-input>
							<el-button 
								class="mecha-btn !rounded-sm" 
								@click="copyIcsUrl">
								{{ t('btnCopy') }}
							</el-button>
						</div>
					</div>

                    <h4 class="text-xs font-bold text-blue-600 mb-4 mt-8 border-b border-gray-300 pb-2 uppercase">{{ t('secData') }}</h4>
                    <div class="flex gap-4">
                        <el-button type="success" plain :icon="Download" class="flex-1 mecha-btn" @click="exportData">{{ t('btnExport') }}</el-button>
                        <el-button type="warning" plain :icon="Upload" class="flex-1 mecha-btn" @click="triggerImport">{{ t('btnImport') }}</el-button>
                        <input type="file" ref="importRef" style="display:none" accept=".json" @change="handleImportFile">
                    </div>
                </el-form>
                <template #footer><el-button @click="settingsVisible=false" size="large" class="mecha-btn">{{ t('cancel') }}</el-button><el-button type="primary" @click="saveSettings" size="large" class="mecha-btn !bg-blue-600">{{ t('saveSettings') }}</el-button></template>
            </el-dialog>

            <el-drawer v-model="historyVisible" :title="t('sysLogs')" :size="drawerSize">
                <div class="p-6" v-loading="historyLoading">
                    <div class="flex gap-2 mb-6">
                        <el-button size="default" type="primary" plain class="flex-1 mecha-btn" @click="openHistoryLogs" :icon="Search">{{ t('btnRefresh') }}</el-button>
                        <el-button size="default" type="danger" plain class="flex-1 mecha-btn" @click="clearLogs" :icon="Delete">{{ t('clearHistory') }}</el-button>
                    </div>
                    <el-timeline v-if="historyLogs.length">
                        <el-timeline-item v-for="(l,i) in historyLogs" :key="i" :timestamp="formatLogTime(l.time)" :type="getLogColor(l.actions)" placement="top" hide-timestamp>
                            <div class="text-xs text-textDim mb-2 font-mono flex justify-between">
                                <span>{{ formatLogTime(l.time) }}</span>
                                <span class="font-bold text-blue-600">{{ l.trigger }}</span>
                            </div>
                            <div class="mecha-panel p-3 !border-l-0 !shadow-none bg-body">
                                <div class="flex flex-wrap gap-2 mb-3">
                                    <span v-for="tag in l.actions" class="text-[10px] font-bold px-1.5 py-0.5 border" :class="getTagClass(tag)">{{ t('tag.'+tag) }}</span>
                                </div>
                                <div class="p-3 text-xs overflow-x-auto max-h-[300px] font-mono text-textDim">
                                    <div v-for="(line,idx) in l.content" :key="idx" class="mb-1 border-l border-border pl-2">{{line}}</div>
                                </div>
                            </div>
                        </el-timeline-item>
                    </el-timeline>
                    <el-empty v-else :description="t('noLogs')"></el-empty>
                </div>
            </el-drawer>

            <el-dialog v-model="detailsVisible" :title="t('detailsTitle')" width="500px" align-center class="!rounded-none mecha-panel" style="clip-path:polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px);">
                <div v-if="currentDetailItem" class="space-y-4">
                    <div class="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span class="text-slate-500 font-bold">{{ t('serviceName') }}</span>
                        <span class="font-bold text-textMain">{{ currentDetailItem.name }}</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span class="text-slate-500 font-bold">{{ t('lblStatus') }}</span>
                        <el-tag :type="currentDetailItem.enabled ? 'success' : 'info'" size="small">
                            {{ currentDetailItem.enabled ? t('active') : t('disabledText') }}
                        </el-tag>
                    </div>
                    <div class="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span class="text-slate-500 font-bold">{{ lang==='zh'?'类型':'Type' }}</span>
                        <span v-if="currentDetailItem.transactionType==='income'" class="text-[9px] font-bold bg-green-50 text-green-600 border border-green-200 px-1.5 py-0.5 tracking-wider whitespace-nowrap">{{ lang==='zh'?'收入':'INCOME' }}</span>
                        <span v-else class="text-[9px] font-bold bg-orange-50 text-orange-600 border border-orange-200 px-1.5 py-0.5 tracking-wider whitespace-nowrap">{{ lang==='zh'?'支出':'EXPENSE' }}</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span class="text-slate-500 font-bold">{{ lang==='zh'?'是否自动续期':'Auto Renew' }}</span>
                        <el-tag :type="currentDetailItem.autoRenew ? 'success' : 'info'" size="small">
                            {{ currentDetailItem.autoRenew ? (lang==='zh'?'是':'Yes') : (lang==='zh'?'否':'No') }}
                        </el-tag>
                    </div>
                    <div class="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span class="text-slate-500 font-bold">{{ t('lblInterval') }}</span>
                        <span class="font-mono font-bold text-textMain">
                            {{ currentDetailItem.intervalDays }} {{ t('unit.' + (currentDetailItem.cycleUnit || 'day')) }}
                        </span>
                    </div>
                    <div class="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2" v-if="currentDetailItem.amount">
                        <span class="text-slate-500 font-bold">{{ t('amount') }}</span>
                        <span class="font-mono font-bold text-blue-600">{{ currentDetailItem.amount }} {{ currentDetailItem.currency }}</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span class="text-slate-500 font-bold">{{ t('nextDue') }}</span>
                        <div class="text-right">
                            <div class="font-mono text-amber-600 font-bold">{{ currentDetailItem.nextDueDate }}</div>
                            <div v-if="currentDetailItem.useLunar && currentDetailItem.nextDueDateLunar" class="text-[10px] text-purple-600 font-bold">{{ currentDetailItem.nextDueDateLunar }}</div>
                        </div>
                    </div>
                    <div class="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span class="text-slate-500 font-bold">{{ t('lblLastRenew') }}</span>
                        <div class="text-right">
                            <div class="font-mono text-textMain font-bold">{{ currentDetailItem.lastRenewDate }}</div>
                            <div v-if="currentDetailItem.useLunar && currentDetailItem.lastRenewDateLunar" class="text-[10px] text-purple-600 font-bold">{{ currentDetailItem.lastRenewDateLunar }}</div>
                        </div>
                    </div>
                    <div class="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span class="text-slate-500 font-bold">{{ t('lblCreateDate') }}</span>
                        <span class="font-mono text-textMain font-bold">{{ currentDetailItem.createDate }}</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2" v-if="currentDetailItem.tags && currentDetailItem.tags.length">
                        <span class="text-slate-500 font-bold">{{ t('tags') }}</span>
                        <div class="flex flex-wrap gap-1">
                            <span v-for="tag in currentDetailItem.tags" :key="tag" class="tag-compact">{{ tag }}</span>
                        </div>
                    </div>
                    <div class="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2" v-if="currentDetailItem.purchaseUrl">
                        <span class="text-slate-500 font-bold">{{ t('purchaseUrl') }}</span>
                        <el-link :href="currentDetailItem.purchaseUrl" target="_blank" type="primary" :underline="false" class="font-bold">
                            {{ t('purchaseUrl') }} <el-icon class="ml-1"><Link /></el-icon>
                        </el-link>
                    </div>
                    <div class="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2" v-if="currentDetailItem.purchaseAccount">
                        <span class="text-slate-500 font-bold">{{ t('purchaseAccount') }}</span>
                        <span class="text-textMain font-mono">{{ currentDetailItem.purchaseAccount }}</span>
                    </div>
                    <div class="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2" v-if="currentDetailItem.purchasePassword">
                        <span class="text-slate-500 font-bold">{{ t('purchasePassword') }}</span>
                        <span class="text-textMain font-mono">{{ currentDetailItem.purchasePassword }}</span>
                    </div>
                    <div class="border-b border-slate-100 dark:border-slate-800 pb-2" v-if="currentDetailItem.message">
                        <div class="text-slate-500 font-bold mb-1">{{ t('note') }}</div>
                        <div class="text-textDim text-sm bg-body p-2 rounded">{{ currentDetailItem.message }}</div>
                    </div>
                </div>
                <template #footer>
                    <el-button @click="detailsVisible=false" size="large" class="mecha-btn w-full !bg-blue-600 !text-white">{{ t('cancel') }}</el-button>
                </template>
            </el-dialog>

            <el-dialog v-model="logVisible" :title="t('liveLog')" width="650px" align-center class="!rounded-none mecha-panel"><div class="terminal-window" ref="termRef"><div v-for="(line,i) in displayLogs" :key="i" class="terminal-line"><span class="typing-cursor" v-if="i===displayLogs.length-1 && checking"></span>{{ line }}</div><div v-if="checking" class="terminal-line text-blue-400">WAITING FOR RESPONSE...</div></div></el-dialog>
        </el-config-provider>
    </div>
    <script>
        const { createApp, ref, computed, onMounted, onUnmounted, nextTick, reactive,watch } = Vue;
        const { ElMessage, ElMessageBox } = ElementPlus;
        const { Edit, Delete, Plus, VideoPlay, Setting, Bell, Document, Lock, Monitor, SwitchButton, Calendar, Timer, Files, AlarmClock, Warning, Search, Cpu, Upload, Download, Link, Message, Promotion, Iphone, Moon, Sunny, RefreshRight, More, ArrowDown, View, User, Wallet, CreditCard, Money } = ElementPlusIconsVue;
        const ZhCn = window.ElementPlusLocaleZhCn || {};
        const frontendCalc = {
            l2s(l) {
                let days = 0;
                const { year, month, day, isLeap } = l;
                for (let i = 1900; i < year; i++) days += LUNAR.lYearDays(i);
                const leap = LUNAR.leapMonth(year);
                for (let i = 1; i < month; i++) {
                    days += LUNAR.monthDays(year, i);
                    if (leap > 0 && i === leap) days += LUNAR.leapDays(year);
                }
                if (isLeap) days += LUNAR.monthDays(year, month);
                days += day - 1;
                const base = new Date(Date.UTC(1900, 0, 31));
                const target = new Date(base.getTime() + days * 86400000);
                return { year: target.getUTCFullYear(), month: target.getUTCMonth() + 1, day: target.getUTCDate() };
            },
            addPeriod(l, val, unit) {
                let { year, month, day, isLeap } = l;
                if (unit === 'year') {
                    year += val;
                    const lp = LUNAR.leapMonth(year);
                    isLeap = isLeap && lp === month;
                } else if (unit === 'month') {
                    let tot = (year - 1900) * 12 + (month - 1) + val;
                    year = Math.floor(tot / 12) + 1900;
                    month = (tot % 12) + 1;
                    const lp = LUNAR.leapMonth(year);
                    isLeap = isLeap && lp === month;
                } else if (unit === 'day') {
                    const s = this.l2s(l);
                    const d = new Date(Date.UTC(s.year, s.month - 1, s.day + val));
                    return LUNAR.solar2lunar(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
                }
                let max = isLeap ? LUNAR.leapDays(year) : LUNAR.monthDays(year, month);
                let td = Math.min(day, max);
                while (td > 0) {
                    if (this.l2s({ year, month, day: td, isLeap })) return { year, month, day: td, isLeap };
                    td--;
                }
                return { year, month, day, isLeap };
            }
        };
        const messages = {
            zh: { filter:{expired:'已过期 / 今天', w7:'7天内', w30:'30天内', future:'远期(>30天)', new:'新服务 (<30天)', stable:'稳定 (1个月-1年)', long:'长期 (>1年)', m1:'最近1个月', m6:'半年内', year:'今年内', earlier:'更早以前'}, secPref: '偏好设置',manualRenew: '手动续期',tipToggle: '切换状态',tipRenew: '手动续期',tipEdit: '编辑服务',tipDelete: '删除服务',secNotify: '通知配置',secData: '数据管理',lblIcsTitle: '日历订阅',lblIcsUrl: '订阅地址 (iOS/Google)',btnCopy: '复制',btnResetToken: '重置令牌',loginTitle:'身份验证',passwordPlaceholder:'请输入访问密钥/Authorization Key',unlockBtn:'解锁终端/UNLOCK',check:'立即检查',add:'新增服务',settings:'系统设置',logs:'运行日志',logout:'安全退出',totalServices:'服务总数',expiringSoon:'即将到期',expiredAlert:'已过期 / 警告',serviceName:'服务名称',type:'类型',nextDue:'下次到期',uptime:'已运行',lastRenew:'上次续期',cyclePeriod:'周期',actions:'操作',cycle:'循环订阅',reset:'到期重置',disabled:'已停用',days:'天',daysUnit:'天',typeReset:'到期重置',typeCycle:'循环订阅',lunarCal:'农历',lbOffline:'离线',unit:{day:'天',month:'月',year:'年'},editService:'编辑服务',newService:'新增服务',formName:'名称',namePlaceholder:'例如: Netflix',formType:'模式',createDate:'创建时间',interval:'周期时长',note:'备注信息',status:'状态',active:'启用',disabledText:'禁用',cancel:'取消',save:'保存数据',saveSettings:'保存配置',settingsTitle:'系统设置',setNotify:'通知配置',pushSwitch:'推送总开关',pushUrl:'Webhook 地址',notifyThreshold:'提醒阈值',setAuto:'自动化配置',autoRenewSwitch:'自动续期',autoRenewThreshold:'自动续期阈值',autoDisableThreshold:'自动禁用阈值',daysOverdue:'天后触发',sysLogs:'系统日志',execLogs:'执行记录',clearHistory:'清空历史',noLogs:'无记录',liveLog:'实时终端',btnExport: '导出备份',btnImport: '恢复备份',btnTest: '发送测试',btnRefresh:'刷新日志',
            lblEnable: '启用', lblToken: '令牌 (Token)', lblApiKey: 'API Key', lblChatId: '会话ID', 
            lblServer: '服务器URL', lblDevKey: '设备Key', lblFrom: '发件人', lblTo: '收件人',
            lblTopic: '主题 (Topic)',
            lblNotifyTime: '提醒时间', btnResetToken: '重置令牌',
            lblHeaders: '请求头 (JSON)', lblBody: '消息体 (JSON)',
            lblCorpId: '企业ID', lblAgentId: '应用ID', lblSecret: '应用密钥', lblToUser: '用户账号',
            lblStatus: '状态', lblMode: '模式', lblInterval: '周期', lblCreateDate: '创建日期', lblLastRenew: '上次续期',
            tag:{alert:'触发提醒',renew:'自动续期',disable:'自动禁用',normal:'检查正常'},msg:{confirmRenew: '确认将 [%s] 的到期时间往后延期一个周期吗？',renewSuccess: '续期成功！日期已更新: %s -> %t',tokenReset: '令牌已重置，请更新订阅地址', copyOk: '链接已复制', exportSuccess: '备份已下载',importSuccess: '数据恢复成功，即将刷新',importFail: '导入失败，请检查文件格式',passReq:'请输入密码',saved:'保存成功',saveFail:'保存失败',cleared:'已清空',clearFail:'清空失败',loginFail:'验证失败',loadLogFail:'日志加载失败',confirmDel:'确认删除此项目?',dateError:'上次更新日期不能早于创建日期',nameReq:'服务名称不能为空',nameExist:'服务名称已存在',futureError:'上次续期不能是未来时间',serviceDisabled:'服务已停用',serviceEnabled:'服务已启用',execFinish: '执行完毕!'},tags:'标签',tagPlaceholder:'输入标签回车创建',searchPlaceholder:'搜索标题或备注...',tagsCol:'标签',tagAll:'全部',useLunar:'农历周期',lunarTip:'按农历日期计算周期',yes:'是',no:'否',timezone:'偏好时区',disabledFilter:'已停用',policyConfig:'自动化策略',policyNotify:'提醒提前期',policyAuto:'自动续期',policyRenewDay:'过期续期天数',useGlobal:'全局默认',autoRenewOnDesc:'过期自动续期',autoRenewOffDesc:'过期自动禁用',previewCalc:'根据上次续期日期和周期计算',nextDue:'下次到期',
            colDetails: '详情', amount: '续费金额', purchaseUrl: '购买地址', purchaseAccount: '购买账户', purchasePassword: '购买密码', detailsTitle: '项目详情', currency: '币种'},
            en: { filter:{expired:'Overdue/Today', w7:'Within 7 Days', w30:'Within 30 Days', future:'Future(>30d)', new:'New (<30d)', stable:'Stable (1m-1y)', long:'Long Term (>1y)', m1:'Last Month', m6:'Last 6 Months', year:'This Year', earlier:'Earlier'}, secPref: 'PREFERENCES',manualRenew: 'Quick Renew',tipToggle: 'Toggle Status',tipRenew: 'Quick Renew',tipEdit: 'Edit Service',tipDelete: 'Delete Service',secNotify: 'NOTIFICATIONS',secData: 'DATA MANAGEMENT',lblIcsTitle: 'CALENDAR SUBSCRIPTION',lblIcsUrl: 'ICS URL (iOS/Google Calendar)',btnCopy: 'COPY',btnResetToken: 'RESET TOKEN',loginTitle:'SYSTEM ACCESS',passwordPlaceholder:'Authorization Key',unlockBtn:'UNLOCK TERMINAL',check:'CHECK',add:'ADD NEW',settings:'CONFIG',logs:'LOGS',logout:'LOGOUT',totalServices:'TOTAL SERVICES',expiringSoon:'EXPIRING SOON',expiredAlert:'EXPIRED / ALERT',serviceName:'SERVICE NAME',type:'TYPE',nextDue:'NEXT DUE',uptime:'UPTIME',lastRenew:'LAST RENEW',cyclePeriod:'CYCLE',actions:'ACTIONS',cycle:'CYCLE',reset:'RESET',disabled:'DISABLED',days:'DAYS',daysUnit:'DAYS',typeReset:'RESET',typeCycle:'CYCLE',lunarCal:'Lunar',lbOffline:'OFFLINE',unit:{day:'DAY',month:'MTH',year:'YR'},editService:'EDIT SERVICE',newService:'NEW SERVICE',formName:'NAME',namePlaceholder:'e.g. Netflix',formType:'MODE',createDate:'CREATE DATE',interval:'INTERVAL',note:'NOTE',status:'STATUS',active:'ACTIVE',disabledText:'DISABLED',cancel:'CANCEL',save:'SAVE DATA',saveSettings:'SAVE CONFIG',settingsTitle:'SYSTEM CONFIG',setNotify:'NOTIFICATION',pushSwitch:'MASTER PUSH',pushUrl:'WEBHOOK URL',notifyThreshold:'ALERT THRESHOLD',setAuto:'AUTOMATION',autoRenewSwitch:'AUTO RENEW',autoRenewThreshold:'RENEW AFTER',autoDisableThreshold:'DISABLE AFTER',daysOverdue:'DAYS OVERDUE',sysLogs:'SYSTEM LOGS',execLogs:'EXECUTION LOGS',clearHistory:'CLEAR HISTORY',noLogs:'NO DATA',liveLog:'LIVE TERMINAL',btnExport: 'Export Data',btnImport: 'Import Data',btnTest: 'Send Test',btnRefresh:'REFRESH',
            lblEnable: 'Enable', lblToken: 'Token', lblApiKey: 'API Key', lblChatId: 'Chat ID', 
            lblServer: 'Server URL', lblDevKey: 'Device Key', lblFrom: 'From Email', lblTo: 'To Email',
            lblTopic: 'Topic',
            lblNotifyTime: 'Alarm Time', btnResetToken: 'RESET TOKEN',
            lblHeaders: 'Headers (JSON)', lblBody: 'Body (JSON)',
            lblCorpId: 'CorpID', lblAgentId: 'AgentID', lblSecret: 'Secret', lblToUser: 'ToUser',
            lblStatus: 'Status', lblMode: 'Mode', lblInterval: 'Interval', lblCreateDate: 'Create Date', lblLastRenew: 'Last Renew',
            tag:{alert:'ALERT',renew:'RENEWED',disable:'DISABLED',normal:'NORMAL'},msg:{confirmRenew: 'Confirm to extend [%s] expiration date by one cycle?',renewSuccess: 'Renewed! Date updated: %s -> %t',tokenReset: 'Token Reset. Update your calendar apps.', copyOk: 'Link Copied', exportSuccess: 'Backup Downloaded',importSuccess: 'Restore Success, Refreshing...',importFail: 'Import Failed, Check File Format',passReq:'Password Required',saved:'Data Saved',saveFail:'Save Failed',cleared:'Cleared',clearFail:'Clear Failed',loginFail:'Access Denied',loadLogFail:'Load Failed',confirmDel:'Confirm Delete?',dateError:'Last renew date cannot be earlier than create date',nameReq:'Name Required',nameExist:'Name already exists',futureError:'Renew date cannot be in the future',serviceDisabled:'Service Disabled',serviceEnabled:'Service Enabled',execFinish: 'EXECUTION FINISHED!'},tags:'TAGS',tagPlaceholder:'Press Enter to create tag',searchPlaceholder:'Search...',tagsCol:'TAGS',tagAll:'ALL',useLunar:'Lunar Cycle',lunarTip:'Calculate based on Lunar calendar',yes:'Yes',no:'No',timezone:'Timezone',disabledFilter:'DISABLED',policyConfig:'Policy Config',policyNotify:'Notify Days',policyAuto:'Auto Renew',policyRenewDay:'Renew Days',useGlobal:'Global Default',autoRenewOnDesc:'Auto Renew when overdue',autoRenewOffDesc:'Auto Disable when overdue',previewCalc:'Based on Last Renew Date & Interval',nextDue:'NEXT DUE',
            colDetails: 'Details', amount: 'Amount', purchaseUrl: 'Purchase URL', purchaseAccount: 'Account', purchasePassword: 'Password', detailsTitle: 'SERVICE DETAILS', currency: 'Currency'}
        };
        const LUNAR={info:[0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,0x05aa0,0x076a3,0x096d0,0x04bd7,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,0x0a2e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a2d0,0x0d150,0x0f252,0x0d520],gan:'甲乙丙丁戊己庚辛壬癸'.split(''),zhi:'子丑寅卯辰巳午未申酉戌亥'.split(''),months:'正二三四五六七八九十冬腊'.split(''),days:'初一,初二,初三,初四,初五,初六,初七,初八,初九,初十,十一,十二,十三,十四,十五,十六,十七,十八,十九,二十,廿一,廿二,廿三,廿四,廿五,廿六,廿七,廿八,廿九,三十'.split(','),lYearDays(y){let s=348;for(let i=0x8000;i>0x8;i>>=1)s+=(this.info[y-1900]&i)?1:0;return s+this.leapDays(y)},leapDays(y){if(this.leapMonth(y))return(this.info[y-1900]&0x10000)?30:29;return 0},leapMonth(y){return this.info[y-1900]&0xf},monthDays(y,m){return(this.info[y-1900]&(0x10000>>m))?30:29},solar2lunar(y,m,d){if(y<1900||y>2100)return null;const base=new Date(1900,0,31),obj=new Date(y,m-1,d);let offset=Math.round((obj-base)/86400000);let ly=1900,temp=0;for(;ly<2101&&offset>0;ly++){temp=this.lYearDays(ly);offset-=temp}if(offset<0){offset+=temp;ly--}let lm=1,leap=this.leapMonth(ly),isLeap=false;for(;lm<13&&offset>0;lm++){if(leap>0&&lm===(leap+1)&&!isLeap){--lm;isLeap=true;temp=this.leapDays(ly)}else{temp=this.monthDays(ly,lm)}if(isLeap&&lm===(leap+1))isLeap=false;offset-=temp}if(offset===0&&leap>0&&lm===leap+1){if(isLeap)isLeap=false;else{isLeap=true;--lm}}if(offset<0){offset+=temp;--lm}const ld=offset+1,gIdx=(ly-4)%10,zIdx=(ly-4)%12;const yStr=this.gan[gIdx<0?gIdx+10:gIdx]+this.zhi[zIdx<0?zIdx+12:zIdx];const mStr=(isLeap?'闰':'')+this.months[lm-1]+'月';return{year:ly,month:lm,day:ld,isLeap,yearStr:yStr,monthStr:mStr,dayStr:this.days[ld-1],fullStr:yStr+'年'+mStr+this.days[ld-1]}}};
        
        // 本地时间解析函数，防止时区偏差
        const parseYMD = (s) => { 
            if(!s) return new Date(); 
            const p = s.split('-'); 
            return new Date(p[0], p[1]-1, p[2]); 
        };
        
        // 格式化日期为 YYYY-MM-DD
        const toYMD = (date) => {
            if (!date) return '';
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return year + '-' + month + '-' + day;
        };

        createApp({
            setup() {
                const isLoggedIn = ref(!!localStorage.getItem('jwt_token')), password = ref(''), loading = ref(false), list = ref([]), settings = ref({});
                const dataVersion = ref(0); // 新增版本号状态
                const dialogVisible = ref(false), settingsVisible = ref(false), historyVisible = ref(false), historyLoading = ref(false), historyLogs = ref([]), detailsVisible = ref(false), currentDetailItem = ref(null);
                const showDetails = (item) => { currentDetailItem.value = item; detailsVisible.value = true; };
                const checking = ref(false), logs = ref([]), displayLogs = ref([]), isEdit = ref(false), lang = ref('zh'), currentTag = ref('');
                const locale = ref(ZhCn), tableKey = ref(0), termRef = ref(null);
                const form = ref({ id:'', name:'', createDate:'', lastRenewDate:'', intervalDays:30, cycleUnit:'day', type:'cycle', message:'', enabled:true, tags:[], useLunar:false, notifyDays:3, notifyTime: '08:00', autoRenew:false, autoRenewDays:3, amount: 0, currency: 'CNY', transactionType: 'expense', nextDueDate: '', purchaseUrl: '', purchaseAccount: '', purchasePassword: '' });
                const settingsForm = ref({ 
                    notifyUrl:'', 
                    enableNotify:true, 
                    autoDisableDays:30, 
                    timezone:'Asia/Shanghai',
                    enabledChannels: [],
                    notifyConfig: { telegram: {}, bark: {}, pushplus: {}, notifyx: {}, resend: {}, webhook: {}, webhook2: {}, webhook3: {}, gotify: {}, ntfy: {}, wechat: {} },
                    calendarToken: ''
                });
                const channelMap = reactive({ telegram:false, bark:false, pushplus:false, notifyx:false, resend:false, webhook:false, webhook2:false, webhook3:false, gotify:false, ntfy:false, wechat:false });
                const testing = reactive({ telegram:false, bark:false, pushplus:false, notifyx:false, resend:false, webhook:false, webhook2:false, webhook3:false, gotify:false, ntfy:false, wechat:false });
                const expandedChannels = ref('');
                
                // Dark Mode State
                const isDark = ref(document.documentElement.classList.contains('dark'));
                const toggleTheme = () => {
                    isDark.value = !isDark.value;
                    if (isDark.value) {
                        document.documentElement.classList.add('dark');
                        localStorage.setItem('theme', 'dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                        localStorage.setItem('theme', 'light');
                    }
                };
                
                // Responsive Drawer
                const windowWidth = ref(window.innerWidth);
                const updateWidth = () => windowWidth.value = window.innerWidth;
                const drawerSize = computed(() => windowWidth.value < 640 ? '100%' : '600px'); // 640px matching tailwind sm
                const actionColWidth = computed(() => windowWidth.value < 640 ? 100 : 180);
                // 从localStorage恢复排序状态
                const savedSortState = localStorage.getItem('tableSortState');
                const sortState = ref(savedSortState ? JSON.parse(savedSortState) : { prop: 'daysLeft', order: 'ascending' });
                const filterState = ref({});
                const handleSortChange = ({ prop, order }) => { 
                    sortState.value = { prop, order }; 
                    // 保存到localStorage
                    localStorage.setItem('tableSortState', JSON.stringify({ prop, order }));
                };
                const handleFilterChange = (filters) => { filterState.value = { ...filterState.value, ...filters }; };
                const nextDueFilters = computed(() => [
                    { text: t('filter.expired'), value: 'expired' },
                    { text: t('filter.w7'), value: 'w7' },
                    { text: t('filter.w30'), value: 'w30' },
                    { text: t('filter.future'), value: 'future' }
                ]);
                const typeFilters = computed(() => [
                    { text: t('typeCycle'), value: 'cycle' },
                    { text: t('typeReset'), value: 'reset' }
                ]);
                const uptimeFilters = computed(() => [
                    { text: t('filter.new'), value: 'new' },
                    { text: t('filter.stable'), value: 'stable' },
                    { text: t('filter.long'), value: 'long' }
                ]);
                const lastRenewFilters = computed(() => [
                    { text: t('filter.m1'), value: 'm1' },
                    { text: t('filter.m6'), value: 'm6' },
                    { text: t('filter.year'), value: 'year' },
                    { text: t('filter.earlier'), value: 'earlier' }
                ]);
                const t = (k) => { let v=messages[lang.value]; k.split('.').forEach(p=>v=v?v[p]:k); return v||k; };
                const expiringCount = computed(() => list.value.filter(i => i.enabled && i.daysLeft>0 && i.daysLeft<=((typeof i.notifyDays==='number')?i.notifyDays:3)).length);
                const expiredCount = computed(() => list.value.filter(i => i.enabled && i.daysLeft<=0).length);
                const disabledCount = computed(() => list.value.filter(i => !i.enabled).length);
                const allTags = computed(() => { const s=new Set(); list.value.forEach(i=>(i.tags||[]).forEach(t=>s.add(t))); return Array.from(s).sort(); });
                const filteredList = computed(() => {
                    let r = list.value;
                    if (currentTag.value === 'DISABLED') r = r.filter(i => !i.enabled);
                    else if (currentTag.value) r = r.filter(i => (i.tags||[]).includes(currentTag.value));

                    if (filterState.value.daysLeft && filterState.value.daysLeft.length > 0) {
                        const fv = filterState.value.daysLeft;
                        r = r.filter(row => {
                            const d = row.daysLeft;
                            return fv.some(v => {
                                if (v === 'expired') return d <= 0;
                                if (v === 'w7') return d > 0 && d <= 7;
                                if (v === 'w30') return d > 7 && d <= 30;
                                if (v === 'future') return d > 30;
                                return false;
                            });
                        });
                    }

                    if (filterState.value.type && filterState.value.type.length > 0) {
                        const fv = filterState.value.type;
                        r = r.filter(row => fv.includes(row.type));
                    }

                    if (filterState.value.serviceDays && filterState.value.serviceDays.length > 0) {
                        const fv = filterState.value.serviceDays;
                        r = r.filter(row => {
                            const d = row.serviceDays;
                            return fv.some(v => {
                                if (v === 'new') return d < 30;
                                if (v === 'stable') return d >= 30 && d <= 365;
                                if (v === 'long') return d > 365;
                                return false;
                            });
                        });
                    }

                    if (filterState.value.lastRenewDate && filterState.value.lastRenewDate.length > 0) {
                        const fv = filterState.value.lastRenewDate;
                        const now = new Date();
                        const todayStr = getLocalToday();
                        r = r.filter(row => {
                            const rd = new Date(row.lastRenewDate);
                            const diffDays = (now - rd) / (1000 * 3600 * 24);
                            return fv.some(v => {
                                if (v === 'm1') return diffDays <= 30;
                                if (v === 'm6') return diffDays <= 180;
                                if (v === 'year') return rd.getFullYear() === now.getFullYear();
                                if (v === 'earlier') return diffDays > 180;
                                return false;
                            });
                        });
                    }

                    if (sortState.value.prop && sortState.value.order) {
                        const { prop, order } = sortState.value;
                        const k = order === 'ascending' ? 1 : -1;
                        r = [...r].sort((a,b) => {
                            if (a[prop] > b[prop]) return k;
                            if (a[prop] < b[prop]) return -k;
                            return 0;
                        });
                    }

                    return r;
                });

                onMounted(() => {

                    const savedTheme = localStorage.getItem('theme');

                    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (savedTheme === 'dark' || (!savedTheme && sysDark)) {
                        isDark.value = true;
                        document.documentElement.classList.add('dark');
                    } else {
                        isDark.value = false;
                        document.documentElement.classList.remove('dark');
                    }

                    const l = localStorage.getItem('lang'); if(l) setLang(l);
                    const tk = localStorage.getItem('jwt_token'); if(tk) fetchList(tk);
                    
                    window.addEventListener('resize', updateWidth);
                });

                onUnmounted(() => {
                    window.removeEventListener('resize', updateWidth);
                });

                const setLang = (l) => { lang.value=l; localStorage.setItem('lang',l); locale.value=(l==='zh'?ZhCn:null); };
                const toggleLang = async () => { setLang(lang.value==='zh'?'en':'zh'); settings.value.language=lang.value; await saveData(null,settings.value); };
                const login = async () => {
                    if(!password.value) return ElMessage.warning(t('msg.passReq')); loading.value=true;
                    try {
                        const r=await fetch('/api/login',{method:'POST',body:JSON.stringify({password:password.value})});
                        const d=await r.json();
                        if(r.ok&&d.token){ localStorage.setItem('jwt_token',d.token); fetchList(d.token); } else throw new Error(t('msg.loginFail'));
                    } catch(e) { ElMessage.error(e.message); loading.value=false; }
                };
                const logout = () => { localStorage.removeItem('jwt_token'); isLoggedIn.value=false; password.value=''; };
                const getAuth = () => ({ 'Authorization': 'Bearer '+localStorage.getItem('jwt_token') });
                const fetchList = async (tk) => {
                    loading.value = true;
                    try {
                        const r = await fetch('/api/list', { headers: tk ? { 'Authorization': 'Bearer ' + tk } : getAuth() });
                        
                        // 1. 处理 401 认证失败
                        if (r.status === 401) throw new Error(t('msg.loginFail'));
                        
                        const d = await r.json();

                        // 2. 【核心修复】检查 d.data 是否存在
                        // 如果后端报错(500/429等)，d.data 是 undefined，直接读取 items 会报错
                        if (!d.data) {
                            throw new Error(d.msg || 'Server Error / Load Failed');
                        }

                        list.value = d.data.items;
                        settings.value = d.data.settings;
                        dataVersion.value = d.data.version || 0;

                        if (settings.value.language) setLang(settings.value.language);
                        isLoggedIn.value = true;
                    } catch (e) {
                        ElMessage.error(e.message);
                        if (e.message === t('msg.loginFail')) logout();
                    } finally {
                        loading.value = false;
                    }
                };

                const saveData = async (items, set, msg=true) => {
                    loading.value=true; try {
                        // 【新增】Payload 中加入 version
                        const payload={ 
                            items:items||list.value, 
                            settings:set||settings.value,
                            version: dataVersion.value 
                        }; 
                        payload.settings.language=lang.value;

                        const res = await fetch('/api/save',{method:'POST',headers:{...getAuth(),'Content-Type':'application/json'},body:JSON.stringify(payload)});

                        // 【新增】处理冲突 (409)
                        if (res.status === 409) {
                            // 弹出对话框，强制用户刷新
                            await ElMessageBox.alert(
                                lang.value === 'zh' ? '数据版本冲突！后台系统（或自动续期）已修改了数据。请刷新页面后重试。' : 'Data Conflict! Data has been modified by system or another session. Please refresh.',
                                'Sync Error',
                                { confirmButtonText: 'OK', type: 'error' }
                            );
                            await fetchList(); // 自动刷新
                            return; // 中止后续流程
                        }

                        if (!res.ok) throw new Error('Save Failed');

                        const d = await res.json();
                        // 【新增】保存成功后更新本地版本号，避免连续保存报错
                        if (d.version) dataVersion.value = d.version;

                        if(msg) ElMessage.success(t('msg.saved')); 
                        // 成功后通常不需要重新 fetchList，因为本地已经是新的，除非为了通过 fetchList 更新计算属性
                        await fetchList(); 

                    } catch(e) { 
                        if (e !== 'cancel') ElMessage.error(t('msg.saveFail')); 
                    } finally { loading.value=false; }
                };

                const getLocalToday = () => { try { const tz = settings.value.timezone || 'Asia/Shanghai'; return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); } catch(e) { return new Date().toISOString().split('T')[0]; } };

                // 计算下次到期日期的辅助函数
                const calculateNextDueDate = (baseDate, intervalDays, cycleUnit, useLunar) => {
                    if (!baseDate || !intervalDays) return null;
                    const baseObj = parseYMD(baseDate);
                    const interval = Number(intervalDays);
                    const unit = cycleUnit || 'day';
                    let nextDate;

                    if (useLunar) {
                        const l = LUNAR.solar2lunar(
                            baseObj.getFullYear(),
                            baseObj.getMonth() + 1,
                            baseObj.getDate()
                        );
                        if (l) {
                            const nl = frontendCalc.addPeriod({ year: l.year, month: l.month, day: l.day, isLeap: l.isLeap }, interval, unit);
                            const ns = frontendCalc.l2s(nl);
                            nextDate = new Date(Date.UTC(ns.year, ns.month - 1, ns.day));
                        } else {
                            nextDate = new Date(baseObj);
                            if (unit === 'year') {
                                nextDate.setFullYear(nextDate.getFullYear() + interval);
                            } else if (unit === 'month') {
                                nextDate.setMonth(nextDate.getMonth() + interval);
                            } else {
                                nextDate.setDate(nextDate.getDate() + interval);
                            }
                        }
                    } else {
                        nextDate = new Date(baseObj);
                        if (unit === 'year') {
                            nextDate.setFullYear(nextDate.getFullYear() + interval);
                        } else if (unit === 'month') {
                            nextDate.setMonth(nextDate.getMonth() + interval);
                        } else {
                            nextDate.setDate(nextDate.getDate() + interval);
                        }
                    }
                    return toYMD(nextDate);
                };

                const saveItem = async () => {
                    if(!form.value.name.trim()) return ElMessage.error(t('msg.nameReq'));
                    if(list.value.some(i=>i.name.toLowerCase()===form.value.name.toLowerCase() && i.id!==form.value.id)) return ElMessage.error(t('msg.nameExist'));
                    if(form.value.lastRenewDate < form.value.createDate) return ElMessage.error(t('msg.dateError'));
                    if(form.value.lastRenewDate > getLocalToday()) return ElMessage.error(t('msg.futureError'));
                    
                    // 如果是新增，或者编辑时没有 nextDueDate，则基于 lastRenewDate 计算 nextDueDate
                    if (!isEdit.value || !form.value.nextDueDate) {
                        const calculatedNextDue = calculateNextDueDate(
                            form.value.lastRenewDate,
                            form.value.intervalDays,
                            form.value.cycleUnit,
                            form.value.useLunar
                        );
                        if (calculatedNextDue) {
                            form.value.nextDueDate = calculatedNextDue;
                        }
                    }
                    
                    let newList=[...list.value];
                    if(isEdit.value) { const i=newList.findIndex(x=>x.id===form.value.id); if(i!==-1) newList[i]=form.value; }
                    else newList.push(form.value);
                    list.value=newList; dialogVisible.value=false; tableKey.value++; await saveData(newList, null);
                };

                const toggleEnable = async (row) => { await saveData(null, null, false); tableKey.value++; row.enabled ? ElMessage.success(t('msg.serviceEnabled')) : ElMessage.warning(t('msg.serviceDisabled')); };

                const deleteItem = async (row) => {
                    const nl = list.value.filter(i => i.id !== row.id);
                    await saveData(nl, null);
                    list.value = nl;
                    tableKey.value++;
                };
                const confirmDelete = (row) => {
                     ElMessageBox.confirm(
                        t('msg.confirmDel'),
                        t('tipDelete'),
                        { confirmButtonText: t('yes'), cancelButtonText: t('no'), type: 'warning' }
                    ).then(() => {
                        deleteItem(row);
                    }).catch(() => {});
                };
                const confirmRenew = (row) => {
                    ElMessageBox.confirm(
                        t('msg.confirmRenew').replace('%s', row.name),
                        t('manualRenew'),
                        { confirmButtonText: t('yes'), cancelButtonText: t('no'), type: 'warning' }
                    ).then(() => {
                        manualRenew(row);
                    }).catch(() => {});
                };
                
                const logVisible = ref(false);
                const runCheck = async () => { 
                    checking.value = true; 
                    logVisible.value = true; 
                    displayLogs.value = []; 
                    try {
                        const r = await fetch('/api/check', { method: 'POST', headers: getAuth(), body: JSON.stringify({ lang: lang.value }) });
                        const d = await r.json(); 
                        
                        // 1. 循环显示日志动画
                        for (const line of d.logs) {
                            displayLogs.value.push(line);
                            await new Promise(res => setTimeout(res, 30)); 
                            if (termRef.value) termRef.value.scrollTop = termRef.value.scrollHeight;
                        }
                        await new Promise(res => setTimeout(res, 200)); 
                        displayLogs.value.push(\`[SYSTEM] \${t('msg.execFinish')}\`);
                        if (termRef.value) termRef.value.scrollTop = termRef.value.scrollHeight;

                        // ================== 【这里是修改点】 ==================
                        // 原来的代码是：if (d.data) { list.value = d.data; tableKey.value++; }
                        // 现在的代码（请使用下面这一行）：
                        await fetchList(); 
                        // ====================================================

                    } catch(e) { 
                        displayLogs.value.push("ERR: " + e.message); 
                    } finally { 
                        checking.value = false; 
                    } 
                };
                const formatLogTime = (isoStr) => {
                    if (!isoStr) return '';
                    try {
                        const tz = settings.value.timezone || 'Asia/Shanghai';
                        const date = new Date(isoStr);
                        const timeStr = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(date).replace(', ', ' ');
                        const offsetPart = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(date).find(p => p.type === 'timeZoneName').value;
                        const utcOffset = offsetPart.replace('GMT', 'UTC');
                        return \`\${timeStr} \${utcOffset}\`;
                    } catch (e) { return isoStr; }
                };                

                const openAdd = () => { isEdit.value=false; const d=getLocalToday(); form.value={id:Date.now().toString(),name:'',createDate:d,lastRenewDate:d,intervalDays:30,cycleUnit:'day',type:'cycle',enabled:true,tags:[],useLunar:false, notifyDays:3, notifyTime: '08:00', autoRenew:false, autoRenewDays:3, amount: 0, currency: 'CNY', transactionType: 'expense', nextDueDate: '', purchaseUrl: '', purchaseAccount: '', purchasePassword: ''}; dialogVisible.value=true; };
                const editItem = (row) => { 
                    isEdit.value=true; 
                    form.value={
                        ...row,
                        type:row.type||'cycle',
                        cycleUnit:row.cycleUnit||'day',
                        tags:[...(row.tags||[])],
                        useLunar:!!row.useLunar, 
                        notifyDays:(row.notifyDays!==undefined?row.notifyDays:3), 
                        notifyTime: (row.notifyTime || '08:00'), 
                        autoRenew:row.autoRenew!==false, 
                        autoRenewDays:(row.autoRenewDays!==undefined?row.autoRenewDays:3), 
                        amount: row.amount || 0, 
                        currency: row.currency || 'CNY', 
                        transactionType: row.transactionType || 'expense', 
                        purchaseUrl: row.purchaseUrl || '', 
                        purchaseAccount: row.purchaseAccount || '', 
                        purchasePassword: row.purchasePassword || '',
                        nextDueDate: row.nextDueDate || '' // 确保 nextDueDate 被正确传递
                    }; 
                    dialogVisible.value=true; 
                };
                const openSettings = () => { 
                    settingsForm.value = JSON.parse(JSON.stringify(settings.value)); 
                    // 确保 notifyConfig 中的所有渠道都初始化
                    if (!settingsForm.value.notifyConfig) settingsForm.value.notifyConfig = {};
                    const defaultChannels = ['telegram', 'bark', 'pushplus', 'notifyx', 'resend', 'webhook', 'webhook2', 'webhook3', 'gotify', 'ntfy', 'wechat'];
                    defaultChannels.forEach(ch => {
                        if (!settingsForm.value.notifyConfig[ch]) settingsForm.value.notifyConfig[ch] = {};
                    });
                    const chans = settingsForm.value.enabledChannels || [];
                    Object.keys(channelMap).forEach(k => channelMap[k] = chans.includes(k));
                    settingsVisible.value=true; 
                };
                const saveSettings = async () => { 
                    settingsForm.value.enabledChannels = Object.keys(channelMap).filter(k => channelMap[k]);
                    settings.value={...settingsForm.value}; 
                    await saveData(null,settings.value); 
                    settingsVisible.value=false; 
                };
                const toggleChannel = (ch) => {};

                const testChannel = async (ch) => {
                    testing[ch] = true;
                    try {
                        const r = await fetch('/api/test-notify', { 
                            method: 'POST', 
                            headers: getAuth(), 
                            body: JSON.stringify({ channel: ch, config: settingsForm.value.notifyConfig[ch] }) 
                        });
                        const d = await r.json();
                        if (r.ok) ElMessage.success(\`\${ch.toUpperCase()} TEST OK\`);
                        else ElMessage.error(\`TEST FAIL: \${d.msg}\`);
                    } catch(e) { ElMessage.error(e.message); }
                    finally { testing[ch] = false; }
                };

                const calendarUrl = computed(() => {
                    const origin = window.location.origin;
                    const token = settingsForm.value.calendarToken || settings.value.calendarToken || '';
                    return token ? \`\${origin}/api/calendar.ics?token=\${token}\` : 'Save settings to generate URL...';
                });

                const copyIcsUrl = () => {
                    navigator.clipboard.writeText(calendarUrl.value).then(() => {
                        ElMessage.success(t('msg.copyOk'));
                    });
                };

                const resetCalendarToken = async () => {
                    try {
                        await ElMessageBox.confirm(
                            lang.value === 'zh' ? '重置将导致所有现有日历订阅失效，是否继续？' : 'Resetting invalidates all existing calendar subscriptions. Continue?',
                            'Warning', { type: 'warning', confirmButtonText: t('yes'), cancelButtonText: t('no') }
                        );
                        settingsForm.value.calendarToken = crypto.randomUUID();
                        await saveSettings(); 
                        ElMessage.success(t('msg.tokenReset'));
                    } catch {}
                };

                const clearLogs = async () => { await fetch('/api/logs/clear',{method:'POST',headers:getAuth()}); historyLogs.value=[]; ElMessage.success(t('msg.cleared')); };
                const openHistoryLogs = async () => { historyVisible.value=true; historyLoading.value=true; try { historyLogs.value=(await(await fetch('/api/logs',{headers:getAuth()})).json()).data; } finally { historyLoading.value=false; } };

                const getDaysClass = (d) => d<=0?'text-red-500 font-black':(d<=7?'text-amber-500 font-bold':'text-blue-600 font-bold');
                const formatDaysLeft = (d) => d===0?(lang.value==='zh'?'今天':'TODAY'):(d<0?(lang.value==='zh'?'过期 ':'OVERDUE ')+Math.abs(d)+(lang.value==='zh'?' 天':'DAYS'):d+(lang.value==='zh'?' 天':' DAYS'));
                const getTagClass = (t) => ({alert:'border-red-200 text-red-600 bg-red-50',renew:'border-amber-200 text-amber-600 bg-amber-50',disable:'border-gray-200 text-gray-500 bg-gray-50',normal:'border-blue-200 text-blue-600 bg-blue-50'}[t]||'border-blue-200 text-blue-600 bg-blue-50');
                const getLogColor = (a) => (a&&a.includes('alert')?'danger':(a&&a.includes('renew')?'warning':(a&&a.includes('disable')?'info':'success')));
                const tableRowClassName = ({row}) => row.enabled===false?'disabled-row':'';

                const getLunarStr = (s) => { const d=parseYMD(s); const l=LUNAR.solar2lunar(d.getFullYear(),d.getMonth()+1,d.getDate()); return l ? ('农历: ' + l.fullStr) : ''; };

                const getLunarTooltip = (c) => { 
                    if(!c || !c.date) return ''; 
                    const l=LUNAR.solar2lunar(c.date.getFullYear(),c.date.getMonth()+1,c.date.getDate()); 
                    return l ? l.fullStr : ''; 
                };

                const getSmartLunarText = (c) => { 
                    if(!c || !c.date) return ''; 
                    const l=LUNAR.solar2lunar(c.date.getFullYear(),c.date.getMonth()+1,c.date.getDate()); 
                    return l ? (l.day===1 ? l.monthStr : l.dayStr) : ''; 
                };
                const getYearGanZhi = (t) => { const y=parseInt(t); if(isNaN(y))return ''; const g=(y-4)%10,z=(y-4)%12; return '甲乙丙丁戊己庚辛壬癸'.split('')[g<0?g+10:g]+'子丑寅卯辰巳午未申酉戌亥'.split('')[z<0?z+12:z]+'年'; };
                const getMonthStr = (t) => { const m=Number(t); return lang.value==='zh'?(m+1)+'月':['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m]; };
                const getTagCount = (t) => list.value.filter(i=>(i.tags||[]).includes(t)).length;

                const manualRenew = async (row) => {
                    // 基于 nextDueDate 往后推一个周期
                    const nextDueDateObj = parseYMD(row.nextDueDate);
                    const interval = Number(row.intervalDays);
                    const unit = row.cycleUnit || 'day';
                    let newNextDueDate;

                    if (row.useLunar) {
                        const l = LUNAR.solar2lunar(
                            nextDueDateObj.getFullYear(),
                            nextDueDateObj.getMonth() + 1,
                            nextDueDateObj.getDate()
                        );
                        if (l) {
                            const nl = frontendCalc.addPeriod({ year: l.year, month: l.month, day: l.day, isLeap: l.isLeap }, interval, unit);
                            const ns = frontendCalc.l2s(nl);
                            newNextDueDate = new Date(Date.UTC(ns.year, ns.month - 1, ns.day));
                        } else {
                            newNextDueDate = new Date(nextDueDateObj);
                            if (unit === 'year') {
                                newNextDueDate.setFullYear(newNextDueDate.getFullYear() + interval);
                            } else if (unit === 'month') {
                                newNextDueDate.setMonth(newNextDueDate.getMonth() + interval);
                            } else {
                                newNextDueDate.setDate(newNextDueDate.getDate() + interval);
                            }
                        }
                    } else {
                        newNextDueDate = new Date(nextDueDateObj);
                        if (unit === 'year') {
                            newNextDueDate.setFullYear(newNextDueDate.getFullYear() + interval);
                        } else if (unit === 'month') {
                            newNextDueDate.setMonth(newNextDueDate.getMonth() + interval);
                        } else {
                            newNextDueDate.setDate(newNextDueDate.getDate() + interval);
                        }
                    }

                    const oldNextDueDate = row.nextDueDate;
                    const todayStr = getLocalToday();
                    
                    // 更新 nextDueDate，同时更新 lastRenewDate 作为记录
                    row.nextDueDate = toYMD(newNextDueDate);
                    row.lastRenewDate = todayStr; // 记录续期日期为今天

                    // 保存数据
                    await saveData(null, null, false);
                    
                    // 刷新列表以更新显示
                    await fetchList();

                    tableKey.value++; 
                    ElMessage.success((lang.value === 'zh' ? '续期成功！下次到期日已更新: ' : 'Renewed! Next due date updated: ') + oldNextDueDate + ' -> ' + row.nextDueDate);
                };

                const timezoneList = [
                    { label: 'UTC (世界协调时间)', value: 'UTC' },
                    { label: 'Asia/Shanghai (中国上海/北京)', value: 'Asia/Shanghai' },
                    { label: 'Asia/Hong_Kong (中国香港)', value: 'Asia/Hong_Kong' },
                    { label: 'Asia/Taipei (中国台北)', value: 'Asia/Taipei' },
                    { label: 'Asia/Tokyo (日本东京)', value: 'Asia/Tokyo' },
                    { label: 'Asia/Seoul (韩国首尔)', value: 'Asia/Seoul' },
                    { label: 'Asia/Singapore (新加坡)', value: 'Asia/Singapore' },
                    { label: 'Asia/Bangkok (泰国曼谷)', value: 'Asia/Bangkok' },
                    { label: 'Asia/Dubai (阿联酋迪拜)', value: 'Asia/Dubai' },
                    { label: 'Asia/Kolkata (印度加尔各答)', value: 'Asia/Kolkata' },
                    { label: 'Europe/London (英国伦敦)', value: 'Europe/London' },
                    { label: 'Europe/Paris (法国巴黎)', value: 'Europe/Paris' },
                    { label: 'Europe/Berlin (德国柏林)', value: 'Europe/Berlin' },
                    { label: 'Europe/Moscow (俄罗斯莫斯科)', value: 'Europe/Moscow' },
                    { label: 'Europe/Amsterdam (荷兰阿姆斯特丹)', value: 'Europe/Amsterdam' },
                    { label: 'America/New_York (美国纽约)', value: 'America/New_York' },
                    { label: 'America/Chicago (美国芝加哥)', value: 'America/Chicago' },
                    { label: 'America/Los_Angeles (美国洛杉矶)', value: 'America/Los_Angeles' },
                    { label: 'America/Toronto (加拿大力伦多)', value: 'America/Toronto' },
                    { label: 'America/Vancouver (加拿大温哥华)', value: 'America/Vancouver' },
                    { label: 'America/Sao_Paulo (巴西圣保罗)', value: 'America/Sao_Paulo' },
                    { label: 'Australia/Sydney (澳大利亚悉尼)', value: 'Australia/Sydney' },
                    { label: 'Pacific/Auckland (新西兰奥克兰)', value: 'Pacific/Auckland' }
                ];

                const previewData = computed(() => {
                    const { lastRenewDate, intervalDays, cycleUnit, useLunar } = form.value;
                    if (!lastRenewDate || !intervalDays) return null;
                    
                    try {
                        let nextDateUTC;

                        // --- 步骤 1: 计算“下一次到期日” (纯日期运算，使用 UTC 避免偏差) ---
                        if (useLunar) {
                            const p = lastRenewDate.split('-');
                            const y = parseInt(p[0]), m = parseInt(p[1]), d = parseInt(p[2]);
                            const l = LUNAR.solar2lunar(y, m, d);
                            const nl = frontendCalc.addPeriod({ year: l.year, month: l.month, day: l.day, isLeap: l.isLeap }, intervalDays, cycleUnit);
                            const ns = frontendCalc.l2s(nl);
                            nextDateUTC = new Date(Date.UTC(ns.year, ns.month - 1, ns.day));
                        } else {
                            const p = lastRenewDate.split('-');
                            nextDateUTC = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));

                            if (cycleUnit === 'day') nextDateUTC.setUTCDate(nextDateUTC.getUTCDate() + intervalDays);
                            else if (cycleUnit === 'month') nextDateUTC.setUTCMonth(nextDateUTC.getUTCMonth() + intervalDays);
                            else if (cycleUnit === 'year') nextDateUTC.setUTCFullYear(nextDateUTC.getUTCFullYear() + intervalDays);
                        }
                        const nextStr = nextDateUTC.toISOString().split('T')[0];

                        // --- 步骤 2: 获取“用户偏好时区”的“今天” ---
                        let todayInUserTzStr;
                        try {
                            const userTz = settings.value.timezone || 'Asia/Shanghai';
                            // 使用 Intl 格式化出用户时区的 YYYY-MM-DD
                            const fmt = new Intl.DateTimeFormat('en-CA', { 
                                timeZone: userTz, 
                                year: 'numeric', month: '2-digit', day: '2-digit' 
                            });
                            todayInUserTzStr = fmt.format(new Date());
                        } catch (e) {
                            // 降级处理
                            todayInUserTzStr = new Date().toISOString().split('T')[0];
                        }

                        // --- 步骤 3: 计算差值 (统一转成 UTC 0点相减，消除时分秒干扰) ---
                        const pToday = todayInUserTzStr.split('-');
                        const todayUTC = new Date(Date.UTC(+pToday[0], +pToday[1]-1, +pToday[2]));

                        // 计算毫秒差 -> 天数
                        const diff = Math.round((nextDateUTC - todayUTC) / (1000 * 3600 * 24));
                        
                        const diffStr = (lang.value === 'zh' ? '距今 ' : 'Due in ') + (diff > 0 ? '+' : '') + diff + ' ' + (lang.value === 'zh' ? '天' : 'Days');
                        
                        return { date: nextStr, diff: diffStr };
                    } catch (e) { 
                        console.error(e);
                        return null; 
                    }
                });

                const editDueDiff = computed(() => {
                    if (!isEdit.value || !form.value.nextDueDate) return '';
                    try {
                        const parts = String(form.value.nextDueDate).split('-');
                        if (parts.length !== 3) return '';
                        const nextDateUTC = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]));

                        let todayInUserTzStr;
                        try {
                            const userTz = settings.value.timezone || 'Asia/Shanghai';
                            const fmt = new Intl.DateTimeFormat('en-CA', {
                                timeZone: userTz,
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                            });
                            todayInUserTzStr = fmt.format(new Date());
                        } catch (e) {
                            todayInUserTzStr = new Date().toISOString().split('T')[0];
                        }

                        const pToday = todayInUserTzStr.split('-');
                        const todayUTC = new Date(Date.UTC(+pToday[0], +pToday[1] - 1, +pToday[2]));
                        const diff = Math.round((nextDateUTC - todayUTC) / (1000 * 3600 * 24));

                        const labelStart = lang.value === 'zh' ? '距今 ' : 'Due in ';
                        const labelEnd = lang.value === 'zh' ? ' 天' : ' Days';
                        return labelStart + (diff > 0 ? '+' : '') + diff + labelEnd;
                    } catch (e) {
                        console.error(e);
                        return '';
                    }
                });

                // 计算每月和每年的收入/支出
                const monthlyIncome = computed(() => {
                    return list.value.filter(i => i.enabled && i.transactionType === 'income' && i.amount).reduce((sum, i) => {
                        const amount = Number(i.amount) || 0;
                        const cycleUnit = i.cycleUnit || 'day';
                        const intervalDays = Number(i.intervalDays) || 1;
                        if (cycleUnit === 'month') {
                            return sum + amount / intervalDays;
                        } else if (cycleUnit === 'year') {
                            return sum + amount / (intervalDays * 12);
                        } else if (cycleUnit === 'day') {
                            return sum + amount * (30 / intervalDays);
                        }
                        return sum;
                    }, 0);
                });

                const monthlyExpense = computed(() => {
                    return list.value.filter(i => i.enabled && i.transactionType === 'expense' && i.amount).reduce((sum, i) => {
                        const amount = Number(i.amount) || 0;
                        const cycleUnit = i.cycleUnit || 'day';
                        const intervalDays = Number(i.intervalDays) || 1;
                        if (cycleUnit === 'month') {
                            return sum + amount / intervalDays;
                        } else if (cycleUnit === 'year') {
                            return sum + amount / (intervalDays * 12);
                        } else if (cycleUnit === 'day') {
                            return sum + amount * (30 / intervalDays);
                        }
                        return sum;
                    }, 0);
                });

                const yearlyIncome = computed(() => {
                    return monthlyIncome.value * 12;
                });

                const yearlyExpense = computed(() => {
                    return monthlyExpense.value * 12;
                });
                const importRef = ref(null);
                const exportData = async () => {
                    try {
                        const res = await fetch('/api/export', { headers: getAuth() });
                        const blob = await res.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a'); a.href = url;
                        const disposition = res.headers.get('content-disposition');
                        let filename = 'renewmanager_backup.json';
                        if (disposition && disposition.includes('filename=')) { filename = disposition.split('filename=')[1].replace(/"/g, ''); }
                        a.download = filename; document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a);
                        ElMessage.success(t('msg.exportSuccess'));
                    } catch (e) { ElMessage.error(e.message); }
                };
                const triggerImport = () => importRef.value.click();
                const handleImportFile = async (event) => {
                    const file = event.target.files[0]; if (!file) return;
                    try { await ElMessageBox.confirm(lang.value === 'zh' ? '此操作将覆盖当前的订阅列表，是否继续？' : 'Overwrite current subscriptions?', t('btnImport'), { confirmButtonText: t('yes'), cancelButtonText: t('no'), type: 'warning' }); } catch { event.target.value = ''; return; }
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        try {
                            const json = JSON.parse(e.target.result); loading.value = true;
                            const res = await fetch('/api/import', { method: 'POST', headers: { ...getAuth(), 'Content-Type': 'application/json' }, body: JSON.stringify(json) });
                            const d = await res.json();
                            if (res.ok) { ElMessage.success(t('msg.importSuccess')); settingsVisible.value = false; setTimeout(() => window.location.reload(), 1500); } else { throw new Error(d.msg); }
                        } catch (err) { ElMessage.error(t('msg.importFail') + ': ' + err.message); } finally { loading.value = false; event.target.value = ''; }
                    };
                    reader.readAsText(file);
                };
                return {
                    tableKey, termRef, isLoggedIn, password, login, logout, loading, list, settings, lang, toggleLang, setLang, t, locale, disabledCount,
                    dialogVisible, settingsVisible, historyVisible, historyLoading, historyLogs, checking, logs, displayLogs, form, settingsForm, isEdit,
                    expiringCount, expiredCount, currentTag, allTags, filteredList, logVisible,formatLogTime,Upload, Download,
                    openAdd, editItem, deleteItem, saveItem, openSettings, saveSettings, runCheck, openHistoryLogs, clearLogs, toggleEnable,importRef, exportData, triggerImport, handleImportFile,
                    Edit, Delete, Plus, VideoPlay, Setting, Bell, Document, Lock, Monitor, SwitchButton, Calendar, Timer, Files, AlarmClock, Warning, Search, Cpu, Link, Message, Promotion, Iphone, Moon, Sunny, ArrowDown, View, User, Wallet, CreditCard, Money,
                    getDaysClass, formatDaysLeft, getTagClass, getLogColor, getLunarStr, getYearGanZhi, getSmartLunarText, getLunarTooltip, getMonthStr, getTagCount, tableRowClassName, channelMap, toggleChannel, testChannel, testing,
                    expandedChannels,
                    calendarUrl, copyIcsUrl, resetCalendarToken,manualRenew,RefreshRight,timezoneList, previewData, editDueDiff,
                    isDark, toggleTheme, drawerSize, actionColWidth, confirmDelete, confirmRenew, More, windowWidth,
                    handleSortChange, handleFilterChange, 
                    nextDueFilters, typeFilters, uptimeFilters, lastRenewFilters,
                    detailsVisible, currentDetailItem, showDetails,
                    monthlyIncome, monthlyExpense, yearlyIncome, yearlyExpense
                };
            }
        }).use(ElementPlus).mount('#app');
    </script>
</body>
</html>`;
