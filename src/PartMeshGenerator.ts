class PartMeshGenerator extends MeshGenerator {
    private smallBlocks: VectorDictionary<SmallBlock>;
	private tinyBlocks: VectorDictionary<TinyBlock>;

	constructor(part: Part, measurements: Measurements) {
        super(measurements);
        this.smallBlocks = part.createSmallBlocks();
		this.createDummyBlocks();
        this.updateRounded();
        this.createTinyBlocks();
        this.processTinyBlocks();
        this.checkInteriors();
		this.mergeSimilarBlocks();
		this.renderPerpendicularRoundedAdapters();
        this.renderTinyBlocks();
        this.renderAttachments();
        this.renderTinyBlockFaces();
    }

    private updateRounded() {
		var perpendicularRoundedAdapters: SmallBlock[] = [];

        for (var block of this.smallBlocks.values()) {
			if (block.isAttachment()) {
				block.rounded = true;
				continue;
			}
			if (!block.rounded) {
				continue;
			}

			var next = this.smallBlocks.getOrNull(block.position.plus(block.forward()));
			if (next != null && next.orientation == block.orientation && next.quadrant != block.quadrant) {
				block.rounded = false;
				continue;
			}
			var previous = this.smallBlocks.getOrNull(block.position.minus(block.forward()));
			if (previous != null && previous.orientation == block.orientation && previous.quadrant != block.quadrant) {
				block.rounded = false;
				continue;
			}

			var neighbor1 = this.smallBlocks.getOrNull(block.position.plus(block.horizontal()));
			var neighbor2 = this.smallBlocks.getOrNull(block.position.plus(block.vertical()));
			if ((neighbor1 == null || (neighbor1.isAttachment() && neighbor1.forward().dot(block.right()) == 0))
				&& (neighbor2 == null || (neighbor2.isAttachment() && neighbor2.forward().dot(block.up()) == 0))) {
				continue;
			}

			if (this.createPerpendicularRoundedAdapterIfPossible(block)) {
				perpendicularRoundedAdapters.push(block);
				continue;
			}

			block.rounded = false;
		}

		// Remove adapters where the neighbor was later changed from rounded to not rounded
		var anythingChanged: boolean;
		do {
			anythingChanged = false;
			for (var block of perpendicularRoundedAdapters) {
				if (block.perpendicularRoundedAdapter != null && !block.perpendicularRoundedAdapter.neighbor.rounded) {
					block.perpendicularRoundedAdapter = null;
					block.rounded = false;
					anythingChanged = true;
				}
			}
		} while (anythingChanged);
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
	
	private createPerpendicularRoundedAdapterIfPossible(block: SmallBlock): boolean {
		var neighbor1 = this.smallBlocks.getOrNull(block.position.plus(block.horizontal()));
		var neighbor2 = this.smallBlocks.getOrNull(block.position.plus(block.vertical()));
		
		var hasHorizontalNeighbor = neighbor2 == null && neighbor1 != null && neighbor1.forward().dot(block.horizontal()) != 0 && neighbor1.rounded;
		var hasVerticalNeighbor = neighbor1 == null && neighbor2 != null && neighbor2.forward().dot(block.vertical()) != 0 && neighbor2.rounded;
		
		if (hasHorizontalNeighbor == hasVerticalNeighbor) {
			return false;
		}

		var adapter = new PerpendicularRoundedAdapter();
		adapter.directionToNeighbor = hasVerticalNeighbor ? block.vertical() : block.horizontal();
		adapter.isVertical = hasVerticalNeighbor;
		adapter.neighbor = hasHorizontalNeighbor ? neighbor1 : neighbor2;
		adapter.facesForward = block.forward().dot(adapter.neighbor.horizontal().plus(adapter.neighbor.vertical())) < 0;
		adapter.sourceBlock = block;
		
		if (!this.smallBlocks.containsKey(block.position.plus(block.forward().times(adapter.facesForward ? 1 : -1)))) {
			return false;
		}

		block.perpendicularRoundedAdapter = adapter;
		return true;
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
	
	private pushBlock(smallBlock: SmallBlock, forwardFactor: number) {
		var nextBlock = this.smallBlocks.getOrNull(smallBlock.position.plus(smallBlock.forward().times(forwardFactor)));
			
		for (var a = -2; a <= 2; a++) {
			for (var b = -2; b <= 2; b++) {
				var from = smallBlock.position.times(3)
					.plus(smallBlock.right().times(a))
					.plus(smallBlock.up().times(b))
					.plus(smallBlock.forward().times(forwardFactor));
				var to = from.plus(smallBlock.forward().times(forwardFactor));
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

		for (var smallBlock of this.smallBlocks.values()) {
			var nextBlock = this.smallBlocks.getOrNull(smallBlock.position.plus(smallBlock.forward()));
			// Offset rounded to non rounded transitions to make them flush
			if (smallBlock.rounded && nextBlock != null && !nextBlock.rounded && smallBlock.perpendicularRoundedAdapter == null) {
				this.pushBlock(smallBlock, 1);
			}
			var previousBlock = this.smallBlocks.getOrNull(smallBlock.position.minus(smallBlock.forward()));
			// Offset rounded to non rounded transitions to make them flush
			if (smallBlock.rounded && previousBlock != null && !previousBlock.rounded && smallBlock.perpendicularRoundedAdapter == null) {
				this.pushBlock(smallBlock, -1);
			}

			if (smallBlock.rounded && nextBlock != null && nextBlock.rounded && smallBlock.orientation != nextBlock.orientation) {
				this.pushBlock(smallBlock, 1);
			}
			
			if (smallBlock.rounded && previousBlock != null && previousBlock.rounded && smallBlock.orientation != previousBlock.orientation) {
				this.pushBlock(smallBlock, -1);
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
					var neighborPos = block.position.minus(block.horizontal().times(3 * a)).minus(block.vertical().times(3 * b));
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

	private getPerpendicularRoundedNeighborOrNull(block: TinyBlock): SmallBlock {
		var verticalNeighbor = this.smallBlocks.getOrNull(block.smallBlockPosition().plus(block.vertical()));
		var horizontalNeighbor = this.smallBlocks.getOrNull(block.smallBlockPosition().plus(block.horizontal()));
		var neighbor = verticalNeighbor != null ? verticalNeighbor : horizontalNeighbor;
		var verticalOrHorizontal = verticalNeighbor != null ? block.vertical() : block.horizontal();
		if (neighbor != null && neighbor.rounded && neighbor.forward().dot(verticalOrHorizontal) != 0) {
			return neighbor;
		} else {
			return null;
		}
	}

	private getPerpendicularRoundedNeighborOrNull2(block: TinyBlock): SmallBlock {
		var smallBlock = this.smallBlocks.get(block.smallBlockPosition());
		if (smallBlock.perpendicularRoundedAdapter != null) {
			return smallBlock.perpendicularRoundedAdapter.neighbor;
		} else {
			return null;
		}
	}

	
	private preventMergingForPerpendicularRoundedBlock(block1: TinyBlock, block2: TinyBlock): boolean {
		if (!block1.rounded || !block2.rounded || !block1.isCenter()) {
			return false;
		}
		var neighbor1 = this.getPerpendicularRoundedNeighborOrNull(block1);
		var neighbor2 = this.getPerpendicularRoundedNeighborOrNull(block2);

		var inside1 = neighbor1 != null && block1.position.minus(neighbor1.position.times(3)).dot(neighbor1.vertical().plus(neighbor1.horizontal())) <= 0;
		var inside2 = neighbor2 != null && block2.position.minus(neighbor2.position.times(3)).dot(neighbor2.vertical().plus(neighbor2.horizontal())) <= 0;
		
		return inside1 != inside2 || (inside1 && inside2 && !neighbor1.position.equals(neighbor2.position));
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
					|| this.isTinyBlock(block.position.minus(block.up())) != this.isTinyBlock(nextBlock.position.minus(block.up()))
					|| this.preventMergingForPerpendicularRoundedBlock(this.tinyBlocks.get(block.position.plus(block.forward().times(amount))), nextBlock)) {
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
	
	private renderPerpendicularRoundedAdapters() {
		for (var block of this.smallBlocks.values()) {
			if (block.perpendicularRoundedAdapter == null) {
				continue;
			}
			
			var adapter = block.perpendicularRoundedAdapter;
			var center = block.forward().times(this.tinyIndexToWorld(block.forward().dot(block.position) * 3 - (adapter.facesForward ? 0 : 1)))
				.plus(block.right().times((block.position.dot(block.right()) + (1 - block.localX())) * 0.5))
				.plus(block.up().times((block.position.dot(block.up()) + (1 - block.localY())) * 0.5));
			var radius = 0.5 - this.measurements.edgeMargin;
			var forward = block.forward();
								
			for (var i = 0; i < this.measurements.subdivisionsPerQuarter; i++) {
				var angle1 = Math.PI / 2 * i / this.measurements.subdivisionsPerQuarter;
				var angle2 = Math.PI / 2 * (i + 1) / this.measurements.subdivisionsPerQuarter;
				var sincos1 = 1 - (block.odd() == adapter.isVertical ? Math.sin(angle1) : Math.cos(angle1));
				var sincos2 = 1 - (block.odd() == adapter.isVertical ? Math.sin(angle2) : Math.cos(angle2));
				
				let vertex1 = center.plus(block.getOnCircle(angle1).times(radius)).plus(forward.times(adapter.facesForward ? 0 : radius));
				let vertex2 = center.plus(block.getOnCircle(angle2).times(radius)).plus(forward.times(adapter.facesForward ? 0 : radius));
				var vertex3 = vertex2.plus(forward.times(sincos2 * (adapter.facesForward ? 1 : -1) * radius));
				var vertex4 = vertex1.plus(forward.times(sincos1 * (adapter.facesForward ? 1 : -1) * radius));

				var normal1 = block.getOnCircle(angle1).times(adapter.facesForward ? 1 : -1);
				var normal2 = block.getOnCircle(angle2).times(adapter.facesForward ? 1 : -1);

				this.createQuadWithNormals(
					vertex1, vertex2, vertex3, vertex4,
					normal1, normal2, normal2, normal1, adapter.facesForward);

				var invertAngle = ((adapter.isVertical ? block.localY() : block.localX()) != 1) != adapter.facesForward;
				var vertex5 = vertex4.plus(adapter.directionToNeighbor.times(radius * sincos1));
				var vertex6 = vertex3.plus(adapter.directionToNeighbor.times(radius * sincos2));
				var normal3 = adapter.neighbor.getOnCircle(invertAngle ? angle1 : Math.PI / 2 - angle1).times(adapter.facesForward ? -1 : 1);
				var normal4 = adapter.neighbor.getOnCircle(invertAngle ? angle2 : Math.PI / 2 - angle2).times(adapter.facesForward ? -1 : 1);

				this.createQuadWithNormals(
					vertex5, vertex6, vertex3, vertex4,
					normal3, normal4, normal4, normal3, !adapter.facesForward);
			}
		}
	}

	private isPerpendicularRoundedAdapter(block: TinyBlock) {
		if (block.perpendicularRoundedAdapter == null) {
			return false;
		}
		var localForward = block.position.minus(block.perpendicularRoundedAdapter.sourceBlock.position.times(3)).dot(block.forward());
		return localForward == 0 || (localForward > 0) == block.perpendicularRoundedAdapter.facesForward;
	}

    private renderTinyBlocks() {
		var blockSizeWithoutMargin = 0.5 - this.measurements.edgeMargin;
		
        for (let block of this.tinyBlocks.values()) {
            if (block.merged || !block.isCenter() || block.isAttachment()) {
                continue;
            }

            var nextBlock = this.getNextBlock(block);
            var previousBlock = this.getPreviousBlock(block);
            var distance = block.getDepth(this);

            var hasOpenEnd = this.hasOpenEnd(block);
            var hasOpenStart = this.hasOpenStart(block);

            // Back cap
            if (nextBlock == null && (block.rounded || block.hasInterior)) {
				this.createCircleWithHole(block, block.hasInterior && hasOpenEnd ? this.measurements.interiorRadius : 0, blockSizeWithoutMargin, distance, false, !block.rounded);
				this.hideStartEndFaces(block.position.plus(block.forward().times(block.mergedBlocks - 1)), block, true);
            }

            // Front cap
            if (previousBlock == null && (block.rounded || block.hasInterior)) {
				this.createCircleWithHole(block, block.hasInterior && hasOpenStart ? this.measurements.interiorRadius : 0, blockSizeWithoutMargin, 0, true, !block.rounded);
				this.hideStartEndFaces(block.position, block, false);
            }

            if (block.rounded) {
				if (!this.isPerpendicularRoundedAdapter(block)) {
					this.createCylinder(block, 0, blockSizeWithoutMargin, distance);
				}
                // Rounded corners
				for (var i = 0; i < block.mergedBlocks; i++) {
					this.hideOutsideFaces(this.tinyBlocks.get(block.position.plus(block.forward().times(i))));
				}

                // Rounded to non rounded adapter
                if (nextBlock != null && !nextBlock.rounded) {
                    this.createCircleWithHole(block, blockSizeWithoutMargin, blockSizeWithoutMargin, distance, true, true);
                }
                if (previousBlock != null && !previousBlock.rounded) {
                    this.createCircleWithHole(block, blockSizeWithoutMargin, blockSizeWithoutMargin, 0, false, true);
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
		var center = block.getCylinderOrigin(this).plus(block.forward().times(zOffset));
		
		for (var i = 0; i < this.measurements.subdivisionsPerQuarter; i++) {
			var out1 = block.getOnCircle(i / 2 * Math.PI / this.measurements.subdivisionsPerQuarter);
			var out2 = block.getOnCircle((i + 1) / 2 * Math.PI / this.measurements.subdivisionsPerQuarter);

			for (var j = 0; j < this.measurements.lipSubdivisions; j++) {
				var angleJ = j * Math.PI / this.measurements.lipSubdivisions;
				var angleJ2 = (j + 1) * Math.PI / this.measurements.lipSubdivisions;
				this.createQuadWithNormals(
					center.plus(out1.times(this.measurements.pinRadius)).plus(out1.times(Math.sin(angleJ) * this.measurements.pinLipRadius).plus(block.forward().times(Math.cos(angleJ) * this.measurements.pinLipRadius))),
					center.plus(out2.times(this.measurements.pinRadius)).plus(out2.times(Math.sin(angleJ) * this.measurements.pinLipRadius).plus(block.forward().times(Math.cos(angleJ) * this.measurements.pinLipRadius))),
					center.plus(out2.times(this.measurements.pinRadius)).plus(out2.times(Math.sin(angleJ2) * this.measurements.pinLipRadius).plus(block.forward().times(Math.cos(angleJ2) * this.measurements.pinLipRadius))),
					center.plus(out1.times(this.measurements.pinRadius)).plus(out1.times(Math.sin(angleJ2) * this.measurements.pinLipRadius).plus(block.forward().times(Math.cos(angleJ2) * this.measurements.pinLipRadius))),
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

		var distance = block.getDepth(this);

		var startOffset = (previousBlock != null && previousBlock.type == BlockType.Axle) ? this.measurements.axlePinAdapterSize : 0;
		if (previousBlock == null) {
			startOffset += 2 * this.measurements.pinLipRadius;
		}
		var endOffset = (nextBlock != null && nextBlock.type == BlockType.Axle) ? this.measurements.axlePinAdapterSize : 0;
		if (nextBlock == null) {
			endOffset += 2 * this.measurements.pinLipRadius;
		}

		this.createCylinder(block, startOffset, this.measurements.pinRadius, distance - startOffset - endOffset);

		if (nextBlock == null) {
			this.createCircle(block, this.measurements.pinRadius, distance, true);
			this.renderLip(block, distance - this.measurements.pinLipRadius);
		}
		if (previousBlock == null) {
			this.createCircle(block, this.measurements.pinRadius, 0);
			this.renderLip(block, this.measurements.pinLipRadius);
		}
		if (nextBlock != null && !nextBlock.isAttachment()) {
			this.createCircleWithHole(block, this.measurements.pinRadius, 0.5 - this.measurements.edgeMargin, distance, true, !nextBlock.rounded);
			this.hideStartEndFaces(nextBlock.position, block, false);
		}
		if (previousBlock != null && !previousBlock.isAttachment()) {
			this.createCircleWithHole(block, this.measurements.pinRadius, 0.5 - this.measurements.edgeMargin, 0, false, !previousBlock.rounded);
			this.hideStartEndFaces(previousBlock.position, block, true);
		}
		if (nextBlock != null && nextBlock.type == BlockType.Axle) {
			this.createCircleWithHole(block, this.measurements.pinRadius, this.measurements.axlePinAdapterRadius, distance - this.measurements.axlePinAdapterSize, true);
			this.createCylinder(block, distance - this.measurements.axlePinAdapterSize, this.measurements.axlePinAdapterRadius, this.measurements.axlePinAdapterSize);
		}
		if (previousBlock != null && previousBlock.type == BlockType.Axle) {
			this.createCircleWithHole(block, this.measurements.pinRadius, this.measurements.axlePinAdapterRadius, this.measurements.axlePinAdapterSize);
			this.createCylinder(block, 0, this.measurements.axlePinAdapterRadius, this.measurements.axlePinAdapterSize);
		}
    }

    private renderAxle(block: TinyBlock) {
		var nextBlock = this.getNextBlock(block);
		var previousBlock = this.getPreviousBlock(block);
		
		var start = block.getCylinderOrigin(this);
		var end = start.plus(block.forward().times(block.getDepth(this)));

		var horizontalInner = block.horizontal().times(this.measurements.axleSizeInner);
		var horizontalOuter = block.horizontal().times(this.measurements.axleSizeOuter);
		var verticalInner = block.vertical().times(this.measurements.axleSizeInner);
		var verticalOuter = block.vertical().times(this.measurements.axleSizeOuter);

		this.createQuad(
            start.plus(horizontalInner).plus(verticalInner),
            start.plus(horizontalInner).plus(verticalOuter),
            end.plus(horizontalInner).plus(verticalOuter),
            end.plus(horizontalInner).plus(verticalInner), block.odd());
		this.createQuad(
			start.plus(horizontalInner).plus(verticalInner),
			start.plus(horizontalOuter).plus(verticalInner),
			end.plus(horizontalOuter).plus(verticalInner),
			end.plus(horizontalInner).plus(verticalInner), !block.odd());
		this.createQuad(
			end.plus(horizontalOuter),
			start.plus(horizontalOuter),
			start.plus(horizontalOuter).plus(verticalInner),
			end.plus(horizontalOuter).plus(verticalInner), block.odd());
		this.createQuad(
			end.plus(verticalOuter),
			start.plus(verticalOuter),
			start.plus(verticalOuter).plus(horizontalInner),
			end.plus(verticalOuter).plus(horizontalInner), !block.odd());

		if (nextBlock == null) {
			this.createQuad(
				end.plus(horizontalInner).plus(verticalInner),
				end.plus(verticalInner),
				end,
				end.plus(horizontalInner), block.odd());
			this.createQuad(
				end.plus(horizontalInner),
				end.plus(horizontalOuter),
				end.plus(horizontalOuter).plus(verticalInner),
				end.plus(horizontalInner).plus(verticalInner), block.odd());
			this.createQuad(
				end.plus(verticalInner),
				end.plus(verticalOuter),
				end.plus(verticalOuter).plus(horizontalInner),
				end.plus(verticalInner).plus(horizontalInner), !block.odd());
		}
		if (previousBlock == null) {
			this.createQuad(
				start.plus(horizontalInner).plus(verticalInner),
				start.plus(verticalInner),
				start,
				start.plus(horizontalInner), !block.odd());
			this.createQuad(
				start.plus(horizontalInner),
				start.plus(horizontalOuter),
				start.plus(horizontalOuter).plus(verticalInner),
				start.plus(horizontalInner).plus(verticalInner), !block.odd());
			this.createQuad(
				start.plus(verticalInner),
				start.plus(verticalOuter),
				start.plus(verticalOuter).plus(horizontalInner),
				start.plus(verticalInner).plus(horizontalInner), block.odd());
		}

		var blockSizeWithoutMargin = 0.5 - this.measurements.edgeMargin;
		if (nextBlock != null && nextBlock.type != block.type && !nextBlock.rounded) {
			this.createQuad(
				end.plus(block.horizontal().times(blockSizeWithoutMargin)),
				end.plus(horizontalOuter),
				end.plus(horizontalOuter).plus(verticalInner),
				end.plus(block.horizontal().times(blockSizeWithoutMargin)).plus(verticalInner), block.odd());
			this.createQuad(
				end.plus(block.vertical().times(blockSizeWithoutMargin)),
				end.plus(verticalOuter),
				end.plus(verticalOuter).plus(horizontalInner),
				end.plus(block.vertical().times(blockSizeWithoutMargin)).plus(horizontalInner), !block.odd());
			this.createQuad(
				end.plus(horizontalInner).plus(verticalInner),
				end.plus(block.horizontal().times(blockSizeWithoutMargin)).plus(verticalInner),
				end.plus(block.horizontal().times(blockSizeWithoutMargin)).plus(block.vertical().times(blockSizeWithoutMargin)),
				end.plus(horizontalInner).plus(block.vertical().times(blockSizeWithoutMargin)), !block.odd());
		}
		if (previousBlock != null && previousBlock.type != block.type && !previousBlock.rounded) {
			this.createQuad(
				start.plus(block.horizontal().times(blockSizeWithoutMargin)),
				start.plus(horizontalOuter),
				start.plus(horizontalOuter).plus(verticalInner),
				start.plus(block.horizontal().times(blockSizeWithoutMargin)).plus(verticalInner), !block.odd());
			this.createQuad(
				start.plus(block.vertical().times(blockSizeWithoutMargin)),
				start.plus(verticalOuter),
				start.plus(verticalOuter).plus(horizontalInner),
				start.plus(block.vertical().times(blockSizeWithoutMargin)).plus(horizontalInner), block.odd());
			this.createQuad(
				start.plus(horizontalInner).plus(verticalInner),
				start.plus(block.horizontal().times(blockSizeWithoutMargin)).plus(verticalInner),
				start.plus(block.horizontal().times(blockSizeWithoutMargin)).plus(block.vertical().times(blockSizeWithoutMargin)),
				start.plus(horizontalInner).plus(block.vertical().times(blockSizeWithoutMargin)), block.odd());
		}
		if (nextBlock != null && nextBlock.type != block.type && nextBlock.rounded) {
			this.createAxleToCircleAdapter(end, block, nextBlock.type == BlockType.Pin ? this.measurements.axlePinAdapterRadius : blockSizeWithoutMargin);
		}
		if (previousBlock != null && previousBlock.type != block.type && previousBlock.rounded) {
			this.createAxleToCircleAdapter(start, block, previousBlock.type == BlockType.Pin ? this.measurements.axlePinAdapterRadius : blockSizeWithoutMargin, true);
		}
		if (nextBlock != null && !nextBlock.isAttachment()) {
			this.hideStartEndFaces(nextBlock.position, block, false);
		}
		if (previousBlock != null && !previousBlock.isAttachment()) {
			this.hideStartEndFaces(previousBlock.position, block, true);
		}
    }
    
    private createAxleToCircleAdapter(center: Vector3, block: SmallBlock, radius: number, flipped = false) {
		var horizontalInner = block.horizontal().times(this.measurements.axleSizeInner);
		var horizontalOuter = block.horizontal().times(this.measurements.axleSizeOuter);
		var verticalInner = block.vertical().times(this.measurements.axleSizeInner);
		var verticalOuter = block.vertical().times(this.measurements.axleSizeOuter);

		for (var i = 0; i < this.measurements.subdivisionsPerQuarter; i++) {
			var focus = center.copy();
			if (i < this.measurements.subdivisionsPerQuarter / 2 == !block.odd()) {
				focus = focus.plus(horizontalInner).plus(verticalOuter);
			} else {
				focus = focus.plus(horizontalOuter).plus(verticalInner);
			}

			this.triangles.push(new Triangle(focus,
				center.plus(block.getOnCircle(Math.PI / 2 * i / this.measurements.subdivisionsPerQuarter, radius)),
				center.plus(block.getOnCircle(Math.PI / 2 * (i + 1) / this.measurements.subdivisionsPerQuarter, radius)), flipped));
		}
		this.triangles.push(new Triangle(
			center.plus(horizontalInner).plus(verticalOuter),
			center.plus(verticalOuter),
			center.plus(block.vertical().times(radius)), block.odd() != flipped));
		this.triangles.push(new Triangle(
			center.plus(verticalInner).plus(horizontalOuter),
			center.plus(horizontalOuter),
			center.plus(block.horizontal().times(radius)), block.odd() == flipped));
		this.createQuad(
			center.plus(verticalInner).plus(horizontalInner),
			center.plus(verticalOuter).plus(horizontalInner),
			center.plus(block.getOnCircle(45 * DEG_TO_RAD, radius)),
			center.plus(verticalInner).plus(horizontalOuter), block.odd() != flipped);
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
        var distance = block.getDepth(this);

        var hasOpenEnd = this.hasOpenEnd(block);
        var hasOpenStart = this.hasOpenStart(block);
        var showInteriorEndCap = this.showInteriorCap(block, nextBlock) || (nextBlock == null && !hasOpenEnd);
		var showInteriorStartCap = this.showInteriorCap(block, previousBlock) || (previousBlock == null && !hasOpenStart);
		
		var offset = this.measurements.pinHoleOffset;
		var endMargin = showInteriorEndCap ? this.measurements.interiorEndMargin : 0;
		var startMargin = showInteriorStartCap ? this.measurements.interiorEndMargin : 0;
        var offsetStart = (hasOpenStart || showInteriorStartCap ? offset : 0) + startMargin;
		var offsetEnd = (hasOpenEnd || showInteriorEndCap ? offset : 0) + endMargin;
		var interiorRadius = this.measurements.interiorRadius;

		this.createCylinder(block, offsetStart, this.measurements.pinHoleRadius, distance - offsetStart - offsetEnd, true);

        if (hasOpenStart || showInteriorStartCap) {
            this.createCylinder(block, startMargin, interiorRadius, offset, true);
            this.createCircleWithHole(block, this.measurements.pinHoleRadius, interiorRadius, offset + startMargin, true);
        }

        if (hasOpenEnd || showInteriorEndCap) {
            this.createCylinder(block, distance - offset - endMargin, interiorRadius, offset, true);
            this.createCircleWithHole(block, this.measurements.pinHoleRadius, interiorRadius, distance - offset - endMargin, false);
        }

        if (showInteriorEndCap) {
            this.createCircle(block, interiorRadius, distance - endMargin, false);
        }
        if (showInteriorStartCap) {
            this.createCircle(block, interiorRadius, startMargin, true);
        }
    }

    private renderAxleHoleInterior(block: TinyBlock) {
        var nextBlock = this.getNextBlock(block);
        var previousBlock = this.getPreviousBlock(block);

        var hasOpenEnd = this.hasOpenEnd(block);
        var hasOpenStart = this.hasOpenStart(block);
        var showInteriorEndCap = this.showInteriorCap(block, nextBlock) || (nextBlock == null && !hasOpenEnd);
        var showInteriorStartCap = this.showInteriorCap(block, previousBlock) || (previousBlock == null && !hasOpenStart);
        
		var distance = block.getDepth(this);
		var holeSize = this.measurements.axleHoleSize;
        
        var start = block.getCylinderOrigin(this).plus(showInteriorStartCap ? block.forward().times(this.measurements.interiorEndMargin) : Vector3.zero());
        var end = start.plus(block.forward().times(distance - (showInteriorStartCap ? this.measurements.interiorEndMargin : 0) - (showInteriorEndCap ? this.measurements.interiorEndMargin : 0)));
		
		var axleWingAngle = Math.asin(holeSize / this.measurements.pinHoleRadius);
		var axleWingAngle2 = 90 * DEG_TO_RAD - axleWingAngle;
		var subdivAngle = 90 / this.measurements.subdivisionsPerQuarter * DEG_TO_RAD;
		var adjustedRadius = this.measurements.pinHoleRadius * Math.cos(subdivAngle / 2) / Math.cos(subdivAngle / 2 - (axleWingAngle - Math.floor(axleWingAngle / subdivAngle) * subdivAngle));
		this.createQuad(
			start.plus(block.horizontal().times(holeSize)).plus(block.vertical().times(holeSize)),
			start.plus(block.getOnCircle(axleWingAngle, adjustedRadius)),
			end.plus(block.getOnCircle(axleWingAngle, adjustedRadius)),
			end.plus(block.horizontal().times(holeSize)).plus(block.vertical().times(holeSize)),
			true);
		this.createQuad(
			start.plus(block.horizontal().times(holeSize)).plus(block.vertical().times(holeSize)),
			start.plus(block.getOnCircle(axleWingAngle2, adjustedRadius)),
			end.plus(block.getOnCircle(axleWingAngle2, adjustedRadius)),
			end.plus(block.horizontal().times(holeSize)).plus(block.vertical().times(holeSize)),
			false);

		for (var i = 0; i < this.measurements.subdivisionsPerQuarter; i++) {
			var angle1 = lerp(0, 90, i / this.measurements.subdivisionsPerQuarter) * DEG_TO_RAD;
			var angle2 = lerp(0, 90, (i + 1) / this.measurements.subdivisionsPerQuarter) * DEG_TO_RAD;
			var startAngleInside = angle1;
			var endAngleInside = angle2;
			var startAngleOutside = angle1;
			var endAngleOutside = angle2;
			var radius1Inside = this.measurements.pinHoleRadius;
			var radius2Inside = this.measurements.pinHoleRadius;
			var radius1Outside = this.measurements.pinHoleRadius;
			var radius2Outside = this.measurements.pinHoleRadius;
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
						start.plus(block.horizontal().times(holeSize)).plus(block.vertical().times(holeSize)),
						start.plus(block.getOnCircle(startAngleOutside, radius1Outside)),
						start.plus(block.getOnCircle(endAngleOutside, radius2Outside))));
				}
			}
			if (hasOpenEnd || (nextBlock != null && nextBlock.type == BlockType.PinHole && !showInteriorEndCap)) {
				if (angle2 > axleWingAngle && angle1 < axleWingAngle2) {
					this.triangles.push(new Triangle(
						end.plus(block.horizontal().times(holeSize)).plus(block.vertical().times(holeSize)),
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
			this.createCircleWithHole(block, this.measurements.pinHoleRadius, this.measurements.interiorRadius, distance, false);
		}

		if (hasOpenStart) {
			this.createCircleWithHole(block, this.measurements.pinHoleRadius, this.measurements.interiorRadius, 0, true);
		}

		if (showInteriorEndCap) {
			this.triangles.push(new Triangle(
				end.plus(block.horizontal().times(holeSize)).plus(block.vertical().times(holeSize)),
				end,
				end.plus(block.getOnCircle(axleWingAngle, adjustedRadius))));
			this.triangles.push(new Triangle(
				end,
				end.plus(block.horizontal().times(holeSize)).plus(block.vertical().times(holeSize)),
				end.plus(block.getOnCircle(axleWingAngle2, adjustedRadius))));
		}
		if (showInteriorStartCap) {
			this.triangles.push(new Triangle(
				start,
				start.plus(block.horizontal().times(holeSize)).plus(block.vertical().times(holeSize)),
				start.plus(block.getOnCircle(axleWingAngle, adjustedRadius))));
			this.triangles.push(new Triangle(
				start.plus(block.horizontal().times(holeSize)).plus(block.vertical().times(holeSize)),
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
            this.tinyBlockToWorld(position.plus(vertices[0].elementwiseMultiply(size))),
            this.tinyBlockToWorld(position.plus(vertices[1].elementwiseMultiply(size))),
            this.tinyBlockToWorld(position.plus(vertices[2].elementwiseMultiply(size))),
            this.tinyBlockToWorld(position.plus(vertices[3].elementwiseMultiply(size))));
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