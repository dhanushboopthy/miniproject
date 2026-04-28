import { useEffect, useState } from "react";
import { createChild } from "../api/childrenApi.js";
import { useAuthStore } from "../auth/useAuth.js";

export default function RegisterChild() {
  const user = useAuthStore((state) => state.user);
  const [form, setForm] = useState({
    name: "",
    dob: "",
    gender: "female",
    awc_code: "",
    parent_name: "",
    parent_contact: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user?.awc_code) {
      setForm((prev) => ({ ...prev, awc_code: user.awc_code }));
    }
  }, [user]);

  const update = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      const created = await createChild(form);
      setMessage(`Registered ${created.name} (${created.child_id})`);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Registration failed.");
    }
  };

  return (
    <div className="page">
      <h1>Register Child</h1>
      <form className="card form-stack" onSubmit={handleSubmit}>
        <input placeholder="Name" value={form.name} onChange={update("name")} />
        <input
          placeholder="DOB"
          type="date"
          value={form.dob}
          onChange={update("dob")}
        />
        <input
          placeholder="Gender"
          value={form.gender}
          onChange={update("gender")}
        />
        <input
          placeholder="AWC Code"
          value={form.awc_code}
          onChange={update("awc_code")}
          readOnly={user?.role === "worker"}
        />
        <input
          placeholder="Parent Name"
          value={form.parent_name}
          onChange={update("parent_name")}
        />
        <input
          placeholder="Parent Contact"
          value={form.parent_contact}
          onChange={update("parent_contact")}
        />
        <button type="submit">Register</button>
      </form>
      {message ? <p>{message}</p> : null}
    </div>
  );
}
