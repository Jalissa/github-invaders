var Particle = function(x, y, vx, vy) {
	this.x = x || 0;
	this.y = y || 0;
	this.vx = vx || 0;
	this.vy = vy || 0;
	
	this.update = function (vx, vy) {
		vx = vx || 0,
		vy = vy || 0;
 
		this.x += this.vx + vx;
		this.y += this.vy + vy;
	};
};

var ParticleSystem = function(container, center, count, context) {

	count = count || 0;
 
	this.particles = [];
 
	this.center = {
		x: center.x || 0,
		y: center.y || 0
	};
 
	// Initialization
	for ( let i = 0; i < count ; ++i ) {
		let x = this.center.x,
				y = this.center.y,
				vx = Math.random() * 3 - 1.5,
				vy = Math.random() * 3 - 1.5;
 
		this.particles.push(new Particle(x, y, vx, vy));
	}
 
	this.update = function() {
		const stopAnimation = this.particles.filter(particle => {
			return container.x < particle.x + 1 &&
				container.x + container.width > particle.x &&
				container.y < particle.y + 1 &&
				container.y + container.height  > particle.y
		});

		if(!stopAnimation.length){
			return true;
		}
		
		for (let i = 0 ; i < count ; ++i ) {
			const x = this.particles[i].x;
			const y = this.particles[i].y;
			
			if (container.x < x + 1 &&
					container.x + container.width  > x &&
					container.y < y + 1 &&
					container.y + container.height  > y) {

				this.particles[i].update();

				context.fillRect(x, y, 1, 1);
			} 
		}

	};
};