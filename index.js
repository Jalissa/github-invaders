const canvas = document.getElementById('canvas');
canvas.width = 500 || window.innerWidth;
canvas.height = 500 || window.innerHeight;

const context = canvas.getContext('2d');

const WIDTH = 60;
const HEIGHT = 40;
const COLOR = 'black';
const INIT_Y = canvas.height - HEIGHT*2;
const INIT_X = (canvas.width / 2) - WIDTH;
const intervals = [];

const settings = {
  enemy: {
    width: 60,
    height: 40,
    total: 30,
    margin: 10
  },
  ship: {
    width: WIDTH,
    height: HEIGHT,
    initX: INIT_X,
    initY: INIT_Y,
    x: INIT_X,
    y: INIT_Y
  },
  shot: {
    width: 5,
    height: 20,
    movement: 15,
    initX: INIT_X + (WIDTH /2),
    initY: INIT_Y
  }
}

const {ship, shot, enemy} = settings;

let shotInitX = shot.initX;
function Shot() {
  this.x = shotInitX;
  this.y = shot.initY;
  this.width = shot.width;
  this.height = shot.height;
}
Shot.setX = (x) => shotInitX = x;
Shot.prototype.move = function(){ this.y -= shot.movement };


const { color, initX, initY, width, height } = ship;

context.fillStyle = color;
context.fillRect(initX, initY, width, height);

let enemies = renderEnemies();

shoot(new Shot());
const shootingInterval = setInterval(() => {
  shoot(new Shot());
  if (!enemies.length) {
    clearInterval(shootingInterval);
  }
}, 1500);
intervals.push(shootingInterval);

document.addEventListener('keydown', move);

function move(event){
  switch(event.keyCode) {
    case 37:
      moveMainShip(() => {
        ship.x -= width /2;
        Shot.setX(ship.x + (width /2));
      });
      break;
    case 39:
      moveMainShip(() => {
        ship.x += WIDTH /2;
        Shot.setX(ship.x + (width /2));
      });
      break;
  }
}
function moveMainShip(operation){
  context.clearRect(ship.x, initY, width, height);
  operation();
  context.fillRect(ship.x, initY, width, height);
}

function renderEnemies() {
  const enemies = [];

  let x = 0;
  let y = 0;
  const width = enemy.width;
  const height = enemy.height;

  for(let i = 0; i < enemy.total; i++) {
    enemies.push({ x, y, width, height });
    context.fillRect(x, y, width, height);
    x += width + enemy.margin;
    if (x >= canvas.width) {
      x = 0;
      y += height + enemy.margin;
    }
  }

  return enemies;
}

function shoot(shot){
  const shotInterval = setInterval(() => {
  
    context.clearRect(shot.x, shot.y, shot.width, shot.height);
    shot.move();
    shot.interval = shotInterval;
    const {collisions, collidedEnemy} = killShip(shot);
    if (collisions.length || shot.y < 0) {
      clearInterval(shot.interval);
      
      context.clearRect(shot.x, shot.y, shot.width, shot.height);
      enemies = enemies.filter(enemy => !(enemy.x === collidedEnemy.x && enemy.y === collidedEnemy.y));
  
    } else { 
      context.fillRect(shot.x, shot.y, shot.width, shot.height);      
    }
  }, 700);
}

function killShip(shot) {
  let collidedEnemy = {};
  const collisions = enemies.filter(enemy => {
    const collision = enemy.x < shot.x + shot.width &&
                      enemy.x + enemy.width > shot.x &&
                      enemy.y < shot.y + shot.height &&
                      enemy.height + enemy.y > shot.y;
    if (collision) {
      collidedEnemy = Object.assign({}, enemy);
      context.clearRect(enemy.x, enemy.y, enemy.width, enemy.height);
      explode({
        width: enemy.width + 10, height: enemy.height + 10,
        x: enemy.x, y: enemy.y
      },
      { x: enemy.x + enemy.width /2 , y: enemy.y + enemy.height /2 },
      context);
    
    }
    return collision;
  });

  return { 
    collisions,
    collidedEnemy
  }
}


function explode(container, center, context) {
  const p = new ParticleSystem(
    container,
    center, 
    30, 
    context);

  paint();
  function paint() {
    if(p.update()){
      return;
    }
    requestAnimationFrame(paint);
  }
}

