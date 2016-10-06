import InputHandler from './InputHandler';

class OS {

	constructor() {
		/* Create a new InputHandler */
		this.inputHandler = new InputHandler(this);

		/* Init process stack */
		this.procStack = new Map();
		this.procActive = 0;
	}

	/* Input interrupt fired by the InputHandler.
	 */
	inputInterruptHandler(e) {
		let proc = this.getProcess(this.procActive);

		if (proc) {
			proc.input(e);
		}
	}

	/* Process interrupt fired by running processes.
	 */
	procInterruptHandler(e) {
		// Handle interrupt
	}

	/* Return a process object specified
	 * by its process ID.
	 */
	getProcess(pid) {

		/* If process stack is empty, warn and return */
		if (this.procStack.size == 0) {
			console.warn('OS::getProcess Process stack empty.');
			return null;
		}

		return this.procStack.get(pid);
	}

	/* Add a new process object to the process stack */
	startProcess(processObject) {

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
}

export default OS;
