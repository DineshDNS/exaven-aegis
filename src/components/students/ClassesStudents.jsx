import { useMemo, useState } from "react";
import { DEFAULT_REGISTER_PREFIX } from "../../constants/initialState";

const emptyForm = {
  course: "",
  customCourseName: "",
  year: "",
  semester: "",
  className: "",
  registerPrefix: DEFAULT_REGISTER_PREFIX,
  registerStart: "",
  registerEnd: "",
  actualStudentCount: "",
};

const courseOptions = [
  "B.E Computer Science and Engineering",
  "B.E Electrical and Electronics Engineering",
  "B.E Electronics and Communication Engineering",
  "B.E Mechanical Engineering",
  "B.E Civil Engineering",
  "B.Tech Information Technology",
  "B.Tech Artificial Intelligence and Data Science",
  "B.Sc Computer Science",
  "BCA",
  "MCA",
  "Other",
];

const yearOptions = [
  {
    label: "1st Year",
    value: "1st Year",
    semesters: ["Semester 1", "Semester 2"],
  },
  {
    label: "2nd Year",
    value: "2nd Year",
    semesters: ["Semester 3", "Semester 4"],
  },
  {
    label: "3rd Year",
    value: "3rd Year",
    semesters: ["Semester 5", "Semester 6"],
  },
  {
    label: "4th Year",
    value: "4th Year",
    semesters: ["Semester 7", "Semester 8"],
  },
];

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function getClassCourse(classItem) {
  return classItem.course === "Other"
    ? classItem.customCourseName || classItem.course
    : classItem.course;
}

function createClassKey(classItem) {
  return [
    normalizeValue(getClassCourse(classItem)),
    normalizeValue(classItem.year),
    normalizeValue(classItem.semester),
    normalizeValue(classItem.className),
  ].join("|");
}

function generateRegisterNumbers(prefix, start, end) {
  const startNumber = Number(start);
  const endNumber = Number(end);

  if (
    !prefix ||
    start === "" ||
    end === "" ||
    Number.isNaN(startNumber) ||
    Number.isNaN(endNumber) ||
    startNumber > endNumber
  ) {
    return [];
  }

  const registers = [];

  for (let number = startNumber; number <= endNumber; number += 1) {
    registers.push(`${prefix}${String(number).padStart(3, "0")}`);
  }

  return registers;
}

function getAssignedRegisters(classItem) {
  if (Array.isArray(classItem.assignedRegisters)) {
    return classItem.assignedRegisters;
  }

  const generatedRegisters = classItem.generatedRegisters || [];
  const excludedRegisters = classItem.excludedRegisters || [];

  return generatedRegisters.filter(
    (registerNumber) => !excludedRegisters.includes(registerNumber)
  );
}

function findDuplicateClass(newClass, existingClasses) {
  const newClassKey = createClassKey(newClass);

  return existingClasses.find(
    (classItem) => createClassKey(classItem) === newClassKey
  );
}

function findRegisterConflicts(newClass, existingClasses) {
  const previousRegisterMap = new Map();

  existingClasses.forEach((classItem) => {
    const assignedRegisters = getAssignedRegisters(classItem);

    assignedRegisters.forEach((registerNumber) => {
      if (!previousRegisterMap.has(registerNumber)) {
        previousRegisterMap.set(registerNumber, []);
      }

      previousRegisterMap.get(registerNumber).push(classItem);
    });
  });

  const newAssignedRegisters = getAssignedRegisters(newClass);
  const conflicts = [];

  newAssignedRegisters.forEach((registerNumber) => {
    const previousClasses = previousRegisterMap.get(registerNumber);

    if (previousClasses?.length) {
      previousClasses.forEach((classItem) => {
        conflicts.push({
          registerNumber,
          classItem,
        });
      });
    }
  });

  return conflicts;
}

function getLastThreeDigits(registerNumber) {
  return String(registerNumber).slice(-3);
}

