import * as THREE from './vendor/three/three.module.js';
import {BattleView} from './battle-view.js';
import {loadAssetJson,loadGLTFAsset} from './asset-store.js';
import {equippedSupportIds} from './equipment-rules.js';
import {isModalBlocked} from './modal-layer.js';
import {INTERIOR_ROOMS} from './interior-rules.js';

const number=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
function visitingSnapshot(player={}){
 const support=equippedSupportIds(player.equipment||{}).includes('moai_kun')?['moai_kun']:[],helper=support.length?{id:'moai_kun',phase:'idle',guardUsed:false}:null,hp=Math.max(1,number(player.stats?.hp,1));
 return {phase:'visiting',time:0,enemies:[],targetId:null,super:{active:false},supports:helper?[helper]:[],support:helper,player:{...player,id:'player',speciesId:'okoteiyu',name:'おこていゆ',hp,maxHp:hp,action:null,superActive:false,auraId:null,equipment:{support,defense:null}}};
}

/** A visit-only room. Approved character assets provide idle presentation;
 * no battle, research, reward or home simulation is advanced here. */
export class AnalysisRoomView extends BattleView{
 constructor(options={}){super(options);this.roomDefinition=options.roomDefinition||INTERIOR_ROOMS['analysis-room'];}
 createRenderer(){
  super.createRenderer();if(this.entranceInputCanvas===this.canvas)return;
  this.entranceInputCanvas=this.canvas;this.lookPointers=new Set();this.canvas.tabIndex=0;
  const listen=(target,type,handler)=>{target.addEventListener(type,handler);this.listeners.push(()=>target.removeEventListener(type,handler));};
  listen(this.canvas,'pointerdown',event=>{
   if(!this.canLookAround()){this.cancelLookPointers();return;}
   if(event.pointerType==='mouse'&&event.button!==0)return;
   event.preventDefault();this.canvas.focus({preventScroll:true});this.lookPointers.add(event.pointerId);
   this.lookDrag=this.lookPointers.size===1?{id:event.pointerId,x:event.clientX,y:event.clientY}:null;
   try{this.canvas.setPointerCapture(event.pointerId);}catch{}
  });
  listen(this.canvas,'pointermove',event=>{
   if(!this.lookPointers.has(event.pointerId))return;
   if(!this.canLookAround()){this.cancelLookPointers();return;}
   event.preventDefault();if(!this.lookDrag||this.lookDrag.id!==event.pointerId)return;
   const box=this.canvas.getBoundingClientRect(),previous=this.lookDrag;
   this.rotateEntrance((event.clientX-previous.x)/Math.max(100,box.width)*Math.PI,-(event.clientY-previous.y)/Math.max(100,box.height)*Math.PI);
   this.lookDrag={id:event.pointerId,x:event.clientX,y:event.clientY};
  });
  const release=event=>{this.lookPointers.delete(event.pointerId);this.lookDrag=null;try{this.canvas.releasePointerCapture(event.pointerId);}catch{}};
  listen(this.canvas,'pointerup',release);listen(this.canvas,'pointercancel',release);
  listen(this.canvas,'lostpointercapture',event=>{this.lookPointers.delete(event.pointerId);this.lookDrag=null;});
  listen(this.canvas,'keydown',event=>{
   const step=Math.PI/24,change={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,step],ArrowDown:[0,-step]}[event.key];
   if(change&&this.rotateEntrance(...change))event.preventDefault();
  });
  listen(this.canvas,'webglcontextlost',()=>this.cancelLookPointers());
  listen(this.canvas,'blur',()=>this.cancelLookPointers());
  listen(document,'visibilitychange',()=>this.cancelLookPointers());
  listen(window,'blur',()=>this.cancelLookPointers());
 }
 cancelLookPointers(){
  const pointers=[...(this.lookPointers||[])];this.lookPointers?.clear();this.lookDrag=null;
  for(const id of pointers)try{this.canvas?.releasePointerCapture(id);}catch{}
 }
 canLookAround(){return this.cameraMode==='entrance'&&this.ready&&this.active&&!this.loading&&!this.contextLost&&!this.destroyed&&!this.isPresentationPaused?.()&&!document.hidden&&!isModalBlocked();}
 rotateEntrance(yaw,pitch){
  if(!this.canLookAround()||!Number.isFinite(yaw)||!Number.isFinite(pitch))return false;
  this.entranceLook.yaw=clamp(this.entranceLook.yaw+yaw,-Math.PI*.49,Math.PI*.49);
  this.entranceLook.pitch=clamp(this.entranceLook.pitch+pitch,-.5,.7);
  this.fitCamera();this.render();return true;
 }
 setActive(active){if(!active)this.cancelLookPointers();super.setActive(active);}
 destroy(){this.cancelLookPointers();super.destroy();}
 async load(snapshot,stage={},{presentationState}={}){
  this.cancelLookPointers();const room=this.roomDefinition,saved=presentationState?.roomId&&presentationState.roomId!==room.id?null:presentationState?.analysisRoom;
  this.entranceLook={yaw:clamp(number(saved?.entranceLook?.yaw),-Math.PI*.49,Math.PI*.49),pitch:clamp(number(saved?.entranceLook?.pitch,-.06),-.5,.7)};
  const generation=this.fieldGeneration=(this.fieldGeneration||0)+1;this.loading=true;this.ready=false;this.lastError=null;this.snapshot=snapshot;this.stageOptions={...stage,presentation:room.id};this.time=number(snapshot.time);this.cutin=null;this.presentationId=stage.presentationId??null;this.cameraMode='entrance';this.supportView.setVisible(false);if(this.canvas)this.canvas.style.visibility='hidden';this.onStatus(room.title+'を準備しています…');
  try{
   this.createRenderer();
   const assetBase=new URL('./assets/'+room.assetDirectory+'/',import.meta.url);
   const [manifest,metadata]=await Promise.all([this.manifest?Promise.resolve(this.manifest):loadAssetJson(new URL('manifest.json',this.baseUrl)),loadAssetJson(new URL('metadata.json',assetBase))]);this.manifest=manifest;
   const definition=metadata.model;if(!definition?.url)throw new Error(room.title+'のモデル設定が見つかりません。');
   const modelUrl=new URL(definition.url,assetBase);if(definition.sha256)modelUrl.searchParams.set('v',definition.sha256);
   const [gltf,player]=await Promise.all([loadGLTFAsset(this.loader,modelUrl.href),this.loadActor('okoteiyu','player'),this.supportView.prepare(snapshot.player.equipment.support)]);
   if(this.destroyed||generation!==this.fieldGeneration){this.disposeObject(gltf.scene);return false;}
   for(const actor of this.actorCache.values())actor.anchor.visible=false;
   this.clearStage();this.metadata=metadata;this.fieldScene=gltf.scene;this.fieldScene.name=room.id+'.Environment';this.stage.add(this.fieldScene);
   this.applyRoomView();
   this.actors={player};player.anchor.visible=true;player.anchor.position.fromArray(metadata.entrance?.heroStand||metadata.entry?.position||[0,0,1.82]);player.facing.rotation.y=number(metadata.entrance?.heroYaw??metadata.entry?.yaw,Math.PI);player.hitAt=player.superAt=-Infinity;player.hitRoot.position.set(0,0,0);player.fatigueRoot.position.set(0,0,0);player.attackRoot.position.set(0,0,0);player.mixer.stopAllAction();for(const shield of player.shields?.values()||[])shield.visible=false;
   this.supportView.activate(snapshot.player.equipment.support,{baseTime:this.time});this.scene.background=new THREE.Color(metadata.background||'#e8efed');this.scene.fog=null;
   this.hemi.intensity=number(metadata.lighting?.ambient,2.1);this.sun.intensity=number(metadata.lighting?.sun,2.3);this.sun.position.set(-3,6,4);
   this.loading=false;this.ready=true;this.updatePose();this.resize();this.render();this.onStatus('');return true;
  }catch(error){if(this.destroyed||generation!==this.fieldGeneration)return false;this.loading=false;this.ready=false;this.lastError=error?.message||String(error);this.onStatus('');this.onError(error);return false;}
 }
 capturePresentationState(){return {version:1,presentationId:this.presentationId,roomId:this.roomDefinition.id,analysisRoom:{cameraMode:'entrance',entranceLook:{...this.entranceLook}}};}
 applyRoomView(){
  if(!this.fieldScene||!this.metadata)return;
  // Keep the closed room visible, including shells used by authoring previews.
  const shells=[...(this.metadata.hideFromEntranceCamera||[]),...(this.metadata.reverseCamera?.hideNodes||[])];
  for(const name of new Set(shells)){const node=this.fieldScene.getObjectByName(name)||this.fieldScene.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(name));if(node)node.visible=true;}
 }
 targetSelectionAvailable(){return false;}
 canOrbitCamera(){return false;}
 fitCamera(){
  if(!this.ready||!this.metadata||!this.width||!this.height)return;
  const camera=this.metadata.camera||{},center=this.metadata.entrance?.center||[0,0,2.2],authored=this.metadata.entrance?.camera,{pitch}=this.entranceLook,yaw=this.entranceLook.yaw+number(authored?.yaw);
  if(authored?.position)this.camera.position.fromArray(authored.position);else this.camera.position.set(center[0],center[1]+Math.min(1.35,number(this.metadata.entrance?.height,2.45)*.6),center[2]-.16);
  this.cameraAim=this.camera.position.clone().add(new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)).multiplyScalar(4));
  this.camera.lookAt(this.cameraAim);this.camera.clearViewOffset();this.camera.zoom=1;this.camera.fov=72;this.camera.near=number(camera.near,.03);this.camera.far=number(camera.far,80);this.camera.aspect=this.width/this.height;this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld(true);
 }
 updatePose(){
  if(!this.ready||!this.snapshot)return;this.sampleActor(this.actors.player,this.snapshot.player,'player');this.supportView.sample({...this.snapshot,phase:this.roomDefinition.id},this.actors,this.time,{enabled:this.active,camera:this.camera});this.scene.updateMatrixWorld(true);
 }
 advance(dt){if(!this.ready||!this.active||this.contextLost||this.loading||this.destroyed||this.isPresentationPaused?.()||document.hidden||isModalBlocked())return;this.time+=Math.max(0,number(dt));this.snapshot.time=this.time;this.updatePose();this.render();}
 render(){if(!this.ready||!this.active||this.contextLost||this.destroyed||!this.renderer)return;this.renderer.render(this.scene,this.camera);this.canvas.dataset.presentation=this.roomDefinition.id;this.canvas.dataset.cameraMode=this.cameraMode;this.canvas.setAttribute('aria-label',this.roomDefinition.title+'の3Dビュー。入口に視点を固定し、スワイプ・ドラッグ・方向キーで見回せます。');this.canvas.style.visibility='visible';this.renderFrames++;}
 getDiagnostics(){return {roomId:this.roomDefinition.id,ready:this.ready,loading:this.loading,active:this.active,contextLost:this.contextLost,error:this.lastError,renderFrames:this.renderFrames,time:this.time,cameraMode:this.cameraMode||'entrance',entranceLook:{...this.entranceLook},metadata:this.metadata||null,size:{width:this.width||0,height:this.height||0},camera:{position:this.camera.position.toArray(),target:this.cameraAim?.toArray()||null,fov:this.camera.fov},player:this.actors.player?{position:this.actors.player.anchor.position.toArray(),height:this.actors.player.height,currentClip:this.actors.player.currentClip}:null,support:this.supportView.getDiagnostics()};}
}

