class SmallBlock extends Block {
	public quadrant: Quadrant;
	public position: Vector3;
	public hasInterior: boolean;

	constructor(quadrant: Quadrant, positon: Vector3, source: Block) {
		super(source.orientation, source.type, source.rounded);
		this.quadrant = quadrant;
		this.position = positon;

		this.hasInterior = source.type != BlockType.Solid;
	}

	public static createFromLocalCoordinates(localX: number, localY: number, position: Vector3, source: Block) {
		return new SmallBlock(SmallBlock.getQuadrantFromLocal(localX, localY), position, source);
	}

	public localX(): number {
		return localX(this.quadrant);
	}

	public localY(): number {
		return localY(this.quadrant);
	}

	public directionX(): number {
		return this.localX() == 1 ? 1 : -1;
	}

	public directionY(): number {
		return this.localY() == 1 ? 1 : -1;
	}
	
	public odd(): boolean {
		return this.quadrant == Quadrant.BottomRight || this.quadrant == Quadrant.TopLeft;
	}

	public horizontal(): Vector3 {
		return this.right().times(this.directionX());
	}

	public vertical(): Vector3 {
		return this.up().times(this.directionY());
	}

	public isAttachment(): boolean {
		return this.type == BlockType.Pin || this.type == BlockType.Axle;
	}

	private static getQuadrantFromLocal(x: number, y: number): Quadrant {
		if (x == 0) {
			if (y == 0) {
				return Quadrant.BottomLeft;
			} else {
				return Quadrant.TopLeft;
			}
		} else {
			if (y == 0) {
				return Quadrant.BottomRight;
			} else {
				return Quadrant.TopRight;
			}
		}
	}

	public getOnCircle(angle: number, radius = 1): Vector3 {
		return this.right().times(Math.sin(angle + getAngle(this.quadrant) * DEG_TO_RAD) * radius).plus(
			this.up().times(Math.cos(angle + getAngle(this.quadrant) * DEG_TO_RAD) * radius));
	}
}
 