function formatRegisterRange(start, end) {
  if (start === "" || end === "") {
    return "Not configured";
  }

  return `${String(start).padStart(3, "0")} - ${String(end).padStart(
    3,
    "0"
  )}`;
}

export default function ClassesStudents({
  classes = [],
  onChange,
  errors = {},
}) {
  const [form, setForm] = useState(emptyForm);
  const [generatedRegisters, setGeneratedRegisters] = useState([]);
  const [excludedRegisters, setExcludedRegisters] = useState([]);
  const [registerSearch, setRegisterSearch] = useState("");

  const [isExclusionMode, setIsExclusionMode] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [formError, setFormError] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectedYear = yearOptions.find(
    (year) => year.value === form.year
  );

  const semesterOptions = selectedYear?.semesters || [];

  const actualCount =
    form.actualStudentCount === ""
      ? 0
      : Number(form.actualStudentCount);

  const previewRegisters = useMemo(() => {
    return generateRegisterNumbers(
      form.registerPrefix.trim(),
      form.registerStart,
      form.registerEnd
    );
  }, [
    form.registerPrefix,
    form.registerStart,
    form.registerEnd,
  ]);

  const previewGeneratedCount = previewRegisters.length;

  const generatedCount = generatedRegisters.length;

  const requiredExclusionCount = Math.max(
    generatedCount - actualCount,
    0
  );

  const filteredRegisters = useMemo(() => {
    const searchValue = registerSearch.trim();

    if (!searchValue) {
      return generatedRegisters;
    }

    return generatedRegisters.filter((registerNumber) =>
      getLastThreeDigits(registerNumber).includes(searchValue)
    );
  }, [generatedRegisters, registerSearch]);

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
      ...(field === "year" ? { semester: "" } : {}),
    }));

    setFormError("");
    setWarningMessage("");
    setSuccessMessage("");
  }

  function resetForm() {
    setForm(emptyForm);
    setGeneratedRegisters([]);
    setExcludedRegisters([]);
    setRegisterSearch("");
    setIsExclusionMode(false);
    setShowConfirmation(false);
    setFormError("");
    setWarningMessage("");
    setSuccessMessage("");
  }

  function validateBasicDetails() {
    if (!form.course) {
      return "Please select a course.";
    }

    if (form.course === "Other" && !form.customCourseName.trim()) {
      return "Please enter the custom course name.";
    }

    if (!form.year) {
      return "Please select the year.";
    }

    if (!form.semester) {
      return "Please select the semester.";
    }

    if (!form.className.trim()) {
      return "Please enter the class or section.";
    }

    if (!form.registerPrefix.trim()) {
      return "Please enter the register prefix.";
    }

    if (form.registerStart === "" || form.registerEnd === "") {
      return "Please enter the register start and end numbers.";
    }

    if (
      !/^\d+$/.test(String(form.registerStart)) ||
      !/^\d+$/.test(String(form.registerEnd))
    ) {
      return "Register start and end must contain numbers only.";
    }

    if (
      Number(form.registerStart) < 0 ||
      Number(form.registerEnd) > 999
    ) {
      return "Register start and end must be between 000 and 999.";
    }

    if (Number(form.registerStart) > Number(form.registerEnd)) {
      return "Register start number cannot be greater than the end number.";
    }

    if (previewGeneratedCount === 0) {
      return "No register numbers were generated. Please check the range.";
    }

    if (form.actualStudentCount === "") {
      return "Please enter the actual student count.";
    }

    if (!Number.isInteger(actualCount) || actualCount < 0) {
      return "Actual student count must be a valid number.";
    }

    if (actualCount > previewGeneratedCount) {
      return `Actual student count (${actualCount}) cannot be greater than generated register count (${previewGeneratedCount}).`;
    }

    return "";
  }

  function buildClassData(registers, exclusions) {
    const assignedRegisters = registers.filter(
      (registerNumber) => !exclusions.includes(registerNumber)
    );

    return {
      id: createId(),
      course: form.course,
      customCourseName:
        form.course === "Other"
          ? form.customCourseName.trim()
          : "",
      year: form.year,
      semester: form.semester,
      className: form.className.trim(),
      registerPrefix: form.registerPrefix.trim(),
      registerStart: form.registerStart,
      registerEnd: form.registerEnd,
      actualStudentCount: Number(form.actualStudentCount),
      generatedRegisters: registers,
      excludedRegisters: exclusions,
      assignedRegisters,
    };
  }

  function validateClassAndRegisters(proposedClass) {
    const duplicateClass = findDuplicateClass(
      proposedClass,
      classes
    );

    if (duplicateClass) {
      return {
        type: "duplicate-class",
        message:
          `Duplicate class found. ${getClassCourse(
            proposedClass
          )} → ${proposedClass.year} → ${
            proposedClass.semester
          } → ${proposedClass.className} has already been added.`,
      };
    }

    const registerConflicts = findRegisterConflicts(
      proposedClass,
      classes
    );

    if (registerConflicts.length > 0) {
      return {
        type: "register-conflict",
        conflicts: registerConflicts,
        message: "Register number conflict found.",
      };
    }

    return null;
  }

  function handleContinueClick() {
    const validationMessage = validateBasicDetails();

    if (validationMessage) {
      setFormError(validationMessage);
      setWarningMessage("");
      setSuccessMessage("");
      return;
    }

    const registers = generateRegisterNumbers(
      form.registerPrefix.trim(),
      form.registerStart,
      form.registerEnd
    );

    setGeneratedRegisters(registers);
    setExcludedRegisters([]);
    setRegisterSearch("");
    setFormError("");
    setWarningMessage("");
    setSuccessMessage("");

    if (actualCount === registers.length) {
      const proposedClass = buildClassData(registers, []);
      const validation = validateClassAndRegisters(proposedClass);

      if (validation) {
        showValidationError(validation);
        return;
      }

      saveClass(proposedClass);
      return;
    }

    setShowConfirmation(true);
  }

  function confirmExclusionProcess() {
    setShowConfirmation(false);
    setIsExclusionMode(true);
    setWarningMessage("");
    setSuccessMessage("");
  }

  function cancelExclusionProcess() {
    setShowConfirmation(false);
    setGeneratedRegisters([]);
    setExcludedRegisters([]);
    setWarningMessage("");
    setSuccessMessage("");
  }

  function handleRegisterToggle(registerNumber) {
    setExcludedRegisters((previous) => {
      if (previous.includes(registerNumber)) {
        return previous.filter((item) => item !== registerNumber);
      }

      if (previous.length >= requiredExclusionCount) {
        return previous;
      }

      return [...previous, registerNumber];
    });

    setFormError("");
    setWarningMessage("");
    setSuccessMessage("");
  }

  function showValidationError(validation) {
    if (validation.type === "duplicate-class") {
      setWarningMessage(validation.message);
      setFormError("");
      setSuccessMessage("");
      return;
    }

    if (validation.type === "register-conflict") {
      const conflictText = validation.conflicts
        .slice(0, 12)
        .map((conflict) => {
          const previousClass = conflict.classItem;

          return `${conflict.registerNumber} → ${getClassCourse(
            previousClass
          )}, ${previousClass.year}, ${
            previousClass.semester
          }, ${previousClass.className}`;
        })
        .join("\n");

      const moreText =
        validation.conflicts.length > 12
          ? `\nAnd ${
              validation.conflicts.length - 12
            } more conflict(s).`
          : "";

      setWarningMessage(
        `Register number conflict found.\n\n${conflictText}${moreText}\n\nPlease change the register range or select different exclusions.`
      );

      setFormError("");
      setSuccessMessage("");
    }
  }

  function saveClass(proposedClass) {
    const validation = validateClassAndRegisters(proposedClass);

    if (validation) {
      showValidationError(validation);
      return;
    }

    onChange([...classes, proposedClass]);

    setSuccessMessage(
      `${getClassCourse(proposedClass)} - ${
        proposedClass.className
      } added successfully.`
    );

    resetForm();
  }

  function handleSaveClass() {
    if (excludedRegisters.length !== requiredExclusionCount) {
      setFormError(
        `Please select exactly ${requiredExclusionCount} register(s) to exclude.`
      );
      return;
    }

    const proposedClass = buildClassData(
      generatedRegisters,
      excludedRegisters
    );

    saveClass(proposedClass);
  }

  function handleRemoveClass(classId) {
    onChange(classes.filter((classItem) => classItem.id !== classId));
  }

  function handleEditClass(classItem) {
    setForm({
      course: classItem.course || "",
      customCourseName: classItem.customCourseName || "",
      year: classItem.year || "",
      semester: classItem.semester || "",
      className: classItem.className || "",
      registerPrefix:
        classItem.registerPrefix || DEFAULT_REGISTER_PREFIX,
      registerStart: classItem.registerStart || "",
      registerEnd: classItem.registerEnd || "",
      actualStudentCount:
        classItem.actualStudentCount?.toString() || "",
    });

    setGeneratedRegisters(classItem.generatedRegisters || []);
    setExcludedRegisters(classItem.excludedRegisters || []);
    setRegisterSearch("");
    setIsExclusionMode(true);
    setShowConfirmation(false);
    setFormError("");
    setWarningMessage("");
    setSuccessMessage("");

    onChange(classes.filter((item) => item.id !== classItem.id));
  }

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-2xl">
          🎓
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Classes & Students
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Add classes and prevent duplicate register assignments.
          </p>
        </div>
      </div>

      {/* Academic Details */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-indigo-500" />

          <h3 className="text-xl font-bold text-slate-900">
            Academic Details
          </h3>
        </div>

        {/* Course - Large Field */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Course
          </label>

          <select
            value={form.course}
            onChange={(event) =>
              updateField("course", event.target.value)
            }
            className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          >
            <option value="">Select course</option>

            {courseOptions.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Course */}
        {form.course === "Other" && (
          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Custom Course Name
            </label>

            <input
              type="text"
              value={form.customCourseName}
              onChange={(event) =>
                updateField(
                  "customCourseName",
                  event.target.value
                )
              }
              placeholder="Example: B.Des Fashion Technology"
              className="h-14 w-full rounded-2xl border border-slate-300 px-4 text-base outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>
        )}

        {/* Year and Semester */}
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Year
            </label>

            <select
              value={form.year}
              onChange={(event) =>
                updateField("year", event.target.value)
              }
              className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="">Select year</option>

              {yearOptions.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Semester
            </label>

            <select
              value={form.semester}
              disabled={!form.year}
              onChange={(event) =>
                updateField("semester", event.target.value)
              }
              className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="">
                {form.year
                  ? "Select semester"
                  : "Select year first"}
              </option>

              {semesterOptions.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Class / Section */}
        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Class / Section
          </label>

          <input
            type="text"
            value={form.className}
            onChange={(event) =>
              updateField("className", event.target.value)
            }
            placeholder="Example: A Section or CSE-A"
            className="h-14 w-full rounded-2xl border border-slate-300 px-4 text-base outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
        </div>
      </section>

      {/* Register Details */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-indigo-500" />

          <h3 className="text-xl font-bold text-slate-900">
            Register Number Details
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
          <div className="md:col-span-6">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Register Prefix
            </label>

            <input
              type="text"
              value={form.registerPrefix}
              onChange={(event) =>
                updateField(
                  "registerPrefix",
                  event.target.value
                )
              }
              placeholder="Example: 811224104"
              className="h-14 w-full rounded-2xl border border-slate-300 px-4 text-base outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />

            <p className="mt-2 text-xs text-slate-500">
              Example: 811224104 + 001 = 811224104001
            </p>
          </div>

          <div className="md:col-span-3">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Register Start
            </label>

            <input
              type="number"
              min="0"
              max="999"
              value={form.registerStart}
              onChange={(event) =>
                updateField(
                  "registerStart",
                  event.target.value
                )
              }
              placeholder="020"
              className="h-14 w-full rounded-2xl border border-slate-300 px-4 text-base outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div className="md:col-span-3">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Register End
            </label>

            <input
              type="number"
              min="0"
              max="999"
              value={form.registerEnd}
              onChange={(event) =>
                updateField(
                  "registerEnd",
                  event.target.value
                )
              }
              placeholder="040"
              className="h-14 w-full rounded-2xl border border-slate-300 px-4 text-base outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>
        </div>

        {/* Actual Student Count */}
        <div className="mt-5 max-w-md">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Actual Student Count
          </label>

          <input
            type="number"
            min="0"
            value={form.actualStudentCount}
            onChange={(event) =>
              updateField(
                "actualStudentCount",
                event.target.value
              )
            }
            placeholder="Example: 20"
            className="h-14 w-full rounded-2xl border border-slate-300 px-4 text-base outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
        </div>

        {/* Live Summary */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Generated Registers
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {previewGeneratedCount}
            </p>
          </div>

          <div className="rounded-2xl bg-indigo-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
              Actual Students
            </p>

            <p className="mt-2 text-3xl font-bold text-indigo-700">
              {form.actualStudentCount || 0}
            </p>
          </div>

          <div className="rounded-2xl bg-amber-50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
              Registers to Exclude
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-800">
              {Math.max(
                previewGeneratedCount - actualCount,
                0
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Messages */}
      {(formError || errors.classes) && (
        <div className="whitespace-pre-line rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">
          {formError || errors.classes}
        </div>
      )}

      {warningMessage && (
        <div className="whitespace-pre-line rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-800">
          {warningMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-700">
          {successMessage}
        </div>
      )}

      {/* Confirmation */}
      {showConfirmation && (
        <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
          <h3 className="text-lg font-bold text-indigo-900">
            Confirm Register Exclusion
          </h3>

          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-indigo-800">
            {`Generated registers: ${previewGeneratedCount}
Actual students: ${actualCount}
Registers to exclude: ${
              previewGeneratedCount - actualCount
            }

Do you want to continue and select the registers to exclude?`}
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={confirmExclusionProcess}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"
            >
              Yes, Continue
            </button>

            <button
              type="button"
              onClick={cancelExclusionProcess}
              className="rounded-xl border border-indigo-300 bg-white px-5 py-3 text-sm font-bold text-indigo-700 hover:bg-indigo-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Exclusion Section */}
      {isExclusionMode && (
        <section className="rounded-3xl border border-amber-300 bg-amber-50/70 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-200 text-2xl text-amber-800">
                ✓
              </div>

              <div>
                <h3 className="text-xl font-bold text-amber-900">
                  Register Exclusion
                </h3>

                <p className="mt-1 text-sm text-amber-800">
                  Select registers that should not be assigned.
                </p>
              </div>
            </div>

            <div className="w-fit rounded-full bg-white px-5 py-3 text-sm font-bold text-amber-800 shadow-sm">
              Selected {excludedRegisters.length} /{" "}
              {requiredExclusionCount}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-amber-200 bg-white p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-800">
                  Available Register Numbers
                </h4>

                <p className="mt-1 text-xs text-slate-500">
                  Search quickly using the last 3 digits.
                </p>
              </div>

              <div className="w-full sm:w-40">
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Last 3 Digits
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  value={registerSearch}
                  onChange={(event) =>
                    setRegisterSearch(
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 3)
                    )
                  }
                  placeholder="005"
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <span>
                Showing {filteredRegisters.length} register(s)
              </span>

              {registerSearch && (
                <button
                  type="button"
                  onClick={() => setRegisterSearch("")}
                  className="font-semibold text-indigo-600"
                >
                  Clear Search
                </button>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredRegisters.map((registerNumber) => {
                const isSelected =
                  excludedRegisters.includes(registerNumber);

                return (
                  <label
                    key={registerNumber}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-4 transition ${
                      isSelected
                        ? "border-amber-400 bg-amber-100"
                        : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        handleRegisterToggle(registerNumber)
                      }
                      className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />

                    <span className="text-sm font-semibold tracking-wide text-slate-800">
                      {registerNumber}
                    </span>

                    <span className="ml-auto text-xs text-slate-400">
                      {getLastThreeDigits(registerNumber)}
                    </span>
                  </label>
                );
              })}
            </div>

            {filteredRegisters.length === 0 && (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center">
                <p className="font-semibold text-slate-700">
                  No register found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Try another last 3 digit number.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {!isExclusionMode && !showConfirmation && (
          <button
            type="button"
            onClick={handleContinueClick}
            className="rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
          >
            Add Class & Continue
          </button>
        )}

        {isExclusionMode && (
          <>
            <button
              type="button"
              onClick={handleSaveClass}
              disabled={
                excludedRegisters.length !== requiredExclusionCount
              }
              className={`rounded-2xl px-6 py-4 text-sm font-bold shadow-sm ${
                excludedRegisters.length === requiredExclusionCount
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "cursor-not-allowed bg-slate-300 text-slate-500"
              }`}
            >
              Add Class & Continue
            </button>

            <button
              type="button"
              onClick={handleSaveClass}
              disabled={
                excludedRegisters.length !== requiredExclusionCount
              }
              className={`rounded-2xl border px-6 py-4 text-sm font-bold ${
                excludedRegisters.length === requiredExclusionCount
                  ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
              }`}
            >
              Finish Classes
            </button>
          </>
        )}

        <button
          type="button"
          onClick={resetForm}
          className="rounded-2xl border border-amber-400 bg-white px-6 py-4 text-sm font-bold text-amber-800 hover:bg-amber-50"
        >
          Clear Form
        </button>
      </div>

      {/* Added Classes */}
      {classes.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Added Classes
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                All classes are checked for duplicate registers.
              </p>
            </div>

            <span className="w-fit rounded-full bg-indigo-100 px-4 py-2 text-sm font-bold text-indigo-700">
              {classes.length} Class{classes.length > 1 ? "es" : ""}
            </span>
          </div>

          <div className="space-y-4">
            {classes.map((classItem) => {
              const assignedRegisters =
                getAssignedRegisters(classItem);

              return (
                <div
                  key={classItem.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        {getClassCourse(classItem)} —{" "}
                        {classItem.className}
                      </h4>

                      <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                        <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                          {classItem.year}
                        </span>

                        <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                          {classItem.semester}
                        </span>

                        <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                          Registers:{" "}
                          {formatRegisterRange(
                            classItem.registerStart,
                            classItem.registerEnd
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditClass(classItem)}
                        className="rounded-xl border border-indigo-200 bg-white px-4 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveClass(classItem.id)
                        }
                        className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-xs text-slate-500">
                        Generated Registers
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {classItem.generatedRegisters?.length || 0}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-3">
                      <p className="text-xs text-slate-500">
                        Actual Students
                      </p>

                      <p className="mt-1 text-lg font-bold text-indigo-700">
                        {classItem.actualStudentCount}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-3">
                      <p className="text-xs text-slate-500">
                        Active Registers
                      </p>

                      <p className="mt-1 text-lg font-bold text-emerald-700">
                        {assignedRegisters.length}
                      </p>
                    </div>
                  </div>

                  {classItem.excludedRegisters?.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Excluded Registers
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {classItem.excludedRegisters.map(
                          (registerNumber) => (
                            <span
                              key={registerNumber}
                              className="rounded-lg bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800"
                            >
                              {registerNumber}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}