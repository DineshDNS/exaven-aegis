// src/components/SheetArrangement.jsx

import { useMemo, useState } from "react";

import {
  Check,
  Grid3X3,
  LayoutGrid,
  Rows3,
  Users,
  Warehouse,
} from "lucide-react";

import {
  ARRANGEMENT_IDS,
  ARRANGEMENT_OPTIONS,
  allocateAllHalls,
  getAllocationSummary,
  getHallCapacity,
  getHallColumns,
  getHallFloor,
  getHallId,
  getHallName,
  getHallRows,
  getSeatGrid,
  getStudentDisplayClass,
  getStudentDisplayName,
  getStudentRegisterNumber,
} from "../../utils/seatingAllocation";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function toNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function getClassName(currentClass, index) {
  return (
    currentClass?.name ??
    currentClass?.className ??
    currentClass?.class_name ??
    currentClass?.label ??
    currentClass?.class ??
    `Class ${index + 1}`
  );
}

function getClassStudentCount(currentClass) {
  return Math.max(
    toNumber(
      currentClass?.actualStudentCount ??
        currentClass?.studentCount ??
        currentClass?.totalStudents ??
        currentClass?.student_count ??
        currentClass?.count ??
        0,
      0
    ),
    0
  );
}

function createStudents(classes = []) {
  const students = [];

  classes.forEach((currentClass, classIndex) => {
    const className = getClassName(
      currentClass,
      classIndex
    );

    const existingStudents =
      currentClass?.students ??
      currentClass?.studentList ??
      currentClass?.student_list;

    if (Array.isArray(existingStudents)) {
      existingStudents.forEach(
        (student, studentIndex) => {
          students.push({
            ...student,

            className:
              student?.className ??
              student?.class_name ??
              className,

            classIndex,

            studentNumber:
              student?.studentNumber ??
              student?.student_number ??
              studentIndex + 1,
          });
        }
      );

      return;
    }

    const studentCount =
      getClassStudentCount(currentClass);

    for (
      let studentIndex = 1;
      studentIndex <= studentCount;
      studentIndex += 1
    ) {
      students.push({
        id: `${classIndex + 1}-${studentIndex}`,

        className,

        classIndex,

        studentNumber: studentIndex,

        name: `${className} - ${studentIndex}`,

        label: `${className} - ${studentIndex}`,

        register_number: `${classIndex + 1}-${String(
          studentIndex
        ).padStart(3, "0")}`,
      });
    }
  });

  return students;
}

function getTotalStudents(classes = []) {
  return classes.reduce(
    (total, currentClass) =>
      total + getClassStudentCount(currentClass),
    0
  );
}

function getSafeHalls(halls, allocation) {
  if (Array.isArray(halls) && halls.length > 0) {
    return halls;
  }

  if (
    Array.isArray(allocation?.halls) &&
    allocation.halls.length > 0
  ) {
    return allocation.halls.map(
      (hallAllocation) =>
        hallAllocation?.hall ?? hallAllocation
    );
  }

  return [];
}

function getHallSeats(
  allocation,
  hall,
  hallIndex
) {
  if (!allocation) {
    return [];
  }

  const hallResults = Array.isArray(
    allocation?.halls
  )
    ? allocation.halls
    : [];

  const hallId = getHallId(hall, hallIndex);

  const hallResult =
    hallResults.find(
      (item, index) =>
        String(
          item?.hallId ??
            item?.hall?.id ??
            item?.hall?.hallId ??
            index
        ) === String(hallId)
    ) ?? hallResults[hallIndex];

  if (hallResult) {
    return (
      hallResult.seats ??
      hallResult.allocations ??
      []
    );
  }

  const flatSeats = Array.isArray(allocation)
    ? allocation
    : allocation?.allocations ??
      allocation?.seats ??
      [];

  return flatSeats.filter((seat) => {
    const seatHallId =
      seat?.hallId ??
      seat?.hall?.id ??
      seat?.hall?.hallId;

    return (
      seatHallId === undefined ||
      String(seatHallId) === String(hallId)
    );
  });
}

/* -------------------------------------------------------------------------- */
/* Arrangement card                                                           */
/* -------------------------------------------------------------------------- */

function ArrangementCard({
  arrangement,
  selected,
  onSelect,
}) {
  const Icon =
    arrangement.id === ARRANGEMENT_IDS.COLUMN_WISE
      ? Grid3X3
      : arrangement.id === ARRANGEMENT_IDS.ZIGZAG
        ? LayoutGrid
        : arrangement.id === ARRANGEMENT_IDS.REVERSE
          ? Rows3
          : arrangement.id.startsWith("mixed")
            ? Users
            : Rows3;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "relative flex min-h-[170px] flex-col rounded-xl border p-4 text-left transition-all",
        "hover:-translate-y-0.5 hover:shadow-md",
        selected
          ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
          : "border-slate-200 bg-white hover:border-indigo-300",
      ].join(" ")}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
          <Check size={15} strokeWidth={3} />
        </span>
      )}

      <span
        className={[
          "mb-3 flex h-10 w-10 items-center justify-center rounded-lg",
          selected
            ? "bg-indigo-600 text-white"
            : "bg-slate-100 text-slate-600",
        ].join(" ")}
      >
        <Icon size={21} />
      </span>

      <h3 className="pr-5 text-sm font-bold text-slate-900">
        {arrangement.name}
      </h3>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {arrangement.description}
      </p>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Seat grid                                                                  */
