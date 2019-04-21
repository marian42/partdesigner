class Block {
	public readonly orientation: Orientation;
	public readonly type: BlockType;
	public rounded: boolean;

	public readonly right: Vector3;
	public readonly up: Vector3;
	public readonly forward: Vector3;

	constructor(orientation: Orientation, type: BlockType, rounded: boolean) {
		this.orientation = orientation;
		this.type = type;
		this.rounded = rounded;

		this.right = RIGHT[this.orientation];
		this.up = UP[this.orientation];
		this.forward = FORWARD[this.orientation];
	}
}
