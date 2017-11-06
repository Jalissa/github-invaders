function detectCollision(shot, targets) {
	const collisions = targets.filter(enemy => {
		const collision =
			enemy.x < shot.x + shot.width &&
			enemy.x + enemy.width > shot.x &&
			enemy.y < shot.y + shot.height &&
			enemy.height + enemy.y > shot.y;
		return collision;
	});

	return collisions.length ? collisions[0] : null;
}

const delay = (function(){
  let timer = 0;
  return function(callback, ms){
    clearTimeout (timer);
    timer = setTimeout(callback, ms);
  };
})();

function killShip(collided, count, margin){
  context.clearRect(collided.x, collided.y, collided.width, collided.height);
  explode(
    {
      width: collided.width,
      height: collided.height,
      x: collided.x,
      y: collided.y
    },
    {
      x: collided.x + collided.width / 2,
      y: collided.y + collided.height / 2
    },
    count,
    context,
    margin
  );
}

function explode(container, center, count, context, margin, ) {
	paintParticles(new ParticleSystem(container, center, count, context),container, margin);
}

function paintParticles(p, container, margin) {
	const doubleMargin = margin*2;
	context.clearRect(
		container.x - margin,
		container.y - margin,
		container.width + doubleMargin,
		container.height + doubleMargin
  );
	const explosionId = requestAnimationFrame(() => paintParticles(p, container, margin));  
	if (p.update()) {
    cancelAnimationFrame(explosionId);
    return;
	}
}