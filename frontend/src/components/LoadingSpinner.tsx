import { motion } from 'framer-motion'

interface Props { text?: string; size?: 'sm' | 'md' | 'lg' }

export default function LoadingSpinner({ text = 'Loading...', size = 'md' }: Props) {
  const dim = size === 'sm' ? 20 : size === 'lg' ? 48 : 32
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{ width: dim, height: dim }}
        className="rounded-full border-2 border-border border-t-accent"
      />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  )
}
