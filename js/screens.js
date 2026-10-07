/* screens.js — 主菜单/关卡选择/选卡/图鉴/帮助/暂停/结算界面（DOM + 代码绘制立绘） */
(function () {
  'use strict';
  const PVZ = (window.PVZ = window.PVZ || {});
  const PLANTS = PVZ.PLANTS;
  const ZOMBIES = PVZ.ZOMBIES;
  const LEVELS = PVZ.LEVELS;

  let root = null;
  let cb = null;
  let save = null;

  // ---- 立绘工具：用代码绘制到独立小 canvas ----
  function makePortrait(type, kind, size) {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#2e2a1e';
    ctx.save();
    if (kind === 'plant') {
      ctx.translate(size / 2, size - size * 0.1);
      ctx.scale(size / 118, size / 118);
      PVZ.Art[type](ctx, { t: 0.7, blink: true, ready: true, grown: true, air: false });
    } else {
      ctx.translate(size / 2, size - size * 0.08);
      ctx.scale(size / 140, size / 140);
      PVZ.Art[type](ctx, { walk: 0.6, nod: false, t: 0.5, hasPole: true });
    }
    ctx.restore();
    return c;
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  const Screens = {
    init(host, callbacks) {
      root = host;
      cb = callbacks;
    },
    setSave(s) { save = s; },

    showOnly(id) {
      root.querySelectorAll('.ov').forEach(function (o) {
        o.classList.toggle('hidden', o.id !== id);
      });
    },
    hideAll() {
      root.querySelectorAll('.ov').forEach(function (o) { o.classList.add('hidden'); });
    },

    /* ================= 主菜单 ================= */
    showMenu() {
      this.setSave(PVZ.saveData);
      let m = document.getElementById('menu');
      if (!m) {
        m = el('div', 'ov menu-ov');
        m.id = 'menu';
        const box = el('div', 'menu-box');
        const title = el('h1', 'game-title', '植物大战僵尸');
        const sub = el('div', 'game-sub', '后院保卫战 · 粉丝致敬复刻版');
        box.appendChild(title);
        box.appendChild(sub);
        box.appendChild(el('div', 'menu-deco'));

        const btnAdventure = el('button', 'btn btn-big', '开始冒险');
        btnAdventure.id = 'btn-adventure';
        const btnAlmanac = el('button', 'btn btn-big', '图鉴');
        const btnHelp = el('button', 'btn btn-big', '帮助');
        const btnMute = el('button', 'btn btn-mute', '音效：开');
        box.appendChild(btnAdventure);
        box.appendChild(btnAlmanac);
        box.appendChild(btnHelp);
        box.appendChild(btnMute);

        const progress = el('div', 'menu-progress', '');
        progress.id = 'menu-progress';
        box.appendChild(progress);
        const credit = el('div', 'credit', '全部美术由 Canvas 代码原创绘制，音效由 WebAudio 合成');
        box.appendChild(credit);

        btnAdventure.addEventListener('click', () => { PVZ.audio.ensure(); PVZ.audio.ui(); this.showLevels(); });
        btnAlmanac.addEventListener('click', () => { PVZ.audio.ui(); this.showAlmanac('plants'); });
        btnHelp.addEventListener('click', () => { PVZ.audio.ui(); this.showHelp(); });
        btnMute.addEventListener('click', () => {
          PVZ.audio.ensure();
          const muted = !PVZ.saveData.muted;
          PVZ.saveData.muted = muted;
          PVZ.audio.setMuted(muted);
          PVZ.storage.save(PVZ.saveData);
          btnMute.textContent = '音效：' + (muted ? '关' : '开');
        });
        m.appendChild(box);
        root.appendChild(m);
      }
      document.getElementById('menu-progress').textContent =
        '已通关 ' + save.progress + ' / ' + LEVELS.length + ' 关';
      m.querySelector('.btn-mute').textContent = '音效：' + (save.muted ? '关' : '开');
      this.showOnly('menu');
    },

    /* ================= 关卡选择 ================= */
    showLevels() {
      let o = document.getElementById('levels');
      if (!o) {
        o = el('div', 'ov');
        o.id = 'levels';
        const panel = el('div', 'panel');
        const h = el('h2', 'panel-title', '选择关卡');
        panel.appendChild(h);
        const grid = el('div', 'level-grid');
        for (let i = 0; i < LEVELS.length; i++) {
          (function (idx) {
            const b = el('button', 'level-cell');
            b.dataset.idx = idx;
            b.addEventListener('click', () => {
              PVZ.audio.ui();
              Screens.showChooser(idx);
            });
            grid.appendChild(b);
          })(i);
        }
        panel.appendChild(grid);
        const back = el('button', 'btn', '返回主菜单');
        back.addEventListener('click', () => { PVZ.audio.ui(); this.showMenu(); });
        panel.appendChild(back);
        o.appendChild(panel);
        root.appendChild(o);
      }
      // 更新锁定状态
      o.querySelectorAll('.level-cell').forEach(function (b) {
        const i = +b.dataset.idx;
        b.innerHTML = '';
        const done = i < save.progress;
        const open = i <= save.progress;
        b.classList.toggle('locked', !open);
        b.classList.toggle('done', done);
        if (!open) {
          b.appendChild(el('span', 'lock-icon', '🔒'));
          b.appendChild(el('span', 'lv-name', '第 ' + (i + 1) + ' 关'));
        } else {
          b.appendChild(el('span', 'lv-num', (done ? '✓ ' : '') + (i + 1)));
          b.appendChild(el('span', 'lv-name', LEVELS[i].scene === 'night' ? '夜晚' : '白天'));
        }
      });
      this.showOnly('levels');
    },

    /* ================= 选卡界面 ================= */
    showChooser(idx) {
      const lv = LEVELS[idx];
      const id = 'chooser';
      let o = document.getElementById(id);
      if (o) o.remove();
      o = el('div', 'ov');
      o.id = id;
      const panel = el('div', 'panel wide');

      const head = el('div', 'chooser-head');
      head.appendChild(el('h2', 'panel-title', lv.name));
      const tag = el('span', 'scene-tag ' + lv.scene, lv.scene === 'night' ? '夜晚：天降阳光变慢' : '白天');
      head.appendChild(tag);
      panel.appendChild(head);

      // 已选卡槽
      const slotsBar = el('div', 'slots-bar');
      for (let i = 0; i < lv.slots; i++) {
        slotsBar.appendChild(el('div', 'slot'));
      }
      panel.appendChild(slotsBar);

      const body = el('div', 'chooser-body');

      // 僵尸预览
      const zcol = el('div', 'preview-col');
      zcol.appendChild(el('h3', 'col-title', '本关来袭'));
      const zlist = el('div', 'z-preview-list');
      PVZ.levelZombieTypes(idx).forEach(function (t) {
        const item = el('div', 'z-preview');
        const p = makePortrait(t, 'zombie', 86);
        p.classList.add('mini-portrait');
        item.appendChild(p);
        item.appendChild(el('span', null, ZOMBIES[t].name));
        zlist.appendChild(item);
      });
      zcol.appendChild(zlist);
      body.appendChild(zcol);

      // 植物选择
      const pcol = el('div', 'preview-col grow');
      pcol.appendChild(el('h3', 'col-title', '选择你的植物（点击选取/取消）'));
      const pgrid = el('div', 'plant-pick-grid');
      const chosen = [];

      function refreshSlots() {
        slotsBar.innerHTML = '';
        for (let i = 0; i < lv.slots; i++) {
          const s = el('div', 'slot');
          const t = chosen[i];
          if (t) {
            s.classList.add('filled');
            const p = makePortrait(t, 'plant', 58);
            p.classList.add('slot-portrait');
            s.appendChild(p);
            const c = el('span', 'slot-cost', String(PLANTS[t].cost));
            s.appendChild(c);
          }
          slotsBar.appendChild(s);
        }
      }

      PVZ.storage.availablePlants(save.unlocked).forEach(function (t) {
        const card = el('button', 'pick-card');
        const p = makePortrait(t, 'plant', 74);
        card.appendChild(p);
        card.appendChild(el('span', 'pick-name', PLANTS[t].name));
        const cost = el('span', 'pick-cost', PLANTS[t].cost + ' 阳光');
        card.appendChild(cost);
        if (PLANTS[t].night) card.classList.add('night-card');
        card.addEventListener('click', () => {
          PVZ.audio.ui();
          const k = chosen.indexOf(t);
          if (k >= 0) {
            chosen.splice(k, 1);
            card.classList.remove('picked');
          } else if (chosen.length < lv.slots) {
            chosen.push(t);
            card.classList.add('picked');
          } else {
            slotsBar.classList.add('shake');
            setTimeout(() => slotsBar.classList.remove('shake'), 400);
          }
          refreshSlots();
        });
        pgrid.appendChild(card);
      });
      pcol.appendChild(pgrid);
      body.appendChild(pcol);
      panel.appendChild(body);

      // 按钮
      const foot = el('div', 'panel-foot');
      const back = el('button', 'btn', '返回');
      back.addEventListener('click', () => { PVZ.audio.ui(); this.showLevels(); });
      const start = el('button', 'btn btn-primary', '开始战斗！');
      start.addEventListener('click', () => {
        if (!chosen.length) return;
        PVZ.audio.ui();
        this.hideAll();
        cb.onStartLevel(idx, chosen.slice());
      });
      foot.appendChild(back);
      foot.appendChild(start);
      panel.appendChild(foot);

      o.appendChild(panel);
      root.appendChild(o);
      refreshSlots();
      this.showOnly(id);
    },

    /* ================= 图鉴 ================= */
    showAlmanac(kind) {
      const id = 'almanac';
      let o = document.getElementById(id);
      if (o) o.remove();
      o = el('div', 'ov');
      o.id = id;
      const panel = el('div', 'panel wide');
      panel.appendChild(el('h2', 'panel-title', '图鉴'));

      const tabs = el('div', 'tabs');
      const tabP = el('button', 'tab' + (kind === 'plants' ? ' active' : ''), '植物');
      const tabZ = el('button', 'tab' + (kind === 'kindz' ? ' active' : ''), '僵尸');
      tabs.appendChild(tabP); tabs.appendChild(tabZ);
      panel.appendChild(tabs);

      const detail = el('div', 'almanac-detail');
      const gridWrap = el('div', 'almanac-grid-wrap');
      const grid = el('div', 'almanac-grid');
      gridWrap.appendChild(grid);
      panel.appendChild(gridWrap);
      panel.appendChild(detail);

      function render(k) {
        tabP.classList.toggle('active', k === 'plants');
        tabZ.classList.toggle('active', k === 'kindz');
        grid.innerHTML = '';
        detail.innerHTML = '';
        if (k === 'plants') {
          Object.keys(PLANTS).sort(function (a, b) {
            return PLANTS[a].order - PLANTS[b].order;
          }).forEach(function (t) {
            const c = el('button', 'alm-card');
            if (!save.unlocked[t]) c.classList.add('locked-card');
            if (save.unlocked[t]) {
              c.appendChild(makePortrait(t, 'plant', 78));
              c.appendChild(el('span', null, PLANTS[t].name));
            } else {
              c.appendChild(el('span', 'lock-big', '?'));
              c.appendChild(el('span', null, '未解锁'));
            }
            c.addEventListener('click', () => {
              PVZ.audio.ui();
              showPlantDetail(t);
            });
            grid.appendChild(c);
          });
          detail.appendChild(el('div', 'hint', '点击卡片查看植物介绍'));
        } else {
          Object.keys(ZOMBIES).forEach(function (t) {
            const c = el('button', 'alm-card');
            c.appendChild(makePortrait(t, 'zombie', 78));
            c.appendChild(el('span', null, ZOMBIES[t].name));
            c.addEventListener('click', () => {
              PVZ.audio.ui();
              showZombieDetail(t);
            });
            grid.appendChild(c);
          });
          detail.appendChild(el('div', 'hint', '点击卡片查看僵尸介绍'));
        }
      }

      function showPlantDetail(t) {
        detail.innerHTML = '';
        const p = makePortrait(t, 'plant', 150);
        p.classList.add('detail-portrait');
        detail.appendChild(p);
        const info = el('div', 'detail-info');
        info.appendChild(el('h3', null, PLANTS[t].name));
        const meta = el('div', 'meta',
          '花费 ' + PLANTS[t].cost + ' 阳光 · 生命 ' + PLANTS[t].hp +
          (PLANTS[t].night ? ' · 夜间植物' : ''));
        info.appendChild(meta);
        info.appendChild(el('p', null, PLANTS[t].desc));
        detail.appendChild(info);
      }
      function showZombieDetail(t) {
        detail.innerHTML = '';
        const p = makePortrait(t, 'zombie', 150);
        p.classList.add('detail-portrait');
        detail.appendChild(p);
        const info = el('div', 'detail-info');
        info.appendChild(el('h3', null, ZOMBIES[t].name));
        const armorText = ZOMBIES[t].armor ? ' · 护具 ' + ZOMBIES[t].armor : '';
        const meta = el('div', 'meta',
          '生命 ' + ZOMBIES[t].hp + armorText + ' · 速度 ' + ZOMBIES[t].speed);
        info.appendChild(meta);
        info.appendChild(el('p', null, ZOMBIES[t].desc));
        detail.appendChild(info);
      }

      tabP.addEventListener('click', () => { PVZ.audio.ui(); render('plants'); });
      tabZ.addEventListener('click', () => { PVZ.audio.ui(); render('kindz'); });

      const foot = el('div', 'panel-foot');
      const back = el('button', 'btn btn-primary', '返回主菜单');
      back.addEventListener('click', () => { PVZ.audio.ui(); this.showMenu(); });
      foot.appendChild(back);
      panel.appendChild(foot);

      o.appendChild(panel);
      root.appendChild(o);
      render(kind);
      this.showOnly(id);
    },

    /* ================= 帮助 ================= */
    showHelp() {
      const id = 'help';
      let o = document.getElementById(id);
      if (o) o.remove();
      o = el('div', 'ov');
      o.id = id;
      const panel = el('div', 'panel');
      panel.appendChild(el('h2', 'panel-title', '帮助 · 怎么玩'));
      const lines = [
        '1. 你的目标是阻止僵尸进入左侧的房子。僵尸会从右侧沿 5 行草坪进攻。',
        '2. 阳光是唯一资源：点击天上掉落的阳光收集；向日葵会定期产出阳光。',
        '3. 点击顶部植物卡片，再点击草坪空格即可种植。卡片有冷却时间。',
        '4. 豌豆射手自动攻击同行僵尸；寒冰射手能减速；坚果负责阻挡。',
        '5. 樱桃炸弹炸毁 3x3 区域；火爆辣椒烧毁整行；窝瓜压扁附近僵尸。',
        '6. 每行尽头有一台割草机，僵尸越过植物防线时会清掉整行，只能用一次。',
        '7. 铲子可以移除已种下的植物，灵活调整防线。',
        '8. 夜晚天降阳光很少，多用免费的小喷菇与便宜的阳光菇。',
        '9. 撑杆跳僵尸会跳过第一株植物，请用高坚果阻挡；读报僵尸报纸破后会暴怒。',
        '10. 操作：鼠标点击；触屏设备直接点按即可。'
      ];
      const list = el('div', 'help-list');
      lines.forEach(function (t) { list.appendChild(el('p', null, t)); });
      panel.appendChild(list);
      const foot = el('div', 'panel-foot');
      const back = el('button', 'btn btn-primary', '返回主菜单');
      back.addEventListener('click', () => { PVZ.audio.ui(); this.showMenu(); });
      foot.appendChild(back);
      panel.appendChild(foot);
      o.appendChild(panel);
      root.appendChild(o);
      this.showOnly(id);
    },

    /* ================= 暂停 ================= */
    showPause() {
      const id = 'pause';
      let o = document.getElementById(id);
      if (o) o.remove();
      o = el('div', 'ov small-ov');
      o.id = id;
      const box = el('div', 'dialog');
      box.appendChild(el('h2', 'panel-title', '已暂停'));
      const cont = el('button', 'btn btn-primary', '继续游戏');
      cont.addEventListener('click', () => { PVZ.audio.ui(); cb.onResume(); this.hideAll(); });
      const restart = el('button', 'btn', '重新开始本关');
      restart.addEventListener('click', () => { PVZ.audio.ui(); cb.onRestart(); this.hideAll(); });
      const quit = el('button', 'btn', '返回主菜单');
      quit.addEventListener('click', () => { PVZ.audio.ui(); cb.onQuit(); this.showMenu(); });
      box.appendChild(cont); box.appendChild(restart); box.appendChild(quit);
      o.appendChild(box);
      root.appendChild(o);
      this.showOnly(id);
    },

    /* ================= 结算 ================= */
    showResult(result, idx) {
      const id = 'result';
      let o = document.getElementById(id);
      if (o) o.remove();
      o = el('div', 'ov small-ov');
      o.id = id;
      const box = el('div', 'dialog');

      if (result.win) {
        box.appendChild(el('h2', 'panel-title win-text', '关卡胜利！'));
        const isLast = idx === LEVELS.length - 1;
        if (isLast) {
          box.appendChild(el('p', 'result-text', '恭喜你击退了全部僵尸，通关全部 10 关！'));
        } else if (result.reward) {
          const p = makePortrait(result.reward, 'plant', 130);
          p.classList.add('reward-portrait');
          box.appendChild(p);
          box.appendChild(el('p', 'result-text', '获得新植物：' + PLANTS[result.reward].name));
        }
        const foot = el('div', 'panel-foot center');
        if (!isLast) {
          const next = el('button', 'btn btn-primary', '下一关');
          next.addEventListener('click', () => {
            PVZ.audio.ui();
            this.hideAll();
            cb.onNextLevel();
          });
          foot.appendChild(next);
        }
        const menu = el('button', 'btn', '返回主菜单');
        menu.addEventListener('click', () => { PVZ.audio.ui(); this.showMenu(); });
        foot.appendChild(menu);
        box.appendChild(foot);
      } else {
        box.appendChild(el('h2', 'panel-title lose-text', '关卡失败'));
        box.appendChild(el('p', 'result-text big-text', '僵尸吃掉了你的脑子！'));
        const foot = el('div', 'panel-foot center');
        const retry = el('button', 'btn btn-primary', '重新挑战');
        retry.addEventListener('click', () => {
          PVZ.audio.ui();
          cb.onRestart();
          this.hideAll();
        });
        const menu = el('button', 'btn', '返回主菜单');
        menu.addEventListener('click', () => { PVZ.audio.ui(); this.showMenu(); });
        foot.appendChild(retry); foot.appendChild(menu);
        box.appendChild(foot);
      }
      o.appendChild(box);
      root.appendChild(o);
      this.showOnly(id);
    }
  };

  PVZ.Screens = Screens;
})();
