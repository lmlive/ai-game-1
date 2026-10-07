/* art-scene.js — 场景、阳光、投射物、割草机等道具的原创 Canvas 绘制 */
(function () {
  'use strict';
  const PVZ = (window.PVZ = window.PVZ || {});
  const Art = (PVZ.Art = PVZ.Art || {});
  const L = PVZ.LAYOUT;
  const INK = '#2e2a1e';

  function pathCircle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
  function fillStroke(ctx, fill, lw) {
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = lw || 3;
    ctx.strokeStyle = INK;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  // ---- 院子背景 ----
  Art.background = function (ctx, scene, t) {
    const night = scene === 'night';
    // 地面基底
    const grd = ctx.createLinearGradient(0, L.Y0, 0, L.H);
    if (night) {
      grd.addColorStop(0, '#28364f');
      grd.addColorStop(1, '#1b2538');
    } else {
      grd.addColorStop(0, '#8cc84b');
      grd.addColorStop(1, '#74b038');
    }
    ctx.fillStyle = grd;
    ctx.fillRect(0, L.Y0, L.W, L.H - L.Y0);

    // 格子棋盘
    for (let r = 0; r < L.ROWS; r++) {
      for (let c = 0; c < L.COLS; c++) {
        const light = (r + c) % 2 === 0;
        ctx.fillStyle = night
          ? (light ? '#2b3a55' : '#242f47')
          : (light ? '#7cc242' : '#5fa832');
        ctx.fillRect(L.X0 + c * L.CELL_W, L.Y0 + r * L.CELL_H, L.CELL_W, L.CELL_H);
      }
    }
    // 格子边线
    ctx.strokeStyle = night ? 'rgba(20,28,44,0.5)' : 'rgba(90,60,30,0.35)';
    ctx.lineWidth = 1.4;
    for (let c = 0; c <= L.COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(L.X0 + c * L.CELL_W, L.Y0);
      ctx.lineTo(L.X0 + c * L.CELL_W, L.Y1);
      ctx.stroke();
    }
    for (let r = 0; r <= L.ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(L.X0, L.Y0 + r * L.CELL_H);
      ctx.lineTo(L.X1, L.Y0 + r * L.CELL_H);
      ctx.stroke();
    }
    // 草坪底部阴影
    const sh = ctx.createLinearGradient(0, L.Y1 - 24, 0, L.Y1);
    sh.addColorStop(0, 'rgba(0,0,0,0)');
    sh.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = sh;
    ctx.fillRect(L.X0, L.Y1 - 24, L.X1 - L.X0, 24);

    drawHouse(ctx, night);
    drawGraveyard(ctx, night, t);

    // 夜晚漂浮微光
    if (night) {
      for (let i = 0; i < 12; i++) {
        const x = (i * 137.5) % L.W;
        const y = L.Y0 + 20 + ((i * 89) % (L.ROWS * L.CELL_H - 40));
        const a = 0.25 + 0.25 * Math.sin(t * 1.5 + i);
        pathCircle(ctx, x, y, 1.8);
        ctx.fillStyle = 'rgba(190,220,255,' + a.toFixed(3) + ')';
        ctx.fill();
      }
    }
  };

  function drawHouse(ctx, night) {
    // 木栅栏（房子与草坪之间）
    ctx.fillStyle = '#8a5a30';
    for (let x = L.X0 - 12; x < L.X0 + 4; x += 9) {
      ctx.fillRect(x, L.Y0 + 30, 6, L.Y1 - L.Y0 - 30);
      ctx.beginPath();
      ctx.moveTo(x, L.Y0 + 30); ctx.lineTo(x + 3, L.Y0 + 24); ctx.lineTo(x + 6, L.Y0 + 30);
      ctx.closePath();
      ctx.fillStyle = '#a06a38'; ctx.fill();
      ctx.fillStyle = '#8a5a30';
    }
    // 木屋
    ctx.save();
    ctx.translate(4, 0);
    // 墙
    const wallGrd = ctx.createLinearGradient(0, 180, 0, 460);
    wallGrd.addColorStop(0, night ? '#5a4a52' : '#c98d4e');
    wallGrd.addColorStop(1, night ? '#42383e' : '#a7703c');
    ctx.fillStyle = wallGrd;
    ctx.fillRect(0, 200, 86, 260);
    ctx.lineWidth = 3; ctx.strokeStyle = INK;
    ctx.strokeRect(0, 200, 86, 260);
    // 屋顶
    ctx.beginPath();
    ctx.moveTo(-10, 210); ctx.lineTo(43, 130); ctx.lineTo(96, 210);
    ctx.closePath();
    ctx.fillStyle = night ? '#6a3a4a' : '#9c4a30';
    ctx.fill();
    ctx.lineWidth = 3; ctx.stroke();
    // 门
    ctx.fillStyle = night ? '#4a2f38' : '#7a4a28';
    ctx.fillRect(28, 330, 30, 130);
    ctx.lineWidth = 2.6; ctx.strokeRect(28, 330, 30, 130);
    pathCircle(ctx, 52, 398, 2.4);
    ctx.fillStyle = '#ffd93b'; ctx.fill();
    // 窗
    ctx.fillStyle = night ? '#ffd97a' : '#bfe6ff';
    ctx.fillRect(12, 232, 26, 28);
    ctx.lineWidth = 2.4; ctx.strokeRect(12, 232, 26, 28);
    ctx.beginPath();
    ctx.moveTo(25, 232); ctx.lineTo(25, 260);
    ctx.moveTo(12, 246); ctx.lineTo(38, 246);
    ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
  }

  function drawGraveyard(ctx, night, t) {
    // 枯树
    ctx.save();
    ctx.strokeStyle = night ? '#3a3038' : '#6a4a30';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(985, L.Y1);
    ctx.quadraticCurveTo(980, 460, 986, 380);
    ctx.stroke();
    ctx.lineWidth = 5;
    for (const b of [[970, 360, 950, 320], [1000, 350, 990, 300], [975, 330, 960, 290]]) {
      ctx.beginPath();
      ctx.moveTo(b[0], b[1]); ctx.quadraticCurveTo((b[0] + b[2]) / 2, b[1] - 20, b[2], b[3]);
      ctx.stroke();
    }
    ctx.restore();
    // 墓碑
    const stones = [[930, L.Y1 - 8, 26, 40], [966, L.Y1 - 6, 20, 30], [912, L.Y1 - 10, 18, 26]];
    stones.forEach(function (s, i) {
      ctx.beginPath();
      ctx.moveTo(s[0] - s[2], s[1]);
      ctx.lineTo(s[0] - s[2], s[1] - s[3] + s[2]);
      ctx.quadraticCurveTo(s[0], s[1] - s[3] - s[2] * 0.6, s[0] + s[2], s[1] - s[3] + s[2]);
      ctx.lineTo(s[0] + s[2], s[1]);
      ctx.closePath();
      ctx.fillStyle = night ? '#5a5868' : '#9a9488';
      ctx.fill();
      ctx.lineWidth = 2.6; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = night ? '#3a3848' : '#7a7468';
      ctx.fillRect(s[0] - 8, s[1] - s[3] + 4, 16, 2.6);
    });
    // 草丛
    ctx.strokeStyle = night ? '#3c5038' : '#5a8a30';
    ctx.lineWidth = 2.4;
    for (let i = 0; i < 14; i++) {
      const x = 905 + i * 7;
      ctx.beginPath();
      ctx.moveTo(x, L.Y1);
      ctx.quadraticCurveTo(x + 3, L.Y1 - 8 + Math.sin(t + i) * 2, x + 1, L.Y1 - 12);
      ctx.stroke();
    }
  }

  // ---- 顶部木质 HUD 栏 ----
  Art.hudBar = function (ctx) {
    const grd = ctx.createLinearGradient(0, 0, 0, L.HUD_H);
    grd.addColorStop(0, '#8a5e36');
    grd.addColorStop(1, '#6d4526');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, L.W, L.HUD_H);
    // 木纹
    ctx.strokeStyle = 'rgba(60,36,16,0.35)';
    ctx.lineWidth = 2;
    for (let y = 18; y < L.HUD_H; y += 17) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(250, y - 5, 750, y + 5, L.W, y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, L.HUD_H - 3); ctx.lineTo(L.W, L.HUD_H - 3);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#3e2812';
    ctx.stroke();
  };

  // ---- 阳光（可收集 / 计数器图标） ----
  Art.sun = function (ctx, radius, t) {
    radius = radius || 24;
    t = t || 0;
    ctx.save();
    ctx.rotate(t * 0.8);
    ctx.fillStyle = '#ffd93b';
    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.rotate((i / 8) * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(-5, -radius - 4);
      ctx.lineTo(0, -radius - 14);
      ctx.lineTo(5, -radius - 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    const grd = ctx.createRadialGradient(-radius * 0.3, -radius * 0.35, 2, 0, 0, radius);
    grd.addColorStop(0, '#fff4b0');
    grd.addColorStop(0.6, '#ffd93b');
    grd.addColorStop(1, '#f0b01f');
    pathCircle(ctx, 0, 0, radius);
    ctx.fillStyle = grd; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#c8901f'; ctx.stroke();
    pathCircle(ctx, -radius * 0.28, -radius * 0.3, radius * 0.28);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fill();
  };

  // ---- 投射物 ----
  Art.projectile = function (ctx, p) {
    if (p.kind === 'pea') {
      const grd = ctx.createRadialGradient(-3, -3, 1, 0, 0, 9);
      grd.addColorStop(0, '#c4f59a');
      grd.addColorStop(1, '#5fc23a');
      pathCircle(ctx, 0, 0, 8);
      ctx.fillStyle = grd; ctx.fill();
      ctx.lineWidth = 1.8; ctx.strokeStyle = '#3a7d22'; ctx.stroke();
    } else if (p.kind === 'snow') {
      const grd = ctx.createRadialGradient(-3, -3, 1, 0, 0, 9);
      grd.addColorStop(0, '#e8fbff');
      grd.addColorStop(1, '#6fd8ff');
      pathCircle(ctx, 0, 0, 8);
      ctx.fillStyle = grd; ctx.fill();
      ctx.lineWidth = 1.8; ctx.strokeStyle = '#3b9ec0'; ctx.stroke();
    } else if (p.kind === 'spore') {
      pathCircle(ctx, 0, 0, 5);
      ctx.fillStyle = 'rgba(200,170,255,0.85)';
      ctx.fill();
    }
  };

  // ---- 割草机（面朝右） ----
  Art.lawnmower = function (ctx, active) {
    ctx.save();
    // 红色推把
    ctx.beginPath();
    ctx.moveTo(-20, -14);
    ctx.lineTo(-34, -34);
    ctx.lineTo(-29, -36);
    ctx.lineTo(-15, -16);
    ctx.closePath();
    ctx.fillStyle = '#c83a2c';
    ctx.fill();
    ctx.lineWidth = 2.4; ctx.strokeStyle = INK; ctx.stroke();
    // 车身
    const grd = ctx.createLinearGradient(0, -30, 0, 4);
    grd.addColorStop(0, '#e8ecf0');
    grd.addColorStop(1, '#9aa2aa');
    ctx.beginPath();
    ctx.moveTo(-22, -6);
    ctx.lineTo(20, -6);
    ctx.quadraticCurveTo(24, -10, 22, -18);
    ctx.lineTo(14, -28);
    ctx.lineTo(-14, -28);
    ctx.quadraticCurveTo(-24, -24, -22, -6);
    ctx.closePath();
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.lineWidth = 3; ctx.stroke();
    // 引擎小眼睛
    pathCircle(ctx, 10, -17, 4);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.lineWidth = 1.6; ctx.stroke();
    pathCircle(ctx, 11 + (active ? 1 : 0), -16, 2);
    ctx.fillStyle = INK; ctx.fill();
    // 滚轮
    for (const wx of [-12, 12]) {
      pathCircle(ctx, wx, 0, 7);
      ctx.fillStyle = '#5a5f66'; ctx.fill();
      ctx.lineWidth = 2.4; ctx.stroke();
      pathCircle(ctx, wx, 0, 2.6);
      ctx.fillStyle = '#c8cdd2'; ctx.fill();
    }
    ctx.restore();
  };

  // ---- 铲子图标 ----
  Art.shovel = function (ctx) {
    ctx.save();
    // 木柄
    ctx.beginPath();
    ctx.moveTo(-3, -26); ctx.lineTo(4, -30); ctx.lineTo(14, 6); ctx.lineTo(7, 10);
    ctx.closePath();
    ctx.fillStyle = '#b98a4d'; ctx.fill();
    ctx.lineWidth = 2.4; ctx.strokeStyle = INK; ctx.stroke();
    // 把手横木
    ctx.beginPath();
    ctx.ellipse(0, -30, 8, 4, -0.6, 0, Math.PI * 2);
    ctx.fillStyle = '#8a6236'; ctx.fill();
    ctx.lineWidth = 2.4; ctx.stroke();
    // 金属铲头
    ctx.beginPath();
    ctx.moveTo(6, 8);
    ctx.quadraticCurveTo(20, 12, 16, 30);
    ctx.quadraticCurveTo(10, 36, 2, 30);
    ctx.quadraticCurveTo(-2, 14, 6, 8);
    ctx.closePath();
    const grd = ctx.createLinearGradient(0, 8, 0, 32);
    grd.addColorStop(0, '#d8dde2');
    grd.addColorStop(1, '#8a9298');
    ctx.fillStyle = grd; ctx.fill();
    ctx.lineWidth = 2.6; ctx.stroke();
    ctx.restore();
  };
})();
