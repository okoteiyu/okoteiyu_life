// Shared plan of the authored analysis room. +X is right, +Z is the entrance below.
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export const ANALYSIS_ROOM_LAYOUT=freeze({
 schemaVersion:1,
 revision:"R159",
 coordinateSystem:{"right":"+X","up":"+Y","front":"+Z","back":"-Z"},
 room:{"width":12.8,"depth":4.4,"height":3.1,"bounds":{"min":[-6.4,0,-2.2],"max":[6.4,3.1,2.2]},"floorNode":"Analysis.Floor"},
 entrance:{"center":[0,0,2.2],"width":1.7,"height":2.45,"side":"front","doorNode":"Analysis.FrontDoorFrame","heroStand":[0,0,1.82],"heroYaw":3.141592653589793},
 napEntry:{"frontZ":0.28,"openingX":[-4.5,-3.62]},
 monitorCount:10,
 computerCount:6,
 buttonPanelCount:5,
 chairCount:6,
 features:[
  {"id":"central-table","node":"Analysis.CentralTable","label":"中央の大型作業テーブル","role":"desk","position":[0,0.39,0.08],"size":[6.4,0.78,1.06],"yaw":0,"footprint":[-3.2,-0.45,6.4,1.06]},
  {"id":"chair-1","node":"Analysis.Chair.01","label":"椅子1","role":"chair","position":[-2.1,0.45,-0.87],"size":[0.66,0.9,0.62],"yaw":0,"footprint":[-2.43,-1.18,0.66,0.62]},
  {"id":"chair-2","node":"Analysis.Chair.02","label":"椅子2","role":"chair","position":[0,0.45,-0.87],"size":[0.66,0.9,0.62],"yaw":0,"footprint":[-0.33,-1.18,0.66,0.62]},
  {"id":"chair-3","node":"Analysis.Chair.03","label":"椅子3","role":"chair","position":[2.1,0.45,-0.87],"size":[0.66,0.9,0.62],"yaw":0,"footprint":[1.77,-1.18,0.66,0.62]},
  {"id":"chair-4","node":"Analysis.Chair.04","label":"椅子4","role":"chair","position":[-2.1,0.45,1.03],"size":[0.66,0.9,0.62],"yaw":3.141592653589793,"footprint":[-2.43,0.72,0.66,0.62]},
  {"id":"chair-5","node":"Analysis.Chair.05","label":"椅子5","role":"chair","position":[0,0.45,1.03],"size":[0.66,0.9,0.62],"yaw":3.141592653589793,"footprint":[-0.33,0.72,0.66,0.62]},
  {"id":"chair-6","node":"Analysis.Chair.06","label":"椅子6","role":"chair","position":[2.1,0.45,1.03],"size":[0.66,0.9,0.62],"yaw":3.141592653589793,"footprint":[1.77,0.72,0.66,0.62]},
  {"id":"back-console","node":"Analysis.BackConsole","label":"奥の操作卓・PC","role":"console","position":[0,0.39,-1.86],"size":[6.2,0.78,0.58],"yaw":0,"footprint":[-3.1,-2.15,6.2,0.58]},
  {"id":"monitor-bank","node":"Analysis.BackMonitors","label":"多面モニター","role":"monitors","position":[0,1.64,-2.055],"size":[6.12,1.48,0.11],"yaw":0,"footprint":[-3.06,-2.1100000000000003,6.12,0.11]},
  {"id":"button-bank","node":"Analysis.BackControls","label":"ボタン・操作パネル","role":"controls","position":[0,0.83,-1.67],"size":[5.55,0.1,0.27],"yaw":0,"footprint":[-2.775,-1.805,5.55,0.27]},
  {"id":"bookcase","node":"Analysis.Bookcase","label":"大型書棚","role":"bookcase","position":[4.82,1.34,-1.82],"size":[2.76,2.68,0.62],"yaw":0,"footprint":[3.4400000000000004,-2.13,2.76,0.62]},
  {"id":"nap-bed","node":"Analysis.NapBed","label":"仮眠用ベッド","role":"bed","position":[-4.95,0.325,-0.94],"size":[1.32,0.65,1.95],"yaw":0,"footprint":[-5.61,-1.915,1.32,1.95]},
  {"id":"nap-nightstand","node":"Analysis.NapNightstand","label":"サイドテーブル","role":"nightstand","position":[-3.99,0.24,-1.54],"size":[0.42,0.48,0.42],"yaw":0,"footprint":[-4.2,-1.75,0.42,0.42]},
  {"id":"nap-partition-right","node":"Analysis.NapPartition.Right","label":"仮眠スペースの仕切り","role":"partition","position":[-3.62,1.07,-0.91],"size":[0.09,2.14,2.38],"yaw":0,"footprint":[-3.665,-2.1,0.09,2.38]},
  {"id":"nap-partition-front","node":"Analysis.NapPartition.Front","label":"仮眠スペースの仕切り","role":"partition","position":[-5.325,1.07,0.28],"size":[1.65,2.14,0.09],"yaw":0,"footprint":[-6.15,0.23500000000000004,1.65,0.09]},
  {"id":"front-whiteboard","node":"Analysis.FrontWhiteboard","label":"大型ホワイトボード","role":"whiteboard","position":[-3.75,1.6,2.065],"size":[3.75,1.32,0.11],"yaw":0,"footprint":[-5.625,2.01,3.75,0.11]},
  {"id":"front-cabinet","node":"Analysis.FrontCabinet","label":"書類キャビネット","role":"cabinet","position":[4.27,0.43,1.87],"size":[3.62,0.86,0.48],"yaw":0,"footprint":[2.4599999999999995,1.6300000000000001,3.62,0.48]},
  {"id":"front-pinboard","node":"Analysis.FrontPinboard","label":"研究資料ボード","role":"pinboard","position":[4.27,1.79,2.065],"size":[2.95,0.92,0.1],"yaw":0,"footprint":[2.7949999999999995,2.015,2.95,0.1]}
 ]
});

