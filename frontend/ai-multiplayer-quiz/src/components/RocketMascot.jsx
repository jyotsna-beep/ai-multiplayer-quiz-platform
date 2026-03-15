import { motion } from "framer-motion"
import { useState } from "react"

export default function RocketMascot() {

  const [landed, setLanded] = useState(false)

  return (
    <motion.div
      className="fixed text-4xl pointer-events-none"
      style={{ zIndex: 5 }}

      initial={{ x: -300, y: -200, rotate: -40 }}

      animate={
        landed
          ? {
              x: "calc(50vw + 180px)",
              y: "calc(50vh + 120px)",
              rotate: 0
            }
          : {
              x: [-300, 100, 500, 300, 150],
              y: [-200, -100, 200, 100, 50],
              rotate: [-40, 0, 20, 10, 0]
            }
      }

      transition={{
        duration: 4,
        ease: "easeInOut"
      }}

      onAnimationComplete={() => setLanded(true)}
    >

      {landed && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute -top-10 left-2 bg-white shadow-md px-3 py-1 rounded-full text-sm"
        >
          Hi 👋
        </motion.div>
      )}

      {/* idle floating */}
      <motion.div
        animate={landed ? { y: [0, -6, 0] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        🚀
      </motion.div>

    </motion.div>
  )
}