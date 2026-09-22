// Presentation aliases only. Recorded question keys, criteria and policy IDs stay exact.
// PLL: https://www.cubeskills.com/uploads/pdf/tutorials/pll-algorithms.pdf
// OLL: https://www.cubeskills.com/uploads/pdf/tutorials/oll-algorithms.pdf
export const algorithmLabels:Record<string,string>={
 sune:'Sune',antisune:'Anti-Sune','corner-permute':'T-perm',
 'edge-cycle':'Ua-perm','edge-cycle-inverse':'Ub-perm',
 'right-trigger':'Right trigger','left-trigger':'Left trigger',
 'corner-insert':'Right corner insertion','corner-insert-left':'Left corner insertion',
 'corner-front-right':'Front-right corner insertion','corner-front-left':'Front-left corner insertion',
 'middle-right':'Right middle-layer insertion','middle-left':'Left middle-layer insertion',
 'orient-edges':'Top-edge orientation (line)','orient-elbow':'Top-edge orientation (L-shape)',
};
export function algorithmLabel(id:string){return algorithmLabels[id]||id;}
export const namedAlgorithms=new Set(['sune','antisune','corner-permute','edge-cycle','edge-cycle-inverse']);