export const ANALYSIS_MAP_VIEWBOX='0 0 435 150';
const MAP_WIDTH=435,MAP_HEIGHT=150;
const number=value=>Number(value.toFixed(6));
const escape=value=>String(value).replace(/[&"<>]/g,char=>({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'}[char]));
const rect=(x,y,width,height,fill,extra='')=>`<rect x="${number(x)}" y="${number(y)}" width="${number(width)}" height="${number(height)}" rx="2" fill="${fill}" ${extra}/>`;

/** Same projection for the detailed room mini-map and its B1 building footprint. */
export function analysisMapPoint(position,layout=ANALYSIS_ROOM_LAYOUT){
 const bounds=layout.room.bounds;
 return {x:(position[0]-bounds.min[0])/(bounds.max[0]-bounds.min[0])*MAP_WIDTH,y:(position[2]-bounds.min[2])/(bounds.max[2]-bounds.min[2])*MAP_HEIGHT};
}
function furniture(feature,layout){
 const [x,z,width,depth]=feature.footprint,p=analysisMapPoint([x,0,z],layout),q=analysisMapPoint([x+width,0,z+depth],layout),w=q.x-p.x,h=q.y-p.y;
 const palette={desk:['#decaa5','#aa906c'],chair:['#b8cbbf','#7f9e90'],console:['#c4c7ba','#8e9e91'],monitors:['#669a9c','#507b80'],controls:['#bcc9c0','#879e90'],bookcase:['#cfba95','#aa916d'],bed:['#f4f1e8','#b9b7ac'],nightstand:['#dcc7a5','#b19c79'],partition:['#a8c0b7','#8ba59b'],whiteboard:['#fbfdf7','#96b3aa'],cabinet:['#d4ccbc','#ada38d'],pinboard:['#d6c4a5','#ae9874']};
 const [fill,stroke]=palette[feature.role]||['#dce4d7','#9dad9e'];
 let detail='';
 if(feature.role==='desk')detail=rect(p.x+3,p.y+3,w-6,h-6,'none',`stroke="#f4e7ce" stroke-width="1"`);
 if(feature.role==='chair'){
  const back=feature.yaw>1?p.y+h-2:p.y+2;
  detail=rect(p.x+3,p.y+3,w-6,h-6,'#e0e9df')+`<path d="M${number(p.x+2)} ${number(back)}H${number(q.x-2)}" stroke="#7e9a8b" stroke-width="2.5"/>`;
 }
 if(feature.role==='console')detail=Array.from({length:layout.computerCount},(_,i)=>rect(p.x+3+i*w/layout.computerCount,p.y+h*.37,w/layout.computerCount-6,h*.44,'#667b75','data-analysis-computer="true"')).join('');
 if(feature.role==='monitors')detail=`<path data-analysis-monitor-bank="true" data-monitor-count="${layout.monitorCount}" d="${Array.from({length:4},(_,i)=>`M${number(p.x+w*(i+1)/5)} ${number(p.y)}V${number(q.y)}`).join('')}" stroke="#d5efdf" stroke-width="1"/>`;
 if(feature.role==='controls')detail=Array.from({length:layout.buttonPanelCount},(_,i)=>`<circle cx="${number(p.x+w*(i+.5)/layout.buttonPanelCount)}" cy="${number(p.y+h/2)}" r="1.8" fill="${['#d9bd78','#8facb0','#b5c69c'][i%3]}" stroke="#789287" stroke-width=".6"/>`).join('');
 if(feature.role==='bookcase')detail=Array.from({length:12},(_,i)=>rect(p.x+3+i*(w-6)/12,p.y+2,(w-6)/12-1.2,h-4,['#a9bcb0','#d1b79a','#b4b6c2','#d3ccaa'][i%4])).join('');
 if(feature.role==='bed')detail=rect(p.x+3,p.y+3,w-6,h-6,'#e4e5dc')+rect(p.x+5,p.y+5,w-10,10,'#faf9f0')+`<path d="M${number(p.x+3)} ${number(p.y+18)}H${number(q.x-3)}" stroke="#bec8ba" stroke-width="1"/>`;
 if(feature.role==='cabinet')detail=`<path d="${[1,2,3].map(i=>`M${number(p.x+w*i/4)} ${number(p.y+2)}V${number(q.y-2)}`).join('')}" stroke="#b3a992" stroke-width="1"/>`;
 if(feature.role==='whiteboard'||feature.role==='pinboard')detail=`<path d="M${number(p.x+5)} ${number(p.y+h/2)}h${number(w*.35)}m4 0h${number(w*.2)}" stroke="${feature.role==='whiteboard'?'#84aaa6':'#f6eee0'}" stroke-width="1.1"/>`;
 return `<g data-analysis-feature="${feature.id}" data-analysis-role="${feature.role}" data-model-node="${feature.node}" data-world-x="${feature.position[0]}" data-world-y="${feature.position[1]}" data-world-z="${feature.position[2]}" data-world-width="${feature.size[0]}" data-world-height="${feature.size[1]}" data-world-depth="${feature.size[2]}" data-world-yaw="${feature.yaw}" data-world-footprint="${escape(JSON.stringify(feature.footprint))}"><title>${escape(feature.label)}</title>`+rect(p.x,p.y,w,h,fill,`data-analysis-footprint="true" stroke="${stroke}" stroke-width="${feature.role==='partition'?1.2:1}"`)+detail+'</g>';
}
export function analysisMapDrawing({layout=ANALYSIS_ROOM_LAYOUT,selected=false,compact=false,current=false}={}){
 const entry=layout.entrance,left=analysisMapPoint([entry.center[0]-entry.width/2,0,entry.center[2]],layout),right=analysisMapPoint([entry.center[0]+entry.width/2,0,entry.center[2]],layout);
 let drawing=rect(0,0,MAP_WIDTH,MAP_HEIGHT,'#e8eee5','data-analysis-floor="true"');
 drawing+='<g data-analysis-floor-lines="true" stroke="#d7e0d3" stroke-width=".45">'+Array.from({length:5},(_,i)=>`<path d="M0 ${25*(i+1)}H435"/>`).join('')+'</g>';
 drawing+=layout.features.map(feature=>furniture(feature,layout)).join('');
 drawing+=`<path data-analysis-wall="true" d="M${number(left.x)} 150H0V0H435V150H${number(right.x)}" fill="none" stroke="${selected?'#936843':'#a1b2a0'}" stroke-width="${selected?5:2}" stroke-linejoin="round"/>`;
 drawing+=`<path data-analysis-entrance="true" data-world-x="${entry.center[0]}" data-world-z="${entry.center[2]}" data-world-width="${entry.width}" d="M${number(left.x)} 150H${number(right.x)}M${number(left.x+2)} 147H${number((left.x+right.x)/2-2)}M${number((left.x+right.x)/2+2)} 147H${number(right.x-2)}" fill="none" stroke="#8db1a5" stroke-width="2.2"/>`;
 if(current){const p=analysisMapPoint(entry.heroStand,layout);drawing+=`<g data-analysis-current="true" data-world-x="${entry.heroStand[0]}" data-world-z="${entry.heroStand[2]}" transform="translate(${number(p.x)} ${number(p.y)})"><path d="m0-8-3 4h6Z" fill="#8d7c5b"/><circle r="4.5" fill="#fff7e9" stroke="#bb817a" stroke-width="1.2"/><circle cx="-1.5" cy="1" r=".75" fill="#d8a1a0"/><circle cx="1.5" cy="1" r=".75" fill="#d8a1a0"/></g>`;}
 return `<g data-analysis-plan="entrance-bottom" data-compact="${compact}" font-family="system-ui, sans-serif">${drawing}</g>`;
}
export function analysisMapSvg({layout=ANALYSIS_ROOM_LAYOUT,compact=true,current=true}={}){
 return `<svg class="room-map" viewBox="${ANALYSIS_MAP_VIEWBOX}" role="img" aria-label="入口が下側のコンピュータ室。中央に6脚の椅子と作業テーブル。奥にモニターと操作卓、右奥に書棚、左奥に仕切られた仮眠スペース、手前にホワイトボードと書類棚。${current?'おこていゆは入口付近で待っています。':''}">${analysisMapDrawing({layout,compact,current})}</svg>`;
}
