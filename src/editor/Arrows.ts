const ARROW_RADIUS_INNER = 0.05;
const ARROW_RADIUS_OUTER = 0.15;
const ARROW_LENGTH = 0.35;
const ARROW_TIP = 0.15;

class Arrows {

	private static getVector(angle: number, radius: number, z: number): Vector3 {
		return new Vector3(radius * Math.cos(angle), radius * Math.sin(angle), z);
	}
	
	public static getMesh(subdivisions: number): Mesh {
		let triangles: Triangle[] = [];

		for (let i = 0; i < subdivisions; i++) {
			let angle1 = i / subdivisions * 2 * Math.PI;
			let angle2 = (i + 1) / subdivisions * 2 * Math.PI;

			// Base
			triangles.push(new Triangle(Arrows.getVector(angle1, ARROW_RADIUS_INNER, 0), Vector3.zero(), Arrows.getVector(angle2, ARROW_RADIUS_INNER, 0)));
			// Side
			triangles.push(new Triangle(
				Arrows.getVector(angle1, ARROW_RADIUS_INNER, 0),
				Arrows.getVector(angle2, ARROW_RADIUS_INNER, 0),
				Arrows.getVector(angle2, ARROW_RADIUS_INNER, ARROW_LENGTH)));
			triangles.push(new Triangle(
				Arrows.getVector(angle1, ARROW_RADIUS_INNER, ARROW_LENGTH),
				Arrows.getVector(angle1, ARROW_RADIUS_INNER, 0),
				Arrows.getVector(angle2, ARROW_RADIUS_INNER, ARROW_LENGTH)));
			// Tip base
			triangles.push(new Triangle(
				Arrows.getVector(angle1, ARROW_RADIUS_INNER, ARROW_LENGTH),
				Arrows.getVector(angle2, ARROW_RADIUS_INNER, ARROW_LENGTH),
				Arrows.getVector(angle2, ARROW_RADIUS_OUTER, ARROW_LENGTH)));
			triangles.push(new Triangle(
				Arrows.getVector(angle1, ARROW_RADIUS_OUTER, ARROW_LENGTH),
				Arrows.getVector(angle1, ARROW_RADIUS_INNER, ARROW_LENGTH),
				Arrows.getVector(angle2, ARROW_RADIUS_OUTER, ARROW_LENGTH)));
			// Tip
			triangles.push(new Triangle(
				new Vector3(0, 0, ARROW_LENGTH + ARROW_TIP),
				Arrows.getVector(angle1, ARROW_RADIUS_OUTER, ARROW_LENGTH),
				Arrows.getVector(angle2, ARROW_RADIUS_OUTER, ARROW_LENGTH)));
		}

		return new Mesh(triangles);
	}
}