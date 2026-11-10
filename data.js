export const WORLD = {w:16384,h:8192,zone:4096,tile:64};
const skill=(name,icon,kind,cost,cd,power,range,description)=>({name,icon,kind,cost,cd,power,range,description});
export const HEROES = [
 {id:0,name:'张科',title:'破军刀客',role:'近战 · 突进 · 群攻',color:'#d8a15b',hp:360,mp:150,atk:32,def:12,speed:245,range:120,weapon:'长刀',photo:'zhangke.webp',crop:[0,0,421,480],quote:'一刀破阵，踏尽山海。',skills:[skill('破阵斩','斩','cone',15,3,2.1,180,'挥刀斩击前方异兽，造成210%伤害。'),skill('追风突袭','突','dash',22,7,2.4,320,'向目标突进，并造成240%伤害。'),skill('旋风刀','旋','spin',30,10,3.2,215,'刀风席卷周围，造成320%范围伤害。'),skill('战意','战','fury',25,18,0,0,'8秒内攻击加速，并恢复造成伤害的生命。'),skill('天裂斩','裂','nova',48,25,6,330,'刀气撕裂大地，造成600%范围伤害。')]},
 {id:1,name:'全全',title:'玄甲镇岳',role:'肉盾 · 护盾 · 控制',color:'#91ada3',hp:570,mp:145,atk:24,def:27,speed:210,range:110,weapon:'重盾',photo:'quanquan.webp',crop:[0,0,294,480],quote:'我在，山河不退。',skills:[skill('盾击','盾','stun',12,4,1.8,160,'盾击近敌，眩晕2秒。'),skill('震地','震','slow',22,8,2.5,240,'重踏地面，伤害并减速周围异兽。'),skill('铁壁','壁','shield',25,14,0,0,'获得相当于最大生命45%的护盾，持续10秒。'),skill('怒吼','吼','taunt',20,12,1,380,'吸引周围敌人，降低其伤害，持续6秒。'),skill('玄武镇岳','岳','guard',45,26,4.5,300,'获得强大护盾并震退周围异兽。')]},
 {id:2,name:'栋栋',title:'星河御法',role:'法师 · 远程 · 范围',color:'#a5c5e1',hp:260,mp:260,atk:38,def:7,speed:230,range:480,weapon:'法杖',photo:'dongdong.webp',crop:[0,0,398,480],quote:'引九天星火，照万古大荒。',skills:[skill('灵火','火','fire',12,2.2,2,520,'发射追踪火球，造成200%法术伤害。'),skill('寒霜','霜','slow',24,7,2.3,290,'寒霜覆盖周围，造成伤害并减速。'),skill('雷引','雷','chain',28,9,2.8,550,'雷电跳跃，攻击至多5只异兽。'),skill('灵障','障','shield',30,15,0,0,'灵力化为护盾，吸收伤害。'),skill('陨星','星','meteor',55,24,6.5,420,'锁定敌人位置，1秒后落下陨星。')]},
 {id:3,name:'威威',title:'千机神射',role:'枪械 · 远程 · 穿透',color:'#b6c49a',hp:300,mp:175,atk:34,def:10,speed:250,range:580,weapon:'火枪',photo:'weiwei.webp',crop:[0,0,453,480],quote:'枪声所至，百兽伏藏。',skills:[skill('穿甲弹','穿','pierce',14,4,2.4,650,'发射贯穿异兽的穿甲弹。'),skill('连射','连','burst',22,7,1.2,600,'快速射出5发子弹。'),skill('爆裂弹','爆','bomb',28,9,3.2,600,'目标位置爆炸，对周围异兽造成伤害。'),skill('翻滚射击','滚','roll',18,8,2,380,'向移动方向翻滚，并射击最近目标。'),skill('天火齐射','轰','barrage',48,25,1.7,650,'连续覆盖目标区域，发射9枚爆裂弹。')]},
 {id:4,name:'强子',title:'幽影双刃',role:'近战 · 双刀 · 暴击',color:'#b4a1d0',hp:320,mp:165,atk:35,def:10,speed:280,range:115,weapon:'双刀',photo:'qiangzi.webp',crop:[0,0,379,480],quote:'影过无痕，刃出惊雷。',skills:[skill('双刃','双','double',14,3,2.4,160,'双刀连续斩击，造成240%伤害。'),skill('影袭','影','dash',20,6,2.6,360,'突袭目标，造成260%伤害。'),skill('血刃','血','leech',25,16,0,0,'8秒内攻击回复自身生命。'),skill('疾影','疾','haste',20,15,0,0,'8秒内增加移动速度和闪避。'),skill('千刃','刃','spin',45,23,5.7,270,'无数刀光斩击周围异兽。')]}
];
const zone=(id,name,subtitle,min,max,x,y,color,accent,bossName,types)=>({id,name,subtitle,min,max,x,y,color,accent,bossName,types,camp:[x+750,y+2050],boss:[x+3150,y+2050]});
export const ZONES=[
zone(0,'青丘原野','狐鸣古道 · 初入大荒',1,8,0,0,'#3e4839','#c2b57b','九尾·青丘灵尊',[0,2]),
zone(1,'招摇密林','古木深处 · 狰兽之境',7,16,4096,0,'#263f38','#83ad91','六足狰·山君',[1,3]),
zone(2,'云梦泽','烟波水岸 · 九首潜渊',14,24,8192,0,'#31494b','#9dbdc0','相柳·九首',[4,5]),
zone(3,'赤炎山','焦土余烬 · 毕方焚天',22,32,12288,0,'#514036','#d69566','毕方·焚天',[6,7]),
zone(4,'北冥雪原','风雪无垠 · 冰龙蛰伏',30,40,0,4096,'#606f72','#c4dce0','烛阴·寒渊',[8,9]),
zone(5,'雷泽古墟','残碑雷鸣 · 夔牛震世',38,48,4096,4096,'#3e4254','#b7b1d5','夔牛·震世',[10,11]),
zone(6,'昆仑天阶','玉阶通天 · 神兽镇山',46,56,8192,4096,'#545443','#d0bf84','应龙·昆仑',[12,13]),
zone(7,'归墟禁地','万象归寂 · 饕餮噬天',54,60,12288,4096,'#302e3c','#af91a7','饕餮·归墟',[14,15])];
export const SPECIES=['青丘灵狐','山狰','狌狌','鹿蜀','泽蛇','蛊雕','毕方','炎獒','北冥狼','雪犀','雷夔','雷鹰','金角兽','青羽玄鸟','影兽','玄鳞蛇'];
export const QUALITY=['凡品','精良','稀有','史诗','传说'];
export const QCOLORS=['#b4b7ac','#95b69b','#95b8da','#b39bc7','#d6ac63'];
export const SLOTS={weapon:'武器',armor:'衣甲',helm:'头饰',charm:'饰品'};
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function random(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
export function hash(x,y){let n=Math.imul(x,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;}
export const zoneAt=(x,y)=>ZONES[clamp(Math.floor(y/4096),0,1)*4+clamp(Math.floor(x/4096),0,3)];
export const xpNeed=level=>Math.floor(80*Math.pow(level,1.46));
