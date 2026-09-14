// src/utils/seatingAllocation.js

export const ARRANGEMENT_IDS = {
  ROW_WISE: "row-wise",
  COLUMN_WISE: "column-wise",
  ZIGZAG: "zigzag",
  REVERSE: "reverse",

  MIXED_ROW_WISE: "mixed-row-wise",
  MIXED_COLUMN_WISE: "mixed-column-wise",
  MIXED_ZIGZAG: "mixed-zigzag",
  MIXED_REVERSE: "mixed-reverse",

  // Backward-compatible names
  ALTERNATE_ROW: "alternate-row",
  CHECKERBOARD: "checkerboard",
  CLASS_WISE: "class-wise",
  MIXED_CLASS: "mixed-class",
  REVERSE_ROW: "reverse-row",
};

export const ARRANGEMENT_OPTIONS = [
  {
    id: ARRANGEMENT_IDS.ROW_WISE,
    name: "Row-wise",
    label: "Row-wise",
    description: "Fill seats from left to right, row by row.",
  },
  {
    id: ARRANGEMENT_IDS.COLUMN_WISE,
    name: "Column-wise",
    label: "Column-wise",
    description: "Fill seats from top to bottom, column by column.",
  },
  {
    id: ARRANGEMENT_IDS.ZIGZAG,
    name: "Zigzag",
    label: "Zigzag",
    description: "Fill alternate rows in opposite directions.",
  },
  {
    id: ARRANGEMENT_IDS.REVERSE,
    name: "Reverse",
    label: "Reverse",
    description: "Fill seats from right to left, row by row.",
  },
  {
    id: ARRANGEMENT_IDS.MIXED_ROW_WISE,
    name: "Mixed Row-wise",
    label: "Mixed Row-wise",
    description: "One class per row with dynamic class rotation.",
  },
  {
    id: ARRANGEMENT_IDS.MIXED_COLUMN_WISE,
    name: "Mixed Column-wise",
    label: "Mixed Column-wise",
    description: "One class per column with dynamic class rotation.",
  },
  {
    id: ARRANGEMENT_IDS.MIXED_ZIGZAG,
    name: "Mixed Zigzag",
    label: "Mixed Zigzag",
    description: "One class per row with alternating direction.",
  },
  {
    id: ARRANGEMENT_IDS.MIXED_REVERSE,
    name: "Mixed Reverse",
    label: "Mixed Reverse",
    description: "Reverse allocation with dynamic class rotation.",
  },
];

/* -------------------------------------------------------------------------- */
/* Basic helpers                                                              */
/* -------------------------------------------------------------------------- */

function toNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function firstValue(object, keys, fallback = "") {
  for (const key of keys) {
    if (
      object &&
      object[key] !== undefined &&
      object[key] !== null &&
      object[key] !== ""
    ) {
      return object[key];
    }
  }

  return fallback;
}

/* -------------------------------------------------------------------------- */
/* Hall helpers                                                               */
/* -------------------------------------------------------------------------- */

export function getHallRows(hall) {
  return Math.max(
    toNumber(
      firstValue(hall, [
        "rows",
        "totalRows",
        "numberOfRows",
        "rowCount",
      ]),
      0
    ),
    0
  );
}

export function getHallColumns(hall) {
  return Math.max(
    toNumber(
      firstValue(hall, [
        "columns",
        "totalColumns",
        "numberOfColumns",
        "columnCount",
      ]),
      0
    ),
    0
  );
}

export function getSeatsPerUnit(hall) {
  return Math.max(
    toNumber(
      firstValue(hall, [
        "seatsPerUnit",
        "seats_per_unit",
        "units",
      ]),
      1
    ),
    1
  );
}

export function getHallCapacity(hall) {
  const rows = getHallRows(hall);
  const columns = getHallColumns(hall);
  const seatsPerUnit = getSeatsPerUnit(hall);

  const calculatedCapacity =
    rows * columns * seatsPerUnit;

  if (calculatedCapacity > 0) {
    return calculatedCapacity;
  }

  return Math.max(
    toNumber(
      firstValue(hall, [
        "capacity",
        "totalSeats",
        "seatCapacity",
        "numberOfSeats",
      ]),
      0
    ),
    0
  );
}

