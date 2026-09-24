import {decide as original,type Ask} from './controller';
import type {CubeData} from '../../src/lib/types';
export async function decide(state:CubeData,ask:Ask,previousTarget:string|null=null,recentActions:string[]=[]){
 return original(state,async request=>{
  if(request.questions.preparation){request=structuredClone(request);const s=request.state as any,c=s.corner.position,e=s.edge.position;
   // Geometric observations only. No option, applicability score or predicted outcome.
   request.state={corner:{layer:c.includes('U')?'upper':'bottom',atDRF:c==='DRF',atUFR:c==='UFR'},edge:{layer:e.includes('U')?'upper':'middle',atFR:e==='FR',atUF:e==='UF'}};
   request.questions.preparation.instructions='Choose the preparation from these geometric observations in the selected local frame. DRF is the destination corner slot, FR the destination edge slot. Test extraction before alignment or choosing a routine. Both pieces must satisfy a routine reference.';
   request.questions.preparation.criteria={
    'extract-corner':'corner.layer=bottom and corner.atDRF=false.',
    'extract-edge':'corner is upper or atDRF=true; edge.layer=middle and edge.atFR=false.',
    'align-corner':'corner.layer=upper and corner.atUFR=false; edge is upper or atFR=true.',
    'align-edge':'corner.atDRF=true; edge.layer=upper and edge.atUF=false.',
    routine:'Either (corner.atUFR=true AND (edge.layer=upper OR edge.atFR=true)), OR (corner.atDRF=true AND (edge.atUF=true OR edge.atFR=true)).',
    reconsider:'No combination above applies.'
   };
  }return ask(request);
 },previousTarget,recentActions);
}
