import "./FormInput.scss";

export default function FormInput({
  fieldData,
  label,
  error,
  placeholder,
  type = "text",
  classNames = "",
  required = true,
  ...props
}) {
  return (
    <div className={`form-input ${classNames}`}>
      <label className="w-full">{label || fieldData.label}</label>
      <input
        type={type}
        placeholder={placeholder || fieldData.placeholder}
        required={required || fieldData.required}
        className={`${error || fieldData.error ? "input-error" : ""}`}
        {...props}
      />
      {(error || fieldData.error) && (
        <span className="error">{error || fieldData.error}</span>
      )}
    </div>
  );
}
