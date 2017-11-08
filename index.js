const pointsElement = document.getElementById('points');
const canvas = document.getElementById('canvas');
canvas.width = 700;
canvas.height = 700;

const context = canvas.getContext('2d');

const GAME_OVER = 'game-over';
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
let enemiesShootingTimer;
let enemiesDirection = 'right';
let renderedEnemies = [];
let renderedShields = [];
let playerCollided = false;

const pointsParent = pointsElement.parentNode;
pointsParent.style.position = 'absolute';
const canvasCoordinates = canvas.getBoundingClientRect();
pointsParent.style.left = canvasCoordinates.x + 10 + 'px';
pointsParent.style.top = canvasCoordinates.y + 'px';


const settings = {
	enemies: {
		width: WIDTH,
		height: HEIGHT,
		margin: 20,
    total: 20,
    speed: 1,
    rowLimit: 10,
    initY: pointsParent.clientHeight + 10,
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
    width: 70,
    height: 40,
    total: 4,
    margin: 70,
    y: INIT_Y - HEIGHT * 4
  }
};

let keyHandlers = {
  onkeyup: {},
  onkeydown: {}
}

document.getElementById('yes').addEventListener('click', () => initGame(settings));
initGame(settings);

function initGame({ ships, shots, enemies, explosions, shields }){
  document.getElementById(GAME_OVER).style.display = 'none';
  document.getElementById('text').textContent = 'GAME OVER';
  playerCollided = false;
  pointsElement.innerHTML = '0';
  LEFT = false;
  RIGHT = false;
  enemiesDirection = 'right';
  renderedEnemies = [];
  renderedShields = [];
  const player = new Ship(ships.x, ships.y, ships.width, ships.height);
  player.draw(context, null, null);
  
  document.addEventListener('keydown', onkeydown(player));
  document.addEventListener('keyup', onkeyup(shots, player, enemies, explosions));

  renderedEnemies = renderEnemies(enemies);
  moveEnemies();
  startEnemiesShooting(player, enemies, explosions, shots);
  renderShields(shields);
}

function endGame(){
  context.clearRect(0, 0, canvas.width, canvas.height);
  cancelAnimationFrame(shipMovementAnimation);
  cancelAnimationFrame(enemiesMovementAnimation);
  cancelAnimationFrame(enemiesShootingAnimation);
  clearTimeout(enemiesShootingTimer);
  renderedEnemies = [];
  renderedShields = [];
  document.removeEventListener('keyup', keyHandlers.onkeyup);
  document.removeEventListener('keydown', keyHandlers.onkeydown);
  keyHandlers = {
    onkeyup: {},
    onkeydown: {}
  }
  const coordinates = canvas.getBoundingClientRect();
  const gameOverPanel = document.getElementById(GAME_OVER);
  document.getElementById('total-points').textContent = pointsElement.textContent;
  if(!playerCollided) { document.getElementById('text').textContent = 'Congrats!'; }
  gameOverPanel.style.position = 'absolute';
  gameOverPanel.style.top = (coordinates.y + canvas.height / 3) + 'px';
  gameOverPanel.style.left = (coordinates.x + canvas.width / 3) + 'px';
  gameOverPanel.style.display = 'block';
  playerCollided = false;
}

function shoot(shot, direction, player, enemiesSpeed, count, margin) {
  let stopMovement = false;
  if(shot.y < 0 || shot.y >= canvas.height) {
    stopMovement = true;
  }
  shot.draw(context, direction);
  detectShieldCollision(shot, () => { stopMovement = true });
  if(direction === 'up') {
    detectEnemyCollision(shot, () => { stopMovement = true }, enemiesSpeed, count, margin);
  } 
  if(direction === 'down') {
    detectPlayerCollision(shot, () => { stopMovement = true }, player, count, margin);
  }
  const shotMovement = requestAnimationFrame(() => shoot(shot, direction, player, enemiesSpeed, count, margin));
	if (stopMovement) {
    cancelAnimationFrame(shotMovement);
  } 
}

function onkeyup(shots, player, enemies, explosions) {
  keyHandlers.onkeyup = function(event){
    if (event.keyCode === LEFT_ARROW_KEY) LEFT = false;
    if (event.keyCode === RIGHT_ARROW_KEY) RIGHT = false;
    
    if (!LEFT && !RIGHT) {
      cancelAnimationFrame(shipMovementAnimation);
      shipMovementAnimation = undefined;
    }
  
    if (event.keyCode !== 32) return;
    const shot = new Shot(player, shots.y, shots.width, shots.height, shots.movement);  
    delay(() => {
      shoot(shot, 'up', player, enemies.speed, explosions.count, enemies.margin);
    }, 300);
  }
  return keyHandlers.onkeyup;
}

