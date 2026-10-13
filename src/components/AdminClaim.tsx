import { useState } from 'react';
import { Shield, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export function AdminClaim() {
  const { claimAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleClaim() {
    setLoading(true);
    const { success, error } = await claimAdmin();
    if (success) {
      setResult({ success: true, message: 'You are now the admin!' });
    } else {
      setResult({ success: false, message: error ?? 'Unable to claim admin.' });
    }
    setLoading(false);
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-50 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-accent-600" />
          </div>
          <h2 className="font-serif text-xl font-bold text-gray-900 mb-2">Claim Admin Access</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            No administrator has been set up yet. As the first member to sign in, you can claim admin privileges to manage members, approve photos, and oversee the platform.
          </p>

          {result ? (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
              result.success ? 'bg-primary-50 text-primary-700' : 'bg-red-50 text-red-600'
            }`}>
              {result.success ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              {result.message}
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={loading}
              className="w-full bg-accent-600 hover:bg-accent-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Claim Admin Role
            </button>
          )}

          {!result?.success && (
            <p className="text-xs text-gray-400 mt-4">
              This option is only available until the first admin is claimed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
