class Block {
	public orientation: Orientation;
	public type: BlockType;
	public rounded: boolean;

	constructor(orientation: Orientation, type: BlockType, rounded: boolean) {
		this.orientation = orientation;
		this.type = type;
		this.rounded = rounded;
	}

	public right(): Vector3 {
		return right(this.orientation);
	}

	public up(): Vector3 {
		return up(this.orientation);
	}

	public forward(): Vector3 {
		return forward(this.orientation);
	}
}
