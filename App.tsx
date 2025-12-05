import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './components/Icon';
import { generateProductVariation } from './services/geminiService';
import { AuthService } from './services/authService';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { GeneratedImage, StylePreset, User } from './types';

// Constants
const PRESETS: StylePreset[] = [
  {
    id: 'amazon',
    label: 'Amazon White',
    description: 'Pure white background compliant with e-commerce standards.',
    promptSuffix: 'Place the product on a pure solid white background (RGB 255, 255, 255). Ensure professional studio lighting, sharp focus, and remove any original background artifacts. The product should look like a standard Amazon listing photo.',
    icon: 'ShoppingCart'
  },
  {
    id: 'lifestyle',
    label: 'Cozy Lifestyle',
    description: 'In a warm, home environment.',
    promptSuffix: 'Place this product in a cozy, modern living room setting. Soft, warm lighting, shallow depth of field (bokeh) background. Make it look like a high-quality lifestyle Instagram photo.',
    icon: 'Sun'
  },
  {
    id: 'luxury',
    label: 'Luxury Studio',
    description: 'Dark, dramatic, and premium.',
    promptSuffix: 'Place the product on a sleek, reflective black surface. Use dramatic rim lighting and cool tones to convey luxury and elegance. High contrast professional product photography.',
    icon: 'Camera'
  },
  {
    id: 'nature',
    label: 'Nature/Outdoor',
    description: 'Fresh, organic outdoor setting.',
    promptSuffix: 'Place the product outdoors on a rustic wooden table with sunlight filtering through green leaves. Natural, organic, fresh vibe. Bright and airy.',
    icon: 'Image'
  },
  {
    id: 'minimal',
    label: 'Pastel Minimal',
    description: 'Clean geometry with soft colors.',
    promptSuffix: 'Place the product on a geometric podium with a soft pastel colored background (light blue or pink). Minimalist design, soft shadows, 3D render aesthetic.',
    icon: 'Box'
  }
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'app' | 'admin'>('app');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // App State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    AuthService.initialize();
    const user = AuthService.getCurrentUser();
    setCurrentUser(user);
    setIsLoadingAuth(false);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setView('app');
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setGeneratedImages([]);
    setSelectedImage(null);
  };

  // Handle File Upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setGeneratedImages([]); // Reset previous generations
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    setSelectedImage(null);
    setGeneratedImages([]);
    setCustomPrompt('');
  };

  // Generation Logic
  const handleGenerateBatch = async () => {
    if (!selectedImage || !currentUser) return;

    if (!AuthService.checkLimit(currentUser)) {
      alert("You have reached your daily limit of 5 uploads/generations. Please contact admin for more access.");
      return;
    }

    setIsGenerating(true);
    
    // Increment usage immediately for the batch attempt
    AuthService.incrementUsage(currentUser.id);
    setCurrentUser(AuthService.getCurrentUser()); // Refresh local state

    const placeholderIds = PRESETS.map(p => p.id);
    const initialLoadState = placeholderIds.reduce((acc, id) => ({ ...acc, [id]: true }), {});
    setLoadingStates(initialLoadState);

    try {
      const promises = PRESETS.map(async (preset) => {
        try {
          const resultBase64 = await generateProductVariation(selectedImage, preset.promptSuffix);
          
          const newImg: GeneratedImage = {
            id: crypto.randomUUID(),
            url: resultBase64,
            prompt: preset.label,
            category: preset.id,
            timestamp: Date.now()
          };

          setGeneratedImages(prev => [...prev, newImg]);
        } catch (error) {
          console.error(`Failed to generate ${preset.label}`, error);
        } finally {
          setLoadingStates(prev => ({ ...prev, [preset.id]: false }));
        }
      });

      await Promise.all(promises);
    } catch (error) {
      console.error("Batch generation error", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomGenerate = async () => {
    if (!selectedImage || !customPrompt.trim() || !currentUser) return;

    if (!AuthService.checkLimit(currentUser)) {
      alert("You have reached your daily limit. Please contact admin for more access.");
      return;
    }

    const id = 'custom-' + Date.now();
    setIsGenerating(true);
    setLoadingStates(prev => ({ ...prev, [id]: true }));

    // Increment usage
    AuthService.incrementUsage(currentUser.id);
    setCurrentUser(AuthService.getCurrentUser());

    try {
      const resultBase64 = await generateProductVariation(selectedImage, customPrompt);
      const newImg: GeneratedImage = {
        id: crypto.randomUUID(),
        url: resultBase64,
        prompt: customPrompt,
        category: 'custom',
        timestamp: Date.now()
      };
      setGeneratedImages(prev => [newImg, ...prev]);
    } catch (error) {
      console.error("Custom generation error", error);
      alert("Failed to generate custom image. Please try again.");
    } finally {
      setLoadingStates(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      setIsGenerating(false);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoadingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>;
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('app')}>
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Icons.Wand2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              EcomLens AI
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {currentUser.role === 'admin' && (
              <button 
                onClick={() => setView(view === 'app' ? 'admin' : 'app')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  view === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {view === 'admin' ? <Icons.Image className="w-4 h-4"/> : <Icons.LayoutDashboard className="w-4 h-4" />}
                {view === 'admin' ? 'Back to App' : 'Admin Dashboard'}
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
               <span className="text-xs text-slate-500 font-medium">Credits:</span>
               <span className={`text-xs font-bold ${currentUser.creditsUsed >= currentUser.maxCredits ? 'text-red-500' : 'text-indigo-600'}`}>
                 {currentUser.creditsUsed} / {currentUser.maxCredits}
               </span>
            </div>
            
            <button 
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <Icons.LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'admin' ? (
          <AdminDashboard />
        ) : (
          /* Main App View */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Input Area */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Upload Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Icons.Upload className="w-4 h-4 text-indigo-500" />
                    Source Product
                  </h2>
                  {selectedImage && (
                    <button 
                      onClick={clearImage}
                      className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      <Icons.Trash2 className="w-3 h-3" />
                      Reset
                    </button>
                  )}
                </div>

                <div className="p-6">
                  {!selectedImage ? (
                    <div 
                      onClick={triggerFileUpload}
                      className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group h-80"
                    >
                      <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Icons.Image className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-700 mb-1">Upload Product Photo</h3>
                      <p className="text-sm text-slate-500 max-w-xs">
                        Drag & drop or click to browse. Best results with clear lighting.
                      </p>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="relative group rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img 
                        src={selectedImage} 
                        alt="Original product" 
                        className="w-full h-auto object-contain max-h-[400px]"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={triggerFileUpload}
                          className="bg-white/90 text-slate-800 px-4 py-2 rounded-lg font-medium shadow-lg hover:bg-white transform translate-y-2 group-hover:translate-y-0 transition-all"
                        >
                          Change Image
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Controls */}
              {selectedImage && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1">
                  <div className="flex p-1 gap-1 bg-slate-100/50 rounded-xl mb-4">
                    <button
                      onClick={() => setActiveTab('presets')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'presets' 
                          ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' 
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                      }`}
                    >
                      Auto Variations
                    </button>
                    <button
                      onClick={() => setActiveTab('custom')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'custom' 
                          ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' 
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                      }`}
                    >
                      Custom Prompt
                    </button>
                  </div>

                  <div className="px-4 pb-4">
                    {activeTab === 'presets' ? (
                      <div className="space-y-4">
                        <p className="text-sm text-slate-600">
                          Generate 5 standardized marketing assets instantly. Best for e-commerce listings.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {PRESETS.map(preset => (
                            <div key={preset.id} className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                              {preset.label}
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={handleGenerateBatch}
                          disabled={isGenerating || currentUser.creditsUsed >= currentUser.maxCredits}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-medium shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                          {isGenerating ? (
                            <>
                              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing Batch...
                            </>
                          ) : currentUser.creditsUsed >= currentUser.maxCredits ? (
                            <>
                              <Icons.Lock className="w-5 h-5" />
                              Daily Limit Reached
                            </>
                          ) : (
                            <>
                              <Icons.Sparkles className="w-5 h-5" />
                              Generate All 5 Styles
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Describe your edit
                          </label>
                          <textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="E.g., 'Place product on a marble table with morning sunlight' or 'Add a vintage film filter'"
                            className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px] text-sm resize-none"
                          />
                        </div>
                        <button
                          onClick={handleCustomGenerate}
                          disabled={isGenerating || !customPrompt.trim() || currentUser.creditsUsed >= currentUser.maxCredits}
                          className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-medium shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                          {isGenerating ? 'Generating...' : currentUser.creditsUsed >= currentUser.maxCredits ? (
                            <>Daily Limit Reached</>
                          ) : (
                            <>
                              <Icons.Wand2 className="w-4 h-4" />
                              Generate Custom
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Results Area */}
            <div className="lg:col-span-7">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-800">Generated Assets</h2>
                {generatedImages.length > 0 && (
                   <span className="text-sm text-slate-500">{generatedImages.length} items ready</span>
                )}
              </div>

              {!selectedImage ? (
                 <div className="h-full min-h-[400px] rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-8">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <Icons.Layers className="w-8 h-8 text-slate-300" />
                    </div>
                    <p>Upload an image to start generating</p>
                 </div>
              ) : (
                <div className="space-y-8">
                  {/* Active Loading States Grid */}
                  {Object.values(loadingStates).some(Boolean) && (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                       {Object.entries(loadingStates).filter(([, isLoading]) => isLoading).map(([key]) => (
                         <div key={key} className="aspect-square rounded-xl bg-white border border-slate-200 shadow-sm p-4 flex flex-col items-center justify-center animate-pulse">
                           <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center mb-3">
                             <Icons.Sparkles className="w-6 h-6 animate-spin" />
                           </div>
                           <p className="text-sm font-medium text-slate-500">Generating AI Art...</p>
                           <p className="text-xs text-slate-400 mt-1">Applying style & lighting</p>
                         </div>
                       ))}
                     </div>
                  )}

                  {/* Results Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {generatedImages.map((image) => (
                      <div key={image.id} className="group relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                        {/* Header/Label */}
                        <div className="absolute top-3 left-3 z-10">
                          <span className="bg-white/90 backdrop-blur-sm text-xs font-semibold px-2 py-1 rounded-md shadow-sm border border-white/20 text-slate-800">
                            {image.category === 'custom' ? 'Custom Edit' : image.prompt}
                          </span>
                        </div>

                        {/* Image */}
                        <div className="aspect-square bg-slate-100 relative overflow-hidden">
                          <img 
                            src={image.url} 
                            alt={image.prompt} 
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                          />
                          
                          {/* Overlay Actions */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end justify-between p-4 opacity-0 group-hover:opacity-100">
                            <button 
                              onClick={() => downloadImage(image.url, `ecomlens-${image.category}.png`)}
                              className="bg-white text-slate-900 px-3 py-2 rounded-lg text-sm font-medium shadow-lg hover:bg-slate-50 flex items-center gap-2 w-full justify-center transform translate-y-2 group-hover:translate-y-0 transition-all"
                            >
                              <Icons.Download className="w-4 h-4" />
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {generatedImages.length === 0 && !Object.values(loadingStates).some(Boolean) && (
                     <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-slate-500">No images generated yet.</p>
                        <button onClick={() => setActiveTab('presets')} className="text-indigo-600 font-medium text-sm mt-2 hover:underline">
                          Try the Auto Variations preset
                        </button>
                     </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
