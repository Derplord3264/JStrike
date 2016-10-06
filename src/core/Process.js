import {Sys} from '../core/Sys';

class Process {

	constructor() {

	}

	interrupt(e) {
		Sys.procInterruptHandler(e);
	}
}

export default Process;
