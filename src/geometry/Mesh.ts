class Mesh {
    private triangles: Triangle[];

    private vertexBuffer: WebGLBuffer = null;
    private normalBuffer: WebGLBuffer = null;

    constructor(triangles: Triangle[]) {
        this.triangles = triangles;
    }

    public createVertexBuffer(): WebGLBuffer {
        if (this.vertexBuffer != null) {
            return this.vertexBuffer;
        }

        let vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        var positions: number[] = [];

        for (let triangle of this.triangles) {
            this.pushVector(positions, triangle.v1);
            this.pushVector(positions, triangle.v2);
            this.pushVector(positions, triangle.v3);
        }

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        this.vertexBuffer = vertexBuffer;
        return vertexBuffer;
    }

    public createNormalBuffer(): WebGLBuffer {
        if (this.normalBuffer != null) {
            return this.normalBuffer;
        }

        let normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        var normals: number[] = [];

        for (let triangle of this.triangles) {
            if (triangle instanceof TriangleWithNormals) {
                this.pushVector(normals, triangle.n1);
                this.pushVector(normals, triangle.n2);
                this.pushVector(normals, triangle.n3);
            } else {
                for (var i = 0; i < 3; i++) {
                    this.pushVector(normals, triangle.normal());
                }
            }
        }

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
        this.normalBuffer = normalBuffer;
        return normalBuffer;
    }

    public createWireframeVertexBuffer(): WebGLBuffer {        
        let vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        var positions: number[] = [];

        for (let triangle of this.triangles) {
            this.pushVector(positions, triangle.v1);
            this.pushVector(positions, triangle.v2);
            this.pushVector(positions, triangle.v2);
            this.pushVector(positions, triangle.v3);
            this.pushVector(positions, triangle.v3);
            this.pushVector(positions, triangle.v1);
        }

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        return vertexBuffer;
    }

    private pushVector(array: number[], vector: Vector3) {
        array.push(vector.x);
        array.push(vector.y);
        array.push(vector.z);
    }

    private createSTLFile(scalingFactor: number): ArrayBuffer {
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
            this.writeTriangle(view, p, triangle, scalingFactor);
            p += 50;
        }

        return buffer;
    }

    private writeVector(view: DataView, offset: number, vector: Vector3) {
        view.setFloat32(offset, vector.z, true);
        view.setFloat32(offset + 4, vector.x, true);
        view.setFloat32(offset + 8, vector.y, true);
    }

    private writeTriangle(view: DataView, offset: number, triangle: Triangle, scalingFactor: number) {
        this.writeVector(view, offset, triangle.normal());
        this.writeVector(view, offset + 12, triangle.v1.times(scalingFactor));
        this.writeVector(view, offset + 24, triangle.v2.times(scalingFactor));
        this.writeVector(view, offset + 36, triangle.v3.times(scalingFactor));
        view.setInt16(offset + 48, 0, true);
    }

    public saveSTLFile(scalingFactor: number, filename = "part.stl") {
        let blob = new Blob([this.createSTLFile(scalingFactor)], { type: "application/octet-stream" });
        let link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }

    public getVertexCount(): number {
        return this.triangles.length * 3;
    }
}