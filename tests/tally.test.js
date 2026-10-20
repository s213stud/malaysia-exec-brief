const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path');
const T=require('../scripts/tally');const logs=path.resolve(__dirname,'../logs');
const dates=fs.existsSync(logs)?fs.readdirSync(logs).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)):[];
for(const d of dates)test(`tally matches edition for logged sources ${d}`,()=>{const r=T.check(d,[]);assert.deepStrictEqual(r.errs,[])});
test('used counts distinct itemIds',()=>{const rows=T.compute('2026-10-20');const b=rows.find(r=>r.source==='Bursa announcements');if(b)assert.strictEqual(b.used,new Set(b._log.itemIds).size)});
