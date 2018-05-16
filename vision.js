const QUAD_VERT = '\
#version 300 es\n\
\n\
precision mediump float;\n\
\n\
in vec2 a_pos;\n\
\n\
out vec2 v_pos;\n\
\n\
void main() {\n\
    v_pos = (a_pos + vec2(1.0, 1.0)) * 0.5;\n\
    gl_Position = vec4(a_pos, 0.0, 1.0);\n\
}\n\
';

const QUAD_FRAG = '\
#version 300 es\n\
\n\
precision mediump float;\n\
\n\
in vec2 v_pos;\n\
\n\
out vec4 color;\n\
\n\
void main() {\n\
    color = vec4(v_pos.x, v_pos.y, 0.0, 1.0);\n\
}\n\
';

const EXAMPLES_VERT = '\
#version 300 es\n\
\n\
precision mediump float;\n\
\n\
vec3 classColors[3] = vec3[](\n\
    vec3(1.0, 0.0, 1.0),\n\
    vec3(1.0, 1.0, 0.0),\n\
    vec3(0.0, 1.0, 1.0)\n\
);\n\
\n\
in vec2 a_pos;\n\
in float a_class;\n\
\n\
out vec3 v_color;\n\
\n\
void main() {\n\
    v_color = classColors[int(a_class)];\n\
    gl_Position = vec4(a_pos * 2.0 - vec2(1.0, 1.0), 0.0, 1.0);\n\
    gl_PointSize = 10.0;\n\
}\n\
';

const EXAMPLES_FRAG = '\
#version 300 es\n\
\n\
precision mediump float;\n\
\n\
in vec3 v_color;\n\
\n\
out vec4 color;\n\
\n\
void main() {\n\
    color = vec4(v_color, 1.0);\n\
}\n\
';

var canvas = document.getElementById("canvas");

const gl = canvas.getContext("webgl2");

var quadPosBuffer;
var quadVAO;
var quadShaderProgram;

var numExamples;
var examplesPosBuffer;
var examplesClassBuffer;
var examplesVAO;
var examplesShaderProgram;

if (gl) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    quadShaderProgram = createProgram(gl, QUAD_VERT, QUAD_FRAG);
    examplesShaderProgram = createProgram(gl, EXAMPLES_VERT, EXAMPLES_FRAG);
    
    quadPosBuffer = createBuffer(gl, new Float32Array(
            [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]));
    quadVAO = gl.createVertexArray();
    gl.bindVertexArray(quadVAO);
    bindAttribute(gl, quadPosBuffer, quadShaderProgram.a_pos, 2);
    gl.bindVertexArray(null);
} else {
    document.body.innerHTML = "Your browser doesn't support WebGL 2.";
}

function setExamples(trainingData) {
    numExamples = trainingData.length;
    
    const posComponents = 2;
    var posArray = new Float32Array(numExamples * posComponents);
    var posArrayIndex = 0;
    const classComponents = 1;
    var classArray = new Float32Array(numExamples * classComponents);
    var classArrayIndex = 0;
    for (example of trainingData) {
        posArray[posArrayIndex++] = example.features[0][0];
        posArray[posArrayIndex++] = example.features[1][0];
        classArray[classArrayIndex++] = maxComponent(example.label); // maxComponent is defined in network.js
    }
    examplesPosBuffer = createBuffer(gl, posArray);
    examplesClassBuffer = createBuffer(gl, classArray);
    
    examplesVAO = gl.createVertexArray();
    gl.bindVertexArray(examplesVAO);
    bindAttribute(gl, examplesPosBuffer, examplesShaderProgram.a_pos, posComponents);
    bindAttribute(gl, examplesClassBuffer, examplesShaderProgram.a_class, classComponents);
    gl.bindVertexArray(null);
}

function render() {
    gl.useProgram(quadShaderProgram.programID);
    gl.bindVertexArray(quadVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    gl.useProgram(examplesShaderProgram.programID);
    gl.bindVertexArray(examplesVAO);
    gl.drawArrays(gl.POINTS, 0, numExamples);
}

// https://github.com/mapbox/webgl-wind

function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
    }
    
    return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
    var program = gl.createProgram();
    
    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program));
    }
    
    var wrapper = {programID: program};
    
    var numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (var i = 0; i < numAttributes; i++) {
        var attribute = gl.getActiveAttrib(program, i);
        wrapper[attribute.name] = gl.getAttribLocation(program, attribute.name);
    }
    var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (var i$1 = 0; i$1 < numUniforms; i$1++) {
        var uniform = gl.getActiveUniform(program, i$1);
        wrapper[uniform.name] = gl.getUniformLocation(program, uniform.name);
    }
    
    return wrapper;
}

function bindTexture(gl, texture, unit) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
}

// modified
function createBuffer(gl, data) {
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buffer;
}

function bindAttribute(gl, buffer, attribute, numComponents) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute, numComponents, gl.FLOAT, false, 0, 0);
}
