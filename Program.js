"use strict"
// Get dom object
const canvas = document.getElementById("gl-canvas");
const sliderRec = document.getElementById("sliderRec");
const sliderRot = document.getElementById("sliderRot");
const sliderTrans = document.getElementById("sliderTrans")
const buttonStart = document.querySelector(".start");
const buttonReset = document.querySelector(".reset");
const slide_rec = document.querySelector(".slide_rec");
const slide_rot = document.querySelector(".slide_rot");
const slide_trans = document.querySelector(".slide_trans");
const color_chose = document.querySelector(".colors");
const toggle_color_change = document.querySelector(".colorChangeBtn");
const magnet = document.querySelector(".magnet");

// webgl
let gl;
let program;
let colorLoc;
let positionLoc;
let matrixLoc;
let ratioLoc;
let currLoc;
let colors;
let positions;
let ratio;

// tetra 
let numTimesToSubdivide = 0;
let TVIdentClass;
let colorList;

// magnet mode
let mouseX;
let mouseY;
let magnetModeOn = false;
let distanceMagnetX;
let distanceMagnetY;

// state
let canRotate = true;
let isPaused = true;
let canScale = false;
let canTrans = false;
let changeColorOn = false;

// rotation
let theta = 0;
let direction = true;
let count = 0;
let rotateSpeed = 0.01;
const oriRotateSpeed = 0.01;

// scale
let scaleAmount = 1;
const scaleRatio = 1.2;

// trans
let transX = 0;
let transY = 0;
let changeDirection = false;
const oriTranSpeed = 0.01;
let speedX = oriTranSpeed;
let speedY = oriTranSpeed;
let canXgoLeft = false;
let canXgoRight = true;
let canYgoDown= false;
let canYgoUp = true;


// change color when hit corner 
var currentColorNumber = 0;

//matrix
let matrixOriginal;
let matrixRotation;
let matrixScale;
let matrixTrans;

// initialize function
const init=()=>{
    gl = canvas.getContext("webgl2");
    ratio = canvas.width / canvas.height;

    if(!gl)
        alert("WebGL 2.0 isn't available");
    
    //  Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    // Clear the canvas
    gl.clearColor(0,0.125,0.2473, 1.0);

    const vertices = [
        // middle point 
        vec3(0.0000,  0.0000, -0.5000),
        // upper point
        vec3(0.0000,  0.4809,  0.3333),
        // left point
        vec3(-0.4165, -0.2405,  0.3333),
        // right point
        vec3(0.4165, -0.2405,  0.3333)
    ];

    // currrent locations for all 4 points
    // use to keep track all the points and for collision purpose
    currLoc = [
        // mid point
        vertices[0][0],vertices[0][1],vertices[0][2],0,
        // upper point
        vertices[1][0],vertices[1][1],vertices[1][2],0,
        // left point
        vertices[2][0],vertices[2][1],vertices[2][2],0,
        // right point
        vertices[3][0],vertices[3][1],vertices[3][2],1
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
            vec3(0.0, 0.0, 0.0),
            vec3(0.686,0.749,0.863),
            vec3(0.306,0.529,0.239),
            vec3(0.0, 0.0, 0.0)
        ],
        [   // chocolate orange yellow
            vec3(0.937,0.569,0.129),
            vec3(0.965,0.922,0.122),
            vec3(0.337,0.071,0.063),
            vec3(0.0, 0.0, 0.0)
        ],
        [   // chocolate pink grey 
            vec3(0.925,0.188,0.278),
            vec3(0.247,0.169,0.173),
            vec3(0.675,0.635,0.529),
            vec3(0.0 ,0.0, 0.0)
        ],

    ];

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
    ratioLoc = gl.getUniformLocation(program, "ratio");
    matrixLoc = gl.getUniformLocation(program, "u_matrix");

    // construct TV Ident 
    TVIdentClass = new TVIdent(vertices, colorList[0]);
    
    ({colors, positions, matrixOriginal} = TVIdentClass.createTVIdent(numTimesToSubdivide));
    updateBuffer(colors,positions);
    gl.uniformMatrix4fv(matrixLoc, false, matrixOriginal);

    // set up ratio
    gl.uniform1f(ratioLoc, ratio);

    // handle user input
    handleUI();

    // start rendering
    render();
}

