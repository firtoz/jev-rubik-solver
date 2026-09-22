import { useEffect, useRef, useState } from 'react';
import { netStickers } from '../lib/cube-encoding';
import type { CubeData } from '../lib/types';
const palette:Record<string,string>={white:'#f5f5ef',yellow:'#f4d542',green:'#57aa70',blue:'#5689d6',red:'#e06962',orange:'#f0a04b'};
// Face-local right/down axes match the unfolded net, all viewed from outside.
export const staticCubeAxes:Record<string,{normal:[number,number,number];right:[number,number,number];down:[number,number,number]}>= {
 F:{normal:[0,0,1],right:[1,0,0],down:[0,-1,0]}, B:{normal:[0,0,-1],right:[-1,0,0],down:[0,-1,0]},
 R:{normal:[1,0,0],right:[0,0,-1],down:[0,-1,0]}, L:{normal:[-1,0,0],right:[0,0,1],down:[0,-1,0]},
 U:{normal:[0,1,0],right:[1,0,0],down:[0,0,1]}, D:{normal:[0,-1,0],right:[1,0,0],down:[0,0,-1]},
};
export function StaticCube({state}:{state:CubeData}){
 const host=useRef<HTMLDivElement>(null),reset=useRef<()=>void>(()=>{});
 const [error,setError]=useState('');
 useEffect(()=>{
  let cancelled=false,dispose=()=>{};setError('');
  void Promise.all([import('three'),import('three/examples/jsm/controls/OrbitControls.js')]).then(([T,{OrbitControls}])=>{
   if(cancelled||!host.current)return;
   const element=host.current,scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.1,100);
   camera.position.set(6,4.6,7);camera.lookAt(0,0,0);
   const renderer=new T.WebGLRenderer({alpha:true,antialias:true});
   renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setClearColor(0xffffff,0);
   renderer.domElement.setAttribute('aria-label','Recorded cube. Drag or use arrow keys to rotate.');
   renderer.domElement.tabIndex=0;element.replaceChildren(renderer.domElement);
   const group=new T.Group();scene.add(group);
   const bodyGeometry=new T.BoxGeometry(2.98,2.98,2.98),bodyMaterial=new T.MeshBasicMaterial({color:'#253438'});
   group.add(new T.Mesh(bodyGeometry,bodyMaterial));
   const stickerGeometry=new T.PlaneGeometry(.91,.91);
   const materials=Object.fromEntries(Object.entries(palette).map(([name,color])=>[name,new T.MeshBasicMaterial({color})]));
   for(const [face,stickers] of Object.entries(netStickers(state))){
    const a=staticCubeAxes[face],normal=new T.Vector3(...a.normal);
    stickers.forEach(({color},i)=>{
     const sticker=new T.Mesh(stickerGeometry,materials[color]);
     sticker.position.copy(normal).multiplyScalar(1.501).addScaledVector(new T.Vector3(...a.right),i%3-1).addScaledVector(new T.Vector3(...a.down),Math.floor(i/3)-1);
     sticker.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),normal);group.add(sticker);
    });
   }
   const render=()=>renderer.render(scene,camera);
   const controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableZoom=false;controls.enableDamping=false;controls.addEventListener('change',render);controls.saveState();
   reset.current=()=>{group.rotation.set(0,0,0);controls.reset();render();};
   const key=(event:KeyboardEvent)=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
    event.preventDefault();if(event.key==='ArrowLeft')group.rotation.y-=.2;if(event.key==='ArrowRight')group.rotation.y+=.2;if(event.key==='ArrowUp')group.rotation.x-=.2;if(event.key==='ArrowDown')group.rotation.x+=.2;render();
   };
   renderer.domElement.addEventListener('keydown',key);
   const resize=()=>{const width=element.clientWidth,height=element.clientHeight;if(!width||!height)return;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);render();};
   const observer=new ResizeObserver(resize);observer.observe(element);resize();
   dispose=()=>{observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('keydown',key);bodyGeometry.dispose();bodyMaterial.dispose();stickerGeometry.dispose();Object.values(materials).forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();reset.current=()=>{};};
  }).catch(()=>{if(!cancelled)setError('3D preview unavailable. The unfolded view shows the same state.');});
  return()=>{cancelled=true;dispose();};
 },[state]);
 return <div className="static-cube"><div ref={host} className="static-cube-canvas"/>{error?<p role="status">{error}</p>:<><span className="static-cube-hint">Drag to rotate</span><button className="static-cube-reset" aria-label="Reset cube camera" title="Reset view" onClick={()=>reset.current()}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/></svg></button></>}</div>;
}
