"use strict";

var bufferId;
var canvas;
var gl;
var program;

var positions = [];
var colors = [];
var numTimesToSubdivide = 0;
var vertices;
var cBuffer;
var vBuffer;
var colorLoc;
var positionLoc;
var baseColors = [];
var colorList = [];

// rotate var
var theta = 0.0;
var rotateSpeed = 0.01;
var oriRotateSpeed = 0.01;

var thetaLoc;
var direction = true;
var count = 0;
var canRotate = true;
var keepRotate = false;

// animation var
var animationFrameId;
var isPaused = true;

// scale var
var scale = [1,1];
var scaleLoc;
var canScale = false;

// transition var
var transLoc;
var trans = [0,0];
var changeDirection = false;
var oriTranSpeed = 0.005;
var speedX = 0.005;
var speedY = 0.005;
var canXgoLeft = false;
var canXgoRight = true;
var canYgoDown= false;
var canYgoUp = true;
var canTrans = false;

// change color when hit corner var
var changeColorOn = true;
var currentColorNumber = 0;

// User interface
var sliderRec;
var sliderRot;
var sliderTrans;
var buttonStart;
var buttonReset;
var slide_rec;
var slide_rot;
var slide_trans;
var color_menu;
var color_chose;
var toggle_color_change;

// Special var to notice
// If the canvas is not square, we need to recalculate the ratio for it as it is not 1: 1, we calculate it by using width / height to get the ratio
// This ratio will be apply to all the sitaution that require the x coordination of our object. The current x value need to be divide by ratio to get the actual x coordinate in the rectangle.
var ratio;
var ratioLoc;

