const {test}=require('node:test');
const assert=require('node:assert/strict');
require('tsx/cjs');
const utils=require('../lib/utils.ts');
const {normalizeDashboardData}=require('../lib/normalize.ts');
const {transactionsToCsv}=require('../lib/finance-export.ts');
test('Brazilian and decimal amounts do not silently accept trailing junk',()=>{
 for(const [input,expected] of [['1.234,56',1234.56],['R$ 20,50',20.5],['12.50',12.5],['1.000',1000],['20abc',0],['1,2,3',0],['Infinity',0],['',0]]) assert.equal(utils.parseAmount(input),expected,input);
});
test('calendar validation handles leap years and nonexistent dates',()=>{
 for(const date of ['2024-02-29','2026-10-25'])assert.ok(utils.isISODate(date));
 for(const date of ['2026-02-29','2026-02-30','2026-13-01','2026-10-00','<img>'])assert.equal(utils.isISODate(date),false);
});
test('backup normalization repairs invalid dates and rejects unsafe links',()=>{
 const data=normalizeDashboardData({tasks:[{title:'test',due:'2026-02-30'}],media:[{title:'unsafe',url:'javascript:alert(1)'},{title:'valid',url:'https://example.com/video'}]});
 assert.ok(utils.isISODate(data.tasks[0].due));assert.equal(data.media.length,1);assert.equal(data.media[0].title,'valid');
});
test('YouTube previews require a real YouTube domain',()=>{
 assert.equal(utils.getYouTubeId('https://notyoutube.com/watch?v=abc'),null);
 assert.equal(utils.getYouTubeId('https://www.youtube.com/watch?v=abc'),'abc');
 assert.equal(utils.getYouTubeId('https://youtu.be/abc'),'abc');
});
test('daily completed tasks use the local calendar, not the UTC date',()=>{
 const original=process.env.TZ;process.env.TZ='America/Sao_Paulo';
 try {
  const date=new Date();date.setHours(23,30,0,0);
  assert.equal(utils.isDoneToday({done:true,completedAt:date.toISOString()}),true);
  assert.equal(utils.isDoneToday({done:true,completedAt:'invalid'}),false);
 } finally {if(original===undefined)delete process.env.TZ;else process.env.TZ=original;}
});
test('CSV preserves quotes, semicolons, line breaks, accents and neutralizes formulas',()=>{
 const csv=transactionsToCsv([{date:'2026-10-25',description:'=SUM(A1)\n"ação";',type:'despesa',category:'@formula',amount:12.5}]);
 assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes('"\'=SUM(A1)\n""ação"";"'));assert.ok(csv.includes('"\'@formula"'));assert.ok(csv.includes('"12,50"'));
 assert.equal(transactionsToCsv([]).split('\r\n').length,2);
});
