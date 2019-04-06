var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var gl;
var editor;
var catalog;
window.onload = function () {
    catalog = new Catalog();
    editor = new Editor();
};
window.onpopstate = function (event) {
    if (event.state) {
        var url = new URL(document.URL);
        if (url.searchParams.has("part")) {
            editor.part = Part.fromString(url.searchParams.get("part"));
            editor.updateMesh(true);
        }
    }
};
var MeshGenerator = /** @class */ (function () {
    function MeshGenerator() {
        this.triangles = [];
    }
    MeshGenerator.prototype.getMesh = function () {
        return new Mesh(this.triangles);
    };
    MeshGenerator.prototype.createQuad = function (v1, v2, v3, v4, flipped) {
        if (flipped === void 0) { flipped = false; }
        if (!flipped) {
            this.triangles.push(new Triangle(v1, v2, v4));
            this.triangles.push(new Triangle(v2, v3, v4));
        }
        else {
            this.triangles.push(new Triangle(v4, v2, v1));
            this.triangles.push(new Triangle(v4, v3, v2));
        }
    };
    MeshGenerator.prototype.createQuadWithNormals = function (v1, v2, v3, v4, n1, n2, n3, n4, flipped) {
        if (flipped === void 0) { flipped = false; }
        if (!flipped) {
            this.triangles.push(new TriangleWithNormals(v1, v2, v4, n1, n2, n4));
            this.triangles.push(new TriangleWithNormals(v2, v3, v4, n2, n3, n4));
        }
        else {
            this.triangles.push(new TriangleWithNormals(v4, v2, v1, n4.times(-1), n2.times(-1), n1.times(-1)));
            this.triangles.push(new TriangleWithNormals(v4, v3, v2, n4.times(-1), n3.times(-1), n2.times(-1)));
        }
    };
    MeshGenerator.prototype.createCircleWithHole = function (block, innerRadius, outerRadius, offset, inverted, square) {
        if (inverted === void 0) { inverted = false; }
        if (square === void 0) { square = false; }
        var center = block.getCylinderOrigin().plus(block.forward().times(offset));
        for (var i = 0; i < SUBDIVISIONS; i++) {
            var i1 = block.getOnCircle(Math.PI / 2 * i / SUBDIVISIONS);
            var i2 = block.getOnCircle(Math.PI / 2 * (i + 1) / SUBDIVISIONS);
            var o1 = i1;
            var o2 = i2;
            if (square) {
                if (Math.abs(o1.dot(block.right())) > Math.abs(o1.dot(block.up()))) {
                    o1 = o1.times(1 / Math.abs(o1.dot(block.right())));
                }
                else {
                    o1 = o1.times(1 / Math.abs(o1.dot(block.up())));
                }
                if (Math.abs(o2.dot(block.right())) > Math.abs(o2.dot(block.up()))) {
                    o2 = o2.times(1 / Math.abs(o2.dot(block.right())));
                }
                else {
                    o2 = o2.times(1 / Math.abs(o2.dot(block.up())));
                }
            }
            this.createQuad(i1.times(innerRadius).plus(center), i2.times(innerRadius).plus(center), o2.times(outerRadius).plus(center), o1.times(outerRadius).plus(center), inverted);
        }
    };
    MeshGenerator.prototype.createCircle = function (block, radius, offset, inverted) {
        if (inverted === void 0) { inverted = false; }
        var center = block.getCylinderOrigin().plus(block.forward().times(offset));
        for (var i = 0; i < SUBDIVISIONS; i++) {
            var p1 = block.getOnCircle(Math.PI / 2 * i / SUBDIVISIONS, radius);
            var p2 = block.getOnCircle(Math.PI / 2 * (i + 1) / SUBDIVISIONS, radius);
            if (inverted) {
                this.triangles.push(new Triangle(center.plus(p1), center, center.plus(p2)));
            }
            else {
                this.triangles.push(new Triangle(center, center.plus(p1), center.plus(p2)));
            }
        }
    };
    MeshGenerator.prototype.createCylinder = function (block, offset, radius, distance, inverted) {
        if (inverted === void 0) { inverted = false; }
        var center = block.getCylinderOrigin().plus(block.forward().times(offset));
        for (var i = 0; i < SUBDIVISIONS; i++) {
            var v1 = block.getOnCircle(Math.PI / 2 * i / SUBDIVISIONS);
            var v2 = block.getOnCircle(Math.PI / 2 * (i + 1) / SUBDIVISIONS);
            this.createQuadWithNormals(center.plus(v1.times(radius)), center.plus(v2.times(radius)), center.plus(v2.times(radius)).plus(block.forward().times(distance)), center.plus(v1.times(radius)).plus(block.forward().times(distance)), v1, v2, v2, v1, !inverted);
        }
    };
    return MeshGenerator;
}());
var PartMeshGenerator = /** @class */ (function (_super) {
    __extends(PartMeshGenerator, _super);
    function PartMeshGenerator(part) {
        var _this = _super.call(this) || this;
        _this.smallBlocks = part.createSmallBlocks();
        _this.createDummyBlocks();
        _this.updateRounded();
        _this.createTinyBlocks();
        _this.processTinyBlocks();
        _this.checkInteriors();
        _this.mergeSimilarBlocks();
        _this.renderTinyBlocks();
        _this.renderAttachments();
        _this.renderTinyBlockFaces();
        return _this;
    }
    PartMeshGenerator.prototype.updateRounded = function () {
        for (var _i = 0, _a = this.smallBlocks.values(); _i < _a.length; _i++) {
            var block = _a[_i];
            block.rounded = block.rounded && this.canBeRounded(block);
            if (block.isAttachment()) {
                block.rounded = true;
            }
        }
    };
    PartMeshGenerator.prototype.createDummyBlocks = function () {
        var _this = this;
        var addedAnything = false;
        for (var _i = 0, _a = this.smallBlocks.values(); _i < _a.length; _i++) {
            var block = _a[_i];
            if (!block.isAttachment()) {
                continue;
            }
            var affectedPositions = [
                block.position,
                block.position.minus(block.horizontal()),
                block.position.minus(block.vertical()),
                block.position.minus(block.horizontal()).minus(block.vertical())
            ];
            for (var forwardDirection = -1; forwardDirection <= 1; forwardDirection += 2) {
                var count = countInArray(affectedPositions, function (p) { return _this.smallBlocks.containsKey(p.plus(block.forward().times(forwardDirection))); });
                if (count != 0 && count != 4) {
                    var source = new Block(block.orientation, BlockType.Solid, true);
                    for (var _b = 0, affectedPositions_1 = affectedPositions; _b < affectedPositions_1.length; _b++) {
                        var position = affectedPositions_1[_b];
                        var targetPosition = position.plus(block.forward().times(forwardDirection));
                        if (!this.smallBlocks.containsKey(targetPosition)) {
                            this.smallBlocks.set(targetPosition, new SmallBlock(this.smallBlocks.get(position).quadrant, targetPosition, source));
                        }
                    }
                    addedAnything = true;
                }
            }
        }
        if (addedAnything) {
            this.createDummyBlocks();
        }
    };
    PartMeshGenerator.prototype.canBeRounded = function (block) {
        var next = this.smallBlocks.getOrNull(block.position.plus(block.forward()));
        if (next != null && next.orientation == block.orientation && next.quadrant != block.quadrant) {
            return false;
        }
        var previous = this.smallBlocks.getOrNull(block.position.minus(block.forward()));
        if (previous != null && previous.orientation == block.orientation && previous.quadrant != block.quadrant) {
            return false;
        }
        var neighbor1 = this.smallBlocks.getOrNull(block.position.plus(block.horizontal()));
        var neighbor2 = this.smallBlocks.getOrNull(block.position.plus(block.vertical()));
        if ((neighbor1 == null || (neighbor1.isAttachment() && neighbor1.forward().dot(block.right()) == 0))
            && (neighbor2 == null || (neighbor2.isAttachment() && neighbor2.forward().dot(block.up()) == 0))) {
            return true;
        }
        return false;
    };
    PartMeshGenerator.prototype.createTinyBlocks = function () {
        this.tinyBlocks = new VectorDictionary();
        for (var _i = 0, _a = this.smallBlocks.values(); _i < _a.length; _i++) {
            var block = _a[_i];
            if (block.isAttachment()) {
                continue;
            }
            var pos = block.position;
            for (var a = -1; a <= 1; a++) {
                for (var b = -1; b <= 1; b++) {
                    for (var c = -1; c <= 1; c++) {
                        if (this.isSmallBlock(pos.plus(new Vector3(a, 0, 0)))
                            && this.isSmallBlock(pos.plus(new Vector3(0, b, 0)))
                            && this.isSmallBlock(pos.plus(new Vector3(0, 0, c)))
                            && this.isSmallBlock(pos.plus(new Vector3(a, b, c)))
                            && this.isSmallBlock(pos.plus(new Vector3(a, b, 0)))
                            && this.isSmallBlock(pos.plus(new Vector3(a, 0, c)))
                            && this.isSmallBlock(pos.plus(new Vector3(0, b, c)))) {
                            this.createTinyBlock(pos.times(3).plus(new Vector3(a, b, c)), block);
                        }
                    }
                }
            }
        }
        for (var _b = 0, _c = this.smallBlocks.values(); _b < _c.length; _b++) {
            var block = _c[_b];
            if (!block.isAttachment()) {
                continue;
            }
            for (var a = -2; a <= 2; a++) {
                var neighbor = block.position.plus(block.forward().times(sign(a)));
                if (!this.smallBlocks.containsKey(neighbor) || (Math.abs(a) >= 2 && this.smallBlocks.get(neighbor).isAttachment())) {
                    continue;
                }
                for (var b = -1; b <= 0; b++) {
                    for (var c = -1; c <= 0; c++) {
                        this.createTinyBlock(block.position.times(3).plus(block.forward().times(a)).plus(block.horizontal().times(b)).plus(block.vertical().times(c)), block);
                    }
                }
            }
        }
    };
    PartMeshGenerator.prototype.isTinyBlock = function (position) {
        return this.tinyBlocks.containsKey(position) && !this.tinyBlocks.get(position).isAttachment();
    };
    PartMeshGenerator.prototype.processTinyBlocks = function () {
        // Disable interiors when adjacent quadrants are missing
        for (var _i = 0, _a = this.tinyBlocks.values(); _i < _a.length; _i++) {
            var block = _a[_i];
            if (block.isCenter()
                && !block.isAttachment()
                && (block.hasInterior || block.rounded)
                && (!this.isTinyBlock(block.position.minus(block.horizontal().times(3))) || !this.isTinyBlock(block.position.minus(block.vertical().times(3))))) {
                for (var a = -1; a <= 1; a++) {
                    for (var b = -1; b <= 1; b++) {
                        var position = block.position.plus(block.right().times(a)).plus(block.up().times(b));
                        if (this.tinyBlocks.containsKey(position)) {
                            this.tinyBlocks.get(position).rounded = false;
                            this.tinyBlocks.get(position).hasInterior = false;
                        }
                    }
                }
            }
        }
        // Offset rounded to non rounded transitions to make them flush
        for (var _b = 0, _c = this.smallBlocks.values(); _b < _c.length; _b++) {
            var smallBlock = _c[_b];
            var forward = smallBlock.forward();
            var right = smallBlock.right();
            var up = smallBlock.up();
            var nextBlock = this.smallBlocks.getOrNull(smallBlock.position.plus(smallBlock.forward()));
            if (smallBlock.rounded && nextBlock != null && !nextBlock.rounded) {
                for (var a = -2; a <= 2; a++) {
                    for (var b = -2; b <= 2; b++) {
                        var from = smallBlock.position.times(3).plus(right.times(a)).plus(up.times(b)).plus(forward);
                        var to = from.plus(forward);
                        if (!this.tinyBlocks.containsKey(to)) {
                            continue;
                        }
                        if (!this.tinyBlocks.containsKey(from)) {
                            this.tinyBlocks.remove(to);
                            continue;
                        }
                        if (smallBlock.orientation == nextBlock.orientation) {
                            if (Math.abs(a) < 2 && Math.abs(b) < 2) {
                                this.tinyBlocks.get(to).rounded = true;
                            }
                        }
                        else {
                            this.createTinyBlock(to, this.tinyBlocks.get(from));
                        }
                    }
                }
            }
            var previousBlock = this.smallBlocks.getOrNull(smallBlock.position.minus(smallBlock.forward()));
            if (smallBlock.rounded && previousBlock != null && !previousBlock.rounded) {
                for (var a = -2; a <= 2; a++) {
                    for (var b = -2; b <= 2; b++) {
                        var from = smallBlock.position.times(3).plus(right.times(a)).plus(up.times(b)).minus(forward);
                        var to = from.minus(forward);
                        if (!this.tinyBlocks.containsKey(to)) {
                            continue;
                        }
                        if (!this.tinyBlocks.containsKey(from)) {
                            this.tinyBlocks.remove(to);
                            continue;
                        }
                        if (smallBlock.orientation == previousBlock.orientation) {
                            if (Math.abs(a) < 2 && Math.abs(b) < 2) {
                                this.tinyBlocks.get(to).rounded = true;
                            }
                        }
                        else {
                            this.createTinyBlock(to, this.tinyBlocks.get(from));
                        }
                    }
                }
            }
        }
    };
    // Sets HasInterior to false for all tiny blocks that do not form coherent blocks with their neighbors
    PartMeshGenerator.prototype.checkInteriors = function () {
        for (var _i = 0, _a = this.tinyBlocks.values(); _i < _a.length; _i++) {
            var block = _a[_i];
            if (!block.isCenter()) {
                continue;
            }
            for (var a = 0; a <= 1; a++) {
                for (var b = 0; b <= 1; b++) {
                    if (a == 0 && b == 0) {
                        continue;
                    }
                    var neighborPos = block.position.minus(block.horizontal().times(2 * a)).minus(block.vertical().times(2 * b));
                    if (!this.tinyBlocks.containsKey(neighborPos)) {
                        block.hasInterior = false;
                    }
                    else {
                        var neighbor = this.tinyBlocks.get(neighborPos);
                        if (block.orientation != neighbor.orientation
                            || !neighbor.hasInterior
                            || block.type != neighbor.type
                            || neighbor.localX() != block.localX() - a * block.directionX()
                            || neighbor.localY() != block.localY() - b * block.directionY()) {
                            block.hasInterior = false;
                        }
                    }
                }
            }
        }
    };
    PartMeshGenerator.prototype.mergeSimilarBlocks = function () {
        for (var _i = 0, _a = this.tinyBlocks.values(); _i < _a.length; _i++) {
            var block = _a[_i];
            if (block.merged) {
                continue;
            }
            var amount = 0;
            while (true) {
                var pos = block.position.plus(block.forward().times(amount + 1));
                if (!this.tinyBlocks.containsKey(pos)) {
                    break;
                }
                var nextBlock = this.tinyBlocks.get(pos);
                if (nextBlock.orientation != block.orientation
                    || nextBlock.quadrant != block.quadrant
                    || nextBlock.type != block.type
                    || nextBlock.hasInterior != block.hasInterior
                    || nextBlock.rounded != block.rounded
                    || this.isTinyBlock(block.position.plus(block.right())) != this.isTinyBlock(nextBlock.position.plus(block.right()))
                    || this.isTinyBlock(block.position.minus(block.right())) != this.isTinyBlock(nextBlock.position.minus(block.right()))
                    || this.isTinyBlock(block.position.plus(block.up())) != this.isTinyBlock(nextBlock.position.plus(block.up()))
                    || this.isTinyBlock(block.position.minus(block.up())) != this.isTinyBlock(nextBlock.position.minus(block.up()))) {
                    break;
                }
                amount += nextBlock.mergedBlocks;
                nextBlock.merged = true;
                if (nextBlock.mergedBlocks != 1) {
                    break;
                }
            }
            block.mergedBlocks += amount;
        }
    };
    PartMeshGenerator.prototype.isSmallBlock = function (position) {
        return this.smallBlocks.containsKey(position) && !this.smallBlocks.get(position).isAttachment();
    };
    PartMeshGenerator.prototype.createTinyBlock = function (position, source) {
        this.tinyBlocks.set(position, new TinyBlock(position, source));
    };
    PartMeshGenerator.prototype.isFaceVisible = function (block, direction) {
        if (this.isTinyBlock(block.position.plus(direction))) {
            return false;
        }
        return block.isFaceVisible(direction);
    };
    PartMeshGenerator.prototype.createTinyFace = function (block, v1, v2, v3, v4, flipped) {
        if (flipped === void 0) { flipped = false; }
        var pos = block.position;
        this.createQuad(tinyBlockToWorld(pos.plus(v1)), tinyBlockToWorld(pos.plus(v2)), tinyBlockToWorld(pos.plus(v3)), tinyBlockToWorld(pos.plus(v4)), flipped);
    };
    PartMeshGenerator.prototype.getNextBlock = function (block) {
        return this.tinyBlocks.getOrNull(block.position.plus(block.forward().times(block.mergedBlocks)));
    };
    PartMeshGenerator.prototype.getPreviousBlock = function (block) {
        return this.tinyBlocks.getOrNull(block.position.minus(block.forward()));
    };
    PartMeshGenerator.prototype.hasOpenEnd = function (block) {
        var pos = block.position;
        return !this.tinyBlocks.containsKey(pos.plus(block.forward().times(block.mergedBlocks)))
            && !this.tinyBlocks.containsKey(pos.plus(block.forward().times(block.mergedBlocks)).minus(block.horizontal().times(3)))
            && !this.tinyBlocks.containsKey(pos.plus(block.forward().times(block.mergedBlocks)).minus(block.vertical().times(3)))
            && !this.tinyBlocks.containsKey(pos.plus(block.forward().times(block.mergedBlocks)).minus(block.horizontal().times(3)).minus(block.vertical().times(3)));
    };
    PartMeshGenerator.prototype.hasOpenStart = function (block) {
        var pos = block.position;
        return !this.tinyBlocks.containsKey(pos.minus(block.forward()))
            && !this.tinyBlocks.containsKey(pos.minus(block.forward()).minus(block.horizontal().times(3)))
            && !this.tinyBlocks.containsKey(pos.minus(block.forward()).minus(block.vertical().times(3)))
            && !this.tinyBlocks.containsKey(pos.minus(block.forward()).minus(block.horizontal().times(3)).minus(block.vertical().times(3)));
    };
    PartMeshGenerator.prototype.hideStartEndFaces = function (position, block, forward) {
        var direction = forward ? block.forward() : block.forward().times(-1);
        this.hideFaceIfExists(position, direction);
        this.hideFaceIfExists(position.minus(block.horizontal()), direction);
        this.hideFaceIfExists(position.minus(block.vertical()), direction);
        this.hideFaceIfExists(position.minus(block.vertical()).minus(block.horizontal()), direction);
    };
    PartMeshGenerator.prototype.hideFaceIfExists = function (position, direction) {
        if (this.tinyBlocks.containsKey(position)) {
            this.tinyBlocks.get(position).hideFace(direction);
        }
    };
    PartMeshGenerator.prototype.hideOutsideFaces = function (centerBlock) {
        var vertical = centerBlock.vertical();
        var horizontal = centerBlock.horizontal();
        centerBlock.hideFace(vertical);
        centerBlock.hideFace(horizontal);
        this.tinyBlocks.get(centerBlock.position.minus(vertical)).hideFace(horizontal);
        this.tinyBlocks.get(centerBlock.position.minus(horizontal)).hideFace(vertical);
    };
    PartMeshGenerator.prototype.renderTinyBlocks = function () {
        for (var _i = 0, _a = this.tinyBlocks.values(); _i < _a.length; _i++) {
            var block = _a[_i];
            if (block.merged || !block.isCenter() || block.isAttachment()) {
                continue;
            }
            var nextBlock = this.getNextBlock(block);
            var previousBlock = this.getPreviousBlock(block);
            var distance = block.getDepth();
            var hasOpenEnd = this.hasOpenEnd(block);
            var hasOpenStart = this.hasOpenStart(block);
            // Back cap
            if (nextBlock == null) {
                this.createCircleWithHole(block, block.hasInterior && hasOpenEnd ? INTERIOR_RADIUS : 0, 0.5 - EDGE_MARGIN, distance, false, !block.rounded);
                this.hideStartEndFaces(block.position.plus(block.forward().times(block.mergedBlocks - 1)), block, true);
            }
            // Front cap
            if (previousBlock == null) {
                this.createCircleWithHole(block, block.hasInterior && hasOpenStart ? INTERIOR_RADIUS : 0, 0.5 - EDGE_MARGIN, 0, true, !block.rounded);
                this.hideStartEndFaces(block.position, block, false);
            }
            if (block.rounded) {
                // Rounded corners
                this.createCylinder(block, 0, 0.5 - EDGE_MARGIN, distance);
                for (var i = 0; i < block.mergedBlocks; i++) {
                    this.hideOutsideFaces(this.tinyBlocks.get(block.position.plus(block.forward().times(i))));
                }
                // Rounded to non rounded adapter
                if (nextBlock != null && !nextBlock.rounded) {
                    this.createCircleWithHole(block, 0.5 - EDGE_MARGIN, 0.5 - EDGE_MARGIN, distance, true, true);
                }
                if (previousBlock != null && !previousBlock.rounded) {
                    this.createCircleWithHole(block, 0.5 - EDGE_MARGIN, 0.5 - EDGE_MARGIN, 0, false, true);
                }
            }
            // Interior
            if (block.hasInterior) {
                if (block.type == BlockType.PinHole) {
                    this.renderPinHoleInterior(block);
                }
                else if (block.type == BlockType.AxleHole) {
                    this.renderAxleHoleInterior(block);
                }
            }
        }
    };
    PartMeshGenerator.prototype.renderAttachments = function () {
        for (var _i = 0, _a = this.tinyBlocks.values(); _i < _a.length; _i++) {
            var block = _a[_i];
            if (block.merged || !block.isCenter()) {
                continue;
            }
            switch (block.type) {
                case BlockType.Pin:
                    this.renderPin(block);
                    break;
                case BlockType.Axle:
                    this.renderAxle(block);
            }
        }
    };
    PartMeshGenerator.prototype.renderLip = function (block, zOffset) {
        var center = block.getCylinderOrigin().plus(block.forward().times(zOffset));
        for (var i = 0; i < SUBDIVISIONS; i++) {
            var out1 = block.getOnCircle(i / 2 * Math.PI / SUBDIVISIONS);
            var out2 = block.getOnCircle((i + 1) / 2 * Math.PI / SUBDIVISIONS);
            for (var j = 0; j < LIP_SUBDIVISIONS; j++) {
                var angleJ = j * Math.PI / LIP_SUBDIVISIONS;
                var angleJ2 = (j + 1) * Math.PI / LIP_SUBDIVISIONS;
                this.createQuadWithNormals(center.plus(out1.times(PIN_RADIUS)).plus(out1.times(Math.sin(angleJ) * PIN_LIP_RADIUS).plus(block.forward().times(Math.cos(angleJ) * PIN_LIP_RADIUS))), center.plus(out2.times(PIN_RADIUS)).plus(out2.times(Math.sin(angleJ) * PIN_LIP_RADIUS).plus(block.forward().times(Math.cos(angleJ) * PIN_LIP_RADIUS))), center.plus(out2.times(PIN_RADIUS)).plus(out2.times(Math.sin(angleJ2) * PIN_LIP_RADIUS).plus(block.forward().times(Math.cos(angleJ2) * PIN_LIP_RADIUS))), center.plus(out1.times(PIN_RADIUS)).plus(out1.times(Math.sin(angleJ2) * PIN_LIP_RADIUS).plus(block.forward().times(Math.cos(angleJ2) * PIN_LIP_RADIUS))), out1.times(-Math.sin(angleJ)).plus(block.forward().times(-Math.cos(angleJ))), out2.times(-Math.sin(angleJ)).plus(block.forward().times(-Math.cos(angleJ))), out2.times(-Math.sin(angleJ2)).plus(block.forward().times(-Math.cos(angleJ2))), out1.times(-Math.sin(angleJ2)).plus(block.forward().times(-Math.cos(angleJ2))));
            }
        }
    };
    PartMeshGenerator.prototype.renderPin = function (block) {
        var nextBlock = this.getNextBlock(block);
        var previousBlock = this.getPreviousBlock(block);
        var distance = block.getDepth();
        var startOffset = (previousBlock != null && previousBlock.type == BlockType.Axle) ? AXLE_PIN_ADAPTER_SIZE : 0;
        if (previousBlock == null) {
            startOffset += 2 * PIN_LIP_RADIUS;
        }
        var endOffset = (nextBlock != null && nextBlock.type == BlockType.Axle) ? AXLE_PIN_ADAPTER_SIZE : 0;
        if (nextBlock == null) {
            endOffset += 2 * PIN_LIP_RADIUS;
        }
        this.createCylinder(block, startOffset, PIN_RADIUS, distance - startOffset - endOffset);
        if (nextBlock == null) {
            this.createCircle(block, PIN_RADIUS, distance, true);
            this.renderLip(block, distance - PIN_LIP_RADIUS);
        }
        if (previousBlock == null) {
            this.createCircle(block, PIN_RADIUS, 0);
            this.renderLip(block, PIN_LIP_RADIUS);
        }
        if (nextBlock != null && !nextBlock.isAttachment()) {
            this.createCircleWithHole(block, PIN_RADIUS, 0.5 - EDGE_MARGIN, distance, true, !nextBlock.rounded);
            this.hideStartEndFaces(nextBlock.position, block, false);
        }
        if (previousBlock != null && !previousBlock.isAttachment()) {
            this.createCircleWithHole(block, PIN_RADIUS, 0.5 - EDGE_MARGIN, 0, false, !previousBlock.rounded);
            this.hideStartEndFaces(previousBlock.position, block, true);
        }
        if (nextBlock != null && nextBlock.type == BlockType.Axle) {
            this.createCircleWithHole(block, PIN_RADIUS, AXLE_PIN_ADAPTER_RADIUS, distance - AXLE_PIN_ADAPTER_SIZE, true);
            this.createCylinder(block, distance - AXLE_PIN_ADAPTER_SIZE, AXLE_PIN_ADAPTER_RADIUS, AXLE_PIN_ADAPTER_SIZE);
        }
        if (previousBlock != null && previousBlock.type == BlockType.Axle) {
            this.createCircleWithHole(block, PIN_RADIUS, AXLE_PIN_ADAPTER_RADIUS, AXLE_PIN_ADAPTER_SIZE);
            this.createCylinder(block, 0, AXLE_PIN_ADAPTER_RADIUS, AXLE_PIN_ADAPTER_SIZE);
        }
    };
    PartMeshGenerator.prototype.renderAxle = function (block) {
        var nextBlock = this.getNextBlock(block);
        var previousBlock = this.getPreviousBlock(block);
        var start = block.getCylinderOrigin();
        var end = start.plus(block.forward().times(block.getDepth()));
        this.createQuad(start.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_INNER)), start.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_OUTER)), end.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_OUTER)), end.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_INNER)), block.odd());
        this.createQuad(start.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_INNER)), start.plus(block.horizontal().times(AXLE_SIZE_OUTER)).plus(block.vertical().times(AXLE_SIZE_INNER)), end.plus(block.horizontal().times(AXLE_SIZE_OUTER)).plus(block.vertical().times(AXLE_SIZE_INNER)), end.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_INNER)), !block.odd());
        this.createQuad(end.plus(block.horizontal().times(AXLE_SIZE_OUTER)), start.plus(block.horizontal().times(AXLE_SIZE_OUTER)), start.plus(block.horizontal().times(AXLE_SIZE_OUTER)).plus(block.vertical().times(AXLE_SIZE_INNER)), end.plus(block.horizontal().times(AXLE_SIZE_OUTER)).plus(block.vertical().times(AXLE_SIZE_INNER)), block.odd());
        this.createQuad(end.plus(block.vertical().times(AXLE_SIZE_OUTER)), start.plus(block.vertical().times(AXLE_SIZE_OUTER)), start.plus(block.vertical().times(AXLE_SIZE_OUTER)).plus(block.horizontal().times(AXLE_SIZE_INNER)), end.plus(block.vertical().times(AXLE_SIZE_OUTER)).plus(block.horizontal().times(AXLE_SIZE_INNER)), !block.odd());
        if (nextBlock == null) {
            this.createQuad(end.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_INNER)), end.plus(block.vertical().times(AXLE_SIZE_INNER)), end, end.plus(block.horizontal().times(AXLE_SIZE_INNER)), block.odd());
            this.createQuad(end.plus(block.horizontal().times(AXLE_SIZE_INNER)), end.plus(block.horizontal().times(AXLE_SIZE_OUTER)), end.plus(block.horizontal().times(AXLE_SIZE_OUTER)).plus(block.vertical().times(AXLE_SIZE_INNER)), end.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_INNER)), block.odd());
            this.createQuad(end.plus(block.vertical().times(AXLE_SIZE_INNER)), end.plus(block.vertical().times(AXLE_SIZE_OUTER)), end.plus(block.vertical().times(AXLE_SIZE_OUTER)).plus(block.horizontal().times(AXLE_SIZE_INNER)), end.plus(block.vertical().times(AXLE_SIZE_INNER)).plus(block.horizontal().times(AXLE_SIZE_INNER)), !block.odd());
        }
        if (previousBlock == null) {
            this.createQuad(start.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_INNER)), start.plus(block.vertical().times(AXLE_SIZE_INNER)), start, start.plus(block.horizontal().times(AXLE_SIZE_INNER)), !block.odd());
            this.createQuad(start.plus(block.horizontal().times(AXLE_SIZE_INNER)), start.plus(block.horizontal().times(AXLE_SIZE_OUTER)), start.plus(block.horizontal().times(AXLE_SIZE_OUTER)).plus(block.vertical().times(AXLE_SIZE_INNER)), start.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_INNER)), !block.odd());
            this.createQuad(start.plus(block.vertical().times(AXLE_SIZE_INNER)), start.plus(block.vertical().times(AXLE_SIZE_OUTER)), start.plus(block.vertical().times(AXLE_SIZE_OUTER)).plus(block.horizontal().times(AXLE_SIZE_INNER)), start.plus(block.vertical().times(AXLE_SIZE_INNER)).plus(block.horizontal().times(AXLE_SIZE_INNER)), block.odd());
        }
        if (nextBlock != null && nextBlock.type != block.type && !nextBlock.rounded) {
            this.createQuad(end.plus(block.horizontal().times((0.5 - EDGE_MARGIN))), end.plus(block.horizontal().times(AXLE_SIZE_OUTER)), end.plus(block.horizontal().times(AXLE_SIZE_OUTER)).plus(block.vertical().times(AXLE_SIZE_INNER)), end.plus(block.horizontal().times((0.5 - EDGE_MARGIN))).plus(block.vertical().times(AXLE_SIZE_INNER)), block.odd());
            this.createQuad(end.plus(block.vertical().times((0.5 - EDGE_MARGIN))), end.plus(block.vertical().times(AXLE_SIZE_OUTER)), end.plus(block.vertical().times(AXLE_SIZE_OUTER)).plus(block.horizontal().times(AXLE_SIZE_INNER)), end.plus(block.vertical().times((0.5 - EDGE_MARGIN))).plus(block.horizontal().times(AXLE_SIZE_INNER)), !block.odd());
            this.createQuad(end.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_INNER)), end.plus(block.horizontal().times((0.5 - EDGE_MARGIN))).plus(block.vertical().times(AXLE_SIZE_INNER)), end.plus(block.horizontal().times((0.5 - EDGE_MARGIN))).plus(block.vertical().times((0.5 - EDGE_MARGIN))), end.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times((0.5 - EDGE_MARGIN))), !block.odd());
        }
        if (previousBlock != null && previousBlock.type != block.type && !previousBlock.rounded) {
            this.createQuad(start.plus(block.horizontal().times((0.5 - EDGE_MARGIN))), start.plus(block.horizontal().times(AXLE_SIZE_OUTER)), start.plus(block.horizontal().times(AXLE_SIZE_OUTER)).plus(block.vertical().times(AXLE_SIZE_INNER)), start.plus(block.horizontal().times((0.5 - EDGE_MARGIN))).plus(block.vertical().times(AXLE_SIZE_INNER)), !block.odd());
            this.createQuad(start.plus(block.vertical().times((0.5 - EDGE_MARGIN))), start.plus(block.vertical().times(AXLE_SIZE_OUTER)), start.plus(block.vertical().times(AXLE_SIZE_OUTER)).plus(block.horizontal().times(AXLE_SIZE_INNER)), start.plus(block.vertical().times((0.5 - EDGE_MARGIN))).plus(block.horizontal().times(AXLE_SIZE_INNER)), block.odd());
            this.createQuad(start.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_INNER)), start.plus(block.horizontal().times((0.5 - EDGE_MARGIN))).plus(block.vertical().times(AXLE_SIZE_INNER)), start.plus(block.horizontal().times((0.5 - EDGE_MARGIN))).plus(block.vertical().times((0.5 - EDGE_MARGIN))), start.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times((0.5 - EDGE_MARGIN))), block.odd());
        }
        if (nextBlock != null && nextBlock.type != block.type && nextBlock.rounded) {
            this.createAxleToCircleAdapter(end, block, nextBlock.type == BlockType.Pin ? AXLE_PIN_ADAPTER_RADIUS : 0.5 - EDGE_MARGIN);
        }
        if (previousBlock != null && previousBlock.type != block.type && previousBlock.rounded) {
            this.createAxleToCircleAdapter(start, block, previousBlock.type == BlockType.Pin ? AXLE_PIN_ADAPTER_RADIUS : 0.5 - EDGE_MARGIN, true);
        }
        if (nextBlock != null && !nextBlock.isAttachment()) {
            this.hideStartEndFaces(nextBlock.position, block, false);
        }
        if (previousBlock != null && !previousBlock.isAttachment()) {
            this.hideStartEndFaces(previousBlock.position, block, true);
        }
    };
    PartMeshGenerator.prototype.createAxleToCircleAdapter = function (center, block, radius, flipped) {
        if (flipped === void 0) { flipped = false; }
        for (var i = 0; i < SUBDIVISIONS; i++) {
            var focus = center.copy();
            if (i < SUBDIVISIONS / 2 == !block.odd()) {
                focus = focus.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_OUTER));
            }
            else {
                focus = focus.plus(block.horizontal().times(AXLE_SIZE_OUTER)).plus(block.vertical().times(AXLE_SIZE_INNER));
            }
            this.triangles.push(new Triangle(focus, center.plus(block.getOnCircle(Math.PI / 2 * i / SUBDIVISIONS, radius)), center.plus(block.getOnCircle(Math.PI / 2 * (i + 1) / SUBDIVISIONS, radius)), flipped));
        }
        this.triangles.push(new Triangle(center.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_OUTER)), center.plus(block.vertical().times(AXLE_SIZE_OUTER)), center.plus(block.vertical().times(radius)), block.odd() != flipped));
        this.triangles.push(new Triangle(center.plus(block.vertical().times(AXLE_SIZE_INNER)).plus(block.horizontal().times(AXLE_SIZE_OUTER)), center.plus(block.horizontal().times(AXLE_SIZE_OUTER)), center.plus(block.horizontal().times(radius)), block.odd() == flipped));
        this.createQuad(center.plus(block.vertical().times(AXLE_SIZE_INNER)).plus(block.horizontal().times(AXLE_SIZE_INNER)), center.plus(block.vertical().times(AXLE_SIZE_OUTER)).plus(block.horizontal().times(AXLE_SIZE_INNER)), center.plus(block.getOnCircle(45 * DEG_TO_RAD, radius)), center.plus(block.vertical().times(AXLE_SIZE_INNER)).plus(block.horizontal().times(AXLE_SIZE_OUTER)), block.odd() != flipped);
    };
    PartMeshGenerator.prototype.showInteriorCap = function (currentBlock, neighbor) {
        if (neighbor == null) {
            return false;
        }
        if (neighbor.orientation != currentBlock.orientation
            || neighbor.quadrant != currentBlock.quadrant
            || !neighbor.hasInterior) {
            return true;
        }
        if (currentBlock.type == BlockType.AxleHole && neighbor.type == BlockType.PinHole
            || neighbor.type == BlockType.AxleHole && currentBlock.type == BlockType.PinHole) {
            // Pin hole to axle hole adapter
            return false;
        }
        return currentBlock.type != neighbor.type;
    };
    PartMeshGenerator.prototype.renderPinHoleInterior = function (block) {
        var nextBlock = this.getNextBlock(block);
        var previousBlock = this.getPreviousBlock(block);
        var distance = block.getDepth();
        var hasOpenEnd = this.hasOpenEnd(block);
        var hasOpenStart = this.hasOpenStart(block);
        var showInteriorEndCap = this.showInteriorCap(block, nextBlock) || (nextBlock == null && !hasOpenEnd);
        var showInteriorStartCap = this.showInteriorCap(block, previousBlock) || (previousBlock == null && !hasOpenStart);
        var offsetStart = (hasOpenStart || showInteriorStartCap ? PIN_HOLE_OFFSET : 0) + (showInteriorStartCap ? INTERIOR_END_MARGIN : 0);
        var offsetEnd = (hasOpenEnd || showInteriorEndCap ? PIN_HOLE_OFFSET : 0) + (showInteriorEndCap ? INTERIOR_END_MARGIN : 0);
        this.createCylinder(block, offsetStart, PIN_HOLE_RADIUS, distance - offsetStart - offsetEnd, true);
        if (hasOpenStart || showInteriorStartCap) {
            this.createCylinder(block, showInteriorStartCap ? INTERIOR_END_MARGIN : 0, INTERIOR_RADIUS, PIN_HOLE_OFFSET, true);
            this.createCircleWithHole(block, PIN_HOLE_RADIUS, INTERIOR_RADIUS, PIN_HOLE_OFFSET + (showInteriorStartCap ? INTERIOR_END_MARGIN : 0), true);
        }
        if (hasOpenEnd || showInteriorEndCap) {
            this.createCylinder(block, distance - PIN_HOLE_OFFSET - (showInteriorEndCap ? INTERIOR_END_MARGIN : 0), INTERIOR_RADIUS, PIN_HOLE_OFFSET, true);
            this.createCircleWithHole(block, PIN_HOLE_RADIUS, INTERIOR_RADIUS, distance - PIN_HOLE_OFFSET - (showInteriorEndCap ? INTERIOR_END_MARGIN : 0), false);
        }
        if (showInteriorEndCap) {
            this.createCircle(block, INTERIOR_RADIUS, distance - INTERIOR_END_MARGIN, false);
        }
        if (showInteriorStartCap) {
            this.createCircle(block, INTERIOR_RADIUS, INTERIOR_END_MARGIN, true);
        }
    };
    PartMeshGenerator.prototype.renderAxleHoleInterior = function (block) {
        var nextBlock = this.getNextBlock(block);
        var previousBlock = this.getPreviousBlock(block);
        var hasOpenEnd = this.hasOpenEnd(block);
        var hasOpenStart = this.hasOpenStart(block);
        var showInteriorEndCap = this.showInteriorCap(block, nextBlock) || (nextBlock == null && !hasOpenEnd);
        var showInteriorStartCap = this.showInteriorCap(block, previousBlock) || (previousBlock == null && !hasOpenStart);
        var distance = block.getDepth();
        var start = block.getCylinderOrigin().plus(showInteriorStartCap ? block.forward().times(INTERIOR_END_MARGIN) : Vector3.zero());
        var end = start.plus(block.forward().times(distance - (showInteriorStartCap ? INTERIOR_END_MARGIN : 0) - (showInteriorEndCap ? INTERIOR_END_MARGIN : 0)));
        var axleWingAngle = Math.asin(AXLE_HOLE_SIZE / PIN_HOLE_RADIUS);
        var axleWingAngle2 = 90 * DEG_TO_RAD - axleWingAngle;
        var subdivAngle = 90 / SUBDIVISIONS * DEG_TO_RAD;
        var adjustedRadius = PIN_HOLE_RADIUS * Math.cos(subdivAngle / 2) / Math.cos(subdivAngle / 2 - (axleWingAngle - Math.floor(axleWingAngle / subdivAngle) * subdivAngle));
        this.createQuad(start.plus(block.horizontal().times(AXLE_HOLE_SIZE)).plus(block.vertical().times(AXLE_HOLE_SIZE)), start.plus(block.getOnCircle(axleWingAngle, adjustedRadius)), end.plus(block.getOnCircle(axleWingAngle, adjustedRadius)), end.plus(block.horizontal().times(AXLE_HOLE_SIZE)).plus(block.vertical().times(AXLE_HOLE_SIZE)), true);
        this.createQuad(start.plus(block.horizontal().times(AXLE_HOLE_SIZE)).plus(block.vertical().times(AXLE_HOLE_SIZE)), start.plus(block.getOnCircle(axleWingAngle2, adjustedRadius)), end.plus(block.getOnCircle(axleWingAngle2, adjustedRadius)), end.plus(block.horizontal().times(AXLE_HOLE_SIZE)).plus(block.vertical().times(AXLE_HOLE_SIZE)), false);
        for (var i = 0; i < SUBDIVISIONS; i++) {
            var angle1 = lerp(0, 90, i / SUBDIVISIONS) * DEG_TO_RAD;
            var angle2 = lerp(0, 90, (i + 1) / SUBDIVISIONS) * DEG_TO_RAD;
            var startAngleInside = angle1;
            var endAngleInside = angle2;
            var startAngleOutside = angle1;
            var endAngleOutside = angle2;
            var radius1Inside = PIN_HOLE_RADIUS;
            var radius2Inside = PIN_HOLE_RADIUS;
            var radius1Outside = PIN_HOLE_RADIUS;
            var radius2Outside = PIN_HOLE_RADIUS;
            if (angle1 < axleWingAngle && angle2 > axleWingAngle) {
                endAngleInside = axleWingAngle;
                startAngleOutside = axleWingAngle;
                radius1Outside = adjustedRadius;
                radius2Inside = adjustedRadius;
            }
            if (angle1 < axleWingAngle2 && angle2 > axleWingAngle2) {
                startAngleInside = axleWingAngle2;
                endAngleOutside = axleWingAngle2;
                radius2Outside = adjustedRadius;
                radius1Inside = adjustedRadius;
            }
            // Walls
            if (angle1 < axleWingAngle || angle2 > axleWingAngle2) {
                var v1 = block.getOnCircle(startAngleInside);
                var v2 = block.getOnCircle(endAngleInside);
                this.createQuadWithNormals(start.plus(v1.times(radius1Inside)), start.plus(v2.times(radius2Inside)), end.plus(v2.times(radius2Inside)), end.plus(v1.times(radius1Inside)), v1, v2, v2, v1, false);
            }
            // Outside caps
            if (hasOpenStart || (previousBlock != null && previousBlock.type == BlockType.PinHole && !showInteriorStartCap)) {
                if (angle2 > axleWingAngle && angle1 < axleWingAngle2) {
                    this.triangles.push(new Triangle(start.plus(block.horizontal().times(AXLE_HOLE_SIZE)).plus(block.vertical().times(AXLE_HOLE_SIZE)), start.plus(block.getOnCircle(startAngleOutside, radius1Outside)), start.plus(block.getOnCircle(endAngleOutside, radius2Outside))));
                }
            }
            if (hasOpenEnd || (nextBlock != null && nextBlock.type == BlockType.PinHole && !showInteriorEndCap)) {
                if (angle2 > axleWingAngle && angle1 < axleWingAngle2) {
                    this.triangles.push(new Triangle(end.plus(block.horizontal().times(AXLE_HOLE_SIZE)).plus(block.vertical().times(AXLE_HOLE_SIZE)), end.plus(block.getOnCircle(endAngleOutside, radius2Outside)), end.plus(block.getOnCircle(startAngleOutside, radius1Outside))));
                }
            }
            // Inside caps
            if (showInteriorEndCap && (angle1 < axleWingAngle || angle2 > axleWingAngle2)) {
                this.triangles.push(new Triangle(end, end.plus(block.getOnCircle(startAngleInside, radius1Outside)), end.plus(block.getOnCircle(endAngleInside, radius2Outside))));
            }
            if (showInteriorStartCap && (angle1 < axleWingAngle || angle2 > axleWingAngle2)) {
                this.triangles.push(new Triangle(start, start.plus(block.getOnCircle(endAngleInside, radius2Outside)), start.plus(block.getOnCircle(startAngleInside, radius1Outside))));
            }
        }
        if (hasOpenEnd) {
            this.createCircleWithHole(block, PIN_HOLE_RADIUS, INTERIOR_RADIUS, distance, false);
        }
        if (hasOpenStart) {
            this.createCircleWithHole(block, PIN_HOLE_RADIUS, INTERIOR_RADIUS, 0, true);
        }
        if (showInteriorEndCap) {
            this.triangles.push(new Triangle(end.plus(block.horizontal().times(AXLE_HOLE_SIZE)).plus(block.vertical().times(AXLE_HOLE_SIZE)), end, end.plus(block.getOnCircle(axleWingAngle, adjustedRadius))));
            this.triangles.push(new Triangle(end, end.plus(block.horizontal().times(AXLE_HOLE_SIZE)).plus(block.vertical().times(AXLE_HOLE_SIZE)), end.plus(block.getOnCircle(axleWingAngle2, adjustedRadius))));
        }
        if (showInteriorStartCap) {
            this.triangles.push(new Triangle(start, start.plus(block.horizontal().times(AXLE_HOLE_SIZE)).plus(block.vertical().times(AXLE_HOLE_SIZE)), start.plus(block.getOnCircle(axleWingAngle, adjustedRadius))));
            this.triangles.push(new Triangle(start.plus(block.horizontal().times(AXLE_HOLE_SIZE)).plus(block.vertical().times(AXLE_HOLE_SIZE)), start, start.plus(block.getOnCircle(axleWingAngle2, adjustedRadius))));
        }
    };
    PartMeshGenerator.prototype.renderTinyBlockFaces = function () {
        for (var _i = 0, _a = this.tinyBlocks.values(); _i < _a.length; _i++) {
            var block = _a[_i];
            if (block.isAttachment()) {
                continue;
            }
            if (this.isFaceVisible(block, new Vector3(1, 0, 0))) {
                this.createTinyFace(block, new Vector3(1, 0, 0), new Vector3(1, 0, 1), new Vector3(1, 1, 1), new Vector3(1, 1, 0), true);
            }
            if (this.isFaceVisible(block, new Vector3(-1, 0, 0))) {
                this.createTinyFace(block, new Vector3(0, 0, 0), new Vector3(0, 0, 1), new Vector3(0, 1, 1), new Vector3(0, 1, 0));
            }
            if (this.isFaceVisible(block, new Vector3(0, 1, 0))) {
                this.createTinyFace(block, new Vector3(0, 1, 0), new Vector3(0, 1, 1), new Vector3(1, 1, 1), new Vector3(1, 1, 0));
            }
            if (this.isFaceVisible(block, new Vector3(0, -1, 0))) {
                this.createTinyFace(block, new Vector3(0, 0, 0), new Vector3(0, 0, 1), new Vector3(1, 0, 1), new Vector3(1, 0, 0), true);
            }
            if (this.isFaceVisible(block, new Vector3(0, 0, 1))) {
                this.createTinyFace(block, new Vector3(0, 0, 1), new Vector3(0, 1, 1), new Vector3(1, 1, 1), new Vector3(1, 0, 1), true);
            }
            if (this.isFaceVisible(block, new Vector3(0, 0, -1))) {
                this.createTinyFace(block, new Vector3(0, 0, 0), new Vector3(0, 1, 0), new Vector3(1, 1, 0), new Vector3(1, 0, 0));
            }
        }
    };
    return PartMeshGenerator;
}(MeshGenerator));
function triangularNumber(n) {
    return n * (n + 1) / 2;
}
function inverseTriangularNumber(s) {
    return Math.floor((Math.floor(Math.sqrt(8 * s + 1)) - 1) / 2);
}
function tetrahedralNumber(n) {
    return n * (n + 1) * (n + 2) / 6;
}
function inverseTetrahedralNumber(s) {
    if (s == 0) {
        return 0;
    }
    var f = Math.pow(1.73205080757 * Math.sqrt(243 * Math.pow(s, 2) - 1) + 27 * s, 1 / 3);
    return Math.floor(f / 2.08008382305 + 0.69336127435 / f - 1);
}
function tinyIndexToWorld(p) {
    var i = Math.floor((p + 1) / 3);
    var j = p - i * 3;
    var f = 0.5 * i;
    if (j == 0) {
        f += EDGE_MARGIN;
    }
    else if (j == 1) {
        f += 0.5 - EDGE_MARGIN;
    }
    return f;
}
function tinyBlockToWorld(position) {
    return new Vector3(tinyIndexToWorld(position.x), tinyIndexToWorld(position.y), tinyIndexToWorld(position.z));
}
var DEG_TO_RAD = Math.PI / 180;
function min(array, selector) {
    var initialized = false;
    var minValue;
    for (var _i = 0, array_1 = array; _i < array_1.length; _i++) {
        var item = array_1[_i];
        var currentValue = selector(item);
        if (!initialized || currentValue < minValue) {
            initialized = true;
            minValue = currentValue;
        }
    }
    return minValue;
}
function sign(a) {
    if (a == 0) {
        return 0;
    }
    else if (a < 0) {
        return -1;
    }
    else {
        return 1;
    }
}
function lerp(a, b, t) {
    return a + t * (b - a);
}
function clamp(lower, upper, value) {
    if (value > upper) {
        return upper;
    }
    else if (value < lower) {
        return lower;
    }
    else {
        return value;
    }
}
function countInArray(items, selector) {
    var result = 0;
    for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
        var item = items_1[_i];
        if (selector(item)) {
            result++;
        }
    }
    return result;
}
function ease(value) {
    return value < 0.5 ? 2 * value * value : -1 + (4 - 2 * value) * value;
}
var TECHNIC_UNIT = 8;
var EDGE_MARGIN = 0.2 / TECHNIC_UNIT;
var INTERIOR_RADIUS = 6.4 * 0.5 / TECHNIC_UNIT;
var PIN_HOLE_RADIUS = 5.2 * 0.5 / TECHNIC_UNIT;
var PIN_HOLE_OFFSET = 0.7 / TECHNIC_UNIT;
var AXLE_HOLE_SIZE = 2.02 * 0.5 / TECHNIC_UNIT;
var PIN_RADIUS = 4.63 * 0.5 / TECHNIC_UNIT;
var PIN_LIP_RADIUS = 0.17 / TECHNIC_UNIT;
var AXLE_SIZE_INNER = 1.72 * 0.5 / TECHNIC_UNIT;
var AXLE_SIZE_OUTER = 4.3 * 0.5 / TECHNIC_UNIT;
var AXLE_PIN_ADAPTER_SIZE = 0.8 / TECHNIC_UNIT;
var AXLE_PIN_ADAPTER_RADIUS = 6 * 0.5 / TECHNIC_UNIT;
var INTERIOR_END_MARGIN = 0.2 / TECHNIC_UNIT;
var LIP_SUBDIVISIONS = 6;
var SUBDIVISIONS = 8;
var Catalog = /** @class */ (function () {
    function Catalog() {
        var _this = this;
        this.initialized = false;
        this.container = document.getElementById("catalog");
        this.createCatalogItems();
        document.getElementById("catalog").addEventListener("toggle", function (event) { return _this.onToggleCatalog(event); });
    }
    Catalog.prototype.onToggleCatalog = function (event) {
        if (event.srcElement.open && !this.initialized) {
            this.createCatalogUI();
        }
    };
    Catalog.prototype.createCatalogUI = function () {
        var _this = this;
        var oldRenderingContext = gl;
        var canvas = document.createElement("canvas");
        canvas.style.height = "64px";
        canvas.style.width = "64px";
        this.container.appendChild(canvas);
        var camera = new Camera(canvas, 2);
        camera.clearColor = new Vector3(0.859, 0.859, 0.859);
        var partRenderer = new MeshRenderer();
        partRenderer.color = new Vector3(0.67, 0.7, 0.71);
        var partNormalDepthRenderer = new NormalDepthRenderer();
        camera.renderers.push(partRenderer);
        camera.renderers.push(partNormalDepthRenderer);
        camera.renderers.push(new ContourPostEffect());
        var _loop_1 = function () {
            catalogLink = document.createElement("a");
            catalogLink.className = "catalogItem";
            catalogLink.href = "?part=" + item.string;
            catalogLink.title = item.name;
            this_1.container.appendChild(catalogLink);
            itemCanvas = document.createElement("canvas");
            catalogLink.appendChild(itemCanvas);
            itemCanvas.style.height = "64px";
            itemCanvas.style.width = "64px";
            mesh = new PartMeshGenerator(item.part).getMesh();
            partRenderer.setMesh(mesh);
            partNormalDepthRenderer.setMesh(mesh);
            camera.size = (item.part.getSize() + 2) * 0.41;
            camera.transform = Matrix4.getTranslation(item.part.getCenter().times(-0.5))
                .times(Matrix4.getRotation(new Vector3(0, 45, -30))
                .times(Matrix4.getTranslation(new Vector3(-0.1, 0, 0))));
            camera.render();
            context = itemCanvas.getContext("2d");
            context.canvas.width = gl.canvas.width;
            context.canvas.height = gl.canvas.height;
            context.drawImage(canvas, 0, 0);
            var itemCopy = item;
            catalogLink.addEventListener("click", function (event) { return _this.onSelectPart(itemCopy, event); });
        };
        var this_1 = this, catalogLink, itemCanvas, mesh, context;
        for (var _i = 0, _a = this.items; _i < _a.length; _i++) {
            var item = _a[_i];
            _loop_1();
        }
        gl = oldRenderingContext;
        this.initialized = true;
        this.container.removeChild(canvas);
    };
    Catalog.prototype.createCatalogItems = function () {
        this.items = [
            new CatalogItem(43093, "Axle to Pin Connector", "0z32z37z410z4"),
            new CatalogItem(3704, "Axle 2", "0z42z47z410z4"),
            new CatalogItem(4519, "Axle 3", "7z410z41ez432z40z42z4"),
            new CatalogItem(6553, "Axle 1.5 with Perpendicular Axle Connector", "1ex210z07z42z40z433x2"),
            new CatalogItem(18651, "Axle 2m with Pin", "1ez432z47z410z40z32z3"),
            new CatalogItem(40147, "Beam 1 x 2 with Axle Hole and Pin Hole", "7y10y2dy11y2"),
            new CatalogItem(43857, "Beam 2", "0y17y11y1dy1"),
            new CatalogItem(17141, "Beam 3", "0y17y11ey11y1dy12dy1"),
            new CatalogItem(6632, "Beam 3 x 0.5 with Axle Hole each end", "7y11ey20y2"),
            new CatalogItem(41677, "Beam 2 x 0.5 with Axle Holes", "0y27y2"),
            new CatalogItem(32140, "Beam 2 x 4 Bent 90 Degrees, 2 and 4 holes", "20y14fy19ey29y12fy16by1cby2fy10y11y1"),
            new CatalogItem(32449, "Beam 4 x 0.5 with Axle Hole each end", "7y11ey14dy20y2"),
            new CatalogItem(2825, "Beam 1 x 4 x 0.5 with Boss", "7y11ey14dy20y21y2"),
            new CatalogItem(33299, "Half Beam 3 with Knob and Pin", "2dy342y04y217y2ay21ey3"),
            new CatalogItem(60484, "Beam 3 x 3 T-Shaped", "17x13bx11ex17x10x12ax15bx133x111x13x1"),
            new CatalogItem(6538, "Angle Connector", "7z210z20y11y1"),
            new CatalogItem(59443, "Axle Connector", "0z22z27z210z2"),
            new CatalogItem(15555, "Pin Joiner", "0z12z17z110z1"),
            new CatalogItem(36536, "Cross Block ", "9y2fy20z12z1"),
            new CatalogItem(32034, "Angle Connector #2", "0z22z27y11ez232z2dy1"),
            new CatalogItem(32039, "Through Axle Connector with Bushing", "0y21y29x213x2"),
            new CatalogItem(42003, "Cross Block 1 x 3", "0z22z29y1fy122y131y1"),
            new CatalogItem(32184, "Cross Block 1 x 3 with Two Axle holes", "0z22z29y1fy122z236z2"),
            new CatalogItem(41678, "Cross Block 2 x 2 Split", "4z1bz10x219z12bz113x2"),
            new CatalogItem(32014, "Angle Connector #6", "9y120z234z2fy10x23x2"),
            new CatalogItem(32126, "Toggle Joint Connector", "7z210z20x1"),
            new CatalogItem(32291, "Cross Block With Two Pinholes", "0z12z1cx29z112z119x2"),
            new CatalogItem(44809, "Cross Block Bent 90 Degrees with Three Pinholes", "17z129z17x10y11y111x1"),
            new CatalogItem(55615, "Cross Block beam Bent 90 Degrees with 4 Pins", "17y142x18dz3c1z34x126y182z1b4z1e6x1181z31e3z31ey30y32dy31y364x1cx112ex1"),
            new CatalogItem(48989, "Cross Block Beam 3 with Four Pins", "0y31ey31y32dy34x117y142x126y114y382y323y3afy3cx164x1"),
            new CatalogItem(63869, "Cross Block 3 x 2", "1ex17x10x117z229z233x111x13x1"),
            new CatalogItem(92907, "Cross Block 2 x 2 x 2 Bent 90 Split", "2az143z166x035x213x217x07x20x2"),
            new CatalogItem(32557, "Cross Block 2 x 3 with Four Pinholes", "9z112z119x13dx10z12z1cx125x1"),
            new CatalogItem(10197, "Beam 1m with 2 Axles 90°", "7x10z42z417y426y411x1"),
            new CatalogItem(22961, "Beam 1 with Axle", "0z42z47x111x1"),
            new CatalogItem(98989, "Cross Block 2 x 4", "7x10x117z1bz13bz124z17bz255z211x13x1"),
            new CatalogItem(27940, "Beam 1 Hole with 2 Axles 180", "7x11ez432z40z42z411x1"),
            new CatalogItem(11272, "Cross Block 2 x 3", "7x211x233x23x220x24fx29x235x2"),
            new CatalogItem(16615, "Beam 7", "0y11y19y1fy122y131y153y16fy1a4y1d1y111dy115fy11c6y1221y1")
        ];
    };
    Catalog.prototype.onSelectPart = function (item, event) {
        editor.part = Part.fromString(item.string);
        editor.updateMesh(true);
        window.history.pushState({}, document.title, "?part=" + item.string);
        event.preventDefault();
    };
    return Catalog;
}());
var CatalogItem = /** @class */ (function () {
    function CatalogItem(id, name, string) {
        this.part = null;
        this.id = id;
        this.name = name;
        this.string = string;
        this.part = Part.fromString(string);
    }
    return CatalogItem;
}());
var MouseMode;
(function (MouseMode) {
    MouseMode[MouseMode["None"] = 0] = "None";
    MouseMode[MouseMode["Left"] = 1] = "Left";
    MouseMode[MouseMode["Middle"] = 2] = "Middle";
    MouseMode[MouseMode["Right"] = 3] = "Right";
})(MouseMode || (MouseMode = {}));
var Editor = /** @class */ (function () {
    function Editor() {
        var _this = this;
        this.translation = new Vector3(0, 0, 0);
        this.rotationX = 45;
        this.rotationY = -20;
        this.zoom = 5;
        this.zoomStep = 0.9;
        this.mouseMode = MouseMode.None;
        this.style = RenderStyle.Contour;
        var url = new URL(document.URL);
        if (url.searchParams.has("part")) {
            this.part = Part.fromString(url.searchParams.get("part"));
        }
        else {
            this.part = Part.fromString(catalog.items[Math.floor(Math.random() * catalog.items.length)].string);
        }
        this.editorState = new Block(Orientation.X, BlockType.PinHole, true);
        this.createFullSizedBlocks = true;
        this.canvas = document.getElementById('canvas');
        this.camera = new Camera(this.canvas);
        this.partRenderer = new MeshRenderer();
        this.partRenderer.color = new Vector3(0.67, 0.7, 0.71);
        this.camera.renderers.push(this.partRenderer);
        this.wireframeRenderer = new WireframeRenderer();
        this.wireframeRenderer.enabled = false;
        this.camera.renderers.push(this.wireframeRenderer);
        this.partNormalDepthRenderer = new NormalDepthRenderer();
        this.camera.renderers.push(this.partNormalDepthRenderer);
        this.contourEffect = new ContourPostEffect();
        this.camera.renderers.push(this.contourEffect);
        this.handles = new Handles(this.camera);
        this.camera.renderers.push(this.handles);
        this.center = Vector3.zero();
        this.updateMesh(true);
        this.camera.size = this.zoom;
        this.camera.render();
        this.canvas.addEventListener("mousedown", function (event) { return _this.onMouseDown(event); });
        this.canvas.addEventListener("mouseup", function (event) { return _this.onMouseUp(event); });
        this.canvas.addEventListener("mousemove", function (event) { return _this.onMouseMove(event); });
        this.canvas.addEventListener("contextmenu", function (event) { return event.preventDefault(); });
        this.canvas.addEventListener("wheel", function (event) { return _this.onScroll(event); });
        document.getElementById("clear").addEventListener("click", function (event) { return _this.clear(); });
        document.getElementById("randomize").addEventListener("click", function (event) { return _this.randomize(); });
        document.getElementById("share").addEventListener("click", function (event) { return _this.share(); });
        document.getElementById("save").addEventListener("click", function (event) { return new PartMeshGenerator(_this.part).getMesh().saveSTLFile(); });
        document.getElementById("remove").addEventListener("click", function (event) { return _this.remove(); });
        document.getElementById("style").addEventListener("change", function (event) { return _this.setRenderStyle(parseInt(event.srcElement.value)); });
        window.addEventListener("resize", function (e) { return _this.camera.onResize(); });
        this.initializeEditor("type", function (typeName) { return _this.setType(typeName); });
        this.initializeEditor("orientation", function (orientationName) { return _this.setOrientation(orientationName); });
        this.initializeEditor("size", function (sizeName) { return _this.setSize(sizeName); });
        this.initializeEditor("rounded", function (roundedName) { return _this.setRounded(roundedName); });
        document.getElementById("blockeditor").addEventListener("toggle", function (event) { return _this.onNodeEditorClick(event); });
    }
    Editor.prototype.onNodeEditorClick = function (event) {
        this.handles.visible = event.srcElement.open;
        this.camera.render();
    };
    Editor.prototype.initializeEditor = function (elementId, onchange) {
        var element = document.getElementById(elementId);
        for (var i = 0; i < element.children.length; i++) {
            var child = element.children[i];
            if (child.tagName.toLowerCase() == "label") {
                child.addEventListener("click", function (event) { return onchange(event.target.previousElementSibling.value); });
            }
        }
    };
    Editor.prototype.clear = function () {
        this.part.blocks.clear();
        this.updateMesh();
    };
    Editor.prototype.randomize = function () {
        this.part.randomize();
        this.updateMesh();
    };
    Editor.prototype.share = function () {
        window.history.pushState({}, document.title, "?part=" + this.part.toString());
    };
    Editor.prototype.remove = function () {
        this.part.clearBlock(this.handles.getSelectedBlock(), this.editorState.orientation);
        if (this.createFullSizedBlocks) {
            this.part.clearBlock(this.handles.getSelectedBlock().plus(forward(this.editorState.orientation)), this.editorState.orientation);
        }
        this.updateMesh();
    };
    Editor.prototype.setType = function (typeName) {
        this.editorState.type = BLOCK_TYPE[typeName];
        this.updateBlock();
    };
    Editor.prototype.setOrientation = function (orientatioName) {
        this.editorState.orientation = ORIENTATION[orientatioName];
        this.handles.setMode(this.createFullSizedBlocks, this.editorState.orientation);
        this.updateBlock();
    };
    Editor.prototype.setSize = function (sizeName) {
        this.createFullSizedBlocks = sizeName == "full";
        this.handles.setMode(this.createFullSizedBlocks, this.editorState.orientation);
        this.camera.render();
    };
    Editor.prototype.setRounded = function (roundedName) {
        this.editorState.rounded = roundedName == "true";
        this.updateBlock();
    };
    Editor.prototype.setRenderStyle = function (style) {
        this.style = style;
        this.partNormalDepthRenderer.enabled = style == RenderStyle.Contour;
        this.contourEffect.enabled = style == RenderStyle.Contour;
        this.partRenderer.enabled = style != RenderStyle.Wireframe;
        this.wireframeRenderer.enabled = style == RenderStyle.SolidWireframe || style == RenderStyle.Wireframe;
        this.updateMesh();
    };
    Editor.prototype.updateBlock = function () {
        this.part.placeBlockForced(this.handles.getSelectedBlock(), new Block(this.editorState.orientation, this.editorState.type, this.editorState.rounded));
        if (this.createFullSizedBlocks) {
            this.part.placeBlockForced(this.handles.getSelectedBlock().plus(forward(this.editorState.orientation)), new Block(this.editorState.orientation, this.editorState.type, this.editorState.rounded));
        }
        this.updateMesh();
    };
    Editor.prototype.updateMesh = function (center) {
        if (center === void 0) { center = false; }
        var mesh = new PartMeshGenerator(this.part).getMesh();
        if (this.partRenderer.enabled) {
            this.partRenderer.setMesh(mesh);
        }
        if (this.partNormalDepthRenderer.enabled) {
            this.partNormalDepthRenderer.setMesh(mesh);
        }
        if (this.wireframeRenderer.enabled) {
            this.wireframeRenderer.setMesh(mesh);
        }
        var newCenter = this.part.getCenter().times(-0.5);
        if (center) {
            this.translation = Vector3.zero();
        }
        else {
            this.translation = this.translation.plus(this.getRotation().transformDirection(this.center.minus(newCenter)));
        }
        this.center = newCenter;
        this.updateTransform();
        this.handles.updateTransforms();
        this.camera.render();
    };
    Editor.prototype.getRotation = function () {
        return Matrix4.getRotation(new Vector3(0, this.rotationX, this.rotationY));
    };
    Editor.prototype.updateTransform = function () {
        this.camera.transform =
            Matrix4.getTranslation(this.center)
                .times(this.getRotation())
                .times(Matrix4.getTranslation(this.translation.plus(new Vector3(0, 0, -15))));
    };
    Editor.prototype.onMouseDown = function (event) {
        switch (event.button) {
            case 0:
                if (this.handles.onMouseDown(event)) {
                    this.mouseMode = MouseMode.Left;
                }
                break;
            case 1:
                this.mouseMode = MouseMode.Middle;
                break;
            case 2:
                this.mouseMode = MouseMode.Right;
                break;
        }
        event.preventDefault();
    };
    Editor.prototype.onMouseUp = function (event) {
        this.mouseMode = MouseMode.None;
        this.handles.onMouseUp();
        event.preventDefault();
    };
    Editor.prototype.onMouseMove = function (event) {
        switch (this.mouseMode) {
            case MouseMode.None:
            case MouseMode.Left:
                this.handles.onMouseMove(event);
                break;
            case MouseMode.Middle:
                this.translation = this.translation.plus(new Vector3(event.movementX, -event.movementY, 0).times(this.camera.size / gl.drawingBufferHeight));
                this.updateTransform();
                this.camera.render();
                break;
            case MouseMode.Right:
                this.rotationX -= event.movementX * 0.6;
                this.rotationY = clamp(-90, 90, this.rotationY - event.movementY * 0.6);
                this.updateTransform();
                this.camera.render();
                break;
        }
    };
    Editor.prototype.onScroll = function (event) {
        this.zoom *= event.deltaY < 0 ? this.zoomStep : 1 / this.zoomStep;
        this.camera.size = this.zoom;
        this.camera.render();
    };
    return Editor;
}());
var ARROW_RADIUS_INNER = 0.05;
var ARROW_RADIUS_OUTER = 0.15;
var ARROW_LENGTH = 0.35;
var ARROW_TIP = 0.15;
var HANDLE_DISTANCE = 0.5;
var GRAB_RADIUS = 0.1;
var GRAB_START = 0.4;
var GRAB_END = 1.1;
var UNSELECTED_ALPHA = 0.5;
var Axis;
(function (Axis) {
    Axis[Axis["None"] = 0] = "None";
    Axis[Axis["X"] = 1] = "X";
    Axis[Axis["Y"] = 2] = "Y";
    Axis[Axis["Z"] = 3] = "Z";
})(Axis || (Axis = {}));
var Handles = /** @class */ (function () {
    function Handles(camera) {
        this.meshRenderers = [];
        this.handleAlpha = Vector3.one().times(UNSELECTED_ALPHA);
        this.grabbedAxis = Axis.None;
        this.visible = true;
        this.fullSize = true;
        this.orientation = Orientation.X;
        this.box = new WireframeBox();
        var mesh = Handles.getArrowMesh(20);
        this.xNegative = this.createRenderer(mesh, new Vector3(1, 0, 0));
        this.xPositive = this.createRenderer(mesh, new Vector3(1, 0, 0));
        this.yNegative = this.createRenderer(mesh, new Vector3(0, 1, 0));
        this.yPositive = this.createRenderer(mesh, new Vector3(0, 1, 0));
        this.zNegative = this.createRenderer(mesh, new Vector3(0, 0, 1));
        this.zPositive = this.createRenderer(mesh, new Vector3(0, 0, 1));
        this.block = Vector3.zero();
        this.setMode(true, Orientation.X, false);
        this.camera = camera;
    }
    Handles.prototype.createRenderer = function (mesh, color) {
        var renderer = new MeshRenderer();
        renderer.setMesh(mesh);
        renderer.color = color;
        this.meshRenderers.push(renderer);
        return renderer;
    };
    Handles.prototype.getBlockCenter = function (block) {
        if (this.fullSize) {
            return this.block.plus(Vector3.one()).times(0.5);
        }
        else {
            return this.block.plus(Vector3.one()).times(0.5).minus(forward(this.orientation).times(0.25));
        }
    };
    Handles.prototype.getBlock = function (worldPosition) {
        if (this.fullSize) {
            return worldPosition.times(2).minus(Vector3.one().times(0.5)).floor();
        }
        else {
            return worldPosition.times(2).minus(Vector3.one().minus(forward(this.orientation)).times(0.5)).floor();
        }
    };
    Handles.prototype.render = function (camera) {
        if (!this.visible) {
            return;
        }
        this.box.render(camera);
        this.xPositive.alpha = this.handleAlpha.x;
        this.xNegative.alpha = this.handleAlpha.x;
        this.yPositive.alpha = this.handleAlpha.y;
        this.yNegative.alpha = this.handleAlpha.y;
        this.zPositive.alpha = this.handleAlpha.z;
        this.zNegative.alpha = this.handleAlpha.z;
        gl.colorMask(false, false, false, false);
        gl.depthFunc(gl.ALWAYS);
        for (var _i = 0, _a = this.meshRenderers; _i < _a.length; _i++) {
            var renderer = _a[_i];
            renderer.render(camera);
        }
        gl.depthFunc(gl.LEQUAL);
        for (var _b = 0, _c = this.meshRenderers; _b < _c.length; _b++) {
            var renderer = _c[_b];
            renderer.render(camera);
        }
        gl.colorMask(true, true, true, true);
        for (var _d = 0, _e = this.meshRenderers; _d < _e.length; _d++) {
            var renderer = _e[_d];
            renderer.render(camera);
        }
    };
    Handles.prototype.updateTransforms = function () {
        this.xPositive.transform = Quaternion.euler(new Vector3(0, -90, 0)).toMatrix()
            .times(Matrix4.getTranslation(this.position.plus(new Vector3(this.size.x * HANDLE_DISTANCE, 0, 0))));
        this.xNegative.transform = Quaternion.euler(new Vector3(0, 90, 0)).toMatrix()
            .times(Matrix4.getTranslation(this.position.plus(new Vector3(this.size.x * -HANDLE_DISTANCE, 0, 0))));
        this.yPositive.transform = Quaternion.euler(new Vector3(90, 0, 0)).toMatrix()
            .times(Matrix4.getTranslation(this.position.plus(new Vector3(0, this.size.y * HANDLE_DISTANCE, 0))));
        this.yNegative.transform = Quaternion.euler(new Vector3(-90, 0, 0)).toMatrix()
            .times(Matrix4.getTranslation(this.position.plus(new Vector3(0, this.size.y * -HANDLE_DISTANCE, 0))));
        this.zPositive.transform = Matrix4.getTranslation(this.position.plus(new Vector3(0, 0, this.size.z * HANDLE_DISTANCE)));
        this.zNegative.transform = Quaternion.euler(new Vector3(180, 0, 0)).toMatrix()
            .times(Matrix4.getTranslation(this.position.plus(new Vector3(0, 0, this.size.z * -HANDLE_DISTANCE))));
        this.box.transform = Matrix4.getTranslation(this.getBlockCenter(this.block));
        this.box.scale = this.size.times(0.5);
    };
    Handles.getVector = function (angle, radius, z) {
        return new Vector3(radius * Math.cos(angle), radius * Math.sin(angle), z);
    };
    Handles.getArrowMesh = function (subdivisions) {
        var triangles = [];
        for (var i = 0; i < subdivisions; i++) {
            var angle1 = i / subdivisions * 2 * Math.PI;
            var angle2 = (i + 1) / subdivisions * 2 * Math.PI;
            // Base
            triangles.push(new Triangle(Handles.getVector(angle1, ARROW_RADIUS_INNER, 0), Vector3.zero(), Handles.getVector(angle2, ARROW_RADIUS_INNER, 0)));
            // Side
            triangles.push(new TriangleWithNormals(Handles.getVector(angle1, ARROW_RADIUS_INNER, 0), Handles.getVector(angle2, ARROW_RADIUS_INNER, 0), Handles.getVector(angle2, ARROW_RADIUS_INNER, ARROW_LENGTH), Handles.getVector(angle1, 1, 0).times(-1), Handles.getVector(angle2, 1, 0).times(-1), Handles.getVector(angle2, 1, 0).times(-1)));
            triangles.push(new TriangleWithNormals(Handles.getVector(angle1, ARROW_RADIUS_INNER, ARROW_LENGTH), Handles.getVector(angle1, ARROW_RADIUS_INNER, 0), Handles.getVector(angle2, ARROW_RADIUS_INNER, ARROW_LENGTH), Handles.getVector(angle1, 1, 0).times(-1), Handles.getVector(angle1, 1, 0).times(-1), Handles.getVector(angle2, 1, 0).times(-1)));
            // Tip base
            triangles.push(new Triangle(Handles.getVector(angle1, ARROW_RADIUS_INNER, ARROW_LENGTH), Handles.getVector(angle2, ARROW_RADIUS_INNER, ARROW_LENGTH), Handles.getVector(angle2, ARROW_RADIUS_OUTER, ARROW_LENGTH)));
            triangles.push(new Triangle(Handles.getVector(angle1, ARROW_RADIUS_OUTER, ARROW_LENGTH), Handles.getVector(angle1, ARROW_RADIUS_INNER, ARROW_LENGTH), Handles.getVector(angle2, ARROW_RADIUS_OUTER, ARROW_LENGTH)));
            // Tip
            var alpha = Math.tan(ARROW_TIP / ARROW_RADIUS_OUTER);
            triangles.push(new TriangleWithNormals(new Vector3(0, 0, ARROW_LENGTH + ARROW_TIP), Handles.getVector(angle1, ARROW_RADIUS_OUTER, ARROW_LENGTH), Handles.getVector(angle2, ARROW_RADIUS_OUTER, ARROW_LENGTH), Handles.getVector(angle1, -Math.sin(alpha), -Math.cos(alpha)), Handles.getVector(angle1, -Math.sin(alpha), -Math.cos(alpha)), Handles.getVector(angle2, -Math.sin(alpha), -Math.cos(alpha))));
        }
        return new Mesh(triangles);
    };
    Handles.prototype.getRay = function (axis) {
        switch (axis) {
            case Axis.X:
                return new Ray(this.position, new Vector3(1, 0, 0));
            case Axis.Y:
                return new Ray(this.position, new Vector3(0, 1, 0));
            case Axis.Z:
                return new Ray(this.position, new Vector3(0, 0, 1));
        }
        throw new Error("Unknown axis: " + axis);
    };
    Handles.prototype.getMouseHandle = function (event) {
        var mouseRay = this.camera.getScreenToWorldRay(event);
        for (var _i = 0, _a = [Axis.X, Axis.Y, Axis.Z]; _i < _a.length; _i++) {
            var axis = _a[_i];
            var axisRay = this.getRay(axis);
            if (mouseRay.getDistanceToRay(axisRay) < GRAB_RADIUS) {
                var position = axisRay.getClosestToRay(mouseRay);
                if (Math.abs(position) > GRAB_START && Math.abs(position) < GRAB_END) {
                    return [axis, position];
                }
            }
        }
        return [Axis.None, 0];
    };
    Handles.prototype.onMouseDown = function (event) {
        var handleData = this.getMouseHandle(event);
        this.grabbedAxis = handleData[0];
        this.grabbedPosition = handleData[1];
        return this.grabbedAxis != Axis.None;
    };
    Handles.prototype.onMouseMove = function (event) {
        if (this.grabbedAxis != Axis.None) {
            var mouseRay = this.camera.getScreenToWorldRay(event);
            var axisRay = this.getRay(this.grabbedAxis);
            var mousePosition = axisRay.getClosestToRay(mouseRay);
            this.position = this.position.plus(axisRay.direction.times(mousePosition - this.grabbedPosition));
            this.block = this.getBlock(this.position);
            this.updateTransforms();
            this.camera.render();
        }
        else {
            var axis = this.getMouseHandle(event)[0];
            var newAlpha = new Vector3(axis == Axis.X ? 1 : UNSELECTED_ALPHA, axis == Axis.Y ? 1 : UNSELECTED_ALPHA, axis == Axis.Z ? 1 : UNSELECTED_ALPHA);
            if (!newAlpha.equals(this.handleAlpha)) {
                this.handleAlpha = newAlpha;
                this.camera.render();
            }
        }
    };
    Handles.prototype.onMouseUp = function () {
        if (this.grabbedAxis != Axis.None) {
            this.grabbedAxis = Axis.None;
            this.animatePositionAndSize(this.getBlockCenter(this.block), this.size, false, 100);
        }
    };
    Handles.prototype.getSelectedBlock = function () {
        return this.block;
    };
    Handles.prototype.setMode = function (fullSize, orientation, animate) {
        if (animate === void 0) { animate = true; }
        if (this.fullSize == fullSize && this.orientation == orientation && animate) {
            return;
        }
        this.fullSize = fullSize;
        this.orientation = orientation;
        var targetPosition = this.getBlockCenter(this.block);
        var targetSize = Vector3.one();
        if (!this.fullSize) {
            targetSize = targetSize.minus(forward(this.orientation).times(0.5));
        }
        if (!animate) {
            this.position = targetPosition;
            this.size = Vector3.one();
            this.updateTransforms();
            return;
        }
        this.animatePositionAndSize(targetPosition, targetSize);
    };
    Handles.prototype.animatePositionAndSize = function (targetPosition, targetSize, animateBox, time) {
        if (animateBox === void 0) { animateBox = true; }
        if (time === void 0) { time = 300; }
        var startPosition = this.position;
        var startSize = this.size;
        var start = new Date().getTime();
        var end = start + time;
        var handles = this;
        function callback() {
            var progress = ease(Math.min(1.0, (new Date().getTime() - start) / (end - start)));
            handles.position = Vector3.lerp(startPosition, targetPosition, progress);
            handles.size = Vector3.lerp(startSize, targetSize, progress);
            handles.updateTransforms();
            if (animateBox) {
                handles.box.transform = Matrix4.getTranslation(handles.position);
            }
            handles.camera.render();
            if (progress < 1.0) {
                window.requestAnimationFrame(callback);
            }
        }
        window.requestAnimationFrame(callback);
    };
    return Handles;
}());
var RenderStyle;
(function (RenderStyle) {
    RenderStyle[RenderStyle["Contour"] = 0] = "Contour";
    RenderStyle[RenderStyle["Solid"] = 1] = "Solid";
    RenderStyle[RenderStyle["Wireframe"] = 2] = "Wireframe";
    RenderStyle[RenderStyle["SolidWireframe"] = 3] = "SolidWireframe";
})(RenderStyle || (RenderStyle = {}));
var Matrix4 = /** @class */ (function () {
    function Matrix4(elements) {
        this.elements = elements;
    }
    Matrix4.prototype.get = function (i, j) {
        return this.elements[4 * i + j];
    };
    Matrix4.prototype.times = function (other) {
        var result = [];
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 4; j++) {
                var element = 0;
                for (var k = 0; k < 4; k++) {
                    element += this.get(i, k) * other.get(k, j);
                }
                result.push(element);
            }
        }
        return new Matrix4(result);
    };
    Matrix4.prototype.transpose = function () {
        return new Matrix4([
            this.elements[0], this.elements[4], this.elements[8], this.elements[12],
            this.elements[1], this.elements[5], this.elements[9], this.elements[13],
            this.elements[2], this.elements[6], this.elements[10], this.elements[14],
            this.elements[3], this.elements[7], this.elements[10], this.elements[15]
        ]);
    };
    Matrix4.prototype.invert = function () {
        // based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
        // via https://github.com/mrdoob/three.js/blob/dev/src/math/Matrix4.js
        var el = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], n11 = this.elements[0], n21 = this.elements[1], n31 = this.elements[2], n41 = this.elements[3], n12 = this.elements[4], n22 = this.elements[5], n32 = this.elements[6], n42 = this.elements[7], n13 = this.elements[8], n23 = this.elements[9], n33 = this.elements[10], n43 = this.elements[11], n14 = this.elements[12], n24 = this.elements[13], n34 = this.elements[14], n44 = this.elements[15], t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44, t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44, t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44, t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;
        var det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;
        if (det == 0) {
            throw new Error("Warning: Trying to invert matrix with determinant zero.");
        }
        var detInv = 1 / det;
        el[0] = t11 * detInv;
        el[1] = (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) * detInv;
        el[2] = (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) * detInv;
        el[3] = (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) * detInv;
        el[4] = t12 * detInv;
        el[5] = (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) * detInv;
        el[6] = (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) * detInv;
        el[7] = (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) * detInv;
        el[8] = t13 * detInv;
        el[9] = (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) * detInv;
        el[10] = (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) * detInv;
        el[11] = (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) * detInv;
        el[12] = t14 * detInv;
        el[13] = (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) * detInv;
        el[14] = (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) * detInv;
        el[15] = (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) * detInv;
        return new Matrix4(el);
    };
    Matrix4.prototype.transformPoint = function (point) {
        return new Vector3(point.x * this.elements[0] + point.y * this.elements[4] + point.z * this.elements[8] + this.elements[12], point.x * this.elements[1] + point.y * this.elements[5] + point.z * this.elements[9] + this.elements[13], point.x * this.elements[2] + point.y * this.elements[6] + point.z * this.elements[10] + this.elements[14]);
    };
    Matrix4.prototype.transformDirection = function (point) {
        return new Vector3(point.x * this.elements[0] + point.y * this.elements[4] + point.z * this.elements[8], point.x * this.elements[1] + point.y * this.elements[5] + point.z * this.elements[9], point.x * this.elements[2] + point.y * this.elements[6] + point.z * this.elements[10]);
    };
    Matrix4.getProjection = function (near, far, fov) {
        if (near === void 0) { near = 0.1; }
        if (far === void 0) { far = 1000; }
        if (fov === void 0) { fov = 25; }
        var aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
        return new Matrix4([
            1 / (Math.tan(fov * DEG_TO_RAD / 2) * aspectRatio), 0, 0, 0,
            0, 1 / Math.tan(fov * DEG_TO_RAD / 2), 0, 0,
            0, 0, -(far + near) / (far - near), -1,
            0, 0, -0.2, 0
        ]);
    };
    Matrix4.getOrthographicProjection = function (far, size) {
        if (far === void 0) { far = 1000; }
        if (size === void 0) { size = 5; }
        var aspectRatio = gl.canvas.width / gl.canvas.height;
        return new Matrix4([
            2 / size / aspectRatio, 0, 0, 0,
            0, 2 / size, 0, 0,
            0, 0, -1 / far, 0,
            0, 0, 0, 1
        ]);
    };
    Matrix4.getIdentity = function () {
        return new Matrix4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    };
    Matrix4.getTranslation = function (vector) {
        return new Matrix4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            vector.x, vector.y, vector.z, 1
        ]);
    };
    Matrix4.getRotation = function (euler) {
        var phi = euler.x * DEG_TO_RAD;
        var theta = euler.y * DEG_TO_RAD;
        var psi = euler.z * DEG_TO_RAD;
        var sin = Math.sin;
        var cos = Math.cos;
        return new Matrix4([
            cos(theta) * cos(phi), -cos(psi) * sin(phi) + sin(psi) * sin(theta) * cos(phi), sin(psi) * sin(phi) + cos(psi) * sin(theta) * cos(phi), 0,
            cos(theta) * sin(phi), cos(psi) * cos(phi) + sin(psi) * sin(theta) * sin(phi), -sin(psi) * cos(phi) + cos(psi) * sin(theta) * sin(phi), 0,
            -sin(theta), sin(psi) * cos(theta), cos(psi) * cos(theta), 0,
            0, 0, 0, 1
        ]);
    };
    return Matrix4;
}());
var Mesh = /** @class */ (function () {
    function Mesh(triangles) {
        this.vertexBuffer = null;
        this.normalBuffer = null;
        this.triangles = triangles;
    }
    Mesh.prototype.createVertexBuffer = function () {
        if (this.vertexBuffer != null) {
            return this.vertexBuffer;
        }
        var vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        var positions = [];
        for (var _i = 0, _a = this.triangles; _i < _a.length; _i++) {
            var triangle = _a[_i];
            this.pushVector(positions, triangle.v1);
            this.pushVector(positions, triangle.v2);
            this.pushVector(positions, triangle.v3);
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        this.vertexBuffer = vertexBuffer;
        return vertexBuffer;
    };
    Mesh.prototype.createNormalBuffer = function () {
        if (this.normalBuffer != null) {
            return this.normalBuffer;
        }
        var normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        var normals = [];
        for (var _i = 0, _a = this.triangles; _i < _a.length; _i++) {
            var triangle = _a[_i];
            if (triangle instanceof TriangleWithNormals) {
                this.pushVector(normals, triangle.n1);
                this.pushVector(normals, triangle.n2);
                this.pushVector(normals, triangle.n3);
            }
            else {
                for (var i = 0; i < 3; i++) {
                    this.pushVector(normals, triangle.normal());
                }
            }
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
        this.normalBuffer = normalBuffer;
        return normalBuffer;
    };
    Mesh.prototype.createWireframeVertexBuffer = function () {
        var vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        var positions = [];
        for (var _i = 0, _a = this.triangles; _i < _a.length; _i++) {
            var triangle = _a[_i];
            this.pushVector(positions, triangle.v1);
            this.pushVector(positions, triangle.v2);
            this.pushVector(positions, triangle.v2);
            this.pushVector(positions, triangle.v3);
            this.pushVector(positions, triangle.v3);
            this.pushVector(positions, triangle.v1);
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        return vertexBuffer;
    };
    Mesh.prototype.pushVector = function (array, vector) {
        array.push(vector.x);
        array.push(vector.y);
        array.push(vector.z);
    };
    Mesh.prototype.createSTLFile = function () {
        var size = 84 + 50 * this.triangles.length;
        var buffer = new ArrayBuffer(size);
        var view = new DataView(buffer, 0, size);
        for (var i = 0; i < 80; i++) {
            view.setInt8(i, 0);
        }
        var p = 80;
        view.setInt32(p, this.triangles.length, true);
        p += 4;
        for (var _i = 0, _a = this.triangles; _i < _a.length; _i++) {
            var triangle = _a[_i];
            this.writeTriangle(view, p, triangle);
            p += 50;
        }
        return buffer;
    };
    Mesh.prototype.writeVector = function (view, offset, vector) {
        view.setFloat32(offset, vector.x, true);
        view.setFloat32(offset + 4, vector.z, true);
        view.setFloat32(offset + 8, vector.y, true);
    };
    Mesh.prototype.writeTriangle = function (view, offset, triangle) {
        this.writeVector(view, offset, triangle.normal().times(-1));
        this.writeVector(view, offset + 12, triangle.v2.times(TECHNIC_UNIT));
        this.writeVector(view, offset + 24, triangle.v1.times(TECHNIC_UNIT));
        this.writeVector(view, offset + 36, triangle.v3.times(TECHNIC_UNIT));
        view.setInt16(offset + 48, 0, true);
    };
    Mesh.prototype.saveSTLFile = function (filename) {
        if (filename === void 0) { filename = "part.stl"; }
        var blob = new Blob([this.createSTLFile()], { type: "application/octet-stream" });
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    };
    Mesh.prototype.getVertexCount = function () {
        return this.triangles.length * 3;
    };
    return Mesh;
}());
var Quaternion = /** @class */ (function () {
    function Quaternion(x, y, z, w) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
    Quaternion.prototype.times = function (other) {
        return new Quaternion(this.x * other.x - this.y * other.y - this.z * other.z - this.w * other.w, this.x * other.y + other.x * this.y + this.z * other.w - other.z * this.w, this.x * other.z + other.x * this.z + this.w * other.y - other.w * this.y, this.x * other.w + other.x * this.w + this.y * other.z - other.y * this.z);
    };
    Quaternion.prototype.toMatrix = function () {
        return new Matrix4([
            1 - 2 * Math.pow(this.z, 2) - 2 * Math.pow(this.w, 2), 2 * this.y * this.z - 2 * this.w * this.x, 2 * this.y * this.w + 2 * this.z * this.x, 0,
            2 * this.y * this.z + 2 * this.w * this.x, 1 - 2 * Math.pow(this.y, 2) - 2 * Math.pow(this.w, 2), 2 * this.z * this.w - 2 * this.y * this.x, 0,
            2 * this.y * this.w - 2 * this.z * this.x, 2 * this.z * this.w + 2 * this.y * this.x, 1 - 2 * Math.pow(this.y, 2) - 2 * Math.pow(this.z, 2), 0,
            0, 0, 0, 1
        ]);
    };
    Quaternion.euler = function (angles) {
        return Quaternion.angleAxis(angles.z, new Vector3(0, 0, 1))
            .times(Quaternion.angleAxis(angles.y, new Vector3(0, 1, 0)))
            .times(Quaternion.angleAxis(angles.x, new Vector3(1, 0, 0)));
    };
    Quaternion.angleAxis = function (angle, axis) {
        var theta_half = angle * DEG_TO_RAD * 0.5;
        return new Quaternion(Math.cos(theta_half), axis.x * Math.sin(theta_half), axis.y * Math.sin(theta_half), axis.z * Math.sin(theta_half));
    };
    Quaternion.identity = function () {
        return new Quaternion(1, 0, 0, 0);
    };
    return Quaternion;
}());
var Ray = /** @class */ (function () {
    function Ray(point, direction) {
        this.point = point;
        this.direction = direction;
    }
    Ray.prototype.get = function (t) {
        return this.point.plus(this.direction.times(t));
    };
    Ray.prototype.getDistanceToRay = function (other) {
        var normal = this.direction.cross(other.direction).normalized();
        var d1 = normal.dot(this.point);
        var d2 = normal.dot(other.point);
        return Math.abs(d1 - d2);
    };
    Ray.prototype.getClosestToPoint = function (point) {
        return this.direction.dot(this.point.minus(point));
    };
    Ray.prototype.getClosestToRay = function (other) {
        var connection = this.direction.cross(other.direction).normalized();
        var planeNormal = connection.cross(other.direction).normalized();
        var planeToOrigin = other.point.dot(planeNormal);
        var result = (-this.point.dot(planeNormal) + planeToOrigin) / this.direction.dot(planeNormal);
        return result;
    };
    return Ray;
}());
var Triangle = /** @class */ (function () {
    function Triangle(v1, v2, v3, flipped) {
        if (flipped === void 0) { flipped = false; }
        if (flipped) {
            this.v1 = v2;
            this.v2 = v1;
            this.v3 = v3;
        }
        else {
            this.v1 = v1;
            this.v2 = v2;
            this.v3 = v3;
        }
    }
    Triangle.prototype.normal = function () {
        return this.v3.minus(this.v1).cross(this.v2.minus(this.v1)).normalized();
    };
    return Triangle;
}());
var TriangleWithNormals = /** @class */ (function (_super) {
    __extends(TriangleWithNormals, _super);
    function TriangleWithNormals(v1, v2, v3, n1, n2, n3) {
        var _this = _super.call(this, v1, v2, v3) || this;
        _this.n1 = n1;
        _this.n2 = n2;
        _this.n3 = n3;
        return _this;
    }
    return TriangleWithNormals;
}(Triangle));
var Vector3 = /** @class */ (function () {
    function Vector3(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    Vector3.prototype.times = function (factor) {
        return new Vector3(this.x * factor, this.y * factor, this.z * factor);
    };
    Vector3.prototype.plus = function (other) {
        return new Vector3(this.x + other.x, this.y + other.y, this.z + other.z);
    };
    Vector3.prototype.minus = function (other) {
        return new Vector3(this.x - other.x, this.y - other.y, this.z - other.z);
    };
    Vector3.prototype.dot = function (other) {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    };
    Vector3.prototype.cross = function (other) {
        return new Vector3(this.y * other.z - this.z * other.y, this.z * other.x - this.x * other.z, this.x * other.y - this.y * other.x);
    };
    Vector3.prototype.elementwiseMultiply = function (other) {
        return new Vector3(this.x * other.x, this.y * other.y, this.z * other.z);
    };
    Vector3.prototype.magnitude = function () {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
    };
    Vector3.prototype.normalized = function () {
        return this.times(1 / this.magnitude());
    };
    Vector3.prototype.toString = function () {
        return "(" + this.x + ", " + this.y + ", " + this.z + ")";
    };
    Vector3.prototype.copy = function () {
        return new Vector3(this.x, this.y, this.z);
    };
    Vector3.prototype.equals = function (other) {
        return this.x == other.x && this.y == other.y && this.z == other.z;
    };
    Vector3.prototype.floor = function () {
        return new Vector3(Math.floor(this.x), Math.floor(this.y), Math.floor(this.z));
    };
    Vector3.prototype.toNumber = function () {
        var layer3D = this.x + this.y + this.z;
        var layer2D = layer3D - this.y;
        return tetrahedralNumber(layer3D) + triangularNumber(layer2D) + this.x;
    };
    Vector3.fromNumber = function (value) {
        var layer3D = inverseTetrahedralNumber(value);
        value -= tetrahedralNumber(layer3D);
        var layer2D = inverseTriangularNumber(value);
        var x = value - triangularNumber(layer2D);
        var y = layer3D - layer2D;
        var z = layer3D - x - y;
        return new Vector3(x, y, z);
    };
    Vector3.zero = function () {
        return new Vector3(0, 0, 0);
    };
    Vector3.one = function () {
        return new Vector3(1, 1, 1);
    };
    Vector3.lerp = function (a, b, progress) {
        return a.plus(b.minus(a).times(progress));
    };
    return Vector3;
}());
var VectorDictionary = /** @class */ (function () {
    function VectorDictionary() {
        this.data = {};
    }
    VectorDictionary.prototype.containsKey = function (key) {
        return key.x in this.data && key.y in this.data[key.x] && key.z in this.data[key.x][key.y];
    };
    VectorDictionary.prototype.get = function (key) {
        if (!this.containsKey(key)) {
            throw new Error("Dictionary does not contain key: " + key.toString());
        }
        return this.data[key.x][key.y][key.z];
    };
    VectorDictionary.prototype.getOrNull = function (key) {
        if (!this.containsKey(key)) {
            return null;
        }
        return this.data[key.x][key.y][key.z];
    };
    VectorDictionary.prototype.set = function (key, value) {
        if (!(key.x in this.data)) {
            this.data[key.x] = {};
        }
        if (!(key.y in this.data[key.x])) {
            this.data[key.x][key.y] = {};
        }
        this.data[key.x][key.y][key.z] = value;
    };
    VectorDictionary.prototype.remove = function (key) {
        if (key.x in this.data && key.y in this.data[key.x] && key.z in this.data[key.x][key.y]) {
            delete this.data[key.x][key.y][key.z];
        }
    };
    VectorDictionary.prototype.clear = function () {
        this.data = {};
    };
    VectorDictionary.prototype.keys = function () {
        var result = [];
        for (var x in this.data) {
            for (var y in this.data[x]) {
                for (var z in this.data[x][y]) {
                    result.push(new Vector3(parseInt(x), parseInt(y), parseInt(z)));
                }
            }
        }
        return result;
    };
    VectorDictionary.prototype.values = function () {
        var result = [];
        for (var x in this.data) {
            for (var y in this.data[x]) {
                for (var z in this.data[x][y]) {
                    result.push(this.data[x][y][z]);
                }
            }
        }
        return result;
    };
    VectorDictionary.prototype.any = function () {
        for (var x in this.data) {
            for (var y in this.data[x]) {
                for (var z in this.data[x][y]) {
                    return true;
                }
            }
        }
        return false;
    };
    return VectorDictionary;
}());
var Block = /** @class */ (function () {
    function Block(orientation, type, rounded) {
        this.orientation = orientation;
        this.type = type;
        this.rounded = rounded;
    }
    Block.prototype.right = function () {
        return right(this.orientation);
    };
    Block.prototype.up = function () {
        return up(this.orientation);
    };
    Block.prototype.forward = function () {
        return forward(this.orientation);
    };
    return Block;
}());
///<reference path="../geometry/Vector3.ts" />
var CUBE = [
    new Vector3(0, 0, 0),
    new Vector3(0, 0, 1),
    new Vector3(0, 1, 0),
    new Vector3(0, 1, 1),
    new Vector3(1, 0, 0),
    new Vector3(1, 0, 1),
    new Vector3(1, 1, 0),
    new Vector3(1, 1, 1)
];
var Part = /** @class */ (function () {
    function Part() {
        this.blocks = new VectorDictionary();
    }
    Part.prototype.createSmallBlocks = function () {
        var result = new VectorDictionary();
        for (var _i = 0, _a = this.blocks.keys(); _i < _a.length; _i++) {
            var position = _a[_i];
            var block = this.blocks.get(position);
            for (var _b = 0, CUBE_1 = CUBE; _b < CUBE_1.length; _b++) {
                var local = CUBE_1[_b];
                if (block.forward().dot(local) == 1) {
                    continue;
                }
                result.set(position.plus(local), SmallBlock.createFromLocalCoordinates(block.right().dot(local), block.up().dot(local), position.plus(local), block));
            }
        }
        return result;
    };
    Part.prototype.isSmallBlockFree = function (position) {
        for (var _i = 0, CUBE_2 = CUBE; _i < CUBE_2.length; _i++) {
            var local = CUBE_2[_i];
            if (!this.blocks.containsKey(position.minus(local))) {
                continue;
            }
            var block = this.blocks.get(position.minus(local));
            if (block.forward().dot(local) == 1) {
                return false;
            }
        }
        return true;
    };
    Part.prototype.clearSingle = function (position) {
        for (var _i = 0, CUBE_3 = CUBE; _i < CUBE_3.length; _i++) {
            var local = CUBE_3[_i];
            if (!this.blocks.containsKey(position.minus(local))) {
                continue;
            }
            var block = this.blocks.get(position.minus(local));
            if (block.forward().dot(local) != 1) {
                this.blocks.remove(position.minus(local));
            }
        }
    };
    Part.prototype.clearBlock = function (position, orientation) {
        for (var _i = 0, CUBE_4 = CUBE; _i < CUBE_4.length; _i++) {
            var local = CUBE_4[_i];
            if (forward(orientation).dot(local) != 1) {
                this.clearSingle(position.plus(local));
            }
        }
    };
    Part.prototype.isBlockPlaceable = function (position, orientation, doubleSize) {
        for (var _i = 0, CUBE_5 = CUBE; _i < CUBE_5.length; _i++) {
            var local = CUBE_5[_i];
            if (!doubleSize && forward(orientation).dot(local) == 1) {
                continue;
            }
            if (!this.isSmallBlockFree(position.plus(local))) {
                return false;
            }
        }
        return true;
    };
    Part.prototype.placeBlockForced = function (position, block) {
        this.clearBlock(position, block.orientation);
        this.blocks.set(position, block);
    };
    Part.prototype.randomize = function (createFullSizeBlocks) {
        if (createFullSizeBlocks === void 0) { createFullSizeBlocks = false; }
        this.blocks.clear();
        for (var i = 0; i < 40; i++) {
            var position = new Vector3(Math.floor(3 * Math.random()), Math.floor(5 * Math.random()), Math.floor(5 * Math.random())).times(createFullSizeBlocks ? 2 : 1);
            var orientation = (Math.random() > 0.333 ? (Math.random() > 0.5 ? Orientation.X : Orientation.Y) : Orientation.Z);
            var type = getRandomBlockType();
            var block = new Block(orientation, type, true);
            this.placeBlockForced(position, block);
            if (createFullSizeBlocks) {
                var block2 = new Block(orientation, type, true);
                this.placeBlockForced(position.plus(forward(orientation)), block2);
            }
        }
    };
    Part.prototype.toString = function () {
        var result = "";
        if (!this.blocks.any()) {
            return result;
        }
        var origin = new Vector3(min(this.blocks.keys(), function (p) { return p.x; }), min(this.blocks.keys(), function (p) { return p.y; }), min(this.blocks.keys(), function (p) { return p.z; }));
        for (var _i = 0, _a = this.blocks.keys(); _i < _a.length; _i++) {
            var position = _a[_i];
            result += position.minus(origin).toNumber().toString(16).toLowerCase();
            var block = this.blocks.get(position);
            var orientationAndRounded = block.orientation == Orientation.X ? "x" : (block.orientation == Orientation.Y ? "y" : "z");
            if (!block.rounded) {
                orientationAndRounded = orientationAndRounded.toUpperCase();
            }
            result += orientationAndRounded;
            result += block.type.toString();
        }
        return result;
    };
    Part.fromString = function (s) {
        var XYZ = "xyz";
        var part = new Part();
        var p = 0;
        while (p < s.length) {
            var chars = 1;
            while (XYZ.indexOf(s[p + chars].toLowerCase()) == -1) {
                chars++;
            }
            var position = Vector3.fromNumber(parseInt(s.substr(p, chars), 16));
            p += chars;
            var orientationString = s[p].toString().toLowerCase();
            var orientation_1 = orientationString == "x" ? Orientation.X : (orientationString == "y" ? Orientation.Y : Orientation.Z);
            var rounded = s[p].toLowerCase() == s[p];
            var type = parseInt(s[p + 1]);
            part.blocks.set(position, new Block(orientation_1, type, rounded));
            p += 2;
        }
        return part;
    };
    Part.prototype.getBoundingBox = function () {
        var min = this.blocks.keys()[0].copy();
        var max = min.copy();
        for (var _i = 0, _a = this.blocks.keys(); _i < _a.length; _i++) {
            var position = _a[_i];
            var forward = this.blocks.get(position).forward();
            if (position.x < min.x) {
                min.x = position.x;
            }
            if (position.y < min.y) {
                min.y = position.y;
            }
            if (position.z < min.z) {
                min.z = position.z;
            }
            if (position.x + (1.0 - forward.x) > max.x) {
                max.x = position.x + (1.0 - forward.x);
            }
            if (position.y + (1.0 - forward.y) > max.y) {
                max.y = position.y + (1.0 - forward.y);
            }
            if (position.z + (1.0 - forward.z) > max.z) {
                max.z = position.z + (1.0 - forward.z);
            }
        }
        return [min, max];
    };
    Part.prototype.getCenter = function () {
        if (!this.blocks.any()) {
            return Vector3.zero();
        }
        var boundingBox = this.getBoundingBox();
        var min = boundingBox[0];
        var max = boundingBox[1];
        return min.plus(max).plus(Vector3.one()).times(0.5);
    };
    Part.prototype.getSize = function () {
        var boundingBox = this.getBoundingBox();
        var min = boundingBox[0];
        var max = boundingBox[1];
        return Math.max(max.x - min.x, Math.max(max.y - min.y, max.z - min.z)) + 1;
    };
    return Part;
}());
var SmallBlock = /** @class */ (function (_super) {
    __extends(SmallBlock, _super);
    function SmallBlock(quadrant, positon, source) {
        var _this = _super.call(this, source.orientation, source.type, source.rounded) || this;
        _this.quadrant = quadrant;
        _this.position = positon;
        _this.hasInterior = source.type != BlockType.Solid;
        return _this;
    }
    SmallBlock.createFromLocalCoordinates = function (localX, localY, position, source) {
        return new SmallBlock(SmallBlock.getQuadrantFromLocal(localX, localY), position, source);
    };
    SmallBlock.prototype.localX = function () {
        return localX(this.quadrant);
    };
    SmallBlock.prototype.localY = function () {
        return localY(this.quadrant);
    };
    SmallBlock.prototype.directionX = function () {
        return this.localX() == 1 ? 1 : -1;
    };
    SmallBlock.prototype.directionY = function () {
        return this.localY() == 1 ? 1 : -1;
    };
    SmallBlock.prototype.odd = function () {
        return this.quadrant == Quadrant.BottomRight || this.quadrant == Quadrant.TopLeft;
    };
    SmallBlock.prototype.horizontal = function () {
        return this.right().times(this.directionX());
    };
    SmallBlock.prototype.vertical = function () {
        return this.up().times(this.directionY());
    };
    SmallBlock.prototype.isAttachment = function () {
        return this.type == BlockType.Pin || this.type == BlockType.Axle;
    };
    SmallBlock.getQuadrantFromLocal = function (x, y) {
        if (x == 0) {
            if (y == 0) {
                return Quadrant.BottomLeft;
            }
            else {
                return Quadrant.TopLeft;
            }
        }
        else {
            if (y == 0) {
                return Quadrant.BottomRight;
            }
            else {
                return Quadrant.TopRight;
            }
        }
    };
    SmallBlock.prototype.getOnCircle = function (angle, radius) {
        if (radius === void 0) { radius = 1; }
        return this.right().times(Math.sin(angle + getAngle(this.quadrant)) * radius).plus(this.up().times(Math.cos(angle + getAngle(this.quadrant)) * radius));
    };
    return SmallBlock;
}(Block));
var TinyBlock = /** @class */ (function (_super) {
    __extends(TinyBlock, _super);
    function TinyBlock(position, source) {
        var _this = _super.call(this, source.quadrant, position, source) || this;
        _this.mergedBlocks = 1;
        _this.merged = false;
        _this.visibleFaces = [true, true, true, true, true, true];
        return _this;
    }
    TinyBlock.prototype.angle = function () {
        return getAngle(this.quadrant);
    };
    TinyBlock.prototype.smallBlockPosition = function () {
        return new Vector3(Math.floor((this.position.x + 1) / 3), Math.floor((this.position.y + 1) / 3), Math.floor((this.position.z + 1) / 3));
    };
    TinyBlock.prototype.localPositon = function () {
        return this.position.minus(this.smallBlockPosition().times(3));
    };
    // Returns true if this tiny block is not inside the margin on the right and up axes
    // Being insdide the margin along the forward axis is ok.
    TinyBlock.prototype.isCenter = function () {
        return this.localPositon().dot(this.up()) == 0 && this.localPositon().dot(this.right()) == 0;
    };
    TinyBlock.prototype.getCylinderOrigin = function () {
        return this.forward().times(tinyIndexToWorld(this.forward().dot(this.position)))
            .plus(this.right().times((this.smallBlockPosition().dot(this.right()) + (1 - this.localX())) * 0.5))
            .plus(this.up().times((this.smallBlockPosition().dot(this.up()) + (1 - this.localY())) * 0.5));
    };
    TinyBlock.prototype.getDepth = function () {
        return tinyIndexToWorld(this.forward().dot(this.position) + this.mergedBlocks) - tinyIndexToWorld(this.forward().dot(this.position));
    };
    TinyBlock.prototype.isFaceVisible = function (direction) {
        if (direction.x > 0 && direction.y == 0 && direction.z == 0) {
            return this.visibleFaces[0];
        }
        else if (direction.x < 0 && direction.y == 0 && direction.z == 0) {
            return this.visibleFaces[1];
        }
        else if (direction.x == 0 && direction.y > 0 && direction.z == 0) {
            return this.visibleFaces[2];
        }
        else if (direction.x == 0 && direction.y < 0 && direction.z == 0) {
            return this.visibleFaces[3];
        }
        else if (direction.x == 0 && direction.y == 0 && direction.z > 0) {
            return this.visibleFaces[4];
        }
        else if (direction.x == 0 && direction.y == 0 && direction.z < 0) {
            return this.visibleFaces[5];
        }
        else {
            throw new Error("Invalid direction vector.");
        }
    };
    TinyBlock.prototype.hideFace = function (direction) {
        if (direction.x > 0 && direction.y == 0 && direction.z == 0) {
            this.visibleFaces[0] = false;
        }
        else if (direction.x < 0 && direction.y == 0 && direction.z == 0) {
            this.visibleFaces[1] = false;
        }
        else if (direction.x == 0 && direction.y > 0 && direction.z == 0) {
            this.visibleFaces[2] = false;
        }
        else if (direction.x == 0 && direction.y < 0 && direction.z == 0) {
            this.visibleFaces[3] = false;
        }
        else if (direction.x == 0 && direction.y == 0 && direction.z > 0) {
            this.visibleFaces[4] = false;
        }
        else if (direction.x == 0 && direction.y == 0 && direction.z < 0) {
            this.visibleFaces[5] = false;
        }
        else {
            throw new Error("Invalid direction vector.");
        }
    };
    return TinyBlock;
}(SmallBlock));
var BlockType;
(function (BlockType) {
    BlockType[BlockType["Solid"] = 0] = "Solid";
    BlockType[BlockType["PinHole"] = 1] = "PinHole";
    BlockType[BlockType["AxleHole"] = 2] = "AxleHole";
    BlockType[BlockType["Pin"] = 3] = "Pin";
    BlockType[BlockType["Axle"] = 4] = "Axle";
})(BlockType || (BlockType = {}));
function getRandomBlockType() {
    var types = [BlockType.AxleHole, BlockType.PinHole, BlockType.Solid, BlockType.Pin, BlockType.Axle];
    var index = Math.floor(types.length * Math.random());
    return types[index];
}
var BLOCK_TYPE = {
    "solid": BlockType.Solid,
    "pinhole": BlockType.PinHole,
    "axlehole": BlockType.AxleHole,
    "pin": BlockType.Pin,
    "axle": BlockType.Axle
};
var Orientation;
(function (Orientation) {
    Orientation[Orientation["X"] = 0] = "X";
    Orientation[Orientation["Y"] = 1] = "Y";
    Orientation[Orientation["Z"] = 2] = "Z";
})(Orientation || (Orientation = {}));
var ORIENTATION = {
    "x": Orientation.X,
    "y": Orientation.Y,
    "z": Orientation.Z
};
function forward(orientation) {
    switch (orientation) {
        case Orientation.X: {
            return new Vector3(1, 0, 0);
        }
        case Orientation.Y: {
            return new Vector3(0, 1, 0);
        }
        case Orientation.Z: {
            return new Vector3(0, 0, 1);
        }
    }
    throw new Error("Unknown orientation: " + orientation);
}
function right(orientation) {
    switch (orientation) {
        case Orientation.X: {
            return new Vector3(0, 1, 0);
        }
        case Orientation.Y: {
            return new Vector3(0, 0, 1);
        }
        case Orientation.Z: {
            return new Vector3(1, 0, 0);
        }
    }
    throw new Error("Unknown orientation: " + orientation);
}
function up(orientation) {
    switch (orientation) {
        case Orientation.X: {
            return new Vector3(0, 0, 1);
        }
        case Orientation.Y: {
            return new Vector3(1, 0, 0);
        }
        case Orientation.Z: {
            return new Vector3(0, 1, 0);
        }
    }
    throw new Error("Unknown orientation: " + orientation);
}
var Quadrant;
(function (Quadrant) {
    Quadrant[Quadrant["TopLeft"] = 0] = "TopLeft";
    Quadrant[Quadrant["TopRight"] = 1] = "TopRight";
    Quadrant[Quadrant["BottomLeft"] = 2] = "BottomLeft";
    Quadrant[Quadrant["BottomRight"] = 3] = "BottomRight";
})(Quadrant || (Quadrant = {}));
function localX(quadrant) {
    return (quadrant == Quadrant.TopRight || quadrant == Quadrant.BottomRight) ? 1 : 0;
}
function localY(quadrant) {
    return (quadrant == Quadrant.TopRight || quadrant == Quadrant.TopLeft) ? 1 : 0;
}
function getAngle(quadrant) {
    switch (quadrant) {
        case Quadrant.TopRight:
            return 0;
        case Quadrant.BottomRight:
            return 90 * DEG_TO_RAD;
        case Quadrant.BottomLeft:
            return 180 * DEG_TO_RAD;
        case Quadrant.TopLeft:
            return 270 * DEG_TO_RAD;
    }
    throw new Error("Unknown quadrant: " + quadrant);
}
var Camera = /** @class */ (function () {
    function Camera(canvas, supersample) {
        if (supersample === void 0) { supersample = 1; }
        this.renderers = [];
        this.transform = Matrix4.getIdentity();
        this.size = 5;
        this.clearColor = new Vector3(0.95, 0.95, 0.95);
        this.supersample = 1;
        gl = canvas.getContext("webgl");
        if (gl == null) {
            throw new Error("WebGL is not supported.");
        }
        gl.getExtension('WEBGL_depth_texture');
        this.supersample = supersample;
        gl.canvas.width = Math.round(gl.canvas.clientWidth * window.devicePixelRatio) * this.supersample;
        gl.canvas.height = Math.round(gl.canvas.clientHeight * window.devicePixelRatio) * this.supersample;
        this.createBuffers();
    }
    Camera.prototype.createBuffers = function () {
        this.normalTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.normalTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.depthTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, gl.canvas.width, gl.canvas.height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.normalTexture, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthTexture, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };
    Camera.prototype.getProjectionMatrix = function () {
        return Matrix4.getOrthographicProjection(30, this.size);
    };
    Camera.prototype.render = function () {
        gl.clearColor(this.clearColor.x, this.clearColor.y, this.clearColor.z, 1.0);
        gl.colorMask(true, true, true, true);
        gl.clearDepth(1.0);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        for (var _i = 0, _a = this.renderers; _i < _a.length; _i++) {
            var renderer = _a[_i];
            renderer.render(this);
        }
        gl.colorMask(false, false, false, true);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
    };
    Camera.prototype.onResize = function () {
        gl.canvas.width = Math.round(gl.canvas.clientWidth * window.devicePixelRatio) * this.supersample;
        gl.canvas.height = Math.round(gl.canvas.clientHeight * window.devicePixelRatio) * this.supersample;
        this.createBuffers();
        this.render();
    };
    Camera.prototype.getScreenToWorldRay = function (event) {
        var rect = gl.canvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        x = x / gl.canvas.clientWidth * 2 - 1;
        y = y / gl.canvas.clientHeight * -2 + 1;
        var viewSpacePoint = new Vector3(x * this.size / 2 * gl.drawingBufferWidth / gl.drawingBufferHeight, y * this.size / 2, 0);
        var viewSpaceDirection = new Vector3(0, 0, -1);
        var inverseCameraTransform = this.transform.invert();
        return new Ray(inverseCameraTransform.transformPoint(viewSpacePoint), inverseCameraTransform.transformDirection(viewSpaceDirection));
    };
    return Camera;
}());
var ContourPostEffect = /** @class */ (function () {
    function ContourPostEffect() {
        this.enabled = true;
        this.shader = new Shader(COUNTOUR_VERTEX, CONTOUR_FRAGMENT);
        this.shader.setAttribute("vertexPosition");
        this.shader.setUniform("normalTexture");
        this.shader.setUniform("depthTexture");
        this.shader.setUniform("resolution");
        this.vertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
        var positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    }
    ContourPostEffect.prototype.render = function (camera) {
        if (!this.enabled) {
            return;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
        gl.vertexAttribPointer(this.shader.attributes["vertexPosition"], 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.shader.attributes["vertexPosition"]);
        gl.useProgram(this.shader.program);
        gl.depthFunc(gl.ALWAYS);
        gl.depthMask(false);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, camera.normalTexture);
        gl.uniform1i(this.shader.attributes["normalTexture"], 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, camera.depthTexture);
        gl.uniform1i(this.shader.attributes["depthTexture"], 1);
        gl.uniform2f(this.shader.attributes["resolution"], gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.depthFunc(gl.LEQUAL);
        gl.depthMask(true);
    };
    return ContourPostEffect;
}());
var MeshRenderer = /** @class */ (function () {
    function MeshRenderer() {
        this.color = new Vector3(1, 0, 0);
        this.alpha = 1;
        this.enabled = true;
        this.shader = new Shader(VERTEX_SHADER, FRAGMENT_SHADER);
        this.shader.setAttribute("vertexPosition");
        this.shader.setAttribute("normal");
        this.shader.setUniform("projectionMatrix");
        this.shader.setUniform("modelViewMatrix");
        this.shader.setUniform("albedo");
        this.shader.setUniform("alpha");
        this.transform = Matrix4.getIdentity();
    }
    MeshRenderer.prototype.setMesh = function (mesh) {
        this.vertexCount = mesh.getVertexCount();
        this.vertices = mesh.createVertexBuffer();
        this.normals = mesh.createNormalBuffer();
    };
    MeshRenderer.prototype.render = function (camera) {
        if (!this.enabled) {
            return;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
        gl.vertexAttribPointer(this.shader.attributes["vertexPosition"], 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.shader.attributes["vertexPosition"]);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normals);
        gl.vertexAttribPointer(this.shader.attributes["normal"], 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.shader.attributes["normal"]);
        gl.useProgram(this.shader.program);
        gl.uniformMatrix4fv(this.shader.attributes["projectionMatrix"], false, camera.getProjectionMatrix().elements);
        gl.uniformMatrix4fv(this.shader.attributes["modelViewMatrix"], false, this.transform.times(camera.transform).elements);
        gl.uniform3f(this.shader.attributes["albedo"], this.color.x, this.color.y, this.color.z);
        gl.uniform1f(this.shader.attributes["alpha"], this.alpha);
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
    };
    return MeshRenderer;
}());
var NormalDepthRenderer = /** @class */ (function () {
    function NormalDepthRenderer() {
        this.enabled = true;
        this.prepareShaders();
        this.transform = Matrix4.getIdentity();
    }
    NormalDepthRenderer.prototype.prepareShaders = function () {
        this.shader = new Shader(VERTEX_SHADER, NORMAL_FRAGMENT_SHADER);
        this.shader.setAttribute("vertexPosition");
        this.shader.setAttribute("normal");
        this.shader.setUniform("projectionMatrix");
        this.shader.setUniform("modelViewMatrix");
    };
    NormalDepthRenderer.prototype.setMesh = function (mesh) {
        this.vertexCount = mesh.getVertexCount();
        this.vertices = mesh.createVertexBuffer();
        this.normals = mesh.createNormalBuffer();
    };
    NormalDepthRenderer.prototype.render = function (camera) {
        if (!this.enabled) {
            return;
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, camera.frameBuffer);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.clearColor(0.5, 0.5, -1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
        gl.vertexAttribPointer(this.shader.attributes["vertexPosition"], 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.shader.attributes["vertexPosition"]);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normals);
        gl.vertexAttribPointer(this.shader.attributes["normal"], 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.shader.attributes["normal"]);
        gl.useProgram(this.shader.program);
        gl.uniformMatrix4fv(this.shader.attributes["projectionMatrix"], false, camera.getProjectionMatrix().elements);
        gl.uniformMatrix4fv(this.shader.attributes["modelViewMatrix"], false, this.transform.times(camera.transform).elements);
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };
    return NormalDepthRenderer;
}());
var Shader = /** @class */ (function () {
    function Shader(vertexSource, fragmentSource) {
        this.attributes = {};
        var vertexShader = this.loadShader(gl.VERTEX_SHADER, vertexSource);
        var fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, fragmentSource);
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            throw new Error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(this.program));
        }
    }
    Shader.prototype.loadShader = function (type, source) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            var lines = source.split("\n");
            for (var index = 0; index < lines.length; index++) {
                console.log((index + 1) + ": " + lines[index]);
            }
            throw new Error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        }
        return shader;
    };
    Shader.prototype.setAttribute = function (name) {
        this.attributes[name] = gl.getAttribLocation(this.program, name);
    };
    Shader.prototype.setUniform = function (name) {
        this.attributes[name] = gl.getUniformLocation(this.program, name);
    };
    return Shader;
}());
var WireframeBox = /** @class */ (function () {
    function WireframeBox() {
        this.visible = true;
        this.color = new Vector3(0.0, 0.0, 1.0);
        this.alpha = 0.8;
        this.colorOccluded = new Vector3(0.0, 0.0, 0.0);
        this.alphaOccluded = 0.15;
        this.scale = Vector3.one();
        this.shader = new Shader(SIMPLE_VERTEX_SHADER, COLOR_FRAGMENT_SHADER);
        this.shader.setAttribute("vertexPosition");
        this.shader.setUniform("projectionMatrix");
        this.shader.setUniform("modelViewMatrix");
        this.shader.setUniform("color");
        this.shader.setUniform("scale");
        this.positions = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positions);
        var positions = [
            -1, -1, -1, -1, -1, +1,
            +1, -1, -1, +1, -1, +1,
            -1, +1, -1, -1, +1, +1,
            +1, +1, -1, +1, +1, +1,
            -1, -1, -1, -1, +1, -1,
            -1, -1, +1, -1, +1, +1,
            +1, -1, -1, +1, +1, -1,
            +1, -1, +1, +1, +1, +1,
            -1, -1, -1, +1, -1, -1,
            -1, +1, -1, +1, +1, -1,
            -1, -1, +1, +1, -1, +1,
            -1, +1, +1, +1, +1, +1
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    }
    WireframeBox.prototype.render = function (camera) {
        if (!this.visible) {
            return;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positions);
        gl.vertexAttribPointer(this.shader.attributes["vertexPosition"], 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.shader.attributes["vertexPosition"]);
        gl.useProgram(this.shader.program);
        gl.uniformMatrix4fv(this.shader.attributes["projectionMatrix"], false, camera.getProjectionMatrix().elements);
        gl.uniformMatrix4fv(this.shader.attributes["modelViewMatrix"], false, this.transform.times(camera.transform).elements);
        gl.uniform3f(this.shader.attributes["scale"], this.scale.x, this.scale.y, this.scale.z);
        gl.depthFunc(gl.GREATER);
        gl.depthMask(false);
        gl.uniform4f(this.shader.attributes["color"], this.colorOccluded.x, this.colorOccluded.y, this.colorOccluded.z, this.alphaOccluded);
        gl.drawArrays(gl.LINES, 0, 24);
        gl.depthFunc(gl.LEQUAL);
        gl.depthMask(true);
        gl.uniform4f(this.shader.attributes["color"], this.color.x, this.color.y, this.color.z, this.alpha);
        gl.drawArrays(gl.LINES, 0, 24);
    };
    return WireframeBox;
}());
var WireframeRenderer = /** @class */ (function () {
    function WireframeRenderer() {
        this.enabled = true;
        this.color = new Vector3(0.0, 0.0, 0.0);
        this.alpha = 0.5;
        this.shader = new Shader(SIMPLE_VERTEX_SHADER, COLOR_FRAGMENT_SHADER);
        this.shader.setAttribute("vertexPosition");
        this.shader.setUniform("projectionMatrix");
        this.shader.setUniform("modelViewMatrix");
        this.shader.setUniform("color");
        this.shader.setUniform("scale");
        this.transform = Matrix4.getIdentity();
    }
    WireframeRenderer.prototype.setMesh = function (mesh) {
        this.vertexCount = mesh.getVertexCount() * 2;
        this.vertices = mesh.createWireframeVertexBuffer();
    };
    WireframeRenderer.prototype.render = function (camera) {
        if (!this.enabled) {
            return;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
        gl.vertexAttribPointer(this.shader.attributes["vertexPosition"], 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.shader.attributes["vertexPosition"]);
        gl.useProgram(this.shader.program);
        gl.uniformMatrix4fv(this.shader.attributes["projectionMatrix"], false, camera.getProjectionMatrix().elements);
        gl.uniformMatrix4fv(this.shader.attributes["modelViewMatrix"], false, this.transform.times(camera.transform).elements);
        gl.uniform3f(this.shader.attributes["scale"], 1, 1, 1);
        gl.uniform4f(this.shader.attributes["color"], this.color.x, this.color.y, this.color.z, this.alpha);
        gl.drawArrays(gl.LINES, 0, this.vertexCount);
    };
    return WireframeRenderer;
}());
var VERTEX_SHADER = "\n    attribute vec4 vertexPosition;\n    attribute vec4 normal;\n\n    uniform mat4 modelViewMatrix;\n    uniform mat4 projectionMatrix;\n\n    varying vec3 v2fNormal;\n\n    void main() {\n        v2fNormal = (modelViewMatrix * vec4(normal.xyz, 0.0)).xyz;\n        gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;\n    }\n";
var FRAGMENT_SHADER = "\n    precision mediump float;\n\n    const vec3 lightDirection = vec3(-0.7, -0.7, 0.14);\n    const float ambient = 0.2;\n    const float diffuse = 0.8;\n    const float specular = 0.3;\n    const vec3 viewDirection = vec3(0.0, 0.0, 1.0);\n\n    varying vec3 v2fNormal;\n\n    uniform vec3 albedo;\n    uniform float alpha;\n\n    void main() {\n        vec3 color = albedo * (ambient\n             + diffuse * (0.5 + 0.5 * dot(lightDirection, v2fNormal))\n             + specular * pow(max(0.0, dot(reflect(-lightDirection, v2fNormal), viewDirection)), 2.0));\n\n        gl_FragColor = vec4(color.r, color.g, color.b, alpha);\n    }\n";
var NORMAL_FRAGMENT_SHADER = "\n    precision mediump float;\n\n    varying vec3 v2fNormal;\n\n    void main() {\n        vec3 normal = vec3(0.5) + 0.5 * normalize(v2fNormal);\n        gl_FragColor = vec4(normal, 1.0);\n    }\n";
var COUNTOUR_VERTEX = "\n    attribute vec2 vertexPosition;\n\n    varying vec2 uv;\n\n    void main() {\n        uv = vertexPosition / 2.0 + vec2(0.5);\n        gl_Position = vec4(vertexPosition, 0.0, 1.0);\n    }\n";
var CONTOUR_FRAGMENT = "\n    precision mediump float;\n\n    uniform sampler2D normalTexture;\n    uniform sampler2D depthTexture;\n    uniform vec2 resolution;\n\n    varying vec2 uv;\n    \n    const float NORMAL_THRESHOLD = 0.5;\n\n    vec3 getNormal(vec2 uv) {\n        vec4 sample = texture2D(normalTexture, uv);\n        return 2.0 * sample.xyz - vec3(1.0);\n    }\n\n    float getDepth(vec2 uv) {\n        return texture2D(depthTexture, uv).r;\n    }\n\n    bool isContour(vec2 uv, float referenceDepth, vec3 referenceNormal) {\n        float depth = getDepth(uv);\n        vec3 normal = getNormal(uv);\n        float angle = abs(referenceNormal.z);\n        \n        float threshold = mix(0.005, 0.0001, pow(-referenceNormal.z, 0.5));\n\n        if (abs(depth - referenceDepth) > threshold) {\n            return true;\n        }\n\n        if (abs(dot(normal, referenceNormal)) < NORMAL_THRESHOLD) {\n            return true;\n        }\n\n        return false;\n    }\n\n    void main() {\n        vec2 pixelSize = vec2(1.0 / resolution.x, 1.0 / resolution.y);\n\n        float depth = getDepth(uv);\n        vec3 normal = getNormal(uv);\n\n        float contour = 0.0;\n        float count = 0.0;\n\n        for (float x = -1.0; x <= 1.0; x++) {\n            for (float y = -1.0; y <= 1.0; y++) {\n                if ((x != 0.0 || y != 0.0) && isContour(uv + pixelSize * vec2(x, y), depth, normal)) {\n                    count++;\n                }\n            }\n        }\n        contour = count == 1.0 ? 0.0 : clamp(0.0, 1.0, (count - 0.2) / 5.0);\n\n        gl_FragColor = vec4(vec3(0.0), contour);\n    }\n";
var SIMPLE_VERTEX_SHADER = "\n    attribute vec4 vertexPosition;\n\n    uniform mat4 modelViewMatrix;\n    uniform mat4 projectionMatrix;\n\n    uniform vec3 scale;\n\n    void main() {\n        gl_Position = projectionMatrix * modelViewMatrix * vec4((vertexPosition.xyz * scale), vertexPosition.a);\n    }\n";
var COLOR_FRAGMENT_SHADER = "\n    precision mediump float;\n\n    uniform vec4 color;\n\n    void main() {\n        gl_FragColor = color;\n    }\n";
//# sourceMappingURL=app.js.map