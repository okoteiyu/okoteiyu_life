import {SUPPORT_ITEMS} from './equipment-rules.js';
import {techniqueDuration} from './technique-rules.js';

export const SUPPORT_COUNTER_TECHNIQUE='normal_attack';
// The delay and normal-attack length follow the game rules. Travel is an
// adjustable presentation value shared by the Core and its companion motion.
export const MOAI_COUNTER_TIMING=Object.freeze({delay:1,travel:.25,attack:techniqueDuration(SUPPORT_COUNTER_TECHNIQUE),return:.25});

/** Battle-only state: companions have no HP, target slot or action interval. */
export function createBattleSupport(id){
 const item=SUPPORT_ITEMS[id];if(!item)return null;
 return {id:item.id,name:item.name,guardUsed:false,phase:'idle',attackerId:null,
  guardStartedAt:null,guardActionEndsAt:null,absorbedAt:null,counterStartsAt:null,
  counterAttackStartsAt:null,counterEndsAt:null,returnStartedAt:null,returnEndsAt:null,
  rawDamage:0,reflectDamage:0,counterApplied:false,cancelReason:null};
}

export function supportNextEventTime(support){
 const time=support?.phase==='waiting'?support.counterStartsAt:support?.phase==='counter'?support.counterEndsAt:support?.phase==='returning'?support.returnEndsAt:Infinity;
 return Number.isFinite(time)?time:Infinity;
}
