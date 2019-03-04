class Mesh {
    public triangles: Triangle[];

    constructor(triangles: Triangle[]) {
        this.triangles = triangles;
    }

    public createPositionBuffer(): WebGLBuffer {
        let positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        var positions: number[] = [];

        for (let triangle of this.triangles) {
            this.pushVector(positions, triangle.v1);
            this.pushVector(positions, triangle.v2);
            this.pushVector(positions, triangle.v3);
        }

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        return positionBuffer;
    }

    public createNormalBuffer(): WebGLBuffer {
        let normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        var normals: number[] = [];

        for (let triangle of this.triangles) {
            for (var i = 0; i < 3; i++) {
                this.pushVector(normals, triangle.normal());
            }
        }

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
        return normalBuffer;
    }

    private pushVector(array: number[], vector: Vector3) {
        array.push(vector.x);
        array.push(vector.y);
        array.push(vector.z);
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