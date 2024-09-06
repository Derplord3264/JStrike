import * as constants from '../const';
import ProcessStack from './ProcessStack';

class System {

	constructor() {
		/* Init process stack */
		this.stack = new ProcessStack();

		/* Add input event listeners */
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

		let current = this.stack.getTopItem();
		if (current !== undefined) {
			current.input(e);
		}
	}

	/* Process interrupt fired by running processes.
	 */
	interruptHandler(e) {
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

	/* Push a new process object to the process stack.
	 * Start it.
	 */
	startProcess(proc) {
		/* Pause running processes */
		this.stack.pauseAll();
		/* Push new process */
		let pid = this.stack.push(proc);
		/* Start new process */
		this.stack.getItem(pid).start();

		return pid;
	}

	/* Kill current process and continue previous */
	killMe() {
		this.stack.getTopItem().kill();
		this.stack.pop();
		this.stack.getTopItem().continue();
	}
}

export let Sys = new System;