//...........................................................
// Handle user input
//...........................................................
const handleUI = () => {

    // When the user choose color
    color_chose.onchange = e => {
        let color =[];
        // change color according to the user input
        if(e.target.value==="redbluegreen")
            color = colorList[0];
        else if(e.target.value==="whiteblackorange")
            color =colorList[1];
        else if(e.target.value==="blackgreengrey")
            color = colorList[2];
        else if(e.target.value==="chocolateorangeyellow")
            color = colorList[3];
        else if(e.target.value==="chocolatepinkgrey")
            color = colorList[4];

        // update color
        TVIdentClass.updateColor(color);

        // redraw the TV Ident
        let {colors, positions} = TVIdentClass.createTVIdent(numTimesToSubdivide);
        updateBuffer(colors,positions);
    }

    // When the user toggle change color when hit corner, reset the variable to allow that animation happen
    toggle_color_change.onclick = (e) => {
        changeColorOn = !changeColorOn;
        if(!changeColorOn){
            toggle_color_change.classList.add("changeColorOff");
            toggle_color_change.classList.remove("changeColorOn");
            toggle_color_change.innerText = "Change color when hit corner: Off";
        }
        else{
            toggle_color_change.classList.add("changeColorOn");
            toggle_color_change.classList.remove("changeColorOff"); 
            toggle_color_change.innerText = "Change color when hit corner: On";
        }
    };

    // When the user select different number of sub division, change the value
    sliderRec.onchange = e=> {
        numTimesToSubdivide = parseInt(e.target.value);
        // redraw the TV Ident
        ({colors, positions, matrixOriginal} = TVIdentClass.createTVIdent(numTimesToSubdivide));
        updateBuffer(colors,positions);
        gl.uniformMatrix4fv(matrixLoc, false, matrixOriginal);
    };

    // update UI for recursive steps
    sliderRec.oninput = e => {
        slide_rec.innerHTML = `Recursive steps :  ${e.target.value}`;
    }

    // When the user select different rotation speed, change the value
    sliderRot.onchange = (e) =>{
        rotateSpeed = oriRotateSpeed;
        rotateSpeed += parseInt(e.target.value) * oriRotateSpeed ;
    };

    // update UI for rotation speed
    sliderRot.oninput = (e) => {
        slide_rot.innerHTML = `Rotation speed :  ${e.target.value}`;
    }

     // When the user select different transition speed, change the value
    sliderTrans.onchange = (e)=> {
        speedX = speedY = oriTranSpeed;
        let speedExtra = parseInt(e.target.value) * oriTranSpeed;
        speedX += speedExtra;
        speedY = speedX;
    };

    // update UI for transition speed
    sliderTrans.oninput = (e)=>{
        slide_trans.innerHTML = `Transition speed :  ${e.target.value}`;
    }

    // When the user click start/ resume, start or resume the animation
    buttonStart.onclick = (e) => {
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
    buttonReset.onclick = (e) => {
        window.location.reload();
    };

    // get the mouse movement in canvas
    canvas.addEventListener("mousemove", (e)=>{
        const cRect = canvas.getBoundingClientRect();
        // the original value is 0,0 at top left, we change it by minus with cRect.left and cRect.left to get 0,0 at middle of canvas
        // the results also divde with cRect.width or cRect.height to get the results in range of -1 to 1 which is same for how webgl work on canvas
        mouseX = ((e.clientX - cRect.left - cRect.width/2) / (cRect.width/2));
        mouseY = ((-(e.clientY-cRect.top)+cRect.height/2)/(cRect.height/2));
    });

    // When the user toggle magnet mode
    magnet.onclick= (e) => {
        // toggle the magnet mode (on or off)
        magnetModeOn = !magnetModeOn;

        if(magnetModeOn){
            magnet.innerText = "Magnet Mode : \nOn";
            magnet.classList.add("magnetOn");
            magnet.classList.remove("magnetOff");
        }
        else{
            magnet.innerText = "Magnet Mode : \nOff";
            magnet.classList.remove("magnetOn");
            magnet.classList.add("magnetOff");

            // prevent object from stuck on wall and out of bound
            // find which triangle side is near to the wall and move reverse the triangle using mid point

            // calculate latest position
            const tempLoc = calculateLatestPosition(matrixScale, matrixTrans, matrixOriginal);

            // get the mid point
            const tempX = tempLoc[0];
            const tempY = tempLoc[1];

            // get the speed
            const tempspeedX = Math.abs(speedX);
            const tempspeedY = Math.abs(speedY);

            // check which side is near the wall, if X > 0  means it is at right hand side, X < 0 mean left hand side
            transX = tempX > 0 ? transX - tempspeedX : transX + tempspeedX;
            // Y > 0 means it it upside, Y < 0 means downside
            transY = tempY > 0 ? transY - tempspeedY : transY + tempspeedY;
        }
    }
}

const updateBuffer = (colors,positions) => {
    
    //  reCreate a buffer object, initialize it, and associate it with the
    //  associated attribute variable in our vertex shader
    const cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,  flatten(colors), gl.STATIC_DRAW);
    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);

    const vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,  flatten(positions), gl.STATIC_DRAW);
    gl.vertexAttribPointer( positionLoc, 3, gl.FLOAT, false, 0, 0 );
}

