(function(){
var btns=[].slice.call(document.querySelectorAll('[data-f]')),sel=document.getElementById('secsel');
function apply(f){btns.forEach(function(x){x.setAttribute('aria-pressed',String(x.dataset.f===f))});if(sel)sel.value=f;
document.querySelectorAll('.sector').forEach(function(s){s.hidden=!(f==='all'||s.dataset.sector===f)});
document.querySelectorAll('.kt').forEach(function(k){k.hidden=!(f==='all'||k.dataset.sectors.split(' ').indexOf(f)>-1)});}
btns.forEach(function(b){b.addEventListener('click',function(){apply(b.dataset.f)})});
if(sel)sel.addEventListener('change',function(){apply(sel.value)});
var q=new URLSearchParams(location.search).get('sector');if(q&&btns.some(function(b){return b.dataset.f===q}))apply(q);
})();
