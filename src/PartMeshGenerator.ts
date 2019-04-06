class PartMeshGenerator extends MeshGenerator {
    private smallBlocks: VectorDictionary<SmallBlock>;
    private tinyBlocks: VectorDictionary<TinyBlock>;   

    constructor(part: Part) {
        super();
        this.smallBlocks = part.createSmallBlocks();
        this.createDummyBlocks();
        this.updateRounded();
        this.createTinyBlocks();
        this.processTinyBlocks();
        this.checkInteriors();
        this.mergeSimilarBlocks();
        this.renderTinyBlocks();
        this.renderAttachments();
        this.renderTinyBlockFaces();
    }

    private updateRounded() {
        for (var block of this.smallBlocks.values()) {
            block.rounded = block.rounded && this.canBeRounded(block);
            if (block.isAttachment()) {
                block.rounded = true;
            }
        }
    }

    private createDummyBlocks() {
        var addedAnything = false;
		for (var block of this.smallBlocks.values()) {
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
				var count = countInArray(affectedPositions, (p) => this.smallBlocks.containsKey(p.plus(block.forward().times(forwardDirection))));
				if (count != 0 && count != 4) {
					var source = new Block(block.orientation, BlockType.Solid, true);
					for (var position of affectedPositions) {
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
        if ((neighbor1 == null || (neighbor1.isAttachment() && neighbor1.forward().dot(block.right()) == 0))
            && (neighbor2 == null || (neighbor2.isAttachment() && neighbor2.forward().dot(block.up()) == 0))) {
            return true;
        }
        return false;
    }

    private createTinyBlocks() {
        this.tinyBlocks = new VectorDictionary<TinyBlock>();

        for (let block of this.smallBlocks.values()) {
            if (block.isAttachment()) {
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
    }

    private isTinyBlock(position: Vector3): boolean {
        return this.tinyBlocks.containsKey(position) && !this.tinyBlocks.get(position).isAttachment();
    }

    private processTinyBlocks() {
        // Disable interiors when adjacent quadrants are missing
		for (var block of this.tinyBlocks.values()) {
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
		for (var smallBlock of this.smallBlocks.values()) {
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
						} else {
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
						} else {
							this.createTinyBlock(to, this.tinyBlocks.get(from));
						}
					}
				}
			}
		}
    }

    // Sets HasInterior to false for all tiny blocks that do not form coherent blocks with their neighbors
	private checkInteriors() {
        for (var block of this.tinyBlocks.values()) {
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
					} else {
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
    }

    private mergeSimilarBlocks() {
        for (var block of this.tinyBlocks.values()) {
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
    }

    private isSmallBlock(position: Vector3): boolean {
        return this.smallBlocks.containsKey(position) && !this.smallBlocks.get(position).isAttachment();
    }

    private createTinyBlock(position: Vector3, source: SmallBlock) {
        this.tinyBlocks.set(position, new TinyBlock(position, source));
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
	
	private hideStartEndFaces(position: Vector3, block: TinyBlock, forward: boolean) {
		var direction = forward ? block.forward() : block.forward().times(-1);
		this.hideFaceIfExists(position, direction);
		this.hideFaceIfExists(position.minus(block.horizontal()), direction);
		this.hideFaceIfExists(position.minus(block.vertical()), direction);
		this.hideFaceIfExists(position.minus(block.vertical()).minus(block.horizontal()), direction);
	}

	private hideFaceIfExists(position: Vector3, direction: Vector3) {
		if (this.tinyBlocks.containsKey(position)) {
			this.tinyBlocks.get(position).hideFace(direction);
		}
	}

	private hideOutsideFaces(centerBlock: TinyBlock) {
		var vertical = centerBlock.vertical();
		var horizontal = centerBlock.horizontal();
		centerBlock.hideFace(vertical);
		centerBlock.hideFace(horizontal);
		this.tinyBlocks.get(centerBlock.position.minus(vertical)).hideFace(horizontal);
		this.tinyBlocks.get(centerBlock.position.minus(horizontal)).hideFace(vertical);
	}

    private renderTinyBlocks() {
        for (let block of this.tinyBlocks.values()) {
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
                } else if (block.type == BlockType.AxleHole) {
                    this.renderAxleHoleInterior(block);
                }
            }
        }
    }

    private renderAttachments() {
        for (var block of this.tinyBlocks.values()) {
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
	}

	private renderLip(block: TinyBlock, zOffset: number) {		
		var center = block.getCylinderOrigin().plus(block.forward().times(zOffset));
		
		for (var i = 0; i < SUBDIVISIONS; i++) {
			var out1 = block.getOnCircle(i / 2 * Math.PI / SUBDIVISIONS);
			var out2 = block.getOnCircle((i + 1) / 2 * Math.PI / SUBDIVISIONS);

			for (var j = 0; j < LIP_SUBDIVISIONS; j++) {
				var angleJ = j * Math.PI / LIP_SUBDIVISIONS;
				var angleJ2 = (j + 1) * Math.PI / LIP_SUBDIVISIONS;
				this.createQuadWithNormals(
					center.plus(out1.times(PIN_RADIUS)).plus(out1.times(Math.sin(angleJ) * PIN_LIP_RADIUS).plus(block.forward().times(Math.cos(angleJ) * PIN_LIP_RADIUS))),
					center.plus(out2.times(PIN_RADIUS)).plus(out2.times(Math.sin(angleJ) * PIN_LIP_RADIUS).plus(block.forward().times(Math.cos(angleJ) * PIN_LIP_RADIUS))),
					center.plus(out2.times(PIN_RADIUS)).plus(out2.times(Math.sin(angleJ2) * PIN_LIP_RADIUS).plus(block.forward().times(Math.cos(angleJ2) * PIN_LIP_RADIUS))),
					center.plus(out1.times(PIN_RADIUS)).plus(out1.times(Math.sin(angleJ2) * PIN_LIP_RADIUS).plus(block.forward().times(Math.cos(angleJ2) * PIN_LIP_RADIUS))),
					out1.times(-Math.sin(angleJ)).plus(block.forward().times(-Math.cos(angleJ))),
					out2.times(-Math.sin(angleJ)).plus(block.forward().times(-Math.cos(angleJ))),
					out2.times(-Math.sin(angleJ2)).plus(block.forward().times(-Math.cos(angleJ2))),
					out1.times(-Math.sin(angleJ2)).plus(block.forward().times(-Math.cos(angleJ2))));
			}
		}
	}

    private renderPin(block: TinyBlock) {
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
    }

    private renderAxle(block: TinyBlock) {
		var nextBlock = this.getNextBlock(block);
		var previousBlock = this.getPreviousBlock(block);
		
		var start = block.getCylinderOrigin();
		var end = start.plus(block.forward().times(block.getDepth()));

		this.createQuad(
            start.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_INNER)),
            start.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_OUTER)),
            end.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_OUTER)),
            end.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_INNER)), block.odd());
		this.createQuad(
			start.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_INNER)),
			start.plus(block.horizontal().times(AXLE_SIZE_OUTER)).plus(block.vertical().times(AXLE_SIZE_INNER)),
			end.plus(block.horizontal().times(AXLE_SIZE_OUTER)).plus(block.vertical().times(AXLE_SIZE_INNER)),
			end.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_INNER)), !block.odd());
		this.createQuad(
			end.plus(block.horizontal().times(AXLE_SIZE_OUTER)),
			start.plus(block.horizontal().times(AXLE_SIZE_OUTER)),
			start.plus(block.horizontal().times(AXLE_SIZE_OUTER)).plus(block.vertical().times(AXLE_SIZE_INNER)),
			end.plus(block.horizontal().times(AXLE_SIZE_OUTER)).plus(block.vertical().times(AXLE_SIZE_INNER)), block.odd());
		this.createQuad(
			end.plus(block.vertical().times(AXLE_SIZE_OUTER)),
			start.plus(block.vertical().times(AXLE_SIZE_OUTER)),
			start.plus(block.vertical().times(AXLE_SIZE_OUTER)).plus(block.horizontal().times(AXLE_SIZE_INNER)),
			end.plus(block.vertical().times(AXLE_SIZE_OUTER)).plus(block.horizontal().times(AXLE_SIZE_INNER)), !block.odd());

		if (nextBlock == null) {
			this.createQuad(
				end.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_INNER)),
				end.plus(block.vertical().times(AXLE_SIZE_INNER)),
				end,
				end.plus(block.horizontal().times(AXLE_SIZE_INNER)), block.odd());
			this.createQuad(
				end.plus(block.horizontal().times(AXLE_SIZE_INNER)),
				end.plus(block.horizontal().times(AXLE_SIZE_OUTER)),
				end.plus(block.horizontal().times(AXLE_SIZE_OUTER)).plus(block.vertical().times(AXLE_SIZE_INNER)),
				end.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_INNER)), block.odd());
			this.createQuad(
				end.plus(block.vertical().times(AXLE_SIZE_INNER)),
				end.plus(block.vertical().times(AXLE_SIZE_OUTER)),
				end.plus(block.vertical().times(AXLE_SIZE_OUTER)).plus(block.horizontal().times(AXLE_SIZE_INNER)),
				end.plus(block.vertical().times(AXLE_SIZE_INNER)).plus(block.horizontal().times(AXLE_SIZE_INNER)), !block.odd());
		}
		if (previousBlock == null) {
			this.createQuad(
				start.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_INNER)),
				start.plus(block.vertical().times(AXLE_SIZE_INNER)),
				start,
				start.plus(block.horizontal().times(AXLE_SIZE_INNER)), !block.odd());
			this.createQuad(
				start.plus(block.horizontal().times(AXLE_SIZE_INNER)),
				start.plus(block.horizontal().times(AXLE_SIZE_OUTER)),
				start.plus(block.horizontal().times(AXLE_SIZE_OUTER)).plus(block.vertical().times(AXLE_SIZE_INNER)),
				start.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_INNER)), !block.odd());
			this.createQuad(
				start.plus(block.vertical().times(AXLE_SIZE_INNER)),
				start.plus(block.vertical().times(AXLE_SIZE_OUTER)),
				start.plus(block.vertical().times(AXLE_SIZE_OUTER)).plus(block.horizontal().times(AXLE_SIZE_INNER)),
				start.plus(block.vertical().times(AXLE_SIZE_INNER)).plus(block.horizontal().times(AXLE_SIZE_INNER)), block.odd());
		}

		if (nextBlock != null && nextBlock.type != block.type && !nextBlock.rounded) {
			this.createQuad(
				end.plus(block.horizontal().times((0.5 - EDGE_MARGIN))),
				end.plus(block.horizontal().times(AXLE_SIZE_OUTER)),
				end.plus(block.horizontal().times(AXLE_SIZE_OUTER)).plus(block.vertical().times(AXLE_SIZE_INNER)),
				end.plus(block.horizontal().times((0.5 - EDGE_MARGIN))).plus(block.vertical().times(AXLE_SIZE_INNER)), block.odd());
			this.createQuad(
				end.plus(block.vertical().times((0.5 - EDGE_MARGIN))),
				end.plus(block.vertical().times(AXLE_SIZE_OUTER)),
				end.plus(block.vertical().times(AXLE_SIZE_OUTER)).plus(block.horizontal().times(AXLE_SIZE_INNER)),
				end.plus(block.vertical().times((0.5 - EDGE_MARGIN))).plus(block.horizontal().times(AXLE_SIZE_INNER)), !block.odd());
			this.createQuad(
				end.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_INNER)),
				end.plus(block.horizontal().times((0.5 - EDGE_MARGIN))).plus(block.vertical().times(AXLE_SIZE_INNER)),
				end.plus(block.horizontal().times((0.5 - EDGE_MARGIN))).plus(block.vertical().times((0.5 - EDGE_MARGIN))),
				end.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times((0.5 - EDGE_MARGIN))), !block.odd());
		}
		if (previousBlock != null && previousBlock.type != block.type && !previousBlock.rounded) {
			this.createQuad(
				start.plus(block.horizontal().times((0.5 - EDGE_MARGIN))),
				start.plus(block.horizontal().times(AXLE_SIZE_OUTER)),
				start.plus(block.horizontal().times(AXLE_SIZE_OUTER)).plus(block.vertical().times(AXLE_SIZE_INNER)),
				start.plus(block.horizontal().times((0.5 - EDGE_MARGIN))).plus(block.vertical().times(AXLE_SIZE_INNER)), !block.odd());
			this.createQuad(
				start.plus(block.vertical().times((0.5 - EDGE_MARGIN))),
				start.plus(block.vertical().times(AXLE_SIZE_OUTER)),
				start.plus(block.vertical().times(AXLE_SIZE_OUTER)).plus(block.horizontal().times(AXLE_SIZE_INNER)),
				start.plus(block.vertical().times((0.5 - EDGE_MARGIN))).plus(block.horizontal().times(AXLE_SIZE_INNER)), block.odd());
			this.createQuad(
				start.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_INNER)),
				start.plus(block.horizontal().times((0.5 - EDGE_MARGIN))).plus(block.vertical().times(AXLE_SIZE_INNER)),
				start.plus(block.horizontal().times((0.5 - EDGE_MARGIN))).plus(block.vertical().times((0.5 - EDGE_MARGIN))),
				start.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times((0.5 - EDGE_MARGIN))), block.odd());
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
    }
    
    private createAxleToCircleAdapter(center: Vector3, block: SmallBlock, radius: number, flipped = false) {
		for (var i = 0; i < SUBDIVISIONS; i++) {
			var focus = center.copy();
			if (i < SUBDIVISIONS / 2 == !block.odd()) {
				focus = focus.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_OUTER));
			} else {
				focus = focus.plus(block.horizontal().times(AXLE_SIZE_OUTER)).plus(block.vertical().times(AXLE_SIZE_INNER));
			}

			this.triangles.push(new Triangle(focus,
				center.plus(block.getOnCircle(Math.PI / 2 * i / SUBDIVISIONS, radius)),
				center.plus(block.getOnCircle(Math.PI / 2 * (i + 1) / SUBDIVISIONS, radius)), flipped));
		}
		this.triangles.push(new Triangle(
			center.plus(block.horizontal().times(AXLE_SIZE_INNER)).plus(block.vertical().times(AXLE_SIZE_OUTER)),
			center.plus(block.vertical().times(AXLE_SIZE_OUTER)),
			center.plus(block.vertical().times(radius)), block.odd() != flipped));
		this.triangles.push(new Triangle(
			center.plus(block.vertical().times(AXLE_SIZE_INNER)).plus(block.horizontal().times(AXLE_SIZE_OUTER)),
			center.plus(block.horizontal().times(AXLE_SIZE_OUTER)),
			center.plus(block.horizontal().times(radius)), block.odd() == flipped));
		this.createQuad(
			center.plus(block.vertical().times(AXLE_SIZE_INNER)).plus(block.horizontal().times(AXLE_SIZE_INNER)),
			center.plus(block.vertical().times(AXLE_SIZE_OUTER)).plus(block.horizontal().times(AXLE_SIZE_INNER)),
			center.plus(block.getOnCircle(45 * DEG_TO_RAD, radius)),
			center.plus(block.vertical().times(AXLE_SIZE_INNER)).plus(block.horizontal().times(AXLE_SIZE_OUTER)), block.odd() != flipped);
	}

    private showInteriorCap(currentBlock: SmallBlock, neighbor: SmallBlock): boolean {
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
    }

    private renderPinHoleInterior(block: TinyBlock) {
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
    }

    private renderAxleHoleInterior(block: TinyBlock) {
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
		this.createQuad(
			start.plus(block.horizontal().times(AXLE_HOLE_SIZE)).plus(block.vertical().times(AXLE_HOLE_SIZE)),
			start.plus(block.getOnCircle(axleWingAngle, adjustedRadius)),
			end.plus(block.getOnCircle(axleWingAngle, adjustedRadius)),
			end.plus(block.horizontal().times(AXLE_HOLE_SIZE)).plus(block.vertical().times(AXLE_HOLE_SIZE)),
			true);
		this.createQuad(
			start.plus(block.horizontal().times(AXLE_HOLE_SIZE)).plus(block.vertical().times(AXLE_HOLE_SIZE)),
			start.plus(block.getOnCircle(axleWingAngle2, adjustedRadius)),
			end.plus(block.getOnCircle(axleWingAngle2, adjustedRadius)),
			end.plus(block.horizontal().times(AXLE_HOLE_SIZE)).plus(block.vertical().times(AXLE_HOLE_SIZE)),
			false);

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
				this.createQuadWithNormals(
					start.plus(v1.times(radius1Inside)),
					start.plus(v2.times(radius2Inside)),
					end.plus(v2.times(radius2Inside)),
                    end.plus(v1.times(radius1Inside)),
					v1, v2, v2, v1, false);
			}

			// Outside caps
			if (hasOpenStart || (previousBlock != null && previousBlock.type == BlockType.PinHole && !showInteriorStartCap)) {
				if (angle2 > axleWingAngle && angle1 < axleWingAngle2) {
					this.triangles.push(new Triangle(
						start.plus(block.horizontal().times(AXLE_HOLE_SIZE)).plus(block.vertical().times(AXLE_HOLE_SIZE)),
						start.plus(block.getOnCircle(startAngleOutside, radius1Outside)),
						start.plus(block.getOnCircle(endAngleOutside, radius2Outside))));
				}
			}
			if (hasOpenEnd || (nextBlock != null && nextBlock.type == BlockType.PinHole && !showInteriorEndCap)) {
				if (angle2 > axleWingAngle && angle1 < axleWingAngle2) {
					this.triangles.push(new Triangle(
						end.plus(block.horizontal().times(AXLE_HOLE_SIZE)).plus(block.vertical().times(AXLE_HOLE_SIZE)),
						end.plus(block.getOnCircle(endAngleOutside, radius2Outside)),
						end.plus(block.getOnCircle(startAngleOutside, radius1Outside))));
				}
			}

			// Inside caps
			if (showInteriorEndCap && (angle1 < axleWingAngle || angle2 > axleWingAngle2)) {
				this.triangles.push(new Triangle(
					end,
					end.plus(block.getOnCircle(startAngleInside, radius1Outside)),
					end.plus(block.getOnCircle(endAngleInside, radius2Outside))));
			}
			if (showInteriorStartCap && (angle1 < axleWingAngle || angle2 > axleWingAngle2)) {
				this.triangles.push(new Triangle(
					start,
					start.plus(block.getOnCircle(endAngleInside, radius2Outside)),
					start.plus(block.getOnCircle(startAngleInside, radius1Outside))));
			}
		}
		if (hasOpenEnd) {
			this.createCircleWithHole(block, PIN_HOLE_RADIUS, INTERIOR_RADIUS, distance, false);
		}

		if (hasOpenStart) {
			this.createCircleWithHole(block, PIN_HOLE_RADIUS, INTERIOR_RADIUS, 0, true);
		}

		if (showInteriorEndCap) {
			this.triangles.push(new Triangle(
				end.plus(block.horizontal().times(AXLE_HOLE_SIZE)).plus(block.vertical().times(AXLE_HOLE_SIZE)),
				end,
				end.plus(block.getOnCircle(axleWingAngle, adjustedRadius))));
			this.triangles.push(new Triangle(
				end,
				end.plus(block.horizontal().times(AXLE_HOLE_SIZE)).plus(block.vertical().times(AXLE_HOLE_SIZE)),
				end.plus(block.getOnCircle(axleWingAngle2, adjustedRadius))));
		}
		if (showInteriorStartCap) {
			this.triangles.push(new Triangle(
				start,
				start.plus(block.horizontal().times(AXLE_HOLE_SIZE)).plus(block.vertical().times(AXLE_HOLE_SIZE)),
				start.plus(block.getOnCircle(axleWingAngle, adjustedRadius))));
			this.triangles.push(new Triangle(
				start.plus(block.horizontal().times(AXLE_HOLE_SIZE)).plus(block.vertical().times(AXLE_HOLE_SIZE)),
				start,
				start.plus(block.getOnCircle(axleWingAngle2, adjustedRadius))));
		}
	}

    private isFaceVisible(position: Vector3, direction: Vector3): boolean {
		var block = this.tinyBlocks.getOrNull(position);
		return block != null
			&& !this.isTinyBlock(block.position.plus(direction))
			&& !block.isAttachment()
			&& block.isFaceVisible(direction);
	}

    private createTinyFace(position: Vector3, size: Vector3, direction: Vector3) {
		var vertices: Vector3[] = null;

		if (direction.x > 0) {
			vertices = RIGHT_FACE_VERTICES;
		} else if (direction.x < 0) {
			vertices = LEFT_FACE_VERTICES;
		} else if (direction.y > 0) {
			vertices = UP_FACE_VERTICES;
		} else if (direction.y < 0) {
			vertices = DOWN_FACE_VERTICES;
		} else if (direction.z > 0) {
			vertices = FORWARD_FACE_VERTICES;
		} else if (direction.z < 0) {
			vertices = BACK_FACE_VERTICES;
		} else {
			throw new Error("Invalid direction: " + direction.toString());
		}
        
        this.createQuad(
            tinyBlockToWorld(position.plus(vertices[0].elementwiseMultiply(size))),
            tinyBlockToWorld(position.plus(vertices[1].elementwiseMultiply(size))),
            tinyBlockToWorld(position.plus(vertices[2].elementwiseMultiply(size))),
            tinyBlockToWorld(position.plus(vertices[3].elementwiseMultiply(size))));
	}

	private isRowOfVisibleFaces(position: Vector3, rowDirection: Vector3, faceDirection: Vector3, count: number): boolean {
		for (var i = 0; i < count; i++) {
			if (!this.isFaceVisible(position.plus(rowDirection.times(i)), faceDirection)) {
				return false;
			}
		}
		return true;
	}

	/* Finds a connected rectangle of visible faces in the given direction by starting with
	the supplied position and a rectangle of size 1x1 and expanding it in the 4 directions
	that are tangential to the supplied face direction, until it is no longer possible to
	expand in any direction. 
	Returns the lower left corner of the rectangle and its size.
	The component of the size vector of the direction supplied by the direction parameter is
	always 1. The component of the position vector in the direction supplied by the direction
	parameter remains unchanged. */
	private findConnectedFaces(position: Vector3, direction: Vector3): [Vector3, Vector3] {
		var tangent1 = new Vector3(direction.x == 0 ? 1 : 0, direction.x == 0 ? 0 : 1, 0);
		var tangent2 = new Vector3(0, direction.z == 0 ? 0 : 1, direction.z == 0 ? 1 : 0);

		var size = Vector3.one();
		while (true) {
			var hasChanged = false;

			if (this.isRowOfVisibleFaces(position.minus(tangent2), tangent1, direction, size.dot(tangent1))) {
				position = position.minus(tangent2);
				size = size.plus(tangent2);
				hasChanged = true;
			}
			if (this.isRowOfVisibleFaces(position.minus(tangent1), tangent2, direction, size.dot(tangent2))) {
				position = position.minus(tangent1);
				size = size.plus(tangent1);
				hasChanged = true;
			}
			if (this.isRowOfVisibleFaces(position.plus(tangent2.times(size.dot(tangent2))), tangent1, direction, size.dot(tangent1))) {
				size = size.plus(tangent2);
				hasChanged = true;
			}
			if (this.isRowOfVisibleFaces(position.plus(tangent1.times(size.dot(tangent1))), tangent2, direction, size.dot(tangent2))) {
				size = size.plus(tangent1);
				hasChanged = true;
			}

			if (!hasChanged) {
				return [position, size];
			}
		}
	}

	private hideFaces(position: Vector3, size: Vector3, direction: Vector3) {
		for (var x = 0; x < size.x; x++) {
			for (var y = 0; y < size.y; y++) {
				for (var z = 0; z < size.z; z++) {
					this.hideFaceIfExists(new Vector3(position.x + x, position.y + y, position.z + z), direction);
				}
			}
		}
	}

    private renderTinyBlockFaces() {
        for (let block of this.tinyBlocks.values()) {
			for (let direction of FACE_DIRECTIONS) {
				if (!this.isFaceVisible(block.position, direction)) {
					continue;
				}
				var expanded = this.findConnectedFaces(block.position, direction);
				var position = expanded[0];
				var size = expanded[1];
				this.createTinyFace(position, size, direction);
				this.hideFaces(position, size, direction);
			}
		}
    }
}