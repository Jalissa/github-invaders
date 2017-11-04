const canvas = document.getElementById('canvas');
canvas.width =  900;
canvas.height = 900;

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

const settings = {
	enemies: {
    width: WIDTH,
    height: HEIGHT,
    margin: 10,
    total: 20,
    totalVariety: 3,
    1: {
      points: 10
    },
    2: {
      points: 5
    },
    3: {
      points: 2
    }
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

function Ship(x, y, width, height, speed = 2, enemyShipInfo) {
	this.x = x;
	this.y = y;
	this.width = width;
  this.height = height;
  this.speed = speed;
  this.level = enemyShipInfo && enemyShipInfo.level;
  this.points = enemyShipInfo && enemyShipInfo.points;

}
Ship.prototype.move = function(left, limitWidth) {
  const {x, speed, width} = this;
	if(left){
    const newX = x - speed;
    this.x = newX >= 0 ? x - speed : x;
  } else {
    const newX = x + speed;
    this.x = newX <= (limitWidth - width) ? x + speed : x;
  }
};

function Shot(ship, y, width, height, movement) {
	this.x = ship.x + ship.width / 2 - width;
	this.y = y;
	this.width = width;
	this.height = height;
	this.movement = movement;
}
Shot.prototype.move = function() {
	this.y -= this.movement;
};

const player = new Ship(ships.x, ships.y, ships.width, ships.height);

context.fillRect(player.x, player.y, player.width, player.height);

let renderedEnemies = renderEnemies();

function moveShip() {
  if(LEFT || RIGHT) {
    context.clearRect(player.x, player.y, player.width, player.height);
    player.move(LEFT, canvas.width);
    context.fillRect(player.x, player.y, player.width, player.height);
  } 
  shipMovementAnimation = requestAnimationFrame(moveShip);    
}

function onkeyup(event) {
  if(event.keyCode === LEFT_ARROW_KEY) LEFT = false;
  if(event.keyCode === RIGHT_ARROW_KEY) RIGHT = false;
  if(!LEFT && !RIGHT){
    cancelAnimationFrame(shipMovementAnimation);
    shipMovementAnimation = undefined;
  }

  shoot(event);
}

function onkeydown(event) {
  if(event.keyCode === LEFT_ARROW_KEY) LEFT = true;
  if(event.keyCode === RIGHT_ARROW_KEY) RIGHT = true;
  if(!shipMovementAnimation) moveShip();
}

document.addEventListener('keydown', onkeydown);
document.addEventListener('keyup', onkeyup);

function renderEnemies() {
  const enemyShips = [];
	const { width, height, margin, speed, total, totalVariety } = enemies;
  let x = 0;
  let y = 0;
  let currentVariety = 1;

	for (let i = 0; i < total*totalVariety; i++) {
    const enemy = addEnemy(totalVariety, x, y);
    const newX = enemy.width + margin + x;
    x = newX + enemy.width <= canvas.width ? newX : 0;
    if (x === 0) { 
      y += enemy.height + margin; 
    }
    if(i === total*currentVariety){
      currentVariety++;
    }
  }
  
  function addEnemy(varietyNumber, x, y){
    const enemy = new Ship(x, y, width, height, speed, 
        { points: enemies[varietyNumber].points, level: varietyNumber } )
    enemyShips.push(enemy);
    context.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    return enemy;
  }

	return enemyShips;
}

function shoot(event) {
	if (event.keyCode !== 32) return;
	const shot = new Shot(player, shots.y, shots.width, shots.height, shots.movement);
	paintShots(shot);
}

function killShip(shot) {
	let collidedEnemy = {};
	const collisions = renderedEnemies.filter(enemy => {
		const collision =
			enemy.x < shot.x + shot.width &&
			enemy.x + enemy.width > shot.x &&
			enemy.y < shot.y + shot.height &&
			enemy.height + enemy.y > shot.y;
		if (collision) {
			collidedEnemy = Object.assign({}, enemy);
			context.clearRect(enemy.x, enemy.y, enemy.width, enemy.height);
			explode(
				{
					width: enemy.width,
					height: enemy.height,
					x: enemy.x,
					y: enemy.y
				},
				{
					x: enemy.x + enemy.width / 2,
					y: enemy.y + enemy.height / 2
				},
				context
			);
		}
		return collision;
	});

	return {
		collisions,
		collidedEnemy
	};
}

function explode(container, center, context) {
	paintParticles(new ParticleSystem(container, center, explosions.count, context), container);
}

function paintShots(shot) {
	let stopMovement = false;
	// const {x, y, width, height} = shot;
	const { collisions, collidedEnemy } = killShip(shot);
	context.clearRect(shot.x, shot.y, shot.width, shot.height);

	if (collisions.length || shot.y < 0) {
		stopMovement = true;
		renderedEnemies = renderedEnemies.filter(enemy => !(enemy.x === collidedEnemy.x && enemy.y === collidedEnemy.y));
		return;
	} else {
		shot.move();
		context.fillRect(shot.x, shot.y, shot.width, shot.height);
	}
	const shotMovement = requestAnimationFrame(() => paintShots(shot));
	if (stopMovement) {
		cancelAnimationFrame(shotMovement);
	}
}

function paintParticles(p, container) {
	const margin = enemies.margin;
	const doubleMargin = margin * 2;

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
