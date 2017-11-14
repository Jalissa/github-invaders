const pointsElement = document.getElementById('points');
const canvas = document.getElementById('canvas');
canvas.width = 500;
canvas.height = 500;

const context = canvas.getContext('2d');

const GAME_OVER = 'game-over';
const WIDTH = 26;
const HEIGHT = 16;
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


const settings = {
	enemies: {
		width: 30,
		height: 20,
		margin: 10,
    total: 50,
    speed: 1,
    rowLimit: 10,
    initY: 30,
		totalVariety: 3,
		1: { points: 10, total: 10, image: { 
        name: '1.png',
        width: 50, 
        height: 20	}
    },
		2: { points: 5, total: 20, image: { 
        name: '2.png',
        width: 75, 
        height: 20	},
    },
		3: { points: 2, total: 20, image: { 
        name: '3.png',
        width: 78, 
        height: 20	}
    }
  },
  sprites: {
    path: 'sprites/'
  },
	ships: {
		width: WIDTH,
		height: HEIGHT,
		x: INIT_X,
    y: INIT_Y,
    image: 'player.png'
  },
	shots: {
		width: 4,
		height: 13,
    movement: 10,
    color: 'white',
		y: INIT_Y - HEIGHT
	},
	explosions: {
		count: 30
  },
  shields:{
    width: 53,
    height: 38,
    total: 4,
    margin: 65,
    y: INIT_Y - HEIGHT * 4,
    image: { 
      name: 'shield.png',
      width: 210, 
      height: 38,
      frames: 4	}
  }
};

let keyHandlers = {
  onkeyup: {},
  onkeydown: {}
}

positionSigns();
document.getElementById('yes').addEventListener('click', () => initGame(settings));
context.fillStyle = 'white';

fetch('https://api.github.com/search/repositories?sort=stars&order=desc&language=javascript&q=javascript')
  .then(response => response.json())
  .then(data => {
    console.log(data);
    if(data && data.items.length) {
      for(let i = 0; i < settings.enemies.total; i++) {
        if(!data.items[i]) break;
        console.log(data.items[i].full_name, data.items[i].contributors_url );
      }
      initGame(settings);  
    }
  });

function initGame({ ships, shots, enemies, explosions, shields, sprites }){
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
  player.image = new Image(ships.width, ships.height);
  player.image.src = sprites.path + ships.image;
  player.image.addEventListener('load', () => player.draw(context, null, null));
  
  document.addEventListener('keydown', onkeydown(player));
  document.addEventListener('keyup', onkeyup(shots, player, enemies, explosions, shields));
  window.addEventListener('resize', positionSigns);

  renderedEnemies = renderEnemies(enemies, sprites);
  moveEnemies(shields);
  startEnemiesShooting(player, enemies, explosions, shots, shields);
  renderShields(sprites, shields);
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
  const gameOverPanel = positionSigns();
  gameOverPanel.style.display = 'block';

  playerCollided = false;
}

function positionSigns() {
  const coordinates = canvas.getBoundingClientRect();
  const gameOverPanel = document.getElementById(GAME_OVER);
  document.getElementById('total-points').textContent = pointsElement.textContent;
  if(!playerCollided) { document.getElementById('text').textContent = 'CONGRATS!'; }
  gameOverPanel.style.position = 'absolute';
  gameOverPanel.style.top = (coordinates.y + 220 / 2 + 15) + 'px';
  gameOverPanel.style.left = (coordinates.x + 252 / 2 + 15) + 'px';
  
  const pointsParent = pointsElement.parentNode;
  pointsParent.style.position = 'absolute';
  pointsParent.style.left = Math.abs(coordinates.x) + 10 + 'px';
  console.log(pointsParent.style.left)
  // pointsParent.style.top = coordinates.y + 'px';

  return gameOverPanel;
}

function shoot(shot, direction, player, enemiesSpeed, count, margin, shields) {
  let stopMovement = false;
  let shieldCollision, enemyCollision, playerCollision;
  if(shot.y < 0 || shot.y >= canvas.height) {
    onCollisionFn(shot);   
    stopMovement = true;
  }

  if(!stopMovement) { shot.draw(context, direction); }
  shieldCollision = detectShieldCollision(shot, onCollisionFn, direction !== 'down');
  if(direction === 'up') {
    enemyCollision = detectEnemyCollision(shot, onCollisionFn, enemiesSpeed, count, margin, shields);
  } 
  if(direction === 'down') {
    playerCollision = detectPlayerCollision(shot, onCollisionFn, player, count, margin);  
  }
  if(shieldCollision || enemyCollision || playerCollision) { 
    stopMovement = true 
  }
  const shotMovement = requestAnimationFrame(() => shoot(shot, direction, player, enemiesSpeed, count, margin, shields));
	if (stopMovement) {
    cancelAnimationFrame(shotMovement);
  } 
}

function onCollisionFn(shot) {
  context.clearRect(shot.x, shot.y, shot.width, shot.height);
}

