class TShirt {

    // define the size of the tshirt pieces. This is the short side of a kite.

    static FLIP = {
        TOP: 1,
        BOTTOM: -1
    };
    static nextId = 0;

    static outlineTurns = [60, 90, 60, 60, -90, 60, 90, 60, -90, 60, 90, -60, 90];
    static outlineDist = [
        1 * Math.sqrt(3), // 0 
        1,                // 1 
        2,                // 2 
        1,                // 3 
        1 * Math.sqrt(3), // 4 
        1 * Math.sqrt(3), // 5             
        1,                // 6
        1,                // 7
        1 * Math.sqrt(3), // 8
        1 * Math.sqrt(3), // 9
        1,                // 10
        1,                // 11
        1 * Math.sqrt(3)  // 12
    ];


    // from the paper, these are the sets of points between two neighboring tshirts
    // that cannot be share. The "polarity" indicates if both tshirts are flipped to
    // the same side. positive polarity means both are top or both are bottom. A
    // negative polarity means one is top and one is bottom.

    // when we check for invalidate neighbor alignments, if we 
    // find any of these good ones, then don't check for bad ones
    // it helps us with the cases where bad ones are otherwise
    // only detected by a single point match.
    static goodPts = [ // the pairs of points are in order for the a t-shirt, the pairs are a-pt,b-pt
        { matchType: 'good', matchNumber: "1f", a: TShirt.FLIP.BOTTOM, b: TShirt.FLIP.BOTTOM, pairs: [[5, 9], [6, 8]] },   // sq sleeve to sq armpit
        { matchType: 'good', matchNumber: "1r", a: TShirt.FLIP.BOTTOM, b: TShirt.FLIP.BOTTOM, pairs: [[8, 6], [9, 5]] },   // sq sleeve to sq armpit
        { matchType: 'good', matchNumber: "2f", a: TShirt.FLIP.BOTTOM, b: TShirt.FLIP.BOTTOM, pairs: [[4, 10], [5, 9]] },  // vertical stack, neck to tail
        { matchType: 'good', matchNumber: "2r", a: TShirt.FLIP.BOTTOM, b: TShirt.FLIP.BOTTOM, pairs: [[9, 5], [10, 4]] },  // vertical stack, neck to tail
        { matchType: 'good', matchNumber: "3f", a: TShirt.FLIP.BOTTOM, b: TShirt.FLIP.BOTTOM, pairs: [[4, 6], [5, 5]] },   // neck to sq sleeve
        { matchType: 'good', matchNumber: "3r", a: TShirt.FLIP.BOTTOM, b: TShirt.FLIP.BOTTOM, pairs: [[5, 5], [6, 4]] },   // neck to sq sleeve
        { matchType: 'good', matchNumber: "4f", a: TShirt.FLIP.BOTTOM, b: TShirt.FLIP.BOTTOM, pairs: [[8, 10], [9, 9]] },  // tail to sq armpit
        { matchType: 'good', matchNumber: "4r", a: TShirt.FLIP.BOTTOM, b: TShirt.FLIP.BOTTOM, pairs: [[9, 9], [10, 8]] }   // tail to sq armpit
    ];

    // write them both ways because when we compare two t's we don't know if the t-shirts order
    // but the points are always ordered such that they go in order of least to greatest for the first
    // t-shirt in the comparison.
    static surroundPts = [ // another way to detect this is to say if the # of shared points >= 4. NO!
        { matchType: 'surround', matchNumber: "1f", a: TShirt.FLIP.TOP, b: TShirt.FLIP.BOTTOM, pairs: [[6, 10], [7, 11], [8, 12], [9, 0], [10, 1]] }, // surround: tail thru sq armpit of TOP oriented
        { matchType: 'surround', matchNumber: "1r", a: TShirt.FLIP.BOTTOM, b: TShirt.FLIP.TOP, pairs: [[0, 9], [1, 10], [10, 6], [11, 7], [12, 8]] }, // surround: tail thru sq armpit of TOP oriented

        { matchType: 'surround', matchNumber: "2f", a: TShirt.FLIP.TOP, b: TShirt.FLIP.BOTTOM, pairs: [[0, 5], [1, 6], [11, 3], [12, 4]] },  // surround: neck & shoulders of TOP oriented
        { matchType: 'surround', matchNumber: "2r", a: TShirt.FLIP.BOTTOM, b: TShirt.FLIP.TOP, pairs: [[3, 11], [4, 12], [5, 0], [6, 1]] },  // surround: neck & shoulders of TOP oriented

        { matchType: 'surround', matchNumber: "3f", a: TShirt.FLIP.TOP, b: TShirt.FLIP.BOTTOM, pairs: [[3, 11], [4, 12], [5, 0], [6, 1]] },  // surround:tail thru obtuse armpit of TOP oriented w/ neck
        { matchType: 'surround', matchNumber: "3r", a: TShirt.FLIP.BOTTOM, b: TShirt.FLIP.TOP, pairs: [[0, 5], [1, 6], [11, 3], [12, 4]] }  // surround: neck & shoulders of TOP oriented
    ];

    static sideKickPts = [
        // write both ways because the sort orders will be different
        { matchType: 'sidekick', matchNumber: "1f", a: TShirt.FLIP.BOTTOM, b: TShirt.FLIP.BOTTOM, pairs: [[0, 9], [1, 8], [2, 7], [12, 10]] },
        { matchType: 'sidekick', matchNumber: "1r", a: TShirt.FLIP.BOTTOM, b: TShirt.FLIP.BOTTOM, pairs: [[7, 2], [8, 1], [9, 0], [10, 12]] }
    ];

