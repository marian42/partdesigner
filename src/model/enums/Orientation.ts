enum Orientation {
	X = 0,
	Y = 1,
	Z = 2
}

const ORIENTATION = {
	"x": Orientation.X,
	"y": Orientation.Y,
	"z": Orientation.Z
};

const FORWARD = {
	0: new Vector3(1, 0, 0),
	1: new Vector3(0, 1, 0),
	2: new Vector3(0, 0, 1)
};

const RIGHT = {
	0: new Vector3(0, 1, 0),
	1: new Vector3(0, 0, 1),
	2: new Vector3(1, 0, 0)
};

const UP = {
	0: new Vector3(0, 0, 1),
	1: new Vector3(1, 0, 0),
	2: new Vector3(0, 1, 0)
}