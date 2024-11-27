import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { ConvexGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/geometries/ConvexGeometry.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, (window.innerHeight/2) / (window.innerHeight/2), 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerHeight / 2, window.innerHeight / 2);
const container = document.getElementById("sphere-3d");
container.appendChild(renderer.domElement);
// document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
  var xsize = window.innerHeight / 2;
  var ysize = window.innerHeight / 2;
  renderer.setSize(xsize, ysize);
  camera.aspect = xsize / ysize;
  camera.updateProjectionMatrix();
});

// for interactivity with camera angle
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.minDistance = 5; 
controls.maxDistance = 50;

// creates a sphere
const sphereRadius = 2;
const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 32, 32);
const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x0077ff, wireframe: true });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);
const shapes = []


function randomPointOnSphere(radius) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u; 
    const phi = Math.acos(2 * v - 1);
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
}

// generates random points on the sphere
const numPoints = 100; // number of points wanted
const randomPointsArray = [];
for (let i = 0; i < numPoints; i++) {
    randomPointsArray.push(randomPointOnSphere(sphereRadius));
}


const pointsGeometry = new THREE.BufferGeometry();
const pointsMaterial = new THREE.PointsMaterial({ color: 0xff0000, size: 0.1 });
pointsGeometry.setFromPoints(randomPointsArray);
const randomPoints = new THREE.Points(pointsGeometry, pointsMaterial);
scene.add(randomPoints);

// convex hull
const convexHullGeometry = new ConvexGeometry(randomPointsArray);
const convexHullMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: true,
    opacity: 0.5,
    transparent: true,
});
const convexHullMesh = new THREE.Mesh(convexHullGeometry, convexHullMaterial);
scene.add(convexHullMesh);

// get edges of the CH
const edgesGeometry = new THREE.EdgesGeometry(convexHullGeometry);
const edges = new THREE.LineSegments(edgesGeometry, convexHullMaterial);

// button to toggle sphere visibility
const button = document.createElement('button');
button.className = 'btn btn-primary';
button.textContent = 'Toggle Sphere';
//button.style.padding = '10px';
//button.style.backgroundColor = '#0077ff';
//button.style.color = 'white';
//button.style.cursor = 'pointer';
container.appendChild(button);
// document.body.appendChild(button);



// sphere visibility on button click
let isSphereVisible = true;
button.addEventListener('click', () => {
    isSphereVisible = !isSphereVisible;
    sphere.visible = isSphereVisible;
});