    static disjointPts = [  // also disjoint is 2,2 with no other points?
        // unlike with the surround points, here we don't have to do these both ways
        // because both ways the sort order would be the same
        { matchType: 'disjoint', matchNumber: "1", a: TShirt.FLIP.BOTTOM, b: TShirt.FLIP.BOTTOM, pairs: [[7, 2]] },
        //{ matchType: 'disjoint', matchNumber: "2", a: TShirt.FLIP.BOTTOM, b: TShirt.FLIP.BOTTOM, pairs: [[2, 7]] }
    ]
    static badPts = [ // the pairs of points are in order for the a t-shirt, the pairs are a-pt,b-pt
        // some of these have to be written two ways like in surround tests. if the sort orders would change
        // based on which one represents t1 and which is t2 in the comparison, then we write them twice.
        // once as "f" and once as "r" appended to the matchNumber. Some are also written twice if we have to 
        // get them as both top,top and bottom, bottom then we use 'a','b' notation on the matchNumber
        // the # in [square brackets] is the comment at right of each line references Smith, et al paper, Figure B1
        { matchType: 'bad', matchNumber: "1", a: TShirt.FLIP.TOP, b: TShirt.FLIP.BOTTOM, pairs: [[2, 2], [3, 3], [5, 5]] },  // [42] neck to neck
        { matchType: 'bad', matchNumber: "2a", a: TShirt.FLIP.TOP, b: TShirt.FLIP.TOP, pairs: [[5, 9]] },                    // [43] sq side bottom corner to sq sleeve shoulder
        { matchType: 'bad', matchNumber: "2b", a: TShirt.FLIP.BOTTOM, b: TShirt.FLIP.BOTTOM, pairs: [[5, 9]] },              // [44] sq side bottom corner to sq sleeve shoulder
        { matchType: 'bad', matchNumber: "3", a: TShirt.FLIP.TOP, b: TShirt.FLIP.BOTTOM, pairs: [[5, 5], [6, 6]] },            // [45] sq sleeve top to sq sleeve top
        { matchType: 'bad', matchNumber: "4a", a: TShirt.FLIP.TOP, b: TShirt.FLIP.BOTTOM, pairs: [[3, 7], [5, 9]] },         // [46] neck to sq armpit
        { matchType: 'bad', matchNumber: "4b", a: TShirt.FLIP.BOTTOM, b: TShirt.FLIP.TOP, pairs: [[3, 7], [5, 9]] },         // [47] neck to sq armpit
        { matchType: 'bad', matchNumber: "5", a: TShirt.FLIP.TOP, b: TShirt.FLIP.BOTTOM, pairs: [[9, 9], [10, 10]] },        // [48] untucked tail to untucked tail
        { matchType: 'bad', matchNumber: "6a", a: TShirt.FLIP.TOP, b: TShirt.FLIP.TOP, pairs: [[5, 5]] },                    // [49] sq sleeve shoulder to sq sleeve shoulder
        { matchType: 'bad', matchNumber: "6b", a: TShirt.FLIP.BOTTOM, b: TShirt.FLIP.BOTTOM, pairs: [[5, 5]] },              // [49] sq sleeve shoulder to sq sleeve shoulder
        { matchType: 'bad', matchNumber: "7a", a: TShirt.FLIP.BOTTOM, b: TShirt.FLIP.TOP, pairs: [[9, 5], [10, 6]] },        // [50] sq sleeve top to untucked tail
        { matchType: 'bad', matchNumber: "7b", a: TShirt.FLIP.TOP, b: TShirt.FLIP.BOTTOM, pairs: [[9, 5], [10, 6]] },        // [51] sq sleeve top to untucked tail
        { matchType: 'bad', matchNumber: "8a", a: TShirt.FLIP.TOP, b: TShirt.FLIP.BOTTOM, pairs: [[1, 6], [2, 7]] },         // [52] short sleeve armhole to long sleeve armhole
        { matchType: 'bad', matchNumber: "8b", a: TShirt.FLIP.BOTTOM, b: TShirt.FLIP.TOP, pairs: [[1, 6], [2, 7]] },         // [53] short sleeve armhole to long sleeve armhole
        { matchType: 'bad', matchNumber: "9a", a: TShirt.FLIP.TOP, b: TShirt.FLIP.TOP, pairs: [[9, 9]] },                    // [54] untucked side corner to untucked side corner
        { matchType: 'bad', matchNumber: "9b", a: TShirt.FLIP.BOTTOM, b: TShirt.FLIP.BOTTOM, pairs: [[9, 9]] },              // [54] untucked side corner to untucked side corner
        { matchType: 'bad', matchNumber: "10", a: TShirt.FLIP.TOP, b: TShirt.FLIP.BOTTOM, pairs: [[6, 6], [7, 7], [9, 9]] }, // [55] dancing bears, arm-in-arm hip-to-hip
        { matchType: 'bad', matchNumber: "11", a: TShirt.FLIP.TOP, b: TShirt.FLIP.BOTTOM, pairs: [[1, 1], [2, 2]] },         // [56] obtuse sleeve to obtuse sleeve
        { matchType: 'bad', matchNumber: "12", a: TShirt.FLIP.TOP, b: TShirt.FLIP.BOTTOM, pairs: [[3, 2]] },                 // [57] obtuse sleeve armhole to obtuse sleeve top        
        { matchType: 'bad', matchNumber: "12", a: TShirt.FLIP.BOTTOM, b: TShirt.FLIP.TOP, pairs: [[3, 2]] },                 // [58] obtuse sleeve armhole to obtuse sleeve top        

    ];

    // static method to construct T-shirt instances from JSON data
    static createTShirtsFromJSON(puzzle, data) {
        //console.log("the json data passed in are:" + data);
        let ts = eval(data);
        let newShirts = [];
        for (let t of ts) {
            // these two lines account for previous file verions that used "top" and "bottom"
            if (t.flip === TShirt.FLIP.TOP) { t.flip = 1; }
            else if (t.flip === TShirt.FLIP.BOTTOM) { t.flip = -1; }
            let tshirt = new TShirt(puzzle, t.gridX, t.gridY, t.heading, t.color, t.flip);
            newShirts.push(tshirt);
        }
        return newShirts;
    }
    // we assume that the x,y given to the constructor is non-overlapping

    constructor(puzzle, x, y, heading, color, flip) {
        this.puzzle = puzzle; // the puzzle that this t-shirt belongs to
        this.id = TShirt.nextId++;
        this.deleted = false;
        // the grid coordinates are for the underlying hexagonal honeycomb grid
        // the coordinate is for the obtuse angled armpit
        this.gridX = x;
        this.gridY = y;
        this.heading = Puzzle.normalizeDegrees(heading);
        if (flip == true) { flip = TShirt.FLIP.TOP; } else { flip = TShirt.FLIP.BOTTOM; } // change from true/false to 1/-1
        this.flip = flip;

        if (color) { this.color = color; }
        else { this.color = this.puzzle.tshirtColors.default; }

        this.locationValidated = false; // will be set to true by puzzle if the location is valid, not occupied, etc.
        this.kitesOccupied = this.kitesForPosition(this.gridX, this.gridY, this.heading, this.flip);

        this.preChangeGridX = this.gridX;
        this.preChangeGridY = this.gridY;

        // for plotting on the canvas, we convert to canvas coordinates
        let pt = Puzzle.gridToCanvas(this.gridX, this.gridY, Puzzle.KITE_SIZE);
        this.x = pt.x;
        this.y = pt.y;
        this.preChangeCanvasX = this.x; // the point we would snap back to if we get drsgged to invalid location
        this.preChangeCanvasY = this.y;
        this.boundingBox = new BoundingBox(`tshirt:${this.id}`); // to inform redrawing
        this.prevBoundingBox = null;
        this.preChangeBoundingBox = null;

        this.beingDragged = false;
        this.selected = false;

        this.groupMate = null;
        this.badNeighbors = new Set();
        this.sideKickNeighbors = new Set(); // should just be a single, no?
        this.surround = false; // am i a surround?
        this.surroundedTop = null; // who do i surround?
        this.mySurrounds = new Set(); // those who surround me
        this.disjoint = false; // am i disjoint?
        this.disjointWith = null; // who do i run into disjointedly?
        this.myDisjoints = new Set();  // who is running into me disjointedly? (should only be 1 in set)

        //this.draggable = false;
        // computed geometry
        this.centroidX = -1; // used?
        this.centroidY = -1;

        // used to help us see supertile components that are optional
        this.phantom = false;

        // some optimizations, set these to null, they should get created when needed 
        // and don't compute outline and points right away, they will get computed when needed
        // does this break anything? 
        this.points = null;//[];
        this.triangles = null;//[];
        this.kiteMidpoints = null;//[];
        this.superTile =null;
        // compute the points
        //this.computeOutlineDefault();
        //this.computePoints(this.kitesForThisPosition());

        
    }

