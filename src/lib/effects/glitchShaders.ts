export function applyNightVision(element: HTMLElement): void {
  element.classList.add('night-vision');
}

export function removeNightVision(element: HTMLElement): void {
  element.classList.remove('night-vision');
}

export function applyChromaticAberration(canvas: HTMLCanvasElement, intensity: number): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const width = canvas.width;
  const height = canvas.height;
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const outputData = new Uint8ClampedArray(data.length);
  
  const offsetR = Math.floor(intensity * width);
  const offsetB = -Math.floor(intensity * width);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      const xR = Math.min(Math.max(x + offsetR, 0), width - 1);
      const idxR = (y * width + xR) * 4;
      outputData[idx] = data[idxR];
      
      outputData[idx + 1] = data[idx + 1];
      
      const xB = Math.min(Math.max(x + offsetB, 0), width - 1);
      const idxB = (y * width + xB) * 4;
      outputData[idx + 2] = data[idxB + 2];
      
      outputData[idx + 3] = data[idx + 3];
    }
  }
  
  const newImageData = new ImageData(outputData, width, height);
  ctx.putImageData(newImageData, 0, 0);
}

export function applyVHSTearing(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const width = canvas.width;
  const height = canvas.height;
  
  const numTears = Math.floor(Math.random() * 5) + 2;
  
  for (let i = 0; i < numTears; i++) {
    const y = Math.floor(Math.random() * height);
    const tearHeight = Math.floor(Math.random() * 10) + 2;
    const shift = Math.floor(Math.random() * 20) - 10;
    
    if (y + tearHeight < height) {
      const imgData = ctx.getImageData(0, y, width, tearHeight);
      ctx.putImageData(imgData, shift, y);
    }
  }
}

export function generateStaticNoise(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const width = canvas.width;
  const height = canvas.height;
  
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const color = Math.random() > 0.5 ? 255 : 0;
    data[i] = color;
    data[i + 1] = color;
    data[i + 2] = color;
    data[i + 3] = 255;
  }
  
  ctx.putImageData(imageData, 0, 0);
}

export function drawSignalLost(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  generateStaticNoise(canvas);
  
  ctx.fillStyle = 'white';
  ctx.font = '24px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.fillStyle = 'black';
  ctx.fillRect(0, canvas.height / 2 - 20, canvas.width, 40);
  
  ctx.fillStyle = 'white';
  ctx.fillText('SIGNAL LOST // RECONNECTING...', canvas.width / 2, canvas.height / 2);
}