function near_equal(a, b, epsilon = 0.001) {
    return Math.abs(a - b) < epsilon;
  }
  
  function generate_shape_from_points(points) {
    var edges = [];
    const geometry = new ConvexGeometry(points);
    const material = new THREE.MeshBasicMaterial({
      color: Math.random() * 0xffffff,
      opacity: 0.5,
      transparent: true,
      wireframe: false,
    });
    const polyhedron = new THREE.Mesh(geometry, material);
  
    //get the vertices of the polyhedron that remain after convex hull calculation
    const vertexBuffer = geometry.attributes.position.array;
    var vertices = [];
  
    for (let i = 0; i < vertexBuffer.length; i += 3) {
      vertices.push(
        new THREE.Vector3(
          vertexBuffer[i],
          vertexBuffer[i + 1],
          vertexBuffer[i + 2]
        )
      );
    }
    points = points.filter((element) => {
      // Check if there is a matching vector in vertices
      return vertices.some(
        (v) =>
          near_equal(v.x, element.x) &&
          near_equal(v.y, element.y) &&
          near_equal(v.z, element.z)
      );
    });
  
    //show points
    for (let i = 0; i < points.length; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 32, 32);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.copy(points[i]);
      scene.add(sphere);
    }
  
    const edgesGeometry = new THREE.EdgesGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
    const edgeLines = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    scene.add(edgeLines);
  
    //add edges to the edges array
    for (let i = 0; i < edgesGeometry.attributes.position.array.length; i += 6) {
      edges.push([
        new THREE.Vector3(
          edgesGeometry.attributes.position.array[i],
          edgesGeometry.attributes.position.array[i + 1],
          edgesGeometry.attributes.position.array[i + 2]
        ),
        new THREE.Vector3(
          edgesGeometry.attributes.position.array[i + 3],
          edgesGeometry.attributes.position.array[i + 4],
          edgesGeometry.attributes.position.array[i + 5]
        ),
      ]);
    }
  
    return create_shape(points, edges, polyhedron);
  }
  

  function create_shape(points, edges, mesh) {
    const shape = {
      points: points,
      edges: edges,
      mesh: mesh,
    };
    return shape;
  }
  
  function independent_set(shape) {
    const vertices = shape.points; // Vertices in the polyhedron
    const edges = shape.edges; // Edges between vertices
  
    const marked = new Array(vertices.length).fill(false); // Array to keep track of marked vertices
    const independentSet = []; // Independent set to be returned
  
    // Step 1: Calculate degree of each vertex
    const degrees = Array(vertices.length).fill(0);
  
    // Populate degrees array
    for (let i = 0; i < edges.length; i++) {
      const [v1, v2] = edges[i];
  
      const index1 = vertices.findIndex(
        (v) =>
          near_equal(v.x, v1.x) && near_equal(v.y, v1.y) && near_equal(v.z, v1.z)
      );
      const index2 = vertices.findIndex(
        (v) =>
          near_equal(v.x, v2.x) && near_equal(v.y, v2.y) && near_equal(v.z, v2.z)
      );
  
      if (index1 !== -1 && index2 !== -1) {
        degrees[index1]++;
        degrees[index2]++;
      }
    }
  
    // Step 2: Mark vertices with degree >= 9
    for (let i = 0; i < degrees.length; i++) {
      if (degrees[i] >= 9) {
        marked[i] = true;
      }
    }
  
    // Step 3: Process unmarked vertices to build independent set
    for (let i = 0; i < vertices.length; i++) {
      if (!marked[i]) {
        independentSet.push(vertices[i]); // Add to independent set
        marked[i] = true; // Mark the vertex
  
        // Mark all neighbors of the vertex
        for (let j = 0; j < edges.length; j++) {
          const [v1, v2] = edges[j];
  
          // Find indices of v1 and v2
          const index1 = vertices.findIndex(
            (v) =>
              near_equal(v.x, v1.x) &&
              near_equal(v.y, v1.y) &&
              near_equal(v.z, v1.z)
          );
          const index2 = vertices.findIndex(
            (v) =>
              near_equal(v.x, v2.x) &&
              near_equal(v.y, v2.y) &&
              near_equal(v.z, v2.z)
          );
  
          if (index1 === i && index2 !== -1) {
            marked[index2] = true;
          } else if (index2 === i && index1 !== -1) {
            marked[index1] = true;
          }
        }
      }
    }
  
    return independentSet;
  }
  
  function subtract_iset(shape) {
    // subtract the independent set from the shape
    var vertices = shape.points;
    const independentSet = independent_set(shape);
  
    vertices = vertices.filter((element) => {
      // Keep vertices that do not match any in the independent set
      return independentSet.every(
        (v) =>
          !near_equal(v.x, element.x) ||
          !near_equal(v.y, element.y) ||
          !near_equal(v.z, element.z)
      );
    });
  
    return generate_shape_from_points(vertices);
  }
  
  function dk_hierarchy(shape) {
    var hierarchy = [];
    hierarchy.push(shape);
    shapes.push(shape) // So that we can clear the last level of the hierarchy
    var currentShape = shape;
    while (currentShape.points.length > 4) {
      hierarchy.push(subtract_iset(currentShape));
      currentShape = hierarchy[hierarchy.length - 1];
      shapes.push(currentShape);
      scene.add(currentShape.mesh);
    }
      return hierarchy;
  }
  
function show_hierarchy_to_level(n) {
    if(!hierarchy) {console.log("hier not init") 
        return;}
    //remap n to be within 0 - hierarchy.length
    n = Math.floor(n * hierarchy.length);


  // Clear the scene of previous hierarchy levels
  shapes.forEach((shape) => {
    scene.remove(shape.mesh);
  });
  // Add the hierarchy levels up to the specified level n
  for (let i = hierarchy.length - 1; i > hierarchy.length - n - 1; i--) {
    scene.add(hierarchy[i].mesh);
  }
}

// Set up the slider with an event listener
const levelSlider = document.getElementById("levelSlider2");

levelSlider.addEventListener("input", (event) => {
    //remap the slider value to the hierarchy level range
    const level = 
        (event.target.value / event.target.max);
    show_hierarchy_to_level(level);
});


// uncomment for grid 
// const gridHelper = new THREE.GridHelper(10, 10); // size 10, 10 divisions
// scene.add(gridHelper);
// camera.position.z = 15;

// renders the scene
const shape = generate_shape_from_points(randomPointsArray)
var hierarchy = dk_hierarchy(shape);
console.log(shape)
console.log(hierarchy.length)

var independentSet = independent_set(shape);
//show independent set
for (let i = 0; i < independentSet.length; i++) {
  const geometry = new THREE.SphereGeometry(0.1, 32, 32);
  const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });

  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.copy(independentSet[i]);
  scene.add(sphere);
}

//function animate() {
//    requestAnimationFrame(animate);
//    controls.update(); // Required for damping
//    const width = container.clientWidth;
//    const height = container.clientHeight;
//    renderer.setSize(width / 4, height / 4);
//    camera.aspect = width / height;
//    camera.updateProjectionMatrix();
//    renderer.render(scene, camera);
//}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
