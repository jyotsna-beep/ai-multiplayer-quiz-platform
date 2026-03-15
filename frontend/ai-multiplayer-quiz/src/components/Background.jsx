export default function Background() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">

      {/* Blob 1 */}
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px]
      bg-gradient-to-r from-[#C1121F] to-[#F77F00]
      rounded-full blur-[160px] opacity-50
      animate-blob"></div>

      {/* Blob 2 */}
      <div className="absolute bottom-[-200px] right-[-200px] w-[650px] h-[650px]
      bg-gradient-to-r from-[#F77F00] to-[#FFB703]
      rounded-full blur-[160px] opacity-50
      animate-blob animation-delay-2000"></div>

      {/* Blob 3 */}
      <div className="absolute top-[40%] left-[60%] w-[500px] h-[500px]
      bg-gradient-to-r from-[#FFB703] to-[#C1121F]
      rounded-full blur-[150px] opacity-40
      animate-blob animation-delay-4000"></div>

    </div>
  )
}