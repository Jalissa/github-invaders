const WIDTH = 20;
const HEIGHT = 20;
const COLOR = 'black';
const INIT_Y = 250;
const INIT_X = 130;
const intervals = [];

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

const ship = {
  width: WIDTH,
  height: HEIGHT,
  initX: INIT_X,
  initY: INIT_Y,
  x: INIT_X,
  y: INIT_Y
};


let shotInitX = INIT_X + 7;
function Shot() {
  this.x = shotInitX;
  this.y = INIT_Y - 15;;
  this.width = 5;
  this.height = 10;

  this.move = () => this.y -= 15;
}

const { color, initX, initY, width, height } = ship;

context.fillStyle = color;
context.fillRect(initX, initY, width, height);

let enemies = renderEnemies();

shoot(new Shot());
const shootingInterval = setInterval(() => {
  shoot(new Shot());
  if (!enemies.length) {
    intervals.forEach(interval => clearInterval(interval));
  }
}, 2000);
intervals.push(shootingInterval);


document.addEventListener('keydown', move);

function move(event){
  switch(event.keyCode) {
    case 37:
      moveMainShip(() => {
        ship.x -= WIDTH /2;
        shotInitX = ship.x + 7;
      });
      break;
    case 39:
      moveMainShip(() => {
        ship.x += WIDTH /2;
        shotInitX = ship.x + 7; 
      });
      break;
  }
}
function moveMainShip(operation){
  context.clearRect(ship.x, initY, WIDTH, HEIGHT);
  operation();
  context.fillRect(ship.x, initY, WIDTH, HEIGHT);
}

function renderEnemies() {
  const enemies = [];

  let x = 0;
  let y = 0;

  for(let i = 0; i < 24; i++) {
    enemies.push({ x, y });
    context.fillRect(x, y, WIDTH, HEIGHT);
    x += 25;
    if (x === canvas.width) {
      x = 0;
      y += 25;
    }
  }

  return enemies;
}

function shoot(shot){
  const shotInterval = setInterval(() => {
    context.clearRect(shot.x , shot.y, shot.width, shot.height);
    shot.move();

    const {collisions, collidedEnemy} = killShip(shot);
    if(shot.y < 0) {
      clearInterval(intervals.shift());
    }
    if (collisions.length) {
      clearInterval(intervals.shift());
      
      context.clearRect(shot.x, shot.y, shot.width, shot.height);
      enemies.splice(enemies.findIndex(enemy => enemy.x === collidedEnemy.x 
                                                && enemy.y === collidedEnemy.y), 1);
    } else { 
      context.fillRect(shot.x, shot.y, shot.width, shot.height);      
    }
  }, 700);
  intervals.push(shotInterval);
}

function killShip(shot) {
  let collidedEnemy = {};
  const collisions = enemies.filter(enemy => {
    const collision = enemy.x < shot.x + shot.width &&
                      enemy.x + WIDTH > shot.x &&
                      enemy.y < shot.y + shot.height &&
                      HEIGHT + enemy.y > shot.y;
    if (collision) {
      collidedEnemy = Object.assign({}, enemy);
      context.clearRect(enemy.x, enemy.y, WIDTH, HEIGHT);
    }
    return collision;
  });

  return { 
    collisions,
    collidedEnemy
  }
}


