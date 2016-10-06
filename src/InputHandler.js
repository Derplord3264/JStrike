class InputHandler {

	constructor(os) {
		this.os = os;

		window.addEventListener('keydown', e => this.os.inputInterruptHandler(e));
	}
}

export default InputHandler;
