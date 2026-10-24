import React, { useState } from 'react';
import { API_BASE } from '../utils/apiConfig';

interface AIEyewearStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttachToTray?: (imageUrl: string, description: string) => void;
  embedded?: boolean;
}

export const AIEyewearStudioModal: React.FC<AIEyewearStudioModalProps> = ({
  isOpen,
  onClose,
  onAttachToTray,
  embedded = false,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'edit'>('create');
  const [textPrompt, setTextPrompt] = useState(
    'Luxury aviator optical glasses with ultra-thin gold titanium frame, sapphire blue anti-reflective lens coating with subtle studio light reflection, on pure clean white background'
  );
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:3' | '16:9'>('1:1');
  const [editPrompt, setEditPrompt] = useState(
    'Change the lens tint to gradient green polarized sun tint with AR reflex, keeping the gold wire chassis'
  );

  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [caption, setCaption] = useState<string | null>(null);
  const [studioEngine, setStudioEngine] = useState<string>('OptiVision Studio Engine');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setCaption(null);

    try {
      const res = await fetch(`${API_BASE}/api/gemini/image-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textPrompt,
          aspectRatio,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      setCurrentImage(data.imageUrl);
      setCaption(data.caption);
      if (data.model) setStudioEngine(data.model);
    } catch (err: any) {
      setErrorMsg(err.message || 'Image generation error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!currentImage) {
      setErrorMsg('Please generate or upload an image first to edit.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setCaption(null);

    try {
      const res = await fetch(`${API_BASE}/api/gemini/image-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: currentImage,
          prompt: editPrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to edit image');
      }

      setCurrentImage(data.imageUrl);
      setCaption(data.caption);
      if (data.model) setStudioEngine(data.model);
    } catch (err: any) {
      setErrorMsg(err.message || 'Image edit error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCurrentImage(event.target?.result as string);
        setActiveTab('edit');
      };
      reader.readAsDataURL(file);
    }
  };

  const promptPresets = [
    {
      title: 'Ray-Ban Aviator Gold + Crizal',
      prompt: 'Classic gold wireframe teardrop aviator spectacles with crystal clear lenses showing gentle violet anti-blue light coating reflections, luxury product shot',
    },
    {
      title: 'Silhouette Rimless Titanium',
      prompt: 'Ultra-minimalist screwless rimless titanium eyeglasses, polished beveled lens edges with high index transparency, architectural lighting',
    },
    {
      title: 'Gucci Round Havana Acetate',
      prompt: 'Thick vintage tortoiseshell round acetate frames with deep green gradient sun lenses, high-end Italian craftsmanship display',
    },
    {
      title: 'Polarized Sport Sunglasses',
      prompt: 'Matte black aerodynamic TR90 sports sunglasses with fiery red-orange iridium mirror polarized lenses, water droplets on lens surface',
    },
  ];

  const content = (
    <div className={`bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl w-full ${embedded ? 'shadow-sm max-w-none' : 'max-w-4xl max-h-[92vh]'} flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150`}>
      {/* Header */}
      <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[24px]">auto_fix_high</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-headline-sm font-bold text-on-surface">
                Virtual Eyewear &amp; Coating Studio
              </h2>
              <span className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed rounded-full text-[10px] font-bold font-data-rx uppercase">
                gemini-3.1-flash-image-preview
              </span>
            </div>
            <p className="text-[12px] text-outline">
              Create &amp; edit realistic frames, tint gradients, and AR anti-reflective coating previews via text prompts
            </p>
          </div>
        </div>
        {embedded ? (
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Back to Conveyor</span>
          </button>
        ) : (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}
      </div>

        {/* Tab switcher */}
        <div className="px-6 pt-3 border-b border-outline-variant/60 flex items-center gap-4 bg-surface-container-low/40">
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 text-label-md font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'create'
                ? 'border-primary text-primary'
                : 'border-transparent text-outline hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
            <span>Create Frame from Text</span>
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`pb-2.5 text-label-md font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'edit'
                ? 'border-primary text-primary'
                : 'border-transparent text-outline hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span>Edit Eyewear / Tints with Prompt</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Config Panel (5 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {activeTab === 'create' ? (
              <>
                {/* Prompt Presets */}
                <div>
                  <label className="text-[11px] font-semibold text-outline block mb-1.5">
                    Quick Frame Inspiration:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {promptPresets.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => setTextPrompt(p.prompt)}
                        className="px-2.5 py-1 text-[11px] rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant font-medium cursor-pointer"
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Prompt */}
                <div>
                  <label className="text-[11px] font-semibold text-outline block mb-1">
                    Describe Eyewear / Frame &amp; Lens Specifications:
                  </label>
                  <textarea
                    rows={4}
                    value={textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                    placeholder="e.g. Vintage round tortoiseshell frame with Crizal sapphire blue anti-reflective reflection..."
                    className="w-full p-3 text-[12px] bg-surface-container-low border border-outline-variant rounded-xl text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Aspect ratio */}
                <div>
                  <label className="text-[11px] font-semibold text-outline block mb-1">
                    Aspect Ratio:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['1:1', '4:3', '16:9'] as const).map((ar) => (
                      <button
                        key={ar}
                        onClick={() => setAspectRatio(ar)}
                        className={`py-1.5 text-center text-[12px] font-semibold rounded-lg border transition-all cursor-pointer ${
                          aspectRatio === ar
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-surface-container text-on-surface-variant border-outline-variant'
                        }`}
                      >
                        {ar} {ar === '1:1' ? '(Square)' : ar === '4:3' ? '(Catalog)' : '(Widescreen)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  disabled={isLoading || !textPrompt.trim()}
                  onClick={handleGenerate}
                  className="w-full py-2.5 bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 rounded-xl text-label-md font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer mt-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Generating with gemini-3.1-flash-image-preview...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">brush</span>
                      <span>Generate Eyewear Render</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="text-[11px] font-semibold text-outline block mb-1.5">
                    Source Image for Editing:
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-lg text-[12px] font-semibold text-on-surface cursor-pointer flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">upload</span>
                      <span>Upload Frame Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-outline">or use the generated image on the right</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-outline block mb-1">
                    Edit Instructions (Prompt):
                  </label>
                  <textarea
                    rows={4}
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="e.g. Change the lenses to gradient brown transition lenses, or change rim to matte rose gold..."
                    className="w-full p-3 text-[12px] bg-surface-container-low border border-outline-variant rounded-xl text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <button
                  disabled={isLoading || !currentImage || !editPrompt.trim()}
                  onClick={handleEdit}
                  className="w-full py-2.5 bg-secondary text-on-secondary hover:bg-secondary/90 disabled:opacity-50 rounded-xl text-label-md font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer mt-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Editing Eyewear Image...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">auto_fix_normal</span>
                      <span>Apply Image Edit Prompt</span>
                    </>
                  )}
                </button>
              </>
            )}

            {errorMsg && (
              <div className="p-3 bg-tertiary-fixed text-on-tertiary-fixed-variant rounded-lg border border-tertiary/20 text-[12px]">
                <strong>Error:</strong> {errorMsg}
              </div>
            )}
          </div>

          {/* Right Image Canvas (6 cols) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center bg-surface-container-low/60 border border-outline-variant/70 rounded-2xl p-4 min-h-[360px] relative">
            {currentImage ? (
              <div className="w-full flex flex-col items-center gap-3">
                <div className="flex items-center justify-between w-full px-1">
                  <span className="text-[11px] font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-secondary">visibility</span>
                    Optical Eyewear Simulation
                  </span>
                  <span className="text-[10px] font-data-rx bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded-full font-bold">
                    {studioEngine}
                  </span>
                </div>
                <div className="relative max-h-[380px] w-full flex items-center justify-center bg-black/5 rounded-xl overflow-hidden shadow-inner">
                  <img
                    src={currentImage}
                    alt="Generated Eyewear"
                    referrerPolicy="no-referrer"
                    className="max-h-[380px] object-contain rounded-lg"
                  />
                  {isLoading && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white backdrop-blur-xs">
                      <span className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin mb-2"></span>
                      <span className="text-xs font-semibold">Regenerating image...</span>
                    </div>
                  )}
                </div>

                {caption && (
                  <p className="text-[11px] text-outline text-center italic">{caption}</p>
                )}

                <div className="flex items-center gap-2 w-full">
                  <a
                    href={currentImage}
                    download="optivision-eyewear-render.png"
                    className="flex-1 py-1.5 px-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-lg text-[12px] font-semibold text-on-surface text-center flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>Download Image</span>
                  </a>

                  {onAttachToTray && (
                    <button
                      onClick={() => onAttachToTray(currentImage, textPrompt)}
                      className="flex-1 py-1.5 px-3 bg-primary text-on-primary rounded-lg text-[12px] font-semibold text-center flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">attachment</span>
                      <span>Attach to Lab Tray</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 text-outline">
                <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-3 text-outline">
                  <span className="material-symbols-outlined text-[36px]">eyeglasses</span>
                </div>
                <h3 className="text-headline-sm font-bold text-on-surface mb-1">
                  Virtual Eyewear Render
                </h3>
                <p className="text-[12px] max-w-sm">
                  Use the text prompt on the left to synthesize high-definition optical frame renders, customized lens tints, and anti-reflective coatings.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
      {content}
    </div>
  );
};
