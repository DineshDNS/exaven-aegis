import { useMemo, useRef, useState } from "react";

import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Users,
  Grid3X3,
  ShieldCheck,
  X,
  Save,
  RotateCcw,
  AlertTriangle,
  UserRound,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const HALL_TYPES = [
  "General Hall",
  "Laboratory",
  "Classroom",
  "Seminar Hall",
  "Auditorium",
  "Other",
];

const EMPTY_HALL = {
  id: undefined,
  hallType: "General Hall",
  hallName: "",
  roomNumber: "",
  building: "",
  floor: "",
  rows: 5,
  columns: 8,
  seatingType: "Bench",
  seatsPerUnit: 1,
  capacity: 40,
  features: "",
  isDefault: false,
};

const MAX_TEXT_LENGTH = {
  hallName: 80,
  roomNumber: 30,
  building: 80,
  floor: 50,
  features: 150,
};

const MAX_ROWS = 100;
const MAX_COLUMNS = 100;
const MAX_SEATS_PER_UNIT = 10;
const MAX_CAPACITY = 10000;

function createHallId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `hall-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function sanitizeText(value, maxLength) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .slice(0, maxLength);
}

function toSafeInteger(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.trunc(number);
}

function calculateCapacity(hall) {
  const rows = toSafeInteger(hall.rows);
  const columns = toSafeInteger(hall.columns);
  const seatsPerUnit = toSafeInteger(hall.seatsPerUnit) || 1;

  return rows * columns * seatsPerUnit;
}

function getHallCapacity(hall) {
  const calculatedCapacity = calculateCapacity(hall);

  if (calculatedCapacity > 0) {
    return calculatedCapacity;
  }

  return Number(hall.capacity || 0);
}

function validateHall(hall, halls, editingHallId = null) {
  const errors = {};

  const hallType = String(hall.hallType || "").trim();
  const hallName = String(hall.hallName || "").trim();
  const roomNumber = String(hall.roomNumber || "").trim();
  const building = String(hall.building || "").trim();
  const floor = String(hall.floor || "").trim();

  const rows = toSafeInteger(hall.rows);
  const columns = toSafeInteger(hall.columns);
  const seatsPerUnit = toSafeInteger(hall.seatsPerUnit);

  if (!hallType || !HALL_TYPES.includes(hallType)) {
    errors.hallType = "Please select a valid hall type.";
  }

  if (!hallName) {
    errors.hallName = "Hall name is required.";
  } else if (hallName.length > MAX_TEXT_LENGTH.hallName) {
    errors.hallName = `Hall name must be within ${MAX_TEXT_LENGTH.hallName} characters.`;
  }

  if (!roomNumber) {
    errors.roomNumber = "Room number is required.";
  } else if (roomNumber.length > MAX_TEXT_LENGTH.roomNumber) {
    errors.roomNumber = `Room number must be within ${MAX_TEXT_LENGTH.roomNumber} characters.`;
  }

  if (!building) {
    errors.building = "Building is required.";
  } else if (building.length > MAX_TEXT_LENGTH.building) {
    errors.building = `Building must be within ${MAX_TEXT_LENGTH.building} characters.`;
  }

  if (!floor) {
    errors.floor = "Floor is required.";
  } else if (floor.length > MAX_TEXT_LENGTH.floor) {
    errors.floor = `Floor must be within ${MAX_TEXT_LENGTH.floor} characters.`;
  }

  if (!Number.isInteger(rows) || rows < 1) {
    errors.rows = "Rows must be at least 1.";
  } else if (rows > MAX_ROWS) {
    errors.rows = `Rows cannot be greater than ${MAX_ROWS}.`;
  }

  if (!Number.isInteger(columns) || columns < 1) {
    errors.columns = "Columns must be at least 1.";
  } else if (columns > MAX_COLUMNS) {
    errors.columns = `Columns cannot be greater than ${MAX_COLUMNS}.`;
  }

  if (!Number.isInteger(seatsPerUnit) || seatsPerUnit < 1) {
    errors.seatsPerUnit = "Seats per unit must be at least 1.";
  } else if (seatsPerUnit > MAX_SEATS_PER_UNIT) {
    errors.seatsPerUnit = `Seats per unit cannot be greater than ${MAX_SEATS_PER_UNIT}.`;
  }

  const capacity = rows * columns * seatsPerUnit;

  if (capacity > MAX_CAPACITY) {
    errors.capacity = `Capacity cannot be greater than ${MAX_CAPACITY}.`;
  }

  const duplicateHallName = halls.some((existingHall) => {
    if (existingHall.id === editingHallId) {
      return false;
    }

    return (
      normalizeText(existingHall.hallName) === normalizeText(hallName)
    );
  });

  if (duplicateHallName) {
    errors.hallName = "A hall with this name already exists.";
  }

  const duplicateRoomNumber = halls.some((existingHall) => {
    if (existingHall.id === editingHallId) {
      return false;
    }

    return (
      normalizeText(existingHall.roomNumber) ===
      normalizeText(roomNumber)
    );
  });

  if (duplicateRoomNumber) {
    errors.roomNumber = "This room number already exists.";
  }

  return errors;
}

function getInputClass(hasError = false) {
  return [
    "w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition",
    "bg-white text-slate-900 placeholder:text-slate-400",
    "focus:ring-2",
    hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
      : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100",
  ].join(" ");
}

function FieldError({ message }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
      <AlertTriangle size={13} />
      {message}
    </p>
  );
}

function HallForm({
  form,
  errors,
  isEditing,
  formRef,
  hallNameInputRef,
  onChange,
  onSubmit,
  onCancel,
}) {
  const calculatedCapacity = calculateCapacity(form);

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="scroll-mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5"
      noValidate
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {isEditing ? "Edit Hall" : "Add New Hall"}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Enter the hall details and seating arrangement.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"
          aria-label="Close hall form"
        >
          <X size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="hallType"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Hall Type
          </label>

          <select
            id="hallType"
            name="hallType"
            value={form.hallType}
            onChange={onChange}
            className={getInputClass(Boolean(errors.hallType))}
          >
            {HALL_TYPES.map((hallType) => (
              <option key={hallType} value={hallType}>
                {hallType}
              </option>
            ))}
          </select>

          <FieldError message={errors.hallType} />
        </div>

        <div>
          <label
            htmlFor="hallName"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Hall Name
          </label>

          <input
            ref={hallNameInputRef}
            id="hallName"
            name="hallName"
            type="text"
            value={form.hallName}
            onChange={onChange}
            maxLength={MAX_TEXT_LENGTH.hallName}
            placeholder="Example: Hall 104"
            className={getInputClass(Boolean(errors.hallName))}
          />

          <FieldError message={errors.hallName} />
        </div>

        <div>
          <label
            htmlFor="roomNumber"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Room Number
          </label>

          <input
            id="roomNumber"
            name="roomNumber"
            type="text"
            value={form.roomNumber}
            onChange={onChange}
            maxLength={MAX_TEXT_LENGTH.roomNumber}
            placeholder="Example: 104"
            className={getInputClass(Boolean(errors.roomNumber))}
          />

          <FieldError message={errors.roomNumber} />
        </div>

        <div>
          <label
            htmlFor="building"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Building
          </label>

          <input
            id="building"
            name="building"
            type="text"
            value={form.building}
            onChange={onChange}
            maxLength={MAX_TEXT_LENGTH.building}
            placeholder="Example: Main Block"
            className={getInputClass(Boolean(errors.building))}
          />

          <FieldError message={errors.building} />
        </div>

        <div>
          <label
            htmlFor="floor"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Floor
          </label>

          <input
            id="floor"
            name="floor"
            type="text"
            value={form.floor}
            onChange={onChange}
            maxLength={MAX_TEXT_LENGTH.floor}
            placeholder="Example: Ground Floor"
            className={getInputClass(Boolean(errors.floor))}
          />

          <FieldError message={errors.floor} />
        </div>

        <div>
          <label
            htmlFor="seatingType"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Seating Type
          </label>

          <select
            id="seatingType"
            name="seatingType"
            value={form.seatingType}
            onChange={onChange}
            className={getInputClass(Boolean(errors.seatingType))}
          >
            <option value="Bench">Bench</option>
            <option value="Desk">Desk</option>
            <option value="Chair">Chair</option>
            <option value="Table">Table</option>
            <option value="Other">Other</option>
          </select>

          <FieldError message={errors.seatingType} />
        </div>

        <div>
          <label
            htmlFor="rows"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Number of Rows
          </label>

          <input
            id="rows"
            name="rows"
            type="number"
            min="1"
            max={MAX_ROWS}
            step="1"
            value={form.rows}
            onChange={onChange}
            className={getInputClass(Boolean(errors.rows))}
          />

          <FieldError message={errors.rows} />
        </div>

        <div>
          <label
            htmlFor="columns"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Number of Columns
          </label>

          <input
            id="columns"
            name="columns"
            type="number"
            min="1"
            max={MAX_COLUMNS}
            step="1"
            value={form.columns}
            onChange={onChange}
            className={getInputClass(Boolean(errors.columns))}
          />

          <FieldError message={errors.columns} />
        </div>

        <div>
          <label
            htmlFor="seatsPerUnit"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Seats Per Bench / Unit
          </label>

          <input
            id="seatsPerUnit"
            name="seatsPerUnit"
            type="number"
            min="1"
            max={MAX_SEATS_PER_UNIT}
            step="1"
            value={form.seatsPerUnit}
            onChange={onChange}
            className={getInputClass(Boolean(errors.seatsPerUnit))}
          />

          <FieldError message={errors.seatsPerUnit} />
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="features"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            Features / Notes
          </label>

          <textarea
            id="features"
            name="features"
            value={form.features}
            onChange={onChange}
            maxLength={MAX_TEXT_LENGTH.features}
            rows="3"
            placeholder="Example: AC, projector, wide aisles"
            className={getInputClass(Boolean(errors.features))}
          />

          <FieldError message={errors.features} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-indigo-100 bg-white p-4">
        <div className="rounded-lg bg-indigo-100 p-2 text-indigo-700">
          <Grid3X3 size={20} />
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500">
            Calculated Seating Capacity
          </p>

          <p className="text-xl font-bold text-indigo-700">
            {calculatedCapacity} Seats
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Rows × Columns × Seats Per Unit
          </p>
        </div>
      </div>

      <FieldError message={errors.capacity} />

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RotateCcw size={16} />
          Cancel
        </button>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <Save size={16} />
          {isEditing ? "Update Hall" : "Save Hall"}
        </button>
      </div>
    </form>
  );
}

function HallCard({ hall, onEdit, onDelete }) {
  const capacity = getHallCapacity(hall);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
            <Building2 size={22} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="break-words text-base font-bold text-slate-900">
                {hall.hallName}
              </h3>

              {hall.isDefault && (
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  Default
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {hall.hallType}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(hall)}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-700"
            aria-label={`Edit ${hall.hallName}`}
            title="Edit hall"
          >
            <Pencil size={17} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(hall)}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
            aria-label={`Delete ${hall.hallName}`}
            title="Delete hall"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Room Number</p>

          <p className="mt-1 break-words text-sm font-semibold text-slate-800">
            {hall.roomNumber || "Not specified"}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Building</p>

          <p className="mt-1 break-words text-sm font-semibold text-slate-800">
            {hall.building || "Not specified"}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Floor</p>

          <p className="mt-1 break-words text-sm font-semibold text-slate-800">
            {hall.floor || "Not specified"}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Seating Layout</p>

          <p className="mt-1 text-sm font-semibold text-slate-800">
            {hall.rows} × {hall.columns}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Seating Type</p>

          <p className="mt-1 text-sm font-semibold text-slate-800">
            {hall.seatingType || "Not specified"}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Capacity</p>

          <p className="mt-1 flex items-center gap-1 text-sm font-bold text-indigo-700">
            <Users size={15} />
            {capacity} Seats
          </p>
        </div>
      </div>

      {hall.features && (
        <div className="mt-3 rounded-xl border border-slate-100 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Features
          </p>

          <p className="mt-1 break-words text-sm text-slate-600">
            {hall.features}
          </p>
        </div>
      )}
    </article>
  );
}

export default function HallManagement({
  halls = [],
  classes = [],
  onChange,
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHallId, setEditingHallId] = useState(null);
  const [form, setForm] = useState(EMPTY_HALL);
  const [errors, setErrors] = useState({});

  const formRef = useRef(null);
  const hallNameInputRef = useRef(null);

  const totalStudents = useMemo(() => {
    return classes.reduce((total, currentClass) => {
      const count = Number(
        currentClass.actualStudentCount ??
          currentClass.studentCount ??
          currentClass.totalStudents ??
          0
      );

      return total + (Number.isFinite(count) ? count : 0);
    }, 0);
  }, [classes]);

  const totalCapacity = useMemo(() => {
    return halls.reduce((total, hall) => {
      return total + getHallCapacity(hall);
    }, 0);
  }, [halls]);

  const remainingCapacity = totalCapacity - totalStudents;

  const isCapacitySufficient = remainingCapacity >= 0;

  function openAddForm() {
    setEditingHallId(null);

    const newForm = {
      ...EMPTY_HALL,
      id: undefined,
      rows: 5,
      columns: 8,
      seatsPerUnit: 1,
      capacity: 40,
    };

    setForm(newForm);
    setErrors({});
    setIsFormOpen(true);

    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      hallNameInputRef.current?.focus();
    });
  }

  function openEditForm(hall) {
    setEditingHallId(hall.id);

    setForm({
      id: hall.id,
      hallType: hall.hallType || "General Hall",
      hallName: hall.hallName || "",
      roomNumber: hall.roomNumber || "",
      building: hall.building || "",
      floor: hall.floor || "",
      rows: hall.rows || 1,
      columns: hall.columns || 1,
      seatingType: hall.seatingType || "Bench",
      seatsPerUnit: hall.seatsPerUnit || 1,
      capacity: getHallCapacity(hall),
      features: hall.features || "",
      isDefault: Boolean(hall.isDefault),
    });

    setErrors({});
    setIsFormOpen(true);

    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      hallNameInputRef.current?.focus();
    });
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingHallId(null);
    setForm(EMPTY_HALL);
    setErrors({});
  }

  function handleChange(event) {
    const { name, value } = event.target;

    let nextValue = value;

    if (name === "hallName") {
      nextValue = sanitizeText(value, MAX_TEXT_LENGTH.hallName);
    }

    if (name === "roomNumber") {
      nextValue = sanitizeText(value, MAX_TEXT_LENGTH.roomNumber);
    }

    if (name === "building") {
      nextValue = sanitizeText(value, MAX_TEXT_LENGTH.building);
    }

    if (name === "floor") {
      nextValue = sanitizeText(value, MAX_TEXT_LENGTH.floor);
    }

    if (name === "features") {
      nextValue = sanitizeText(value, MAX_TEXT_LENGTH.features);
    }

    if (
      name === "rows" ||
      name === "columns" ||
      name === "seatsPerUnit"
    ) {
      nextValue = value.replace(/[^\d]/g, "");
    }

    const updatedForm = {
      ...form,
      [name]: nextValue,
    };

    if (
      name === "rows" ||
      name === "columns" ||
      name === "seatsPerUnit"
    ) {
      updatedForm.capacity = calculateCapacity(updatedForm);
    }

    setForm(updatedForm);

    if (errors[name] || errors.capacity) {
      setErrors((previousErrors) => ({
        ...previousErrors,
        [name]: "",
        capacity: "",
      }));
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateHall(
      form,
      halls,
      editingHallId
    );

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const nextHall = {
      id: editingHallId || createHallId(),
      hallType: String(form.hallType).trim(),
      hallName: String(form.hallName).trim(),
      roomNumber: String(form.roomNumber).trim(),
      building: String(form.building).trim(),
      floor: String(form.floor).trim(),
      rows: toSafeInteger(form.rows),
      columns: toSafeInteger(form.columns),
      seatingType: String(form.seatingType || "Bench"),
      seatsPerUnit: toSafeInteger(form.seatsPerUnit) || 1,
      capacity: calculateCapacity(form),
      features: String(form.features || "").trim(),
      isDefault: Boolean(form.isDefault),
    };

    let updatedHalls;

    if (editingHallId) {
      updatedHalls = halls.map((hall) =>
        hall.id === editingHallId ? nextHall : hall
      );
    } else {
      updatedHalls = [...halls, nextHall];
    }

    onChange(updatedHalls);
    closeForm();
  }

  function handleDelete(hall) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${hall.hallName}"?`
    );

    if (!confirmed) {
      return;
    }

    const updatedHalls = halls.filter(
      (currentHall) => currentHall.id !== hall.id
    );

    onChange(updatedHalls);

    if (editingHallId === hall.id) {
      closeForm();
    }
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700">
              <Building2 size={22} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Hall Management
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage classrooms, laboratories, halls and other exam venues.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <Plus size={18} />
            Add Hall
          </button>
        </div>

        {/* Summary Cards */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">
                Total Students
              </p>

              <UserRound size={19} className="text-indigo-600" />
            </div>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {totalStudents}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">
                Total Halls
              </p>

              <Building2 size={19} className="text-indigo-600" />
            </div>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {halls.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">
                Total Seating Capacity
              </p>

              <Grid3X3 size={19} className="text-indigo-600" />
            </div>

            <p className="mt-1 text-2xl font-bold text-indigo-700">
              {totalCapacity}
            </p>
          </div>

          <div
            className={`rounded-xl border p-4 ${
              isCapacitySufficient
                ? "border-emerald-100 bg-emerald-50"
                : "border-red-100 bg-red-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <p
                className={`text-xs font-medium ${
                  isCapacitySufficient
                    ? "text-emerald-700"
                    : "text-red-700"
                }`}
              >
                Capacity Status
              </p>

              {isCapacitySufficient ? (
                <CheckCircle2 size={19} className="text-emerald-600" />
              ) : (
                <AlertCircle size={19} className="text-red-600" />
              )}
            </div>

            <p
              className={`mt-1 text-xl font-bold ${
                isCapacitySufficient
                  ? "text-emerald-700"
                  : "text-red-700"
              }`}
            >
              {isCapacitySufficient ? "Sufficient" : "Insufficient"}
            </p>
          </div>
        </div>
      </div>

      {/* Capacity Information */}
      <div
        className={`rounded-2xl border p-4 ${
          isCapacitySufficient
            ? "border-emerald-100 bg-emerald-50"
            : "border-red-100 bg-red-50"
        }`}
      >
        <div className="flex items-start gap-3">
          {isCapacitySufficient ? (
            <ShieldCheck
              className="mt-0.5 shrink-0 text-emerald-700"
              size={21}
            />
          ) : (
            <AlertTriangle
              className="mt-0.5 shrink-0 text-red-700"
              size={21}
            />
          )}

          <div>
            <p
              className={`font-semibold ${
                isCapacitySufficient
                  ? "text-emerald-900"
                  : "text-red-900"
              }`}
            >
              {isCapacitySufficient
                ? `${remainingCapacity} seat(s) available`
                : `${Math.abs(remainingCapacity)} seat(s) shortage`}
            </p>

            <p
              className={`mt-1 text-sm ${
                isCapacitySufficient
                  ? "text-emerald-800"
                  : "text-red-800"
              }`}
            >
              {isCapacitySufficient
                ? "The available hall capacity is enough for all registered students."
                : "Please add more halls or increase the seating capacity before continuing."}
            </p>
          </div>
        </div>
      </div>

      {/* Validation Information */}
      <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
        <ShieldCheck
          className="mt-0.5 shrink-0 text-indigo-700"
          size={21}
        />

        <div>
          <p className="font-semibold text-indigo-900">
            Hall validation enabled
          </p>

          <p className="mt-1 text-sm text-indigo-800">
            Hall names and room numbers must be unique. Capacity is calculated
            using rows × columns × seats per unit.
          </p>
        </div>
      </div>

      {/* Add/Edit Form */}
      {isFormOpen && (
        <HallForm
          form={form}
          errors={errors}
          isEditing={Boolean(editingHallId)}
          formRef={formRef}
          hallNameInputRef={hallNameInputRef}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      )}

      {/* Hall List */}
      {halls.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Building2 size={40} className="mx-auto text-slate-300" />

          <h3 className="mt-3 text-lg font-bold text-slate-800">
            No halls available
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Add at least one hall to continue with exam allocation.
          </p>

          <button
            type="button"
            onClick={openAddForm}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus size={17} />
            Add First Hall
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {halls.map((hall) => (
            <HallCard
              key={hall.id}
              hall={hall}
              onEdit={openEditForm}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}