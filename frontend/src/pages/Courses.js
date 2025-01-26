import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CourseList from '../components/courses/CourseList';
import CourseDetail from '../components/courses/CourseDetail';
import ModuleContent from '../components/courses/ModuleContent';

const Courses = () => {
  return (
    <Routes>
      <Route path="/" element={<CourseList />} />
      <Route path="/:courseId" element={<CourseDetail />} />
      <Route path="/:courseId/modules/:moduleId" element={<ModuleContent />} />
    </Routes>
  );
};

export default Courses;
