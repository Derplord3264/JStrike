import Process from '../core/Process';
import * as constants from '../const';

class Shell extends Process {

	constructor() {
		super();
		this.buffer = '';
	}

	start() {
		this.createDOM();
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
		this.out('$ '+ str);
		if (str == '') return;

		switch (str) {
			case constants.CMD_CLEAR:
				this.cmd_clear();
			break;
			case constants.CMD_HELP:
				this.cmd_help();
			break;
			default:
				this.out(`${str}: command not found (type 'help')`);
		}
	}

	createDOM() {
		document.body.innerHTML += `
			<div id="shell">
				<ul>
					<li><pre>      _  _____ _        _ _</pre></li>
					<li><pre>     | |/ ____| |      (_) |</pre></li>
					<li><pre>     | | (___ | |_ _ __ _| | _____</pre></li>
					<li><pre> _   | |\\___ \\| __| '__| | |/ / _ \\</pre></li>
					<li><pre>| |__| |____) | |_| |  | |   <  __/</pre></li>
					<li><pre> \\____/|_____/ \\__|_|  |_|_|\\_\\___|</pre></li>
					<li><pre>                              0.0.1</pre></li>
					<li></li>
					<li></li>
					<li>Welcome to JStrike!</li>
					<li>Please type 'register' if you don't have an account,</li>
					<li>or 'login' to start playing!</li>
					<li>For more information type 'help'.</li>
					<li></li>
					<li></li>
					<li id="shell-input">$ <b>&block;</b></li>
				</ul>
			</div>
		`;
	}

	cmd_clear() {
		let list = document.getElementById('shell').lastElementChild;
		let input = list.lastElementChild;

		list.innerHTML = input.outerHTML;
	}

	cmd_help() {
		this.out('Available commands:');
		this.out('<pre>	clear	- clear the screen</pre>');
		this.out('<pre>	help	- display this help</pre>');
		this.out('');
	}
}

export default Shell;
