import './DataTable.css';

export default function DataTable({
  columns,
  rows,
  getRowKey,
  minWidth,
  className = '',
  emptyMessage,
}) {
  if (!rows.length) {
    return emptyMessage ? <p className="dashboard-empty">{emptyMessage}</p> : null;
  }

  return (
    <div className="data-table-wrap">
      <table className={`data-table ${className}`} style={minWidth ? { minWidth } : undefined}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={column.align ? `is-align-${column.align}` : undefined}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={getRowKey ? getRowKey(row, rowIndex) : rowIndex}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={column.align ? `is-align-${column.align}` : undefined}
                >
                  {typeof column.render === 'function'
                    ? column.render(row)
                    : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
