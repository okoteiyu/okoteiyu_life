import {SUPPORT_ITEMS,equippedSupportIds,supportItemLevel} from './equipment-rules.js';
import {techniqueDuration} from './technique-rules.js';

export const SUPPORT_COUNTER_TECHNIQUE='normal_attack';
// The delay and normal-attack length follow the game rules. Travel is an
// adjustable presentation value shared by the Core and its companion motion.
export const MOAI_COUNTER_TIMING=Object.freeze({delay:1,travel:.25,attack:techniqueDuration(SUPPORT_COUNTER_TECHNIQUE),return:.25});
export const SUPPORT_HEALING=Object.freeze({id:'green_moai',threshold:.5,fraction:.3});
const EPSILON=1e-10;

/** Battle-only state: companions have no HP, target slot or action interval. */
export function createBattleSupport(id,level=1){
 const item=SUPPORT_ITEMS[id];if(!item||item.tag!=='helper')return null;
 const state={id:item.id,name:item.name,level:supportItemLevel({supportLevels:{[id]:level}},id),guardUsed:false,phase:'idle',attackerId:null,
  guardStartedAt:null,guardActionEndsAt:null,absorbedAt:null,counterStartsAt:null,
  counterAttackStartsAt:null,counterEndsAt:null,returnStartedAt:null,returnEndsAt:null,
  rawDamage:0,reflectDamage:0,counterApplied:false,cancelReason:null};
 if(id===SUPPORT_HEALING.id)Object.assign(state,{healUsed:false,healedAt:null,healAmount:0});
 return state;
}

/** Only visible helpers get battle state; passive equipment keeps its multipliers. */
export function createBattleSupports(equipment,player={}){
 return equippedSupportIds(equipment).map(id=>createBattleSupport(id,supportItemLevel(player,id))).filter(Boolean);
}

/** The plural state is authoritative, including an intentionally empty list. */
export function battleSupportStates(battle){
 const source=Array.isArray(battle?.supports)?battle.supports:battle?.support?[battle.support]:[],seen=new Set();
 return source.filter(state=>{
  if(!state||SUPPORT_ITEMS[state.id]?.tag!=='helper'||seen.has(state.id))return false;
  seen.add(state.id);return true;
 });
}

/** Call after HP changes and before automatic-super checks; this never revives. */
export function applySupportHealing(battle){
 const player=battle?.player;
 if((battle?.phase??battle?.status)!=='active'||!player||!Number.isFinite(battle.time)||!Number.isFinite(player.hp)||!Number.isFinite(player.maxHp)||player.maxHp<=0||player.hp<=0)return [];
 const events=[];
 for(const state of battleSupportStates(battle)){
  if(state.id!==SUPPORT_HEALING.id||state.healUsed||player.hp/player.maxHp>SUPPORT_HEALING.threshold+EPSILON)continue;
  const previousHp=player.hp,hp=Math.min(player.maxHp,previousHp+player.maxHp*SUPPORT_HEALING.fraction),amount=hp-previousHp;
  if(!(amount>0))continue;
  player.hp=hp;state.healUsed=true;state.healedAt=battle.time;state.healAmount=amount;
  events.push({type:'support-heal',actor:'support',supportId:state.id,actorName:state.name,target:'player',previousHp,amount,hp,maxHp:player.maxHp,time:battle.time});
 }
 return events;
}

export function supportNextEventTime(support){
 if(Array.isArray(support))return Math.min(Infinity,...support.map(supportNextEventTime));
 const time=support?.phase==='waiting'?support.counterStartsAt:support?.phase==='counter'?support.counterEndsAt:support?.phase==='returning'?support.returnEndsAt:Infinity;
 return Number.isFinite(time)?time:Infinity;
}
