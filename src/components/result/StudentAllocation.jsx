import {
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Printer,
  Users,
  Building2,
  CalendarDays,
  GraduationCap,
} from "lucide-react";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/*
|--------------------------------------------------------------------------
| Helper Functions
|--------------------------------------------------------------------------
*/

function getValue(...values) {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
  );
}

function getStudentRegister(student) {
  if (!student) return "-";

  return (
    getValue(
      student.registerNumber,
      student.register_number,
      student.registerNo,
      student.register_no,
      student.rollNumber,
      student.roll_number,
      student.rollNo,
      student.roll_no,
      student.register
    ) || "-"
  );
}

/*
  Important:
  Student name must not fall back to register number.
*/
function getStudentName(student) {
  if (!student) return "-";

  return (
    getValue(
      student.studentName,
      student.student_name,
      student.name,
      student.student?.name,
      student.student?.studentName,
      student.student?.student_name
    ) || "-"
  );
}

function getClassName(student) {
  if (!student) return "-";

  return (
    getValue(
      student.className,
      student.class_name,
      student.classLabel,
      student.class_label,
      student.department,
      student.course,
      student.student?.className
    ) || "-"
  );
}

function getHallName(row) {
  return (
    getValue(
      row.hallName,
      row.hall_name,
      row.hall,
      row.hall?.name
    ) || "-"
  );
}

function getFloor(row) {
  return (
    getValue(
      row.floor,
      row.hallFloor,
      row.hall_floor,
      row.hall?.floor
    ) || "-"
  );
}

function getSeatNumber(row) {
  return (
    getValue(
      row.seatNumber,
      row.seat_number,
      row.seat,
      row.seatNo,
      row.seat_no
    ) || "-"
  );
}

function getRowNumber(row) {
  return getValue(row.row, row.rowNumber, row.row_number) || "-";
}

function getColumnNumber(row) {
  return (
    getValue(row.column, row.columnNumber, row.column_number) || "-"
  );
}

function normalizeAllocationRows(allocation) {
  if (!allocation) return [];

  if (Array.isArray(allocation)) {
    return allocation;
  }

  if (Array.isArray(allocation.rows)) {
    return allocation.rows;
  }

  if (Array.isArray(allocation.students)) {
    return allocation.students;
  }

  if (Array.isArray(allocation.allocations)) {
    return allocation.allocations;
  }

  if (Array.isArray(allocation.results)) {
    return allocation.results;
  }

  if (Array.isArray(allocation.halls)) {
    return allocation.halls.flatMap((hall) => {
      if (Array.isArray(hall.students)) {
        return hall.students.map((student) => ({
          ...student,
          hallName: getValue(
            student.hallName,
            student.hall_name,
            hall.name,
            hall.hallName
          ),
          floor: getValue(
            student.floor,
            student.hallFloor,
            hall.floor
          ),
        }));
      }

      if (Array.isArray(hall.allocations)) {
        return hall.allocations.map((student) => ({
          ...student,
          hallName: getValue(
            student.hallName,
            student.hall_name,
            hall.name,
            hall.hallName
          ),
          floor: getValue(
            student.floor,
            student.hallFloor,
            hall.floor
          ),
        }));
      }

      return [];
    });
  }

  return [];
}

function getExamTitle(examDetails) {
  return (
    getValue(
      examDetails?.examName,
      examDetails?.exam_name,
      examDetails?.name,
      examDetails?.title,
      examDetails?.examinationName
    ) || "Examination"
  );
}

function getExamDate(examDetails) {
  return (
    getValue(
      examDetails?.examDate,
      examDetails?.exam_date,
      examDetails?.date
    ) || "-"
  );
}

function getExamSession(examDetails) {
  return (
    getValue(
      examDetails?.session,
      examDetails?.examSession,
      examDetails?.exam_session,
      examDetails?.timeSlot
    ) || "-"
  );
}

