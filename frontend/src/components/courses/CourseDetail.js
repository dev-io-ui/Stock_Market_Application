import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourseById, enrollInCourse } from '../../redux/slices/courseSlice';
import { CheckIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const CourseDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentCourse, isLoading, error } = useSelector(
    (state) => state.courses
  );
  const [selectedModule, setSelectedModule] = useState(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchCourseById(id));
    }
  }, [dispatch, id]);

  const handleEnroll = async () => {
    try {
      await dispatch(enrollInCourse(id)).unwrap();
      toast.success('Successfully enrolled in the course!');
    } catch (error) {
      toast.error(error.message || 'Failed to enroll in the course');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Error loading course: {error}
      </div>
    );
  }

  if (!currentCourse) {
    return (
      <div className="text-center text-gray-600 p-4">Course not found</div>
    );
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
          {/* Course Info */}
          <div className="lg:max-w-lg lg:self-end">
            <div className="mt-4">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {currentCourse.title}
              </h1>
            </div>
            <section aria-labelledby="information-heading" className="mt-4">
              <h2 id="information-heading" className="sr-only">
                Course information
              </h2>

              <div className="flex items-center">
                <p className="text-lg text-gray-900 sm:text-xl">
                  ${currentCourse.price}
                </p>

                <div className="ml-4 border-l border-gray-300 pl-4">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      {[0, 1, 2, 3, 4].map((rating) => (
                        <svg
                          key={rating}
                          className={`h-5 w-5 flex-shrink-0 ${
                            rating < Math.floor(currentCourse.rating)
                              ? 'text-yellow-400'
                              : 'text-gray-200'
                          }`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ))}
                    </div>
                    <p className="ml-2 text-sm text-gray-500">
                      {currentCourse.rating} ({currentCourse.reviews?.length}{' '}
                      reviews)
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-6">
                <p className="text-base text-gray-500">
                  {currentCourse.description}
                </p>
              </div>

              <div className="mt-6">
                <div className="flex items-center">
                  <CheckIcon
                    className="h-5 w-5 flex-shrink-0 text-green-500"
                    aria-hidden="true"
                  />
                  <p className="ml-2 text-sm text-gray-500">
                    {currentCourse.duration} hours of content
                  </p>
                </div>
                <div className="flex items-center">
                  <CheckIcon
                    className="h-5 w-5 flex-shrink-0 text-green-500"
                    aria-hidden="true"
                  />
                  <p className="ml-2 text-sm text-gray-500">
                    Certificate of completion
                  </p>
                </div>
                <div className="flex items-center">
                  <CheckIcon
                    className="h-5 w-5 flex-shrink-0 text-green-500"
                    aria-hidden="true"
                  />
                  <p className="ml-2 text-sm text-gray-500">
                    Lifetime access
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Course Modules */}
          <div className="mt-10 lg:col-start-2 lg:row-span-2 lg:mt-0 lg:self-center">
            <div className="overflow-hidden rounded-lg bg-gray-50">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Course Modules
                </h3>
                <div className="mt-5">
                  <div className="flow-root">
                    <ul role="list" className="-mb-8">
                      {currentCourse.modules?.map((module, moduleIdx) => (
                        <li key={module._id}>
                          <div className="relative pb-8">
                            {moduleIdx !== currentCourse.modules.length - 1 && (
                              <span
                                className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                                aria-hidden="true"
                              />
                            )}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center ring-8 ring-white">
                                  <span className="text-white text-sm">
                                    {moduleIdx + 1}
                                  </span>
                                </span>
                              </div>
                              <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                <div>
                                  <button
                                    onClick={() => setSelectedModule(module)}
                                    className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                                  >
                                    {module.title}
                                  </button>
                                  <p className="text-sm text-gray-500">
                                    {module.description}
                                  </p>
                                </div>
                                <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                  {module.duration} min
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enroll Button */}
          <div className="mt-10 lg:col-start-1">
            <button
              onClick={handleEnroll}
              className="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Enroll Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
