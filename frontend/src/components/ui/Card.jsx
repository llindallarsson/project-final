export function Card({ className = "", children }) {
  return (
    <div className={`bg-white rounded-2xl shadow-card ${className}`}>
      {children}
    </div>
  );
}
export function CardHeader({ className = "", children }) {
  return <div className={`p-4 border-b ${className}`}>{children}</div>;
}
export function CardContent({ className = "", children }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
