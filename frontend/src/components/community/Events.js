import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchEvents,
  createEvent,
  registerForEvent,
} from '../../redux/slices/eventSlice';
import { toast } from 'react-toastify';

const Events = () => {
  const dispatch = useDispatch();
  const { events, isLoading } = useSelector((state) => state.events);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'webinar',
    startDate: '',
    endDate: '',
    maxParticipants: 0,
    tags: [],
  });
  const [selectedFilter, setSelectedFilter] = useState('upcoming');

  useEffect(() => {
    dispatch(fetchEvents(selectedFilter));
  }, [dispatch, selectedFilter]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createEvent(newEvent)).unwrap();
      setShowCreateModal(false);
      setNewEvent({
        title: '',
        description: '',
        type: 'webinar',
        startDate: '',
        endDate: '',
        maxParticipants: 0,
        tags: [],
      });
      toast.success('Event created successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to create event');
    }
  };

  const handleRegister = async (eventId) => {
    try {
      await dispatch(registerForEvent(eventId)).unwrap();
      toast.success('Successfully registered for the event!');
    } catch (error) {
      toast.error(error.message || 'Failed to register for event');
    }
  };

  const eventTypes = {
    webinar: { icon: '🎥', label: 'Webinar' },
    workshop: { icon: '🛠️', label: 'Workshop' },
    competition: { icon: '🏆', label: 'Competition' },
    meetup: { icon: '👥', label: 'Meetup' },
    ama: { icon: '🎤', label: 'AMA Session' },
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
          <h1 className="text-3xl font-bold text-gray-900">Community Events</h1>
          <p className="mt-2 text-sm text-gray-600">
            Join events and connect with fellow traders
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Create Event
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => setSelectedFilter('upcoming')}
          className={`px-4 py-2 rounded-lg ${
            selectedFilter === 'upcoming'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setSelectedFilter('past')}
          className={`px-4 py-2 rounded-lg ${
            selectedFilter === 'past'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Past Events
        </button>
        <button
          onClick={() => setSelectedFilter('registered')}
          className={`px-4 py-2 rounded-lg ${
            selectedFilter === 'registered'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          My Events
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div
            key={event._id}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            {/* Event Image/Banner */}
            <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
              {event.image ? (
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl">{eventTypes[event.type].icon}</span>
                </div>
              )}
              <div className="absolute top-4 right-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    event.isFull
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {event.isFull ? 'Full' : `${event.spotsLeft} spots left`}
                </span>
              </div>
            </div>

            {/* Event Details */}
            <div className="p-6">
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <span>{eventTypes[event.type].icon}</span>
                <span>{eventTypes[event.type].label}</span>
                <span>•</span>
                <span>{formatDate(event.startDate)}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {event.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {event.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Host Info */}
              <div className="flex items-center mb-4">
                <img
                  src={event.host.avatar}
                  alt=""
                  className="w-8 h-8 rounded-full"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {event.host.name}
                  </p>
                  <p className="text-xs text-gray-500">Host</p>
                </div>
              </div>

              {/* Action Button */}
              {selectedFilter !== 'past' && (
                <button
                  onClick={() => handleRegister(event._id)}
                  disabled={event.isFull || event.isRegistered}
                  className={`w-full px-4 py-2 rounded-lg ${
                    event.isRegistered
                      ? 'bg-green-600 text-white'
                      : event.isFull
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {event.isRegistered
                    ? 'Registered'
                    : event.isFull
                    ? 'Event Full'
                    : 'Register Now'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Create New Event
            </h2>
            <form onSubmit={handleCreateEvent}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, title: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select
                    value={newEvent.type}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, type: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    {Object.entries(eventTypes).map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, description: e.target.value })
                    }
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Start Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={newEvent.startDate}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, startDate: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={newEvent.endDate}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, endDate: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Maximum Participants
                  </label>
                  <input
                    type="number"
                    value={newEvent.maxParticipants}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        maxParticipants: parseInt(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tags
                  </label>
                  <input
                    type="text"
                    placeholder="Enter tags separated by commas"
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
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
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
