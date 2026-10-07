/* main.js — 入口：Canvas 设置、响应式缩放、统一输入、主循环、流程编排 */
(function () {
  'use strict';
  const PVZ = window.PVZ;
  const L = PVZ.LAYOUT;
  const audio = PVZ.audio;

  // ---------- Canvas ----------
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = L.W;
  canvas.height = L.H;

  function fitCanvas() {
    const topPad = 10;
    const scale = Math.min(
      (window.innerWidth - 16) / L.W,
      (window.innerHeight - topPad) / L.H
    );
    const s = Math.max(0.4, scale);
    canvas.style.width = L.W * s + 'px';
    canvas.style.height = L.H * s + 'px';
  }
  window.addEventListener('resize', fitCanvas);
  fitCanvas();

  // ---------- 存档 ----------
  PVZ.saveData = PVZ.storage.load();
  audio.setMuted(PVZ.saveData.muted);

  // ---------- 覆盖层宿主 ----------
  const overlay = document.getElementById('overlay');
  const app = {
    scene: null,
    levelIndex: 0,
    lastCards: null,
    inGame: false
  };

  // 简单事件总线
  PVZ.events = {
    handlers: {}
  };
  PVZ.events.on = function (name, fn) {
    (this.handlers[name] = this.handlers[name] || []).push(fn);
  };
  PVZ.events.emit = function (name, data) {
    (this.handlers[name] || []).forEach(function (fn) { fn(data); });
  };

  PVZ.Screens.init(overlay, {
    onStartLevel: function (idx, cards) { startLevel(idx, cards); },
    onResume: function () { app.scene && app.scene.resume(); },
    onRestart: function () {
      if (app.lastCards) startLevel(app.levelIndex, app.lastCards);
    },
    onQuit: function () { quitToMenu(); },
    onNextLevel: function () {
      const next = app.levelIndex + 1;
      PVZ.Screens.showChooser(next);
    }
  });
  PVZ.Screens.setSave(PVZ.saveData);

  PVZ.events.on('paused', function () {
    PVZ.Screens.showPause();
  });
  PVZ.events.on('result', function (result) {
    // 延迟一点展示，让最后的动画/音效收尾
    setTimeout(function () {
      if (result.win) recordProgress(app.levelIndex);
      PVZ.Screens.setSave(PVZ.saveData);
      PVZ.Screens.showResult(result, app.levelIndex);
    }, result.win ? 450 : 700);
  });

  function recordProgress(idx) {
    if (PVZ.saveData.progress < idx + 1) {
      PVZ.saveData.progress = idx + 1;
      PVZ.storage.save(PVZ.saveData);
    } else {
      PVZ.storage.save(PVZ.saveData);
    }
  }

  function startLevel(idx, cards) {
    app.levelIndex = idx;
    app.lastCards = cards;
    app.inGame = true;
    app.scene = new PVZ.GameScene(idx, cards);
    audio.ensure();
    audio.startMusic(PVZ.LEVELS[idx].scene);
  }

  function quitToMenu() {
    app.inGame = false;
    app.scene = null;
    audio.stopMusic();
  }

  // ---------- 输入：鼠标 + 触屏统一 ----------
  function toLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / rect.width * L.W,
      y: (clientY - rect.top) / rect.height * L.H
    };
  }

  canvas.addEventListener('mousedown', function (e) {
    e.preventDefault();
    audio.ensure();
    const p = toLogical(e.clientX, e.clientY);
    if (app.scene) app.scene.handlePress(p);
  });
  canvas.addEventListener('mousemove', function (e) {
    const p = toLogical(e.clientX, e.clientY);
    if (app.scene) app.scene.handleMove(p.x, p.y);
  });
  canvas.addEventListener('mouseleave', function () {
    if (app.scene) app.scene.pointer.inside = false;
  });

  // 触屏：touchstart 即按下
  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    audio.ensure();
    const tch = e.changedTouches[0];
    const p = toLogical(tch.clientX, tch.clientY);
    if (app.scene) {
      app.scene.handleMove(p.x, p.y);
      app.scene.handlePress(p);
    }
  }, { passive: false });
  canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
    const tch = e.changedTouches[0];
    const p = toLogical(tch.clientX, tch.clientY);
    if (app.scene) app.scene.handleMove(p.x, p.y);
  }, { passive: false });

  // 键盘快捷键：Esc/P 暂停
  window.addEventListener('keydown', function (e) {
    if (!app.scene) return;
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      if (app.scene.state === 'playing') app.scene.pause();
      else if (app.scene.state === 'paused') {
        app.scene.resume();
        PVZ.Screens.hideAll();
      }
    }
  });

  // ---------- 主循环 ----------
  let last = performance.now();
  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05; // 切后台回来防跳变

    if (app.scene) {
      app.scene.update(dt);
      app.scene.render(ctx);
    } else {
      drawIdle(ctx, now / 1000);
    }
    requestAnimationFrame(frame);
  }

  // 菜单背后的动态背景
  function drawIdle(ctx, t) {
    PVZ.Art.background(ctx, 'day', t);
    ctx.fillStyle = 'rgba(30,40,20,0.18)';
    ctx.fillRect(0, 0, L.W, L.H);
  }

  // 启动：主菜单
  PVZ.Screens.showMenu();
  requestAnimationFrame(frame);
})();