function onkeyup(shots, player, enemies, explosions, shields) {
  keyHandlers.onkeyup = function(event){
    if (event.keyCode === LEFT_ARROW_KEY) LEFT = false;
    if (event.keyCode === RIGHT_ARROW_KEY) RIGHT = false;
    
    if (!LEFT && !RIGHT) {
      cancelAnimationFrame(shipMovementAnimation);
      shipMovementAnimation = undefined;
    }
  
    if (event.keyCode !== 32) return;
    const shot = new Shot(player, shots.y, shots.width, shots.height, shots.movement);
    shoot(shot, 'up', player, enemies.speed, explosions.count, enemies.margin, shields);
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

function renderEnemies(enemies, sprites) {
	let enemyShips = [];
  const { width, height, margin, initY, speed, total, totalVariety, rowLimit } = enemies;
  const initX = (canvas.width - rowLimit * (width + margin)) / 2;
	let x = initX;
	let y = initY;
	let currentVariety = 1;
  let count = 1;
  let varietyCount = 1;

	for (let i = 1; i <= total; i++) {
    const enemy = addEnemy(currentVariety, x, y, enemies, enemyShips, sprites);
		const newX = enemy.width + margin + x;
		x = newX + enemy.width >= canvas.width || count === rowLimit ? initX: newX;
		if (x === initX) {
      count = 0;
			y += enemy.height + margin;
    }
 
		if (varietyCount === enemies[currentVariety].total) {
      currentVariety++;
      varietyCount = 0;
    }
    count++;
    varietyCount++;
    
  }

	return enemyShips;
}

function addEnemy(varietyNumber, x, y, enemies, enemyShips, sprites) {
  const { width, height, speed } = enemies;
  const varietyEnemy = enemies[varietyNumber];
  const spriteImage = new Image();
  spriteImage.src = sprites.path + varietyEnemy.image.name;
  const sprite = new Sprite({ 
      context, width: varietyEnemy.image.width, 
      image: spriteImage, 
      height: varietyEnemy.image.height, 
      ticksPerFrame: 30, 
      numberOfFrames: 2, 
      x, y });
  const enemy = new Ship(x, y, width, height, speed, 
      { points: varietyEnemy.points, 
        level: varietyNumber,
        sprite
      });
  enemyShips.push(enemy);
  enemy.draw(context, null, null);
  return enemy;
}

function moveEnemies(shields){
  if(!renderedEnemies.length) {
    cancelAnimationFrame(enemiesMovementAnimation);
    endGame();
  }

  for(let i = 0; i < renderedEnemies.length; i++) {
    const enemy = renderedEnemies[i];
    const goRight = enemy.x - enemy.speed <= 0; 
    const goLeft = enemy.x + enemy.speed >= canvas.width - enemy.width;
    const land = enemy.y + enemy.height >= shields.y;
    if(goRight){
      enemiesDirection = 'right';      
      renderedEnemies.forEach(enemy => {
        enemy.draw(context, 'down', canvas.width);
      });
      
    }
    enemy.draw(context, enemiesDirection, canvas.width);
    if(goLeft){ enemiesDirection = 'left'; }
    if(land){
      renderedEnemies = [];
      break;
    } 
  };

  enemiesMovementAnimation = requestAnimationFrame(() => moveEnemies(shields));
}

function land(enemy){
  enemy.draw(context, 'left')
}

function startEnemiesShooting(player, enemies, explosions, shots, shields){
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
      shoot(shot, 'down', player, enemies.speed, explosions.count, enemies.margin, shields);
      enemiesShootingAnimation = requestAnimationFrame(() => startEnemiesShooting(player, enemies, explosions, shots, shields));    
    }
  }, 1000);
}

function increaseEnemySpeed(speed){
  renderedEnemies.forEach(enemy => enemy.increaseSpeed(Math.floor(5 * speed / renderedEnemies.length)));
}

function renderShields(sprites, shields){
  const { width, height, margin, total, y, image} = shields;
  const initX = 30 + (canvas.width - total * (width + margin)) / 2;
  let x = initX;
  const spriteImage = new Image();
  spriteImage.src = sprites.path + image.name;

  for (let i = 0; i < total; i++) {
    const shield = new Shield(x, y, width, height);
    const sprite = new Sprite({ 
      context, 
      width: image.width, 
      image: spriteImage, 
      height: image.height,
      numberOfFrames: image.frames, 
      x, y });  
    shield.sprite = sprite;
    renderedShields.push(shield);    
    x += margin + width;
  }
  spriteImage.addEventListener('load', () => { 
    renderedShields.forEach(shield => shield.sprite.render());
  });
}

function detectEnemyCollision(shot, onCollision, enemiesSpeed, count, margin, shields){
  const collided = detectCollision(shot, renderedEnemies);
  if (collided) {
    onCollision(shot);
    cancelAnimationFrame(enemiesMovementAnimation);
    renderedEnemies = renderedEnemies.filter(enemy => !(enemy.x === collided.x && enemy.y === collided.y));    
    killShip(collided, count, margin);
    addPoints(collided.points);
    moveEnemies(shields);
    increaseEnemySpeed(enemiesSpeed);
  }
  
  return collided;
}

function detectShieldCollision(shot, onCollision, unchange){
  const collidedShield = detectCollision(shot, renderedShields);
  if (collidedShield) {
    onCollision(shot);
    if(collidedShield.isDestroyable()) {
      context.clearRect(collidedShield.x, collidedShield.y, collidedShield.width, collidedShield.height);
      renderedShields = renderedShields.filter(shield => 
        !(shield.x === collidedShield.x 
        && shield.y === collidedShield.y))
      return collidedShield;
    }
    
    if(unchange) return collidedShield;
    collidedShield.sprite.update();
    collidedShield.sprite.render();
  } 
  return collidedShield;
}

function detectPlayerCollision(shot, onCollision, player, count, margin) {
  const collidedPlayer = detectCollision(shot, [player]);
  if (collidedPlayer) {
    onCollision(shot);
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