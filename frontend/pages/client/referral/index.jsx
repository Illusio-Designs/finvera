import { useEffect, useState } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ClientLayout from '../../../components/layouts/ClientLayout';
import { referralAPI } from '../../../lib/api';
import toast from 'react-hot-toast';
import Badge from '../../../components/ui/Badge';
import { FiCopy, FiGift, FiCheckCircle } from 'react-icons/fi';

export default function ClientReferralPage() {
  const [referralCode, setReferralCode] = useState(null);
  const [discountConfig, setDiscountConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [codeResponse, configResponse] = await Promise.all([
        referralAPI.getMyCode(),
        referralAPI.discountConfig.getCurrent(),
      ]);
      setReferralCode(codeResponse.data?.referralCode || codeResponse.data);
      setDiscountConfig(configResponse.data?.data || configResponse.data);
    } catch (error) {
      toast.error('Failed to load referral information');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (referralCode?.code) {
      try {
        await navigator.clipboard.writeText(referralCode.code);
        setCopied(true);
        toast.success('Referral code copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error('Failed to copy code');
      }
    }
  };

  const shareLink = referralCode?.code
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/pricing?ref=${referralCode.code}`
    : '';

  if (loading) {
    return (
      <ProtectedRoute portalType="client">
        <ClientLayout title="Referral Program">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </ClientLayout>
      </ProtectedRoute>
    );
  }

  const discountPercentage = discountConfig?.discount_percentage || referralCode?.discount_value || 10;

  return (
    <ProtectedRoute portalType="client">
      <ClientLayout title="Referral Program">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <FiGift className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Referral Program</h1>
            </div>
            <p className="text-gray-600">
              Share your referral code and earn rewards! When someone uses your code to subscribe,
              they&apos;ll get a discount on their subscription.
            </p>
          </div>

          {/* Discount Badge */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium opacity-90 mb-1">Current Discount</div>
                <div className="text-4xl font-bold">{discountPercentage}% OFF</div>
                <div className="text-sm opacity-75 mt-1">For new subscribers using your code</div>
              </div>
              <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-lg px-4 py-2">
                {discountPercentage}% OFF
              </Badge>
            </div>
          </div>

          {/* Referral Code Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Code</h2>
            {referralCode ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                    <div className="text-sm text-gray-600 mb-1">Code</div>
                    <div className="text-2xl font-mono font-bold text-primary-600">
                      {referralCode.code}
                    </div>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <FiCheckCircle className="h-5 w-5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <FiCopy className="h-5 w-5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-blue-900 mb-2">Share Link</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="flex-1 bg-white border border-blue-200 rounded px-3 py-2 text-sm font-mono"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareLink);
                        toast.success('Link copied!');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Uses</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {referralCode.current_uses || 0}
                    </div>
                    {referralCode.max_uses && (
                      <div className="text-xs text-gray-500 mt-1">
                        of {referralCode.max_uses} max
                      </div>
                    )}
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Status</div>
                    <Badge variant={referralCode.is_active ? 'success' : 'danger'}>
                      {referralCode.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Discount</div>
                    <div className="text-2xl font-bold text-primary-600">
                      {referralCode.discount_value || discountPercentage}%
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No referral code found. Please contact support.
              </div>
            )}
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                  1
                </div>
                <div>
                  <div className="font-medium text-gray-900">Share Your Code</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Share your referral code or link with friends, colleagues, or on social media.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                  2
                </div>
                <div>
                  <div className="font-medium text-gray-900">They Subscribe</div>
                  <div className="text-sm text-gray-600 mt-1">
                    When someone uses your code to subscribe, they get {discountPercentage}% off on their subscription.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                  3
                </div>
                <div>
                  <div className="font-medium text-gray-900">Track Your Referrals</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Monitor how many people have used your code and the rewards you&apos;ve earned.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ClientLayout>
    </ProtectedRoute>
  );
}
