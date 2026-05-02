import { TrendingUp, Minus } from "lucide-react"

export function StatCard({ label, value, trend, trendType }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className={`stat-trend ${trendType === 'neutral' ? 'trend-neutral' : 'trend-up'}`}>
        {trendType === 'up' && <TrendingUp size={14} />}
        {trendType === 'neutral' && <Minus size={14} />}
        <span>{trend}</span>
      </div>
    </div>
  )
}

export function RecentGamesTable({ games }) {
  return (
    <div className="card-panel">
      <div className="card-header">
        <h3 className="card-title">Recent games</h3>
        <a href="/quiz-history" className="card-link">View all</a>
      </div>
      <div className="overflow-x-auto">
        <table className="games-table">
          <thead>
            <tr>
              <th>Room</th>
              <th>Date</th>
              <th>Score</th>
              <th>Rank</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game, index) => (
              <tr key={index}>
                <td className="room-name-cell">
                  <div className="room-icon">{index + 1}</div>
                  <span className="font-medium text-gray-900">{game.name}</span>
                </td>
                <td>{game.date}</td>
                <td className="font-semibold text-gray-900">{game.score}</td>
                <td>{game.rank}</td>
                <td>
                  <span className={`badge badge-${game.status.toLowerCase().replace(' ', '-')}`}>
                    {game.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ActivityTimeline({ activities }) {
  return (
    <div className="card-panel">
      <div className="card-header">
        <h3 className="card-title">Activity</h3>
        <a href="#" className="card-link">Filter</a>
      </div>
      <div className="timeline">
        {activities.map((activity, index) => (
          <div className="timeline-item" key={index}>
            <div className="timeline-dot-container">
              <div className={`timeline-dot dot-${activity.color}`}></div>
              {index !== activities.length - 1 && <div className="timeline-line"></div>}
            </div>
            <div className="timeline-content">
              <p className="timeline-text" dangerouslySetInnerHTML={{ __html: activity.text }}></p>
              <p className="timeline-time">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
