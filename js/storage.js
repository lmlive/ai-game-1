/* storage.js — localStorage 进度存档：通关进度、解锁植物、静音偏好 */
(function () {
  'use strict';
  const PVZ = (window.PVZ = window.PVZ || {});
  const KEY = 'pvz-homage-save-v1';

  // 根据已通关数量推导应解锁的植物（保证存档一致性）
  function computeUnlocked(progress) {
    const u = {};
    PVZ.STARTER_PLANTS.forEach(function (t) { u[t] = 1; });
    for (let i = 0; i < progress && i < PVZ.LEVELS.length; i++) {
      const lv = PVZ.LEVELS[i];
      if (lv.reward) u[lv.reward] = 1;
      (lv.grant || []).forEach(function (t) { u[t] = 1; });
    }
    return u;
  }

  PVZ.storage = {
    load: function () {
      let data = null;
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) data = JSON.parse(raw);
      } catch (e) { data = null; }
      if (!data || typeof data.progress !== 'number') {
        data = { progress: 0, muted: false };
      }
      data.unlocked = computeUnlocked(data.progress);
      return data;
    },
    save: function (data) {
      try {
        localStorage.setItem(KEY, JSON.stringify({
          progress: data.progress,
          muted: !!data.muted
        }));
      } catch (e) { /* 隐私模式等场景忽略 */ }
    },
    computeUnlocked: computeUnlocked,
    // 选卡时可选植物（含夜间蘑菇：进入第 6 关即解锁）
    availablePlants: function (unlocked) {
      return Object.keys(PVZ.PLANTS)
        .filter(function (t) { return unlocked[t]; })
        .sort(function (a, b) { return PVZ.PLANTS[a].order - PVZ.PLANTS[b].order; });
    }
  };
})();
