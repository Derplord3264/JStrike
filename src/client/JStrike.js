import * as constants from '../const';
import Process from '../core/Process';
import Engine from './Engine';

class JStrike extends Process {

	constructor(game_id) {
		super();

		this.socket = new Socket(game_id);
	}

	start() {
		this.initClient();
	}

	input(e) {
		
	}

	initClient() {
		let config = this.socket.getConfig();

		if (config.status) {
			this.engine = new Engine(config);
			this.engine.loadAssets();
		}
	}
}

export default JStrike;
