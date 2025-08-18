export default function Input({ label, id, hint, className = "", ...props }) {
  return (
    <div className='grid gap-1.5'>
      {label && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        className={`border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-vindra-300 focus:border-vindra-400 ${className}`}
        {...props}
      />
      {hint && <p className='text-xs text-gray-500'>{hint}</p>}
    </div>
  );
}
