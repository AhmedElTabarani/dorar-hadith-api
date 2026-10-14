const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const supertest = require('supertest');
process.env.NODE_ENV = 'test'; process.env.UPSTREAM_REQUESTS_PER_MINUTE = '500';
const app = require('../app');
const original = global.fetch;
after(() => { global.fetch = original; });
const block = id => `<div class="border-bottom"><div>1 - نص تجريبي لا يمثل حديثاً 2 - لا يحذف</div><div><strong>الراوي: <span>راوي اختبار</span></strong><strong>المحدث: <span>محدث اختبار</span></strong><strong>المصدر: <span>كتاب اختبار</span></strong><strong>الصفحة أو الرقم: <span>12</span></strong><strong>خلاصة حكم المحدث: <span>ليس بصحيح - اختبار</span></strong><a tag="${id}"></a><a view-card="book" card-link="12"></a><a view-card="mhd" card-link="34"></a><a xplain="56"></a><a href="/h/${id}?sims=1">مشابه</a></div></div>`;
const site = `<html><body><a aria-controls="home">النتائج 1</a><a aria-controls="specialist">0</a><section id="home">${block('abc')}</section><section id="specialist">لا توجد نتائج</section></body></html>`;
const api = `<div>1 - نص اختبار <em>منسق</em></div><div class="hadith-info">${['راوي','محدث','كتاب','12','حكم'].map(t => `<span class="info-subtitle">:</span>${t}`).join('')}</div>`;
const explanation = '<html><body><article>نص اختبار</article><div class="text-justify"></div><div>شرح تجريبي ليس محتوى علمياً</div></body></html>';
const book = '<h5>12 - كتاب اختبار</h5><span>مؤلف</span><span>محقق</span><span>ناشر</span><span>طبعة</span><span>1440</span>';
let calls = [];
global.fetch = async url => {
  calls.push(String(url));
  const u = new URL(url);
  if (u.pathname.includes('book-card')) return Response.json(book);
  if (u.pathname.includes('/mhd/')) return new Response('<html><body><h4>محدث اختبار</h4><p>تعريف اختبار</p></body></html>');
  if (u.pathname.includes('/sharh/')) return new Response(explanation);
  if (u.pathname.includes('dorar_api')) return Response.json({ ahadith: { result: api } });
  if (u.searchParams.has('alts')) return new Response(`<html><body>${block('abc')}${block('alt')}</body></html>`);
  if (u.searchParams.has('osoul')) return new Response(`<html><body>${block('abc')}<article></article><article><h5><span style="color:maroon">مصدر</span><span style="color:blue">سند</span> نص</h5></article></body></html>`);
  return new Response(site);
};
test('all 17 data routes return their documented shapes from synthetic fixtures', async () => {
  const routes = ['/api/hadith/search?value=اختبار','/site/hadith/search?value=اختبار','/site/hadith/abc','/site/hadith/similar/abc','/site/hadith/alternate/abc','/site/hadith/usul/abc','/site/sharh/search?value=اختبار','/site/sharh/56','/site/sharh/text/اختبار','/site/book/12','/site/mohdith/34', ...['book','degree','methodSearch','mohdith','rawi','zoneSearch'].map(k=>'/data/'+k)];
  for(const route of routes) { const res=await supertest(app).get('/v1'+encodeURI(route)); assert.equal(res.status,200,route+': '+JSON.stringify(res.body)); assert.ok(res.body.data,route); }
});
test('exact grading and internal numbering remain intact', async () => {
  const res=await supertest(app).get('/v1/site/hadith/search').query({value:'intact'});
  assert.equal(res.body.data[0].grade,'ليس بصحيح - اختبار'); assert.match(res.body.data[0].hadith,/2 - لا يحذف/); assert.equal(res.body.data[0].hadithId,'abc');
});
test('operation and HTML cache variants never cross-contaminate; explanation discovery does not fan out', async () => {
  const a=await supertest(app).get('/v1/api/hadith/search').query({value:'cache',removehtml:'false'});
  const b=await supertest(app).get('/v1/api/hadith/search').query({value:'cache',removehtml:'true'});
  assert.match(a.body.data[0].hadith,/<em>/); assert.doesNotMatch(b.body.data[0].hadith,/<em>/);
  const before=calls.length;
  const s=await supertest(app).get('/v1/site/sharh/search').query({value:'collision'});
  const h=await supertest(app).get('/v1/site/hadith/search').query({value:'collision'});
  assert.equal(s.body.data[0].sharhMetadata.id,'56'); assert.equal(s.body.data[0].hadith,undefined); assert.ok(h.body.data[0].hadith); assert.equal(calls.length-before,2);
});
test('search filters reject unknown parameters and forward canonical repeated arrays', async () => {
  assert.equal((await supertest(app).get('/v1/site/hadith/search?value=a&st=z')).status,400);
  assert.equal((await supertest(app).get('/v1/site/hadith/search?value=a&d[]=9')).status,400);
  assert.equal((await supertest(app).get('/v1/site/hadith/search?value=a&bogus=x')).status,400);
  const r=await supertest(app).get('/v1/site/hadith/search?value=filters&m[]=34&s[]=12&st=p&t=0'); assert.equal(r.status,200);
  const url=new URL(calls.at(-1)); assert.deepEqual(url.searchParams.getAll('m[]'),['34']); assert.deepEqual(url.searchParams.getAll('s[]'),['12']);
});
test('private service authentication is required when configured', async () => {
  process.env.SERVICE_API_KEY='unit-test-key';
  assert.equal((await supertest(app).get('/v1/data/book')).status,401);
  assert.equal((await supertest(app).get('/v1/data/book').set('X-Service-Key','unit-test-key')).status,200);
  assert.equal((await supertest(app).get('/health/live')).status,200);
  delete process.env.SERVICE_API_KEY;
});
test('known empty structure succeeds, changed markup fails, partial parse is explicit', async () => {
  const mock=global.fetch;
  try {
    global.fetch=async()=>Response.json({ahadith:{result:'<html><body>لا توجد نتائج</body></html>'}});
    const empty=await supertest(app).get('/v1/api/hadith/search?value=empty'); assert.equal(empty.status,200); assert.deepEqual(empty.body.data,[]);
    global.fetch=async()=>new Response('<html><body>login or changed markup</body></html>');
    assert.equal((await supertest(app).get('/v1/site/hadith/search?value=changed')).status,502);
    global.fetch=async()=>new Response(site.replace('</section>','<div class="border-bottom"></div></section>'));
    const partial=await supertest(app).get('/v1/site/hadith/search?value=partial'); assert.equal(partial.status,200); assert.equal(partial.body.metadata.partial,true);
  } finally {global.fetch=mock;}
});
test('deadline covers body reads and caller headers/signal are preserved', async () => {
  const fetcher=require('../utils/fetchWithTimeout'); const config=require('../config/config'); const mock=global.fetch; const timeout=config.fetchTimeout; config.fetchTimeout=20;
  try {
    global.fetch=async(url,options)=>{assert.equal(options.headers['X-Test'],'ok'); return new Response(new ReadableStream({start(controller){options.signal.addEventListener('abort',()=>controller.error(new Error('aborted')));}}));};
    await assert.rejects(fetcher('https://dorar.net/test',{headers:{'X-Test':'ok'}}),e=>e.statusCode===504);
  } finally {global.fetch=mock;config.fetchTimeout=timeout;}
});
test('canonical filter ordering and atomic cache metadata', async () => {
  const serialize=require('../utils/serializeQueryParams'); assert.equal(serialize({m:['2','1'],value:'a'}),serialize({value:'a',m:['1','2']}));
  const cache=require('../services/common/cache.service'); await cache.setCachedResponse('unit:atomic',[1],{partial:true}); const entry=await cache.getCachedResponse('unit:atomic'); assert.deepEqual(entry.data,[1]); assert.equal(entry.metadata.partial,true); assert.ok(entry.metadata.retrievedAt);
});
test('a stalled body reaches its deadline without other event-loop handles', () => {
  const { spawnSync } = require('node:child_process');
  const result = spawnSync(process.execPath, ['-e', `
    process.env.NODE_ENV = 'test';
    delete process.env.REDIS_URL;
    require('./config/config').fetchTimeout = 20;
    global.fetch = async (_url, { signal }) => new Response(new ReadableStream({
      start(controller) {
        signal.addEventListener('abort', () => controller.error(signal.reason), { once: true });
      }
    }));
    process.exitCode = 2;
    require('./utils/fetchWithTimeout')('https://dorar.net/test').catch(error => {
      if (error.statusCode === 504) process.exitCode = 0;
    });
  `], { cwd: require('node:path').resolve(__dirname, '..'), encoding: 'utf8', timeout: 5000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr || 'Process exited before the deadline rejected');
});
