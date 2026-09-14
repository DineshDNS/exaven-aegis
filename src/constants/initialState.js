// src/constants/initialState.js

export const DEFAULT_REGISTER_PREFIX = "811224104";

export const initialAllocationState = {
  currentStep: 1,

  examDetails: {
    examinationName: "",
    customExaminationName: "",
    date: "",
    startTime: "",
    endTime: "",
  },

  classes: [],

  selectedArrangementId: null,

  halls: [],

  selectedHallId: null,

  finalAllocation: null,

  isDraftSaved: false,
};