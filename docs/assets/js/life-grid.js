/** Conway's B3/S23 rules on a finite grid with dead cells beyond its edges. */
export class LifeGrid {
  constructor(columns, rows, cells) {
    this.columns = columns;
    this.rows = rows;
    this.cells = cells ? Uint8Array.from(cells) : new Uint8Array(columns * rows);
    this.next = new Uint8Array(this.cells.length);
  }

  resize(columns, rows) {
    const cells = new Uint8Array(columns * rows);
    for (let y = 0; y < Math.min(rows, this.rows); y++) {
      cells.set(this.cells.subarray(y * this.columns, y * this.columns + Math.min(columns, this.columns)), y * columns);
    }
    this.columns = columns;
    this.rows = rows;
    this.cells = cells;
    this.next = new Uint8Array(cells.length);
  }

  step(pinned = -1) {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.columns; x++) {
        let neighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < this.columns && ny >= 0 && ny < this.rows) {
              neighbors += this.cells[ny * this.columns + nx];
            }
          }
        }
        const index = y * this.columns + x;
        this.next[index] = Number(index === pinned || neighbors === 3 || (this.cells[index] === 1 && neighbors === 2));
      }
    }
    [this.cells, this.next] = [this.next, this.cells];
  }
}
