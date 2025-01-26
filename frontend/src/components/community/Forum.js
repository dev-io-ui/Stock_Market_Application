import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTopics,
  createTopic,
  createPost,
} from '../../redux/slices/forumSlice';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';

const Forum = () => {
  const dispatch = useDispatch();
  const { topics, isLoading } = useSelector((state) => state.forum);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [newTopic, setNewTopic] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: [],
  });

  useEffect(() => {
    dispatch(fetchTopics({ category: selectedCategory }));
  }, [dispatch, selectedCategory]);

  const categories = [
    { id: 'all', name: 'All Topics', icon: '📚' },
    { id: 'general', name: 'General Discussion', icon: '💭' },
    { id: 'trading', name: 'Trading Strategies', icon: '📈' },
    { id: 'analysis', name: 'Market Analysis', icon: '🔍' },
    { id: 'education', name: 'Learning Resources', icon: '📖' },
    { id: 'help', name: 'Help & Support', icon: '❓' },
  ];

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createTopic(newTopic)).unwrap();
      setShowNewTopicModal(false);
      setNewTopic({
        title: '',
        content: '',
        category: 'general',
        tags: [],
      });
      toast.success('Topic created successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to create topic');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Community Forum</h1>
          <p className="mt-2 text-sm text-gray-600">
            Join the discussion with fellow traders
          </p>
        </div>
        <button
          onClick={() => setShowNewTopicModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          New Topic
        </button>
      </div>

      {/* Categories */}
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
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* Topics List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-200">
          {topics.map((topic) => (
            <div key={topic._id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link
                    to={`/forum/topic/${topic._id}`}
                    className="text-lg font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    {topic.title}
                  </Link>
                  <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500">
                    <span>{formatDate(topic.createdAt)}</span>
                    <span>•</span>
                    <span>{topic.category}</span>
                    {topic.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 rounded-full bg-gray-100 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                    <ReactMarkdown>{topic.content}</ReactMarkdown>
                  </div>
                </div>
                <div className="ml-6 flex flex-col items-end">
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-2">
                      {topic.recentParticipants.map((user) => (
                        <div
                          key={user._id}
                          className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white"
                          title={user.name}
                        >
                          {user.avatar && (
                            <img
                              src={user.avatar}
                              alt=""
                              className="w-full h-full rounded-full"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    {topic.participantCount > 3 && (
                      <span className="text-sm text-gray-500">
                        +{topic.participantCount - 3} more
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {topic.replyCount} replies • {topic.viewCount} views
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Last reply {formatDate(topic.lastReplyAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Topic Modal */}
      {showNewTopicModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Create New Topic
            </h2>
            <form onSubmit={handleCreateTopic}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newTopic.title}
                    onChange={(e) =>
                      setNewTopic({ ...newTopic, title: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    value={newTopic.category}
                    onChange={(e) =>
                      setNewTopic({ ...newTopic, category: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    {categories
                      .filter((cat) => cat.id !== 'all')
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Content
                  </label>
                  <textarea
                    value={newTopic.content}
                    onChange={(e) =>
                      setNewTopic({ ...newTopic, content: e.target.value })
                    }
                    rows={6}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Supports Markdown formatting
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tags
                  </label>
                  <input
                    type="text"
                    placeholder="Enter tags separated by commas"
                    onChange={(e) =>
                      setNewTopic({
                        ...newTopic,
                        tags: e.target.value.split(',').map((tag) => tag.trim()),
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewTopicModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forum;