    setSuperTile(st ) { this.superTile = st; }
    updateLocationOnPaste(gridPT) {
        this.gridX = gridPT.x;
        this.gridY = gridPT.y;
        this.preChangeGridX = gridPT.x;
        this.preChangeGridY = gridPT.y;
        this.x = Puzzle.gridToCanvas(this.gridX, this.gridY, Puzzle.KITE_SIZE).x;
        this.y = Puzzle.gridToCanvas(this.gridX, this.gridY, Puzzle.KITE_SIZE).y;
        this.preChangeCanvasX = this.x;
        this.preChangeCanvasY = this.y;
        this.resetBoundingBox();
        this.prevBoundingBox = null;
        this.preChangeBoundingBox = null;
        this.locationValidated = false; // we don't yet know if this location is correct
    }

    delete() {
        this.deleted = true;
        // clear all neighbor relationships
        this.clearBadNeighbors();
        this.clearSideKickNeighbors();
        this.removeSurroundRelationships();
        this.removeDisjointRelationships();

        // don't let me be clicked in
        this.triangles = null;
        this.kiteMidpoints = null;

        // remove annotations
        this.surround = false;
        this.groupMate = null;
        this.surroundedTop = null;
        this.disjointWith = null;
        this.surround = false; // am i a surround?
        this.surroundedTop = null; // who do i surround?
        this.disjoint = false; // am i disjoint?
        this.disjointWith = null; // who do i run into disjointedly?
        this.selected = false;
        this.kitesOccupied = null;
    }
    serialize() {
        return {
            id: this.id,
            gridX: this.gridX,
            gridY: this.gridY,
            heading: this.heading,
            color: this.color,
            flip: this.flip
        };
    }

    // used for copy/paste
    copy() {
        let copy = new TShirt(this.puzzle, this.gridX, this.gridY, this.heading, this.color, this.flip);
        return copy;
    }

    // if we copy a group then we need to preserve the groupmate relationships, it isn't possible to copy just one in a group, 
    // so all groupmates are expected to be copied together.
    // other neighbor relationships are not necessarily preserved. we could copy a t-shirt with a bad neighbor relationship
    // but not copy the neighbor. so when the new copy is placed it won't necessarily have a bad neighbor relationship. 
    // so we should not copy that relationship. similarly for surround, sidekick/disjoint relationships. 
    copyNeighborRelationships(old2New, new2Old) {
        let orig = new2Old.get(this.id);
        // 1:1 relationships 
        if (orig.groupMate) { this.groupMate = old2New.get(orig.groupMate.id); } // preserve grouping

        //if (orig.sideKickNeighbor ) { // set this only if we also copied the sidekick
        // if the original had a sidekick neighbor, but is not part of what we copied, then it's sidekick neighbor shouldn't be in old2New
        if (orig.sideKickNeighbor) { this.sideKickNeighbor = old2New.get(orig.sideKickNeighbor.id); }
        if (orig.surroundedTop) {
            this.surroundedTop = old2New.get(orig.surroundedTop.id);
        }
        if (orig.disjointWith) { this.disjointWith = old2New.get(orig.disjointWith.id); }


        // complete the 1:many t-shirts relationships as well where t will have a set filled with references to other tshirts
        // we need to create a new Set for our new copied tshirt, and then fill it with refernces to the other tshirts
        // if they were copied too.
        this.myDisjoints.clear();
        for (let s of orig.groupMate.myDisjoints) {
            if (s) { // if we didn't copy the disjointed neighbor as well, then s will be null
                let newS = old2New.get(s.getId());
                this.myDisjoints.add(newS);
            }
        }
        this.mySurrounds.clear();
        for (let s of orig.groupMate.mySurrounds) {
            if (s) { // if we copied the flipped one but didn't copy the surround as well, then s will be null
                let newS = old2New.get(s.getId());
                this.mySurrounds.add(newS);
            }
        }

        this.badNeighbors.clear();
        for (let s of orig.badNeighbors) {
            if (s) { // if we didn't copy the bad neighbor as well, then s will be null
                let newS = old2New.get(s.getId());
                this.badNeighbors.add(newS);
            }
        }

        this.removeSideKickNeighbor();
        if (orig.sideKickNeighbor) {  // if we didn't copy the sidekick neighbor, then this will be null
            let newS = old2New.get(orig.sideKickNeighbor.getId());
            if (newS) { this.setSideKickNeighbor(newS); }
        }

    }

    getId() { return this.id; }
    hasBoundingBox() { if (this.boundingBox) { return this.boundingBox.hasPoints(); } else { return false; } }
    getBoundingBox() { return this.boundingBox; }
    hasPrevBoundingBox() { if (this.prevBoundingBox) { return this.prevBoundingBox.hasPoints(); } else { return false; } }
    getPrevBoundingBox() { return this.prevBoundingBox; }
    hasPreChangeBoundingBox() { if (this.preChangeBoundingBox) { return this.preChangeBoundingBox.hasPoints(); } else { return false; } }
    getPreChangeBoundingBox() { return this.preChangeBoundingBox; }

    resetBoundingBox() {
        this.prevBoundingBox = this.boundingBox;
        this.boundingBox = new BoundingBox(`tshirt:${this.id}`);
        //this.preChangeBoundingBox = this.boundingBox; 
        //console.log("cleared bbox for t:" + this.id + " prev has " + this.prevBoundingBox.numPoints() + " points");
        //if(this.id===4) { console.trace();}

    }
    updateBoundingBox(x, y) {
        this.boundingBox.addPoint(x, y);
        if (this.boundingBox.numPoints() === 1) {
            //console.log("\tt:" + this.id + " added pt(" + x + "," + y + ") to bbox now has " + this.boundingBox.numPoints() + " points");
            //console.trace(); 
        }
    }

    /*getTApproxMid() { 
        let midX = (this.points[0].x + this.points[8].x) / 2;
        let midY = (this.points[0].y + this.points[8].y) / 2;
        return { x:midX,y:midY};
    }*/
    onEvenColumn() { return this.gridX % 2 === 0 }
    getGridPoint() { return { x: this.gridX, y: this.gridY }; }
    getPoints() { return this.points; }
    getKiteMidpoints() { return this.kiteMidpoints; }
    getTriangles() { return this.triangles; }
    setLocationValidated() { this.locationValidated = true; }
    hasValidLocation() { return this.locationValidated; }

