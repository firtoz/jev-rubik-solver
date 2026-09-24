import {decide as previous} from '../f2l-efficiency-v1/preparation-sequential';
import {request} from './policy';
export async function decide(...args:Parameters<typeof previous>){
 const [state,ask,previousTarget,recentActions]=args;
 return previous(state,r=>{
  if(!r.questions.turn)return ask(r);
  const s=r.state as {currentPosition:string;requiredPosition:string};
  return ask(request(s.currentPosition,s.requiredPosition,'relations'));
 },previousTarget,recentActions);
}
