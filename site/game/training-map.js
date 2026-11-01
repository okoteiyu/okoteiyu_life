import {interiorMapDrawing} from './interior-map.js';
// +Z points toward the right-hand entrance; +X is up on the floor plan.
// Looking into the hall from that entrance, camera-left (-X) is map-down.
// The rest room and management room share their authored 3D layouts.
const SCALE=28.8,ORIGIN={x:70,y:220},WORLD={minX:-5.36,minZ:-28.12,maxX:5.36,maxZ:3.46};
export const BASEMENT_MAP_VIEWBOX='-240 55 1860 685';
export const BASEMENT_COMPACT_VIEWBOX='-240 160 1860 580';
export const TRAINING_MAP_VIEWBOX=BASEMENT_MAP_VIEWBOX;
export function trainingMapPoint(position){return {x:ORIGIN.x+(position[2]-WORLD.minZ)*SCALE,y:ORIGIN.y+(WORLD.maxX-position[0])*SCALE};}
const rect=(x,y,w,h,fill,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${fill}" ${extra}/>`;
const text=(x,y,value,size=34,extra='')=>`<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" fill="#645b49" ${extra}>${value}</text>`;
function worldRect(x,z,width,depth,fill,extra=''){
 const p=trainingMapPoint([x+width/2,0,z-depth/2]);return rect(p.x,p.y,depth*SCALE,width*SCALE,fill,extra);
}
function feature(id,position,body){const p=trainingMapPoint(position);return `<g data-training-feature="${id}" data-world-x="${position[0]}" data-world-z="${position[2]}" transform="translate(${p.x} ${p.y})">${body}</g>`;}
function equipmentLabel(compact,x,y,label){return compact?'':text(x,y,label,32);}

/** Shared schematic floor extension; existing room and lift coordinates stay fixed. */
export function basementFloorDrawing(){
 return rect(-215,160,1805,570,'#edf0e0','stroke="#b2bc9e" stroke-width="4"');
}

/** Map-only shared facilities beside the ordinary passenger lift, on both floors. */
export function basementWashroomDrawing({selected=null,compact=false}={}){
 const wall='stroke="#a9bbb2" stroke-width="3" fill="none" stroke-linejoin="round"',door='stroke="#9dad9c" stroke-width="2" fill="none"';
 const wc=(x)=>rect(x,246,34,17,'#fbfcf7','stroke="#adbbb4" stroke-width="2"')+
  `<ellipse cx="${x+17}" cy="282" rx="17" ry="21" fill="#fbfcf7" stroke="#adbbb4" stroke-width="2"/><ellipse cx="${x+17}" cy="282" rx="9" ry="12" fill="#deebe6"/>`;
 const basin=(x)=>rect(x,355,58,26,'#fbfcf7','stroke="#adbbb4" stroke-width="2"')+
  `<ellipse cx="${x+29}" cy="369" rx="19" ry="8" fill="#deebe6"/><path d="M${x+29} 355v8" stroke="#90a5a0" stroke-width="2"/>`;
 let drawing='<g data-basement-facilities="washrooms">'+
  '<path data-basement-access="washrooms" d="M1006 374V480H1206V448H1230" fill="none" stroke="#e2d9c4" stroke-width="32" stroke-linejoin="round"/>'+
  rect(1230,190,340,505,'#f4f2e7','data-building-zone="washrooms" data-basement-wet-zone="true"')+
  rect(1232,192,86,501,'#f8f5e9','data-basement-wet-hall="true"')+
  rect(1320,190,250,200,'#e7efea','data-basement-wet-room="toilet"')+
  rect(1320,390,250,160,'#f0e7d5','data-basement-wet-room="changing"')+
  rect(1320,550,250,145,'#deece9','data-basement-wet-room="shower"')+
  `<path data-basement-wet-wall="outer" d="M1230 426V190H1570V695H1230V470" fill="none" stroke="${selected==='washrooms'?'#936843':'#a9bbb2'}" stroke-width="${selected==='washrooms'?5:3}" stroke-linejoin="round"/>`+
  `<path data-basement-wet-wall="partition" d="M1320 190V315M1320 355V452M1320 492V695M1320 390H1570M1320 550H1438M1478 550H1570" ${wall}/>`+
  '<path data-basement-wet-door="entry" d="M1230 426h44M1230 470a44 44 0 0 0 44-44" '+door+'/>'+
  '<path data-basement-wet-door="toilet" d="M1320 315h40M1320 355a40 40 0 0 0 40-40" '+door+'/>'+
  '<path data-basement-wet-door="changing" d="M1320 452h40M1320 492a40 40 0 0 0 40-40" '+door+'/>'+
  '<path data-basement-wet-door="shower" d="M1438 550h40m-40 5h20" '+door+'/>'+
  text(1445,225,'トイレ',compact?28:30)+
  '<path d="M1334 236V315H1364M1404 315H1430V236M1446 236V315H1476M1516 315H1556V236" '+wall+'/>'+
  wc(1366)+wc(1482)+basin(1352)+basin(1474)+
  text(1445,423,'脱衣所',compact?28:30)+
  rect(1530,436,24,96,'#d2d9cd','data-basement-wet-fixture="lockers" stroke="#a9b7a3" stroke-width="2"')+
  '<path d="M1530 468h24m-24 32h24m-7-52v8m0 24v8m0 24v8" stroke="#a3b29d" stroke-width="2"/>'+
  rect(1340,510,80,23,'#d7c3a1','data-basement-wet-fixture="bench" stroke="#b3a181" stroke-width="2"')+
  text(1445,582,'シャワー',compact?26:28)+
  '<path d="M1445 594V695" stroke="#a3bbb6" stroke-width="3" stroke-dasharray="7 4"/>';
 for(const x of [1383,1507])drawing+=`<g data-basement-wet-fixture="shower"><path d="M${x-17} 609h17v12m-12 1h24" fill="none" stroke="#8aa7a0" stroke-width="3"/><path d="M${x-8} 629l-4 25m12-25v25m8-25 4 25" fill="none" stroke="#9fbfba" stroke-width="2" stroke-dasharray="4 4"/><circle cx="${x}" cy="674" r="6" fill="#b4c8c0" stroke="#8ea99f" stroke-width="2"/></g>`;
 return drawing+'</g>';
}

/** Both basement floors share the same stairwell and elevator shaft. */
export function basementCoreDrawing({selected=null,compact=false}={}){
 return rect(1034,299,136,151,'#d4dfd0',`data-building-zone="core" stroke="${selected==='core'?'#936843':'#a7b59c'}" stroke-width="${selected==='core'?5:2}"`)+
  '<g data-training-feature="stairs" stroke="#9e8a69" stroke-width="3">'+Array.from({length:6},(_,i)=>`<path d="M1053 ${320+i*10}h41"/>`).join('')+'</g>'+rect(1110,317,40,58,'#f5f7ed','data-basement-feature="elevator" stroke="#a7b59c" stroke-width="2"')+text(1130,355,'EV',22)+text(1102,compact?421:413,'階段・EV',compact?32:28);
}

/** The outdoor freight shaft is separate from the ordinary passenger core. */
export function basementFreightDrawing({selected=null,compact=false}={}){
 return rect(-190,264,200,220,'#dce4d9',`data-building-zone="freight" stroke="${selected==='freight'?'#936843':'#9faa98'}" stroke-width="${selected==='freight'?5:2}"`)+
  text(-90,314,compact?'搬入EV':'大型EV',compact?34:36)+
  rect(-155,335,130,84,'#f4f4e8','data-basement-feature="freight-elevator" stroke="#a2af9d" stroke-width="3"')+
  '<path d="M-90 337v80m-47-55h94m-94 28h94" fill="none" stroke="#bdc6b5" stroke-width="2"/>'+
  text(-90,460,'屋外搬入口へ',24);
}

/** One floor drawing shared by the building dialog and the compact area map. */
export function trainingMapDrawing({selected=null,compact=false,current=false}={}){
 const far=trainingMapPoint([WORLD.maxX,0,WORLD.minZ]),near=trainingMapPoint([WORLD.minX,0,WORLD.maxZ]),width=near.x-far.x,height=near.y-far.y;
 const zone=(id,x,y,w,h,fill,extra='')=>rect(x,y,w,h,fill,`data-building-zone="${id}" ${extra}`);
 let drawing=basementFloorDrawing()+
  '<path data-training-access="freight" d="M10 374H82" fill="none" stroke="#e2d9c4" stroke-width="150"/>'+
  '<path data-training-access="core" d="M975 374H1102M1006 374V639H900" fill="none" stroke="#e2d9c4" stroke-width="44" stroke-linejoin="round"/>'+
  '<path data-training-access="guest-lounge" d="M1006 639V711H628V628H605" fill="none" stroke="#e2d9c4" stroke-width="32" stroke-linejoin="round"/>'+
  '<path data-training-access="guest-freight" d="M-90 484V580H70" fill="none" stroke="#e2d9c4" stroke-width="32" stroke-linejoin="round"/>'+
  zone('training',far.x,far.y,width,height,'#ece8dd','data-map-marker-x="500" data-map-marker-y="95" data-map-marker-unit="1.6"')+
  worldRect(0,-12.1,6.92,24.5,'#bacbbb','data-training-feature="mat" stroke="#879d8c" stroke-width="3"')+
  worldRect(0,-12.1,6.69,24.1,'none','stroke="#f5f3df" stroke-width="3"')+
  '<g stroke="#d1ddca" stroke-width="1.4" opacity=".65">'+Array.from({length:15},(_,i)=>{const p=trainingMapPoint([3.35,0,-1.52-i*1.51]);return `<path d="M${p.x} ${p.y}v${6.7*SCALE}"/>`;}).join('')+'</g>'+
  feature('arena-centre',[0,0,-12.1],'<circle r="28" fill="none" stroke="#f7f7e8" stroke-width="3"/><circle r="4" fill="#b5a27d"/>');
 // Dashed overhead fixtures remain distinct from devices standing on the floor.
 for(const [index,x]of[-3.85,3.85].entries()){
  const a=trainingMapPoint([x,0,-26.9]),b=trainingMapPoint([x,0,.5]);
  drawing+=`<path data-training-feature="ceiling-rail-${index}" d="M${a.x} ${a.y}H${b.x}" fill="none" stroke="#9eac9c" stroke-width="2" stroke-dasharray="8 8"/>`;
 }
 for(const [index,x]of[-2.7,-.9,.9,2.7].entries())drawing+=feature('overhead-light-'+index,[x,5.36,-9.28],rect(-18,-8,36,16,'#fff9d5','stroke="#b7a979" stroke-width="2" stroke-dasharray="4 3"'));
 for(const [id,x]of[['left',-4.2],['right',4.2]])drawing+=feature('wind-'+id,[x,1.65,-5.35],'<circle r="18" fill="#eef0e5" stroke="#778d84" stroke-width="3"/><path d="M-11-5Q0-14 3-2Q15-1 7 8Q-4 17-4 3Q-17 4-11-5Z" fill="#91a9a1"/><circle r="3" fill="#617c72"/>');
 for(const [id,x]of[['left',-4.15],['right',4.15]])drawing+=feature('light-'+id,[x,3.6,-10.5],'<circle r="16" fill="none" stroke="#a39572" stroke-width="2" stroke-dasharray="4 3"/>'+rect(-13,-6,26,12,'#fff2b7','stroke="#ad9b64" stroke-width="2"')+'<path d="M-7 10H7M0 6V16" stroke="#8c8c79" stroke-width="2"/>');
 drawing+=worldRect(-4.55,-7.7,.92,2.6,'#d3c7af','data-training-feature="storage" stroke="#a69370" stroke-width="2"')+
  worldRect(4.23,-1.05,.69,2.8,'#d7bf98','data-training-feature="bench" stroke="#ad946d" stroke-width="2"');
 for(const [index,[x,z]]of[[-4.25,-4],[4.3,-8.55]].entries())drawing+=feature('pad-'+index,[x,0,z],'<circle r="12" fill="#80978a" stroke="#596e64" stroke-width="2"/><circle r="5" fill="none" stroke="#eef0db" stroke-width="2"/>');
 drawing+=feature('selector',[-1.15,0,.3],rect(-10,-15,20,30,'#536d65','stroke="#b5a07c" stroke-width="2"')+'<path d="M-6-9H6M-6-4H6M-6 1H6M-6 6H6M-6 11H6" stroke="#e9e9cb" stroke-width="2"/>');
 const door=trainingMapPoint([0,0,3.22]),freightTop=trainingMapPoint([3.3,0,-27.8]),freightBottom=trainingMapPoint([-3.3,0,-27.8]);
 drawing+=`<path d="M${near.x} ${door.y-44}V${far.y}H${far.x}V${freightTop.y}M${far.x} ${freightBottom.y}V${near.y}H${near.x}V${door.y+44}" fill="none" stroke="${selected==='training'?'#936843':'#a89c80'}" stroke-width="4" stroke-linejoin="round"/>`+
  feature('entrance',[0,0,3.22],'<path d="M3-44V44M-2-42V-4M-2 4V42" stroke="#9abeb6" stroke-width="4" fill="none"/>')+
  worldRect(0,-27.8,6.6,.14,'#b9c5bd','data-training-feature="freight-door" stroke="#899c8f" stroke-width="3"')+
  `<path d="M${freightTop.x-4} ${door.y}h8" stroke="#7b8c80" stroke-width="3"/>`;
 // Guests and staff enter through the same east/west openings as the shared 3D layout.
 drawing+=zone('guest-lounge',70,550,535,145,'#f8f0de','data-map-marker-x="-90" data-map-marker-y="620" data-map-marker-unit=".9"')+
  '<g transform="translate(70 550)">'+interiorMapDrawing('guest-lounge',{selected:selected==='guest-lounge'})+'</g>'+
  text(337,728,'休憩室',compact?26:24);
 // Keep the existing east access; furniture and the doorway come from the model layout.
 drawing+=zone('control',650,550,250,145,'#e4ece5','data-map-marker-x="1006" data-map-marker-y="620" data-map-marker-unit=".8"')+
  '<g transform="translate(650 550)">'+interiorMapDrawing('management-room',{selected:selected==='control'})+'</g>'+
  text(775,728,'管理室',compact?26:24)+
  basementWashroomDrawing({selected,compact})+basementCoreDrawing({selected,compact})+basementFreightDrawing({selected,compact})+
  '<path data-training-access="freight-lounge-entry" d="M-106 484h32" fill="none" stroke="#e2d9c4" stroke-width="8"/>';
 if(!compact){
  drawing+=text(200,198,'訓練所',42)+text(1021,285,'入口',34)+
   equipmentLabel(false,804,286,'送風機')+equipmentLabel(false,561,286,'照明')+
   equipmentLabel(false,656,286,'パッド')+equipmentLabel(false,901,464,'端末')+
   equipmentLabel(false,906,286,'ベンチ')+equipmentLabel(false,656,478,'収納')+
   text(345,393,'訓練マット',36);
 }
 if(current)drawing+=feature('current-position',[0,0,.9],'<path d="m-20 0 10-8v16Z" fill="#8d7c5b"/><circle r="12" fill="#fff7e9" stroke="#bb817a" stroke-width="3"/><circle cx="-5" cy="2" r="2" fill="#d8a1a0"/><circle cx="5" cy="2" r="2" fill="#d8a1a0"/>');
 return `<g data-training-plan="right-entrance" font-family="system-ui, sans-serif">${drawing}</g>`;
}
export function trainingMapSvg({compact=true,current=true}={}){
 return `<svg class="room-map" viewBox="${compact?BASEMENT_COMPACT_VIEWBOX:TRAINING_MAP_VIEWBOX}" role="img" aria-label="右側が入口の訓練所。奥の大型EVは屋外搬入口につながります。訓練マット、操作端末、送風機、照明、収納、ベンチと管理室。招待した珍生物と施設作業員がくつろぐ休憩室。右側の通常エレベーター隣にトイレ・シャワー・脱衣所。${current?'おこていゆは入口付近で待機しています。':''}">${trainingMapDrawing({compact,current})}</svg>`;
}
