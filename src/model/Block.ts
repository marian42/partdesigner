class Block {
	public orientation: Orientation;
	public type: BlockType;
	public rounded: boolean;

	public readonly right: Vector3;
	public readonly up: Vector3;
	public readonly forward: Vector3;

	constructor(orientation: Orientation, type: BlockType, rounded: boolean) {
		this.orientation = orientation;
		this.type = type;
		this.rounded = rounded;

		this.right = right(this.orientation);
		this.up = up(this.orientation);
		this.forward = forward(this.orientation);
	}
}
