// AEROTWIST made this possible. all code ideas here borrowed form
// [site here]
function Particles() {

  // private
  var camera;
  var scene;
  var renderer;
  var mode;
  var image;
  var canvas;
  var context;
  var colors;
  var particleSystem;
  var particles;
  var orbitValue = 0;
  var orbitCamera;
  var bounceParticle = false;
  var $container = $('body');

  var ORBIT_RATE = 0.01;
  var WIDTH = $container.clientWidth;
  var HEIGHT = $container.clientHeight;
  var DENSITY = 7;
  var NEAR = 1;
  var FAR = 10000;
  var CENTER_MASS = 5;
  var AGGRESSION = 20;
  var DEPTH = Math.max(WIDTH, HEIGHT);

  this.init = function() {
    mode = ATTRACT;

    canvas = $('.canvas-1');
    canvas.width = 260;
    canvas.height = 200;

    context = canvas.getContext('2d');
    camera = new THREE.Camera(45, WIDTH / HEIGHT, NEAR, FAR);
    scene = new THREE.Scene();
    renderer = new  THREE.WebGLRenderer();

    //start the renderer
    renderer.setSize(WIDTH, HEIGHT);
    $container.append(renderer.domElement); 
  }


}
