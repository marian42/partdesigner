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

    private static createBuffer(part: Part, measurements: Measurements) {
        let mesh = new PartMeshGenerator(part, measurements).getMesh();
        let exporter = new STLExporter(84 + 50 * mesh.triangles.length);
        
        for (var i = 0; i < 80; i++) {
            exporter.view.setInt8(i, 0);
        }
        
        var p = 80;
        exporter.view.setInt32(p, mesh.triangles.length, true);
        p += 4;

        for (let triangle of mesh.triangles) {
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