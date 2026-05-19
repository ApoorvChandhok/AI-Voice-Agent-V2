"use client";

import { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";

export default function GlobeVisualization() {
  const globeRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });

  const markers = [
    { name: 'Delhi', lat: 28.6139, lng: 77.209, size: 0.5, color: 'white' },
    { name: 'Mumbai', lat: 19.076, lng: 72.8777, size: 0.5, color: 'white' },
    { name: 'New York', lat: 40.7128, lng: -74.006, size: 0.5, color: 'white' },
    { name: 'London', lat: 51.5074, lng: -0.1278, size: 0.5, color: 'white' },
    { name: 'Sydney', lat: -33.8688, lng: 151.2093, size: 0.5, color: 'white' },
  ];

  useEffect(() => {
    // Auto-rotate and color tinting
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.5;
      
      // Safely apply the orange and brown theme if the method is available
      setTimeout(() => {
        if (globeRef.current && typeof globeRef.current.globeMaterial === 'function') {
          const material = globeRef.current.globeMaterial();
          if (material) {
            material.color.set('#f97316'); // Orange continents
            material.emissive.set('#4a2211'); // Dark brown ocean/base
            material.emissiveIntensity = 0.8;
            material.shininess = 0.2;
          }
        }
      }, 500);
    }
    
    // Handle resize
    const handleResize = () => {
      const container = document.getElementById('globe-container');
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: container.clientHeight
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    // Initial size
    setTimeout(handleResize, 100);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div id="globe-container" className="flex items-center justify-center w-full h-full relative cursor-grab active:cursor-grabbing" style={{ minHeight: '300px' }}>
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-water.png"
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere={false}
        htmlElementsData={markers}
        htmlElement={(d: any) => {
          const el = document.createElement('div');
          el.innerHTML = `
            <div style="display: flex; flex-direction: column; items-center; justify-center; align-items: center; pointer-events: auto; cursor: pointer;">
              <div style="width: 8px; height: 8px; background-color: white; border-radius: 50%; box-shadow: 0 0 10px white;"></div>
              <div style="color: white; font-size: 10px; font-weight: bold; margin-top: 4px; text-shadow: 0px 0px 4px rgba(0,0,0,1); background: rgba(0,0,0,0.5); padding: 2px 4px; border-radius: 4px;">${d.name}</div>
            </div>
          `;
          return el;
        }}
      />
    </div>
  );
}
