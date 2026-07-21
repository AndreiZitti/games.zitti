import { useEffect, useRef, useState } from "react";
import { recolorRgbPixel } from "../utils/iconicColor";

const assetCache = new Map();

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load ${src}`));
    image.src = src;
  });
}

function loadIconicAsset(subject) {
  if (assetCache.has(subject.id)) return assetCache.get(subject.id);

  const request = Promise.all([loadImage(subject.image), loadImage(subject.mask)]).then(
    ([sourceImage, maskImage]) => {
      const canvas = document.createElement("canvas");
      canvas.width = sourceImage.naturalWidth;
      canvas.height = sourceImage.naturalHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
      const source = context.getImageData(0, 0, canvas.width, canvas.height);

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(maskImage, 0, 0, canvas.width, canvas.height);
      const mask = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let maskedPixelCount = 0;

      for (let pixelIndex = 0; pixelIndex < canvas.width * canvas.height; pixelIndex += 1) {
        if (mask[pixelIndex * 4] > 8) maskedPixelCount += 1;
      }

      const indexes = new Uint32Array(maskedPixelCount);
      const alpha = new Uint8Array(maskedPixelCount);
      let maskedIndex = 0;

      for (let pixelIndex = 0; pixelIndex < canvas.width * canvas.height; pixelIndex += 1) {
        const maskValue = mask[pixelIndex * 4];
        if (maskValue <= 8) continue;
        indexes[maskedIndex] = pixelIndex;
        alpha[maskedIndex] = maskValue;
        maskedIndex += 1;
      }

      return {
        width: canvas.width,
        height: canvas.height,
        source,
        indexes,
        alpha,
      };
    },
  );

  assetCache.set(subject.id, request);
  return request;
}

export default function IconicColorFrame({ subject, color, original = false, className = "" }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [asset, setAsset] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    loadIconicAsset(subject)
      .then((loadedAsset) => {
        if (active) setAsset(loadedAsset);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [subject]);

  useEffect(() => {
    if (original || !asset || !canvasRef.current) return undefined;
    cancelAnimationFrame(animationRef.current);

    animationRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = asset.width;
      canvas.height = asset.height;
      const output = new Uint8ClampedArray(asset.source.data);

      for (let maskedIndex = 0; maskedIndex < asset.indexes.length; maskedIndex += 1) {
        const pixelIndex = asset.indexes[maskedIndex];
        const dataIndex = pixelIndex * 4;
        const [red, green, blue] = recolorRgbPixel(
          asset.source.data[dataIndex],
          asset.source.data[dataIndex + 1],
          asset.source.data[dataIndex + 2],
          subject.targetHsb,
          color,
        );
        const mix = asset.alpha[maskedIndex] / 255;
        output[dataIndex] = Math.round(red * mix + output[dataIndex] * (1 - mix));
        output[dataIndex + 1] = Math.round(green * mix + output[dataIndex + 1] * (1 - mix));
        output[dataIndex + 2] = Math.round(blue * mix + output[dataIndex + 2] * (1 - mix));
      }

      canvas.getContext("2d").putImageData(
        new ImageData(output, asset.width, asset.height),
        0,
        0,
      );
    });

    return () => cancelAnimationFrame(animationRef.current);
  }, [asset, color, original, subject]);

  const classes = `chroma-iconic-frame ${className}`.trim();
  const style = { "--chroma-iconic-aspect": `${subject.width} / ${subject.height}` };

  if (original) {
    return (
      <div className={classes} style={style}>
        <img src={subject.image} alt={`${subject.name} color reference`} />
      </div>
    );
  }

  return (
    <div className={`${classes}${failed ? " chroma-iconic-frame--failed" : ""}`} style={style}>
      <canvas ref={canvasRef} role="img" aria-label={`${subject.name} with your selected color`} />
      {!asset && !failed && <div className="chroma-iconic-frame__loading">mixing color…</div>}
      {failed && <div className="chroma-iconic-frame__loading">image unavailable</div>}
    </div>
  );
}
