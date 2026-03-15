export default function GameBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">

      <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-[#C1121F] to-[#F77F00] rounded-full blur-[140px] opacity-40 animate-blob top-[-150px] left-[-150px]"></div>

      <div className="absolute w-[500px] h-[500px] bg-gradient-to-r from-[#F77F00] to-[#FFB703] rounded-full blur-[140px] opacity-40 animate-blob animation-delay-2000 bottom-[-150px] right-[-150px]"></div>

      <div className="absolute w-[400px] h-[400px] bg-gradient-to-r from-[#FFB703] to-[#C1121F] rounded-full blur-[120px] opacity-30 animate-blob animation-delay-4000 top-[200px] right-[200px]"></div>

    </div>
  )
}