const handleRotation = () => { 
    // update theta according to the direction
    theta += (direction ? -rotateSpeed: rotateSpeed);
    // calcualte rotation matrix and apply
    matrixRotation = TVIdentClass.getRotationYMatrix(theta);
    gl.uniformMatrix4fv(matrixLoc, false, matrixRotation);

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
    if(count == 2 && theta <= rotateSpeed){
        // stop rotation and start scaling
        canRotate = false;
        canScale = true;
    } 
}

const handleScale= () => {
    // if scale havent reach suitable size
    if(scaleAmount < scaleRatio){
        scaleAmount += 0.01;
        // calculate scale matrix
        matrixScale =  TVIdentClass.getScalingMatrix(scaleAmount,scaleAmount,scaleAmount);  
    }
    // scale reach suitable size
    else{      
        // stop scaling and start transition
        canScale = false;
        canTrans = true;
    }
    // apply matrix
    const matrix = TVIdentClass.multiply(matrixScale, matrixOriginal);
    gl.uniformMatrix4fv(matrixLoc, false, matrix);
}

const changeColor = () => {
    // get upper limit of the color combination
    const size  = colorList.length;
    
    // rotation of each color combination
    currentColorNumber = currentColorNumber < size-1 ? currentColorNumber+1 : 0;

    // change base color
    TVIdentClass.updateColor(colorList[currentColorNumber]); 

    // new triangle with new color
    let {colors, positions} = TVIdentClass.createTVIdent(numTimesToSubdivide);
    updateBuffer(colors,positions);
}

const calculateLatestPosition = (matrixS, matrixT, matrixO) => {
    // calculate current location
    // scale matrix
    matrixS = TVIdentClass.getScalingMatrix(scaleAmount, scaleAmount, scaleAmount);

    // trans matrix
    matrixT = TVIdentClass.getTranslationMatrix(transX,transY,0);

    // combine scale with original
    const matrix = TVIdentClass.multiply(matrixS, matrixO);

    // combine transition with scale
    const matrix2 = TVIdentClass.multiply(matrixT, matrix);

    // change specific location to 1 to get correct transition matrix 
    currLoc[3] = 1;
    currLoc[7] = 1;
    currLoc[11] = 1;

    // combine all matrix and calculate final location
    const tempLoc = TVIdentClass.multiply(matrix2, currLoc);

    // apply ratio
    for(let i = 0; i < tempLoc.length; i++){
        if(i % 4 === 0){
            tempLoc[i] /= ratio;
        }
    }

    // change back to 0 after calculate transistion
    tempLoc[3] = 0;
    tempLoc[7] = 0;
    tempLoc[11] = 0;
    currLoc[3] = 0;
    currLoc[7] = 0;
    currLoc[11] = 0;

    return tempLoc;
}

