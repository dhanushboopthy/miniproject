import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listChildren } from "../api/childrenApi.js";

export default function ChildrenList() {
  const [children, setChildren] = useState([]);

  useEffect(() => {
    listChildren().then(setChildren).catch(() => setChildren([]));
  }, []);

  return (
    <div className="page">
      <h1>Children</h1>
      <div className="card">
        <ul>
        {children.map((child) => (
          <li key={child.id}>
            <Link to={`/children/${child.child_id}`}>
              {child.name} - {child.child_id}
            </Link>
          </li>
        ))}
        </ul>
      </div>
    </div>
  );
}
