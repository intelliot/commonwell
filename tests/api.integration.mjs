import assert from 'node:assert/strict';
const base=process.env.COMMONWELL_TEST_URL||'http://127.0.0.1:5173';
assert.ok(['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname),'Integration tests run only against a local development server');
const login=await fetch(base+'/signin-with-chatgpt?return_to=/',{redirect:'manual'});
const cookie=login.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');
assert.ok(cookie,'Local development sign-in must provide a cookie');
async function call(path,method='GET',body,extra={}){const r=await fetch(base+'/api/v1/'+path,{method,headers:{cookie,origin:base,'Content-Type':'application/json',...extra},body:body?JSON.stringify(body):undefined});const text=await r.text();let data;try{data=JSON.parse(text);}catch{data={error:text};}return {status:r.status,data};}
const anonymous=await fetch(base+'/api/v1/account');assert.equal(anonymous.status,401);
const forged=await fetch(base+'/api/v1/account',{headers:{'oai-authenticated-user-id':'other-user','oai-authenticated-user-email':'other@example.test'}});assert.equal(forged.status,401,'Client-supplied identity must not authenticate');
const tooLarge=await fetch(base+'/api/v1/profile',{method:'PUT',headers:{cookie,origin:base,'Content-Type':'application/json'},body:JSON.stringify({displayName:'é'.repeat(26000),recognition:false})});assert.equal(tooLarge.status,413);
const invalid=await fetch(base+'/api/v1/profile',{method:'PUT',headers:{cookie,origin:base,'Content-Type':'application/json'},body:'{'});assert.equal(invalid.status,400);
const missingOrigin=await fetch(base+'/api/v1/profile',{method:'PUT',headers:{cookie,'Content-Type':'application/json'},body:JSON.stringify({displayName:'Synthetic member',recognition:false})});assert.equal(missingOrigin.status,403);

for(const kind of ['card','certificate','statement']) {
  const privateDownload=await fetch(base+'/api/v1/download/'+kind);assert.equal(privateDownload.status,401);
  const sample=await fetch(base+'/api/v1/download/'+kind+'?sample=1');assert.equal(sample.status,200);
  assert.match(sample.headers.get('content-disposition'),new RegExp('attachment; filename="commonwell-sample-'+kind));
  assert.match(sample.headers.get('cache-control'),/no-store/);
  const sampleBody=await sample.text();
  if(kind!=='statement')assert.match(sampleBody,/SAMPLE/);else assert.match(sampleBody,/year,category,amount/);
  const own=await fetch(base+'/api/v1/download/'+kind,{headers:{cookie}});assert.equal(own.status,200);
  assert.match(own.headers.get('content-disposition'),new RegExp('attachment; filename="commonwell-'+kind));
  if(kind!=='statement')assert.ok(!(await own.text()).includes('SAMPLE'));
}
assert.equal((await call('contributions','POST',{year:1901,category:'Other',amountCents:100},{origin:'https://untrusted.example'})).status,403);
let before=(await call('account')).data;
const testYears=[1901,1902,1903];assert.ok(!before.contributions.some(x=>testYears.includes(x.year)),'Test years must be unused');
const added=await call('contributions','POST',{year:1901,category:'Other',amountCents:10001});assert.equal(added.status,200);
const id=added.data.contributions.find(x=>x.year===1901).id;
assert.equal((await call('contributions','POST',{year:1901,category:'Other',amountCents:1})).status,409);
const updated=await call('contributions/'+id,'PUT',{year:1901,category:'Other',amountCents:12345});assert.equal(updated.data.contributions.find(x=>x.id===id).amountCents,12345);
const conflicting=await call('contributions/import','POST',{entries:[{year:1902,category:'Other',amountCents:200},{year:1901,category:'Other',amountCents:200}]});assert.equal(conflicting.status,409);
assert.ok(!(await call('account')).data.contributions.some(x=>x.year===1902),'Conflicting batch must roll back all rows');
assert.equal((await call('contributions/import','POST',{entries:[{year:1902,category:'Other',amountCents:200},{year:1903,category:'Property',amountCents:300}]})).status,200);
assert.equal((await call('contributions/does-not-exist','DELETE')).status,404);
const prevSaved=before.interests.includes('lounge');
assert.ok((await call('interests','PUT',{rewardId:'lounge',saved:true})).data.interests.includes('lounge'));
await call('interests','PUT',{rewardId:'lounge',saved:prevSaved});
const profile=before.profile;
await call('profile','PUT',{displayName:profile.displayName,recognition:true});
const community=(await call('community')).data;assert.ok(community.some(x=>x.displayName===profile.displayName));assert.ok(community.every(x=>!('total' in x)&&!('userId' in x)&&!('amountCents' in x)));
await call('profile','PUT',{displayName:profile.displayName,recognition:profile.recognition});
const cleanup=(await call('account')).data.contributions.filter(x=>testYears.includes(x.year));for(const row of cleanup)assert.equal((await call('contributions/'+row.id,'DELETE')).status,200);
assert.equal((await call('account')).data.contributions.length,before.contributions.length);
console.log('PASS: authentication, protected downloads, sample labeling, origin protection, CRUD, duplicate rejection, atomic CSV import, saved perks, opt-in recognition, privacy projection, and cleanup.');
