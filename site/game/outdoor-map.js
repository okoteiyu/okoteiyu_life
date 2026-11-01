// A schematic overview, not a survey or a new destination in the game.
export const OUTDOOR_MAP_VIEWBOX='0 0 2000 1120';

const rect=(x,y,width,height,fill,extra='')=>`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="9" fill="${fill}" ${extra}/>`;
const text=(x,y,value,size=30,extra='')=>`<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" fill="#645b49" ${extra}>${value}</text>`;

/** A single ground-floor footprint and its combined cargo entrance/lift. */
export function outdoorMapDrawing({selected=null}={}){
 const zone=(id,x,y,width,height,fill)=>rect(x,y,width,height,fill,`data-building-zone="${id}" stroke="${selected===id?'#936843':'#ad9d7d'}" stroke-width="${selected===id?5:3}"`);
 let drawing=rect(30,40,1940,844,'#edf0df','stroke="#b4bf9e" stroke-width="4"')+
  text(1000,118,'おこていゆハウス周辺',64)+
  // The basement extends well beyond the ground building. This is schematic,
  // without introducing surveyed dimensions or a new selectable destination.
  rect(70,200,1860,630,'#e1e8d6','data-outdoor-feature="underground-footprint" fill-opacity=".55" stroke="#a8b597" stroke-width="4" stroke-dasharray="22 16"')+
  text(890,330,'地下施設の広がり（概略）',58)+
  '<path data-outdoor-feature="underground-connection" d="M410 575H1370" fill="none" stroke="#b3c0a5" stroke-width="7" stroke-dasharray="24 20"/>'+
  text(890,640,'地下で接続',50)+
  // The neighbourhood street and sidewalk sit outside the building grounds.
  rect(0,960,2000,160,'#cdd0c8','data-outdoor-feature="street"')+
  rect(0,884,2000,76,'#e3dece','data-outdoor-feature="sidewalk"')+
  '<path d="M0 960H2000" stroke="#b4b6a7" stroke-width="4"/><path d="M0 1040H2000" stroke="#f4f1df" stroke-width="6" stroke-dasharray="60 44"/>'+
  text(1670,1092,'住宅街の道',54)+
  '<path data-outdoor-path="front-entry" d="M1540 922V780" fill="none" stroke="#d9cfb8" stroke-width="92"/>'+
  '<path data-outdoor-path="large-entry" d="M260 922V780" fill="none" stroke="#d8d1bd" stroke-width="110"/>'+
  '<path d="m1522 866 18-18 18 18m-1316 0 18-18 18 18" fill="none" stroke="#aa9b78" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'+
  // The near-square outline follows the existing F1 plan's proportions.
  // Entrance is intentionally inside this footprint, not a detached building.
  zone('building',1370,260,540,520,'#f7f1df')+
  rect(1392,282,496,366,'#f2e9d5','data-outdoor-feature="building-outline" stroke="#d8c7a6" stroke-width="3"')+
  '<path d="M1412 302H1868M1412 628H1868M1392 660H1888" fill="none" stroke="#d7c4a0" stroke-width="3"/>'+
  text(1640,410,'おこていゆ',68)+text(1640,490,'ハウス',68)+
  text(1640,589,'F1・F2',54)+
  rect(1790,694,84,66,'#e6eadc','data-outdoor-feature="passenger-ev" stroke="#a5b294" stroke-width="3"')+text(1832,742,'EV',48)+
  zone('entrance',1390,650,300,130,'#e4ead5')+
  text(1540,710,'建物入口',54)+
  '<g data-outdoor-feature="security-lock" fill="none" stroke="#8b936b" stroke-width="4"><path d="M1420 748v-9a10 10 0 0 1 20 0v9"/><rect x="1415" y="748" width="30" height="24" rx="4"/><path d="M1430 757v7"/></g>'+
  text(1560,766,'ロック',50)+
  '<path data-outdoor-feature="front-door" d="M1490 780h100" stroke="#9ab7a8" stroke-width="8"/>'+
  // One area: the outdoor loading entrance is the freight lift itself.
  zone('freight',110,350,300,430,'#dce4d4')+
  text(260,416,'大型搬入口',54)+text(260,481,'EV',64)+
  rect(155,510,210,100,'#f4f2e4','data-outdoor-feature="freight-platform" stroke="#99ae96" stroke-width="4"')+
  '<path d="M260 512v96m-94-70h188m-188 44h188" fill="none" stroke="#b9c5b0" stroke-width="3"/>'+
  '<path d="M260 675v-40m-14 12 14-14 14 14" fill="none" stroke="#a18b61" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'+
  text(260,744,'B1・B2へ',50)+
  // Small planting beds distinguish the grounds from the paved approaches.
  '<g data-outdoor-feature="planting" fill="#b9cda7" stroke="#9db68b" stroke-width="3"><rect x="1070" y="732" width="100" height="78" rx="20"/><circle cx="1102" cy="758" r="22"/><circle cx="1138" cy="783" r="22"/><circle cx="520" cy="450" r="26"/></g>';
 return `<g data-outdoor-plan="house-surroundings" font-family="system-ui, sans-serif">${drawing}</g>`;
}
