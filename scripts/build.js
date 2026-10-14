const fs=require('fs'),path=require('path');const {validateAll,sectorVerdict}=require('./validate');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,process.env.OUT_DIR||'dist');
const prod=process.argv.includes('--production');
const {data,errors}=validateAll(ROOT,{production:prod});
if(errors.length){console.error('Validation failed, nothing built:\n'+errors.join('\n'));process.exit(1);}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const myt=t=>new Date(t).toLocaleString('en-GB',{timeZone:'Asia/Kuala_Lumpur',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})+' MYT';
const FL={current:'Current','recent':'Recent developments','earlier-context':'Earlier context'};
const eds=data.editions.filter(e=>e.status==='published').sort((a,b)=>b.date.localeCompare(a.date));
const co=Object.fromEntries(data.watchlist.map(c=>[c.key,c]));
const secLabel=Object.fromEntries(data.sectors.map(s=>[s.key,s.label]));
const fmtDate=d=>new Date(d+'T00:00:00+08:00').toLocaleDateString('en-GB',{timeZone:'Asia/Kuala_Lumpur',weekday:'long',day:'numeric',month:'long',year:'numeric'});
function page(title,body,base){return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="${base}assets/style.css"></head><body>
<a class="skip" href="#main">Skip to content</a>
<header class="bar"><div class="wrap"><a class="brand" href="${base}">MALAYSIA <span>EXECUTIVE BRIEF</span></a><nav><a href="${base}">Latest edition</a><a href="${base}archive/">Archive</a></nav></div></header>
<main id="main" class="wrap">${body}</main>
<footer><div class="wrap"><p><strong>Important information.</strong> Published editions are dated snapshots and are not updated after publication. This is a daily briefing, not a trading dashboard. Coverage is not exhaustive; an unreadable source is not evidence of no news.</p><p class="fine">Malaysia Executive Brief · Published daily at 09:00 MYT</p></div></footer>
<script src="${base}assets/filter.js"></script></body></html>`}
function edition(ed,base){
  const secs=data.sectors.map(s=>({s,d:(ed.sectors||[]).find(x=>x.sectorKey===s.key)||{items:[]}}));
  const total=secs.reduce((n,x)=>n+x.d.items.length,0);
  const byId={};secs.forEach(({s,d})=>d.items.forEach(i=>byId[i.id]={...i,sectorKey:s.key}));
  const mentions={};secs.forEach(({d})=>d.items.forEach(i=>(i.watchlistCompanyKeys||[]).forEach(k=>mentions[k]=(mentions[k]||0)+1)));
  const cutoff=ed.checkedAt.slice().sort().slice(-1)[0];
  let h=`<section class="head">${ed.demo?`<p class="demo" role="note"><b>Demonstration edition.</b> All items, summary points and themes are placeholders illustrating the layout. None of it is real news or analysis.</p>`:''}
  <p class="eyebrow">Daily Executive Briefing · Malaysia</p><h1>${esc(fmtDate(ed.date))}</h1>
  <dl class="meta"><div><dt>Edition</dt><dd>${esc(ed.date)}</dd></div><div><dt>Research cutoff</dt><dd>${myt(cutoff)}</dd></div><div><dt>Checks</dt><dd>${ed.checkedAt.map(myt).join('; ')}</dd></div><div><dt>Published</dt><dd>${myt(ed.publishedAt)}</dd></div><div><dt>Items</dt><dd>${total}</dd></div></dl></section>
  <div class="layout"><aside class="side" aria-label="Sectors"><label class="mob" for="secsel">Sector</label><select id="secsel" class="mob"><option value="all">All sectors (${total})</option>${secs.map(({s,d})=>`<option value="${esc(s.key)}">${esc(s.label)} (${d.items.length})</option>`).join('')}</select>
  <div class="filters" role="group" aria-label="Filter by sector"><p class="sidettl">Sectors</p><button aria-pressed="true" data-f="all"><span>All sectors</span><span class="c">${total}</span></button>${secs.map(({s,d})=>`<button aria-pressed="false" data-f="${esc(s.key)}"${d.items.length?'':' class="z"'}><span>${esc(s.label)}</span><span class="c">${d.items.length}</span></button>`).join('')}</div></aside><div class="content">`;
  const kt=ed.keyTakeaways||[];
  const groups={Positive:[],Mixed:[],Negative:[],None:[]};secs.forEach(({s,d})=>groups[sectorVerdict(d.items)].push(s));
  h+=`<section class="heat" aria-labelledby="hm"><div class="ph"><h2 id="hm">Sector impact heatmap</h2><span class="tag-ed">Derived from item verdicts</span></div><div class="hm">`+[['Positive','Positive'],['Mixed','Mixed'],['Negative','Negative'],['None','No item today']].map(([k,l])=>`<div class="hc v-${k.toLowerCase()}"><p class="hl">${l} · ${groups[k].length}</p><ul>${groups[k].map(s=>`<li><a href="#sec-${esc(s.key)}">${esc(s.label)}</a></li>`).join('')||'<li class="none">None</li>'}</ul></div>`).join('')+`</div><p class="fn">A sector is Positive or Negative only when all its non-Watch items agree; otherwise Mixed. Editorial interpretation.</p></section>`;
  if(kt.length)h+=`<section class="exec" aria-labelledby="kt"><div class="ph"><h2 id="kt">Executive summary</h2><span class="tag-ed">Editorial interpretation</span></div><ol>`+kt.map(t=>`<li class="kt" data-sectors="${esc(t.sectorKeys.join(' '))}"><h3>${esc(t.headline)}</h3><p>${esc(t.soWhat)}</p><p class="ktmeta">${t.sectorKeys.map(k=>esc(secLabel[k])).join(' · ')} — Ref: ${t.itemIds.map((x,j)=>`<a href="#${esc(x)}">[${j+1}] ${esc(byId[x].sources[0].publisher)}</a>`).join(', ')}</p></li>`).join('')+`</ol><p class="fn">Synthesised from verified items in this edition. Reported facts appear in the sector sections.</p></section>`;
  secs.forEach(({s,d},si)=>{
    h+=`<section id="sec-${esc(s.key)}" class="sector${d.items.length?'':' is-empty'}" data-sector="${esc(s.key)}"><header class="shead"><h2><span class="sn">${String(si+1).padStart(2,'0')}</span>${esc(s.label)}</h2><span class="scount">${d.items.length} item${d.items.length===1?'':'s'}</span></header>${d.items.length?`<p class="scope">${esc(s.scope)}</p>`:''}`;
    if(!d.items.length)h+=`<p class="empty">No verified items in this edition.</p>`;
    else{h+=`<div class="rows">`;Object.keys(FL).forEach(f=>d.items.filter(i=>i.freshness===f).sort((a,b)=>b.publishedDate.localeCompare(a.publishedDate)).forEach(i=>{
      h+=`<article class="row" id="${esc(i.id)}"><div class="rd"><time datetime="${esc(i.publishedDate)}">${esc(i.publishedDate)}</time><span class="badge ${f}">${FL[f]}</span><span class="vb v-${esc(i.verdict.toLowerCase())}">${esc(i.verdict)}</span></div><div class="rb"><h3>${esc(i.headline)}</h3>${i.detail?`<p>${esc(i.detail)}</p>`:''}${i.soWhat?`<p class="sw"><b>So what:</b> ${esc(i.soWhat)}</p>`:''}${i.opportunity?`<p class="op"><b>Opportunity:</b> ${esc(i.opportunity)}</p>`:''}${i.watchOut?`<p class="wo"><b>Watch-out:</b> ${esc(i.watchOut)}</p>`:''}${i.note?`<p class="note">Note: ${esc(i.note)}</p>`:''}<p class="rm"><span class="src">Source: ${i.sources.map(x=>`<a href="${esc(x.url)}" rel="noopener" target="_blank">${esc(x.publisher)}</a>`).join(', ')}</span>${(i.watchlistCompanyKeys||[]).map(k=>`<span class="wtag">${esc(co[k].name)} · ${esc(co[k].ticker)}</span>`).join('')}</p></div></article>`}));h+=`</div>`}
    h+=`<p class="cov"><b>Coverage:</b> ${esc((ed.sectorCoverage||{})[s.key]||'No coverage note recorded.')}</p></section>`;
  });
  h+=`<section class="shared"><h2>${esc(data.watchlistLabel||'Company watchlist')}</h2><div class="tw"><table><thead><tr><th scope="col">Company</th><th scope="col">Ticker</th><th scope="col">Group</th><th scope="col" class="n">Mentions today</th></tr></thead><tbody>${data.watchlist.map(c=>`<tr><td>${esc(c.name)}</td><td class="tk">${esc(c.ticker)}</td><td>${esc(c.group)}</td><td class="n${mentions[c.key]?' hit':''}">${mentions[c.key]||0}</td></tr>`).join('')}</tbody></table></div>${(ed.watchlistCoverage||[]).map(n=>`<p class="cov">${esc(n)}</p>`).join('')}<h2>Limitations</h2><ul class="lim">${(ed.generalCoverage||[]).map(n=>`<li>${esc(n)}</li>`).join('')}</ul></section></div></div>`;
  return h;
}
fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(path.join(OUT,'assets'),{recursive:true});
for(const f of ['style.css','filter.js'])fs.copyFileSync(path.join(ROOT,'src',f),path.join(OUT,'assets',f));
const w=(p,c)=>{fs.mkdirSync(path.dirname(path.join(OUT,p)),{recursive:true});fs.writeFileSync(path.join(OUT,p),c)};
if(eds[0])w('index.html',page('Malaysia Executive Brief',edition(eds[0],''),''));else w('index.html',page('Malaysia Executive Brief','<h1>No edition published yet</h1>',''));
eds.forEach(e=>w(`editions/${e.date}/index.html`,page('Edition '+e.date,edition(e,'../../'),'../../')));
w('archive/index.html',page('Archive','<section class="head"><p class="eyebrow">All editions</p><h1>Archive</h1></section><ul class="arch">'+eds.map(e=>`<li><a href="../editions/${e.date}/"><span>${esc(fmtDate(e.date))}</span><small>${e.date}${e.demo?' · DEMO':''}</small></a></li>`).join('')+'</ul>','../'));
w('404.html',page('Not found','<section class="head"><h1>Page not found</h1></section><p class="sub">This edition or page does not exist. <a href="/">Go to the latest edition</a> or browse the archive.</p>','/'));
w('.nojekyll','');w('build-info.json',JSON.stringify({builtAt:new Date().toISOString(),latest:eds[0]&&eds[0].date,editions:eds.map(e=>e.date)},null,2));
console.log(`Built ${eds.length} editions into ${OUT}`);
