import * as THREE from './vendor/three/three.module.js';
import {loadAssetJson,loadGLTFAsset} from './asset-store.js';
import {MOAI_COUNTER_TIMING} from './support-rules.js';

const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const finite=(v,fallback=0)=>Number.isFinite(v)?v:fallback;
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};
const point=record=>record?.anchor?.getWorldPosition(new THREE.Vector3())||new THREE.Vector3();
const towards=(from,to,fallback)=>{const d=to.clone().sub(from);d.y=0;return d.lengthSq()>1e-10?d.normalize():fallback.clone();};

/** A rigid, canonical-sized companion. All phases are derived from Core time. */
export function sampleSupportMotion(snapshot,actors,time,height=.2,guardOrigin=null){
 const support=snapshot?.support||{},player=actors?.player;
 if(!player)return null;
 const start=point(player),forward=new THREE.Vector3(0,0,1).applyQuaternion(player.facing?.getWorldQuaternion(new THREE.Quaternion())||new THREE.Quaternion());forward.y=0;forward.normalize();
 const side=new THREE.Vector3(1,0,0).applyQuaternion(player.facing?.getWorldQuaternion(new THREE.Quaternion())||new THREE.Quaternion());side.y=0;side.normalize();
 const idle=start.clone().addScaledVector(side,player.height*.82+height*.12).addScaledVector(forward,-player.height*.10);
 const target=actors[support.attackerId],enemy=target?point(target):start.clone().addScaledVector(forward,1),direction=towards(start,enemy,forward);
 const guard=start.clone().addScaledVector(direction,player.height*.60+height*.28).addScaledVector(side,player.height*.85);guard.y+=Math.max(.025,player.height*.55-height*.5);
 const guardFrom=guardOrigin?.clone?.()||idle.clone();
 const desiredClearance=target?Math.max(target.height*.40,finite(target.forwardExtent))+height*.75:height;
 const clearance=Math.min(desiredClearance,Math.max(height*.75,start.distanceTo(enemy)-player.height*.65));
 const counter=enemy.clone().addScaledVector(direction,-clearance);counter.y=start.y;
 const attackStart=finite(support.counterAttackStartsAt,finite(support.counterAttackAt,Infinity));
 const counterStart=finite(support.counterStartsAt,Infinity),counterEnd=finite(support.counterEndsAt,Infinity);
 const returnEnd=finite(support.returnEndsAt,Infinity),returnStart=finite(support.returnStartedAt,returnEnd-MOAI_COUNTER_TIMING.return);
 const counterPosition=at=>{
  if(at<counterStart)return guard.clone();
  if(at<attackStart)return guard.clone().lerp(counter,smooth((at-counterStart)/Math.max(.001,attackStart-counterStart)));
  return counter.clone();
 };
 let phase=support.phase||'idle',position=idle.clone(),facing=forward.clone(),attackElapsed=null;
 if(support.id==='moai_kun'){
  if(phase==='guarding')position.copy(guardFrom).lerp(guard,smooth((time-finite(support.guardStartedAt,time))/.18));
  else if(phase==='waiting')position.copy(guard);
  else if(phase==='counter'){
   position.copy(counterPosition(time));
   if(time>=attackStart&&time<counterEnd)attackElapsed=time-attackStart;
  }else if(phase==='returning'){
   const from=support.guardUsed?counterPosition(returnStart):guardFrom.clone().lerp(guard,smooth((returnStart-finite(support.guardStartedAt,returnStart))/.18));
   position.copy(from).lerp(idle,smooth((time-returnStart)/Math.max(.001,returnEnd-returnStart)));
   if(time>=returnEnd)phase='idle';
  }
  if(phase!=='idle')facing=towards(position,enemy,forward);
 }
 const flashAge=Number.isFinite(support.absorbedAt)?time-support.absorbedAt:Infinity;
 return {position,facing,idle,guard,counter,phase,attackElapsed,flashAge};
}

function commonAttackOffset(elapsed){
 if(elapsed<0||elapsed>=.5)return 0;
 if(elapsed<.09)return smooth(elapsed/.09);
 if(elapsed<.31)return 1-smooth((elapsed-.09)/.22);
 return 0;
}