function formatDate(dateValue) {
  if (!dateValue || dateValue === "-") return "-";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function StudentAllocation({
  allocation,
  classes = [],
  examDetails = {},
}) {
  const rows = normalizeAllocationRows(allocation);

  const totalStudents = rows.length;

  const totalHalls = new Set(
    rows.map((row) => getHallName(row)).filter((hall) => hall !== "-")
  ).size;

  const totalClasses = new Set(
    rows.map((row) => getClassName(row)).filter((name) => name !== "-")
  ).size;

  /*
  |--------------------------------------------------------------------------
  | Export XLSX
  |--------------------------------------------------------------------------
  */

  const exportToExcel = () => {
    if (!rows.length) {
      window.alert("No student allocation data available to export.");
      return;
    }

    const excelRows = rows.map((row, index) => ({
      "Sl. No.": index + 1,
      "Register Number": getStudentRegister(row),
      "Student Name": getStudentName(row),
      "Class / Department": getClassName(row),
      "Hall": getHallName(row),
      "Floor": getFloor(row),
      "Seat Number": getSeatNumber(row),
      "Row": getRowNumber(row),
      "Column": getColumnNumber(row),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 20 },
      { wch: 30 },
      { wch: 24 },
      { wch: 18 },
      { wch: 12 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Student Allocation"
    );

    XLSX.writeFile(workbook, "Student_Allocation.xlsx");
  };

  /*
  |--------------------------------------------------------------------------
  | Export PDF
  |--------------------------------------------------------------------------
  */

  const exportToPDF = () => {
    if (!rows.length) {
      window.alert("No student allocation data available to export.");
      return;
    }

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(getExamTitle(examDetails), pageWidth / 2, 14, {
      align: "center",
    });

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");

    pdf.text(
      `Date: ${formatDate(getExamDate(examDetails))}`,
      14,
      22
    );

    pdf.text(
      `Session: ${getExamSession(examDetails)}`,
      14,
      28
    );

    pdf.text(
      `Total Students: ${totalStudents}`,
      pageWidth - 14,
      22,
      {
        align: "right",
      }
    );

    const tableRows = rows.map((row, index) => [
      index + 1,
      getStudentRegister(row),
      getStudentName(row),
      getClassName(row),
      getHallName(row),
      getSeatNumber(row),
      getRowNumber(row),
      getColumnNumber(row),
    ]);

    autoTable(pdf, {
      startY: 35,
      head: [
        [
          "Sl. No.",
          "Register Number",
          "Student Name",
          "Class / Department",
          "Hall",
          "Seat Number",
          "Row",
          "Column",
        ],
      ],
      body: tableRows,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: {
          cellWidth: 14,
          halign: "center",
        },
        1: {
          cellWidth: 32,
        },
        2: {
          cellWidth: 45,
        },
        3: {
          cellWidth: 35,
        },
        4: {
          cellWidth: 28,
        },
        5: {
          cellWidth: 28,
        },
        6: {
          cellWidth: 18,
          halign: "center",
        },
        7: {
          cellWidth: 18,
          halign: "center",
        },
      },
      didDrawPage: () => {
        const pageNumber = pdf.internal.getNumberOfPages();

        pdf.setFontSize(8);
        pdf.setTextColor(90, 90, 90);

        pdf.text(
          `Page ${pageNumber}`,
          pageWidth - 14,
          pdf.internal.pageSize.getHeight() - 8,
          {
            align: "right",
          }
        );
      },
    });

    pdf.save("Student_Allocation.pdf");
  };

  /*
  |--------------------------------------------------------------------------
  | Print
  |--------------------------------------------------------------------------
  */

  const printAllocation = () => {
    window.print();
  };

  /*
  |--------------------------------------------------------------------------
  | Start New Allocation
  |--------------------------------------------------------------------------
  */

  const startNewAllocation = () => {
    const confirmed = window.confirm(
      "Are you sure you want to start a new allocation?"
    );

    if (confirmed) {
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-600">
            <GraduationCap size={18} />
            Final Result
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Student Seat Allocation
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Final student-wise examination seating allocation.
          </p>
        </div>

        <div className="no-print flex flex-wrap gap-2">
          <button
            type="button"
            onClick={printAllocation}
            disabled={!rows.length}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Printer size={17} />
            Print
          </button>

          <button
            type="button"
            onClick={exportToExcel}
            disabled={!rows.length}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileSpreadsheet size={17} />
            Excel
          </button>

          <button
            type="button"
            onClick={exportToPDF}
            disabled={!rows.length}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileText size={17} />
            PDF
          </button>
        </div>
      </div>

      {/* Examination Information */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
            <CalendarDays size={18} />
            Examination Date
          </div>

          <p className="text-lg font-bold text-slate-900">
            {formatDate(getExamDate(examDetails))}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
            <Users size={18} />
            Total Students
          </div>

          <p className="text-2xl font-bold text-indigo-600">
            {totalStudents}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
            <Building2 size={18} />
            Total Halls
          </div>

          <p className="text-2xl font-bold text-emerald-600">
            {totalHalls}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
            <GraduationCap size={18} />
            Total Classes
          </div>

          <p className="text-2xl font-bold text-violet-600">
            {totalClasses}
          </p>
        </div>
      </div>

      {/* Final Allocation Table */}
      <div className="printable-allocation overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Final Student Allocation Table
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Verify student register number, name, class, hall and seat.
            </p>
          </div>

          <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            {rows.length} Allocated
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users className="mx-auto mb-4 text-slate-300" size={42} />

            <h4 className="text-lg font-semibold text-slate-700">
              No Allocation Available
            </h4>

            <p className="mt-1 text-sm text-slate-500">
              Complete the seating allocation to view the final result.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="border border-slate-700 px-4 py-3 text-center font-semibold">
                    Sl. No.
                  </th>

                  <th className="border border-slate-700 px-4 py-3 font-semibold">
                    Register Number
                  </th>

                  <th className="border border-slate-700 px-4 py-3 font-semibold">
                    Student Name
                  </th>

                  <th className="border border-slate-700 px-4 py-3 font-semibold">
                    Class / Department
                  </th>

                  <th className="print-floor border border-slate-700 px-4 py-3 font-semibold">
                    Floor
                  </th>

                  <th className="border border-slate-700 px-4 py-3 font-semibold">
                    Hall
                  </th>

                  <th className="border border-slate-700 px-4 py-3 font-semibold">
                    Seat Number
                  </th>

                  <th className="border border-slate-700 px-4 py-3 text-center font-semibold">
                    Row
                  </th>

                  <th className="border border-slate-700 px-4 py-3 text-center font-semibold">
                    Column
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={`${getStudentRegister(row)}-${index}`}
                    className={
                      index % 2 === 0
                        ? "bg-white"
                        : "bg-slate-50"
                    }
                  >
                    <td className="border border-slate-200 px-4 py-3 text-center font-medium text-slate-700">
                      {index + 1}
                    </td>

                    <td className="border border-slate-200 px-4 py-3 font-semibold text-indigo-700">
                      {getStudentRegister(row)}
                    </td>

                    <td className="border border-slate-200 px-4 py-3 text-slate-800">
                      {getStudentName(row)}
                    </td>

                    <td className="border border-slate-200 px-4 py-3 text-slate-700">
                      {getClassName(row)}
                    </td>

                    <td className="print-floor border border-slate-200 px-4 py-3 text-slate-700">
                      {getFloor(row)}
                    </td>

                    <td className="border border-slate-200 px-4 py-3 font-medium text-slate-800">
                      {getHallName(row)}
                    </td>

                    <td className="border border-slate-200 px-4 py-3 font-semibold text-emerald-700">
                      {getSeatNumber(row)}
                    </td>

                    <td className="border border-slate-200 px-4 py-3 text-center text-slate-700">
                      {getRowNumber(row)}
                    </td>

                    <td className="border border-slate-200 px-4 py-3 text-center text-slate-700">
                      {getColumnNumber(row)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Final Action */}
      <div className="no-print flex justify-end border-t border-slate-200 pt-5">
        <button
          type="button"
          onClick={startNewAllocation}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <RefreshCw size={18} />
          Start New Allocation
        </button>
      </div>
    </div>
  );
}