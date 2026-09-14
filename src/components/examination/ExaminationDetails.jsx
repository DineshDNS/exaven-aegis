import { useEffect, useState } from "react";

const examinationOptions = [
  "Internal Assessment 1",
  "Internal Assessment 2",
  "Model Examination",
  "Semester Examination",
  "Practical Examination",
  "Other / Custom",
];

function formatTime(timeValue) {
  if (!timeValue) return "";

  const [hours, minutes] = timeValue.split(":").map(Number);

  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

function getDefaultTime(period) {
  if (period === "start") return "09:00";
  return "12:00";
}

export default function ExaminationDetails({
  examDetails,
  onChange,
  errors = {},
}) {
  const [localDetails, setLocalDetails] = useState(examDetails);

  useEffect(() => {
    setLocalDetails(examDetails);
  }, [examDetails]);

  function updateField(field, value) {
    const updatedDetails = {
      ...localDetails,
      [field]: value,
    };

    setLocalDetails(updatedDetails);
    onChange(updatedDetails);
  }

  function handleTimeChange(field, value) {
    updateField(field, value);
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
          Step 01
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Examination Details
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Enter the examination name, date, and examination time. Time can be
          selected from the time picker or typed manually.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label
              htmlFor="examinationName"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Examination Name
            </label>

            <select
              id="examinationName"
              value={localDetails.examinationName}
              onChange={(event) =>
                updateField("examinationName", event.target.value)
              }
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 ${
                errors.examinationName
                  ? "border-red-400"
                  : "border-slate-300"
              }`}
            >
              <option value="">Select examination</option>

              {examinationOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            {errors.examinationName && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.examinationName}
              </p>
            )}
          </div>

          {localDetails.examinationName === "Other / Custom" && (
            <div className="md:col-span-2">
              <label
                htmlFor="customExaminationName"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Custom Examination Name
              </label>

              <input
                id="customExaminationName"
                type="text"
                value={localDetails.customExaminationName}
                onChange={(event) =>
                  updateField(
                    "customExaminationName",
                    event.target.value
                  )
                }
                placeholder="Enter examination name"
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 ${
                  errors.customExaminationName
                    ? "border-red-400"
                    : "border-slate-300"
                }`}
              />

              {errors.customExaminationName && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {errors.customExaminationName}
                </p>
              )}
            </div>
          )}

          <div className="md:col-span-2">
            <label
              htmlFor="examDate"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Examination Date
            </label>

            <input
              id="examDate"
              type="date"
              value={localDetails.date}
              onChange={(event) =>
                updateField("date", event.target.value)
              }
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 ${
                errors.date ? "border-red-400" : "border-slate-300"
              }`}
            />

            {errors.date && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.date}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="startTime"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Start Time
            </label>

            <input
              id="startTime"
              type="time"
              value={localDetails.startTime}
              onChange={(event) =>
                handleTimeChange("startTime", event.target.value)
              }
              step="60"
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 ${
                errors.startTime
                  ? "border-red-400"
                  : "border-slate-300"
              }`}
            />

            {localDetails.startTime && (
              <p className="mt-2 text-xs font-medium text-indigo-600">
                Selected time: {formatTime(localDetails.startTime)}
              </p>
            )}

            {errors.startTime && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.startTime}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="endTime"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              End Time
            </label>

            <input
              id="endTime"
              type="time"
              value={localDetails.endTime}
              onChange={(event) =>
                handleTimeChange("endTime", event.target.value)
              }
              step="60"
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 ${
                errors.endTime
                  ? "border-red-400"
                  : "border-slate-300"
              }`}
            />

            {localDetails.endTime && (
              <p className="mt-2 text-xs font-medium text-indigo-600">
                Selected time: {formatTime(localDetails.endTime)}
              </p>
            )}

            {errors.endTime && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.endTime}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-900">
            Time input supported
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-700">
            You can type the time directly or click the clock icon to select
            the time. AM/PM is automatically calculated.
          </p>
        </div>
      </div>
    </section>
  );
}