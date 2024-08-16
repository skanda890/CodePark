// Game.js

class Game {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.width = 800;
    this.height = 600;
    this.player = { x: 50, y: 50, width: 50, height: 50, color: 'blue' };
    this.keys = {};

    document.body.appendChild(this.canvas);
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    window.addEventListener('keydown', (e) => this.keys[e.key] = true);
    window.addEventListener('keyup', (e) => this.keys[e.key] = false);

    this.update();
  }

  update() {
    this.clear();
    this.drawPlayer();
    this.handleInput();
    requestAnimationFrame(() => this.update());
  }

  clear() {
    this.context.clearRect(0, 0, this.width, this.height);
  }

  drawPlayer() {
    this.context.fillStyle = this.player.color;
    this.context.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
  }

  handleInput() {
    if (this.keys['ArrowUp']) this.player.y -= 5;
    if (this.keys['ArrowDown']) this.player.y += 5;
    if (this.keys['ArrowLeft']) this.player.x -= 5;
    if (this.keys['ArrowRight']) this.player.x += 5;
  }
}

const game = new Game();
