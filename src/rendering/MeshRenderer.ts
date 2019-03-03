const vertexSource = `
    attribute vec4 vertexPosition;

    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;

    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;
    }
  `;


const fragmentSource = `
    void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
`;

class MeshRenderer {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;
    shaderProgram: WebGLShader;
    vertexCount: number;

    attributeVertexPosition: number;
    attributeProjectionMatrix: WebGLUniformLocation;
    attributeModelViewMatrix: WebGLUniformLocation;

    positions: WebGLBuffer;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
		this.gl = canvas.getContext("webgl") as WebGLRenderingContext;

		if (this.gl == null) {
			throw new Error("WebGL is not supported.");
        }
        
        this.shaderProgram = this.createShaderProgram(vertexSource, fragmentSource);

        this.attributeVertexPosition = this.gl.getAttribLocation(this.shaderProgram, 'vertexPosition');
        this.attributeProjectionMatrix = this.gl.getUniformLocation(this.shaderProgram, 'projectionMatrix');
        this.attributeModelViewMatrix = this.gl.getUniformLocation(this.shaderProgram, 'modelViewMatrix');
    }

    public setMesh(mesh: Mesh) {
        this.positions = mesh.createPositionBuffer(this.gl);
        this.vertexCount = mesh.triangles.length * 3;
    }

    private getProjectionMatrix(near = 0.1, far = 1000, fov = 45, aspectRatio = 4 / 3): number[] {
        return [
            1 / (Math.tan(fov * DEG_TO_RAD / 2) * aspectRatio), 0, 0, 0,
            0, 1 / Math.tan(fov * DEG_TO_RAD / 2), 0, 0,
            0, 0, -(far + near)/(far - near), -1,
            0, 0, -0.2, 0
        ];
    }

    public drawScene() {
        let gl = this.gl;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);      
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positions);
        gl.vertexAttribPointer(this.attributeVertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.attributeVertexPosition);
      
        gl.useProgram(this.shaderProgram);
      
        gl.uniformMatrix4fv(this.attributeProjectionMatrix, false, this.getProjectionMatrix());
        gl.uniformMatrix4fv(this.attributeModelViewMatrix, false,
           [1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, -10, 1]);
      
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
      }
    
    private loadShader(type: number, source: string): WebGLShader {
        let shader = this.gl.createShader(type);      
        this.gl.shaderSource(shader, source);      
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
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