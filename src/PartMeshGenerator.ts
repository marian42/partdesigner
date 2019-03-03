class PartMeshGenerator extends MeshGenerator {
    private smallBlocks: VectorDictionary<SmallBlock>;
    private tinyBlocks: VectorDictionary<TinyBlock>;   

    constructor(part: Part) {
        super();
        this.smallBlocks = part.createSmallBlocks();
        this.createTinyBlocks();
        this.renderTinyBlockFaces();
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

        //for testing:
        return true;
        
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