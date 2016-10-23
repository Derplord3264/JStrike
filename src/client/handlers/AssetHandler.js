import * as THREE from 'three';

import '../../lib/loaders/DDSLoader';
import '../../lib/loaders/MTLLoader';
import '../../lib/loaders/OBJLoader';

class AssetHandler {

	constructor() {
		this.jobs = [
			{
				type: 'objmtl',
				name: 'awp_india',//'cs_italy',
				view: 'game'
			},
			{
				type: 'skydome',
				name: 'sky.jpg',
				view: 'game'
			},
			{
				type: 'objjson',
				name: 'ak-47-kalashnikov',
				view: 'player'
			},
			{
				type: 'objjson',
				name: 'm1911-handgun',
				view: 'player'
			}
		];
		this.jobStatus = [];
		this.waitGroup = this.jobs.length;
		this.weapons = {}
	}

	init(graphicsHandler) {
		this.graphicsHandler = graphicsHandler;
	}

	getWeapon(weapon) {
		return this.weapons[weapon];
	}

	jobsLoaded() {
		return (this.waitGroup <= 0);
	}

	load() {
		this.jobs.forEach((job, i) => {
			switch (job.type) {
				case 'objmtl':
					this.load_objmtl(job.name, job.view, i);
				break;
				case 'skydome':
					this.load_skydome(job.name, job.view, i);
				break;
				case 'objjson':
					this.load_objjson(job.name, job.view, i);
				break;
			}
		});
	}

	loadUI(xhr, i) {
		let element = document.getElementById('loader-pc');

		if (xhr.lengthComputable) {
			this.jobStatus[i] = xhr.loaded / xhr.total * 100;
			let jobSum = this.jobStatus.reduce((a, b) => a + b, 0);
			let pc = jobSum / this.jobStatus.length;
			element.style.width = `${pc}%`;
		} else {
			console.log('Failed to load an asset');
		}
	}

	load_objmtl(name, view, i) {
		THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader);
		let mtlLoader = new THREE.MTLLoader;
		mtlLoader.setPath(`assets/maps/${name}/`);
		mtlLoader.load(`${name}.mtl`, (materials) => {
			materials.preload();

			let objLoader = new THREE.OBJLoader;
			objLoader.setMaterials(materials);
			objLoader.setPath(`assets/maps/${name}/`);
			objLoader.load(`${name}.obj`, (object) => {

				this.graphicsHandler.addToView(view, object);
				this.waitGroup--;

			}, (xhr) => {
				this.loadUI(xhr, i);
			}, (xhr) => {
				this.loadUI(-1, i);
			});
		});
	}

	load_skydome(name, view, i) {
		let loader = new THREE.TextureLoader;
		loader.load(`assets/sky/${name}`, (texture) => {

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
			this.graphicsHandler.addToView(view, skyBox);
			this.waitGroup--;

		}, (xhr) => {
			this.loadUI(xhr, i);
		}, (xhr) => {
			this.loadUI(-1, i);
		});
	}

	load_objjson(name, view, i) {
		let objectLoader = new THREE.ObjectLoader;
		objectLoader.load(`assets/weapons/${name}/${name}.json`, (obj) => {
			
			obj.name = name;
			obj.visible = false;

			this.weapons[name] = obj;
			this.graphicsHandler.addToView(view, obj);
			this.waitGroup--;

		}, (xhr) => {
			this.loadUI(xhr, i);
		}, (xhr) => {
			this.loadUI(-1, i);
		});
	}

}

export default AssetHandler;
