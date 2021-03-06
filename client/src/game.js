import { World } from 'ecsy';
import {
  PerspectiveCamera,
  Scene,
  WebGLRenderer as WebGlRenderer$1,
  AmbientLight,
  DirectionalLight,
  Fog,
  BufferGeometry,
  BufferAttribute,
  PointsMaterial,
  Points,
  BoxGeometry,
  MeshBasicMaterial
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import * as workerInterval from 'worker-interval';

import Utils from '../../shared/utils';
import Types from '../../shared/types';
import { WebGlRenderer } from './components/webgl-renderer';
import { Connection } from '../../shared/components/connection';
import { Transform } from './components/transform';
import { Transform2D } from './components/transform2d';
import { Keybindings } from './components/keybindings';
import { Input } from '../../shared/components/input';
import { Camera } from './components/camera';
import { Player } from './components/player';
import { Kind } from '../../shared/components/kind';
import { ParticleEffect } from './components/particle-effect';
import { RaycasterReceiver } from './components/raycaster-receiver';
import { GltfLoader } from './components/gltf-loader';
import { Model } from './components/model';
import { Loading } from '../../shared/components/loading';
import { Loaded } from '../../shared/components/loaded';
import { ResourceEntity } from '../../shared/components/resource-entity';
import { Spaceship } from '../../shared/components/spaceship';
import { Asteroid } from '../../shared/components/asteroid';
import { MeshRenderer } from './components/mesh-renderer';
import { Geometry } from '../../shared/components/geometry';
import { Material } from './components/material';
import { InstancedMesh } from './components/instanced-mesh';
import { InstancedMeshRenderer } from './components/instanced-mesh-renderer';
import { Bullet } from '../../shared/components/bullet';
import { ScreenPosition } from './components/screen-position';
import { Range } from '../../shared/components/range';
import { RangeTarget } from '../../shared/components/range-target';
import { Hostile } from '../../shared/components/hostile';
import { Onscreen } from './components/onscreen';

import { ModelLoadingSystem } from './systems/model-loading-system';
import { WebGlRendererSystem } from './systems/webgl-renderer-system';
import { NetworkEventSystem } from './systems/network-event-system';
import { NetworkMessageSystem } from './systems/network-message-system';
import { TransformSystem } from './systems/transform-system';
import { InputSystem } from './systems/input-system';
import { ParticleSystem } from './systems/particle-system';
import { HudSystem } from './systems/hud-system';
import { ProjectionSystem } from './systems/projection-system';
import { RangeSystem } from '../../shared/systems/range-system';
import { AimAssistSystem } from './systems/aim-assist-system';

export default class Game {
  constructor() {
    this.lastTime = performance.now();
    this.lastRenderTime = performance.now();
    this.updatesPerSecond = 60;
    this.lastUpdate = performance.now();

    this.world = new World()
      .registerComponent(WebGlRenderer)
      .registerComponent(Connection)
      .registerComponent(Transform)
      .registerComponent(Keybindings)
      .registerComponent(Input)
      .registerComponent(Camera)
      .registerComponent(Player)
      .registerComponent(Kind)
      .registerComponent(ParticleEffect)
      .registerComponent(RaycasterReceiver)
      .registerComponent(GltfLoader)
      .registerComponent(Model)
      .registerComponent(Loading)
      .registerComponent(Loaded)
      .registerComponent(ResourceEntity)
      .registerComponent(Spaceship)
      .registerComponent(Asteroid)
      .registerComponent(Bullet)
      .registerComponent(Geometry)
      .registerComponent(Material)
      .registerComponent(InstancedMesh)
      .registerComponent(MeshRenderer)
      .registerComponent(InstancedMeshRenderer)
      .registerComponent(ScreenPosition)
      .registerComponent(Range)
      .registerComponent(RangeTarget)
      .registerComponent(Hostile)
      .registerComponent(Transform2D)
      .registerComponent(Onscreen);

    this.world
      .registerSystem(ModelLoadingSystem)
      .registerSystem(TransformSystem)
      .registerSystem(ProjectionSystem)
      .registerSystem(NetworkEventSystem, this)
      .registerSystem(InputSystem)
      .registerSystem(AimAssistSystem)
      .registerSystem(ParticleSystem)
      .registerSystem(RangeSystem)
      .registerSystem(WebGlRendererSystem)
      .registerSystem(HudSystem)
      .registerSystem(NetworkMessageSystem);

    this.updateSystems = this.world.getSystems().filter((system) => {
      return !(system instanceof TransformSystem);
    });
    this.transformSystem = this.world.getSystem(TransformSystem);
    this.projectionSystem = this.world.getSystem(ProjectionSystem);
    this.renderSystem = this.world.getSystem(WebGlRendererSystem);
    this.hudSystem = this.world.getSystem(HudSystem);

    this.player = undefined;
    this.entities = [];

    const renderer = new WebGlRenderer$1({ antialias: true });
    renderer.setClearColor(0x020207);
    renderer.shadowMap.enabled = true;
    renderer.autoClear = false;

    document.body.appendChild(renderer.domElement);

    const scene = new Scene();

    const camera = new PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      1,
      4100
    );
    const cameraEntity = this.world
      .createEntity()
      .addComponent(Camera, { value: camera })
      .addComponent(Transform)
      .addComponent(Range, { radius: 80 });

    scene.add(camera);

    scene.add(new AmbientLight(0x222222));

    let light = new DirectionalLight(0xffffff);
    light.position.set(1, 1, 1);
    scene.add(light);

    light = new DirectionalLight(0x002288);
    light.position.set(-1, -1, -1);
    scene.add(light);

    scene.fog = new Fog(0x020207, 0.04);

    const fxaaPass = new ShaderPass(FXAAShader);
    const pixelRatio = renderer.getPixelRatio();

    fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
    fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(fxaaPass);
    composer.addPass(new UnrealBloomPass(undefined, 1.0, 0.5, 0));

    this.world
      .createEntity()
      .addComponent(WebGlRenderer, {
        scene: scene,
        camera: cameraEntity,
        renderer: renderer,
        composer: composer
      });

    camera.position.z = 15;

    // Loaders entity
    this.world.createEntity()
      .addComponent(GltfLoader, { value: new GLTFLoader().setPath('models/') });

    this.world.createEntity()
      .addComponent(ResourceEntity)
      .addComponent(Spaceship)
      .addComponent(Model, { path: 'spaceship.gltf' });

    this.world.createEntity()
      .addComponent(ResourceEntity)
      .addComponent(Asteroid)
      .addComponent(Model, { path: 'asteroid.gltf' });

    this.world.createEntity()
      .addComponent(ResourceEntity)
      .addComponent(Bullet)
      .addComponent(Geometry, { value: new BoxGeometry(0.1, 0.1, 1) })
      .addComponent(Material, { value: new MeshBasicMaterial( { color: 0xffa900 } )})
      .addComponent(InstancedMesh, { count: 2000 })
      .addComponent(Loaded);

    this.addStars(scene, 1000, 4000);
  }

  init() {
    this.fixedUpdate = Utils.createFixedTimestep(
      1000/this.updatesPerSecond,
      this.handleFixedUpdate.bind(this)
    );

    workerInterval.setInterval(this.update.bind(this), 1000/this.updatesPerSecond);
    requestAnimationFrame(this.render.bind(this));
  }

  update() {
    const time = performance.now();
    let delta = time - this.lastTime;

    if (delta > 250) {
      delta = 250;
    }

    this.world.systemManager.executeSystem(this.transformSystem, delta, time);
    this.fixedUpdate(delta, time);
    this.lastUpdate = performance.now();

    if (document.hidden) {
      this.world.entityManager.processDeferredRemoval();
    }

    this.lastTime = time;
  }

  render() {
    requestAnimationFrame(this.render.bind(this));

    if (!document.hidden) {
      const alpha = (performance.now() - this.lastUpdate)/(1000/this.updatesPerSecond);
      this.renderSystem.render(alpha);
      this.projectionSystem.render();
      this.hudSystem.render();
      this.world.entityManager.processDeferredRemoval();
    }
  }

  handleFixedUpdate(delta, time) {
    if (this.world.enabled) {
      this.updateSystems.forEach((system) => {
        if (system.enabled) {
          this.world.systemManager.executeSystem(system, delta, time);
        }
      });
    }
  }

  handleConnect(connection) {
    this.player = this.world
      .createEntity()
      .addComponent(Connection, { value: connection })
      .addComponent(Input)
      .addComponent(Keybindings, {
        forward: 'KeyE',
        backward: 'KeyD',
        rollLeft: 'KeyW',
        rollRight: 'KeyR',
        strafeLeft: 'KeyS',
        strafeRight: 'KeyF',
        strafeUp: 'Backspace',
        strafeDown: 'Delete',
        boost: 'ShiftLeft',
        weaponPrimary: 0,
      });
  }

  addPlayer(id, kind, position, rotation, scale) {
    const entity = this.world.createEntity()
      .addComponent(Transform, { prevPosition: position, position, rotation, scale })
      .addComponent(Kind, { value: kind })
      .addComponent(Player)
      .addComponent(Spaceship)
      .addComponent(MeshRenderer);

    entity.worldId = id;

    this.entities[id] = entity;
  }

  addEntity(id, kind, position, rotation, scale) {
    const entity = this.world
      .createEntity()
      .addComponent(Transform, {
        prevPosition: position,
        prevRotation: rotation,
        position,
        rotation,
        scale
      })
      .addComponent(Kind, { value: kind });

    entity.worldId = id;

    switch (kind) {
      case Types.Entities.SPACESHIP: {
        entity
          .addComponent(Spaceship)
          .addComponent(MeshRenderer)
          .addComponent(RaycasterReceiver)
          .addComponent(ScreenPosition)
          .addComponent(Transform2D)
          .addComponent(RangeTarget)
          .addComponent(Hostile);
        break;
      }
      case Types.Entities.ASTEROID: {
        entity
          .addComponent(Asteroid)
          .addComponent(MeshRenderer)
          .addComponent(RaycasterReceiver);
        break;
      }
      case Types.Entities.BULLET: {
        entity
          .addComponent(Bullet)
          .addComponent(MeshRenderer);
        break;
      }
    }

    this.entities[id] = entity;
  }

  removeEntity(id) {
    const entity = this.entities[id];

    if (!entity || !entity.alive) {
      console.error(`Can't destroy entity#${id}: ${entity}`);
      return;
    }

    if (entity.hasComponent(Kind) && entity.hasComponent(Transform)) {
      switch (entity.getComponent(Kind).value) {
        case Types.Entities.SPACESHIP:
          const position = entity.getComponent(Transform).position;
          this.world
            .createEntity()
            .addComponent(Transform, { position })
            .addComponent(ParticleEffect, { type: ParticleEffect.Types.Explosion });
          break;
      }
    }

    entity.remove();
    delete this.entities[id];
  }

  addStars(scene, count, radius) {
    const positions = [];

    for (let i = 0; i < count; i++) {
      const r = radius;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      const x = r * Math.cos(theta) * Math.sin(phi) + (-2000 + Math.random() * 4000);
      const y = r * Math.sin(theta) * Math.sin(phi) + (-2000 + Math.random() * 4000);
      const z = r * Math.cos(phi) + (-1000 + Math.random() * 2000);
      positions.push(x);
      positions.push(y);
      positions.push(z);
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
    const material = new PointsMaterial({color: 0xffffff, size: 12.5, fog: false});
    const mesh = new Points(geometry, material);

    scene.add(mesh);
  }
}
