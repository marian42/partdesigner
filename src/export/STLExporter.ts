class STLExporter {
    private readonly buffer: ArrayBuffer;
    private readonly view: DataView;

    constructor(size: number) {
        this.buffer = new ArrayBuffer(size);
        this.view = new DataView(this.buffer, 0, size);
    }

    private writeVector(offset: number, vector: Vector3) {
        this.view.setFloat32(offset, vector.z, true);
        this.view.setFloat32(offset + 4, vector.x, true);
        this.view.setFloat32(offset + 8, vector.y, true);
    }

    private writeTriangle(offset: number, triangle: Triangle, scalingFactor: number) {
        this.writeVector(offset, triangle.normal().times(-1));
        this.writeVector(offset + 12, triangle.v1.times(scalingFactor));
        this.writeVector(offset + 24, triangle.v2.times(scalingFactor));
        this.writeVector(offset + 36, triangle.v3.times(scalingFactor));
        this.view.setInt16(offset + 48, 0, true);
    }

    private static fixOpenEdges(triangles: Triangle[]): Triangle[] {
        var points: Vector3[] = [];

        for (var triangle of triangles) {
            if (!containsPoint(points, triangle.v1)) {
                points.push(triangle.v1);
            }
            if (!containsPoint(points, triangle.v2)) {
                points.push(triangle.v2);
            }
            if (!containsPoint(points, triangle.v3)) {
                points.push(triangle.v3);
            }
        }

        var result: Triangle[] = [];

        for (var triangle of triangles) {
            var edge1Hits: number[] = [0];
            var edge2Hits: number[] = [0];
            var edge3Hits: number[] = [0];

            var edge1Direction = triangle.v2.minus(triangle.v1);
            var edge2Direction = triangle.v3.minus(triangle.v2);
            var edge3Direction = triangle.v1.minus(triangle.v3);

            let edge1LengthSquared = Math.pow(edge1Direction.magnitude(), 2);
            let edge2LengthSquared = Math.pow(edge2Direction.magnitude(), 2);
            let edge3LengthSquared = Math.pow(edge3Direction.magnitude(), 2);

            for (var point of points) {
                var vertex1Relative = point.minus(triangle.v1);
                var vertex2Relative = point.minus(triangle.v2);
                var vertex3Relative = point.minus(triangle.v3);

                if (Vector3.isCollinear(edge1Direction, vertex1Relative)) {
                    let progress = vertex1Relative.dot(edge1Direction) / edge1LengthSquared;
                    if (progress > 0.0001 && progress < 0.999) {
                        edge1Hits.push(progress);
                        continue;
                    }
                    continue;
                }

                if (Vector3.isCollinear(edge2Direction, vertex2Relative)) {
                    let progress = vertex2Relative.dot(edge2Direction) / edge2LengthSquared;
                    if (progress > 0.0001 && progress < 0.999) {
                        edge2Hits.push(progress);
                        continue;
                    }
                    continue;
                }

                if (Vector3.isCollinear(edge3Direction, vertex3Relative)) {
                    let progress = vertex3Relative.dot(edge3Direction) / edge3LengthSquared;
                    if (progress > 0.0001 && progress < 0.999) {
                        edge3Hits.push(progress);
                        continue;
                    }
                    continue;
                }
            }

            if (edge1Hits.length == 1 && edge2Hits.length == 1 && edge3Hits.length == 1) {
                result.push(triangle);
                continue;
            }

            edge1Hits.sort();
            edge2Hits.sort();
            edge3Hits.sort();

            for (var i = 0; i < edge1Hits.length - 1; i++) {
                result.push(new Triangle(
                    Vector3.interpolate(triangle.v1, triangle.v2, edge1Hits[i]),
                    Vector3.interpolate(triangle.v1, triangle.v2, edge1Hits[i + 1]),
                    Vector3.interpolate(triangle.v3, triangle.v1, edge3Hits[edge3Hits.length - 1])
                ));
            }
            for (var i = 0; i < edge2Hits.length - 1; i++) {
                result.push(new Triangle(
                    Vector3.interpolate(triangle.v2, triangle.v3, edge2Hits[i]),
                    Vector3.interpolate(triangle.v2, triangle.v3, edge2Hits[i + 1]),
                    Vector3.interpolate(triangle.v1, triangle.v2, edge1Hits[edge1Hits.length - 1])
                ));
            }
            for (var i = 0; i < edge3Hits.length - 1; i++) {
                result.push(new Triangle(
                    Vector3.interpolate(triangle.v3, triangle.v1, edge3Hits[i]),
                    Vector3.interpolate(triangle.v3, triangle.v1, edge3Hits[i + 1]),
                    Vector3.interpolate(triangle.v2, triangle.v3, edge2Hits[edge2Hits.length - 1])
                ))
            }
            if (edge1Hits.length > 1 && edge2Hits.length == 1) {
                result.push(new Triangle(
                    Vector3.interpolate(triangle.v1, triangle.v2, edge1Hits[edge1Hits.length - 1]),
                    Vector3.interpolate(triangle.v2, triangle.v3, edge2Hits[0]),
                    Vector3.interpolate(triangle.v3, triangle.v1, edge3Hits[edge3Hits.length - 1]),
                ))
            }
            else if (edge2Hits.length > 1 && edge3Hits.length == 1) {
                result.push(new Triangle(
                    Vector3.interpolate(triangle.v2, triangle.v3, edge2Hits[edge2Hits.length - 1]),
                    Vector3.interpolate(triangle.v3, triangle.v1, edge3Hits[0]),
                    Vector3.interpolate(triangle.v1, triangle.v2, edge1Hits[edge1Hits.length - 1]),
                ))
            }
            else if (edge3Hits.length > 1 && edge1Hits.length == 1) {
                result.push(new Triangle(
                    Vector3.interpolate(triangle.v3, triangle.v1, edge3Hits[edge3Hits.length - 1]),
                    Vector3.interpolate(triangle.v1, triangle.v2, edge1Hits[0]),
                    Vector3.interpolate(triangle.v2, triangle.v3, edge2Hits[edge2Hits.length - 1]),
                ))
            }
        }

        return result;
    }

    private static createBuffer(part: Part, measurements: Measurements) {
        let mesh = new PartMeshGenerator(part, measurements).getMesh();
        let triangles = STLExporter.fixOpenEdges(mesh.triangles);

        let exporter = new STLExporter(84 + 50 * triangles.length);
        
        for (var i = 0; i < 80; i++) {
            exporter.view.setInt8(i, 0);
        }
        
        var p = 80;
        exporter.view.setInt32(p, triangles.length, true);
        p += 4;

        for (let triangle of triangles) {
            exporter.writeTriangle(p, triangle, measurements.technicUnit);
            p += 50;
        }

        return exporter.buffer;
    }
    
    public static saveSTLFile(part: Part, measurements: Measurements, name="part") {
        let filename = name.toLowerCase().replaceAll(" ", "_") + ".stl";
        let blob = new Blob([STLExporter.createBuffer(part, measurements)], { type: "application/octet-stream" });
        let link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }
}