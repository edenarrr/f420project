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
    createCanvas(windowWidth, windowHeight);
    fill("black");
    textSize(20);
  
    // Button to finish adding points to the current polygon
    buttonFinishPolygon = createButton("Finish Polygon");
    buttonFinishPolygon.position(30, 85);
    buttonFinishPolygon.mousePressed(function (event) {
        event.stopPropagation(); // Prevents the mousePressed event from propagating to the canvas
        finishPolygon();
    });
  
    // Button to check for collisions
    buttonCheckCollision = createButton("Check Collision");
    buttonCheckCollision.position(150, 85);
    buttonCheckCollision.mousePressed(function (event) {
        event.stopPropagation(); // Prevents the mousePressed event from propagating to the canvas
        checkCollision();
    });
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
    if (polygons.length < 2) return;
  
    for (let i = 0; i < polygons.length; i++) {
      for (let j = i + 1; j < polygons.length; j++) {
        if (detectHierarchyCollision(polygons[i], polygons[j])) {
          collidingPolygons.push(polygons[i], polygons[j]);
        }
      }
    }
    collisionComputed = true
  }
  
  // Recursive function to detect collision using DK hierarchy
  function detectHierarchyCollision(poly1, poly2, level = 0) {
    if (level >= poly1.hierarchy.length || level >= poly2.hierarchy.length) {
      return false;
    }
  
    const hull1 = poly1.hierarchy[level];
    const hull2 = poly2.hierarchy[level];
  
    if (isIntersecting(hull1, hull2)) {
      if (level === 0) {
        return true; // Collision found at the base level
      }
      // Refine check at the next level of detail
      return detectHierarchyCollision(poly1, poly2, level - 1);
    }
    return false; // No collision found at this level
  }
  
  // Helper function to determine if two convex polygons intersect
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
    currentPolygonPoints.push(new Point(mouseX, mouseY));
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
    if (collidingPolygons.length > 0) {
      text("Collision Detected", 30, 50);
    } else {
        if(collisionComputed) {
            text("No Collision", 30, 50);
        }
    }
  }
  