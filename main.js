import './style.css';
import * as THREE from 'three';
import * as CANNON from 'cannon';
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

// Setup

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});

let audio = document.getElementById("music")
audio.play()


const loader = new THREE.ObjectLoader();

let isKick = false;

camera.lookAt(0,3,10)

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.set(0,2,-12)
camera.lookAt(0,1,30);
//resize
window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

//background
renderer.setClearColor("rgb(153, 240, 231)")   // OVER HERE!

//field
const geometry = new THREE.BoxGeometry(50, 0.5, 50, 10,10,10);
const material = new THREE.MeshStandardMaterial({ color: "rgb(43, 181, 89)" });
const field = new THREE.Mesh(geometry, material);
scene.add(field)        // oVER HERE!



// So I can detect if a person cant aim
const invisibleWall = new THREE.Mesh(
    new THREE.BoxGeometry(75,50,0.5,2,2,2),
    new THREE.MeshBasicMaterial({
      color: "rgb(255,255,255",
      wireframe:true
    })
)
invisibleWall.position.set(0,0,24.7)
invisibleWall.visible = false;
scene.add(invisibleWall)


//test
// const thebox = new THREE.Mesh(
//   new THREE.BoxGeometry(10.08,4.374,0.14,10,10,10),
//   new THREE.MeshStandardMaterial({color: "rgb(43,181,89)",wireframe:true})
// )
// scene.add(thebox)


// ERONK
const fbxloader = new FBXLoader();
let mixer;

fbxloader.load( // IT FINALLY WORKS>>> THE PROBLEM WAS YOU HAD TO PUT ANIMATE INSIDE OF THE LOAD FUNCTION
  'assets/people/bloke.fbx',
  function(obj){
    obj.scale.set(0.01,0.01,0.01)
    obj.position.set(1,0.8,-9.5)
    scene.add(obj)

    mixer = new THREE.AnimationMixer(obj)
    const action = mixer.clipAction(obj.animations[0])

    action.play()
    animate();
    mixer.addEventListener('loop',()=> {
      action.paused()
      isKick = false;
    })
  },
  function(xhr){
    console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
  },
  function(error){
    console.log("error:")
    console.log(error)
  }
)

//goal
loader.load(
  'goal.json',
  function(obj){
    scene.add(obj)   // OVER HERE!
    obj.position.set(0,0,22)
    obj.scale.y*=1.8
    obj.scale.x*=1.4
  },
  function(xhr){
    console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
  },
  function(error){
    console.log("There was a problem with loading goal.")
  }
)

//ball
const geometryBall = new THREE.SphereGeometry(0.25, 32, 32)
const materialBall = new THREE.MeshStandardMaterial({color: 0xffffff})
const ball = new THREE.Mesh(geometryBall,materialBall)
ball.position.set(0,0.5,12)
scene.add(ball);

// Lights      ---      ADD BETTER LIGHTING! Ambient lighting is ass... maybe hemisphere lighting
const ambientLight = new THREE.AmbientLight(0xffffff);
ambientLight.intensity = 0.5
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff)
directionalLight.position.set(0,22,0)
directionalLight.intensity = 2
scene.add(directionalLight)






const world = new CANNON.World(); // cannon :)
world.gravity.set(0,-9.8,0)


const sphereBody = new CANNON.Body({
  mass: 1000,
  shape: new CANNON.Sphere(0.25),
  position: new CANNON.Vec3(0,1,-7)
})
world.addBody(sphereBody)

sphereBody.addEventListener('collide',function(e){
  Ax = 0;
  sphereBody.velocity.set(0,0,0)
})


const planeBody = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Plane(),
  position: new CANNON.Vec3(0,0.5,0)
})
planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(planeBody)

// Adding the collision of the goals

const sideI = new CANNON.Body({
  mass:0,
  shape: new CANNON.Box(new CANNON.Vec3(0.14,4.374,2.7)),
  position: new CANNON.Vec3(4.7,2.187,22)
})
const sideII = new CANNON.Body({
  mass:0,
  shape: new CANNON.Box(new CANNON.Vec3(0.14,4.374,2.7)),
  position: new CANNON.Vec3(-4.7,2.187,22)
})
const sideIII = new CANNON.Body({
  mass:0,
  shape: new CANNON.Box(new CANNON.Vec3(10.08,0.3,2.7)),
  position: new CANNON.Vec3(0,4.374,22)
})
const sideIV = new CANNON.Body({
  mass:0,
  shape: new CANNON.Box(new CANNON.Vec3(10.08,4.374,1)),
  position: new CANNON.Vec3(0,2,23)
})
world.addBody(sideI)
world.addBody(sideII)
world.addBody(sideIII)
world.addBody(sideIV)

let Ax = 0;
function physics(deltaTime){
  world.step(1/60)

  ball.position.copy(sphereBody.position)
  ball.quaternion.copy(sphereBody.quaternion)

  let accel = new CANNON.Vec3(Ax,0,0)
  let force = accel.scale(sphereBody.mass)

  
  sphereBody.applyForce(force,sphereBody.position)
  

}
// sphereBody.velocity.set(0,1,15)



