import { useState } from "react";
import { logDiet } from "../api/nutritionApi.js";

export default function LogDiet() {
  const [form, setForm] = useState({
    child_id: "",
    log_date: new Date().toISOString().split("T")[0],
    food_items: [{ name: "", quantity_g: "" }],
  });
  const [message, setMessage] = useState("");

  const updateField = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const addFoodItem = () => {
    setForm({
      ...form,
      food_items: [...form.food_items, { name: "", quantity_g: "" }],
    });
  };

  const updateFoodItem = (index, field, value) => {
    const items = [...form.food_items];
    items[index][field] = value;
    setForm({ ...form, food_items: items });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      const payload = {
        ...form,
        food_items: form.food_items.filter((item) => item.name),
      };
      if (!payload.food_items.length) {
        setMessage("Add at least one food item.");
        return;
      }
      await logDiet(payload);
      setMessage("Diet log saved. AI analysis in progress...");
      setForm({
        child_id: "",
        log_date: new Date().toISOString().split("T")[0],
        food_items: [{ name: "", quantity_g: "" }],
      });
    } catch (err) {
      setMessage("Failed to save diet log.");
    }
  };

  return (
    <div className="page">
      <h1>Log Diet</h1>
      <form className="card form-stack" onSubmit={handleSubmit}>
        <input
          placeholder="Child ID"
          value={form.child_id}
          onChange={(e) => updateField("child_id", e.target.value)}
        />
        <input
          placeholder="Date (YYYY-MM-DD)"
          type="date"
          value={form.log_date}
          onChange={(e) => updateField("log_date", e.target.value)}
        />
        <h3>Food Items</h3>
        {form.food_items.map((item, idx) => (
          <div key={idx} style={{ marginBottom: 12 }}>
            <input
              placeholder="Food name"
              value={item.name}
              onChange={(e) => updateFoodItem(idx, "name", e.target.value)}
            />
            <input
              placeholder="Quantity (g)"
              value={item.quantity_g}
              onChange={(e) => updateFoodItem(idx, "quantity_g", e.target.value)}
            />
          </div>
        ))}
        <button type="button" onClick={addFoodItem}>
          + Add Food
        </button>
        <button type="submit">Save Diet Log</button>
      </form>
      {message ? <p>{message}</p> : null}
    </div>
  );
}
