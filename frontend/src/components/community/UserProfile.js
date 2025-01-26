import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUserProfile,
  updateUserProfile,
  followUser,
  unfollowUser,
} from '../../redux/slices/userSlice';
import { toast } from 'react-toastify';

const UserProfile = ({ userId }) => {
  const dispatch = useDispatch();
  const { profile, isLoading } = useSelector((state) => state.user);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (userId) {
      dispatch(fetchUserProfile(userId));
    }
  }, [dispatch, userId]);

  useEffect(() => {
    if (profile) {
      setEditedProfile({ ...profile });
    }
  }, [profile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateUserProfile(editedProfile)).unwrap();
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const handleFollowToggle = async () => {
    try {
      if (profile.isFollowing) {
        await dispatch(unfollowUser(userId)).unwrap();
        toast.success('Unfollowed user');
      } else {
        await dispatch(followUser(userId)).unwrap();
        toast.success('Following user');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update follow status');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading || !profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600">
          {profile.coverImage && (
            <img
              src={profile.coverImage}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="relative px-6 pb-6">
          <div className="flex justify-between items-end absolute -top-16 inset-x-6">
            <div className="flex items-center">
              <img
                src={profile.avatar}
                alt=""
                className="h-32 w-32 rounded-full border-4 border-white"
              />
              <div className="ml-6 pt-16">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.name}
                </h1>
                <p className="text-sm text-gray-500">@{profile.username}</p>
              </div>
            </div>
            {profile.isCurrentUser ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Edit Profile
              </button>
            ) : (
              <button
                onClick={handleFollowToggle}
                className={`px-4 py-2 rounded-lg ${
                  profile.isFollowing
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {profile.isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Navigation */}
      <div className="bg-white mt-6 border-b">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'trading', 'achievements', 'activity'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Profile Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* About */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">About</h2>
                <p className="text-gray-600">{profile.bio}</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Location
                    </h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {profile.location}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Member Since
                    </h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDate(profile.joinedAt)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Trading Style
                    </h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {profile.tradingStyle}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Experience Level
                    </h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {profile.experienceLevel}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow p-6 mt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Recent Activity
                </h2>
                <div className="space-y-4">
                  {profile?.recentActivity?.map((activity) => (
                    <div
                      key={activity?._id}
                      className="flex items-start space-x-3"
                    >
                      <div className="flex-shrink-0">
                        <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          {activity?.type === 'trade' && '📈'}
                          {activity?.type === 'comment' && '💬'}
                          {activity?.type === 'achievement' && '🏆'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          {activity?.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(activity?.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats & Achievements */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Stats</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Trading Score</span>
                      <span className="text-sm font-medium text-gray-900">
                        {profile?.stats?.tradingScore}
                      </span>
                    </div>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{
                          width: `${(profile?.stats?.tradingScore / 1000) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Win Rate</span>
                      <p className="mt-1 text-lg font-medium text-gray-900">
                        {profile?.stats?.winRate}%
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Total Trades</span>
                      <p className="mt-1 text-lg font-medium text-gray-900">
                        {profile?.stats?.totalTrades}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Followers</span>
                      <p className="mt-1 text-lg font-medium text-gray-900">
                        {profile?.stats?.followers}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Following</span>
                      <p className="mt-1 text-lg font-medium text-gray-900">
                        {profile?.stats?.following}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Recent Achievements
                </h2>
                <div className="space-y-4">
                  {profile?.recentAchievements?.map((achievement) => (
                    <div
                      key={achievement?._id}
                      className="flex items-center space-x-3"
                    >
                      <div className="flex-shrink-0">
                        <img
                          src={achievement?.icon}
                          alt=""
                          className="h-8 w-8"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {achievement?.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(achievement?.unlockedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs content */}
        {activeTab === 'trading' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Trading History
            </h2>
            {/* Add trading history content */}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              All Achievements
            </h2>
            {/* Add achievements content */}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Activity Feed
            </h2>
            {/* Add activity feed content */}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditing && editedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Edit Profile
            </h2>
            <form onSubmit={handleUpdateProfile}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editedProfile.name}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, name: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <textarea
                    value={editedProfile.bio}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, bio: e.target.value })
                    }
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editedProfile.location}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        location: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Trading Style
                  </label>
                  <select
                    value={editedProfile.tradingStyle}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        tradingStyle: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="day">Day Trading</option>
                    <option value="swing">Swing Trading</option>
                    <option value="position">Position Trading</option>
                    <option value="scalping">Scalping</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
