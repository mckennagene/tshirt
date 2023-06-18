class Level {
    constructor() {
        this.data = [{
            // probably doesn't matter what these are set to, it's just a splash screen per see controls.play=skip
            number: 0,
            gridSize: { x: 18, y: 8 },
            controls: { tray: "open", play: "skip", badNeighbors: false, surroundColor: false, sideKickColor: false }, // play=skip means show the level dialog but immediately advance to next level
            tools: ["addOne"],
            showHintsDefault: 1,
            buffer: 0
        },
        {   // drag
            number: 1,
            gridSize: { x: 9, y: 12 },
            controls: { tray: "open", badNeighbors: false, surroundColor: false, sideKickColor: false },
            tools: ["addOne"],
            demo: "clickfinger",
            //levelGoal: 'Drag tshirts into the puzzle area shown by the red outlines',
            targets: [
                { x: 4, y: 3, heading: 60, flip: false, colorName: "red" },
                { x: 7, y: 3, heading: 60, flip: false, colorName: "red" },
                { x: 4, y: 5, heading: 60, flip: false, colorName: "red" },
                { x: 6, y: 6, heading: 60, flip: false, colorName: "red" }
            ],
            showHintsDefault: 1,
            complete: "shadows",
            buffer: 0
        },
        {   // rotate
            number: 2,
            gridSize: { x: 10, y: 8 },
            controls: { tray: "open", rotate: "on", badNeighbors: false, surroundColor: false, sideKickColor: false },
            tools: ["addOne"],
            //levelGoal: 'drag tshirts into the puzzle area and rotate to fit in the red outlines',
            targets: [
                { x: 4, y: 3, heading: 0, flip: false, colorName: "red" },
                { x: 6, y: 2, heading: 240, flip: false, colorName: "red" },
                { x: 4, y: 4, heading: 120, flip: false, colorName: "red" },
                { x: 7, y: 4, heading: 180, flip: false, colorName: "red" }
            ],
            showHintsDefault: 1,
            complete: "shadows",
            buffer: 0
        },
        {   // flip
            number: 3,
            gridSize: { x: 10, y: 10 }, 
            controls: { tray: "open", rotate: "on", flip: "on", badNeighbors: false, surroundColor: false, sideKickColor: false },
            tools: ["addOne"],
            //levelGoal: 'drag, rotate and flip tshirts to fit into the red outlines',
            targets: [

                { x: 4, y: 5, heading: 240, flip: false, colorName: "red" },
                { x: 4, y: 6, heading: 240, flip: false, colorName: "red" },
                { x: 5, y: 4, heading: 300, flip: false, colorName: "red" },
                { x: 6, y: 3, heading: 300, flip: false, colorName: "red" },
                { x: 6, y: 5, heading: 120, flip: false, colorName: "red" },
                { x: 3, y: 4, heading: 300, flip: true, colorName: "darkblue" },
                { x: 4, y: 3, heading: 0, flip: true, colorName: "darkblue" },
                { x: 5, y: 3, heading: 0, flip: true, colorName: "darkblue" }
            ],
            showHintsDefault: 1,
            complete: "shadows",
            buffer: 0
        }, {
            // good job
            number: 4,
            gridSize: { x: 10, y: 16 }, 
            controls: { tray: "open", play: "skip", rotate: "on", flip: "on", gear: "on", zoom: "on", badNeighbors: false, surroundColor: false, sideKickColor: false },
            tools: ["addOne"],
        },
        {   // bad pairings
            number: 5,
            gridSize: { x: 18, y: 8 }, 
            controls: { tray: "open", rotate: "on", flip: "on", gear: "on", zoom: "on", badNeighbors: true, surroundColor: false, sideKickColor: false },
            tools: ["addOne", "hint"],
            badNeighbors: 6,
            targets: [
                { x: 4, y: 5, heading: 300, flip: true, colorName: "darkblue" },
                { x: 8, y: 5, heading: 300, flip: true, colorName: "darkblue" },
                { x: 13, y: 5, heading: 60, flip: true, colorName: "darkblue" },
                { x: 13, y: 3, heading: 120, flip: false, colorName: "red" },
                { x: 9, y: 3, heading: 120, flip: false, colorName: "red" },
                { x: 4, y: 4, heading: 240, flip: false, colorName: "red" },
            ],
            //levelGoal: 'Place pairs of tshirts together leaving small gaps between. Form at least 3 different bad pairings.',
            //levelHint: 'Hint: Neck-to-neck, neck-to-armpit, armpit-to-armpit.',
            showHintsDefault: 0,
            showMetaHints: 0,
            complete: "badNeighbors",
            buffer: 1
        },
        {   // congrats
            number: 6,
            gridSize: { x: 24, y: 16 }, 
            controls: { tray: "open", rotate: "on", flip: "on", gear: "on", zoom: "on", play: "skip", badNeighbors: true, surroundColor: false, sideKickColor: false },
            tools: ["addOne", "hint"],
            badNeighbors: 0,
            //levelGoal: '',
            //levelHint: '',
            showHintsDefault: 0
        },
        {
            // 1st challenge level
            number: 7,
            gridSize: { x: 13, y: 10 },
            controls: {
                tray: "open", rotate: "on", flip: "on", gear: "on", zoom: "on",
                badNeighbors: false, surroundColor: false, sideKickColor: false, showKites: true
            },
            tools: ["addOne"],
            complete: "percentTiled",
            buffer: 3
        },
        {   // the cluster
            number: 8,
            gridSize: { x: 10, y: 8 }, 
            controls: { tray: "open", rotate: "on", flip: "on", gear: "on", zoom: "on", badNeighbors: true, surroundColor: true, sideKickColor: false },
            tools: ["addOne", "hint"],
            //surround: 3,
            //levelGoal: 'Flip one tshirt over to the blue side, then surround it as completely as possible with 3 non-flipped (white) tshirts',
            targets: [
                { x: 6, y: 3, heading: 0, flip: false, colorName: "red" },
                { x: 7, y: 3, heading: 120, flip: false, colorName: "red" },
                { x: 5, y: 3, heading: 120, flip: false, colorName: "red" },
                { x: 6, y: 4, heading: 60, flip: true, colorName: "darkblue" },
            ],
            showHintsDefault: 0,
            showMetaHints: 0,
            complete: "surround",
            buffer: 0
        },
        {   // the multi-cluster
            number: 9,
            gridSize: { x: 14, y: 8 }, 
            controls: {
                tray: "open", rotate: "on", flip: "on", gear: "on", zoom: "on", saveLoad: "on",
                badNeighbors: true, surroundColor: true, sideKickColor: true
            },
            tools: ["addOne", "addCluster", "hint"],
            //surround: 9,
            //levelGoal: 'Connect two white (non-flipped) t-shirts side by side like two boys arm-in-arm',
            //guide: "3cluster", // this is a one-off, later guides are different
            showHintsDefault: 2,
            showMetaHints: 1,
            complete: "shadows",
            targets: [
                { x: 6, y: 3, shapeName: "t", shapeLevel: 1, heading: 180 }, // solo
                { x: 8, y: 4, shapeName: "h", shapeLevel: 1, heading: 240 }, // right
                { x: 5, y: 4, shapeName: "h", shapeLevel: 1, heading: 120 }, // left
                { x: 7, y: 2, shapeName: "h", shapeLevel: 1, heading: 120 }, // top
            ],
            buffer: 0
        },
        {   // the buddies
            number: 10,
            gridSize: { x: 10, y: 7 }, 
            controls: {
                tray: "open", rotate: "on", flip: "on", gear: "on", zoom: "on", saveLoad: "on",
                badNeighbors: true, surroundColor: true, sideKickColor: true
            },
            tools: ["addOne", "addCluster", "hint"],
            //surround: 9,
            //levelGoal: 'Connect two white (non-flipped) t-shirts side by side like two boys arm-in-arm',
            targets: [
                { x: 6, y: 4, heading: 0, flip: false, colorName: "red" },
                { x: 5, y: 3, heading: 60, flip: false, colorName: "red" },
            ],
            showHintsDefault: 1,
            showMetaHints: 0,
            complete: "shadows",
            buffer: 0
        },
        {   // branching sidekick lines
            number: 11,
            gridSize: { x: 16, y: 12 },
            controls: {
                tray: "open", rotate: "on", flip: "on", gear: "on", zoom: "on", saveLoad: "on",
                badNeighbors: true, surroundColor: true, sideKickColor: true
            },
            tools: ["addOne", "addCluster", "addSideKick", "hint"],
            //surround: 9,
            //levelGoal: 'Create a branching line using pairs of sidekicks',
            targets: [
                { x: 11, y: 3, heading: 300, flip: false, colorName: "red" },
                { x: 10, y: 4, heading: 240, flip: false, colorName: "red" },
                { x: 10, y: 5, heading: 60, flip: false, colorName: "red" },
                { x: 9, y: 5, heading: 120, flip: false, colorName: "red" },
                { x: 7, y: 6, heading: 240, flip: false, colorName: "red" },
                { x: 6, y: 6, heading: 180, flip: false, colorName: "red" },
                { x: 5, y: 6, heading: 0, flip: false, colorName: "red" },
                { x: 4, y: 6, heading: 60, flip: false, colorName: "red" },
                { x: 9, y: 7, heading: 0, flip: false, colorName: "red" },
                { x: 9, y: 8, heading: 300, flip: false, colorName: "red" },
                { x: 10, y: 9, heading: 120, flip: false, colorName: "red" },
                { x: 10, y: 10, heading: 180, flip: false, colorName: "red" }
            ],
            showHintsDefault: 1,
            showMetaHints: 0,
            complete: "shadows",
            buffer: 1
        },
        {   // fylfot
            number: 12,
            gridSize: { x: 18, y: 12 }, 
            controls: {
                play: "skip", tray: "open", rotate: "on", flip: "on", gear: "on", zoom: "on", saveLoad: "on",
                badNeighbors: true, surroundColor: true, sideKickColor: true
            },
            tools: ["addOne", "addCluster", "addSideKick", "hint"],
            //surround: 9,
            //levelGoal: 'Learn about fylfot',
            showHintsDefault: 1,
            showMetaHints: 0,
            complete: "shadows",
            buffer: 1
        }, {
            // 2nd challenge level 
            number: 13,
            gridSize: { x: 20, y: 16 },
            controls: {
                tray: "open", rotate: "on", flip: "on", gear: "on", zoom: "on", saveLoad: "on",
                badNeighbors: true, surroundColor: true, sideKickColor: true, showKites: true
            },
            tools: ["addOne", "addCluster", "addSideKick"],
            complete: "percentTiled",
            buffer: 6
        },
        {   // Symbolic Language
            number: 14,
            gridSize: { x: 15, y: 10 },
            controls: {
                tray: "open", rotate: "on", flip: "on", gear: "on", zoom: "on", saveLoad: "on",
                badNeighbors: true, surroundColor: true, sideKickColor: true
            },
            tools: ["addOne", "addCluster", "addSideKick", "hint"],
            //surround: 9,
            //levelGoal: 'Create a branching line using pairs of sidekicks',
            targets: [
                { x: 4, y: 4, heading: 0, shapeName: "t", shapeLevel: 1 },
                { x: 10, y: 4, heading: 0, shapeName: "h", shapeLevel: 1 },
                { x: 7, y: 3, heading: 180, shapeName: "f", shapeLevel: 1 },
                { x: 8, y: 6, heading: 180, shapeName: "p", shapeLevel: 1 },
            ],
            showHintsDefault: 2,
            showMetaHints: 1,
            complete: "shadows",
            buffer: 1
        },
        {   // Those Little Arrows
            number: 15,
            gridSize: { x: 15, y: 10 }, 
            controls: {
                tray: "open", rotate: "on", flip: "on", gear: "on", zoom: "on", saveLoad: "on",
                badNeighbors: true, surroundColor: true, sideKickColor: true, play: "skip",
            },
            tools: ["addOne", "addCluster", "addSideKick", "hint"],
            //surround: 9,
            targets: [
                { x: 4, y: 4, heading: 0, shapeName: "t", shapeLevel: 1 },
                { x: 9, y: 6, heading: 0, shapeName: "h", shapeLevel: 1 },
            ],
            showHintsDefault: 2,
            showMetaHints: 1,
            complete: "shadows",
            buffer: 1
        },
        {   // Small Triangle to Large Triangle Scaling
            number: 16,
            gridSize: { x: 15, y: 10 }, 
            controls: {
                tray: "open", rotate: "on", flip: "on", gear: "on", zoom: "on", saveLoad: "on",
                badNeighbors: true, surroundColor: true, sideKickColor: true
            },
            tools: ["addOne", "addCluster", "addSideKick", "hint"],
            //surround: 9,
            //levelGoal: 'Create a branching line using pairs of sidekicks',
            targets: [
                { x: 5, y: 4, heading: 240, shapeName: "t", shapeLevel: 1 }, // 240
                { x: 9, y: 4, heading: 120, shapeName: "h", shapeLevel: 1 }, // 180
            ],
            showHintsDefault: 2,
            showMetaHints: 1,
            complete: "shadows",
            buffer: 1
        },
        {   // Large Triangle => Super Triangle Scaling
            number: 17,
            gridSize: { x: 20, y: 16 },
            controls: {
                tray: "open", rotate: "on", flip: "on", gear: "on", zoom: "on", saveLoad: "on",
                badNeighbors: true, surroundColor: true, sideKickColor: true
            },
            tools: ["addOne", "addCluster", "addSideKick", "hint"],
            //levelGoal: '',
            targets: [
                { x: 10, y: 7, shapeName: "sh", shapeLevel: 2, heading: 0 },
            ],
            showHintsDefault: 2,
            showMetaHints: 1,
            complete: "shadows",
            buffer: 2
        },
        {   // Parallelogram Scaling
            number: 18,
            gridSize: { x: 20, y: 16 }, 
            controls: {
                tray: "open", rotate: "on", flip: "on", gear: "on", zoom: "on", saveLoad: "on",
                badNeighbors: true, surroundColor: true, sideKickColor: true
            },
            tools: ["addOne", "addCluster", "addSideKick", "hint"],
            //surround: 9,
            //levelGoal: 'Create a branching line using pairs of sidekicks',
            targets: [
                // solo p
                { x: 7, y: 4, shapeName: "p", shapeLevel: 1, heading: 0, }, // solo p
                { x: 7, y: 8, shapeName: "sp", shapeLevel: 2, heading: 0 }, // super p
            ],
            showHintsDefault: 2,
            showMetaHints: 1,
            complete: "shadows",
            buffer: 2
        },
        {   // Fylfot Scaling
            number: 19,
            gridSize: { x: 20, y: 16 }, 
            controls: {
                tray: "open", rotate: "on", flip: "on", gear: "on", zoom: "on", saveLoad: "on",
                badNeighbors: true, surroundColor: true, sideKickColor: true
            },
            tools: ["addOne", "addCluster", "addSideKick", "hint"],
            //surround: 9,
            //levelGoal: 'Create a branching line using pairs of sidekicks',
            targets: [
                { x: 7, y: 4, shapeName: "p", shapeLevel: 1, heading: 0 }, // solo f
                { x: 7, y: 8, shapeName: "sf", shapeLevel: 2, heading: 0 }, // super f
            ],
            showHintsDefault: 2,
            showMetaHints: 1,
            complete: "shadows",
            buffer: 2
        },
        {   // Recursive Geometry
            number: 20,
            // 260x260 is big enough for an h5, it will look like extra room, but probaboly the optionals use it
            // 600x600 was big enough for an h6, but h6 is very slow.
            // we will stick with h5 for the final
            gridSize: { x: 260, y: 260 },
            zoom: 0.1, // when drawing at very large size you want the zoom level very low initially
            controls: {
                tray: "open", rotate: "on", flip: "on", gear: "on", zoom: "on", saveLoad: "on",
                badNeighbors: true, surroundColor: true, sideKickColor: true, autoDrawShape: "h", autoDrawLevel: 5
            },
            tools: ["addOne", "addCluster", "addSideKick"],
            showHintsDefault: 2,
            showMetaHints: 1,
            complete: "shadows",
            buffer: 0,
        }
        ]; // end level data
    }
    getData() { return this.data; }
}