import { useState, useEffect } from "react";
import { csrfFetch } from "../../store/csrf";
import "./StorePage.css";

function StorePage() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchItems() {
      const response = await fetch("/api/store");
      const data = await response.json();
      setItems(data);
    }
    fetchItems();
  }, []);

  const handleBuy = async (itemId) => {
    try {
      const response = await csrfFetch("/api/store/buy", {
        method: "POST",
        body: JSON.stringify({ itemId }),
      });

      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      const errorData = await error.json();
      setMessage(errorData.message);
    }
  };

  return (
    <div className="store-container">
      <h2>Game Store</h2>
      {message && <p>{message}</p>}
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <span className="item-name">{item.name}</span>
            <span className="item-price">${item.price}</span>
            <button onClick={() => handleBuy(item.id)}>Buy</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StorePage;
