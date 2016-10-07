import Process from '../core/Process';
import * as constants from '../const';

class Shell extends Process {

	constructor() {
		super();
		this.buffer = '';
		this.pendingCommand = false;
	}

	start() {
		document.body.innerHTML += `
			<div id="shell">
				<ul><li id="shell-input">$ <b>&block;</b></li></ul>
			</div>
		`;
		this.exec('motd');
	}

	input(e) {
		if (e.keyCode == constants.KEY_ENTER) {
			this.exec(this.buffer);
			this.buffer = '';

		} else if (e.keyCode == constants.KEY_BACKSPACE) {
			this.buffer = this.buffer.substr(0, this.buffer.length - 1);

		} else {
			let char = String.fromCharCode(e.charCode || e.keyCode);
			this.buffer += char;
		}

		document.getElementById('shell-input').innerHTML = `$ ${this.buffer}<b>&block;</b>`;
	}

	out(str) {
		let list = document.getElementById('shell').lastElementChild;
		let element = document.createElement('li');
		element.innerHTML = str;

		list.insertBefore(element, list.lastElementChild);
		window.scrollTo(0, document.body.scrollHeight);
	}

	exec(str) {
		/* Check and set pending command to prevent
		 * multiple commands to be executed at once.
		 */
		if (this.pendingCommand) return;

		/* Shell like formatting */
		this.out('$ '+ str);
		if (str == '') return;
		this.pendingCommand = true;

		/* Special commands */
		if (str == 'clear') {
			this.cmd_clear();
			this.pendingCommand = false;
			return;
		}

		fetch('http://localhost:9001/shell/', {
			method: 'POST',
			body: str
		}).then(
			(response) => response.text()
		).then(
			(responseText) => {
				this.out(responseText);
				this.pendingCommand = false;
			}
		).catch(
			(err) => {
				this.out(err);
				this.pendingCommand = false;
			}
		);
	}

	cmd_clear() {
		let list = document.getElementById('shell').lastElementChild;
		let input = list.lastElementChild;

		list.innerHTML = input.outerHTML;
	}
}

export default Shell;