    setGroupMate(tshirt) { this.groupMate = tshirt; }
    getNext() { return this.groupMate; }

    getBadNeighbors() { return this.badNeighbors; }
    addBadNeighbor(t) { this.badNeighbors.add(t); }
    removeBadNeighbor(t) { this.badNeighbors.delete(t); }
    clearBadNeighbors() {
        for (let b of this.badNeighbors) { // remove this t from any neighbor tracking it
            b.removeBadNeighbor(this);
        }
        this.badNeighbors.clear(); // remove all bad neighbors from this t
    }

    isSideKick() { return this.sideKickNeighbors.size > 0; }
    getSideKickNeighbors() { return this.sideKickNeighbors; }
    /* set relationship on this and t */
    setSideKickNeighbor(t) {
        this.sideKickNeighbors.add(t);
        t.sideKickNeighbors.add(this);
    }
    /* remove relationship on this and t and set them to white if they have no more sidekicks */
    removeSideKickNeighbor(t) {
        if (t) {
            this.sideKickNeighbors.delete(t);
            t.sideKickNeighbors.delete(this);
            if (this.sideKickNeighbors.size == 0) { this.color = this.puzzle.tshirtColors.default; }
            if (t.sideKickNeighbors.size == 0) { t.color = this.puzzle.tshirtColors.default; }
        }
    }
    clearSideKickNeighbors() {
        //console.log("removing side kick neighbors of " + this.id );
        for (let s of this.sideKickNeighbors) { // remove this t from any neighbor tracking it
            s.removeSideKickNeighbor(this);
        }
        this.sideKickNeighbors.clear(); // remove all sidekick neighbors from this t
        this.color = this.puzzle.tshirtColors.default;
    }
    hasSideKickNeighbor(t) { return this.sideKickNeighbors.has(t); }

    isSurround() { return this.surround; } // am i a surround?
    getSurroundedTop() { return this.surroundedTop; } // who do i surround?
    getSurroundsMe() { return this.mySurrounds; } // who surrounds me?
    setSurround(top) {  // set me to be a surround and record who it is I am surrounding
        this.surround = true;
        this.surroundedTop = top;
        top.addSurroundedBy(this);
    }
    addSurroundedBy(s) { this.mySurrounds.add(s); }
    removeSurroundRelationships() {
        if (this.flip == TShirt.FLIP.TOP) {
            for (let s of this.mySurrounds) {
                s.surround = false;
                s.surroundedTop = null;
                s.color = (s.flip == TShirt.FLIP.TOP) ? this.puzzle.tshirtColors.top : this.puzzle.tshirtColors.bottom;
            }
            this.mySurrounds.clear();
            this.color = (this.flip == TShirt.FLIP.TOP) ? this.puzzle.tshirtColors.top : this.puzzle.tshirtColors.bottom;
        }
        else {
            if (this.surroundedTop) {
                this.surroundedTop.mySurrounds.delete(this);
            }
            this.surroundedTop = null;
            this.surround = false;
            this.color = (this.flip == TShirt.FLIP.TOP) ? this.puzzle.tshirtColors.top : this.puzzle.tshirtColors.bottom;
        }
    } // record who is surrounding me
    isDisjoint() { return this.disjoint; } // am i a disjoint?
    getDisjointWith() { return this.disjointWith; } // who do i run into disjointedly?
    getDisjointsMe() { return this.myDisjoints; } // who runs into me disjointedly?
    setDisjoint(d) {  // set me to be a disjoint and record who it is I am disjointedly bumping into
        //console.log(this.id + " is disjoint by running into " + d.id);
        this.disjoint = true;
        this.disjointWith = d;
        d.addDisjointing(this);
    }
    addDisjointing(s) { this.myDisjoints.add(s); } // record who is disjointedly bumping into me
    removeDisjointRelationships() {
        if (!this.disjoint) {
            //console.log(this.id + " is not disjoint, but may be causing someone else to be");
            for (let d of this.myDisjoints) { // even though its a Set, it should only ever have 1 at most
                d.disjoint = false;
                d.disjointWith = null;
                //d.color = this.puzzle.tshirtColors.default;
            }
            this.myDisjoints.clear();
        }
        else {
            //console.log(this.id + " is disjoint, but removing those who are with it");
            if (this.disjointWith) {
                //console.log("removing " + this.id + " from " + this.disjointWith.id + "'s disjoints");
                this.disjointWith.myDisjoints.delete(this);
            }
            this.disjointedWith = null;
            this.disjoint = false;
            //d.color = this.puzzle.tshirtColors.default;
        }
    }

    clearAllNeighborIndicators() {
        this.clearBadNeighbors();
        this.clearSideKickNeighbors();
        this.removeSurroundRelationships()
        this.removeDisjointRelationships();
    }

    computeOutlineDefault() { this.computeOutline(this.x, this.y, this.heading, this.flip); }

    kitesForThisPosition() { return this.kitesForPosition(this.gridX, this.gridY, this.heading, this.flip); }

    getAllGroupMembers() {
        const set = new Set();
        // traverse from this tshirt to it's .getNext() tshirt, adding each into the set until we get back to this tshirt
        let t = this;
        do {
            set.add(t);
            if (t) { t = t.getNext(); }
            //else { console.log( "t is null, that means this is null"); }
        } while (t && t != this);
        return set;
    }

    hasKite(kites) {
        for (let i = 0; i < kites.length; i += 2) {
            for (let k of kites[i + 1]) {
                let s = kites[i].x + "," + kites[i].y + ":" + k; // e.g. 5,6:2
                for (let j = 0; j < this.kitesOccupied.length; j += 2) {
                    for (let l of this.kitesOccupied[j + 1]) {
                        let t = this.kitesOccupied[j].x + "," + this.kitesOccupied[j].y + ":" + l;
                        if (s === t) { console.log("\t" + s + " === " + t); return true;  }
                        else { console.log( "\t" + s + " !== " + t + " keep looking") ; }
                    }
                }
            }
        }
        console.log("no match");
        return false;
    }

    stringifyKitesOccupied() {
        let s = this.id + "\n";
        for (let j = 0; j < this.kitesOccupied.length; j += 2) {
            s += "\t" + this.kitesOccupied[j].x + "," + this.kitesOccupied[j].y + ": (";
            for (let l of this.kitesOccupied[j + 1]) {
                s += l;
            }
            s += ")\n";
        }
        return s;
    }

