import * as constants from '../const';
import Process from '../core/Process';
import Engine from './Engine';

class JStrike extends Process {

	constructor(io, config) {
		super();

		this.io = io;
		this.config = config;
		console.log('JStrike started');
		console.log(config);
	}

	start() {
		document.body.innerHTML += `
			<div id="jstrike">
				<div id="loader"></div>
				<div id="menu">
					<div id="menu-container">
						<b id="menu-continue">CONTINUE</b>
						<b id="menu-setting">SETTINGS</b>
						<b id="menu-exit">EXIT</b>
					</div>
				</div>
			</div>`;
		this.initClient();
	}

	input(e) {
		
	}

	initClient() {
		this.engine = new Engine(this.config);
		this.engine.initPointerLock();
		this.engine.initGraphics();
		this.engine.loadAssets();
		this.engine.animate();
	}
}

export default JStrike;
