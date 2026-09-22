export async function withTransportRetry<T>(dispatch:()=>Promise<T>,deadline:number,onRetry:(error:string)=>void,wait:(ms:number)=>Promise<void>=ms=>new Promise(resolve=>setTimeout(resolve,ms))):Promise<T>{
 for(let attempt=0;;attempt++){
  if(Date.now()>=deadline)throw new Error('Attempt cap');
  try{return await dispatch();}catch(error){
   const message=String(error);
   const transient=['Error: JEV HTTP 429','Error: JEV HTTP 529','Error: Execution cancelled','Error: JEV network timeout/failure'].includes(message);
   if(attempt>=1||!transient||Date.now()+1000>=deadline)throw error;
   onRetry(message);await wait(1000);
  }
 }
}
