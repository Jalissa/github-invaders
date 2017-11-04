const Particle = function(x, y, vx, vy, width, height) {
	this.x = x || 0;
	this.y = y || 0;
	this.vx = vx || 0;
	this.vy = vy || 0;
	this.width = width || 3;
	this.height = height || 3;

	this.update = function(vx, vy) {
		(vx = vx || 0), (vy = vy || 0);

		this.x += this.vx + vx;
		this.y += this.vy + vy;
	};
};

const ParticleSystem = function(container, center, count, context) {
	count = count || 0;

	this.particles = [];

	this.center = {
		x: center.x || 0,
		y: center.y || 0
	};

	for (let i = 0; i < count; ++i) {
		let x = this.center.x,
			y = this.center.y,
			vx = Math.random() * 3 - 1.5,
			vy = Math.random() * 3 - 1.5;

		this.particles.push(new Particle(x, y, vx, vy));
	}

	this.update = function() {
		const stopAnimation = this.particles.filter(particle => isOutOfContainer(container, particle));

		if (stopAnimation.length < count / 10) {
			return true;
		}

		for (let i = 0; i < count; ++i) {
			const { x, y, width, height } = this.particles[i];

			if (isOutOfContainer(container, this.particles[i])) {
				this.particles[i].update();

				context.fillRect(x, y, width, height);
			}
		}
	};
};

const isOutOfContainer = (container, particle) => {
	const { x, y, width, height } = particle;
	return (
		container.x < x + width &&
		container.x + container.width > x &&
		container.y < y + height &&
		container.y + container.height > y
	);
};
