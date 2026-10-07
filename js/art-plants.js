/* art-plants.js — 全部植物均为 Canvas 2D 代码原创绘制。
   约定：设计格宽 90px，根部原点 (0,0)，向上为 y 负方向，ctx 已平移缩放。 */
(function () {
  'use strict';
  const PVZ = (window.PVZ = window.PVZ || {});
  const Art = (PVZ.Art = PVZ.Art || {});
  const INK = '#2e2a1e';

  // 通用工具
  function pathCircle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
  function pathEllipse(ctx, x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
  }
  function fillStroke(ctx, fill, lw) {
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = lw || 3;
    ctx.strokeStyle = INK;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
  function drawEyes(ctx, x1, x2, y, r, lookX) {
    lookX = lookX || 0;
    [[x1, y], [x2, y]].forEach(function (p) {
      pathCircle(ctx, p[0], p[1], r);
      fillStroke(ctx, '#ffffff', 1.6);
      pathCircle(ctx, p[0] + lookX + 0.8, p[1] + 0.6, r * 0.55);
      ctx.fillStyle = INK; ctx.fill();
    });
  }
  // 叶片
  function leaf(ctx, x, y, sx, sy, rot, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    pathEllipse(ctx, 0, 0, sx, sy, 0);
    fillStroke(ctx, color || '#4e9e2f', 2.6);
    ctx.beginPath(); ctx.moveTo(-sx * 0.6, 0); ctx.lineTo(sx * 0.6, 0);
    ctx.lineWidth = 1.4; ctx.stroke();
    ctx.restore();
  }
  function stem(ctx, h, color) {
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.quadraticCurveTo(-7, -h / 2, -5, -h);
    ctx.lineTo(5, -h);
    ctx.quadraticCurveTo(7, -h / 2, 6, 0);
    ctx.closePath();
    fillStroke(ctx, color || '#3a7d22', 3);
  }

  /* ---------------- 豌豆射手 ---------------- */
  Art.peashooter = function (ctx, s) {
    s = s || {};
    const tilt = s.tilt || 0;
    leaf(ctx, -14, -22, 16, 8, -0.5, '#4e9e2f');
    leaf(ctx, 14, -30, 16, 8, 0.5, '#4e9e2f');
    stem(ctx, 46);
    ctx.save();
    ctx.translate(0, -52);
    ctx.rotate(tilt);
    // 后炮筒（recoil 时改变）
    const rec = s.recoil ? 3 : 0;
    pathEllipse(ctx, 16 - rec, -2, 15, 12.5, 0);
    fillStroke(ctx, '#5cb437', 3);
    // 头
    const grd = ctx.createRadialGradient(-6, -10, 4, 0, 0, 26);
    grd.addColorStop(0, '#8fe063');
    grd.addColorStop(1, '#4e9e2f');
    pathCircle(ctx, 0, 0, 24);
    ctx.fillStyle = grd; ctx.fill();
    ctx.lineWidth = 3; ctx.stroke();
    // 嘴
    pathCircle(ctx, 18 - rec, -2, 8.5);
    fillStroke(ctx, '#3a7d22', 2.6);
    pathCircle(ctx, 20 - rec, -2, 4.2);
    ctx.fillStyle = '#2c5e1a'; ctx.fill();
    // 眼
    drawEyes(ctx, -2, 9, -9, 6.4, 1.2);
    ctx.restore();
  };

  /* ---------------- 向日葵 ---------------- */
  Art.sunflower = function (ctx, s) {
    s = s || {};
    leaf(ctx, -14, -20, 15, 7.5, -0.5, '#4e9e2f');
    stem(ctx, 42);
    ctx.save();
    ctx.translate(0, -58);
    const sway = Math.sin(s.t || 0) * 0.05;
    ctx.rotate(sway);
    // 花瓣（两层）
    for (let layer = 0; layer < 2; layer++) {
      const n = layer === 0 ? 14 : 12;
      const rad = layer === 0 ? 27 : 22;
      const len = layer === 0 ? 11 : 9;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (layer ? Math.PI / n : 0);
        ctx.save();
        ctx.translate(Math.cos(a) * rad, Math.sin(a) * rad);
        ctx.rotate(a);
        pathEllipse(ctx, 0, 0, len, 7, 0);
        ctx.fillStyle = layer ? '#ffc11f' : '#ffd93b';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = INK; ctx.stroke();
        ctx.restore();
      }
    }
    // 脸
    const grd = ctx.createRadialGradient(-5, -6, 3, 0, 0, 22);
    grd.addColorStop(0, '#a9712f');
    grd.addColorStop(1, '#7d5323');
    pathCircle(ctx, 0, 0, 21);
    ctx.fillStyle = grd; ctx.fill();
    ctx.lineWidth = 3; ctx.stroke();
    drawEyes(ctx, -6, 7, -4, 6, 1);
    // 笑容
    ctx.beginPath();
    ctx.arc(0, 4, 8, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.lineWidth = 2.4; ctx.stroke();
    ctx.restore();
  };

  /* ---------------- 寒冰射手 ---------------- */
  Art.snowpea = function (ctx, s) {
    s = s || {};
    leaf(ctx, -14, -22, 16, 8, -0.5, '#3fae9c');
    leaf(ctx, 14, -30, 16, 8, 0.5, '#3fae9c');
    stem(ctx, 46, '#2e8b7a');
    ctx.save();
    ctx.translate(0, -52);
    ctx.rotate(s.tilt || 0);
    const rec = s.recoil ? 3 : 0;
    pathEllipse(ctx, 16 - rec, -2, 15, 12.5, 0);
    fillStroke(ctx, '#56c4d8', 3);
    const grd = ctx.createRadialGradient(-6, -10, 4, 0, 0, 26);
    grd.addColorStop(0, '#bff3ff');
    grd.addColorStop(1, '#6fd8ff');
    pathCircle(ctx, 0, 0, 24);
    ctx.fillStyle = grd; ctx.fill();
    ctx.lineWidth = 3; ctx.stroke();
    pathCircle(ctx, 18 - rec, -2, 8.5);
    fillStroke(ctx, '#3ba3b8', 2.6);
    pathCircle(ctx, 20 - rec, -2, 4.2);
    ctx.fillStyle = '#2a6f80'; ctx.fill();
    drawEyes(ctx, -2, 9, -9, 6.4, 1.2);
    // 冰晶
    ctx.fillStyle = '#e8fbff';
    for (const ic of [[-15, -16], [13, 12], [-12, 14]]) {
      pathCircle(ctx, ic[0], ic[1], 2.6); ctx.fill();
    }
    ctx.restore();
  };

  /* ---------------- 双发射手 ---------------- */
  Art.repeater = function (ctx, s) {
    s = s || {};
    leaf(ctx, -14, -22, 16, 8, -0.5, '#4e9e2f');
    leaf(ctx, 14, -30, 16, 8, 0.5, '#4e9e2f');
    stem(ctx, 50);
    ctx.save();
    ctx.translate(0, -56);
    ctx.rotate(s.tilt || 0);
    const rec = s.recoil ? 3 : 0;
    const grd = ctx.createRadialGradient(-6, -10, 4, 0, 0, 26);
    grd.addColorStop(0, '#8fe063');
    grd.addColorStop(1, '#3f8f25');
    pathCircle(ctx, 0, 0, 24);
    ctx.fillStyle = grd; ctx.fill();
    ctx.lineWidth = 3; ctx.stroke();
    // 上下两个炮嘴
    for (const yy of [-9, 7]) {
      pathEllipse(ctx, 18 - rec, yy, 12, 9, 0);
      fillStroke(ctx, '#5cb437', 2.6);
      pathCircle(ctx, 20 - rec, yy, 4.6);
      ctx.fillStyle = '#2c5e1a'; ctx.fill();
    }
    drawEyes(ctx, -4, 8, -1, 6, 1);
    ctx.restore();
  };

  /* ---------------- 坚果墙 ---------------- */
  Art.wallnut = function (ctx, s) {
    s = s || {};
    const hp = s.hpRatio == null ? 1 : s.hpRatio;
    ctx.save();
    ctx.translate(0, -44);
    ctx.rotate(s.tilt || 0);
    const grd = ctx.createLinearGradient(-26, -40, 26, 40);
    grd.addColorStop(0, '#c98d4e');
    grd.addColorStop(1, '#9c6330');
    pathEllipse(ctx, 0, 0, 30, 40, 0);
    ctx.fillStyle = grd; ctx.fill();
    ctx.lineWidth = 3.4; ctx.strokeStyle = INK; ctx.stroke();
    // 顶部小叶
    leaf(ctx, 0, -40, 7, 4, 0, '#5fa832');
    // 脸
    drawEyes(ctx, -9, 9, -6, 6.6, 0.8);
    ctx.beginPath();
    ctx.arc(0, 8, 7, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.lineWidth = 2.6; ctx.stroke();
    // 受损裂纹
    if (hp < 0.66) {
      ctx.beginPath();
      ctx.moveTo(-20, -22); ctx.lineTo(-10, -8); ctx.lineTo(-16, 4); ctx.lineTo(-6, 16);
      ctx.lineWidth = 2.2; ctx.stroke();
    }
    if (hp < 0.33) {
      ctx.beginPath();
      ctx.moveTo(18, -18); ctx.lineTo(10, -2); ctx.lineTo(18, 14);
      ctx.lineWidth = 2.2; ctx.stroke();
    }
    ctx.restore();
  };

  /* ---------------- 高坚果 ---------------- */
  Art.tallnut = function (ctx, s) {
    s = s || {};
    const hp = s.hpRatio == null ? 1 : s.hpRatio;
    ctx.save();
    ctx.translate(0, -52);
    ctx.rotate(s.tilt || 0);
    const grd = ctx.createLinearGradient(-26, -54, 26, 54);
    grd.addColorStop(0, '#c98d4e');
    grd.addColorStop(1, '#935d2c');
    pathEllipse(ctx, 0, 0, 28, 52, 0);
    ctx.fillStyle = grd; ctx.fill();
    ctx.lineWidth = 3.4; ctx.stroke();
    leaf(ctx, 0, -52, 7, 4, 0, '#5fa832');
    // 怒眉 + 眼
    ctx.beginPath(); ctx.moveTo(-16, -12); ctx.lineTo(-4, -7);
    ctx.moveTo(4, -7); ctx.lineTo(16, -12);
    ctx.lineWidth = 3; ctx.stroke();
    drawEyes(ctx, -9, 9, -2, 6.2, 0.6);
    ctx.beginPath();
    ctx.arc(0, 14, 6, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.lineWidth = 2.6; ctx.stroke();
    if (hp < 0.5) {
      ctx.beginPath();
      ctx.moveTo(-20, -30); ctx.lineTo(-10, -14); ctx.lineTo(-18, 2);
      ctx.lineWidth = 2.2; ctx.stroke();
    }
    ctx.restore();
  };

  /* ---------------- 樱桃炸弹 ---------------- */
  Art.cherrybomb = function (ctx, s) {
    s = s || {};
    const shake = s.shake ? (Math.random() - 0.5) * 3 : 0;
    ctx.save();
    ctx.translate(shake, -40 + shake);
    // 茎与叶
    ctx.beginPath();
    ctx.moveTo(-12, -18);
    ctx.quadraticCurveTo(-2, -34, 8, -40);
    ctx.quadraticCurveTo(20, -46, 24, -40);
    ctx.lineWidth = 3.4; ctx.strokeStyle = '#3a7d22'; ctx.stroke();
    leaf(ctx, 22, -40, 10, 5, 0.5, '#4e9e2f');
    // 双果
    for (const b of [[-12, 0, 20], [13, 2, 22]]) {
      const grd = ctx.createRadialGradient(b[0] - 6, b[1] - 7, 3, b[0], b[1], b[2]);
      grd.addColorStop(0, '#ff8a66');
      grd.addColorStop(1, '#e02a17');
      pathCircle(ctx, b[0], b[1], b[2]);
      ctx.fillStyle = grd; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    }
    // 怒脸
    ctx.beginPath();
    ctx.moveTo(-20, -8); ctx.lineTo(-10, -4);
    ctx.moveTo(7, -4); ctx.lineTo(18, -9);
    ctx.lineWidth = 2.6; ctx.stroke();
    drawEyes(ctx, -17, -8, 1, 5.2, 0);
    drawEyes(ctx, 8, 17, 2, 5.2, 0);
    // 引信火花
    pathCircle(ctx, 26, -42, 3);
    ctx.fillStyle = '#ffd93b'; ctx.fill();
    ctx.restore();
  };

  /* ---------------- 土豆雷 ---------------- */
  Art.potatomine = function (ctx, s) {
    s = s || {};
    const ready = s.ready;
    // 土堆
    ctx.beginPath();
    ctx.moveTo(-26, 0);
    ctx.quadraticCurveTo(-24, -14, 0, -12);
    ctx.quadraticCurveTo(24, -14, 26, 0);
    ctx.closePath();
    ctx.fillStyle = '#7a5230'; ctx.fill();
    ctx.lineWidth = 2.6; ctx.strokeStyle = INK; ctx.stroke();
    if (!ready) {
      // 未准备：半埋的小土豆 + 红点闪烁
      pathEllipse(ctx, 0, -8, 13, 9, 0);
      fillStroke(ctx, '#b98a4d', 2.6);
      if (s.blink) { pathCircle(ctx, 2, -13, 2.4); ctx.fillStyle = '#ff3b2c'; ctx.fill(); }
    } else {
      // 准备完成：土豆探出
      ctx.save();
      ctx.translate(0, -16);
      const grd = ctx.createRadialGradient(-5, -6, 2, 0, 0, 17);
      grd.addColorStop(0, '#d9a75f');
      grd.addColorStop(1, '#a9763c');
      pathEllipse(ctx, 0, 0, 16, 15, 0);
      ctx.fillStyle = grd; ctx.fill();
      ctx.lineWidth = 3; ctx.stroke();
      // 眼睛警觉
      drawEyes(ctx, -5, 6, 2, 5, 0.6);
      // 红色引信灯
      pathCircle(ctx, 0, -12, 3.6);
      ctx.fillStyle = s.blink ? '#ff3b2c' : '#a82016'; ctx.fill();
      ctx.lineWidth = 1.6; ctx.strokeStyle = INK; ctx.stroke();
      ctx.restore();
    }
  };

  /* ---------------- 大嘴花 ---------------- */
  Art.chomper = function (ctx, s) {
    s = s || {};
    // 长茎
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.quadraticCurveTo(-12, -30, 2, -52);
    ctx.lineTo(12, -50);
    ctx.quadraticCurveTo(4, -26, 8, 0);
    ctx.closePath();
    fillStroke(ctx, '#3f8f2a', 3);
    leaf(ctx, -16, -14, 13, 6.5, -0.6, '#4e9e2f');
    ctx.save();
    ctx.translate(4, -50);
    const open = s.eating ? 0.15 : (s.chomp ? 0.95 : 0.62);
    ctx.rotate(-open * 0.9 + (s.tilt || 0));
    // 上颚
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.quadraticCurveTo(-2, -34, 30, -20);
    ctx.quadraticCurveTo(14, -4, -16, 0);
    ctx.closePath();
    fillStroke(ctx, '#7d3fb0', 3);
    // 下颚
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.quadraticCurveTo(-2, 26, 30, 14);
    ctx.quadraticCurveTo(14, 4, -16, 0);
    ctx.closePath();
    fillStroke(ctx, '#9a56cc', 3);
    // 牙齿
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 5; i++) {
      const tx = -10 + i * 8;
      pathEllipse(ctx, tx, -4, 3, 5, 0); ctx.fill();
      pathEllipse(ctx, tx + 3, 5, 3, 5, 0); ctx.fill();
    }
    // 眼
    ctx.save();
    ctx.rotate(open * 0.9);
    drawEyes(ctx, -8, 0, -26, 5.6, 1);
    ctx.restore();
    ctx.restore();
  };

  /* ---------------- 窝瓜 ---------------- */
  Art.squash = function (ctx, s) {
    s = s || {};
    let squash = 1;
    let oy = 0;
    if (s.air) { squash = 1.25; oy = -30; }
    if (s.smash) { squash = 0.35; }
    ctx.save();
    ctx.translate(0, -34 + oy);
    ctx.scale(2 - squash, squash);
    const grd = ctx.createRadialGradient(-8, -10, 4, 0, 0, 30);
    grd.addColorStop(0, '#a774d6');
    grd.addColorStop(1, '#6f3fa0');
    ctx.beginPath();
    ctx.moveTo(-28, 8);
    ctx.quadraticCurveTo(-30, -18, -10, -22);
    ctx.quadraticCurveTo(0, -30, 12, -22);
    ctx.quadraticCurveTo(30, -16, 28, 8);
    ctx.quadraticCurveTo(20, 24, 0, 24);
    ctx.quadraticCurveTo(-20, 24, -28, 8);
    ctx.closePath();
    ctx.fillStyle = grd; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    // 茎卷须
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.quadraticCurveTo(6, -32, 2, -38);
    ctx.lineWidth = 3; ctx.strokeStyle = '#3f8f2a'; ctx.stroke();
    // 怒脸
    ctx.beginPath();
    ctx.moveTo(-15, -6); ctx.lineTo(-5, -2);
    ctx.moveTo(5, -2); ctx.lineTo(15, -6);
    ctx.lineWidth = 2.6; ctx.strokeStyle = INK; ctx.stroke();
    drawEyes(ctx, -9, 8, 4, 6, 0.4);
    ctx.restore();
  };

  /* ---------------- 火爆辣椒 ---------------- */
  Art.jalapeno = function (ctx, s) {
    s = s || {};
    const shake = s.shake ? (Math.random() - 0.5) * 2.5 : 0;
    ctx.save();
    ctx.translate(shake, -44 + shake);
    ctx.rotate(s.tilt || 0);
    const grd = ctx.createLinearGradient(-14, -40, 14, 40);
    grd.addColorStop(0, '#ff6a3d');
    grd.addColorStop(1, '#c81e10');
    // 辣椒身体
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.bezierCurveTo(-18, 20, -16, -24, -4, -36);
    ctx.lineTo(4, -36);
    ctx.bezierCurveTo(16, -24, 18, 20, 0, 40);
    ctx.closePath();
    ctx.fillStyle = grd; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    // 卷茎
    ctx.beginPath();
    ctx.moveTo(0, -36);
    ctx.quadraticCurveTo(-8, -46, 2, -52);
    ctx.quadraticCurveTo(12, -56, 8, -46);
    ctx.lineWidth = 3; ctx.strokeStyle = '#3f8f2a'; ctx.stroke();
    // 怒脸
    ctx.beginPath();
    ctx.moveTo(-12, -12); ctx.lineTo(-3, -8);
    ctx.moveTo(3, -8); ctx.lineTo(12, -12);
    ctx.lineWidth = 2.6; ctx.strokeStyle = INK; ctx.stroke();
    drawEyes(ctx, -8, 7, -3, 5.8, 0);
    // 冒火
    if (s.blink) {
      for (const fx of [-7, 0, 7]) {
        ctx.beginPath();
        ctx.moveTo(fx, -40);
        ctx.quadraticCurveTo(fx + 3, -50, fx, -58 - Math.random() * 6);
        ctx.quadraticCurveTo(fx - 3, -50, fx, -40);
        ctx.fillStyle = '#ff7a18'; ctx.fill();
      }
    }
    ctx.restore();
  };

  /* ---------------- 小喷菇（夜间，免费） ---------------- */
  Art.puffshroom = function (ctx, s) {
    s = s || {};
    // 矮茎
    ctx.beginPath();
    ctx.moveTo(-5, 0); ctx.lineTo(-4, -14); ctx.lineTo(4, -14); ctx.lineTo(5, 0);
    ctx.closePath();
    fillStroke(ctx, '#c9b8e8', 2.4);
    ctx.save();
    ctx.translate(0, -22);
    ctx.rotate(s.tilt || 0);
    const rec = s.recoil ? 2 : 0;
    // 伞盖
    ctx.beginPath();
    ctx.moveTo(-20, 4);
    ctx.quadraticCurveTo(-18, -16, 0, -16);
    ctx.quadraticCurveTo(18, -16, 20, 4);
    ctx.quadraticCurveTo(0, 10, -20, 4);
    ctx.closePath();
    fillStroke(ctx, '#9a76d6', 3);
    // 斑点
    for (const sp of [[-10, -4], [4, -7], [11, 0]]) {
      pathCircle(ctx, sp[0], sp[1], 2.6);
      ctx.fillStyle = '#d9c9f5'; ctx.fill();
    }
    // 脸 + 嘴
    drawEyes(ctx, -8, 2, -1, 5, 1.2);
    pathEllipse(ctx, 13 - rec, 3, 6, 5, 0);
    fillStroke(ctx, '#7a56b8', 2.2);
    pathCircle(ctx, 14 - rec, 3, 2.6);
    ctx.fillStyle = '#4e2e80'; ctx.fill();
    ctx.restore();
  };

  /* ---------------- 阳光菇（夜间经济） ---------------- */
  Art.sunshroom = function (ctx, s) {
    s = s || {};
    const grown = s.grown;
    ctx.beginPath();
    ctx.moveTo(-5, 0); ctx.lineTo(-4, grown ? -18 : -12); ctx.lineTo(4, grown ? -18 : -12); ctx.lineTo(5, 0);
    ctx.closePath();
    fillStroke(ctx, '#e8d9a8', 2.4);
    ctx.save();
    ctx.translate(0, grown ? -28 : -20);
    const R = grown ? 20 : 14;
    const grd = ctx.createRadialGradient(-5, -6, 2, 0, 0, R);
    grd.addColorStop(0, '#fff4b0');
    grd.addColorStop(1, '#ffc93b');
    ctx.beginPath();
    ctx.moveTo(-R, 3);
    ctx.quadraticCurveTo(-R, -R + 2, 0, -R + 2);
    ctx.quadraticCurveTo(R, -R + 2, R, 3);
    ctx.quadraticCurveTo(0, 8, -R, 3);
    ctx.closePath();
    ctx.fillStyle = grd; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    drawEyes(ctx, -6, 6, 1, grown ? 5.6 : 4.4, 0.8);
    ctx.beginPath();
    ctx.arc(0, 7, grown ? 5 : 4, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.lineWidth = 2.2; ctx.stroke();
    ctx.restore();
  };

  Art._leaf = leaf;
  Art._eyes = drawEyes;
})();
