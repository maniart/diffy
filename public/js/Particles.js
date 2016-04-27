'use strict';
// AEROTWIST made this possible. all code ideas here borrowed form
// [site here]
// Constructor
function Particles() {

  // private
  var camera;
  var scene;
  var renderer;
  var mode;
  var holdAtOrigin = true;
  var image = document.querySelector('img');
  var srcImg;
  var destCanvas;
  var context;
  var frame;
  var colors;
  var particleSystem;
  var particles;
  var orbitValue = 0;
  var orbitCamera;
  var bounceParticle = false;
  var $container = $('body');

  var ORBIT_RATE = 0.01;
  var ATTRACT = 0;
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

    destCanvas = document.querySelector('.output-1');
    // destCanvas.width = 260;
    // destCanvas.height = 200;

    context = destCanvas.getContext('2d');
    camera = new THREE.Camera(45, WIDTH / HEIGHT, NEAR, FAR);
    scene = new THREE.Scene();
    renderer = new  THREE.WebGLRenderer();

    //start the renderer
    renderer.setSize(WIDTH, HEIGHT);
    $container.appendChild(renderer.domElement);

    // addEventListeners();
    // update();

  }

  function getFrame() {
    return srcImg.src;
  }

  function onFrame(frame) {

    //removeParticles();

    addParticles();


  }

  /**
	 * Kills off the particles, wipes the
	 * canvas clean and does a bit of gc
	 */
	function removeParticles() {
		scene.removeChild(particleSystem);
		particleSystem = null;
		context.clearRect(0, 0, 260, 200);
	}

  /**
	 * Adds the particles to the scene
	 * based on the image that has been
	 * last uploaded
	 */
	function addParticles() {
		// draw in the image, and make sure it fits the canvas size :)
		var ratio			= 1 / Math.max(image.width/600, image.height/600);
		console.log('ratio is -', ratio);
		var scaledWidth		= image.width * ratio;
		var scaledHeight	= image.height * ratio;
		context.drawImage(image,
							0,0,image.width,image.height,
							(600 - scaledWidth) * .5, (600 - scaledHeight) *.5, scaledWidth, scaledHeight);

		// now set up the particle material
		var material 	= new THREE.ParticleBasicMaterial( { blending: THREE.BillboardBlending, map: ImageUtils.loadTexture("images/particle.png"), size: DENSITY * 1.5, opacity: 1, vertexColors:true, sizeAttenuation:true } );
		var geometry	= new THREE.Geometry();
		var pixels		= context.getImageData(0,0,WIDTH,HEIGHT);
		var step		= DENSITY * 4;
		var x = 0, y = 0;

		// go through the image pixels
	    for(x = 0; x < WIDTH * 4; x+= step)
	    {
	    	for(y = HEIGHT; y >= 0 ; y -= DENSITY)
	    	{
	    		var p = ((y * WIDTH * 4) + x);

	    		// grab the actual data from the
	    		// pixel, ignoring any transparent ones
	    		if(pixels.data[p+3] > 0)
			    {
			    	var pixelCol	= (pixels.data[p] << 16) + (pixels.data[p+1] << 8) + pixels.data[p+2];
			    	var color 		= new THREE.Color(pixelCol);
			    	var vector 		= new THREE.Vector3(-300 + x/4, 240 - y, 0);

			    	// push on the particle
			    	geometry.vertices.push(new THREE.Vertex(vector));
			    	geometry.colors.push(color);
			    }
	    	}
	    }

	    // now create a new system
	    particleSystem 	= new THREE.ParticleSystem(geometry, material);
	    particleSystem.sortParticles = true;

	    // grab a couple of cacheable vals
	    particles		= particleSystem.geometry.vertices;
		colors			= particleSystem.geometry.colors;

		// add some additional vars to the
		// particles to ensure we can do physics
		// and so on

		var ps = particles.length;
		while(ps--)
		{
			var particle 		= particles[ps];
			particle.velocity	= new THREE.Vector3();
			particle.mass		= 5;
			particle.origPos	= particle.position.clone();
		}

		// gc and add
		pixels = null;
		scene.addObject(particleSystem);
	}

	/**
	 * Updates the velocity and position
	 * of the particles in the view
	 */
	function update()
	{
		var ps = particles.length;
		while(ps--)
		{
			var particle 		= particles[ps];

			// if we are holding at the origin
			// values, tween the particles back
			// to where they should be
			if(holdAtOrigin)
			{
				particle.velocity 	= new THREE.Vector3();
				particle.position.x += (particle.origPos.x - particle.position.x) * .2;
				particle.position.y += (particle.origPos.y - particle.position.y) * .2;
				particle.position.z += (particle.origPos.z - particle.position.z) * .2;
			}
			else
			{
				// get the particles colour and put
				// it into an array
				var col				= colors[ps];
				var colArray		= [col.r, col.g, col.b];

				// go through each component colour
				for(var i = 0; i < colArray.length; i++)
				{
					// only analyse it if actually
					// has some of this colour
					if(colArray[i] > 0)
					{
						// get the target based on where it
						// is in the array
						var target			= i == 0 ? redCentre :
											  i == 1 ? greenCentre :
											  blueCentre;

						// get the distance of the particle to the centre in question
						// and add on the resultant acceleration
						var dist			= particle.position.distanceToSquared(target.position),
							force			= ((particle.mass * target.mass) / dist) * colArray[i] * AGGRESSION,
							acceleration	= (new THREE.Vector3())
												.sub(target.position,particle.position)
												.normalize()
												.multiplyScalar(force);

						// if we are attracting we add
						// the velocity
						if(mode == ATTRACT)
						{
							// note we only need to check the
							// squared radius for the collision :)
							if(dist > target.boundRadiusSquared) {
								particle.velocity.addSelf(acceleration);
							}
							else if (bounceParticles) {
								// bounce, bounce, bounce
								particle.velocity.negate();
							}
							else {
								// stop dead
								particle.velocity = new THREE.Vector3();
							}
						}
						else {
							// push it away
							particle.velocity.subSelf(acceleration);
						}

						particle.position.addSelf(particle.velocity);
					}
				}
			}
		}

		// if we are panning the camera round
		// do that now
		if(orbitCamera)
		{
			camera.position.x = Math.sin(orbitValue) * DEPTH;
			camera.position.y = Math.sin(orbitValue) * 300;
			camera.position.z = Math.cos(orbitValue) * DEPTH;
			orbitValue += ORBIT_RATE;
		}

		// set up a request for a render
		requestAnimationFrame(render);
	}

	/**
	 * Renders the current state
	 */
	function render()
	{
    console.log('render');
    // only render if we have
		// an active image
		if(image) {
			renderer.render( scene, camera );
		}

		// set up the next frame
		update();
	}


}
