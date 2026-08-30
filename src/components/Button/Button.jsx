import { Link } from "react-router-dom";
import "./Button.css";

function Button({
  children,
  to,
  onClick,
  variant = "primary",
  type = "button",
  className = "",
}) {
  const classes = `button button-${variant} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={classes}
    >
      {children}
    </button>
  );
}

export default Button;