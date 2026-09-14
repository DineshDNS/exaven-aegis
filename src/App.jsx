import { useEffect, useMemo, useState } from "react";

import AppShell from "./components/layout/AppShell";

import ExaminationDetails from "./components/examination/ExaminationDetails";
import ClassesStudents from "./components/students/ClassesStudents";
import HallManagement from "./components/halls/HallManagement";
import SheetArrangement from "./components/arrangement/SheetArrangement";
import StudentAllocation from "./components/result/StudentAllocation";

import { initialAllocationState } from "./constants/initialState";
import { defaultHalls } from "./data/defaultHalls";

import {
  validateClasses,
  validateExaminationDetails,
} from "./utils/validation";

import { allocateAllHalls } from "./utils/seatingAllocation";

/* -------------------------------------------------------------------------- */
/* Get course name                                                            */
/* -------------------------------------------------------------------------- */

function getClassCourse(classItem) {
  if (classItem?.course === "Other") {
    return (
      classItem?.customCourseName ||
      classItem?.course ||
      "-"
    );
  }

  return classItem?.course || "-";
}

/* -------------------------------------------------------------------------- */
/* Create allocation students                                                 */
/*                                                                            */
/* Register numbers are taken only from assignedRegisters.                    */
/* Student names are not available, so they remain empty.                     */
/* StudentAllocation.jsx will display "-" for empty student names.            */
/* -------------------------------------------------------------------------- */

function createAllocationStudents(classes = []) {
  if (!Array.isArray(classes)) {
    return [];
  }

  return classes.flatMap((classItem, classIndex) => {
    const assignedRegisters = Array.isArray(
      classItem?.assignedRegisters
    )
      ? classItem.assignedRegisters
      : [];

    const className =
      classItem?.className ||
      classItem?.class_name ||
      `Class ${classIndex + 1}`;

    const year = classItem?.year || "-";
    const semester = classItem?.semester || "-";
    const course = getClassCourse(classItem);

    return assignedRegisters
      .filter(
        (registerNumber) =>
          registerNumber !== null &&
          registerNumber !== undefined &&
          String(registerNumber).trim() !== ""
      )
      .map((registerNumber, studentIndex) => {
        const exactRegisterNumber = String(
          registerNumber
        ).trim();

        return {
          id: `${classItem.id || classIndex}-${exactRegisterNumber}`,

          /* Exact register number */
          registerNumber: exactRegisterNumber,
          register_number: exactRegisterNumber,

          /*
           * Student name is not available in the current class data.
           * Do not use register number as student name.
           */
          studentName: "",
          student_name: "",
          name: "",

          studentYear: year,
          student_year: year,
          year,

          studentClass: className,
          student_class: className,

          className,
          class_name: className,

          course,
          semester,

          classIndex,
          studentNumber: studentIndex + 1,
        };
      });
  });
}

/* -------------------------------------------------------------------------- */
/* Main App                                                                   */
/* -------------------------------------------------------------------------- */

