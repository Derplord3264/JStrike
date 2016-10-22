import * as constants from '../const';
import * as THREE from 'three';
import GraphicsHandler from './handlers/GraphicsHandler';
import Player from './Player';
import '../lib/loaders/DDSLoader';
import '../lib/loaders/MTLLoader';
import '../lib/loaders/OBJLoader';

class Engine {

	constructor(socketHandler, config) {
		this.socketHandler = socketHandler;
		this.config = config;

		/* Engine */
		this.listener, this.reqAnimFrame;

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

	init() {
		this.socketHandler.init(this);

		this.graphicsHandler = new GraphicsHandler;
		this.graphicsHandler.init();

		this.player = new Player;
		this.player.init(this.graphicsHandler.camera);
		this.player.setPosition(new THREE.Vector3(
			this.config.pos.x,
			this.config.pos.y,
			this.config.pos.z
		));

		this.graphicsHandler.addToView('player', this.player.controls.getObject());

		/* Light */
		let light = new THREE.HemisphereLight(0xffffff, 0xe6c5a2, 0.75);
		this.graphicsHandler.addToView('game', light);
		
		this.initPointerLock();
		this.loadAssets();
		this.animate();
	}

	initPointerLock() {
		let element = document.body;

		let pointerLockChange = (e) => {
			if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
				this.player.setFocus(true);
				this.player.setControls(true);
				this.menu.style.display = 'none';
			} else {
				this.player.setFocus(false);
				this.player.setControls(false);
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
				this.graphicsHandler.addToView('game', object);
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
			this.graphicsHandler.addToView('game', skyBox);
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
			//this.gun.rotation.y = Math.PI;
			//this.controls.getObject().add(this.gun);
			this.graphicsHandler.addToView('player', this.gun);
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
		var ray = new THREE.Ray();
		ray.set(
			this.player.controls.getObject().position,
			this.player.getDirection()
		);
		this.gunTarget = ray.at(2000);
		this.gun.lookAt(this.gunTarget);

		let b = ray.at(-20);
		this.gun.position.set(
			b.x,// - Math.sin(this.controls.getObject().rotation.y + Math.PI / 2) * 5,
			b.y,// + 2.5,
			b.z// - Math.cos(this.controls.getObject().rotation.y + Math.PI / 2) * 5
		);
		/////////////////////////////

		this.socketHandler.tick();

		/* Render frame */
		this.graphicsHandler.draw();
		//this.renderer.render(this.scene, this.camera);
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
		this.graphicsHandler.addToView('game', this.enemies[data.id]);
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
