const KEY = 'lCoQ553kF28D51eDebb39ed02vbbC1';

const DEPTH = 1;
const PLANE_WIDTH = 4096;
const PLANE_HEIGHT = 4096;

const CAMERA_FOV = 75;
const CAMERA_NEAR_PLANE = 0.1;
const CAMERA_FAR_PLANE = 20000;

const AXIS_LENGHT = 10000; // meters

const STEP = 0.001000;
const SIZE = 250;

let lat;
let lon;

let rotate = 0;
const ROTATION_SPEED = 0.001; 

let elevationDataProvider = new ElevationDataProvider(KEY);

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera( CAMERA_FOV, window.innerWidth/window.innerHeight, CAMERA_NEAR_PLANE, CAMERA_FAR_PLANE );
let renderer = new THREE.WebGLRenderer();
let plane;

let locationLabel = document.getElementById('location-label');
let elevationLabel = document.getElementById('elevation-label');

Init();

function Init() {
    if(navigator.geolocation)
        navigator.geolocation.getCurrentPosition(SetLocation);

    AddEventListeners();
}

function SetLocation(position) {
    lat = position.coords.latitude;
    lon = position.coords.longitude;
    elevationDataProvider.GetElevationData(lat, lon, STEP, SIZE, LoadScene);
}

function UpdateLabels() {
    locationLabel.innerHTML = `${parseFloat(lat).toFixed(6)},&nbsp${parseFloat(lon).toFixed(6)}`;

    let centerElevation = elevationDataProvider.elevations[Math.round(elevationDataProvider.elevations.length / 2)];
    elevationLabel.innerHTML = Math.round(centerElevation) + '&nbspm&nbspa.s.l.';

    let labelScreenPos =  GetScreenPos(new THREE.Vector3(0, 0, (1 / ( 2 * AXIS_LENGHT )) * centerElevation));
    let labelStylePos = `left: ${labelScreenPos.x}px; top: ${0.333 * labelScreenPos.y}px`;

    locationLabel.setAttribute('style',labelStylePos);
    elevationLabel.setAttribute('style',labelStylePos);
}


function AddEventListeners() {
    window.addEventListener("keydown", (e) => {    
        let callDataProvider = false;
    
        if(e.code == 'KeyA') {
            lat += STEP;
            callDataProvider = true;
        }
        if(e.code == 'KeyD') {
            lat -= STEP;
            callDataProvider = true;
        }
        if(e.code == 'KeyW') {
            lon += STEP;
            callDataProvider = true;
        }
        if(e.code == 'KeyS') {
            lon -= STEP;
            callDataProvider = true;
        }
        if(e.code == 'KeyE') {
            lat -= STEP;
            lon -= STEP;
            callDataProvider = true;
        }
        if(e.code == 'KeyQ') {
            lat += STEP;
            lon += STEP;
            callDataProvider = true;
        }
    
        if(callDataProvider) 
            elevationDataProvider.GetElevationData(lat, lon, STEP, SIZE, CreateTerrain);
    });

    window.addEventListener("keypress", (e) => {
        if(e.code == 'KeyR') {
            rotate = !rotate;
        }
    });

    function OnWindowResize(){
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );
        
        UpdateLabels();
    }
    
    window.addEventListener( 'resize', OnWindowResize, false );
    document.addEventListener( 'mousemove', UpdateLabels, false );
    renderer.domElement.addEventListener( 'touchmove', UpdateLabels, false );
    renderer.domElement.addEventListener( 'wheel', UpdateLabels, false);
}

function CreateTerrain(elevations) {
    scene.remove(plane);

    let geometry = new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT, Math.round(Math.sqrt(SIZE)) - 2, Math.round(Math.sqrt(SIZE)) - 2);

    for (let i = 0, l = geometry.vertices.length; i < l; i++) {
        geometry.vertices[i].z = elevations[i] * DEPTH;
        }

    let material = new THREE.MeshBasicMaterial( { color: 0xcfff95, wireframe: true } );
    plane = new THREE.Mesh( geometry, material );
    plane.rotation.x = -Math.PI / 2;

    scene.add( plane );

    UpdateLabels();
}

function AddAxis() {
    var material = new THREE.LineBasicMaterial({
        color: 0x40c4ff
    });
    
    var geometry = new THREE.Geometry();
    geometry.vertices.push(
        new THREE.Vector3( 0, -AXIS_LENGHT, 0),
        new THREE.Vector3( 0, AXIS_LENGHT, 0)
    );
    
    let axis = new THREE.Line( geometry, material );
    scene.add( axis );
}

function LoadScene(elevations) {
    scene.background = new THREE.Color( 0x1c313a );

    new THREE.OrbitControls( camera, renderer.domElement );

    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    CreateTerrain(elevations);
    AddAxis();

    camera.position.y = 6000;
    camera.position.z = 3000;
    camera.lookAt(plane.position);

    // render loop
    let animate = function () {
        requestAnimationFrame( animate );
        renderer.render( scene, camera );

        if(rotate)
            plane.rotation.z += ROTATION_SPEED;
    };
    // --

    animate();

}

//pass new THREE.Vector3
function GetScreenPos(vector) {
    vector.project(camera);
    vector.x = ( vector.x + 1) * renderer.domElement.width / 2;
    vector.y = - ( vector.y - 1) * renderer.domElement.height / 2;
    vector.z = 0;
    return vector;
}