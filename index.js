const pointsElement = document.getElementById('points');
const canvas = document.getElementById('canvas');
canvas.width = 700;
canvas.height = 700;

const context = canvas.getContext('2d');

const WIDTH = 40;
const HEIGHT = 20;
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

let renderedEnemies = [];
let renderedShields = [];

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
		y: INIT_Y - HEIGHT
	},
	explosions: {
		count: 30
  },
  shields:{
    width: 80,
    height: 40,
    total: 4,
    margin: 60,
    y: INIT_Y - HEIGHT * 4
  }
};

const { ships, shots, enemies, explosions, shields } = settings;
const player = new Ship(ships.x, ships.y, ships.width, ships.height);
player.draw(context, null, null);

renderedEnemies = renderEnemies();
moveEnemies();
startEnemiesShooting();
renderShields();

function moveEnemies(){
  if(!renderedEnemies.length) {
    cancelAnimationFrame(enemiesMovementAnimation);
  }
  renderedEnemies.forEach(enemy => {
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
    shoot(shot, 'down');
    setTimeout(() => {
      enemiesShootingAnimation = requestAnimationFrame(startEnemiesShooting);    
    }, 1000);
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
  delay(() => {
    shoot(shot, 'up');
  }, 300);
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
    const enemy = addEnemy(currentVariety, x, y);
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

function renderShields(){
  const { width, height, margin, total, y} = shields;
  const initX = 30 + (canvas.width - total * (width + margin)) / 2;
  let x = initX;
  for (let i = 0; i < total; i++) {
    renderedShields.push({x, y, width, height});
    context.fillRect(x, y, width, height);
    x += margin + width;
  }
}

// SHOOTING
function shoot(shot, direction) {
  let stopMovement = false;
  if(shot.y < 0 || shot.y >= canvas.height) {
    stopMovement = true;
  }
  if(direction === 'up') {
    const { collisions, collided } = detectCollision(shot, renderedEnemies);
    if (collisions.length) {
      stopMovement = true;
      cancelAnimationFrame(enemiesMovementAnimation);
      killShip(collided);
      addPoints(collided.points);
      moveEnemies();
      increaseEnemySpeed();
    } else {
      collideWithShield(shot, stopMovement, direction);
    }
  } 
  if(direction === 'down') {
    collideWithShield(shot, stopMovement, direction);
  }
  const shotMovement = requestAnimationFrame(() => shoot(shot, direction));
	if (stopMovement) {
    cancelAnimationFrame(shotMovement);
  } 
}

function increaseEnemySpeed(){
  renderedEnemies.forEach(enemy => enemy.increaseSpeed(Math.floor(5 * enemies.speed / renderedEnemies.length)));
}

function collideWithShield(shot, stopMovement, direction){
  const { collisions, collided } = detectCollision(shot, renderedShields);
  if (collisions.length) {
    stopMovement = true;
    context.clearRect(shot.x, shot.y, shot.width, shot.height);
  } else {
    shot.draw(context, direction);      
  }
}

function addPoints(points) {
  const currentPoints = parseInt(pointsElement.textContent);
  pointsElement.innerHTML = currentPoints + points;
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
		collided: collisions.length ? collisions[0] : {}
	};
}

var delay = (function(){
  var timer = 0;
  return function(callback, ms){
    clearTimeout (timer);
    timer = setTimeout(callback, ms);
  };
})();