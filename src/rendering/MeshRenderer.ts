const vertexSource = `
    attribute vec4 vertexPosition;
    attribute vec4 normal;

    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;

    varying vec3 v2fNormal;

    void main() {
        v2fNormal = normal.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;
    }
  `;


const fragmentSource = `
    precision mediump float;

    const vec3 lightDirection = vec3(-0.7, 0.7, 0.14);
    const float ambient = 0.2;
    const float diffuse = 0.8;
    const float specular = 0.3;
    const vec3 albedo = vec3(1.0, 1.0, 0.0);
    const vec3 viewDirection = vec3(0.0, 0.0, 1.0);

    varying vec3 v2fNormal;

    void main() {
        gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
        
        vec3 color = albedo * (ambient
             + diffuse * (0.5 + 0.5 * dot(lightDirection, v2fNormal))
             + specular * pow(max(0.0, dot(reflect(-lightDirection, v2fNormal), viewDirection)), 2.0)); 

        gl_FragColor = vec4(color.r, color.g, color.b, 1.0);
    }
`;

class MeshRenderer {
    gl: WebGLRenderingContext;

    shaderProgram: WebGLShader;

    attributeVertexPosition: number;
    attributeVertexNormal: number;
    attributeProjectionMatrix: WebGLUniformLocation;
    attributeModelViewMatrix: WebGLUniformLocation;

    positions: WebGLBuffer;
    normals: WebGLBuffer;

    mesh: Mesh;

    constructor(gl: WebGLRenderingContext) {
        this.gl = gl;

        this.shaderProgram = this.createShaderProgram(vertexSource, fragmentSource);

        this.attributeVertexPosition = gl.getAttribLocation(this.shaderProgram, 'vertexPosition');
        this.attributeVertexNormal = gl.getAttribLocation(this.shaderProgram, 'normal');
        this.attributeProjectionMatrix = gl.getUniformLocation(this.shaderProgram, 'projectionMatrix');
        this.attributeModelViewMatrix = gl.getUniformLocation(this.shaderProgram, 'modelViewMatrix');
    }

    public setMesh(mesh: Mesh) {
        this.mesh = mesh;
        this.positions = mesh.createPositionBuffer(this.gl);
        this.normals = mesh.createNormalBuffer(this.gl);
    }

    public render(camera: Camera) {
        let gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positions);
        gl.vertexAttribPointer(this.attributeVertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.attributeVertexPosition);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normals);
        gl.vertexAttribPointer(this.attributeVertexNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.attributeVertexNormal);
      
        gl.useProgram(this.shaderProgram);
      
        gl.uniformMatrix4fv(this.attributeProjectionMatrix, false, camera.getProjectionMatrix());
        gl.uniformMatrix4fv(this.attributeModelViewMatrix, false,
           [1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, -10, 1]);
      
        gl.drawArrays(gl.TRIANGLES, 0, this.mesh.triangles.length);
      }
    
    private loadShader(type: number, source: string): WebGLShader {
        let shader = this.gl.createShader(type);      
        this.gl.shaderSource(shader, source);      
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.log(source);
            throw new Error('An error occurred compiling the shaders: ' +  this.gl.getShaderInfoLog(shader));
        }

        return shader;
    }

    private createShaderProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
        const vertexShader = this.loadShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.loadShader(this.gl.FRAGMENT_SHADER, fragmentSource);
      
        const shaderProgram = this.gl.createProgram();
        this.gl.attachShader(shaderProgram, vertexShader);
        this.gl.attachShader(shaderProgram, fragmentShader);
        this.gl.linkProgram(shaderProgram);
      
        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            throw new Error('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(shaderProgram));
        }
      
        return shaderProgram;
    }
}