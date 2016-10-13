import * as THREE from 'three';
import PointerLockControls from 'three-pointerlock';
import OBJLoader from 'three-obj-loader';
import MTLLoader from 'three-mtl-loader';

class Engine {

	constructor(config) {
		this.config = config;

		/* Engine */
		this.camera, this.scene, this.renderer, this.controls, this.listener;

		/* Player */
		this.player = {
			velocity: null,
			jumping: false,
			aiming: false,
			moving: false,
			shooting: false,
			height: 55,
			rayspace: 20,
			focus: false,
			pressedKeys: {}
		}

		/* Time & sync */
		this.oldTime = performance.now();
		this.waitGroup = 2;

		/* DOM */
		this.menu = document.getElementById('menu');
		this.menuContinue = document.getElementById('menu-continue');
		this.menuSettings = document.getElementById('menu-settings');
		this.menuExit = document.getElementById('menu-exit');
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
		this.camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 1, 7000);
		
		/* Camera controls */
		this.controls = new PointerLockControls(this.camera);
		this.controls.getObject().position.set(this.config.pos.x, this.config.pos.y, this.config.pos.z);
		this.scene.add(this.controls.getObject());

		/* Light */
		let light = new THREE.HemisphereLight(0xffffff, 0xe6c5a2, 0.75);
		this.scene.add(light);

		/* Resize event listener */
		window.addEventListener('resize', () => this.onWindowResize, false);
	}

	loadAssets() {

		/* Map */
		THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader());
		let mtlLoader = new MTLLoader();
		mtlLoader.setPath(`assets/maps/${this.config.map}/`);
		mtlLoader.load(`${this.config.map}.mtl`, (materials) => {
			materials.preload();

			let objLoader = new OBJLoader();
			objLoader.setMaterials(materials);
			objLoader.setPath(`assets/maps/${this.config.map}/`);
			objLoader.load(`${this.config.map}.obj`, (object) => {

				this.objects.push(object)
				this.scene.add(object);
				this.waitGroup--;

			});
		});
	}
}

export default Engine;
