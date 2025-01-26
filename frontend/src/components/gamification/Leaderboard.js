import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchLeaderboard,
  fetchUserRank,
} from '../../redux/slices/leaderboardSlice';

const Leaderboard = () => {
  const dispatch = useDispatch();
  const { leaderboard, userRank, isLoading } = useSelector(
    (state) => state.leaderboard
  );
  const [timeframe, setTimeframe] = useState('weekly');
  const [category, setCategory] = useState('overall');

  useEffect(() => {
    dispatch(fetchLeaderboard({ timeframe, category }));
    dispatch(fetchUserRank({ timeframe, category }));
  }, [dispatch, timeframe, category]);

  const categories = [
    { id: 'overall', name: 'Overall', icon: '🏆' },
    { id: 'trading', name: 'Trading', icon: '📈' },
    { id: 'learning', name: 'Learning', icon: '📚' },
    { id: 'community', name: 'Community', icon: '👥' },
  ];

  const timeframes = [
    { id: 'daily', name: 'Today' },
    { id: 'weekly', name: 'This Week' },
    { id: 'monthly', name: 'This Month' },
    { id: 'allTime', name: 'All Time' },
  ];

  const getPositionStyle = (position) => {
    switch (position) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 2:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 3:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-white text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          See how you rank against other traders
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
        {/* Categories */}
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-4 py-2 rounded-full flex items-center space-x-2 ${
                category === cat.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Timeframes */}
        <div className="flex space-x-2">
          {timeframes.map((time) => (
            <button
              key={time.id}
              onClick={() => setTimeframe(time.id)}
              className={`px-4 py-2 rounded-lg ${
                timeframe === time.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {time.name}
            </button>
          ))}
        </div>
      </div>

      {/* User's Rank */}
      {userRank && (
        <div className="bg-indigo-50 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl">
                {userRank.position <= 3 ? '🏆' : '👤'}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Your Rank</h3>
                <p className="text-sm text-gray-600">
                  Position #{userRank.position} • Top {userRank.percentile}%
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600">
                {userRank.score.toLocaleString()} pts
              </div>
              <div className="text-sm text-gray-600">
                {userRank.trend > 0
                  ? `↑ Up ${userRank.trend} positions`
                  : userRank.trend < 0
                  ? `↓ Down ${Math.abs(userRank.trend)} positions`
                  : '→ No change'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trader
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Achievements
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trend
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leaderboard.map((entry, index) => (
              <tr
                key={entry._id}
                className={`${
                  entry.isCurrentUser ? 'bg-indigo-50' : ''
                } hover:bg-gray-50`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${getPositionStyle(
                      index + 1
                    )}`}
                  >
                    {index + 1}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-200">
                      {entry.avatar && (
                        <img
                          src={entry.avatar}
                          alt=""
                          className="h-10 w-10 rounded-full"
                        />
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Level {entry.level}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {entry.score.toLocaleString()} pts
                  </div>
                  <div className="text-sm text-gray-500">
                    {entry.category === 'trading'
                      ? `${entry.profitPercentage}% profit`
                      : entry.category === 'learning'
                      ? `${entry.completionRate}% completion`
                      : `${entry.contributionCount} contributions`}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex -space-x-2">
                    {entry.recentAchievements.slice(0, 3).map((achievement) => (
                      <div
                        key={achievement._id}
                        className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white"
                        title={achievement.title}
                      >
                        <img
                          src={achievement.icon}
                          alt=""
                          className="w-full h-full rounded-full"
                        />
                      </div>
                    ))}
                    {entry.recentAchievements.length > 3 && (
                      <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                        +{entry.recentAchievements.length - 3}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      entry.trend > 0
                        ? 'bg-green-100 text-green-800'
                        : entry.trend < 0
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {entry.trend > 0
                      ? `↑ ${entry.trend}`
                      : entry.trend < 0
                      ? `↓ ${Math.abs(entry.trend)}`
                      : '→ 0'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
