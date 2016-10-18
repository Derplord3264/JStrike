import * as constants from '../const';
import SocketHandler from './SocketHandler';
import * as THREE from 'three';
import PointerLockControls from 'three-pointerlock';
import '../lib/DDSLoader';
import '../lib/MTLLoader';
import '../lib/OBJLoader';

class Engine {

	constructor(io, config) {
		this.socketHandler = new SocketHandler(io, this);
		this.config = config;

		/* Engine */
		this.camera, this.scene, this.renderer, this.controls, this.listener,
		this.reqAnimFrame;

		/* Player */
		this.player = {
			velocity: new THREE.Vector3,
			height: 55,
			wheight: 80,
			airborne: false,
			aiming: false,
			moving: false,
			shooting: false,
			rayspace: 20,
			focus: false,
			keys: {}
		}

		/* Settings */
		this.settings = {
			fov: 80,
			speed: 25,
			retardation: 10,
			jumpVelocity: 300,
			nullVelocity: 0.1
		}

		this.objects = [];
		this.enemies = [];

		/* Time & sync */
		this.oldTime = performance.now();
		this.waitGroup = 2;

		/* DOM */
		this.loader = document.getElementById('loader');
		this.menu = document.getElementById('menu');
		this.menuContinue = document.getElementById('menu-continue');
		this.menuSettings = document.getElementById('menu-settings');
		this.menuExit = document.getElementById('menu-exit');
	}

	input(key, direction) {
		this.player.keys[key] = direction;
	}

	onWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

	initPointerLock() {
		let element = document.body;

		let pointerLockChange = (e) => {
			if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
				this.player.focus = true;
				this.controls.enabled = true;
				this.menu.style.display = 'none';
			} else {
				this.player.focus = false;
				this.controls.enabled = false;
				this.menu.style.display = 'block';
			}
		};

		let pointerLockError = function(e) {
			console.warn('Engine::pointerLockError');
		};

		/* Hook pointer lock state change events */
		document.addEventListener('pointerlockchange', pointerLockChange, false);
		document.addEventListener('mozpointerlockchange', pointerLockChange, false);
		document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
		document.addEventListener('pointerlockerror', pointerLockError, false);
		document.addEventListener('mozpointerlockerror', pointerLockError, false);
		document.addEventListener('webkitpointerlockerror', pointerLockError, false);