const handleTranslation = () => {
    // check for out of bound
    let outOfBound = false;

    // calculate latest position of all 4 points
    const tempLoc = calculateLatestPosition(matrixScale,matrixTrans,matrixOriginal);
    
    // check for each current location, if the location >= 1 or <= -1, it was out of canvas
    for(let i = 0 ; i < tempLoc.length; i++){
        if(i != tempLoc.length-1 ){
            if(tempLoc[i] >= 1 || tempLoc[i] <= -1){
                outOfBound = true;
                console.log("outch");
            }
        }
    }
    
    // if all ok, normal transition
    if(!outOfBound){
        // different calculation for magenet mode
        if(magnetModeOn){
            // keep track the distance between our mouse and the TV Ident
            distanceMagnetX = tempLoc[0] - mouseX;
            distanceMagnetY = tempLoc[1] - mouseY;
    
            speedX = Math.abs(speedX);
            speedY = Math.abs(speedY);

            // update the transition of TV Ident according to the distance mouse and triangle
            // the TV Ident should always move towards the mouse
            transX = distanceMagnetX >= 0 ? transX - speedX : transX + speedX;
            transY = distanceMagnetY >= 0 ? transY - speedY : transY + speedY;
        }
        else{
            // normal transition
            transX += speedX;
            transY += speedY;
        }
        // calculate scale matrix and transition matrix and pply
        matrixTrans = TVIdentClass.getTranslationMatrix(transX,transY,0); 
        const matrix = TVIdentClass.multiply(matrixScale,matrixOriginal);
        const matrix2 = TVIdentClass.multiply(matrixTrans, matrix);
        gl.uniformMatrix4fv(matrixLoc, false, matrix2);
    }
    // not ok, object hit wall already
    else{
        // Object should change direction and move towards other direction
        changeDirection = true;
        // record all situations
        canXgoLeft = true;
        canXgoRight = true;
        canYgoDown = true;
        canYgoUp = true;

        // check current location
        for(let i = 0; i < tempLoc.length; i++){
            if(i !== tempLoc.length-1){
                // x-axis
                if(i % 4 === 0){
                    // hit right wall
                    if(tempLoc[i] >= 1){
                        transX -= speedX*2;
                        canXgoRight = false;
                    }
                    // hit left wall
                    else if(tempLoc[i] <= -1){
                        // special case happen for left wall and down wall, if magnet mode is on, the triangle will always out of bound when hit left and down

                        // this is because the way we handle the collision, we will change the speed to either positive or negative according to how the collision happen 

                        // if the TV Ident hit left or down, we suppose to decease the speed mean move it towards right or up

                        // if we use the normal way we handle the collision (add the speed) when magnet mode, the speed will always positive, if we minus it, the triangle will continue to move left hand or down side and it will stuck there forever

                        // so instead of minus, we add it according to whether magnetmode on or off.
                        // transX -= speedX*2;
                        transX = magnetModeOn ? transX +  speedX*2 : transX - speedX*2;
                        canXgoLeft = false;
                    }
                }
                // y-axis
                else if((i - 1) % 4 === 0){
                    // hit upper wall
                    if(tempLoc[i] >= 1){
                        transY -= speedY*2;
                        canYgoUp = false;

                    }
                    // hit lower wall
                    else if(tempLoc[i] <= -1){
                        // special case
                        transY = magnetModeOn ? transY + speedY*2 : transY - speedY*2;
                        canYgoDown = false;
                    }
                }
            }
        }
    }

    // Implement a logic to decide the next transition positive or negative for x and y
    if(changeDirection){
        // change color when the object hit wall if changeColor mode was on
        if(changeColorOn){
            changeColor();
        }
        
        // cannot change direction again once determined to prevent infinite loop
        changeDirection = false;

        // get random number to implement random direction 
        // if number == 1, the triangle should move right and up
        // if number == 2 , move down and left
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

}

function render(){
    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // draw the triangle
    gl.drawArrays( gl.TRIANGLES, 0, positions.length );
    // handleTranslation();

    // start rotate
    if(!isPaused && canRotate && !canScale && !canTrans){
        handleRotation();
    }
    // start scaling 
    else if(!isPaused && !canRotate && canScale && !canTrans){
        handleScale();
    }
    // start transition
    else if(!isPaused && !canScale && !canRotate  && canTrans){
        handleTranslation();
    }
    
    // loop
    requestAnimationFrame(render);
}

window.onload = init();



