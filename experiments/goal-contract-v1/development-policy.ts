import {goalObservation} from '../../src/server/goal-policy';
import {facts,pieces} from '../../src/lib/cube';
import type {Run,JevRequest} from '../../src/lib/types';
export const goalDefinitions={
 daisy:'Gather yellow edges as top petals. Choose when cross=false and uncollectedYellowEdges>0. Preserve solved bottom edges and existing petals.',
 cross:'Transfer yellow-up petals to their bottom homes. Choose when cross=false and uncollectedYellowEdges=0. This controller only transfers petals; it cannot extract or gather missing petals.',
 'first-layer':'Solve yellow corners. Choose when cross=true and firstLayer=false.',
 'middle-layer':'Solve middle edges. Choose when firstLayer=true and middle=false.',
 'top-cross':'Orient white top edges. Choose when middle=true and topCross=false.',
 'top-orientation':'Orient white top corners. Choose when middle=true, topCross=true and topOriented=false.',
 'top-corners':'Place or align white corners. Choose when middle=true, topCross=true, topOriented=true and cornersPlaced=false.',
 'top-edges':'Place or align remaining white edges. Choose when middle=true, topCross=true, topOriented=true, cornersPlaced=true and solved=false.',
};
export function fullGoalRequest(run:Run,variant:'compact'|'detailed'='compact'):JevRequest{
 const completed=facts(run.state);
 const uncollectedYellowEdges=pieces(run.state).filter(p=>p.kind==='edge'&&'yellow'in p.stickers&&p.stickers.yellow!=='U'&&!p.solved).length;
 const state=variant==='detailed'?{...goalObservation(run.state,run.history.length?run.stage:null,run.history),uncollectedYellowEdges}:{completed,uncollectedYellowEdges,previousGoal:run.history.length?run.stage:null,recentActions:run.history.slice(-2)};
 return {model:'jev-1.13.0',state,questions:{goal:{type:'choice',instructions:'Choose the goal whose prerequisites match the current measurements. Apply the fixed definitions in the options. uncollectedYellowEdges counts yellow edges that are neither yellow-up petals nor solved bottom edges. PreviousGoal is memory, not an instruction; choose using present conditions. Completion flags describe structures, not recommendations. The program stops separately when all pieces are solved.',criteria:goalDefinitions}}};
}
