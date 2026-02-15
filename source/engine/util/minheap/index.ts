export type Scored = { guess: string; entropy: number };

export class MinHeap {
  private a: Scored[] = [];
  constructor(private readonly cap: number) {}

  size() { return this.a.length; }
  peek() { return this.a[0]; }

  push(x: Scored) {
    if (this.cap <= 0) return;

    if (this.a.length < this.cap) {
      this.a.push(x);
      this.siftUp(this.a.length - 1);
      return;
    }

    // If x is better than the smallest in heap, replace root
    if (this.a[0].entropy < x.entropy) {
      this.a[0] = x;
      this.siftDown(0);
    }
  }

  toSortedDesc(): Scored[] {
    // heap contains top K in arbitrary order; return sorted for display (K is tiny)
    return [...this.a].sort((p, q) => q.entropy - p.entropy);
  }

  private siftUp(i: number) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.a[p].entropy <= this.a[i].entropy) break;
      [this.a[p], this.a[i]] = [this.a[i], this.a[p]];
      i = p;
    }
  }

  private siftDown(i: number) {
    for (;;) {
      const l = i * 2 + 1;
      const r = l + 1;
      let m = i;

      if (l < this.a.length && this.a[l].entropy < this.a[m].entropy) m = l;
      if (r < this.a.length && this.a[r].entropy < this.a[m].entropy) m = r;
      if (m === i) break;

      [this.a[m], this.a[i]] = [this.a[i], this.a[m]];
      i = m;
    }
  }
}