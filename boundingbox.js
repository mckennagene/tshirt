class BoundingBox {

  constructor(name = "unnamed") {
    this.clear();
    this.name = name; // was added for debugging
    this.pointCount = 0;
    this.debug = false;
  }

  numPoints() { return this.pointCount; }
  hasPoints() { return this.pointCount > 0; }

  getWidth() {
    return (this.x2 - this.x1);
  }

  getHeight() {
    return (this.y2 - this.y1);
  }

  clear() {
    this.x1 = Number.MAX_SAFE_INTEGER;
    this.y1 = Number.MAX_SAFE_INTEGER;
    this.x2 = Number.MIN_SAFE_INTEGER;
    this.y2 = Number.MIN_SAFE_INTEGER;
    this.pointCount = 0;
  }

  rectangle(border) {
    return {
      x: this.x1 - border, y: this.y1 - border,
      width: this.getWidth() + border * 2, height: this.getHeight() + border * 2
    };
  }

  turnDebugOn() { this.debug = true; }
  isDebugOn() { return this.debug; }
  contains(pt,buffer=0) {
    if (pt.x  >= this.x1 - buffer && pt.x  <= this.x2 + buffer
      && pt.y >= this.y1 - buffer && pt.y  <= this.y2 + buffer) {
      return true;
    }
  }

  addPoint(x, y) {
    if (x < this.x1) { this.x1 = x; }
    if (y < this.y1) { this.y1 = y; }
    if (x > this.x2) { this.x2 = x; }
    if (y > this.y2) { this.y2 = y; }
    this.pointCount++;
    //console.log("adding pt " + Math.floor(x) + "," + Math.floor(y) + " to " + this.name + " range now:" + 
    //    Math.floor(this.x1) + "," + Math.floor(this.y1) + "-" + Math.floor(this.x2) + "," + Math.floor(this.y2));
  }

  addBoundingBox(bb) {
    if (!bb) { return; }
    if (bb.x1 === Number.MAX_SAFE_INTEGER || bb.y1 === Number.MAX_SAFE_INTEGER ||
      bb.x2 === Number.MIN_SAFE_INTEGER || bb.y2 === Number.MIN_SAFE_INTEGER) { return; }
    this.addPoint(bb.x1, bb.y1);
    this.pointCount++;
    this.addPoint(bb.x2, bb.y2);
    this.pointCount++;
  }
  getBBoxAsString() {
    return "bbox " + this.name + " spans " + Math.floor(this.x1) + "," + Math.floor(this.y1) + " to " + Math.floor(this.x2) + "," + Math.floor(this.y2);
  }
}
