import * as constants from '../const';
import Process from '../core/Process';
import Engine from './Engine';
import SocketHandler from './handlers/SocketHandler';

class JStrike extends Process {

	constructor(io, serverState) {
		super();

		this.io = io;
		this.config = serverState.config;
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
		this.socketHandler = new SocketHandler(this.io);
		this.engine = new Engine(this.socketHandler, this.config);
		this.initClient();
	}

	kill() {
		this.engine.kill();
		document.getElementById('jstrike').remove();
	}

	input(e) {
		/* 1 = down, 0 = up */
		let direction = (e.type == 'keydown' || e.type == 'keypress') ? 1 : 0;
		let validKey = true;

		/* Filter keys and send allowed ones to the engine */
		switch (e.keyCode) {
			case constants.KEY_W:
				this.engine.input(constants.KEY_W, direction);
			break;
			case constants.KEY_A:
				this.engine.input(constants.KEY_A, direction);
			break;
			case constants.KEY_S:
				this.engine.input(constants.KEY_S, direction);
			break;
			case constants.KEY_D:
				this.engine.input(constants.KEY_D, direction);
			break;
			case constants.KEY_SPACE:
				this.engine.input(constants.KEY_SPACE, direction);
			break;
			default:
				validKey = false;
		}
	}

	initClient() {
		this.engine.init(this.socketHandler);

		/* Menu exit listener */
		this.engine.menuExit.addEventListener('click', (e) => {
			this.socketHandler.disconnecting();
			this.interrupt({type: 'killMe'})
		}, false);
	}
}

export default JStrike;
