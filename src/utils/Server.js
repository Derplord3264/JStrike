import * as constants from '../const';
import IO from 'socket.io-client';


class Server {

	constructor(server) {
		this.socket = new IO(server);

	}

	kill() {
		this.socket.disconnect();
	}

}

export default Server;