    /**
     * kitesForPosition 
     * 
     * this method determines which kites are part of a tshirt with these parameters
     * the kites are organized by hexagon in which they reside
     * each tshirt spans 3 hexagons with 4 kites in one and 2 kites in the other two
     * 
     * This method does not move a kite or change anything about which kites in the system
     * are currently occupied. It simply computes which kites would be occupied if a tshirt
     * were placed with the given parameters.
     * 
     * The kites are numbered around the hexagon like this.
     *        ---------
     *       /  3   2  \
     *      /           \
     *     / 4         1 \
     *      \           /
     *       \ 5     0 /
     *        ---------
     * 
     */
    kitesForPosition(gridX, gridY, heading, flip) {
        heading = Puzzle.normalizeDegrees(heading);
        const hex1 = { x: gridX, y: gridY };
        const hex1Kites = this.puzzle.rotateKites(heading, flip, [1, 2, 3, 4]);
        const hex2 = this.puzzle.findNeighboringHexagon(gridX, gridY, 0 + heading);
        let hex2Kites = this.puzzle.rotateKites(heading, flip, [0, 1]);
        if (flip == TShirt.FLIP.BOTTOM) {  hex2Kites = this.puzzle.rotateKites(heading, flip, [4, 5])  };
        let hex3 = this.puzzle.findNeighboringHexagon(gridX, gridY, -60 + heading);
        let hex3Kites = this.puzzle.rotateKites(heading, flip, [4, 5]);
        if (flip == TShirt.FLIP.BOTTOM) {
            hex3 = this.puzzle.findNeighboringHexagon(gridX, gridY, 60 + heading);
            hex3Kites = this.puzzle.rotateKites(heading, flip, [0, 1]);
        }
        //console.log( "if tshirt: " + this.id + " were at " + gridX+","+gridY + " it would have kites: " + hex1.x +","+ hex1.y + "(" + hex1Kites +") " + 
        //                                      hex2.x +","+ hex2.y + "(" + hex2Kites +") " +
        //                                      hex3.x +","+ hex3.y + "(" + hex3Kites +")" );
        return [hex1, hex1Kites, hex2, hex2Kites, hex3, hex3Kites];
    }



    static drawOutlineShadow(canvasX, canvasY, heading, flip, colorName, kiteSize, ctx, shadowNumber) {
        let orientation = flip == TShirt.FLIP.TOP ? 1 : -1;
        ctx.beginPath();
        ctx.strokeStyle = colorName;
        ctx.setLineDash([0, 0]);
        ctx.lineWidth = 3;
        ctx.moveTo(canvasX, canvasY);
        let angle = -1 * Puzzle.degreesToRadians(heading) + Puzzle.WORLD_ROTATION;
        let drawnPoints = [];
        for (let i = 0; i < TShirt.outlineTurns.length; i++) {
            let da = Puzzle.degreesToRadians(TShirt.outlineTurns[i]);// * orientation ; 
            angle += da * orientation;
            let d = TShirt.outlineDist[i] * kiteSize;
            canvasX += d * Math.cos(angle);
            canvasY += d * Math.sin(angle);
            ctx.lineTo(canvasX, canvasY);
            drawnPoints.push({ x: canvasX, y: canvasY });
        }
        ctx.closePath();
        ctx.stroke();

        // fill the target area with hashes
        ctx.setLineDash([2, 12]); // dashes are 2 long spaced 12 apart
        ctx.lineWidth = 1;
        ctx.moveTo(drawnPoints[12].x, drawnPoints[12].y);
        ctx.lineTo(drawnPoints[7].x, drawnPoints[7].y);
        ctx.stroke();
        ctx.moveTo(drawnPoints[10].x, drawnPoints[10].y);
        ctx.lineTo(drawnPoints[8].x, drawnPoints[8].y);
        ctx.stroke();
        ctx.moveTo(drawnPoints[0].x, drawnPoints[0].y);
        ctx.lineTo(drawnPoints[3].x, drawnPoints[3].y);
        ctx.stroke();
        ctx.moveTo(drawnPoints[3].x, drawnPoints[3].y);
        ctx.lineTo(drawnPoints[5].x, drawnPoints[5].y);
        ctx.stroke();
        let avg78 = { x: (drawnPoints[7].x + drawnPoints[8].x) / 2, y: (drawnPoints[7].y + drawnPoints[8].y) / 2 };
        let avg1112 = { x: (drawnPoints[11].x + drawnPoints[12].x) / 2, y: (drawnPoints[11].y + drawnPoints[12].y) / 2 };
        ctx.moveTo(avg78.x, avg78.y);
        ctx.lineTo(avg1112.x, avg1112.y);
        ctx.stroke();

        //ctx.fillText(shadowNumber,drawnPoints[12].x,drawnPoints[12].y);
    }

    rattle(showSurround, showSideKick) {
        // this has one flaw as a way of preserving the original color. 
        // if the user bumps into this T twice really fast, the color will be wrong.
        let origColor = this.color;
        this.flash(showSurround, showSideKick, origColor);
    }

    flash(ss, sk, c) {
        let delay = 100;
        setTimeout(() => {
            this.drawOutline(false, false, "black");
            setTimeout(() => {
                this.drawOutline(false, false, "red");
                setTimeout(() => {
                    this.drawOutline(false, false, "black");
                    setTimeout(() => {
                        this.drawOutline(ss, sk, c); // restore to whatever it is supposed to be
                    }, delay);
                }, delay);
            }, delay);
        }, delay);
    }

    /**
     * The main way a placed T-shirt is drawn. 
     * It gets a black outline (thicker if selected) and is filled with the appropriate color.
     * @param showSurround - game level control for whether we should use the surround color coding scheme or not
     * @param showSideKick - game level control for whether we should use the sidekick color coding scheme or not
     * @param fillColor is used when the T-Shirt is doing it's "rattle" animation because another T-Shirt tried to land on top of this one.
     */
    drawOutline(showSurround, showSideKick, fillColor) {
        if(this.phantom && !this.puzzle.SHOW_PHANTOMS) { return;}
        if(this.phantom && this.puzzle.getTShirtAtLocation(this.gridX,this.gridY)) { 
            return; // don't draw a phantom if there is a real tshirt here
        } 
        let ctx = this.puzzle.ctx;
        // reset the bounding box of this tshirt.
        if (!this.beingDragged || this.puzzle.draggingPostPaste) {
            ctx.beginPath();
            ctx.setLineDash([0, 0]);
            ctx.strokeStyle = "black";

            // get the appropriate color coding
            if (!this.color) {
                this.color = this.puzzle.tshirtColors.default;
            }
            if (this.flip === TShirt.FLIP.TOP) { this.color = this.puzzle.tshirtColors.top; }
            else if (this.isSurround() && showSurround) { this.color = this.puzzle.tshirtColors.surround; }
            else if (this.isDisjoint()) { this.color = this.puzzle.tshirtColors.disjoint; }
            else if (this.isSideKick() && showSideKick) {

                let sideKickDisjoint = false;
                for (let sk of this.sideKickNeighbors) {
                    //console.log("\t is " + sk.id + " disjoint?");
                    if (sk.isDisjoint()) {
                        sideKickDisjoint = true;
                        //console.log("\tyes id=" + sk.id);
                        break;
                    }// else { console.log("\tno"); }
                }
                if (sideKickDisjoint) { this.color = this.puzzle.tshirtColors.disjoint; }
                else { this.color = this.puzzle.tshirtColors.sideKick; }
            }
            //else { this.color = this.puzzle.tshirtColors.default; }
            ctx.fillStyle = this.color;
            let w = 2 + (this.selected ? 3 : 0);
            ctx.lineWidth = w;
            if (this.phantom) { ctx.fillStyle = "lavender";  } // was only used for debugging, generall we don't draw phantoms anyway.
            // this is used when we rattle, 
            if (fillColor) { ctx.fillStyle = fillColor; }

            for (let i = 0; i < this.points.length; i++) {
                if (i == 0) { ctx.moveTo(this.points[i].x, this.points[i].y); }
                else { ctx.lineTo(this.points[i].x, this.points[i].y); }
            }
            ctx.closePath();
            ctx.fill();

            ctx.stroke();
        } //else { console.log("not drawing outline - dragged="+ this.beingDragged + " draggedpostpaste=" + this.puzzle.draggingPostPaste);}

        // for debugging, this code plots the number of each side of the tshirt.
        /*
        for (let i = 0; i < this.points.length - 1; i++) {
            this.puzzle.ctx.font = '12px Arial';
            this.puzzle.ctx.fillStyle = 'black';
            this.puzzle.ctx.fillText(i, this.points[i].x, this.points[i].y);
        }
        */
    }

