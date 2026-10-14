const fs=require('fs'),path=require('path');
const FRESH=['current','recent','earlier-context'];
const DATE=/^\d{4}-\d{2}-\d{2}$/;
function load(root){
  const r=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
  const dir=path.join(root,'data/editions');
  const editions=fs.readdirSync(dir).filter(f=>/^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map(f=>({file:f,...JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'))}));
  const wl=r("config/watchlist.json"),src=r("config/sources.json");
  return {sectors:r("config/sectors.json").sectors,watchlist:wl.companies,watchlistLabel:wl.label,sources:[...(src.media||[]),...(src.primary||[])],editions};
}
function validateConfig({sectors,watchlist}){
  const e=[];
  if(!Array.isArray(sectors)||sectors.length!==10)e.push(`expected 10 sectors, got ${sectors&&sectors.length}`);
  const sk=new Set();(sectors||[]).forEach(s=>{if(!s.key||!s.label)e.push('sector missing key/label');if(sk.has(s.key))e.push('duplicate sector '+s.key);sk.add(s.key)});
  if(!Array.isArray(watchlist)||watchlist.length!==12)e.push(`expected 12 watchlist companies, got ${watchlist&&watchlist.length}`);
  (watchlist||[]).forEach(c=>{if(typeof c.ticker!=='string'||!c.ticker)e.push(`ticker for ${c.key} must be a non-empty string`);if(!c.name||!c.key)e.push('company missing key/name')});
  return e;
}
function validateEdition(ed,{sectors,watchlist},opts={}){
  const e=[],sk=new Set(sectors.map(s=>s.key)),wk=new Set(watchlist.map(c=>c.key));
  const id=ed.file||ed.date;
  if(!DATE.test(ed.date||''))e.push(`${id}: bad date`);
  if(ed.file&&ed.file!==ed.date+'.json')e.push(`${id}: filename/date mismatch`);
  if(!Array.isArray(ed.checkedAt)||!ed.checkedAt.length||ed.checkedAt.some(t=>isNaN(Date.parse(t))))e.push(`${id}: checkedAt must list real ISO times`);
  if(opts.production&&ed.demo)e.push(`${id}: demo edition not allowed in production`);
  const ids=new Set();
  (ed.sectors||[]).forEach(s=>{
    if(!sk.has(s.sectorKey))e.push(`${id}: unknown sector ${s.sectorKey}`);
    (s.items||[]).forEach((it,i)=>{
      const w=`${id} ${s.sectorKey}#${i}`;
      if(!it.id)e.push(`${w}: missing id`);else if(ids.has(it.id))e.push(`${w}: duplicate id ${it.id}`);else ids.add(it.id);
      if(!it.headline)e.push(`${w}: missing headline`);
      if(!FRESH.includes(it.freshness))e.push(`${w}: freshness must be one of ${FRESH.join(', ')}`);
      if(!DATE.test(it.publishedDate||''))e.push(`${w}: missing/invalid publishedDate`);
      else if(it.publishedDate>ed.date)e.push(`${w}: publishedDate after edition date`);
      if(!Array.isArray(it.sources)||!it.sources.length)e.push(`${w}: needs at least one source`);
      (it.sources||[]).forEach(src=>{if(!src.publisher||!/^https?:\/\//.test(src.url||''))e.push(`${w}: source needs publisher and http(s) url`)});
      (it.watchlistCompanyKeys||[]).forEach(k=>{if(!wk.has(k))e.push(`${w}: unknown company ${k}`)});
    });
  });
  const kt=ed.keyTakeaways;
  if(kt!==undefined){
    if(!Array.isArray(kt))e.push(`${id}: keyTakeaways must be an array`);
    else{
      const n=(ed.sectors||[]).reduce((a,s)=>a+(s.items||[]).length,0);
      if(n>=3&&(kt.length<3||kt.length>5))e.push(`${id}: keyTakeaways needs 3-5 entries`);
      if(kt.length>5)e.push(`${id}: keyTakeaways max 5`);
      kt.forEach((t,i)=>{const w=`${id} takeaway#${i}`;
        if(!t.headline||!t.soWhat)e.push(`${w}: needs headline and soWhat`);
        if(!Array.isArray(t.sectorKeys)||!t.sectorKeys.length||t.sectorKeys.some(k=>!sk.has(k)))e.push(`${w}: sectorKeys must list known sectors`);
        if(!Array.isArray(t.itemIds)||!t.itemIds.length)e.push(`${w}: must reference at least one item id`);
        (t.itemIds||[]).forEach(x=>{if(!ids.has(x))e.push(`${w}: unknown item id ${x}`)});});
    }
  }
  return e;
}
function validateAll(root,opts){const d=load(root);let e=validateConfig(d);d.editions.forEach(ed=>e=e.concat(validateEdition(ed,d,opts)));return {data:d,errors:e};}
module.exports={load,validateConfig,validateEdition,validateAll,FRESH};
if(require.main===module){const {errors}=validateAll(path.resolve(__dirname,'..'),{production:process.argv.includes('--production')});if(errors.length){console.error(errors.join('\n'));process.exit(1)}console.log('OK: all editions valid');}
