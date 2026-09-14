// src/constants/hallOptions.js

export const HALL_TYPES = [
  "Classroom",
  "Laboratory",
  "Seminar Hall",
  "Learning Hub",
  "Main Hall",
  "Auditorium",
  "Drawing Hall",
  "Workshop",
  "Other / Manual Hall",
];

export const DEFAULT_HALLS = [
  {
    id: "default-classroom-101",
    hallType: "Classroom",
    hallName: "Classroom 101",
    roomNumber: "101",
    floor: "1st Floor",
    rows: 5,
    columns: 8,
    capacity: 40,
    features: "Standard Classroom",
    isDefault: true,
  },
  {
    id: "default-computer-lab-1",
    hallType: "Laboratory",
    hallName: "Computer Lab 1",
    roomNumber: "LAB-01",
    floor: "Ground Floor",
    rows: 5,
    columns: 8,
    capacity: 40,
    features: "Computer Laboratory",
    isDefault: true,
  },
  {
    id: "default-seminar-hall",
    hallType: "Seminar Hall",
    hallName: "Seminar Hall",
    roomNumber: "SH-01",
    floor: "Ground Floor",
    rows: 8,
    columns: 10,
    capacity: 80,
    features: "AC · Tiered Seating",
    isDefault: true,
  },
];

export const EMPTY_HALL = {
  hallType: "Classroom",
  hallName: "",
  roomNumber: "",
  floor: "",
  rows: 5,
  columns: 8,
  capacity: 40,
  features: "",
  isDefault: false,
};