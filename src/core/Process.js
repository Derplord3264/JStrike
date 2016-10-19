import {Sys} from './Sys';

class Process {

	constructor() {
		this.running = true;
	}

	pause() {
		this.running = false;
	}

	continue() {
		this.running = true;
	}

	isRunning() {
		return this.running;
	}

	interrupt(e) {
		Sys.interruptHandler(e);
	}
}

export default Process;
