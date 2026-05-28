const sharp = require('sharp');
const path = require('path');

const size = parseInt(process.argv[2] || '192');
const output = process.argv[3] || `icon-${size}.png`;

const svg = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#22c55e" rx="${Math.round(size * 0.15)}"/>
  <text x="50%" y="55%" font-size="${Math.round(size * 0.5)}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, sans-serif">B</text>
</svg>
`;

sharp(Buffer.from(svg))
  .png()
  .toFile(path.join(__dirname, 'public', output))
  .then(() => console.log(`Created ${output}`))
  .catch(err => console.error(err));