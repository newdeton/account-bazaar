import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import "./CategoryCard.css";

function CategoryCard({ icon, title, description, to }) {
  return (
    <Link to={to} className="category-card">
      <div className="category-icon">
        {icon}
      </div>

      <div className="category-content">
        <h3>{title}</h3>
        <p>{description}</p>

        <span>
          Explore
          <FiArrowRight />
        </span>
      </div>
    </Link>
  );
}

export default CategoryCard;