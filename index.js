const canvas = document.getElementById('canvas');
canvas.width = 900;
canvas.height = 800;

const context = canvas.getContext('2d');

const WIDTH = 60;
const HEIGHT = 40;
const INIT_Y = canvas.height - HEIGHT;
const INIT_X = canvas.width / 2 - WIDTH;
const LEFT_ARROW_KEY = 37;
const RIGHT_ARROW_KEY = 39;

let LEFT = false;
let RIGHT = false;

let shipMovementAnimation;
let enemiesMovementAnimation;
let enemiesShootingAnimation;
let enemiesDirection = 'right';

const settings = {
	enemies: {
		width: WIDTH,
		height: HEIGHT,
		margin: 20,
    total: 20,
    speed: 1,
		rowLimit: 10,
		totalVariety: 3,
		1: { points: 10	},
		2: { points: 5	},
		3: { points: 2  }
	},
	ships: {
		width: WIDTH,
		height: HEIGHT,
		x: INIT_X,
		y: INIT_Y
  },
	shots: {
		width: 5,
		height: 20,
		movement: 10,
		y: INIT_Y - HEIGHT / 2
	},
	explosions: {
		count: 30
	}
};

const { ships, shots, enemies, explosions } = settings;
const player = new Ship(ships.x, ships.y, ships.width, ships.height);
player.draw(context, null, null);

let renderedEnemies = renderEnemies();

moveEnemies();
startEnemiesShooting();

function moveEnemies(){
  if(!renderedEnemies.length) {
    cancelAnimationFrame(enemiesMovementAnimation);
  }

  renderedEnemies.forEach((enemy) => {
    if(enemy.x - enemy.speed <= 0){
      enemiesDirection = 'right';
    } 
    enemy.draw(context, enemiesDirection, canvas.width);
    if(enemy.x + enemy.speed >= canvas.width - enemy.width){
      enemiesDirection = 'left';
    }
  });

  enemiesMovementAnimation = requestAnimationFrame(moveEnemies);
}

function startEnemiesShooting(){
  if(!renderedEnemies.length) {
    cancelAnimationFrame(enemiesShootingAnimation);
  }

  const loners = renderedEnemies.filter(enemy => {
    const underlings = renderedEnemies.filter(enemy2 => {
      return enemy.x === enemy2.x && enemy2.y >= enemy.height + enemies.margin + enemy.y;
    });
    if(!underlings.length){
      return enemy;
    }
  });
  
  const randomEnemy = loners[Math.floor(Math.random()*loners.length)];
  if (randomEnemy) {
    const shot = new Shot(randomEnemy, randomEnemy.y + randomEnemy.height, shots.width, shots.height, shots.movement / 2);
    shoot(shot, true);
    setTimeout(() => {
      enemiesShootingAnimation = requestAnimationFrame(startEnemiesShooting);    
    }, 2000)
  } else {
    cancelAnimationFrame(enemiesShootingAnimation);
  }
  
}

function moveShip() {
	if (LEFT || RIGHT) {
    player.draw(context, LEFT || RIGHT, canvas.width);
	}
	shipMovementAnimation = requestAnimationFrame(moveShip);
}

function onkeyup(event) {
	if (event.keyCode === LEFT_ARROW_KEY) LEFT = false;
  if (event.keyCode === RIGHT_ARROW_KEY) RIGHT = false;
  
	if (!LEFT && !RIGHT) {
		cancelAnimationFrame(shipMovementAnimation);
		shipMovementAnimation = undefined;
  }

  if (event.keyCode !== 32) return;
  const shot = new Shot(player, shots.y, shots.width, shots.height, shots.movement);  
  shoot(shot, false);
}

function onkeydown(event) {
	if (event.keyCode === LEFT_ARROW_KEY) LEFT = 'left';
	if (event.keyCode === RIGHT_ARROW_KEY) RIGHT = 'right';
	if (!shipMovementAnimation) moveShip();
}

document.addEventListener('keydown', onkeydown);
document.addEventListener('keyup', onkeyup);

function renderEnemies() {
	let enemyShips = [];
  const { width, height, margin, speed, total, totalVariety, rowLimit } = enemies;
  const initX = (canvas.width - rowLimit * (width + margin)) / 2;
	let x = initX;
	let y = 0;
	let currentVariety = 1;
	let count = 1;
	// const margin = (canvas.width - rowLimit * width) / rowLimit;
	for (let i = 0; i < total * totalVariety; i++) {
    const enemy = addEnemy(totalVariety, x, y);
		const newX = enemy.width + margin + x;
		x = newX + enemy.width >= canvas.width || count === rowLimit ? initX: newX;
		if (x === initX) {
      count = 0;
			y += enemy.height + margin;
		}
		if (i === total * currentVariety) currentVariety++;
		count++;
  }

  function addEnemy(varietyNumber, x, y) {
    const enemy = new Ship(x, y, width, height, speed, { points: enemies[varietyNumber].points, level: varietyNumber });
    enemyShips.push(enemy);
    enemy.draw(context, null, null);
    return enemy;
  }

	return enemyShips;
}

// SHOOTING
function shoot(shot, ignoreCollisions) {
	paintShots(shot, ignoreCollisions);
}

function paintShots(shot, ignoreCollisions) {
  let stopMovement = false;
  if(shot.y < 0 || shot.y >= canvas.width) {
    stopMovement = true;
  }
  if(!ignoreCollisions) {
    const { collisions, collidedEnemy } = detectCollision(shot, renderedEnemies);
    if (collisions.length && !ignoreCollisions) {
      stopMovement = true;
      cancelAnimationFrame(enemiesMovementAnimation);
      killShip(collidedEnemy);
      moveEnemies();
    } else {
      shot.draw(context, 'up');
    }
  } else {
    shot.draw(context, 'down');
  }
  const shotMovement = requestAnimationFrame(() => paintShots(shot, ignoreCollisions));
	if (stopMovement) {
    cancelAnimationFrame(shotMovement);
  } 
}

// KILL ENEMY SHIPs
function killShip(collidedEnemy){
  renderedEnemies = renderedEnemies.filter(enemy => !(enemy.x === collidedEnemy.x && enemy.y === collidedEnemy.y));    
  context.clearRect(collidedEnemy.x, collidedEnemy.y, collidedEnemy.width, collidedEnemy.height);
  explode(
    {
      width: collidedEnemy.width,
      height: collidedEnemy.height,
      x: collidedEnemy.x,
      y: collidedEnemy.y
    },
    {
      x: collidedEnemy.x + collidedEnemy.width / 2,
      y: collidedEnemy.y + collidedEnemy.height / 2
    },
    context
  );
}

// EXPLOSIONS
function explode(container, center, context) {
	paintParticles(new ParticleSystem(container, center, explosions.count, context), container);
}

function paintParticles(p, container) {
	const margin = enemies.margin;
	const doubleMargin = margin*2;
	context.clearRect(
		container.x - margin,
		container.y - margin,
		container.width + doubleMargin,
		container.height + doubleMargin
	);
	if (p.update()) {
		cancelAnimationFrame(explosionId);
		return;
	}
	var explosionId = requestAnimationFrame(() => paintParticles(p, container));
}

function detectCollision(shot, targets) {
	const collisions = targets.filter(enemy => {
		const collision =
			enemy.x < shot.x + shot.width &&
			enemy.x + enemy.width > shot.x &&
			enemy.y < shot.y + shot.height &&
			enemy.height + enemy.y > shot.y;
		return collision;
	});

	return {
		collisions,
		collidedEnemy: collisions.length ? collisions[0] : {}
	};
}