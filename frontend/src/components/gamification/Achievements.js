import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUserAchievements,
  claimAchievement,
} from '../../redux/slices/achievementSlice';
import { toast } from 'react-toastify';

const Achievements = () => {
  const dispatch = useDispatch();
  const { achievements, isLoading } = useSelector((state) => state.achievements);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    dispatch(fetchUserAchievements());
  }, [dispatch]);

  const handleClaimReward = async (achievementId) => {
    try {
      await dispatch(claimAchievement(achievementId)).unwrap();
      toast.success('Reward claimed successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to claim reward');
    }
  };

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'learning', name: 'Learning', icon: '📚' },
    { id: 'trading', name: 'Trading', icon: '📈' },
    { id: 'community', name: 'Community', icon: '👥' },
    { id: 'milestone', name: 'Milestones', icon: '🏆' },
  ];

  const filteredAchievements = achievements.filter(
    (achievement) =>
      selectedCategory === 'all' || achievement.category === selectedCategory
  );

  const calculateProgress = (achievement) => {
    const { currentValue, targetValue } = achievement.progress;
    return Math.min((currentValue / targetValue) * 100, 100);
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
        <h1 className="text-3xl font-bold text-gray-900">Achievements</h1>
        <p className="mt-2 text-sm text-gray-600">
          Track your progress and earn rewards
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex space-x-4 mb-8 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full flex items-center space-x-2 ${
              selectedCategory === category.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.icon && <span>{category.icon}</span>}
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map((achievement) => (
          <div
            key={achievement._id}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            {/* Achievement Header */}
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      achievement.status === 'completed'
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    <img
                      src={achievement.icon}
                      alt=""
                      className="w-8 h-8"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {achievement.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {achievement.description}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    achievement.rarity === 'legendary'
                      ? 'bg-yellow-100 text-yellow-800'
                      : achievement.rarity === 'epic'
                      ? 'bg-purple-100 text-purple-800'
                      : achievement.rarity === 'rare'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {achievement.rarity}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>
                    {achievement.progress.currentValue}/
                    {achievement.progress.targetValue}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${calculateProgress(achievement)}%` }}
                  ></div>
                </div>
              </div>

              {/* Reward */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900">Reward</h4>
                <div className="flex items-center space-x-2 mt-1">
                  {achievement.reward.type === 'xp' && (
                    <>
                      <span className="text-yellow-500">⭐</span>
                      <span>{achievement.reward.value} XP</span>
                    </>
                  )}
                  {achievement.reward.type === 'badge' && (
                    <>
                      <span className="text-blue-500">🏅</span>
                      <span>{achievement.reward.value}</span>
                    </>
                  )}
                  {achievement.reward.type === 'title' && (
                    <>
                      <span className="text-purple-500">👑</span>
                      <span>{achievement.reward.value}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              {achievement.status === 'completed' && !achievement.claimed && (
                <button
                  onClick={() => handleClaimReward(achievement._id)}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Claim Reward
                </button>
              )}
              {achievement.status === 'claimed' && (
                <div className="text-center text-green-600 font-medium">
                  Reward Claimed ✓
                </div>
              )}
              {achievement.status === 'in_progress' && (
                <div className="text-center text-gray-500">
                  Keep going! You're making progress
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Achievements;
