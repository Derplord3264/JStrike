import * as THREE from 'three';

class Shader {

	BrightnessFilterShader() {
		return {
			uniforms: {
				'tDiffuse': { type: 't', value: null },
			},
			vertexShader: `
				varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
				}`,
			fragmentShader: `
				uniform sampler2D tDiffuse;
				varying vec2 vUv;
				void main() {
					vec4 texel = texture2D(tDiffuse, vUv);
					float lum = dot(texel, vec4(0.299, 0.587, 0.114, 0.0));
					lum = step(0.9999, lum);
					gl_FragColor = vec4(texel.xyz * lum, 1.0);

				}`
		}
	}

	GlowShader() {
		return {
			uniforms: {
				'tDiffuse': { type: 't', value: null },
				'tGlow': { type: 't', value: null },
				'intensity':  { type: 'f', value: 1.0 }
			},
			vertexShader: `
				varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
				}`,
			fragmentShader: `
				uniform float intensity;
				uniform sampler2D tDiffuse;
				uniform sampler2D tGlow;
				varying vec2 vUv;
				void main() {
					vec4 texel = texture2D(tDiffuse, vUv);
					vec4 glow = texture2D(tGlow, vUv);
					gl_FragColor = vec4(texel.xyz + glow.xyz * intensity, 1.0);

				}`
		}
	}

	ColorShader() {
		return {
			uniforms: {
				'tDiffuse': { type: 't', value: null },
				'color':    { type: 'c', value: new THREE.Color(0xffffff) }
			},
			vertexShader: `
				varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
				}`,
			fragmentShader: `
				uniform vec3 color;
				uniform sampler2D tDiffuse;
				varying vec2 vUv;
				void main() {
					vec4 texel = texture2D(tDiffuse, vUv);
					gl_FragColor = vec4(texel.xyz + color.xyz * 0.75, 1.0);
				}`
		}
	}
}

export default Shader;
