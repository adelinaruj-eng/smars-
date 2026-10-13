import { useEffect, useState } from 'react';
import { Search, Shield, ShieldCheck, ShieldOff, UserCheck, UserX, Loader2, Mail, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Avatar } from '@/components/Avatar';
import { AdminClaim } from '@/components/AdminClaim';
import { formatLastSeen } from '@/lib/formatTime';
import type { Profile } from '@/lib/types';

export function AdminPortal() {
  const { user, profile, isOnline, getLastSeen } = useAuth();
  const [members, setMembers] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'admins'>('all');
  const [adminExists, setAdminExists] = useState<boolean | null>(null);

  async function loadMembers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setMembers((data as Profile[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadMembers();
    supabase.from('profiles').select('id').eq('is_admin', true).limit(1).maybeSingle().then(({ data }) => {
      setAdminExists(!!data);
    });
  }, []);

  async function toggleAdmin(target: Profile) {
    setActionLoading(target.id);
    const { error } = await supabase.rpc('set_member_admin_status', {
      p_target: target.id,
      p_is_admin: !target.is_admin,
    });
    if (error) {
      alert(error.message);
    } else {
      await loadMembers();
    }
    setActionLoading(null);
  }

  async function toggleActive(target: Profile) {
    setActionLoading(target.id);
    const { error } = await supabase.rpc('set_member_active_status', {
      p_target: target.id,
      p_is_active: !target.is_active,
    });
    if (error) {
      alert(error.message);
    } else {
      await loadMembers();
    }
    setActionLoading(null);
  }

  if (!profile?.is_admin) {
    if (adminExists === false) {
      return <AdminClaim />;
    }
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ShieldOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-500">Admin Access Required</p>
          <p className="text-sm text-gray-400 mt-1">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.display_name.toLowerCase().includes(search.toLowerCase()) ||
      m.full_name.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === 'active') return m.is_active;
    if (filter === 'inactive') return !m.is_active;
    if (filter === 'admins') return m.is_admin;
    return true;
  });

  const stats = {
    total: members.length,
    active: members.filter((m) => m.is_active).length,
    admins: members.filter((m) => m.is_admin).length,
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-1">
          <Shield className="w-6 h-6 text-accent-600" />
          <h2 className="font-serif text-2xl font-bold text-gray-900">Admin Portal</h2>
        </div>
        <p className="text-sm text-gray-500 mb-8">Manage members of the Class of 2025</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-400 mt-1">Total Members</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-3xl font-bold text-primary-600">{stats.active}</p>
            <p className="text-sm text-gray-400 mt-1">Active</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-3xl font-bold text-accent-600">{stats.admins}</p>
            <p className="text-sm text-gray-400 mt-1">Administrators</p>
          </div>
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
            {(['all', 'active', 'inactive', 'admins'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                  filter === f ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Members table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading members...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No members found</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredMembers.map((m) => {
                const isSelf = m.id === user?.id;
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <Avatar profile={m} size="lg" showStatus isOnline={isOnline(m.id)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {m.full_name || m.display_name}
                        </p>
                        {m.is_admin && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-50 text-accent-700 text-xs font-medium rounded-full">
                            <ShieldCheck className="w-3 h-3" />
                            Admin
                          </span>
                        )}
                        {!m.is_active && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-xs font-medium rounded-full">
                            Inactive
                          </span>
                        )}
                        {isSelf && (
                          <span className="text-xs text-gray-400">(You)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className={`text-xs flex items-center gap-1 ${isOnline(m.id) ? 'text-green-500' : 'text-gray-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isOnline(m.id) ? 'bg-green-500' : 'bg-gray-300'}`} />
                          {isOnline(m.id) ? 'Online' : formatLastSeen(getLastSeen(m.id))}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {m.display_name}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(m.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAdmin(m)}
                        disabled={isSelf || actionLoading === m.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 ${
                          m.is_admin
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-accent-50 text-accent-700 hover:bg-accent-100'
                        }`}
                        title={m.is_admin ? 'Remove admin' : 'Make admin'}
                      >
                        {actionLoading === m.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        )}
                        {m.is_admin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                      <button
                        onClick={() => toggleActive(m)}
                        disabled={isSelf || actionLoading === m.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 ${
                          m.is_active
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                        }`}
                        title={m.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {m.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        {m.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
