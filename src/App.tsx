import { useState, FormEvent, useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'motion/react';
import { Youtube, Instagram, Music, Video, Download, Loader2, AlertCircle, CheckCircle2, ArrowRight, Link, Settings2, DownloadCloud, Sparkles } from 'lucide-react';

function ScrollReveal({ children, delay = 0 }: { children: ReactNode, delay?: number }) {
  const { scrollY } = useScroll();
  const [direction, setDirection] = useState(1);
  const ref = useRef<HTMLDivElement>(null);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous) {
      setDirection(1); // scrolling down
    } else if (latest < previous) {
      setDirection(-1); // scrolling up
    }
  });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, margin: "-10%" }}
      variants={{
        hidden: { opacity: 0, y: direction === 1 ? 50 : -50 },
        visible: { 
          opacity: 1, 
          y: 0, 
          transition: { type: "spring", bounce: 0.5, duration: 0.8, delay } 
        }
      }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const [platform, setPlatform] = useState<'youtube' | 'instagram'>('youtube');
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp3');
  const [audioQuality, setAudioQuality] = useState('mp3'); // mp3 (high), aac (low)
  const [videoQuality, setVideoQuality] = useState('1080'); // 144, 360, 480, 720, 1080, 1440, 4k, 8k
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleConvert = async (e: FormEvent) => {
    e.preventDefault();
    
    // Robust URL validation based on platform
    if (platform === 'youtube') {
      const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
      if (!url || !ytRegex.test(url)) {
        setError('Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=...)');
        return;
      }
    } else {
      const igRegex = /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel|tv)\/.+$/;
      if (!url || !igRegex.test(url)) {
        setError('Please enter a valid Instagram URL (e.g., https://www.instagram.com/p/...)');
        return;
      }
    }
    
    setLoading(true);
    setError('');
    setResult(null);

    const quality = format === 'mp3' ? audioQuality : videoQuality;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout

    try {
      const res = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, format, quality, platform }),
        signal: controller.signal
      });
      
      const data = await res.json().catch(() => null);
      
      if (!res.ok) {
        throw new Error(data?.error || `Server error: ${res.status} ${res.statusText}`);
      }
      
      if (!data) {
        throw new Error('Received an invalid response from the server.');
      }
      
      setResult(data);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('The conversion took too long. Please try again later.');
      } else if (!navigator.onLine) {
        setError('You are offline. Please check your internet connection.');
      } else {
        setError(err.message || 'An unexpected error occurred while connecting to the server.');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-yellow-500/30">
      {/* Background effects */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-yellow-600/20 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-orange-600/20 blur-[140px]" />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-amber-600/10 blur-[100px]" />
      </div>

      <main className="relative z-10 container mx-auto px-4 py-20 max-w-3xl">
        <ScrollReveal>
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-4 bg-zinc-900/80 rounded-2xl border border-zinc-800 mb-6 shadow-[0_0_30px_rgba(234,179,8,0.3)] backdrop-blur-xl">
              <Youtube className="w-10 h-10 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]" />
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              Media Converter Pro
            </h1>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto font-medium">
              Transform YouTube and Instagram videos into high-quality MP3 or MP4 files instantly. 
              Fast, secure, and professional.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="bg-zinc-900/40 backdrop-blur-2xl border border-zinc-800/80 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-orange-500/5 pointer-events-none" />
          <form onSubmit={handleConvert} className="space-y-6 relative z-10">
            
            {/* Platform Toggle */}
            <div className="flex p-1 bg-zinc-950/80 border border-zinc-800 rounded-xl">
              <button
                type="button"
                onClick={() => { setPlatform('youtube'); setUrl(''); setError(''); setResult(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  platform === 'youtube'
                    ? 'bg-zinc-800 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <Youtube className={`w-5 h-5 ${platform === 'youtube' ? 'text-red-500' : ''}`} />
                YouTube
              </button>
              <button
                type="button"
                onClick={() => { setPlatform('instagram'); setUrl(''); setError(''); setResult(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  platform === 'instagram'
                    ? 'bg-zinc-800 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <Instagram className={`w-5 h-5 ${platform === 'instagram' ? 'text-pink-500' : ''}`} />
                Instagram
              </button>
            </div>

            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-semibold text-zinc-300 ml-1 uppercase tracking-wider">
                {platform === 'youtube' ? 'YouTube Video URL' : 'Instagram Post/Reel URL'}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {platform === 'youtube' ? (
                    <Youtube className="h-5 w-5 text-zinc-500 group-focus-within:text-yellow-400 transition-colors" />
                  ) : (
                    <Instagram className="h-5 w-5 text-zinc-500 group-focus-within:text-pink-400 transition-colors" />
                  )}
                </div>
                <input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={platform === 'youtube' ? "https://www.youtube.com/watch?v=..." : "https://www.instagram.com/p/..."}
                  className="w-full bg-zinc-950/80 border border-zinc-800 text-white rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all placeholder:text-zinc-600 shadow-inner"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormat('mp3')}
                className={`flex items-center justify-center gap-2 py-4 rounded-xl border transition-all duration-300 ${
                  format === 'mp3' 
                    ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50 text-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.2)]' 
                    : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <Music className={`w-5 h-5 ${format === 'mp3' ? 'drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]' : ''}`} />
                <span className="font-semibold tracking-wide">Audio (MP3)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('mp4')}
                className={`flex items-center justify-center gap-2 py-4 rounded-xl border transition-all duration-300 ${
                  format === 'mp4' 
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]' 
                    : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <Video className={`w-5 h-5 ${format === 'mp4' ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]' : ''}`} />
                <span className="font-semibold tracking-wide">Video (MP4)</span>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {format === 'mp3' && platform === 'youtube' && (
                <motion.div
                  key="mp3-options"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <label className="text-sm font-semibold text-zinc-300 ml-1 uppercase tracking-wider">
                    Audio Quality
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['mp3', 'aac'].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setAudioQuality(q)}
                        className={`py-3 rounded-xl border transition-all duration-300 font-medium ${
                          audioQuality === q
                            ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.15)]'
                            : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300'
                        }`}
                      >
                        {q === 'mp3' ? 'High Bitrate (MP3)' : 'Low Bitrate (AAC)'}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {format === 'mp4' && platform === 'youtube' && (
                <motion.div
                  key="mp4-options"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <label className="text-sm font-semibold text-zinc-300 ml-1 uppercase tracking-wider">
                    Video Resolution
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['144', '360', '480', '720', '1080', '1440', '4k', '8k'].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setVideoQuality(q)}
                        className={`py-2 rounded-lg border transition-all duration-300 font-medium text-sm ${
                          videoQuality === q
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                            : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300'
                        }`}
                      >
                        {q === '1440' ? '1440p' : q === '4k' ? '4K' : q === '8k' ? '8K' : `${q}p`}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading || !url}
              className="w-full relative group overflow-hidden bg-zinc-100 text-black disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
            >
              {!loading && !(!url) && (
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}
              <div className={`relative flex items-center gap-2 ${!loading && !(!url) ? 'group-hover:text-white' : ''} transition-colors z-10`}>
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Convert Now
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </div>
            </button>
          </form>
        </div>
        </ScrollReveal>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error-state"
              initial={{ opacity: 0, height: 0, y: 20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
              className="mt-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}

          {loading && (
            <motion.div
              key="loading-state"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
              className="mt-8 bg-zinc-900/60 backdrop-blur-2xl border border-zinc-800/80 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)] relative p-8 text-center"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-amber-500/5 to-orange-500/5 pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative bg-zinc-900 border border-zinc-700 p-4 rounded-2xl shadow-xl">
                    <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 tracking-wide">Processing Media</h3>
                <p className="text-zinc-400 max-w-md mx-auto mb-8">
                  Extracting the highest quality streams from {platform === 'youtube' ? 'YouTube' : 'Instagram'}. This usually takes 10-30 seconds depending on the file size.
                </p>
                <div className="w-full max-w-md mx-auto bg-zinc-950/80 rounded-full h-3 border border-zinc-800 overflow-hidden relative">
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.8)]"
                    initial={{ width: "0%" }}
                    animate={{ width: "90%" }}
                    transition={{ duration: 20, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {result && !loading && (
            <motion.div
              key="result-state"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
              className="mt-8 bg-zinc-900/60 backdrop-blur-2xl border border-zinc-800/80 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)] relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-amber-500/5 to-orange-500/5 pointer-events-none" />
              <div className="h-1.5 w-full bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
              <div className="p-6 md:p-8 relative z-10">
                {result.simulated && (
                  <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                    <div className="text-sm">
                      <p className="font-bold tracking-wide mb-1 uppercase">Demo Mode Active</p>
                      <p className="opacity-90">{result.message}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                  <div className="w-full md:w-56 shrink-0 rounded-2xl overflow-hidden border border-zinc-700/50 aspect-video md:aspect-auto shadow-[0_0_20px_rgba(0,0,0,0.5)] relative group">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    <img 
                      src={result.thumbnail} 
                      alt="Video thumbnail" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  
                  <div className="flex-1 text-center md:text-left w-full flex flex-col justify-center">
                    <div className="flex items-center justify-center md:justify-start gap-2 text-yellow-400 mb-3">
                      <CheckCircle2 className="w-5 h-5 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
                      <span className="text-sm font-bold uppercase tracking-widest">Ready to Download</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3 line-clamp-2 drop-shadow-md">
                      {result.title}
                    </h3>
                    <div className="flex items-center justify-center md:justify-start gap-3 text-zinc-400 text-sm mb-6">
                      <span className="uppercase bg-zinc-800/80 border border-zinc-700 px-3 py-1.5 rounded-lg font-semibold tracking-wider shadow-inner">{result.format}</span>
                    </div>
                    
                    <a
                      href={result.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full md:w-auto items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] hover:-translate-y-0.5"
                    >
                      <Download className="w-6 h-6" />
                      Download File
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* How to Use Section */}
        <ScrollReveal delay={0.2}>
          <div className="mt-24 mb-12">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold uppercase tracking-widest mb-4">
                <Sparkles className="w-4 h-4" />
                How It Works
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Three Simple Steps</h2>
              <p className="text-zinc-400">Download any video or audio in seconds without installing software.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 rounded-3xl p-8 relative overflow-hidden group hover:bg-zinc-900/60 transition-colors duration-500">
                <div className="absolute -top-6 -right-6 text-9xl font-black text-white/[0.03] group-hover:text-yellow-500/[0.05] transition-colors duration-500 pointer-events-none">1</div>
                <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:border-yellow-500/50 transition-colors duration-500">
                  <Link className="w-7 h-7 text-yellow-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Copy the URL</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">Find your favorite video on YouTube, copy its link from the address bar or share menu, and paste it into our converter.</p>
              </div>

              {/* Step 2 */}
              <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 rounded-3xl p-8 relative overflow-hidden group hover:bg-zinc-900/60 transition-colors duration-500">
                <div className="absolute -top-6 -right-6 text-9xl font-black text-white/[0.03] group-hover:text-amber-500/[0.05] transition-colors duration-500 pointer-events-none">2</div>
                <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:border-amber-500/50 transition-colors duration-500">
                  <Settings2 className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Choose Quality</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">Select your desired format (MP3 or MP4) and pick the perfect quality, ranging from low bitrate audio up to stunning 8K video.</p>
              </div>

              {/* Step 3 */}
              <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 rounded-3xl p-8 relative overflow-hidden group hover:bg-zinc-900/60 transition-colors duration-500">
                <div className="absolute -top-6 -right-6 text-9xl font-black text-white/[0.03] group-hover:text-orange-500/[0.05] transition-colors duration-500 pointer-events-none">3</div>
                <div className="w-14 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:border-orange-500/50 transition-colors duration-500">
                  <DownloadCloud className="w-7 h-7 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Download File</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">Click convert and wait a few moments for our servers to process the media. Once ready, hit download and enjoy!</p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </main>
    </div>
  );
}
