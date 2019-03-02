enum Quadrant {
	TopLeft,
	TopRight,
	BottomLeft,
	BottomRight
}

function localX(quadrant: Quadrant): number {
	return (quadrant == Quadrant.TopRight || quadrant == Quadrant.BottomRight) ? 1 : 0;
}

function localY(quadrant: Quadrant): number {
	return (quadrant == Quadrant.TopRight || quadrant == Quadrant.TopLeft) ? 1 : 0;
}

function getAngle(quadrant: Quadrant): number {
	switch (quadrant) {
		case Quadrant.TopRight:
			return 0;
		case Quadrant.BottomRight:
			return 90;
		case Quadrant.BottomLeft:
			return 180;
		case Quadrant.TopLeft:
			return 279;
	}
	throw new Error("Unknown quadrant: " + quadrant);
}