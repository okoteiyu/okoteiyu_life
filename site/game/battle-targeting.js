import * as THREE from './vendor/three/three.module.js';

const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const displayed=node=>{for(let at=node;at;at=at.parent)if(!at.visible)return false;return true;};
const inside=(node,parent)=>{for(let at=node;at;at=at.parent)if(at===parent)return true;return false;};

/** Read the visible body, excluding its authored floor decoration. */
export function battleBodyMeshes(record){
 if(!record?.model)return [];
 if(record.targetBodyModel!==record.model){const meshes=[],effects=[record.fixedGround,...(record.appearance?.whiteAuraNodes||[]),...(record.appearance?.rayNodes||[]),...(record.appearance?.superNodes||[]).filter(node=>node.name.startsWith('Aura'))].filter(Boolean);record.model.traverse(node=>{if(node.isMesh&&!effects.some(root=>inside(node,root)))meshes.push(node);});record.targetBodyModel=record.model;record.targetBodyMeshes=meshes;}
 return record.targetBodyMeshes.filter(displayed);
}

export function projectBattleBody(record,camera,viewport){
 const meshes=battleBodyMeshes(record),bounds=new THREE.Box3(),scratch=new THREE.Box3();
 record?.model?.updateWorldMatrix(true,true);camera.updateMatrixWorld(true);
 for(const mesh of meshes){if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();if(mesh.geometry.boundingBox)bounds.union(scratch.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld));}
 if(bounds.isEmpty()||!viewport.width||!viewport.height)return null;
 const screen=new THREE.Box2();let inFront=false,depth=Infinity;
 for(const x of[bounds.min.x,bounds.max.x])for(const y of[bounds.min.y,bounds.max.y])for(const z of[bounds.min.z,bounds.max.z]){
  const point=new THREE.Vector3(x,y,z),view=point.clone().applyMatrix4(camera.matrixWorldInverse);if(view.z>=-camera.near)continue;
  const ndc=point.project(camera);if(ndc.z>=-1&&ndc.z<=1)inFront=true;depth=Math.min(depth,-view.z);screen.expandByPoint(new THREE.Vector2((ndc.x+1)*viewport.width/2,(1-ndc.y)*viewport.height/2));
 }
 if(!inFront||screen.isEmpty()||screen.max.x<0||screen.min.x>viewport.width||screen.max.y<0||screen.min.y>viewport.height)return null;
 const left=clamp(screen.min.x,0,viewport.width),right=clamp(screen.max.x,0,viewport.width),top=clamp(screen.min.y,0,viewport.height),bottom=clamp(screen.max.y,0,viewport.height);
 return {left,right,top,bottom,x:(left+right)/2,y:(top+bottom)/2,width:right-left,height:bottom-top,depth};
}

/** A generous minimum target for tiny, distant opponents; large bodies use ray hits. */
export function assistedBattleTarget(targets,x,y){
 const candidates=[];
 for(const target of targets){if(target.width>44||target.height>44)continue;const px=Math.max(4,(44-target.width)/2),py=Math.max(4,(44-target.height)/2);
  if(x<target.left-px||x>target.right+px||y<target.top-py||y>target.bottom+py)continue;
  candidates.push({target,distance:Math.hypot(x-target.x,y-target.y)});
 }
 candidates.sort((a,b)=>a.distance-b.distance||a.target.depth-b.target.depth);return candidates[0]?.target.id||null;
}

export function battleReticleRect(target,viewport,insets={}){
 if(!target||viewport.width<28||viewport.height<28)return null;
 const margin=Math.min(5,viewport.width/8,viewport.height/8),minimum=Math.min(28,viewport.height-margin*2),top=clamp(Number(insets.top)||margin,margin,viewport.height-margin-minimum),bottom=clamp(viewport.height-(Number(insets.bottom)||margin),top+minimum,viewport.height-margin),available=bottom-top;
 const width=Math.min(Math.max(38,target.width+12),Math.min(180,viewport.width-margin*2)),height=Math.min(Math.max(38,target.height+12),Math.min(170,available));
 const x=clamp(target.x,margin+width/2,viewport.width-margin-width/2),y=clamp(target.y,top+height/2,bottom-height/2);
 return {id:target.id,name:target.name,x,y,width,height,left:x-width/2,top:y-height/2};
}
