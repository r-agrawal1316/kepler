import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  Lensflare,
  LensflareElement,
} from "three/examples/jsm/objects/Lensflare";
import data from "./Data"; // Import the data file
import "./Home.css";

const Home = () => {
  const mountRef = useRef(null);
  const breakingNewsTextRef = useRef(null);
  // State to track the selected planet
  const [selectedPlanet, setSelectedPlanet] = useState(null);

  useEffect(() => {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 50, 50);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;

    const loader = new THREE.TextureLoader();
    loader.load(
      "/",
      (texture) => {
        const galaxyGeometry = new THREE.SphereGeometry(1000, 32, 32);
        const galaxyMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.BackSide,
        });
        const galaxy = new THREE.Mesh(galaxyGeometry, galaxyMaterial);
        scene.add(galaxy);
      },
      undefined,
      (err) => {
        console.error("An error happened while loading the texture.", err);
      }
    );

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    const sunTexture = loader.load("/sun2.jpeg");
    const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);

    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        c: { type: "f", value: 0.3 },
        p: { type: "f", value: 2.0 },
        glowColor: { type: "c", value: new THREE.Color(0xffff00) },
        viewVector: { type: "v3", value: camera.position },
      },
      vertexShader: `
                uniform vec3 viewVector;
                varying float intensity;
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(normalMatrix * viewVector);
                    intensity = pow(c - dot(vNormal, vNormel), p);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
      fragmentShader: `
                uniform vec3 glowColor;
                varying float intensity;
                void main() {
                    vec4 color = vec4(glowColor, 1.0) * intensity;
                    gl_FragColor = color;
                }
            `,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });

    const glowGeometry = new THREE.SphereGeometry(5.5, 32, 32);
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    sun.add(glowMesh);
    scene.add(sun);
    // Store sun data on the mesh object
    sun.userData = { name: "Project" };

    const textureFlare = loader.load("/flare.jpeg");
    const lensflare = new Lensflare();
    lensflare.addElement(new LensflareElement(textureFlare, 1500, 0));
    lensflare.position.copy(pointLight.position);
    scene.add(lensflare);

    const planetData = [
      {
        name: "Profile",
        texture: loader.load("/mercury.jpg"),
        distance: 10,
        size: 2.5,
        label: "Profile",
      },
      {
        name: "Contact",
        texture: loader.load("/jupiter.jpg"),
        distance: 15,
        size: 4,
        label: "Contact",
      },
      {
        name: "AboutMe",
        texture: loader.load("/earth.jpg"),
        distance: 20,
        size: 3,
        label: "AboutMe",
      },
      {
        name: "Skills",
        texture: loader.load("/mars.jpg"),
        distance: 25,
        size: 2.5,
        label: "Skills",
      },
      {
        name: "Achievements",
        texture: loader.load("/venus.jpg"),
        distance: 30,
        size: 3,
        label: "Achievements",
      },
      {
        name: "Experience",
        texture: loader.load("/neptune.jpg"),
        distance: 35,
        size: 3,
        label: "Experience",
      },
      {
        name: "Education",
        texture: loader.load("/saturn.jpg"),
        distance: 40,
        size: 3.5,
        label: "Education",
      },
      {
        name: "Introduction",
        texture: loader.load("/urans.jpg"),
        distance: 45,
        size: 2.5,
        label: "Introduction",
      },
    ];

    const planets = planetData.map((data) => {
      const geometry = new THREE.SphereGeometry(data.size, 32, 32);
      const material = new THREE.MeshBasicMaterial({ map: data.texture });
      const planet = new THREE.Mesh(geometry, material);
      planet.position.set(data.distance, 0, 0);
      scene.add(planet);

      // Create canvas for label
      const canvas = document.createElement("canvas");
      canvas.width = 2000; // Width
      canvas.height = 800; // Height
      const context = canvas.getContext("2d");
      context.fillStyle = "red"; // Red text
      context.fillRect(0, 0, canvas.width, canvas.height); // White background
      context.fillStyle = "white"; // White text
      context.font = "300px Arial"; // Font size
      context.textAlign = "center";
      context.fillText(data.name, canvas.width / 2, canvas.height / 2);

      // Create texture from canvas
      const labelTexture = new THREE.CanvasTexture(canvas);

      // Apply texture to a sprite for the label
      const labelMaterial = new THREE.SpriteMaterial({ map: labelTexture });
      const labelSprite = new THREE.Sprite(labelMaterial);

      // Adjust position relative to the planet
      labelSprite.position.set(data.distance, data.size + 0.5, 0);
      labelSprite.scale.set(5, 1, 1); // Adjust scale for width and height
      scene.add(labelSprite);

      // Add rings to Saturn
      if (data.name === "Education") {
        const ringGeometry = new THREE.RingGeometry(
          data.size * 1.5,
          data.size * 2.5,
          64
        );
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: 0xffa500,
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 3;
        planet.add(ring); // Attach the ring to Saturn mesh
      }

      // Store planet data on the mesh object
      planet.userData = { name: data.name, labelSprite: labelSprite };
      return planet;
    });

    planetData.forEach((data) => {
      const orbitGeometry = new THREE.RingGeometry(
        data.distance - 0.1,
        data.distance + 0.1,
        64
      );
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
      });
      const orbit = new THREE.LineLoop(orbitGeometry, orbitMaterial);
      orbit.rotation.x = Math.PI / 2;
      scene.add(orbit);
    });

    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1,
      transparent: true,
    });
    const starVertices = [];
    const starOpacity = [];

    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 2000 - 1000;
      const y = Math.random() * 2000 - 1000;
      const z = Math.random() * 2000 - 1000;
      starVertices.push(x, y, z);
      starOpacity.push(Math.random());
    }

    starGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starVertices, 3)
    );
    starGeometry.setAttribute(
      "opacity",
      new THREE.Float32BufferAttribute(starOpacity, 1)
    );

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event) => {
      event.preventDefault();

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects([...planets]);

      if (intersects.length > 0) {
        const intersectedPlanet = intersects[0].object;
        // Set the selected planet's data in the state

        // console.log(intersectedPlanet.userData);
        setSelectedPlanet(intersectedPlanet.userData);

        console.log("userData.name:", intersectedPlanet.userData.name); // Log name property
        console.log("userData:", intersectedPlanet.userData);
      }
    };

    window.addEventListener("click", handleClick);

    // const breakingNewsTextTexture = createBreakingNewsTexture();
    // const breakingNewsTextSpriteMaterial = new THREE.SpriteMaterial({ map: breakingNewsTextTexture });
    // const breakingNewsTextSprite = new THREE.Sprite(breakingNewsTextSpriteMaterial);
    // breakingNewsTextSprite.position.set(500, 0, 0); // Initial position
    // breakingNewsTextSprite.scale.set(20, 4, 1); // Adjust scale
    // scene.add(breakingNewsTextSprite);
    // breakingNewsTextRef.current = breakingNewsTextSprite;

    // const breakingNewsText = createBreakingNewsText();
    // scene.add(breakingNewsText);

    const animate = () => {
      requestAnimationFrame(animate);

      sun.rotation.y += 0.0005;

      planets.forEach((planet, index) => {
        const angle = Date.now() * 0.000005 * (index + 1);
        planet.position.x = planetData[index].distance * Math.cos(angle);
        planet.position.z = planetData[index].distance * Math.sin(angle);

        // Update label position and rotation
        const labelSprite = planet.userData.labelSprite;
        const labelRotation = -angle; // Negative angle to rotate in the opposite direction of the orbit
        labelSprite.position.x = planet.position.x;
        labelSprite.position.z = planet.position.z;
        labelSprite.rotation.y = labelRotation;
      });

      const starOpacityAttribute = starGeometry.getAttribute("opacity");
      for (let i = 0; i < starOpacityAttribute.count; i++) {
        starOpacityAttribute.array[i] = Math.abs(
          Math.sin(Date.now() * 0.001 + i)
        );
      }
      starOpacityAttribute.needsUpdate = true;

      // updateBreakingNewsTextPosition();

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      mountRef.current.removeChild(renderer.domElement);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("click", handleClick);
    };
  }, []);

  // Close the popup
  const handleClose = () => {
    setSelectedPlanet(null);
  };

  // const createBreakingNewsTexture = () => {
  //   const canvas = document.createElement("canvas");
  //   canvas.width = 2048; // Adjust width as needed
  //   canvas.height = 512; // Adjust height as needed
  //   const context = canvas.getContext("2d");
  //   // context.fillStyle = "red"; // Transparent background
  //   context.fillRect(0, 0, canvas.width, canvas.height);

  //   context.font = "108px Arial"; // Font size and style
  //   context.fillStyle = "white"; // Red color
  //   context.textAlign = "center";
  //   context.fillText("Welcome to my portfolio!", canvas.width / 2, canvas.height / 2);

  //   return new THREE.CanvasTexture(canvas);
  // };

  // // Function to update breaking news text position
  // const updateBreakingNewsTextPosition = () => {
  //   if (breakingNewsTextRef.current) {
  //     // Move breaking news text from right to left
  //     breakingNewsTextRef.current.position.x -= 0.5; // Adjust the speed here

  //     // Reset position when it moves out of the screen
  //     if (breakingNewsTextRef.current.position.x < -1000) {
  //       breakingNewsTextRef.current.position.x = 1000; // Adjust the initial position here
  //     }
  //   }
  // };

  return (
    <div className="container">
      <div ref={mountRef} />
      {selectedPlanet && (
        <div className="planet-info">
          <button className="close-button" onClick={handleClose}>
            x
          </button>
          <center>
            <h2 className="headText">{selectedPlanet.name}</h2>
          </center>
          <p className="paraText">{data[selectedPlanet.name]}</p>
        </div>
      )}
    </div>
  );
};

export default Home;