export function getHallName(hall, index = 0) {
  return String(
    firstValue(
      hall,
      [
        "name",
        "hallName",
        "hall_name",
        "roomName",
        "room_name",
        "room",
      ],
      `Hall ${index + 1}`
    )
  );
}

export function getHallFloor(hall) {
  return firstValue(hall, [
    "floor",
    "floorName",
    "floor_name",
    "level",
  ]);
}

export function getHallId(hall, index = 0) {
  return String(
    firstValue(
      hall,
      ["id", "hallId", "hall_id", "roomId", "room_id"],
      index
    )
  );
}

/* -------------------------------------------------------------------------- */
/* Student helpers                                                            */
/* -------------------------------------------------------------------------- */

export function getStudentRegisterNumber(student) {
  return firstValue(student, [
    "register_number",
    "registerNumber",
    "register_no",
    "registerNo",
    "reg_no",
    "regNo",
    "roll_number",
    "rollNumber",
    "roll_no",
    "rollNo",
    "admission_number",
    "admissionNumber",
    "student_id",
    "studentId",
    "id",
  ]);
}

export function getStudentYear(student) {
  return firstValue(student, [
    "year",
    "student_year",
    "studentYear",
    "academic_year",
    "academicYear",
    "study_year",
    "studyYear",
    "current_year",
    "currentYear",
  ]);
}

export function getStudentCourse(student) {
  return firstValue(student, [
    "course",
    "course_name",
    "courseName",
    "department",
    "department_name",
    "departmentName",
    "program",
    "branch",
  ]);
}

export function getStudentClass(student) {
  return firstValue(student, [
    "class",
    "class_name",
    "className",
    "section",
    "section_name",
    "sectionName",
    "division",
  ]);
}

export function getStudentName(student) {
  return firstValue(student, [
    "name",
    "student_name",
    "studentName",
    "full_name",
    "fullName",
    "username",
  ]);
}

export function formatYear(year) {
  const value = String(year ?? "").trim();

  if (!value) {
    return "";
  }

  if (/year/i.test(value)) {
    return value;
  }

  const numericYear = Number(value);

  if (numericYear === 1) return "1st Year";
  if (numericYear === 2) return "2nd Year";
  if (numericYear === 3) return "3rd Year";
  if (numericYear === 4) return "4th Year";
  if (numericYear === 5) return "5th Year";

  return `${value} Year`;
}

export function getStudentDisplayClass(student) {
  const year = formatYear(getStudentYear(student));
  const course = String(
    getStudentCourse(student) ?? ""
  ).trim();
  const className = String(
    getStudentClass(student) ?? ""
  ).trim();

  return [year, course, className]
    .filter(Boolean)
    .join(" - ");
}

export function getStudentDisplayName(student) {
  return String(getStudentName(student) ?? "");
}

export function normalizeStudent(student, index = 0) {
  return {
    ...student,

    _index: index,
    _registerNumber: getStudentRegisterNumber(student),
    _year: getStudentYear(student),
    _course: getStudentCourse(student),
    _class: getStudentClass(student),
    _classKey: getStudentClassKey(student),
    _displayClass: getStudentDisplayClass(student),
    _displayName: getStudentDisplayName(student),
  };
}

export function getStudentClassKey(student) {
  const year = String(
    getStudentYear(student) ?? ""
  ).trim();

  const course = String(
    getStudentCourse(student) ?? ""
  ).trim();

  const className = String(
    getStudentClass(student) ?? ""
  ).trim();

  return `${year}__${course}__${className}`;
}

/* -------------------------------------------------------------------------- */
/* Arrangement helpers                                                        */
/* -------------------------------------------------------------------------- */

