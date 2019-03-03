class Mesh {
    public triangles: Triangle[];

    constructor(triangles: Triangle[]) {
        this.triangles = triangles;
    }

    private createSTLFile(): ArrayBuffer {
        let size = 84 + 50 * this.triangles.length;
        var buffer = new ArrayBuffer(size);
        let view = new DataView(buffer, 0, size);

        for (var i = 0; i < 80; i++) {
            view.setInt8(i, 0);
        }
        
        var p = 80;
        view.setInt32(p, this.triangles.length, true);
        p += 4;

        for (let triangle of this.triangles) {
            this.writeTriangle(view, p, triangle);
            p += 50;
        }

        return buffer;
    }

    private writeVector(view: DataView, offset: number, vector: Vector3) {
        view.setFloat32(offset, vector.x, true);
        view.setFloat32(offset + 4, vector.z, true);
        view.setFloat32(offset + 8, vector.y, true);
    }

    private writeTriangle(view: DataView, offset: number, triangle: Triangle) {
        this.writeVector(view, offset, triangle.normal().times(-1));
        this.writeVector(view, offset + 12, triangle.v2.times(TECHNIC_UNIT));
        this.writeVector(view, offset + 24, triangle.v1.times(TECHNIC_UNIT));
        this.writeVector(view, offset + 36, triangle.v3.times(TECHNIC_UNIT));
        view.setInt16(offset + 48, 0, true);
    }

    public saveSTLFile(filename = "part.stl") {
        let blob = new Blob([this.createSTLFile()], { type: "application/octet-stream" });
        let link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }
}