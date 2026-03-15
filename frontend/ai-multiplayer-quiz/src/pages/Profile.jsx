import Background from "../components/Background"

export default function Profile(){

  const user = JSON.parse(localStorage.getItem("user"))

  const stats = {
    quizzes:12,
    wins:5,
    accuracy:"78%"
  }

  return(

    <div className="min-h-screen bg-[#FFF6F3] flex justify-center pt-20 relative">

      <Background />

      <div className="glow-card w-[600px] text-center">

        <div className="text-6xl mb-4">
          🧑
        </div>

        <h2 className="text-2xl font-bold mb-1">
          {user?.name}
        </h2>

        <p className="text-gray-500 mb-8">
          {user?.email}
        </p>


        {/* Stats */}

        <div className="grid grid-cols-3 gap-6">

          <div>

            <p className="text-2xl font-bold text-[#C1121F]">
              {stats.quizzes}
            </p>

            <p className="text-gray-500">
              Quizzes Played
            </p>

          </div>

          <div>

            <p className="text-2xl font-bold text-[#C1121F]">
              {stats.wins}
            </p>

            <p className="text-gray-500">
              Wins
            </p>

          </div>

          <div>

            <p className="text-2xl font-bold text-[#C1121F]">
              {stats.accuracy}
            </p>

            <p className="text-gray-500">
              Accuracy
            </p>

          </div>

        </div>

      </div>

    </div>

  )
}