export function cleanArrangementId(arrangementId) {
  const value = String(
    arrangementId ?? ARRANGEMENT_IDS.ROW_WISE
  )
    .trim()
    .toLowerCase();

  const aliases = {
    row: ARRANGEMENT_IDS.ROW_WISE,
    rows: ARRANGEMENT_IDS.ROW_WISE,
    rowwise: ARRANGEMENT_IDS.ROW_WISE,
    "row-wise": ARRANGEMENT_IDS.ROW_WISE,

    column: ARRANGEMENT_IDS.COLUMN_WISE,
    columns: ARRANGEMENT_IDS.COLUMN_WISE,
    columnwise: ARRANGEMENT_IDS.COLUMN_WISE,
    "column-wise": ARRANGEMENT_IDS.COLUMN_WISE,

    zig: ARRANGEMENT_IDS.ZIGZAG,
    zigzag: ARRANGEMENT_IDS.ZIGZAG,

    reverse: ARRANGEMENT_IDS.REVERSE,
    "reverse-row": ARRANGEMENT_IDS.REVERSE,

    "alternate-row": ARRANGEMENT_IDS.ZIGZAG,

    "mixed-row": ARRANGEMENT_IDS.MIXED_ROW_WISE,
    mixedrow: ARRANGEMENT_IDS.MIXED_ROW_WISE,
    "mixed-row-wise": ARRANGEMENT_IDS.MIXED_ROW_WISE,

    "mixed-column": ARRANGEMENT_IDS.MIXED_COLUMN_WISE,
    mixedcolumn: ARRANGEMENT_IDS.MIXED_COLUMN_WISE,
    "mixed-column-wise":
      ARRANGEMENT_IDS.MIXED_COLUMN_WISE,

    "mixed-zigzag": ARRANGEMENT_IDS.MIXED_ZIGZAG,
    mixedzigzag: ARRANGEMENT_IDS.MIXED_ZIGZAG,

    "mixed-reverse": ARRANGEMENT_IDS.MIXED_REVERSE,
    mixedreverse: ARRANGEMENT_IDS.MIXED_REVERSE,

    "mixed-class": ARRANGEMENT_IDS.MIXED_ROW_WISE,
  };

  return aliases[value] ?? value;
}

export function isMixedArrangement(arrangementId) {
  const value = cleanArrangementId(arrangementId);

  return [
    ARRANGEMENT_IDS.MIXED_ROW_WISE,
    ARRANGEMENT_IDS.MIXED_COLUMN_WISE,
    ARRANGEMENT_IDS.MIXED_ZIGZAG,
    ARRANGEMENT_IDS.MIXED_REVERSE,
  ].includes(value);
}

/* -------------------------------------------------------------------------- */
/* Seat creation                                                              */
/* -------------------------------------------------------------------------- */

export function createEmptySeat(
  seatNumber,
  row,
  column,
  unitIndex = 1
) {
  return {
    id: `${row}-${column}-${unitIndex}`,
    seatNumber,
    row,
    column,
    unitIndex,
    student: null,
    occupied: false,
  };
}

export function createBaseSeats(hall) {
  const rows = getHallRows(hall);
  const columns = getHallColumns(hall);
  const seatsPerUnit = getSeatsPerUnit(hall);

  const seats = [];
  let seatNumber = 1;

  for (let row = 1; row <= rows; row += 1) {
    for (
      let column = 1;
      column <= columns;
      column += 1
    ) {
      for (
        let unitIndex = 1;
        unitIndex <= seatsPerUnit;
        unitIndex += 1
      ) {
        seats.push(
          createEmptySeat(
            seatNumber,
            row,
            column,
            unitIndex
          )
        );

        seatNumber += 1;
      }
    }
  }

  return seats;
}

