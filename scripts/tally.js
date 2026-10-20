#!/usr/bin/env node
// Compute sourceTally from raw run logs in logs/<date>/ (no dependencies).
// Usage: node scripts/tally.js <date> [--check] [--write] [--sources "A,B"] [--all]
//   default  print the computed sourceTally (JSON)
//   --check  compare scanned/used/status with data/editions/<date>.json; exit 1 on mismatch
//   --write  update scanned/used/status for the computed sources in the edition (note/publishers kept)
//   --sources limit to these sources; otherwise logs/<date>/manifest.json checkSources, else all logged sources
//   --all    ignore manifest scope and use every logged source
'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const BURSA='Bursa announcements';

function readJsonl(f){if(!fs.existsSync(f))return[];return fs.readFileSync(f,'utf8').split('\n').filter(l=>l.trim()).map((l,i)=>{try{return JSON.parse(l)}catch(e){throw new Error(`${f}:${i+1}: bad JSON`)}})}
function readJson(f,d){return fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):d}

function compute(date,dir=path.join(root,'logs',date)){
  if(!fs.existsSync(dir))throw new Error(`no logs for ${date} at ${dir}`);
  const arts=readJsonl(path.join(dir,'articles.jsonl'));
  const checks=readJsonl(path.join(dir,'checks.jsonl'));
  const status=readJson(path.join(dir,'status.json'),{});
  const bursa=readJson(path.join(dir,'bursa.json'),null);
  const by={};const get=s=>by[s]||(by[s]={source:s,discovered:0,inWindow:0,opened:0,itemIds:new Set()});
  for(const a of arts){
    if(!a.source)throw new Error('article line without source');
    const r=get(a.source);r.discovered++;if(a.inWindow)r.inWindow++;if(a.opened)r.opened++;
    if(a.decision==='included'&&a.itemId)r.itemIds.add(a.itemId);
  }
  if(bursa){const r=get(BURSA);for(const x of bursa.results||[]){r.discovered++;r.inWindow++;if(x.opened)r.opened++;if(x.decision==='included'&&x.itemId)r.itemIds.add(x.itemId)}r.bursaComplete=!!bursa.complete}
  for(const c of checks)get(c.source);
  return Object.values(by).map(r=>{
    let st=status[r.source]&&status[r.source].status;
    if(!st){
      const ok=checks.some(c=>c.source===r.source&&/^ok/i.test(c.result||''));
      const anyCheck=checks.some(c=>c.source===r.source);
      if(anyCheck&&!ok)st='blocked';
      else if(r.bursaComplete===false)st='partial';
      else st='checked';
    }
    return {source:r.source,scanned:r.inWindow,used:r.itemIds.size,status:st,
      _log:{discovered:r.discovered,inWindow:r.inWindow,opened:r.opened,itemIds:[...r.itemIds].sort()}};
  });
}

function scope(date,rows,args){
  const i=args.indexOf('--sources');
  if(i>=0)return args[i+1].split(',').map(s=>s.trim());
  if(args.includes('--all'))return rows.map(r=>r.source);
  const m=readJson(path.join(root,'logs',date,'manifest.json'),{});
  return m.checkSources||rows.map(r=>r.source);
}

function check(date,args=[]){
  const rows=compute(date),want=scope(date,rows,args);
  const ed=readJson(path.join(root,'data/editions',date+'.json'),null);
  if(!ed)throw new Error(`no edition data/editions/${date}.json`);
  const errs=[],lines=[];
  for(const s of want){
    const c=rows.find(r=>r.source===s),e=(ed.sourceTally||[]).find(t=>t.source===s);
    if(!c){errs.push(`${s}: not in logs`);continue}
    if(!e){errs.push(`${s}: not in edition sourceTally`);continue}
    for(const k of ['scanned','used','status'])if(c[k]!==e[k])errs.push(`${s}: ${k} logs=${c[k]} edition=${e[k]}`);
    lines.push(`${s}: logs scanned=${c.scanned} used=${c.used} status=${c.status} | edition scanned=${e.scanned} used=${e.used} status=${e.status} | discovered=${c._log.discovered} opened=${c._log.opened}`);
  }
  return {ok:!errs.length,errs,lines,scope:want};
}

module.exports={compute,check};

if(require.main===module){
  const args=process.argv.slice(2),date=args.find(a=>/^\d{4}-\d{2}-\d{2}$/.test(a));
  if(!date){console.error('usage: node scripts/tally.js <YYYY-MM-DD> [--check|--write] [--sources "A,B"] [--all]');process.exit(2)}
  try{
    if(args.includes('--check')){
      const r=check(date,args);console.log(`tally --check ${date} (scope: ${r.scope.join(', ')})`);r.lines.forEach(l=>console.log('  '+l));
      if(!r.ok){r.errs.forEach(e=>console.error('MISMATCH '+e));process.exit(1)}console.log('OK: edition sourceTally matches logs');
    }else if(args.includes('--write')){
      const rows=compute(date),want=scope(date,rows,args),f=path.join(root,'data/editions',date+'.json');
      const ed=JSON.parse(fs.readFileSync(f,'utf8'));ed.sourceTally=ed.sourceTally||[];
      for(const s of want){const c=rows.find(r=>r.source===s);if(!c)continue;let e=ed.sourceTally.find(t=>t.source===s);
        if(!e){e={source:s,scanned:0,used:0,status:'checked',note:'',publishers:[s]};ed.sourceTally.push(e)}
        e.scanned=c.scanned;e.used=c.used;e.status=c.status}
      fs.writeFileSync(f,JSON.stringify(ed,null,2)+'\n');console.log(`updated ${want.length} source(s) in ${f}`);
    }else console.log(JSON.stringify(compute(date).map(({_log,...r})=>({...r,discovered:_log.discovered,opened:_log.opened})),null,2));
  }catch(e){console.error(e.message);process.exit(2)}
}
