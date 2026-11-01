import * as THREE from './vendor/three/three.module.js';
import {loadAssetJson,loadGLTFAsset} from './asset-store.js';
import {MOAI_COUNTER_TIMING} from './support-rules.js';

const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const finite=(v,fallback=0)=>Number.isFinite(v)?v:fallback;
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};
const particleHash=index=>{let value=(index+1)>>>0;value=Math.imul(value^(value>>>16),0x21f0aaad);value=Math.imul(value^(value>>>15),0x735a2d97);return ((value^(value>>>15))>>>0)/4294967296;};
const point=record=>record?.anchor?.getWorldPosition(new THREE.Vector3())||new THREE.Vector3();
const towards=(from,to,fallback)=>{const d=to.clone().sub(from);d.y=0;return d.lengthSq()>1e-10?d.normalize():fallback.clone();};
const turnFacing=(from,to,progress)=>{const a=Math.atan2(from.x,from.z),b=Math.atan2(to.x,to.z),angle=a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*clamp(progress);return new THREE.Vector3(Math.sin(angle),0,Math.cos(angle));};
function returnAroundPlayer(from,to,center,side,forward,progress,radius){
 const a=from.clone().sub(center),b=to.clone().sub(center);a.y=b.y=0;const da=a.length(),db=b.length();
 const aa=Math.atan2(a.dot(side),a.dot(forward)),ab=Math.atan2(b.dot(side),b.dot(forward)),turn=Math.atan2(Math.sin(ab-aa),Math.cos(ab-aa));
 const first=Math.max(0,da-radius),arc=Math.abs(turn)*radius,last=Math.max(0,db-radius),travel=progress*(first+arc+last);let angle=aa,distance=da;
 if(travel<first)distance=da-travel;
 else if(travel<first+arc){distance=radius;angle=aa+turn*(travel-first)/Math.max(.001,arc);}
 else{distance=radius+Math.min(last,travel-first-arc);angle=ab;}
 const result=center.clone().addScaledVector(side,Math.sin(angle)*distance).addScaledVector(forward,Math.cos(angle)*distance);result.y=from.y+(to.y-from.y)*progress;return result;
}

