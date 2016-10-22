import * as constants from '../../const';

class SocketHandler {

	constructor(io) {
		this.io = io;
	}

	init(engine) {
		this.engine = engine;

		this.io.on('join', (data) => this.engine.onJoin(data));
		this.io.on('disconnecting', (client_id) => this.engine.onDisconnecting(client_id));
		this.io.on('move', (data) => this.engine.onMove(data));
	}

	disconnecting() {
		this.io.emit('disconnecting');
	}

	tick() {

		if (this.engine.player.velocity.length() > constants.NULL_VELOCITY) {
			this.io.emit('move', {
				pos: this.engine.player.getPosition(),
				vel: {
					x: this.engine.player.velocity.x,
					y: this.engine.player.velocity.y,
					z: this.engine.player.velocity.z
				}
			})
		}
	}
}

export default SocketHandler;
