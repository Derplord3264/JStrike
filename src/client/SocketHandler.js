
class SocketHandler {

	constructor(io, engine) {
		this.io = io;
		this.engine = engine;

		this.io.on('join', (data) => this.engine.onJoin(data));
		this.io.on('disconnecting', (client_id) => this.engine.onDisconnecting(client_id));
		this.io.on('move', (data) => this.engine.onMove(data));
	}

	tick() {

		if (this.engine.player.velocity.length() > this.engine.settings.nullVelocity) {
			this.io.emit('move', {
				pos: this.engine.controls.getObject().position,
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