var currLoc;
window.onload = function init(){

    //...........................................................
    // Initialization
    //...........................................................

    // Get dom object
    canvas = document.getElementById("gl-canvas");
    sliderRec = document.getElementById("sliderRec");
    sliderRot = document.getElementById("sliderRot");
    sliderTrans = document.getElementById("sliderTrans")
    buttonStart = document.querySelector(".start");
    buttonReset = document.querySelector(".reset");
    slide_rec = document.querySelector(".slide_rec");
    slide_rot = document.querySelector(".slide_rot");
    slide_trans = document.querySelector(".slide_trans");
    // color_menu = document.querySelector(".dropbtn");
    color_chose = document.querySelector(".colors");
    toggle_color_change = document.querySelector(".colorChangeBtn");

    gl = canvas.getContext("webgl2");
    if(!gl){
        alert("WebGL 2.0 isn't available");
    }
    
    // Calculate the ratio of rectangle
    ratio = canvas.width / canvas.height;

    //  Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    // Clear the canvas
    gl.clearColor(0,0.125,0.2473, 1.0);

    vertices = [
        // middle point
        vec3(0.0000,  0.0000, -1.0000),
        // upper point
        vec3(0.0000,  0.4809,  0.3333),

        // left point
        vec3(-0.4165, -0.2405,  0.3333),

        // right point
        vec3(0.4165, -0.2405,  0.3333)
    ];

    // currLoc
    currLoc = [
        [vertices[1][0],vertices[1][1]],
        [vertices[2][0],vertices[2][1]],
        [vertices[3][0],vertices[3][1]]
    ];

    // array to store different color combinations
    colorList = [
        [ // red blue green
            vec3(1.0, 0.0, 0.0),
            vec3(0.0, 1.0, 0.0),
            vec3(0.0, 0.0, 1.0),
            vec3(0.0, 0.0, 0.0)
        ],
        [ // white black orange
            vec3(1.0, 1.0, 1.0),
            vec3(0.906,0.467,0.098),
            vec3(0.0, 0.0, 0.0),
            vec3(0.0, 0.0, 0.0)
        ],
        [   //  black green grey
            vec3(0.686,0.749,0.863),
            vec3(0.0, 0.0, 0.0),
            vec3(0.306,0.529,0.239),
            vec3(0.0, 0.0, 0.0)
        ],

    ];

    // basic color = red blue green
    baseColors = colorList[0];

    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram( program );

    // look up where the vertex data needs to go.
    colorLoc = gl.getAttribLocation(program, "aColor");
    positionLoc = gl.getAttribLocation( program, "aPosition" );

    // Turn on the attribute
    gl.enableVertexAttribArray(colorLoc);
    gl.enableVertexAttribArray(positionLoc);

    // lookup uniforms
    scaleLoc = gl.getUniformLocation(program, "uScale");
    thetaLoc = gl.getUniformLocation(program, "uTheta");
    transLoc = gl.getUniformLocation(program, "uTrans");
    ratioLoc = gl.getUniformLocation(program, "ratio");
    // colorLoc = gl.getUniformLocation(program, "aColor");

    triangleDivision(vertices);

    // set up ratio
    gl.uniform1f(ratioLoc, ratio);

    // set up scaling
    gl.uniform2fv(scaleLoc, scale);

    // set up transition
    gl.uniform2fv(transLoc, trans);

    //...........................................................
    // Handle user input
    //...........................................................

    // When the user choose color
    color_chose.onchange = function(e) {
        // clear colors before
        colors=[];

        // change color according to the user input
        if(e.target.value=="redbluegreen"){
            baseColors = colorList[0];
        }
        else if(e.target.value=="whiteblackorange"){
            baseColors =colorList[1];
        }
        else if (e.target.value=="blackgreengrey"){
            baseColors = colorList[2];
        }
    
        triangleDivision(vertices);
    }

    // When the user toggle change color when hit corner, reset the variable to allow that animation happen

    toggle_color_change.onclick = function(e) {
        if(changeColorOn){
            changeColorOn = false;
            toggle_color_change.classList.add("changeColorOff");
            toggle_color_change.classList.remove("changeColorOn");
            toggle_color_change.innerText = "Change color when hit corner: Off";
        }
        else{
            changeColorOn = true;
            toggle_color_change.classList.add("changeColorOn");
            toggle_color_change.classList.remove("changeColorOff"); 
            toggle_color_change.innerText = "Change color when hit corner: On";
        }
    }
    // When the user select different number of sub division, change the value
    sliderRec.onchange = function(e) {
        numTimesToSubdivide = parseInt(e.target.value);
        triangleDivision(vertices);
    };

    // update UI
    sliderRec.oninput = function(e){
        slide_rec.innerHTML = `Recursive steps :  ${e.target.value}`;
    }

    // When the user select different rotation speed, change the value
    sliderRot.onchange = function(e) {
        rotateSpeed = oriRotateSpeed;
        rotateSpeed += parseInt(e.target.value) * oriRotateSpeed ;
    };

    // update UI
    sliderRot.oninput = function(e){
        slide_rot.innerHTML = `Rotation speed :  ${e.target.value}`;
    }

     // When the user select different transition speed, change the value
    sliderTrans.onchange = function(e) {
        speedX = speedY = oriTranSpeed;
        var speedExtra = parseInt(e.target.value) * oriTranSpeed;
        speedX += speedExtra;
        speedY = speedX;
    };

    // update UI
    sliderTrans.oninput = function(e){
        slide_trans.innerHTML = `Transition speed :  ${e.target.value}`;
    }

    // When the user click start/ resume, start or resume the animation
    buttonStart.onclick = function(e) {
        if(!buttonStart.classList.contains("stop")){
            buttonStart.classList.remove("start");
            buttonStart.classList.add("stop");
            buttonStart.innerHTML = "STOP";
            isPaused = false;
        }
        else{
            buttonStart.classList.add("start");
            buttonStart.classList.remove("stop");
            buttonStart.innerHTML = "Resume";
            isPaused = true;
        }
    };

    // When the user click reset, reload the page
    buttonReset.onclick = function(e) {
        window.location.reload();
    };

    render();
}

