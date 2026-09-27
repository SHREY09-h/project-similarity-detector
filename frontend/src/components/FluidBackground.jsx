import { useEffect, useRef } from 'react';
import { Mesh, Program, Renderer, Triangle } from 'ogl';

const vertex = `
attribute vec2 position;
void main(){gl_Position=vec4(position,0.0,1.0);}
`;

const fragment = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uPointer;

float dotGrid(vec2 point,float spacing,float radius){
  vec2 cell=(fract(point/spacing)-.5)*spacing;
  return 1.0-smoothstep(radius,radius*.2,length(cell));
}

float waveField(vec2 point,float side,float spacing,float phase,float offset){
  float ridge=side*(.72+offset+.15*sin(point.x*2.7+phase)+.09*sin(point.x*6.3-phase*.6));
  float fold=side*.09*sin(point.x*11.0+point.y*2.0+phase*1.3);
  float distance=abs(point.y-ridge-fold);
  float band=1.0-smoothstep(.025,.36,distance);
  vec2 warped=vec2(point.x+point.y*.52+phase*.025,point.y+sin(point.x*5.0+phase)*.045);
  return dotGrid(warped,spacing,.0042)*band;
}

void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uResolution.xy)/min(uResolution.x,uResolution.y);
  vec2 pointer=(uPointer-.5)*vec2(uResolution.x/uResolution.y,1.0);
  float time=uTime*.42;
  vec3 color=vec3(.0015,.0015,.0025);
  float top=waveField(uv,1.0,.027,time,0.0)+waveField(uv,1.0,.041,time+1.8,.035)*.72+waveField(uv,1.0,.062,time+3.2,.07)*.4;
  float bottom=waveField(uv,-1.0,.027,-time,0.0)+waveField(uv,-1.0,.041,-time+2.2,.035)*.72+waveField(uv,-1.0,.062,-time+3.7,.07)*.4;
  float edgeMask=smoothstep(.015,.18,abs(uv.y));
  float pointerLight=exp(-distance(uv,pointer)*distance(uv,pointer)*14.0);
  color+=vec3(1.0)*min(1.0,(top+bottom)*1.3)*edgeMask;
  color+=vec3(.2,.3,.5)*pointerLight*.025;
  color*=.9+.1*(1.0-smoothstep(.2,1.3,length(uv)));
  color=pow(color,vec3(.82));
  gl_FragColor=vec4(color,1.0);
}
`;

export default function FluidBackground() {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = matchMedia('(max-width: 720px)').matches;
    const renderer = new Renderer({ alpha: false, dpr: Math.min(devicePixelRatio, mobile ? 1.2 : 1.5) });
    const gl = renderer.gl;
    host.appendChild(gl.canvas);
    const pointer = [0.5, 0.5];
    const program = new Program(gl, { vertex, fragment, uniforms: {
      uTime: { value: 0 },
      uResolution: { value: [1, 1] },
      uPointer: { value: pointer },
    }});
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    let frame;
    const started = performance.now();
    const resize = () => {
      renderer.setSize(host.clientWidth, host.clientHeight);
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
      if (reduced) renderer.render({ scene: mesh });
    };
    const move = event => {
      pointer[0] += (event.clientX / window.innerWidth - pointer[0]) * .18;
      pointer[1] += (1 - event.clientY / window.innerHeight - pointer[1]) * .18;
    };
    const render = now => {
      program.uniforms.uTime.value = reduced ? 1.5 : (now - started) / 1000;
      renderer.render({ scene: mesh });
      if (!reduced) frame = requestAnimationFrame(render);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    if (!reduced) addEventListener('pointermove', move, { passive: true });
    resize();
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      if (!reduced) removeEventListener('pointermove', move);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      gl.canvas.remove();
    };
  }, []);

  return <div className="service-fluid" ref={hostRef} aria-hidden="true" />;
}