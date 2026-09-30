import { useEffect, useRef, useState } from 'react';
import { Check, Image, X } from 'lucide-react';
import './ImageAdjustDialog.css';

const OUTPUT_SIZE_BY_KIND = {
  banner: { width: 1600, height: 500 },
  avatar: { width: 640, height: 640 },
};

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export default function ImageAdjustDialog({ file, kind, onClose, onSave, isSaving }) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [errorMessage, setErrorMessage] = useState('');
  const imageRef = useRef(null);
  const cropFrameRef = useRef(null);
  const dragStartRef = useRef(null);
  const aspectRatio = kind === 'banner' ? '16 / 5' : '1 / 1';
  const outputSize = OUTPUT_SIZE_BY_KIND[kind] || OUTPUT_SIZE_BY_KIND.avatar;
  const coverScale = imageSize.width && frameSize.width
    ? Math.max(frameSize.width / imageSize.width, frameSize.height / imageSize.height)
    : 0;
  const renderedImageSize = {
    width: imageSize.width * coverScale * zoom,
    height: imageSize.height * coverScale * zoom,
  };
  const maxOffsetX = Math.max(0, (renderedImageSize.width - frameSize.width) / 2);
  const maxOffsetY = Math.max(0, (renderedImageSize.height - frameSize.height) / 2);

  useEffect(() => {
    const frame = cropFrameRef.current;
    if (!frame) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      setFrameSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return undefined;

    const nextUrl = URL.createObjectURL(file);
    image.onload = () => setImageLoaded(true);
    image.onerror = () => setErrorMessage('Não foi possível abrir esta imagem. Escolha outro arquivo.');
    image.src = nextUrl;

    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSaving, onClose]);

  const moveImage = (event) => {
    const start = dragStartRef.current;
    if (!start) return;

    setPosition({
      x: maxOffsetX ? clamp(start.position.x + (event.clientX - start.pointer.x) / maxOffsetX, -1, 1) : 0,
      y: maxOffsetY ? clamp(start.position.y + (event.clientY - start.pointer.y) / maxOffsetY, -1, 1) : 0,
    });
  };

  const finishMove = () => {
    dragStartRef.current = null;
  };

  const handleSave = async () => {
    const image = imageRef.current;
    if (!image || !image.naturalWidth || !image.naturalHeight) return;

    setErrorMessage('');
    const canvas = document.createElement('canvas');
    canvas.width = outputSize.width;
    canvas.height = outputSize.height;
    const context = canvas.getContext('2d');
    if (!context) {
      setErrorMessage('Não foi possível preparar a imagem. Tente outro arquivo.');
      return;
    }

    const coverScale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight) * zoom;
    const drawWidth = image.naturalWidth * coverScale;
    const drawHeight = image.naturalHeight * coverScale;
    const offsetX = (canvas.width - drawWidth) / 2 + position.x * (drawWidth - canvas.width) / 2;
    const offsetY = (canvas.height - drawHeight) / 2 + position.y * (drawHeight - canvas.height) / 2;
    context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setErrorMessage('Não foi possível preparar a imagem. Tente outro arquivo.');
        return;
      }

      const croppedFile = new File([blob], `${file.name.replace(/\.[^.]+$/, '')}-ajustada.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
      const saved = await onSave(croppedFile);
      if (saved === false) setErrorMessage('O envio não foi concluído. Você pode tentar novamente.');
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="image-adjust-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSaving) onClose();
    }}>
      <section className="image-adjust-dialog" role="dialog" aria-modal="true" aria-labelledby="image-adjust-title">
        <header className="image-adjust-dialog__header">
          <div>
            <span className="image-adjust-dialog__eyebrow"><Image size={15} aria-hidden="true" /> Ajuste de imagem</span>
            <h2 id="image-adjust-title">{kind === 'banner' ? 'Ajustar banner' : 'Ajustar foto de perfil'}</h2>
          </div>
          <button className="image-adjust-close" type="button" onClick={onClose} aria-label="Fechar ajuste" disabled={isSaving}>
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <div
          ref={cropFrameRef}
          className={`image-adjust-crop image-adjust-crop--${kind}`}
          style={{ aspectRatio }}
          onPointerDown={(event) => {
            if (!imageLoaded || isSaving) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            dragStartRef.current = {
              pointer: { x: event.clientX, y: event.clientY },
              position,
            };
          }}
          onPointerMove={moveImage}
          onPointerUp={finishMove}
          onPointerCancel={finishMove}
        >
          <img
            ref={imageRef}
            alt="Prévia do enquadramento"
            draggable="false"
            onLoad={(event) => {
              setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight });
              setImageLoaded(true);
            }}
            style={{
              width: `${renderedImageSize.width}px`,
              height: `${renderedImageSize.height}px`,
              left: `calc(50% + ${position.x * maxOffsetX}px)`,
              top: `calc(50% + ${position.y * maxOffsetY}px)`,
            }}
          />
          {!imageLoaded ? <span className="image-adjust-loading">Carregando imagem...</span> : null}
        </div>

        <label className="image-adjust-zoom">
          <span>Zoom</span>
          <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} disabled={!imageLoaded || isSaving} />
          <output>{Math.round(zoom * 100)}%</output>
        </label>
        {errorMessage ? <p className="feedback feedback--danger" role="alert">{errorMessage}</p> : null}

        <footer className="image-adjust-actions">
          <button className="button button--secondary" type="button" onClick={onClose} disabled={isSaving}>Cancelar</button>
          <button className="button button--primary" type="button" onClick={handleSave} disabled={!imageLoaded || isSaving}>
            <Check size={17} aria-hidden="true" />
            {isSaving ? 'Salvando...' : 'Salvar imagem'}
          </button>
        </footer>
      </section>
    </div>
  );
}
