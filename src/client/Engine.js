import * as constants from '../const';
import Player from './Player';
import * as THREE from 'three';
import PointerLockControls from 'three-pointerlock';
import '../lib/DDSLoader';
import '../lib/MTLLoader';
import '../lib/OBJLoader';

class Engine {

	constructor(config) {
		this.config = config;

		/* Engine */
		this.camera, this.scene, this.renderer,
		this.controls, this.listener, this.reqAnimFrame;

		/* Player */
		this.player = new Player;

		/* Settings */
		this.settings = {
			fov: 80,
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
		this.player.setKey(key, direction);
	}

	kill() {
		cancelAnimationFrame(this.reqAnimFrame);
	}

	initSocketHandler(socketHandler) {
		this.socketHandler = socketHandler;
		this.socketHandler.init(this);
	}

	initPointerLock() {
		let element = document.body;

		let pointerLockChange = (e) => {
			if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
				this.player.setFocus(true);
				this.controls.enabled = true;
				this.menu.style.display = 'none';
			} else {
				this.player.setFocus(false);
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
		this.player.setControls(this.controls.getObject());

		/* Light */
		let light = new THREE.HemisphereLight(0xffffff, 0xe6c5a2, 0.75);
		this.scene.add(light);

		/* Resize event listener */
		window.addEventListener('resize', () => {
			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(window.innerWidth, window.innerHeight);
		}, false);
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
			this.gun = obj;
			this.gun.traverse(function(child) {
				if (child instanceof THREE.Mesh && child.material.map == null)
					child.material.color.setRGB(0, 0, 0);
			});
			//self.gun.lookAt(self.gunTarget);
			//this.gun.position.set(10, -10, 0);
			this.gun.rotation.y = Math.PI;
			//this.controls.getObject().add(this.gun);
			this.scene.add(this.gun);
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

	getDelta() {
		let time = performance.now();
		let delta = (time - this.oldTime) / 1000;
		this.oldTime = time;
		return delta;
	}

	animate() {
		this.reqAnimFrame = requestAnimationFrame(() => this.animate());

		/* Skip if resources not loaded */
		if (this.waitGroup > 0) return;
		this.loader.style.display = 'none';

		/* Calculate delta-time */
		let delta = this.getDelta();
		/* Animate player */
		this.animatePlayer(delta);

		/////////////////////////////
		this.gun.position.set(
			this.controls.getObject().position.x - Math.sin(this.controls.getObject().rotation.y + Math.PI / 2) * 5,
			this.controls.getObject().position.y + 2.5,
			this.controls.getObject().position.z - Math.cos(this.controls.getObject().rotation.y + Math.PI / 2) * 5
		);

		let aimDir = new THREE.Vector3();
		aimDir = this.controls.getDirection(aimDir);
		var ray = new THREE.Ray();
		ray.set(
			this.controls.getObject().position,
			aimDir
		);
		this.gunTarget = ray.at(2000);
		this.gun.lookAt(this.gunTarget);
		/////////////////////////////

		this.socketHandler.tick();

		/* Render frame */
		this.renderer.render(this.scene, this.camera);
	}

	animatePlayer(delta) {
		if (!this.player.isFocused()) return;

		this.player.setDelta(delta);
		if (this.player.isJumping()) {
			this.player.jump();
		}
		this.player.setVelocity();
		this.player.setFriction();
		this.player.detectCollisions(this.objects);
		this.player.translate();
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
