
class ProcessStack {

	constructor() {
		this.map = new Map;
		this.top = null;
	}

	push(proc) {
		this.top = this.map.size + 1;
		this.map.set(
			this.top,
			proc
		);
		return this.top;
	}

	pop() {
		this.map.delete(this.top);
		this.top--;
	}

	getItem(i) {
		return this.map.get(i);
	}

	getTopItem() {
		return this.map.get(this.top);
	}

	pauseAll() {
		for (let proc of this.map.values()) {
			if (proc.isRunning())
				proc.pause();
		}
	}
}

export default ProcessStack;
