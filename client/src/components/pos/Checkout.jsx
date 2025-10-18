import { NavLink } from "react-router-dom";
import "../../styles/Checkout.css";

export default function Checkout() {
    return(
        <div>
            <h2>Checkout</h2>
            <div className="checkout-container">
                <div className="summary">
                    <h2>Order Summary</h2>
                    <div className="orders">
                        <div className="ordered-item">
                            <p>Cafe Latte (12oz) x1</p>
                            <p>₱120</p>
                        </div>
                        <div className="ordered-item">
                            <p>Americano (12oz) x3</p>
                            <p>₱300</p>
                        </div>
                    </div>
                    <div className="total">
                        <h2>Total</h2>
                        <h2>₱420</h2>
                    </div>
                </div>
                <div className="payment">
                    <h2>Payment Method</h2>
                    <div className="payment-options">
                        <div className="cash">
                            <img src="../../assets/cash.png" alt="" />
                        </div>
                        <div className="GCash">
                            <img src="../../assets/gcash.png" alt="" />
                        </div>
                    </div>
                    <NavLink to="/pos/checkout/receipt" className="long-button">Confirm Payment</NavLink>
                </div>
            </div>
        </div>
    )
}