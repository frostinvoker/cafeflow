import "../styles/Customers.css";
export default function Customers() {
  return (
        <div className="default-container">
          <h2>Customer Management</h2>
          <button className="add-customer">Add New Customer</button>
          <table className="customer" cellSpacing={0} cellPadding={0}>

            <tr className="table-header">
              <th>Customer</th>
              <th>Contact</th>
              <th>Loyalty Points</th>
              <th>Actions</th>
            </tr>
          
            <tr className="table-body">
              <td>Nicholas</td>
              <td>0912-345-6789</td>
              <td>150</td>
              <td className="buttons">
                <button className="edit">Edit</button>
                <button className="remove">Remove</button>
              </td>
            </tr>
            <tr className="table-body">
              <td>Mark Jayson Laderas</td>
              <td>0912-345-6789</td>
              <td>80 </td>
              <td className="buttons">
                <button className="edit">Edit</button>
                <button className="remove">Remove</button>
              </td>
            </tr>
            <tr className="table-body">
              <td>Rhenalyn Cuaresma</td>
              <td>0912-345-6789</td>
              <td>45</td>
              <td className="buttons">
                <button className="edit">Edit</button>
                <button className="remove">Remove</button>
              </td>
            </tr>
            <tr className="table-body">
              <td>John Joseph Ginez</td>
              <td>0912-345-6789</td>
              <td>100</td>
              <td className="buttons">
                <button className="edit">Edit</button>
                <button className="remove">Remove</button>
              </td>
            </tr>
            <tr className="table-body">
              <td>Andrea Evangelista</td>
              <td>0912-345-6789</td>
              <td>300</td>
              <td className="buttons">
                <button className="edit">Edit</button>
                <button className="remove">Remove</button>
              </td>
            </tr>
          </table>
        </div>
    );
}