import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTopicDetails,
  createReply,
  updatePost,
  deletePost,
} from '../../redux/slices/forumSlice';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';

const TopicDetail = () => {
  const { topicId } = useParams();
  const dispatch = useDispatch();
  const { currentTopic, isLoading } = useSelector((state) => state.forum);
  const [replyContent, setReplyContent] = useState('');
  const [editingPost, setEditingPost] = useState(null);

  useEffect(() => {
    dispatch(fetchTopicDetails(topicId));
  }, [dispatch, topicId]);

  const handleCreateReply = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createReply({ topicId, content: replyContent })).unwrap();
      setReplyContent('');
      toast.success('Reply posted successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to post reply');
    }
  };

  const handleUpdatePost = async (postId, content) => {
    try {
      await dispatch(updatePost({ postId, content })).unwrap();
      setEditingPost(null);
      toast.success('Post updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to update post');
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await dispatch(deletePost(postId)).unwrap();
        toast.success('Post deleted successfully!');
      } catch (error) {
        toast.error(error.message || 'Failed to delete post');
      }
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading || !currentTopic) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Topic Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {currentTopic.title}
            </h1>
            <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
              <span>{formatDate(currentTopic.createdAt)}</span>
              <span>•</span>
              <span>{currentTopic.category}</span>
              {currentTopic.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-full bg-gray-100 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-gray-500">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="mt-6 prose max-w-none">
          <ReactMarkdown>{currentTopic.content}</ReactMarkdown>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <button className="text-gray-400 hover:text-gray-500">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  />
                </svg>
              </button>
              <span className="ml-2 text-gray-600">
                {currentTopic.likeCount} likes
              </span>
            </div>
            <div className="flex items-center">
              <button className="text-gray-400 hover:text-gray-500">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </button>
              <span className="ml-2 text-gray-600">
                {currentTopic.replyCount} replies
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center">
              <img
                src={currentTopic.author.avatar}
                alt=""
                className="h-8 w-8 rounded-full"
              />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {currentTopic.author.name}
                </p>
                <p className="text-xs text-gray-500">
                  Level {currentTopic.author.level}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Replies */}
      <div className="space-y-6">
        {currentTopic.replies.map((reply) => (
          <div key={reply._id} className="bg-white rounded-lg shadow-lg p-6">
            {editingPost === reply._id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdatePost(reply._id, e.target.content.value);
                }}
              >
                <textarea
                  name="content"
                  defaultValue={reply.content}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditingPost(null)}
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
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <img
                      src={reply.author.avatar}
                      alt=""
                      className="h-8 w-8 rounded-full"
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {reply.author.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(reply.createdAt)}
                      </p>
                    </div>
                  </div>
                  {reply.isAuthor && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingPost(reply._id)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePost(reply._id)}
                        className="text-red-400 hover:text-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-4 prose max-w-none">
                  <ReactMarkdown>{reply.content}</ReactMarkdown>
                </div>
                <div className="mt-4 flex items-center space-x-4">
                  <div className="flex items-center">
                    <button className="text-gray-400 hover:text-gray-500">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                        />
                      </svg>
                    </button>
                    <span className="ml-2 text-gray-600">
                      {reply.likeCount} likes
                    </span>
                  </div>
                  <button className="text-gray-400 hover:text-gray-500">
                    Reply
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Reply Form */}
      <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-medium text-gray-900">Leave a reply</h3>
        <form onSubmit={handleCreateReply} className="mt-4">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Write your reply..."
            required
          />
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Post Reply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TopicDetail;
