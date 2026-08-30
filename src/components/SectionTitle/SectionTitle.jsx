import "./SectionTitle.css";

function SectionTitle({
  eyebrow,
  title,
  description,
  centered = false,
}) {
  return (
    <div className={`section-title ${centered ? "centered" : ""}`}>
      {eyebrow && <span>{eyebrow}</span>}

      <h2>{title}</h2>

      {description && <p>{description}</p>}
    </div>
  );
}

export default SectionTitle;