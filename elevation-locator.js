const KEY = "lCoQ553kF28D51eDebb39ed02vbbC1";

const PLANE_WIDTH = 4096;
const PLANE_HEIGHT = 4096;
const SIZE = 250;

const AXIS_LENGHT = 10000; // meters

const CAMERA_FOV = 75;
const CAMERA_NEAR_PLANE = 0.1;
const CAMERA_FAR_PLANE = 20000;

const ZOOM_STEP = 0.0001;
const MIN_STEP = 0.001;
const MAX_STEP = 1.0;

let step = 0.001;

const TOUCH_SPEED = 200; // miliseconds

let lat = 0;
let lon = 0;

let rotate = 0;
const ROTATION_SPEED = 0.001;

const UPDATE_LOCATION_INTERVAL = 1000; // miliseconds
let updateLocationAutomatically = true;

let elevationDataProvider = new ElevationDataProvider(KEY);

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(
  CAMERA_FOV,
  window.innerWidth / window.innerHeight,
  CAMERA_NEAR_PLANE,
  CAMERA_FAR_PLANE
);
let renderer = new THREE.WebGLRenderer({ antialias: true });
let plane;

let pivot = new THREE.Group(); //to rotate north pointer around

let zoomInButton = document.getElementById("zoom-in-button");
let zoomOutButton = document.getElementById("zoom-out-button");
let locationButton = document.getElementById("location-button");

let leftArrowButton = document.getElementById("left-arrow-button");
let rightArrowButton = document.getElementById("right-arrow-button");
let upArrowButton = document.getElementById("up-arrow-button");
let downArrowButton = document.getElementById("down-arrow-button");

let locationLabel = document.getElementById("location-label");
let elevationLabel = document.getElementById("elevation-label");
let resolutionLabel = document.getElementById("resolution-label");

let centerElevation = 0;

Init();

function Init() {
  GetCurrentLocation();
  AddEventListeners();
  CreateScene();

  setInterval(() => {
    if (updateLocationAutomatically) GetCurrentLocation();
  }, UPDATE_LOCATION_INTERVAL);
}

function GetCurrentLocation() {
  if (navigator.geolocation)
    navigator.geolocation.getCurrentPosition(
      SetLocation,
      error => {
        window.alert(`Cannot proceed: ${error.message}`);
      },
      { enableHighAccuracy: true }
    );
}

function SetLocation(position) {
  let originalLat = lat;
  let originalLon = lon;

  lat = position.coords.latitude;
  lon = position.coords.longitude;

  if (lat == originalLat && lon == originalLon) {
    return;
  }

  elevationDataProvider.GetElevationData(lat, lon, step, SIZE, UpdateTerrain);
}

function UpdateLabels() {
  locationLabel.innerHTML = DDToDMS(lat, lon);

  centerElevation =
    elevationDataProvider.elevations[
      Math.round(elevationDataProvider.elevations.length / 2)
    ];
  elevationLabel.innerHTML = Math.round(centerElevation) + "&nbspm&nbspa.s.l.";

  resolutionLabel.innerText = GetDms(step);

  let labelScreenPos = GetScreenPos(
    new THREE.Vector3(0, 0, (1 / (2 * AXIS_LENGHT)) * centerElevation)
  );
  let labelStylePos = `left: ${labelScreenPos.x}px; top: ${0.333 *
    labelScreenPos.y}px`;

  locationLabel.setAttribute("style", labelStylePos);
  elevationLabel.setAttribute("style", labelStylePos);
  resolutionLabel.setAttribute("style", labelStylePos);
}

function UpdateElevationData() {
  elevationDataProvider.GetElevationData(lat, lon, step, SIZE, CreateTerrain);
}

function ZoomIn() {
  step -= ZOOM_STEP;
  if (step < MIN_STEP) step = MIN_STEP;
  UpdateElevationData();
}

function ZoomOut() {
  step += ZOOM_STEP;
  if (step > MAX_STEP) step = MAX_STEP;
  UpdateElevationData();
}

function GoNorth() {
  DisableUpdateLocationAutomatically();
  lat += step;
  if (lat > 90) lat = 90;
  UpdateElevationData();
}

