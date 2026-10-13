/* Pure calculation and import/export functions. Also loadable with Node for tests. */
(function(root){
 'use strict';
 const KEYS=['hunger','satisfaction','fullness','prospective'];
 const TIMES=['pre','post','post15'];
 const EXERCISE_TIMES=[5,10,15,20];
 const version=1;
 const mean=values=>{const v=values.filter(n=>Number.isFinite(n));return v.length?v.reduce((a,b)=>a+b,0)/v.length:null};
 const n=v=>v===''||v===null||v===undefined?null:(Number.isFinite(Number(v))?Number(v):null);
 const round=(v,d=1)=>v===null||!Number.isFinite(v)?null:Number(v.toFixed(d));
 const predHR=age=>{const a=n(age);return a!==null&&a>=16&&a<=100?220-a:null};
 const targetHR=(age,intensity)=>{const max=predHR(age);return max===null?null:round(max*(intensity==='high'?.85:.6));};
 const diff=(a,b)=>{const x=n(a),y=n(b);return x!==null&&y!==null?round(x-y):null;};
 const id=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():('lab-'+Date.now()+'-'+Math.random().toString(36).slice(2));
 const newSession=()=>({id:id(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),participantId:'',age:'',mode:'cycle',intensity:'moderate',screened:false,consented:false,appetite:Object.fromEntries(TIMES.map(t=>[t,Object.fromEntries(KEYS.map(k=>[k,null]))])),exercise:{rest:null,points:Object.fromEntries(EXERCISE_TIMES.map(t=>[t,{hr:null,rpe:null}]))},reflections:Object.fromEntries([1,2,3,4,5,6].map(k=>['q'+k,'']))});
 function calculate(s){
  const max=predHR(s.age),prescribed=s.intensity==='high'?85:60;
  const hrs=EXERCISE_TIMES.map(t=>n(s.exercise?.points?.[t]?.hr));
  const rpes=EXERCISE_TIMES.map(t=>n(s.exercise?.points?.[t]?.rpe));
  const avgHR=mean(hrs),avgRPE=mean(rpes);
  const actual=max!==null&&avgHR!==null?round(avgHR/max*100):null;
  const changes=Object.fromEntries(KEYS.map(k=>[k,{immediate:diff(s.appetite?.post?.[k],s.appetite?.pre?.[k]),after15:diff(s.appetite?.post15?.[k],s.appetite?.pre?.[k])}]));
  return {max,prescribed,target60:max===null?null:round(max*.6),target85:max===null?null:round(max*.85),target:targetHR(s.age,s.intensity),avgHR:round(avgHR),avgRPE:round(avgRPE),actual,offset:actual===null?null:round(actual-prescribed),changes,nHR:hrs.filter(x=>x!==null).length,nRPE:rpes.filter(x=>x!==null).length};
 }
 function clampNumeric(value,min,max){if(value===null||value===undefined||value==='')return null;const v=Number(value);return Number.isFinite(v)&&v>=min&&v<=max?v:null;}
 function serialiseCSVRow(values){return values.map(v=>{const raw=v===null||v===undefined?'':String(v);const text=typeof v==='string'&&/^[\s]*[=+@\-\t\r]/.test(raw)?"'"+raw:raw;return '"'+text.replace(/"/g,'""')+'"';}).join(',');}
 function csvRows(sessions){
  const headers=['Session ID','Anonymous participant ID','Date created','Age (years)','Exercise mode','Protocol','Predicted HRmax (bpm)','Target HR (bpm)','Prescribed %HRmax','Resting HR (bpm)',...EXERCISE_TIMES.flatMap(t=>[`HR at ${t} min (bpm)`,`RPE at ${t} min`]),'Mean exercise HR (bpm)','Mean exercise RPE','Actual %HRmax','Actual minus prescribed (% points)',...KEYS.flatMap(k=>[`${k} pre (0-100)`,`${k} immediately post (0-100)`,`${k} 15 min post (0-100)`,`${k} immediate change`,`${k} 15 min change`]),'Health screening confirmed','Consent confirmed'];
  const rows=sessions.map(s=>{const c=calculate(s);return [s.id,s.participantId,s.createdAt,s.age,s.mode,s.intensity,c.max,c.target,c.prescribed,s.exercise?.rest,...EXERCISE_TIMES.flatMap(t=>[s.exercise?.points?.[t]?.hr,s.exercise?.points?.[t]?.rpe]),c.avgHR,c.avgRPE,c.actual,c.offset,...KEYS.flatMap(k=>[s.appetite?.pre?.[k],s.appetite?.post?.[k],s.appetite?.post15?.[k],c.changes[k].immediate,c.changes[k].after15]),s.screened?'Yes':'No',s.consented?'Yes':'No'];});
  return '\uFEFF'+[headers,...rows].map(serialiseCSVRow).join('\r\n')+'\r\n';
 }
 const text=(v,max=10000)=>typeof v==='string'?v.slice(0,max):'';
 function sanitiseSession(x){
  if(!x||typeof x!=='object'||Array.isArray(x))throw Error('An imported record must be an object.');
  const s=newSession();
  s.id=typeof x.id==='string'&&/^[a-zA-Z0-9_-]{6,90}$/.test(x.id)?x.id:s.id;
  s.createdAt=typeof x.createdAt==='string'&&!isNaN(Date.parse(x.createdAt))?x.createdAt:s.createdAt;
  s.updatedAt=typeof x.updatedAt==='string'&&!isNaN(Date.parse(x.updatedAt))?x.updatedAt:s.updatedAt;
  s.participantId=text(x.participantId,60);
  s.age=x.age===''?'':(clampNumeric(x.age,16,100)??'');
  s.mode=['cycle','treadmill'].includes(x.mode)?x.mode:'cycle';
  s.intensity=['moderate','high'].includes(x.intensity)?x.intensity:'moderate';
  s.screened=x.screened===true;s.consented=x.consented===true;
  for(const t of TIMES)for(const k of KEYS)s.appetite[t][k]=clampNumeric(x.appetite?.[t]?.[k],0,100);
  s.exercise.rest=clampNumeric(x.exercise?.rest,25,240);
  for(const t of EXERCISE_TIMES){s.exercise.points[t].hr=clampNumeric(x.exercise?.points?.[t]?.hr,25,240);s.exercise.points[t].rpe=clampNumeric(x.exercise?.points?.[t]?.rpe,0,100);}
  for(let q=1;q<=6;q++)s.reflections['q'+q]=text(x.reflections?.['q'+q]);
  return s;
 }
 function parseImport(value){const data=typeof value==='string'?JSON.parse(value):value;
  if(!data||data.version!==version||!Array.isArray(data.sessions)||!data.sessions.length||data.sessions.length>500)throw Error('Import a version 1 laboratory backup containing 1 to 500 records.');
  const result=data.sessions.map(sanitiseSession), seen=new Set();for(const item of result){if(seen.has(item.id))item.id=id();seen.add(item.id);}return result;
 }
 function completion(s){
  const appetiteComplete=t=>KEYS.every(k=>n(s.appetite?.[t]?.[k])!==null);
  return {pre:appetiteComplete('pre'),post:appetiteComplete('post')&&appetiteComplete('post15'),preparation:Boolean(s.participantId.trim()&&predHR(s.age)!==null&&s.screened&&s.consented),exercise:EXERCISE_TIMES.every(t=>n(s.exercise.points[t].hr)!==null&&n(s.exercise.points[t].rpe)!==null)&&n(s.exercise.rest)!==null,reflection:[1,2,3,4,5,6].every(q=>Boolean(s.reflections['q'+q].trim()))};
 }
 const API={KEYS,TIMES,EXERCISE_TIMES,version,n,round,mean,predHR,targetHR,diff,newSession,calculate,clampNumeric,csvRows,serialiseCSVRow,sanitiseSession,parseImport,completion};
 if(typeof module!=='undefined'&&module.exports)module.exports=API;
 root.AppetiteCore=API;
})(typeof window!=='undefined'?window:globalThis);

