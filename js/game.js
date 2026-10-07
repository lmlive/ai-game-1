/* game.js — 战场核心：经济、种植、投射战斗、僵尸 AI、割草机、波次、粒子、HUD */
(function () {
  'use strict';
  const PVZ = (window.PVZ = window.PVZ || {});
  const L = PVZ.LAYOUT;
  const P = PVZ.PLANTS;
  const Z = PVZ.ZOMBIES;
  const A = PVZ.audio;

  const INK = '#2e2a1e';
  const PEA_SPEED = 330;
  const EAT_DIST = 30;          // 僵尸与植物中心距
  const SHOOT_INTERVAL = 1.4;
  const PRODUCE_INTERVAL = 22;
  const SUN_LIFE = 10;

  /**
   * @param {number} levelIndex 关卡序号 0-9
   * @param {string[]} chosenCards 已选植物类型
   */
  class GameScene {
    constructor(levelIndex, chosenCards) {
      this.levelIndex = levelIndex;
      this.cfg = PVZ.LEVELS[levelIndex];
      this.sceneType = this.cfg.scene;
      this.cards = chosenCards.slice();

      this.sun = this.cfg.startSun;
      this.grid = [];
      for (let r = 0; r < L.ROWS; r++) this.grid.push(new Array(L.COLS).fill(null));

      this.plants = [];
      this.zombies = [];
      this.projectiles = [];
      this.suns = [];
      this.particles = [];

      this.mowers = [];
      for (let r = 0; r < L.ROWS; r++) {
        this.mowers.push({ r: r, x: L.X0 - 52, active: false, used: false });
      }

      this.spawns = PVZ.buildSpawns(levelIndex);
      this.totalSpawns = this.spawns.length;
      this.spawnIdx = 0;

      this.time = 0;
      this.skyTimer = 7;
      this.cooldowns = {};
      this.selectedCard = null;
      this.shovelMode = false;
      this.pointer = { x: -1, y: -1, inside: false };

      this.state = 'playing';      // playing | paused | won | lost
      this.result = null;
      this.banner = { text: '僵尸要来了，快种下植物！', until: 3, color: '#3a2a14' };
      this.warning = false;
      this._endDelay = 0;

      this.rects = { cards: [], shovel: null, pause: null, bar: null };
      this.mowerSounding = false;
    }

    /* ================= 更新 ================= */
    update(dt) {
      if (this.state !== 'playing') return;
      this.time += dt;

      if (this.banner && this.time > this.banner.until) this.banner = null;

      this.updateSpawns();
      this.updateSkySun(dt);
      for (let i = this.plants.length - 1; i >= 0; i--) this.updatePlant(this.plants[i], dt, i);
      for (let i = this.zombies.length - 1; i >= 0; i--) this.updateZombie(this.zombies[i], dt, i);
      for (let i = this.projectiles.length - 1; i >= 0; i--) this.updateProjectile(this.projectiles[i], dt, i);
      this.updateSuns(dt);
      this.updateParticles(dt);
      this.updateMowers(dt);
      this.updateCooldowns(dt);

      // 胜负判定
      if (this.spawnIdx >= this.totalSpawns && !this.aliveZombieExists()) {
        this._endDelay += dt;
        if (this._endDelay > 1.2) this.win();
      }
    }

    updateSpawns() {
      while (this.spawnIdx < this.totalSpawns && this.spawns[this.spawnIdx].t <= this.time) {
        const ev = this.spawns[this.spawnIdx];
        if (ev.big) {
          A.flagHorn();
          this.banner = { text: '一大波僵尸正在接近！', until: this.time + 2.4, color: '#c8241a' };
        }
        this.spawnZombie(ev.type);
        this.spawnIdx++;
      }
      // 大波预警（提前 3.5 秒）
      for (let i = this.spawnIdx; i < this.totalSpawns; i++) {
        const ev = this.spawns[i];
        if (ev.t - this.time > 4) break;
        if (ev.big && !ev.warned) {
          ev.warned = true;
          this.warning = true;
          A.alarm();
          setTimeout(() => { this.warning = false; }, 2600);
        }
      }
    }

    spawnZombie(type) {
      const def = Z[type];
      const r = Math.floor(Math.random() * L.ROWS);
      const z = {
        type: type, r: r,
        x: L.W + 30 + Math.random() * 30,
        y: L.rootY(r),
        hp: def.hp, maxHp: def.hp,
        armor: def.armor || 0, maxArmor: def.armor || 0,
        speed: def.speed,
        state: 'walk', target: null,
        walkT: Math.random() * 6, nodT: 0,
        chill: 0,
        hasPole: type === 'polevaulter',
        vaulting: false, vaultT: 0, vaultDone: false,
        raging: false,
        dead: false, deadT: 0
      };
      if (type === 'polevaulter') z.speed = def.speed;
      this.zombies.push(z);
      if (Math.random() < 0.35) A.groan();
    }

    updateSkySun(dt) {
      this.skyTimer -= dt;
      if (this.skyTimer <= 0) {
        this.skyTimer = this.cfg.sky + (Math.random() * 3 - 1.5);
        const x = L.X0 + 40 + Math.random() * (L.COLS * L.CELL_W - 80);
        const targetY = L.Y0 + 60 + Math.random() * (L.ROWS * L.CELL_H - 110);
        this.suns.push({
          x: x, y: -30, startY: -30, targetY: targetY,
          value: 25, mode: 'fall', life: SUN_LIFE, born: this.time
        });
      }
    }

    updatePlant(pl, dt, idx) {
      pl.age += dt;
      if (pl.spawnT < 1) pl.spawnT += dt * 2.2;
      if (pl.recoilT > 0) pl.recoilT -= dt;
      if (pl.hp <= 0) { this.removePlant(pl, idx, true); return; }

      switch (pl.type) {
        case 'sunflower':
          pl.produce -= dt;
          if (pl.produce <= 0) {
            this.emitSun(pl.x + 14, pl.y - 60, 25);
            pl.produce = PRODUCE_INTERVAL;
          }
          break;

        case 'sunshroom':
          if (!pl.grown) {
            pl.grow -= dt;
            if (pl.grow <= 0) pl.grown = true;
          }
          pl.produce -= dt;
          if (pl.produce <= 0) {
            this.emitSun(pl.x + 12, pl.y - (pl.grown ? 50 : 38), pl.grown ? 25 : 15);
            pl.produce = 24;
          }
          break;

        case 'peashooter':
        case 'snowpea':
        case 'repeater':
        case 'puffshroom':
          this.tickShooter(pl, dt);
          break;

        case 'chomper':
          if (pl.digest > 0) {
            pl.digest -= dt;
          } else {
            pl.chompT -= dt;
            if (pl.chomping) {
              if (pl.chompT <= 0) {
                pl.chomping = false;
                if (pl.victim) {
                  this.killZombie(pl.victim);
                  PVZ._splat(this, pl.victim.x, pl.victim.y - 50, '#b478d8', 6);
                  pl.victim = null;
                  pl.digest = 40;
                  A.swallow();
                }
              }
            } else {
              const target = this.zombies.find(function (z) {
                return !z.dead && z.r === pl.r && z.x > pl.x - 6 && z.x < pl.x + L.CELL_W * 0.95;
              });
              if (target) {
                pl.chomping = true;
                pl.chompT = 0.45;
                pl.victim = target;
                pl.tilt = -0.35;
                A.chomp();
                setTimeout(() => { pl.tilt = 0; }, 350);
              }
            }
          }
          break;

        case 'potatomine':
          if (!pl.armed) {
            pl.arm -= dt;
            if (pl.arm <= 0) { pl.armed = true; A.arm(); }
          } else {
            const z = this.zombies.find(function (zz) {
              return !zz.dead && zz.r === pl.r && Math.abs(zz.x - pl.x) < 28;
            });
            if (z) {
              this.explode(pl.x, pl.y - 14, 1.1, 1800);
              this.removePlant(pl, idx, false);
            }
          }
          break;

        case 'cherrybomb':
          pl.fuse -= dt;
          if (pl.fuse <= 0) {
            this.explode(pl.x, pl.y - 30, 1.6, 1800, pl.r, true);
            this.removePlant(pl, idx, false);
          }
          break;

        case 'jalapeno':
          pl.fuse -= dt;
          if (pl.fuse <= 0) {
            this.flameRow(pl.r);
            this.removePlant(pl, idx, false);
          }
          break;

        case 'squash':
          if (pl.smashing) {
            pl.smashT -= dt;
            if (pl.smashT <= 0) this.removePlant(pl, idx, false);
          } else if (pl.air) {
            pl.airT -= dt;
            const k = 1 - Math.max(0, pl.airT) / 0.28;
            pl.x = pl.fromX + (pl.toX - pl.fromX) * easeInOut(k);
            if (pl.airT <= 0) {
              pl.air = false;
              pl.smashing = true;
              pl.smashT = 0.3;
              this.squashAt(pl.x, pl.r);
            }
          } else {
            const tgt = this.findSquashTarget(pl);
            if (tgt) {
              pl.air = true; pl.airT = 0.28;
              pl.fromX = pl.x; pl.toX = tgt.x;
              A.vault();
            }
          }
          break;
      }
    }

    tickShooter(pl, dt) {
      const range = pl.type === 'puffshroom' ? L.CELL_W * 3 : L.W;
      const hasTarget = this.zombies.some(function (z) {
        return !z.dead && z.r === pl.r && z.x > pl.x - 10 && z.x < pl.x + range + 30;
      });
      if (!hasTarget) { pl.shoot -= dt * 0.3; return; }
      pl.shoot -= dt;
      if (pl.shoot <= 0) {
        pl.shoot = SHOOT_INTERVAL;
        pl.recoilT = 0.16;
        this.fire(pl);
        if (pl.type === 'repeater') {
          setTimeout(() => {
            if (this.plants.indexOf(pl) >= 0 && pl.hp > 0) this.fire(pl);
          }, 140);
        }
      }
    }

    fire(pl) {
      const muzzleY = pl.y - (pl.type === 'repeater' ? 58 : 52);
      if (pl.type === 'puffshroom') {
        this.projectiles.push({
          x: pl.x + 20, y: muzzleY, r: pl.r, kind: 'spore',
          speed: 300, dmg: 20, maxX: pl.x + L.CELL_W * 3
        });
        A.spore();
      } else {
        const kind = pl.type === 'snowpea' ? 'snow' : 'pea';
        this.projectiles.push({
          x: pl.x + 22, y: muzzleY, r: pl.r, kind: kind,
          speed: PEA_SPEED, dmg: 20
        });
        kind === 'snow' ? A.snowShoot() : A.shoot();
      }
    }

    updateZombie(z, dt, idx) {
      if (z.dead) {
        z.deadT += dt;
        if (z.deadT > 1.3) this.zombies.splice(idx, 1);
        return;
      }
      if (z.chill > 0) z.chill -= dt;
      const slow = z.chill > 0 ? 0.5 : 1;

      // 撑杆跳状态机
      if (z.type === 'polevaulter' && z.hasPole) {
        if (z.vaulting) {
          z.vaultT += dt;
          z.x -= 400 * dt;
          if (z.vaultT >= 0.45) {
            z.vaulting = false; z.hasPole = false;
            z.speed = Z.polevaulter.walkSpeed;
          }
        } else {
          const blocker = this.plantAt(z.r, z.x - EAT_DIST - 4);
          if (blocker) {
            if (blocker.type === 'tallnut') {
              z.hasPole = false;
              z.speed = Z.polevaulter.walkSpeed;
            } else {
              z.vaulting = true; z.vaultT = 0;
              A.vault();
            }
          } else {
            z.x -= z.speed * dt;
          }
        }
      } else {
        // 找可啃的植物
        const pl = this.plantAt(z.r, z.x - EAT_DIST);
        if (pl) {
          z.state = 'eat';
          z.target = pl;
          z.nodT += dt * 7 * slow;
          pl.hp -= Z[z.type].dps * slow * dt;
        } else {
          z.state = 'walk';
          z.target = null;
          z.walkT += dt * 9 * slow;
          z.x -= z.speed * slow * dt;
        }
      }

      // 到达房子
      if (z.x <= L.X0 - 14 && !z.dead) {
        const m = this.mowers[z.r];
        if (!m.used && !m.active) {
          m.active = true;
          this.mowerSounding = true;
          A.mowerStart();
        } else if (m.used) {
          this.lose();
        }
      }
    }

    /** 查找某行某 x 处的存活植物（含容差） */
    plantAt(r, x) {
      const pl = this.grid[r];
      for (let c = 0; c < L.COLS; c++) {
        const p = pl[c];
        if (p && p.hp > 0 && Math.abs(p.x - x) < 26) return p;
      }
      return null;
    }

    updateProjectile(pr, dt, idx) {
      pr.x += pr.speed * dt;
      if (pr.maxX && pr.x > pr.maxX) { this.projectiles.splice(idx, 1); return; }
      if (pr.x > L.W + 40) { this.projectiles.splice(idx, 1); return; }
      // 命中：同行、尚未越过的最近僵尸
      let hit = null;
      for (const z of this.zombies) {
        if (z.dead || z.r !== pr.r) continue;
        if (z.x >= pr.x - 14 && z.x <= pr.x + 24) {
          if (!hit || z.x < hit.x) hit = z;
        }
      }
      if (hit) {
        this.damageZombie(hit, pr.dmg);
        if (pr.kind === 'snow') {
          hit.chill = 5;
          PVZ._splat(this, pr.x, pr.y, '#bfefff', 4, 60);
          A.freezeHit();
        }
        this.projectiles.splice(idx, 1);
      }
    }

    /** 伤害优先扣护具；报纸破碎触发暴怒 */
    damageZombie(z, dmg) {
      if (z.armor > 0) {
        z.armor -= dmg;
        if (z.armor <= 0) {
          z.armor = 0;
          if (z.type === 'newspaper' && !z.raging) {
            z.raging = true;
            z.speed = Z.newspaper.ragingSpeed;
            A.paper();
          }
        }
      } else {
        z.hp -= dmg;
        if (z.hp <= 0 && !z.dead) {
          z.dead = true;
          z.deadT = 0;
        }
      }
    }

    updateSuns(dt) {
      for (let i = this.suns.length - 1; i >= 0; i--) {
        const s = this.suns[i];
        if (s.mode === 'fall') {
          s.y += 60 * dt;
          if (s.y >= s.targetY) { s.y = s.targetY; s.mode = 'idle'; }
        } else if (s.mode === 'idle') {
          s.life -= dt;
          if (s.life <= 0) this.suns.splice(i, 1);
        } else if (s.mode === 'fly') {
          s.flyT += dt * 1.9;
          const k = Math.min(1, s.flyT);
          s.x = bezier(s.sx, s.cx, 40, 40, k);
          s.y = bezier(s.sy, s.cy - 60, 30, 42, k);
          if (k >= 1) {
            this.sun += s.value;
            this.suns.splice(i, 1);
          }
        }
      }
    }

    updateParticles(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) { this.particles.splice(i, 1); continue; }
        if (p.type !== 'ring') {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += (p.gravity || 0) * dt;
        }
      }
    }

    updateMowers(dt) {
      let anyActive = false;
      for (const m of this.mowers) {
        if (!m.active) continue;
        anyActive = true;
        m.x += 430 * dt;
        for (const z of this.zombies) {
          if (!z.dead && z.r === m.r && z.x < m.x + 34 && z.x > m.x - 40) {
            this.killZombie(z);
            PVZ._splat(this, z.x, z.y - 50, '#c8d4a0', 5, 90);
          }
        }
        if (m.x > L.W + 60) { m.active = false; m.used = true; }
      }
      if (!anyActive && this.mowerSounding) {
        this.mowerSounding = false;
        A.mowerStop();
      }
    }

    updateCooldowns(dt) {
      for (const k of Object.keys(this.cooldowns)) {
        this.cooldowns[k] -= dt;
        if (this.cooldowns[k] <= 0) delete this.cooldowns[k];
      }
    }

    /* ---- 范围攻击 ---- */
    explode(x, y, radiusScale, dmg, row, square) {
      A.explode();
      const ring = { type: 'ring', x: x, y: y, life: 0.45, maxLife: 0.45, r0: 6, r1: 90 * radiusScale, color: '#ffd93b' };
      this.particles.push(ring);
      for (let i = 0; i < 18; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 60 + Math.random() * 200;
        this.particles.push({
          type: 'spark', x: x, y: y,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60,
          gravity: 260, life: 0.5 + Math.random() * 0.4, maxLife: 0.9,
          size: 4 + Math.random() * 5,
          color: Math.random() > 0.5 ? '#ff5a2c' : '#ffd93b'
        });
      }
      for (const z of this.zombies) {
        if (z.dead) continue;
        let hit;
        if (square) {
          hit = Math.abs(z.r - row) <= 1 && Math.abs(z.x - x) < L.CELL_W * 1.5;
        } else {
          hit = Math.hypot(z.x - x, (z.y - 70) - y) < 90 * radiusScale;
        }
        if (hit) this.damageZombie(z, dmg);
      }
    }

    flameRow(row) {
      A.flame();
      const cy = L.cellCenter(row);
      for (let i = 0; i < 40; i++) {
        const t = i / 39;
        this.particles.push({
          type: 'spark', x: L.X0 + t * (L.W - L.X0), y: cy + (Math.random() - 0.5) * 50,
          vx: 120 + Math.random() * 80, vy: -40 - Math.random() * 80,
          gravity: -60, life: 0.6 + Math.random() * 0.4, maxLife: 1,
          size: 8 + Math.random() * 10,
          color: ['#ff7a18', '#ffd93b', '#ff3b20'][i % 3]
        });
      }
      for (const z of this.zombies) {
        if (!z.dead && z.r === row) this.damageZombie(z, 1800);
      }
    }

    findSquashTarget(pl) {
      let best = null;
      let bd = Infinity;
      for (const z of this.zombies) {
        if (z.dead || z.r !== pl.r) continue;
        const d = z.x - pl.x;
        if (d > -L.CELL_W && d < L.CELL_W * 1.25 && Math.abs(d) < bd) {
          best = z; bd = Math.abs(d);
        }
      }
      return best;
    }

    squashAt(x, row) {
      A.squish();
      this.particles.push({
        type: 'ring', x: x, y: L.cellCenter(row), life: 0.35, maxLife: 0.35,
        r0: 8, r1: 60, color: '#b48ad8'
      });
      for (const z of this.zombies) {
        if (!z.dead && z.r === row && Math.abs(z.x - x) < 46) this.damageZombie(z, 1800);
      }
    }

    emitSun(x, y, value) {
      this.suns.push({
        x: x, y: y, startY: y, targetY: y + 26,
        value: value, mode: 'fall', life: SUN_LIFE, born: this.time
      });
      A.sunSpawn();
    }

    killZombie(z) {
      if (!z.dead) { z.dead = true; z.deadT = 0; }
    }

    aliveZombieExists() {
      return this.zombies.some(function (z) { return !z.dead; });
    }

    removePlant(pl, idx, leaves) {
      const i = this.plants.indexOf(pl);
      if (i >= 0) this.plants.splice(i, 1);
      if (this.grid[pl.r][pl.c] === pl) this.grid[pl.r][pl.c] = null;
      if (leaves) PVZ._splat(this, pl.x, pl.y - 30, '#7cc242', 7, 70);
    }

    /* ---- 种植 API（供输入调用） ---- */
    tryPlant(type, r, c) {
      const def = P[type];
      if (this.grid[r][c]) return false;
      if (this.sun < def.cost) return false;
      if (this.cooldowns[type]) return false;
      const pl = {
        type: type, r: r, c: c,
        x: L.rootX(c), y: L.rootY(r),
        hp: def.hp, maxHp: def.hp,
        age: 0, spawnT: 0,
        shoot: SHOOT_INTERVAL * 0.6,
        produce: 7,
        recoilT: 0, tilt: 0,
        armed: false, arm: 14,
        digest: 0, chomping: false, chompT: 0, victim: null,
        fuse: type === 'cherrybomb' || type === 'jalapeno' ? 1.05 : 0,
        air: false, airT: 0, fromX: 0, toX: 0, smashing: false, smashT: 0,
        grown: false, grow: 18
      };
      this.grid[r][c] = pl;
      this.plants.push(pl);
      this.sun -= def.cost;
      this.cooldowns[type] = def.recharge;
      A.plant();
      return true;
    }

    /* ================= 输入 ================= */
    /** @param {{x:number,y:number}} p 逻辑坐标 */
    handlePress(p) {
      if (this.state !== 'playing') return;
      const x = p.x, y = p.y;

      // HUD 区域
      if (y < L.HUD_H) {
        for (const rc of this.rects.cards) {
          if (inside(x, y, rc)) {
            const type = rc.type;
            const ok = this.sun >= P[type].cost && !this.cooldowns[type];
            this.selectedCard = ok && this.selectedCard !== type ? type : null;
            this.shovelMode = false;
            A.ui();
            return;
          }
        }
        if (this.rects.shovel && inside(x, y, this.rects.shovel)) {
          this.shovelMode = !this.shovelMode;
          this.selectedCard = null;
          A.ui();
          return;
        }
        if (this.rects.pause && inside(x, y, this.rects.pause)) {
          this.pause();
          return;
        }
        return;
      }

      // 优先收集阳光
      for (const s of this.suns) {
        if (s.mode === 'fly') continue;
        if (Math.hypot(s.x - x, s.y - y) < 28) {
          s.mode = 'fly';
          s.flyT = 0;
          s.sx = s.x; s.sy = s.y;
          s.cx = x; s.cy = y;
          A.sunCollect();
          return;
        }
      }

      const cell = this.pointToCell(x, y);
      if (!cell) {
        this.selectedCard = null;
        this.shovelMode = false;
        return;
      }
      if (this.shovelMode) {
        const pl = this.grid[cell.r][cell.c];
        if (pl) {
          this.removePlant(pl, 0, true);
          A.shovel();
        }
        this.shovelMode = false;
        return;
      }
      if (this.selectedCard) {
        if (this.tryPlant(this.selectedCard, cell.r, cell.c)) this.selectedCard = null;
      }
    }

    handleMove(x, y) {
      this.pointer.x = x; this.pointer.y = y; this.pointer.inside = true;
    }

    pointToCell(x, y) {
      if (x < L.X0 || x >= L.X1 || y < L.Y0 || y >= L.Y1) return null;
      return {
        c: Math.floor((x - L.X0) / L.CELL_W),
        r: Math.floor((y - L.Y0) / L.CELL_H)
      };
    }

    pause() {
      if (this.state === 'playing') {
        this.state = 'paused';
        A.mowerStop();
        this.mowerSounding = false;
        PVZ.events && PVZ.events.emit('paused');
      }
    }
    resume() {
      if (this.state === 'paused') this.state = 'playing';
    }

    win() {
      if (this.state !== 'playing') return;
      this.state = 'won';
      A.mowerStop();
      A.win();
      const reward = this.cfg.reward;
      this.result = { win: true, reward: reward };
      PVZ.events && PVZ.events.emit('result', this.result);
    }
    lose() {
      if (this.state !== 'playing') return;
      this.state = 'lost';
      A.mowerStop();
      A.lose();
      this.result = { win: false };
      PVZ.events && PVZ.events.emit('result', this.result);
    }

    /* ================= 渲染 ================= */
    render(ctx) {
      PVZ.Art.background(ctx, this.sceneType, this.time);

      // 割草机
      for (const m of this.mowers) {
        if (m.used) continue;
        ctx.save();
        ctx.translate(m.x, m.y);
        PVZ.Art.lawnmower(ctx, m.active);
        ctx.restore();
      }

      // 逐行：植物 → 僵尸
      for (let r = 0; r < L.ROWS; r++) {
        for (let c = 0; c < L.COLS; c++) {
          const pl = this.grid[r][c];
          if (pl) this.drawPlant(ctx, pl);
        }
        for (const z of this.zombies) {
          if (z.r === r) this.drawZombie(ctx, z);
        }
      }

      // 投射物
      for (const pr of this.projectiles) {
        ctx.save();
        ctx.translate(pr.x, pr.y);
        PVZ.Art.projectile(ctx, pr);
        ctx.restore();
      }

      // 阳光
      for (const s of this.suns) {
        let alpha = 1;
        if (s.mode === 'idle' && s.life < 2) alpha = 0.4 + 0.6 * Math.abs(Math.sin(this.time * 6));
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(s.x, s.y);
        const sc = s.value < 25 ? 0.78 : 1;
        ctx.scale(sc, sc);
        PVZ.Art.sun(ctx, 22, this.time + (s.born || 0));
        ctx.restore();
      }

      // 粒子
      this.drawParticles(ctx);

      // HUD
      this.drawHUD(ctx);

      // 悬停格子高亮
      if (this.state === 'playing' && (this.selectedCard || this.shovelMode) && this.pointer.y >= L.Y0) {
        const cell = this.pointToCell(this.pointer.x, this.pointer.y);
        if (cell) {
          let ok;
          if (this.shovelMode) ok = !!this.grid[cell.r][cell.c];
          else ok = !this.grid[cell.r][cell.c] && this.sun >= P[this.selectedCard].cost;
          ctx.fillStyle = ok ? 'rgba(255,240,150,0.4)' : 'rgba(255,80,60,0.35)';
          ctx.fillRect(L.X0 + cell.c * L.CELL_W, L.Y0 + cell.r * L.CELL_H, L.CELL_W, L.CELL_H);
        }
      }

      // 横幅
      if (this.banner) this.drawBanner(ctx, this.banner.text, this.banner.color);
      if (this.warning && !this.banner) this.drawBanner(ctx, '一大波僵尸正在接近！', '#c8241a');
    }

    drawPlant(ctx, pl) {
      const k = Math.min(1, pl.spawnT);
      const sq = k < 1 ? 0.5 + 0.5 * easeOutBack(k) : 1;
      ctx.save();
      ctx.translate(pl.x, pl.y);
      ctx.scale(sq, 2 - sq > 1.25 ? 1.25 : 2 - sq);
      const st = {
        t: this.time + pl.c,
        tilt: pl.tilt,
        recoil: pl.recoilT > 0,
        hpRatio: pl.hp / pl.maxHp,
        shake: pl.fuse > 0 && pl.fuse < 0.9,
        ready: pl.armed,
        blink: Math.sin(this.time * 9 + pl.c) > 0,
        eating: pl.digest > 0,
        chomp: pl.chomping,
        air: pl.air,
        smash: pl.smashing,
        grown: pl.grown
      };
      PVZ.Art[pl.type](ctx, st);
      ctx.restore();
    }

    drawZombie(ctx, z) {
      ctx.save();
      ctx.translate(z.x, z.y);
      if (z.dead) {
        const k = Math.min(1, z.deadT / 0.6);
        ctx.globalAlpha = z.deadT > 0.7 ? Math.max(0, 1 - (z.deadT - 0.7) / 0.6) : 1;
        ctx.translate(0, easeOutQuad(k) * 10);
        ctx.rotate(-Math.PI / 2 * easeOutQuad(k));
      }
      if (z.vaulting) {
        const k = z.vaultT / 0.45;
        ctx.translate(0, -Math.sin(k * Math.PI) * 70);
      }
      const st = {
        walk: z.state === 'walk' ? z.walkT : 0,
        nod: z.state === 'eat',
        nodT: z.nodT,
        eating: z.state === 'eat',
        t: this.time,
        vaulting: z.vaulting,
        hasPole: z.hasPole,
        raging: z.raging
      };
      PVZ.Art[z.type](ctx, st);
      // 减速冰霜覆盖
      if (z.chill > 0 && !z.dead) {
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.ellipse(0, -45, 26, 52, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#8fe6ff';
        ctx.fill();
      }
      ctx.restore();
    }

    drawParticles(ctx) {
      for (const p of this.particles) {
        const a = Math.max(0, p.life / p.maxLife);
        if (p.type === 'ring') {
          const k = 1 - a;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r0 + (p.r1 - p.r0) * k, 0, np2());
          ctx.globalAlpha = a;
          ctx.lineWidth = 6 * a + 1;
          ctx.strokeStyle = p.color;
          ctx.stroke();
        } else {
          ctx.globalAlpha = a;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.5 + a * 0.5), 0, np2());
          ctx.fillStyle = p.color;
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    /* ---- HUD ---- */
    drawHUD(ctx) {
      PVZ.Art.hudBar(ctx);
      this.rects.cards = [];

      // 阳光计数器（圆形木牌）
      ctx.save();
      ctx.beginPath();
      ctx.arc(44, 48, 40, 0, np2());
      const grd = ctx.createRadialGradient(30, 34, 6, 44, 48, 42);
      grd.addColorStop(0, '#a06e3e');
      grd.addColorStop(1, '#6d4526');
      ctx.fillStyle = grd; ctx.fill();
      ctx.lineWidth = 3.4; ctx.strokeStyle = '#3e2812'; ctx.stroke();
      ctx.translate(44, 34);
      PVZ.Art.sun(ctx, 17, this.time);
      ctx.restore();
      ctx.fillStyle = '#fff4b0';
      ctx.font = '800 22px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#3e2812';
      ctx.lineWidth = 4;
      ctx.strokeText(String(this.sun), 44, 78);
      ctx.fillText(String(this.sun), 44, 78);

      // 植物卡片
      const cw = 62, ch = 84, gapX = 8, xStart = 94;
      this.cards.forEach((type, i) => {
        const x = xStart + i * (cw + gapX);
        const y = 6;
        const def = P[type];
        const onCd = !!this.cooldowns[type];
        const poor = this.sun < def.cost;
        const selected = this.selectedCard === type;

        ctx.save();
        pathRoundRect(ctx, x, y, cw, ch, 9);
        const cg = ctx.createLinearGradient(x, y, x, y + ch);
        cg.addColorStop(0, '#f7e9bf');
        cg.addColorStop(1, '#e3d0a0');
        ctx.fillStyle = cg; ctx.fill();
        ctx.lineWidth = selected ? 4 : 2.6;
        ctx.strokeStyle = selected ? '#ffd93b' : '#7a5230';
        ctx.stroke();
        // 立绘
        ctx.save();
        ctx.translate(x + cw / 2, y + 46);
        ctx.scale(0.52, 0.52);
        PVZ.Art[type](ctx, { t: 0, blink: true, ready: true, grown: true });
        ctx.restore();
        // 消耗
        ctx.fillStyle = '#3a2a14';
        ctx.font = '800 17px "PingFang SC",sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(String(def.cost), x + 6, y + ch - 6);
        ctx.textAlign = 'right';
        ctx.fillText('☀', x + cw - 5, y + ch - 6);

        // 冷却遮罩
        if (onCd) {
          const ratio = this.cooldowns[type] / def.recharge;
          ctx.save();
          pathRoundRect(ctx, x, y, cw, ch * ratio, 9);
          ctx.fillStyle = 'rgba(40,32,20,0.62)';
          ctx.fill();
          ctx.restore();
        }
        if (poor && !onCd) {
          ctx.save();
          pathRoundRect(ctx, x, y, cw, ch, 9);
          ctx.fillStyle = 'rgba(30,24,14,0.45)';
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
        this.rects.cards.push({ x: x, y: y, w: cw, h: ch, type: type });
      });

      // 铲子
      const shX = xStart + this.cards.length * (cw + gapX) + 4;
      const shY = 14;
      ctx.save();
      pathRoundRect(ctx, shX, shY, 52, 68, 9);
      ctx.fillStyle = this.shovelMode ? '#c98d4e' : '#8a5e36';
      ctx.fill();
      ctx.lineWidth = this.shovelMode ? 3.4 : 2.4;
      ctx.strokeStyle = this.shovelMode ? '#ffd93b' : '#3e2812';
      ctx.stroke();
      ctx.translate(shX + 26, shY + 38);
      ctx.scale(0.78, 0.78);
      PVZ.Art.shovel(ctx);
      ctx.restore();
      this.rects.shovel = { x: shX, y: shY, w: 52, h: 68 };

      // 进度条
      const bx = shX + 64, by = 44, bw = L.W - bx - 76, bh = 22;
      this.drawProgress(ctx, bx, by, bw, bh);

      // 暂停按钮
      const px = L.W - 60, py = 34, pr2 = 24;
      ctx.beginPath();
      ctx.arc(px, py, pr2, 0, np2());
      ctx.fillStyle = '#f3e2b3';
      ctx.fill();
      ctx.lineWidth = 2.6; ctx.strokeStyle = '#3e2812'; ctx.stroke();
      ctx.fillStyle = '#3a2a14';
      ctx.fillRect(px - 7, py - 9, 5, 18);
      ctx.fillRect(px + 3, py - 9, 5, 18);
      this.rects.pause = { x: px - pr2, y: py - pr2, w: pr2 * 2, h: pr2 * 2 };
    }

    drawProgress(ctx, x, y, w, h) {
      // 牌底
      pathRoundRect(ctx, x - 6, y - 10, w + 12, h + 20, 8);
      ctx.fillStyle = '#5a3c20';
      ctx.fill();
      ctx.lineWidth = 2.4; ctx.strokeStyle = '#3e2812'; ctx.stroke();
      // 轨道
      ctx.fillStyle = '#3a2a14';
      ctx.fillRect(x, y, w, h);
      // 进度（按出生进度）
      const ratio = this.totalSpawns ? this.spawnIdx / this.totalSpawns : 0;
      const fg = ctx.createLinearGradient(x, 0, x + w, 0);
      fg.addColorStop(0, '#7cc242');
      fg.addColorStop(1, '#a8e05a');
      ctx.fillStyle = fg;
      ctx.fillRect(x, y, w * ratio, h);
      // 大波旗帜标记（按事件索引定位）
      this.spawns.forEach((ev, i) => {
        if (!ev.big) return;
        const fx = x + w * (i / this.totalSpawns);
        ctx.fillStyle = '#d8302c';
        ctx.beginPath();
        ctx.moveTo(fx, y - 8); ctx.lineTo(fx + 9, y - 5); ctx.lineTo(fx, y - 2);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#e8e4d8';
        ctx.fillRect(fx - 0.8, y - 8, 1.6, h + 8);
      });
      // 僵尸头当前位置（装饰）
      ctx.fillStyle = '#9bb06a';
      ctx.beginPath();
      ctx.arc(x + w * ratio + 4, y + h / 2, 8, 0, np2());
      ctx.fill();
      ctx.lineWidth = 1.6; ctx.strokeStyle = INK; ctx.stroke();
    }

    drawBanner(ctx, text, color) {
      ctx.save();
      ctx.font = '800 34px "PingFang SC","Microsoft YaHei",sans-serif';
      const tw = ctx.measureText(text).width + 60;
      const x = (L.W - tw) / 2, y = 210;
      pathRoundRect(ctx, x, y, tw, 64, 14);
      ctx.fillStyle = 'rgba(243,226,179,0.95)';
      ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = color; ctx.stroke();
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, L.W / 2, y + 33);
      ctx.restore();
    }
  }

  /* ---------- helpers ---------- */
  function np2() { return Math.PI * 2; }
  function inside(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }
  function pathRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function easeOutBack(t) {
    const c = 1.70158;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  }
  function easeOutQuad(t) { return 1 - (1 - t) * (1 - t); }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function bezier(a, b, c, d, t) {
    const it = 1 - t;
    return it * it * it * a + 3 * it * it * t * b + 3 * it * t * t * c + t * t * t * d;
  }
  function burst(x, y, color, n, power) {
    // 返回首个粒子数组不合适；改为直接构造粒子数组由调用方 push：这里用 fake 容器
    const arr = [];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * np2();
      const sp = (power || 100) * (0.4 + Math.random() * 0.8);
      arr.push({
        type: 'spark', x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
        gravity: 200, life: 0.5 + Math.random() * 0.3, maxLife: 0.8,
        size: 3 + Math.random() * 3, color: color
      });
    }
    return arr;
  }

  // burst 返回数组，需要展开；修正调用处行为：包装 splat
  function splatPush(scene, x, y, color, n, power) {
    const arr = burst(x, y, color, n, power);
    arr.forEach(function (p) { scene.particles.push(p); });
  }

  PVZ.GameScene = GameScene;
  PVZ._splat = splatPush;
})();