export class BattleSupportView{
 constructor({scene,loader,baseUrl=new URL('./assets/support3d/',import.meta.url)}={}){
  Object.assign(this,{scene,loader,baseUrl});this.cache=new Map();this.pending=new Map();this.id=null;this.destroyed=false;this.sampleTime=0;this.clockOffset=0;
  this.root=new THREE.Group();this.root.name='Battle.Support';this.root.visible=false;scene.add(this.root);
  this.flash=new THREE.Group();this.flash.name='Battle.Support.Absorb';this.flash.visible=false;this.root.add(this.flash);
  const sphere=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),new THREE.MeshBasicMaterial({color:0xfff4cc,transparent:true,opacity:0,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending}));
  const ring=new THREE.Mesh(new THREE.RingGeometry(.70,1,32),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending}));
  this.flash.add(sphere,ring);this.flashParts=[sphere,ring];
  this.shadow=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0x344137,transparent:true,opacity:.12,depthWrite:false}));this.shadow.rotation.x=-Math.PI/2;this.shadow.name='Battle.Support.Shadow';this.root.add(this.shadow);
 }
 async prepare(id){
  if(!id)return null;if(this.cache.has(id))return this.cache.get(id);if(this.pending.has(id))return this.pending.get(id);
  const promise=(async()=>{
   this.manifest??=await loadAssetJson(new URL('manifest.json',this.baseUrl));
   const definition=this.manifest.models.find(item=>item.id===id);if(!definition)throw new Error('サポートもちもののモデルがありません。');
   const url=new URL(definition.url,this.baseUrl);url.searchParams.set('v',definition.sha256);
   const gltf=await loadGLTFAsset(this.loader,url.href);if(this.destroyed){this.disposeTree(gltf.scene);throw new Error('サポート表示を終了しました。');}
   const anchor=new THREE.Group(),facing=new THREE.Group(),motion=new THREE.Group();anchor.name='Battle.Support.'+id;facing.name='Battle.Support.Facing.'+id;motion.name='Battle.Support.Attack.'+id;anchor.visible=false;anchor.add(facing);facing.add(motion);motion.add(gltf.scene);this.root.add(anchor);
   gltf.scene.traverse(node=>{if(node.isMesh){node.castShadow=false;node.receiveShadow=false;if(definition.softAlpha)for(const material of Array.isArray(node.material)?node.material:[node.material])if(material.transparent){material.depthWrite=false;material.side=THREE.DoubleSide;}}});
   const mixer=new THREE.AnimationMixer(gltf.scene),clip=gltf.animations.find(clip=>clip.name===(definition.clips?.idle||'Idle'))||gltf.animations[0],action=clip?mixer.clipAction(clip):null;
   if(action){action.play();action.setEffectiveTimeScale(0);}
   const record={id,definition,anchor,facing,motion,model:gltf.scene,mixer,clip,action,height:finite(definition.height,.2)};this.cache.set(id,record);return record;
  })();this.pending.set(id,promise);try{return await promise;}finally{this.pending.delete(id);}
 }
 activate(id,{baseTime=0,resumeTime,ended=false,resumeState=null}={}){
  this.id=id||null;this.clockOffset=ended&&Number.isFinite(resumeTime)?Math.max(0,resumeTime-baseTime):0;
  this.state=null;this.logicalState=null;this.phase='idle';this.sampleTime=baseTime+this.clockOffset;
  const vector=value=>Array.isArray(value)&&value.length===3&&value.every(Number.isFinite)?new THREE.Vector3(...value):null,saved=resumeState?.id===this.id?resumeState:null;
  this.guardStartedAt=Number.isFinite(saved?.guardStartedAt)?saved.guardStartedAt:null;this.lastPosition=vector(saved?.position);
  const origin=vector(saved?.guardBridge?.position);this.guardBridge=origin&&Number.isFinite(saved.guardBridge.startedAt)?{startedAt:saved.guardBridge.startedAt,position:origin}:null;
  for(const record of this.cache.values())record.anchor.visible=record.id===this.id;this.root.visible=false;
 }
 setVisible(visible){this.root.visible=Boolean(visible&&this.id&&this.cache.has(this.id));}
 sample(snapshot,actors,time,{enabled=true,camera}={}){
  const record=this.cache.get(this.id),equipped=snapshot?.player?.equipment?.support;
  if(!record||!enabled||equipped!==this.id||snapshot?.phase==='visiting'){this.root.visible=false;this.flash.visible=false;return;}
  this.root.visible=true;record.anchor.visible=true;this.sampleTime=finite(time)+this.clockOffset;this.logicalState=snapshot.support||null;
  const logical=this.logicalState;
  if(logical?.phase==='guarding'&&Number.isFinite(logical.guardStartedAt)&&logical.guardStartedAt!==this.guardStartedAt){
   const position=this.state?.position||this.lastPosition;this.guardBridge=position?{startedAt:logical.guardStartedAt,position:position.clone()}:null;this.guardStartedAt=logical.guardStartedAt;
  }
  const origin=this.guardBridge&&this.guardBridge.startedAt===logical?.guardStartedAt?this.guardBridge.position:null;
  const state=sampleSupportMotion(snapshot,actors,this.sampleTime,record.height,origin);if(!state){this.root.visible=false;return;}
  record.anchor.position.copy(state.position);record.facing.rotation.y=Math.atan2(state.facing.x,state.facing.z);record.motion.position.set(0,0,state.attackElapsed===null?0:record.height*.16*commonAttackOffset(state.attackElapsed));
  if(record.action){record.action.time=state.attackElapsed===null?this.sampleTime%Math.max(.001,record.clip.duration):0;record.mixer.update(0);}
  this.state=state;this.phase=state.phase;
  this.shadow.position.set(state.position.x,point(actors.player).y+.002,state.position.z);this.shadow.scale.set(record.height*.82,record.height*.56,1);
  const age=state.flashAge;this.flash.visible=this.id==='moai_kun'&&age>=0&&age<.38;
  if(this.flash.visible){
   const progress=age/.38,envelope=(1-progress)**1.5;this.flash.position.copy(state.guard).add(new THREE.Vector3(0,record.height*.5,0));this.flash.scale.setScalar(record.height*(.65+progress));
   if(camera)this.flash.quaternion.copy(camera.getWorldQuaternion(new THREE.Quaternion()));this.flashParts[0].material.opacity=.40*envelope;this.flashParts[1].material.opacity=.88*envelope;
  }
 }
 interceptionPoint(snapshot,actorId){
  const s=snapshot?.support;if(!this.root.visible||this.id!=='moai_kun'||s?.phase!=='guarding'||s.guardUsed||s.attackerId!==actorId)return null;
  return this.state?.position.clone().add(new THREE.Vector3(0,this.cache.get(this.id).height*.5,0))||null;
 }
 capturePresentationState(){return {id:this.id,time:this.sampleTime,guardStartedAt:this.guardStartedAt??null,position:(this.state?.position||this.lastPosition)?.toArray()||null,guardBridge:this.guardBridge?{startedAt:this.guardBridge.startedAt,position:this.guardBridge.position.toArray()}:null};}
 getDiagnostics(){const record=this.cache.get(this.id),s=this.state,logical=this.logicalState||{};return {id:this.id,visible:this.root.visible,phase:this.phase||'idle',height:record?.height??null,position:record?.anchor.position.toArray()||null,currentClip:record?.clip?.name||null,sampleTime:this.sampleTime,attackElapsed:s?.attackElapsed??null,flashVisible:this.flash.visible,clockOffset:this.clockOffset,guardUsed:Boolean(logical.guardUsed),attackerId:logical.attackerId??null,absorbedAt:logical.absorbedAt??null,counterStartsAt:logical.counterStartsAt??null,counterAttackStartsAt:logical.counterAttackStartsAt??null,counterEndsAt:logical.counterEndsAt??null,returnEndsAt:logical.returnEndsAt??null,reflectDamage:logical.reflectDamage??0};}
 disposeTree(root){const geometry=new Set(),materials=new Set(),textures=new Set();root?.traverse(node=>{if(node.geometry)geometry.add(node.geometry);for(const material of Array.isArray(node.material)?node.material:node.material?[node.material]:[]){materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);}});for(const value of geometry)value.dispose();for(const value of materials)value.dispose();for(const value of textures)value.dispose();}
 dispose(){if(this.destroyed)return;this.destroyed=true;for(const record of this.cache.values())record.mixer.stopAllAction();this.disposeTree(this.root);this.root.removeFromParent();this.cache.clear();this.id=null;}
}