export function getNormalPositions(
  hall,
  arrangementId = ARRANGEMENT_IDS.ROW_WISE
) {
  const rows = getHallRows(hall);
  const columns = getHallColumns(hall);
  const seatsPerUnit = getSeatsPerUnit(hall);
  const arrangement = cleanArrangementId(
    arrangementId
  );

  const positions = [];
  let seatNumber = 1;

  for (let row = 1; row <= rows; row += 1) {
    let columnIndexes = Array.from(
      { length: columns },
      (_, index) => index + 1
    );

    if (
      arrangement === ARRANGEMENT_IDS.REVERSE ||
      arrangement === ARRANGEMENT_IDS.REVERSE_ROW
    ) {
      columnIndexes.reverse();
    }

    if (
      arrangement === ARRANGEMENT_IDS.ZIGZAG &&
      row % 2 === 0
    ) {
      columnIndexes.reverse();
    }

    for (const column of columnIndexes) {
      for (
        let unitIndex = 1;
        unitIndex <= seatsPerUnit;
        unitIndex += 1
      ) {
        positions.push({
          id: `${row}-${column}-${unitIndex}`,
          row,
          column,
          unitIndex,
          seatNumber,
        });

        seatNumber += 1;
      }
    }
  }

  if (arrangement === ARRANGEMENT_IDS.COLUMN_WISE) {
    positions.length = 0;
    seatNumber = 1;

    for (
      let column = 1;
      column <= columns;
      column += 1
    ) {
      for (let row = 1; row <= rows; row += 1) {
        for (
          let unitIndex = 1;
          unitIndex <= seatsPerUnit;
          unitIndex += 1
        ) {
          positions.push({
            id: `${row}-${column}-${unitIndex}`,
            row,
            column,
            unitIndex,
            seatNumber,
          });

          seatNumber += 1;
        }
      }
    }
  }

  return positions;
}

export const generateSeatPositions =
  getNormalPositions;

/* -------------------------------------------------------------------------- */
/* Class grouping                                                             */
/* -------------------------------------------------------------------------- */

export function groupStudentsByClass(students = []) {
  const groups = new Map();

  students.forEach((student, index) => {
    const normalized = normalizeStudent(student, index);
    const key = normalized._classKey;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        year: normalized._year,
        course: normalized._course,
        className: normalized._class,
        displayClass: normalized._displayClass,
        students: [],
      });
    }

    groups.get(key).students.push(normalized);
  });

  return Array.from(groups.values());
}

export function createClassQueues(students = []) {
  return groupStudentsByClass(students).map(
    (group) => ({
      ...group,
      queue: [...group.students],
      index: 0,
    })
  );
}

export function getNextStudentFromQueue(queue) {
  if (
    !queue ||
    queue.index >= queue.queue.length
  ) {
    return null;
  }

  const student = queue.queue[queue.index];
  queue.index += 1;

  return student;
}

export function hasRemainingStudents(
  classQueues = []
) {
  return classQueues.some(
    (queue) => queue.index < queue.queue.length
  );
}

/* -------------------------------------------------------------------------- */
/* Allocation helpers                                                         */
/* -------------------------------------------------------------------------- */

function attachStudentToSeat(seat, student, hall) {
  return {
    ...seat,

    hallId: getHallId(hall),
    hallName: getHallName(hall),
    hallFloor: getHallFloor(hall),

    student: student ?? null,
    occupied: Boolean(student),

    registerNumber: student
      ? getStudentRegisterNumber(student)
      : "",

    studentName: student
      ? getStudentDisplayName(student)
      : "",

    displayClass: student
      ? getStudentDisplayClass(student)
      : "",
  };
}

export function allocateNormalStudents(
  students = [],
  positions = [],
  hall = null
) {
  return positions.map((position, index) =>
    attachStudentToSeat(
      position,
      students[index] ?? null,
      hall
    )
  );
}

function getNextAvailableClassQueue(
  classQueues,
  startIndex,
  usedClassKeys = new Set()
) {
  if (!classQueues.length) {
    return null;
  }

  for (
    let offset = 0;
    offset < classQueues.length;
    offset += 1
  ) {
    const index =
      (startIndex + offset) % classQueues.length;

    const queue = classQueues[index];

    if (
      queue &&
      queue.index < queue.queue.length &&
      !usedClassKeys.has(queue.key)
    ) {
      return {
        queue,
        index,
      };
    }
  }

  return null;
}

