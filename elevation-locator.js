const DEPTH = 1;
const PLANE_WIDTH = 4096;
const PLANE_HEIGHT = 4096;

const CAMERA_FOV = 75;
const CAMERA_NEAR_PLANE = 0.1;
const CAMERA_FAR_PLANE = 12000;

const STEP = 0.00100;
const SIZE = 225;
let lat = 30.800375;
let lon = 88.654650;

let elevationDataProvider = new ElevationDataProvider();
elevationDataProvider.GetElevationData(lat, lon, STEP, SIZE, LoadScene);

let scene = new THREE.Scene();
let plane;

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

    if(callDataProvider)
        elevationDataProvider.GetElevationData(lat, lon, STEP, SIZE, CreateTerrain);
});

function CreateTerrain(elevations) {
    scene.remove(plane);

    let geometry = new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT, Math.round(Math.sqrt(SIZE)), Math.round(Math.sqrt(SIZE)));

    for (let i = 0, l = geometry.vertices.length; i < l; i++) {
        geometry.vertices[i].z = elevations[i] * DEPTH;
        }

    let material = new THREE.MeshBasicMaterial( { color: 0xffd95a, wireframe: true } );
    plane = new THREE.Mesh( geometry, material );
    plane.rotation.x = -Math.PI / 2;

    scene.add( plane );

    console.log(`latitude:${parseFloat(lat).toFixed(6)},longitude:${parseFloat(lon).toFixed(6)}`);
}

function LoadScene(elevations) {
    scene.background = new THREE.Color( 0x4b636e );
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