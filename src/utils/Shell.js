import * as constants from '../const';
import Process from '../core/Process';
import Server from './Server';
import JStrike from '../client/JStrike';

class Shell extends Process {

	constructor() {
		super();

		/* Buffer holding the current input string */
		this.buffer = '';
		/* Boolean preventing multi-exec commands */
		this.executing = false;
		/* Server instance when connected to a server */
		this.Server = null;
		/* Server namespace used in shell */
		this.connected_server = '';
		/* Commands that should be executed over a socket */
		this.external_cmd = [
			'show'
		];
	}

	start() {
		/* Create HTML and issue the help command */
		document.body.innerHTML += `
			<div id="shell">
				<ul><li id="shell-input">$ <b>&block;</b></li></ul>
			</div>`;
		this.exec('help');
	}

	pause() {
		document.getElementById('shell').style.display = 'none';
	}

	input(e) {

		if (this.executing) return;

		switch (e.keyCode) {
			case constants.KEY_ENTER:
				this.exec(this.buffer);
			break;
			case constants.KEY_BACKSPACE:
				this.buffer = this.buffer.slice(0, -1);
			break;
			default:
				let char = String.fromCharCode(e.charCode || e.keyCode);
				this.buffer += char;
		}

		let str = `${this.connected_server}$ ${this.buffer}<b>&block;</b>`;
		
		document.getElementById('shell-input').innerHTML = str;
	}

	hideInput() {
		this.executing = true;
		document.getElementById('shell-input').style.display = 'none';
	}

	showInput() {
		this.executing = false;

		let str = `${this.connected_server}$<b>&block;</b>`;
		document.getElementById('shell-input').innerHTML = str;
		document.getElementById('shell-input').style.display = 'block';
	}

	out(str, id = null) {
		let list = document.getElementById('shell').lastElementChild;
		let lines = str.split('\n');

		for (let line of lines) {
			let element = document.createElement('li');
			element.innerHTML = id ? `${this.connected_server}$ ${line}` : line;

			list.insertBefore(element, list.lastElementChild);
		}

		window.scrollTo(0, document.body.scrollHeight);
	}

	exec(str) {
		this.buffer = '';

		/* Prevent multi-exec */
		if (this.executing) return;

		/* Shell like formatting */
		this.out(str, true);
		if (str == '') return;
		this.executing = true;

		/* Extract arguments */
		let argv = str.split(' ');

		/* If executing an external command and
		 * connected to a server, do a socket cmd.
		 */
		if (this.external_cmd.indexOf(argv[0]) >= 0 && this.connected_server) {
			console.log('external cmd');
			return;
		}

		/* Executing local command */
		switch (argv[0]) {
			case 'clear': 		this.cmd_clear();			break;
			case 'help': 		this.cmd_help();			break;
			case 'connect': 	this.cmd_connect(argv[1]);	break;
			default: 			this.out(`Unknown command: '${argv[0]}'`)
		}
	}

	cmd_clear() {
		let list = document.getElementById('shell').lastElementChild;
		let input = list.lastElementChild;
		list.innerHTML = input.outerHTML;
		this.executing = false;
	}

	cmd_help() {
		this.out(`Available commands:
			<pre>	clear		- clear the screen</pre>
			<pre>	help		- display this help</pre>
			<pre>	connect [IP]	- connect to a server</pre>
			`);
		this.executing = false;
	}

	cmd_connect(server) {
		if (server == '' || server === undefined) {
			this.out(`connect: IP address required`);
			return;
		}

		this.out(`connecting to ${server}`);
		this.setup_socket(server);
		this.hideInput();
	}

	setup_socket(server) {
		this.Server = new Server(server, {
			'sync disconnect on unload': true
		});

		this.Server.socket.on('connect', data => {
			this.out(`Connection successful!\n`);
			this.connected_server = server;
			this.showInput();
		});

		this.Server.socket.on('connect_error', data => {
			this.Server.kill();
			this.Server = null;
			this.connected_server = '';
			this.out(`Failed to connect to ${server}\n`);
			this.showInput();
		});

		this.Server.socket.on('')
	}
}

export default Shell;
