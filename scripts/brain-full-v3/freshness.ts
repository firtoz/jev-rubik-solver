import {readFileSync,writeFileSync} from 'node:fs';
import {cube3x3x3} from 'cubing/puzzles';
import {db} from '../../src/server/store';
const dir=process.argv[2]||'experiments/brain-full-v3-final';
const puzzle=await cube3x3x3.kpuzzle();
const key=(s:any)=>JSON.stringify([s.EDGES.pieces,s.EDGES.orientation,s.CORNERS.pieces,s.CORNERS.orientation]);
const starts=JSON.parse(readFileSync(`${dir}/fixtures.json`,'utf8')).map((f:any)=>({id:f.id,key:key(puzzle.defaultPattern().applyAlg(f.scramble).patternData)}));
const prior=new Map<string,string>();let files=0;
for await(const file of new Bun.Glob('**/*fixtures*.json').scan('experiments')){
 const path='experiments/'+file;if(path===`${dir}/fixtures.json`)continue;
 const data=JSON.parse(readFileSync(path,'utf8'));if(!Array.isArray(data))continue;files++;
 for(const fixture of data){
  if(fixture.state?.EDGES&&fixture.state?.CORNERS)prior.set(key(fixture.state),path);
  if(typeof fixture.scramble==='string')prior.set(key(puzzle.defaultPattern().applyAlg(fixture.scramble).patternData),path);
 }
}
const stored=db.query("SELECT DISTINCT json_extract(json,'$.scramble') scramble FROM runs WHERE COALESCE(json_extract(json,'$.split'),'')<>?").all(dir.split('/').at(-1)!) as {scramble:string}[];
for(const row of stored)if(typeof row.scramble==='string')prior.set(key(puzzle.defaultPattern().applyAlg(row.scramble).patternData),'prior run ledger');
const overlaps=starts.filter((s:any)=>prior.has(s.key)).map((s:any)=>({id:s.id,prior:prior.get(s.key)}));
const report={starts:starts.length,unique:new Set(starts.map((s:any)=>s.key)).size,priorFixtureFiles:files,priorRunScrambles:stored.length,priorDistinctStates:prior.size,overlaps,method:'Independent cubing reconstruction and canonical edge/corner permutation+orientation arrays; compare every saved fixture file excluding this dataset, plus every other run’s recorded starting scramble.'};
writeFileSync(`${dir}/freshness-verification.json`,JSON.stringify(report,null,2));
if(report.unique!==report.starts||overlaps.length)throw new Error('Starting states overlap');console.log(JSON.stringify(report));
