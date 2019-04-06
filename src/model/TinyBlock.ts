class TinyBlock extends SmallBlock {
	public mergedBlocks = 1;
	public merged = false;

	private visibleFaces: [boolean, boolean, boolean, boolean, boolean, boolean] = null;

	public angle() {
		return getAngle(this.quadrant);
	}

	public smallBlockPosition(): Vector3 {
		return new Vector3(
			Math.floor((this.position.x + 1) / 3),
			Math.floor((this.position.y + 1) / 3),
			Math.floor((this.position.z + 1) / 3)
		);
	}

	public localPositon(): Vector3 {
		return this.position.minus(this.smallBlockPosition().times(3));
	}
	
	// Returns true if this tiny block is not inside the margin on the right and up axes
	// Being insdide the margin along the forward axis is ok.
	public isCenter(): boolean {
		return this.localPositon().dot(this.up()) == 0 && this.localPositon().dot(this.right()) == 0;
	}

	public getCylinderOrigin(): Vector3 {
		return this.forward().times(tinyIndexToWorld(this.forward().dot(this.position)))
			.plus(this.right().times((this.smallBlockPosition().dot(this.right()) + (1 - this.localX())) * 0.5))
			.plus(this.up().times((this.smallBlockPosition().dot(this.up()) + (1 - this.localY())) * 0.5));
	}

	public getDepth(): number {
		return tinyIndexToWorld(this.forward().dot(this.position) + this.mergedBlocks) - tinyIndexToWorld(this.forward().dot(this.position));
	}

	constructor(position: Vector3, source: SmallBlock) {
		super(source.quadrant, position, source);
	}

	public isFaceVisible(direction: Vector3): boolean {
		if (this.visibleFaces == null) {			
			return true;
		}
		if (direction.x > 0 && direction.y == 0 && direction.z == 0) {
			return this.visibleFaces[0];
		} else if (direction.x < 0 && direction.y == 0 && direction.z == 0) {
			return this.visibleFaces[1];
		} else if (direction.x == 0 && direction.y > 0 && direction.z == 0) {
			return this.visibleFaces[2];
		} else if (direction.x == 0 && direction.y < 0 && direction.z == 0) {
			return this.visibleFaces[3];
		} else if (direction.x == 0 && direction.y == 0 && direction.z > 0) {
			return this.visibleFaces[4];
		} else if (direction.x == 0 && direction.y == 0 && direction.z < 0) {
			return this.visibleFaces[5];
		} else {
			throw new Error("Invalid direction vector.");
		}
	}

	public hideFace(direction: Vector3) {
		if (this.visibleFaces == null) {			
			this.visibleFaces = [true, true, true, true, true, true];
		}
		if (direction.x > 0 && direction.y == 0 && direction.z == 0) {
			this.visibleFaces[0] = false;
		} else if (direction.x < 0 && direction.y == 0 && direction.z == 0) {
			this.visibleFaces[1] = false;
		} else if (direction.x == 0 && direction.y > 0 && direction.z == 0) {
			this.visibleFaces[2] = false;
		} else if (direction.x == 0 && direction.y < 0 && direction.z == 0) {
			this.visibleFaces[3] = false;
		} else if (direction.x == 0 && direction.y == 0 && direction.z > 0) {
			this.visibleFaces[4] = false;
		} else if (direction.x == 0 && direction.y == 0 && direction.z < 0) {
			this.visibleFaces[5] = false;
		} else {
			throw new Error("Invalid direction vector.");
		}
	}
}
