class MeshRenderer implements Renderer {
    private shader: Shader;

    private vertices: WebGLBuffer;
    private normals: WebGLBuffer;

    private vertexCount: number;
    public transform: Matrix4;
    public color: Vector3 = new Vector3(1, 0, 0);
    public alpha: number = 1;

    constructor() {
        this.shader = new Shader(VERTEX_SHADER, FRAGMENT_SHADER);

        this.shader.setAttribute("vertexPosition");
        this.shader.setAttribute("normal");
        this.shader.setUniform("projectionMatrix");
        this.shader.setUniform("modelViewMatrix");
        this.shader.setUniform("albedo");
        this.shader.setUniform("alpha");

        this.transform = Matrix4.getIdentity();
    }

    public setMesh(mesh: Mesh) {
        this.vertexCount = mesh.getVertexCount();
        this.vertices = mesh.createVertexBuffer();
        this.normals = mesh.createNormalBuffer();
    }

    public render(camera: Camera) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
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
      
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
    }
}