//kicking ball
const raycaster = new THREE.Raycaster();
const line = [[]]
let isDown = false;
let timeOfStart = Date.now();

//makeLine(line[0],line[line.length-1])
window.addEventListener("mousedown",function(e){
  isDown = true;
  timeOfStart = Date.now()
  line.splice(0,line.length)
  Ax = 0
  sphereBody.position.set(0,0.8,-7)
  sphereBody.Static
  sphereBody.velocity.set(0,0,0)
  sphereBody.force.set(0,0,0)
  sphereBody.mass = 1000
})


window.addEventListener("mouseup",function(e){
  if(isDown){
    eronVelocityFinder(e,line)
  }
  console.log("mouse let go.")
  isDown = false;
})


window.addEventListener("mousemove",function(e){
  console.log("mouse is moving.")
  if(isDown){
    //console.log([e.clientX,e.clientY])
    line.push([e.clientX,e.clientY])
  }
})


//derivative
function findDerivative(array) {
  const divLine = [[]]
  for(let i = 1;i<array.length;i++){
    const div = [(array[i][0]-array[i-1][0]),(array[i][1]-array[i-1][1])/(array[i][0]-array[i-1][0])]
    divLine.push(div)
  }
  return divLine
}


// The starting point doesn't have to be rotated because that is the axis. 
function lineStartsAtZero(array){
  if(array.length>0 && array[0].length == 2){ //Array.isArray(array[0]) &&
    const removeX = array[0][0]
    const removeY = array[0][1]

    for(const point of array){
      point[0]-=removeX;
      point[1]-=removeY;
    }
  } else {
    console.log("problem with lineStartsAtZero")
  }
}


function rotateLine(array){ //find angle, then rotate by opposite angle.
  const start = array[0]
  const end = array[array.length-1]
  const adj = end[0]-start[0]
  const opp = end[1]-start[1]
  const angle = 2*Math.PI - Math.atan2(opp,adj)
  for(const point of array){
    const x = point[0]
    const y = point[1]
    point[0] = (x * Math.cos(angle)) - (y * Math.sin(angle))
    point[1] = (x * Math.sin(angle)) + (y * Math.cos(angle))
  }
}


function raycast(e){ //use this point as where to send the ball to the point
  let mouse = new THREE.Vector2()
  mouse.x = (e.clientX/window.innerWidth)*2 - 1;
  mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;

  raycaster.setFromCamera(mouse,camera)
  let mousetouch = raycaster.intersectObjects(scene.children,true)

    if(mousetouch.length>0){
      return mousetouch[0].point
    }
}

let theDistance = 0;
function eronAccelerationFinder(array){ // It works now
  if(array.length>4){
    array = array.filter((point)=>point.length!==0)
    
  theDistance = distanceOfPoints(array)
  lineStartsAtZero(array)
  rotateLine(array)
  findDerivative(array)
  findDerivative(array)

  let totalY = 0;
  let totalX = 0;
  for(const point of array){
    totalY+= point[0]*point[1]
    totalX += point[0]
  }

  return totalY/totalX
  } else {
    console.log("Line is too short")
    return
  }
  // for(const point of array){
  //   console.log(point)
  // }
}

//putting it all together
function eronVelocityFinder(e,array){
  let start = ball.position
  let end = raycast(e)

  let Xx = end.x-start.x
  let Xy = end.y-start.y
  let Xz = end.z-start.z

  Ax = eronAccelerationFinder(array)/10
  let Vzi = (((Xz/(Date.now()-timeOfStart))))*theDistance
  let t = Xz/Vzi

  if(t<0.4){
    t=0.4
  }
  if(t>2){
    t=2
  }

  let Vyi = (Xy - 0.5 * (-9.8) * Math.pow(t,2))/t // WHY DOESNT Y WORK WELL
  let Vxi = (Xx - 0.5 * Ax * Math.pow(t,2))/t
  if(!Vxi){
    Vxi = 0
  }
    sphereBody.velocity.set(Vxi,Vyi,Vzi)

  console.log("Velocitiy components: ")
  console.log(Vxi)
  console.log(Vyi)
  console.log(Vzi)
}

function distanceOfPoints(array){
  return Math.sqrt(Math.pow(array[0][0]-array[array.length-1][0],2)+Math.pow(array[0][1]-array[array.length-1][1],2))
}

//controls
// no orbit controls. :()

//const controls = new OrbitControls( camera, renderer.domElement );

//physics and animation , THIS MIGHT NOT BE NECESSARY ONCE I INSTALL CANNON!

let lastTime=0
async function animate (time) { 
  let deltaTime=(time-lastTime)/1000
  renderer.render(scene,camera)
  physics(deltaTime)
  lastTime = time;
  if(isKick){
    mixer.update(deltaTime)
  }
  requestAnimationFrame(animate)
}
requestAnimationFrame(animate)


