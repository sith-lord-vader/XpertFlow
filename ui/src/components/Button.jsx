import "./Button.scss";

export default function Button({ label, onClick, classNames = "", ...props }) {
  return (
    <button className={`button ${classNames}`} onClick={onClick} {...props}>
      {label}
    </button>
  );
}
