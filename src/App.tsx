import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Plus, ZoomIn, ZoomOut, Undo, Redo, Share, 
  PenTool, Move, MousePointer2, Brush, Eraser, Layers,
  ChevronUp, ChevronDown, Sparkles, MessageCircleQuestion,
  ToggleLeft, ToggleRight, Grid, Maximize, RotateCcw, Palette,
  Eye, EyeOff, Trash2, PaintBucket
} from 'lucide-react';

const BooleanIcon = ({ size = 24, strokeWidth = 2, className = '' }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="9" cy="9" r="5" />
    <circle cx="15" cy="15" r="5" />
  </svg>
);

const SkewTab = ({ label, active, onClick, onClose }: any) => (
  <div onClick={onClick} className="relative group cursor-pointer px-[14px] min-w-[70px] h-[36px] flex items-center justify-center">
    <div className={`absolute inset-0 transform -skew-x-[25deg] rounded-[6px] shadow-[inset_0_1px_2px_rgba(255,255,255,0.5),0_2px_4px_rgba(0,0,0,0.15)] ${active ? 'bg-gradient-to-b from-[#2FDFDF] to-[#1AB7C7] border-[1px] border-[#8AEEEE]' : 'bg-gradient-to-b from-[#18C3D8] to-[#129EA8] border-[1px] border-[#5AE1F2]/60 group-hover:from-[#2FDFDF] group-hover:to-[#1AB7C7]'} transition-all`}></div>
    <span className="relative z-10 font-[800] text-white text-[15px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] whitespace-nowrap pl-2 pr-4">{label}</span>
    {onClose && (
      <div 
        onClick={onClose} 
        className="absolute right-[12px] z-20 w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/10 rounded-full"
      >
        <span className="text-white text-[12px] font-bold leading-none mb-[2px]">&times;</span>
      </div>
    )}
  </div>
);

