import {decide as original,type Ask} from './controller';
import type {CubeData} from '../../src/lib/types';
export async function decide(state:CubeData,ask:Ask,previousTarget:string|null=null,recentActions:string[]=[]){
 return original(state,async request=>{
  if(request.questions.preparation){
   request=structuredClone(request);const s=request.state as any;
   request.state={cornerPosition:s.corner.position,edgePosition:s.edge.position};
   request.questions.preparation.instructions='Choose the preparation using both current positions. Test extraction before alignment or routine selection. A corner at UFR does not make a pair ready if its edge is still in a different middle slot.';
   request.questions.preparation.criteria={
    'extract-corner':'cornerPosition is DBR, DLB or DFL. Extract this corner from its present bottom slot.',
    'extract-edge':'cornerPosition is UFR, URB, UBL, ULF or DRF, AND edgePosition is BR, BL or FL. Extract this edge from its present middle slot.',
    'align-corner':'cornerPosition is URB, UBL or ULF, AND edgePosition is UF, UR, UB, UL or FR. Rotate the corner to UFR.',
    'align-edge':'cornerPosition is DRF, AND edgePosition is UR, UB or UL. Rotate the edge to UF.',
    routine:'cornerPosition is UFR AND edgePosition is UF, UR, UB, UL or FR; OR cornerPosition is DRF AND edgePosition is UF or FR.',
    reconsider:'None of the listed combinations matches both positions.'
   };
  }
  return ask(request);
 },previousTarget,recentActions);
}
