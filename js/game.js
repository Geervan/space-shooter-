class Game {
  constructor() {
    this.resourcesLoaded = false;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1e7);
    this.renderer = new THREE.WebGLRenderer({antialias:true});
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(this.renderer.domElement);

    let directionalLight = new THREE.DirectionalLight(0xffeedd);
    directionalLight.position.set(0, 0, 2);
    this.scene.add(directionalLight);
    this.scene.add(new THREE.HemisphereLight());

    this.models = {
      spaceship: {
        ds: 'models/fighter1.3ds',
        texture: 'models/crono782.jpg',
        mesh: null
      }
    };

    this.loadingManager = new THREE.LoadingManager();
    this.loadingManager.onLoad = function () {
      this.resourcesLoaded = true;
      this.init();
    }.bind(this);

    this.loadModels(this.models, this.loadingManager);
  }

  init() {1
    this.scene.add(this.models.spaceship.mesh.clone());

    this.createStarfield(6371);

    this.player = new Player(0, this.models.spaceship.mesh.clone(), this.scene);

    this.player.mesh.add(this.camera);
    this.camera.rotation.set(0, Math.PI / 2, Math.PI / 2);
    this.camera.position.set(100, 0, 20);
  }

  processEvents(event) {
    if (!this.resourcesLoaded) return;

    if (event.type === "keydown") {
      switch (event.keyCode) {
        case 87: /* W */ this.player.forward = 1; break;
        case 83: /* S */ this.player.break = 1; break;

        case 65: /* A */ this.player.rollLeft = 1; break;
        case 68: /* D */ this.player.rollRight = 1; break;

        case 81: /* Q */ this.player.yawLeft = 1; break;
        case 69: /* E */ this.player.yawRight = 1; break;

        case 32: /* Space */ this.player.canShoot = true; break;
      }

      this.player.updateRotationVector();
    }

    if (event.type === "keyup") {
      switch (event.keyCode) {
        case 87: /* W */ this.player.forward = 0; break;
        case 83: /* S */ this.player.break = 0; break;

        case 65: /* A */ this.player.rollLeft = 0; break;
        case 68: /* D */ this.player.rollRight = 0; break;

        case 81: /* Q */ this.player.yawLeft = 0; break;
        case 69: /* E */ this.player.yawRight = 0; break;

        case 32: /* Space */ this.player.canShoot = false; break;
      }

      this.player.updateRotationVector();
    }

    if (event.type === "mousemove") {
      const halfHeight = window.innerHeight / 2;
      this.player.pitch = (event.pageY - halfHeight) / halfHeight;
      this.player.updateRotationVector();
    }
  }

  update() {
    this.player.update();
  }

  render(nextFrameAmount) {
    this.renderer.render(this.scene, this.camera);
  }

  loadModels(models, loadingManager) {
    for (var _key in models) {
      (function (key) {
        var loader = new THREE.TDSLoader(loadingManager);
        loader.load(models[key].ds, function (mesh) {
          mesh.traverse(function (node) {
            if (node instanceof THREE.Mesh) {
              if (node.name === "ship") {
                const imageSrc = node.material.map.image.baseURI + models.spaceship.texture;
                node.material.map.image.src = imageSrc;
              }

              node.castShadow = 'castShadow' in models[key] ? models[key].castShadow : true;
              node.castShadow = 'receiveShadow' in models[key] ? models[key].receiveShadow : true;
            }
          });
          models[key].mesh = mesh;
        });
      })(_key);
    }
  }

  createStarfield(radius) {
    let starsGeometry = [new THREE.Geometry(), new THREE.Geometry()];

    for (let i = 0; i < 250; i++) {
      let vertex = new THREE.Vector3();
      vertex.x = Math.random() * 2 - 1;
      vertex.y = Math.random() * 2 - 1;
      vertex.z = Math.random() * 2 - 1;
      vertex.multiplyScalar(radius);
      starsGeometry[0].vertices.push(vertex);
    }

    for (let i = 0; i < 1500; i++) {
      let vertex = new THREE.Vector3();
      vertex.x = Math.random() * 2 - 1;
      vertex.y = Math.random() * 2 - 1;
      vertex.z = Math.random() * 2 - 1;
      vertex.multiplyScalar(radius);
      starsGeometry[1].vertices.push(vertex);
    }

    let stars;
    const starsMaterials = [
      new THREE.PointsMaterial( { color: 0x555555, size: 2, sizeAttenuation: false } ),
      new THREE.PointsMaterial( { color: 0x555555, size: 1, sizeAttenuation: false } ),
      new THREE.PointsMaterial( { color: 0x333333, size: 2, sizeAttenuation: false } ),
      new THREE.PointsMaterial( { color: 0x3a3a3a, size: 1, sizeAttenuation: false } ),
      new THREE.PointsMaterial( { color: 0x1a1a1a, size: 2, sizeAttenuation: false } ),
      new THREE.PointsMaterial( { color: 0x1a1a1a, size: 1, sizeAttenuation: false } )
    ];

    for (let i = 10; i < 30; i++) {
      stars = new THREE.Points(starsGeometry[i % 2], starsMaterials[i % 6]);
      stars.rotation.x = Math.random() * 6;
      stars.rotation.y = Math.random() * 6;
      stars.rotation.z = Math.random() * 6;
      stars.scale.setScalar( i * 10 );
      stars.matrixAutoUpdate = false;
      stars.updateMatrix();
      this.scene.add(stars);
    }
  }
}