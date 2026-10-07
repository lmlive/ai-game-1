/* data.js — 布局常量、植物/僵尸数值、10 关卡配置与波次生成器 */
(function () {
  'use strict';
  const PVZ = (window.PVZ = window.PVZ || {});

  // ---------- 逻辑画布与战场布局 ----------
  const LAYOUT = {
    W: 1000, H: 600,
    HUD_H: 96,
    ROWS: 5, COLS: 9,
    CELL_W: 90, CELL_H: 100,
    X0: 95, Y0: 100
  };
  LAYOUT.X1 = LAYOUT.X0 + LAYOUT.COLS * LAYOUT.CELL_W;   // 905
  LAYOUT.Y1 = LAYOUT.Y0 + LAYOUT.ROWS * LAYOUT.CELL_H;   // 600
  LAYOUT.rootX = function (c) { return LAYOUT.X0 + c * LAYOUT.CELL_W + LAYOUT.CELL_W / 2; };
  LAYOUT.rootY = function (r) { return LAYOUT.Y0 + r * LAYOUT.CELL_H + 82; };
  LAYOUT.cellCenter = function (r) { return LAYOUT.Y0 + r * LAYOUT.CELL_H + 46; };
  PVZ.LAYOUT = LAYOUT;

  // ---------- 植物数值 ----------
  // recharge: 卡片冷却(秒); hp: 生命
  const PLANTS = {
    sunflower: {
      name: '向日葵', cost: 50, recharge: 5, hp: 300, order: 1,
      desc: '向日葵是你最可靠的经济来源，每隔一段时间产出 25 点阳光。'
    },
    peashooter: {
      name: '豌豆射手', cost: 100, recharge: 5, hp: 300, order: 2,
      desc: '豌豆射手向本行僵尸发射豌豆，每发造成 20 点伤害。性价比之王。'
    },
    wallnut: {
      name: '坚果墙', cost: 50, recharge: 22, hp: 4000, order: 3,
      desc: '坚果墙拥有 4000 点生命，能长时间阻挡僵尸，为火力争取时间。'
    },
    potatomine: {
      name: '土豆雷', cost: 25, recharge: 25, hp: 300, order: 4,
      desc: '土豆雷需要时间武装自己，准备完成后一击炸飞靠近的僵尸。'
    },
    snowpea: {
      name: '寒冰射手', cost: 175, recharge: 5, hp: 300, order: 5,
      desc: '寒冰射手的冰豌豆能让僵尸减速，使它们又冷又慢，方便集火。'
    },
    chomper: {
      name: '大嘴花', cost: 150, recharge: 8, hp: 300, order: 6,
      desc: '大嘴花一口吞掉一整只僵尸，但需要很长时间才能消化完。'
    },
    repeater: {
      name: '双发射手', cost: 200, recharge: 5, hp: 300, order: 7,
      desc: '双发射手一次吐出两颗豌豆，火力是豌豆射手的两倍。'
    },
    puffshroom: {
      name: '小喷菇', cost: 0, recharge: 5, hp: 300, night: true, order: 8,
      desc: '夜间植物。小喷菇免费种植，但射程很短，是夜晚前期的好帮手。'
    },
    sunshroom: {
      name: '阳光菇', cost: 25, recharge: 6, hp: 300, night: true, order: 9,
      desc: '夜间植物。阳光菇小时候产出较少阳光，长大后产量与向日葵相同。'
    },
    squash: {
      name: '窝瓜', cost: 50, recharge: 22, hp: 300, order: 10,
      desc: '窝瓜会主动跳向附近的僵尸，把它们压成饼，然后光荣退场。'
    },
    tallnut: {
      name: '高坚果', cost: 125, recharge: 30, hp: 8000, order: 11,
      desc: '高坚果更加高大坚固，连撑杆跳僵尸也无法从它头顶越过。'
    },
    jalapeno: {
      name: '火爆辣椒', cost: 125, recharge: 35, hp: 300, order: 12,
      desc: '火爆辣椒点燃整条走道，烈焰会烧毁本行的全部僵尸。'
    },
    cherrybomb: {
      name: '樱桃炸弹', cost: 150, recharge: 35, hp: 300, order: 13,
      desc: '一对脾气火爆的樱桃，引爆后对 3x3 区域内的僵尸造成毁灭打击。'
    }
  };
  PVZ.PLANTS = PLANTS;

  // ---------- 僵尸数值 ----------
  // armor: 护具生命（先于本体承伤）; speed: 行走 px/s; dps: 啃食
  const ZOMBIES = {
    normal: {
      name: '普通僵尸', hp: 200, speed: 11, dps: 100,
      desc: '最普通的僵尸，慢悠悠地走向你的房子，靠数量制造麻烦。'
    },
    conehead: {
      name: '路障僵尸', hp: 200, armor: 370, speed: 11, dps: 100,
      desc: '头顶一个塑料路障，提供可观的额外防护，路障被打掉后就是普通僵尸。'
    },
    ironbucket: {
      name: '铁桶僵尸', hp: 200, armor: 1100, speed: 10, dps: 100,
      desc: '铁桶极其坚固，能吸收大量伤害，需要集中火力尽快击破。'
    },
    polevaulter: {
      name: '撑杆跳僵尸', hp: 500, speed: 22, walkSpeed: 11, dps: 100,
      desc: '撑杆跳僵尸高速冲刺，并用长杆跳过遇到的第一株植物（高坚果除外）。'
    },
    newspaper: {
      name: '读报僵尸', hp: 200, armor: 160, speed: 9, ragingSpeed: 23, dps: 100,
      desc: '读报僵尸走得很慢，但一旦你撕碎了他的报纸，他就会暴怒狂奔。'
    },
    football: {
      name: '橄榄球僵尸', hp: 200, armor: 1400, speed: 20, dps: 100,
      desc: '全副武装的橄榄球僵尸，速度快、护具厚，是非常危险的突击手。'
    },
    flagzombie: {
      name: '旗帜僵尸', hp: 200, speed: 13, dps: 100, flag: true,
      desc: '旗帜僵尸率领一大波同伴来袭，看到他就意味着最猛烈的进攻开始了。'
    }
  };
  PVZ.ZOMBIES = ZOMBIES;

  // ---------- 关卡 ----------
  // roster: [类型, 权重, 从第几波出现]
  const LEVELS = [
    {
      name: '第 1 关 · 初次交锋', scene: 'day', slots: 4, startSun: 75, sky: 10,
      smallWaves: 2, bigWaves: 1, counts: [3, 4, 6], gap: 5, waveGap: 20,
      roster: [['normal', 5, 0]],
      reward: 'wallnut'
    },
    {
      name: '第 2 关 · 头顶路障', scene: 'day', slots: 4, startSun: 75, sky: 10,
      smallWaves: 2, bigWaves: 1, counts: [4, 5, 7], gap: 4.5, waveGap: 20,
      roster: [['normal', 5, 0], ['conehead', 3, 1]],
      reward: 'potatomine'
    },
    {
      name: '第 3 关 · 霜冻战术', scene: 'day', slots: 5, startSun: 50, sky: 10,
      smallWaves: 3, bigWaves: 1, counts: [4, 5, 5, 8], gap: 4, waveGap: 18,
      roster: [['normal', 5, 0], ['conehead', 4, 1]],
      reward: 'snowpea'
    },
    {
      name: '第 4 关 · 撑杆惊魂', scene: 'day', slots: 6, startSun: 50, sky: 10,
      smallWaves: 3, bigWaves: 1, counts: [4, 5, 6, 9], gap: 4, waveGap: 18,
      roster: [['normal', 4, 0], ['conehead', 4, 0], ['polevaulter', 2, 1]],
      reward: 'chomper'
    },
    {
      name: '第 5 关 · 白天决战', scene: 'day', slots: 6, startSun: 50, sky: 10,
      smallWaves: 3, bigWaves: 2, counts: [4, 5, 5, 8, 9], gap: 3.5, waveGap: 16,
      roster: [['normal', 4, 0], ['conehead', 4, 0], ['polevaulter', 2, 1],
        ['newspaper', 2, 2], ['ironbucket', 1, 2]],
      reward: 'repeater'
    },
    {
      name: '第 6 关 · 夜幕降临', scene: 'night', slots: 6, startSun: 75, sky: 24,
      smallWaves: 3, bigWaves: 1, counts: [4, 4, 5, 8], gap: 4.5, waveGap: 20,
      roster: [['normal', 5, 0], ['conehead', 3, 1]],
      grant: ['puffshroom', 'sunshroom'],
      reward: 'squash'
    },
    {
      name: '第 7 关 · 月光铁桶', scene: 'night', slots: 7, startSun: 50, sky: 24,
      smallWaves: 3, bigWaves: 1, counts: [5, 5, 6, 9], gap: 4, waveGap: 18,
      roster: [['normal', 4, 0], ['conehead', 4, 0], ['polevaulter', 2, 1], ['ironbucket', 2, 2]],
      reward: 'tallnut'
    },
    {
      name: '第 8 关 · 暗夜突袭', scene: 'night', slots: 7, startSun: 50, sky: 24,
      smallWaves: 3, bigWaves: 1, counts: [5, 6, 6, 10], gap: 4, waveGap: 18,
      roster: [['normal', 3, 0], ['conehead', 3, 0], ['newspaper', 3, 1], ['football', 2, 2]],
      reward: 'jalapeno'
    },
    {
      name: '第 9 关 · 全力防守', scene: 'night', slots: 8, startSun: 50, sky: 24,
      smallWaves: 3, bigWaves: 2, counts: [4, 5, 5, 8, 10], gap: 3.5, waveGap: 16,
      roster: [['normal', 3, 0], ['conehead', 3, 0], ['polevaulter', 2, 1],
        ['newspaper', 2, 1], ['ironbucket', 2, 2], ['football', 2, 2]],
      reward: 'cherrybomb'
    },
    {
      name: '第 10 关 · 最终防线', scene: 'night', slots: 8, startSun: 75, sky: 22,
      smallWaves: 3, bigWaves: 2, counts: [5, 6, 6, 10, 12], gap: 3, waveGap: 15,
      roster: [['normal', 3, 0], ['conehead', 3, 0], ['polevaulter', 2, 0],
        ['newspaper', 3, 1], ['ironbucket', 3, 1], ['football', 3, 2]],
      reward: null
    }
  ];
  PVZ.LEVELS = LEVELS;

  // 生成出生事件：{t, type, big}
  function buildSpawns(idx) {
    const o = LEVELS[idx];
    const ev = [];
    let t = 8;
    const waves = o.smallWaves + o.bigWaves;
    for (let w = 0; w < waves; w++) {
      const big = w >= o.smallWaves;
      if (big) { ev.push({ t: t, type: 'flagzombie', big: true }); t += 2.5; }
      const count = o.counts[w];
      for (let i = 0; i < count; i++) {
        ev.push({ t: t, type: pickType(o.roster, w, i) });
        t += o.gap;
      }
      if (!big || w < waves - 1) t += o.waveGap;
    }
    return ev;
  }
  function pickType(roster, wave, i) {
    const avail = roster.filter(function (r) { return wave >= r[2]; });
    let total = 0;
    avail.forEach(function (r) { total += r[1]; });
    // 保证每波最后一只优先高级僵尸，避免清一色
    let roll = Math.random() * total;
    for (const r of avail) {
      roll -= r[1];
      if (roll <= 0) return r[0];
    }
    return avail[0][0];
  }
  PVZ.buildSpawns = buildSpawns;

  // 关卡涉及僵尸类型（选卡预览用）
  PVZ.levelZombieTypes = function (idx) {
    const set = {};
    LEVELS[idx].roster.forEach(function (r) { set[r[0]] = 1; });
    if (LEVELS[idx].bigWaves > 0) set.flagzombie = 1;
    return Object.keys(set);
  };

  // 初始解锁
  PVZ.STARTER_PLANTS = ['sunflower', 'peashooter'];
})();
