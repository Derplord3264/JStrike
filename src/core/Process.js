import {Sys} from './Sys';

class Process {

	constructor() {
		/* Process status.
		 * 1 = running
		 * 0 = paused
		 */
		this.procRunning = 1;
	}

	interrupt(e) {
		Sys.procInterruptHandler(e);
	}

	isRunning() {
		return this.procRunning;
	}
}

export default Process;
