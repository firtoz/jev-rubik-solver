process.env.RUBIK_BUDGET_USD='1';
// Some pure evaluator tests import modules that also export live runners.
// Isolate the ledger before any module can initialise the shared store.
process.env.RUBIK_DB=`/tmp/rubik-suite-${crypto.randomUUID()}.sqlite`;
process.env.TYPESAFE_API_KEY='test-only-credential';
const realFetch=globalThis.fetch;
globalThis.fetch=((input:any,init:any)=>{
 const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;
 if(new URL(url).hostname==='api.typesafe.ai')return Promise.reject(new Error('Live JEV requests are disabled in unit tests; supply a mock.'));
 return realFetch(input,init);
}) as typeof fetch;
