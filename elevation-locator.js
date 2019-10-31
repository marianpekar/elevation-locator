const KEY = 'lCoQ553kF28D51eDebb39ed02vbbC1';

const DEPTH = 1;
const PLANE_WIDTH = 4096;
const PLANE_HEIGHT = 4096;

const CAMERA_FOV = 75;
const CAMERA_NEAR_PLANE = 0.1;
const CAMERA_FAR_PLANE = 20000;

const STEP = 0.00100;
const SIZE = 225;
let lat = 30.800375;
let lon = 88.654650;

let elevationDataProvider = new ElevationDataProvider(KEY);
elevationDataProvider.GetElevationData(lat, lon, STEP, SIZE, LoadScene);

let scene = new THREE.Scene();
let plane;

let locationLabel = document.getElementById('location-label');

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

    locationLabel.innerText = `${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}`;
}

function AddAxis() {
    var material = new THREE.LineBasicMaterial({
        color: 0x40c4ff
    });
    
    var geometry = new THREE.Geometry();
    geometry.vertices.push(
        new THREE.Vector3( 0, -10000, 0),
        new THREE.Vector3( 0, 10000, 0)
    );
    
    var line = new THREE.Line( geometry, material );
    scene.add( line );
}

function LoadScene(elevations) {
    scene.background = new THREE.Color( 0x1c313a );
    let camera = new THREE.PerspectiveCamera( CAMERA_FOV, window.innerWidth/window.innerHeight, CAMERA_NEAR_PLANE, CAMERA_FAR_PLANE );
    let renderer = new THREE.WebGLRenderer();

    new THREE.OrbitControls( camera, renderer.domElement );

    // event listeners
    window.addEventListener( 'resize', onWindowResize, false );

    function onWindowResize(){
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );
    }

    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    // ---

    CreateTerrain(elevations);
    AddAxis();

    camera.position.y = 6000;
    camera.position.z = 3000;
    camera.lookAt(plane.position);

    // render loop
    let animate = function () {
        requestAnimationFrame( animate );
        renderer.render( scene, camera );
    };

    animate();
    // ---
}