function allocateMixedByRows({
  positions,
  rows,
  columns,
  classQueues,
  hall,
  zigzag = false,
  reverse = false,
}) {
  const allocations = [];
  let classStartIndex = 0;

  const rowIndexes = Array.from(
    { length: rows },
    (_, index) => index + 1
  );

  if (reverse) {
    rowIndexes.reverse();
  }

  for (const row of rowIndexes) {
    const selected = getNextAvailableClassQueue(
      classQueues,
      classStartIndex
    );

    if (!selected) {
      break;
    }

    const { queue, index } = selected;

    classStartIndex =
      (index + 1) % classQueues.length;

    let columnIndexes = Array.from(
      { length: columns },
      (_, columnIndex) => columnIndex + 1
    );

    if (
      reverse ||
      (zigzag && row % 2 === 0)
    ) {
      columnIndexes.reverse();
    }

    for (const column of columnIndexes) {
      const matchingPositions = positions.filter(
        (position) =>
          position.row === row &&
          position.column === column
      );

      for (const position of matchingPositions) {
        const student =
          getNextStudentFromQueue(queue);

        if (!student) {
          break;
        }

        allocations.push(
          attachStudentToSeat(
            position,
            student,
            hall
          )
        );
      }
    }
  }

  return allocations;
}

function allocateMixedByColumns({
  positions,
  rows,
  columns,
  classQueues,
  hall,
}) {
  const allocations = [];
  let classStartIndex = 0;

  for (
    let column = 1;
    column <= columns;
    column += 1
  ) {
    const selected = getNextAvailableClassQueue(
      classQueues,
      classStartIndex
    );

    if (!selected) {
      break;
    }

    const { queue, index } = selected;

    classStartIndex =
      (index + 1) % classQueues.length;

    for (let row = 1; row <= rows; row += 1) {
      const matchingPositions = positions.filter(
        (position) =>
          position.row === row &&
          position.column === column
      );

      for (const position of matchingPositions) {
        const student =
          getNextStudentFromQueue(queue);

        if (!student) {
          break;
        }

        allocations.push(
          attachStudentToSeat(
            position,
            student,
            hall
          )
        );
      }
    }
  }

  return allocations;
}

export function allocateMixedRowWise(
  positions,
  rows,
  columns,
  classQueues,
  hall
) {
  return allocateMixedByRows({
    positions,
    rows,
    columns,
    classQueues,
    hall,
  });
}

export function allocateMixedColumnWise(
  positions,
  rows,
  columns,
  classQueues,
  hall
) {
  return allocateMixedByColumns({
    positions,
    rows,
    columns,
    classQueues,
    hall,
  });
}

export function allocateMixedZigzag(
  positions,
  rows,
  columns,
  classQueues,
  hall
) {
  return allocateMixedByRows({
    positions,
    rows,
    columns,
    classQueues,
    hall,
    zigzag: true,
  });
}

export function allocateMixedReverse(
  positions,
  rows,
  columns,
  classQueues,
  hall
) {
  return allocateMixedByRows({
    positions,
    rows,
    columns,
    classQueues,
    hall,
    reverse: true,
  });
}

export function allocateMixedStudents(
  students = [],
  positions = [],
  hall,
  arrangementId,
  classQueues = null
) {
  const rows = getHallRows(hall);
  const columns = getHallColumns(hall);
  const arrangement = cleanArrangementId(
    arrangementId
  );

  const queues =
    classQueues ?? createClassQueues(students);

  switch (arrangement) {
    case ARRANGEMENT_IDS.MIXED_COLUMN_WISE:
      return allocateMixedColumnWise(
        positions,
        rows,
        columns,
        queues,
        hall
      );

    case ARRANGEMENT_IDS.MIXED_ZIGZAG:
      return allocateMixedZigzag(
        positions,
        rows,
        columns,
        queues,
        hall
      );

    case ARRANGEMENT_IDS.MIXED_REVERSE:
      return allocateMixedReverse(
        positions,
        rows,
        columns,
        queues,
        hall
      );

    case ARRANGEMENT_IDS.MIXED_ROW_WISE:
    case ARRANGEMENT_IDS.MIXED_CLASS:
    default:
      return allocateMixedRowWise(
        positions,
        rows,
        columns,
        queues,
        hall
      );
  }
}

