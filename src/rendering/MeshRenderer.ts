class MeshRenderer implements Renderer {
    shader: Shader;

    positions: WebGLBuffer;
    normals: WebGLBuffer;

    mesh: Mesh;
    transform: Matrix4;
    color: Vector3 = new Vector3(1, 0, 0);
    alpha: number = 1;

    constructor() {
        this.shader = new Shader(gl, VERTEX_SHADER, FRAGMENT_SHADER);

        this.shader.setAttribute(gl, "vertexPosition");
        this.shader.setAttribute(gl, "normal");
        this.shader.setUniform(gl, "projectionMatrix");
        this.shader.setUniform(gl, "modelViewMatrix");
        this.shader.setUniform(gl, "albedo");
        this.shader.setUniform(gl, "alpha");

        this.transform = Matrix4.getIdentity();
    }

    public setMesh(mesh: Mesh) {
        this.mesh = mesh;
        this.positions = mesh.createPositionBuffer();
        this.normals = mesh.createNormalBuffer();
    }

    public render(camera: Camera) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positions);
        gl.vertexAttribPointer(this.shader.attributes["vertexPosition"], 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.shader.attributes["vertexPosition"]);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normals);
        gl.vertexAttribPointer(this.shader.attributes["normal"], 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.shader.attributes["normal"]);
      
        gl.useProgram(this.shader.program);
      
        gl.uniformMatrix4fv(this.shader.attributes["projectionMatrix"], false, camera.getProjectionMatrix().elements);
        gl.uniformMatrix4fv(this.shader.attributes["modelViewMatrix"], false, this.transform.times(camera.transform).elements);
        gl.uniform3f(this.shader.attributes["albedo"], this.color.x, this.color.y, this.color.z);
        gl.uniform1f(this.shader.attributes["alpha"], this.alpha);
      
        gl.drawArrays(gl.TRIANGLES, 0, this.mesh.triangles.length * 3);
    }
}