"use strict";
(function(){
  var CURRENT=(document.body.getAttribute("data-layout")||"classic");
  var V="200";
  var WORLDS=[
    {id:"classic",name:"CLASSIC",desc:"Dashboard noir original",file:"ps4.html",thumb:""},
    {id:"forest",name:"FORÊT ENCHANTÉE",desc:"Architecture végétale",file:"forest.html",thumb:"assets/reference/forest/reference.jpg"},
    {id:"station",name:"STATION ORBITALE",desc:"NEXUS orbital",file:"station.html",thumb:"assets/reference/station/reference.jpg"},
    {id:"ocean",name:"ATLANTIS NÉON",desc:"Cité abyssale",file:"ocean.html",thumb:"assets/reference/ocean/reference.jpg"},
    {id:"desert",name:"DÉSERT",desc:"Ruines des dunes",file:"desert.html",thumb:"assets/reference/desert/reference.jpg"},
    {id:"inferno",name:"FLAMMES",desc:"Monde volcanique",file:"inferno.html",thumb:"assets/reference/inferno/reference.jpg"}
  ];
  function go(id){
    var w=WORLDS.filter(function(x){return x.id===id})[0]||WORLDS[0];
    try{localStorage.setItem("playerDashboardWorld",w.id)}catch(e){}
    location.href=w.file+"?v="+V;
  }
  function mountPicker(root){
    if(!root)return;
    var h='<div class="world-picker-head"><b>// DESIGNS</b><span>6 dashboards — un seul moteur.</span></div><div class="world-picker">';
    WORLDS.forEach(function(w){var st=w.thumb?' style="background-image:url(\''+w.thumb+'\')"':'';h+='<button type="button" class="world-choice '+(w.id===CURRENT?'active':'')+'" data-world-choice="'+w.id+'"'+st+'><span class="world-choice-shade"></span><b>'+w.name+'</b><small>'+w.desc+'</small></button>'});
    h+='</div><p class="world-picker-foot">Design actuel : <strong>'+((WORLDS.filter(function(w){return w.id===CURRENT})[0]||{}).name||CURRENT)+'</strong></p>';
    root.innerHTML=h;
    var b=root.querySelectorAll('[data-world-choice]');for(var i=0;i<b.length;i++)b[i].onclick=function(){go(this.getAttribute('data-world-choice'))};
  }
  window.PlayerWorlds={mountPicker:mountPicker,set:go,get:function(){return CURRENT},list:function(){return WORLDS.slice()}};
})();
