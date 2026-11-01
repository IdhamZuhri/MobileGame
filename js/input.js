// Unified movement input: virtual joystick (touch/mouse drag) + WASD/arrow keys.
export class Input {
  constructor(canvas) {
    this.vx = 0; this.vy = 0;
    this.keys = new Set();
    this.stick = document.getElementById('stick');
    this.knob = document.getElementById('knob');
    this.pointerId = null;
    this.origin = null;
    this.radius = 50;

    addEventListener('keydown', e => this.keys.add(e.key.toLowerCase()));
    addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
    canvas.addEventListener('pointerdown', e => this.down(e));
    addEventListener('pointermove', e => this.move(e));
    addEventListener('pointerup', e => this.up(e));
    addEventListener('pointercancel', e => this.up(e));
  }

  down(e) {
    if (this.pointerId !== null) return;
    this.pointerId = e.pointerId;
    this.origin = { x: e.clientX, y: e.clientY };
    this.stick.style.display = 'block';
    this.stick.style.left = e.clientX + 'px';
    this.stick.style.top = e.clientY + 'px';
    this.move(e);
  }

  move(e) {
    if (e.pointerId !== this.pointerId) return;
    let dx = e.clientX - this.origin.x, dy = e.clientY - this.origin.y;
    const d = Math.hypot(dx, dy);
    if (d > this.radius) { dx *= this.radius / d; dy *= this.radius / d; }
    this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
    this.vx = dx / this.radius; this.vy = dy / this.radius;
  }

  up(e) {
    if (e.pointerId !== this.pointerId) return;
    this.pointerId = null;
    this.vx = this.vy = 0;
    this.stick.style.display = 'none';
    this.knob.style.transform = '';
  }

  // Returns a movement vector with length <= 1.
  axis() {
    let x = this.vx, y = this.vy;
    const k = this.keys;
    if (k.has('a') || k.has('arrowleft')) x -= 1;
    if (k.has('d') || k.has('arrowright')) x += 1;
    if (k.has('w') || k.has('arrowup')) y -= 1;
    if (k.has('s') || k.has('arrowdown')) y += 1;
    const len = Math.hypot(x, y);
    return len > 1 ? { x: x / len, y: y / len } : { x, y };
  }
}
