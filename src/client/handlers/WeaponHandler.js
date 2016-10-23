import * as constants from '../../const';
import * as THREE from 'three';

class WeaponHandler {

	constructor() {
		this.primary, this.secondary = null;
		this.selected;
	}

	setPrimary(weapon) {
		this.primary = this.assetHandler.getWeapon(weapon);
	}

	setSecondary(weapon) {
		this.secondary = this.assetHandler.getWeapon(weapon);
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

	animateWeapon(player) {
		let wc = constants.WEAPON[this.selected.name];

		var ray = new THREE.Ray();
		ray.set(
			this.getPosition(),
			this.getDirection()
		);
		this.selected.lookAt(ray.at(2000));
		this.selected.position.copy(ray.at(wc.pos.default));
	}
}

export default WeaponHandler;
