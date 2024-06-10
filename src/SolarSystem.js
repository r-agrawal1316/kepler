import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  Lensflare,
  LensflareElement,
} from "three/examples/jsm/objects/Lensflare";

const SolarSystem = () => {
  const mountRef = useRef(null);

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

    const sunTexture = loader.load("/sun.jpeg");
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

    const textureFlare = loader.load("/flare.jpeg"); 
    const lensflare = new Lensflare();
    lensflare.addElement(new LensflareElement(textureFlare, 512, 0));
    lensflare.position.copy(pointLight.position);
    scene.add(lensflare);

    const planetData = [
      { color: 0xff0000, distance: 10, size: 1 },
      { color: 0x00ff00, distance: 20, size: 2 },
      { color: 0x0000ff, distance: 30, size: 2.5 }, 
      { color: 0xff00ff, distance: 40, size: 2 }, 
    ];

    const planets = planetData.map((data) => {
      const geometry = new THREE.SphereGeometry(data.size, 32, 32);
      const material = new THREE.MeshStandardMaterial({ color: data.color });
      const planet = new THREE.Mesh(geometry, material);
      planet.position.set(data.distance, 0, 0);
      scene.add(planet);
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

    const animate = () => {
      requestAnimationFrame(animate);

      sun.rotation.y += 0.005;

      planets.forEach((planet, index) => {
        const angle = Date.now() * 0.001 * (index + 1);
        planet.position.x = planetData[index].distance * Math.cos(angle);
        planet.position.z = planetData[index].distance * Math.sin(angle);
      });

      const starOpacityAttribute = starGeometry.getAttribute("opacity");
      for (let i = 0; i < starOpacityAttribute.count; i++) {
        starOpacityAttribute.array[i] = Math.abs(
          Math.sin(Date.now() * 0.001 + i)
        );
      }
      starOpacityAttribute.needsUpdate = true;

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
    };
  }, []);

  return <div ref={mountRef} />;
};

export default SolarSystem;
