export default function Input({ label, id, hint, className = "", ...props }) {
  return (
    <div className='grid gap-1.5'>
      {label && <label htmlFor={id}>{label}</label>}
      <input id={id} className={`form-input ${className}`} {...props} />
      {hint && <p className='text-xs text-gray-500'>{hint}</p>}
    </div>
  );
}
