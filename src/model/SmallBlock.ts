class SmallBlock extends Block {
	public readonly quadrant: Quadrant;
	public readonly position: Vector3;
	public hasInterior: boolean;

	public perpendicularRoundedAdapter: PerpendicularRoundedAdapter = null;

	public readonly localX: number;
	public readonly localY: number;
	public readonly directionX: number;
	public readonly directionY: number;
	public readonly horizontal: Vector3;
	public readonly vertical: Vector3;

	constructor(quadrant: Quadrant, positon: Vector3, source: Block) {
		super(source.orientation, source.type, source.rounded);
		this.quadrant = quadrant;
		this.position = positon;

		this.hasInterior = source.type != BlockType.Solid;

		this.localX = localX(this.quadrant);
		this.localY = localY(this.quadrant);
		this.directionX = this.localX == 1 ? 1 : -1;
		this.directionY = this.localY == 1 ? 1 : -1;
		this.horizontal = this.localX == 1 ? RIGHT[this.orientation] : LEFT[this.orientation];
		this.vertical = this.localY == 1 ? UP[this.orientation] : DOWN[this.orientation];
	}

	public static createFromLocalCoordinates(localX: number, localY: number, position: Vector3, source: Block) {
		return new SmallBlock(SmallBlock.getQuadrantFromLocal(localX, localY), position, source);
	}
	
	public odd(): boolean {
		return this.quadrant == Quadrant.BottomRight || this.quadrant == Quadrant.TopLeft;
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
		return this.right.times(Math.sin(angle + getAngle(this.quadrant)) * radius).plus(
			this.up.times(Math.cos(angle + getAngle(this.quadrant)) * radius));
	}
}
 