function transTriangle(){
    // console.log(currLoc[2][0]);
    var outOfBound = false;
    // check for out of bound
    currLoc.forEach(item=>{
        item.forEach(coor =>{
            if(coor >= 1 || coor <=-1){
                outOfBound = true;
            }
        })
    });

    // if all ok, normal transition
    if(!outOfBound){
        trans[0] += speedX;
        trans[1] += speedY;
        for(var i = 0; i < 3; i++){
            for(var j = 0; j < 2; j++){
                currLoc[i][j] += j==0 ? speedX/ratio : speedY;
            }
        }
    }
    // not ok, object hit wall already
    else{
        // Object should change direction
        changeDirection = true;

        for(var i = 0; i < 3; i++){
            for(var j = 0; j < 2; j++){
                // handle x coordinate
                if(j == 0){
                    // x hit right wall
                    if(currLoc[i][j] >= 1){
                        // reflection
                        for(var k = 0; k < 3; k++){
                            currLoc[k][0] -= speedX/ratio;
                        }
                        trans[0] -= speedX;
            
                        canXgoLeft = true;
                        canYgoDown = true;
                        canYgoUp = true;
                        canXgoRight = false;
                    }
                    // x hit left wall
                    else if(currLoc[i][j] <= -1){
                        // reflection
                        for(var k = 0; k < 3; k++){
                            currLoc[k][0] -= speedX/ratio;
                        }
                        trans[0] -= speedX;
                        canXgoLeft = false;
                        canYgoDown = true;
                        canYgoUp = true;
                        canXgoRight = true;
                    }
                }
                // handle y coordinate
                else{
                    // y hit upper wall
                    if(currLoc[i][j] >= 1){
                        // reflection
                        for(var k = 0; k < 3; k++){
                            currLoc[k][1] -= speedY;
                        }
                        trans[1] -= speedY;
                        
                        canYgoDown = true;
                        canYgoUp = false;
                        canXgoLeft = true;
                        canXgoRight = true;
                    }
                    // y hit bottom wall
                    else if(currLoc[i][j] <= -1){
                        // reflection
                        for(var k = 0; k < 3; k++){
                            currLoc[k][1] -= speedY;
                        }
                        // currLoc[i][j] -= speedY;
                        trans[1] -= speedY;
                        canYgoDown = false;
                        canYgoUp = true;
                        canXgoLeft = true;
                        canXgoRight = true;
                    }
                }
            }
        }
    }
    // Implement logic to decide the next transition positive or negative for x and y
    if(changeDirection){
        // change color
        if(changeColorOn){
            changeColor();
        }
        // cannot change direction again once determined
        changeDirection = false;
        var randomNumber = Math.floor(Math.random() * 2) + 1;
        
        // reset both speed to non-negative
        speedX = Math.abs(speedX);
        speedY = Math.abs(speedY); 

        // apply positive to both x transition and y transition
        // if x cannot go right then x shud go left
        // if y cannot go up then y shud go down
        if(randomNumber == 1){
            speedX = canXgoRight ? speedX : -speedX;
            speedY = canYgoUp ? speedY: -speedY;
        }
        // apply negative to both x transition and y transition
        // if x cannot go left then x shud go right
        // if y cannot go down then y shud go up
        else{
            speedX = canXgoLeft ? -speedX : speedX;
            speedY = canYgoDown ? -speedY : speedY;
        }
    }

    // reset transalation to the object
    gl.uniform2fv(transLoc, trans);

}

// Rotate shape function
function rotate(){
    theta += (direction ? -rotateSpeed: rotateSpeed);
    for(var i = 0; i < 3; i++){
        switch(i){
            case 0 :
                var xOldLoc = vertices[1][0];
                var yOldLoc = vertices[1][1];
                break;
            case 1 :
                var xOldLoc = vertices[2][0];
                var yOldLoc = vertices[2][1];
                break;
            case 2 :
                var xOldLoc = vertices[3][0];
                var yOldLoc = vertices[3][1];
                break;
        }
        
        for(var j = 0; j < 2; j++){
            // x location
            if(j == 0){
                currLoc[i][j] = ((-Math.sin(theta) * yOldLoc) + (Math.cos(theta) * xOldLoc))/ratio;
            }
            // y location
            else{
                currLoc[i][j] =( Math.sin(theta) * (xOldLoc)) + (Math.cos(theta) * yOldLoc);
            }
        }
    }
    
     // reset the theta properties
     gl.uniform1f(thetaLoc, theta);
    // Change the direction of rotation after reach 180 degree
    // after rotate left for 180 degree
    if(theta >= Math.PI){
            direction = true;
            count++;
    }
    // after rotate right for 180 degree
    else if(theta <= -Math.PI){
            direction = false;
            count++;
    }
    // Stop the rotation when the triagle return to its original orientation after finished rotate left and right
    if(count == 2 && theta <= rotateSpeed && !keepRotate ){
        keepRotate = true;
        canRotate = false;
        canScale = true;
     }   
}


