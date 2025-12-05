import React, { useEffect, useState } from 'react';
import { Icons } from './Icon';
import { AuthService } from '../services/authService';
import { User } from '../types';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  const loadUsers = () => {
    setUsers(AuthService.getAllUsers());
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUpdateLimit = (userId: string, currentLimit: number, change: number) => {
    const newLimit = Math.max(0, currentLimit + change);
    AuthService.updateUserLimit(userId, newLimit);
    loadUsers();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Icons.Users className="w-5 h-5 text-indigo-600" />
          User Management
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Usage Today</th>
                <th className="px-4 py-3">Daily Limit</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <Icons.User className="w-4 h-4" />
                       </div>
                       {user.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-full max-w-[100px] h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${user.creditsUsed >= user.maxCredits ? 'bg-red-500' : 'bg-indigo-500'}`}
                          style={{ width: `${Math.min(100, (user.creditsUsed / user.maxCredits) * 100)}%` }}
                        />
                      </div>
                      <span className="text-slate-600">{user.creditsUsed}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {user.maxCredits}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleUpdateLimit(user.id, user.maxCredits, -5)}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500"
                        title="Decrease limit"
                      >
                        <Icons.Minus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleUpdateLimit(user.id, user.maxCredits, 5)}
                        className="p-1 hover:bg-indigo-50 text-indigo-600 rounded bg-indigo-50"
                        title="Increase limit"
                      >
                        <Icons.Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
