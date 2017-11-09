function Ship(x, y, width, height, speed = 2, extraShipInfo) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.speed = speed;
	this.level = extraShipInfo && extraShipInfo.level;
  this.points = extraShipInfo && extraShipInfo.points;
  this.sprite = extraShipInfo && extraShipInfo.sprite;
  this.image = extraShipInfo && extraShipInfo.image;
}

Ship.prototype.move = function(direction, limitWidth) {
	const { x, speed, width, height } = this;
	if (direction === 'left') {
		const newX = x - speed;
		this.x = newX >= 0 ? x - speed : x;
  } 
  if(direction === 'right') {
		const newX = x + speed;
		this.x = newX <= limitWidth - width ? x + speed : x;
  }
  if(direction === 'down') {
    this.y += speed;
  }
};

Ship.prototype.draw = function(context, direction, limitWidth) {
  if(direction) {
    context.clearRect(this.x, this.y, this.width, this.height);       
    this.move(direction, limitWidth);
  }
  if(this.sprite) {
    this.sprite.updateCoordinates(this.x, this.y);
    this.sprite.update();
    this.sprite.render();
  } else {
    context.drawImage(this.image, this.x, this.y);
  }
};

Ship.prototype.increaseSpeed = function(speed) {
  this.speed += speed;
};

function Shot(ship, y, width, height, movement) {
	this.x = ship.x + ship.width / 2 - width;
	this.y = y;
	this.width = width;
	this.height = height;
	this.movement = movement;
}
Shot.prototype.move = function(direction) {
  if(direction === 'down') {
    this.y += this.movement;
  } 
  if(direction === 'up') {
    this.y -= this.movement;
  }
};

Shot.prototype.draw = function(context, direction) {
  if(direction) {
    context.clearRect(this.x, this.y, this.width, this.height);
    this.move(direction);
  }
  context.fillRect(this.x, this.y, this.width, this.height);
};

function Sprite({context, width, height, image, ticksPerFrame, numberOfFrames, x, y}){
  this.context = context;
  this.width = width;
  this.height = height;
  this.image = image;
  this.frameIndex = 0;
  this.tickCount = 0;
  this.ticksPerFrame = ticksPerFrame || 0;
  this.numberOfFrames = numberOfFrames || 1;
  this.x = x;
  this.y = y;
}

Sprite.prototype.updateCoordinates = function(x, y) {
  this.x = x;
  this.y = y;
}

Sprite.prototype.render = function (){
  const width = this.width / this.numberOfFrames;
  this.context.clearRect(this.x, this.y, width, this.height);
  this.context.drawImage(
    this.image,
    this.frameIndex * width,
    0,
    width,
    this.height,
    this.x,
    this.y,
    width,
    this.height);
}

Sprite.prototype.update = function () {
  this.tickCount += 1;
  if (this.tickCount > this.ticksPerFrame) {
    this.tickCount = 0;
    if (this.frameIndex < this.numberOfFrames - 1) {	
      this.frameIndex += 1;
    } else {
      this.frameIndex = 0;
    }
  }
}; 

function Shield(x, y, width, height, sprite) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.sprite = sprite;
}
