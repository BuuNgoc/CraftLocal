import React from 'react';

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  loading?: boolean;
}

function DataTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'Không tìm thấy dữ liệu.',
  loading = false,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="w-full bg-white rounded-2xl border border-[#E6DED5] p-8 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#EADCCB] border-t-[#A65A3A] animate-spin" />
        <p className="text-sm text-[#7A6A5E]">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-white rounded-2xl border border-[#E6DED5] p-8 text-center text-[#7A6A5E]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-[#E6DED5] overflow-hidden shadow-sm">
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#FAF7F2] border-b border-[#E6DED5]">
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#7A6A5E] ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6DED5]">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="hover:bg-[#FAF7F2]/50 transition-colors"
              >
                {columns.map((col, index) => (
                  <td
                    key={index}
                    className={`px-6 py-4 text-[15px] text-[#2F2722] ${col.className || ''}`}
                  >
                    {col.accessor(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
export type { Column };
