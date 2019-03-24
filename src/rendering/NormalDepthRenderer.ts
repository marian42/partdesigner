class NormalDepthRenderer implements Renderer {
    normalShader: Shader;
    colorShader: Shader;

    positions: WebGLBuffer;
    normals: WebGLBuffer;

    mesh: Mesh;
    transform: Matrix4;

    color: Vector3;
    alpha: number = 1;

    constructor() {
        this.prepareShaders();
        this.transform = Matrix4.getIdentity();
    }

    private prepareShaders() {
        this.colorShader = new Shader(VERTEX_SHADER, FRAGMENT_SHADER);
        this.colorShader.setAttribute("vertexPosition");
        this.colorShader.setAttribute("normal");
        this.colorShader.setUniform("projectionMatrix");
        this.colorShader.setUniform("modelViewMatrix");
        this.colorShader.setUniform("albedo");
        this.colorShader.setUniform("alpha");

        this.normalShader = new Shader(VERTEX_SHADER, NORMAL_FRAGMENT_SHADER);
        this.normalShader.setAttribute("vertexPosition");
        this.normalShader.setAttribute("normal");
        this.normalShader.setUniform("projectionMatrix");
        this.normalShader.setUniform("modelViewMatrix");
    }

    public setMesh(mesh: Mesh) {
        this.mesh = mesh;
        this.positions = mesh.createPositionBuffer();
        this.normals = mesh.createNormalBuffer();
    }

    public render(camera: Camera) {
        this.renderColor(camera);
        this.renderNormals(camera);
    }

    public renderColor(camera: Camera) {        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positions);
        gl.vertexAttribPointer(this.colorShader.attributes["vertexPosition"], 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.colorShader.attributes["vertexPosition"]);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normals);
        gl.vertexAttribPointer(this.colorShader.attributes["normal"], 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.colorShader.attributes["normal"]);
      
        gl.useProgram(this.colorShader.program);
      
        gl.uniformMatrix4fv(this.colorShader.attributes["projectionMatrix"], false, camera.getProjectionMatrix().elements);
        gl.uniformMatrix4fv(this.colorShader.attributes["modelViewMatrix"], false, this.transform.times(camera.transform).elements);
        gl.uniform3f(this.colorShader.attributes["albedo"], this.color.x, this.color.y, this.color.z);
        gl.uniform1f(this.colorShader.attributes["alpha"], this.alpha);
      
        gl.drawArrays(gl.TRIANGLES, 0, this.mesh.triangles.length * 3);
        gl.flush();
    }

    public renderNormals(camera: Camera) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, camera.frameBuffer);
        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.clearColor(0.5, 0.5, -1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positions);
        gl.vertexAttribPointer(this.normalShader.attributes["vertexPosition"], 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.normalShader.attributes["vertexPosition"]);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normals);
        gl.vertexAttribPointer(this.normalShader.attributes["normal"], 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.normalShader.attributes["normal"]);
      
        gl.useProgram(this.normalShader.program);
      
        gl.uniformMatrix4fv(this.normalShader.attributes["projectionMatrix"], false, camera.getProjectionMatrix().elements);
        gl.uniformMatrix4fv(this.normalShader.attributes["modelViewMatrix"], false, this.transform.times(camera.transform).elements);
      
        gl.drawArrays(gl.TRIANGLES, 0, this.mesh.triangles.length * 3);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}