/** A rigid, canonical-sized companion. All phases are derived from Core time. */
export function sampleSupportMotion(snapshot,actors,time,height=.2,guardOrigin=null){
 const support=snapshot?.support||{},player=actors?.player;
 if(!player)return null;
 const start=point(player),forward=new THREE.Vector3(0,0,1).applyQuaternion(player.facing?.getWorldQuaternion(new THREE.Quaternion())||new THREE.Quaternion());forward.y=0;forward.normalize();
 const side=new THREE.Vector3(1,0,0).applyQuaternion(player.facing?.getWorldQuaternion(new THREE.Quaternion())||new THREE.Quaternion());side.y=0;side.normalize();
 const beside=start.clone().addScaledVector(side,player.height*.82+height*.12).addScaledVector(forward,-player.height*.10);
 const behind=start.clone().addScaledVector(forward,-(player.height*.80+height*.45)).addScaledVector(side,player.height*.20);
 const idle=support.id==='moai_kun'&&support.guardUsed?behind:beside;
 const target=actors[support.attackerId],enemy=target?point(target):start.clone().addScaledVector(forward,1),direction=towards(start,enemy,forward);
 const guard=start.clone().addScaledVector(direction,player.height*.95+height*.40).addScaledVector(side,player.height*.25);guard.y=start.y;
 const bridge=guardOrigin?.isVector3?{position:guardOrigin}:guardOrigin;
 const guardFrom=bridge?.position?.clone?.()||idle.clone(),visualGuardStart=finite(bridge?.blendStartedAt,finite(support.guardStartedAt,time));
 const idleFacing=forward.clone().applyAxisAngle(new THREE.Vector3(0,1,0),-Math.PI*.5),profile=direction.clone().applyAxisAngle(new THREE.Vector3(0,1,0),Math.PI*.5);
 const guardFacingAt=at=>turnFacing(bridge?.facing||idleFacing,profile,smooth((at-visualGuardStart)/.18));
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
  if(phase==='guarding')position.copy(guardFrom).lerp(guard,smooth((time-visualGuardStart)/.18));
  else if(phase==='waiting')position.copy(guard);
  else if(phase==='counter'){
   position.copy(counterPosition(time));
   if(time>=attackStart&&time<counterEnd)attackElapsed=time-attackStart;
  }else if(phase==='returning'){
   const from=support.guardUsed?counterPosition(returnStart):guardFrom.clone().lerp(guard,smooth((returnStart-visualGuardStart)/.18));
   if(support.guardUsed&&returnStart>=counterStart&&returnStart<attackStart)from.y+=Math.sin(Math.PI*smooth((returnStart-counterStart)/Math.max(.001,attackStart-counterStart)))*height*.35;
   const progress=smooth((time-returnStart)/Math.max(.001,returnEnd-returnStart));
   position.copy(support.guardUsed?returnAroundPlayer(from,idle,start,side,forward,progress,player.height*.65+height*.35):from.lerp(idle,progress));
   if(time>=returnEnd)phase='idle';
  }
  const counterFacingAt=at=>turnFacing(profile,towards(counterPosition(at),enemy,forward),smooth((at-counterStart)/Math.max(.001,attackStart-counterStart)));
  if(phase==='guarding')facing=guardFacingAt(time);
  else if(phase==='waiting')facing=profile;
  else if(phase==='counter')facing=counterFacingAt(time);
  else if(phase==='returning')facing=turnFacing(support.guardUsed?counterFacingAt(returnStart):guardFacingAt(returnStart),idleFacing,smooth((time-returnStart)/Math.max(.001,returnEnd-returnStart)));
  else facing=idleFacing;
 }
 const flashAge=Number.isFinite(support.absorbedAt)?time-support.absorbedAt:Infinity;
 const travel=phase==='counter'&&time<attackStart?smooth((time-counterStart)/Math.max(.001,attackStart-counterStart)):phase==='returning'?smooth((time-returnStart)/Math.max(.001,returnEnd-returnStart)):null;
 const hop=travel===null?0:Math.sin(Math.PI*travel)*height*.35;
 position.y+=hop;
 return {position,facing,idle,beside,behind,guard,counter,phase,attackElapsed,flashAge,hop};
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
  const geometry=new THREE.BufferGeometry(),count=160;this.particleSeeds=Float64Array.from({length:count*4},(_,index)=>particleHash(index));geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(count*3),3));geometry.setAttribute('aAlpha',new THREE.BufferAttribute(new Float32Array(count),1));geometry.setAttribute('aSize',new THREE.BufferAttribute(new Float32Array(count),1));
  const material=new THREE.ShaderMaterial({uniforms:{viewportHeight:{value:390},pixelRatio:{value:1}},transparent:true,depthWrite:false,depthTest:true,blending:THREE.NormalBlending,toneMapped:false,
   vertexShader:'uniform float viewportHeight;uniform float pixelRatio;attribute float aAlpha;attribute float aSize;varying float vAlpha;void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(aSize*viewportHeight*pixelRatio*projectionMatrix[1][1]/(2.*max(.01,-p.z)),4.5*pixelRatio,16.*pixelRatio);vAlpha=aAlpha;}',
   fragmentShader:'varying float vAlpha;void main(){vec2 p=gl_PointCoord*2.-1.;float r=dot(p,p);float alpha=exp(-r*2.4)*vAlpha*(1.-smoothstep(.65,1.,r));if(alpha<.005)discard;gl_FragColor=vec4(1.,.80+.13*(1.-min(1.,r)),.025,alpha);\n#include <colorspace_fragment>\n}'});
  this.auraParticles=new THREE.Points(geometry,material);this.auraParticles.frustumCulled=false;this.auraParticles.name='Battle.Support.YellowAbsorptionAura';this.flash.add(this.auraParticles);this.particleCount=count;
  this.halo=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.ShaderMaterial({uniforms:{strength:{value:0}},transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,toneMapped:false,
   vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float strength;varying vec2 vUv;void main(){vec2 p=(vUv-.5)*2.;float a=exp(-dot(p,p)*3.5)*strength;gl_FragColor=vec4(1.,.81,.05,a);\n#include <colorspace_fragment>\n}'}));this.flash.add(this.halo);
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
  this.guardStartedAt=Number.isFinite(saved?.guardStartedAt)?saved.guardStartedAt:null;this.guardAttackerId=saved?.guardAttackerId??null;this.lastPosition=vector(saved?.position);this.lastFacing=vector(saved?.facing);this.cameraBlend=Number.isFinite(saved?.cameraBlend)?clamp(saved.cameraBlend):0;this.lastCameraTime=this.sampleTime;
  const origin=vector(saved?.guardBridge?.position);this.guardBridge=origin&&Number.isFinite(saved.guardBridge.startedAt)?{startedAt:saved.guardBridge.startedAt,attackerId:saved.guardBridge.attackerId??null,blendStartedAt:finite(saved.guardBridge.blendStartedAt,saved.guardBridge.startedAt),position:origin,facing:vector(saved.guardBridge.facing)}:null;
  for(const record of this.cache.values())record.anchor.visible=record.id===this.id;this.root.visible=false;
 }
 setVisible(visible){this.root.visible=Boolean(visible&&this.id&&this.cache.has(this.id));}
 sample(snapshot,actors,time,{enabled=true,camera}={}){
  const record=this.cache.get(this.id),equipped=snapshot?.player?.equipment?.support;
  if(!record||!enabled||equipped!==this.id||snapshot?.phase==='visiting'){this.root.visible=false;this.flash.visible=false;return;}
  this.root.visible=true;record.anchor.visible=true;this.sampleTime=finite(time)+this.clockOffset;this.logicalState=snapshot.support||null;
  const logical=this.logicalState;
  if(logical?.phase==='guarding'&&Number.isFinite(logical.guardStartedAt)&&(logical.guardStartedAt!==this.guardStartedAt||logical.attackerId!==this.guardAttackerId)){
   const position=this.state?.position||this.lastPosition,facing=this.state?.facing||this.lastFacing,newGuard=logical.guardStartedAt!==this.guardStartedAt;
   this.guardBridge=position?{startedAt:logical.guardStartedAt,attackerId:logical.attackerId,blendStartedAt:newGuard?logical.guardStartedAt:this.sampleTime,position:position.clone(),facing:facing?.clone()||null}:null;this.guardStartedAt=logical.guardStartedAt;this.guardAttackerId=logical.attackerId;
  }
  const origin=this.guardBridge&&this.guardBridge.startedAt===logical?.guardStartedAt&&this.guardBridge.attackerId===logical?.attackerId?this.guardBridge:null;
  const state=sampleSupportMotion(snapshot,actors,this.sampleTime,record.height,origin);if(!state){this.root.visible=false;return;}
  record.anchor.position.copy(state.position);record.facing.rotation.y=Math.atan2(state.facing.x,state.facing.z);record.motion.position.set(0,0,state.attackElapsed===null?0:record.height*.16*commonAttackOffset(state.attackElapsed));
  if(record.action){record.action.time=this.sampleTime%Math.max(.001,record.clip.duration);record.mixer.update(0);}
  const cameraTarget=this.id==='moai_kun'&&['guarding','waiting','counter'].includes(state.phase)?1:0,delta=Math.max(0,Math.min(.1,this.sampleTime-finite(this.lastCameraTime,this.sampleTime)));
  this.cameraBlend+=(cameraTarget-this.cameraBlend)*(1-Math.exp(-delta*7));this.lastCameraTime=this.sampleTime;
  this.state=state;this.phase=state.phase;
  this.shadow.position.set(state.position.x,point(actors.player).y+.002,state.position.z);this.shadow.scale.set(record.height*.82,record.height*.56,1);
  const absorbing=this.id==='moai_kun'&&['guarding','waiting'].includes(state.phase);this.flash.visible=absorbing;
  if(absorbing){
   const charging=state.phase==='guarding',age=this.sampleTime-finite(logical?.guardStartedAt,this.sampleTime),impact=state.flashAge>=0?Math.exp(-state.flashAge*5):0,intensity=(charging?.80:.95)+impact*.20;
   this.flash.position.copy(state.position);this.flash.scale.setScalar(1);this.flash.quaternion.identity();
   const pos=this.auraParticles.geometry.attributes.position,alpha=this.auraParticles.geometry.attributes.aAlpha,size=this.auraParticles.geometry.attributes.aSize;
   for(let i=0;i<this.particleCount;i++){const seed=i*4,life=(age*1.65+this.particleSeeds[seed])%1,angle=this.particleSeeds[seed+1]*Math.PI*2+age*.6,radius=record.height*(.62+.60*this.particleSeeds[seed+2])*(1-life*.3);pos.setXYZ(i,Math.cos(angle)*radius,record.height*(.05+life*3.3),Math.sin(angle)*radius);alpha.setX(i,Math.sin(life*Math.PI)*intensity*.82);size.setX(i,record.height*(.28+.34*this.particleSeeds[seed+3]));}
   pos.needsUpdate=true;alpha.needsUpdate=true;size.needsUpdate=true;
   this.halo.position.set(0,record.height*1.35,0);this.halo.scale.set(record.height*3.0,record.height*4.0,1);this.halo.material.uniforms.strength.value=.18*intensity;if(camera)this.halo.quaternion.copy(camera.getWorldQuaternion(new THREE.Quaternion()));
  }

 }
 interceptionPoint(snapshot,actorId){
  const s=snapshot?.support;if(!this.root.visible||this.id!=='moai_kun'||s?.phase!=='guarding'||s.guardUsed||s.attackerId!==actorId)return null;
  return this.state?.position.clone().add(new THREE.Vector3(0,this.cache.get(this.id).height*.5,0))||null;
 }
 setViewport(height,pixelRatio=1){this.auraParticles.material.uniforms.viewportHeight.value=Math.max(1,height);this.auraParticles.material.uniforms.pixelRatio.value=Math.max(1,pixelRatio);}
 framingBounds(){const record=this.cache.get(this.id);if(!this.root.visible||!record)return null;record.model.updateWorldMatrix(true,true);const bounds=new THREE.Box3().setFromObject(record.model);bounds.expandByScalar(record.height*.12);if(this.flash.visible){const origin=this.flash.getWorldPosition(new THREE.Vector3()),radius=record.height*1.6;bounds.union(new THREE.Box3(new THREE.Vector3(-radius,-record.height*.35,-radius).add(origin),new THREE.Vector3(radius,record.height*3.7,radius).add(origin)));}return bounds;}
 capturePresentationState(){return {id:this.id,time:this.sampleTime,cameraBlend:this.cameraBlend,guardStartedAt:this.guardStartedAt??null,guardAttackerId:this.guardAttackerId??null,position:(this.state?.position||this.lastPosition)?.toArray()||null,facing:(this.state?.facing||this.lastFacing)?.toArray()||null,guardBridge:this.guardBridge?{startedAt:this.guardBridge.startedAt,attackerId:this.guardBridge.attackerId,blendStartedAt:this.guardBridge.blendStartedAt,position:this.guardBridge.position.toArray(),facing:this.guardBridge.facing?.toArray()||null}:null};}
 getDiagnostics(){const record=this.cache.get(this.id),s=this.state,logical=this.logicalState||{};return {id:this.id,visible:this.root.visible,phase:this.phase||'idle',height:record?.height??null,position:record?.anchor.position.toArray()||null,currentClip:record?.clip?.name||null,sampleTime:this.sampleTime,attackElapsed:s?.attackElapsed??null,flashVisible:this.flash.visible,auraParticleCount:this.flash.visible?this.particleCount:0,auraColor:'yellow',cameraBlend:this.cameraBlend||0,groundY:this.state?.guard.y??null,hop:s?.hop||0,clockOffset:this.clockOffset,guardUsed:Boolean(logical.guardUsed),attackerId:logical.attackerId??null,absorbedAt:logical.absorbedAt??null,counterStartsAt:logical.counterStartsAt??null,counterAttackStartsAt:logical.counterAttackStartsAt??null,counterEndsAt:logical.counterEndsAt??null,returnEndsAt:logical.returnEndsAt??null,reflectDamage:logical.reflectDamage??0,guardBridge:this.guardBridge?{attackerId:this.guardBridge.attackerId,blendStartedAt:this.guardBridge.blendStartedAt}:null};}
 disposeTree(root){const geometry=new Set(),materials=new Set(),textures=new Set();root?.traverse(node=>{if(node.geometry)geometry.add(node.geometry);for(const material of Array.isArray(node.material)?node.material:node.material?[node.material]:[]){materials.add(material);for(const value of Object.values(material))if(value?.isTexture)textures.add(value);}});for(const value of geometry)value.dispose();for(const value of materials)value.dispose();for(const value of textures)value.dispose();}
 dispose(){if(this.destroyed)return;this.destroyed=true;for(const record of this.cache.values())record.mixer.stopAllAction();this.disposeTree(this.root);this.root.removeFromParent();this.cache.clear();this.id=null;}
}
