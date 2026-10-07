# AGENTS.md

## 项目概览
植物大战僵尸粉丝致敬复刻版塔防游戏，纯前端实现：
- **渲染**：单个 HTML5 Canvas（逻辑分辨率 1000x600），全部角色/场景由 Canvas 2D 路径代码原创绘制，无任何外部图片素材
- **音频**：WebAudio API 合成全部音效与昼夜两套循环背景音乐，无外部音频文件
- **界面**：菜单/选卡/图鉴/帮助/暂停/结算为 DOM 覆盖层，立绘复用 Canvas 绘制函数动态生成
- **存档**：localStorage（key: `pvz-homage-save-v1`），保存通关数与静音偏好；解锁植物由通关数推导
- **部署**：原生静态项目（native-static），python http.server 提供静态服务

## 目录结构
```
index.html              入口，按依赖顺序加载全部脚本（注意 data.js 必须在 art-scene.js 之前）
styles/main.css         木质/羊皮纸卡通 UI 全部样式
DESIGN.md               视觉设计规范（色彩、造型、动效、禁忌）
js/
  data.js               布局常量 LAYOUT、PLANTS、ZOMBIES、LEVELS(10关)、buildSpawns 波次生成
  storage.js            localStorage 读写、解锁推导 computeUnlocked、可选植物
  audio.js              AudioEngine：音效原语 tone/noise + 游戏音效 + 音乐调度
  art-plants.js         13 种植物绘制（根部原点 0,0，向上为负）
  art-zombies.js        7 种僵尸绘制（通用 zombieBody + 配饰函数）
  art-scene.js          背景/房子/墓地/HUD 栏/阳光/投射物/割草机/铲子绘制
  game.js               GameScene：实体、update 战斗逻辑、范围攻击、输入、render、HUD
  screens.js            全部 DOM 覆盖层界面（makePortrait 生成立绘）
  main.js               Canvas 设置、响应式缩放、鼠标/触屏统一输入、主循环、流程编排
```

## 核心架构
- **GameScene**（game.js）：每关一个实例。字段包括 sun、grid[5][9]、plants、zombies、projectiles、suns、particles、mowers、spawns(出生事件表)。
  - `state`：playing / paused / won / lost
  - 主循环（main.js）每帧调用 `update(dt)` 与 `render(ctx)`，dt 上限 0.05s
  - 通过 `PVZ.events.emit('paused' | 'result')` 通知界面层
- **坐标**：植物根部 `rootX(c)/rootY(r)`；僵尸 x 为身体中心、y 为根部；碰撞按行 + x 距离判定
- **波次**：`buildSpawns(level)` 生成 `{t, type, big}` 事件，big 事件前 4 秒触发预警横幅与警报；全部出生且无存活僵尸即胜利
- **输入**：鼠标 mousedown / 触屏 touchstart 统一经 `toLogical` 换算后调用 `scene.handlePress`（先判 HUD，再收集阳光，再格子操作）

## 数值要点
- 豌豆伤害 20、射速 1.4s/发；普通僵尸 200 血；僵尸啃食 100 dps
- 护具：路障 370 / 报纸 160 / 铁桶 1100 / 橄榄球 1400；伤害先扣护具
- 报纸破碎 → 速度 23 暴怒；撑杆跳遇第一株植物跳过（高坚果除外）
- 寒冰命中 chill=5s，移动与啃食速度减半
- 范围：樱桃 3x3/1800，辣椒整行/1800，窝瓜单体，割草机 430px/s 清整行
- 夜晚天降阳光间隔 22-24s（白天 10s），夜间可种免费小喷菇与 25 阳光阳光菇

## 验证方式（无构建步骤）
1. 语法检查：`for f in js/*.js; do node --check "$f"; done`
2. Headless 集成模拟（桩 Canvas + 桩音频，种满全场打穿 10 关）：`node /tmp/sim.js`
3. 交付检查：test_run 工具（服务探活 + curl 静态资源返回 200）

## 修改注意
- 新增植物：data.js 的 PLANTS 加定义 → art-plants.js 加绘制函数（名一致）→ 在某关 reward/grant 或初始解锁中放出
- 新增僵尸：data.js 的 ZOMBIES + LEVELS.roster 引用 → art-zombies.js 加绘制（复用 zombieBody）
- 调整脚本顺序时，确保被依赖模块（尤其 data.js 的 LAYOUT）先加载
- 所有卡通造型描边色统一 `#2e2a1e`；禁止引入外部图片/音频素材
