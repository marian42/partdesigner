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

    private formatPoint(vector: Vector3): string {
        return (vector.x * 20).toFixed(4) + " " + (-vector.y * 20).toFixed(4) + " " + (-vector.z * 20).toFixed(4);
    }

    private formatVector(vector: Vector3): string {
        return (vector.x).toFixed(4) + " " + (-vector.y).toFixed(4) + " " + (-vector.z).toFixed(4);
    }

    private formatConnector(position: Vector3, block: Block): string {
        let result = "0 PE_CONN ";

        switch (block.type) {
            case BlockType.PinHole: result += "0 2"; break;
            case BlockType.AxleHole: result += "0 6"; break;
            case BlockType.Axle: result += "0 7"; break;
            case BlockType.Pin: result += "0 3"; break;
            case BlockType.BallJoint: result += "1 5"; break;
            default: throw new Error("Unknown block type: " + block.type);
        }

        result += " " + this.formatVector(block.right) + " " + this.formatVector(block.forward) + " " + this.formatVector(block.up) + " " + this.formatPoint(position.plus(new Vector3(1, 1, 1).plus(block.forward)).times(0.5)) + " 0 0 0.8 0 0\n";
        return result;
    }

    public saveSTLFile(scalingFactor: number, filename = "part.stl") {
        let blob = new Blob([this.createSTLFile(scalingFactor)], { type: "application/octet-stream" });
        let link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }

    private createPartFile(part: Part, name: string, filename: string): string {
        var result: string = `0 FILE ` + filename + `
0 Description: part
0 Name: 
0 Author: 
0 BFC CERTIFY CCW
1 16 0.0000 -0.5000 0.0000 1.0000 0.0000 0.0000 0.0000 1.0000 0.0000 0.0000 0.0000 1.0000 part.obj_grouped
0 NOFILE
0 FILE part.obj_grouped
0 Description: part.obj_grouped
0 Name: 
0 Author: 
0 ModelType: Part
0 BFC CERTIFY CCW
1 16 0.0000 0.0000 0.0000 1.0000 0.0000 0.0000 0.0000 1.0000 0.0000 0.0000 0.0000 1.0000 part.obj
`;

        for (let position of part.blocks.keys()) {
            let startBlock = part.blocks.get(position);

            if (startBlock.type == BlockType.Solid) {
                continue;
            }

            let previousBlock = part.blocks.getOrNull(position.minus(startBlock.forward));
            let isFirstInRow = previousBlock == null || previousBlock.orientation != startBlock.orientation || previousBlock.type != startBlock.type;

            if (!isFirstInRow) {
                continue;
            }

            let block = startBlock;
            let offset = 0;
            while (true) {
                let nextBlock = part.blocks.getOrNull(position.plus(startBlock.forward));
                let isLastInRow = nextBlock == null || nextBlock.orientation != startBlock.orientation || nextBlock.type != startBlock.type;

                if (isLastInRow && offset % 2 == 0 && offset > 0) {
                    result += this.formatConnector(position.minus(startBlock.forward), block);
                } else if (offset % 2 == 0) {
                    result += this.formatConnector(position, block);
                }

                if (isLastInRow) {
                    break;
                }

                offset += 1;
                position = position.plus(startBlock.forward);
                block = nextBlock;
            }
        }

        result += `
0 NOFILE
0 FILE part.obj
0 Description: part.obj
0 Name: 
0 Author: 
0 BFC CERTIFY CCW
`;

    for (let triangle of this.triangles) {
        result += "3 16 " + this.formatPoint(triangle.v1) + " " + this.formatPoint(triangle.v2) + " " + this.formatPoint(triangle.v3) + "\n";
    }

    result += "0 NOFILE\n";
    return result;
    }

    public savePartFile(part: Part, name: string, filename = "part.part") {
        var content = this.createPartFile(part, name, filename);
        let link = document.createElement('a');
        link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
        link.download = filename;
        link.click();
    }

    public getVertexCount(): number {
        return this.triangles.length * 3;
    }
}