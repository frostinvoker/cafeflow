import "../styles/Menu.css";

export default function Menu() {
  return (
        <div className="default-container">
          <h2>Cafe Menu Management</h2>
          <div className="header-buttons">
            <button>Add New Item</button>
            <button>Save Changes</button>
          </div>
          <table className="customer" cellSpacing={0} cellPadding={0}>

            <tr className="table-header">
              <th>Item</th>
              <th>Category</th>
              <th>Price</th>
              <th>Availability</th>
              <th>Actions</th>
            </tr>
          
            <tr className="table-body">
              <td>Caramel Macchiato</td>
              <td>Coffee</td>
              <td>₱150</td>
              <td>Available</td>
              <td className="buttons">
                <button className="edit">Edit</button>
                <button className="remove">Remove</button>
              </td>
            </tr>
            <tr className="table-body">
              <td>Iced Latte</td>
              <td>Coffee</td>
              <td>₱120</td>
              <td>Low Stock</td>
              <td className="buttons">
                <button className="edit">Edit</button>
                <button className="remove">Remove</button>
              </td>
            </tr>
            <tr className="table-body">
              <td>Blueberry Cheesecake</td>
              <td>Dessert</td>
              <td>₱180</td>
              <td>Available</td>
              <td className="buttons">
                <button className="edit">Edit</button>
                <button className="remove">Remove</button>
              </td>
            </tr>
            <tr className="table-body">
              <td>Ham & Cheese Sandwich</td>
              <td>Snack</td>
              <td>₱95</td>
              <td>Out of stock</td>
              <td className="buttons">
                <button className="edit">Edit</button>
                <button className="remove">Remove</button>
              </td>
            </tr>
          </table>
        </div>
    );
}