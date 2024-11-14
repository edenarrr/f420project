import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();

const shapes = [];

function create_shape(points, edges, mesh) {
    const shape = {
        points: points,
        edges: edges,
        mesh: mesh
    }
    return shape;
}

renderer.setSize(window.innerWidth / 2, window.innerHeight / 2);
document.body.appendChild(renderer.domElement);

// Add a 3D grid helper
const gridHelper = new THREE.GridHelper(10, 10); // size 10, 10 divisions
scene.add(gridHelper);

// Add an axes helper
const axesHelper = new THREE.AxesHelper(5); // length 5 for each axis
scene.add(axesHelper);

camera.position.z = 10;

// Add OrbitControls for camera pan and rotation
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = true;  // Enables panning
controls.enableZoom = true; // Enables zooming
controls.update();

function near_equal(a, b, epsilon = 0.001) {
    return Math.abs(a - b) < epsilon;
}

function generate_shape(n) {
    var points = [];
    var edges = [];
    for (let i = 0; i < n; i++) {
        const x = (Math.random() - 0.5) * 10;
        const y = (Math.random() - 0.5) * 10;
        const z = (Math.random() - 0.5) * 10;
        points.push(new THREE.Vector3(x, y, z));
    }
    const geometry = new ConvexGeometry(points);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, opacity: 0.5, transparent: true, wireframe: false });
    const polyhedron = new THREE.Mesh(geometry, material);

    //get the vertices of the polyhedron that remain after convex hull calculation
    const vertexBuffer = geometry.attributes.position.array;
    var vertices = [];
    
    for (let i = 0; i < vertexBuffer.length; i += 3) {
        vertices.push(new THREE.Vector3(vertexBuffer[i], vertexBuffer[i + 1], vertexBuffer[i + 2]));
    }
    points = points.filter(element => {
        // Check if there is a matching vector in vertices
        return vertices.some(v => near_equal(v.x,element.x) && near_equal(v.y,element.y) && near_equal(v.z,element.z));
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
        edges.push([new THREE.Vector3(edgesGeometry.attributes.position.array[i], edgesGeometry.attributes.position.array[i + 1], edgesGeometry.attributes.position.array[i + 2]),
        new THREE.Vector3(edgesGeometry.attributes.position.array[i + 3], edgesGeometry.attributes.position.array[i + 4], edgesGeometry.attributes.position.array[i + 5])]);
    }

    return create_shape(points, edges, polyhedron);
}

function independent_set(shape) {
    const vertices = shape.points;   // Vertices in the polyhedron
    const edges = shape.edges;       // Edges between vertices

    const marked = new Array(vertices.length).fill(false); // Array to keep track of marked vertices
    const independentSet = [];       // Independent set to be returned

    // Step 1: Calculate degree of each vertex
    const degrees = Array(vertices.length).fill(0);

    // Populate degrees array
    for (let i = 0; i < edges.length; i++) {
        const [v1, v2] = edges[i];

        const index1 = vertices.findIndex(v => near_equal(v.x, v1.x) && near_equal(v.y, v1.y) && near_equal(v.z, v1.z));
        const index2 = vertices.findIndex(v => near_equal(v.x, v2.x) && near_equal(v.y, v2.y) && near_equal(v.z, v2.z));

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
                const index1 = vertices.findIndex(v => near_equal(v.x, v1.x) && near_equal(v.y, v1.y) && near_equal(v.z, v1.z));
                const index2 = vertices.findIndex(v => near_equal(v.x, v2.x) && near_equal(v.y, v2.y) && near_equal(v.z, v2.z));

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

function add_shape(shape) {
    //draw sphere at each vertex
    for (let i = 0; i < shape.points.length; i++) {
        const geometry = new THREE.SphereGeometry(0.1, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(shape.points[i]);
        scene.add(sphere);
    }

    const geometry = new ConvexGeometry(shape.points);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, opacity: 0.5, transparent: true, wireframe: false });
    const polyhedron = new THREE.Mesh(geometry, material);
    scene.add(polyhedron);
}

// Generate random points and create a convex polyhedron
const shape = generate_shape(20);
shapes.push(shape);
scene.add(shape.mesh);
var independentSet = independent_set(shape);
console.log(independentSet);
//show independent set
for (let i = 0; i < independentSet.length; i++) {
    const geometry = new THREE.SphereGeometry(0.1, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(independentSet[i]);
    scene.add(sphere);
}

function animate() {
    controls.update();
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
