// Fixed learned routines, not solutions generated for a live cube.
// CubeSkills PLL sheet by Feliks Zemdegs and Andy Klise. Bracketed AUFs retained.
export const source='https://www.cubeskills.com/uploads/pdf/tutorials/pll-algorithms.pdf';
export const references=[
{id:'Ua',notation:"R U' R U R U R U' R' U' R2"},
{id:'Ub',notation:"R2 U R U R' U' R' U' R' U R'"},
{id:'H',notation:'M2 U M2 U2 M2 U M2'},
{id:'Z',notation:"M2 U M2 U M' U2 M2 U2 M' U2"},
{id:'Aa',notation:"x R' U R' D2 R U' R' D2 R2 x'"},
{id:'Ab',notation:"x R2 D2 R U R' D2 R U' R x'"},
{id:'E',notation:"x' R U' R' D R U R' D' R U R' D R U' R' D' x"},
{id:'Ga',notation:"R2 U R' U R' U' R U' R2 D U' R' U R D' U"},
{id:'Gb',notation:"F' U' F R2 u R' U R U' R u' R2"},
{id:'Gc',notation:"R2 U' R U' R U R' U R2 D' U R U' R' D U'"},
{id:'Gd',notation:"D' R U R' U' D R2 U' R U' R' U R' U R2 U"},
{id:'Ra',notation:"R U' R' U' R U R D R' U' R D' R' U2 R' U'"},
{id:'Rb',notation:"R' U2 R U2 R' F R U R' U' R' F' R2 U'"},
{id:'Ja',notation:"R' U L' U2 R U' R' U2 R L U'"},
{id:'Jb',notation:"R U R' F' R U R' U' R' F R2 U' R' U'"},
{id:'T',notation:"R U R' U' R' F R2 U' R' U' R U R' F'"},
{id:'F',notation:"R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R"},
// Final y' restores the reference frame after the sheet's in-algorithm regrip.
{id:'V',notation:"R' U R' U' y R' F' R2 U' R' U R' F R F y'"},
{id:'Y',notation:"F R U' R' U' R U R' F' R U R' U' R' F R F'"},
{id:'Na',notation:"R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'"},
{id:'Nb',notation:"R' U L' U2 R U' L R' U L' U2 R U' L U"},
];
export function outerTurns(notation:string){
 let frame:Record<string,string>={U:'U',D:'D',F:'F',B:'B',R:'R',L:'L'};const out:string[]=[];
 const expanded=notation.split(' ').flatMap(m=>m==='u'?['y','D']:m==="u'"?["y'","D'"]:m==='M2'?['x2','R2','L2']:m==="M'"?['x',"R'",'L']:[m]);
 for(const m of expanded){
  if(['x','y'].includes(m[0])){
   for(let i=0;i<(m.endsWith('2')?2:m.endsWith("'")?3:1);i++){
    const prev={...frame},mapping=m[0]==='x'?{U:'F',F:'D',D:'B',B:'U'}:{F:'R',R:'B',B:'L',L:'F'};
    for(const [to,from] of Object.entries(mapping))frame[to]=prev[from!];
   }
  }else{if(!frame[m[0]])throw Error('Unsupported move '+m);out.push(frame[m[0]]+m.slice(1));}
 }
 if(Object.entries(frame).some(([k,v])=>k!==v))throw Error('Nonidentity reference frame');
 return out.join(' ');
}
