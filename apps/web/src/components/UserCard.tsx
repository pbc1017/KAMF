'use client';

import { User, UserRole } from '@kamf/interface/types/user.js';

interface UserCardProps {
  user: User;
}

export function UserCard({ user }: UserCardProps) {
  return (
    <div className="max-w-sm mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
      <div className="p-8">
        <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
          {user.roles.map(role => role).join(', ')}
        </div>
        <h3 className="block mt-1 text-lg leading-tight font-medium text-black">
          {user.displayName}
        </h3>
        <p className="mt-2 text-gray-500">@{user.phoneNumber}</p>
        <p className="mt-2 text-gray-500">{user.displayName}</p>
        <div className="mt-4">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              user.roles.some(role => role === UserRole.USER)
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {user.roles.some(role => role === UserRole.USER) ? 'Active' : 'Inactive'}
          </span>
        </div>
        <p className="mt-4 text-xs text-gray-400">Created: {user.createdAt.toLocaleDateString()}</p>
      </div>
    </div>
  );
}
