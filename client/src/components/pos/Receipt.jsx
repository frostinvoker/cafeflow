import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../styles/Receipt.css";

export default function Receipt() {
  const { checkoutId } = useParams();
  const navigate = useNavigate();
  const [checkout, setCheckout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCheckout = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/checkouts/${checkoutId}`,
          {
            credentials: "include",
          }
        );
        const data = await res.json();
        setCheckout(data);
      } catch (error) {
        console.error("Error fetching checkout:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCheckout();
  }, [checkoutId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!checkout) {
    return <div>Checkout not found</div>;
  }

  const formatPHP = (n) =>
    typeof n === "number"
      ? new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: "PHP",
        }).format(n)
      : "—";

  return (
    <div className="default-container-receipt">
      <div className="receipt-container">
        <div className="receipt">
          <svg
            width="100"
            height="100"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M100 175C109.849 175 119.602 173.06 128.701 169.291C137.801 165.522 146.069 159.997 153.033 153.033C159.997 146.069 165.522 137.801 169.291 128.701C173.06 119.602 175 109.849 175 100C175 90.1509 173.06 80.3982 169.291 71.2987C165.522 62.1993 159.997 53.9314 153.033 46.967C146.069 40.0026 137.801 34.4781 128.701 30.709C119.602 26.9399 109.849 25 100 25C80.1088 25 61.0322 32.9018 46.967 46.967C32.9018 61.0322 25 80.1088 25 100C25 119.891 32.9018 138.968 46.967 153.033C61.0322 167.098 80.1088 175 100 175ZM98.0667 130.333L139.733 80.3333L126.933 69.6667L91.1 112.658L72.5583 94.1083L60.775 105.892L85.775 130.892L92.225 137.342L98.0667 130.333Z"
              fill="#4CAF50"
            />
          </svg>
          <h2>Payment Successful!</h2>
          <div className="orders">
            {checkout.items.map((li) => {
              const addonsText =
                li.addons && li.addons.length > 0
                  ? " + " + li.addons.map((a) => a.name).join(", ")
                  : "";
              const lineTotal =
                (li.price +
                  (li.addons || []).reduce((s, a) => s + (a.price || 0), 0)) *
                (li.quantity || 1);
              return (
                <div key={li.menuItem} className="order-item">
                  <div className="order-name-qty">
                    <p>
                      {li.name} x{li.quantity}
                    </p>
                    <p>{formatPHP(lineTotal)}</p>
                  </div>
                  <div className="order-addons">
                    <small>{addonsText}</small>
                  </div>
                </div>
              );
            })}
            <div className="total">
              <h3>Total</h3>
              <h3>{formatPHP(checkout.total)}</h3>
            </div>
            <div className="payment">
              <p>Payment Method:</p>
              <p>{checkout.paymentMethod}</p>
            </div>
          </div>
          <div className="buttons">
            <button className="long-button">Print Receipt</button>
            <button
              className="gray-long-button"
              onClick={() => navigate("/pos")}
            >
              Back to POS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
