function Ship(x, y, width, height, speed = 2, enemyShipInfo) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.speed = speed;
	this.level = enemyShipInfo && enemyShipInfo.level;
  this.points = enemyShipInfo && enemyShipInfo.points;
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
    const newY = height + speed;
    this.y += newY;
  }
};

Ship.prototype.draw = function(context, direction, limitWidth) {
  if(direction) {
    context.clearRect(this.x, this.y, this.width, this.height);       
    this.move(direction, limitWidth);
  }
  context.fillRect(this.x, this.y, this.width, this.height);
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