const UtilityBtn = ({ icon: Icon, onClick }: { icon: any, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className="w-[42px] h-[42px] bg-[#0A7AFF] hover:bg-[#348CFF] text-white rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(10,122,255,0.4)] transition-transform hover:scale-105 active:scale-95"
  >
    <Icon size={20} strokeWidth={2.5} />
  </button>
);

const PanelShell = ({ children, activeType }: { children: React.ReactNode, activeType: 'color' | 'export' | 'layers' }) => {
  const [size, setSize] = useState({ w: 280, h: activeType === 'export' || activeType === 'layers' ? 460 : 360 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setSize({
          w: entry.borderBoxSize?.[0]?.inlineSize || entry.contentRect.width,
          h: entry.borderBoxSize?.[0]?.blockSize || entry.contentRect.height
        });
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [activeType]);

  const { w, h } = size;
  const safeW = Math.max(w, 50);
  const safeH = Math.max(h, 50);
  
  // Inset path by 2px on all sides so the 4px stroke fits exactly inside without overflowing, mimicking standard CSS borders
  const path = `M 46 2 L ${safeW-10} 2 Q ${safeW-2} 2 ${safeW-2} 12 L ${safeW-2} ${safeH-10} Q ${safeW-2} ${safeH-2} ${safeW-10} ${safeH-2} L 12 ${safeH-2} Q 2 ${safeH-2} 2 ${safeH-10} L 2 46 Q 2 36 8 30 L 30 8 Q 36 2 46 2 Z`;

  return (
    <div ref={ref} className="relative w-[280px] h-auto text-left rounded-3xl" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>
      <svg width={safeW} height={safeH} className="absolute inset-0 z-0 pointer-events-none" style={{ overflow: 'visible' }}>
        <path d={path} fill="#586071" />
        <path d={path} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
      </svg>
      <div className="relative z-10 w-full h-full p-6 pb-[32px]">
        {children}
      </div>
    </div>
  );
};

const hexToRgbArr_ = (hex: string) => {
  let hl = hex.replace('#', '');
  if (hl.length === 3) hl = hl.split('').map(c => c + c).join('');
  const num = parseInt(hl, 16);
  if (isNaN(num)) return [0,0,0];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

const hexToHsl_ = (hex: string) => {
  let [r, g, b] = hexToRgbArr_(hex);
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const hslToHex_ = (h: number, s: number, l: number) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
};

const ColorPanelContent = ({ brushSettings, setBrushSettings }: any) => {
  const [hsl, setHsl] = useState(() => hexToHsl_(brushSettings?.color || '#4F6EE5'));
  const [hexInput, setHexInput] = useState(brushSettings?.color || '#4F6EE5');

  useEffect(() => {
    const color = brushSettings?.color || '#4F6EE5';
    if (color !== hexInput && color.toUpperCase() === hslToHex_(hsl.h, hsl.s, hsl.l)) {
      // Ignore identical translation
    } else if (color.toUpperCase() !== hslToHex_(hsl.h, hsl.s, hsl.l)) {
      const newHsl = hexToHsl_(color);
      setHsl(newHsl);
      setHexInput(color.toUpperCase());
    }
  }, [brushSettings?.color]);

  const updateHsl = (newHsl: any) => {
    setHsl(newHsl);
    const newHex = hslToHex_(newHsl.h, newHsl.s, newHsl.l);
    setHexInput(newHex);
    setBrushSettings({ ...brushSettings, color: newHex });
  };

  const handleHexChange = (e: any) => {
    const val = e.target.value;
    setHexInput(val);
    let normalized = val.trim();
    if (!normalized.startsWith('#')) normalized = '#' + normalized;
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(normalized)) {
      const newHsl = hexToHsl_(normalized);
      setHsl(newHsl);
      setBrushSettings({ ...brushSettings, color: normalized.toUpperCase() });
    }
  };

  const handlePointer = (e: React.PointerEvent<HTMLDivElement>, type: 'h'|'s'|'l') => {
    const rect = e.currentTarget.getBoundingClientRect();
    let currX = e.clientX - rect.left;
    currX = Math.max(0, Math.min(currX, rect.width));
    const pct = currX / rect.width;
    let newHsl = { ...hsl };
    if (type === 'h') newHsl.h = Math.round(pct * 360);
    if (type === 's') newHsl.s = Math.round(pct * 100);
    if (type === 'l') newHsl.l = Math.round(pct * 100);
    updateHsl(newHsl);
  };

  const handleBlockPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    x = Math.max(0, Math.min(x, rect.width));
    y = Math.max(0, Math.min(y, rect.height));
    const s = Math.round((x / rect.width) * 100);
    const l = Math.round((1 - y / rect.height) * 100);
    updateHsl({ ...hsl, s, l });
  };

  const presets = ['#FF5252', '#FF9800', '#FFEB3B', '#4CAF50', '#00BCD4', '#03A9F4', '#4F6EE5', '#E91E63', '#9C27B0', '#673AB7', '#009688', '#8BC34A', '#CDDC39', '#5C6BC0'];

  return (
    <div className="flex flex-col gap-4 relative z-20">
      <div 
        className="relative w-[232px] h-[140px] shrink-0 cursor-crosshair group touch-none mx-auto"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); handleBlockPointer(e); }}
        onPointerMove={(e) => { if (e.buttons > 0) handleBlockPointer(e); }}
      >
        <div 
          className="absolute inset-0"
          style={{ clipPath: 'url(#innerClip)', backgroundColor: `hsl(${hsl.h}, 100%, 50%)` }}
        />
        <div 
          className="absolute inset-0"
          style={{ clipPath: 'url(#innerClip)', background: 'linear-gradient(to top, #000 0%, transparent 50%, #fff 100%)', opacity: 0.8 }}
        />
        <div 
          className="absolute inset-0"
          style={{ clipPath: 'url(#innerClip)', background: `linear-gradient(to right, #808080 0%, transparent 100%)`, opacity: 0.5 }}
        />
        <div 
          className="absolute w-[18px] h-[18px] rounded-full shadow-md border-[2.5px] border-white pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
          style={{ 
             left: `${hsl.s}%`, 
             top: `${100 - hsl.l}%`, 
             backgroundColor: hslToHex_(hsl.h, hsl.s, hsl.l) 
          }}
        />
        <svg width="232" height="140" className="absolute inset-0 pointer-events-none">
           <path d="M 32 0 L 224 0 Q 232 0 232 8 L 232 132 Q 232 140 224 140 L 8 140 Q 0 140 0 132 L 0 32 Q 0 24 6 18 L 18 6 Q 24 0 32 0 Z" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
        </svg>
      </div>

      <div className="flex flex-col gap-3 px-1">
        {/* Hue Slider */}
        <div 
          className="h-[12px] rounded-full relative cursor-pointer border border-black/20 shadow-inner touch-none" 
          style={{ background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); handlePointer(e, 'h'); }}
          onPointerMove={(e) => { if (e.buttons > 0) handlePointer(e, 'h'); }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 w-[18px] h-[18px] bg-white rounded-full shadow-md border-[2px] border-gray-300 transform" style={{ left: `calc(${hsl.h / 360 * 100}% - 9px)` }} />
        </div>
        
        {/* Saturation Slider */}
        <div 
          className="h-[12px] rounded-full relative cursor-pointer border border-black/20 shadow-inner touch-none" 
          style={{ background: `linear-gradient(to right, hsl(${hsl.h}, 0%, ${hsl.l}%), hsl(${hsl.h}, 100%, ${hsl.l}%))` }}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); handlePointer(e, 's'); }}
          onPointerMove={(e) => { if (e.buttons > 0) handlePointer(e, 's'); }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 w-[18px] h-[18px] bg-white rounded-full shadow-md border-[2px] border-gray-300 transform" style={{ left: `calc(${hsl.s}% - 9px)` }} />
        </div>

        {/* Lightness Slider */}
        <div 
          className="h-[12px] rounded-full relative cursor-pointer border border-black/20 shadow-inner touch-none" 
          style={{ background: `linear-gradient(to right, #000 0%, hsl(${hsl.h}, ${hsl.s}%, 50%) 50%, #fff 100%)` }}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); handlePointer(e, 'l'); }}
          onPointerMove={(e) => { if (e.buttons > 0) handlePointer(e, 'l'); }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 w-[18px] h-[18px] bg-white rounded-full shadow-md border-[2px] border-gray-300 transform" style={{ left: `calc(${hsl.l}% - 9px)` }} />
        </div>
      </div>
      
      <div className="flex gap-3 text-[12px] font-bold px-1 items-center mt-1">
        <label className="text-white/60 tracking-widest uppercase text-[10px]">Hex</label>
        <input 
          type="text" 
          value={hexInput}
          onChange={handleHexChange}
          className="bg-white/10 flex-1 text-white px-3 py-2 rounded-md font-mono shadow-inner border border-white/5 text-center outline-none ring-0 focus:border-[#4F6EE5] focus:bg-white/15 transition-all text-[12px]"
        />
      </div>

      <div className="mt-1 px-1">
        <div className="text-[10px] uppercase tracking-widest text-white/50 mb-3 font-extrabold text-left">Saved Colors</div>
        <div className="grid grid-cols-7 gap-2.5">
          {presets.map((c, i) => (
            <div 
              key={i} 
              onClick={() => {
                const newHsl = hexToHsl_(c);
                setHsl(newHsl);
                setHexInput(c.toUpperCase());
                setBrushSettings({ ...brushSettings, color: c.toUpperCase() });
              }}
              className={`w-[18px] h-[18px] rounded-full shadow-md hover:scale-110 cursor-pointer border transition-transform ${brushSettings?.color?.toUpperCase() === c.toUpperCase() ? 'border-white scale-110' : 'border-white/20'}`} 
              style={{ backgroundColor: c }} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const CanvasSettingsPopover = ({ size, onChange, onClose }: any) => {
  return (
    <div className="absolute top-[32px] left-1/2 -translate-x-1/2 mt-2 w-[240px] bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.2)] border border-gray-100 z-50 p-6 text-[12px] font-sans text-gray-800 overflow-hidden" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-5">
        <div className="font-extrabold text-[14px] tracking-wide text-gray-900">Canvas Size</div>
        <div className="w-6 h-6 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-800 transition-colors bg-gray-50" onClick={onClose}>
           <span className="text-[16px] font-medium leading-none">&times;</span>
        </div>
      </div>
      <div className="flex flex-col gap-4 font-semibold text-gray-600">
        <div className="flex items-center justify-between gap-3">
          <span className="shrink-0 text-gray-500 tracking-wide">Width (px)</span>
          <input type="number" value={size.width} onChange={e => onChange({ ...size, width: parseInt(e.target.value) || 1 })} className="w-[84px] text-right font-bold text-gray-800 outline-none border border-gray-200/80 rounded-lg px-2.5 py-1.5 bg-gray-50 hover:border-blue-400 focus:border-blue-500 focus:bg-white transition-all shadow-inner" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="shrink-0 text-gray-500 tracking-wide">Height (px)</span>
          <input type="number" value={size.height} onChange={e => onChange({ ...size, height: parseInt(e.target.value) || 1 })} className="w-[84px] text-right font-bold text-gray-800 outline-none border border-gray-200/80 rounded-lg px-2.5 py-1.5 bg-gray-50 hover:border-blue-400 focus:border-blue-500 focus:bg-white transition-all shadow-inner" />
        </div>
        <div className="h-[1px] w-full bg-gray-100 my-1" />
        <div className="flex items-center justify-between gap-3">
          <span className="shrink-0 text-gray-500 tracking-wide">Resolution</span>
          <div className="w-[84px] flex items-center border border-gray-200/80 rounded-lg bg-gray-50 hover:border-blue-400 focus:border-blue-500 focus:bg-white transition-all overflow-hidden shadow-inner">
             <input type="number" value={size.ppi} onChange={e => onChange({ ...size, ppi: parseInt(e.target.value) || 1 })} className="w-full h-full text-right font-bold text-gray-800 outline-none bg-transparent px-2.5 py-1.5" />
          </div>
        </div>
      </div>
    </div>
  );
};

const RatioSettingsPopover = ({ onChange, onClose }: any) => {
  const presets = [
    { label: '9:16 (1080 x 1920)', w: 1080, h: 1920 },
    { label: '16:9 (1920 x 1080)', w: 1920, h: 1080 },
    { label: '1:1 (1080 x 1080)', w: 1080, h: 1080 },
    { label: '4:3 (1440 x 1080)', w: 1440, h: 1080 },
  ];
  return (
    <div className="absolute top-[32px] left-1/2 -translate-x-1/2 mt-2 w-[160px] bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-gray-200 z-50 p-2 text-[11px] font-sans text-gray-800" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-2 px-2 pt-1 relative">
         <div className="font-bold">Ratio Presets</div>
         <div className="w-5 h-5 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900 absolute right-0 -top-1" onClick={onClose}>&times;</div>
      </div>
      <div className="flex flex-col gap-1">
        {presets.map(p => (
           <div 
             key={p.label}
             className="px-2 py-1.5 hover:bg-blue-50 hover:text-blue-600 rounded cursor-pointer transition-colors"
             onClick={() => { onChange({ width: p.w, height: p.h, ppi: 72 }); onClose(); }}
           >
             {p.label}
           </div>
        ))}
      </div>
    </div>
  );
};

const GridSettingsPopover = ({ settings, onChange, onClose }: any) => {
  return (
    <div className="absolute top-[32px] left-1/2 -translate-x-1/2 mt-2 w-[240px] bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-gray-200 z-50 p-4 text-[11px] font-sans text-gray-800" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-4">
        <select 
          className="font-bold outline-none cursor-pointer bg-transparent"
          value={settings.type} 
          onChange={e => onChange({ ...settings, type: e.target.value })}
        >
          <option value="Grid">Grid</option>
          <option value="Columns">Columns</option>
          <option value="Rows">Rows</option>
        </select>
        <div className="w-5 h-5 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900" onClick={onClose}>&times;</div>
      </div>

      <div className="flex flex-col gap-3 font-semibold text-gray-600">
        {settings.type === 'Grid' ? (
          <>
            <div className="flex items-center gap-2">
              <span className="w-10">Size</span>
              <input type="number" value={settings.size} onChange={e => onChange({ ...settings, size: parseInt(e.target.value) || 0 })} className="flex-1 outline-none border border-gray-200 rounded px-2 py-1 bg-white hover:border-gray-300 focus:border-blue-500" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-10">Color</span>
              <div className="flex-1 flex gap-1">
                <input type="text" value={settings.color} onChange={e => onChange({ ...settings, color: e.target.value })} className="w-14 outline-none border border-gray-200 rounded px-1.5 py-1 bg-white hover:border-gray-300 focus:border-blue-500 uppercase tracking-widest text-[9.5px]" />
                <div className="flex items-center border border-gray-200 rounded px-1 bg-white hover:border-gray-300 focus:border-blue-500 w-[42px]"><input type="number" value={settings.opacity} onChange={e => onChange({ ...settings, opacity: parseInt(e.target.value) || 0 })} className="w-full h-full outline-none bg-transparent text-right pr-0.5 mt-[1px]" />%</div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="w-12">Count</span>
              <input type="number" value={settings.count} onChange={e => onChange({ ...settings, count: parseInt(e.target.value) || 0 })} className="flex-1 outline-none border border-gray-200 rounded px-2 py-1 bg-white hover:border-gray-300 focus:border-blue-500" />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="w-12">Color</span>
              <div className="flex-1 flex gap-1">
                <input type="text" value={settings.color} onChange={e => onChange({ ...settings, color: e.target.value })} className="w-14 outline-none border border-gray-200 rounded px-1.5 py-1 bg-white hover:border-gray-300 focus:border-blue-500 uppercase tracking-widest text-[9.5px]" />
                <div className="flex items-center border border-gray-200 rounded px-1 bg-white hover:border-gray-300 focus:border-blue-500 w-[42px]"><input type="number" value={settings.opacity} onChange={e => onChange({ ...settings, opacity: parseInt(e.target.value) || 0 })} className="w-full h-full outline-none bg-transparent text-right pr-0.5 mt-[1px]" />%</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-12">Type</span>
              <select className="flex-1 outline-none border border-gray-200 rounded px-2 py-1 bg-white hover:border-gray-300 cursor-pointer" value={settings.layoutType} onChange={e => onChange({ ...settings, layoutType: e.target.value })}>
                <option value="Stretch">Stretch</option>
                <option value="Center">Center</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="w-12">{settings.type === 'Columns' ? 'Width' : 'Height'}</span>
              <input type="text" value={settings.width} onChange={e => onChange({ ...settings, width: e.target.value === 'Auto' ? 'Auto' : (parseInt(e.target.value) || 0) })} className="flex-1 outline-none border border-gray-200 rounded px-2 py-1 bg-white hover:border-gray-300 focus:border-blue-500" />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="w-12">Margin</span>
              <input type="number" value={settings.margin} onChange={e => onChange({ ...settings, margin: parseInt(e.target.value) || 0 })} className="flex-1 outline-none border border-gray-200 rounded px-2 py-1 bg-white hover:border-gray-300 focus:border-blue-500" />
            </div>

            <div className="flex items-center gap-2">
              <span className="w-12">Gutter</span>
              <input type="number" value={settings.gutter} onChange={e => onChange({ ...settings, gutter: parseInt(e.target.value) || 0 })} className="flex-1 outline-none border border-gray-200 rounded px-2 py-1 bg-white hover:border-gray-300 focus:border-blue-500" />
            </div>
          </>
        )}
        <button 
          className="w-full mt-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg border border-red-200 transition-colors" 
          onClick={() => { onChange({ ...settings, turnedOff: true }); onClose(); }}
        >
          Remove Grid
        </button>
      </div>
    </div>
  );
};

const ExportPanelContent = ({ onExport, previewDataUrl }: any) => {
  const [format, setFormat] = useState('PNG');
  const formats = ['PNG', 'JPEG', 'SVG', 'Project (.json)'];

  return (
    <div className="flex flex-col gap-5 relative z-20">
      <div className="relative w-[232px] h-[140px] shrink-0">
        <div 
          className="absolute inset-0 bg-[#C9CCD3] flex items-center justify-center text-[#586071] font-extrabold tracking-wide overflow-hidden"
          style={{ clipPath: 'url(#innerClip)' }}
        >
          {previewDataUrl ? (
            <img 
              src={previewDataUrl} 
              alt="Preview" 
              className="w-full h-full object-contain rounded-xl"
              style={{
                backgroundColor: '#ffffff',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 16 16\'%3E%3Cpath fill=\'#e5e7eb\' d=\'M0 0h8v8H0zm8 8h8v8H8z\'/%3E%3C/svg%3E")'
              }}
            />
          ) : (
            <span>Preview</span>
          )}
        </div>
        <svg width="232" height="140" className="absolute inset-0 pointer-events-none">
          <path d="M 32 0 L 224 0 Q 232 0 232 8 L 232 132 Q 232 140 224 140 L 8 140 Q 0 140 0 132 L 0 32 Q 0 24 6 18 L 18 6 Q 24 0 32 0 Z" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
        </svg>
      </div>
      <div className="px-1 text-white">
        <div className="font-extrabold text-[14px] mb-4 text-[#D2D4D9]">Paramètres d'exportation</div>
        <div className="flex flex-col gap-3 text-[12.5px] font-bold text-white/90 mb-5">
          <label className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-[18px] h-[18px] rounded-full border-2 border-white/50 flex items-center justify-center bg-white shadow-sm">
              <div className="w-[8px] h-[8px] rounded-full bg-[#586071]" />
            </div>
            Qualité max
          </label>
        </div>
        <div className="text-[10.5px] text-white/50 mb-5 leading-relaxed font-bold bg-black/10 p-3 rounded-lg border border-white/5">
          Output : Users/Documents/<br/>Projet/Export
        </div>
        <div className="relative bg-white/10 hover:bg-white/15 border border-white/5 text-white rounded-lg px-4 py-3 text-[12.5px] font-bold flex cursor-pointer items-center justify-between shadow-inner mb-5 transition-colors">
          <select 
            value={format} 
            onChange={e => setFormat(e.target.value)} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          >
            {formats.map(f => (
              <option key={f} value={f} className="text-black">{f}</option>
            ))}
          </select>
          <span className="pointer-events-none">{format}</span>
          <ChevronDown size={16} className="text-white/60 pointer-events-none" />
        </div>
        <button onClick={() => onExport(format)} className="w-full bg-[#4A5162] hover:bg-[#343a46] border border-white/10 py-3.5 rounded-lg flex items-center justify-center gap-2 text-[13px] font-extrabold shadow-md transition-transform hover:scale-[1.02] active:scale-95 text-white">
          <Share size={16} strokeWidth={2} /> Exporter
        </button>
      </div>
    </div>
  );
};

const CustomSlider = ({ value, min, max, onChange, onChangeEnd }: any) => {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const thumbLeft = pct * (124 - 18); 
  const ref = useRef<HTMLDivElement>(null);

  const handlePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    let currX = e.clientX - rect.left;
    currX = Math.max(0, Math.min(currX, rect.width));
    const newPct = currX / rect.width;
    onChange(Math.round(min + (max - min) * newPct));
  };

  return (
    <div 
      ref={ref}
      className="w-[124px] h-[8px] bg-[#B2D843] rounded-full relative shadow-inner border border-black/5 cursor-pointer"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        handlePointer(e);
      }}
      onPointerMove={(e) => {
        if (e.buttons > 0) handlePointer(e);
      }}
      onPointerUp={(e) => {
        e.currentTarget.releasePointerCapture(e.pointerId);
        if (onChangeEnd) onChangeEnd();
      }}
    >
      <div 
        className="absolute top-1/2 -translate-y-1/2 w-[18px] h-[18px] bg-[#0A7AFF] rounded-full shadow-md border-[2.5px] border-white cursor-grab hover:scale-110 active:scale-95 transition-transform" 
        style={{ left: `${thumbLeft}px` }}
      />
    </div>
  );
};

const LayersPanelContent = ({ layers, setLayers, activeLayerId, setActiveLayerId, selectedLayerIds, setSelectedLayerIds }: any) => {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === dropIndex) return;

    const newLayers = [...layers];
    const draggedItem = newLayers.splice(draggedIdx, 1)[0];
    newLayers.splice(dropIndex, 0, draggedItem);
    setLayers([...newLayers], true);
    setDraggedIdx(null);
  };

  return (
    <div className="flex flex-col gap-3 relative z-20 h-[390px] text-white">
      <div className="font-extrabold text-[14px] mb-2 text-[#D2D4D9]">Layers</div>
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
        {layers.map((layer: any, i: number) => {
          const isSelected = selectedLayerIds?.includes(layer.id) || activeLayerId === layer.id;
          return (
          <div 
            key={layer.id} 
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, i)}
            onClick={(e) => {
               if (e.shiftKey || e.ctrlKey || e.metaKey) {
                 setSelectedLayerIds((prev: string[]) => prev.includes(layer.id) ? prev.filter(id => id !== layer.id) : [...prev, layer.id]);
                 setActiveLayerId(layer.id);
               } else {
                 setSelectedLayerIds([layer.id]);
                 setActiveLayerId(layer.id);
               }
            }}
            className={`flex items-center justify-between p-2 rounded-lg border transition-colors cursor-pointer ${
              isSelected 
                ? 'bg-[#3A3F4C] border-[#0A7AFF]/50' 
                : 'bg-black/10 hover:bg-black/20 border-white/5'
            } ${draggedIdx === i ? 'opacity-50' : 'opacity-100'}`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-[12px] h-[12px] rounded-full shadow-inner ${isSelected ? 'bg-[#0A7AFF]' : 'bg-[#64748B]'}`} />
              <span className="text-[12px] font-bold text-white/90 truncate max-w-[100px]">{layer.name}</span>
            </div>
            <div className="flex gap-3 text-white/60 items-center">
              <div className="hover:text-white cursor-pointer transition-colors" onClick={(e) => {
                e.stopPropagation();
                const newLayers = [...layers];
                newLayers[i].visible = !newLayers[i].visible;
                setLayers(newLayers);
              }}>
                {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </div>
              <div className="hover:text-red-400 cursor-pointer transition-colors" onClick={(e) => {
                e.stopPropagation();
                setLayers((prev: any) => {
                  const updated = prev.filter((l:any) => l.id !== layer.id);
                  if (activeLayerId === layer.id) setActiveLayerId(updated[0]?.id || null);
                  return updated;
                }, true);
              }}>
                <Trash2 size={14} />
              </div>
            </div>
          </div>
          );
        })}
        {layers.length === 0 && (
          <div className="text-[11px] text-white/40 italic text-center mt-4 font-medium">Draw to auto-create layer.</div>
        )}
      </div>
      <button 
        onClick={() => {
          const id = Date.now().toString();
          setLayers([...layers, { id, name: `Layer ${layers.length + 1}`, type: 'vector', elements: [], visible: true, locked: false }]);
          setActiveLayerId(id);
        }}
        className="mt-2 w-full bg-[#4A5162] hover:bg-[#343a46] border border-white/10 py-2.5 rounded-lg flex items-center justify-center gap-2 text-[12px] font-extrabold shadow-md transition-transform active:scale-95 text-white"
      >
        <Plus size={14} /> New Layer
      </button>
    </div>
  );
};

export default function App() {
  type ToolType = 'pen' | 'select' | 'bucket' | 'gradient' | 'boolean' | 'brush' | 'eraser';
  interface LayerData { id: string; name: string; type: 'vector' | 'pixel'; elements: any[]; visible: boolean; locked: boolean; opacity?: number; }

  // --- CORE APP STATE ---
  const [appMode, setAppMode] = useState<'vector' | 'pixel'>('pixel');
  const [activeTool, setActiveTool] = useState<ToolType>('pen');

  const handleModeSwitch = (mode: 'vector' | 'pixel') => {
    setAppMode(mode);
    if (mode === 'vector') {
      setActiveTool('pen');
    } else {
      setActiveTool('brush');
    }
  };

  const handleToolSelect = (toolId: ToolType) => {
    setActiveTool(toolId);
    if (toolId === 'pen') {
      setAppMode('vector');
    } else if (toolId === 'brush' || toolId === 'eraser' || toolId === 'bucket' || toolId === 'gradient') {
      setAppMode('pixel');
    }
  };
  interface GridSettings {
    type: 'Grid' | 'Columns' | 'Rows';
    size: number;
    count: number;
    color: string;
    opacity: number;
    layoutType: 'Stretch' | 'Center';
    width: number | 'Auto';
    margin: number;
    gutter: number;
  }

  interface WorkspaceData {
    id: string;
    name: string;
    layers: LayerData[];
    pastHistory: LayerData[][];
    futureHistory: LayerData[][];
    gridSettings: GridSettings;
    isAutoGridActive: boolean;
    isCustomGridActive: boolean;
    canvasSize: { width: number, height: number, ppi: number };
  }

  const defaultGridSettings: GridSettings = {
    type: 'Grid',
    size: 10,
    count: 5,
    color: '#FF0000',
    opacity: 10,
    layoutType: 'Stretch',
    width: 'Auto',
    margin: 0,
    gutter: 20
  };

  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([{
    id: '1',
    name: 'Tab 1',
    layers: [],
    pastHistory: [],
    futureHistory: [],
    gridSettings: { ...defaultGridSettings },
    isAutoGridActive: false,
    isCustomGridActive: false,
    canvasSize: { width: 1080, height: 720, ppi: 72 }
  }]);
  
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('1');

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];
  const layers = activeWorkspace.layers;
  const pastHistory = activeWorkspace.pastHistory;
  const futureHistory = activeWorkspace.futureHistory;
  const gridSettings = activeWorkspace.gridSettings;
  const isAutoGrid = activeWorkspace.isAutoGridActive;
  const isCustomGridActive = activeWorkspace.isCustomGridActive;
  const canvasSize = activeWorkspace.canvasSize;

  const updateActiveWorkspace = (updates: Partial<WorkspaceData>) => {
      setWorkspaces(prev => prev.map(ws => ws.id === activeWorkspaceId ? { ...ws, ...updates } : ws));
  };

  const setGridSettings = (valOrUpdater: any) => {
      setWorkspaces(prevWS => prevWS.map(ws => {
          if (ws.id === activeWorkspaceId) {
              const nextGrid = typeof valOrUpdater === 'function' ? valOrUpdater(ws.gridSettings) : valOrUpdater;
              if (nextGrid.turnedOff) {
                  const cleanedGrid = { ...nextGrid };
                  delete cleanedGrid.turnedOff;
                  return { ...ws, gridSettings: cleanedGrid, isCustomGridActive: false };
              }
              return { ...ws, gridSettings: nextGrid, isCustomGridActive: true };
          }
          return ws;
      }));
  };

  const historySnapshotRef = useRef<LayerData[] | null>(null);

  const saveHistorySnapshot = () => {
      historySnapshotRef.current = JSON.parse(JSON.stringify(layers));
  };

  const commitHistorySnapshot = () => {
      if (historySnapshotRef.current) {
          const prevStr = JSON.stringify(historySnapshotRef.current);
          const currStr = JSON.stringify(layers);
          if (prevStr !== currStr) {
             setWorkspaces(prev => prev.map(ws => ws.id === activeWorkspaceId ? {
                 ...ws,
                 pastHistory: [...ws.pastHistory, JSON.parse(prevStr)],
                 futureHistory: []
             } : ws));
          }
          historySnapshotRef.current = null;
      }
  };

  const setLayers = (valOrUpdater: any, saveHistory = false) => {
      setWorkspaces(prevWS => {
          return prevWS.map(ws => {
              if (ws.id === activeWorkspaceId) {
                  const nextLayers = typeof valOrUpdater === 'function' ? valOrUpdater(ws.layers) : valOrUpdater;
                  let newPast = ws.pastHistory;
                  let newFuture = ws.futureHistory;
                  if (saveHistory) {
                      newPast = [...newPast, JSON.parse(JSON.stringify(ws.layers))];
                      newFuture = [];
                  }
                  return { ...ws, layers: nextLayers, pastHistory: newPast, futureHistory: newFuture };
              }
              return ws;
          });
      });
  };

  const handleUndo = () => {
      if (pastHistory.length === 0) return;
      const prev = pastHistory[pastHistory.length - 1];
      setWorkspaces(prevWS => prevWS.map(ws => ws.id === activeWorkspaceId ? {
          ...ws,
          pastHistory: ws.pastHistory.slice(0, -1),
          futureHistory: [...ws.futureHistory, JSON.parse(JSON.stringify(ws.layers))],
          layers: prev
      } : ws));
  };

  const handleRedo = () => {
      if (futureHistory.length === 0) return;
      const next = futureHistory[futureHistory.length - 1];
      setWorkspaces(prevWS => prevWS.map(ws => ws.id === activeWorkspaceId ? {
          ...ws,
          futureHistory: ws.futureHistory.slice(0, -1),
          pastHistory: [...ws.pastHistory, JSON.parse(JSON.stringify(ws.layers))],
          layers: next
      } : ws));
  };

  // Zoom Engine
  const [zoomScale, setZoomScale] = useState(1.0);

  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [isHandToolActive, setIsHandToolActive] = useState(false);
  const lastPanRef = useRef({ x: 0, y: 0 });

  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [brushSettings, setBrushSettings] = useState({ size: 10, flow: 100, opacity: 100, color: '#4F6EE5' });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{x: number, y: number}[]>([]);
  const [penPath, setPenPath] = useState<any[]>([]);
  const [isDraggingPen, setIsDraggingPen] = useState(false);
  
  const [isSnap, setIsSnap] = useState(false);
  const [isGridSettingsOpen, setIsGridSettingsOpen] = useState(false);
  const [isCanvasSettingsOpen, setIsCanvasSettingsOpen] = useState(false);
  const [isRatioSettingsOpen, setIsRatioSettingsOpen] = useState(false);
  const [booleanMenuOpen, setBooleanMenuOpen] = useState(false);
  const [fillMenuOpen, setFillMenuOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
  const [marqueeStart, setMarqueeStart] = useState<{x: number, y: number} | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<{x: number, y: number} | null>(null);
  const [transformState, setTransformState] = useState<any>(null);
  const [hoverCursor, setHoverCursor] = useState('crosshair');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = (format: string) => {
      if (format === 'PNG' || format === 'JPEG') {
          if (!canvasRef.current) return;
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvasRef.current.width;
          tempCanvas.height = canvasRef.current.height;
          const tctx = tempCanvas.getContext('2d');
          if (tctx) {
              if (format === 'JPEG') {
                  tctx.fillStyle = '#FFFFFF';
                  tctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
              }
              tctx.drawImage(canvasRef.current, 0, 0);
          }
          const mime = format === 'PNG' ? 'image/png' : 'image/jpeg';
          const ext = format === 'PNG' ? 'png' : 'jpg';
          const url = tempCanvas.toDataURL(mime);
          const a = document.createElement('a');
          a.href = url;
          a.download = `export.${ext}`;
          a.click();
      } else if (format === 'SVG') {
          let svg = `<svg width="${activeWorkspace.canvasSize.width}" height="${activeWorkspace.canvasSize.height}" xmlns="http://www.w3.org/2000/svg">`;
          layers.forEach(layer => {
             if (!layer.visible) return;
             layer.elements.forEach(el => {
                 let transformStr = "";
                 if (el.tx !== undefined) {
                     const b = getBounds(el);
                     const cx = b.x + b.w/2 + el.tx;
                     const cy = b.y + b.h/2 + el.ty;
                     transformStr = `transform="translate(${cx}, ${cy}) rotate(${el.rotation * 180 / Math.PI || 0}) scale(${el.scaleX||1}, ${el.scaleY||1}) translate(${-b.x - b.w/2}, ${-b.y - b.h/2})" `;
                 }
                 let alpha = layer.opacity !== undefined ? `opacity="${layer.opacity / 100}" ` : '';
      
                 if ((el.type === 'path' || el.type === 'penPath') && el.points && el.points.length > 0) {
                    let d = `M ${el.points[0].x} ${el.points[0].y} `;
                    for (let i = 1; i < el.points.length; i++) {
                       if (el.type === 'penPath') {
                           const prev = el.points[i-1];
                           const curr = el.points[i];
                           d += `C ${prev.cp1x ?? prev.x} ${prev.cp1y ?? prev.y}, ${curr.cp2x ?? curr.x} ${curr.cp2y ?? curr.y}, ${curr.x} ${curr.y} `;
                       } else {
                           d += `L ${el.points[i].x} ${el.points[i].y} `;
                       }
                    }
                    const isClosed = el.type === 'penPath' && (el.points[0].x === el.points[el.points.length-1].x && el.points[0].y === el.points[el.points.length-1].y);
                    const fill = isClosed ? (el.settings?.color || '#000') : 'none';
                    const color = el.tool === 'eraser' ? '#F4F5F8' : (el.settings?.color || '#000');
                    const strokeWidth = el.type === 'path' ? (el.tool === 'eraser' ? el.settings.size * 1.5 : el.settings.size) : Math.max(1, (el.settings?.size || 10) / 2);
                    svg += `<path d="${d}" fill="${el.type === 'path' ? 'none' : fill}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" ${transformStr}${alpha}/>`;
                 }
                 if (el.type === 'image' && el.src) {
                    const b = getBounds(el);
                    svg += `<image href="${el.src}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" preserveAspectRatio="none" ${transformStr}${alpha}/>`;
                 }
             });
          });
          svg += "</svg>";
          const blob = new Blob([svg], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = "vector_export.svg";
          a.click();
      } else if (format === 'Project (.json)') {
          const blob = new Blob([JSON.stringify(layers)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = "project.json";
          a.click();
      }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      if (file.name.endsWith('.json')) {
          reader.onload = (ev) => {
             try {
                const importedLayers = JSON.parse(ev.target?.result as string);
                if (Array.isArray(importedLayers)) {
                   setLayers(importedLayers, true);
                }
             } catch(err) {
                console.error("Failed to parse JSON project");
             }
          };
          reader.readAsText(file);
      } else if (file.type.startsWith('image/')) {
          reader.onload = (ev) => {
              const src = ev.target?.result as string;
              const img = new Image();
              img.onload = () => {
                  const ow = img.width;
                  const oh = img.height;
                  const targetW = Math.min(ow, activeWorkspace.canvasSize.width * 0.8);
                  const scale = targetW / ow;
                  const targetH = oh * scale;
                  
                  const cx = activeWorkspace.canvasSize.width / 2;
                  const cy = activeWorkspace.canvasSize.height / 2;
                  
                  const el = {
                      id: Date.now().toString(),
                      type: 'image',
                      src,
                      pts: [
                          { x: cx - targetW/2, y: cy - targetH/2 },
                          { x: cx + targetW/2, y: cy - targetH/2 },
                          { x: cx + targetW/2, y: cy + targetH/2 },
                          { x: cx - targetW/2, y: cy + targetH/2 }
                      ],
                      imgElement: img,
                      tx: 0, ty: 0, scaleX: 1, scaleY: 1, rotation: 0
                  };
                  
                  const newLayerId = Date.now().toString();
                  const newLayer: LayerData = {
                      id: newLayerId,
                      name: 'Image Layer',
                      type: 'pixel',
                      elements: [el],
                      visible: true,
                      locked: false
                  };
                  setLayers((prev: any) => [newLayer, ...prev], true);
              };
              img.src = src;
          };
          reader.readAsDataURL(file);
      }
      e.target.value = ''; // reset
  };

  // Layout states
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isBottomDockOpen, setIsBottomDockOpen] = useState(true);
  const [activeRightPanel, setActiveRightPanel] = useState<'color' | 'export' | 'layers' | null>(null);
  const [renderedRightPanel, setRenderedRightPanel] = useState<'color' | 'export' | 'layers'>('export');
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');

  const capturePreview = () => {
    if (canvasRef.current && (renderedRightPanel === 'export' || activeRightPanel === 'export')) {
      setPreviewDataUrl(canvasRef.current.toDataURL('image/png'));
    }
  };

  // Canvas Handlers
  const getBounds = (el: any) => {
      if (el.type === 'path' || el.type === 'penPath') {
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          el.points.forEach((p: any) => {
              minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
              maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
              if (p.cp1x !== undefined) {
                  minX = Math.min(minX, p.cp1x, p.cp2x); minY = Math.min(minY, p.cp1y, p.cp2y);
                  maxX = Math.max(maxX, p.cp1x, p.cp2x); maxY = Math.max(maxY, p.cp1y, p.cp2y);
              }
          });
          return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
      } else if (el.type === 'booleanPath' && el.paths) {
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          el.paths.forEach((sub: any) => {
              const b = getBounds(sub);
              minX = Math.min(minX, b.x + (sub.tx||0));
              minY = Math.min(minY, b.y + (sub.ty||0));
              maxX = Math.max(maxX, b.x + b.w + (sub.tx||0));
              maxY = Math.max(maxY, b.y + b.h + (sub.ty||0));
          });
          if (minX === Infinity) return { x: 0, y: 0, w: 100, h: 100 };
          return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
      }
      return { x: 0, y: 0, w: 100, h: 100 };
  };

  const getLocalPt = (mx: number, my: number, el: any, bounds: any) => {
      const cx = bounds.x + bounds.w/2 + (el.tx||0);
      const cy = bounds.y + bounds.h/2 + (el.ty||0);
      let nx = mx - cx;
      let ny = my - cy;
      const angle = -(el.rotation||0);
      let rx = nx * Math.cos(angle) - ny * Math.sin(angle);
      let ry = nx * Math.sin(angle) + ny * Math.cos(angle);
      return { x: rx, y: ry };
  };

  const getHitAction = (lx: number, ly: number, el: any, bounds: any): string | null => {
      const hw = (bounds.w * Math.abs(el.scaleX||1)) / 2;
      const hh = (bounds.h * Math.abs(el.scaleY||1)) / 2;
      const r = 8;
      const rr = 24;
      const isNear = (x:number, y:number, tx:number, ty:number, rad:number) => Math.abs(x - tx) <= rad && Math.abs(y - ty) <= rad;

      if (isNear(lx, ly, -hw, -hh, r)) return 'nw';
      if (isNear(lx, ly, 0, -hh, r)) return 'n';
      if (isNear(lx, ly, hw, -hh, r)) return 'ne';
      if (isNear(lx, ly, hw, 0, r)) return 'e';
      if (isNear(lx, ly, hw, hh, r)) return 'se';
      if (isNear(lx, ly, 0, hh, r)) return 's';
      if (isNear(lx, ly, -hw, hh, r)) return 'sw';
      if (isNear(lx, ly, -hw, 0, r)) return 'w';

      if (isNear(lx, ly, -hw, -hh, rr)) return 'rot-nw';
      if (isNear(lx, ly, hw, -hh, rr)) return 'rot-ne';
      if (isNear(lx, ly, hw, hh, rr)) return 'rot-se';
      if (isNear(lx, ly, -hw, hh, rr)) return 'rot-sw';

      if (lx >= -hw && lx <= hw && ly >= -hh && ly <= hh) return 'body';
      return null;
  };

  const doFloodFill = (startX: number, startY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      const w = canvas.width;
      const h = canvas.height;
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      const startIdx = (startY * w + startX) * 4;
      const r = data[startIdx], g = data[startIdx+1], b = data[startIdx+2], a = data[startIdx+3];
      
      let tc = hexToRgbArr_(brushSettings.color);
      const targetColor = [tc[0], tc[1], tc[2], 255]; 

      if (Math.abs(r-targetColor[0])+Math.abs(g-targetColor[1])+Math.abs(b-targetColor[2])+Math.abs(a-targetColor[3]) < 10) return null;

      const resultImg = new ImageData(w, h);
      const rd = resultImg.data;
      const stack = [[startX, startY]];
      const visited = new Uint8Array(w * h);

      const match = (i: number) => Math.abs(data[i]-r)+Math.abs(data[i+1]-g)+Math.abs(data[i+2]-b)+Math.abs(data[i+3]-a) < 30;

      while(stack.length > 0) {
          const [cx, cy] = stack.pop()!;
          let y = cy;
          let idx = (y * w + cx) * 4;
          while(y >= 0 && match(idx)) { y--; idx -= w*4; }
          y++; idx += w*4;
          let reachL = false, reachR = false;
          while(y < h && match(idx)) {
              rd[idx] = targetColor[0]; rd[idx+1] = targetColor[1]; rd[idx+2] = targetColor[2]; rd[idx+3] = 255;
              visited[y*w+cx] = 1;
              if (cx > 0) {
                  if (match(idx-4) && !visited[y*w+cx-1]) {
                      if (!reachL) { stack.push([cx-1, y]); reachL = true; }
                  } else reachL = false;
              }
              if (cx < w - 1) {
                  if (match(idx+4) && !visited[y*w+cx+1]) {
                      if (!reachR) { stack.push([cx+1, y]); reachR = true; }
                  } else reachR = false;
              }
              y++; idx += w*4;
          }
      }
      const oc = document.createElement('canvas');
      oc.width = w; oc.height = h;
      oc.getContext('2d')?.putImageData(resultImg, 0, 0);
      return oc;
  };

  const handleBooleanOp = (op: string) => {
    setBooleanMenuOpen(false);
    if (selectedLayerIds.length < 2) return;
    
    // sort selected layers by their index in the stack (bottom to top)
    const selLayers = layers.filter(l => selectedLayerIds.includes(l.id));
    if (selLayers.length < 2) return;
    
    // get base color from first selected
    const baseEl = selLayers[0].elements[0];
    const baseColor = baseEl?.settings?.color || brushSettings.color;
    
    const subPaths = selLayers.map(l => l.elements[0]).filter(Boolean);
    
    const newId = Date.now().toString();
    const newLayer = {
        id: newId,
        name: 'Boolean Shape',
        type: 'vector',
        visible: true,
        locked: false,
        elements: [{
            id: Date.now().toString(),
            type: 'booleanPath',
            paths: subPaths,
            booleanOp: op,
            settings: { ...brushSettings, color: baseColor },
            tx: 0, ty: 0, scaleX: 1, scaleY: 1, rotation: 0
        }]
    };
    
    // Insert new layer at the highest index of the selected layers
    const indices = selLayers.map(l => layers.indexOf(l));
    const highestIdx = Math.max(...indices);
    
    setLayers(prev => {
        let newLayers = [...prev];
        newLayers.splice(highestIdx + 1, 0, newLayer);
        newLayers = newLayers.filter(l => !selectedLayerIds.includes(l.id));
        return newLayers;
    }, true);
    
    setSelectedLayerIds([newId]);
    setActiveLayerId(newId);
  };

  const updateSelectedLayers = (updates: any) => {
     setLayers(prev => prev.map(l => {
        if (selectedLayerIds.includes(l.id)) {
            return {
               ...l,
               elements: l.elements.map(e => ({ ...e, ...updates }))
            };
        }
        return l;
     }));
  };

  const handlePanStart = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && isHandToolActive)) {
      e.preventDefault();
      setIsPanning(true);
      lastPanRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePanMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastPanRef.current.x;
      const dy = e.clientY - lastPanRef.current.y;
      setPanX(prev => prev + dx);
      setPanY(prev => prev + dy);
      lastPanRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePanEnd = (e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (e.key.toLowerCase() === 'h' && !isHandToolActive) {
        setIsHandToolActive(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (e.key.toLowerCase() === 'h') {
        setIsHandToolActive(false);
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isHandToolActive]);

  const getXY = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Formula: subtract the camera offset from raw client coordinates
    // (We reconstruct raw mouse position before pan to satisfy the explicit constraint)
    const rawLeft = rect.left - panX;
    const rawTop = rect.top - panY;
    const mouseX = e.clientX - rawLeft;
    const mouseY = e.clientY - rawTop;
    
    let adjustedCanvasX = (mouseX - panX) / zoomScale;
    let adjustedCanvasY = (mouseY - panY) / zoomScale;
    
    let x = adjustedCanvasX;
    let y = adjustedCanvasY;
    
    if (isSnap) {
      const gridSize = 40;
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;
    }
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || (e.button === 0 && isHandToolActive)) {
      return; // Let the wrapper handle panning
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    
    // Auto-layer generation 
    let currActive = activeLayerId;
    if (layers.length === 0) {
       const newId = Date.now().toString();
       currActive = newId;
       setLayers([{ id: newId, name: 'Layer 1', type: appMode, elements: [], visible: true, locked: false }]);
       setActiveLayerId(newId);
    }

    const { x, y } = getXY(e);
    setIsDrawing(true);

    if (activeTool === 'pen') {
      if (penPath.length > 0) {
        const firstPt = penPath[0];
        const dist = Math.sqrt(Math.pow(x - firstPt.x, 2) + Math.pow(y - firstPt.y, 2));
        if (dist <= 8) {
           // Close the path
           const closedPath = [...penPath, { x: firstPt.x, y: firstPt.y, cp1x: firstPt.x, cp1y: firstPt.y, cp2x: firstPt.x, cp2y: firstPt.y }];
           setLayers(prevLayers => {
               const newLayers = [...prevLayers];
               const layerCount = newLayers.length + 1;
               newLayers.push({
                   id: Date.now().toString(),
                   name: `Vector Shape ${layerCount}`,
                   type: 'vector',
                   visible: true,
                   locked: false,
                   elements: [{
                       id: Date.now().toString(),
                       type: 'penPath',
                       points: closedPath,
                       settings: { ...brushSettings },
                       tx: 0, ty: 0, scaleX: 1, scaleY: 1, rotation: 0
                   }]
               });
               return newLayers;
           }, true);
           setPenPath([]);
        } else {
           setPenPath(prev => [...prev, { x, y, cp1x: x, cp1y: y, cp2x: x, cp2y: y }]);
           setIsDraggingPen(true);
        }
      } else {
        setPenPath([{ x, y, cp1x: x, cp1y: y, cp2x: x, cp2y: y }]);
        setIsDraggingPen(true);
      }
    } else if (activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'gradient') {
      setCurrentPath([{ x, y }]);
    } else if (activeTool === 'select') {
      // Hit testing
      let hitAction: string | null = null;
      let hitEl: any = null;
      
      if (selectedLayerIds.length === 1) {
          const l = layers.find(layer => layer.id === selectedLayerIds[0]);
          if (l && l.visible && l.elements.length > 0) {
              const el = l.elements[0];
              const bounds = getBounds(el);
              const lpt = getLocalPt(x, y, el, bounds);
              const act = getHitAction(lpt.x, lpt.y, el, bounds);
              if (act && act !== 'body') {
                  hitAction = act;
                  hitEl = el;
              }
          }
      }
      
      if (hitAction && hitEl) {
          saveHistorySnapshot();
          const bounds = getBounds(hitEl);
          setTransformState({
              action: hitAction,
              startX: x, startY: y,
              tx: hitEl.tx||0, ty: hitEl.ty||0,
              rot: hitEl.rotation||0,
              scaleX: hitEl.scaleX||1, scaleY: hitEl.scaleY||1,
              cx: bounds.x + bounds.w/2, cy: bounds.y + bounds.h/2
          });
      } else {
          // find body hit
          let hitLayerId: string | null = null;
          let hitLayerEl: any = null;
          const hitCanvas = canvasRef.current;
          const hitCtx = hitCanvas?.getContext('2d');
          for (let i = layers.length - 1; i >= 0; i--) {
              if (!layers[i].visible) continue;
              for (let j = layers[i].elements.length - 1; j >= 0; j--) {
                  const el = layers[i].elements[j];
                  const bounds = getBounds(el);
                  
                  let hitBody = false;
                  if ((el.type === 'penPath' || el.type === 'booleanPath') && hitCtx) {
                      hitCtx.save();
                      const cx = bounds.x + bounds.w/2 + (el.tx||0);
                      const cy = bounds.y + bounds.h/2 + (el.ty||0);
                      hitCtx.translate(cx, cy);
                      hitCtx.rotate(el.rotation||0);
                      hitCtx.scale(el.scaleX||1, el.scaleY||1);
                      hitCtx.translate(-(bounds.x + bounds.w/2), -(bounds.y + bounds.h/2));
                      
                      hitCtx.beginPath();
                      if (el.type === 'penPath' && el.points && el.points.length > 0) {
                          hitCtx.moveTo(el.points[0].x, el.points[0].y);
                          for (let k = 1; k < el.points.length; k++) {
                              const prev = el.points[k-1];
                              const curr = el.points[k];
                              hitCtx.bezierCurveTo(
                                 prev.cp1x ?? prev.x, prev.cp1y ?? prev.y,
                                 curr.cp2x ?? curr.x, curr.cp2y ?? curr.y,
                                 curr.x, curr.y
                              );
                          }
                      } else {
                          // Rough proxy for boolean object body test
                          hitCtx.rect(bounds.x, bounds.y, bounds.w, bounds.h);
                      }
                      
                      if (hitCtx.isPointInPath(x, y)) {
                          hitBody = true;
                      }
                      hitCtx.restore();
                  }

                  const lpt = getLocalPt(x, y, el, bounds);
                  if (hitBody || getHitAction(lpt.x, lpt.y, el, bounds) === 'body') {
                      hitLayerId = layers[i].id;
                      hitLayerEl = el;
                      break;
                  }
              }
              if (hitLayerId) break;
          }
          
          if (hitLayerId) {
              if (e.shiftKey) {
                  setSelectedLayerIds(prev => prev.includes(hitLayerId!) ? prev.filter(id => id !== hitLayerId) : [...prev, hitLayerId!]);
              } else {
                  if (!selectedLayerIds.includes(hitLayerId)) {
                      setSelectedLayerIds([hitLayerId]);
                      setActiveLayerId(hitLayerId);
                  }
              }
              const bounds = getBounds(hitLayerEl);
              saveHistorySnapshot();
              setTransformState({
                  action: 'body',
                  startX: x, startY: y,
                  tx: hitLayerEl.tx||0, ty: hitLayerEl.ty||0,
                  rot: hitLayerEl.rotation||0,
                  scaleX: hitLayerEl.scaleX||1, scaleY: hitLayerEl.scaleY||1,
                  cx: bounds.x + bounds.w/2, cy: bounds.y + bounds.h/2
              });
          } else {
              setSelectedLayerIds([]);
              setMarqueeStart({x, y});
              setMarqueeEnd({x, y});
          }
      }
    } else if (activeTool === 'bucket') {
      const oc = doFloodFill(Math.round(x), Math.round(y));
      if (oc) {
         setLayers(prev => prev.map(l => l.id === activeLayerId ? {
             ...l, elements: [...l.elements, { 
                id: Date.now().toString(), type: 'bitmap', oc, 
                tx:0, ty:0, scaleX:1, scaleY:1, rotation:0 
             }]
         } : l), true);
      }
      setIsDrawing(false);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanning || (e.buttons === 1 && isHandToolActive)) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    
    const { x, y } = getXY(e);

    // Update hover cursor
    if (activeTool === 'select' && !isDrawing) {
       let newCursor = 'default';
       if (selectedLayerIds.length === 1) {
           let foundAct = null;
           const l = layers.find(layer => layer.id === selectedLayerIds[0]);
           if (l && l.visible && l.elements.length > 0) {
               const el = l.elements[0];
               const bounds = getBounds(el);
               const lpt = getLocalPt(x, y, el, bounds);
               foundAct = getHitAction(lpt.x, lpt.y, el, bounds);
           }
           if (foundAct) {
              if (foundAct.startsWith('rot')) newCursor = 'alias';
              else if (foundAct === 'nw' || foundAct === 'se') newCursor = 'nwse-resize';
              else if (foundAct === 'ne' || foundAct === 'sw') newCursor = 'nesw-resize';
              else if (foundAct === 'n' || foundAct === 's') newCursor = 'ns-resize';
              else if (foundAct === 'e' || foundAct === 'w') newCursor = 'ew-resize';
              else if (foundAct === 'body') newCursor = 'move';
           }
       } else if (selectedLayerIds.length > 1) {
           let hoverBody = false;
           for (const lid of selectedLayerIds) {
               const l = layers.find(layer => layer.id === lid);
               if (l && l.visible && l.elements.length > 0) {
                   const el = l.elements[0];
                   const bounds = getBounds(el);
                   const lpt = getLocalPt(x, y, el, bounds);
                   if (getHitAction(lpt.x, lpt.y, el, bounds) === 'body') hoverBody = true;
               }
           }
           if (hoverBody) newCursor = 'move';
       }
       setHoverCursor(newCursor);
    } else if (activeTool === 'brush' || activeTool === 'eraser') {
       setHoverCursor('none');
    } else {
       setHoverCursor('crosshair');
    }

    if (activeTool === 'select' && isDrawing) {
       if (marqueeStart) {
           setMarqueeEnd({x, y});
       } else if (transformState && selectedLayerIds.length > 0) {
           const dx = x - transformState.startX;
           const dy = y - transformState.startY;
           let nx = transformState.tx, ny = transformState.ty;
           let nsx = transformState.scaleX, nsy = transformState.scaleY;
           let nrot = transformState.rot;
   
           if (transformState.action === 'body') {
               nx += dx; ny += dy;
           } else if (transformState.action.startsWith('rot')) {
               const cx = transformState.cx + nx;
               const cy = transformState.cy + ny;
               const startAngle = Math.atan2(transformState.startY - cy, transformState.startX - cx);
               const currAngle = Math.atan2(y - cy, x - cx);
               nrot += (currAngle - startAngle);
           } else {
               // bounds scale relative to center
               // unrotate current mouse pos to find delta in scale directions
               const angle = -transformState.rot;
               let nxLoc = (x - (transformState.cx + nx)) * Math.cos(angle) - (y - (transformState.cy + ny)) * Math.sin(angle);
               let nyLoc = (x - (transformState.cx + nx)) * Math.sin(angle) + (y - (transformState.cy + ny)) * Math.cos(angle);
               
               let el: any;
               for (let l of layers) { if (selectedLayerIds.includes(l.id)) { el = l.elements[0]; break; } }
               if (el) {
                   const bounds = getBounds(el);
                   const hw = bounds.w/2 || 1;
                   const hh = bounds.h/2 || 1;
       
                   if (transformState.action.includes('e')) nsx = nxLoc / hw;
                   if (transformState.action.includes('w')) nsx = -nxLoc / hw;
                   if (transformState.action.includes('s')) nsy = nyLoc / hh;
                   if (transformState.action.includes('n')) nsy = -nyLoc / hh;
               }
           }
           
           if (transformState.action === 'body') {
               // Translate all selected items by delta
               setLayers(prev => prev.map(l => {
                   if (selectedLayerIds.includes(l.id)) {
                       return { ...l, elements: l.elements.map(e => ({ ...e, tx: (e.tx||0) + (nx - transformState.tx), ty: (e.ty||0) + (ny - transformState.ty) })) };
                   }
                   return l;
               }));
               setTransformState((prev: any) => ({...prev, tx: nx, ty: ny, startX: x, startY: y}));
           } else {
               updateSelectedLayers({ tx: nx, ty: ny, scaleX: nsx, scaleY: nsy, rotation: nrot });
           }
       }
    } else if (activeTool === 'pen' && isDraggingPen) {
        setPenPath(prev => {
            const arr = [...prev];
            if (arr.length === 0) return arr;
            const last = arr[arr.length - 1];
            const dx = x - last.x;
            const dy = y - last.y;
            arr[arr.length - 1] = {
                ...last,
                cp1x: last.x + dx, // Outgoing handle (towards mouse)
                cp1y: last.y + dy,
                cp2x: last.x - dx, // Incoming handle (mirrored)
                cp2y: last.y - dy,
            };
            return arr;
        });
    } else if (isDrawing) {
      if (activeTool === 'eraser' || activeTool === 'gradient') {
        setCurrentPath(prev => [...prev, { x, y }]);
      } else if (activeTool === 'brush') {
        const lastPt = currentPath[currentPath.length - 1];
        if (lastPt) {
          const dx = x - lastPt.x;
          const dy = y - lastPt.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const stepSize = Math.max(1, (100 - brushSettings.flow) * 0.5); 
          if (dist >= stepSize) {
            setCurrentPath(prev => [...prev, { x, y }]);
          }
        } else {
          setCurrentPath([{ x, y }]);
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || (e.button === 0 && isHandToolActive)) {
      return; 
    }
    setIsDrawing(false);
    if (transformState) commitHistorySnapshot();
    setTransformState(null);
    if (activeTool === 'select') {
        if (marqueeStart && marqueeEnd) {
            const minX = Math.min(marqueeStart.x, marqueeEnd.x);
            const maxX = Math.max(marqueeStart.x, marqueeEnd.x);
            const minY = Math.min(marqueeStart.y, marqueeEnd.y);
            const maxY = Math.max(marqueeStart.y, marqueeEnd.y);
            
            const newSel: string[] = [];
            for (let l of layers) {
                if (!l.visible || l.elements.length === 0) continue;
                const el = l.elements[0]; // Assuming boolean body checking logic for first shape
                const bounds = getBounds(el);
                const cx = bounds.x + bounds.w/2 + (el.tx||0);
                const cy = bounds.y + bounds.h/2 + (el.ty||0);
                const hw = bounds.w/2 * Math.abs(el.scaleX||1);
                const hh = bounds.h/2 * Math.abs(el.scaleY||1);
                
                if (cx + hw >= minX && cx - hw <= maxX && cy + hh >= minY && cy - hh <= maxY) {
                    newSel.push(l.id);
                }
            }
            
            if (e.shiftKey) {
                setSelectedLayerIds(prev => Array.from(new Set([...prev, ...newSel])));
            } else {
                setSelectedLayerIds(newSel);
                if (newSel.length > 0) setActiveLayerId(newSel[0]);
            }
        }
        setMarqueeStart(null);
        setMarqueeEnd(null);
    } else if (activeTool === 'pen') {
       setIsDraggingPen(false);
    } else if (activeTool === 'gradient' && currentPath.length > 0) {
      const endPt = currentPath[currentPath.length - 1];
      const startPt = currentPath[0];
      setLayers(prevLayers => prevLayers.map(l => (l.id === activeLayerId || prevLayers.length === 1) ? {
         ...l, elements: [...l.elements, { 
            id: Date.now().toString(), type: 'gradient', 
            x1: startPt.x, y1: startPt.y, x2: endPt.x, y2: endPt.y,
            settings: { ...brushSettings },
            tx:0, ty:0, scaleX:1, scaleY:1, rotation:0 
         }]
      } : l), true);
      setCurrentPath([]);
    } else if ((activeTool === 'brush' || activeTool === 'eraser') && currentPath.length > 0) {
      setLayers(prevLayers => prevLayers.map(l => {
        if (l.id === activeLayerId || prevLayers.length === 1) { 
           return {
             ...l,
             elements: [...l.elements, { 
               id: Date.now().toString(), type: 'path', tool: activeTool, points: currentPath, settings: { ...brushSettings },
               tx:0, ty:0, scaleX:1, scaleY:1, rotation:0 
             }]
           };
        }
        return l;
      }), true);
      setCurrentPath([]);
    }
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Auto Grid Overlay
    if (isAutoGrid) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,0.05)';
      ctx.lineWidth = 1;
      const size = 40;
      ctx.beginPath();
      for (let x = 0; x <= canvas.width; x += size) { ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); }
      for (let y = 0; y <= canvas.height; y += size) { ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); }
      ctx.stroke();
      ctx.restore();
    }

    // Layout Grid Render Engine
    if (isCustomGridActive && gridSettings) {
       ctx.save();
       const hex = gridSettings.color || '#FF0000';
       const rgb = hexToRgbArr_(hex);
       ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${gridSettings.opacity / 100})`;
       ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${gridSettings.opacity / 100})`;
       
       if (gridSettings.type === 'Grid') {
           const size = gridSettings.size || 10;
           if (size > 0) {
               ctx.lineWidth = 1;
               ctx.beginPath();
               for (let x = 0; x <= canvas.width; x += size) { ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); }
               for (let y = 0; y <= canvas.height; y += size) { ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); }
               ctx.stroke();
           }
       } else if (gridSettings.type === 'Columns' || gridSettings.type === 'Rows') {
           const isCol = gridSettings.type === 'Columns';
           const count = gridSettings.count || 1;
           const dim = isCol ? canvas.width : canvas.height;
           const otherDim = isCol ? canvas.height : canvas.width;
           const margin = gridSettings.margin || 0;
           const gutter = gridSettings.gutter || 0;
           
           let bandW = 0;
           const usableDim = dim - (margin * 2) - (gutter * Math.max(0, count - 1));
           
           if (gridSettings.layoutType === 'Stretch') {
               bandW = usableDim / count;
           } else {
               bandW = gridSettings.width !== 'Auto' ? Number(gridSettings.width) : (usableDim / count);
           }
           
           if (bandW > 0) {
               let startPoint = margin;
               if (gridSettings.layoutType === 'Center') {
                   const totalContent = (bandW * count) + (gutter * Math.max(0, count - 1));
                   startPoint = (dim - totalContent) / 2;
               }
               
               for (let i = 0; i < count; i++) {
                   const offset = startPoint + i * (bandW + gutter);
                   if (isCol) {
                       ctx.fillRect(offset, 0, bandW, otherDim);
                   } else {
                       ctx.fillRect(0, offset, otherDim, bandW);
                   }
               }
           }
       }
       ctx.restore();
    }
    
    const paintElement = (el: any, layerAlpha: number = 1) => {
        ctx.save();
        if (el.tx !== undefined) {
           const bounds = getBounds(el);
           const cx = bounds.x + bounds.w/2 + el.tx;
           const cy = bounds.y + bounds.h/2 + el.ty;
           ctx.translate(cx, cy);
           ctx.rotate(el.rotation||0);
           ctx.scale(el.scaleX||1, el.scaleY||1);
           ctx.translate(-(bounds.x + bounds.w/2), -(bounds.y + bounds.h/2));
        }

        if (el.type === 'path' && el.points.length > 0) {
            ctx.beginPath();
            ctx.moveTo(el.points[0].x, el.points[0].y);
            for (let i = 1; i < el.points.length; i++) {
              ctx.lineTo(el.points[i].x, el.points[i].y);
            }
            ctx.strokeStyle = el.tool === 'eraser' ? '#F4F5F8' : (el.settings?.color || '#2D3748');
            ctx.lineWidth = el.tool === 'eraser' ? el.settings.size * 1.5 : el.settings.size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            if (el.tool === 'eraser') {
              ctx.globalCompositeOperation = appMode === 'pixel' ? 'destination-out' : 'source-over';
              if (appMode === 'vector') {
                 ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
              }
              ctx.globalAlpha = 1 * layerAlpha;
            } else {
              ctx.globalCompositeOperation = 'source-over';
              ctx.globalAlpha = ((el.settings.opacity || 100) / 100) * layerAlpha;
            }
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
        } else if (el.type === 'penPath') {
            ctx.beginPath();
            ctx.moveTo(el.points[0].x, el.points[0].y);
            for (let i = 1; i < el.points.length; i++) {
                const prev = el.points[i-1];
                const curr = el.points[i];
                ctx.bezierCurveTo(
                   prev.cp1x ?? prev.x, prev.cp1y ?? prev.y,
                   curr.cp2x ?? curr.x, curr.cp2y ?? curr.y,
                   curr.x, curr.y
                );
            }
            if (el.points[0].x === el.points[el.points.length - 1].x && el.points[0].y === el.points[el.points.length - 1].y) {
               ctx.fillStyle = el.settings?.color || '#2D3748';
               ctx.globalAlpha = ((el.settings?.opacity || 100) / 100) * layerAlpha;
               ctx.fill();
            }
            ctx.strokeStyle = el.settings?.color || '#2D3748';
            ctx.lineWidth = Math.max(1, (el.settings?.size || 10) / 2);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = ((el.settings?.opacity || 100) / 100) * layerAlpha;
            ctx.stroke();
        } else if (el.type === 'booleanPath') {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tctx = tempCanvas.getContext('2d');
            if (tctx && el.paths && el.paths.length > 0) {
                tctx.fillStyle = el.settings?.color || '#2D3748';
                tctx.globalAlpha = ((el.settings?.opacity || 100) / 100) * layerAlpha;
                
                el.paths.forEach((subPath: any, idx: number) => {
                    tctx.save();
                    
                    if (subPath.tx !== undefined) {
                        const subBounds = getBounds(subPath);
                        const subCx = subBounds.x + subBounds.w/2 + subPath.tx;
                        const subCy = subBounds.y + subBounds.h/2 + subPath.ty;
                        tctx.translate(subCx, subCy);
                        tctx.rotate(subPath.rotation||0);
                        tctx.scale(subPath.scaleX||1, subPath.scaleY||1);
                        tctx.translate(-(subBounds.x + subBounds.w/2), -(subBounds.y + subBounds.h/2));
                    }
                    
                    tctx.beginPath();
                    if (subPath.points && subPath.points.length > 0) {
                        tctx.moveTo(subPath.points[0].x, subPath.points[0].y);
                        for (let k = 1; k < subPath.points.length; k++) {
                            const prev = subPath.points[k-1];
                            const curr = subPath.points[k];
                            tctx.bezierCurveTo(
                                prev.cp1x ?? prev.x, prev.cp1y ?? prev.y,
                                curr.cp2x ?? curr.x, curr.cp2y ?? curr.y,
                                curr.x, curr.y
                            );
                        }
                    }
                    
                    if (idx > 0) {
                        tctx.globalCompositeOperation = el.booleanOp === 'Union' ? 'source-over' :
                                                        el.booleanOp === 'Subtract' ? 'destination-out' :
                                                        el.booleanOp === 'Intersect' ? 'source-in' :
                                                        el.booleanOp === 'Exclude' ? 'xor' : 'source-over';
                    } else {
                        tctx.globalCompositeOperation = 'source-over';
                    }
                    tctx.fill();
                    tctx.restore();
                });
                
                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(tempCanvas, 0, 0);
                
                // Draw stroke bounding exactly around the boolean output?
                // The prompt says "Baking ... resulting combined path geometry ... trigger fill()".
                // Since canvas composite handles the fill correctly, this matches visual expectations.
            }
        } else if (el.type === 'bitmap' && el.oc) {
            ctx.drawImage(el.oc, 0, 0);
        } else if (el.type === 'image') {
            if (el.imgElement) {
                const b = getBounds(el);
                ctx.globalAlpha = layerAlpha;
                ctx.drawImage(el.imgElement, b.x, b.y, b.w, b.h);
            } else if (el.src) {
                const img = new Image();
                img.src = el.src;
                el.imgElement = img;
                img.onload = () => {
                   // trigger a redraw when the image finishes loading
                   setLayers((prev: any) => [...prev], false);
                };
            }
        } else if (el.type === 'gradient') {
            const color = el.settings?.color || '#000000';
            const grd = ctx.createLinearGradient(el.x1, el.y1, el.x2, el.y2);
            const rgb = hexToRgbArr_(color);
            grd.addColorStop(0, color);
            grd.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`);
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.restore();
    };

    layers.forEach(layer => {
      if (!layer.visible) return;
      const layerAlpha = layer.opacity !== undefined ? layer.opacity / 100 : 1;
      layer.elements.forEach(el => paintElement(el, layerAlpha));
    });
    
    if (currentPath.length > 0) {
       if (activeTool === 'gradient') {
           const endPt = currentPath[currentPath.length - 1];
           const startPt = currentPath[0];
           ctx.beginPath();
           ctx.moveTo(startPt.x, startPt.y);
           ctx.lineTo(endPt.x, endPt.y);
           ctx.strokeStyle = brushSettings.color || '#0A7AFF';
           ctx.lineWidth = 2;
           ctx.setLineDash([5, 5]);
           ctx.stroke();
           ctx.setLineDash([]);
       } else {
           paintElement({ type: 'path', tool: activeTool, points: currentPath, settings: brushSettings });
       }
    }

    if (penPath.length > 0) {
        ctx.beginPath();
        ctx.moveTo(penPath[0].x, penPath[0].y);
        for (let i = 1; i < penPath.length; i++) {
            const prev = penPath[i-1];
            const curr = penPath[i];
            ctx.bezierCurveTo(
               prev.cp1x ?? prev.x, prev.cp1y ?? prev.y,
               curr.cp2x ?? curr.x, curr.cp2y ?? curr.y,
               curr.x, curr.y
            );
        }
        if (activeTool === 'pen' && mousePos.x !== -100 && !isDraggingPen) {
            const last = penPath[penPath.length - 1];
            let snappedX = mousePos.x;
            let snappedY = mousePos.y;
            if (isSnap) {
                snappedX = Math.round(snappedX / 40) * 40;
                snappedY = Math.round(snappedY / 40) * 40;
            }
            ctx.bezierCurveTo(
               last.cp1x ?? last.x, last.cp1y ?? last.y,
               snappedX, snappedY,
               snappedX, snappedY
            );
        }
        ctx.strokeStyle = brushSettings.color || '#2D3748';
        ctx.lineWidth = Math.max(1, brushSettings.size / 2);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = (brushSettings.opacity || 100) / 100;
        ctx.stroke();
        ctx.globalAlpha = 1;

        penPath.forEach(pt => {
            ctx.fillStyle = '#0A7AFF';
            ctx.fillRect(pt.x - 3, pt.y - 3, 6, 6);
            if (pt.cp2x !== pt.x || pt.cp2y !== pt.y) {
                ctx.beginPath(); ctx.moveTo(pt.cp1x!, pt.cp1y!); ctx.lineTo(pt.cp2x!, pt.cp2y!);
                ctx.strokeStyle = '#0A7AFF'; ctx.lineWidth = 1; ctx.stroke();
                ctx.beginPath(); ctx.arc(pt.cp1x!, pt.cp1y!, 3, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(pt.cp2x!, pt.cp2y!, 3, 0, Math.PI*2); ctx.fill();
            }
        });
    }

    // Bounding Box Overlay for Selection Tool
    if (activeTool === 'select') {
        selectedLayerIds.forEach(lid => {
            const l = layers.find(layer => layer.id === lid);
            if (l && l.visible && l.elements.length > 0) {
                const el = l.elements[0];
                const bounds = getBounds(el);
                ctx.save();
                const cx = bounds.x + bounds.w/2 + (el.tx||0);
                const cy = bounds.y + bounds.h/2 + (el.ty||0);
                ctx.translate(cx, cy);
                ctx.rotate(el.rotation||0);
                
                const boxW = bounds.w * Math.abs(el.scaleX||1);
                const boxH = bounds.h * Math.abs(el.scaleY||1);
                
                ctx.strokeStyle = '#0A7AFF';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(-boxW/2, -boxH/2, boxW, boxH);
                
                // Only show resize handles if exactly one element is selected
                if (selectedLayerIds.length === 1) {
                    const drawHandle = (hx: number, hy: number) => {
                        ctx.fillStyle = 'white'; ctx.strokeStyle = '#0A7AFF'; ctx.lineWidth = 1.5;
                        ctx.fillRect(hx-4, hy-4, 8, 8); ctx.strokeRect(hx-4, hy-4, 8, 8);
                    };
                    const hw = boxW/2, hh = boxH/2;
                    drawHandle(-hw, -hh); drawHandle(0, -hh); drawHandle(hw, -hh);
                    drawHandle(-hw, 0);                       drawHandle(hw, 0);
                    drawHandle(-hw, hh);  drawHandle(0, hh);  drawHandle(hw, hh);
                }
                ctx.restore();
            }
        });
        
        // Draw Marquee selection box
        if (marqueeStart && marqueeEnd) {
            ctx.save();
            ctx.strokeStyle = '#0A7AFF';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(
                Math.min(marqueeStart.x, marqueeEnd.x),
                Math.min(marqueeStart.y, marqueeEnd.y),
                Math.abs(marqueeEnd.x - marqueeStart.x),
                Math.abs(marqueeEnd.y - marqueeStart.y)
            );
            ctx.fillStyle = 'rgba(10, 122, 255, 0.1)';
            ctx.fillRect(
                Math.min(marqueeStart.x, marqueeEnd.x),
                Math.min(marqueeStart.y, marqueeEnd.y),
                Math.abs(marqueeEnd.x - marqueeStart.x),
                Math.abs(marqueeEnd.y - marqueeStart.y)
            );
            ctx.restore();
        }
    }
    
    // Capture Preview for Export panel
    if (renderedRightPanel === 'export' || activeRightPanel === 'export') {
       requestAnimationFrame(capturePreview);
    }
  }, [layers, currentPath, penPath, activeTool, isDraggingPen, mousePos, brushSettings, appMode, gridSettings, isSnap, selectedLayerIds, transformState, marqueeStart, marqueeEnd, renderedRightPanel, activeRightPanel]);

  const lastSelectedIds = useRef<string>('');
  useEffect(() => {
     if (activeTool === 'select' && selectedLayerIds.length > 0) {
        const lid = selectedLayerIds[selectedLayerIds.length - 1]; // Use last selected element for color sync
        const l = layers.find(layer => layer.id === lid);
        const el = l && l.elements.length > 0 ? l.elements[0] : null;
        
        const selKey = selectedLayerIds.join(',');
        if (selKey !== lastSelectedIds.current) {
            if (el && (el.type === 'penPath' || el.type === 'booleanPath') && el.settings?.color) {
                setBrushSettings(prev => ({ ...prev, color: el.settings.color }));
            }
            lastSelectedIds.current = selKey;
        } else {
            // Check if color changed from picker
            let updateNeeded = false;
            selectedLayerIds.forEach(id => {
                const layer = layers.find(ly => ly.id === id);
                if (layer && layer.elements[0] && (layer.elements[0].type === 'penPath' || layer.elements[0].type === 'booleanPath')) {
                    if (layer.elements[0].settings?.color !== brushSettings.color) {
                        updateNeeded = true;
                    }
                }
            });
            if (updateNeeded) {
               setLayers(prev => prev.map(ly => {
                   if (selectedLayerIds.includes(ly.id)) {
                       return {
                           ...ly,
                           elements: ly.elements.map(e => (e.type === 'penPath' || e.type === 'booleanPath') ? { ...e, settings: { ...e.settings, color: brushSettings.color } } : e)
                       };
                   }
                   return ly;
               }));
            }
        }
     } else {
        lastSelectedIds.current = selectedLayerIds.join(',');
     }
  }, [selectedLayerIds, brushSettings.color, activeTool]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
       if (e.key === 'Escape' || e.key === 'Enter') {
          setPenPath([]);
       }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeLayerId, brushSettings]);

  useEffect(() => {
    const handleResize = () => setLayers(l => [...l]);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const closeWorkspace = (idToClose: string) => {
      setWorkspaces(prev => {
          const filtered = prev.filter(ws => ws.id !== idToClose);
          if (filtered.length === 0) {
              const newId = '1';
              return [{
                  id: newId,
                  name: `Tab ${newId}`,
                  layers: [],
                  pastHistory: [],
                  futureHistory: [],
                  gridSettings: { ...defaultGridSettings },
                  isAutoGridActive: false,
                  isCustomGridActive: false,
                  canvasSize: { width: 1080, height: 720, ppi: 72 }
              }];
          }
          return filtered;
      });
      if (activeWorkspaceId === idToClose) {
          const idx = workspaces.findIndex(ws => ws.id === idToClose);
          const nextIdx = Math.max(0, idx - 1);
          const nextWs = workspaces.filter(ws => ws.id !== idToClose)[nextIdx] || workspaces.filter(ws => ws.id !== idToClose)[0];
          if (nextWs) setActiveWorkspaceId(nextWs.id);
      }
  };

  const handleRightTabClick = (tab: 'color' | 'export' | 'layers') => {
    if (activeRightPanel === tab) {
      setActiveRightPanel(null);
    } else {
      setActiveRightPanel(tab);
      setRenderedRightPanel(tab);
    }
  };

  return (
    <div className="w-screen h-screen bg-[#EAEBEE] flex items-center justify-center p-4 sm:p-8 md:p-12 font-sans select-none overflow-hidden">
      
      {/* Main Canvas Container Wrap */}
      <div className="w-full max-w-[1440px] h-full max-h-[900px] bg-[#F4F5F8] rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.12)] relative overflow-hidden border-[6px] border-white z-10 transition-all duration-300">
        
        {/* SVG Defs for Header Rounding */}
        <svg width="0" height="0" className="absolute pointer-events-none">
          <defs>
            <mask id="headerMask">
              <path d="M 25 8 L 300 8 L 300 32 L 165.2 32 L 159.6 44 L 8 44 Z" fill="white" stroke="white" strokeWidth="16" strokeLinejoin="round" />
            </mask>
            <clipPath id="panelClip" clipPathUnits="userSpaceOnUse">
              <path d="M 46 0 L 270 0 Q 280 0 280 10 L 280 450 Q 280 460 270 460 L 10 460 Q 0 460 0 450 L 0 46 Q 0 36 7 29 L 29 7 Q 36 0 46 0 Z" />
            </clipPath>
            <clipPath id="colorPanelClip" clipPathUnits="userSpaceOnUse">
              <path d="M 46 0 L 270 0 Q 280 0 280 10 L 280 350 Q 280 360 270 360 L 10 360 Q 0 360 0 350 L 0 46 Q 0 36 7 29 L 29 7 Q 36 0 46 0 Z" />
            </clipPath>
            <clipPath id="innerClip" clipPathUnits="userSpaceOnUse">
              <path d="M 32 0 L 224 0 Q 232 0 232 8 L 232 132 Q 232 140 224 140 L 8 140 Q 0 140 0 132 L 0 32 Q 0 24 6 18 L 18 6 Q 24 0 32 0 Z" />
            </clipPath>
          </defs>
        </svg>

        {/* --- 0. INTERACTIVE CANVAS WORKSPACE --- */}
        <div 
          className="absolute inset-0 w-full h-full z-10 touch-none flex items-center justify-center pointer-events-auto"
          onMouseDown={handlePanStart}
          onMouseMove={handlePanMove}
          onMouseUp={handlePanEnd}
          onMouseLeave={handlePanEnd}
          style={{ cursor: isPanning || isHandToolActive ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
        >
          <div 
            className="relative pointer-events-auto shadow-[0_15px_40px_rgba(0,0,0,0.15)] bg-white"
            style={{ 
              width: canvasSize.width, 
              height: canvasSize.height,
              cursor: isPanning || isHandToolActive ? (isPanning ? 'grabbing' : 'grab') : hoverCursor, 
              transform: `translate(${panX}px, ${panY}px) scale(${zoomScale})`, 
              transformOrigin: 'center center', 
              transition: isPanning ? 'none' : 'transform 0.2s ease-out'
            }}
          >
            <canvas 
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="absolute inset-0 w-full h-full touch-none block"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />
            {/* Custom brush circle cursor preview */}
            {(activeTool === 'brush' || activeTool === 'eraser') && (
              <div 
                className="absolute pointer-events-none rounded-full border border-black/40 shadow-[0_2px_4px_rgba(0,0,0,0.1)] z-[100]"
                style={{
                  width: brushSettings.size,
                  height: brushSettings.size,
                  left: mousePos.x - brushSettings.size / 2,
                  top: mousePos.y - brushSettings.size / 2,
                  backgroundColor: activeTool === 'eraser' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.1)'
                }}
              />
            )}
          </div>
        </div>

        {/* --- 1. TOP PURPLE HEADER --- */}
        <div className="absolute top-0 left-[8%] right-[8%] z-30 h-[52px] drop-shadow-[0_4px_12px_rgba(95,70,140,0.35)] flex pointer-events-none">
          
          {/* Left Area (Dynamic Width) - Tabs Container */}
          <div className="relative h-[52px] flex pointer-events-auto shrink-0">
             
             {/* Left Section Background with Smooth SVG Masks */}
             <div 
               className="absolute inset-0 z-0 bg-[#9E86C8]"
               style={{ 
                 maskImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 52' width='36' height='52'%3E%3Cpath d='M 36 0 L 32 0 Q 30 0, 28.15 4 L 8.77 46 Q 6 52, 12 52 L 36 52 Z' fill='black'/%3E%3C/svg%3E"), url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 52' width='40' height='52'%3E%3Cpath d='M 0 0 L 40 0 L 40 40 C 20 40, 20 52, 0 52 Z' fill='black'/%3E%3C/svg%3E"), linear-gradient(black, black)`,
                 maskPosition: 'left top, right top, 36px top',
                 maskSize: '36px 52px, 40px 52px, calc(100% - 76px) 52px',
                 maskRepeat: 'no-repeat, no-repeat, no-repeat',
                 WebkitMaskImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 52' width='36' height='52'%3E%3Cpath d='M 36 0 L 32 0 Q 30 0, 28.15 4 L 8.77 46 Q 6 52, 12 52 L 36 52 Z' fill='black'/%3E%3C/svg%3E"), url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 52' width='40' height='52'%3E%3Cpath d='M 0 0 L 40 0 L 40 40 C 20 40, 20 52, 0 52 Z' fill='black'/%3E%3C/svg%3E"), linear-gradient(black, black)`,
                 WebkitMaskPosition: 'left top, right top, 36px top',
                 WebkitMaskSize: '36px 52px, 40px 52px, calc(100% - 76px) 52px',
                 WebkitMaskRepeat: 'no-repeat, no-repeat, no-repeat',
               }}
             >
                <div className="absolute inset-0 opacity-[0.35] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E")' }} />
                <div className="absolute inset-x-0 bottom-0 h-[6px] bg-gradient-to-t from-white/15 to-transparent z-[1] mix-blend-overlay" />
             </div>

             {/* Tab Content */}
             <div className="relative pt-[8px] pl-[36px] pr-[44px] pb-[8px] flex gap-[8px] z-20 w-fit items-start h-[52px]">
               {workspaces.map(ws => (
                  <SkewTab 
                    key={ws.id} 
                    label={ws.name} 
                    active={activeWorkspaceId === ws.id} 
                    onClick={() => setActiveWorkspaceId(ws.id)} 
                    onClose={(e: any) => { e.stopPropagation(); closeWorkspace(ws.id); }} 
                  />
               ))}
               <SkewTab label="+" onClick={() => {
                   const nextId = (workspaces.length + 1).toString();
                   const newWorkspace: WorkspaceData = {
                       id: nextId,
                       name: `Tab ${nextId}`,
                       layers: [],
                       pastHistory: [],
                       futureHistory: [],
                       gridSettings: { ...defaultGridSettings },
                       isAutoGridActive: false,
                       isCustomGridActive: false,
                       canvasSize: { width: 1080, height: 720, ppi: 72 }
                   };
                   setWorkspaces([...workspaces, newWorkspace]);
                   setActiveWorkspaceId(nextId);
               }} />
             </div>
          </div>

          {/* Right Section (Fills remaining width) */}
          <div className="flex-1 relative h-[40px] pointer-events-auto">
             <div className="absolute inset-0 z-0 bg-[#9E86C8] rounded-r-[20px] overflow-hidden -ml-[1px]">
                 <div className="absolute inset-0 opacity-[0.35] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E")' }} />
                 <div className="absolute inset-x-0 bottom-0 h-[6px] bg-gradient-to-t from-white/15 to-transparent z-[1] mix-blend-overlay" />
             </div>
             
             {/* Right Content / Import Button */}
             <div className="absolute right-[8px] top-[6px] z-20 flex items-center">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.json" onChange={handleImport} />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="h-[28px] px-4 bg-[#0F80FF] hover:bg-[#348CFF] text-white font-[800] text-[12px] rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_2px_6px_rgba(15,128,255,0.4)] flex items-center gap-1.5 border border-[#6BB0FF]/40 transition-[transform,background-color] hover:scale-105 active:scale-95"
                >
                  <Plus size={14} strokeWidth={3} /> Import
                </button>
             </div>
          </div>
        </div>

        {/* --- 2. TOP FLOATING DOCK MODE BAR --- */}
        <div className="absolute top-[68px] left-1/2 -translate-x-1/2 h-[44px] px-[24px] bg-gradient-to-b from-[#6D727F] to-[#515764] rounded-[14px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_16px_32px_-4px_rgba(0,0,0,0.4),0_6px_12px_-2px_rgba(0,0,0,0.25)] flex items-center gap-6 z-20 border border-[#484E5A] border-t-[#7F8694] text-white">
          <div className="flex items-center gap-4">
            <div 
              className={`flex items-center justify-center w-[16px] cursor-pointer transition-opacity duration-300 ${appMode === 'vector' ? 'opacity-40 hover:opacity-70' : 'opacity-100'}`}
              onClick={() => handleModeSwitch('pixel')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="2" width="4" height="4" />
                <rect x="10" y="2" width="4" height="4" />
                <rect x="18" y="2" width="4" height="4" />

                <rect x="6" y="6" width="4" height="4" />
                <rect x="14" y="6" width="4" height="4" />
                <rect x="22" y="6" width="4" height="4" />

                <rect x="2" y="10" width="4" height="4" />
                <rect x="10" y="10" width="4" height="4" />
                <rect x="18" y="10" width="4" height="4" />

                <rect x="6" y="14" width="4" height="4" />
                <rect x="14" y="14" width="4" height="4" />
                <rect x="22" y="14" width="4" height="4" />
                
                <rect x="2" y="18" width="4" height="4" />
                <rect x="10" y="18" width="4" height="4" />
                <rect x="18" y="18" width="4" height="4" />
              </svg>
            </div>
            
            <div 
              className="w-[32px] h-[16px] rounded-full relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] cursor-pointer transition-colors duration-300 border border-black/30 flex items-center px-[2px] bg-black/20 hover:bg-black/30"
              onClick={() => handleModeSwitch(appMode === 'vector' ? 'pixel' : 'vector')}
            >
              <div 
                className={`w-[10px] h-[10px] rounded-full bg-gradient-to-b from-[#FFFFFF] to-[#E0E0E0] shadow-[0_1px_2px_rgba(0,0,0,0.4)] transition-transform duration-300 ease-in-out border border-black/10 ${appMode === 'vector' ? 'translate-x-[16px]' : 'translate-x-0'}`}
              />
            </div>

            <div 
              className={`flex items-center justify-center w-[16px] cursor-pointer transition-opacity duration-300 ${appMode === 'vector' ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
              onClick={() => handleModeSwitch('vector')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M 4 18 Q 12 2 20 18" strokeWidth="2.5" />
                <path d="M 8 10 L 16 10" strokeWidth="2.5" />
                <circle cx="8" cy="10" r="1.5" fill="white" />
                <circle cx="16" cy="10" r="1.5" fill="white" />
                <rect x="2.5" y="16.5" width="4" height="4" rx="0.5" fill="#4B515E" stroke="white" strokeWidth="2" />
                <rect x="17.5" y="16.5" width="4" height="4" rx="0.5" fill="#4B515E" stroke="white" strokeWidth="2" />
                <rect x="10.5" y="8.5" width="4" height="4" rx="0.5" fill="#4B515E" stroke="white" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <div className="w-[1px] h-[16px] bg-white/10 shadow-[1px_0_0_rgba(0,0,0,0.1)]" />

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center gap-[2px] cursor-pointer group relative">
              <div className="flex flex-col items-center gap-[2px]" onClick={() => setIsCanvasSettingsOpen(p => !p)}>
                 <span className="text-[7.5px] uppercase tracking-widest font-[800] text-[#D2D4D9] group-hover:text-white transition-colors">Canvas</span>
                 <div className="w-[18px] h-[12px] border-[1.5px] border-[#D2D4D9] group-hover:border-white rounded-[3px] border-dashed transition-colors" />
              </div>
              {isCanvasSettingsOpen && (
                 <CanvasSettingsPopover 
                   size={canvasSize} 
                   onChange={(newSize: any) => updateActiveWorkspace({ canvasSize: newSize })} 
                   onClose={() => setIsCanvasSettingsOpen(false)} 
                 />
              )}
            </div>
            <div className="flex flex-col items-center gap-[2px] cursor-pointer group relative">
              <div className="flex flex-col items-center gap-[2px]" onClick={() => setIsGridSettingsOpen(p => !p)}>
                <span className="text-[7.5px] uppercase tracking-widest font-[800] text-[#D2D4D9] group-hover:text-white transition-colors">Grid</span>
                <Grid size={14} strokeWidth={2.5} className="text-[#D2D4D9] group-hover:text-white transition-colors"/>
              </div>
              {isGridSettingsOpen && (
                 <GridSettingsPopover 
                   settings={gridSettings}
                   onChange={setGridSettings}
                   onClose={() => setIsGridSettingsOpen(false)}
                 />
              )}
            </div>
            <div className="flex flex-col items-center gap-[2px] cursor-pointer group relative">
              <div className="flex flex-col items-center gap-[2px]" onClick={() => setIsRatioSettingsOpen(p => !p)}>
                <span className="text-[7.5px] uppercase tracking-widest font-[800] text-[#D2D4D9] group-hover:text-white transition-colors">Ratio</span>
                <Maximize size={14} strokeWidth={2.5} className="text-[#D2D4D9] group-hover:text-white transition-colors"/>
              </div>
              {isRatioSettingsOpen && (
                 <RatioSettingsPopover 
                   onChange={(newSize: any) => updateActiveWorkspace({ canvasSize: newSize })} 
                   onClose={() => setIsRatioSettingsOpen(false)} 
                 />
              )}
            </div>
          </div>
        </div>

        {/* --- 4. RIGHT UTILITY COLUMNS --- */}
        <div className="absolute top-[80px] right-6 flex flex-col gap-[14px] z-30">
          <UtilityBtn icon={ZoomIn} onClick={() => setZoomScale(s => Math.min(3.0, s + 0.1))} />
          <UtilityBtn icon={ZoomOut} onClick={() => setZoomScale(s => Math.max(0.2, s - 0.1))} />
          <UtilityBtn icon={Undo} onClick={handleUndo} />
          <UtilityBtn icon={Redo} onClick={handleRedo} />
        </div>

        {/* --- 4. RIGHT PANELS AND CONTROLS --- */}
        <motion.div
          initial={false}
          animate={{ x: activeRightPanel ? 0 : 284 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className="absolute right-[-2px] bottom-[30px] flex items-end z-50 filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.15)]"
        >
          {/* TABS CONTAINER */}
          <div className="flex flex-col gap-[14px] -mr-[6px] pb-[40px] relative z-[-1]">
            <div 
              onClick={() => handleRightTabClick('export')} 
              className={`bg-[#586071] border-[4px] border-r-0 border-white/20 rounded-l-2xl w-[52px] h-[64px] flex items-center justify-center cursor-pointer transition-colors relative shadow-[-4px_0_15px_rgba(0,0,0,0.1)] group ${activeRightPanel === 'export' ? 'bg-[#586071]' : 'hover:bg-[#4d5463]'}`}
            >
              <Share size={24} strokeWidth={2.5} className="text-white group-hover:scale-105 transition-transform" />
            </div>
            <div 
              onClick={() => handleRightTabClick('color')} 
              className={`bg-[#586071] border-[4px] border-r-0 border-white/20 rounded-l-2xl w-[52px] h-[64px] flex items-center justify-center cursor-pointer transition-colors relative shadow-[-4px_0_15px_rgba(0,0,0,0.1)] group ${activeRightPanel === 'color' ? 'bg-[#586071]' : 'hover:bg-[#4d5463]'}`}
            >
              <Palette size={24} strokeWidth={2.5} className="text-white group-hover:scale-105 transition-transform" />
            </div>
            <div 
              onClick={() => handleRightTabClick('layers')} 
              className={`bg-[#586071] border-[4px] border-r-0 border-white/20 rounded-l-2xl w-[52px] h-[64px] flex items-center justify-center cursor-pointer transition-colors relative shadow-[-4px_0_15px_rgba(0,0,0,0.1)] group ${activeRightPanel === 'layers' ? 'bg-[#586071]' : 'hover:bg-[#4d5463]'}`}
            >
              <Layers size={24} strokeWidth={2.5} className="text-white group-hover:scale-105 transition-transform" />
            </div>
          </div>

          {/* PANEL CONTAINER */}
          <div className="relative z-10 w-[280px]">
             <PanelShell activeType={renderedRightPanel}>
               {renderedRightPanel === 'export' && <ExportPanelContent onExport={handleExport} previewDataUrl={previewDataUrl} />}
               {renderedRightPanel === 'color' && <ColorPanelContent brushSettings={brushSettings} setBrushSettings={setBrushSettings} />}
               {renderedRightPanel === 'layers' && <LayersPanelContent layers={layers} setLayers={setLayers} activeLayerId={activeLayerId} setActiveLayerId={setActiveLayerId} selectedLayerIds={selectedLayerIds} setSelectedLayerIds={setSelectedLayerIds} />}
             </PanelShell>
          </div>
        </motion.div>

        {/* --- 5. BOTTOM COCKPIT DOCK --- */}
        <motion.div
          initial={false}
          animate={{ y: isBottomDockOpen ? 0 : 88 }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center drop-shadow-[0_-5px_20px_rgba(0,0,0,0.1)]"
        >
          <div 
            onClick={() => setIsBottomDockOpen(!isBottomDockOpen)}
            className="w-[200px] h-[32px] bg-[#CBEF5E] rounded-t-3xl cursor-pointer flex justify-center items-center hover:bg-[#D5F56D] transition-colors shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)] border border-[#b4d84a] border-b-0 group"
          >
            <motion.div animate={{ rotate: isBottomDockOpen ? 180 : 0 }} className="group-hover:scale-110 transition-transform">
              <ChevronUp className="text-[#586071]" size={24} strokeWidth={3}/>
            </motion.div>
          </div>
          
          <div className="h-[96px] bg-[#CBEF5E] px-8 py-4 rounded-t-[32px] shadow-[inset_0_2px_10px_rgba(255,255,255,0.4)] flex items-center gap-[40px] border border-[#A5C93A]/50 border-b-0 -mt-[1px] w-max">
            
            <div className="flex gap-[32px] pr-[32px] border-r-[2px] border-[#A5C93A]/40 items-center h-full">
              <div className="flex flex-col gap-[14px]">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => updateActiveWorkspace({ isAutoGridActive: !isAutoGrid })}>
                  <div className={`w-[44px] h-[22px] rounded-full relative shadow-inner border border-black/10 transition-colors ${isAutoGrid ? 'bg-[#0A7AFF]' : 'bg-[#64748B]'}`}>
                    <div className={`absolute top-[2px] w-[16px] h-[16px] rounded-full bg-white shadow-sm transition-all ${isAutoGrid ? 'right-[2px]' : 'left-[2px]'}`} />
                  </div>
                  <span className="text-[13px] font-bold text-[#4B5563] group-hover:text-black">Grille auto</span>
                </div>
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setIsSnap(!isSnap)}>
                  <div className={`w-[44px] h-[22px] rounded-full relative shadow-inner border border-black/10 transition-colors ${isSnap ? 'bg-[#0A7AFF]' : 'bg-[#64748B]'}`}>
                    <div className={`absolute top-[2px] w-[16px] h-[16px] rounded-full bg-white shadow-sm transition-all ${isSnap ? 'right-[2px]' : 'left-[2px]'}`} />
                  </div>
                  <span className="text-[13px] font-bold text-[#4B5563] group-hover:text-black">Snap</span>
                </div>
              </div>
              <div className="flex flex-col gap-[13px] text-[#4B5563] ml-2">
                <div className="flex items-center gap-[18px]">
                  <span className="text-[11px] font-extrabold w-[46px] text-right uppercase tracking-[0.08em]">Taille</span>
                  <CustomSlider min={1} max={50} value={brushSettings.size} onChange={(v: number) => setBrushSettings({...brushSettings, size: v})} />
                </div>
                <div className="flex items-center gap-[18px]">
                  <span className="text-[11px] font-extrabold w-[46px] text-right uppercase tracking-[0.08em]">Flow</span>
                  <CustomSlider min={1} max={100} value={brushSettings.flow} onChange={(v: number) => setBrushSettings({...brushSettings, flow: v})} />
                </div>
                <div className="flex items-center gap-[18px]">
                  <span className="text-[11px] font-extrabold w-[46px] text-right uppercase tracking-[0.08em]">Opacité</span>
                  {(()=>{
                    const displayOpacity = selectedLayerIds.length > 0 
                      ? (layers.find(l => l.id === selectedLayerIds[0])?.opacity ?? brushSettings.opacity)
                      : brushSettings.opacity;
                    
                    return <CustomSlider 
                      min={1} max={100} 
                      value={displayOpacity} 
                      onChange={(v: number) => {
                        if (selectedLayerIds.length > 0) {
                          setLayers((prev: any) => prev.map((ly: any) => selectedLayerIds.includes(ly.id) ? { ...ly, opacity: v } : ly), false);
                        } else {
                          setBrushSettings({...brushSettings, opacity: v});
                        }
                      }} 
                      onChangeEnd={() => {
                        if (selectedLayerIds.length > 0) {
                          setLayers((prev: any) => [...prev], true); // Trigger history save snapshot
                        }
                      }}
                    />
                  })()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[#586071] p-2 rounded-[20px] shadow-inner border border-white/10 relative">
              {[ 
                { id: 'pen', icon: PenTool }, 
                { id: 'select', icon: MousePointer2 }, 
                { id: 'fill', icon: PaintBucket }, 
                { id: 'boolean', icon: BooleanIcon }, 
                { id: 'brush', icon: Brush }, 
                { id: 'eraser', icon: Eraser } 
              ].map((tool, idx) => (
                <div key={idx} className="relative">
                  <div 
                    onClick={() => {
                      if (tool.id === 'boolean') {
                        setBooleanMenuOpen(p => !p);
                        setFillMenuOpen(false);
                      } else if (tool.id === 'fill') {
                        setFillMenuOpen(p => !p);
                        setBooleanMenuOpen(false);
                        if (activeTool !== 'bucket' && activeTool !== 'gradient') handleToolSelect('bucket');
                      } else {
                        handleToolSelect(tool.id as ToolType);
                        setBooleanMenuOpen(false);
                        setFillMenuOpen(false);
                      }
                      
                      if (tool.id !== 'pen' && penPath.length > 0) {
                         setPenPath([]);
                      }
                    }}
                    className={`w-[52px] h-[48px] flex items-center justify-center rounded-[14px] cursor-pointer transition-all duration-200 ${
                      (activeTool === tool.id || (tool.id === 'fill' && (activeTool === 'bucket' || activeTool === 'gradient')))
                        ? 'bg-white text-[#4A5162] shadow-[0_4px_10px_rgba(0,0,0,0.15)] transform scale-[1.02]' 
                        : 'text-white/70 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    <tool.icon size={22} strokeWidth={2.5}/>
                  </div>
                  
                  {/* Floating Boolean Menu Dropdown */}
                  {tool.id === 'boolean' && booleanMenuOpen && (
                    <div className="absolute bottom-[64px] left-1/2 -translate-x-1/2 bg-[#586071] rounded-2xl p-2 flex flex-col gap-1 border border-white/20 shadow-[0_12px_30px_rgba(0,0,0,0.35)] z-[100] w-[140px] ">
                      {['Union', 'Subtract', 'Intersect', 'Exclude'].map(op => (
                        <div key={op} onClick={(e) => { e.stopPropagation(); handleBooleanOp(op); }} className="px-3 py-2 rounded-lg text-white/80 hover:bg-white/15 hover:text-white cursor-pointer text-[12px] font-extrabold text-center transition-colors">
                          {op}
                        </div>
                      ))}
                      <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#586071] rotate-45 border-b border-r border-white/20" />
                    </div>
                  )}

                  {/* Floating Fill Menu Dropdown */}
                  {tool.id === 'fill' && fillMenuOpen && (
                    <div className="absolute bottom-[64px] left-1/2 -translate-x-1/2 bg-[#586071] rounded-2xl p-2 flex flex-col gap-1 border border-white/20 shadow-[0_12px_30px_rgba(0,0,0,0.35)] z-[100] w-[160px] ">
                      <div onClick={(e) => { e.stopPropagation(); handleToolSelect('bucket'); setFillMenuOpen(false); }} className={`px-3 py-2 rounded-lg cursor-pointer text-[12px] font-extrabold text-center transition-colors ${activeTool === 'bucket' ? 'bg-[#0A7AFF] text-white' : 'text-white/80 hover:bg-white/15 hover:text-white'}`}>
                        Paint Bucket
                      </div>
                      <div onClick={(e) => { e.stopPropagation(); handleToolSelect('gradient'); setFillMenuOpen(false); }} className={`px-3 py-2 rounded-lg cursor-pointer text-[12px] font-extrabold text-center transition-colors ${activeTool === 'gradient' ? 'bg-[#0A7AFF] text-white' : 'text-white/80 hover:bg-white/15 hover:text-white'}`}>
                        Gradient Tool
                      </div>
                      <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#586071] rotate-45 border-b border-r border-white/20" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pl-4">
              <button 
                onClick={() => setLayers([], true)}
                className="h-[48px] px-8 rounded-2xl bg-gradient-to-b from-[#ffffff] to-[#e2e8f0] text-[#64748B] font-extrabold text-[13px] shadow-[0_6px_15px_rgba(0,0,0,0.08),inset_0_2px_0_rgba(255,255,255,1)] flex items-center gap-2.5 hover:to-[#cbd5e1] transition-colors border border-gray-200 active:translate-y-[1px]"
              >
                <RotateCcw size={18} strokeWidth={3} /> Reset
              </button>
            </div>
          </div>
        </motion.div>

        {/* --- 6. CONTEXTUAL TOOLTIP OVERLAY --- */}
        <motion.div 
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: isTooltipVisible ? 1 : 0, y: isTooltipVisible ? 0 : 10, scale: isTooltipVisible ? 1 : 0.95 }}
          className="absolute bottom-8 left-8 z-[60] pointer-events-none drop-shadow-xl"
        >
          <div className="bg-[#EAEBEE] p-5 rounded-[24px] rounded-bl-[4px] shadow-inner border border-white/50 max-w-[280px]">
            <div className="font-extrabold text-[#4B5563] text-[13px] mb-2 tracking-wide uppercase">QUICK TIPS</div>
            <div className="text-[12px] text-[#6B7280] leading-relaxed font-medium space-y-2">
               <p>• Pan Canvas: Hold the <strong className="font-bold text-[#4B5563]">[ H ]</strong> key or press down the Middle Mouse Button (scroll wheel click) to drag and navigate freely across your project.</p>
               <p>• Smart Toggle: Use the floating Pixel / Vector switch to jump instantly between your painting Brush and vector Pen tools.</p>
            </div>
          </div>
        </motion.div>

        {/* Tooltip Hover Trigger Icon */}
        <div 
          className="absolute bottom-6 left-6 z-[60] w-10 h-10 bg-[#EAEBEE] rounded-full flex items-center justify-center shadow-lg border border-white/50 cursor-help" 
          onMouseEnter={() => setIsTooltipVisible(true)} 
          onMouseLeave={() => setIsTooltipVisible(false)}
        >
          <MessageCircleQuestion size={20} className="text-[#6B7280]"/>
        </div>

      </div>
    </div>
  );
}
