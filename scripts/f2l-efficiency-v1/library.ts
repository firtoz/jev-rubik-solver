// General learned routines, independent of any live state. Source: CubeSkills F2L sheet,
// https://www.cubeskills.com/uploads/pdf/tutorials/f2l.pdf (Zemdegs/Klise).
// Alternatives are retained as vocabulary candidates, not ranked against live outcomes.
import {mapAlg} from '../../src/lib/cube';
export const source='https://www.cubeskills.com/uploads/pdf/tutorials/f2l.pdf';
const notation=[
 "R U' R' y' U R' U2 R U2 R' U R",
 "U R U' R'", "y' U' R' U R", "y' R' U' R", "R U R'",
 "U' R U' R' U y' R' U' R", "y' U R' U' R U' R' U' R", "U' R U R' U R U R'",
 "U' R U2 R' U y' R' U' R", "R' U2 R2 U R2 U R", "y' U R' U2 R U' y R U R'",
 "R U' R' U R U' R'", "U2 R U' R'", "y' R' U R U' R' U' R", "U' R U' R' U R U R'",
 "U' R U R' U2 R U' R'", "y' U R' U' R U2 R' U R",
 "U' R U2 R' U2 R U' R'", "y' U R' U2 R U2 R' U R",
 "U R U2 R' U R U' R'", "y' U' R' U2 R U' R' U R",
 "U2 R U R' U R U' R'", "R U' R' U2 R U R'", "y' U2 R' U' R U' R' U R", "F' L' U2 L F",
 "y' R' U R U2 y R U R'", "R U R' U2 R U' R' U R U' R'",
 "R U' R' U2 y' R' U' R", "U F R U R' U' F' U R U' R'",
 "R U2 R' U' R U R'", "y' R' U2 R U R' U' R",
 "U R U' R' U' R U' R' U R U' R'", "R U R' U2 R U R' U' R U R'",
 "y' U' R' U R U R' U R U' R' U R", "F U R U' R' F' R U' R'",
 "U' F' R U R' U' R' F R", "R' F' R U R U' R' F",
 "U R U' R' U' F' U F", "U R U' R' F R' F' R",
 "R U' R' U R U' R'", "y' R' U R U' R' U R", "y' R' U' R U R' U' R",
 "R' F R F' U R U' R'", "R U R' U' R U R'",
 "R U' R' U y' R' U R", "U' R' F R F' R U' R'", "U R U' R' U R U' R' U R U' R'",
 "U' R U' R' U2 R U' R'", "U R U R' U2 R U R'",
 "U' R U R' U y' R' U' R", "U F' U' F U' R U R'",
 "R U' R' U' R U R' U2 R U' R'", "R U R' U' R U2 R' U' R U R'",
 "R U' R' U R U2 R' U R U' R'", "R U R' U2 R U' R' U R U R'",
 "F' U F U2 R U R' U R U' R'", "R U' R' F R U R' U' F' R U' R'",
 "R U R' U' R U' R' U2 y' R' U' R"
];
export function fixedNotation(text:string){let yaw=0;const out:string[]=[];for(const m of text.split(' ')){
 if(m[0]==='y'){yaw=(yaw+(m.endsWith("'")?3:m.endsWith('2')?2:1))%4;continue;}
 out.push(mapAlg(m,['F','R','B','L'][yaw]));
}return out.join(' ');}
export const library=[...new Set(notation.map(fixedNotation))].map((alg,i)=>({id:`f2l-${String(i+1).padStart(2,'0')}`,alg}));
