import {INTERIOR_LAYOUTS} from './interior-layouts.js';
const n=x=>Number(x.toFixed(5));
const escape=v=>String(v).replace(/[&"<>]/g,c=>({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'}[c]));
const rect=(x,y,w,h,fill,extra='')=>`<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="2" fill="${fill}" ${extra}/>`;
export function interiorMapPoint(id,position,{livingOnly=false,width,height}={}){
 const layout=INTERIOR_LAYOUTS[id];if(!layout)throw new RangeError('部屋の地図が見つかりません。');const bounds=livingOnly?layout.living.bounds:layout.room.bounds,size=livingOnly?layout.living.map:layout.map;
 return {x:(position[0]-bounds.min[0])/(bounds.max[0]-bounds.min[0])*(width||size.width),y:(position[2]-bounds.min[2])/(bounds.max[2]-bounds.min[2])*(height||size.height)};
}
function furniture(id,f,options){
 const [x,z,w,d]=f.footprint,p=interiorMapPoint(id,[x,0,z],options),q=interiorMapPoint(id,[x+w,0,z+d],options),ww=q.x-p.x,dd=q.y-p.y;
 const palette={loft:'#e3e6d8',stairs:'#dec9a4',bed:'#c2d3d5',bookcase:'#c7b28c',sofa:'#becfc7',desk:'#d8bf96',chair:'#afc5bc',rug:'#f7f5e9',plant:'#a8c995',fridge:'#c6d2cf',rack:'#c4b79d',tools:'#c3c6b0',crate:'#e1c598',cart:'#a4b4b0',planter:'#c2ce9b',nursery:'#c6d4b7',partition:'#a1b9ae',reactor:'#a3d8cf',console:'#bac8c2',pump:'#9aaba9',kitchen:'#d7c7a7',toilet:'#f7faf1',basin:'#f5faf2',bath:'#d8e9e5'};
 let detail='';
 if(f.role==='fridge')detail=`<path d="M${n(p.x+ww/2)} ${n(p.y+2)}V${n(q.y-2)}" stroke="#7d9690"/>`+rect(p.x+ww*.32,q.y-4,ww*.36,2,'#79aea3');
 if(f.role==='crate')detail=`<path d="M${n(p.x+ww/2)} ${n(p.y)}V${n(q.y)}" stroke="#f3e8c6" stroke-width="${n(ww*.09)}"/>`+rect(p.x+ww*.13,p.y+dd*.40,ww*.28,dd*.25,'#f8f4e8');
 if(f.role==='reactor'){const cx=(p.x+q.x)/2,cy=(p.y+q.y)/2,r=Math.min(ww,dd)*.32;detail=`<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="#82c6b9" stroke="#6d9690" stroke-width="1.8"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r*.58)}" fill="#b9e2d6"/><path d="M${n(cx+r)} ${n(cy)}H${n(q.x-2)}" stroke="#76958e" stroke-width="2"/>`;}
 if(f.role==='planter'||f.role==='nursery'||f.role==='plant')detail=Array.from({length:f.role==='plant'?3:6},(_,i)=>`<ellipse cx="${n(p.x+ww*(.25+(i%3)*.25))}" cy="${n(p.y+dd*(.32+Math.floor(i/3)*.36))}" rx="${n(Math.min(ww,dd)*.11)}" ry="${n(Math.min(ww,dd)*.18)}" fill="${i%2?'#739a5f':'#92b779'}"/>`).join('');
 if(f.role==='rack'||f.role==='bookcase'){const horizontal=ww>dd;detail=Array.from({length:Math.min(14,Math.ceil(Math.max(ww,dd)/7))},(_,i)=>horizontal?rect(p.x+2+i*(ww-4)/14,p.y+2,(ww-4)/14-1,dd-4,['#a3bca8','#d5c39f','#a5b6c1'][i%3]):rect(p.x+2,p.y+2+i*(dd-4)/14,ww-4,(dd-4)/14-1,['#a3bca8','#d5c39f','#a5b6c1'][i%3])).join('');}
 if(f.role==='stairs')detail=Array.from({length:4},(_,i)=>`<path d="M${n(p.x)} ${n(p.y+dd*(i+1)/5)}H${n(q.x)}" stroke="#b49b75"/>`).join('');
 if(f.role==='bed')detail=ww>dd?rect(f.yaw>0?p.x+3:q.x-ww*.22,p.y+3,ww*.17,dd-6,'#faf9f1'):rect(p.x+3,p.y+3,ww-6,dd*.17,'#faf9f1');
 if(f.role==='sofa')detail=rect(p.x+3,p.y+3,ww-6,dd*.20,'#91aaa1')+`<path d="M${n(p.x+ww/2)} ${n(p.y+dd*.3)}V${n(q.y-2)}" stroke="#94ada2"/>`;
 if(f.role==='tools')detail=`<path d="M${n(p.x+ww*.3)} ${n(p.y+dd*.2)}V${n(p.y+dd*.8)}M${n(p.x+ww*.6)} ${n(p.y+dd*.2)}V${n(p.y+dd*.8)}" stroke="#788d84" stroke-width="2"/>`;
 const line=f.role==='rug'?'#e2dfcd':'#a4aa91';
 return `<g data-interior-feature="${f.id}" data-model-node="${f.node}" data-world-footprint="${escape(JSON.stringify(f.footprint))}"><title>${escape(f.label)}</title>`+rect(p.x,p.y,ww,dd,palette[f.role]||'#d2dbc7',`stroke="${line}" stroke-width="1"`)+detail+'</g>';
}
function aperture(id,entry,options){
 const half=entry.width/2,side=entry.side,alongX=side==='north'||side==='south',a=[...entry.center],b=[...entry.center];a[alongX?0:2]-=half;b[alongX?0:2]+=half;const p=interiorMapPoint(id,a,options),q=interiorMapPoint(id,b,options);
 return `<path data-interior-door="${side}" data-world-width="${entry.width}" d="M${n(p.x)} ${n(p.y)}L${n(q.x)} ${n(q.y)}" stroke="#f7f2df" stroke-width="5"/><path d="M${n(p.x)} ${n(p.y)}L${n(q.x)} ${n(q.y)}" stroke="#8dad9d" stroke-width="1.4"/>`;
}
export function interiorMapDrawing(id,{livingOnly=false,width,height,current=false,selected=false}={}){
 const l=INTERIOR_LAYOUTS[id];if(!l)return'';const dimensions=livingOnly?l.living.map:l.map,W=width||dimensions.width,H=height||dimensions.height,o={livingOnly,width:W,height:H};
 let content=rect(0,0,W,H,id==='production-room'?'#edf0df':'#f3eedf','data-interior-floor="true"');
 if(l.zones)for(const zone of l.zones){const [x,z,w,d]=zone.bounds,a=interiorMapPoint(id,[x,0,z],o),b=interiorMapPoint(id,[x+w,0,z+d],o);content+=rect(a.x,a.y,b.x-a.x,b.y-a.y,zone.id==='planters'?'#e6ecd4':'#e0eeea')+`<text x="${n((a.x+b.x)/2)}" y="${n(a.y+19)}" text-anchor="middle" font-size="16" fill="#718572">${zone.label}</text>`;}
 const order=f=>f.role==='loft'?0:f.role==='rug'?1:2;
 content+=l.features.filter(f=>!livingOnly||f.area==='living').slice().sort((a,b)=>order(a)-order(b)).map(f=>furniture(id,f,o)).join('');
 content+=rect(0,0,W,H,'none',`data-interior-outer-wall="true" stroke="${selected?'#936843':'#a3b59e'}" stroke-width="${selected?4:2}"`);
 if(id==='player-room'){
  if(livingOnly)content+=aperture(id,l.entrance,o);
  else{
   const a=l.apartmentPlan,point=(x,z)=>interiorMapPoint(id,[(x-a.origin[0])*a.scale,0,(z-a.origin[1])*a.scale],o);
   const line=(x,z,xx,zz)=>{const p=point(x,z),q=point(xx,zz);return `<path d="M${n(p.x)} ${n(p.y)}L${n(q.x)} ${n(q.y)}" fill="none" stroke="#a9b49e" stroke-width="1.8"/>`;};
   for(const [x,z,w,d]of[a.living,a.toilet,a.washBath]){const p=point(x,z),q=point(x+w,z+d);content+=rect(p.x,p.y,q.x-p.x,q.y-p.y,'none','stroke="#adb6a0" stroke-width="1.8"');}
   for(const[x,z,w]of[a.livingDoor,a.apartmentDoor]){const p=point(x,z),q=point(x+w,z);content+=`<path d="M${n(p.x)} ${n(p.y)}H${n(q.x)}" stroke="#f3eedf" stroke-width="5"/>`+line(x,z,x+w,z);}
   for(const[x,z,d]of[a.toiletDoor,a.washDoor]){const p=point(x,z),q=point(x,z+d);content+=`<path d="M${n(p.x)} ${n(p.y)}V${n(q.y)}" stroke="#f3eedf" stroke-width="5"/>`+line(x,z,x-28,z)+`<path d="M${n(p.x)} ${n(q.y)}Q${n(p.x-28*a.scale/(l.room.width)*W)} ${n(q.y)} ${n(point(x-28,z).x)} ${n(p.y)}" fill="none" stroke="#a9b49e"/>`;}
   content+=line(169,224,203,224);
  }
  const a=interiorMapPoint(id,[2.448,0,.036],o),b=interiorMapPoint(id,[2.448,0,1.656],o);content+=`<path data-interior-window="right" d="M${n(a.x)} ${n(a.y)}L${n(b.x)} ${n(b.y)}" stroke="#97bdbc" stroke-width="3"/>`;
 }else for(const e of[l.entrance,...l.secondaryEntrances||[]])content+=aperture(id,e,o);
 if(current){const p=interiorMapPoint(id,l.entrance.heroStand,o);content+=`<g data-interior-current="true" transform="translate(${n(p.x)} ${n(p.y)})"><circle r="${id==='warehouse'?8:5}" fill="#fff7e9" stroke="#bb817a" stroke-width="2"/></g>`;}
 return `<g data-interior-plan="${id}" font-family="system-ui,sans-serif">${content}</g>`;
}
export function interiorMapSvg(id,{current=true}={}){const l=INTERIOR_LAYOUTS[id];return `<svg class="room-map" viewBox="-4 -4 ${l.map.width+8} ${l.map.height+8}" role="img" aria-label="${l.title}の地図。設備は3Dモデルと同じ配置。">${interiorMapDrawing(id,{current})}</svg>`;}
