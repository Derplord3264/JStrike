import * as constants from '../../const';
import * as THREE from 'three';
import * as TWEEN from 'tween.js';

class WeaponHandler {

	constructor() {
		this.assetHandler;
		this.primary, this.secondary = null;
		this.rounds = {
			primary: 0,
			secondary: 0
		}
		this.selected;

		this.shooting = 0;
		this.aiming = 0;
		this.cooldown = 0;
		this.shot_count = 0;

		this.animating, this.animating_shot = false;
		this.tween, this.tween_shot;

		this.audio = [];
		for (var i = 0; i < 30; i++) {
			this.audio[i] = new Audio('../../assets/weapons/ak-47-kalashnikov/shot.mp3');
		}
		this.audio_i = 0;
	}

	playAudio() {
		if (this.audio_i >= this.audio.length) this.audio_i = 0;
		this.audio[this.audio_i].play();
		this.audio_i++;
	}

	init(assetHandler, player) {
		this.assetHandler = assetHandler;
		this.player = player;
	}

	setKey(key, direction) {
		switch (key) {
			case constants.KEY_1:
				if (this.selected != this.primary)
					this.selectPrimary();
			break;
			case constants.KEY_2:
				if (this.selected != this.secondary)
					this.selectSecondary();
			break;
			case constants.MOUSE_LEFT:
				this.shooting = direction;
				if (direction < 1) this.shot_count = 0;

				if (this.selected.config.mode == constants.GUNMODE_SINGLE)
					this.animateShot();
			break;
			case constants.MOUSE_RIGHT:
				this.aiming = direction;
				this.animateAim(direction);
			break;
		}
	}

	setPrimary(weapon) {
		this.primary = this.assetHandler.getWeapon(weapon);
		this.primary.config = constants.WEAPON[this.primary.name];
		this.primary.rounds = this.primary.config.rounds;
	}

	setSecondary(weapon) {
		this.secondary = this.assetHandler.getWeapon(weapon);
		this.secondary.config = constants.WEAPON[this.secondary.name];
		this.secondary.rounds = this.secondary.config.rounds;
	}

	selectPrimary() {
		this.secondary.visible = false;
		this.primary.visible = true;
		this.selected = this.primary;
	}

	selectSecondary() {
		this.primary.visible = false;
		this.secondary.visible = true;
		this.selected = this.secondary;
	}

	positionGun(pos) {
		let dir = this.player.getDirection();

		let xDir = new THREE.Vector3;
		xDir.crossVectors(dir, new THREE.Vector3(0, 1, 0))
		.normalize()
		.multiplyScalar(pos.x);

		let yDir = new THREE.Vector3(0, 1, 0);
		yDir.multiplyScalar(pos.y);

		let zDir = dir;
		zDir.multiplyScalar(pos.z);

		let newPos = new THREE.Vector3;
		newPos.copy(this.player.getPosition());
		newPos.add(xDir);
		newPos.add(yDir);
		newPos.add(zDir);

		this.selected.position.copy(newPos);
	}

	animate(delta) {
		if (!this.animating) {
			let config = this.selected.config;
			this.positionGun(
				(this.aiming) ? config.pos.aiming : config.pos.default
			);

			if (this.selected.config.mode == constants.GUNMODE_AUTOMATIC)
				this.animateShot();
		}

		var ray = new THREE.Ray();
		ray.set(
			this.player.getPosition(),
			this.player.getDirection()
		);
		this.selected.lookAt(ray.at(2000));

		if (this.cooldown > 0) this.cooldown--;
	}

	canShoot() {
		if (!this.player.isFocused()) return false;
		if (this.selected.rounds <= 0) return false;
		if (this.selected.config.mode == constants.GUNMODE_SINGLE
			&& this.shooting
			&& this.shot_count > 0) return false;
		if (this.animating_shot) return false;
		if (this.cooldown > 0) return false;

		return true;
	}

	animateShot() {
		if (!this.shooting) return;
		if (!this.canShoot()) return;

		this.animating_shot = true;

		let config = this.selected.config;
		var origin = (this.aiming) ? config.pos.aiming : config.pos.default;
		origin = Object.assign({}, origin);
		var dest = Object.assign({}, origin);
		dest.z -= config.recoil;

		this.player.controls.getPitchObject().rotation.x += 0.01;
		this.playAudio();

		let that = this;
		this.tween_shot = new TWEEN.Tween(origin).to(dest, 25)
		.repeat(1)
		.yoyo(true)
		.onUpdate(function() {
			that.positionGun({x: this.x, y: this.y, z: this.z});
		})
		.onComplete(() => {
			this.animating_shot = false;
			this.cooldown = this.selected.config.cooldown;
			this.shot_count++;
		})
		.start();
	}

	animateAim(direction) {
		if (this.animating)
			this.tween.stop();
		this.animating = true;

		let config = this.selected.config;
		var from = (direction > 0) ? config.pos.default : config.pos.aiming;
		var to = (direction > 0) ? config.pos.aiming : config.pos.default;
		from = Object.assign({}, from);
		to = Object.assign({}, to);

		let that = this;
		this.tween = new TWEEN.Tween(from).to(to, 50)
		.onUpdate(function() {
			that.positionGun({x: this.x, y: this.y, z: 0});
		})
		.onComplete(() => this.animating = false)
		.start();
	}
}

export default WeaponHandler;
