class Mesh {
    public readonly triangles: Triangle[];

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

    public getVertexCount(): number {
        return this.triangles.length * 3;
    }
}