function GoSouth() {
  DisableUpdateLocationAutomatically();
  lat -= step;
  if (lat < -90) lat = -90;
  UpdateElevationData();
}

function GoWest() {
  DisableUpdateLocationAutomatically();
  lon -= step;
  if (lon < -180) lon = 180;
  UpdateElevationData();
}

function GoEast() {
  DisableUpdateLocationAutomatically();
  lon += step;
  if (lon > 180) lon = 180;
  UpdateElevationData();
}

function AddContinous(action, interval) {
  let timer = setInterval(action, interval);
  return timer;
}

function RemoveContinous(timer) {
  clearInterval(timer);
}

function SwitchUpdateLocationAutomatically() {
  updateLocationAutomatically = !updateLocationAutomatically;

  if (updateLocationAutomatically) locationButton.src = "images/location.svg";
  else locationButton.src = "images/location-off.svg";
}

function DisableUpdateLocationAutomatically() {
  updateLocationAutomatically = false;
  locationButton.src = "images/location-off.svg";
}

function AddEventListeners() {
  locationButton.addEventListener("click", SwitchUpdateLocationAutomatically);
  zoomInButton.addEventListener("click", ZoomIn);
  zoomOutButton.addEventListener("click", ZoomOut);

  leftArrowButton.addEventListener("click", GoWest);
  rightArrowButton.addEventListener("click", GoEast);
  upArrowButton.addEventListener("click", GoNorth);
  downArrowButton.addEventListener("click", GoSouth);

  let zoomInTouchTimer;
  zoomInButton.addEventListener(
    "touchstart",
    e => {
      e.preventDefault();
      e.stopImmediatePropagation();
      zoomInTouchTimer = AddContinous(ZoomIn, TOUCH_SPEED);
    },
    { passive: false }
  );
  zoomInButton.addEventListener("touchend", () => {
    RemoveContinous(zoomInTouchTimer);
  });

  let zoomOutTouchTimer;
  zoomOutButton.addEventListener(
    "touchstart",
    e => {
      e.preventDefault();
      e.stopImmediatePropagation();
      zoomOutTouchTimer = AddContinous(ZoomOut, TOUCH_SPEED);
    },
    { passive: false }
  );
  zoomOutButton.addEventListener("touchend", () => {
    RemoveContinous(zoomOutTouchTimer);
  });

  let leftArrowTouchTimer;
  leftArrowButton.addEventListener(
    "touchstart",
    e => {
      e.preventDefault();
      e.stopImmediatePropagation();
      leftArrowTouchTimer = AddContinous(GoWest, TOUCH_SPEED);
    },
    { passive: false }
  );
  leftArrowButton.addEventListener("touchend", () => {
    RemoveContinous(leftArrowTouchTimer);
  });

  let rightArrowTouchTimer;
  rightArrowButton.addEventListener(
    "touchstart",
    e => {
      e.preventDefault();
      e.stopImmediatePropagation();
      rightArrowTouchTimer = AddContinous(GoEast, TOUCH_SPEED);
    },
    { passive: false }
  );
  rightArrowButton.addEventListener("touchend", () => {
    RemoveContinous(rightArrowTouchTimer);
  });

  let upArrowTouchTimer;
  upArrowButton.addEventListener(
    "touchstart",
    e => {
      e.preventDefault();
      e.stopImmediatePropagation();
      upArrowTouchTimer = AddContinous(GoNorth, TOUCH_SPEED);
    },
    { passive: false }
  );
  upArrowButton.addEventListener("touchend", () => {
    RemoveContinous(upArrowTouchTimer);
  });

  let downArrowTouchTimer;
  downArrowButton.addEventListener(
    "touchstart",
    e => {
      e.preventDefault();
      e.stopImmediatePropagation();
      downArrowTouchTimer = AddContinous(GoNorth, TOUCH_SPEED);
    },
    { passive: false }
  );
  downArrowButton.addEventListener(
    "touchend",
    () => {
      RemoveContinous(downArrowTouchTimer);
    },
    { passive: false }
  );

  window.addEventListener("keydown", e => {
    if (e.code == "KeyD") {
      GoEast();
    }
    if (e.code == "KeyA") {
      GoWest();
    }
    if (e.code == "KeyW") {
      GoNorth();
    }
    if (e.code == "KeyS") {
      GoSouth();
    }
    if (e.key == "+") {
      ZoomIn();
    }
    if (e.key == "-") {
      ZoomOut();
    }
  });

  window.addEventListener("keypress", e => {
    if (e.code == "KeyR") {
      rotate = !rotate;
    }
  });

  function OnWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    UpdateLabels();
  }

  window.addEventListener("resize", OnWindowResize, false);
  document.addEventListener("mousemove", UpdateLabels, false);
  renderer.domElement.addEventListener("touchmove", UpdateLabels, false);
  renderer.domElement.addEventListener("wheel", UpdateLabels, false);
}

