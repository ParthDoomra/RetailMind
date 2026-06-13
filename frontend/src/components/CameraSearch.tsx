/**
 * RetailMind — CameraSearch Component (v3)
 * Live camera OR file upload → /api/camera-recognize → results
 */
import { API_BASE } from "../config";
import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, X, ZapOff, Zap, RefreshCw, ScanLine,
  Upload, ImageIcon, CheckCircle, AlertTriangle
} from 'lucide-react'
import type { Product } from '../types/productTypes'

interface Props {
  onResults: (products: Product[], capturedImage?: string) => void
  onClose:   () => void
}

type Mode = 'idle' | 'camera' | 'upload'
type Stage = 'ready' | 'scanning' | 'detected' | 'error'

interface Detection {
  product: string
  category: string
  confidence: string
  query: string
  resultCount: number
  results: Product[]
  image: string
  apiWarning?: string
}

export default function CameraSearch({ onResults, onClose }: Props) {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const streamRef  = useRef<MediaStream | null>(null)
  const fileRef    = useRef<HTMLInputElement>(null)

  const [mode,      setMode]      = useState<Mode>('idle')
  const [stage,     setStage]     = useState<Stage>('ready')
  const [flash,     setFlash]     = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [detection, setDetection] = useState<Detection | null>(null)
  const [preview,   setPreview]   = useState<string>('')   // uploaded image preview

  // ── Camera helpers ─────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setStatusMsg('')
    setDetection(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setMode('camera')
      setStage('ready')
    } catch (e: any) {
      const msg = e.name === 'NotAllowedError'
        ? 'Camera access denied — please allow camera in your browser settings.'
        : 'Camera not available. Try uploading an image instead.'
      setStatusMsg(msg)
      setStage('error')
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  // ── Core recognition pipeline ──────────────────────────────────────────────
  const recognizeBase64 = useCallback(async (base64: string) => {
    setStage('scanning')
    setStatusMsg('Analyzing with AI...')
    setDetection(null)

    try {
      const res = await fetch(`${API_BASE}/api/camera-recognize`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ image: base64 }),
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Server error ${res.status}: ${txt}`)
      }

      const data = await res.json()

      const det: Detection = {
        product:    data.detected_product || data.query || 'Unknown product',
        category:   data.detected_category || '',
        confidence: data.confidence || 'low',
        query:      data.query || '',
        resultCount: data.results?.length ?? 0,
        results:    data.results ?? [],
        image:      base64,
        apiWarning: data.api_warning,
      }

      setDetection(det)
      setStage('detected')
      setStatusMsg('')
    } catch (err: any) {
      setStatusMsg(err.message || 'Recognition failed. Please try again.')
      setStage('error')
    }
  }, [])

  // ── Camera capture ─────────────────────────────────────────────────────────
  const captureAndRecognize = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || stage === 'scanning') return
    setFlash(true)
    setTimeout(() => setFlash(false), 200)

    const video  = videoRef.current
    const canvas = canvasRef.current
    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480
    canvas.getContext('2d')!.drawImage(video, 0, 0)
    const base64 = canvas.toDataURL('image/jpeg', 0.85)
    await recognizeBase64(base64)
  }, [stage, recognizeBase64])

  // ── File upload ────────────────────────────────────────────────────────────
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string
      setPreview(base64)
      setMode('upload')
      await recognizeBase64(base64)
    }
    reader.readAsDataURL(file)
    // reset so same file can be re-chosen
    e.target.value = ''
  }, [recognizeBase64])

  // ── Helpers ────────────────────────────────────────────────────────────────
  const reset = () => {
    stopCamera()
    setMode('idle')
    setStage('ready')
    setStatusMsg('')
    setDetection(null)
    setPreview('')
  }

  const confColor = (c: string) =>
    c === 'high' ? 'text-emerald-600' : c === 'medium' ? 'text-amber-500' : 'text-gray-400'

  const confIcon = (c: string) =>
    c === 'high' ? '✓ High' : c === 'medium' ? '~ Medium' : '? Low'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && (reset(), onClose())}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="w-full max-w-lg bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center">
              <Camera size={18} className="text-violet-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">Visual Search</h2>
              <p className="text-[11px] text-gray-400">Powered by Claude Vision AI</p>
            </div>
          </div>
          <button
            onClick={() => { reset(); onClose() }}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Viewport ──────────────────────────────────────────────────────── */}
        <div className="relative bg-gray-950 aspect-video overflow-hidden">
          {/* Video element (camera mode) */}
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${mode === 'camera' ? 'block' : 'hidden'}`}
            muted playsInline
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Uploaded image preview */}
          {mode === 'upload' && preview && (
            <img src={preview} alt="uploaded" className="w-full h-full object-contain" />
          )}

          {/* Flash */}
          <AnimatePresence>
            {flash && (
              <motion.div
                initial={{ opacity: 0.9 }} animate={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                className="absolute inset-0 bg-white pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Camera scan overlay */}
          {mode === 'camera' && stage === 'ready' && (
            <div className="absolute inset-0 pointer-events-none">
              {['top-5 left-5', 'top-5 right-5', 'bottom-5 left-5', 'bottom-5 right-5'].map((pos, i) => (
                <div key={i} className={`absolute ${pos} w-8 h-8`}>
                  <div className={`absolute w-full h-0.5 bg-violet-400 ${i < 2 ? 'top-0' : 'bottom-0'}`} />
                  <div className={`absolute h-full w-0.5 bg-violet-400 ${i % 2 === 0 ? 'left-0' : 'right-0'}`} />
                </div>
              ))}
            </div>
          )}

          {/* Scanning animation */}
          {stage === 'scanning' && (mode === 'camera' || mode === 'upload') && (
            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                initial={{ top: '5%' }}
                animate={{ top: '92%' }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                className="absolute left-4 right-4 h-0.5 bg-violet-500/80 shadow-[0_0_14px_rgba(139,92,246,0.9)]"
                style={{ position: 'absolute' }}
              />
              <div className="absolute inset-0 bg-violet-500/10" />
            </div>
          )}

          {/* Idle / Choose mode */}
          {mode === 'idle' && stage !== 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-6">
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={startCamera}
                  className="flex flex-col items-center gap-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl px-8 py-5 transition-all"
                >
                  <Camera size={28} />
                  <span className="text-sm font-medium">Use Camera</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center gap-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl px-8 py-5 transition-all"
                >
                  <Upload size={28} />
                  <span className="text-sm font-medium">Upload Image</span>
                </motion.button>
              </div>
              <p className="text-gray-500 text-xs text-center">
                Point your camera at any product, or upload a photo
              </p>
            </div>
          )}

          {/* Error state */}
          {stage === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
              <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center">
                <ZapOff size={26} className="text-red-400" />
              </div>
              <p className="text-red-300 text-sm text-center max-w-xs">{statusMsg}</p>
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={reset}
                  className="flex items-center gap-2 bg-white/10 border border-white/20 text-white px-5 py-2.5 rounded-xl text-sm transition-colors hover:bg-white/20"
                >
                  Try again
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl text-sm transition-colors"
                >
                  <Upload size={14} /> Upload instead
                </motion.button>
              </div>
            </div>
          )}

          {/* Scanning spinner overlay (upload mode) */}
          {mode === 'upload' && stage === 'scanning' && (
            <div className="absolute inset-0 flex items-end justify-center pb-6 pointer-events-none">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur text-white text-xs px-4 py-2 rounded-full">
                <RefreshCw size={12} className="animate-spin" />
                Analyzing image...
              </div>
            </div>
          )}

          {/* LIVE badge */}
          {mode === 'camera' && stage === 'ready' && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur text-white text-[10px] px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </div>
          )}
        </div>

        {/* ── Detection result card ─────────────────────────────────────────── */}
        <AnimatePresence>
          {detection && stage === 'detected' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-5 py-4 border-t border-gray-100 bg-gray-50"
            >
              {detection.apiWarning && (
                <div className="flex items-start gap-2 mb-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  <AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-700 leading-relaxed">{detection.apiWarning}</p>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center shrink-0">
                  <ImageIcon size={18} className="text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{detection.product}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {detection.category && (
                      <span className="text-[11px] text-gray-500">{detection.category}</span>
                    )}
                    <span className={`text-[11px] font-medium ${confColor(detection.confidence)}`}>
                      {confIcon(detection.confidence)} confidence
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {detection.resultCount > 0
                      ? `${detection.resultCount} catalog match${detection.resultCount !== 1 ? 'es' : ''} found`
                      : 'No catalog matches — try a different angle'}
                  </p>
                </div>
                {detection.resultCount > 0 && (
                  <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Status bar (scanning) ─────────────────────────────────────────── */}
        {stage === 'scanning' && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2">
            <ScanLine size={13} className="text-violet-500 animate-pulse" />
            <span className="text-xs text-gray-500">{statusMsg || 'Analyzing...'}</span>
          </div>
        )}

        {/* ── Controls ──────────────────────────────────────────────────────── */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-3">
          {/* Reset / back */}
          {mode !== 'idle' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={reset}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm px-4 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <ZapOff size={14} /> Reset
            </motion.button>
          )}

          {/* Camera capture */}
          {mode === 'camera' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={captureAndRecognize}
              disabled={stage === 'scanning'}
              className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors"
            >
              {stage === 'scanning'
                ? <><RefreshCw size={14} className="animate-spin" /> Scanning...</>
                : <><Camera size={14} /> Capture & Identify</>
              }
            </motion.button>
          )}

          {/* Upload button (idle or after detection) */}
          {(mode === 'idle' || mode === 'upload') && stage !== 'scanning' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => fileRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors"
            >
              <Upload size={14} />
              {mode === 'upload' ? 'Upload another' : 'Upload Image'}
            </motion.button>
          )}

          {/* View results */}
          {detection && detection.resultCount > 0 && stage === 'detected' && (
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => onResults(detection.results, detection.image)}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
            >
              View {detection.resultCount} Results →
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </motion.div>
  )
}
