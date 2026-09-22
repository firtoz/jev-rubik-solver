import {test,expect} from 'bun:test';
import {withTransportRetry} from '../scripts/brain-full-v3/transport';
const noWait=async()=>{};
for(const error of ['JEV HTTP 529','JEV HTTP 429','Execution cancelled','JEV network timeout/failure'])test(`bounded retry for ${error}`,async()=>{
 let calls=0;const retries:string[]=[];
 const value=await withTransportRetry(async()=>{if(++calls===1)throw new Error(error);return 'ok';},Date.now()+5000,e=>retries.push(e),noWait);
 expect(value).toBe('ok');expect(calls).toBe(2);expect(retries).toHaveLength(1);
});
test('no third request, retry after deadline, or retry for a model/schema error',async()=>{
 let calls=0;const send=async()=>{calls++;throw new Error('Execution cancelled');};
 await expect(withTransportRetry(send,Date.now()+5000,()=>{},noWait)).rejects.toThrow('cancelled');expect(calls).toBe(2);
 calls=0;await expect(withTransportRetry(send,Date.now()-1,()=>{},noWait)).rejects.toThrow('cap');expect(calls).toBe(0);
 calls=0;await expect(withTransportRetry(async()=>{calls++;throw new Error('Malformed JEV response');},Date.now()+5000,()=>{},noWait)).rejects.toThrow('Malformed');expect(calls).toBe(1);
});
