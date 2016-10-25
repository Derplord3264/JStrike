import * as THREE from 'three';
import ViewHandler from './ViewHandler';
import Shader from '../Shader';
import '../../lib/shaders/EffectComposer';
import '../../lib/shaders/ConvolutionShader';
import '../../lib/shaders/CopyShader';
import '../../lib/shaders/SSAOShader';
import '../../lib/shaders/FXAAShader';
import '../../lib/shaders/RenderPass';
import '../../lib/shaders/ShaderPass';
import '../../lib/shaders/BloomPass';
import '../../lib/shaders/MaskPass';

class GraphicsHandler {

	constructor() {
		this.renderer, this.camera,
		this.viewHandler = new ViewHandler;
		this.shader = new Shader;

		this.fov = 80;
		this.postProcessing = true;
		this.bloomEnabled = true;
		this.fxaaEnabled = true;
		this.ssaoEnabled = false;
		this.halfSizeEnabled = false;
	}

	init() {
		/* Renderer */
		this.renderer = new THREE.WebGLRenderer;
		this.renderer.autoClear = false;
		this.renderer.setClearColor(0x2f588e);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		document.getElementById('jstrike').appendChild(this.renderer.domElement);

		/* Camera */
		this.camera = new THREE.PerspectiveCamera(this.fov, window.innerWidth / window.innerHeight, 1, 7000);

		this.initEffectComposer();

		/* Resize event listener */
		window.addEventListener('resize', () => this.onReSize(), false);
	}

	zoom(val) {
		if (this.camera.zoom == val) return;

		this.camera.zoom = val;
		this.camera.updateProjectionMatrix();
	}

	onReSize() {
		let width = window.innerWidth;
		let height = window.innerHeight;

		if (this.halfSizeEnabled) {
			width *= 0.5;
			height *= 0.5;
		}

		let depthTarget = this.depthTarget.clone();
		depthTarget.width = width;
		depthTarget.height = height;
		this.depthTarget = depthTarget;
		this.effectSSAO.uniforms['tDepth'].value = this.depthTarget;
		this.effectSSAO.uniforms['size'].value.set(width, height);
		this.effectFXAA.uniforms['resolution'].value.set(1 / width, 1 / height);
		this.composer.setSize(width, height);

		this.renderer.domElement.style.width = window.innerWidth + 'px';
		this.renderer.domElement.style.height = window.innerHeight + 'px';
	}

	initEffectComposer() {
		this.composer = new THREE.EffectComposer(this.renderer);

		/*let depthShader = THREE.ShaderLib['depthRGBA'];
		let depthUniforms = THREE.UniformsUtils.clone(depthShader.uniforms);

		this.depthMaterial = new THREE.ShaderMaterial({
			fragmentShader: depthShader.fragmentShader,
			vertexShader: depthShader.vertexShader,
			uniforms: depthUniforms
		});
		this.depthMaterial.blending = THREE.NoBlending;*/

		this.depthTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat
		});

		this.effectSSAO = new THREE.ShaderPass(THREE.SSAOShader);
		this.effectSSAO.uniforms['tDepth'].value = this.depthTarget;
		this.effectSSAO.uniforms['size'].value.set(window.innerWidth, window.innerHeight);
		this.effectSSAO.uniforms['cameraNear'].value = this.camera.near;
		this.effectSSAO.uniforms['cameraFar'].value = this.camera.far;

		this.effectFilter = new THREE.ShaderPass(this.shader.BrightnessFilterShader());
		this.effectBloom = new THREE.BloomPass(1, 25, 4, 512);
		this.effectBloom.needsSwap = true;

		this.effectGlow = new THREE.ShaderPass(this.shader.GlowShader());
		this.effectGlow.uniforms['tGlow'].value = this.effectBloom.renderTargetY;
		this.effectGlow.uniforms['intensity'].value = 1;

		this.effectColor = new THREE.ShaderPass(this.shader.ColorShader());
		this.effectColor.uniforms['color'].value = new THREE.Color(0x000000);

		this.effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
		this.effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);

		let effectCopy = new THREE.ShaderPass(THREE.CopyShader);
		effectCopy.renderToScreen = true;

		this.composer.addPass(this.effectFilter);
		this.composer.addPass(this.effectBloom);
		this.composer.addPass(this.effectGlow);
		this.composer.addPass(this.effectSSAO);
		this.composer.addPass(this.effectColor);
		this.composer.addPass(this.effectFXAA);
		this.composer.addPass(effectCopy);
	}

	addToView(view, object) {
		this.viewHandler.addToView(view, object);
	}

	getObjects(view) {
		return this.viewHandler.getObjects(view);
	}

	render() {
		this.renderer.clear();
		this.renderer.render(this.viewHandler.gameView, this.camera);

		this.renderer.clearDepth();
		this.renderer.render(this.viewHandler.playerView, this.camera);
	}

	renderPP() {
		let renderTarget = this.composer.renderTarget2;
		this.renderer.clearTarget(renderTarget, true, true, false);

		this.renderer.render(this.viewHandler.gameView, this.camera, renderTarget);

		this.renderer.clearTarget(renderTarget, false, true, false);
		this.renderer.render(this.viewHandler.playerView, this.camera, renderTarget);
	}

	renderDepthTarget() {
		let renderTarget = this.depthTarget;
		this.renderer.autoClear = false;
		this.renderer.clearTarget(renderTarget, true, true, false);
		this.scene.overrideMaterial = this.depthMaterial;
		this.renderer.render(this.scene, this.camera, renderTarget);
	}

	draw() {
		if (this.postProcessing) {
			this.renderPP();

			if (this.ssaoEnabled) {
				this.renderDepthTarget();
			}
			this.composer.render();
		} else {
			this.render();
		}
	}
}

export default GraphicsHandler;
