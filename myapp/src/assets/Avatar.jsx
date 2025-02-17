import React from 'react';

function Avatar({ userId, username, online = true }) {
  const initial = username ? username[0] : "?";
  const colors = ['bg-red-200', 'bg-green-200', 'bg-purple-200', 'bg-blue-200', 'bg-yellow-200', 'bg-teal-200'];

  const userIdBased10 = parseInt(userId, 16);  
  const colorIndex = userIdBased10 % colors.length;
  const color = colors[colorIndex];


  return (
    <div className={`w-8 h-8 ${color} relative rounded-full flex items-center justify-center text-center`}>
      <div className="text-center font-bold text-lg text-gray-700">
        {initial}
      </div>
      {online && (
        <div className="absolute h-3 w-3 bg-green-500 rounded-full border border-white bottom-0 right-0"></div>
      )}
      {!online && (
        <div className="absolute h-3 w-3 bg-gray-500 rounded-full border border-white bottom-0 right-0"></div>
      )}
    </div>
  );
}

export default Avatar;