/* -------------------------------------------------------------------------- */

function HallSeatGrid({
  hall,
  seats = [],
  arrangementId,
}) {
  const rows = getHallRows(hall);
  const columns = getHallColumns(hall);

  const grid = useMemo(
    () =>
      getSeatGrid(
        hall,
        seats,
        arrangementId
      ),
    [hall, seats, arrangementId]
  );

  if (rows <= 0 || columns <= 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        Hall dimensions are not configured.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 rounded-lg bg-slate-200 px-4 py-2 text-center text-xs font-bold uppercase tracking-wide text-slate-700">
        Teacher Table
      </div>

      <div
        className="grid min-w-[560px] gap-2"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {grid.flatMap((row, rowIndex) =>
          row.map((seat, columnIndex) => {
            const safeSeat =
              seat ?? {
                id: `empty-${rowIndex}-${columnIndex}`,
                row: rowIndex + 1,
                column: columnIndex + 1,
                seatNumber:
                  rowIndex * columns +
                  columnIndex +
                  1,
                student: null,
                occupied: false,
              };

            const student =
              safeSeat.student ?? null;

            const registerNumber = student
              ? getStudentRegisterNumber(student)
              : "";

            const studentName = student
              ? getStudentDisplayName(student)
              : "";

            const displayClass = student
              ? getStudentDisplayClass(student)
              : "";

            return (
              <div
                key={safeSeat.id}
                title={
                  student
                    ? `${registerNumber} | ${studentName} | ${displayClass}`
                    : `Empty Seat ${safeSeat.seatNumber}`
                }
                className={[
                  "flex min-h-[74px] flex-col items-center justify-center rounded-md border px-1 py-2 text-center",
                  student
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-200 bg-white text-slate-400",
                ].join(" ")}
              >
                <span className="text-[10px] font-bold leading-4">
                  {student
                    ? registerNumber || studentName
                    : "—"}
                </span>

                {student && displayClass && (
                  <span className="mt-1 line-clamp-2 text-[9px] leading-3 text-indigo-100">
                    {displayClass}
                  </span>
                )}

                <span
                  className={[
                    "mt-1 text-[9px]",
                    student
                      ? "text-indigo-100"
                      : "text-slate-400",
                  ].join(" ")}
                >
                  S{safeSeat.seatNumber}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-indigo-600" />
          Allocated
        </span>

        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-slate-300 bg-white" />
          Empty
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Hall summary                                                               */
/* -------------------------------------------------------------------------- */

function HallSummary({
  hall,
  index,
  allocatedSeats,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <Warehouse
          size={17}
          className="text-indigo-600"
        />

        <span className="text-sm font-semibold text-slate-900">
          {getHallName(hall, index)}
        </span>
      </div>

      <p className="mt-1 text-xs text-slate-500">
        {getHallFloor(hall) ||
          "Floor not specified"}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
        <span>
          Rows:{" "}
          <strong className="text-slate-700">
            {getHallRows(hall)}
          </strong>
        </span>

        <span>
          Columns:{" "}
          <strong className="text-slate-700">
            {getHallColumns(hall)}
          </strong>
        </span>

        <span>
          Capacity:{" "}
          <strong className="text-slate-700">
            {getHallCapacity(hall)}
          </strong>
        </span>

        <span>
          Allocated:{" "}
          <strong className="text-indigo-700">
            {allocatedSeats}
          </strong>
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main component                                                             */
/* -------------------------------------------------------------------------- */

export default function SheetArrangement({
  classes = [],
  halls = [],
  allocation = null,
  selectedArrangementId =
    ARRANGEMENT_IDS.ROW_WISE,
  onSelectArrangement,
}) {
  const [previewHallId, setPreviewHallId] =
    useState("");

  const safeHalls = useMemo(
    () => getSafeHalls(halls, allocation),
    [halls, allocation]
  );

  const students = useMemo(
    () => createStudents(classes),
    [classes]
  );

  const totalStudents = useMemo(
    () => getTotalStudents(classes),
    [classes]
  );

  const totalCapacity = useMemo(
    () =>
      safeHalls.reduce(
        (total, hall) =>
          total + getHallCapacity(hall),
        0
      ),
    [safeHalls]
  );

  const selectedArrangement =
    ARRANGEMENT_OPTIONS.find(
      (arrangement) =>
        arrangement.id === selectedArrangementId
    ) ?? ARRANGEMENT_OPTIONS[0];

  const allocationResult = useMemo(() => {
    if (allocation) {
      return allocation;
    }

    if (
      safeHalls.length === 0 ||
      students.length === 0
    ) {
      return [];
    }

    return allocateAllHalls({
      halls: safeHalls,
      students,
      arrangementId: selectedArrangementId,
    });
  }, [
    allocation,
    safeHalls,
    students,
    selectedArrangementId,
  ]);

  const summary = useMemo(
    () =>
      getAllocationSummary(
        allocationResult
      ),
    [allocationResult]
  );

  const activeHall = useMemo(() => {
    if (safeHalls.length === 0) {
      return null;
    }

    if (previewHallId) {
      const selectedHall = safeHalls.find(
        (hall, index) =>
          getHallId(hall, index) ===
          String(previewHallId)
      );

      if (selectedHall) {
        return selectedHall;
      }
    }

    return safeHalls[0];
  }, [safeHalls, previewHallId]);

  const activeHallIndex = activeHall
    ? safeHalls.indexOf(activeHall)
    : -1;

  const activeHallSeats = useMemo(
    () =>
      activeHall
        ? getHallSeats(
            allocationResult,
            activeHall,
            activeHallIndex
          )
        : [],
    [
      allocationResult,
      activeHall,
      activeHallIndex,
    ]
  );

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Select Sheet Arrangement
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Select one arrangement method. The selected
          method will be applied to the hall preview.
        </p>
      </div>

      {/* Arrangement options */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ARRANGEMENT_OPTIONS.map(
          (arrangement) => (
            <ArrangementCard
              key={arrangement.id}
              arrangement={arrangement}
              selected={
                selectedArrangementId ===
                arrangement.id
              }
              onSelect={() =>
                onSelectArrangement?.(
                  arrangement.id
                )
              }
            />
          )
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Users size={16} />
            Total Students
          </div>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {totalStudents}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Warehouse size={16} />
            Total Hall Capacity
          </div>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {totalCapacity}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Grid3X3 size={16} />
            Selected Method
          </div>

          <p className="mt-2 truncate text-lg font-bold text-indigo-600">
            {selectedArrangement.name}
          </p>
        </div>
      </div>

      {/* Selected arrangement summary */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Selected Arrangement
            </p>

            <h2 className="mt-1 text-xl font-bold text-indigo-900">
              {selectedArrangement.name}
            </h2>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-indigo-700">
            <span>
              <strong>
                {safeHalls.length}
              </strong>{" "}
              Halls
            </span>

            <span>
              <strong>
                {summary.allocatedStudents}
              </strong>{" "}
              Allocated
            </span>

            <span>
              <strong>
                {summary.unallocatedStudents}
              </strong>{" "}
              Remaining
            </span>
          </div>
        </div>
      </div>

      {/* Hall preview */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Hall Preview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select a hall to view its seating arrangement.
            </p>
          </div>

          {safeHalls.length > 0 && (
            <div className="w-full sm:w-64">
              <label
                htmlFor="preview-hall"
                className="mb-1 block text-xs font-semibold text-slate-600"
              >
                Select Hall
              </label>

              <select
                id="preview-hall"
                value={
                  previewHallId ||
                  getHallId(
                    safeHalls[0],
                    0
                  )
                }
                onChange={(event) =>
                  setPreviewHallId(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {safeHalls.map(
                  (hall, index) => (
                    <option
                      key={getHallId(
                        hall,
                        index
                      )}
                      value={getHallId(
                        hall,
                        index
                      )}
                    >
                      {getHallName(
                        hall,
                        index
                      )}
                    </option>
                  )
                )}
              </select>
            </div>
          )}
        </div>

        {activeHall ? (
          <div className="mt-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {getHallName(
                    activeHall,
                    activeHallIndex
                  )}
                </h3>

                <p className="text-xs text-slate-500">
                  {selectedArrangement.name} arrangement
                </p>
              </div>

              <div className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700">
                Capacity:{" "}
                {getHallCapacity(activeHall)}
              </div>
            </div>

            <HallSeatGrid
              hall={activeHall}
              seats={activeHallSeats}
              arrangementId={
                selectedArrangement.id
              }
            />
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <Grid3X3
              size={42}
              className="mx-auto text-slate-400"
            />

            <h3 className="mt-3 text-lg font-semibold text-slate-800">
              No hall available
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Add and configure at least one hall
              to preview the arrangement.
            </p>
          </div>
        )}
      </div>

      {/* Hall summary */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-slate-900">
          Hall Summary
        </h2>

        {safeHalls.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {safeHalls.map((hall, index) => {
              const hallSeats = getHallSeats(
                allocationResult,
                hall,
                index
              );

              const allocatedSeats =
                hallSeats.filter(
                  (seat) => seat?.student
                ).length;

              return (
                <HallSummary
                  key={getHallId(
                    hall,
                    index
                  )}
                  hall={hall}
                  index={index}
                  allocatedSeats={
                    allocatedSeats
                  }
                />
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            No halls available.
          </div>
        )}
      </div>
    </div>
  );
}