import { decideCrossIntention } from './cross-intention';
import { skillDecision, type Ask } from './skill-policy';
import type { Run, JevRequest } from '../lib/types';

export const extractionReferenceRule =
  'For this middle-edge EXTRACTION, use CURRENT position, not destination. Put the occupied slot at local FR. In the original fixed frame: current FR requires front F; current BR requires front R; current BL requires front B; current FL requires front L. Destination does not determine the extraction frame.';
export const extractionOperationRule =
  'When chosenIntention is EXTRACT, insert a replacement top edge into the CURRENT occupied slot to eject the trapped target. In these local coordinates, FR uses middle-right and FL uses middle-left. The target destination and the incoming replacement edge colors do not select the extraction side; those color conditions apply to INSERT. Preserve the solved bottom layer.';

// Routing follows model-selected goals/intentions only. It never classifies a
// cube case, computes a preferred option, simulates actions, or repairs answers.
export async function measuredSkillDecision(
  run: Run,
  model: string,
  ask: Ask,
  experience: unknown[],
  excludedTarget: string | null = null,
) {
  return skillDecision(
    run,
    model,
    async (original) => {
      const request = structuredClone(original);
      const state = request.state as any;
      if (run.stage === 'cross' && request.questions.target) {
        const selected = await ask({ ...request, questions: { target: request.questions.target } });
        const target = selected.answers.target.choice;
        const piece = state.stagePieces.find((p: any) => p.piece === target);
        if (!piece) throw new Error('Invalid target response');
        const intention = await decideCrossIntention(model, piece, ask);
        // Assemble earlier model choices for the existing pipeline. Actual individual
        // requests/native responses are persisted by ask; this is not a provider reply.
        return {
          ...selected,
          answers: {
            target: selected.answers.target,
            ['intent_' + target]: intention,
          },
        };
      }
      if (run.stage === 'middle-layer' && request.questions.target) {
        const selected=await ask({...request,questions:{target:request.questions.target}});
        const target=selected.answers.target.choice;
        const piece=state.stagePieces.find((p:any)=>p.piece===target);
        if(!piece) throw new Error('Invalid middle target response');
        const intention=await ask({model,state:{solved:piece.solved,currentLayer:piece.layer,sideStickersMatchingCenters:piece.sideStickersMatchingCenters},questions:{intention:{type:'choice',instructions:'Classify the chosen middle-layer edge. Trust solved: being in its destination SLOT is insufficient if flipped. If solved is true choose done. If solved is false and currentLayer is middle choose extract, even when it occupies its home slot. For an unsolved top edge choose insert if sideStickersMatchingCenters is nonempty, otherwise align.',criteria:{done:'solved=true',extract:'solved=false and currentLayer=middle',align:'solved=false, currentLayer=top, sideStickersMatchingCenters is empty',insert:'solved=false, currentLayer=top, sideStickersMatchingCenters is nonempty'}}}});
        return {...selected,answers:{target:selected.answers.target,['intent_'+target]:intention.answers.intention}};
      }
      if (request.questions.reference && run.stage === 'middle-layer' && state.intent === 'extract')
        request.questions.reference.instructions = extractionReferenceRule;
      if (
        request.questions.operation &&
        run.stage === 'middle-layer' &&
        state.chosenIntention === 'extract'
      ) {
        request.state = {
          frame: state.frame,
          target: { position: state.target.position, stickers: state.target.stickers },
          chosenIntention: 'extract',
          goal: 'Eject the trapped target into the U layer while preserving the solved bottom layer.',
        };
        request.questions.operation.instructions =
          'Choose one insertion algorithm that ejects the trapped target from its CURRENT middle slot. In these local coordinates FR requires middle-right; FL requires middle-left. Do not use destination or incoming edge colors to choose extraction. U turns do not move a middle-layer target.';
      }
      if (request.questions.reference && run.stage === 'cross' && state.intent === 'extract') {
        const p=state.referenceViews.F.target;
        request.state={target:{position:p.position,stickers:p.stickers},intent:'extract',frame:'Original fixed cube frame'};
        request.questions.reference.instructions='Choose the original face that will become the reference front for lifting this yellow edge. If its yellow sticker points F, R, B, or L, choose that same face. If yellow points D, use its CURRENT bottom slot: DF→F, DR→R, DB→B, DL→L. Ignore the final destination. This selects a notation frame, not a move.';
        request.questions.reference.criteria={F:'Original front becomes reference front',R:'Original right becomes reference front',B:'Original back becomes reference front',L:'Original left becomes reference front'};
      }
      if (request.questions.operation && run.stage === 'cross' && state.chosenIntention === 'extract') {
        request.state={currentLocalPosition:state.target.position,yellowStickerDirection:state.target.stickers.yellow};
        request.questions.operation.instructions='Choose the lift whose starting position AND yellow sticker direction match both input fields exactly. All listed algorithms have been mechanically verified to lift this target yellow-up while preserving other solved bottom cross edges. Their effects are guarantees from the skill reference; do not attempt to infer other pieces or require their observations. Coordinates are local to the selected frame.';
        request.questions.operation.criteria={
          'lift-bottom':'Starting position DF and yellow direction D. Lift with F2.',
          'cross-flip-bottom':'Starting position DF and yellow direction F. Lift with F L\' U2 L F\'.',
          'cross-lift-right':'Starting position FR and yellow direction F. Lift with R U R\'.',
          'cross-lift-left':'Starting position FL and yellow direction F. Lift with L\' U\' L.',
          'cross-flip-top-right':'Starting position UF and yellow direction F. Lift with F R U2 R\' F\'.',
          'cross-flip-top-left':'Starting position UF and yellow direction F. Lift with F\' L\' U2 L F.',
          reconsider:'None of the listed starting conditions matches both input fields.'
        };
      }
      if (run.stage === 'top-orientation' && request.questions.reference) {
        request.state = { whiteUpCount: state.referenceViews.F.whiteUpPositions.length,
          referenceViews: Object.fromEntries(Object.entries(state.referenceViews).map(([front,v]: [string,any])=>[front,Object.fromEntries(['ULF','UFR','URB','UBL'].map(position=>[position,v.stagePieces.find((p:any)=>p.position===position).stickers.white]))])) };
        request.questions.reference.instructions = 'Choose a reference for the beginner repeated-Sune method. Read whiteUpCount. With ZERO white-up corners choose a view where ULF white points L. With ONE choose a view where ULF white points U. With TWO choose a view where ULF white points F. These are staging rules; a Sune may temporarily leave the same number of oriented corners. Each view maps corner POSITION to white sticker DIRECTION. Do not use other corner colors or destinations.';
        request.questions.reference.criteria = Object.fromEntries(['F','R','B','L'].map(f=>[f,'Use referenceViews.'+f+' if its ULF entry matches the rule for whiteUpCount.']));
      }
      if (run.stage === 'top-orientation' && request.questions.operation) {
        request.state = { chosenIntention: state.chosenIntention,
          whiteUpCount: state.whiteUpPositions.length,
          corners: Object.fromEntries(['ULF','UFR','URB','UBL'].map(position=>[position,state.stagePieces.find((p:any)=>p.position===position).stickers.white])) };
        request.questions.operation.instructions = 'Choose the operation for the selected local frame. Beginner repeated-Sune staging: ZERO white-up corners requires white L at ULF; ONE requires white U at ULF; TWO requires white F at ULF. When the staging rule matches, choose sune, then observe again. This can require up to three Sune applications with new reference choices. Do not alternate Sune and its inverse just because the count did not increase. If the staging rule does not match, reconsider. All corners already U requires reconsider because this goal is complete.';
        request.questions.operation.criteria.sune='Repeated-Sune strategy: valid if whiteUpCount=0 and corners.ULF=L, OR whiteUpCount=1 and corners.ULF=U, OR whiteUpCount=2 and corners.ULF=F. Execute R U R\' U R U2 R\'. This is valid preparation even when it does not finish orientation in one application.';
        request.questions.operation.criteria.reconsider='No repeated-Sune staging condition matches, or all four corners are already oriented. Do not select this merely because more than one Sune may be needed.';
      }
      return ask(request);
    },
    experience,
    excludedTarget,
  );
}
