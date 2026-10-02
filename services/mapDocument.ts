import { CityService, Coordinates } from "../types";
import leaflet from "../data/map/leaflet-runtime.json";

// Escape JSON before embedding it in HTML, including closing script tags.
const scriptData = (value: unknown) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

function mapData(items: CityService[], center: Coordinates, selected?: string) {
  return {
    center,
    selected: selected ?? null,
    points: items
      .filter((item) => item.latitude !== null && item.longitude !== null)
      .map((item) => ({
        id: item.id,
        name: item.name,
        lat: item.latitude,
        lon: item.longitude,
        category: item.category,
      })),
  };
}

export function nativeMapUpdateScript(
  items: CityService[],
  center: Coordinates,
  selected?: string,
) {
  return `if(window.KentPusulaMap){window.KentPusulaMap.update(${scriptData(mapData(items, center, selected))});}true;`;
}

export function nativeMapHtml(
  items: CityService[],
  center: Coordinates,
  selected?: string,
) {
  const points = items
    .filter((item) => item.latitude !== null && item.longitude !== null)
    .map((item) => ({
      id: item.id,
      name: item.name,
      lat: item.latitude,
      lon: item.longitude,
      category: item.category,
    }));
  return `<!doctype html><html lang="tr"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <meta name="color-scheme" content="light">
  <style>${leaflet.css}</style>
  <style>html,body,#map{height:100%;margin:0;background:#E8EBE5;font-family:-apple-system,Arial,sans-serif;color:#172421} .leaflet-control-zoom a{width:40px;height:40px;line-height:40px}.leaflet-bar{border:0!important;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px #0002}.pin{background:none;border:0}.pin span{width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:3px solid white;border-radius:22px;background:#243D34;color:white;font-size:17px;box-shadow:0 2px 5px #0003}.pin.active span{background:#C24728;transform:scale(1.18)}.leaflet-control-attribution{font-size:10px}.leaflet-tooltip{font-size:13px}.center{background:white;border:0;width:40px;height:40px;border-radius:14px;font-size:23px;color:#243D34;box-shadow:0 2px 12px #0002}</style>
  </head><body><div id="map" aria-label="Ankara hizmet haritası"></div>
  <script>${leaflet.js.replace(/<\/script/gi, "<\\/script")}</script>
  <script>(function(){
    function send(message){if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(message));}
    if(!window.L){send({type:'error'});return;}
    let center=${scriptData(center)}, selected=null;
    const points=${scriptData(points)};
    const map=L.map('map',{zoomControl:false,attributionControl:true}).setView([center.latitude,center.longitude],13);
    L.control.zoom({position:'topright'}).addTo(map);
    const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,minZoom:10,updateWhenIdle:true,keepBuffer:1,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
    let loaded=0,errors=0;
    tiles.on('tileload',function(){loaded++;send({type:'ready'});});
    tiles.on('tileerror',function(){errors++;});
    tiles.on('load',function(){if(!loaded&&errors)send({type:'error'});});
    const icons={food:'🍴',study:'▤',wifi:'⌁',sport:'●',course:'✎',career:'▣',culture:'♫',support:'♡'};
    const markers=new Map();
    function icon(point,active){return L.divIcon({className:'pin'+(active?' active':''),html:'<span>'+icons[point.category]+'</span>',iconSize:[38,38],iconAnchor:[19,19]});}
    function update(data){
      const centerChanged=center.latitude!==data.center.latitude||center.longitude!==data.center.longitude;
      center=data.center;
      const ids=new Set(data.points.map(function(point){return point.id;}));
      markers.forEach(function(marker,id){if(!ids.has(id)){map.removeLayer(marker);markers.delete(id);}});
      data.points.forEach(function(point){
        let marker=markers.get(point.id);
        if(!marker){marker=L.marker([point.lat,point.lon],{icon:icon(point,point.id===data.selected)}).addTo(map);markers.set(point.id,marker);marker.on('click',function(){send({type:'select',id:point.id});});}
        marker.setLatLng([point.lat,point.lon]);marker.setIcon(icon(point,point.id===data.selected));
        const text=document.createElement('span');text.textContent=point.name;
        marker.unbindTooltip();marker.bindTooltip(text,{direction:'top'});
      });
      const chosen=data.points.find(function(point){return point.id===data.selected;});
      if(chosen&&selected!==data.selected&&!map.getBounds().contains([chosen.lat,chosen.lon]))map.panTo([chosen.lat,chosen.lon]);
      else if(centerChanged)map.panTo([center.latitude,center.longitude]);
      selected=data.selected;
    }
    window.KentPusulaMap={update:update};
    update({points:points,center:center,selected:${scriptData(selected ?? null)}});
    const Center=L.Control.extend({options:{position:'topright'},onAdd:function(){const button=L.DomUtil.create('button','center');button.textContent='⌖';button.setAttribute('aria-label','Haritayı merkezle');L.DomEvent.disableClickPropagation(button);L.DomEvent.on(button,'click',function(){map.panTo([center.latitude,center.longitude]);});return button;}});new Center().addTo(map);
    document.querySelector('.leaflet-control-attribution').addEventListener('click',function(event){event.preventDefault();send({type:'attribution'});});
    setTimeout(function(){if(!loaded)send({type:'error'});},18000);
    send({type:'initialized'});
  })();</script></body></html>`;
}