/* -------------------------------------------------------------------------- */
/* One hall allocation                                                        */
/* -------------------------------------------------------------------------- */

export function allocateHall({
  hall,
  students = [],
  arrangementId = ARRANGEMENT_IDS.ROW_WISE,
  classQueues = null,
  startStudentIndex = 0,
  hallIndex = 0,
}) {
  const arrangement = cleanArrangementId(
    arrangementId
  );

  const positions = getNormalPositions(
    hall,
    arrangement
  );

  let seats = [];
  let nextStudentIndex = startStudentIndex;

  if (isMixedArrangement(arrangement)) {
    const queues =
      classQueues ?? createClassQueues(students);

    seats = allocateMixedStudents(
      students,
      positions,
      hall,
      arrangement,
      queues
    );

    nextStudentIndex = students.length;
  } else {
    const hallStudents = students.slice(
      startStudentIndex,
      startStudentIndex + positions.length
    );

    seats = allocateNormalStudents(
      hallStudents,
      positions,
      hall
    );

    nextStudentIndex =
      startStudentIndex + hallStudents.length;
  }

  return {
    hall,
    hallIndex,
    hallId: getHallId(hall, hallIndex),
    hallName: getHallName(hall, hallIndex),
    hallFloor: getHallFloor(hall),

    rows: getHallRows(hall),
    columns: getHallColumns(hall),
    seatsPerUnit: getSeatsPerUnit(hall),
    capacity: getHallCapacity(hall),

    arrangementId: arrangement,

    seats,
    allocations: seats,

    nextStudentIndex,
  };
}

/* -------------------------------------------------------------------------- */
/* All halls allocation                                                       */
/* -------------------------------------------------------------------------- */

export function allocateAllHalls({
  halls = [],
  students = [],
  arrangementId = ARRANGEMENT_IDS.ROW_WISE,
}) {
  const arrangement = cleanArrangementId(
    arrangementId
  );

  const normalizedStudents = students.map(
    normalizeStudent
  );

  const classQueues = isMixedArrangement(
    arrangement
  )
    ? createClassQueues(normalizedStudents)
    : null;

  const hallResults = [];
  const allSeats = [];

  let studentIndex = 0;

  halls.forEach((hall, hallIndex) => {
    if (
      !isMixedArrangement(arrangement) &&
      studentIndex >= normalizedStudents.length
    ) {
      return;
    }

    const result = allocateHall({
      hall,
      students: normalizedStudents,
      arrangementId: arrangement,
      classQueues,
      startStudentIndex: studentIndex,
      hallIndex,
    });

    hallResults.push(result);
    allSeats.push(...result.seats);

    if (isMixedArrangement(arrangement)) {
      studentIndex = normalizedStudents.length;
    } else {
      studentIndex = result.nextStudentIndex;
    }
  });

  const allocatedStudents = allSeats.filter(
    (seat) => Boolean(seat.student)
  );

  const allocatedRegisterNumbers = new Set(
    allocatedStudents.map((seat) =>
      String(seat.registerNumber)
    )
  );

  const unallocatedStudents =
    normalizedStudents.filter((student) => {
      const registerNumber = String(
        getStudentRegisterNumber(student)
      );

      return !allocatedRegisterNumbers.has(
        registerNumber
      );
    });

  /*
   * Return an ARRAY so this remains compatible:
   *
   * allocation.find(...)
   * allocation.map(...)
   * allocation.filter(...)
   *
   * Hall information is also available:
   *
   * allocation.halls
   */
  const result = allSeats;

  result.halls = hallResults;
  result.allocations = allSeats;
  result.seats = allSeats;

  result.arrangementId = arrangement;
  result.totalHalls = hallResults.length;
  result.totalSeats = hallResults.reduce(
    (total, hallResult) =>
      total + hallResult.capacity,
    0
  );

  result.totalStudents = normalizedStudents.length;
  result.allocatedStudents =
    allocatedStudents.length;
  result.unallocatedStudents =
    unallocatedStudents;

  return result;
}

