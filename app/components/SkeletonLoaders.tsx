export function DashboardStatsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Progress Skeleton */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="space-y-4">
          <div className="h-5 bg-gray-200 rounded animate-pulse w-1/3"></div>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-full"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
        </div>
      </div>
    </div>
  )
}

export function DocumentListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search Bar Skeleton */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="space-y-3">
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-full"></div>
          <div className="flex flex-wrap gap-3">
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-32"></div>
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-32"></div>
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-32"></div>
          </div>
        </div>
      </div>

      {/* Document Cards Skeleton */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 sm:p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>
              </div>

              {/* Document Info */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <div className="h-8 bg-gray-200 rounded-lg animate-pulse w-24"></div>
                <div className="flex space-x-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
      </div>

      {/* Alert Banner Skeleton */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 bg-orange-200 rounded animate-pulse"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-orange-200 rounded animate-pulse w-3/4"></div>
            <div className="h-3 bg-orange-200 rounded animate-pulse w-1/2"></div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-8"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-full"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Feed Skeleton */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ApprovalQueueSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="space-y-2">
          <div className="h-7 bg-gray-200 rounded animate-pulse w-48"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-64"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-32"></div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 rounded-full animate-pulse w-20"></div>
        ))}
      </div>

      {/* Table Skeleton for Desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border-b border-gray-50 last:border-b-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4"></div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex space-x-2">
                  <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Card Layout Skeleton for Mobile */}
      <div className="md:hidden space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </div>
              <div className="flex justify-end space-x-2">
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}