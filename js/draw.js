var sphereVertexPositionBuffer;
var sphereBaryCentricBuffer;
var gl;
var shaderProgram;

var mvMatrix = mat4.create();
var pMatrix = mat4.create();


function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}


function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    shaderProgram.baryCentricAttribute = gl.getAttribLocation(shaderProgram, "aBaryCentric");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    gl.enableVertexAttribArray(shaderProgram.baryCentricAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}


function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}


function startWebGl() 
{
    var canvas = document.getElementById("canvas");
    gl = canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    initBuffers(gl);
    initShaders();
    draw(gl);
}

function sphere(maxLevel = 3)
{
    function sphlit(tri){
        var p4 = vec3.normalize(vec3.scale(vec3.add(tri[0], tri[1], vec3.create()), 0.5));
        var p5 = vec3.normalize(vec3.scale(vec3.add(tri[1], tri[2], vec3.create()), 0.5));
        var p6 = vec3.normalize(vec3.scale(vec3.add(tri[2], tri[0], vec3.create()), 0.5));
        return [[p6, p4, tri[0]], [tri[2], p5, p6], [p5,p4,p6], [tri[1], p4, p5]];
    }

    var tri = [
        [vec3.create([1,0,0]), vec3.create([0,1,0]), vec3.create([0,0,1])],
        [vec3.create([1,0,0]), vec3.create([0,0,1]), vec3.create([0,-1,0])],
        [vec3.create([0,-1,0]), vec3.create([0,0,1]), vec3.create([-1,0,0])],
        [vec3.create([-1,0,0]), vec3.create([0,0,1]), vec3.create([0,1,0])],
        //*
        [vec3.create([0,1,0]), vec3.create([1,0,0]), vec3.create([0,0,-1])],
        [vec3.create([0,0,-1]), vec3.create([1,0,0]), vec3.create([0,-1,0])],
        [vec3.create([0,0,-1]), vec3.create([0,-1,0]), vec3.create([-1,0,0])],
        [vec3.create([0,0,-1]), vec3.create([-1,0,0]), vec3.create([0,1,0])],
        //*/
    ];

    for (var level = 0; level < maxLevel; ++level)
    {
        var nl = []
        for (var i = 0; i < tri.length; ++i)
        {
            newTris = sphlit(tri[i]);
            for (var j = 0; j < newTris.length; ++j)
            {
                nl.push(newTris[j]);
            }
        }
        tri = nl;
    }

    return tri;
}

function initBuffers(gl)
{
    sphereVertexPositionBuffer = gl.createBuffer();
    sphereBaryCentricBuffer = gl.createBuffer();

    vertices = [];
    baryCentric = []
    triangles = sphere(3);
    for (var i = 0; i < triangles.length; ++i)
    {
        for (var j=0; j<3; ++j)
        {
            for (var k=0; k<3; ++k)
            {
                vertices.push(triangles[i][j][k]);
            }
       }
       baryCentric.push(1.0);
       baryCentric.push(0.0);
       baryCentric.push(0.0);

       baryCentric.push(0.0);
       baryCentric.push(1.0);
       baryCentric.push(0.0);

       baryCentric.push(0.0);
       baryCentric.push(0.0);
       baryCentric.push(1.0);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    sphereVertexPositionBuffer.numItems = vertices.length/3;

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBaryCentricBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(baryCentric), gl.STATIC_DRAW);
    sphereBaryCentricBuffer.numItems = vertices.length/3;

}

var angle = 0.0;

function draw(gl) 
{
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [0.0, 0.0, -3.0]);
    mat4.rotate(mvMatrix, angle, [1.0, 1.0, 0.0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereBaryCentricBuffer);
    gl.vertexAttribPointer(shaderProgram.baryCentricAttribute, 3, gl.FLOAT, false, 0, 0);
 
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLES, 0, sphereVertexPositionBuffer.numItems);

    angle += 0.05;
    setTimeout(function(){draw(gl);}, 100);
}

