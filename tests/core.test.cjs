const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../site/core.js');
test('predicted HRmax and target intensities',()=>{
 assert.equal(C.predHR(20),200);
 assert.equal(C.targetHR(20,'moderate'),120);
 assert.equal(C.targetHR(20,'high'),170);
 assert.equal(C.predHR(''),null);
});
test('four exercise checkpoints average correctly',()=>{
 const s=C.newSession();s.age=20;s.intensity='high';
 [5,10,15,20].forEach((t,i)=>{s.exercise.points[t].hr=[160,168,172,180][i];s.exercise.points[t].rpe=[11,12,13,14][i];});
 const c=C.calculate(s);
 assert.equal(c.avgHR,170);assert.equal(c.avgRPE,12.5);assert.equal(c.actual,85);assert.equal(c.offset,0);
});
test('VAS changes include valid zero and preserve missing values',()=>{
 const s=C.newSession();s.appetite.pre.hunger=0;s.appetite.post.hunger=25;s.appetite.post15.hunger=0;
 const c=C.calculate(s);
 assert.equal(c.changes.hunger.immediate,25);assert.equal(c.changes.hunger.after15,0);assert.equal(c.changes.fullness.immediate,null);
});
test('missing exercise values are not treated as zero',()=>{
 const s=C.newSession();s.age=20;s.exercise.points[5].hr=130;s.exercise.points[5].rpe=12;
 const c=C.calculate(s);assert.equal(c.avgHR,130);assert.equal(c.nHR,1);assert.equal(c.avgRPE,12);
});
test('CSV includes all appetite variables and exercise checkpoints',()=>{
 const csv=C.csvRows([C.newSession()]);
 assert.match(csv,/prospective pre \(0-100\)/i);assert.match(csv,/15 min post \(0-100\)/i);
 assert.match(csv,/HR at 20 min \(bpm\)/);assert.match(csv,/RPE at 5 min/);
});
test('CSV quotes and spreadsheet formula injection are escaped',()=>{
 const s=C.newSession();s.participantId='=HYPERLINK("x")';
 assert.match(C.csvRows([s]),/"'=HYPERLINK\(""x""\)"/);
});
test('JSON backup round trip preserves incomplete sessions',()=>{
 const s=C.newSession();s.participantId='P-A';s.appetite.pre.hunger=17;s.reflections.q6='Diet-only limitations';
 const [restored]=C.parseImport(JSON.stringify({version:1,sessions:[s]}));
 assert.equal(restored.appetite.pre.hunger,17);assert.equal(restored.reflections.q6,'Diet-only limitations');assert.equal(restored.appetite.post.hunger,null);
});
test('invalid version and impossible VAS rejected or cleared',()=>{
 assert.throws(()=>C.parseImport('{"version":2,"sessions":[]}'),/version 1/);
 const s=C.newSession();s.appetite.pre.hunger=200;
 assert.equal(C.parseImport({version:1,sessions:[s]})[0].appetite.pre.hunger,null);
});
test('multiple records remain independent',()=>{
 const a=C.newSession(),b=C.newSession();a.appetite.pre.hunger=30;b.appetite.pre.hunger=80;
 const result=C.parseImport({version:1,sessions:[a,b]});
 assert.notEqual(result[0].id,result[1].id);assert.equal(result[0].appetite.pre.hunger,30);assert.equal(result[1].appetite.pre.hunger,80);
});
