export function validateExaminationDetails(examDetails) {
  const errors = {};

  if (!examDetails.examinationName) {
    errors.examinationName = "Please select an examination name.";
  }

  if (
    examDetails.examinationName === "Other / Custom" &&
    !examDetails.customExaminationName?.trim()
  ) {
    errors.customExaminationName =
      "Please enter the custom examination name.";
  }

  if (!examDetails.date) {
    errors.date = "Please select the examination date.";
  }

  if (!examDetails.startTime) {
    errors.startTime = "Please select or enter the starting time.";
  }

  if (!examDetails.endTime) {
    errors.endTime = "Please select or enter the ending time.";
  }

  if (examDetails.startTime && examDetails.endTime) {
    const startMinutes = convertTimeToMinutes(examDetails.startTime);
    const endMinutes = convertTimeToMinutes(examDetails.endTime);

    if (startMinutes >= endMinutes) {
      errors.endTime = "End time must be later than the start time.";
    }
  }

  return errors;
}

function convertTimeToMinutes(timeValue) {
  const [hours, minutes] = timeValue.split(":").map(Number);

  return hours * 60 + minutes;
}

export function validateClasses(classes) {
  const errors = {};

  if (!classes.length) {
    errors.classes = "Please add at least one class.";
    return errors;
  }

  classes.forEach((classItem, index) => {
    const generatedCount = classItem.generatedRegisters?.length || 0;
    const actualCount = Number(classItem.actualStudentCount || 0);
    const excludedCount = classItem.excludedRegisters?.length || 0;

    if (actualCount > generatedCount) {
      errors[`class-${index}`] =
        "Actual student count cannot be greater than generated register count.";
    }

    const requiredExclusions = generatedCount - actualCount;

    if (excludedCount !== requiredExclusions) {
      errors[`class-${index}`] =
        `Please select exactly ${requiredExclusions} register(s) to exclude.`;
    }
  });

  return errors;
}