    computeOutline(canvasX, canvasY, heading, flip) {
        // console.log("computeOutline");
        this.resetBoundingBox(); // here is where we will reset the bounding box 
        let orientation = flip == TShirt.FLIP.TOP ? 1 : -1;

        this.points = [];// clear the points array and add the first point
        this.points.push({ x: canvasX, y: canvasY });

        let angle = -1 * Puzzle.degreesToRadians(heading) + Puzzle.WORLD_ROTATION;
        for (let i = 0; i < TShirt.outlineTurns.length; i++) {
            let da = Puzzle.degreesToRadians(TShirt.outlineTurns[i]);// * orientation ; 
            angle += da * orientation;
            let d = TShirt.outlineDist[i] * Puzzle.KITE_SIZE;
            canvasX += d * Math.cos(angle);
            canvasY += d * Math.sin(angle);
            this.updateBoundingBox(canvasX, canvasY); // update with new points
            if (i < TShirt.outlineTurns.length - 1) { this.points.push({ x: canvasX, y: canvasY }); }
        }

        //console.log("# points defined: " + this.points.length);
        // compute the centroid of the tshirt - not really used but could be useful.
        this.centroidX = this.points.reduce((sum, p) => sum + p.x, 0) / this.points.length;
        this.centroidY = this.points.reduce((sum, p) => sum + p.y, 0) / this.points.length;
    }

