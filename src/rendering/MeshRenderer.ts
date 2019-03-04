class MeshRenderer {
    gl: WebGLRenderingContext;

    shader: Shader;

    positions: WebGLBuffer;
    normals: WebGLBuffer;

    mesh: Mesh;

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;

        this.shader = new Shader(gl, VERTEX_SHADER, FRAGMENT_SHADER);

        this.shader.setAttribute(gl, "vertexPosition");
        this.shader.setAttribute(gl, "normal");
        this.shader.setUniform(gl, "projectionMatrix");
        this.shader.setUniform(gl, "modelViewMatrix");
    }

    public setMesh(mesh: Mesh) {
        this.mesh = mesh;
        this.positions = mesh.createPositionBuffer(this.gl);
        this.normals = mesh.createNormalBuffer(this.gl);
    }

    public render(camera: Camera) {
        let gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positions);
        gl.vertexAttribPointer(this.shader.attributes["vertexPosition"], 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.shader.attributes["vertexPosition"]);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normals);
        gl.vertexAttribPointer(this.shader.attributes["normal"], 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.shader.attributes["normal"]);
      
        gl.useProgram(this.shader.program);
      
        gl.uniformMatrix4fv(this.shader.attributes["projectionMatrix"], false, camera.getProjectionMatrix());
        gl.uniformMatrix4fv(this.shader.attributes["modelViewMatrix"], false,
           [1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, -10, 1]);
      
        gl.drawArrays(gl.TRIANGLES, 0, this.mesh.triangles.length);
    }
}