// 战力排行榜
//
// 账号存在本机浏览器里，所以这张榜是「这台设备上的所有账号 + 当前角色」按战力排序。
// 战力刻意用引擎自己的 stats 计算（等级 + 装备 + 强化），不另写一套公式，避免和战斗数值脱节。
// 跨设备上线需要服务器聚合，届时把 buildRows 的数据源换成接口返回即可，UI 不用动。
import {QCOLORS} from './data.js?v=20';
import {Game, createSave, validateSave} from './engine.js?v=20';

// 战力 = 生存(0.5) + 灵力(0.35) + 攻防和×8 + 暴击×1200 + 等级×60
export function powerOf(stats, level) {
  const s = stats || {};
  return Math.round((s.hp || 0) * 0.5 + (s.mp || 0) * 0.35
    + ((s.attack || 0) + (s.defense || 0)) * 8 + (s.crit || 0) * 1200 + (level || 1) * 60);
}

// 一个存档里战力最高的角色
export function bestOf(rawSave) {
  let best = null;
  try {
    const save = validateSave(rawSave);
    const heroes = save.heroes || [];
    for (let i = 0; i < heroes.length; i++) {
      const game = new Game(save, i);           // 引擎算出的真实属性
      const hero = game.hero, def = game.def;
      if (!hero || !def) continue;
      const row = {
        heroId: i,
        hero: def.name,
        title: def.title,
        level: hero.level || 1,
        power: powerOf(game.stats, hero.level || 1),
      };
      if (!best || row.power > best.power) best = row;
    }
  } catch (e) {
    return null;
  }
  return best;
}

// accounts: {name:{id,...}}  readSave: id => save   me: {name, save} | null
export function buildRows({accounts, readSave, me}) {
  const rows = [];
  const mine = me && me.name ? me.name : null;
  for (const name of Object.keys(accounts || {})) {
    if (name === mine) continue;                 // 当前账号用内存里的最新存档，避免重复
    const rec = accounts[name];
    const best = bestOf(readSave(rec.id));
    if (best) rows.push({ name, ...best });
  }
  if (me && me.save) {
    const best = bestOf(me.save);
    if (best) rows.push({ name: mine, ...best, me: true });
  }
  rows.sort((a, b) => b.power - a.power || b.level - a.level || String(a.name).localeCompare(String(b.name)));
  rows.forEach((r, i) => { r.rank = i + 1; });
  return rows;
}

const esc0 = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

export function renderBoard(rows, meName) {
  const style = `<style>
.lb{display:grid;grid-template-columns:38px 1fr 1fr 58px 76px;gap:6px;align-items:center;
 font-size:13px;padding:7px 4px;border-bottom:1px solid #ffffff10}
.lb.head{color:#a7ada6;font-size:11px;letter-spacing:1px;border-bottom-color:#a494694d}
.lb.me{background:#d2b7811f;border-radius:6px}
.lb .rank{color:#cfb580;font-weight:600}
.lb .pw{text-align:right;color:#e1cf9e;font-variant-numeric:tabular-nums}
.lb .lv{text-align:right;color:#b6c1b4;font-variant-numeric:tabular-nums}
.lb .who{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lb .tag{font-size:10px;color:#0b1413;background:#cfb580;border-radius:4px;padding:0 4px;margin-left:6px}
</style>`;
  const head = `<div class="lb head"><span>#</span><span>玩家</span><span>角色</span><span class="lv">等级</span><span class="pw">战力</span></div>`;
  const body = rows.map(r => `<div class="lb${r.me ? ' me' : ''}">
<span class="rank">${r.rank}</span>
<span class="who">${esc0(r.name)}${r.me ? '<i class="tag">我</i>' : ''}</span>
<span class="who">${esc0(r.hero)}<small style="color:${QCOLORS[Math.min(4, Math.floor((r.level || 1) / 12))] || '#8a8f7d'}"> ${esc0(r.title || '')}</small></span>
<span class="lv">Lv.${r.level}</span>
<span class="pw">${r.power.toLocaleString('zh-CN')}</span>
</div>`).join('');
  const mine = rows.find(r => r.me);
  const tip = mine
    ? `<p class="muted">我的战力 <b class="gold">${mine.power.toLocaleString('zh-CN')}</b> · ${esc0(mine.hero)} Lv.${mine.level}</p>`
    : '<p class="muted">登录账号后，你的成绩会出现在这张榜上。</p>';
  const note = `<p class="fine">战力 = 生命×0.5 + 灵力×0.35 + 攻防和×8 + 暴击×1200 + 等级×60，按引擎实际属性（含装备强化）计算。<br>
账号保存在本机浏览器，所以这是这台设备上的排行；跨设备排行榜需要服务器汇总。</p>`;
  return `${style}${tip}<div style="margin-top:8px">${head}${body || '<p class="muted">还没有成绩，先开一局吧。</p>'}</div>${note}`;
}
