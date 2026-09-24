// Static standard algorithms from CubeSkills 4-look-last-layer.pdf.
// Compiled once into fixed outer-face turns; no live state is used.
export const source='https://www.cubeskills.com/uploads/pdf/tutorials/4-look-last-layer.pdf';
export const references=[
 {id:'sune',stage:'orientation',notation:"R U R' U R U2 R'"},
 {id:'antisune',stage:'orientation',notation:"R U2 R' U' R U' R'"},
 {id:'U-OLL',stage:'orientation',notation:"R2 D R' U2 R D' R' U2 R'"},
 {id:'T-OLL',stage:'orientation',notation:"r U R' U' r' F R F'"},
 {id:'L-OLL',stage:'orientation',notation:"F' r U R' U' r' F R"},
 {id:'Pi-OLL',stage:'orientation',notation:"R U2 R2 U' R2 U' R2 U2 R"},
 {id:'H-OLL',stage:'orientation',notation:"R U R' U R U' R' U R U2 R'"},
 {id:'Ua-perm',stage:'edges',notation:"R U' R U R U R U' R' U' R2"},
 {id:'Ub-perm',stage:'edges',notation:"R2 U R U R' U' R' U' R' U R'"},
 {id:'H-perm',stage:'edges',notation:'M2 U M2 U2 M2 U M2'},
 // The sheet's Z sequence needs fixed final U2 to restore the corner frame.
 {id:'Z-perm',stage:'edges',notation:"M2 U M2 U M' U2 M2 U2 M' U2"},
];
export function outerTurns(notation:string){
 let frame:Record<string,string>={U:'U',D:'D',F:'F',B:'B',R:'R',L:'L'};const out:string[]=[];
 const cycle=(m:string)=>{const prev={...frame};for(const [to,from] of Object.entries({U:'F',F:'D',D:'B',B:'U'}))frame[to]=prev[from];};
 const expanded=notation.split(' ').flatMap(m=>m==='r'?['x','L']:m==="r'"?["x'","L'"]:m==='M2'?['x2','R2','L2']:m==="M'"?['x',"R'",'L']:m==='M'?["x'",'R',"L'"]:[m]);
 for(const m of expanded){if(m[0]==='x'){for(let i=0;i<(m.endsWith('2')?2:m.endsWith("'")?3:1);i++)cycle(m);}else out.push(frame[m[0]]+m.slice(1));}
 if(Object.entries(frame).some(([k,v])=>k!==v))throw Error('Non-identity final frame');return out.join(' ');
}
