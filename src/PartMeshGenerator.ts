class PartMeshGenerator extends MeshGenerator {
    private smallBlocks: VectorDictionary<SmallBlock>;
    private tinyBlocks: VectorDictionary<TinyBlock>;   

    constructor(part: Part) {
        super();
        this.smallBlocks = part.createSmallBlocks();
        this.updateRounded();
        this.createTinyBlocks();
        this.renderTinyBlocks();
        this.renderTinyBlockFaces();
    }

    private updateRounded() {
        for (var block of this.smallBlocks.values()) {
            block.rounded = block.rounded && this.canBeRounded(block);
            if (isAttachment(block.type)) {
                block.rounded = true;
            }
        }
    }

    private canBeRounded(block: SmallBlock): boolean {
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
        if ((neighbor1 == null || (isAttachment(neighbor1.type) && neighbor1.forward().dot(block.right()) == 0))
            && (neighbor2 == null || (isAttachment(neighbor2.type) && neighbor2.forward().dot(block.up()) == 0))) {
            return true;
        }
        return false;
    }

    private createTinyBlocks() {
        this.tinyBlocks = new VectorDictionary<TinyBlock>();

        for (let block of this.smallBlocks.values()) {
            if (isAttachment(block.type)) {
                continue;
            }

            let pos = block.position;
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

        for (let block of this.smallBlocks.values()) {
            if (!isAttachment(block.type)) {
                continue;
            }
            for (var a = -2; a <= 2; a++) {
                var neighbor = block.position.plus(block.forward().times(sign(a)));
                if (!this.smallBlocks.containsKey(neighbor) || (Math.abs(a) >= 2 && isAttachment(this.smallBlocks.get(neighbor).type))) {
                    continue;
                }

                for (var b = -1; b <= 0; b++) {
                    for (var c = -1; c <= 0; c++) {
                        this.createTinyBlock(block.position.times(3).plus(block.forward().times(a)).plus(block.horizontal().times(b)).plus(block.vertical().times(c)), block);
                    }
                }
            }
        }
    }

    private isSmallBlock(position: Vector3): boolean {
        return this.smallBlocks.containsKey(position) && !isAttachment(this.smallBlocks.get(position).type);
    }

    private createTinyBlock(position: Vector3, source: SmallBlock) {
        this.tinyBlocks.set(position, new TinyBlock(position, source));
    }

    private isFaceVisible(block: TinyBlock, direction: Vector3): boolean {
        if (this.tinyBlocks.containsKey(block.position.plus(direction))) {
            return false;
        }
        
        if (direction.dot(block.forward()) == 0) {
            // side face
            return !block.rounded
                || direction.dot(block.horizontal()) < 0
                || direction.dot(block.vertical()) < 0;
        } else {
            // front / back face
            return block.localPositon().dot(block.right()) == block.directionX()
                || block.localPositon().dot(block.up()) == block.directionY()
                || this.smallBlocks.containsKey(block.smallBlockPosition().plus(direction)) && 
                    (!isAttachment(this.smallBlocks.get(block.smallBlockPosition().plus(direction)).type) || this.smallBlocks.get(block.smallBlockPosition().plus(direction)).orientation == block.orientation);
        }
    }

    private createTinyFace(block: TinyBlock, v1: Vector3, v2: Vector3, v3: Vector3, v4: Vector3, flipped = false) {
        let pos = block.position;
        let size = block.forward().times(block.mergedBlocks).plus(block.right()).plus(block.up());

        this.createQuad(
            tinyBlockToWorld(pos.plus(v1.elementwiseMultiply(size))),
            tinyBlockToWorld(pos.plus(v2.elementwiseMultiply(size))),
            tinyBlockToWorld(pos.plus(v3.elementwiseMultiply(size))),
            tinyBlockToWorld(pos.plus(v4.elementwiseMultiply(size))),
            flipped);
    }

    private getNextBlock(block: TinyBlock): TinyBlock {
        return this.tinyBlocks.getOrNull(block.position.plus(block.forward().times(block.mergedBlocks)));
    }

    private getPreviousBlock(block: TinyBlock): TinyBlock {
        return this.tinyBlocks.getOrNull(block.position.minus(block.forward()));
    }

    private hasOpenEnd(block: TinyBlock): boolean {
        var pos = block.position;
        return !this.tinyBlocks.containsKey(pos.plus(block.forward().times(block.mergedBlocks)))
            && !this.tinyBlocks.containsKey(pos.plus(block.forward().times(block.mergedBlocks)).minus(block.horizontal().times(3)))
            && !this.tinyBlocks.containsKey(pos.plus(block.forward().times(block.mergedBlocks)).minus(block.vertical().times(3)))
            && !this.tinyBlocks.containsKey(pos.plus(block.forward().times(block.mergedBlocks)).minus(block.horizontal().times(3)).minus(block.vertical().times(3)));
    }

    private hasOpenStart(block: TinyBlock): boolean {
        var pos = block.position;
        return !this.tinyBlocks.containsKey(pos.minus(block.forward()))
            && !this.tinyBlocks.containsKey(pos.minus(block.forward()).minus(block.horizontal().times(3)))
            && !this.tinyBlocks.containsKey(pos.minus(block.forward()).minus(block.vertical().times(3)))
            && !this.tinyBlocks.containsKey(pos.minus(block.forward()).minus(block.horizontal().times(3)).minus(block.vertical().times(3)));
    }

    private renderTinyBlocks() {
        for (let block of this.tinyBlocks.values()) {
            if (block.merged || !block.isCenter() || isAttachment(block.type)) {
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
            }

            // Front cap
            if (previousBlock == null) {
                this.createCircleWithHole(block, block.hasInterior && hasOpenStart ? INTERIOR_RADIUS : 0, 0.5 - EDGE_MARGIN, 0, true, !block.rounded);
            }

            if (block.rounded) {
                // Rounded corners
                this.createCylinder(block, 0, 0.5 - EDGE_MARGIN, distance);

                // Rounded to non rounded adapter
                if (nextBlock != null && !nextBlock.rounded) {
                    this.createCircleWithHole(block, 0.5 - EDGE_MARGIN, 0.5 - EDGE_MARGIN, distance, true, true);
                }
                if (previousBlock != null && !previousBlock.rounded) {
                    this.createCircleWithHole(block, 0.5 - EDGE_MARGIN, 0.5 - EDGE_MARGIN, 0, false, true);
                }
            }
        }
    }

    private renderTinyBlockFaces() {
        for (let block of this.tinyBlocks.values()) {
            if (block.merged || isAttachment(block.type)) {
                continue;
            }
            let size = block.forward().times(block.mergedBlocks).plus(block.right()).plus(block.up());

            if (this.isFaceVisible(block, new Vector3(size.x, 0, 0))) {
                this.createTinyFace(block,
                    new Vector3(1, 0, 0),
                    new Vector3(1, 0, 1),
                    new Vector3(1, 1, 1),
                    new Vector3(1, 1, 0), true);
            }
            if (this.isFaceVisible(block, new Vector3(-size.x, 0, 0))) {
                this.createTinyFace(block,
                    new Vector3(0, 0, 0),
                    new Vector3(0, 0, 1),
                    new Vector3(0, 1, 1),
                    new Vector3(0, 1, 0));
            }
            if (this.isFaceVisible(block, new Vector3(0, size.y, 0))) {
                this.createTinyFace(block,
                    new Vector3(0, 1, 0),
                    new Vector3(0, 1, 1),
                    new Vector3(1, 1, 1),
                    new Vector3(1, 1, 0));
            }
            if (this.isFaceVisible(block, new Vector3(0, -size.y, 0))) {
                this.createTinyFace(block,
                    new Vector3(0, 0, 0),
                    new Vector3(0, 0, 1),
                    new Vector3(1, 0, 1),
                    new Vector3(1, 0, 0), true);
            }
            if (this.isFaceVisible(block, new Vector3(0, 0, size.z))) {
                this.createTinyFace(block,
                    new Vector3(0, 0, 1),
                    new Vector3(0, 1, 1),
                    new Vector3(1, 1, 1),
                    new Vector3(1, 0, 1), true);
            }
            if (this.isFaceVisible(block, new Vector3(0, 0, -size.z))) {
                this.createTinyFace(block,
                    new Vector3(0, 0, 0),
                    new Vector3(0, 1, 0),
                    new Vector3(1, 1, 0),
                    new Vector3(1, 0, 0));
            }
        }
    }
}