/* art-zombies.js — 全部僵尸均为 Canvas 2D 代码原创绘制。
   约定：根部原点 (0,0)，面朝左侧（进攻方向），设计身高约 100px。 */
(function () {
  'use strict';
  const PVZ = (window.PVZ = window.PVZ || {});
  const Art = (PVZ.Art = PVZ.Art || {});
  const INK = '#2e2a1e';
  const SKIN = '#9bb06a';

  function pathCircle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
  function pathEllipse(ctx, x, y, rx, ry, rot) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
  }
  function fillStroke(ctx, fill, lw) {
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = lw || 3;
    ctx.strokeStyle = INK;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  // 通用僵尸身体；opts: coat, pants, lean(前倾), nod(啃食点头), walk(相位), raging
  function zombieBody(ctx, s, o) {
    o = o || {};
    const p = s.walk || 0;
    const bob = -Math.abs(Math.sin(p)) * 2;
    const lean = o.lean ? 4 : 0;
    const nod = s.nod ? Math.sin(s.nodT || 0) * 3 : 0;
    const coat = o.coat || '#6b53e0';
    const pants = o.pants || '#7a5a3a';

    ctx.save();
    ctx.translate(0, bob);

    /* ---- 腿与鞋 ---- */
    const l1 = Math.sin(p) * 7;
    const l2 = -l1;
    // 后腿
    ctx.beginPath();
    ctx.moveTo(2 + l2, 0); ctx.lineTo(1, -22); ctx.lineTo(8, -22); ctx.lineTo(10 + l2, 0);
    ctx.closePath();
    fillStroke(ctx, pants, 2.8);
    ctx.beginPath();
    ctx.ellipse(6 + l2, -2, 8, 4, 0, 0, Math.PI * 2);
    fillStroke(ctx, '#3d3428', 2.4);
    // 前腿
    ctx.beginPath();
    ctx.moveTo(-6 + l1, 0); ctx.lineTo(-7, -22); ctx.lineTo(0, -22); ctx.lineTo(2 + l1, 0);
    ctx.closePath();
    fillStroke(ctx, o.pants2 || '#6a4d30', 2.8);
    ctx.beginPath();
    ctx.ellipse(-8 + l1, -2, 8, 4, 0, 0, Math.PI * 2);
    fillStroke(ctx, '#2e2820', 2.4);

    /* ---- 破烂外套躯干 ---- */
    ctx.beginPath();
    ctx.moveTo(-13 + lean * 0.4, -52);
    ctx.lineTo(12, -54);
    ctx.lineTo(13, -24);
    ctx.lineTo(7, -27);
    ctx.lineTo(2, -23);
    ctx.lineTo(-6, -27);
    ctx.lineTo(-12, -24);
    ctx.closePath();
    fillStroke(ctx, coat, 3);
    // 衬衫破口
    ctx.beginPath();
    ctx.moveTo(-3, -50); ctx.lineTo(4, -48); ctx.lineTo(3, -30); ctx.lineTo(-4, -30);
    ctx.closePath();
    ctx.fillStyle = o.shirt || '#b7b3a4'; ctx.fill();
    ctx.lineWidth = 2; ctx.stroke();
    // 领带
    ctx.beginPath();
    ctx.moveTo(-1, -49); ctx.lineTo(3, -49); ctx.lineTo(2, -34); ctx.lineTo(-2, -34);
    ctx.closePath();
    ctx.fillStyle = '#c83a2c'; ctx.fill();

    /* ---- 前伸双臂 ---- */
    for (const arm of [[-48, -50, 7], [-52, -42, 5]]) {
      ctx.save();
      ctx.translate(arm[2], 0);
      ctx.beginPath();
      ctx.moveTo(0, -54);
      ctx.quadraticCurveTo(arm[0] / 2, -58, arm[0], arm[1]);
      ctx.lineTo(arm[0] + 6, arm[1] + 4);
      ctx.quadraticCurveTo(arm[0] / 2, arm[1] - 2, 5, -46);
      ctx.closePath();
      fillStroke(ctx, coat, 2.6);
      // 手
      pathCircle(ctx, arm[0] + 4, arm[1] + 3, 5);
      fillStroke(ctx, SKIN, 2.4);
      ctx.restore();
    }

    /* ---- 头 ---- */
    ctx.save();
    ctx.translate(-4 + lean + nod * 0.4, -72 + nod * 0.5);
    ctx.rotate((lean ? -0.08 : 0) + nod * 0.012);
    // 脖子
    ctx.fillStyle = SKIN;
    ctx.fillRect(-4, 10, 9, 8);
    // 头颅
    const grd = ctx.createRadialGradient(-10, -8, 4, 0, 0, 18);
    grd.addColorStop(0, '#b4c47e');
    grd.addColorStop(1, SKIN);
    pathCircle(ctx, 0, 0, 16.5);
    ctx.fillStyle = grd; ctx.fill();
    ctx.lineWidth = 3; ctx.stroke();
    // 耳朵
    pathCircle(ctx, 14, 0, 4.5);
    fillStroke(ctx, SKIN, 2.2);
    // 头顶碎发
    ctx.beginPath();
    ctx.moveTo(-10, -14); ctx.lineTo(-7, -20); ctx.lineTo(-3, -15); ctx.lineTo(1, -20); ctx.lineTo(5, -15);
    ctx.lineWidth = 2.4; ctx.stroke();
    // 大眼睛（突出眼白）
    const eyeCol = o.raging ? '#ffb0a0' : '#ffffff';
    for (const ex of [-9, 2]) {
      pathEllipse(ctx, ex, -5, 5.4, 6.4, 0);
      ctx.fillStyle = eyeCol; ctx.fill();
      ctx.lineWidth = 2; ctx.stroke();
      pathCircle(ctx, ex - 1 + (o.raging ? 0 : 0.5), -4, 2.2);
      ctx.fillStyle = o.raging ? '#d81e10' : INK; ctx.fill();
    }
    if (o.raging) {
      // 怒眉
      ctx.beginPath();
      ctx.moveTo(-15, -12); ctx.lineTo(-5, -9);
      ctx.moveTo(-2, -9); ctx.lineTo(8, -12);
      ctx.lineWidth = 2.6; ctx.stroke();
    }
    // 嘴（啃食时张开）
    if (s.eating) {
      pathEllipse(ctx, -10, 7, 6, 5 + Math.abs(nod) * 0.4, 0);
      fillStroke(ctx, '#5e3a2a', 2.2);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-13, 4, 2.4, 3);
      ctx.fillRect(-9, 4, 2.4, 3);
    } else {
      ctx.beginPath();
      ctx.moveTo(-14, 7); ctx.lineTo(-6, 9); ctx.lineTo(-2, 6);
      ctx.lineWidth = 2.4; ctx.stroke();
    }
    // 鼻孔
    pathCircle(ctx, -5, 2, 1.3); ctx.fillStyle = INK; ctx.fill();

    // 类型配饰（头部坐标系）
    if (o.accessory) o.accessory(ctx, s);
    ctx.restore(); // head

    ctx.restore(); // bob
  }

  /* ---- 配饰：路障 ---- */
  function coneAcc(ctx) {
    ctx.save();
    ctx.translate(-2, -14);
    ctx.beginPath();
    ctx.moveTo(-13, 0);
    ctx.lineTo(-5, -26);
    ctx.lineTo(5, -26);
    ctx.lineTo(13, 0);
    ctx.closePath();
    ctx.fillStyle = '#f07820'; ctx.fill();
    ctx.lineWidth = 2.8; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-10, -8); ctx.lineTo(8, -8);
    ctx.moveTo(-7.5, -16); ctx.lineTo(5, -16);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.restore();
  }

  /* ---- 配饰：铁桶 ---- */
  function bucketAcc(ctx) {
    ctx.save();
    ctx.translate(0, -12);
    ctx.beginPath();
    ctx.moveTo(-16, 2);
    ctx.lineTo(-14, -22);
    ctx.quadraticCurveTo(0, -27, 14, -22);
    ctx.lineTo(16, 2);
    ctx.closePath();
    const grd = ctx.createLinearGradient(-14, -24, 14, 0);
    grd.addColorStop(0, '#9aa4ab');
    grd.addColorStop(0.5, '#d3dade');
    grd.addColorStop(1, '#879097');
    ctx.fillStyle = grd; ctx.fill();
    ctx.lineWidth = 2.8; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-15, -6); ctx.lineTo(15, -6);
    ctx.moveTo(-15.5, 0); ctx.lineTo(15.5, 0);
    ctx.lineWidth = 1.8; ctx.strokeStyle = '#6a7378'; ctx.stroke();
    ctx.restore();
  }

  /* ---- 配饰：橄榄球头盔 ---- */
  function helmetAcc(ctx) {
    ctx.save();
    ctx.translate(-2, -13);
    ctx.beginPath();
    ctx.moveTo(-16, 6);
    ctx.quadraticCurveTo(-18, -26, 0, -26);
    ctx.quadraticCurveTo(18, -26, 16, 6);
    ctx.closePath();
    const grd = ctx.createLinearGradient(-14, -24, 14, 6);
    grd.addColorStop(0, '#c82e20');
    grd.addColorStop(1, '#8e1c12');
    ctx.fillStyle = grd; ctx.fill();
    ctx.lineWidth = 2.8; ctx.stroke();
    // 中线
    ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(0, 4);
    ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
    // 面罩格栅
    ctx.fillStyle = '#50585e';
    ctx.fillRect(-17, -6, 8, 12);
    ctx.lineWidth = 2; ctx.strokeStyle = INK;
    ctx.strokeRect(-17, -6, 8, 12);
    ctx.beginPath();
    ctx.moveTo(-13, -6); ctx.lineTo(-13, 6);
    ctx.moveTo(-17, 0); ctx.lineTo(-9, 0);
    ctx.lineWidth = 1.4; ctx.strokeStyle = '#cdd4d8'; ctx.stroke();
    ctx.restore();
  }

  /* ---- 普通僵尸 ---- */
  Art.normal = function (ctx, s) {
    zombieBody(ctx, s, {});
  };

  /* ---- 路障僵尸 ---- */
  Art.conehead = function (ctx, s) {
    zombieBody(ctx, s, { accessory: coneAcc });
  };

  /* ---- 铁桶僵尸 ---- */
  Art.ironbucket = function (ctx, s) {
    zombieBody(ctx, s, { accessory: bucketAcc });
  };

  /* ---- 旗帜僵尸（大波领头） ---- */
  Art.flagzombie = function (ctx, s) {
    zombieBody(ctx, s, {});
    // 身后旗杆与旗子
    ctx.save();
    ctx.translate(12, -2);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, -72);
    ctx.lineWidth = 3; ctx.strokeStyle = '#5a4a30'; ctx.stroke();
    const wave = Math.sin(s.t || 0) * 3;
    ctx.beginPath();
    ctx.moveTo(0, -72);
    ctx.quadraticCurveTo(16, -66 + wave, 26, -72);
    ctx.quadraticCurveTo(20, -60, 26, -50);
    ctx.quadraticCurveTo(14, -56 + wave, 0, -50);
    ctx.closePath();
    ctx.fillStyle = '#d8302c'; ctx.fill();
    ctx.lineWidth = 2.4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
  };

  /* ---- 撑杆跳僵尸 ---- */
  Art.polevaulter = function (ctx, s) {
    const vaulting = s.vaulting;
    zombieBody(ctx, s, { coat: '#4f8fd0', lean: !vaulting, shirt: '#d8dfe8' });
    if (s.hasPole) {
      ctx.save();
      if (vaulting) {
        // 撑杆竖直撑地
        ctx.beginPath();
        ctx.moveTo(4, 0); ctx.lineTo(10, -96);
        ctx.lineWidth = 4; ctx.strokeStyle = '#b98a3c'; ctx.stroke();
      } else {
        // 斜扛长杆
        ctx.beginPath();
        ctx.moveTo(-52, -38);
        ctx.lineTo(34, -96);
        ctx.lineWidth = 4; ctx.strokeStyle = '#c99a4c'; ctx.stroke();
      }
      ctx.restore();
    }
  };

  /* ---- 读报僵尸 ---- */
  Art.newspaper = function (ctx, s) {
    const raging = s.raging;
    zombieBody(ctx, s, { coat: '#5a6470', raging: raging, lean: raging });
    if (!raging) {
      // 手持报纸挡在身前
      ctx.save();
      ctx.translate(-26, -44);
      ctx.beginPath();
      ctx.rect(-2, -2, 24, 34);
      ctx.fillStyle = '#e8e4d8'; ctx.fill();
      ctx.lineWidth = 2.6; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(10, -2); ctx.lineTo(10, 32);
      ctx.lineWidth = 1.6; ctx.stroke();
      ctx.strokeStyle = '#8a8478';
      for (let r = 2; r < 30; r += 5) {
        ctx.beginPath();
        ctx.moveTo(1, r); ctx.lineTo(8, r);
        ctx.moveTo(12, r); ctx.lineTo(20, r);
        ctx.lineWidth = 1.2; ctx.stroke();
      }
      ctx.restore();
      // 眼镜
      ctx.save();
      ctx.translate(-4, -72 - Math.abs(Math.sin(s.walk || 0)) * 2);
      ctx.beginPath();
      ctx.arc(-9, 0, 4.6, 0, Math.PI * 2);
      ctx.arc(2, 0, 4.6, 0, Math.PI * 2);
      ctx.lineWidth = 1.8; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-4.5, 0); ctx.lineTo(-2.5, 0); ctx.stroke();
      ctx.restore();
    }
  };

  /* ---- 橄榄球僵尸 ---- */
  Art.football = function (ctx, s) {
    zombieBody(ctx, s, {
      coat: '#a82a1e', pants: '#e8e0d0', pants2: '#d0c8b8',
      shirt: '#f0ece0', accessory: helmetAcc, lean: true
    });
    // 肩甲
    ctx.save();
    ctx.translate(0, -Math.abs(Math.sin(s.walk || 0)) * 2);
    ctx.beginPath();
    ctx.moveTo(-15, -50); ctx.lineTo(-4, -60); ctx.lineTo(8, -58); ctx.lineTo(15, -50);
    ctx.lineTo(12, -42); ctx.lineTo(-12, -42);
    ctx.closePath();
    ctx.fillStyle = '#c83424'; ctx.fill();
    ctx.lineWidth = 2.8; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
  };
})();
