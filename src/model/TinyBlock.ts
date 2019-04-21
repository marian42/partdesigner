class TinyBlock extends SmallBlock {
	public mergedBlocks = 1;
	public merged = false;

	private readonly visibleFaces: [boolean, boolean, boolean, boolean, boolean, boolean] = null;

	public readonly angle: number;
	public readonly isCenter: boolean;
	public readonly smallBlockPosition: Vector3;

	constructor(position: Vector3, source: SmallBlock) {
		super(source.quadrant, position, source);
		this.visibleFaces = [true, true, true, true, true, true];
		this.perpendicularRoundedAdapter = source.perpendicularRoundedAdapter;

		this.angle = getAngle(this.quadrant);
		this.smallBlockPosition = new Vector3(
			Math.floor((position.x + 1) / 3),
			Math.floor((position.y + 1) / 3),
			Math.floor((position.z + 1) / 3));
		var localPosition = position.minus(this.smallBlockPosition.times(3));
		this.isCenter = localPosition.dot(this.up) == 0 && localPosition.dot(this.right) == 0;
	}

	public getCylinderOrigin(meshGenerator: MeshGenerator): Vector3 {
		return this.forward.times(meshGenerator.tinyIndexToWorld(this.forward.dot(this.position)))
			.plus(this.right.times((this.smallBlockPosition.dot(this.right) + (1 - this.localX)) * 0.5))
			.plus(this.up.times((this.smallBlockPosition.dot(this.up) + (1 - this.localY)) * 0.5));
	}

	public getDepth(meshGenerator: MeshGenerator): number {
		return meshGenerator.tinyIndexToWorld(this.forward.dot(this.position) + this.mergedBlocks) - meshGenerator.tinyIndexToWorld(this.forward.dot(this.position));
	}

	public isFaceVisible(direction: Vector3): boolean {
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
