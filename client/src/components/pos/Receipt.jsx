import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../styles/Receipt.css";
import { useReceipt } from "../../hooks/useReceipt";
import PrintableReceipt from "./PrintableReceipt";

export default function Receipt() {
  const { checkoutId } = useParams();
  const navigate = useNavigate();

  const { checkout, loading, err, setErr, load, moneyPHP, lineTotal, printReceipt, setPrintTarget } = useReceipt();

  useEffect(() => {
    setErr("");
    load(checkoutId);
  }, [checkoutId, load, setErr]);

  if (loading) return <div className="default-container-receipt">Loading…</div>;
  if (err) return <div className="default-container-receipt" style={{ color: "#b91c1c" }}>{err}</div>;
  if (!checkout) return <div className="default-container-receipt">Checkout not found</div>;

  return (
    <div className="default-container-receipt">
      <div style={{ position: "fixed", left: -10000, top: 0 }}>
        <PrintableReceipt
          ref={setPrintTarget}  
          checkout={checkout}
          moneyPHP={moneyPHP}
          lineTotal={lineTotal}
        />
      </div>
      <div className="receipt-container">
        <div className="receipt">
          <svg width="100" height="100" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd" clipRule="evenodd"
              d="M100 175C109.849 175 119.602 173.06 128.701 169.291C137.801 165.522 146.069 159.997 153.033 153.033C159.997 146.069 165.522 137.801 169.291 128.701C173.06 119.602 175 109.849 175 100C175 90.1509 173.06 80.3982 169.291 71.2987C165.522 62.1993 159.997 53.9314 153.033 46.967C146.069 40.0026 137.801 34.4781 128.701 30.709C119.602 26.9399 109.849 25 100 25C80.1088 25 61.0322 32.9018 46.967 46.967C32.9018 61.0322 25 80.1088 25 100C25 119.891 32.9018 138.968 46.967 153.033C61.0322 167.098 80.1088 175 100 175ZM98.0667 130.333L139.733 80.3333L126.933 69.6667L91.1 112.658L72.5583 94.1083L60.775 105.892L85.775 130.892L92.225 137.342L98.0667 130.333Z"
              fill="#4CAF50"
            />
          </svg>

          <h2>Payment Successful!</h2>

          <div className="orders">
            {checkout.items.map((li) => (
              <div key={`${li.menuItem}-${li.size || ""}`} className="order-item">
                <div className="order-name-qty">
                  <p>
                    {li.name}{li.size ? ` (${li.size})` : ""} x{li.quantity}
                  </p>
                  <p>{moneyPHP(lineTotal(li))}</p>
                </div>
                {Array.isArray(li.addons) && li.addons.length > 0 && (
                  <div className="order-addons">
                    {li.addons.map((a, idx) => <small key={idx}>+ {a.name}</small>)}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="payment-info">
            <div className="total">
              <h3>Total:</h3>
              <h3>{moneyPHP(checkout.total)}</h3>
            </div>

            <div className="total">
              <h4>Cash received:</h4>
              <h4>{moneyPHP(checkout?.payment?.tendered ?? 0)}</h4>
            </div>

            <div className="total">
              <h4>Change:</h4>
              <h4>{moneyPHP(checkout?.payment?.change ?? 0)}</h4>
            </div>

            <div className="payment">
              <p>Payment Method:</p>
              <p>{checkout.paymentMethod}</p>
            </div>
          </div>

          <div className="loyaltypts-info">
            <div className="total">
              <h4>Customer:</h4>
              <h4>{checkout?.customerSnapshot?.name?.trim() || "none"}</h4>
            </div>
            <div className="total">
              <h4>Points Received:</h4>
              <h4>{checkout.pointsEarned ?? 0}</h4>
            </div>
          </div>

          <div className="buttons">
            <button className="long-button" onClick={printReceipt}>Print Receipt</button>
            <button className="gray-long-button" onClick={() => navigate("/pos")}>
              Back to POS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
