import { colors, pieces } from './cube';
import type { CubeData } from './types';
// Each face is viewed from outside. U is above F; D below F in the unfolded net.
export const netSlots: Record<string, string[]> = {
  U: ['UBL','UB','URB','UL','U','UR','ULF','UF','UFR'],
  L: ['UBL','UL','ULF','BL','L','FL','DLB','DL','DFL'],
  F: ['ULF','UF','UFR','FL','F','FR','DFL','DF','DRF'],
  R: ['UFR','UR','URB','FR','R','BR','DRF','DR','DBR'],
  B: ['URB','UB','UBL','BR','B','BL','DBR','DB','DLB'],
  D: ['DFL','DF','DRF','DL','D','DR','DLB','DB','DBR'],
};
export function netStickers(state: CubeData) {
  const decoded = pieces(state);
  return Object.fromEntries(Object.entries(netSlots).map(([face, slots]) => [face, slots.map(position => ({
    position,
    color: position.length === 1 ? colors[face] : Object.entries(decoded.find(p => p.position === position)!.stickers).find(([,direction]) => direction === face)![0],
  }))]));
}
