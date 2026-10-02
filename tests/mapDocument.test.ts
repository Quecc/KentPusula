import test from "node:test";
import assert from "node:assert/strict";
import { nativeMapHtml, nativeMapUpdateScript } from "../services/mapDocument";
import vm from "node:vm";
import { services, DEFAULT_LOCATION } from "../data/catalog";

test("native map keeps scripts local and treats marker names as text", () => {
  const name = '</script><script>alert("injected")</script>';
  const html = nativeMapHtml(
    [{ ...services[0], name, latitude: 39.9, longitude: 32.8 }],
    DEFAULT_LOCATION,
  );
  assert.equal(html.includes(name), false);
  assert.ok(html.includes("text.textContent=point.name"));
  assert.ok(html.includes("https://tile.openstreetmap.org/{z}/{x}/{y}.png"));
  assert.equal(/<script\s+src=/i.test(html), false);
  assert.ok(html.includes('content="light"'));
});

test("map bridge updates markers and selection without rebuilding or resetting zoom", () => {
  const service = { ...services[0], latitude: 39.9, longitude: 32.8 };
  const html = nativeMapHtml([service], DEFAULT_LOCATION);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const context = vm.createContext({});
  vm.runInContext(
    `
    const state={maps:0,setViews:0,zoom:13,pans:[],layers:new Set(),inside:true,messages:[]};
    const map={setView:function(){state.setViews++;return this;},panTo:function(point){state.pans.push(point);return this;},getBounds:function(){return {contains:function(){return state.inside;}};},removeLayer:function(marker){state.layers.delete(marker);}};
    const L={map:function(){state.maps++;return map;},control:{zoom:function(){return {addTo:function(){}};}},
      tileLayer:function(){return {addTo:function(){return this;},on:function(){}};},divIcon:function(icon){return icon;},
      marker:function(point,options){return {point:point,icon:options.icon,addTo:function(){state.layers.add(this);return this;},on:function(){},setLatLng:function(point){this.point=point;},setIcon:function(icon){this.icon=icon;},unbindTooltip:function(){},bindTooltip:function(text){this.name=text.textContent;}};},
      Control:{extend:function(config){return class {addTo(){state.centerButton=config.onAdd();}};}},
      DomUtil:{create:function(){return {setAttribute:function(){}};}},DomEvent:{disableClickPropagation:function(){},on:function(button,event,handler){button.click=handler;}}};
    const window={L:L,ReactNativeWebView:{postMessage:function(message){state.messages.push(JSON.parse(message));}}};
    const document={createElement:function(){return {};},querySelector:function(){return {addEventListener:function(){}};}};
    const setTimeout=function(){};
  `,
    context,
  );
  vm.runInContext(scripts.at(-1)![1], context);
  vm.runInContext("state.zoom=17;state.inside=false", context);
  vm.runInContext(
    nativeMapUpdateScript([service], DEFAULT_LOCATION, service.id),
    context,
  );
  assert.equal(vm.runInContext("state.maps", context), 1);
  assert.equal(vm.runInContext("state.setViews", context), 1);
  assert.equal(vm.runInContext("state.zoom", context), 17);
  assert.equal(vm.runInContext("state.pans.length", context), 1);
  assert.equal(
    vm.runInContext("[...state.layers][0].icon.className", context),
    "pin active",
  );
  const visibleService = { ...service, id: "visible" };
  vm.runInContext("state.inside=true", context);
  vm.runInContext(
    nativeMapUpdateScript(
      [visibleService],
      DEFAULT_LOCATION,
      visibleService.id,
    ),
    context,
  );
  assert.equal(vm.runInContext("state.pans.length", context), 1);
  vm.runInContext(nativeMapUpdateScript([], DEFAULT_LOCATION), context);
  assert.equal(vm.runInContext("state.layers.size", context), 0);
  assert.equal(vm.runInContext("state.pans.length", context), 1);
  assert.equal(vm.runInContext("state.maps", context), 1);
  const newOrigin = { latitude: 40, longitude: 33 };
  vm.runInContext(nativeMapUpdateScript([], newOrigin), context);
  vm.runInContext("state.centerButton.click()", context);
  assert.equal(
    JSON.stringify(vm.runInContext("state.pans.at(-1)", context)),
    "[40,33]",
  );
  assert.equal(vm.runInContext("state.zoom", context), 17);
});

test("map bridge keeps hostile names as data", () => {
  const name = '</script><script>alert("injected")</script>';
  const script = nativeMapUpdateScript(
    [{ ...services[0], name }],
    DEFAULT_LOCATION,
    services[0].id,
  );
  assert.equal(script.includes(name), false);
  let received: { points: { name: string }[] } | undefined;
  vm.runInNewContext(script, {
    window: {
      KentPusulaMap: {
        update: (data: typeof received) => {
          received = data;
        },
      },
    },
  });
  assert.equal(received?.points[0].name, name);
});