    /**
     * Called when a T-Shirt is being dragged. It first draws an outline at the canvas position which does not have to be grid-aligned
     * It then draws a filled-in T-Shirt at the nearest grid position.
     */
    // not clear why we don't leverage the computeOutline method above.
    // this one does not update this.points, but perhaps it should given we update everything else in the trial move process.
    drawTrialMove() {
        this.resetBoundingBox(); // we only do this here and in computeOutline above
        //let canvasPt = Puzzle.gridToCanvas(gridX, gridY); 
        let canvasX = this.x;//canvasPt.x;
        let canvasY = this.y;//canvasPt.y;
        //console.log("drawTrialMove(" + this.gridX +"," + this.gridY + "=>" + canvasX +","+ canvasY );
        if (this.deleted) { return; }
        if (!this.beingDragged) { return; } //  console.log("not drawing trial move, not dragged"); return; }
        let orientation = this.flip == TShirt.FLIP.TOP ? 1 : -1;
        let ctx = this.puzzle.ctx;

        // draw the outline at the x,y passed in (canvas coordinates)
        let pt = { x: canvasX, y: canvasY }; // Puzzle.gridToCanvas(hc.col, hc.row);
        ctx.beginPath();
        ctx.strokeStyle = "red";
        ctx.setLineDash([0, 0]);
        let w = 1 + (this.selected ? 1 : 0);
        ctx.lineWidth = 3;//w;
        ctx.moveTo(pt.x, pt.y);
        let angle = -1 * Puzzle.degreesToRadians(this.heading) + Puzzle.WORLD_ROTATION;

        for (let i = 0; i < TShirt.outlineTurns.length; i++) {
            let da = Puzzle.degreesToRadians(TShirt.outlineTurns[i]);// * orientation ; 
            angle += da * orientation;
            let d = TShirt.outlineDist[i] * Puzzle.KITE_SIZE;
            pt.x += d * Math.cos(angle);
            pt.y += d * Math.sin(angle);
            this.updateBoundingBox(pt.x, pt.y); // update this here
            ctx.lineTo(pt.x, pt.y);
            //console.log("\tlineTo " + pt.x + "," + pt.y );
        }
        ctx.closePath();
        ctx.stroke();

        // 
        // now draw the filled in t-shirt snapping to the nearest grid points
        // 
        let hc = { x: this.gridX, y: this.gridY };

        pt = Puzzle.gridToCanvas(hc.x, hc.y, Puzzle.KITE_SIZE);
        //console.log("drawTrialMove id:" + this.id + " @ " + hc.x + "," + hc.y);
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        angle = -1 * Puzzle.degreesToRadians(this.heading) + Puzzle.WORLD_ROTATION;

        for (let i = 0; i < TShirt.outlineTurns.length; i++) {
            let da = Puzzle.degreesToRadians(TShirt.outlineTurns[i]);// * orientation ; 
            angle += da * orientation;
            let d = TShirt.outlineDist[i] * Puzzle.KITE_SIZE;
            pt.x += d * Math.cos(angle);
            pt.y += d * Math.sin(angle);
            // this.updateBoundingBox(pt.x, pt.y); // don't need to here, we just did above on same point
            ctx.lineTo(pt.x, pt.y);
            //console.log("lineTo " + pt.x + "," + pt.y );
        }
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;//1 + (this.selected ? 4 : 0);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    drawBadNeighborIndicator(showBadNeighbors) {
        if (!showBadNeighbors) { return; } // the feature isn't turned on
        if (this.badNeighbors.size == 0) { return; }  // this tshirt doesn't have any bad neighbors
        if (this.beingDragged) { return; } // don't draw it if it's being dragged
        const ctx = this.puzzle.ctx;
        const d = Puzzle.KITE_SIZE / 2;
        let angle = -1 * Puzzle.degreesToRadians(this.heading) + Puzzle.WORLD_ROTATION;
        let pt1 = { x: this.centroidX + d * Math.cos(angle), y: this.centroidY + d * Math.sin(angle) };
        let pt2 = { x: this.centroidX - d * Math.cos(angle), y: this.centroidY - d * Math.sin(angle) };
        ctx.beginPath();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 4;
        ctx.moveTo(pt1.x, pt1.y);
        ctx.lineTo(pt2.x, pt2.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 4;
        angle = -1 * Puzzle.degreesToRadians(this.heading) + Puzzle.WORLD_ROTATION + Math.PI / 2;
        pt1 = { x: this.centroidX + d * Math.cos(angle), y: this.centroidY + d * Math.sin(angle) };
        pt2 = { x: this.centroidX - d * Math.cos(angle), y: this.centroidY - d * Math.sin(angle) };
        ctx.beginPath();
        ctx.moveTo(pt1.x, pt1.y);
        ctx.lineTo(pt2.x, pt2.y);
        ctx.stroke();
        // put in a rectangle of tshirt color right in the middle                                   
        ctx.fillRect(this.centroidX - 2.5, this.centroidY - 2.5, 5, 5);
    }

    /** 
     * compute 
     */
    computePoints(kites) {
        if (this.beingDragged) { return; } // don't draw if we are being dragged
        let h = -1 * Puzzle.degreesToRadians(this.head);
        // clear all the existing triangles used for mouse-click detection
        this.triangles = [];
        // compute the set of kites organized by which hexagon they are in. 
        // each t-shirt has kites in 3 different hexagons.
        let hex1 = kites[0];
        let kites1 = kites[1];
        let hex2 = kites[2];
        let kites2 = kites[3];
        let hex3 = kites[4];
        let kites3 = kites[5];

        let hex1Canvas = Puzzle.gridToCanvas(hex1.x, hex1.y, Puzzle.KITE_SIZE);
        let hex2Canvas = Puzzle.gridToCanvas(hex2.x, hex2.y, Puzzle.KITE_SIZE);
        let hex3Canvas = Puzzle.gridToCanvas(hex3.x, hex3.y, Puzzle.KITE_SIZE);

        // we really shouldn't draw the outline here but we need the x,y points to get the tshirt color.
        // so we run that function to update the points, and then we call it again at the bottom
        let pt = Puzzle.gridToCanvas(this.gridX, this.gridY, Puzzle.KITE_SIZE); // this was after drawkites
        this.kiteMidpoints = [];
        this.computeKites(hex1Canvas.x, hex1Canvas.y, kites1);
        this.computeKites(hex2Canvas.x, hex2Canvas.y, kites2);
        this.computeKites(hex3Canvas.x, hex3Canvas.y, kites3);
        //console.log("after computeKites3x bbxox=" + this.boundingBox.getBBoxAsString());
    }

    draw(showBadNeighbors, showSurround, showSideKick) {
        if (this.deleted) { return; }
        //console.log("draw me, surround=" + this.surround);
        this.drawOutline(showSurround, showSideKick); // draw the outline and fill the kite with it's color
        this.drawKites(); // draw the kite lines (if its turned on)
        this.drawBadNeighborIndicator(showBadNeighbors); // add the "X" or other indicator to show its got a bad neighbor
    }

    drawKites() {
        if (this.puzzle.SHOW_KITES != 1) { return; }
        if (this.beingDragged) { return; }
        const ctx = this.puzzle.ctx;
        ctx.beginPath();
        ctx.setLineDash([0, 0]);
        // we should palettize this, it's a bit of a hack for now
        let strokeStyle = "grey";
        if (this.flip === TShirt.FLIP.TOP) { strokeStyle = "yellow"; }
        else if (this.color === "grey") { strokeStyle = "white"; }
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = 1;
        for (let t = 0; t < this.triangles.length - 1; t += 2) {
            // a kite is composed of the first two points of one triangle and the second point of the next triangle.
            const tri1 = this.triangles[t];
            const tri2 = this.triangles[t + 1];
            ctx.moveTo(tri1[0].x, tri1[0].y);
            ctx.lineTo(tri1[1].x, tri1[1].y);
            ctx.lineTo(tri1[2].x, tri1[2].y);
            ctx.lineTo(tri2[2].x, tri2[2].y);
            ctx.lineTo(tri1[0].x, tri1[0].y);
            ctx.closePath();
            ctx.stroke();
        }

        // label kite midpoints
        ctx.fillStyle="black";
        for (let i = 0 ; i < 6 ; i+=2 ) { 
            let gridPt   = this.kitesOccupied[i];
            let kites    = this.kitesOccupied[i+1];
            let canvasPt = Puzzle.gridToCanvas(gridPt.x,gridPt.y,Puzzle.KITE_SIZE);
            
        //    ctx.fillText( i, this.kiteMidpoints[i].x, this.kiteMidpoints[i].y);
        }

        /*// draw midpoints and kite Numbers
        ctx.fillStyle = "red";
        for( let m = 0 ; m<this.kiteMidpoints.length ; m++ ) {
            const mid = this.kiteMidpoints[m];
            // put the midpoint # in text at this point on the canvas
            ctx.fillText(m, mid.x, mid.y);
            //ctx.fillRect(mid.x-1,mid.y-1,3,3);
        }
        */
    }

    computeKites(x, y, kiteList) {
        let a = 0;
        // we actually have a world where we rotate everythign 90 degrees from the javascript default.
        let tr = Math.PI / 2; // a standard rotation to put in that was helpful for debugging
        for (let i of kiteList) {
            a = (-(i * Math.PI / 3) + tr);
            this.computeKite(x, y, Puzzle.KITE_SIZE, a);
        }
    }

    /** 
     * will compute the coordinates for triangles in this kite and add those triangles to its triangle list
     */
    computeKite(x, y, N, heading) {
        let point1 = { x: x, y: y };
        //this.updateBoundingBox(x, y);

        // Go N * sqrt(3) pixels (out from the center) in direction of header
        const angleStart = heading;//* orientation; 
        x = x + N * Math.sqrt(3) * Math.cos(angleStart);
        y = y + N * Math.sqrt(3) * Math.sin(angleStart);
        let point2 = { x: x, y: y };

        // turn 90 degrees counter-clockwise and go N pixels
        const angle90 = -1 * Math.PI / 2;//* orientation
        x += N * Math.cos(angleStart + angle90);
        y += N * Math.sin(angleStart + angle90);
        let point3 = { x: x, y: y };

        // turn 60 degrees counter-clockwise and go N pixels
        const angle60 = -1 * Math.PI / 3; // * orientation
        x += N * Math.cos(angleStart + angle90 + angle60);
        y += N * Math.sin(angleStart + angle90 + angle60);
        let point4 = { x: x, y: y };

        this.triangles.push([point1, point2, point3]);
        this.triangles.push([point1, point3, point4]);
        let midPointx = (point1.x + point2.x + point3.x + point4.x) / 4;
        let midPointy = (point1.y + point2.y + point3.y + point4.y) / 4;
        this.kiteMidpoints.push({ x: midPointx, y: midPointy });
    }

    /**
     *  at left we see for each hexagonal cell, the hexagon is divided in 6 kites, numbered according to this scheme
     *  where 0 is in the bottom right and the count increases counter-clockwise.
     *  At right, we see in our hexagonal grid, the even numbered columns sit above on the canvas coordinate system
     *  while the odd numbered columns sit below. All three of the cells shown have the same y-coordinate in the hex grid.
     *  
     *                                                      0 1  2  
     *            ----------                               __    __
     *           / 3   |  2  \                            /  \__/  \
     *          /\     |     /\                           \__/  \__/
     *         /   \   |   /    \                            \__/
     *        . 4    \ . /     1 .                            
     *         \     / | \     /
     *          \/     |     \/
     *           \  5  |  0 /
     *            -----------
     */

    /**
     * move the canvas by the specified canvas amount (dx,dy) from it's prechange position.
     * update the hexagon grid position as appropriate
     */

    /**
     * This function really just tests if the move will be in bounds or not. 
     * 
     * @param dxCanvas, dyCanvas - amount of canvas move so the outline slides the right amount
     * @param dxGrid, dyGrid - amount of grid move so we ensure the grid slides the same amount for all T's being moved
     */
    testCanvasTrialMove(dxCanvas, dyCanvas, dxGrid, dyGrid) {
        // record all the work done to get us to our trial position
        // if its out of bounds nothing will happen with it, but if its inbounds it will be needed again.
        this.trialCanvasX = this.preChangeCanvasX + dxCanvas;
        this.trialCanvasY = this.preChangeCanvasY + dyCanvas;
        this.trialGridX = this.preChangeGridX + dxGrid;
        this.trialGridY = this.preChangeGridY + dyGrid;

        //let gridPt = Puzzle.nearestGridCoordinate(x, y);
        let gridPt = Puzzle.annotateGridPointInBounds({
            x: this.preChangeGridX + dxGrid, y: this.preChangeGridY + dyGrid,
            outOfBounds: false, bestX: this.preChageGridX + dxGrid, bestY: this.preChangeGridY + dyGrid
        });
        //console.log("test CTM t:" + this.id + " moving " + dxGrid + "," + dyGrid + " from " + this.preChangeGridX + "," + 
        //   this.preChangeGridY + " oob=" + gridPt.outOfBounds);
        return (!gridPt.outOfBounds);
    }

    /**
     * This one does the trial move, and updates the grid location, but does preserve the pre-change locations
     * in case this ends up being an invalid move.
     * 
     * @param dxCanvas, dyCanvas - amount of canvas move so the outline slides the right amount
     * @param dxGrid, dyGrid - amount of grid move so we ensure the grid slides the same amount for all T's being moved
     */
    canvasTrialMove() { // dxCanvas, dyCanvas, dxGrid, dyGrid) {
        this.x = this.trialCanvasX;//this.preChangeCanvasX + dxCanvas;
        this.y = this.trialCanvasY;//this.preChangeCanvasY + dyCanvas;
        //let gridPt = Puzzle.nearestGridCoordinate(this.x, this.y);
        this.gridX = this.trialGridX;//this.preChangeGridX + dxGrid;
        this.gridY = this.trialGridY;//this.preChangeGridY + dyGrid;
        //console.log("After CTM t:" + this.id + " @ " + this.gridX + "," + this.gridY + "  was moved by " + dxGrid + "," + dyGrid);
        this.puzzle.clearTShirtLocation(this);
    }

    restorePrechangeGrid() {
        this.gridMove(this.preChangeGridX - this.gridX, this.preChangeGridY - this.gridY);
        this.computeOutline(this.x, this.y, this.heading, this.flip); // really i just want the bbox to update
        this.prevBoundingBox = null; // otherwise it will be on top of the stuff we just were on top of and had to snap back from.
        //console.log("this.boundingBox=" + this.boundingBox.getBBoxAsString());
    }

    // optimization for rendering supertiles
    gridMoveLight( dx,dy) {
        this.gridX += dx;
        this.gridY += dy;
    }
    /**
     * Move on the grid this amount.
     * @param {*} dx 
     * @param {*} dy 
     * @returns 
     */
    gridMove(dx, dy) {
        this.surround = false;
        
        // get the kites cover in this change
        this.puzzle.clearLocation(this.gridX, this.gridY, this); // clear the old location including the old kites occupied
        this.puzzle.clearKiteLocations( this ); // clear the old kites occupied
        this.kitesOccupied = this.kitesForPosition(this.gridX + dx, this.gridY + dy, this.heading, this.flip); 
        
        this.gridX += dx;
        this.gridY += dy;
        const pt = Puzzle.gridToCanvas(this.gridX, this.gridY, Puzzle.KITE_SIZE);
        this.x = pt.x;
        this.y = pt.y;
        this.puzzle.recordLocation(this.gridX, this.gridY, this);

        // save a copy of the current position in case the next move needs to bounce back
        this.preChangeCanvasX = this.x;
        this.preChangeCanvasY = this.y;
        this.preChangeGridX = this.gridX;
        this.preChangeGridY = this.gridY;
        // save off the bounding box for this position before we update points
        this.preChangeBoundingBox = this.boundingBox;

        // update points and the new bbox will compute during this.
        this.computePoints(this.kitesForThisPosition());
        this.computeOutlineDefault();
    }

    rotate(degrees) {
        //console.log("rotate " + this.id + " by " + degrees + " degrees");
        this.surround = false;
        degrees = Puzzle.normalizeDegrees(degrees);
        const newheading = Puzzle.normalizeDegrees(this.heading + degrees);
        //const newKites = this.kitesForPosition(this.gridX, this.gridY, newheading, this.flip);
        //this.kitesOccupied = newKites;
        this.heading = newheading;
    }

    flipIt() {
        //console.log("flip " + this.id);
        this.surround = false;
        let newFlip = TShirt.FLIP.BOTTOM;
        if (this.flip == TShirt.FLIP.BOTTOM) { newFlip = TShirt.FLIP.TOP; }
        //let newKites = this.kitesForPosition(this.gridX, this.gridY, this.heading, newFlip);
        //this.kitesOccupied = newKites;
        this.flip = newFlip;
        this.color = this.flip === TShirt.FLIP.TOP ? this.puzzle.tshirtColors.top : this.puzzle.tshirtColors.bottom;
        // if you are a top, you can't be a surround or have another top that you surround
        if (this.flip === TShirt.FLIP.TOP) { this.surround = false; this.surroundedTop = null; }
        else { this.mySurrounds = new Set(); } // if you are a bottom, you can't be surrounded
    }

    isPointInside(x, y) {
        for (const tri of this.triangles) {
            if (this.isPointInTriangle(x, y, tri)) {
                return true;
            }
        }
        return false;
    }

    isPointInTriangle(x, y, triangle) {
        const [A, B, C] = triangle;
        const areaABC = ((B.y - C.y) * (A.x - C.x) + (C.x - B.x) * (A.y - C.y)) / 2;
        const areaPBC = ((B.y - C.y) * (x - C.x) + (C.x - B.x) * (y - C.y)) / 2;
        const areaPCA = ((C.y - A.y) * (x - C.x) + (A.x - C.x) * (y - C.y)) / 2;

        const u = areaPBC / areaABC;
        const v = areaPCA / areaABC;
        const w = 1 - u - v;

        return u >= 0 && u <= 1 && v >= 0 && v <= 1 && w >= 0 && w <= 1;
    }
};

