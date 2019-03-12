enum Orientation {
	X,
	Y,
	Z
}

const ORIENTATION = {
	"x": Orientation.X,
	"y": Orientation.Y,
	"z": Orientation.Z
};

function forward(orientation: Orientation): Vector3 {
	switch (orientation) {
		case Orientation.X: {
			return new Vector3(1, 0, 0);
		}
		case Orientation.Y: {
			return new Vector3(0, 1, 0);
		}
		case Orientation.Z: {
			return new Vector3(0, 0, 1);
		}
	}
	throw new Error("Unknown orientation: " + orientation);
}

function right(orientation: Orientation): Vector3 {
	switch (orientation) {
		case Orientation.X: {
			return new Vector3(0, 1, 0);
		}
		case Orientation.Y: {
			return new Vector3(0, 0, 1);
		}
		case Orientation.Z: {
			return new Vector3(1, 0, 0);
		}
	}
	throw new Error("Unknown orientation: " + orientation);
}

function up(orientation: Orientation): Vector3 {
	switch (orientation) {
		case Orientation.X: {
			return new Vector3(0, 0, 1);
		}
		case Orientation.Y: {
			return new Vector3(1, 0, 0);
		}
		case Orientation.Z: {
			return new Vector3(0, 1, 0);
		}
	}
	throw new Error("Unknown orientation: " + orientation);
}