export class AnalysisRoomUI{
 constructor({view,homeElement,roomId='analysis-room',readPlayer=()=>({}),isPaused=()=>false,onMap=()=>false,onReturn=()=>false,onError=()=>{}}={}){
  this.roomDefinition=INTERIOR_ROOMS[roomId];if(!this.roomDefinition)throw new RangeError('見学する部屋が見つかりません。');Object.assign(this,{view,homeElement,readPlayer,isPaused,onMap,onReturn,onError});this.active=false;this.loading=false;this.failed=false;this.generation=0;
  this.container=document.createElement('div');this.container.id=roomId==='analysis-room'?'analysisRoomScene':'interiorRoomScene';this.container.className='analysis-room-scene';
  this.status=document.createElement('div');this.status.className='analysis-room-status';this.status.setAttribute('role','status');this.status.hidden=true;this.status.innerHTML='<span></span><button type="button" hidden>もう一度読み込む</button>';this.container.append(this.status);this.status.querySelector('button').addEventListener('click',()=>{if(!this.isPaused()&&!isModalBlocked())this.show();});
  this.badge=document.createElement('div');this.badge.className='analysis-room-badge';this.badge.hidden=true;this.badge.innerHTML='<span></span><strong></strong>';view.element.append(this.badge);
  this.panel=document.createElement('section');this.panel.id=roomId==='analysis-room'?'analysisRoomChoices':'interiorRoomChoices';this.panel.className='lower-right analysis-room-actions';this.panel.hidden=true;this.panel.setAttribute('aria-label','珍生物分析室での移動');this.panel.innerHTML='<nav aria-label="珍生物分析室の選択肢"><button type="button" data-analysis-map><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2ZM9 3v16M15 5v16"/></svg><span>建物マップを開く</span><b aria-hidden="true">›</b></button><button type="button" data-analysis-home><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8M6 9v12h12V9M10 21v-7h4v7"/></svg><span>おこていゆハウスへ戻る</span><b aria-hidden="true">›</b></button></nav>';homeElement.after(this.panel);this.mapButton=this.panel.querySelector('[data-analysis-map]');this.returnButton=this.panel.querySelector('[data-analysis-home]');this.mapButton.addEventListener('click',()=>{if(!this.blocked())this.onMap(this.mapButton);});this.returnButton.addEventListener('click',()=>{if(this.active&&!this.isPaused()&&!isModalBlocked())this.onReturn(this.returnButton);});
 }
 get ready(){return Boolean(this.active&&this.controller?.ready&&!this.controller.contextLost&&!this.loading&&!this.failed);}
 blocked(){return !this.ready||this.isPaused()||isModalBlocked()||document.hidden;}
 async show(roomId=this.roomDefinition.id){
  const definition=INTERIOR_ROOMS[roomId];if(!definition)return false;this.roomDefinition=definition;this.badge.querySelector('span').textContent=definition.floorLabel;this.badge.querySelector('strong').textContent=definition.title;this.panel.setAttribute('aria-label',definition.title+'での移動');this.panel.querySelector('nav').setAttribute('aria-label',definition.title+'の選択肢');
  this.view.clear();this.active=true;this.loading=true;this.failed=false;const generation=++this.generation;this.snapshot=visitingSnapshot(this.readPlayer());this.container.classList.add('is-loading');this.view.surface.append(this.container);this.homeElement.hidden=true;this.panel.hidden=false;this.badge.hidden=true;this.status.hidden=false;this.status.querySelector('span').textContent=this.roomDefinition.title+'を準備しています…';this.status.querySelector('button').hidden=true;this.updateControls();
  this.controller??=new AnalysisRoomView({container:this.container,roomDefinition:this.roomDefinition,isPresentationPaused:()=>this.isPaused(),onStatus:text=>{if(this.active){this.status.querySelector('span').textContent=text?this.roomDefinition.title+'を準備しています…':'';this.status.hidden=!text;}},onError:error=>{if(this.active)this.showError(error);}});
  this.controller.roomDefinition=this.roomDefinition;const ready=await this.controller.load(this.snapshot,{presentation:this.roomDefinition.id});if(!this.active||generation!==this.generation)return false;this.loading=false;this.failed=!ready;if(ready){this.controller.setActive(true);this.container.classList.remove('is-loading');this.status.hidden=true;}this.updateControls();return ready;
 }
 updateControls(){this.panel.hidden=!this.active;this.badge.hidden=!this.ready;if(this.blocked())this.controller?.cancelLookPointers();this.mapButton.disabled=!this.ready||document.hidden;this.mapButton.setAttribute('aria-disabled',String(this.blocked()));this.returnButton.disabled=!this.active||document.hidden;this.returnButton.setAttribute('aria-disabled',String(!this.active||this.isPaused()||isModalBlocked()));}
 advance(dt){if(!this.active)return;this.updateControls();if(!this.blocked())this.controller.advance(dt);}
 async recoverAfterInterruption(){
  if(!this.active||!this.controller)return false;const generation=this.generation;this.loading=true;this.container.classList.add('is-loading');this.status.hidden=false;this.status.querySelector('span').textContent=this.roomDefinition.title+'の表示を復旧しています…';this.updateControls();const ready=await this.controller.recoverAfterInterruption(this.snapshot,{presentation:this.roomDefinition.id});if(!this.active||generation!==this.generation)return false;this.loading=false;this.failed=!ready;if(ready){this.controller.setActive(true);this.container.classList.remove('is-loading');this.status.hidden=true;}this.updateControls();return ready;
 }
 showError(error){this.loading=false;this.failed=true;this.status.hidden=false;this.status.querySelector('span').textContent=this.roomDefinition.title+'を表示できませんでした。通信環境を確認して、もう一度お試しください。';this.status.querySelector('button').hidden=false;this.badge.hidden=true;this.updateControls();this.onError(error);}
 deactivate(){this.active=false;this.generation++;this.controller?.setActive(false);this.controller?.cancelPendingLoad();this.loading=false;this.panel.hidden=true;this.badge.hidden=true;this.status.hidden=true;this.container.remove();}
 getDiagnostics(){return {active:this.active,ready:this.ready,loading:this.loading,failed:this.failed,generation:this.generation,view:this.controller?.getDiagnostics()||null};}
 destroy(){this.deactivate();this.controller?.destroy();this.panel.remove();this.badge.remove();this.container.replaceChildren();}
}

// Additional interiors share one UI/controller to bound WebGL contexts.
export {AnalysisRoomUI as InteriorRoomUI};
