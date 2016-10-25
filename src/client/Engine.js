import * as constants from '../const';
import * as THREE from 'three';
import GraphicsHandler from './handlers/GraphicsHandler';
import AssetHandler from './handlers/AssetHandler';
import WeaponHandler from './handlers/WeaponHandler';
import Player from './Player';

class Engine {

	constructor(socketHandler, config) {
		this.socketHandler = socketHandler;
		this.config = config;
		this.graphicsHandler = new GraphicsHandler;
		this.assetHandler = new AssetHandler;
		this.weaponHandler = new WeaponHandler;
		this.player = new Player;

		/* Time & sync */
		this.reqAnimFrame;
		this.oldTime = performance.now();

		this.weaponInit = false;
		this.enemies = [];
	}

	input(key, direction) {
		this.player.setKey(key, direction);
		this.weaponHandler.setKey(key, direction);
	}

	kill() {
		cancelAnimationFrame(this.reqAnimFrame);
	}

	init() {
		this.socketHandler.init(this);
		this.graphicsHandler.init();
		this.assetHandler.init(this.graphicsHandler);
		this.assetHandler.load();
		this.weaponHandler.init(this.assetHandler, this.player);

		this.player.init(this.graphicsHandler);
		this.player.setPosition(new THREE.Vector3(
			this.config.pos.x,
			this.config.pos.y,
			this.config.pos.z
		));

		this.graphicsHandler.addToView('player', this.player.controls.getObject());
		this.graphicsHandler.addToView('game', new THREE.HemisphereLight(0xffffff, 0xe6c5a2, 0.75));

		this.initPointerLock();
		this.animate();
	}

	initPointerLock() {
		let element = document.body;

		let pointerLockChange = (e) => {
			if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
				this.player.setFocus(true);
				this.player.setControls(true);
				document.getElementById('menu').style.display = 'none';
			} else {
				this.player.setFocus(false);
				this.player.setControls(false);
				document.getElementById('menu').style.display = 'block';
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
	}

	requestPointerLock() {
		let element = document.body;
		element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
		element.requestPointerLock();
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
		if (!this.assetHandler.jobsLoaded()) return;
		if (!this.weaponInit) {
			this.weaponHandler.setPrimary(this.config.weapon.primary);
			this.weaponHandler.setSecondary(this.config.weapon.secondary);
			this.weaponHandler.selectPrimary();
			this.weaponInit = true;
			document.getElementById('loader').style.display = 'none';
		}

		let delta = this.getDelta();
		/* Animate player */
		this.player.animate(delta);
		/* Animate weapon */
		this.weaponHandler.animate(delta);
		/* Tick socket handler */
		this.socketHandler.tick();
		/* Render frame */
		this.graphicsHandler.draw();
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
