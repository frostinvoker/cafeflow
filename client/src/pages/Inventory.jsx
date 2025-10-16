import "../styles/Inventory.css";

export default function Inventory() {
  return (
        <div className="default-container">
            <h2>Inventory</h2>
            <div className="low-supply-alert"><p>Low Supply Alert: Milk (5 left), Sugar (8 left)</p></div>
            <div className="inventory-header">
                <div className="total-items"><p>Total items: 12</p></div>
                <button className="add-new-item">+ Add New Item</button>
            </div>
            <div className="inventory-list">
                <div className="item">
                    <h4>Milk</h4>
                    <p>Stock: 10 liters</p>
                    <p>₱90 / liter</p>
                    <div className="buttons">
                        <button className="add">Add</button>
                        <button className="remove">Remove</button>
                    </div>
                </div>
                                <div className="item">
                    <h4>Sugar</h4>
                    <p>Stock: 8 kg</p>
                    <p>₱60 / liter</p>
                    <div className="buttons">
                        <button className="add">Add</button>
                        <button className="remove">Remove</button>
                    </div>
                </div>
                                <div className="item">
                    <h4>Coffee Cups</h4>
                    <p>Stock: 120 pcs</p>
                    <p>₱8 / pc</p>
                    <div className="buttons">
                        <button className="add">Add</button>
                        <button className="remove">Remove</button>
                    </div>
                </div>
                                <div className="item">
                    <h4>Chocolate Syrup</h4>
                    <p>Stock: 2 liters</p>
                    <p>₱70 / liter</p>
                    <div className="buttons">
                        <button className="add">Add</button>
                        <button className="remove">Remove</button>
                    </div>
                </div>
            </div>
        </div>
    );
}