		this.menuContinue.addEventListener('click', (e) => {
			this.menu.style.display = 'none';

			/* Ask browser to lock the pointer */
			element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
			element.requestPointerLock();
		}, false);
	}

	initGraphics() {

		/* Renderer */
		this.renderer = new THREE.WebGLRenderer;
		this.renderer.setClearColor(0x2f588e);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		document.getElementById('jstrike').appendChild(this.renderer.domElement);

		/* Scene */
		this.scene = new THREE.Scene;

		/* Camera */
		this.camera = new THREE.PerspectiveCamera(this.settings.fov, window.innerWidth / window.innerHeight, 1, 7000);
		
		/* Camera controls */
		this.controls = new PointerLockControls(this.camera);
		this.controls.getObject().position.set(this.config.pos.x, this.config.pos.y, this.config.pos.z);
		this.scene.add(this.controls.getObject());

		/* Light */
		let light = new THREE.HemisphereLight(0xffffff, 0xe6c5a2, 0.75);
		this.scene.add(light);

		/* Inint debuglets */
		this.buglets = {};
		let i = 0;
		while (i < 4) {
			this.buglets[i] = new THREE.Mesh(
				new THREE.SphereGeometry(1.5, 5, 5),
				new THREE.MeshBasicMaterial({color: 0xff0000})
			);
			this.scene.add(this.buglets[i]);
			i++;
		}

		/* Resize event listener */
		window.addEventListener('resize', () => this.onWindowResize(), false);
	}

	loadAssets() {

		/* Map */
		THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader);
		let mtlLoader = new THREE.MTLLoader;
		mtlLoader.setPath(`assets/maps/${this.config.map}/`);
		mtlLoader.load(`${this.config.map}.mtl`, (materials) => {
			materials.preload();

			let objLoader = new THREE.OBJLoader;
			objLoader.setMaterials(materials);
			objLoader.setPath(`assets/maps/${this.config.map}/`);
			objLoader.load(`${this.config.map}.obj`, (object) => {

				this.objects.push(object)
				this.scene.add(object);
				this.waitGroup--;

			}, (xhr) => {
				this.loadAssetsHelper(0, 'Map', xhr);
			}, (xhr) => {
				this.loadAssetsHelper(0, 'Map', -1);
			});
		});

		/* Skydome */
		let loader = new THREE.TextureLoader;
		loader.load('assets/sky/sky.jpg', (texture) => {

			let geometry = new THREE.SphereGeometry(5000, 60, 40);
			let uniforms = {
				texture: {type: 't', value: texture}
			};

			let material = new THREE.ShaderMaterial({
				uniforms:       uniforms,
				vertexShader:   `varying vec2 vUV;
								void main() {
									vUV = uv;
									vec4 pos = vec4(position, 1.0);
									gl_Position = projectionMatrix * modelViewMatrix * pos;
								}`,
				fragmentShader: `uniform sampler2D texture;
								varying vec2 vUV;

								void main() {
									vec4 sample = texture2D(texture, vUV);
									gl_FragColor = vec4(sample.xyz, sample.w);
								}`
			});

			let skyBox = new THREE.Mesh(geometry, material);
			skyBox.scale.set(-1, 1, 1);
			skyBox.eulerOrder = 'XZY';
			//this.renderDepth = 1000.0;
			this.scene.add(skyBox);
		});

		/* Gun */
		let objectLoader = new THREE.ObjectLoader;
		objectLoader.load('assets/weapons/ak-47-kalashnikov/ak-47-kalashnikov.json', (obj) => {
			/*self.gun = obj;
			self.gun.traverse(function(child) {
				if (child instanceof THREE.Mesh && child.material.map == null)
					child.material.color.setRGB(0, 0, 0);
			});
			//self.gun.lookAt(self.gunTarget);
			self.gun.rotation.y = Math.PI;
			self.controls.getObject().add(self.gun);*/
			this.waitGroup--;
		}, (xhr) => {
			this.loadAssetsHelper(1, 'Gun', xhr);
		}, (xhr) => {
			this.loadAssetsHelper(1, 'Gun', -1);
		});
	}

	loadAssetsHelper(id, str, xhr) {
		let display = '';

		if (xhr < 0) {
			display = `Error loading ${str}`;
		} else {
			if (xhr.lengthComputable) {
				let pc = xhr.loaded / xhr.total * 100;
				pc = Math.round(pc, 2);
				display = `Loading ${str} (${pc}%)`;
			}
		}
		let element = document.getElementById(`asset-${id}`);

		if (element == null) {
			this.loader.innerHTML += `<div id="asset-${id}">${display}</div>`;
		} else {
			element.innerHTML = display;
		}
	}

	animate() {
		this.reqAnimFrame = requestAnimationFrame(() => this.animate());

		/* Skip if resources not loaded */
		if (this.waitGroup > 0) return;
		this.loader.style.display = 'none';

		/* Calculate delta-time */
		let time = performance.now();
		let delta = (time - this.oldTime) / 1000;
		this.oldTime = time;

		/* Do animations (order dependant) */
		this.anim_velocity(delta);
		this.anim_retardation(delta);
		this.anim_collision();
		this.anim_translation(delta);

		this.socketHandler.tick();

		/* Render frame */
		this.renderer.render(this.scene, this.camera);
	}

	anim_velocity(delta) {
		if (!this.player.focus) return;

		/* Jump */
		if (this.player.keys[constants.KEY_SPACE] && !this.player.airborne) {
			this.player.velocity.y += this.settings.jumpVelocity;
			this.player.airborne = true;
		}

		/* Update velocity */
		let speed = (this.player.aiming) ? 50 : 100;
		let delta_speed = speed * this.settings.speed * delta;
		this.player.velocity.z -= (this.player.keys[constants.KEY_W]) ? delta_speed : 0;
		this.player.velocity.x -= (this.player.keys[constants.KEY_A]) ? delta_speed : 0;
		this.player.velocity.z += (this.player.keys[constants.KEY_S]) ? delta_speed : 0;
		this.player.velocity.x += (this.player.keys[constants.KEY_D]) ? delta_speed : 0;
	}

	anim_retardation(delta) {
		this.player.velocity.x -= this.player.velocity.x * this.settings.retardation * delta;
		this.player.velocity.z -= this.player.velocity.z * this.settings.retardation * delta;
		this.player.velocity.y -= (this.player.airborne) ? 9.8 * this.player.wheight * delta : 0;
	}

	anim_translation(delta) {
		this.controls.getObject().translateX(this.player.velocity.x * delta);
		this.controls.getObject().translateY(this.player.velocity.y * delta);
		this.controls.getObject().translateZ(this.player.velocity.z * delta);
	}

	anim_collision() {
		let rayHits, actualDist;
		let raycaster = new THREE.Raycaster;
		raycaster.ray.origin.copy(this.controls.getObject().position);

		/* Down */
		raycaster.ray.direction.set(0, -1, 0);
		rayHits = raycaster.intersectObjects(this.objects, true);

		if ((rayHits.length > 0) && (rayHits[0].face.normal.y > 0)) {
			actualDist = Math.abs(rayHits[0].distance);

			/* Falling down */
			if((this.player.velocity.y <= 0) && (actualDist < this.player.height)) {
				this.controls.getObject().position.y += this.player.height - actualDist;
				this.player.velocity.y = 0;
				this.player.airborne = false;

			/* Dropping down */
			} else if ((this.player.velocity.y == 0) && (actualDist > this.player.height )) {
				if (rayHits[0].face.normal.y != 1 && actualDist < this.player.height + 5) {
					this.controls.getObject().position.y -= actualDist - this.player.height;
				} else {
					this.player.airborne = true;
				}
			}
		}

		/* If not moving, don't cast rays */
		if (this.player.velocity.length() < this.settings.nullVelocity) return;

		let buglet;

		let checkRay = (axis, dir) => {
			rayHits = raycaster.intersectObjects(this.objects, true);
			if(rayHits.length > 0) {
				actualDist = Math.abs(rayHits[0].distance);

				this.buglets[buglet].position.copy(rayHits[0].point);

				if(actualDist < this.player.rayspace) {
					if (axis > 0) {
						this.controls.getObject().position.x += (this.player.rayspace - actualDist) * dir;
					} else {
						this.controls.getObject().position.z += (this.player.rayspace - actualDist) * dir;
					}
				}
			}
		};

		/* Ray origin from half player height */
		raycaster.ray.origin.y -= this.player.height / 2;
		/* Right */
		buglet = 0;
		raycaster.ray.direction.set(1, 0, 0);	checkRay(1, -1);
		/* Left */
		buglet = 1;
		raycaster.ray.direction.set(-1, 0, 0);	checkRay(1, 1);
		/* Front */
		buglet = 2;
		raycaster.ray.direction.set(0, 0, -1);	checkRay(0, 1);
		/* Back */
		buglet = 3;
		raycaster.ray.direction.set(0, 0, 1);	checkRay(0, -1);
	}

	onJoin(data) {
		this.enemies[data.id] = new THREE.Mesh(
			new THREE.SphereGeometry(20, 5, 5),
			new THREE.MeshBasicMaterial({color: 0x00ff00})
		);
		this.enemies[data.id].position.set(
			data.pos.x,
			data.pos.y,
			data.pos.z,
		);
		this.enemies[data.id].name = data.id;
		this.scene.add(this.enemies[data.id]);
	}

	onDisconnecting(client_id) {
		let name = this.scene.getObjectByName(client_id);
		this.scene.remove(name);
		this.enemies[client_id] = null;
	}

	onMove(data) {
		if (!this.enemies.hasOwnProperty(data.id))
			this.onJoin(data);

		this.enemies[data.id].position.set(
			data.pos.x,
			data.pos.y,
			data.pos.z,
		);
	}
}

export default Engine;
