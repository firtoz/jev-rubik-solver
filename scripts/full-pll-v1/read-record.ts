import {readFileSync} from 'node:fs';
// Live runners persist synchronously but a separate reader can catch a truncated write.
// Retry reads only; never restart a run or dispatch an API call from verification.
export async function readRecord(path:string){
 let last:unknown;
 for(let attempt=0;attempt<30;attempt++){
  try{return JSON.parse(readFileSync(path,'utf8'));}
  catch(error){last=error;if(!(error instanceof SyntaxError))throw error;await new Promise(resolve=>setTimeout(resolve,100));}
 }
 throw last;
}