// function to handle colorChange
function changeColor(){
    // get upper limit of the color combination
    var size  = colorList.length;
    colors=[];
    // rotation of each color combination
    currentColorNumber = currentColorNumber < size-1 ? currentColorNumber+1 : 0;
    // change base color
    baseColors = colorList[currentColorNumber];
    // new triangle with new color
    triangleDivision(vertices);
}

function scaleTriangle(){
    // if scale havent reach suitable size
    if(scale[0]<1.5){
        scale[0] +=0.002;
        scale[1] +=0.002;
    }
    // scale reach suitable size
    else{
        // keep track latest position of three point
        for(var i = 0; i < 3; i++){
            for(var j = 0; j < 2; j++){
                currLoc[i][j] *= j==0 ? scale[0] : scale[0];
            }
        }
        canScale = false;
        canTrans = true;
    }
    
    // reset the scale of the object
    gl.uniform2fv(scaleLoc, scale);

}
function triangle( a, b, c, color )
{
    colors.push(baseColors[color]);
    positions.push(a);
    colors.push(baseColors[color]);
    positions.push(b);
    colors.push(baseColors[color]);
    positions.push(c);
    
}

function tetra( a, b, c, d )
{
    // tetrahedron with each side using
    // a different color
    triangle(a, c, b, 0);
    triangle(a, c, d, 1);
    triangle(a, b, d, 2);
    triangle(b, c, d, 3);
}

function divideTetra(a, b, c, d, count){

    // check for end of recursion
    if (count == 0) {
        tetra(a, b, c, d);
    }
    else {
        // find midpoints of sides
        // divide four smaller tetrahedra
        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var ad = mix(a, d, 0.5);
        var bc = mix(b, c, 0.5);
        var bd = mix(b, d, 0.5);
        var cd = mix(c, d, 0.5);

        --count;

        // three new triangles
        divideTetra(a, ab, ac, ad, count);
        divideTetra(ab,  b, bc, bd, count);
        divideTetra(ac, bc,  c, cd, count);
        divideTetra(ad, bd, cd,  d, count);
    }
}

// Triangle division function
function triangleDivision(vertices){
    positions = [];
    divideTetra( vertices[0], vertices[1], vertices[2], vertices[3], numTimesToSubdivide);

    //  reCreate a buffer object, initialize it, and associate it with the
    //  associated attribute variable in our vertex shader
    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,  flatten(colors), gl.STATIC_DRAW);
    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
    // gl.uniform3fv(colorLoc,colors);

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,  flatten(positions), gl.STATIC_DRAW);
    gl.vertexAttribPointer( positionLoc, 3, gl.FLOAT, false, 0, 0 );
}

function render(){
    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawArrays( gl.TRIANGLES, 0, positions.length );
    //  positions = [];

    // start rotate
    if(!isPaused && canRotate && !canScale && !canTrans){
        // transTriangle();

        rotate();
    }
    // start scaling 
    else if(!isPaused && !canRotate && canScale && !canTrans){
        scaleTriangle();
    }
    // start transition
    else if(!isPaused && !canScale && !canRotate  && canTrans){
        transTriangle();
    }
    // if(!isPaused && canTrans && keepRotate){
    //     rotate();
    // }
    // loop
    requestAnimationFrame(render);
}

