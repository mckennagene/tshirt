class SuperTile {
    static id = 0;

    static phi = (Math.sqrt(5) + 1) / 2;
    static phiSquared = SuperTile.phi * SuperTile.phi;

    static SOUTH_WEST = 60;
    static SOUTH = 90;
    static SOUTH_EAST = 120;
    static NORTH_EAST = 240;
    static NORTH = 270;
    static NORTH_WEST = 300;

    static ROT_CW = "rotCW";
    static ROT_CCW = "rotCCW";
    static ROT_180 = "rot180";
    static NO_ROT = "noRot";
    static ROT2_CCW = "rot2CCW";
    static ROT2_CW = "rot2CW";

    // what are the default orientations of the level 2 version of the shapes. Level 2 is where all the components are present.
    // we have hard-wired things up to level2 because we don't have auto-align from virtual/optional components put in at level 1
    // so here we note the default orientation of each level 2 shape so if we want to rotate a shape to a specific orientation
    // we can then figure out how how many rotations it needs from default to get to the specific. 
    // e.g. if you look at the h2Data you will see it takes t1,h1,p1,f1 data and lays them out to make an H2 oriented at 240 (NorthEast)
    static SHAPE_DESIGNED_ORIENTATIONS = new Map([
        ["h", 240], // determined by the 3rd p in the shape
        ["t", 240], // same as the h since a t/2 is just an h1
        ["p", 270], // determined by the 1st h in the shape
        ["f", 270], // determined by the 1st h in the shape
        // Add more mappings as needed
    ]);

    static rotationDeltaMap = new Map([
        [240, new Map([[240, 0], [120, 1], [90, 2], [60, 3], [300, 4], [270, 5]])],
        [120, new Map([[240, 5], [120, 0], [90, 1], [60, 2], [300, 3], [270, 4]])],
        [90, new Map([[240, 4], [120, 5], [90, 0], [60, 1], [300, 2], [270, 3]])],
        [60, new Map([[240, 3], [120, 4], [90, 5], [60, 0], [300, 1], [270, 2]])],
        [300, new Map([[240, 2], [120, 3], [90, 4], [60, 5], [300, 0], [270, 1]])],
        [270, new Map([[240, 1], [120, 2], [90, 3], [60, 4], [300, 5], [270, 0]])],
    ]);

    static getNumberRotations(from, to) {
        if (SuperTile.rotationDeltaMap.has(from)) {
            const fromMap = SuperTile.rotationDeltaMap.get(from);
            if (fromMap.has(to)) {
                return fromMap.get(to);
            }
        }
        return -1; // Return -1 if the mapping doesn't exist
    }
    // if this is an H, it's children were created on assumption of a 240 orientation
    // so if this H is 240, then nothing to do, but if this H is 90, then everything, all children, all the way down the tree
    // must be rotated by 2CW (240=>120=>90)
    // so first find out how many CW rotations we need to do to get from default to match
    rotateChildrenToMatch() {
        let from = SuperTile.SHAPE_DESIGNED_ORIENTATIONS.get(this.name);
        let numRotations = SuperTile.getNumberRotations(from, this.orientation);
        
        for (let c of this.childArray) { // apply to all of my children, and their children all the way down, but don't apply to me
            c.rotateCWNTimes(numRotations);
        }
    }
    
    // make this same call on my children, and their children all the way down
    // seems like a small array and picking an index based on a modulus or something would be smarter
    rotateCWNTimes(n) {
        if (this.level < 1) { return; }
        for (let c of this.childArray) { c.rotateCWNTimes(n); }
        // now rotate me that many times
        for (let i = 0; i < n; i++) { this.orientation = SuperTile.rotateCW(this.orientation); }
        // now i'm done, pop up a level
    }
    rotateCCWNTimes(n) {
        if (this.level < 1) { return; }
        for (let c of this.childArray) { c.rotateCCWNTimes(n); }
        // now rotate me that many times
        for (let i = 0; i < n; i++) { this.orientation = SuperTile.rotateCCW(this.orientation); }
        // now i'm done, pop up a level
    }

    static rotate(orig, rotation) {
        if (rotation === SuperTile.NO_ROT) { return orig; }
        if (rotation === SuperTile.ROT_CW) { return SuperTile.rotateCW(orig); }
        if (rotation === SuperTile.ROT2_CW) { return SuperTile.rotateCW(SuperTile.rotateCW(orig)); }
        if (rotation === SuperTile.ROT_CCW) { return SuperTile.rotateCCW(orig); }
        if (rotation === SuperTile.ROT2_CCW) { return SuperTile.rotateCCW(SuperTile.rotateCCW(orig)); }
        if (rotation === SuperTile.ROT_180) { return SuperTile.rotate180(orig); }
        else { console.log("ERROR, can't rotate " + orig + " by " + rotation); console.trace(); return orig; }
    }

    static rotateCW(o) {
        if (o == SuperTile.NORTH) { return SuperTile.NORTH_EAST; }
        else if (o == SuperTile.NORTH_EAST) { return SuperTile.SOUTH_EAST; }
        else if (o == SuperTile.SOUTH_EAST) { return SuperTile.SOUTH; }
        else if (o == SuperTile.SOUTH) { return SuperTile.SOUTH_WEST; }
        else if (o == SuperTile.SOUTH_WEST) { return SuperTile.NORTH_WEST; }
        else if (o == SuperTile.NORTH_WEST) { return SuperTile.NORTH; }
        else {
            console.log("ERROR, can't rotate " + o);
            console.trace();
            return o;
        }
    }

    static rotateCCW(o) {
        if (o == SuperTile.NORTH) { return SuperTile.NORTH_WEST; }
        else if (o == SuperTile.NORTH_EAST) { return SuperTile.NORTH; }
        else if (o == SuperTile.SOUTH_EAST) { return SuperTile.NORTH_EAST; }
        else if (o == SuperTile.SOUTH) { return SuperTile.SOUTH_EAST; }
        else if (o == SuperTile.SOUTH_WEST) { return SuperTile.SOUTH; }
        else if (o == SuperTile.NORTH_WEST) { return SuperTile.SOUTH_WEST; }
        else {
            console.log("ERROR, can't rotate " + o);
            console.trace();
            return o;
        }
    }

    static rotate180(o) {
        if (o == SuperTile.NORTH) { return SuperTile.SOUTH; }
        else if (o == SuperTile.NORTH_EAST) { return SuperTile.SOUTH_WEST; }
        else if (o == SuperTile.SOUTH_EAST) { return SuperTile.NORTH_WEST; }
        else if (o == SuperTile.SOUTH) { return SuperTile.NORTH; }
        else if (o == SuperTile.SOUTH_WEST) { return SuperTile.NORTH_EAST; }
        else if (o == SuperTile.NORTH_WEST) { return SuperTile.SOUTH_EAST; }
        else {
            console.log("ERROR, can't rotate " + o);
            console.trace();
            return o;
        }
    }

    // We use this when we want to say for an H SuperTile at orientation X
    // we need to get the center little "t" (be it a single white one or a blue flipped one)
    // to this theading. 
    static hParentChildOrientationMap = {
        120: 0,
        270: 120,
        60: 240,
        300: 180,
        240: 60, // an H superTile facgin 240 (NE) needs to have a center little t facing 60 (tails NE)
        90: 300, // an H superTile facing 90 (S) needs to have a child little t facing 300 (tails South)
        // but an H superTile facing 90 with a T SuperTile child, means the T SuperTile Child faces SW (60)
    };


    // We use this when we want to say for a T SuperTile at orientation X
    // we need to get the center little "t" to this theading. 
    static tParentChildOrientationMap = {
        90: 0,   // S => 0 
        240: 120, // NE => 120
        300: 240, // NW = > 240
        120: 60,   //SE => 60    this says that a T SuperTile oriented SE has a primary child (the flipped tile in the cluster) oriented @60
        270: 180,   // N => 180
        60: 300, // SW => 300
    };

    // We use this when we want to say for a T SuperTile at orientation X
    // we need to get its first child SuperTile to be at this orientation
    // it's basically no rotation. 
    // So if we Want a T/N SuperTile at 120, the H/(N-1)  must be at 120
    static tParentSuperChildOrientationMap = {
        120: 120,
        240: 240,
        270: 270,
        300: 300,
        60: 60,
        90: 90,
    };
    // We use this when we want to say for an H SuperTile at orientation X
    // we need to get its first child SuperTile to be at this orientation
    // it's basically 1 CW rotation
    // So if we Want a H/N SuperTile at 120, the T/(N-1)  must be at 90
    static hParentSuperChildOrientationMap = {
        120: 90,
        240: 120,
        270: 240,
        300: 270,
        60: 300,
        90: 60,
    };

    // when a P level 1 tile (that has just two little t children) is at these orientations
    // the first child in the pair of t's that comprise the P needs this orientation
    static pfParentChildOrientationMap = {
        240: 120,   // a P facing NE (240) will have it's first t of the pair facing SE (120) --- (ROT_CW)
        270: 180,   // a P facing N (270) will have it's first t of the pair facing E (180)
        300: 240,   // a P facing NW (300) will have it's first t of the pair facing NE (240)
        60: 300,
        90: 0,
        120: 60
    }

    // We use this when we want a P or F SuperTile to be at orientation X
    // we know we have to get the P at the center of it to be oriented this way
    // so to get a P/N SuperTile at 120: then P/(N-1) SuperTile at it's center must be at 240
    static pfParentSuperChildOrientationMap = {
        120: 240,
        240: 270,
        270: 300,
        300: 60,
        60: 90,
        90: 120,
    }

    static getStartingTile() { return new SuperTile(null, "t", 0, 0, SuperTile.SOUTH, SuperTile.NORTH_EAST, false); }
    static maxLevels = 5;
    static requestedLevels = 3;

    constructor(parent, name, x, y, orientation, theading, tflipped, hidden) {
        this.id = SuperTile.id++;
        this.fullId = this.id;

        this.parent = parent;
        this.x = x;
        this.y = y;
        this.level = 0;
        this.childNumber = new Map();
        this.totalChildren = 0;

        this.name = name;
        this.orientation = orientation;
        this.defaultOrientation = orientation; // save this so we can later see how much this was has spun from its original
        this.cwRotationsFromDefault = 0;

        //this.children = null;
        this.children = new Map();
        this.childZero = null;
        this.childArray = [];

        this.tshirt = null;

        if (parent) {
            this.fullId = this.parent.fullId + "." + this.id;
            this.level = parent.level - 1;
            //console.log("created a child " + this.id + " " + this.name + "/" + this.level + " is child of " + this.parent.id);
            this.parent.listThisChild(this);
        }

        this.theading = 0;
        this.tflipped = null;
        this.visible = !hidden;
        if (this.name === "t") {
            this.theading = theading;
            this.tflipped = tflipped;
        }

        this.alignmentSibling = null;       // the sibling whose child my AP lands on
        this.alignmentElementIndex = null;  // index of the actual alignment element within the alignment Sibling, typically the child is not yet created when we set this but we know which one it will be
        this.myElementIndex = null;    // which of my alignment points is to be used to align me
        //this.alignmentPoints = []; // these are my alignment points that some sibling of mine may care about
       
    }

    // depth first search for the SuperTile with id passed
    getById(id) {
        if (this.id === id) { return this; }
        else {
            for (let c of this.childArray) {
                let r = c.getById(id);
                if (r) { return r; }
            }
        }
    }

    getFamilyTree(root) {
        const ids = this.fullId.split(".");
        let s = "";
        for (let i of ids) {
            const st = root.getById(parseInt(i));
            let name = i;
            let cn = "?";
            if (st) {
                name = st.name;
                if (st.childNumber) {
                    if (st.childNumber.has(st.name)) { cn = st.childNumber.get(st.name); }
                }
            }
            s = s + name + cn + "/";
        }
        return s;
    }

    static buildUpSuperTile(level = 3) {

        let st = new SuperTile(null, "h", 0, 0, SuperTile.NORTH_EAST, null, null);
        st.level = level;
        st.grow();
        return st;
    }

    static generateSuperTile(shape = "h", level = 1, outtermostOrientation = SuperTile.NORTH_EAST) {
        SuperTile.requestedShape = shape;
        SuperTile.requestedLevels = level;
        SuperTile.requestedOuterOrientation = outtermostOrientation;

        let st = new SuperTile(null, shape, 0, 0, outtermostOrientation, null, null);
        st.level = level;
        st.fillSkeleton();
        //st.logTheTree());
        return st;
    }

    getFirstChild(name) {
        if (this.children.has(name)) { return this.children.get(name)[0]; }
        else { return null; }
    }
    /*
    findStart() {
        if (this.level > 2) {
            if (this.children.has("t")) {
                return this.children.get("t")[0].findStart();
            }
            else if (this.children.has("h")) {
                return this.children.get("h")[0].findStart();
            }
        }
        else { return this; }
    }*/


    static t1Data = [
        { name: "t", x: 0, y: 0, orientation: null, theading: 240, tflipped: false, optional: false }, // NORTH_EAST, NO_ROT
    ];



    static h1Data = [
        { name: "t", x: 0, y: 0, orientation: null, theading: 300, tflipped: true, optional: false },
        { name: "t", x: 1, y: 0, orientation: null, theading: 240, tflipped: false, optional: false },
        { name: "t", x: 1, y: -1, orientation: null, theading: 0, tflipped: false, optional: false },
        { name: "t", x: 0, y: 1, orientation: null, theading: 0, tflipped: false, optional: false },
    ];

    static p1Data = [
        { name: "t", x: 0, y: 0, orientation: null, theading: 0, optional: false, tflipped: false },
        { name: "t", x: -1, y: -1, orientation: null, theading: 60, optional: false, tflipped: false },
    ];

    static t2Data = [
        { name: "h", x: 0, y: 0, orientation: SuperTile.NORTH_EAST, optional: false },
        
        // 46 group --- 64 on 41 (top)
        { name: "f", x: -1, y: -3, orientation: SuperTile.NORTH_WEST, optional: true, alignmentSiblingIndex: 0, siblingElementIndex: 11, myElementIndex: 4 },

        // 84 group --- 102 on 44 (bottom left)
        { name: "f", x: -2, y: 1, orientation: SuperTile.SOUTH, optional: true, alignmentSiblingIndex: 0, siblingElementIndex: 12, myElementIndex: 4 },
        // 122 group --- 143 on 38 (bottom right)
        { name: "f", x: 3, y: -1, orientation: SuperTile.SOUTH_EAST, optional: true, alignmentSiblingIndex: 0, siblingElementIndex: 10, myElementIndex: 5 },

        // 160 group --- 187 on 23 (left)
        { name: "p", x: -1, y: 0, orientation: SuperTile.NORTH, optional: true, alignmentSiblingIndex: 0, siblingElementIndex: 5, myElementIndex: 7 },
        // 198 group --- 225 on 20 (bottom)
        { name: "p", x: -1, y: -2, orientation: SuperTile.SOUTH_EAST, optional: true, alignmentSiblingIndex: 0, siblingElementIndex: 4, myElementIndex: 7 },
        // 236 group --- 266 on 26 (right)
        { name: "p", x: 1, y: -3, orientation: SuperTile.NORTH_EAST, optional: true, alignmentSiblingIndex: 0, siblingElementIndex: 6, myElementIndex: 8 },
    ];

    // This expanded H is the first time then we will have a superTile that can be expanded programtically
    // perhaps this one could have been done programmatically by someone smarter than me.

    static h2Data = [
        { name: "t", x: 0, y: 0, orientation: SuperTile.SOUTH_EAST, optional: false, },//SuperTile.ROT_CW },
        // 25 group --- 50 on 11 (left side)
        { name: "h", x: -2, y: 1, orientation: SuperTile.NORTH_EAST, optional: false, alignmentSiblingIndex: 0, siblingElementIndex: 2, myElementIndex: 6 }, // NO_ROT
        // 70 group --- 98 on 23 (bottom)
        { name: "h", x: 1, y: 1, orientation: SuperTile.NORTH_EAST, optional: false, alignmentSiblingIndex: 0, siblingElementIndex: 6, myElementIndex: 7 },  //   NO_ROT 
        // 115 group - 150 on 21 (top)
        { name: "h", x: -1, y: -2, orientation: SuperTile.SOUTH, optional: false, alignmentSiblingIndex: 0, siblingElementIndex: 5, myElementIndex: 9 },    //  ROT2_CW

        // 190 goes on 44
        { name: "f", x: -3, y: -1, orientation: SuperTile.SOUTH_EAST, optional: false, alignmentSiblingIndex: 1, siblingElementIndex: 4, myElementIndex: 8 }, //SOUTH_EAST, ROT_CW
        // 228 goes on 92
        { name: "f", x: 0, y: 2, orientation: SuperTile.NORTH, optional: false, alignmentSiblingIndex: 2, siblingElementIndex: 5, myElementIndex: 8 }, // NORTH, ROT_CCW
        // 266 goes on 134
        { name: "f", x: 1, y: -2, orientation: SuperTile.SOUTH_WEST, optional: false, alignmentSiblingIndex: 3, siblingElementIndex: 4, myElementIndex: 8 }, // SOUTH_WEST, ROT_180


        // 301 goes onto 137
        { name: "p", x: -1, y: -3, orientation: SuperTile.SOUTH_EAST, optional: false, alignmentSiblingIndex: 3, siblingElementIndex: 5, myElementIndex: 7 }, // SOUTH_EAST, ROT_CW, 
        // 339 goes onto 47
        { name: "p", x: -3, y: 1, orientation: SuperTile.NORTH, optional: false, alignmentSiblingIndex: 1, siblingElementIndex: 5, myElementIndex: 7 },// NORTH, ROT_CCW
        // 380 goes on 95 -- THIS NEXT P IS THE ONE THAT DEFINES THE ORIENTATION OF THIS H/2 SHAPE
        { name: "p", x: 2, y: -1, orientation: SuperTile.NORTH_EAST, optional: false, alignmentSiblingIndex: 2, siblingElementIndex: 6, myElementIndex: 8 }, // NORTH_EAST, NO_ROT

        // optionals
        // 425 on 214
        { name: "f", x: 4, y: 1, orientation: SuperTile.SOUTH_EAST, optional: true, alignmentSiblingIndex: 5, siblingElementIndex: 3, myElementIndex: 10 }, // SOUTH_EAST, ROT_CW
        // 462 on 251
        { name: "f", x: -2, y: -4, orientation: SuperTile.NORTH, optional: true, alignmentSiblingIndex: 6, siblingElementIndex: 3, myElementIndex: 10 },// NORTH, ROT_CCW
        // 501 on 176
        { name: "f", x: -4, y: 3, orientation: SuperTile.SOUTH_WEST, optional: true, alignmentSiblingIndex: 4, siblingElementIndex: 3, myElementIndex: 10 } // SOUTH_WEST, ROT_180

    ];

    static p2Data = [
        // 1 group
        { name: "p", x: 0, y: 0, orientation: SuperTile.NORTH_WEST, optional: false }, // 14,28
        // 39 group - THIS NEXT ONE IS THE ONE THAT DETERMINES THE ORIENTATION OF THIS p/2 SHAPE
        { name: "h", x: 0, y: -1, orientation: SuperTile.NORTH, optional: false, alignmentSiblingIndex: 0, siblingElementIndex: 7, myElementIndex: 5 }, // the determinative H, 14,27
        // 84 group -- 109 onto 31
        { name: "h", x: 3, y: -1, orientation: SuperTile.NORTH_WEST, optional: false, alignmentSiblingIndex: 0, siblingElementIndex: 8, myElementIndex: 6 }, // 17,27
        //xx 129 group -- 156 onto 115
        { name: "f", x: 4, y: 0, orientation: SuperTile.SOUTH_WEST, optional: false, alignmentSiblingIndex: 2, siblingElementIndex: 8, myElementIndex: 7 }, // 18,28
        // 167 group -- 195 onto 68
        { name: "f", x: -2, y: -1, orientation: SuperTile.NORTH_EAST, optional: false, alignmentSiblingIndex: 1, siblingElementIndex: 7, myElementIndex: 7 },// 12,27

        // optionals

        // 205 group, 229 goes on 185
        { name: "f", x: -3, y: -2, orientation: SuperTile.SOUTH_WEST, optional: true, alignmentSiblingIndex: 4, siblingElementIndex: 4, myElementIndex: 6 }, // 11,24   0th alignment point
        // 243 group, 270 on 103 x
        { name: "p", x: 2, y: 1, orientation: SuperTile.NORTH, optional: true, alignmentSiblingIndex: 2, siblingElementIndex: 4, myElementIndex: 7 }, // 16, 29 same as last required f, but its a p here and optional
        // 281 group -- 318 goes on 145
        { name: "f", x: 1, y: -3, orientation: SuperTile.NORTH, optional: true, alignmentSiblingIndex: 3, siblingElementIndex: 3, myElementIndex: 10 }, // 15, 25        2nd alignment point
        // 319 group, 356 goes on 183
        { name: "f", x: 1, y: 1, orientation: SuperTile.SOUTH, optional: true, alignmentSiblingIndex: 4, siblingElementIndex: 3, myElementIndex: 10 },  // 15,29         ...
        // 357 group, 382 goes on 74
        { name: "p", x: -2, y: -3, orientation: SuperTile.NORTH, optional: true, alignmentSiblingIndex: 1, siblingElementIndex: 9, myElementIndex: 6 }, // 12, 25       1st alignment point
        // 395 group -- 419 on 147
        { name: "f", x: 5, y: 0, orientation: SuperTile.NORTH_EAST, optional: true, alignmentSiblingIndex: 3, siblingElementIndex: 4, myElementIndex: 6 }, // 19,30 there is a slightly different variant of this one for f directly below

    ];

    static f2Data = [
        { name: "p", x: 0, y: 0, orientation: SuperTile.NORTH_WEST, optional: false }, // 14,28
        // 62 onto 29 - THIS NEXT ONE IS THE ONE THAT DETERMINES THE ORIENTATION OF THIS f/2 SHAPE
        { name: "h", x: 0, y: -1, orientation: SuperTile.NORTH, optional: false, alignmentSiblingIndex: 0, siblingElementIndex: 7, myElementIndex: 5 }, // the determinative H, 14,27
        // 119 onto 35
        { name: "h", x: 3, y: -1, orientation: SuperTile.NORTH_WEST, optional: false, alignmentSiblingIndex: 0, siblingElementIndex: 8, myElementIndex: 6 }, // 17,27
        // 156 onto 115
        { name: "f", x: 4, y: 0, orientation: SuperTile.SOUTH_WEST, optional: false, alignmentSiblingIndex: 2, siblingElementIndex: 8, myElementIndex: 7 }, // 18,28
        // 195 onto 68
        { name: "f", x: -2, y: -1, orientation: SuperTile.NORTH_EAST, optional: false, alignmentSiblingIndex: 1, siblingElementIndex: 7, myElementIndex: 7 },// 12,27
        // 233 onto 113 
        { name: "f", x: 2, y: 1, orientation: SuperTile.NORTH, optional: false, alignmentSiblingIndex: 2, siblingElementIndex: 7, myElementIndex: 7 }, // 16, 29 (same as an optional p in the p2data)

        // optionals
        // 243 group --- 261 goes to 79 is a decent fit 
        { name: "f", x: -3, y: -2, orientation: SuperTile.SOUTH_WEST, optional: true, alignmentSiblingIndex: 1, siblingElementIndex: 11, myElementIndex: 4 }, // 11,24    0th alignment point
        // 281 group --- 305 goes on 73 - this one seems to be wrong
        { name: "p", x: -2, y: -3, orientation: SuperTile.NORTH, optional: true, alignmentSiblingIndex: 1, siblingElementIndex: 9, myElementIndex: 6 }, // 12, 25        1st alignment point
        // 319 group -- 356 goes on 145
        { name: "f", x: 1, y: -3, orientation: SuperTile.NORTH, optional: true, alignmentSiblingIndex: 3, siblingElementIndex: 3, myElementIndex: 10 }, // 15, 25         2nd alignment point
        // ??? group --- 390 goes on 19
        { name: "f", x: 1, y: 1, orientation: SuperTile.SOUTH, optional: true, alignmentSiblingIndex: 0, siblingElementIndex: 4, myElementIndex: 9 },  // 15,29          ...
        // ??? group --- 432 goes on 221
        { name: "f", x: 6, y: 0, orientation: SuperTile.SOUTH_EAST, optional: true, alignmentSiblingIndex: 5, siblingElementIndex: 3, myElementIndex: 10 }, // 20,28 there is a slightly different variant of this one for p directly above
    ];


    // may not need this, switched to using an index based on all elements, not just the hidden ones
    // because when an h2 joins a center t, we need that.
    // even though when an f2 joins its sibling h2 we don't.
    //addAlignmentPoint(ap) {
    //    this.alignmentPoints.push(ap);
    //    //console.log("\t the " + (this.alignmentPoints.length - 1) + "th alignment point of " + this.fullId + " is " + ap.fullId + " " + ap.name + "/" + ap.level + " @" + ap.x + "," + ap.y);
   // }

    // when a first f2 comes in to meet an h2, the f2's alignment point (fake child) lands on the h2's actual child (it's first f1)
    // but in an h3, when its second child (the first h2) comes in to meet it's first child (the t? or h1?) , the h2's actual child lands on the h1's alignment point (fake child)
    alignToSibling(alignmentSiblingIndex, siblingElementIndex, myElementIndex) {
        //console.log("in alignToSibling(" + alignmentSiblingIndex + ", " + siblingElementIndex + ", " + myElementIndex +")");
        this.alignmentSiblingIndex = alignmentSiblingIndex;
        this.alignmentSibling = this.parent.childArray[alignmentSiblingIndex]; // if we can get the child below, this isn't really needed beyond here;
        this.siblingElementIndex = siblingElementIndex;
        this.myElementIndex = myElementIndex;
    }

    alignBy() {
        // when H/n come in around an H/(n-1) sibling real P children, overlap fake P children. 
        // when P/n children of the H/n come into the H/n, the fake P/(n-1) children overlap real P/(n-1) children of the H/n
        
        if (this.alignmentSibling !== null) { // if we have an alignment sibling, we will align to it
            const siblingsAP = this.alignmentSibling.childArray[this.siblingElementIndex];
            const sibChildZero = siblingsAP.getLeafChildZero();
            const alignToTShirt = sibChildZero.tshirt;
            const myAlignPoint = this.childArray[this.myElementIndex];
            const myChildZero = myAlignPoint.getLeafChildZero();
            const myTShirt = myChildZero.tshirt;
            const deltaOfAPs = { x: alignToTShirt.gridX - myTShirt.gridX, y: alignToTShirt.gridY - myTShirt.gridY };

            return (deltaOfAPs);
        }
        else { return { x: 0, y: 0 }; }
    }


    /**
    * this starts at the top and goes down. if you want 4 levels, it creates level 4, then 3, then 2, then 1
    * and it is putting the right supertiles and finally the right t's into each level
    * this method makes each little cluster at 0,0. the parent has the right orientation but nothing is in the right position
    * and the lowest levels t's, are not rotated in alignment with the parent orientation
    *
    *
    * we will always grow like this. we start with x, we add y and z and all the p's and f's surrounding.
    *
    *                                    y
    *                     y          x  y y
    *             x  =>  x z   =>   x x   z  
    *                                    z z  
    * 
    */
    fillSkeleton() {
        if (this.level <= 0) { return; } // nothing

        if (this.level == 1) {
            this.fillOutLevel1();
            return;
        } // hard-wired alignment offsets
        else if (this.level == 2) {
            this.fillOutLevel2();
            return;
        }
        else { // now we have relative (computed) alignments based on optional supertiles, 
            let data = SuperTile.h2Data;
            if (this.name === "p") { data = SuperTile.p2Data; }
            else if (this.name === "f") { data = SuperTile.f2Data; }
            else if (this.name === "t") { data = SuperTile.t2Data; }
            for (const child of data) { let c = this.addChild(child); }
        }
    }


    // tshirts are being laid out in specific, hard-wired orientations, but the containing SuperTile has a dynamic orientation 
    fillOutLevel1() {
        let data = SuperTile.h1Data;
        if (this.name === "t") { data = SuperTile.t1Data; }
        else if (this.name === "f" || this.name === "p") { data = SuperTile.p1Data; }
        for (const child of data) { this.addChild(child); }
    }

    // we are making the level2 at hard-wired orientations and their child t-shirts will
    // get specific, hard-wired orientations to match in fillOutLevel1()
    fillOutLevel2() {
        let data = SuperTile.h2Data;
        if (this.name === "f") { data = SuperTile.f2Data; }
        else if (this.name === "p") { data = SuperTile.p2Data; }
        else if (this.name === "t") { data = SuperTile.t2Data; }
        for (const child of data) { this.addChild(child); }
    }

    listThisChild(child) {
        if (!this.children.has(child.name)) {
            this.children.set(child.name, []);
            child.childNumber.set(child.name, 0);
        }
        this.children.get(child.name).push(child);
        child.childNumber.set(child.name, this.children.get(child.name).length - 1);
        this.childArray.push(child);
    }

    firstChild(name) {
        for (let c of this.children.get(name)) {
            if (c.visible) { return c; }
        }
        return null;
    }

    setTShirt(t) {
        this.tshirt = t;
        t.setSuperTile(this);
    }

    
    static levelSpace = ["          ", "        ", "      ", "    ", "  ", ""];
    logTheTree(skipLevel0 = false) {
        //if (!this.visible) { return; }
        if (this.level == 0 && skipLevel0) { return; }
        const t = SuperTile.levelSpace[this.level];
        let facing = " facing " + this.orientation;
        if (this.level == 0) { facing = " heading " + this.theading + " flipped " + this.tflipped; }
        let nkids = this.totalChildren;

        let viz = " @ " + this.x + "," + this.y + facing + " #kids=" + nkids;
        if (!this.visible) { viz = viz + "(hidden)"; }

        let cz = "(none)";
        if (this.childZero) { cz = " cz=" + this.childZero.id + " "; }
        console.log(t + "Id:" + this.fullId + " " + this.name + "/" + this.level + " child-" + this.name + "#" + this.childNumber.get(this.name) + " is " + viz + cz + " alignSib=" + this.alignmentSibling);
        for (let child of this.childArray) {
            child.logTheTree(skipLevel0);
        }
    }


    //addChild(name, dx, dy, orientation, theading, tflipped, hidden = false, sibling, tshirtNumber) {
    addChild(c) {
        let opt = c.optional;
        if (!this.visible) { opt = true; } // if parent is hidden, child must be hidden
        let child = new SuperTile(this, c.name, c.x, c.y, c.orientation, c.theading, c.tflipped, opt);

        //console.log("added child " + child.fullId + " " + child.name + "/" + child.level + " facing " + child.orientation + " to " + this.fullId + " @ " + this.x + "," + child.x + "," + child.y);

        if (this.totalChildren == 0) { this.childZero = child; }
        this.totalChildren++;
        // handle the alignment data
        // when any shape, like f2, for example, is created, it will put its optional elements into the alignment point array
        // so this gets called when the f2 is adding its optional elements
        //if (c.optional) { this.addAlignmentPoint(child); } // we may not need this.
        // when a shape like 'h3' is adding an element like an 'f2', we will record on the 'f2' that it aligns to one of its siblings children
        // so this gets called when the h3 is adding an f
        // can we get the actual object instead of passing along the index? 
        // any sibling you are aligning to must already be made, no? so we should be able to get the actual object
        //console.log("I added child " + child.fullId + " the child data i used has alignmentSiblingIndex=" + c.alignmentSiblingIndex);
        if (c.alignmentSiblingIndex >= 0) {
            //console.log("out here alignmentelementindex = " + c.siblingElementIndex + " myelemIndex=" + c.myElementIndex);
            //console.log("alignmentSiblingindex = " + c.alignmentSiblingIndex) ;
            //if( alignmentSibling ) { console.log( "and the actual sibling is " + alignmentSibling.fullId ); }
            //else { console.log( "but the actual sibling isn't here yet" ) ; }
            child.alignToSibling(c.alignmentSiblingIndex, c.siblingElementIndex, c.myElementIndex);
        }
        child.fillSkeleton();
        return child;
        //console.log("added a child to " + this.id + " the child id is " + child.id + " parent now has " + this.children.length + " children");
    }

    getChildren() {
        return this.children;
    }
    getChild(name, number) {
        if (this.children.has(name)) {
            let namedChildren = this.children.get(name);
            if (namedChildren.length > number) { return namedChildren[number]; }
        }
        return null;
    }

    getAllTShirts() {
        const leaves = [];
        const traverse = (node) => {
            if (node.children.size === 0) {
                if (node.tshirt) { leaves.push(node.tshirt); }
                return;
            }
            for (const childArray of node.children.values()) {
                for (const child of childArray) {
                    traverse(child);
                }
            }
        };
        traverse(this);
        return leaves;
    }

    getLeafChildZero() {
        if (this.childZero === null) { return null; }
        let current = this.childZero;
        while (current.childZero !== null) { current = current.childZero; }
        return current;
    }

    // child 1 point 5 & 7, child 2 points 9 & 11, child 3 points 5 & 7


    // we call this to get an array of f elements that determine the 3 points of the h-shape
    // we get the highest level f first before we call this (that one will be the 0,1 and 2 f of the highest level shape)
    // for each of those three we get a chain here that alternates between the 0th and 1st f children down the line
    // until level 1. If the highest level shape is even (e.g. we are drawing an h6) then we get the 0,1 or 2 f/5 before we
    // start this. Then for each of those level 5 f children of the h/6, we get the 0th f/4, the 1st f/3, the 0th f/2, the 1st f/1
    // by contrast if we start with an odd-level h, say h/5, then we first get its 0,1,2 f/4 children, and for each of
    // those we get the 0th f/3, 1st f/2 and 0th f/1.
    getFPoint(f, evenStart) {
        const isEven = this.level % 2 == 0;

        if (f.level == 1) {
            let index = 0;
            if (isEven && evenStart || !isEven && !evenStart) { index = 1; }
            //console.log("for " + f.fullId + " " + f.name + "/" + f.level + " return the first t");
            return f.childArray[index]; // needs to be 1 for h4
        }
        else {
            let index = 1;
            if (isEven && evenStart || !isEven && !evenStart) { index = 0; }
            //console.log("for " + f.fullId + " " + f.name + "/" + f.level + " evenSt=" + evenStart + " isEven=" + isEven + " get children(f)[" + index + "]");
            let r = f.getFPoint(f.children.get("f")[index], evenStart);
            return r;
        }
    }


    getSuperTileShapePoints() {
        if (this.name === "h") { return this.getHShapePoints(); }
        else if (this.name === "p") { return this.getPShapePoints();  }
        else if (this.name === "f") { return this.getFShapePoints(); }
        else if (this.name === "t") { return this.getTShapePoints(); }
        else { return null; }
    }

    // notes and diagrams on how the 2 missing points are computed (e.g. the Trig picture)
    // https://docs.google.com/spreadsheets/d/1G6kWztYdlm9FnVGntPo7KSbUjytOKVANrblbxH96AXE/edit#gid=608147798
    getPShapePoints() {
        if (this.level == 1) {
            const t1 = this.childArray[0].tshirt;
            const t2 = this.childArray[1].tshirt;
            const long = Puzzle.KITE_SIZE * 8;
            const short = Puzzle.KITE_SIZE * 4;// * Math.sqrt(3);
            const bigRot = Math.PI / 3 * 2;
            const littleRot = Math.PI / 3;
            let n = Math.PI / 2; //  for north and south, 90 degrees
            if (this.orientation == SuperTile.NORTH_EAST || this.orientation == SuperTile.SOUTH_WEST) { n = Math.PI; } // 180 degrees
            else if (this.orientation == SuperTile.SOUTH_EAST || this.orientation == SuperTile.NORTH_WEST) { n = 0; } // 360 degrees / 0 degrees
            const startRot = Puzzle.degreesToRadians(this.orientation) + n;
            return { startPoint: t1.points[2], startRot: startRot, path: [long, littleRot, short, bigRot, long, littleRot] }
        }
        else {
            const evenStart = this.level % 2 == 0;
            // get the 2 (non-optional) F's
            const f1 = this.getFPoint(this.children.get("f")[0], evenStart);
            const f2 = this.getFPoint(this.children.get("f")[1], evenStart);

            let ptNumber = 5;
            if (evenStart) { ptNumber = 7; }
            const pt1 = { l: "pt1", x: f1.tshirt.points[ptNumber].x, y: f1.tshirt.points[ptNumber].y };
            const pt3 = { l: "pt3", x: f2.tshirt.points[ptNumber].x, y: f2.tshirt.points[ptNumber].y };
            let xdist = pt3.x - pt1.x;

            // this is the ugly business of slightly adjusting things at levels 2 and 3 so they line up visually.
            // it's ugly business for me because I don't really understand the theory and these #'s are just hacking
            // around until things look right. Adjustments are necessary at lower levels because the shapes have not yet 
            // converged on the side length ratios of 1+3phi : 1+2phi, which they really only achieve at infinite levels, 
            // but the deltas do reduce exponentially. At the resolution this code is typically rendering they are 
            // not noticeable (go sub-pixel) after level 3. noticeable errors may persist to higher levels if used at 
            // higher resolutions. these adjustments are not managed super well here. They are done better in the F-shape. 
            // 
            // here we adjust the length between the two f points to be closer to the converged value.
            // and below we change the starting point of the shape to match so it isnt' exactly on the f point.
            // a better approach would be to make a copy of the f point and then alter it, then we don't have to do two 
            // separate adjustments, one here, and one below.
            let yAdjust = 1.4;
            let xAdjust = 1.6;
            if (this.level == 3) { // for level 3 (beyond 3, no adjustment needed)
                yAdjust = -0.95;
                xAdjust = -0.55;
            }
            else if (this.level == 4) { yAdjust = 0; xAdjust = 0; }
            let ydist = Math.abs(pt3.y - pt1.y);
            // these adjustments will bring the short side of the p into line at low level #'s
            // eventually the short side is n(1+2phi) but not at the lowest levels
            // when drawing an h3, the p/2's adjacent to the h/2's need to be about 4.06521 * the short side of the H
            // if it were n(1+2phi) (uses n from the h, not the p) it would be 4.23606 times the short side of the H
            if (this.orientation == SuperTile.SOUTH_EAST) { ydist += yAdjust; }
            else if (this.orientation == SuperTile.NORTH_EAST) { xdist -= xAdjust; }
            else if (this.orientation == SuperTile.NORTH_WEST) { ydist += yAdjust; }
            else if (this.orientation == SuperTile.NORTH) { ydist += yAdjust * 0.579; xdist -= xAdjust * .707; }
            else if (this.orientation == SuperTile.SOUTH) { ydist += yAdjust * 0.579; xdist += xAdjust * .707; }
            else if (this.orientation == SuperTile.SOUTH_WEST) { xdist += xAdjust; ydist -= yAdjust * .5; }
            // compute the length of the sides of the parallelogram a and b.
            // we construct an obtuse triangle with one side a, one side b and the hypotenuse c. 
            // we can compute c as the distance between the two f points above. the angle opposite c we assume to be 60 degrees. 
            // per the paper, the longer side of the Parallelogram, a= n(1+3phi), the shorter side, b= n(1+2phi)
            // given we know the hypotenuse c and the law of cosines c^2 = a^2 + b^2 - 2ab cos(C)
            // we know c^2 = (n(1+3phi))^2 + (n(1+2phi))^2 - (n(1+3phi))(n(1+2phi))
            // therefore n = +/- sqrt( c^2 / (1+5phi+7phi^2))
            const c = Math.sqrt(xdist * xdist + ydist * ydist);
            const K = 27.41640786; // K = (1+5phi+7phi^2)
            let n = Math.sqrt(c * c / K);
            let localN = n; // this is what it is in converged state (above level 3) 
            // but for the first 3 levels we have to hack a bit, we are going to use the n size that the h is using.
            if (this.level == 2) { n = 50.60148705485109; }
            else if (this.level == 3) { n = 130.1489981578806; }
            //else if (this.level == 4) { n = 340.603614 } // by level 4 if we didn't use this our error would only be 0.028%
            //else if (this.level == 5) { n = 891.409982 }
            //else if (this.level == 6) { n = 2333.626339 }
            //else { n = 2333.626339 * Math.pow(SuperTile.phi, this.level - 6); }

            // this shows the diminishing error rate between the locally computed n and the n we borrow from the H computation at lower levels.
            // const error = Math.abs(n-localN)/n;
            // console.log( "level=" + this.level + " error = " + error ) ;

            const a = n * (1 + 3 * SuperTile.phi);

            const alpha = Math.asin(ydist / c);
            const beta = Math.asin(Math.sin(Math.PI / 3) * a / c);
            const mu = Math.PI / 2 - alpha;
            let gamma = Math.PI / 2 - beta - mu;
            let startRot = gamma;
            let theta = Math.PI - beta - Math.PI / 3;

            const long = a;
            const short = Math.sqrt(c * c + a * a - 2 * a * c * Math.cos(theta));

            // similar to error in n, this shows the error in the length of the short side of the converged shape (above level 3) 
            // and the current shape. The long side : short side ratio eventually becomes the 1+3phi to 1+2phi as the paper indicates.
            // by level 4 the error is only 2.5% so we no longer need to muck with it. 
            //const error = Math.abs( n * (1 + 2 * SuperTile.phi) - short) / n * (1 + 2 * SuperTile.phi);
            //console.log( "orientation=" + this.orientation + " level=" + this.level + " short error = " + error) ;

            // the above is all the angels needed for SOUTH_EAST

            // added this for NORTH & SOUTH
            let tau = beta - mu;
            if (this.orientation == SuperTile.NORTH || this.orientation == SuperTile.SOUTH) {
                gamma = theta - alpha;
            }

            let startPoint = pt3; // may change with different orientations
            if (this.orientation == SuperTile.SOUTH_EAST) {
                startPoint = pt3;
                startPoint.y -= yAdjust;
                startRot = gamma;
            }
            else if (this.orientation == SuperTile.NORTH_EAST) {
                // changed x to get angle right, but change y to get placement right
                startPoint = pt3;
                startPoint.y += yAdjust; // this was - until 11:38 am jun 13
                startPoint.x -= xAdjust * .5; // and this .5 got added then too
                startRot = gamma;
            }
            else if (this.orientation == SuperTile.NORTH_WEST) {
                startPoint = pt1;
                startPoint.y -= yAdjust;
                startRot = gamma;
            }
            else if (this.orientation == SuperTile.SOUTH) {
                startPoint = pt3;
                startRot = Math.PI / 2 - tau;
                startPoint.x += xAdjust * .707;
                startPoint.y -= yAdjust * .579;
            }
            else if (this.orientation == SuperTile.NORTH) {
                startPoint = pt1;
                startRot = Math.PI / 2 - tau;
                startPoint.x += xAdjust * .707; // this was - until 11:37 am on Jun 13
                startPoint.y -= yAdjust * .579;
                //console.log( "NORTH " + this.fullId + "sides: " + a + "," + short + "," + c + " angles: alpha = " + Puzzle.radiansToDegrees(alpha) + " beta = " + Puzzle.radiansToDegrees(beta) + " mu = " + Puzzle.radiansToDegrees(mu) + " gamma = " + Puzzle.radiansToDegrees(gamma) + " theta = " + Puzzle.radiansToDegrees(theta) + " tau = " + Puzzle.radiansToDegrees(tau) + " startRot = " + Puzzle.radiansToDegrees(startRot) );
            }
            else if (this.orientation == SuperTile.SOUTH_WEST) {
                startPoint = pt1;
                startPoint.y += yAdjust * .1;
                startPoint.x -= xAdjust * .9;
                startRot = gamma;
            }
            const bigRot = 2 * Math.PI / 3;
            const littleRot = Math.PI / 3;
            return { startPoint: startPoint, startRot: startRot, path: [short, bigRot, long, littleRot, short, bigRot] }
        }
    }

    // notes and diagrams on how the 2 missing points are computed (e.g. the Trig picture)
    // https://docs.google.com/spreadsheets/d/1G6kWztYdlm9FnVGntPo7KSbUjytOKVANrblbxH96AXE/edit#gid=608147798
    getFShapePoints() {

        if (this.level == 1) {
            const t1 = this.childArray[0].tshirt;
            const t2 = this.childArray[1].tshirt;
            return { specificPoints: [t1.points[2], t1.points[5], t2.points[5], t2.points[7], t2.points[9]] };
        }
        else {
            const evenStart = this.level % 2 == 0;
            const f1 = this.getFPoint(this.children.get("f")[0], !evenStart);
            const f2 = this.getFPoint(this.children.get("f")[0], evenStart);
            const f3 = this.getFPoint(this.children.get("f")[1], evenStart);
            const f4 = this.getFPoint(this.children.get("f")[2], evenStart);
            //console.log("f's are: " + f1.fullId + ", " + f2.fullId + ", " + f3.fullId + ", " + f4.fullId);

            let ptNumber = 5;
            let altPt = 7;
            if (evenStart) { ptNumber = 7; altPt = 5; }
            const pt1 = { l: "pt1", x: f1.tshirt.points[altPt].x, y: f1.tshirt.points[altPt].y };
            let pt2 = { l: "pt2", x: f2.tshirt.points[ptNumber].x, y: f2.tshirt.points[ptNumber].y };
            const pt3 = { l: "pt3", x: f3.tshirt.points[ptNumber].x, y: f3.tshirt.points[ptNumber].y };
            let pt4 = { l: "pt4", x: f4.tshirt.points[ptNumber].x, y: f4.tshirt.points[ptNumber].y };

            // this is the ugly business of slightly adjusting points at levels 2 and 3 so things line up well
            // i don't understand the theory. so i'm just hacking. I think it's managed a bit better here than
            // in the P-shapes. Here I am moving either pt3 or pt4 by a slight amount and the changes are thus
            // isloated to one place, whereas in the P shape I was manipulating distances between points and then
            // also had to manipulate the start points, which is obviously dumb but one gets smarter as one goes.
            let xadjust = 0.5;
            let yadjust = 0.5;
            if (this.level == 3) { xadjust = xadjust / 2; yadjust = yadjust / 2; }
            else if (this.level > 3) { xadjust = 0; yadjust = 0; }
            if (this.orientation == SuperTile.SOUTH_EAST) { pt4.x -= xadjust; pt4.y -= yadjust; }
            else if (this.orientation == SuperTile.SOUTH_WEST) { pt3.x -= xadjust; pt3.y += yadjust; }
            // end of ugly business

            const xdist12 = pt1.x - pt2.x;
            const ydist12 = pt1.y - pt2.y;
            const xdist13 = pt1.x - pt3.x;
            const ydist13 = pt1.y - pt3.y;
            const xdist23 = pt2.x - pt3.x;
            const ydist23 = pt2.y - pt3.y;
            const xdist14 = pt1.x - pt4.x;
            const ydist14 = pt1.y - pt4.y;
            const xdist24 = pt2.x - pt4.x;
            const ydist24 = pt2.y - pt4.y;
            const xdist34 = pt3.x - pt4.x;
            const ydist34 = pt3.y - pt4.y;

            const length12 = Math.sqrt(ydist12 * ydist12 + xdist12 * xdist12);
            const length13 = Math.sqrt(ydist13 * ydist13 + xdist13 * xdist13);
            const length23 = Math.sqrt(ydist23 * ydist23 + xdist23 * xdist23);
            const length14 = Math.sqrt(ydist14 * ydist14 + xdist14 * xdist14);
            const length24 = Math.sqrt(ydist24 * ydist24 + xdist24 * xdist24);
            const length34 = Math.sqrt(ydist34 * ydist34 + xdist34 * xdist34);

            const alpha = Math.asin(ydist12 / length12);
            const beta = Math.PI / 2 - alpha;
            const theta = Math.acos((length13 * length13 - length34 * length34 - length14 * length14) / (-2 * length34 * length14));
            // there are 540 degrees inside this shape (it spans 3 triangles so 3*180=540)
            // two of the angles are 120 and one is 60, so that leaves 240 degrees.
            const gamma = Puzzle.degreesToRadians(240) - theta;//- beta;
            const mu = gamma - beta - Math.PI / 2; // angle to take between pt2 and the new point we don't yet have, call it 2a

            const a1 = Math.acos((length14 * length14 - length13 * length13 - length34 * length34) / (-2 * length13 * length34));
            const a2 = Math.acos((length12 * length12 - length13 * length13 - length23 * length23) / (-2 * length13 * length23));
            const a3 = 2 / 3 * Math.PI - a1 - a2;
            const length2x = length23 * Math.sin(a3) / Math.sin(Math.PI / 3);
            const b3 = Math.PI - Math.PI / 3 - a3;
            const lengthx3 = (length23 * Math.sin(b3)) / Math.sin(Math.PI / 3);

            let startRot = -Math.PI / 2 - beta; // NORTH
            if (this.orientation == SuperTile.NORTH_EAST || this.orientation == SuperTile.SOUTH_EAST) { startRot = -alpha; }
            else if (this.orientation == SuperTile.SOUTH) { startRot = (-alpha); }

            return { startPoint: pt1, startRot: startRot, path: [length12, -(Math.PI - gamma), length2x, -2 * Math.PI / 3, lengthx3, -Math.PI / 3, length34] }
        }
    }

    getTShapePoints() {
        return null;
    }

    // 
    // notes, diagrams on how the angles and missing 3 points were computed.
    // https://docs.google.com/spreadsheets/d/1G6kWztYdlm9FnVGntPo7KSbUjytOKVANrblbxH96AXE/edit#gid=608147798
    //
    // For an H, the key points are formed by the tip of the F's point. And the tip of the F moves a bit depending on the level
    // H1 :     1,                     2,                     3                  pt 5- top of the neck on th sq armpit side
    //             1
    // H2 :    20(f0),                23(f1),                26(f2)              pt 7- bottom of the sleeve on the sq armpit side
    //             2 1
    // H3 :   175(f0/f0),            213(f1/f0)             251(f2/f0)           pt 5-top of the neck on the sq armpit side
    //             3  2  1
    // H4 :  1929(f0/f0/f1),        2362(f1/f0/f1),        2795(f2/f0/f1)        pt 7bottom of the sleeve on the sq armpit side
    //             4  3  2 1
    // H5 : 21756(f0/f0/f1/f0)     26658(f1/f0/f1/f0)     31560(f2/f0/f1/f0)    pt 5-top of the neck on the sq armpit side
    //             5  4  3  2  1
    // H6 :246132(f0/f0/f1/f0/f1) 301607(f1/f0/f1/f0/f1) 357082(f2/f0/f1/f0/f1) pt 7bottom of the sleeve on the sq armpit side
    getHShapePoints() {
        //console.log( this.fullId ) ;
        const evenStart = this.level % 2 == 0;
        let f1, f2, f3;
        if (this.level == 1) {
            const t1 = this.childArray[1].tshirt;
            const t2 = this.childArray[2].tshirt;
            const t3 = this.childArray[3].tshirt;
            // static h1Outline = [[1, 5], [1, 7], [2, 5], [2, 7], [3, 9], [3, 11]];
            return { specificPoints: [t1.points[5], t1.points[7], t2.points[5], t2.points[7], t3.points[9], t3.points[11]] };
        }
        else {
            // get the 3 F's.
            f1 = this.getFPoint(this.children.get("f")[0], evenStart);
            f2 = this.getFPoint(this.children.get("f")[1], evenStart);
            f3 = this.getFPoint(this.children.get("f")[2], evenStart);

            //console.log("f1=" + f1.id + " " + f1.name + "/" + f1.level + " @ " + f1.x + "," + f1.y + " facing " + f1.theading);
            // points aren't set until the "drawOutline" is done.
            let ptNumber = 5;
            if (evenStart) { ptNumber = 7; }

            const pt1 = { l: "pt1", x: f1.tshirt.points[ptNumber].x, y: f1.tshirt.points[ptNumber].y };
            const pt2 = { l: "pt2", x: f2.tshirt.points[ptNumber].x, y: f2.tshirt.points[ptNumber].y };
            const pt3 = { l: "pt3", x: f3.tshirt.points[ptNumber].x, y: f3.tshirt.points[ptNumber].y };

            const xdist13 = pt1.x - pt3.x;
            const ydist13 = pt1.y - pt3.y;

            const xdist32 = pt3.x - pt2.x;
            const ydist32 = pt3.y - pt2.y;

            const xdist21 = pt2.x - pt1.x;
            const ydist21 = pt2.y - pt1.y;

            let c = Math.sqrt(xdist13 * xdist13 + ydist13 * ydist13); // any pair of points will do
            // the paper establishes the relationship beween the short side of the irregular hexagon and the long side of the irregular hexagon.
            // If the short side is "H" (or here 'b') then the long side, a, is H(1+3phi). 
            // Because we can express a in terms of b, and we know the hypotenuse, c, we can compute the short side, b and 
            // from there can compute a. It's not a right triangle, but we know the angle opposite side c is 120 degrees
            // therefore from the law of cosines we can compute the length of the short side
            //     c^2 = b^2 + a^2 - 2*a*b*cos(120 degrees)
            //     c^2 = b^2 + (b(1+3phi))^2 - 2*a*(b(1+3phi))*cos(120 degrees)
            //     c^2 = b^2 + b^2 + b^2(3phi)^2 + b^2*2*3phi + b^2 + b^2(3phi)
            //     c^2 = b^2( 3+(3phi)^2 + (2+1)*3phi)
            //     c^2 = b^2( 3+(3phi)^2 + 9*phi)
            //        K = 3+(3phi)^2 + 9*phi  
            //     c^2 = b^2 * K
            //      b = sqrt(c^2 / K)
            let K = 41.1246118;
            let b = Math.sqrt(c * c / K); //  b is called "H" in the paper

            let startPoint = pt1;
            let alphaDist = xdist13;

            if (this.orientation === SuperTile.SOUTH || this.orientation === SuperTile.SOUTH_EAST) {
                startPoint = pt1;
                alphaDist = xdist13;
            }
            else if (this.orientation == SuperTile.NORTH_EAST || this.orientation == SuperTile.NORTH) {
                startPoint = pt3;
                alphaDist = xdist32;
            }
            else if (this.orientation == SuperTile.NORTH_WEST || this.orientation == SuperTile.SOUTH_WEST) {
                startPoint = pt2;
                alphaDist = xdist21;
            }

            let newAlpha = Math.abs(Math.asin(alphaDist / c));
            let newBeta = Math.asin(0.86602540378 * b / c); // 0.8660 is sin(120)
            let startRot = Math.PI / 2 - newAlpha - newBeta;
            //if( this.orientation === SuperTile.NORTH_EAST) { 
            //    startRot += Math.PI/6; //console.log( "added extra 30 rotation for " + this.fullId);
            //}
            //if (this.fullId === "0.2214.2253") {
            //    console.log("GMC: H " + this.fullId + " facing" + this.orientation + " starts at " + startPoint.x + ","
            //        + startPoint.y + " and has n = " + b
            //        + " newAlpha=" + Puzzle.radiansToDegrees(newAlpha) + " and newBeta=" + Puzzle.radiansToDegrees(newBeta) + " startRot= " + Puzzle.radiansToDegrees(startRot) + " degrees");
            //}
            let short = b;
            let long = b * (1 + 3 * SuperTile.phi);
            let rot = Math.PI / 3;
            return { startPoint: startPoint, startRot: startRot, path: [long, rot, short, rot, long, rot, short, rot, long, rot] }
        }
    }
}

