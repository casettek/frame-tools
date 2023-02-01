const p5 = window.p5;

let particles = [];

class Particle {
  // each individual particle will have these settings
  constructor() {
    this.pos = createVector(0, 0);
    this.speed = 1;
    this.depth = 0;
    this.reset();
  }

  reset() {
    this.pos = createVector(floor(random(windowWidth) / 12) * 12, -36);
    this.speed = random(0.2, 1.2);
  }

  update() {
    if (this.pos.y > windowHeight) {
      this.reset();
    }
    this.pos.y += this.speed * 12;
  }

  draw() {
    const char = String.fromCharCode(floor(random(33, 142)));
    fill(0, 100, 0, map(this.speed, 0.2, 1.2, 49, 109));
    text(char, this.pos.x, floor(this.pos.y / 14) * 14);
  }
}

window.setup = () => {
  createCanvas(windowWidth, windowHeight);

  textFont("monospace");
  textSize(15);

  colorMode(RGB, 1, 100, 100, 100);

  background(0);
};

window.draw = () => {
  fill(0, 10);

  rect(0, 0, windowWidth, windowHeight);

  if (particles.length < 120) particles.push(new Particle());

  particles.forEach((particle) => {
    particle.draw();
    particle.update();
  });
};

window.draw = () => {
  fill(0, 10);

  rect(0, 0, windowWidth, windowHeight);

  if (particles.length < 120) particles.push(new Particle());

  particles.forEach((particle) => {
    particle.draw();
    particle.update();
  });
};