export default function App() {
  const [allocationState, setAllocationState] = useState({
    ...initialAllocationState,
    halls: defaultHalls || [],
  });

  const [examErrors, setExamErrors] = useState({});
  const [classErrors, setClassErrors] = useState({});

  const {
    currentStep,
    examDetails,
    classes,
    halls,
    selectedArrangementId,
  } = allocationState;

  const safeClasses = Array.isArray(classes)
    ? classes
    : [];

  const safeHalls = Array.isArray(halls)
    ? halls
    : [];

  /* ------------------------------------------------------------------------ */
  /* Create student list                                                      */
  /* ------------------------------------------------------------------------ */

  const allocationStudents = useMemo(() => {
    return createAllocationStudents(safeClasses);
  }, [safeClasses]);

  const totalStudents = allocationStudents.length;

  /* ------------------------------------------------------------------------ */
  /* Calculate total hall capacity                                            */
  /* ------------------------------------------------------------------------ */

  const totalHallCapacity = useMemo(() => {
    return safeHalls.reduce((total, hall) => {
      const rows = Number(hall?.rows || 0);
      const columns = Number(hall?.columns || 0);
      const seatsPerUnit = Number(
        hall?.seatsPerUnit || 1
      );

      const calculatedCapacity =
        rows * columns * seatsPerUnit;

      const capacity =
        calculatedCapacity > 0
          ? calculatedCapacity
          : Number(hall?.capacity || 0);

      return (
        total +
        (Number.isFinite(capacity) ? capacity : 0)
      );
    }, 0);
  }, [safeHalls]);

  const hasCapacityShortage =
    totalStudents > totalHallCapacity;

  /* ------------------------------------------------------------------------ */
  /* Generate allocation                                                      */
  /* ------------------------------------------------------------------------ */

  const allocation = useMemo(() => {
    if (
      safeHalls.length === 0 ||
      allocationStudents.length === 0 ||
      !selectedArrangementId
    ) {
      return null;
    }

    return allocateAllHalls({
      halls: safeHalls,
      students: allocationStudents,
      arrangementId: selectedArrangementId,
    });
  }, [
    safeHalls,
    allocationStudents,
    selectedArrangementId,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Scroll to top when step changes                                          */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [currentStep]);

  /* ------------------------------------------------------------------------ */
  /* State handlers                                                           */
  /* ------------------------------------------------------------------------ */

  function updateState(field, value) {
    setAllocationState((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleExamDetailsChange(nextDetails) {
    updateState("examDetails", nextDetails);
    setExamErrors({});
  }

  function handleClassesChange(nextClasses) {
    updateState("classes", nextClasses);
    setClassErrors({});
  }

  function handleHallsChange(nextHalls) {
    updateState("halls", nextHalls);
  }

  function handleArrangementChange(arrangementId) {
    updateState(
      "selectedArrangementId",
      arrangementId
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Validation                                                                */
  /* ------------------------------------------------------------------------ */

  function validateCurrentStep() {
    if (currentStep === 1) {
      const result =
        validateExaminationDetails(examDetails);

      if (
        result &&
        Object.keys(result).length > 0
      ) {
        setExamErrors(result);
        return false;
      }

      setExamErrors({});
      return true;
    }

    if (currentStep === 2) {
      const result = validateClasses(safeClasses);

      if (
        result &&
        Object.keys(result).length > 0
      ) {
        setClassErrors(result);
        return false;
      }

      setClassErrors({});
      return true;
    }

    if (currentStep === 3) {
      return safeHalls.length > 0;
    }

    if (currentStep === 4) {
      return (
        Boolean(selectedArrangementId) &&
        !hasCapacityShortage
      );
    }

    if (currentStep === 5) {
      return Boolean(allocation);
    }

    return true;
  }

  /* ------------------------------------------------------------------------ */
  /* Navigation                                                                */
  /* ------------------------------------------------------------------------ */

  function handleNext() {
    if (!validateCurrentStep()) {
      return;
    }

    setAllocationState((previous) => ({
      ...previous,
      currentStep: Math.min(
        previous.currentStep + 1,
        6
      ),
    }));
  }

  function handleBack() {
    setAllocationState((previous) => ({
      ...previous,
      currentStep: Math.max(
        previous.currentStep - 1,
        1
      ),
    }));
  }

  function handleStepChange(step) {
    setAllocationState((previous) => ({
      ...previous,
      currentStep: step,
    }));
  }

  /* ------------------------------------------------------------------------ */
  /* Render current step                                                       */
  /* ------------------------------------------------------------------------ */

  function renderCurrentStep() {
    switch (currentStep) {
      case 1:
        return (
          <ExaminationDetails
            examDetails={examDetails}
            onChange={handleExamDetailsChange}
            errors={examErrors}
          />
        );

      case 2:
        return (
          <ClassesStudents
            classes={safeClasses}
            onChange={handleClassesChange}
            errors={classErrors}
          />
        );

      case 3:
        return (
          <HallManagement
            halls={safeHalls}
            onChange={handleHallsChange}
          />
        );

      case 4:
        return (
          <SheetArrangement
            classes={safeClasses}
            halls={safeHalls}
            allocation={allocation}
            selectedArrangementId={
              selectedArrangementId
            }
            onSelectArrangement={
              handleArrangementChange
            }
          />
        );

      case 5:
      case 6:
        return (
          <StudentAllocation
            classes={safeClasses}
            halls={safeHalls}
            selectedArrangementId={
              selectedArrangementId
            }
            allocation={allocation}
            examDetails={examDetails}
          />
        );

      default:
        return null;
    }
  }

  /* ------------------------------------------------------------------------ */
  /* App layout                                                                */
  /* ------------------------------------------------------------------------ */

  return (
    <AppShell
      currentStep={currentStep}
      onStepChange={handleStepChange}
      onNext={handleNext}
      onBack={handleBack}
      canGoBack={currentStep > 1}
      canGoNext={currentStep < 6}
      totalStudents={totalStudents}
      totalHallCapacity={totalHallCapacity}
    >
      {renderCurrentStep()}
    </AppShell>
  );
}