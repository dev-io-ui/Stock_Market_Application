import React from 'react';
import { useSelector } from 'react-redux';
import UserProfile from '../components/community/UserProfile';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div>
      <UserProfile userId={user?._id} />
    </div>
  );
};

export default Profile;
