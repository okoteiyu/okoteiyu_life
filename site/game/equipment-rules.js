/** Numeric equipment effects multiply; support abilities also participate in battle. */
export const SUPPORT_ITEMS=Object.freeze({
 hard_glove:Object.freeze({id:'hard_glove',displayInBattle:true,name:'かたいグローブ',description:'小さく丸い手がすっぽり収まる、かたいグローブ。戦闘ではそばに浮かび、与えるダメージが1.25倍になります。',multipliers:Object.freeze({damageDealt:1.25})}),
 stored_ki:Object.freeze({id:'stored_ki',displayInBattle:true,name:'溜めた気',description:'ぼんやりと白く光る、溜めた気の塊。戦闘ではそばに浮かび、HP・攻撃力・気・速さが1.1倍になります。',multipliers:Object.freeze({hp:1.1,attack:1.1,ki:1.1,speed:1.1})}),
 moai_kun:Object.freeze({id:'moai_kun',displayInBattle:true,name:'モアイくん',description:'おこていゆについてくる、身長20cmのモアイのおもちゃ。特別な思い入れがあります。受けるダメージが0.9倍、与えるダメージが1.1倍になります。戦闘では最初に受けるダメージを1回だけ、前に出て黄色い光をまとって吸収。1秒後に相手へ向かい、被ダメージ軽減前の30%の威力で反撃します。その後はおこていゆの後ろで見守ります。',multipliers:Object.freeze({damageReceived:.9,damageDealt:1.1})})
});
export const DEFENSE_ITEMS=Object.freeze({
 iron_shield:Object.freeze({id:'iron_shield',name:'鉄の盾',description:'重厚な鉄の盾。受けるダメージが0.75倍、速さが0.8倍になります。',multipliers:Object.freeze({damageReceived:.75,speed:.8})}),
 aura_shield:Object.freeze({id:'aura_shield',name:'オーラの盾',description:'ぼやけた白いモヤが守る盾。受けるダメージが0.9倍、与えるダメージが1.1倍になります。',multipliers:Object.freeze({damageReceived:.9,damageDealt:1.1})}),
 acrylic_shield:Object.freeze({id:'acrylic_shield',name:'アクリル盾',description:'透き通ったアクリルの盾。戦闘中、おこていゆの前に浮かび、受けるダメージを0.9倍にします。',multipliers:Object.freeze({damageReceived:.9,damageDealt:1})})
});
export function equipmentMultipliers(equipment={}){
 const items=[SUPPORT_ITEMS[equipment.support],DEFENSE_ITEMS[equipment.defense]].filter(Boolean);
 return Object.fromEntries(['damageReceived','damageDealt','hp','attack','ki','speed'].map(key=>[key,items.reduce((n,item)=>n*(item.multipliers[key]??1),1)]));
}
