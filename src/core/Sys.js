import * as constants from '../const';

class System {

	constructor() {

		/* Init process stack */
		this.procStack = new Map();
		this.procActive = 0;

		/* Add input even listeners */
		window.addEventListener('keypress', 	(e) => this.inputHandler(e));
		window.addEventListener('keydown', 		(e) => this.inputHandler(e));
		window.addEventListener('keyup', 		(e) => this.inputHandler(e));
		window.addEventListener('mousedown', 	(e) => this.inputHandler(e));
		window.addEventListener('mouseup', 		(e) => this.inputHandler(e));
	}

	/* Input interrupt.
	 * Stop browser propagation and send the input,
	 * unfiltered, to the active process.
	 */
	inputHandler(e) {
		e.stopPropagation();
		//e.preventDefault();

		let proc = this.getProcess(this.procActive);

		if (proc) {
			proc.input(e);
		}
	}

	/* Process interrupt fired by running processes.
	 */
	procInterruptHandler(e) {
		switch (e.type) {
			case 'startProcess':
				this.startProcess(e.process);
			break;
			case 'killMe':
				this.killMe();
			break;
			default:
				console.warn('Sys::procInterruptHandler Unknown type.');
				return null;
		}
	}

	/* Return a process object specified
	 * by its process ID.
	 */
	getProcess(pid) {

		/* If process stack is empty, warn and return */
		if (this.procStack.size == 0) {
			console.warn('Sys::getProcess Process stack empty.');
			return null;
		}

		return this.procStack.get(pid);
	}

	/* Add a new process object to the process stack,
	 * start it and make it the active process.
	 */
	startProcess(processObject) {

		/* Pause running processes */
		for (let proc of this.procStack.values()) {
			if (proc.isRunning())
				proc.pause();
		}

		/* Get new process ID */
		let cur_pid = this.procStack.size;
		let new_pid = cur_pid + 1;

		/* Add process object to process stack */
		this.procStack.set(
			new_pid,
			processObject
		);

		/* Start the process */
		this.procActive = new_pid;
		this.getProcess(new_pid).start();

		return new_pid;
	}

	/* Kill current process and continue previous */
	killMe() {
		let cur_pid = this.procStack.size;
		let proc = this.getProcess(cur_pid);
		proc.kill();
		proc = null;
		this.procStack.delete(cur_pid);

		let next_pid = this.procStack.size;
		this.procActive = next_pid;
		this.getProcess(next_pid).continue();
	}
}

export let Sys = new System;