function onkeydown(player) {
  keyHandlers.onkeydown = function(event){
    if (event.keyCode === LEFT_ARROW_KEY) LEFT = 'left';
    if (event.keyCode === RIGHT_ARROW_KEY) RIGHT = 'right';
    if (!shipMovementAnimation) moveShip(player);
  }
  return keyHandlers.onkeydown;
}

function moveShip(player) {
	if (LEFT || RIGHT) {
    player.draw(context, LEFT || RIGHT, canvas.width);
	}
	shipMovementAnimation = requestAnimationFrame(() => moveShip(player));
}

function renderEnemies(enemies) {
	let enemyShips = [];
  const { width, height, margin, initY, speed, total, totalVariety, rowLimit } = enemies;
  const initX = (canvas.width - rowLimit * (width + margin)) / 2;
	let x = initX;
	let y = initY;
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

function moveEnemies(){
  if(!renderedEnemies.length) {
    cancelAnimationFrame(enemiesMovementAnimation);
    endGame();
  }
  renderedEnemies.forEach((enemy, i) => {
    if(enemy.x - enemy.speed <= 0){
      enemiesDirection = 'right';
      goDown();
    } 
    enemy.draw(context, enemiesDirection, canvas.width);
  
    if(enemy.x + enemy.speed >= canvas.width - enemy.width){
      enemiesDirection = 'left';
    }
  });

  enemiesMovementAnimation = requestAnimationFrame(moveEnemies);
}

function goDown(){
  renderedEnemies.forEach((enemy, i) => {
    enemy.draw(context, 'down', canvas.width);
  });
}

function startEnemiesShooting(player, enemies, explosions, shots){
  const loners = renderedEnemies.filter(enemy => {
    const underlings = renderedEnemies.filter(enemy2 => {
      return enemy.x === enemy2.x && enemy2.y >= enemy.height + enemies.margin + enemy.y;
    });
    if(!underlings.length){
      return enemy;
    }
  });

  if(!loners.length || !renderedEnemies.length) {
    cancelAnimationFrame(enemiesShootingAnimation);
  }
  
  enemiesShootingTimer = setTimeout(() => {
    const randomEnemy = loners[Math.floor(Math.random()*loners.length)];
    if (randomEnemy) {
      const shot = new Shot(randomEnemy, randomEnemy.y + randomEnemy.height, shots.width, shots.height, shots.movement / 2);            
      shoot(shot, 'down', player, enemies.speed, explosions.count, enemies.margin);
      enemiesShootingAnimation = requestAnimationFrame(() => startEnemiesShooting(player, enemies, explosions, shots));    
    }
  }, 1000);
}

function increaseEnemySpeed(speed){
  renderedEnemies.forEach(enemy => enemy.increaseSpeed(Math.floor(5 * speed / renderedEnemies.length)));
}

function renderShields(shields){
  const { width, height, margin, total, y} = shields;
  const initX = 30 + (canvas.width - total * (width + margin)) / 2;
  let x = initX;
  for (let i = 0; i < total; i++) {
    renderedShields.push({x, y, width, height});
    context.fillRect(x, y, width, height);
    x += margin + width;
  }
}

function detectEnemyCollision(shot, onCollision, enemiesSpeed, count, margin){
  const collided = detectCollision(shot, renderedEnemies);
  if (collided) {
    onCollision();
    cancelAnimationFrame(enemiesMovementAnimation);
    renderedEnemies = renderedEnemies.filter(enemy => !(enemy.x === collided.x && enemy.y === collided.y));    
    killShip(collided, count, margin);
    addPoints(collided.points);
    moveEnemies();
    increaseEnemySpeed(enemiesSpeed);
  }
  
  return collided;
}

function detectShieldCollision(shot, onCollision){
  const collidedShield = detectCollision(shot, renderedShields);
  if (collidedShield) {
    onCollision();
    context.clearRect(shot.x, shot.y, shot.width, shot.height);
  } 
  return collidedShield;
}

function detectPlayerCollision(shot, onCollision, player, count, margin) {
  const collidedPlayer = detectCollision(shot, [player]);
  if (collidedPlayer) {
    onCollision();
    if(collidedPlayer) {
      playerCollided = true;
      killShip(collidedPlayer, count, margin);
      endGame();
    }
  }

  return collidedPlayer;
}

function addPoints(points) {
  const currentPoints = parseInt(pointsElement.textContent);
  pointsElement.innerHTML = currentPoints + points;
}