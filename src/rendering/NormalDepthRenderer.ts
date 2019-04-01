class NormalDepthRenderer implements Renderer {
    private shader: Shader;

    private vertices: WebGLBuffer;
    private normals: WebGLBuffer;

    public transform: Matrix4;

    private vertexCount: number;

    constructor() {
        this.prepareShaders();
        this.transform = Matrix4.getIdentity();
    }

    private prepareShaders() {
        this.shader = new Shader(VERTEX_SHADER, NORMAL_FRAGMENT_SHADER);
        this.shader.setAttribute("vertexPosition");
        this.shader.setAttribute("normal");
        this.shader.setUniform("projectionMatrix");
        this.shader.setUniform("modelViewMatrix");
    }

    public setMesh(mesh: Mesh) {
        this.vertexCount = mesh.getVertexCount();
        this.vertices = mesh.createVertexBuffer();
        this.normals = mesh.createNormalBuffer();
    }

    public render(camera: Camera) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, camera.frameBuffer);
        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.clearColor(0.5, 0.5, -1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices);
        gl.vertexAttribPointer(this.shader.attributes["vertexPosition"], 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.shader.attributes["vertexPosition"]);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normals);
        gl.vertexAttribPointer(this.shader.attributes["normal"], 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.shader.attributes["normal"]);
      
        gl.useProgram(this.shader.program);
      
        gl.uniformMatrix4fv(this.shader.attributes["projectionMatrix"], false, camera.getProjectionMatrix().elements);
        gl.uniformMatrix4fv(this.shader.attributes["modelViewMatrix"], false, this.transform.times(camera.transform).elements);
      
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}