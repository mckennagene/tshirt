class Shape {

    static initialized = false;
    static id = 0;
    static phi = (Math.sqrt(5) + 1) / 2;
    static phiSquared = Shape.phi * Shape.phi;
    static initializeShapes() {
        let rt3 = Math.sqrt(3);
        let phi = Shape.phi; // just to shorten it in the matrices below.
        Shape.shapePts = {
            t: [[2, 0], [-3, -3 * rt3], [-3, 3 * rt3], [6, 0]],
            //t:[[2,0],[0,2],[-2,0],[0,-2]],
            h: [[-2, 0], [-1, rt3], [1, rt3], [8, 0], [1, -rt3], [-4, -4 * rt3], [-2, 0], [-3, 3 * rt3]],//, [5, 0],[0, rt3], [3, 0], [1, -rt3], ], 
            f: [[-2, 0], [2, 2 * rt3], [6, 0], [1, -rt3], [-1, -rt3], [-8, 0]],
            p: [[-2, 0], [2, 2 * rt3], [8, 0], [-2, -2 * rt3], [-8, 0]]
        };
        Shape.metaShapes = {
            // degrees to turn, length to travel
            t: [[0, 3 * phi], [120, 3 * phi], [120, 3 * phi]],
            p: [[]],
            f: [[]],
            h: [[0, 1], [60, 1 + 3 * phi], [60, 1], [60, 1 + 3 * phi], [60, 1], [60, 1 + 3 * phi]]
        };
        Shape.initialized = true;
    }

    static createShapeArray(puzzle, shapes) {
        if (!shapes) { return; }
        let shapeArray = [];
        for (let s of shapes) {
            let shapeName = "t";
            let shapeLevel = 0;
            let flip = -1;
            let colorName = "white";
            if (s.shapeName) { shapeName = s.shapeName; }
            if (s.shapeLevel) { shapeLevel = s.shapeLevel; }
            if (s.flip) {
                if (s.flip == -1) { flip = -1; }
                else if (s.flip == 1) { flip = 1; }
                else { flip = s.flip ? 1 : -1; }
            }
            //console.log("s.flip incoming was " + s.flip + " now flip is " + flip ) ;
            if (s.colorName) { colorName = s.colorName; }
            //console.log("create a guide shape " + shapeName + " " + shapeLevel + " " + flip + " " + colorName );
            shapeArray.push(new Shape(null, puzzle, s.x, s.y, s.heading, colorName, flip, shapeName, shapeLevel));
        }
        return shapeArray;
    }

    constructor(parent, puzzle, x, y, heading, color = "white", flip = -1, shapeName = "t", shapeLevel = 0) {
        if (!Shape.initialized) { Shape.initializeShapes(); }
        this.id = Shape.id++;
        this.parent = parent;
        this.puzzle = puzzle;
        this.x = x;
        this.y = y;
        this.heading = heading;
        this.shapeName = shapeName;
        this.shapeLevel = shapeLevel;
        let canvasPt = Puzzle.gridToCanvas(this.x, this.y, Puzzle.KITE_SIZE);
        this.canvasX = canvasPt.x;
        this.canvasY = canvasPt.y;
        //console.log("constructor flip=" + flip);
        this.flip = -1;
        if (flip) {
            if (flip === true || flip === 1) { this.flip = 1; }
        }

        //console.log("constructor this.flip=" + this.flip);
        this.colorName = color;
        if (this.shapeLevel === 0) {
            if (this.flip === -1) { this.colorName = "red"; }
            else { this.colorName = "blue"; }
        }

        this.shadows = [];
        this.children = new Map();

        this.pointTemplate = [];
        if (this.shapeName.includes("t")) { this.pointTemplate = Shape.shapePts.t; this.metaShapes = Shape.metaShapes.t; }
        if (this.shapeName.includes("h")) { this.pointTemplate = Shape.shapePts.h; this.metaShapes = Shape.metaShapes.h; }
        if (this.shapeName.includes("f")) { this.pointTemplate = Shape.shapePts.f; this.metaShapes = Shape.metaShapes.f; }
        if (this.shapeName.includes("p")) { this.pointTemplate = Shape.shapePts.p; this.metaShapes = Shape.metaShapes.p; }
        // when we draw the level 1 shapes, we have little arrows along the extend line 
        // to show where the t-shirts can extend beyond the shape outline
        if (this.shapeLevel === 1) {
            this.extendLine = 3;
            if (this.shapeName === "f") { this.extendLine = 5; }
            if (this.shapeName === "p") { this.extendLine = 4; }
        }
        //this.points = [];
        //this.computePoints(1);

        this.createDescendents();
    }
    /*
        // create a single level 1+ shape
        createChild(dx, dy, dh, name) {
            console.log("\t"+this.shapeName + " create child " + name);
            new Shape(this.puzzle, Puzzle.gridCoordinateAdjust(this, dx, dy, this.heading + dh), name, this.shapeLevel - 1);
        }
    */

    // create a single level 0 shape (shadow)
    // if it's create a shadow, shouldn't the name just be hard wired to t?
    createShadowChild(dx, dy, rv, dh, flip, color, name) {
        const rgp = Puzzle.gridCoordinateAdjust(this, dx, dy, this.heading + rv);
        const cp = Puzzle.gridToCanvas(rgp.x, rgp.y, Puzzle.KITE_SIZE);
        const h = Puzzle.normalizeDegrees(this.heading + dh);
        //console.log("createShadowChild " + rgp.x + "," + rgp.y + "," + h + " flip=" + flip + " color="+ color);
        return new Shape(this, this.puzzle, rgp.x, rgp.y, h, color, flip, name, 0); // missing canvas coordinates
    }

    
    // to create level 0 shapes
    // { id: 1 x: 8, y: 5, heading: 240, flip: false, colorName: "red" },
    // { id: 0 x: 7, y: 4, heading: 180, flip: false, colorName: "red" },
    createDescendents() {
        if (this.shapeLevel === 0) { return; }
        if (this.shapeLevel === 1) { this.createShadows(); }
        else { this.createChildren(); }
    }
    
    createShadows() {
        //console.log("create shadows for " + this.shapeName + " at " + this.x + "," + this.y + " heading " + this.heading + " flip=" + this.flip + " color=" + this.colorName);
        const ts = this.shadows;
        if (this.shapeName === "h") {
            ts.push(this.createShadowChild(0, 1, 0, 0, false, "red", "t")); // 180
            ts.push(this.createShadowChild(1, -1, 0, 0, false, "red", "t")); // 180
            ts.push(this.createShadowChild(1, 0, 0, 240, false, "red", "t")); // 180
            ts.push(this.createShadowChild(0, 0, 0, -60, true, "blue", "t")); // -180
        } else if (this.shapeName === "f" || this.shapeName === "p") {
            // sidekick 1
            ts.push(this.createShadowChild(0, 0, 0, 180, false, "red", "t"));
            ts.push(this.createShadowChild(1, 0, 0, 240, false, "red", "t"));
        } else if (this.shapeName === "t") {
            ts.push(this.createShadowChild(0, 0, 0, 0, false, "red", "t"));
        }
    }

    
    // for shapes ...
    // t,h,p,f are level 1
    // sf, sp, sh are level 2
    // ssh is level 3
    createChildren() {
        // drop these super shapes down a level and convert their parts into shadows recursively
        if (this.shapeName === "sp" || this.shapeName === "sf") { // these are level 2 shapes
            this.createChild("p", -1, 0, 0, 60);    // one p
            this.createChild("h", -1, 0, -1, 180);  // 2 h's - one on either side
            this.createChild("h", -1, 3, -1, 240);
            this.createChild("f", -1, 4, 0, 120);
            this.createChild("f", -1, -2, -1, 300);
            if (this.shapeName === "sf") {
                this.createChild("f", -1, 2, 1, 0);
            }
        } else if (this.shapeName === "sh") { // this is a level 2 shape
            this.createChild("t", -1, 0, 0, 0);      // the one t surrounded by ...
            this.createChild("h", -1, 1, -2, 300);    // 3 h's
            this.createChild("h", -1, -1, 1, 60);
            this.createChild("h", -1, -2, -1, 60);
            this.createChild("p", -1, -3, -2, 300);     // flanked by 3 p's (top of the left side)
            this.createChild("p", -1, 2, -2, 180);   // top 
            this.createChild("p", -1, 2, 1, 240);   //  
            this.createChild("f", -1, -1, -3, 180);
            this.createChild("f", -1, -2, 1, 300);  // and flanked by 3 f's 
            this.createChild("f", -1, 2, 0, 60);  //    
        } else if (this.shapeName === "ssh") {  // this is a level 3 shape
            this.createChild("h", -2, 0, 0, 0);     // one t surrounded by ...
            this.createChild("sh", -1, 4, -1, 240); // 3 sh's       1,-2,300 ==>  4,-1,240  (rotate 1,-2 by -60 degrees (2,0) then double length that is 4,0, then off by 1 in y)
            this.createChild("sh", -1, 0, 4, 0);    // 3 sh's      -1, 1, 60 ==>  0, 4,  0  (rotate -1,1 by +60 degrees (0,2) then double length that is 0,4, good)
            this.createChild("sh", -1, -2, -2, 0);  // 3 sh's      -2,-1, 60 ==> -2,-2,  0  (rotate -2,-1 by -60 degrees

            this.createChild("sf", -1, -2, -7, 180); // top
            this.createChild("sp", -1, 5, -6, 180);

            this.createChild("sf", -1, 9, 1, 60); // right
            this.createChild("sp", -1, 4, 4, 240);

            this.createChild("sf", -1, -5, 5, 300); // left
            this.createChild("sp", -1, -7, -1, -60);


        }
        else if (this.shapeName === "sssh") {  // this is a level 4 shape
            //{ x: 24, y: 21, shapeName: "h", shapeLevel: 1, heading: 0 },
            //{ x: 22, y: 19, shapeName: "sh", shapeLevel: 2, heading: 300 },
            //{ x: 24, y: 25, shapeName: "sh", shapeLevel: 2, heading: 300 },
            //{ x: 28, y: 20, shapeName: "sh", shapeLevel: 2, heading: 180 }, 
            let scale = 5;
            this.createChild("sh", -2, 0, 0, 0);
            this.createChild("ssh", -1, 0 * scale, -2 * scale, 300);
            //this.createChild("ssh", -1, 0 * scale, 4 * scale, -60);   
            //this.createChild("ssh", -1, -2 * scale, -1 * scale, -60); 
        }
    }
/*
    drawGuide(ctx, size, levelScalar) {
        //if (this.shapeLevel >= 1) {
        this.drawShape(ctx, size, levelScalar);

        //}
        //else { return; }
        //
        //else if (this.shape && this.shapeLevel === 2) {
        //    for (let i = 0; i < this.children.length; i++) {
        //        this.children[i].drawShape(ctx, size);
        //    }
        //}
    }
    */
    
/*
    drawMetaShape(ctx, size) {
        //console.log("meta: draw meta shapes for " + this.shapeName);
        let metaMoves = Shape.metaShapes.h;

        if (this.shapeName === "sh") { //} || this.shapeName === "ssh") {
            // get my flyfot children - at some point we need to rename all of these and use level to distinguish level
            let fylfotChildren;
            if (this.shapeName === "sh") { fylfotChildren = this.children.get("f"); }
            else { fylfotChildren = this.children.get("sf"); }
            // we don't want all the f's, we want the ones that matter
            // the ones that matter are the first ones in each child structure. 
            // so in an sh, we have 3 children, they all happen to be f's.
            // in an ssh, we have 3 children, they are sf's, so we want the first 'f' of each sf
            // in an sssh, we have 3 children, they are ssf's, so we want the first 'f' of each ssf
            // ...


            let keyPts = [];
            //console.log("meta: shape is " + this.shapeName + " there are " + fylfotChildren.length + " fylfot children");
            if (fylfotChildren && fylfotChildren.length > 0) {
                //console.log("\tmeta:drawing the shape");
                for (let i = 0; i < fylfotChildren.length; i++) {
                    let fc = fylfotChildren[i];
                    //console.log("\tmeta: fylfot child " + fc.id + " @ " + fc.x + "," + fc.y + " heading=" + fc.heading);
                    if (fc.fylfotPoints && fc.fylfotPoints.length > 0) {
                        //console.log("\tmeta: the fylfot kid has points");
                        for (let j = 0; j < fc.fylfotPoints.length; j++) {
                            keyPts.push({ id: fc.id, heading: fc.heading, x: fc.fylfotPoints[j].x, y: fc.fylfotPoints[j].y });
                            //console.log("\tmeta: add keyPoint childId:" + fc.id + " pt=" + fc.fylfotPoints[j].x + "," + fc.fylfotPoints[j].y);
                        }
                    }
                }
            }
            //console.log("meta: now draw the actual lines");

            // the short side of the irregular hexagon is H
            // the long sides of irregular hexagon are H(1+3phi)
            // so H^2 + (H(1+3phi))^2 = the distance between any two of the key fylfot points
            // UPDATE now thinking of SuperTiles (Jun 3rd)
            // the key points are formed by the tip of the F's point. And that moves depending on the level
            // between two different options.
            // option 1) bottom of the sleeve on the sq armpit side
            // option 2) top of the neck on the sq armpit side
            // the other big question is ... which f? at any given level, which one is it?
            // H1 :     1,                     2,                     3                    (1 apart) top of the neck on th sq armpit side
            // H2 :    20(f0),                23(f1),                26(f2)                (3 apart) bottom of the sleeve on the sq armpit side
            // H3 :   175(f0/f0),            213(f1/f0)             251(f2/f0)            (38 apart) top of the neck on the sq armpit side
            // H4 :  1929(f0/f0/f1),        2362(f1/f0/f1),        2795(f2/f0/f1)        (433 apart) bottom of the sleeve on the sq armpit side
            // H5 : 21756(f0/f0/f1/f0)     26658(f1/f0/f1/f0)     31560(f2/f0/f1/f0)    (4902 apart) top of the neck on the sq armpit side
            // H6 :246132(f0/f0/f1/f0/f1) 301607(f1/f0/f1/f0/f1) 357082(f2/f0/f1/f0/f1)(55475 apart) bottom of the sleeve on the sq armpit side
            let xdist = keyPts[2].x - keyPts[0].x;
            let ydist = keyPts[2].y - keyPts[0].y;

            // 0.227854.244113.245984.246113.246130.246132 f0/f0/f1/f0/f1
            // 0.283329.299588.301459.301588.301605.301607 f1/f0/f1/f0/f1/
            // 0.338804.355063.356934.357063.357080.357082 f2/f0/f1/f0/f1/

            //ctx.fillStyle="black";
            //ctx.fillRect(keyPts[0].x,keyPts[0].y,15,15);
            //console.log("meta: fylfot " + keyPts[0].id + " point 0 @ " + keyPts[0].x + "," + keyPts[0].y);
            //console.log("meta: fylfot " + keyPts[1].id + " point 1 @ " + keyPts[1].x + "," + keyPts[1].y);
            //console.log("meta: fylfot " + keyPts[2].id + " point 2 @ " + keyPts[2].x + "," + keyPts[2].y + " in a fyflot heading " + keyPts[2].heading);
            //ctx.fillStyle = "green";
            //ctx.fillRect(keyPts[2].x, keyPts[2].y, 15, 15);

            //console.log("meta: xdist=" + xdist + " ydist=" + ydist);
            let c = Math.sqrt(xdist * xdist + ydist * ydist);

            // the magic number 41.1246118 is 3+(3Phi)^2+9*Phi
            // we know the hypotenuse (c) of the triangle from one fylfot point to another
            // we know the angle opposite c is 120 degrees
            // and from the paper we know the side b (long side) is the side a (short side) times (1+3phi)
            // therefore from the law of cosines we can compute the length of the short side
            //     c^2 = a^2 + b^2 - 2*a*b*cos(120 degrees)
            //     c^2 = a^2 + (a(1+3phi))^2 - 2*a*(a(1+3phi))*cos(120 degrees)
            //     c^2 = a^2 + a^2 + a^2(3phi)^2 + a^2*2*3phi + a^2 + a^2(3phi)
            //     c^2 = a^2( 3+(3phi)^2 + (2+1)*3phi)
            //     c^2 = a^2( 3+(3phi)^2 + 9*phi)
            //     c^2 = a^2 * magic
            //      a = sqrt(c^2 / magic)
            let magic = 41.1246118;

            let a = Math.sqrt(c * c / magic);
            let b = a * (1 + 3 * Shape.phi); // b is called "H" in the paper
            // if we were to draw a line of length c directly from pt2 to pt0, it would be at angle gamma
            // but we get from pt2 to pt0 not with line c, but instead with line b and then 120 degree angle, and then line a
            // so we know the angle between b and c and we call that alpha
            // the remainder of gamma - alpha we call beta and that is how much we rotate the b+a combo so it ends up at pt2
            let gamma = Math.asin(ydist / c); // need to put something about the fc's own heading in here
            let alpha = Math.acos((b * b + c * c - a * a) / (2 * b * c));
            let beta = gamma - alpha;
            let betaDegrees = Puzzle.radiansToDegrees(beta);
            // side lengths
            //console.log("meta: a = " + a);
            console.log("meta: b = " + b);
            //console.log("meta: c = " + c);
            // angles
            //console.log("meta: gamma = " + gamma); // if we took c directly to the next flyfot key point
            //console.log("meta: alpha = " + alpha); // angle between b-side and c-side 
            //console.log("meta: beta = " + beta + " => " + betaDegrees + " degrees");  // angle of rotation of the irregular hexagon shape
            //console.log("meta: this shape heading = " + this.heading);
            //beta -= Puzzle.degreesToRadians(0);//this.heading);

            ctx.save();
            ctx.translate(keyPts[0].x, keyPts[0].y);

            ctx.fillStyle = "black";
            ctx.fillRect(-5, -5, 10, 10);


            // I don't understand why this is necessary, if the shape heading is 120,180 or 240 then we have to 
            // adjust the rotation angle by some amount, but if it between -60 and 60 we don't need to at all.
            //   shape heading  0, 60,  120,  180, 240  300
            let angleAdjust = [0, 0, -32, -152, 88, 0];     // -32 off 0, -32 off -120, -32 off 120 (or 28 off -60, 28 off -180, 28 off 60 )
            let adjustIndex = Math.floor(this.heading / 60);
            let adjustHack = angleAdjust[adjustIndex];
            console.log("meta: heading=" + this.heading + " adj index = " + adjustIndex + " adj angle=" + adjustHack);
            if (this.heading != 0) {
                adjustHack = Puzzle.degreesToRadians(adjustHack);
            } //  beta is 38, so 38+272=
            ctx.rotate(beta + adjustHack);
            //console.log("meta:translated canvas to " + keyPts[0].x +","+  keyPts[0].y );
            //ctx.rotate(Puzzle.degreesToRadians(0));

            ctx.beginPath();
            ctx.strokeStyle = "black";
            ctx.lineWidth = 3;
            ctx.moveTo(0, 0);

            ctx.lineTo(b, 0); // long line
            ctx.translate(b, 0);
            ctx.rotate(Puzzle.degreesToRadians(60));
            ctx.lineTo(a, 0); // short line
            ctx.translate(a, 0);
            ctx.rotate(Puzzle.degreesToRadians(60));

            ctx.lineTo(b, 0); // long line
            ctx.translate(b, 0);
            ctx.rotate(Puzzle.degreesToRadians(60));
            ctx.lineTo(a, 0); // short line
            ctx.translate(a, 0);
            ctx.rotate(Puzzle.degreesToRadians(60));
            ctx.lineTo(b, 0); // long line

            ctx.closePath();
            ctx.stroke();
            ctx.restore();

        }
        //else { console.log("meta: not an sh"); }
        return;
    }

*/

    drawShape(ctx, size) {
        let t = "";
        if (this.shapeName.includes("f")) {
            this.fylfotPoints = [];
        }
        for (let i = 0; i < (4 - this.shapeLevel); i++) { t += "   "; }
        //console.log(t + "draw " + this.shapeName + " @ " + this.x + "," + this.y + " level " + this.shapeLevel + " size=" + size);
        let colors = ["orange", "fuchsia", "green", "brown", "lime"];

        // this draws things that are at level 1, if its higher than level 1, 
        // the recursively call it on its children
        if (this.shapeLevel > 1) {
            for (const [shapeName, children] of this.children) {
                for (const child of children) { child.drawShape(ctx, size); }
            }
            //this.drawMetaShape(ctx, size);
            return;
        }
        //console.log(t + "finally draw shape " + this.shapeName + "/" + this.shapeLevel + " @ " + this.x + "," + this.y + " size=" + size);
        let pts = this.pointTemplate;

        let myStart = Puzzle.gridToCanvas(this.x, this.y, size);
        //ctx.fillStyle = "black";
        //ctx.fillRect(myStart.x, myStart.y, 5, 5);

        let heading = this.heading;
        if (this.shapeLevel == 2) { heading = this.heading + 180; }

        let angle = -1 * Puzzle.degreesToRadians(heading);//+ Puzzle.WORLD_ROTATION;
        //console.log("we move from start (" + myStart.x+","+myStart.y+") by " + pts[0][0] + "," + pts[0][1] + " @ angle " + angle);
        let prevPt = {
            x: myStart.x + pts[0][0] * Math.cos(angle) * size - pts[0][1] * Math.sin(angle) * size,
            y: myStart.y + pts[0][0] * Math.sin(angle) * size + pts[0][1] * Math.cos(angle) * size
        }

        //ctx.fillStyle = "green";
        //ctx.fillRect(prevPt.x, prevPt.y, 5, 5);

        for (let i = 1; i < pts.length; i++) {
            //for( let i = 1 ; i < this.points.length ; i++ ) {
            ctx.beginPath();
            ctx.strokeStyle = colors[this.shapeLevel]; // fuchsia
            ctx.moveTo(prevPt.x, prevPt.y);
            //ctx.fillStyle = "green";
            //ctx.font = "12pt Arial"; // Set the font size and font family
            //ctx.fillText((i - 1), prevPt.x, prevPt.y); // draw the point #

            let p = pts[i];
            let x = prevPt.x + (p[0] * Math.cos(angle) - p[1] * Math.sin(angle)) * size;
            let y = prevPt.y + (p[0] * Math.sin(angle) + p[1] * Math.cos(angle)) * size;
            //console.log("x=" + x + " y=" + y);

            // color the side where things can extend differently and make it wider
            if (i == this.extendLine && this.shapeLevel == 1) {
                let xDist = prevPt.x - x;
                let yDist = prevPt.y - y;
                let step = size;
                let totalDistance = Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
                let numSteps = totalDistance / step + 0.5;
                let xDelta = (xDist / numSteps);
                let yDelta = (yDist / numSteps);
                //console.log(i +" get there in " + numSteps + " moving x:" + xDelta + " and y:" + yDelta + " per step");

                for (let j = 1; j <= numSteps; j++) {
                    // draw little outward pointing arrows along the path to indicate
                    // that the t-shirts inside this symbol can extend beyond the lines
                    // along these points. this lets the user know how to orient the t-shirt.                        
                    // compute the x change and y change for the step
                    let x1 = x + xDelta * j;
                    let y1 = y + yDelta * j;
                    ctx.strokeStyle = colors[this.shapeLevel];// fuchsia
                    ctx.setLineDash([0, 0]);
                    ctx.lineWidth = 1;

                    // we could do a bit better here. Instead of computing the proper angle to point the
                    // arrows in, we either point them horizontally or vertically.
                    let arrowhead = size / 4;
                    let arrowshaft = size * .8;
                    let offset = size * .2;
                    this.drawArrow(ctx, x1, y1, heading, arrowhead, arrowshaft, offset);
                }
            } else {
                ctx.setLineDash([2, 2]);
                ctx.strokeStyle = colors[this.shapeLevel]; //fuchsia
                ctx.lineWidth = 3;
                ctx.lineTo(x, y);
                //console.log("i=" + i + " make a line to " + x + "," + y);
            }
            ctx.setLineDash([0, 0]);
            ctx.stroke();
            ctx.closePath();
            // for any "f" that comes along, record its 3rd point
            if (this.shapeName === "f" && i == 3) {
                //console.log("inside " + this.parent.id + " an " + this.parent.shapeName + " found " + this.shapeName + " id= " + this.id + " grabbing pt # 3 " + x + "," + y);
                this.addFylfotPoint(x, y);
            }
            prevPt.x = x;
            prevPt.y = y;
        } // end for loop
        ctx.setLineDash([0, 0]);
    } // end draw shapes

    addFylfotPoint(x, y) {
        this.fylfotPoints.push({ x: x, y: y });
    }

    drawArrow(ctx, x1, y1, heading, arrowhead, arrowshaft, offset) {
        if (this.shapeName === "t" || this.shapeName === "h") {
            heading = -1 * Puzzle.degreesToRadians(heading - 180);
        } else if (this.shapeName === "p" || this.shapeName === "f") {
            heading = -1 * Puzzle.degreesToRadians(heading);
        }

        //console.log("draw arrows for a " + this.shapeName + "/" + this.shapeLevel + " @ " + x1 + "," + y1 + " at angle" + heading + " along " + this.extendLine + " with offset " + offset + " shaft=" + arrowshaft + " head=" + arrowhead);

        ctx.save();
        ctx.translate(x1, y1);
        ctx.rotate(heading);
        ctx.beginPath();
        ctx.strokeStyle = "fuchsia";
        ctx.lineWidth = 1;
        ctx.moveTo(0, offset);
        ctx.lineTo(0, offset + arrowshaft);
        ctx.moveTo(0, offset);
        ctx.lineTo(arrowhead, offset + arrowhead);
        ctx.moveTo(0, offset);
        ctx.lineTo(-arrowhead, offset + arrowhead);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
    /*
    * take a parent shape and return the specified child at the specified offsets
    */
    createChild(name, dLevel, dx, dy, da) {
        let newLevel = this.shapeLevel + dLevel;
        //console.log("\tcreateChild from " + this.shapeName + "/" + this.shapeLevel + " down to " + name + "/" + newLevel);
        let gp = { x: this.x, y: this.y };
        let newPoint = Puzzle.gridCoordinateAdjust(gp, dx, dy, this.heading);
        let heading = Puzzle.normalizeDegrees(this.heading + da);
        let child = new Shape(this, this.puzzle, newPoint.x, newPoint.y, heading, "white", -1, name, newLevel);

        if (!this.children.has(child.shapeName)) {
            this.children.set(child.shapeName, []);
        }
        this.children.get(child.shapeName).push(child);
    }

    logShape() {
        let t = "";
        for (let i = 0; i < (4 - this.shapeLevel); i++) { t += "   "; }
        let s = t + "id:" + this.id + " L:" + this.shapeLevel + " " + this.shapeName + " @(" + this.x + "," + this.y + ") h=" + this.heading + " c=" + this.colorName + " f=" + this.flip + " #sh=" + this.shadows.length + " #ch=" + this.getChildCount() + "\n";
        console.log(s);
        for (const [shapeName, children] of this.children) {
            for (const child of children) {
                child.logShape();
            }
        }
        for (let s of this.shadows) { s.logShape(); }
    }

    // basically get every leaf on this tree
    getAllShadows() {
        let shadows = [];
        if (this.shapeLevel == 0) {
            //console.log("adding myself: " + this.id + " as a shadow " + this.shapeName + " @" + this.x + "," + this.y + " f=" + this.flip + " c=" + this.colorName);
            shadows.push(this);
        } else {
            if (this.shadows.length > 0) {
                for (let s of this.shadows) { shadows.push(s); }
            }
            else {
                for (const [shapeName, children] of this.children) {
                    for (const child of children) {
                        shadows = shadows.concat(child.getAllShadows());
                    }
                }
            }
        }
        return shadows;
    }
    getTotalChildCount() {
        let totalCount = 0;
        for (const [, children] of this.children) {
            totalCount += children.length;
        }
        return totalCount;
    }
/*
    static autoArrange(puzzle, ctx, level) {
        Shape.autoArrangeH(puzzle, ctx, 1, 7, 6, 0);
        //Shape.autoArrangeH(puzzle, ctx, 1, 7, 10, 60);
        //Shape.autoArrangeH(puzzle, ctx, 1, 8, 14, 120);

        Shape.autoArrangeH(puzzle, ctx, 2, 18, 8, 0);
        //Shape.autoArrangeH(puzzle, ctx, 3, 18, 13,0);
        //Shape.autoArrangeH(puzzle, ctx, 4, 18, 13, 0);

        //Shape.autoArrangeF(puzzle, ctx, level); // will do 2 of them?
        //Shape.autoArrangeP(puzzle, ctx, level);
        //Shape.autoArrangeT(puzzle, ctx, level);
    }

    static autoArrangeH(puzzle, ctx, level = 1, startX = 20, startY = 15, rotation = 0) {
        console.log("autoArrange()\n----------------");
        // the paper says the scaling (inflation is the term they use) is phi^2, but that is off by a little bit
        // i must be doing something wrong. so here are hand-coded scalings needed to be applied after the phi^2 scaling.
        // the 'baseH' was calculated manually based on tshirt points at level 2
        // the scaling adjustments were also done manually. we only know the first 3, so 4+ are just copies of 3 as the best approximation


        let approxScale = [1.060553175, 1.0, 0.983167202, 0.983167202, 0.983167202, 0.983167202]
        let scalar = Math.pow(Shape.phiSquared, level -2 ) ;
        let scalarAdjustment = approxScale[level - 1];
        let adjustedScale = scalar * scalarAdjustment;
        const baseH = 50.60154712; 
        let H = baseH * adjustedScale;
        let b = H * (1 + 3 * Shape.phi);
        console.log("level=" + level);
        console.log("phi scalar=" + scalar);
        console.log("scalar adjustment= " + scalarAdjustment);
        console.log("adjusted scale=" + adjustedScale);
        
        console.log("H=" + H);
        console.log("b=" + b);

        // now we compute the next meta tile point, how do we know the angle now? we could use an approximate lookup angle
        // and then use the nearestGridCoordinate to get the actual grid point, and then 
        // the actual canvas point, and then the actual angle. whew ... isn't there a better way?
        // we only know the first 3, so 4+ are just copies of 3 as the best approximation
        let approxAngles = [0.0, 0.1041140435, 0.1090809198, 0.1090809198, 0.1090809198, 0.1090809198];
        let angle = approxAngles[level - 1];
        angle += Puzzle.degreesToRadians(rotation);

        let ff0Grid = { x: startX, y: startY };
        let ff0Canvas = Puzzle.gridToCanvas(ff0Grid.x, ff0Grid.y, Puzzle.KITE_SIZE);
        let tShirtStart1 = { x: ff0Canvas.x, y: ff0Canvas.y };

        // now move out from the T-Shirt 0 point to the meta tile 0 point, this one is backwards of the next two.
        // meaning, on the first one we start with a grid point and then work our way out to the appropriate part of the T
        // in the next two we will start with a meta point and work our way back to the grid point.
        // 
        // at even level #'s, we cross through the bottom of the sleeve on the square armpit side
        // at odd level #'s, we cross through the shoulder of the sleeve on the square armpit side

        let dx;
        let dy;
        let heading = rotation;

        if (level == 1) { // at level 1 we go from 0 point to the bottom corner below the square armpit (straight up @ heading=0)
            dx = -Puzzle.KITE_SIZE * 3 ;//* Math.cos(Puzzle.degreesToRadians(heading));
            dy = -Puzzle.KITE_SIZE * 2 ;//* Math.cos(Puzzle.degreesToRadians(heading));;
        } 
        else if (level == 2) { // at level 2 we start at the bottom of the sleeve on the square armpit side
            dx = -Puzzle.KITE_SIZE * 4 * Math.cos(Puzzle.degreesToRadians(heading));
            dy = -Puzzle.KITE_SIZE * 4 * Math.sin(Puzzle.degreesToRadians(heading));;
        }
        else if (level == 3) {
            dx = -Puzzle.KITE_SIZE * 3 * Math.cos(Puzzle.degreesToRadians(heading));
            dy = -Puzzle.KITE_SIZE * 4 * Math.sin(Puzzle.degreesToRadians(heading));
        }

        
        heading = 0 + rotation; // the way we would move from the Meta Tile point to the T-Shirt 0 point.
        let meta0 = { x: ff0Canvas.x + dx, y: ff0Canvas.y + dy };

        // move by b
        dx = b * Math.cos(angle);
        dy = b * Math.sin(angle);
        let meta1a = { x: meta0.x + dx, y: meta0.y + dy };

        angle += Puzzle.degreesToRadians(60);
        let meta1 = { x: meta1a.x + H * Math.cos(angle), y: meta1a.y + H * Math.sin(angle) };

        // now move to where the T-Shirt's 0 point should be, 
        heading += 120;
        dx = Puzzle.KITE_SIZE * 4 * Math.cos(Puzzle.degreesToRadians(heading));
        dy = Puzzle.KITE_SIZE * 4 * Math.sin(Puzzle.degreesToRadians(heading));
        let tShirtStart2 = { x: meta1.x + dx, y: meta1.y + dy };

        // Check 2nd point - should be 20, y: 18, heading: 300
        let ff1Grid = Puzzle.nearestGridCoordinate(meta1.x + dx, meta1.y + dy);
        let cpt = Puzzle.gridToCanvas(ff1Grid.x, ff1Grid.y, Puzzle.KITE_SIZE);

        angle += Puzzle.degreesToRadians(60);
        dx = b * Math.cos(angle);
        dy = b * Math.sin(angle);
        let meta2a = { x: meta1.x + dx, y: meta1.y + dy };
        angle += Puzzle.degreesToRadians(60);
        let meta2 = { x: meta2a.x + H * Math.cos(angle), y: meta2a.y + H * Math.sin(angle) };

        // now move to where the T-Shirt's 0 point should be, 
        heading += 120;  // 60 around from last time
        dx = Puzzle.KITE_SIZE * 4 * Math.cos(Puzzle.degreesToRadians(heading));
        dy = Puzzle.KITE_SIZE * 4 * Math.sin(Puzzle.degreesToRadians(heading));

        let tShirtStart3 = { x: meta2.x + dx, y: meta2.y + dy };

        // Check 3rd point - should be 20, y: 18, heading: 300
        let ff2Grid = Puzzle.nearestGridCoordinate(meta2.x + dx, meta2.y + dy);
        cpt = Puzzle.gridToCanvas(ff2Grid.x, ff2Grid.y, Puzzle.KITE_SIZE);
        angle += Puzzle.degreesToRadians(60);
        dx = b * Math.cos(angle);
        dy = b * Math.sin(angle);
        let meta3a = { x: meta2.x + dx, y: meta2.y + dy };

        // now rot60 and move by H 
        angle += Puzzle.degreesToRadians(60);
        let meta3 = { x: meta3a.x + H * Math.cos(angle), y: meta3a.y + H * Math.sin(angle) };

        console.log("drawing stuff");

        // need some logic for the rotation on these
        let orientation = -rotation;
        if( level % 2==0 ) { orientation += 60; }
        if( level > 1) { 
            puzzle.quickAndDirtyAdd(ff0Grid, 60 + orientation);
            puzzle.quickAndDirtyAdd(ff1Grid, 300 + orientation);
            puzzle.quickAndDirtyAdd(ff2Grid, 180 + orientation);
        }

        ctx.fillStyle = "green";
        ctx.fillRect(tShirtStart1.x - 5, tShirtStart1.y - 5, 10, 10); // first fylfot T 0point
        ctx.fillStyle = "yellow";
        ctx.fillRect(tShirtStart2.x - 5, tShirtStart2.y - 5, 10, 10); // second fylfot T 0point
        ctx.fillStyle = "blue";
        ctx.fillRect(tShirtStart3.x - 5, tShirtStart3.y - 5, 10, 10); // second fylfot T 0point

        ctx.fillStyle = "black";
        //ctx.fillRect(meta0.x - 5, meta0.y - 5, 10, 10);   // first key fylfot  point
        //ctx.fillRect(meta1.x - 5, meta1.y - 5, 10, 10);   // second key fylfot point
        //ctx.fillRect(meta2.x - 5, meta2.y - 5, 10, 10);   // third key fylfot point

        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        ctx.moveTo(meta0.x, meta0.y);
        ctx.lineTo(meta1a.x, meta1a.y);
        ctx.lineTo(meta1.x, meta1.y);
        ctx.lineTo(meta2a.x, meta2a.y);
        ctx.lineTo(meta2.x, meta2.y);
        ctx.lineTo(meta3a.x, meta3a.y);
        ctx.lineTo(meta3.x, meta3.y);
        ctx.stroke();
        ctx.closePath();
        console.log( "meta points are:");
        console.log( "\t" + meta0.x + "," + meta0.y);
        console.log( "\t" + meta1a.x + "," + meta1a.y);
        console.log( "\t" + meta1.x + "," + meta1.y);
        console.log( "\t" + meta2a.x + "," + meta2a.y);
        console.log( "\t" + meta2.x + "," + meta2.y);
        console.log( "\t" + meta3a.x + "," + meta3a.y);
        console.log( "\t" + meta3.x + "," + meta3.y);

        //     }
        // } 

    }
    */
}