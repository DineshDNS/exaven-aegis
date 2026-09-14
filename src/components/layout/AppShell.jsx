import { useState } from "react";

import {
  Menu,
  X,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Check,
  Circle,
  LockKeyhole,
} from "lucide-react";

import { APP_NAME, APP_SUBTITLE } from "../../constants/app";
import { APP_STEPS } from "../../constants/steps";

function AppShell({
  currentStep,
  onStepChange,
  onNext,
  onPrevious,
  canGoNext = true,
  canGoPrevious = true,
  nextButtonMessage = "",
  children,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeStep = APP_STEPS.find((step) => step.id === currentStep);

  const handleStepClick = (stepId) => {
    if (stepId > currentStep) return;

    onStepChange(stepId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
            <ShieldCheck size={25} />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight">
              {APP_NAME}
            </h1>

            <p className="text-xs text-slate-500">
              Exam Allocation System
            </p>
          </div>
        </div>

        <div className="px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Allocation Workflow
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {APP_STEPS.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const isLocked = step.id > currentStep;

            return (
              <button
                key={step.id}
                type="button"
                disabled={isLocked}
                onClick={() => handleStepClick(step.id)}
                className={[
                  "group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition",
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : isCompleted
                      ? "text-slate-700 hover:bg-slate-50"
                      : "cursor-not-allowed text-slate-400",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                    isActive
                      ? "bg-indigo-600 text-white"
                      : isCompleted
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-400",
                  ].join(" ")}
                >
                  {isCompleted ? (
                    <Check size={17} />
                  ) : isLocked ? (
                    <LockKeyhole size={16} />
                  ) : (
                    String(step.id).padStart(2, "0")
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {step.label}
                  </span>

                  <span className="mt-0.5 block text-xs text-slate-400">
                    Step {step.id} of {APP_STEPS.length}
                  </span>
                </span>

                {isActive && <Circle size={9} fill="currentColor" />}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-5">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500">
              Current Progress
            </p>

            <p className="mt-1 text-sm font-bold text-slate-800">
              {currentStep} / {APP_STEPS.length} Steps
            </p>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{
                  width: `${(currentStep / APP_STEPS.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="flex h-full w-[min(88%,340px)] flex-col bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <ShieldCheck size={22} />
                </div>

                <div>
                  <h2 className="font-bold">{APP_NAME}</h2>

                  <p className="text-xs text-slate-500">
                    Allocation Workflow
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X size={21} />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {APP_STEPS.map((step) => {
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;
                const isLocked = step.id > currentStep;

                return (
                  <button
                    key={step.id}
                    type="button"
                    disabled={isLocked}
                    onClick={() => handleStepClick(step.id)}
                    className={[
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left",
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : isCompleted
                          ? "text-slate-700"
                          : "cursor-not-allowed text-slate-400",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold",
                        isActive
                          ? "bg-indigo-600 text-white"
                          : isCompleted
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-400",
                      ].join(" ")}
                    >
                      {isCompleted ? (
                        <Check size={17} />
                      ) : isLocked ? (
                        <LockKeyhole size={16} />
                      ) : (
                        String(step.id).padStart(2, "0")
                      )}
                    </span>

                    <span className="text-sm font-semibold">
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
                aria-label="Open menu"
              >
                <Menu size={21} />
              </button>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Step {currentStep} of {APP_STEPS.length}
                </p>

                <h2 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                  {activeStep?.label}
                </h2>

                <p className="hidden text-sm text-slate-500 sm:block">
                  {APP_SUBTITLE}
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 md:flex">
              <ShieldCheck size={16} className="text-indigo-600" />
              Temporary Allocation
            </div>
          </div>

          {/* Mobile Progress Bar */}
          <div className="h-1 bg-slate-100 lg:hidden">
            <div
              className="h-full bg-indigo-600 transition-all"
              style={{
                width: `${(currentStep / APP_STEPS.length) * 100}%`,
              }}
            />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 hidden items-center justify-between gap-4 md:flex">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Allocation Progress
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {Math.round((currentStep / APP_STEPS.length) * 100)}% completed
              </p>
            </div>

            <div className="flex-1 md:max-w-md">
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all"
                  style={{
                    width: `${(currentStep / APP_STEPS.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {children}

          {/* Bottom Navigation */}
          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={!canGoPrevious}
              onClick={onPrevious}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={18} />
              Previous
            </button>

            {/* Continue Button with Tooltip */}
            <div className="group relative">
              <button
                type="button"
                disabled={!canGoNext}
                onClick={onNext}
                className={[
                  "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold text-white transition",
                  canGoNext
                    ? "bg-indigo-600 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700"
                    : "cursor-not-allowed bg-slate-400 opacity-50 blur-[0.4px]",
                ].join(" ")}
              >
                Continue
                <ChevronRight size={18} />
              </button>

              {!canGoNext && nextButtonMessage && (
                <div className="pointer-events-none absolute bottom-full right-0 z-50 mb-3 hidden w-80 rounded-xl bg-slate-900 px-4 py-3 text-sm leading-5 text-white shadow-xl group-hover:block">
                  {nextButtonMessage}

                  <div className="absolute right-7 top-full border-8 border-transparent border-t-slate-900" />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppShell;