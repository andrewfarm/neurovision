const VERT = '\
#version 300 es\n\
\n\
precision mediump float;\n\
\n\
in vec2 a_pos;\n\
\n\
out vec2 v_pos;\n\
\n\
void main() {\n\
    v_pos = a_pos;\n\
    gl_Position = vec4(a_pos, 0, 1);\n\
}\n\
';

const FRAG = '\
#version 300 es\n\
\n\
precision mediump float;\n\
\n\
in vec2 v_pos;\n\
\n\
out vec4 color;\n\
\n\
void main() {\n\
    color = vec4(v_pos.x, v_pos.y, 0, 1);\n\
}\n\
';

var canvas = document.getElementById("canvas");

const gl = canvas.getContext("webgl2");

var quadPosBuffer;
var quadVAO;
var shaderProgram;

if (gl) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    
    shaderProgram = createProgram(gl, VERT, FRAG);
    
    quadPosBuffer = createBuffer(gl, new Float32Array(
            [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]));
    quadVAO = gl.createVertexArray();
    gl.bindVertexArray(this.quadVAO);
    bindAttribute(gl, quadPosBuffer, shaderProgram.a_pos, 2);
    gl.bindVertexArray(null);
    
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(shaderProgram.programID);
    gl.bindVertexArray(quadVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
} else {
    document.body.innerHTML = "Your browser doesn't support WebGL 2.";
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