/* -------------------------------------------------------------------------- */
/* Grid helper                                                                */
/* -------------------------------------------------------------------------- */

export function getSeatGrid(
  hall,
  seats = [],
  arrangementId = ARRANGEMENT_IDS.ROW_WISE
) {
  const rows = getHallRows(hall);
  const columns = getHallColumns(hall);
  const seatsPerUnit = getSeatsPerUnit(hall);

  if (rows <= 0 || columns <= 0) {
    return [];
  }

  const grid = Array.from(
    { length: rows },
    () =>
      Array.from(
        {
          length: columns * seatsPerUnit,
        },
        () => null
      )
  );

  seats.forEach((seat) => {
    const row = Number(seat?.row) - 1;
    const column = Number(seat?.column) - 1;
    const unitIndex =
      Number(seat?.unitIndex ?? 1) - 1;

    if (
      row < 0 ||
      row >= rows ||
      column < 0 ||
      column >= columns ||
      unitIndex < 0 ||
      unitIndex >= seatsPerUnit
    ) {
      return;
    }

    const gridColumn =
      column * seatsPerUnit + unitIndex;

    grid[row][gridColumn] = seat;
  });

  return grid;
}

/* -------------------------------------------------------------------------- */
/* Summary helper                                                             */
/* -------------------------------------------------------------------------- */

export function getAllocationSummary(
  allocation
) {
  const seats = Array.isArray(allocation)
    ? allocation
    : Array.isArray(allocation?.allocations)
      ? allocation.allocations
      : Array.isArray(allocation?.seats)
        ? allocation.seats
        : [];

  const halls = Array.isArray(allocation?.halls)
    ? allocation.halls
    : [];

  const totalStudents = Number(
    allocation?.totalStudents ??
      seats.filter((seat) => seat.student).length
  );

  const allocatedStudents = Number(
    allocation?.allocatedStudents ??
      seats.filter((seat) => seat.student).length
  );

  const unallocatedStudents = Array.isArray(
    allocation?.unallocatedStudents
  )
    ? allocation.unallocatedStudents
    : [];

  const totalSeats = Number(
    allocation?.totalSeats ??
      halls.reduce(
        (total, hall) =>
          total + Number(hall.capacity ?? 0),
        0
      )
  );

  return {
    totalHalls: Number(
      allocation?.totalHalls ?? halls.length
    ),

    totalSeats,

    totalStudents,

    allocatedStudents,

    unallocatedStudents:
      unallocatedStudents.length,

    remainingStudents:
      unallocatedStudents.length,

    allocationPercentage:
      totalStudents > 0
        ? Math.round(
            (allocatedStudents / totalStudents) * 100
          )
        : 0,
  };
}

/* -------------------------------------------------------------------------- */
/* Backward-compatible aliases                                                */
/* -------------------------------------------------------------------------- */

export const allocateStudentsToHall =
  allocateHall;

export const allocateStudentsAcrossHalls =
  allocateAllHalls;

export default {
  ARRANGEMENT_IDS,
  ARRANGEMENT_OPTIONS,

  getHallRows,
  getHallColumns,
  getSeatsPerUnit,
  getHallCapacity,
  getHallName,
  getHallFloor,
  getHallId,

  getStudentRegisterNumber,
  getStudentYear,
  getStudentCourse,
  getStudentClass,
  getStudentName,
  getStudentDisplayName,
  getStudentDisplayClass,
  getStudentClassKey,
  formatYear,
  normalizeStudent,

  cleanArrangementId,
  isMixedArrangement,

  createEmptySeat,
  createBaseSeats,
  getNormalPositions,
  generateSeatPositions,

  groupStudentsByClass,
  createClassQueues,
  getNextStudentFromQueue,
  hasRemainingStudents,

  allocateNormalStudents,
  allocateMixedRowWise,
  allocateMixedColumnWise,
  allocateMixedZigzag,
  allocateMixedReverse,
  allocateMixedStudents,

  allocateHall,
  allocateAllHalls,

  getSeatGrid,
  getAllocationSummary,

  allocateStudentsToHall,
  allocateStudentsAcrossHalls,
};