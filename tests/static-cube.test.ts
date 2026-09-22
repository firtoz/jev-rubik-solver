import {test,expect} from 'bun:test';
import {staticCubeAxes} from '../src/components/StaticCube';
import {netSlots} from '../src/lib/cube-encoding';
test('static 3D sticker coordinates agree with every unfolded slot',()=>{
 for(const [face,slots] of Object.entries(netSlots)) {
  const a=staticCubeAxes[face];
  slots.forEach((slot,i)=>{
   const coordinates=a.normal.map((n,j)=>n*1.501+a.right[j]*(i%3-1)+a.down[j]*(Math.floor(i/3)-1));
   const faces=coordinates.map((v,j)=>Math.abs(v)<.5?'':j===0?(v>0?'R':'L'):j===1?(v>0?'U':'D'):(v>0?'F':'B')).join('');
   expect([...faces].sort()).toEqual([...slot].sort());
  });
 }
});
