class Ray {
	point: Vector3;
	direction: Vector3;

	constructor(point: Vector3, direction: Vector3) {
		this.point = point;
		this.direction = direction;
	}

	get(t: number): Vector3 {
		return this.point.plus(this.direction.times(t));
	}

	getDistanceToRay(other: Ray): number {
		var normal = this.direction.cross(other.direction).normalized();

		var d1 = normal.dot(this.point);
		var d2 = normal.dot(other.point);

		return Math.abs(d1 - d2);
	}

	getClosestToPoint(point: Vector3): number {
		return this.direction.dot(this.point.minus(point));
	}

	getClosestToRay(other: Ray): number {
		var connection = this.direction.cross(other.direction).normalized();
		var planeNormal = connection.cross(other.direction).normalized();

		var planeToOrigin = other.point.dot(planeNormal);
		var result = (-this.point.dot(planeNormal) + planeToOrigin) / this.direction.dot(planeNormal);
		return result;
	}
}