function CreateTerrain(elevations) {
  scene.remove(plane);

  let geometry = new THREE.PlaneGeometry(
    PLANE_WIDTH,
    PLANE_HEIGHT,
    Math.round(Math.sqrt(SIZE)) - 2,
    Math.round(Math.sqrt(SIZE)) - 2
  );

  for (let i = 0, l = geometry.vertices.length; i < l; i++) {
    geometry.vertices[i].z = elevations[i];
  }

  let material = new THREE.MeshBasicMaterial({
    color: 0xcfff95,
    wireframe: true
  });
  plane = new THREE.Mesh(geometry, material);
  plane.rotation.x = -Math.PI / 2;

  scene.add(plane);

  UpdateLabels();
}

function AddAxis() {
  let material = new THREE.LineBasicMaterial({
    color: 0x40c4ff
  });

  let geometry = new THREE.Geometry();
  geometry.vertices.push(
    new THREE.Vector3(0, -AXIS_LENGHT, 0),
    new THREE.Vector3(0, AXIS_LENGHT, 0)
  );

  let axis = new THREE.Line(geometry, material);
  scene.add(axis);
}

function AddNorthPointer() {
  let material = new THREE.LineBasicMaterial({
    color: 0xd81b60
  });

  let vertex0 = new THREE.Vector3(0, centerElevation - AXIS_LENGHT * 0.1, 0);
  let vertex1 = new THREE.Vector3(
    0,
    centerElevation - AXIS_LENGHT * 0.1,
    PLANE_WIDTH / Math.sqrt(SIZE)
  );

  geometry = new THREE.Geometry();
  geometry.vertices.push(vertex0, vertex1);

  pivot.position = vertex0;

  let northPointer = new THREE.Line(geometry, material);

  northPointer.rotation.x = -Math.PI / 2;
  pivot.rotation.x = -Math.PI / 2;

  pivot.add(northPointer);
  scene.add(pivot);
}

function CreateScene() {
  scene.background = new THREE.Color(0x1c313a);

  new THREE.OrbitControls(camera, renderer.domElement);

  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camera.position.y = 6000;
  camera.position.z = 3000;
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  // render loop
  let animate = function() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);

    if (rotate) {
      plane.rotation.z += ROTATION_SPEED;
      pivot.rotation.z += ROTATION_SPEED;
    }
  };
  // --

  animate();
}

function UpdateTerrain(elevations) {
  CreateTerrain(elevations);
  AddAxis();
  AddNorthPointer();
}

//pass new THREE.Vector3
function GetScreenPos(vector) {
  vector.project(camera);
  vector.x = ((vector.x + 1) * renderer.domElement.width) / 2;
  vector.y = (-(vector.y - 1) * renderer.domElement.height) / 2;
  vector.z = 0;
  return vector;
}

function DDToDMS(lat, lon) {
  let latResult, lonResult;

  lat = parseFloat(lat);
  lon = parseFloat(lon);

  latResult = lat >= 0 ? "N" : "S";
  lonResult = lon >= 0 ? "E" : "W";

  latResult += GetDms(lat);
  lonResult += GetDms(lon);

  return `${latResult}&nbsp${lonResult}`;
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
