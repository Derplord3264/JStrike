import * as constants from '../const';
import Process from '../core/Process';
import Engine from './Engine';

class JStrike extends Process {

	constructor(io, config) {
		super();

		this.io = io;
		this.config = config;
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

	kill() {
		cancelAnimationFrame(this.engine.reqAnimFrame);
		this.engine = null;
		delete this.engine;
		document.getElementById('jstrike').remove();
	}

	input(e) {
		
	}

	initClient() {
		this.engine = new Engine(this.config);
		this.engine.initPointerLock();
		this.engine.initGraphics();
		this.engine.loadAssets();
		this.engine.animate();

		/* Menu exit listener */
		this.engine.menuExit.addEventListener('click', (e) => {
			this.interrupt({
				type: 'killMe'
			})
		}, false);
	}
}

export default JStrike;
