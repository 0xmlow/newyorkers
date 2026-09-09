/* fx.ts — the post chain.

   The museum's lighting was already physically based: standard materials, image
   based lighting from each room's own sky, a shadow casting sun, ACES filmic
   tone mapping. What it had no notion of was occlusion. Every surface took the
   same ambient light from every direction, so corners did not darken, objects
   did not sit on the floor they stood on, and the whole thing read as computer
   graphics inside half a second, before a visitor had looked at any one work.

   Ground truth ambient occlusion fixes that for all 111 rooms at once and costs
   no assets, which is why it comes before any modelling. Bloom is here so the
   practical lights read as lights rather than pale rectangles, and SMAA because
   a composer gives up the renderer's own multisampling.

   High path only. The low path already runs without shadows or antialiasing and
   has no budget for a full screen pass. `?fx=off` turns it off everywhere. */
import * as T from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export class Fx {
  private composer: EffectComposer;
  private renderPass: RenderPass;
  private gtao: GTAOPass;
  private bloom: UnrealBloomPass | null = null;

  constructor(renderer: T.WebGLRenderer, scene: T.Scene, camera: T.PerspectiveCamera, w: number, h: number, debug = '') {
    this.composer = new EffectComposer(renderer);
    this.composer.setSize(w, h);

    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    /* Rooms are measured in metres and run from twenty to a hundred across, so
       the occlusion radius is architectural: about a metre, which darkens the
       inside of a corner and the line where a plinth meets the floor without
       smearing shade across a whole wall. */
    this.gtao = new GTAOPass(scene, camera, w, h);
    /* `?fx=ao` renders the occlusion buffer on its own. Worth having: the
       effect is meant to be felt rather than seen, so the only honest way to
       check it is doing anything is to look at it alone. */
    const MODES: Record<string, number> = { ao: GTAOPass.OUTPUT.AO, depth: GTAOPass.OUTPUT.Depth, normal: GTAOPass.OUTPUT.Normal, denoise: GTAOPass.OUTPUT.Denoise };
    this.gtao.output = MODES[debug] ?? GTAOPass.OUTPUT.Default;
    /* Tuned for a museum in metres, not for the shader's unit sized defaults.
       radius 3 reaches across a corner without smearing a whole wall; thickness
       has to be at least the radius or the shader rejects every occluder it
       finds beyond a metre and the buffer comes back blank; scale is the
       exponent on the result and 2.2 is what makes brick read as brick. */
    this.gtao.updateGtaoMaterial({ radius: 3.0, distanceExponent: 1.0, thickness: 8.0, scale: 2.2, samples: 16 });
    this.gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, samples: 8 });
    this.composer.addPass(this.gtao);

    /* A debug view has to be the raw buffer. Bloom and ACES tone mapping applied
       on top of an occlusion buffer glow it into a white blob with a vignette,
       which is what fooled me into thinking the pass was doing nothing. */
    if (MODES[debug] !== undefined) return;

    /* Threshold high on purpose. This is for the sodium lamps, the neon and the
       window light, not for every pale wall in the building. */
    this.bloom = new UnrealBloomPass(new T.Vector2(w, h), 0.28, 0.5, 0.92);
    this.composer.addPass(this.bloom);

    this.composer.addPass(new SMAAPass());
    /* Last, and it is what applies the renderer's tone mapping and colour space
       once the chain has finished working in linear light. */
    this.composer.addPass(new OutputPass());
  }

  /* The scene is rebuilt for every room, so both passes that hold a reference
     to it have to be told. Cheaper than rebuilding the whole chain per room. */
  setScene(scene: T.Scene, camera: T.PerspectiveCamera) {
    this.renderPass.scene = scene;
    this.renderPass.camera = camera;
    this.gtao.scene = scene;
    this.gtao.camera = camera;
  }

  /* Live tuning, because the occlusion parameters are scale dependent and this
     museum is in metres while the shader's defaults assume a unit sized scene. */
  tune(p: { radius?: number; thickness?: number; scale?: number; distanceExponent?: number; samples?: number }) {
    this.gtao.updateGtaoMaterial(p);
  }

  setSize(w: number, h: number) {
    this.composer.setSize(w, h);
    this.gtao.setSize(w, h);
    this.bloom?.setSize(w, h);
  }

  render() {
    this.composer.render();
  }

  dispose() {
    this.composer.dispose();
  }
}
