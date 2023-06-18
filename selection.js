class Selection {

    constructor() {
        this.set = new Set(); // all selected, no hierarchy, may redo later but this is the way it works now
        this.clipboard = new Set(); // when we copy, a deep copy of the selection goes here 
        this.cleanRedrawBBoxes = []; // an array of bounding boxes inside of which we will clean and redraw
    }

    getSelection() { return this.set; }
    getClipboard() { return this.clipboard; }

    // do we need one to get current t-shirt locations,
    // one to get preChange (snapback) t-shirt locations?
    generateBBox(preChange = false) {
        const bbox = new BoundingBox("selection");
        if (!preChange) { for (let t of this.set) { bbox.addBoundingBox(t.getBoundingBox());  } }
        else { for (let t of this.set) { bbox.addBoundingBox(t.getPreChangeBoundingBox()); } };
        if( !bbox.hasPoints()) { return null; }
        return bbox;
    }

    /* We need a way to call a set repeatedly and always get the same object back.
     * So we arbitrarily pick the lowest id in the set and return that.
    */
    getMin(set) {
        let min = Number.MAX_SAFE_INTEGER;
        let minT = null;
        set.forEach(t => {
            if (t.getId() < min) {
                min = t.getId();;
                minT = t;
            }
        });
        return minT;
    }
    getMinSelection() { return this.getMin(this.set); }
    getMinClipboard() { return this.getMin(this.clipboard); }

    copySelectionToClipboard() {
        this.clipboard.clear();
        const old2New = new Map();
        const new2Old = new Map();
        for (const t of this.set) {
            const copy = t.copy();
            this.clipboard.add(copy);
            old2New.set(t.getId(), copy);
            new2Old.set(copy.id, t);
        }
        for (const t of this.clipboard) { t.copyNeighborRelationships(old2New, new2Old); }
    }

    copyClipboardForPasting() {
        const pasteCopy = new Set();
        const old2New = new Map();
        const new2Old = new Map();
        for (const t of this.clipboard) {
            let copy = t.copy();
            pasteCopy.add(copy);
            old2New.set(t.getId(), copy);
            new2Old.set(copy.id, t);
            let test = old2New.get(t.getId());
        }
        for (const t of pasteCopy) { t.copyNeighborRelationships(old2New, new2Old); }
        return pasteCopy;
    }
    
    hasTShirt( t) { return this.set.has(t); }

    //
    // t-shirt operations
    //
    addTShirtGroup(tshirts) {
        for (let t of tshirts) { this.select(t, false); }
        return this.generateBBox();
    }
    add(tshirt, returnBBoxes = true) {
        // add in all tshirts in any circular linked list that this tshirt is part of
        // and set selected=true on those shirts.
        let current = tshirt;
        while (current && current.getNext() !== tshirt) {
            this.set.add(current);
            current.selected = true;
            current = current.getNext();
        }
        if (current) {
            this.set.add(current);
            current.selected = true;
        }
        // add to the dirtie's list any t's that are 
        //console.log("added " + tshirt.getId() + " to selection");
        if (returnBBoxes) { return this.generateBBox(); }
        return null;
    }

    removeTShirtGroup(tshirts) {
        for (let t of tshirts) { this.remove(t, false); }
        return this.generateBBox();
    }
    remove(tshirt) {
        // unselect (delete from set) all tshirts in any circular linked list that this tshirt is part of
        // and set selected=false on those shirts.
        let current = tshirt;
        while (current && current.getNext() !== tshirt) {
            this.set.delete(current);
            current.selected = false;
            current = current.getNext();
        }
        if (current) {
            this.set.delete(tshirt); // removes the one we were passed in to start
            current.selected = false;
        }
        return this.generateBBox(); 
    }

    // remove all the selected tshirts from the set
    clear() {
        const r = this.generateBBox();
        //console.log("clearing selection");
        // ensure everything in it also knows it is no longer selected
        for (const t of this.set) {
            t.selected = false;
            //this.dirty(t); // dirty previously selected
        }
        this.set.clear();
        return r;
    }
    
    size() {
        return this.set.size;
    }
    
    // output suitable for pasting in as "shadows" in the Game class
    logInfo() {
        let s = [];
        // { x: 11, y: 3, heading: 300, flip: false, colorName: "red" },
        for (let t of this.set) {
            let flipped = "false";
            let color = t.color;
            let thisS = "{ id: " + t.id + " x: " + t.gridX + ", y: " + t.gridY + ", heading: " + t.heading + ", flip: " + t.flip + ", phantom=" + t.phantom + ", colorName: \"" + color + "\" },\n";
            s.push(thisS); 
            for (let g of t.getAllGroupMembers()) {
                s.push("\t" + g.id + " is in its group");
            }
        }
        console.log("\n");
        for (let i = 0; i < s.length; i++) {
            console.log(s[i]);
        }
        console.log("\n-----\n");
    }
}