import {routines} from './policy';
import type {JevRequest,JevResponse} from '../../src/lib/types';
export async function decide(cornerPosition:string,edgePosition:string,extract:'corner'|'edge',ask:(r:JevRequest)=>Promise<JevResponse>){
 const opened=await ask({model:'jev-1.13.0',state:{currentPosition:extract==='corner'?cornerPosition:edgePosition},questions:{slot:{type:'choice',instructions:'Choose the slot containing the piece to extract. Use its current position, not its destination.',criteria:{F:'Corner DRF or edge FR.',R:'Corner DBR or edge BR.',B:'Corner DLB or edge BL.',L:'Corner DFL or edge FL.'}}}});
 const slot=opened.answers.slot.choice,partner=extract==='corner'?'edge':'corner',partnerPosition=partner==='corner'?cornerPosition:edgePosition;
 const options=routines.filter(r=>r.id.startsWith(slot+'-'));
 const response=await ask({model:'jev-1.13.0',state:{selectedSlot:slot,partner,partnerPosition},questions:{extraction:{type:'choice',instructions:'The selected slot must be opened. Choose the direction that does NOT send the target partner down into this slot. Compare partnerPosition to the incoming position described in each option. If the partner is already in its own bottom/middle home, either direction is safe. If both are safe, either is acceptable.',criteria:Object.fromEntries(options.map(r=>[r.id,partner==='corner'?`This direction puts the corner from ${r.trapsCornerFrom} into ${r.cornerSlot}. Choose only if partnerPosition is NOT ${r.trapsCornerFrom}.`:`This direction puts the edge from ${r.trapsEdgeFrom} into ${r.edgeSlot}. Choose only if partnerPosition is NOT ${r.trapsEdgeFrom}.`]))}}});
 return response.answers.extraction.choice;
}
