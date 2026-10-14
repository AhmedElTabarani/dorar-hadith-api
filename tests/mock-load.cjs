// Bounded offline test. global.fetch is replaced before app creation; no live provider traffic.
const { performance } = require('node:perf_hooks');
const supertest = require('supertest');
process.env.NODE_ENV='test';process.env.UPSTREAM_REQUESTS_PER_MINUTE='500';
let upstream=0;
global.fetch=async()=>{upstream++;await new Promise(resolve=>setTimeout(resolve,20));return Response.json({ahadith:{result:'<html><body>لا توجد نتائج</body></html>'}});};
const app=require('../app');
(async()=>{
 const times=[];
 for(let batch=0;batch<5;batch++) await Promise.all(Array.from({length:20},async()=>{const start=performance.now();const res=await supertest(app).get('/v1/api/hadith/search?value=offline-fixture');if(res.status!==200)throw Error('Unexpected status '+res.status);times.push(performance.now()-start);}));
 times.sort((a,b)=>a-b);if(upstream!==1)throw Error('Cache/single-flight regression: '+upstream);
 console.log(JSON.stringify({requests:times.length,concurrency:20,upstreamRequests:upstream,p95Ms:Math.round(times[Math.floor(times.length*.95)]),source:'synthetic mock only'}));
})().catch(e=>{console.error(e);process.exitCode=1;});
