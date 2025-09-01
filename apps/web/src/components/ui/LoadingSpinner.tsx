/**
 * 공통 로딩 스피너 컴포넌트
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'white' | 'gray';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({
  size = 'md',
  color = 'blue',
  text,
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const colorClasses = {
    blue: 'border-blue-600',
    white: 'border-white',
    gray: 'border-gray-600',
  };

  const spinnerClass = `animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]}`;

  if (text) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={spinnerClass}></div>
        <span className="text-gray-600">{text}</span>
      </div>
    );
  }

  return <div className={`${spinnerClass} ${className}`}></div>;
}

/**
 * 전체 화면 로딩 컴포넌트
 */
export function FullScreenLoading({ text = '로딩 중...' }: { text?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}
