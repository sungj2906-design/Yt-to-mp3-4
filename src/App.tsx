import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Youtube, Music, Video, Download, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function App() {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp3');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleConvert = async (e: FormEvent) => {
    e.preventDefault();
    if (!url) {
      setError('Please enter a valid YouTube URL');
      return;
    }
    
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, format })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-violet-500/30">
      {/* Background effects */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-rose-900/10 blur-[120px]" />
      </div>

      <main className="relative z-10 container mx-auto px-4 py-20 max-w-3xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-3 bg-zinc-900/50 rounded-2xl border border-zinc-800 mb-6 shadow-xl">
            <Youtube className="w-8 h-8 text-rose-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
            YT Converter Pro
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Transform YouTube videos into high-quality MP3 or MP4 files instantly. 
            Fast, secure, and professional.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6 md:p-8 shadow-2xl"
        >
          <form onSubmit={handleConvert} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-medium text-zinc-400 ml-1">
                YouTube Video URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Youtube className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-zinc-950/50 border border-zinc-800 text-white rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all placeholder:text-zinc-600"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormat('mp3')}
                className={`flex items-center justify-center gap-2 py-4 rounded-xl border transition-all ${
                  format === 'mp3' 
                    ? 'bg-violet-500/10 border-violet-500/50 text-violet-400' 
                    : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300'
                }`}
              >
                <Music className="w-5 h-5" />
                <span className="font-medium">Audio (MP3)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('mp4')}
                className={`flex items-center justify-center gap-2 py-4 rounded-xl border transition-all ${
                  format === 'mp4' 
                    ? 'bg-violet-500/10 border-violet-500/50 text-violet-400' 
                    : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300'
                }`}
              >
                <Video className="w-5 h-5" />
                <span className="font-medium">Video (MP4)</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !url}
              className="w-full bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2"
            >
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
            </button>
          </form>
        </motion.div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="mt-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-start gap-3 text-rose-400"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-1 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-rose-500/20" />
              <div className="p-6 md:p-8">
                {result.simulated && (
                  <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 text-amber-400">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold mb-1">Demo Mode Active</p>
                      <p>{result.message}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                  <div className="w-full md:w-48 shrink-0 rounded-xl overflow-hidden border border-zinc-800 aspect-video md:aspect-auto">
                    <img 
                      src={result.thumbnail} 
                      alt="Video thumbnail" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  
                  <div className="flex-1 text-center md:text-left w-full">
                    <div className="flex items-center justify-center md:justify-start gap-2 text-emerald-400 mb-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium uppercase tracking-wider">Ready to Download</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">
                      {result.title}
                    </h3>
                    <div className="flex items-center justify-center md:justify-start gap-3 text-zinc-500 text-sm mb-6">
                      <span className="uppercase bg-zinc-800 px-2 py-1 rounded-md">{result.format}</span>
                    </div>
                    
                    <a
                      href={result.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full md:w-auto items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                    >
                      <Download className="w-5 h-5" />
                      Download File
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
