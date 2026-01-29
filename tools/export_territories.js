/**
 * Export Territory SVGs
 * 
 * Reads territory paths from js/territory-paths.js and creates individual SVG files
 * for each territory in the territories_svg/ folder.
 */

const fs = require('fs');
const path = require('path');

// Read the territory-paths.js file
const territoryPathsFile = path.join(__dirname, '..', 'js', 'territory-paths.js');
const fileContent = fs.readFileSync(territoryPathsFile, 'utf8');

// Extract the territoryPaths object
// Match: const territoryPaths = { ... };
const match = fileContent.match(/const\s+territoryPaths\s*=\s*({[\s\S]*?});/);
if (!match) {
  console.error('Could not find territoryPaths object in file');
  process.exit(1);
}

// Parse the object (using eval in a safe context since this is our own data)
const territoryPathsStr = match[1];
const territoryPaths = eval('(' + territoryPathsStr + ')');

// Create output directory
const outputDir = path.join(__dirname, '..', 'territories_svg');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Parse SVG path to extract coordinates
const parsePathCoordinates = (pathData) => {
  // Extract all coordinate pairs from the path data
  const coords = [];
  const matches = pathData.matchAll(/([ML])\s*([\d.]+)[,\s]+([\d.]+)/gi);
  
  for (const match of matches) {
    const x = parseFloat(match[2]);
    const y = parseFloat(match[3]);
    coords.push({ x, y });
  }
  
  return coords;
};

// Calculate bounding box for a territory
const getBoundingBox = (coords) => {
  if (coords.length === 0) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
  }
  
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  for (const { x, y } of coords) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  
  return { minX, minY, maxX, maxY };
};

// SVG template with proper styling and centered viewBox
const createSVG = (territoryName, pathData, transform = '') => {
  const transformAttr = transform ? ` transform="${transform}"` : '';
  
  // Parse coordinates and calculate bounding box
  const coords = parsePathCoordinates(pathData);
  const bbox = getBoundingBox(coords);
  
  // Add padding around the territory (10% of size)
  const width = bbox.maxX - bbox.minX;
  const height = bbox.maxY - bbox.minY;
  const padding = Math.max(width, height) * 0.1;
  
  const viewBoxX = bbox.minX - padding;
  const viewBoxY = bbox.minY - padding;
  const viewBoxWidth = width + (padding * 2);
  const viewBoxHeight = height + (padding * 2);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}" preserveAspectRatio="xMidYMid meet">
  <defs>
    <style>
      .territory {
        fill: #f4d03f;
        stroke: #333;
        stroke-width: 3;
        stroke-linejoin: round;
        stroke-linecap: round;
      }
    </style>
  </defs>
  <path id="${territoryName}" class="territory" d="${pathData.trim()}"${transformAttr}/>
</svg>`;
};

// Export each territory
let count = 0;
for (const [territoryName, pathData] of Object.entries(territoryPaths)) {
  // Special case: Greenland has a manual transform
  const transform = territoryName === 'greenland' ? 'translate(-2, -3)' : '';
  
  // Create SVG content
  const svgContent = createSVG(territoryName, pathData, transform);
  
  // Write to file (sanitize filename)
  const filename = territoryName.replace(/\s+/g, '_') + '.svg';
  const filepath = path.join(outputDir, filename);
  
  fs.writeFileSync(filepath, svgContent, 'utf8');
  console.log(`✓ Created ${filename}`);
  count++;
}

console.log(`\n✅ Successfully exported ${count} territories to ${outputDir}`);
