import {Sys} from './Sys';

class Process {

	constructor() {

	}

	interrupt(e) {
		Sys.procInterruptHandler(e);
	}
}

export default Process;
