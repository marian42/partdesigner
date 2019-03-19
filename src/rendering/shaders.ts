const VERTEX_SHADER = `
    attribute vec4 vertexPosition;
    attribute vec4 normal;

    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;

    varying vec3 v2fNormal;

    void main() {
        v2fNormal = (modelViewMatrix * vec4(normal.xyz, 0.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vertexPosition;
    }
`;


const FRAGMENT_SHADER = `
    precision mediump float;

    const vec3 lightDirection = vec3(-0.7, 0.7, 0.14);
    const float ambient = 0.2;
    const float diffuse = 0.8;
    const float specular = 0.3;
    const vec3 viewDirection = vec3(0.0, 0.0, 1.0);

    varying vec3 v2fNormal;

    uniform vec3 albedo;
    uniform float alpha;

    void main() {
        vec3 color = albedo * (ambient
             + diffuse * (0.5 + 0.5 * dot(lightDirection, v2fNormal))
             + specular * pow(max(0.0, dot(reflect(-lightDirection, v2fNormal), viewDirection)), 2.0));

        gl_FragColor = vec4(color.r, color.g, color.b, alpha);
    }
`;

const BUFFER_FRAGMENT_SHADER = `
    precision mediump float;

    varying vec3 v2fNormal;

    void main() {
        vec3 normal = vec3(0.5) + 0.5 * normalize(v2fNormal);
        gl_FragColor = vec4(normal.xy, 50.0 * (1.0 - gl_FragCoord.z), 1.0);
    }
`;

const COUNTOUR_VERTEX = `
    attribute vec2 vertexPosition;

    varying vec2 uv;

    void main() {
        uv = vertexPosition / 2.0 + vec2(0.5);
        gl_Position = vec4(vertexPosition, 0.0, 1.0);
    }
`;

const CONTOUR_FRAGMENT = `
    precision mediump float;

    uniform sampler2D buffer;
    uniform vec2 resolution;

    varying vec2 uv;

    vec4 getNormalAndDepth(vec2 uv) {
        vec4 sample = texture2D(buffer, uv);
        vec3 normal = vec3(sample.xy * 2.0 - vec2(1.0), 0.0);
        normal.z = sqrt(1.0 - normal.x * normal.x - normal.y * normal.y);
        return vec4(normalize(normal), abs(sample.z));
    }

    const float DEPTH_THRESHOLD = 0.01;
    const float NORMAL_THRESHOLD = 0.8;

    bool isContour(vec2 uv, float referenceDepth, vec3 referenceNormal) {
        vec4 normalAndDepth = getNormalAndDepth(uv);

        if (abs(normalAndDepth.a - referenceDepth) > DEPTH_THRESHOLD) {
            return true;
        }

        if (abs(dot(normalAndDepth.xyz, referenceNormal)) < NORMAL_THRESHOLD) {
            return true;
        }

        return false;
    }

    const vec3 lightDirection = vec3(-0.7, 0.7, 0.14);
    const float ambient = 0.2;
    const float diffuse = 0.6;
    const float specular = 0.7;
    const vec3 viewDirection = vec3(0.0, 0.0, 1.0);
    const vec3 clearColor = vec3(0.9);
    const vec3 albedo = vec3(0.6, 0.6, 0.6);
    
    vec3 getFragmentColor(vec3 normal, float depth) {
        if (depth > 0.9999) {
            return clearColor;
        }

        return albedo * (ambient
            + diffuse * (0.5 + 0.5 * dot(lightDirection, normal))
            + specular * pow(max(0.0, dot(reflect(-lightDirection, normal), viewDirection)), 2.0));
    }

    void main() {
        vec2 pixelSize = vec2(1.0 / resolution.x, 1.0 / resolution.y);

        vec4 normalAndDepth = getNormalAndDepth(uv);
        float depth = normalAndDepth.a;
        vec3 normal = normalAndDepth.xyz;

        float contour = 0.0;

        for (float x = -2.0; x < 2.0; x++) {
            for (float y = -2.0; y < 2.0; y++) {
                if ((x == 0.0 && y == 0.0) || !isContour(uv + pixelSize * vec2(x, y), depth, normal)) {
                    continue;
                }
                float dst = 1.0 - (x * x + y * y) / 6.0;
                contour = max(contour, dst);
            }
        }
        vec3 fragment = getFragmentColor(normal, depth);

        gl_FragColor = vec4(mix(fragment, vec3(0.0), contour), 1.0);
    }
`