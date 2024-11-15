/* eslint-disable no-undef, no-unused-vars */

class Point {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
  }
  
  class Polygon {
    constructor(points) {
      this.points = points;
      this.hierarchy = this.buildHierarchy(points);
    }
  
    buildHierarchy(points) {
      const hierarchy = [points];
      while (points.length > 3) {
        points = this.reducePolygon(points);
        hierarchy.push(points);
      }
      return hierarchy;
    }
  
    reducePolygon(points) {
      const reducedPoints = [];
      for (let i = 0; i < points.length; i += 2) {
        reducedPoints.push(points[i]);
      }
      return reducedPoints;
    }
  }
  
  // Global variables
  let polygons = []; // Polygons are expected to be convex
  let currentPolygonPoints = [];
  let collidingPolygons = []; // Stores polygons involved in collision
  let collisionComputed = false;
  
  function setup() {

    const holder = document.getElementById("sketch-holder");
    const canvas = createCanvas(holder.offsetWidth, holder.offsetHeight);
    canvas.parent("sketch-holder"); // Attach canvas to #sketch-holder
    fill("black");
    textSize(20);
  
    // Button to finish adding points to the current polygon
    buttonFinishPolygon = createButton("Finish Polygon");
    buttonFinishPolygon.position(30, 120);
    buttonFinishPolygon.mousePressed(function (event) {
        event.stopPropagation(); // Prevents the mousePressed event from propagating to the canvas
        finishPolygon();
    });
  
    // Button to check for collisions
    buttonCheckCollision = createButton("Check Collision");
    buttonCheckCollision.position(150, 120);
    buttonCheckCollision.mousePressed(function (event) {
        event.stopPropagation(); // Prevents the mousePressed event from propagating to the canvas
        checkCollision();
    });

    buttonReset = createButton("Reset");
    buttonReset.position(270, 120);
    buttonReset.mousePressed(function (event) {
        event.stopPropagation(); // Prevents the mousePressed event from propagating to the canvas
        reset();
    });
  }

  function reset() {
      // Global variables
    polygons = []; // Polygons are expected to be convex
    currentPolygonPoints = [];
    collidingPolygons = []; // Stores polygons involved in collision
    collisionComputed = false;
  }
  
  // Finish the current polygon and add it to the list
  function finishPolygon() {
    if (currentPolygonPoints.length > 2) {
      const polygon = new Polygon([...currentPolygonPoints]);
      polygons.push(polygon);
      currentPolygonPoints = [];
    }
  }
  
  // Check for collision using the DK hierarchy
  function checkCollision() {
    collidingPolygons = [];
    if (polygons.length != 2) return;

    // Pick the largest hierarchy length (between the two polygons) as start level
    hierarchyLength1 = polygons[0].hierarchy.length
    hierarchyLength2 = polygons[1].hierarchy.length
    if(hierarchyLength1 > hierarchyLength2) {
      level = hierarchyLength1-1
    }
    else {
      level = hierarchyLength2-1
    }
    if (detectHierarchyCollision(polygons[0], polygons[1], level)) {
      collidingPolygons.push(polygons[0], polygons[1]);
    }
    collisionComputed = true
  }
  
  // Recursive function to detect collision using DK hierarchy
  function detectHierarchyCollision(poly1, poly2, level) {
    // If the hierarchy of one of the polygons is bigger than the other one: compare it to the highest level of the "other one"
    if (level >= poly1.hierarchy.length) {
      hull1 = poly1.hierarchy[poly1.hierarchy.length - 1];
    }
    else{
      hull1 = poly1.hierarchy[level];
    }
    if (level >= poly2.hierarchy.length) {
      hull2 = poly2.hierarchy[poly2.hierarchy.length - 1];
    }
    else {
      hull2 = poly2.hierarchy[level];
    }
    
    // Stop early if intersection found
    if (isIntersecting(hull1, hull2)) {
      return true;
    }
    // If intersection not found, continue for lower level of DK hierarchy
    else { 
      if(level === 0) // If it's the full polygon level
        return false;
      return detectHierarchyCollision(poly1, poly2, level-1)
    }
  }
  
  // Function to determine if two convex polygons intersect
  function isIntersecting(poly1, poly2) {
    return !hasSeparatingAxis(poly1, poly2) && !hasSeparatingAxis(poly2, poly1);
  }
  
  // Function to check if there is a separating axis
  function hasSeparatingAxis(poly1, poly2) {
    for (let i = 0; i < poly1.length; i++) {
      let next = (i + 1) % poly1.length;
      let edge = new Point(poly1[next].x - poly1[i].x, poly1[next].y - poly1[i].y);
      let axis = new Point(-edge.y, edge.x);
      
      // Project both polygons onto the axis
      let projection1 = projectPolygon(poly1, axis);
      let projection2 = projectPolygon(poly2, axis);
      
      if (projection1.max < projection2.min || projection2.max < projection1.min) {
        return true; // Found a separating axis
      }
    }
    return false;
  }
  
  // Helper function to project a polygon onto an axis
  function projectPolygon(polygon, axis) {
    let min = (polygon[0].x * axis.x + polygon[0].y * axis.y);
    let max = min;
    
    for (let i = 1; i < polygon.length; i++) {
      let projection = polygon[i].x * axis.x + polygon[i].y * axis.y;
      if (projection < min) {
        min = projection;
      }
      if (projection > max) {
        max = projection;
      }
    }
    return { min, max };
  }
  
  // Mouse click to add a point to the current polygon
  function mousePressed() {
    const holder = document.getElementById("sketch-holder");
    if(0 <= mouseX && mouseX <= holder.offsetWidth && 0 <= mouseY && mouseY <= holder.offsetHeight){
      currentPolygonPoints.push(new Point(mouseX, mouseY));
    }
  }
  
  function draw() {
    background(200);
    stroke(0);
    fill(150, 200, 250, 100);
  
    // Draw completed polygons
    for (let poly of polygons) {
      if (collidingPolygons.includes(poly)) {
        fill(255, 0, 0, 100); // Highlight color for collision
      } else {
        fill(150, 200, 250, 100); // Normal color
      }
      beginShape();
      for (let point of poly.points) {
        vertex(point.x, point.y);
      }
      endShape(CLOSE);
    }
  
    // Draw the current polygon in progress
    fill(150, 200, 250, 100);
    beginShape();
    for (let point of currentPolygonPoints) {
      vertex(point.x, point.y);
    }
    endShape();
  
    // Display collision result
    fill("black");
    TextX = 23
    TextY = 60
    if (collidingPolygons.length > 0) {
      text("Collision Detected", TextX, TextY);
    } else {
        if(collisionComputed) {
            text("No Collision", TextX, TextY);
        }
    }
  }
  