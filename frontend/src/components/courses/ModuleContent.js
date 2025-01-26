import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourseById, updateProgress } from '../../redux/slices/courseSlice';
import { toast } from 'react-toastify';

const ModuleContent = () => {
  const { courseId, moduleId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentCourse, isLoading } = useSelector((state) => state.courses);
  const [currentLesson, setCurrentLesson] = useState(0);

  useEffect(() => {
    dispatch(fetchCourseById(courseId));
  }, [dispatch, courseId]);

  const currentModule = currentCourse?.modules?.find(
    (module) => module._id === moduleId
  );

  const handleLessonComplete = async () => {
    try {
      const progress = ((currentLesson + 1) / currentModule.lessons.length) * 100;
      await dispatch(
        updateProgress({
          courseId,
          moduleId,
          progress,
        })
      ).unwrap();

      if (currentLesson + 1 < currentModule.lessons.length) {
        setCurrentLesson(currentLesson + 1);
        toast.success('Lesson completed!');
      } else {
        toast.success('Module completed!');
        navigate(`/courses/${courseId}`);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update progress');
    }
  };

  if (isLoading || !currentModule) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const lesson = currentModule.lessons[currentLesson];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Module Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{currentModule.title}</h1>
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <span>
            Lesson {currentLesson + 1} of {currentModule.lessons.length}
          </span>
          <span className="mx-2">•</span>
          <span>{Math.round(currentModule.progress)}% Complete</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8">
        <div
          className="bg-indigo-600 h-2.5 rounded-full"
          style={{ width: `${currentModule.progress}%` }}
        ></div>
      </div>

      {/* Lesson Content */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {lesson.title}
          </h2>
          <div className="prose max-w-none">
            {/* Render different content types */}
            {lesson.type === 'video' && (
              <div className="aspect-w-16 aspect-h-9 mb-6">
                <iframe
                  src={lesson.videoUrl}
                  title={lesson.title}
                  allowFullScreen
                  className="rounded-lg"
                ></iframe>
              </div>
            )}
            {lesson.type === 'text' && (
              <div
                className="text-gray-700"
                dangerouslySetInnerHTML={{ __html: lesson.content }}
              />
            )}
            {lesson.type === 'quiz' && (
              <div className="space-y-4">
                {lesson.questions.map((question, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">
                      {question.text}
                    </h3>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <label
                          key={optionIndex}
                          className="flex items-center space-x-3"
                        >
                          <input
                            type="radio"
                            name={`question-${index}`}
                            value={option}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resources */}
          {lesson.resources && lesson.resources.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Additional Resources
              </h3>
              <ul className="space-y-2">
                {lesson.resources.map((resource, index) => (
                  <li key={index}>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-500"
                    >
                      {resource.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
          <button
            onClick={() => setCurrentLesson(Math.max(0, currentLesson - 1))}
            disabled={currentLesson === 0}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              currentLesson === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Previous Lesson
          </button>
          <button
            onClick={handleLessonComplete}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            {currentLesson + 1 === currentModule.lessons.length
              ? 'Complete Module'
              : 'Next Lesson'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModuleContent;
