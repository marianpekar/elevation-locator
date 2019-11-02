const KEY = 'lCoQ553kF28D51eDebb39ed02vbbC1';

const PLANE_WIDTH = 4096;
const PLANE_HEIGHT = 4096;
const SIZE = 250;

const AXIS_LENGHT = 10000; // meters

const CAMERA_FOV = 75;
const CAMERA_NEAR_PLANE = 0.1;
const CAMERA_FAR_PLANE = 20000;

const ZOOM_STEP = 0.0001;
const MIN_STEP = 0.001000;
const MAX_STEP = 1.000000;
let step = 0.001000;

let lat = 0;
let lon = 0;

let rotate = 0;
const ROTATION_SPEED = 0.001; 

let elevationDataProvider = new ElevationDataProvider(KEY);

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera( CAMERA_FOV, window.innerWidth/window.innerHeight, CAMERA_NEAR_PLANE, CAMERA_FAR_PLANE );
let renderer = new THREE.WebGLRenderer({ antialias: true });
let plane;

let pivot = new THREE.Group(); //to rotate north pointer around

let locationLabel = document.getElementById('location-label');
let elevationLabel = document.getElementById('elevation-label');
let resolutionLabel = document.getElementById('resolution-label');

let centerElevation = 0;

Init();

function Init() {
    if(navigator.geolocation)
        navigator.geolocation.getCurrentPosition(SetLocation);

    AddEventListeners();
}

function SetLocation(position) {
    lat = position.coords.latitude;
    lon = position.coords.longitude;
    elevationDataProvider.GetElevationData(lat, lon, step, SIZE, LoadScene);
}

function UpdateLabels() {
    locationLabel.innerHTML = DDToDMS(lat,lon);

    centerElevation = elevationDataProvider.elevations[Math.round(elevationDataProvider.elevations.length / 2)];
    elevationLabel.innerHTML = Math.round(centerElevation) + '&nbspm&nbspa.s.l.';

    resolutionLabel.innerText = GetDms(step);

    let labelScreenPos =  GetScreenPos(new THREE.Vector3(0, 0, (1 / ( 2 * AXIS_LENGHT )) * centerElevation));
    let labelStylePos = `left: ${labelScreenPos.x}px; top: ${0.333 * labelScreenPos.y}px`;

    locationLabel.setAttribute('style', labelStylePos);
    elevationLabel.setAttribute('style', labelStylePos);
    resolutionLabel.setAttribute('style', labelStylePos);
}


function AddEventListeners() {
    window.addEventListener("keydown", (e) => {    
        let callDataProvider = false;
    
        if(e.code == 'KeyD') {
            lon += step;
            callDataProvider = true;
        }
        if(e.code == 'KeyA') {
            lon -= step;
            callDataProvider = true;
        }
        if(e.code == 'KeyW') {
            lat += step;
            callDataProvider = true;
        }
        if(e.code == 'KeyS') {
            lat -= step;
            callDataProvider = true;
        }
        if(e.code == 'KeyE') {
            lat += step;
            lon += step;
            callDataProvider = true;
        }
        if(e.code == 'KeyQ') {
            lat -= step;
            lon -= step;
            callDataProvider = true;
        }
        if(e.key == '+') {
            step -= ZOOM_STEP;

            if(step < MIN_STEP) step = MIN_STEP;

            callDataProvider = true;
        }
        if(e.key == '-') {
            step += ZOOM_STEP;

            if(step > MAX_STEP) step = MAX_STEP;

            callDataProvider = true;
        }
    
        if(lon > 180) lon = 180;
        if(lon < -180) lon = 180;
        if(lat > 90) lat = 90;
        if(lat < -90) lat = -90; 

        if(callDataProvider) 
            elevationDataProvider.GetElevationData(lat, lon, step, SIZE, CreateTerrain);
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
        geometry.vertices[i].z = elevations[i];
        }

    let material = new THREE.MeshBasicMaterial( { color: 0xcfff95, wireframe: true } );
    plane = new THREE.Mesh( geometry, material );
    plane.rotation.x = -Math.PI / 2;

    scene.add( plane );

    UpdateLabels();
}

function AddAxis() {
    let material = new THREE.LineBasicMaterial({
        color: 0x40c4ff
    });
    
    let geometry = new THREE.Geometry();
    geometry.vertices.push(
        new THREE.Vector3( 0, -AXIS_LENGHT, 0),
        new THREE.Vector3( 0, AXIS_LENGHT, 0)
    );
    
    let axis = new THREE.Line( geometry, material );
    scene.add( axis );
}

function AddNorthPointer() {
    let material = new THREE.LineBasicMaterial({
        color: 0xee0000
    });

    let vertex0 = new THREE.Vector3( 0, centerElevation - AXIS_LENGHT * 0.1, 0);
    let vertex1 = new THREE.Vector3( 0, centerElevation - AXIS_LENGHT * 0.1, PLANE_WIDTH / Math.sqrt(SIZE));

    geometry = new THREE.Geometry();
    geometry.vertices.push(vertex0, vertex1);

    pivot.position = vertex0;

    let northPointer = new THREE.Line( geometry, material );

    northPointer.rotation.x = -Math.PI / 2;
    pivot.rotation.x = -Math.PI / 2;

    pivot.add( northPointer );
    scene.add( pivot );
}

function LoadScene(elevations) {
    scene.background = new THREE.Color( 0x1c313a );

    new THREE.OrbitControls( camera, renderer.domElement );

    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    CreateTerrain(elevations);
    AddAxis();
    AddNorthPointer();

    camera.position.y = 6000;
    camera.position.z = 3000;
    camera.lookAt(plane.position);

    // render loop
    let animate = function () {
        requestAnimationFrame( animate );
        renderer.render( scene, camera );

        if(rotate) {
            plane.rotation.z += ROTATION_SPEED;
            pivot.rotation.z += ROTATION_SPEED;
        }
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

function DDToDMS(lat, lon) {
    let latResult, lonResult;
 
    lat = parseFloat(lat);  
    lon = parseFloat(lon);
 
    latResult = (lat >= 0)? 'N' : 'S';
    lonResult = (lon >= 0)? 'E' : 'W';

    latResult += GetDms(lat);
    lonResult += GetDms(lon);

    return `${latResult} ${lonResult}`;
 }

function GetDms(val) {
    let valDeg, valMin, valSec, result;

    val = Math.abs(val);

    valDeg = Math.floor(val);
    result = valDeg + "º";

    valMin = Math.floor((val - valDeg) * 60);
    result += valMin + "'";

    valSec = Math.round((val - valDeg - valMin / 60) * 3600 * 1000) / 1000;
    result += valSec + '"';

    return result;
}