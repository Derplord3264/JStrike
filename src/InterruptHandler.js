class InterruptHandler {

	constructor(os) {
		this.os = os;
	}

	interrupt(e) {
		this.os.procInterruptHandler(e);
	}
}

export default InterruptHandler;
