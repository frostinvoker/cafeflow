import { NavLink} from "react-router-dom";
import "../styles/pos.css";

export default function Pos() {
  return (
        <div className="pos-container">
            <div className="products-container">
                <h2>Product Selection</h2>
                <div className="product-list">
                    <div className="product">
                        <div className="square shape"></div>
                        <p>Cafe Latte</p>
                        <h4>₱120</h4>
                    </div>
                    <div className="product">
                        <div className="square shape"></div>
                        <p>Americano</p>
                        <h4>₱100</h4>
                    </div>
                    <div className="product">
                        <div className="square shape"></div>
                        <p>Caffee Mocha</p>
                        <h4>₱150</h4>
                    </div>
                    <div className="product">
                        <div className="square shape"></div>
                        <p>Matcha</p>
                        <h4>₱150</h4>
                    </div>
                </div>
            </div>
            <div className="checkout">
                <h2>Current Order</h2>
                <div className="total">
                    <h4>Total</h4>
                    <h4>₱0</h4>
                </div>
                <NavLink to="/pos/checkout" className="checkout-btn">Checkout</NavLink>
            </div>
        </div>
    );
}