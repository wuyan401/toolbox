/* ============================================
   吸血鬼幸存者 v5.0 - 三职业英雄系统
   剑士(光剑大师) · 射手(弹幕专家) · 法师(雷电使者)
   加权升级 · 闪电链 · 专属技能 · 环绕电球
   ============================================ */

export const id = 'vampire-survivors';
export const name = '吸血鬼幸存者';
export const icon = '🦇';
export const description = '三职业英雄·光剑大师/弹幕专家/雷电使者·专属技能·闪电链·加权升级';
export const category = '趣味工具';
export const enabled = true;

export function init(container) {
    // 视口尺寸（Canvas 固定）
    const CW = 800, CH = 500;
    // 世界尺寸（大地图）
    const WW = 2000, WH = 1500;

    // ============ 英雄定义 ============
    const HEROES = [
        {
            id: 'swordsman', name: '剑士 — 光剑大师', shortName: '剑士',
            icon: '⚔️', description: '均衡近战, 3把光剑环绕',
            hp: 180, speed: 2.8,
            damage: 5, fireRate: 0.8, bulletCount: 1,
            critChance: 0, critDamage: 1.5, pierce: 0,
            bulletRadius: 3, bulletSpeed: 6,
            bladeCount: 3, bladeDamage: 45, bladeSpeed: Math.PI, bladeRange: 75,
            color: '#60a5fa', bladeColor: '#88ccff',
            absorbRange: 60, regen: 2, xpBoost: 0,
            lightningChance: 0, magnetRange: 0,
            // 技能CD
            _counterCD: 0,
            // 法师特有
            lightningBounces: 0, lightningColor: '#4da6ff',
            orbCount: 0, orbDamage: 0, orbSpeed: 0, orbRange: 0,
            // 专属技能ID列表
            exclusiveIds: ['bladeStorm', 'swordQi', 'bladeMaster', 'tough', 'counter', 'lifesteal'],
        },
        {
            id: 'archer', name: '射手 — 弹幕专家', shortName: '射手',
            icon: '🏹', description: '远程爆发, 高暴击多穿透',
            hp: 70, speed: 3.8,
            damage: 18, fireRate: 0.25, bulletCount: 3,
            critChance: 0.2, critDamage: 1.5, pierce: 1,
            bulletRadius: 3, bulletSpeed: 6,
            bladeCount: 1, bladeDamage: 8, bladeSpeed: Math.PI, bladeRange: 50,
            color: '#4ade80', bladeColor: '#86efac',
            absorbRange: 60, regen: 0, xpBoost: 0,
            lightningChance: 0, magnetRange: 0,
            lightningBounces: 0, lightningColor: '#4da6ff',
            orbCount: 0, orbDamage: 0, orbSpeed: 0, orbRange: 0,
            exclusiveIds: ['multiShot', 'weakSpot'],
        },
        {
            id: 'mage', name: '法师 — 雷电使者', shortName: '法师',
            icon: '🔮', description: '全子弹闪电链, 环绕电球',
            hp: 85, speed: 2.3,
            damage: 18, fireRate: 0.4, bulletCount: 1,
            critChance: 0, critDamage: 1.5, pierce: 0,
            bulletRadius: 4, bulletSpeed: 5,
            bladeCount: 0, bladeDamage: 0, bladeSpeed: 0, bladeRange: 0,
            color: '#c084fc', bladeColor: '#d8b4fe',
            absorbRange: 60, regen: 0, xpBoost: 0,
            lightningChance: 0, magnetRange: 0,
            lightningBounces: 3, lightningColor: '#4da6ff',
            orbCount: 2, orbDamage: 12, orbSpeed: Math.PI * 0.5, orbRange: 60,
            exclusiveIds: ['arcBounce', 'thunderStorm', 'manaShield'],
        },
    ];

    // ============ 状态 ============
    let player, enemies, bullets, enemyBullets, gems, particles, pickups, decorations, lightningChains;
    let score, kills, gameTime, level, xp, xpToNext;
    let running, paused, gameOver, upgradeActive;
    let upgrades, upgradeCounts, spawnTimer, difficultyTimer, difficulty;
    let bossTimer, lastTime, animId;
    const keys = {};
    let autoPath = false;
    let showAttrPanel = false;
    // 镜头（世界坐标）
    let camX = 0, camY = 0;
    // 自定义模式
    let customCfg = null;

    // ============ 工厂函数 ============
    function createPlayer() {
        // 使用pendingHeroIdx(由英雄选择卡片或自定义模式设置)
        const H = HEROES[pendingHeroIdx] || HEROES[0];

        return {
            x: WW / 2, y: WH / 2, radius: 12,
            heroClass: H.id,
            speed: H.speed, damage: H.damage, fireRate: H.fireRate, fireCooldown: 0,
            bulletCount: H.bulletCount, bulletRadius: H.bulletRadius, bulletSpeed: H.bulletSpeed,
            hp: H.hp, maxHp: H.hp,
            absorbRange: H.absorbRange, invincible: 0,
            // 近战光刃
            bladeCount: H.bladeCount, bladeDamage: H.bladeDamage, bladeSpeed: H.bladeSpeed, bladeRange: H.bladeRange,
            bladeAngle: 0,
            heroColor: H.color, bladeColor: H.bladeColor,
            // 暴击
            critChance: H.critChance, critDamage: H.critDamage,
            // 穿透
            pierce: H.pierce,
            // 冲刺闪避
            dodgeCharges: 1, dodgeMaxCharges: 1, dodgeCD: 0, dodgeCDMax: 1.5,
            isDodging: false, dodgeDirX: 0, dodgeDirY: -1, dodgeTimer: 0,
            // 其他
            regen: H.regen, regenTimer: 0,
            xpBoost: H.xpBoost,
            // 临时效果 (秒)
            effectShield: 0, effectFury: 0, effectSpeed: 0,
            lastMoveDirX: 0, lastMoveDirY: -1,
            // v3.0 防御
            shieldCharges: 0, shieldMax: 3, shieldCD: 0, shieldCDMax: 30,
            slowAuraRange: 0,
            lightningChance: H.lightningChance,
            magnetRange: H.magnetRange,
            // v5.0 英雄系统
            lightningBounces: H.lightningBounces,
            lightningColor: H.lightningColor,
            orbCount: H.orbCount, orbDamage: H.orbDamage, orbSpeed: H.orbSpeed, orbRange: H.orbRange,
            // 剑士专属
            _bladeStorm: false, _bladeStormCD: 8, _bladeStormActive: false, _bladeStormTimer: 0,
            _swordQi: false,
            _bladeMaster: false, _tough: false, _counter: false, _lifesteal: false,
            _counterCD: 0, _counterDmg: 45, _counterRange: 350, _counterCount: 0,
            // 法师专属
            _thunderStorm: false, _thunderStormTimer: 10,
            // 其他
            _gemValueMult: 1,
            _bladeCrit: 0,
            _dodgeSpeed: false,
        };
    }

    // 敌人类型定义 (11种)
    const ENEMY_TYPES = {
        normal:   { color: '#9ca3af', speed: 1.0, hp: 20, radius: 10, score: 10 },
        fast:     { color: '#60a5fa', speed: 2.5, hp: 10, radius: 8,  score: 15 },
        large:    { color: '#c084fc', speed: 0.6, hp: 60, radius: 16, score: 30 },
        shooter:  { color: '#fb923c', speed: 0.8, hp: 28, radius: 11, score: 20 },
        swarm:    { color: '#34d399', speed: 2.2, hp: 7,  radius: 5,  score: 5 },
        armored:  { color: '#fbbf24', speed: 0.4, hp: 110,radius: 18, score: 40 },
        exploder: { color: '#ef4444', speed: 1.5, hp: 18, radius: 10, score: 18 },
        bomber:   { color: '#f97316', speed: 1.6, hp: 22, radius: 11, score: 22 },
        ranger:   { color: '#22c55e', speed: 0.7, hp: 25, radius: 10, score: 20 },
        splitter: { color: '#eab308', speed: 1.3, hp: 32, radius: 12, score: 25 },
        stealth:  { color: '#8b5cf6', speed: 2.0, hp: 15, radius: 9,  score: 18 },
    };

    // BOSS 类型 (3种，每120秒刷新)
    const BOSS_TYPES = [
        { name: '追猎者', color: '#ef4444', speed: 1.5, hp: 300, radius: 30, score: 300, type: 'melee' },
        { name: '弹幕魔', color: '#67e8f9', speed: 0.5, hp: 250, radius: 28, score: 280, type: 'barrage' },
        { name: '召唤者', color: '#a78bfa', speed: 0.6, hp: 350, radius: 32, score: 350, type: 'summoner' },
    ];

    // 场景装饰物类型
    const DECO_TYPES = ['tree', 'rock', 'ruins'];

    function createEnemy(type) {
        const t = ENEMY_TYPES[type] || ENEMY_TYPES.normal;
        let x, y;
        const m = t.radius + 5;
        const pad = 50;
        const vL = camX - pad, vR = camX + CW + pad;
        const vT = camY - pad, vB = camY + CH + pad;
        const side = Math.floor(Math.random() * 4);
        if (side === 0)      { x = vL - m;                      y = vT + Math.random() * (vB - vT); }
        else if (side === 1) { x = vR + m;                      y = vT + Math.random() * (vB - vT); }
        else if (side === 2) { x = vL + Math.random() * (vR - vL); y = vT - m; }
        else                 { x = vL + Math.random() * (vR - vL); y = vB + m; }
        x = Math.max(m, Math.min(WW - m, x));
        y = Math.max(m, Math.min(WH - m, y));
        const d = 1 + difficulty * 0.08;
        const ehpMult = customCfg ? customCfg.enemyHpMult : 1;
        const espdMult = customCfg ? customCfg.enemySpeedMult : 1;
        return {
            x, y, radius: t.radius, color: t.color,
            speed: t.speed * d * espdMult, hp: Math.round(t.hp * d * ehpMult), maxHp: Math.round(t.hp * d * ehpMult),
            score: t.score, type, flashTimer: 0,
            isBoss: false, bossName: '',
            shootTimer: type === 'shooter' ? 1.5 : (type === 'ranger' ? 2.0 : 0),
            explodeTimer: 0, exploding: false,
            bladeHitTimer: 0,
            stealthAlpha: 1.0, stealthTimer: 0, stealthVisible: true,
        };
    }

    function createBoss() {
        const idx = Math.floor(Math.random() * BOSS_TYPES.length);
        const bt = BOSS_TYPES[idx];
        let x, y;
        const m = bt.radius + 10;
        const pad = 50;
        const vL = camX - pad, vR = camX + CW + pad;
        const vT = camY - pad, vB = camY + CH + pad;
        const side = Math.floor(Math.random() * 4);
        if (side === 0)      { x = vL - m;                      y = vT + Math.random() * (vB - vT); }
        else if (side === 1) { x = vR + m;                      y = vT + Math.random() * (vB - vT); }
        else if (side === 2) { x = vL + Math.random() * (vR - vL); y = vT - m; }
        else                 { x = vL + Math.random() * (vR - vL); y = vB + m; }
        x = Math.max(m, Math.min(WW - m, x));
        y = Math.max(m, Math.min(WH - m, y));
        const d = 1 + difficulty * 0.1;
        const ehpMult = customCfg ? customCfg.enemyHpMult : 1;
        const espdMult = customCfg ? customCfg.enemySpeedMult : 1;
        return {
            x, y, radius: bt.radius, color: bt.color,
            speed: bt.speed * d * espdMult, hp: Math.round(bt.hp * d * ehpMult), maxHp: Math.round(bt.hp * d * ehpMult),
            score: bt.score, type: 'boss', bossType: bt.type, flashTimer: 0,
            isBoss: true, bossName: bt.name,
            shootTimer: bt.type === 'barrage' ? 0.8 : (bt.type === 'summoner' ? 0 : 0),
            explodeTimer: 0, exploding: false,
            bladeHitTimer: 0,
            summonTimer: bt.type === 'summoner' ? 3.0 : 0,
            chargeTimer: bt.type === 'melee' ? 2.0 : 0,
            chargeDirX: 0, chargeDirY: 0, isCharging: false,
            stealthAlpha: 1.0, stealthTimer: 0, stealthVisible: true,
        };
    }

    function createBullet(fromX, fromY, angle) {
        return {
            x: fromX, y: fromY,
            vx: Math.cos(angle) * player.bulletSpeed,
            vy: Math.sin(angle) * player.bulletSpeed,
            radius: player.bulletRadius, damage: player.damage, life: 1.5,
            pierceLeft: player.pierce,
            isLightning: false, lightningBounces: 0,
        };
    }

    function createEnemyBullet(fromX, fromY, targetX, targetY) {
        const a = Math.atan2(targetY - fromY, targetX - fromX);
        return {
            x: fromX, y: fromY,
            vx: Math.cos(a) * 3, vy: Math.sin(a) * 3,
            radius: 4, damage: 8 + Math.floor(difficulty * 1.5), life: 4,
            color: '#ff6b6b'
        };
    }

    function createGem(x, y, value) {
        return { x, y, value: value || 5, radius: 4, life: 30, attracted: false };
    }

    function createParticle(x, y, hex) {
        const a = Math.random() * Math.PI * 2;
        const s = 1 + Math.random() * 3;
        const life = 0.3 + Math.random() * 0.5;
        return { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, radius: 1.5 + Math.random() * 2.5, color: hex, life, maxLife: life };
    }

    function createPickup(x, y, type) {
        const defs = {
            heart:  { color: '#ef4444', icon: '❤️', life: 15, radius: 8,  desc: '+20HP' },
            energy: { color: '#60a5fa', icon: '⚡', life: 15, radius: 7,  desc: '5s加速' },
            fury:   { color: '#fb923c', icon: '⚔️', life: 15, radius: 7,  desc: '5s双倍伤' },
            shield: { color: '#c084fc', icon: '🛡️', life: 15, radius: 7,  desc: '挡1次' },
        };
        const d = defs[type] || defs.heart;
        return { x: x + (Math.random() - 0.5) * 30, y: y + (Math.random() - 0.5) * 30, type, ...d, pulse: 0 };
    }

    function createDecorations() {
        const decs = [];
        const count = 8 + Math.floor(Math.random() * 5);
        for (let i = 0; i < count; i++) {
            const type = DECO_TYPES[Math.floor(Math.random() * DECO_TYPES.length)];
            decs.push({
                type,
                x: 60 + Math.random() * (WW - 120),
                y: 60 + Math.random() * (WH - 120),
            });
        }
        return decs;
    }

    // ============ 升级池 (含 classWeight 加权 + 专属技能) ============
    const UPGRADE_POOL = [
        // --- 基础射击 (5项) ---
        { id: 'damage',       name: '伤害 +5',      desc: '子弹伤害提升',        icon: '⚔️', classWeight: { archer: 3, mage: 3, swordsman: 0.2 },
          apply() { player.damage += 5; } },
        { id: 'fireRate',     name: '射速提升',      desc: '射击间隔 -0.06秒',   icon: '🏹', classWeight: { archer: 3, mage: 3, swordsman: 0.2 },
          apply() { player.fireRate = Math.max(0.06, player.fireRate - 0.06); } },
        { id: 'bulletCount',  name: '弹数 +1',      desc: '每次多发1颗子弹',     icon: '🔫', classWeight: { archer: 3, swordsman: 0.2, mage: 0.2 },
          apply() { player.bulletCount += 1; } },
        { id: 'bulletSpeed',  name: '子弹速度 +1',  desc: '子弹飞行更快',        icon: '💫', classWeight: { swordsman: 0.2, mage: 0.2 },
          apply() { player.bulletSpeed += 1; } },
        { id: 'bulletSize',   name: '子弹增大',      desc: '子弹半径+1 伤害+3',  icon: '🔵', classWeight: { swordsman: 0.2, mage: 0.2 },
          apply() { player.bulletRadius += 1; player.damage += 3; player.bulletSpeed += 0.5; } },
        // --- 生存 (5项) ---
        { id: 'speed',        name: '移速 +0.5',    desc: '移动速度提升',        icon: '💨',
          apply() { player.speed += 0.5; } },
        { id: 'hpUp',         name: '生命 +30',     desc: '最大生命值 +30',     icon: '❤️',
          apply() { player.maxHp += 30; player.hp = Math.min(player.hp + 30, player.maxHp); } },
        { id: 'hpRatio',      name: '生命 +15%',    desc: '最大生命值 +15%(当前也回复)', icon: '💗',
          apply() { const b = Math.round(player.maxHp * 0.15); player.maxHp += b; player.hp = Math.min(player.hp + b, player.maxHp); } },
        { id: 'heal',         name: '回复生命',      desc: '回复 35 点生命',     icon: '💚',
          apply() { player.hp = Math.min(player.hp + 35, player.maxHp); } },
        { id: 'regen',        name: '生命回复 +1',  desc: '每秒回复1点生命',     icon: '💖',
          apply() { player.regen += 1; } },
        // --- 吸取与经验 (4项) ---
        { id: 'absorbRange',  name: '吸取范围 +25',  desc: '宝石吸取范围增大',    icon: '🧲',
          apply() { player.absorbRange += 25; } },
        { id: 'xpBoost',      name: '经验加成 +20%', desc: '获取经验值+20%',     icon: '⭐',
          apply() { player.xpBoost += 0.2; } },
        { id: 'magnetRange',  name: '磁铁 +50',     desc: '永久吸取范围+50(累加)', icon: '🔩',
          apply() { player.magnetRange += 50; player.absorbRange += 15; } },
        { id: 'gemValue',     name: '宝石价值 +30%',desc: '每个宝石经验值+30%',  icon: '💎',
          apply() { player._gemValueMult = (player._gemValueMult || 1) * 1.3; } },
        // --- 近战光刃 (4项) - 法师对应电球 ---
        { id: 'bladeCount',   name: '光刃 +1',      desc: '增加1把旋转光刃(法师+1电球)', icon: '🗡️', classWeight: { swordsman: 3, mage: 3, archer: 0.2 },
          apply() { if (player.heroClass === 'mage') player.orbCount += 1; else player.bladeCount += 1; } },
        { id: 'bladeDamage',  name: '光刃伤害 +8',   desc: '光刃伤害提升(法师电球伤害)', icon: '💥', classWeight: { swordsman: 3, mage: 3, archer: 0.2 },
          apply() { if (player.heroClass === 'mage') player.orbDamage += 8; else player.bladeDamage += 8; } },
        { id: 'bladeSpeed',   name: '光刃转速 +25%', desc: '光刃旋转速度提升(法师电球转速)', icon: '🌀', classWeight: { swordsman: 3, mage: 3, archer: 0.2 },
          apply() { if (player.heroClass === 'mage') player.orbSpeed *= 1.25; else player.bladeSpeed *= 1.25; } },
        { id: 'bladeRange',   name: '光刃范围 +15',  desc: '光刃攻击范围增大(法师电球范围)', icon: '📏', classWeight: { swordsman: 3, mage: 3, archer: 0.2 },
          apply() { if (player.heroClass === 'mage') player.orbRange += 15; else player.bladeRange += 15; } },
        // --- 暴击与穿透 (3项) ---
        { id: 'critChance',   name: '暴击率 +5%',   desc: '子弹暴击率提升(上限50%)', icon: '💢', classWeight: { archer: 3, swordsman: 0.2, mage: 0.2 },
          apply() { player.critChance = Math.min(0.5, player.critChance + 0.05); } },
        { id: 'critDamage',   name: '暴击伤害 +25%', desc: '暴击倍率+25%(2x→2.5x→3x)', icon: '💥', classWeight: { archer: 3, swordsman: 0.2, mage: 0.2 },
          apply() { player.critDamage += 0.25; } },
        { id: 'pierce',       name: '穿透 +1',      desc: '子弹穿透敌人数量+1',  icon: '🔱', classWeight: { archer: 3, swordsman: 0.2, mage: 0.2 },
          apply() { player.pierce += 1; } },
        // --- 闪避 (2项) ---
        { id: 'dodgeCharge',  name: '闪避充能 +1',  desc: '最大闪避次数+1(上限5)', icon: '⚡',
          apply() { player.dodgeMaxCharges = Math.min(5, player.dodgeMaxCharges + 1); player.dodgeCharges += 1; } },
        { id: 'dodgeCD',      name: '闪避冷却 -20%', desc: '闪避充能速度加快',    icon: '⏱️',
          apply() { player.dodgeCDMax *= 0.8; } },
        // --- v3.0 防御 (6项) ---
        { id: 'shieldUp',     name: '护盾 +1层',    desc: '30秒CD自动生成护盾(挡1次)', icon: '🛡️',
          apply() { player.shieldMax += 1; player.shieldCharges = Math.min(player.shieldCharges + 1, player.shieldMax); } },
        { id: 'slowAura',     name: '减速光环 +80',  desc: '最近敌人减速光环范围+80', icon: '❄️',
          apply() { player.slowAuraRange += 80; } },
        { id: 'lightning',    name: '闪电链 +8%',   desc: '命中时触发连锁闪电(法师+1弹跳,上限50%/8跳)', icon: '⚡', classWeight: { mage: 3, swordsman: 0.2, archer: 0.2 },
          apply() { if (player.heroClass === 'mage') { player.lightningBounces += 1; } else { player.lightningChance = Math.min(0.5, player.lightningChance + 0.08); } } },
        { id: 'damageMult',   name: '伤害 +10%',    desc: '总伤害倍率+10%(乘算)', icon: '🔥',
          apply() { player.damage = Math.round(player.damage * 1.1); player.bladeDamage = Math.round(player.bladeDamage * 1.1); if (player.heroClass === 'mage') player.orbDamage = Math.round(player.orbDamage * 1.1); } },
        { id: 'bladeCrit',    name: '光刃暴击 +10%',desc: '光刃也可暴击(上限40%)', icon: '⚔️',
          apply() { player._bladeCrit = (player._bladeCrit || 0) + 0.1; if (player._bladeCrit > 0.4) player._bladeCrit = 0.4; } },
        { id: 'dodgeSpeed',   name: '冲刺加速',      desc: '冲刺后2秒移速+50%',   icon: '🏃',
          apply() { player._dodgeSpeed = true; } },
        // ====== v5.0 专属技能 ======
        // 剑士专属 — 可重复选择
        { id: 'bladeStorm',   name: '🌪️ 剑刃风暴', desc: '光剑转速×3, 每选-CD+伤+时', icon: '🌪️', exclusiveFor: 'swordsman',
          apply() {
            if (!player._bladeStorm) { player._bladeStorm = true; player._bladeStormCD = 12; player._bladeStormDur = 3; player._bladeStormMult = 3; player._bladeStormCount = 1; }
            else { player._bladeStormCount++; player._bladeStormCD = Math.max(5, player._bladeStormCD - 1.5); player._bladeStormDur += 0.5; player._bladeStormMult += 0.5; }
          } },
        { id: 'swordQi',      name: '✨ 剑气',       desc: '光剑击中时发射远程剑气', icon: '✨', exclusiveFor: 'swordsman',
          apply() { player._swordQi = true; } },
        // v11 剑士新专属
        { id: 'bladeMaster',  name: '🗡️🗡️ 光剑大师', desc: '光剑+2把(可重复)', icon: '⚔️', exclusiveFor: 'swordsman',
          apply() { player.bladeCount += 2; } },
        { id: 'tough',        name: '💪 坚韧',         desc: 'HP上限+40且回满',      icon: '🛡️', exclusiveFor: 'swordsman',
          apply() { player.maxHp += 40; player.hp = player.maxHp; } },
        { id: 'counter',      name: '💢 反击',         desc: 'E键/受击释放冲击波, 每选-CD+伤+范围', icon: '💥', exclusiveFor: 'swordsman', classWeight: { swordsman: 10 },
          apply() {
            if (!player._counter) { player._counter = true; player._counterDmg = player.bladeDamage; player._counterRange = 350; player._counterCount = 1; }
            else { player._counterCount++; player._counterDmg += 10; player._counterRange += 20; }
          } },
        { id: 'lifesteal',    name: '🩸 吸血',         desc: '光剑伤害10%回血',     icon: '🩸', exclusiveFor: 'swordsman',
          apply() { player._lifesteal = true; } },
        // 射手专属
        { id: 'multiShot',    name: '🔫 多重射击',   desc: '弹数+2',              icon: '🔫', exclusiveFor: 'archer',
          apply() { player.bulletCount += 2; } },
        { id: 'weakSpot',     name: '🎯 弱点狙击',   desc: '暴击伤害×3(乘算)',   icon: '🎯', exclusiveFor: 'archer',
          apply() { player.critDamage *= 3; } },
        // v16 射手新专属
        { id: 'arrowStorm',  name: '🌧️ 箭雨',       desc: '每15秒射速翻倍持续5秒', icon: '🌧️', exclusiveFor: 'archer',
          apply() {
            if (!player._arrowStorm) { player._arrowStorm = true; player._arrowStormCD = 15; player._arrowStormTimer = 15; player._arrowStormDur = 5; player._arrowStormActive = false; player._arrowStormFireRate = player.fireRate; }
            else { player._arrowStormCD = Math.max(8, player._arrowStormCD - 2); player._arrowStormDur += 1.5; }
          } },
        { id: 'poison',      name: '☠️ 淬毒',         desc: '子弹命中附加3秒毒伤(每秒0.3倍)', icon: '☠️', exclusiveFor: 'archer',
          apply() { player._poison = true; } },
        { id: 'ricochet',    name: '🔄 弹射',         desc: '子弹击中后弹向最近敌人1次', icon: '🔄', exclusiveFor: 'archer',
          apply() { player._ricochet = (player._ricochet || 0) + 1; } },
        { id: 'sniper',      name: '🔭 狙击',         desc: '对200px外敌人伤害+50%', icon: '🔭', exclusiveFor: 'archer',
          apply() { player._sniper = true; } },
        // 法师专属
        { id: 'arcBounce',    name: '⚡ 电弧',       desc: '闪电链弹跳+2',       icon: '⚡', exclusiveFor: 'mage',
          apply() { player.lightningBounces += 2; } },
        { id: 'thunderStorm', name: '🌩️ 雷暴',      desc: '每10秒全屏闪电清场',  icon: '🌩️', exclusiveFor: 'mage',
          apply() { player._thunderStorm = true; player._thunderStormTimer = 0; } },
        { id: 'manaShield',   name: '🔮 法力盾',     desc: '护盾层数+2（上限+2）', icon: '🔮', exclusiveFor: 'mage',
          apply() { player.shieldMax += 2; player.shieldCharges += 2; } },
        // v16 法师新专属
        { id: 'chainReaction',name: '⛓️ 连锁反应',   desc: '击杀时释放小型闪电链(弹跳2,伤害20)', icon: '⛓️', exclusiveFor: 'mage',
          apply() { player._chainReaction = true; } },
        { id: 'manaRegen',   name: '💠 魔力涌动',     desc: '护盾充能速度+50%', icon: '💠', exclusiveFor: 'mage',
          apply() { player._manaRegen = (player._manaRegen || 0) + 0.5; } },
        { id: 'freeze',      name: '❄️ 冰冻光环',     desc: '周围100px敌人减速30%', icon: '❄️', exclusiveFor: 'mage',
          apply() { player._freeze = true; player._freezeRange = 100; } },
        { id: 'arcanePower', name: '🔆 奥术强化',     desc: '每条活跃闪电链全伤害+10%', icon: '🔆', exclusiveFor: 'mage',
          apply() { player._arcanePower = true; } },
    ];

    // ============ 加权随机升级选择 ============
    function rollUpgrades(count) {
        count = count || 3;
        // 过滤：只显示本职业的专属技能 + 通用技能
        const pool = UPGRADE_POOL.filter(u => {
            if (u.exclusiveFor && u.exclusiveFor !== player.heroClass) return false;
            return true;
        });

        // 计算权重：基础1 × classWeight倍率
        const weights = pool.map(u => {
            const mult = (u.classWeight && u.classWeight[player.heroClass]) || 1;
            return 1 * mult;
        });

        // 不放回加权随机
        const selected = [];
        const available = pool.map((u, i) => ({ u, w: weights[i] }));
        for (let i = 0; i < count && available.length > 0; i++) {
            const totalW = available.reduce((s, a) => s + a.w, 0);
            if (totalW <= 0) break;
            let r = Math.random() * totalW;
            let picked = 0;
            for (let j = 0; j < available.length; j++) {
                r -= available[j].w;
                if (r <= 0) { picked = j; break; }
            }
            selected.push(available[picked].u);
            available.splice(picked, 1);
        }
        return selected;
    }

    // ============ 闪电链 ============
    function triggerLightningChain(sourceEnemy, damage, bounces) {
        if (bounces <= 0) return;
        const hitSet = new Set([sourceEnemy]);
        let current = sourceEnemy;
        let dmg = damage;
        let remaining = bounces;

        // 第一段：子弹击中点到源敌人
        lightningChains.push({
            x1: current.x, y1: current.y, x2: current.x, y2: current.y,
            life: 0.3, maxLife: 0.3, color: player.lightningColor,
            offsets: Array.from({ length: 6 }, () => (Math.random() - 0.5) * 18),
            offsets2: Array.from({ length: 6 }, () => (Math.random() - 0.5) * 18),
        });

        while (remaining > 0) {
            // 查找最近未命中的敌人
            let next = null;
            let nextDist = Infinity;
            for (const e of enemies) {
                if (hitSet.has(e) || e._dead) continue;
                const d = Math.hypot(e.x - current.x, e.y - current.y);
                if (d < 200 && d < nextDist) { nextDist = d; next = e; }
            }
            if (!next) break;

            hitSet.add(next);
            next.hp -= dmg;
            next.flashTimer = 0.1;

            // 闪电链视觉效果
            lightningChains.push({
                x1: current.x, y1: current.y,
                x2: next.x, y2: next.y,
                life: 0.3, maxLife: 0.3, color: player.lightningColor,
                offsets: Array.from({ length: 6 }, () => (Math.random() - 0.5) * 18),
                offsets2: Array.from({ length: 6 }, () => (Math.random() - 0.5) * 18),
            });

            // 命中粒子
            for (let k = 0; k < 3; k++) {
                const p = createParticle(next.x, next.y, player.lightningColor);
                p.radius = 2; p.life = 0.2; p.maxLife = 0.2;
                particles.push(p);
            }

            if (next.hp <= 0) {
                killEnemy(next);
                next._dead = true;
            }

            dmg = Math.round(dmg * 0.7);
            remaining--;
            current = next;
        }

        // 清理链杀死的敌人
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (enemies[j]._dead) enemies.splice(j, 1);
        }
    }

    function updateLightningChains(dt) {
        for (let i = lightningChains.length - 1; i >= 0; i--) {
            lightningChains[i].life -= dt;
            if (lightningChains[i].life <= 0) lightningChains.splice(i, 1);
        }
    }

    // ============ 按难度获取敌人类型权重 ============
    function getEnemyTypeWeights() {
        const d = difficulty;
        if (d <= 2) return { normal: 40, fast: 25, large: 15, shooter: 8, swarm: 5, armored: 0, exploder: 0, bomber: 0, ranger: 5, splitter: 2, stealth: 0 };
        if (d <= 5) return { normal: 25, fast: 15, large: 18, shooter: 10, swarm: 8, armored: 8, exploder: 5, bomber: 5, ranger: 8, splitter: 5, stealth: 3 };
        if (d <= 8) return { normal: 15, fast: 10, large: 15, shooter: 12, swarm: 8, armored: 12, exploder: 8, bomber: 8, ranger: 10, splitter: 8, stealth: 6 };
        return { normal: 10, fast: 8, large: 10, shooter: 12, swarm: 5, armored: 15, exploder: 12, bomber: 10, ranger: 12, splitter: 10, stealth: 8 };
    }

    function weightedRandom(weights) {
        const total = Object.values(weights).reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        for (const [k, w] of Object.entries(weights)) {
            r -= w;
            if (r <= 0) return k;
        }
        return 'normal';
    }

    // ============ 初始化 ============
    function initGame() {
        // ⚠️ customCfg 需要在 initGame 之前就已设置好（用于 createPlayer 中读取敌人属性倍率等）
        player = createPlayer();
        enemies = []; bullets = []; enemyBullets = []; gems = []; particles = []; pickups = []; lightningChains = [];
        decorations = createDecorations();
        score = 0; kills = 0; gameTime = 0; level = 1;
        xp = 0; xpToNext = 30;
        running = false; paused = false; gameOver = false; upgradeActive = false;
        upgrades = []; spawnTimer = 0; difficultyTimer = 0; difficulty = 0;
        bossTimer = 120;
        lastTime = 0;
        camX = WW / 2 - CW / 2; camY = WH / 2 - CH / 2;
        upgradeCounts = {};
        UPGRADE_POOL.forEach(u => { upgradeCounts[u.id] = 0; });
        Object.keys(keys).forEach(k => delete keys[k]);
        autoPath = false;
        showAttrPanel = false;
        const panel = document.getElementById('vs-attr-panel');
        if (panel) panel.style.display = 'none';
        // customCfg 由调用方控制，此处不重置
    }

    // ============ UI ============
    function buildUI() {
        container.innerHTML = `<div class="vs-wrap">
            <div class="vs-hud">
                <div class="vs-hud-left">
                    <div class="vs-hp-bar-wrap">
                        <div class="vs-hp-bar-fill" id="vs-hp-bar"></div>
                        <span class="vs-hp-text" id="vs-hp-text">100/100</span>
                    </div>
                    <div class="vs-ability-cds" id="vs-ability-cds" style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px"></div>
                </div>
                <div class="vs-hud-center">
                    <div class="vs-level">Lv.<span id="vs-level">1</span></div>
                    <div class="vs-xp-bar-wrap"><div class="vs-xp-bar-fill" id="vs-xp-bar"></div></div>
                </div>
                <div class="vs-hud-right">
                    <div class="vs-stat" id="vs-auto-ind" style="display:none;color:#22c55e">🤖 寻路</div>
                    <div class="vs-stat" id="vs-dodge-ind" style="color:#fbbf24">⚡×1</div>
                    <div class="vs-stat">⏱ <span id="vs-time">0:00</span></div>
                    <div class="vs-stat">💀 <span id="vs-kills">0</span></div>
                    <div class="vs-stat">⭐ <span id="vs-score">0</span></div>
                    <div class="vs-stat" id="vs-boss-ind" style="display:none;color:#ef4444">👑BOSS!</div>
                </div>
            </div>
            <div class="vs-canvas-row">
                <div class="vs-canvas-wrap">
                    <canvas id="vs-canvas" width="${CW}" height="${CH}"></canvas>
                <!-- 覆盖层 -->
                <div class="vs-overlay" id="vs-ol-start">
                    <div class="vs-ol-title">🦇 吸血鬼幸存者</div>
                    <div class="vs-ol-sub">WASD移动 · 自动射击 · Shift冲刺 · 空格暂停 · Q自动寻路 · Tab属性</div>
                    <div style="display:flex;gap:16px;margin-top:16px">
                        <button class="btn btn-primary vs-mode-btn" id="vs-btn-normal">🎮 正常模式</button>
                        <button class="btn vs-mode-btn" id="vs-btn-custom-entry" style="background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.2);color:#fff">⚙️ 自定义模式</button>
                    </div>
                </div>
                <div class="vs-overlay" id="vs-ol-pause" style="display:none">
                    <div class="vs-ol-title">⏸️ 已暂停</div>
                    <button class="btn btn-primary" id="vs-btn-resume">▶ 继续</button>
                </div>
                <div class="vs-overlay" id="vs-ol-gameover" style="display:none">
                    <div class="vs-ol-title">💀 游戏结束</div>
                    <div class="vs-ol-stats" id="vs-final"></div>
                    <button class="btn btn-primary" id="vs-btn-restart">🔄 重新开始</button>
                </div>
                <div class="vs-overlay" id="vs-ol-upgrade" style="display:none">
                    <div class="vs-ol-title">🎯 升级！选择一个强化（按1/2/3快速选择）</div>
                    <div class="vs-upgrade-cards" id="vs-upgrade-cards"></div>
                </div>
                <!-- 自定义模式独立界面 -->
                <div class="vs-overlay vs-custom-fullscreen" id="vs-ol-custom" style="display:none">
                    <div class="vs-custom-header-bar">
                        <button class="btn btn-sm" id="vs-custom-back" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff">← 返回</button>
                        <div class="vs-ol-title" style="font-size:22px">⚙️ 自定义模式</div>
                        <div style="width:60px"></div>
                    </div>
                    <div class="vs-custom-hero-row">
                        <div style="font-size:14px;color:var(--color-accent);margin-bottom:4px">选择英雄</div>
                        <select id="vs-custom-hero" style="padding:6px 12px;border-radius:8px;background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.2);font-size:14px;cursor:pointer"></select>
                    </div>
                    <div class="vs-custom-scroll" id="vs-custom-scroll"></div>
                    <button class="btn btn-primary" id="vs-btn-custom-start" style="margin-top:12px;font-size:16px;padding:10px 40px">🎮 开始自定义游戏</button>
                </div>
                <!-- 英雄选择界面（正常模式） -->
                <div class="vs-overlay" id="vs-ol-hero-select" style="display:none">
                    <div class="vs-custom-header-bar">
                        <button class="btn btn-sm" id="vs-hero-select-back" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff">← 返回</button>
                        <div class="vs-ol-title" style="font-size:22px">🎮 选择英雄</div>
                        <div style="width:60px"></div>
                    </div>
                    <div class="vs-hero-cards" id="vs-hero-cards"></div>
                </div>
            </div>
            <!-- 属性面板在canvas右侧 -->
            <div class="vs-attr-panel" id="vs-attr-panel" style="display:none">
                <div class="vs-attr-title">📋 属性面板 <span style="font-size:10px;opacity:0.5">Tab关闭</span></div>
                <div class="vs-attr-section">📊 基本信息</div>
                <div class="vs-attr-row"><span>职业</span><span id="vs-ap-heroClass">-</span></div>
                <div class="vs-attr-row"><span>等级</span><span id="vs-ap-level">Lv.1</span></div>
                <div class="vs-attr-row"><span>经验</span><span id="vs-ap-xp">0/30</span></div>
                <div class="vs-attr-row"><span>击杀</span><span id="vs-ap-kills">0</span></div>
                <div class="vs-attr-row"><span>时间</span><span id="vs-ap-time">0:00</span></div>
                <div class="vs-attr-section">⚔️ 攻击</div>
                <div class="vs-attr-row"><span>伤害</span><span id="vs-ap-damage">10</span></div>
                <div class="vs-attr-row"><span>射速</span><span id="vs-ap-fireRate">0.50s</span></div>
                <div class="vs-attr-row"><span>弹数</span><span id="vs-ap-bulletCount">1</span></div>
                <div class="vs-attr-row"><span>暴击率</span><span id="vs-ap-crit">0%</span></div>
                <div class="vs-attr-row"><span>穿透</span><span id="vs-ap-pierce">0</span></div>
                <div class="vs-attr-section">🛡️ 防御</div>
                <div class="vs-attr-row"><span>HP</span><span id="vs-ap-hp">100/100</span></div>
                <div class="vs-attr-row"><span>护盾层数</span><span id="vs-ap-shield">0/3</span></div>
                <div class="vs-attr-row"><span>无敌时间</span><span id="vs-ap-inv">0s</span></div>
                <div class="vs-attr-section" id="vs-ap-blade-sec-title">🗡️ 光刃</div>
                <div class="vs-attr-row"><span>数量</span><span id="vs-ap-bladeCount">1</span></div>
                <div class="vs-attr-row"><span>伤害</span><span id="vs-ap-bladeDamage">15</span></div>
                <div class="vs-attr-row"><span>转速</span><span id="vs-ap-bladeSpeed">3.14</span></div>
                <div class="vs-attr-row"><span>范围</span><span id="vs-ap-bladeRange">50</span></div>
                <div class="vs-attr-section" id="vs-ap-mage-sec" style="display:none">⚡ 电球</div>
                <div class="vs-attr-row" id="vs-ap-orbCount-row" style="display:none"><span>电球数</span><span id="vs-ap-orbCount">0</span></div>
                <div class="vs-attr-row" id="vs-ap-orbDamage-row" style="display:none"><span>电球伤害</span><span id="vs-ap-orbDamage">0</span></div>
                <div class="vs-attr-row" id="vs-ap-lightning-row" style="display:none"><span>闪电弹跳</span><span id="vs-ap-lightning">0</span></div>
                <div class="vs-attr-section">⭐ 特殊</div>
                <div class="vs-attr-row"><span>吸取范围</span><span id="vs-ap-absorb">60</span></div>
                <div class="vs-attr-row"><span>移速</span><span id="vs-ap-speed">3.0</span></div>
                <div class="vs-attr-row"><span>冲刺充能</span><span id="vs-ap-dodge">1/1</span></div>
                <div class="vs-attr-row"><span>冲刺冷却</span><span id="vs-ap-dodgeCD">1.5s</span></div>
                <div class="vs-attr-row" id="vs-ap-bladeStorm-row" style="display:none"><span>剑刃风暴</span><span id="vs-ap-bladeStorm">-</span></div>
                <div class="vs-attr-row" id="vs-ap-thunderStorm-row" style="display:none"><span>雷暴</span><span id="vs-ap-thunderStorm">-</span></div>
            </div>
            </div>
            <div class="vs-footer">
                <button class="btn btn-sm" id="vs-btn-pause" disabled>⏸️ 暂停</button>
            </div>
        </div>`;

        const S = document.createElement('style');
        S.textContent = `
.vs-wrap{max-width:820px;margin:0 auto;display:flex;flex-direction:column;gap:var(--spacing-md);align-items:center}
.vs-hud{display:flex;align-items:center;justify-content:space-between;width:${CW}px;gap:var(--spacing-md);flex-wrap:wrap}
.vs-hud-left{display:flex;flex-direction:column;align-items:flex-start;min-width:150px;gap:2px}
.vs-ability-cds{display:flex;gap:3px;flex-wrap:wrap}
.vs-cd-pill{font-size:10px;padding:1px 6px;border-radius:4px;background:rgba(255,255,255,.1);color:#ccc;font-family:var(--font-family-mono);white-space:nowrap}
.vs-cd-pill.ready{color:#4ade80}
.vs-cd-pill.active{color:#fbbf24}
.vs-hp-bar-wrap{width:150px;height:18px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:9px;position:relative;overflow:hidden}
.vs-hp-bar-fill{height:100%;background:linear-gradient(90deg,#ef4444,#22c55e);border-radius:9px;transition:width .3s;width:100%}
.vs-hp-text{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-family:var(--font-family-mono);color:#fff;text-shadow:0 0 4px rgba(0,0,0,.8)}
.vs-hud-center{display:flex;flex-direction:column;align-items:center;gap:2px;flex:1;min-width:120px}
.vs-level{font-size:var(--font-size-md);font-weight:700;color:var(--color-accent);font-family:var(--font-family-mono)}
.vs-xp-bar-wrap{width:100%;max-width:300px;height:8px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden}
.vs-xp-bar-fill{height:100%;background:linear-gradient(90deg,#fbbf24,#f59e0b);border-radius:4px;transition:width .2s;width:0%}
.vs-hud-right{display:flex;gap:var(--spacing-md);min-width:300px;justify-content:flex-end;flex-wrap:wrap}
.vs-stat{font-size:var(--font-size-sm);color:var(--color-text-secondary);font-family:var(--font-family-mono);white-space:nowrap}
.vs-canvas-wrap{position:relative;border:2px solid var(--color-border);border-radius:var(--radius-lg);overflow:hidden;background:#0a0a14}
.vs-canvas-row{display:flex;gap:10px;align-items:flex-start}
#vs-canvas{display:block}
/* 属性面板 */
.vs-attr-panel{background:rgba(5,5,15,.88);border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:10px 14px;font-size:11px;font-family:var(--font-family-mono);color:#bbb;width:195px;flex-shrink:0;pointer-events:none;user-select:none;line-height:1.7;max-height:500px;overflow-y:auto}
.vs-attr-title{font-size:13px;font-weight:700;color:#fff;margin-bottom:2px;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:4px}
.vs-attr-section{font-size:11px;font-weight:700;color:var(--color-accent);margin-top:6px;margin-bottom:1px}
.vs-attr-row{display:flex;justify-content:space-between}
.vs-attr-row span:first-child{color:#999}
.vs-attr-row span:last-child{color:#ddd;font-weight:600}
.vs-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--spacing-md);background:rgba(10,10,20,.92);border-radius:var(--radius-lg);z-index:10}
.vs-ol-title{font-size:26px;font-weight:700;color:#fff;text-align:center;padding:0 20px}
.vs-ol-sub{font-size:var(--font-size-md);color:var(--color-text-muted);text-align:center;padding:0 20px}
.vs-ol-stats{font-size:var(--font-size-md);color:var(--color-text-secondary);font-family:var(--font-family-mono);line-height:1.8;text-align:center}
.vs-upgrade-cards{display:flex;gap:var(--spacing-md);flex-wrap:wrap;justify-content:center;padding:0 20px}
.vs-upgrade-card{background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.12);border-radius:var(--radius-lg);padding:14px 18px;cursor:pointer;text-align:center;min-width:130px;max-width:160px;transition:all var(--transition-fast);user-select:none}
.vs-upgrade-card:hover{border-color:var(--color-accent);background:rgba(255,255,255,.1);transform:translateY(-2px);box-shadow:0 4px 20px rgba(0,0,0,.4)}
.vs-upgrade-card-icon{font-size:28px;margin-bottom:6px}
.vs-upgrade-card-name{font-size:var(--font-size-md);font-weight:700;color:#fff}
.vs-upgrade-card-desc{font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:3px}
.vs-upgrade-card-count{font-size:11px;color:var(--color-text-muted);margin-top:2px}
.vs-footer{display:flex;gap:var(--spacing-sm)}
/* 模式入口按钮 */
.vs-mode-btn{font-size:18px;padding:16px 40px;border-radius:16px;cursor:pointer;transition:all .2s;border:2px solid transparent}
.vs-mode-btn:hover{transform:translateY(-3px);box-shadow:0 8px 30px rgba(0,0,0,.4)}
/* 自定义模式独立界面 */
.vs-custom-fullscreen{z-index:20;justify-content:flex-start;padding:20px;overflow-y:auto;gap:10px}
.vs-custom-header-bar{display:flex;align-items:center;justify-content:space-between;width:100%;max-width:500px;margin-bottom:8px}
.vs-custom-hero-row{width:100%;max-width:500px;text-align:center;margin-bottom:4px}
.vs-custom-scroll{width:100%;max-width:500px;flex:1;overflow-y:auto;padding:14px 16px;border-radius:12px;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.08);font-size:11px;color:#aaa;line-height:1.8}
/* 自定义模式面板 */
#vs-custom-wrap{width:100%;max-width:400px}
#vs-custom-header:hover{background:rgba(255,255,255,.1);border-color:var(--color-accent)}
.vs-cm-preset:hover{filter:brightness(1.3);transform:scale(1.05)}
.vs-cm-slider{cursor:pointer}
.vs-cm-slider::-webkit-slider-thumb{width:12px;height:12px;border-radius:50%;cursor:pointer}`;
        container.appendChild(S);
    }

    // ============ 绘图 ============
    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    function draw(ctx) {
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, CW, CH);

        // 网格线
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 0.5;
        const gs = 40;
        const gx0 = Math.floor(camX / gs) * gs;
        const gy0 = Math.floor(camY / gs) * gs;
        for (let wx = gx0; wx <= camX + CW + gs; wx += gs) {
            const sx = wx - camX;
            ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, CH); ctx.stroke();
        }
        for (let wy = gy0; wy <= camY + CH + gs; wy += gs) {
            const sy = wy - camY;
            ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(CW, sy); ctx.stroke();
        }

        // 世界边界线
        ctx.strokeStyle = 'rgba(255,100,100,0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(0 - camX, 0 - camY, WW, WH);

        // === 场景装饰 ===
        decorations.forEach(d => {
            const dx = d.x - camX, dy = d.y - camY;
            if (dx < -40 || dx > CW + 40 || dy < -40 || dy > CH + 40) return;
            if (d.type === 'tree') {
                ctx.fillStyle = '#4a2c0a';
                ctx.fillRect(dx - 3, dy - 4, 6, 18);
                ctx.fillStyle = '#1a4a1a';
                ctx.beginPath(); ctx.arc(dx, dy - 12, 15, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#1e6b1e';
                ctx.beginPath(); ctx.arc(dx + 2, dy - 16, 10, 0, Math.PI * 2); ctx.fill();
            } else if (d.type === 'rock') {
                ctx.fillStyle = '#5a5a5a';
                ctx.beginPath();
                ctx.moveTo(dx - 13, dy - 3);
                ctx.lineTo(dx - 5, dy - 15);
                ctx.lineTo(dx + 11, dy - 7);
                ctx.lineTo(dx + 15, dy + 3);
                ctx.lineTo(dx + 7, dy + 13);
                ctx.lineTo(dx - 9, dy + 10);
                ctx.lineTo(dx - 12, dy + 1);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#707070';
                ctx.beginPath(); ctx.arc(dx + 2, dy - 3, 7, 0, Math.PI * 2); ctx.fill();
            } else if (d.type === 'ruins') {
                ctx.fillStyle = '#8a8a8a';
                ctx.fillRect(dx - 7, dy - 18, 14, 28);
                ctx.fillStyle = '#6e6e6e';
                ctx.fillRect(dx - 9, dy - 14, 6, 18);
                ctx.strokeStyle = '#555';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(dx - 3, dy - 14); ctx.lineTo(dx + 4, dy - 7); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(dx + 1, dy - 1); ctx.lineTo(dx - 4, dy + 6); ctx.lineTo(dx + 2, dy + 10); ctx.stroke();
            }
        });

        // BOSS血条
        const activeBosses = enemies.filter(e => e.isBoss);
        if (activeBosses.length > 0) {
            activeBosses.forEach((boss, bi) => {
                const bw = 300, bh = 14, bx = (CW - bw) / 2, by = 6 + bi * 20;
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
                ctx.fillStyle = 'rgba(80,0,0,0.6)';
                ctx.fillRect(bx, by, bw, bh);
                const hpPct = boss.hp / boss.maxHp;
                const hpGrad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
                if (hpPct > 0.5) { hpGrad.addColorStop(0, '#ef4444'); hpGrad.addColorStop(1, '#dc2626'); }
                else if (hpPct > 0.25) { hpGrad.addColorStop(0, '#f59e0b'); hpGrad.addColorStop(1, '#d97706'); }
                else { hpGrad.addColorStop(0, '#ef4444'); hpGrad.addColorStop(0.6, '#f59e0b'); }
                ctx.fillStyle = hpGrad;
                ctx.fillRect(bx, by, bw * hpPct, bh);
                ctx.fillStyle = '#fff';
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`👑 ${boss.bossName}  ${Math.ceil(boss.hp)}/${boss.maxHp}`, CW / 2, by + bh - 3);
            });
        }

        // 吸取范围指示圈
        ctx.strokeStyle = 'rgba(34,197,94,0.06)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.beginPath(); ctx.arc(player.x - camX, player.y - camY, player.absorbRange, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);

        // 掉落道具
        pickups.forEach(p => {
            const sx = p.x - camX, sy = p.y - camY;
            p.pulse += 0.04;
            const glow = 0.5 + Math.sin(p.pulse) * 0.2;
            ctx.fillStyle = hexToRgba(p.color, 0.2 * glow);
            ctx.beginPath(); ctx.arc(sx, sy, p.radius + 6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = hexToRgba(p.color, 0.85);
            ctx.beginPath(); ctx.arc(sx, sy, p.radius, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = `${p.radius + 2}px sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(p.icon, sx, sy);
            if (p.life < 4) {
                const alpha = Math.max(0, p.life - 2) / 2;
                ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(sx, sy, p.radius + 4, 0, Math.PI * 2 * alpha); ctx.stroke();
            }
        });

        // 宝石
        gems.forEach(g => {
            const sx = g.x - camX, sy = g.y - camY;
            const fade = g.life < 3 ? Math.max(0, g.life - 2) : 1;
            ctx.fillStyle = hexToRgba('#22c55e', 0.9 * fade);
            ctx.beginPath(); ctx.arc(sx, sy, g.radius, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = hexToRgba('#22c55e', 0.25 * fade);
            ctx.beginPath(); ctx.arc(sx, sy, g.radius + 3, 0, Math.PI * 2); ctx.fill();
        });

        // 敌人子弹
        enemyBullets.forEach(b => {
            const sx = b.x - camX, sy = b.y - camY;
            ctx.fillStyle = b.color;
            ctx.shadowColor = b.color; ctx.shadowBlur = 6;
            ctx.beginPath(); ctx.arc(sx, sy, b.radius, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        });

        // 玩家子弹
        bullets.forEach(b => {
            const sx = b.x - camX, sy = b.y - camY;
            if (b.isLightning) {
                // 闪电子弹 — 蓝色带粒子尾迹
                ctx.strokeStyle = 'rgba(77,166,255,0.6)';
                ctx.lineWidth = 2.5;
                ctx.shadowColor = '#4da6ff'; ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(sx - b.vx * 0.4, sy - b.vy * 0.4);
                ctx.lineTo(sx, sy);
                ctx.stroke();
                ctx.shadowBlur = 0;
                // 发光核心
                ctx.fillStyle = 'rgba(150,210,255,0.9)';
                ctx.shadowColor = '#88ccff'; ctx.shadowBlur = 6;
                ctx.beginPath(); ctx.arc(sx, sy, b.radius * 1.3, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;
            } else {
                ctx.fillStyle = '#fef3c7';
                ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 5;
                ctx.beginPath(); ctx.arc(sx, sy, b.radius, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;
            }
        });

        // 敌人
        enemies.forEach(e => {
            const sx = e.x - camX, sy = e.y - camY;
            ctx.save();
            if (e.isBoss) {
                const bp = Math.sin(gameTime * 3) * 0.15 + 0.25;
                ctx.fillStyle = hexToRgba(e.color, bp);
                ctx.beginPath(); ctx.arc(sx, sy, e.radius + 12, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = hexToRgba(e.color, bp * 0.6);
                ctx.beginPath(); ctx.arc(sx, sy, e.radius + 20, 0, Math.PI * 2); ctx.fill();
            }
            if (e.exploding) {
                const ep = Math.abs(Math.sin(gameTime * 12));
                ctx.fillStyle = `rgba(255,100,100,${0.3 + ep * 0.4})`;
                ctx.beginPath(); ctx.arc(sx, sy, e.radius + 8 + ep * 6, 0, Math.PI * 2); ctx.fill();
            }
            const alpha = (e.type === 'stealth' || e.stealthAlpha < 1) ? e.stealthAlpha : 1;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = e.flashTimer > 0 ? '#ffffff' : e.color;
            ctx.beginPath(); ctx.arc(sx, sy, e.radius, 0, Math.PI * 2); ctx.fill();
            if (e.isBoss) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            if ((e.isBoss || e.maxHp > 30) && e.hp < e.maxHp) {
                const bw = e.radius * 2.4, bh = e.isBoss ? 6 : 3;
                const bx2 = sx - bw / 2, by2 = sy - e.radius - bh - 8;
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(bx2 - 1, by2 - 1, bw + 2, bh + 2);
                const hpPct = e.hp / e.maxHp;
                const hpColor = hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#f59e0b' : '#ef4444';
                ctx.fillStyle = hpColor;
                ctx.fillRect(bx2, by2, bw * hpPct, bh);
                if (e.isBoss) {
                    ctx.fillStyle = '#fff';
                    ctx.font = '9px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${e.bossName} ${Math.ceil(e.hp)}/${e.maxHp}`, sx, by2 - 4);
                }
            }
            ctx.restore();
        });

        // 闪电链视觉效果
        lightningChains.forEach(lc => {
            const x1 = lc.x1 - camX, y1 = lc.y1 - camY;
            const x2 = lc.x2 - camX, y2 = lc.y2 - camY;
            const alpha = Math.max(0, lc.life / lc.maxLife);
            const dx = x2 - x1, dy = y2 - y1;
            // 外层辉光
            ctx.strokeStyle = hexToRgba(lc.color, 0.5 * alpha);
            ctx.lineWidth = 5;
            ctx.shadowColor = lc.color; ctx.shadowBlur = 12;
            ctx.beginPath(); ctx.moveTo(x1, y1);
            const segs = 6;
            for (let s = 1; s < segs; s++) {
                const t = s / segs;
                const jx = x1 + dx * t + (lc.offsets ? lc.offsets[s - 1] : 0);
                const jy = y1 + dy * t + (lc.offsets2 ? lc.offsets2[s - 1] : 0);
                ctx.lineTo(jx, jy);
            }
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.shadowBlur = 0;
            // 白色核心
            ctx.strokeStyle = hexToRgba('#ffffff', 0.7 * alpha);
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        });

        const px = player.x - camX, py = player.y - camY;

        // === 光刃 / 电球 ===
        if (player.heroClass === 'mage' && player.orbCount > 0) {
            // 法师 — 环绕电球
            for (let i = 0; i < player.orbCount; i++) {
                const ang = player.bladeAngle + (Math.PI * 2 / player.orbCount) * i;
                const r = player.orbRange;
                const mid = player.radius + 5;
                const ox = px + Math.cos(ang) * r;
                const oy = py + Math.sin(ang) * r;
                // 外层辉光
                ctx.fillStyle = 'rgba(77,166,255,0.15)';
                ctx.beginPath(); ctx.arc(ox, oy, 16, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(100,180,255,0.3)';
                ctx.beginPath(); ctx.arc(ox, oy, 11, 0, Math.PI * 2); ctx.fill();
                // 核心
                ctx.fillStyle = 'rgba(150,210,255,0.8)';
                ctx.shadowColor = '#4da6ff'; ctx.shadowBlur = 12;
                ctx.beginPath(); ctx.arc(ox, oy, 7, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 6;
                ctx.beginPath(); ctx.arc(ox, oy, 4, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;
                // 轨道线
                ctx.strokeStyle = 'rgba(77,166,255,0.08)';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.stroke();
            }
        } else if (player.bladeCount > 0) {
            // 光剑样式
            for (let i = 0; i < player.bladeCount; i++) {
                const ang = player.bladeAngle + (Math.PI * 2 / player.bladeCount) * i;
                const r = player.bladeRange;
                const mid = player.radius + 8;
                const startX = px + Math.cos(ang) * mid;
                const startY = py + Math.sin(ang) * mid;
                const endX = px + Math.cos(ang) * r;
                const endY = py + Math.sin(ang) * r;
                // 剑刃风暴状态 — 额外辉光
                if (player._bladeStormActive) {
                    ctx.strokeStyle = 'rgba(150,200,255,0.2)';
                    ctx.lineWidth = 22;
                    ctx.lineCap = 'round';
                    ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke();
                }
                ctx.strokeStyle = 'rgba(150,200,255,0.15)';
                ctx.lineWidth = 16;
                ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke();
                ctx.strokeStyle = 'rgba(180,220,255,0.35)';
                ctx.lineWidth = 8;
                ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke();
                ctx.strokeStyle = 'rgba(220,240,255,0.6)';
                ctx.lineWidth = 4;
                ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
                ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#fff';
                ctx.shadowColor = '#fff'; ctx.shadowBlur = 5;
                ctx.beginPath(); ctx.arc(startX, startY, 3.5, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        // 玩家
        const showVis = !(player.invincible > 0 && Math.floor(player.invincible * 12) % 2 === 0);
        if (showVis) {
            if (player.effectShield > 0) {
                ctx.strokeStyle = 'rgba(96,165,250,0.6)';
                ctx.lineWidth = 3;
                ctx.setLineDash([8, 4]);
                ctx.beginPath(); ctx.arc(px, py, player.radius + 10, 0, Math.PI * 2); ctx.stroke();
                ctx.setLineDash([]);
            }
            if (player.isDodging) {
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                for (let t = 0; t < 3; t++) {
                    const tx = px - player.dodgeDirX * (t + 1) * 8;
                    const ty = py - player.dodgeDirY * (t + 1) * 8;
                    ctx.beginPath(); ctx.arc(tx, ty, player.radius - t * 2, 0, Math.PI * 2); ctx.fill();
                }
            }
            // 剑刃风暴激活 — 角色光环
            if (player._bladeStormActive) {
                ctx.strokeStyle = 'rgba(136,204,255,0.4)';
                ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(px, py, player.radius + 14, 0, Math.PI * 2); ctx.stroke();
            }
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.beginPath(); ctx.arc(px, py, player.radius + 8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.beginPath(); ctx.arc(px, py, player.radius + 3, 0, Math.PI * 2); ctx.fill();
            const bodyColor = (player.invincible > 0) ? '#ef4444' : (player.heroColor || '#ffffff');
            ctx.fillStyle = bodyColor;
            ctx.shadowColor = bodyColor; ctx.shadowBlur = 12;
            ctx.beginPath(); ctx.arc(px, py, player.radius, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;

            if (autoPath) {
                ctx.strokeStyle = 'rgba(34,197,94,0.5)';
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 4]);
                ctx.beginPath(); ctx.arc(px, py, player.radius + 14, 0, Math.PI * 2); ctx.stroke();
                ctx.setLineDash([]);
                ctx.lineWidth = 1;
            }
            // 反击扩散波 — 超级明显
            // 反击扩散波 — 超级明显
            if (player._shockwaveRadius !== undefined && player._shockwaveRadius < player._shockwaveMax) {
                const pct = player._shockwaveRadius / player._shockwaveMax;
                // 填充光环
                ctx.fillStyle = "rgba(255,20,20," + (0.08 * (1 - pct)) + ")";
                ctx.beginPath(); ctx.arc(px, py, player._shockwaveRadius, 0, Math.PI * 2); ctx.fill();
                // 双层描边
                ctx.strokeStyle = "rgba(255,40,40," + (0.7 * (1 - pct)) + ")";
                ctx.lineWidth = 6 * (1 - pct) + 3;
                ctx.beginPath(); ctx.arc(px, py, player._shockwaveRadius, 0, Math.PI * 2); ctx.stroke();
                ctx.strokeStyle = "rgba(255,255,200," + (0.4 * (1 - pct)) + ")";
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(px, py, player._shockwaveRadius, 0, Math.PI * 2); ctx.stroke();
                ctx.lineWidth = 1;
            }
        }

        // 粒子
        particles.forEach(p => {
            const sx = p.x - camX, sy = p.y - camY;
            const alpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = hexToRgba(p.color, alpha);
            ctx.beginPath(); ctx.arc(sx, sy, p.radius * alpha, 0, Math.PI * 2); ctx.fill();
        });
    }

    // ============ 游戏逻辑 ============
    function nearestEnemy(x, y) {
        let best = null, bestD = Infinity;
        for (const e of enemies) {
            const d = Math.hypot(e.x - x, e.y - y);
            if (d < bestD) { bestD = d; best = e; }
        }
        return best;
    }

    function shoot(dt) {
        player.fireCooldown -= dt;
        if (player.fireCooldown > 0) return;
        const target = nearestEnemy(player.x, player.y);
        if (!target) return;

        const rateMult = player.effectFury > 0 ? 0.5 : 1;
        const arrowStormMult = player._arrowStormActive ? 0.5 : 1;
        player.fireCooldown = player.fireRate * rateMult * arrowStormMult;
        // 奥术强化：每条活跃闪电链使全伤害+10%
        let arcaneDmgMult = 1;
        if (player._arcanePower && lightningChains.length > 0) {
            arcaneDmgMult = 1 + lightningChains.length * 0.1;
        }

        const base = Math.atan2(target.y - player.y, target.x - player.x);
        const cnt = player.bulletCount;
        const spread = Math.PI / 12;

        for (let i = 0; i < cnt; i++) {
            let ang = base;
            if (cnt > 1) ang = base + spread * (i - (cnt - 1) / 2);
            ang += (Math.random() - 0.5) * 0.15;
            const bx = player.x + Math.cos(ang) * (player.radius + 5);
            const by = player.y + Math.sin(ang) * (player.radius + 5);
            const b = createBullet(bx, by, ang);
            b.damage = Math.round(player.damage * arcaneDmgMult);
            b.pierceLeft = player.pierce;
            // 法师：所有子弹为闪电链
            if (player.heroClass === 'mage') {
                b.isLightning = true;
                b.lightningBounces = player.lightningBounces;
            }
            bullets.push(b);
        }
    }

    function spawnEnemies(dt) {
        spawnTimer -= dt;
        if (spawnTimer > 0) return;
        const rateMult = customCfg ? customCfg.spawnRateMult : 1;
        spawnTimer = Math.max(0.2, (1.5 - difficulty * 0.08)) * rateMult;
        const weights = getEnemyTypeWeights();
        const cnt = 1 + Math.floor(Math.random() * (2 + Math.min(difficulty, 8)));
        for (let i = 0; i < cnt; i++) {
            const type = weightedRandom(weights);
            if (type === 'swarm') {
                const sc = 3 + Math.floor(Math.random() * 3);
                for (let j = 0; j < sc; j++) enemies.push(createEnemy('swarm'));
            } else {
                enemies.push(createEnemy(type));
            }
        }
    }

    function spawnBoss(dt) {
        bossTimer -= dt;
        if (bossTimer > 0) return;
        bossTimer = customCfg ? customCfg.bossInterval : 120;
        const boss = createBoss();
        enemies.push(boss);
        for (let i = 0; i < 40; i++) {
            const p = createParticle(boss.x, boss.y, boss.color);
            p.radius = 3 + Math.random() * 6;
            p.vx *= 4; p.vy *= 4;
            p.life = 1 + Math.random();
            p.maxLife = p.life;
            particles.push(p);
        }
        const ind = document.getElementById('vs-boss-ind');
        if (ind) { ind.style.display = ''; setTimeout(() => { if (ind) ind.style.display = 'none'; }, 3000); }
    }

    function doCounter() {
        if (player._counterCD > 0) return; // 还在CD中
        player._counterCD = player._counterCount ? Math.max(0.5, 3 - (player._counterCount - 1) * 0.3) : 3;
        player._shockwaveRadius = 0;
        player._shockwaveMax = player._counterRange || 350;
        const dmg = player._counterDmg || player.bladeDamage;
        const range = player._counterRange || 350;
        for (let k = 0; k < 40; k++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 3 + Math.random() * 5;
            const p = createParticle(player.x, player.y, '#ff2020');
            p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
            p.radius = 4 + Math.random() * 4;
            p.life = 0.6; p.maxLife = 0.6;
            particles.push(p);
        }
        for (const e2 of enemies) {
            if (e2._dead) continue;
            if (Math.hypot(player.x - e2.x, player.y - e2.y) < range) {
                e2.hp -= dmg;
                e2.flashTimer = 0.1;
                if (e2.hp <= 0) { e2._dead = true; killEnemy(e2); }
            }
        }
    }

    function updateEnemies(dt) {
        // 冰冻光环：周围敌人减速
        if (player._freeze) {
            for (const e of enemies) {
                const dist = Math.hypot(player.x - e.x, player.y - e.y);
                if (dist < player._freezeRange) e.speed *= 0.7;
            }
        }

        for (const e of enemies) {
            e.bladeHitTimer -= dt;

            // 淬毒持续伤害
            if (e.poisonTimer > 0) {
                e.poisonTimer -= dt;
                if (Math.floor(e.poisonTimer * 10) % 10 === 0) {
                    e.hp -= e.poisonDmg || 0;
                    e.flashTimer = 0.05;
                    if (e.hp <= 0) { e._dead = true; killEnemy(e); }
                }
            }

            // === 隐身怪 ===
            if (e.type === 'stealth' || e.stealthTimer > 0) {
                e.stealthTimer -= dt;
                if (e.stealthTimer <= 0) {
                    e.stealthTimer = 2;
                    e.stealthVisible = !e.stealthVisible;
                }
                const target = (e.stealthVisible || e.flashTimer > 0) ? 1 : 0.15;
                e.stealthAlpha += (target - e.stealthAlpha) * 8 * dt;
            }

            if (e.exploding) {
                e.explodeTimer -= dt;
                if (e.explodeTimer <= 0) {
                    const dist = Math.hypot(player.x - e.x, player.y - e.y);
                    const blastRadius = e.type === 'bomber' ? 90 : 70;
                    if (dist < blastRadius + e.radius) {
                        const dmg = e.type === 'bomber' ? 28 + Math.floor(difficulty * 2.5) : 20 + Math.floor(difficulty * 2);
                        if (player.shieldCharges > 0) {
                            player.shieldCharges--;
                            for (let i = 0; i < 10; i++) particles.push(createParticle(e.x, e.y, '#60a5fa'));
                        } else {
                            player.hp -= dmg;
                            player.invincible = Math.max(player.invincible, 0.3);
                            if (player.hp <= 0) { player.hp = 0; endGame(); return; }
                        }
                        for (let i = 0; i < 15; i++) particles.push(createParticle(e.x, e.y, '#ef4444'));
                    }
                    for (let i = 0; i < 12; i++) {
                        const p = createParticle(e.x, e.y, e.type === 'bomber' ? '#f97316' : '#dc2626');
                        p.vx *= 2; p.vy *= 2;
                        particles.push(p);
                    }
                    e.hp = 0;
                }
                continue;
            }

            // === BOSS 特殊行为 ===
            if (e.isBoss) {
                const dist = Math.hypot(player.x - e.x, player.y - e.y);

                if (e.bossType === 'melee') {
                    e.chargeTimer -= dt;
                    if (e.isCharging) {
                        e.x += e.chargeDirX * e.speed * 140 * dt;
                        e.y += e.chargeDirY * e.speed * 140 * dt;
                        e.chargeTimer -= dt * 2;
                        if (e.chargeTimer <= 0) {
                            e.isCharging = false;
                            e.chargeTimer = 2.5;
                        }
                    } else if (e.chargeTimer <= 0) {
                        const d = Math.hypot(player.x - e.x, player.y - e.y) || 1;
                        e.chargeDirX = (player.x - e.x) / d;
                        e.chargeDirY = (player.y - e.y) / d;
                        e.isCharging = true;
                        e.chargeTimer = 0.4;
                        for (let i = 0; i < 8; i++) {
                            const p = createParticle(e.x, e.y, '#ffffff');
                            p.vx = -e.chargeDirX * 3; p.vy = -e.chargeDirY * 3;
                            particles.push(p);
                        }
                    } else {
                        const dx = player.x - e.x, dy = player.y - e.y;
                        const d = Math.hypot(dx, dy) || 1;
                        e.x += (dx / d) * e.speed * 30 * dt;
                        e.y += (dy / d) * e.speed * 30 * dt;
                    }
                }
                else if (e.bossType === 'barrage') {
                    if (dist < 120) {
                        const dx = (e.x - player.x) / dist;
                        const dy = (e.y - player.y) / dist;
                        e.x += dx * e.speed * 40 * dt;
                        e.y += dy * e.speed * 40 * dt;
                    } else if (dist > 200) {
                        const dx = (player.x - e.x) / dist;
                        const dy = (player.y - e.y) / dist;
                        e.x += dx * e.speed * 30 * dt;
                        e.y += dy * e.speed * 30 * dt;
                    }
                    e.shootTimer -= dt;
                    if (e.shootTimer <= 0) {
                        e.shootTimer = 0.6;
                        for (let j = 0; j < 8; j++) {
                            const ang = (Math.PI * 2 / 8) * j + gameTime * 0.5;
                            const b = createEnemyBullet(e.x, e.y, e.x + Math.cos(ang) * 200, e.y + Math.sin(ang) * 200);
                            b.color = '#67e8f9';
                            enemyBullets.push(b);
                        }
                    }
                }
                else if (e.bossType === 'summoner') {
                    const dx = player.x - e.x, dy = player.y - e.y;
                    const d = Math.hypot(dx, dy) || 1;
                    e.x += (dx / d) * e.speed * 25 * dt;
                    e.y += (dy / d) * e.speed * 25 * dt;

                    e.summonTimer -= dt;
                    if (e.summonTimer <= 0) {
                        e.summonTimer = 4;
                        const cnt = 3 + Math.floor(Math.random() * 3);
                        for (let j = 0; j < cnt; j++) {
                            const types = ['fast', 'swarm', 'normal'];
                            const t = types[Math.floor(Math.random() * types.length)];
                            const m = createEnemy(t);
                            m.x = e.x + (Math.random() - 0.5) * 80;
                            m.y = e.y + (Math.random() - 0.5) * 80;
                            m.color = e.color;
                            enemies.push(m);
                            for (let k = 0; k < 5; k++) particles.push(createParticle(m.x, m.y, '#a78bfa'));
                        }
                    }
                } else {
                    const dx = player.x - e.x, dy = player.y - e.y;
                    const d = Math.hypot(dx, dy) || 1;
                    e.x += (dx / d) * e.speed * 60 * dt;
                    e.y += (dy / d) * e.speed * 60 * dt;
                }
            }
            // === 普通敌人 ===
            else if (e.type === 'ranger') {
                const dist = Math.hypot(player.x - e.x, player.y - e.y);
                const preferredDist = 160;
                if (dist < preferredDist) {
                    const dx = (e.x - player.x) / dist;
                    const dy = (e.y - player.y) / dist;
                    e.x += dx * e.speed * 35 * dt;
                    e.y += dy * e.speed * 35 * dt;
                } else {
                    const dx = (player.x - e.x) / dist;
                    const dy = (player.y - e.y) / dist;
                    e.x += dx * e.speed * 30 * dt;
                    e.y += dy * e.speed * 30 * dt;
                }
                e.shootTimer -= dt;
                if (e.shootTimer <= 0) {
                    e.shootTimer = 2.2;
                    enemyBullets.push(createEnemyBullet(e.x, e.y, player.x, player.y));
                }
            }
            else if (e.type === 'shooter') {
                const dist = Math.hypot(player.x - e.x, player.y - e.y);
                const preferredDist = 130;
                if (dist < preferredDist) {
                    const dx = (e.x - player.x) / dist;
                    const dy = (e.y - player.y) / dist;
                    e.x += dx * e.speed * 30 * dt;
                    e.y += dy * e.speed * 30 * dt;
                } else {
                    const dx = (player.x - e.x) / dist;
                    const dy = (player.y - e.y) / dist;
                    e.x += dx * e.speed * 30 * dt;
                    e.y += dy * e.speed * 30 * dt;
                }
                e.shootTimer -= dt;
                if (e.shootTimer <= 0) {
                    e.shootTimer = 1.8;
                    const spreadX = player.x + (Math.random() - 0.5) * 60;
                    const spreadY = player.y + (Math.random() - 0.5) * 60;
                    enemyBullets.push(createEnemyBullet(e.x, e.y, spreadX, spreadY));
                }
            }
            else {
                const dx = player.x - e.x, dy = player.y - e.y;
                const d = Math.hypot(dx, dy) || 1;
                let speedMult = 1;
                if (player.slowAuraRange > 0 && d < player.slowAuraRange) {
                    speedMult = 0.5;
                }
                e.x += (dx / d) * e.speed * 60 * dt * speedMult;
                e.y += (dy / d) * e.speed * 60 * dt * speedMult;
            }

            // === 自爆检测 ===
            if ((e.type === 'exploder' || e.type === 'bomber') && !e.exploding && !e.isBoss) {
                const dist = Math.hypot(player.x - e.x, player.y - e.y);
                const triggerDist = e.type === 'bomber' ? 60 : 50;
                if (dist < triggerDist + e.radius) {
                    e.exploding = true;
                    e.explodeTimer = e.type === 'bomber' ? 0.6 : 0.8;
                    e.speed *= 1.5;
                }
            }

            // === 碰撞玩家 ===
            if (Math.hypot(player.x - e.x, player.y - e.y) < player.radius + e.radius && player.invincible <= 0 && player.effectShield <= 0) {
                if (player.shieldCharges > 0) {
                    player.shieldCharges--;
                    for (let i = 0; i < 8; i++) particles.push(createParticle(e.x, e.y, '#60a5fa'));
                } else {
                    const dmg = e.isBoss ? 30 + Math.floor(difficulty * 3) : 15 + Math.floor(difficulty * 2);
                    player.hp -= dmg;
                    player.invincible = 0.5;
                     // 反击冲击波 - 统一触发
                    if (player._counter && player._counterCD <= 0) { doCounter(); }
                    for (let i = 0; i < 10; i++) particles.push(createParticle(player.x, player.y, '#ef4444'));
                    if (player.hp <= 0) { player.hp = 0; endGame(); return; }
                }
            }
            if (e.flashTimer > 0) e.flashTimer -= dt;
        }
    }

    function updateBullets(dt) {
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.x += b.vx * 60 * dt; b.y += b.vy * 60 * dt;
            b.life -= dt;
            if (b.x < -20 || b.x > WW + 20 || b.y < -20 || b.y > WH + 20 || b.life <= 0) {
                bullets.splice(i, 1); continue;
            }
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                if (e._dead) continue;
                if (Math.hypot(b.x - e.x, b.y - e.y) < b.radius + e.radius) {
                    let dmg = b.damage;
                    // 狙击: 200px外伤害+50%
                    if (player._sniper && Math.hypot(player.x - e.x, player.y - e.y) > 200) dmg *= 1.5;
                    // 奥术强化: 每条闪电链+10%伤害
                    if (player._arcanePower) {
                        let chains = 0;
                        for (const lc of lightningChains) if (lc.alive) chains++;
                        dmg = Math.round(dmg * (1 + chains * 0.1));
                    }
                    let isCrit = false;
                    // 狙击：200px外伤害+50%
                    if (player._sniper) {
                        const distToPlayer = Math.hypot(player.x - e.x, player.y - e.y);
                        if (distToPlayer > 200) dmg = Math.round(dmg * 1.5);
                    }
                    if (Math.random() < player.critChance) {
                        dmg = Math.round(dmg * player.critDamage);
                        isCrit = true;
                    }
                    e.hp -= dmg; e.flashTimer = 0.08;

                    // 淬毒：附加3秒毒伤
                    if (player._poison) {
                        if (e.poisonTimer === undefined || e.poisonTimer <= 0) {
                            e.poisonDmg = Math.round(player.damage * 0.3);
                        }
                        e.poisonTimer = 3;
                    }

                    // 闪电链（法师子弹或闪电概率触发）
                    const shouldChain = b.isLightning && b.lightningBounces > 0;
                    if (shouldChain) {
                        triggerLightningChain(e, Math.round(dmg * 0.7), b.lightningBounces);
                    } else if (player.lightningChance > 0 && Math.random() < player.lightningChance) {
                        triggerLightningChain(e, Math.round(dmg * 0.5), 3);
                    }

                    if (e.hp <= 0 && !e._dead) {
                        killEnemy(e);
                        enemies.splice(j, 1);
                    }

                    // 弹射：击中后弹向最近敌人
                    if (player._ricochet > 0 && b.pierceLeft >= 0) {
                        const ne = nearestEnemy(e.x, e.y);
                        if (ne && ne !== e) {
                            const ang = Math.atan2(ne.y - e.y, ne.x - e.x);
                            const rb = createBullet(e.x, e.y, ang);
                            rb.damage = Math.round(b.damage * 0.7);
                            rb.life = b.life;
                            rb.pierceLeft = 0;
                            bullets.push(rb);
                        }
                    }

                    if (isCrit) {
                        for (let k = 0; k < 3; k++) {
                            const p = createParticle(e.x, e.y, '#fbbf24');
                            p.radius = 3; p.vx *= 2; p.vy *= 2;
                            particles.push(p);
                        }
                    }
                    if (b.pierceLeft > 0) {
                        b.pierceLeft--;
                    } else {
                        bullets.splice(i, 1); break;
                    }
                }
            }
        }
    }

    function killEnemy(e) {
        const cols = [e.color, '#fef3c7', '#fbbf24', '#ffffff'];
        const pCnt = e.isBoss ? 30 : 5;
        for (let k = 0; k < pCnt; k++) particles.push(createParticle(e.x, e.y, cols[Math.random() * cols.length | 0]));

        if (e.type === 'splitter' && !e._fromSplit) {
            for (let k = 0; k < 2; k++) {
                const child = createEnemy('fast');
                child.x = e.x + (Math.random() - 0.5) * 25;
                child.y = e.y + (Math.random() - 0.5) * 25;
                child.radius = 6;
                child.hp = Math.round(e.maxHp * 0.3);
                child.maxHp = child.hp;
                child.score = 8;
                child._fromSplit = true;
                enemies.push(child);
                for (let i = 0; i < 3; i++) particles.push(createParticle(child.x, child.y, '#eab308'));
            }
        }

        const gc = e.isBoss ? 10 : e.type === 'large' || e.type === 'armored' || e.type === 'splitter' ? 3 : e.type === 'swarm' || e._fromSplit ? 0 : 1;
        const gemVal = e.isBoss ? 50 : e.score / Math.max(gc, 1);
        for (let k = 0; k < gc; k++) {
            const gv = Math.round(gemVal * (player._gemValueMult || 1));
            gems.push(createGem(e.x + (Math.random() - 0.5) * 35, e.y + (Math.random() - 0.5) * 35, gv));
        }

        const PICKUP_TYPES = ['heart', 'energy', 'fury', 'shield'];
        if (e.isBoss) {
            const dropCnt = 3 + Math.floor(Math.random() * 3);
            for (let k = 0; k < dropCnt; k++) {
                pickups.push(createPickup(e.x, e.y, PICKUP_TYPES[Math.floor(Math.random() * PICKUP_TYPES.length)]));
            }
        } else if (Math.random() < (customCfg ? customCfg.dropRate / 100 : 0.05)) {
            pickups.push(createPickup(e.x, e.y, PICKUP_TYPES[Math.floor(Math.random() * PICKUP_TYPES.length)]));
        }
        // 连锁反应：击杀时释放小型闪电链(限制深度防卡顿)
        if (player._chainReaction && !e._chainFromReaction) {
            // 标记该敌人以防止连锁循环
            e._chainFromReaction = true;
            triggerLightningChain(e, player._chainDmg || 20, player._chainBounces || 2);
        }

        score += e.score; kills++;
    }

    function updateEnemyBullets(dt) {
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const b = enemyBullets[i];
            b.x += b.vx * 60 * dt; b.y += b.vy * 60 * dt;
            b.life -= dt;
            if (b.x < -20 || b.x > WW + 20 || b.y < -20 || b.y > WH + 20 || b.life <= 0) {
                enemyBullets.splice(i, 1); continue;
            }
            if (player.invincible <= 0 && player.effectShield <= 0) {
                if (Math.hypot(b.x - player.x, b.y - player.y) < b.radius + player.radius) {
                    player.hp -= b.damage;
                    player.invincible = Math.max(player.invincible, 0.3);
                    for (let k = 0; k < 5; k++) particles.push(createParticle(player.x, player.y, '#ff6b6b'));
                    enemyBullets.splice(i, 1);
                    if (player.hp <= 0) { player.hp = 0; endGame(); return; }
                }
            }
        }
    }

    function updateBlades(dt) {
        // 剑刃风暴转速加成
        const bladeSpeedMult = (player._bladeStormActive) ? (player._bladeStormMult || 3) : 1;
        player.bladeAngle += player.bladeSpeed * bladeSpeedMult * dt;

        if (player.heroClass === 'mage') {
            // 法师不处理光刃碰撞（电球在updateOrbs中处理）
            return;
        }

        if (player.bladeCount <= 0) return;

        for (let i = 0; i < player.bladeCount; i++) {
            const ang = player.bladeAngle + (Math.PI * 2 / player.bladeCount) * i;
            // 光剑起点(离玩家表面8px)和终点
            const sx = player.x + Math.cos(ang) * (player.radius + 8);
            const sy = player.y + Math.sin(ang) * (player.radius + 8);
            const ex = player.x + Math.cos(ang) * player.bladeRange;
            const ey = player.y + Math.sin(ang) * player.bladeRange;
            const bladeLen = Math.hypot(ex - sx, ey - sy);
            for (const e of enemies) {
                if (e.bladeHitTimer > 0) continue;
                // 计算敌人到光剑线段的最短距离
                const dx = ex - sx, dy = ey - sy;
                const t = Math.max(0, Math.min(1, ((e.x - sx) * dx + (e.y - sy) * dy) / (bladeLen * bladeLen || 1)));
                const cx = sx + t * dx, cy = sy + t * dy;
                const dist = Math.hypot(cx - e.x, cy - e.y);
                if (dist < 14 + e.radius) {
                    let dmg = player.bladeDamage;
                    // 奥术强化对光刃的加成
                    if (player._arcanePower && lightningChains.length > 0) {
                        dmg = Math.round(dmg * (1 + lightningChains.length * 0.1));
                    }
                    // 光刃暴击
                    if (player._bladeCrit > 0 && Math.random() < player._bladeCrit) {
                        dmg = Math.round(dmg * player.critDamage);
                        for (let k = 0; k < 3; k++) {
                            const p = createParticle(e.x, e.y, '#fbbf24');
                            p.radius = 3; p.vx *= 2; p.vy *= 2;
                            particles.push(p);
                        }
                    }
                    e.hp -= dmg; e.flashTimer = 0.08; e.bladeHitTimer = 0.2;
                    // 吸血
                    if (player._lifesteal) {
                        player.hp = Math.min(player.maxHp, player.hp + Math.ceil(dmg * 0.1));
                    }
                    for (let k = 0; k < 2; k++) {
                        const p = createParticle(e.x, e.y, player.bladeColor);
                        p.radius = 2; particles.push(p);
                    }

                    // 剑气：大号弧形剑气弹
                    if (player._swordQi && !e._dead) {
                        const qiAngle = Math.atan2(e.y - cy, e.x - cx);
                        const qi = createBullet(cx, cy, qiAngle);
                        qi.damage = Math.round(player.bladeDamage * 0.5);
                        qi.life = 0.8; qi.radius = 10;
                        qi.color = '#88ccff'; qi.pierceLeft = 3;
                        bullets.push(qi);
                        // 超大弧形波纹
                        for (let a = qiAngle - 0.6; a <= qiAngle + 0.6; a += 0.05) {
                            for (let d = 0; d < 3; d++) {
                                const p = createParticle(cx + Math.cos(a)*d*8, cy + Math.sin(a)*d*8, '#88ccff');
                                p.vx = Math.cos(a) * 6; p.vy = Math.sin(a) * 6;
                                p.radius = 3; p.life = 0.5; p.maxLife = 0.5;
                                particles.push(p);
                            }
                        }
                    }

                    if (e.hp <= 0) {
                        e._dead = true;
                        killEnemy(e);
                    }
                }
            }
        }
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (enemies[j]._dead) enemies.splice(j, 1);
        }
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const b = enemyBullets[i];
            for (let j = 0; j < player.bladeCount; j++) {
                const ang = player.bladeAngle + (Math.PI * 2 / player.bladeCount) * j;
                const bx = player.x + Math.cos(ang) * player.bladeRange;
                const by = player.y + Math.sin(ang) * player.bladeRange;
                if (Math.hypot(bx - b.x, by - b.y) < 18) {
                    for (let k = 0; k < 3; k++) particles.push(createParticle(b.x, b.y, '#60a5fa'));
                    enemyBullets.splice(i, 1);
                    break;
                }
            }
        }
    }

    // ============ 法师电球更新 ============
    function updateOrbs(dt) {
        if (player.heroClass !== 'mage' || player.orbCount <= 0) return;
        player.bladeAngle += player.orbSpeed * dt;

        for (let i = 0; i < player.orbCount; i++) {
            const ang = player.bladeAngle + (Math.PI * 2 / player.orbCount) * i;
            const ox = player.x + Math.cos(ang) * player.orbRange;
            const oy = player.y + Math.sin(ang) * player.orbRange;

            for (const e of enemies) {
                if (e.bladeHitTimer > 0) continue;
                // 电球碰撞检测（半径14）
                if (Math.hypot(ox - e.x, oy - e.y) < 14 + e.radius) {
                    let dmg = player.orbDamage;
                    // 奥术强化对电球的加成
                    if (player._arcanePower && lightningChains.length > 0) {
                        dmg = Math.round(dmg * (1 + lightningChains.length * 0.1));
                    }
                    if (player._bladeCrit > 0 && Math.random() < player._bladeCrit) {
                        dmg = Math.round(dmg * player.critDamage);
                    }
                    e.hp -= dmg; e.flashTimer = 0.08; e.bladeHitTimer = 0.3;
                    for (let k = 0; k < 3; k++) {
                        const p = createParticle(e.x, e.y, '#4da6ff');
                        p.radius = 2; particles.push(p);
                    }
                    if (e.hp <= 0) {
                        e._dead = true;
                        killEnemy(e);
                    }
                }
            }
        }
        // 清理死敌
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (enemies[j]._dead) enemies.splice(j, 1);
        }
        // 电球挡子弹
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const b = enemyBullets[i];
            for (let j = 0; j < player.orbCount; j++) {
                const ang = player.bladeAngle + (Math.PI * 2 / player.orbCount) * j;
                const ox = player.x + Math.cos(ang) * player.orbRange;
                const oy = player.y + Math.sin(ang) * player.orbRange;
                if (Math.hypot(ox - b.x, oy - b.y) < 16) {
                    for (let k = 0; k < 3; k++) particles.push(createParticle(b.x, b.y, '#4da6ff'));
                    enemyBullets.splice(i, 1);
                    break;
                }
            }
        }
    }

    // ============ 英雄专属技能更新 ============
    function updateHeroSkills(dt) {
        // 剑刃风暴冷却
        if (player._bladeStorm) {
            if (!player._bladeStormActive) {
                player._bladeStormCD -= dt;
                if (player._bladeStormCD <= 0) {
                    player._bladeStormActive = true;
                    player._bladeStormTimer = player._bladeStormDur || 3;
                    player._bladeStormCD = player._bladeStormCDMax || 12;
                    // 激活粒子效果
                    for (let i = 0; i < 25; i++) {
                        const a = Math.random() * Math.PI * 2;
                        const d = 5 + Math.random() * 30;
                        const p = createParticle(
                            player.x + Math.cos(a) * d,
                            player.y + Math.sin(a) * d,
                            '#88ccff'
                        );
                        p.vx = Math.cos(a) * 2;
                        p.vy = Math.sin(a) * 2;
                        p.life = 0.5; p.maxLife = 0.5;
                        p.radius = 2 + Math.random() * 2;
                        particles.push(p);
                    }
                }
            } else {
                player._bladeStormTimer -= dt;
                if (player._bladeStormTimer <= 0) {
                    player._bladeStormActive = false;
                }
            }
        }

        // 雷暴计时
        if (player._thunderStorm) {
            player._thunderStormTimer -= dt;
            if (player._thunderStormTimer <= 0) {
                player._thunderStormTimer = 10;
                // 全屏闪电
                for (const e of enemies) {
                    const dmg = player.damage * 3;
                    e.hp -= dmg;
                    e.flashTimer = 0.15;
                    // 雷电击中粒子
                    for (let k = 0; k < 6; k++) {
                        const p = createParticle(e.x, e.y, '#4da6ff');
                        p.vx *= 2; p.vy *= 2;
                        p.radius = 3;
                        p.life = 0.3; p.maxLife = 0.3;
                        particles.push(p);
                    }
                    // 雷暴闪电链视觉效果
                    lightningChains.push({
                        x1: e.x, y1: e.y - 200,
                        x2: e.x, y2: e.y,
                        life: 0.4, maxLife: 0.4, color: '#4da6ff',
                        offsets: Array.from({ length: 4 }, () => (Math.random() - 0.5) * 30),
                        offsets2: Array.from({ length: 4 }, () => (Math.random() - 0.5) * 30),
                    });
                    if (e.hp <= 0) { e._dead = true; killEnemy(e); }
                }
                // 清理
                for (let j = enemies.length - 1; j >= 0; j--) {
                    if (enemies[j]._dead) enemies.splice(j, 1);
                }
            }
        }
        // 箭雨计时
        if (player._arrowStorm) {
            if (!player._arrowStormActive) {
                player._arrowStormTimer -= dt;
                if (player._arrowStormTimer <= 0) {
                    player._arrowStormActive = true;
                    player._arrowStormTimer = player._arrowStormDur;
                }
            } else {
                player._arrowStormTimer -= dt;
                if (player._arrowStormTimer <= 0) {
                    player._arrowStormActive = false;
                    player._arrowStormTimer = player._arrowStormCD;
                }
            }
        }

        // 魔力涌动：调整护盾充能CD
        if (player._manaRegen && !player._manaRegenApplied) {
            player._baseShieldCDMax = player._baseShieldCDMax || player.shieldCDMax;
            const mult = Math.max(0.1, 1 - player._manaRegen);
            player.shieldCDMax = Math.max(3, Math.round(player._baseShieldCDMax * mult));
            player._manaRegenApplied = true;
        }

        // 反击冲击波动画
        if (player._shockwaveRadius !== undefined && player._shockwaveRadius < player._shockwaveMax) {
            player._shockwaveRadius += 500 * dt;
        }
    }

    function updatePickups(dt) {
        for (let i = pickups.length - 1; i >= 0; i--) {
            const p = pickups[i];
            p.life -= dt;
            if (p.life <= 0) { pickups.splice(i, 1); continue; }
            if (p.life < 8) { p.attracted = true; }
            if (p.attracted) {
                const dx = player.x - p.x, dy = player.y - p.y;
                const d = Math.hypot(dx, dy) || 1;
                if (d < player.radius + p.radius + 6) {
                    applyPickup(p.type);
                    pickups.splice(i, 1);
                    continue;
                }
                const sp = 4 + (2 / d) * 80;
                p.x += (dx / d) * sp * 60 * dt;
                p.y += (dy / d) * sp * 60 * dt;
            }
            const d = Math.hypot(player.x - p.x, player.y - p.y);
            if (d < player.radius + p.radius + 6) {
                applyPickup(p.type);
                pickups.splice(i, 1);
            }
        }
    }

    function applyPickup(type) {
        switch (type) {
            case 'heart':
                player.hp = Math.min(player.hp + 25, player.maxHp);
                for (let i = 0; i < 5; i++) particles.push(createParticle(player.x, player.y, '#22c55e'));
                break;
            case 'energy':
                player.effectFury = 5;
                for (let i = 0; i < 5; i++) particles.push(createParticle(player.x, player.y, '#fbbf24'));
                break;
            case 'shield':
                player.effectShield = 5;
                for (let i = 0; i < 8; i++) particles.push(createParticle(player.x, player.y, '#60a5fa'));
                break;
            case 'gem':
                xp += 50;
                for (let i = 0; i < 5; i++) particles.push(createParticle(player.x, player.y, '#c084fc'));
                break;
        }
    }

    function updateDodge(dt) {
        if (player.isDodging) {
            player.dodgeTimer -= dt;
            if (Math.random() < 0.6) {
                const p = createParticle(player.x, player.y, '#ffffff');
                p.radius = 1; p.life = 0.15; p.maxLife = 0.15;
                particles.push(p);
            }
            if (player.dodgeTimer <= 0) {
                player.isDodging = false;
            }
        }
        if (player.dodgeCharges < player.dodgeMaxCharges) {
            player.dodgeCD -= dt;
            if (player.dodgeCD <= 0) {
                player.dodgeCD = player.dodgeCDMax;
                player.dodgeCharges++;
            }
        }
        if (player.effectFury > 0) player.effectFury -= dt;
        if (player.effectShield > 0) player.effectShield -= dt;
        if (player.effectSpeed > 0) player.effectSpeed -= dt;
        if (player.regen > 0) {
            player.regenTimer -= dt;
            if (player.regenTimer <= 0) {
                player.regenTimer = 1;
                player.hp = Math.min(player.hp + player.regen, player.maxHp);
            }
        }
    }

    function updateGems(dt) {
        for (let i = gems.length - 1; i >= 0; i--) {
            const g = gems[i];
            g.life -= dt;
            if (g.life <= 0) { gems.splice(i, 1); continue; }
            const dx = player.x - g.x, dy = player.y - g.y;
            const d = Math.hypot(dx, dy);
            if (d < player.absorbRange || g.attracted) {
                g.attracted = true;
                const sp = 3 + (player.absorbRange / Math.max(d, 10)) * 2;
                g.x += (dx / d) * sp * 60 * dt;
                g.y += (dy / d) * sp * 60 * dt;
                if (d < player.radius + g.radius + 4) {
                    xp += Math.round(g.value * (1 + player.xpBoost) * (customCfg ? customCfg.xpMult : 1));
                    gems.splice(i, 1);
                }
            }
        }
    }

    function updateParticles(dt) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx * 60 * dt; p.y += p.vy * 60 * dt;
            p.life -= dt;
            if (p.life <= 0) particles.splice(i, 1);
        }
    }

    function checkLevelUp() {
        if (xp < xpToNext) return;
        xp -= xpToNext;
        level++;
        xpToNext = Math.round(xpToNext * 1.18 + 10);
        upgradeActive = true;
        running = false;
        // 加权随机选择3个升级
        upgrades = rollUpgrades(3);
        showUpgradeUI();
    }

    function showUpgradeUI() {
        const ov = document.getElementById('vs-ol-upgrade');
        const cards = document.getElementById('vs-upgrade-cards');
        ov.style.display = '';
        cards.innerHTML = upgrades.map((u, i) => {
            const cnt = upgradeCounts[u.id] || 0;
            return `<div class="vs-upgrade-card" data-idx="${i}">
                <div class="vs-upgrade-card-icon">${u.icon}</div>
                <div class="vs-upgrade-card-name">${u.name}</div>
                <div class="vs-upgrade-card-desc">${u.desc}</div>
                <div class="vs-upgrade-card-count">已选 ${cnt} 次</div>
            </div>`;
        }).join('');
        cards.querySelectorAll('.vs-upgrade-card').forEach(c => {
            c.addEventListener('click', () => selectUpgrade(parseInt(c.dataset.idx)));
        });
    }

    function selectUpgrade(idx) {
        const u = upgrades[idx];
        u.apply();
        upgradeCounts[u.id] = (upgradeCounts[u.id] || 0) + 1;
        document.getElementById('vs-ol-upgrade').style.display = 'none';
        upgradeActive = false;
        running = true;
        lastTime = performance.now();
    }

    function endGame() {
        running = false; gameOver = true;
        const ov = document.getElementById('vs-ol-gameover');
        const s = document.getElementById('vs-final');
        const m = Math.floor(gameTime / 60);
        const sec = Math.floor(gameTime % 60);
        const hero = HEROES.find(h => h.id === player.heroClass);
        s.innerHTML = `职业：${hero ? hero.shortName : '-'}<br>存活时间：${m}:${String(sec).padStart(2, '0')}<br>击杀数：${kills}<br>等级：${level}<br>得分：${score}`;
        ov.style.display = '';
    }

    // ============ HUD ============
    function updateHUD() {
        const hpBar = document.getElementById('vs-hp-bar');
        const hpText = document.getElementById('vs-hp-text');
        const xpBar = document.getElementById('vs-xp-bar');
        const lvEl = document.getElementById('vs-level');
        const timeEl = document.getElementById('vs-time');
        const killsEl = document.getElementById('vs-kills');
        const scoreEl = document.getElementById('vs-score');
        const dodgeInd = document.getElementById('vs-dodge-ind');

        if (hpBar) {
            const pct = Math.max(0, player.hp / player.maxHp * 100);
            hpBar.style.width = pct + '%';
            hpBar.style.background = pct > 50 ? 'linear-gradient(90deg,#ef4444,#22c55e)' : pct > 25 ? 'linear-gradient(90deg,#ef4444,#f59e0b)' : '#ef4444';
            hpText.textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;
        }
        if (xpBar) xpBar.style.width = Math.min(100, xp / xpToNext * 100) + '%';
        if (lvEl) lvEl.textContent = level;
        const m = Math.floor(gameTime / 60), s = Math.floor(gameTime % 60);
        const timeStr = `${m}:${String(s).padStart(2, '0')}`;
        if (timeEl) timeEl.textContent = timeStr;
        if (killsEl) killsEl.textContent = kills;
        if (scoreEl) scoreEl.textContent = score;
        if (dodgeInd) dodgeInd.textContent = `⚡×${player.dodgeCharges}`;
        updateAbilityCDs();

        updateAttrPanel(timeStr, m, s);
    }

    function updateAttrPanel(timeStr, m, sec) {
        // 职业名
        const hero = HEROES.find(h => h.id === player.heroClass);
        setEl('vs-ap-heroClass', hero ? hero.shortName : '-');
        // 基本信息
        setEl('vs-ap-level', `Lv.${level}`);
        setEl('vs-ap-xp', `${xp}/${xpToNext}`);
        setEl('vs-ap-kills', kills);
        setEl('vs-ap-time', timeStr);
        // 攻击
        setEl('vs-ap-damage', player.damage);
        setEl('vs-ap-fireRate', `${player.fireRate.toFixed(2)}s`);
        setEl('vs-ap-bulletCount', player.bulletCount);
        setEl('vs-ap-crit', `${Math.round(player.critChance * 100)}%`);
        setEl('vs-ap-pierce', player.pierce);
        // 防御
        setEl('vs-ap-hp', `${Math.ceil(player.hp)}/${player.maxHp}`);
        setEl('vs-ap-shield', `${player.shieldCharges}/${player.shieldMax}`);
        setEl('vs-ap-inv', `${player.invincible > 0 ? player.invincible.toFixed(1) : '0'}s`);
        // 光刃/电球
        const isMage = player.heroClass === 'mage';
        const bladeSecTitle = document.getElementById('vs-ap-blade-sec-title');
        const mageSec = document.getElementById('vs-ap-mage-sec');
        if (bladeSecTitle) bladeSecTitle.textContent = isMage ? '⚡ 电球' : '🗡️ 光刃';
        if (mageSec) mageSec.style.display = isMage ? '' : 'none';
        setEl('vs-ap-bladeCount', isMage ? player.orbCount : player.bladeCount);
        setEl('vs-ap-bladeDamage', isMage ? player.orbDamage : player.bladeDamage);
        setEl('vs-ap-bladeSpeed', (isMage ? player.orbSpeed : player.bladeSpeed).toFixed(2));
        setEl('vs-ap-bladeRange', isMage ? player.orbRange : player.bladeRange);
        // 法师额外信息
        const orbCountRow = document.getElementById('vs-ap-orbCount-row');
        const orbDmgRow = document.getElementById('vs-ap-orbDamage-row');
        const lightningRow = document.getElementById('vs-ap-lightning-row');
        if (orbCountRow) orbCountRow.style.display = isMage ? '' : 'none';
        if (orbDmgRow) orbDmgRow.style.display = isMage ? '' : 'none';
        if (lightningRow) lightningRow.style.display = isMage ? '' : 'none';
        if (isMage) {
            setEl('vs-ap-orbCount', player.orbCount);
            setEl('vs-ap-orbDamage', player.orbDamage);
            setEl('vs-ap-lightning', player.lightningBounces);
        }
        // 特殊
        setEl('vs-ap-absorb', player.absorbRange);
        setEl('vs-ap-speed', player.speed.toFixed(1));
        setEl('vs-ap-dodge', `${player.dodgeCharges}/${player.dodgeMaxCharges}`);
        setEl('vs-ap-dodgeCD', `${player.dodgeCDMax.toFixed(1)}s`);
        // 专属技能状态
        const bladeStormRow = document.getElementById('vs-ap-bladeStorm-row');
        const thunderStormRow = document.getElementById('vs-ap-thunderStorm-row');
        if (bladeStormRow) {
            bladeStormRow.style.display = player._bladeStorm ? '' : 'none';
            if (player._bladeStorm) {
                const cd = player._bladeStormActive
                    ? `⚡激活 ${player._bladeStormTimer.toFixed(1)}s`
                    : `冷却 ${player._bladeStormCD.toFixed(1)}s`;
                setEl('vs-ap-bladeStorm', cd);
            }
        }
        if (thunderStormRow) {
            thunderStormRow.style.display = player._thunderStorm ? '' : 'none';
            if (player._thunderStorm) {
                setEl('vs-ap-thunderStorm', `${player._thunderStormTimer.toFixed(1)}s`);
            }
        }
    }

    function setEl(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = String(val);
    }

    // 更新技能CD标签
    function updateAbilityCDs() {
        const cds = document.getElementById('vs-ability-cds');
        if (!cds) return;
        const items = [];
        if (player._counter) {
            const ready = player._counterCD <= 0;
            const cnt = player._counterCount || 1;
            items.push('<span class="vs-cd-pill '+(ready?'ready':'active')+'">💢反击'+cnt+(ready?'':player._counterCD.toFixed(1)+'s')+'</span>');
        }
        if (player._bladeStorm) {
            const active = player._bladeStormActive;
            const cd = active ? player._bladeStormTimer : player._bladeStormCD;
            const cnt = player._bladeStormCount || 1;
            items.push('<span class="vs-cd-pill '+(active?'active':(cd<=0?'ready':''))+'">🌪️风暴'+cnt+(active?cd.toFixed(1)+'s':(cd<=0?'就绪':cd.toFixed(1)+'s'))+'</span>');
        }
        if (player._lifesteal) items.push('<span class="vs-cd-pill ready">🩸吸血</span>');
        if (player._swordQi) items.push('<span class="vs-cd-pill ready">✨剑气</span>');
        if (player._tough) items.push('<span class="vs-cd-pill ready">💪坚韧</span>');
        if (player._bladeMaster) items.push('<span class="vs-cd-pill ready">🗡️大师</span>');
        // 射手技能CD
        if (player._arrowStorm) {
            const active = player._arrowStormActive;
            const cd = active ? player._arrowStormTimer : player._arrowStormTimer;
            items.push('<span class="vs-cd-pill '+(active?'active':(player._arrowStormTimer<=0?'ready':''))+'">🌧️箭雨'+(active?cd.toFixed(1)+'s':(player._arrowStormTimer<=0?'就绪':cd.toFixed(1)+'s'))+'</span>');
        }
        if (player._poison) items.push('<span class="vs-cd-pill ready">☠️淬毒</span>');
        if (player._ricochet) items.push('<span class="vs-cd-pill ready">🔄弹射'+(player._ricochet||1)+'</span>');
        if (player._sniper) items.push('<span class="vs-cd-pill ready">🔭狙击</span>');
        // 法师技能CD
        if (player._thunderStorm) items.push('<span class="vs-cd-pill active">🌩️雷暴'+player._thunderStormTimer.toFixed(1)+'s</span>');
        if (player._chainReaction) items.push('<span class="vs-cd-pill ready">⛓️连锁</span>');
        if (player._manaRegen) items.push('<span class="vs-cd-pill ready">💠魔力</span>');
        if (player._freeze) items.push('<span class="vs-cd-pill ready">❄️冰冻</span>');
        if (player._arcanePower) items.push('<span class="vs-cd-pill ready">🔆奥术</span>');
        if (player.shieldCharges > 0) items.push('<span class="vs-cd-pill ready">🛡️护盾'+player.shieldCharges+'</span>');
        cds.innerHTML = items.join('');
    }

    // ============ 主循环 ============
    function frame(ts) {
        animId = requestAnimationFrame(frame);

        if (!running || gameOver || upgradeActive) {
            const cvs = document.getElementById('vs-canvas');
            if (cvs) draw(cvs.getContext('2d'));
            updateHUD();
            return;
        }

        // ==== 安全网：HP<=0 强制死亡 ====
        if (player.hp <= 0) { player.hp = 0; endGame(); return; }
        for (let i = enemies.length - 1; i >= 0; i--) {
            if (enemies[i].hp <= 0 && !enemies[i]._dead) {
                enemies[i]._dead = true;
                killEnemy(enemies[i]);
            }
        }

        if (!lastTime) lastTime = ts;
        let dt = (ts - lastTime) / 1000;
        if (dt <= 0) dt = 0.016;
        if (dt > 0.1) dt = 0.1;
        lastTime = ts;

        gameTime += dt;
        difficultyTimer += dt;
        if (difficultyTimer >= 30) { difficultyTimer -= 30; difficulty++; }

        if (player.invincible > 0) player.invincible -= dt;

        // === 镜头平滑跟随玩家 ===
        const targetCamX = player.x - CW / 2;
        const targetCamY = player.y - CH / 2;
        camX += (targetCamX - camX) * 0.1;
        camY += (targetCamY - camY) * 0.1;
        camX = Math.max(0, Math.min(WW - CW, camX));
        camY = Math.max(0, Math.min(WH - CH, camY));

        // 移动
        let mx = 0, my = 0;
        if (keys['arrowup']    || keys['w']) my -= 1;
        if (keys['arrowdown']  || keys['s']) my += 1;
        if (keys['arrowleft']  || keys['a']) mx -= 1;
        if (keys['arrowright'] || keys['d']) mx += 1;
        const ml = Math.hypot(mx, my);
        if (ml > 0) {
            mx /= ml; my /= ml;
            player.lastMoveDirX = mx; player.lastMoveDirY = my;
        }

        // 自动寻路
        if (autoPath && ml === 0 && !player.isDodging && gems.length > 0) {
            let best = null, bestDist = Infinity;
            const range = player.absorbRange * 4;
            for (const g of gems) {
                const d = Math.hypot(g.x - player.x, g.y - player.y);
                if (d < range && d < bestDist && d > 5) { bestDist = d; best = g; }
            }
            if (best) {
                mx = best.x - player.x; my = best.y - player.y;
                const l = Math.hypot(mx, my);
                if (l > 0) { mx /= l; my /= l; }
            }
        }

        // 移动
        if (!player.isDodging) {
            player.x = Math.max(player.radius, Math.min(WW - player.radius, player.x + mx * player.speed * 60 * dt));
            player.y = Math.max(player.radius, Math.min(WH - player.radius, player.y + my * player.speed * 60 * dt));
        }

        shoot(dt);
        spawnEnemies(dt);
        spawnBoss(dt);
        updateHeroSkills(dt);
        updateBlades(dt);
        updateOrbs(dt);
        updateEnemies(dt);
        if (gameOver) return;
        // 技能CD计时
        if (player._counterCD > 0) player._counterCD -= dt;
        // 反击CD用_counterCDManagement — doCounter已设置
        // 反击冲击波实时更新
        if (player._shockwaveRadius !== undefined && player._shockwaveRadius < player._shockwaveMax) {
            player._shockwaveRadius += 500 * dt;
        }
        updateBullets(dt);
        updateEnemyBullets(dt);
        if (gameOver) return;
        updateGems(dt);
        updatePickups(dt);
        updateParticles(dt);
        updateDodge(dt);
        updateLightningChains(dt);
        checkLevelUp();

        const cvs = document.getElementById('vs-canvas');
        if (cvs) draw(cvs.getContext('2d'));
        updateHUD();
    }

    // ============ 控制 ============
    function togglePause() {
        if (gameOver || upgradeActive) return;
        paused = !paused;
        if (paused) {
            running = false;
            document.getElementById('vs-ol-pause').style.display = '';
        } else {
            document.getElementById('vs-ol-pause').style.display = 'none';
            running = true; lastTime = performance.now();
        }
    }

    function onKeyDown(e) {
        const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        keys[k] = true;

        // Tab - 切换属性面板
        if (e.key === 'Tab') {
            e.preventDefault();
            showAttrPanel = !showAttrPanel;
            const panel = document.getElementById('vs-attr-panel');
            if (panel) panel.style.display = showAttrPanel ? '' : 'none';
            return;
        }

        // Q - 自动寻路
        if (e.key === 'q' || e.key === 'Q') {
            autoPath = !autoPath;
            const ind = document.getElementById('vs-auto-ind');
            if (ind) ind.style.display = autoPath ? '' : 'none';
            return;
        }

        // Shift - 冲刺闪避
        if (e.key === 'Shift') {
            e.preventDefault();
            if (!running || gameOver || upgradeActive || player.isDodging) return;
            if (player.dodgeCharges <= 0) return;
            player.dodgeCharges--;
            if (player.dodgeCharges === player.dodgeMaxCharges - 1) player.dodgeCD = player.dodgeCDMax;
            player.isDodging = true;
            player.dodgeTimer = 0.2;
            player.invincible = Math.max(player.invincible, 0.2);
            let dx = 0, dy = 0;
            if (keys['arrowup']   || keys['w']) dy -= 1;
            if (keys['arrowdown'] || keys['s']) dy += 1;
            if (keys['arrowleft'] || keys['a']) dx -= 1;
            if (keys['arrowright']|| keys['d']) dx += 1;
            if (dx === 0 && dy === 0) {
                dx = player.lastMoveDirX; dy = player.lastMoveDirY;
            }
            const dl = Math.hypot(dx, dy) || 1;
            player.dodgeDirX = dx / dl; player.dodgeDirY = dy / dl;
            player.x = Math.max(player.radius, Math.min(WW - player.radius, player.x + player.dodgeDirX * 80));
            player.y = Math.max(player.radius, Math.min(WH - player.radius, player.y + player.dodgeDirY * 80));
            for (let i = 0; i < 15; i++) {
                const a = Math.random() * Math.PI * 2;
                const s = 1 + Math.random() * 4;
                const p = createParticle(player.x, player.y, '#ffffff');
                p.vx = Math.cos(a) * s - player.dodgeDirX * 3;
                p.vy = Math.sin(a) * s - player.dodgeDirY * 3;
                p.radius = 2 + Math.random() * 2;
                p.life = 0.3 + Math.random() * 0.5;
                p.maxLife = p.life;
                particles.push(p);
            }
            return;
        }

        // 空格 - 暂停/开始
        // E - 反击
        if (e.key === 'e' || e.key === 'E') {
            if (player._counter && player._counterCD <= 0 && running && !gameOver) { doCounter(); }
            return;
        }

        if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            if (gameOver) { restartGame(); return; }
            if (upgradeActive) return;
            if (running) { togglePause(); return; }
            startGame(); return;
        }

        // ESC
        if (e.key === 'Escape' && !upgradeActive && !gameOver) {
            if (running) togglePause();
            return;
        }

        // 1/2/3 选升级
        if (upgradeActive && e.key >= '1' && e.key <= '3') {
            const idx = parseInt(e.key) - 1;
            if (idx < upgrades.length) selectUpgrade(idx);
        }
    }

    function onKeyUp(e) {
        const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        keys[k] = false;
    }

    // ============ 启动 ============
    buildUI();

    // 个性化参数（全局变量，由模式选择设置）
    let pendingHeroIdx = 0;
    let pendingCustomMode = false;

    // ============ 自定义模式逻辑 ============
    const CUSTOM_MODE_DEFAULTS = {
        enabled: true,  // 自定义面板中始终启用
        initHp: 180, dmgMult: 1.0, speedMult: 1.0,
        bladeCount: 3, bulletCount: 1,
        enemyHpMult: 1.0, enemySpeedMult: 1.0, spawnRateMult: 1.0,
        xpMult: 1.0, dropRate: 8, bossInterval: 120, startLevel: 1,
        // 新增10个滑块默认值
        initFireRate: 0.8, bladeDmgMult: 1.0, critChance: 0,
        pierce: 0, shieldCharges: 0, regen: 0,
        absorbRange: 60, dodgeCharges: 1, dodgeCD: 1.5, bulletSpeed: 6,
        startSkills: {}
    };

    const CUSTOM_MODE_PRESETS = {
        easy:   { initHp:250, dmgMult:1.5, speedMult:1.2, bladeCount:4, bulletCount:2, enemyHpMult:0.6, enemySpeedMult:0.7, spawnRateMult:0.6, xpMult:1.5, dropRate:15, bossInterval:180, startLevel:1, initFireRate:0.4, bladeDmgMult:2.0, critChance:30, pierce:3, shieldCharges:2, regen:5, absorbRange:120, dodgeCharges:3, dodgeCD:0.8, bulletSpeed:10, startSkills:{bladeStorm:1,swordQi:1} },
        normal: { initHp:180, dmgMult:1.0, speedMult:1.0, bladeCount:3, bulletCount:1, enemyHpMult:1.0, enemySpeedMult:1.0, spawnRateMult:1.0, xpMult:1.0, dropRate:8,  bossInterval:120, startLevel:1, initFireRate:0.8, bladeDmgMult:1.0, critChance:0, pierce:0, shieldCharges:0, regen:0, absorbRange:60, dodgeCharges:1, dodgeCD:1.5, bulletSpeed:6, startSkills:{} },
        hard:   { initHp:120, dmgMult:0.8, speedMult:0.9, bladeCount:2, bulletCount:1, enemyHpMult:1.5, enemySpeedMult:1.3, spawnRateMult:1.4, xpMult:0.8, dropRate:5,  bossInterval:90,  startLevel:1, initFireRate:1.2, bladeDmgMult:0.7, critChance:0, pierce:0, shieldCharges:0, regen:0, absorbRange:40, dodgeCharges:1, dodgeCD:2.0, bulletSpeed:4, startSkills:{} },
        hell:   { initHp:70,  dmgMult:0.5, speedMult:0.7, bladeCount:1, bulletCount:1, enemyHpMult:2.5, enemySpeedMult:2.0, spawnRateMult:2.0, xpMult:0.5, dropRate:3,  bossInterval:45,  startLevel:1, initFireRate:1.5, bladeDmgMult:0.5, critChance:0, pierce:0, shieldCharges:0, regen:0, absorbRange:30, dodgeCharges:1, dodgeCD:2.5, bulletSpeed:3, startSkills:{} },
    };

    function getExclusiveSkills(heroClass) {
        if (heroClass === 'swordsman') return [
            { id: 'bladeStorm',  name: '🌪️ 剑刃风暴', desc: '光剑转速×3' },
            { id: 'swordQi',     name: '✨ 剑气',      desc: '光剑击中发射剑气' },
            { id: 'bladeMaster', name: '🗡️ 光剑大师', desc: '光剑+2把' },
            { id: 'tough',       name: '💪 坚韧',      desc: 'HP上限+40' },
            { id: 'counter',     name: '💢 反击',      desc: 'E键/受击冲击波' },
            { id: 'lifesteal',   name: '🩸 吸血',      desc: '光剑伤害10%回血' },
        ];
        if (heroClass === 'archer') return [
            { id: 'multiShot',   name: '🔫 多重射击',  desc: '弹数+2' },
            { id: 'weakSpot',    name: '🎯 弱点狙击',  desc: '暴击伤害×3' },
            { id: 'arrowStorm',  name: '🌧️ 箭雨',      desc: '每15秒射速翻倍5秒' },
            { id: 'poison',      name: '☠️ 淬毒',      desc: '子弹附加3秒毒伤' },
            { id: 'ricochet',    name: '🔄 弹射',      desc: '子弹弹射1次' },
            { id: 'sniper',      name: '🔭 狙击',      desc: '200px外伤害+50%' },
        ];
        if (heroClass === 'mage') return [
            { id: 'arcBounce',   name: '⚡ 电弧',       desc: '闪电链弹跳+2' },
            { id: 'thunderStorm',name: '🌩️ 雷暴',      desc: '全屏闪电清场' },
            { id: 'manaShield',  name: '🔮 法力盾',    desc: '护盾层数+2' },
            { id: 'chainReaction',name:'⛓️ 连锁反应',  desc: '击杀释放小型闪电链' },
            { id: 'manaRegen',   name: '💠 魔力涌动',  desc: '护盾充能+50%' },
            { id: 'freeze',      name: '❄️ 冰冻光环',  desc: '100px内敌人减速30%' },
            { id: 'arcanePower', name: '🔆 奥术强化',  desc: '每闪电链全伤害+10%' },
        ];
        return [];
    }

    function getCustomMode() {
        try {
            const raw = localStorage.getItem('vs-custom-mode');
            if (raw) { const d = JSON.parse(raw); return { ...CUSTOM_MODE_DEFAULTS, ...d }; }
        } catch (_) {}
        return { ...CUSTOM_MODE_DEFAULTS };
    }

    function saveCustomMode(cfg) {
        try { localStorage.setItem('vs-custom-mode', JSON.stringify(cfg)); } catch (_) {}
    }

    function applyCustomModeToPlayer(player, cfg) {
        player.maxHp = cfg.initHp;
        player.hp = cfg.initHp;
        player.speed *= cfg.speedMult;
        player.damage = Math.round(player.damage * cfg.dmgMult);
        player.bladeDamage = Math.round(player.bladeDamage * cfg.dmgMult);
        player.orbDamage = Math.round(player.orbDamage * cfg.dmgMult);
        if (cfg.bladeCount !== undefined && player.heroClass !== 'mage') {
            player.bladeCount = cfg.bladeCount;
        }
        if (cfg.bulletCount !== undefined) {
            player.bulletCount = cfg.bulletCount;
        }
        // 新增：初始射速（覆盖英雄默认值）
        if (cfg.initFireRate !== undefined) {
            player.fireRate = cfg.initFireRate;
            player.fireCooldown = 0;
        }
        // 新增：光剑伤害倍率（独立于全局伤害倍率，叠加）
        if (cfg.bladeDmgMult !== undefined) {
            player.bladeDamage = Math.round(player.bladeDamage * cfg.bladeDmgMult);
        }
        // 新增：暴击率（覆盖英雄默认值，范围0-0.5）
        if (cfg.critChance !== undefined) {
            player.critChance = cfg.critChance / 100;
        }
        // 新增：穿透（覆盖英雄默认值）
        if (cfg.pierce !== undefined) {
            player.pierce = cfg.pierce;
        }
        // 新增：护盾层数
        if (cfg.shieldCharges !== undefined && cfg.shieldCharges > 0) {
            player.shieldCharges = cfg.shieldCharges;
            player.shieldMax = Math.max(player.shieldMax, cfg.shieldCharges);
        }
        // 新增：生命回复（覆盖英雄默认值）
        if (cfg.regen !== undefined) {
            player.regen = cfg.regen;
        }
        // 新增：吸取范围
        if (cfg.absorbRange !== undefined) {
            player.absorbRange = cfg.absorbRange;
        }
        // 新增：冲刺充能
        if (cfg.dodgeCharges !== undefined) {
            player.dodgeMaxCharges = cfg.dodgeCharges;
            player.dodgeCharges = cfg.dodgeCharges;
        }
        // 新增：冲刺冷却
        if (cfg.dodgeCD !== undefined) {
            player.dodgeCDMax = cfg.dodgeCD;
            player.dodgeCD = 0;
        }
        // 新增：子弹速度
        if (cfg.bulletSpeed !== undefined) {
            player.bulletSpeed = cfg.bulletSpeed;
        }
        if (cfg.startSkills && Object.keys(cfg.startSkills).length > 0) {
            const skillMap = {
                bladeStorm() { player._bladeStormCount=(player._bladeStormCount||0)+1; if(!player._bladeStorm){player._bladeStorm=true;player._bladeStormCD=12;player._bladeStormDur=3;player._bladeStormMult=3;}else{player._bladeStormCD=Math.max(5,player._bladeStormCD-1.5);player._bladeStormDur+=0.5;player._bladeStormMult+=0.5;} },
                swordQi() { player._swordQi = true; },
                bladeMaster() { player.bladeCount += 2; },
                tough() { player.maxHp += 40; player.hp += 40; },
                counter() { player._counterCount=(player._counterCount||0)+1; if(!player._counter){player._counter=true;player._counterDmg=player.bladeDamage;player._counterRange=350;}else{player._counterDmg+=10;player._counterRange+=20;}player._counterCD=0; },
                lifesteal() { player._lifesteal = true; },
                multiShot() { player.bulletCount += 2; },
                weakSpot() { player.critDamage = (player.critDamage || 1.5) * 3; },
                arcBounce() { player.lightningBounces += 2; },
                thunderStorm() { player._thunderStorm = true; player._thunderStormTimer = 10; },
                manaShield() { player.shieldMax += 2; player.shieldCharges += 2; },
                // v16 新专属
                arrowStorm() { if(!player._arrowStorm){player._arrowStorm=true;player._arrowStormCD=15;player._arrowStormTimer=15;player._arrowStormDur=5;player._arrowStormActive=false;player._arrowStormFireRate=player.fireRate;}else{player._arrowStormCD=Math.max(8,player._arrowStormCD-2);player._arrowStormDur+=1.5;} },
                poison() { player._poison = true; },
                ricochet() { player._ricochet = (player._ricochet || 0) + 1; },
                sniper() { player._sniper = true; },
                chainReaction() { player._chainReaction = true; },
                manaRegen() { player._manaRegen = (player._manaRegen || 0) + 0.5; },
                freeze() { player._freeze = true; player._freezeRange = 100; },
                arcanePower() { player._arcanePower = true; },
            };
            for (const [sid, count] of Object.entries(cfg.startSkills)) {
                if (skillMap[sid]) {
                    for (let i = 0; i < count; i++) skillMap[sid]();
                    upgradeCounts[sid] = count;
                }
            }
        }
        if (cfg.startLevel > 1) {
            for (let i = 1; i < cfg.startLevel; i++) {
                level++; xpToNext = Math.round(xpToNext * 1.18 + 10);
            }
        }
    }

    // ============ 英雄选择界面（正常模式） ============
    function buildHeroSelectPanel() {
        const cards = document.getElementById('vs-hero-cards');
        if (!cards) return;
        let html = '';
        HEROES.forEach((h, i) => {
            html += `<div class="vs-hero-card" data-idx="${i}" style="background:rgba(255,255,255,.05);border:2px solid rgba(255,255,255,.12);border-radius:14px;padding:16px 20px;cursor:pointer;text-align:center;min-width:160px;transition:all .2s;user-select:none">
                <div style="font-size:32px;margin-bottom:8px">${h.icon || (['⚔️','🏹','🔮'][i])}</div>
                <div style="font-size:15px;font-weight:700;color:${h.color}">${h.shortName}</div>
                <div style="font-size:11px;color:#999;margin-top:4px">HP:${h.hp} 伤:${h.damage} 速:${h.speed}</div>
                <div style="font-size:10px;color:#777">${h.description || ''}</div>
            </div>`;
        });
        cards.innerHTML = html;
        // 添加CSS
        const S = document.createElement('style');
        S.textContent = '.vs-hero-card:hover{border-color:var(--color-accent)!important;background:rgba(255,255,255,.1)!important;transform:translateY(-3px);box-shadow:0 6px 20px rgba(0,0,0,.4)}.vs-hero-cards{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;padding:10px}';
        cards.appendChild(S);
        // 点击事件
        cards.querySelectorAll('.vs-hero-card').forEach(c => {
            c.addEventListener('click', () => {
                pendingHeroIdx = parseInt(c.dataset.idx);
                pendingCustomMode = false;
                document.getElementById('vs-ol-hero-select').style.display = 'none';
                startGame();
            });
        });
    }

    // ============ 自定义模式面板构建到独立界面 ============
    function buildCustomModePanel() {
        const scroll = document.getElementById('vs-custom-scroll');
        if (!scroll) return;

        const cfg = getCustomMode();

        // 填充英雄选择下拉
        const heroSel = document.getElementById('vs-custom-hero');
        if (heroSel) {
            heroSel.innerHTML = HEROES.map((h, i) => `<option value="${i}" style="color:${h.color}">${h.name}</option>`).join('');
            heroSel.value = pendingHeroIdx;
            heroSel.addEventListener('change', () => {
                pendingHeroIdx = parseInt(heroSel.value);
                rebuildCustomBody();
            });
        }

        // 滑块定义（提取共用）
        const SLIDERS = [
            { id:'initHp',        label:'初始HP',       min:10,  max:1000, step:10,  unit:'' },
            { id:'dmgMult',       label:'伤害倍率',     min:0.1, max:10,   step:0.1, unit:'x' },
            { id:'speedMult',     label:'移速倍率',     min:0.1, max:5,    step:0.1, unit:'x' },
            { id:'bladeCount',    label:'光剑数',       min:0,   max:30,   step:1,   unit:'把' },
            { id:'bulletCount',   label:'弹数',         min:0,   max:30,   step:1,   unit:'颗' },
            { id:'enemyHpMult',   label:'怪物血量倍率', min:0.1, max:1000, step:1,   unit:'x' },
            { id:'enemySpeedMult',label:'怪物速度倍率', min:0.1, max:20,   step:0.1, unit:'x' },
            { id:'spawnRateMult', label:'生成速度倍率', min:0.01,max:10,   step:0.1, unit:'x' },
            { id:'xpMult',        label:'经验倍率',     min:0.1, max:100,  step:1,   unit:'x' },
            { id:'dropRate',      label:'掉落率',       min:0,   max:100,  step:1,   unit:'%' },
            { id:'bossInterval',  label:'BOSS间隔',     min:10,  max:600,  step:5,   unit:'s' },
            { id:'startLevel',    label:'起始等级',     min:1,   max:50,   step:1,   unit:'级' },
            { id:'initFireRate',  label:'初始射速',     min:0.02,max:3,    step:0.05,unit:'s' },
            { id:'bladeDmgMult',  label:'光剑伤害倍率', min:0.1, max:10,   step:0.1, unit:'x' },
            { id:'critChance',    label:'暴击率',       min:0,   max:100,  step:1,   unit:'%' },
            { id:'pierce',        label:'穿透',         min:0,   max:20,   step:1,   unit:'层' },
            { id:'shieldCharges', label:'护盾层数',     min:0,   max:20,   step:1,   unit:'层' },
            { id:'regen',         label:'生命回复',     min:0,   max:50,   step:0.5, unit:'/s' },
            { id:'absorbRange',   label:'吸取范围',     min:30,  max:500,  step:5,   unit:'px' },
            { id:'dodgeCharges',  label:'冲刺充能',     min:1,   max:20,   step:1,   unit:'次' },
            { id:'dodgeCD',       label:'冲刺冷却',     min:0.05,max:5,    step:0.1, unit:'s' },
            { id:'bulletSpeed',   label:'子弹速度',     min:1,   max:20,   step:0.5, unit:'px' },
        ];

        function rebuildCustomBody() {
            const currentCfg = readCustomModeFromUI();
            let html = '';

            // 预设按钮
            html += '<div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap">';
            const presets = [
                { key:'easy', label:'😊 简单', color:'#4ade80' },
                { key:'normal', label:'😐 普通', color:'#fbbf24' },
                { key:'hard', label:'😈 困难', color:'#f97316' },
                { key:'hell', label:'💀 地狱', color:'#ef4444' },
            ];
            for (const p of presets) {
                html += `<button class="vs-cm-preset" data-preset="${p.key}" style="padding:2px 10px;border-radius:6px;border:1px solid ${p.color};color:${p.color};background:transparent;cursor:pointer;font-size:11px;white-space:nowrap">${p.label}</button>`;
            }
            html += '</div>';

            // 滑块
            for (const s of SLIDERS) {
                const val = currentCfg[s.id] !== undefined ? currentCfg[s.id] : CUSTOM_MODE_DEFAULTS[s.id];
                html += `<div style="display:flex;align-items:center;gap:6px;margin:3px 0">
                    <span style="width:75px;flex-shrink:0;text-align:right;font-size:10px">${s.label}</span>
                    <input type="range" class="vs-cm-slider" data-id="${s.id}" min="${s.min}" max="${s.max}" step="${s.step}" value="${val}" style="flex:1;height:4px;accent-color:var(--color-accent)">
                    <span class="vs-cm-val" data-for="${s.id}" style="width:36px;text-align:center;font-size:10px;color:#fff">${val}${s.unit}</span>
                </div>`;
            }

            // 技能复选框
            const heroIdx = heroSel ? parseInt(heroSel.value) || 0 : 0;
            const hero = HEROES[heroIdx] || HEROES[0];
            const exclusiveSkills = getExclusiveSkills(hero.id);
            html += '<div style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,.1)">';
            html += '<div style="font-size:11px;color:var(--color-accent);margin-bottom:4px">' + hero.shortName + '开局技能</div>';
            html += '<div style="display:flex;flex-wrap:wrap;gap:4px">';
            for (const sk of exclusiveSkills) {
                const count = (currentCfg.startSkills && currentCfg.startSkills[sk.id]) || 0;
                html += `<label title="${sk.desc}" style="padding:2px 6px;font-size:10px;color:#ccc;display:inline-flex;align-items:center;gap:3px;border-radius:4px;background:rgba(255,255,255,.04)">
                    ${sk.name}<input type="number" class="vs-cm-skill" data-skill="${sk.id}" value="${count}" min="0" max="5" style="width:28px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;font-size:10px;text-align:center;border-radius:3px">
                </label>`;
            }
            html += '</div></div>';

            scroll.innerHTML = html;

            // 滑块事件
            scroll.querySelectorAll('.vs-cm-slider').forEach(sl => {
                const updateVal = () => {
                    const v = parseFloat(sl.value);
                    const label = scroll.querySelector(`.vs-cm-val[data-for="${sl.dataset.id}"]`);
                    if (label) {
                        const sdef = SLIDERS.find(s => s.id === sl.dataset.id);
                        label.textContent = v + (sdef ? sdef.unit : '');
                    }
                };
                sl.addEventListener('input', updateVal);
            });

            // 预设按钮事件
            scroll.querySelectorAll('.vs-cm-preset').forEach(btn => {
                btn.addEventListener('click', () => {
                    const key = btn.dataset.preset;
                    const preset = CUSTOM_MODE_PRESETS[key];
                    if (!preset) return;
                    for (const s of SLIDERS) {
                        if (preset[s.id] !== undefined) {
                            const slider = scroll.querySelector(`.vs-cm-slider[data-id="${s.id}"]`);
                            if (slider) { slider.value = preset[s.id]; slider.dispatchEvent(new Event('input')); }
                        }
                    }
                    scroll.querySelectorAll('.vs-cm-skill').forEach(inp => {
                        inp.value = (preset.startSkills && preset.startSkills[inp.dataset.skill]) || 0;
                    });
                });
            });
        }

        rebuildCustomBody();
        // 初始存储
        saveCustomMode(readCustomModeFromUI());
    }

    // 从自定义面板读取配置
    function readCustomModeFromUI() {
        const cfg = { ...getCustomMode() };
        cfg.enabled = true; // 自定义面板始终启用
        const sliders = document.querySelectorAll('#vs-custom-scroll .vs-cm-slider');
        sliders.forEach(sl => {
            cfg[sl.dataset.id] = parseFloat(sl.value);
        });
        // 读取技能(数字输入: 0=不选, 1-5=叠加次数)
        const startSkills = {};
        document.querySelectorAll('#vs-custom-scroll .vs-cm-skill').forEach(inp => {
            const v = parseInt(inp.value) || 0;
            if (v > 0) startSkills[inp.dataset.skill] = v;
        });
        cfg.startSkills = startSkills;
        return cfg;
    }

    // ============ 游戏开始（统一入口） ============
    // 正常模式：直接 initGame + 启动，不应用任何自定义设置
    function startNormalGame() {
        customCfg = null;               // 正常模式不启用自定义配置
        initGame();
        document.getElementById('vs-ol-start').style.display = 'none';
        document.getElementById('vs-ol-hero-select').style.display = 'none';
        document.getElementById('vs-ol-custom').style.display = 'none';
        running = true; lastTime = performance.now();
        document.getElementById('vs-btn-pause').disabled = false;
    }

    // 自定义模式：读取UI设置，applyCustomModeToPlayer，initGame，启动
    function startCustomGame() {
        const cfg = readCustomModeFromUI();
        saveCustomMode(cfg);
        customCfg = cfg;                // 需要在 initGame 之前设置（createPlayer 读取 enemies 相关属性）
        initGame();
        applyCustomModeToPlayer(player, cfg);
        bossTimer = cfg.bossInterval || 120;
        document.getElementById('vs-ol-start').style.display = 'none';
        document.getElementById('vs-ol-hero-select').style.display = 'none';
        document.getElementById('vs-ol-custom').style.display = 'none';
        running = true; lastTime = performance.now();
        document.getElementById('vs-btn-pause').disabled = false;
    }

    function startGame() {
        if (pendingCustomMode) {
            startCustomGame();
        } else {
            startNormalGame();
        }
    }

    function restartGame() {
        customCfg = null;               // 重置自定义配置，回到模式选择
        pendingCustomMode = false;
        initGame();
        ['vs-ol-start', 'vs-ol-pause', 'vs-ol-gameover', 'vs-ol-upgrade', 'vs-ol-hero-select', 'vs-ol-custom'].forEach(id => {
            const el = document.getElementById(id); if (el) el.style.display = 'none';
        });
        document.getElementById('vs-ol-start').style.display = '';
        document.getElementById('vs-btn-pause').disabled = true;
        const bossInd = document.getElementById('vs-boss-ind');
        if (bossInd) bossInd.style.display = 'none';
        const autoInd = document.getElementById('vs-auto-ind');
        if (autoInd) autoInd.style.display = 'none';
        const panel = document.getElementById('vs-attr-panel');
        if (panel) { panel.style.display = 'none'; showAttrPanel = false; }
        const cvs = document.getElementById('vs-canvas');
        if (cvs) draw(cvs.getContext('2d'));
        updateHUD();
    }

    initGame();
    buildHeroSelectPanel();
    buildCustomModePanel();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // 正常模式入口 → 进入英雄选择
    document.getElementById('vs-btn-normal').addEventListener('click', () => {
        document.getElementById('vs-ol-start').style.display = 'none';
        document.getElementById('vs-ol-hero-select').style.display = '';
    });

    // 自定义模式入口 → 进入自定义面板
    document.getElementById('vs-btn-custom-entry').addEventListener('click', () => {
        pendingCustomMode = true;
        document.getElementById('vs-ol-start').style.display = 'none';
        document.getElementById('vs-ol-custom').style.display = '';
        // 重建自定义面板（hero dropdown已就绪）
        buildCustomModePanel();
    });

    // 自定义面板"开始自定义游戏"按钮
    document.getElementById('vs-btn-custom-start').addEventListener('click', () => {
        const heroSel = document.getElementById('vs-custom-hero');
        pendingHeroIdx = heroSel ? parseInt(heroSel.value) || 0 : 0;
        pendingCustomMode = true;
        // 保存配置
        saveCustomMode(readCustomModeFromUI());
        startGame();
    });

    // 英雄选择面板的"返回"按钮
    document.getElementById('vs-hero-select-back').addEventListener('click', () => {
        document.getElementById('vs-ol-hero-select').style.display = 'none';
        document.getElementById('vs-ol-start').style.display = '';
    });

    // 自定义面板的"返回"按钮
    document.getElementById('vs-custom-back').addEventListener('click', () => {
        saveCustomMode(readCustomModeFromUI());
        document.getElementById('vs-ol-custom').style.display = 'none';
        document.getElementById('vs-ol-start').style.display = '';
        pendingCustomMode = false;
    });

    document.getElementById('vs-btn-resume').addEventListener('click', togglePause);
    document.getElementById('vs-btn-pause').addEventListener('click', togglePause);
    document.getElementById('vs-btn-restart').addEventListener('click', restartGame);

    const cvs = document.getElementById('vs-canvas');
    if (cvs) draw(cvs.getContext('2d'));

    animId = requestAnimationFrame(frame);

    return {
        cleanup() {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);
            cancelAnimationFrame(animId);
            running = false;
        }
    };
}
