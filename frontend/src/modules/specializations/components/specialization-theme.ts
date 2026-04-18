interface SpecializationTheme {
  surfaceClassName: string;
  borderClassName: string;
  badgeClassName: string;
  subtleBadgeClassName: string;
  accentTextClassName: string;
  selectedChipClassName: string;
  idleChipClassName: string;
  softPanelClassName: string;
  mutedRowClassName: string;
}

const fallbackTheme: SpecializationTheme = {
  surfaceClassName: "bg-gradient-to-br from-slate-50 via-white to-slate-100",
  borderClassName: "border-slate-200",
  badgeClassName: "bg-slate-100 text-slate-700",
  subtleBadgeClassName: "bg-slate-100 text-slate-600",
  accentTextClassName: "text-slate-700",
  selectedChipClassName: "border-slate-700 bg-slate-700 text-white shadow-lg shadow-slate-500/15",
  idleChipClassName: "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50",
  softPanelClassName: "border-slate-200 bg-slate-50/80",
  mutedRowClassName: "border-slate-200 bg-slate-50/60",
};

const specializationThemes: Array<{ matches: string[]; theme: SpecializationTheme }> = [
  {
    matches: ["cardio"],
    theme: {
      surfaceClassName: "bg-gradient-to-br from-teal-50 via-white to-cyan-50",
      borderClassName: "border-teal-200",
      badgeClassName: "bg-teal-100 text-teal-700",
      subtleBadgeClassName: "bg-teal-50 text-teal-700",
      accentTextClassName: "text-teal-700",
      selectedChipClassName: "border-teal-500 bg-teal-500 text-white shadow-lg shadow-teal-500/20",
      idleChipClassName: "border-teal-200 bg-white text-teal-700 hover:border-teal-400 hover:bg-teal-50",
      softPanelClassName: "border-teal-100 bg-teal-50/80",
      mutedRowClassName: "border-teal-100 bg-teal-50/60",
    },
  },
  {
    matches: ["derm"],
    theme: {
      surfaceClassName: "bg-gradient-to-br from-violet-50 via-white to-fuchsia-50",
      borderClassName: "border-violet-200",
      badgeClassName: "bg-violet-100 text-violet-700",
      subtleBadgeClassName: "bg-violet-50 text-violet-700",
      accentTextClassName: "text-violet-700",
      selectedChipClassName: "border-violet-500 bg-violet-500 text-white shadow-lg shadow-violet-500/20",
      idleChipClassName: "border-violet-200 bg-white text-violet-700 hover:border-violet-400 hover:bg-violet-50",
      softPanelClassName: "border-violet-100 bg-violet-50/80",
      mutedRowClassName: "border-violet-100 bg-violet-50/60",
    },
  },
  {
    matches: ["pedi"],
    theme: {
      surfaceClassName: "bg-gradient-to-br from-amber-50 via-white to-yellow-50",
      borderClassName: "border-amber-200",
      badgeClassName: "bg-amber-100 text-amber-700",
      subtleBadgeClassName: "bg-amber-50 text-amber-700",
      accentTextClassName: "text-amber-700",
      selectedChipClassName: "border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-500/20",
      idleChipClassName: "border-amber-200 bg-white text-amber-700 hover:border-amber-400 hover:bg-amber-50",
      softPanelClassName: "border-amber-100 bg-amber-50/80",
      mutedRowClassName: "border-amber-100 bg-amber-50/60",
    },
  },
  {
    matches: ["neuro"],
    theme: {
      surfaceClassName: "bg-gradient-to-br from-sky-50 via-white to-blue-50",
      borderClassName: "border-sky-200",
      badgeClassName: "bg-sky-100 text-sky-700",
      subtleBadgeClassName: "bg-sky-50 text-sky-700",
      accentTextClassName: "text-sky-700",
      selectedChipClassName: "border-sky-500 bg-sky-500 text-white shadow-lg shadow-sky-500/20",
      idleChipClassName: "border-sky-200 bg-white text-sky-700 hover:border-sky-400 hover:bg-sky-50",
      softPanelClassName: "border-sky-100 bg-sky-50/80",
      mutedRowClassName: "border-sky-100 bg-sky-50/60",
    },
  },
  {
    matches: ["orl"],
    theme: {
      surfaceClassName: "bg-gradient-to-br from-emerald-50 via-white to-lime-50",
      borderClassName: "border-emerald-200",
      badgeClassName: "bg-emerald-100 text-emerald-700",
      subtleBadgeClassName: "bg-emerald-50 text-emerald-700",
      accentTextClassName: "text-emerald-700",
      selectedChipClassName: "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
      idleChipClassName: "border-emerald-200 bg-white text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50",
      softPanelClassName: "border-emerald-100 bg-emerald-50/80",
      mutedRowClassName: "border-emerald-100 bg-emerald-50/60",
    },
  },
  {
    matches: ["gine", "obst"],
    theme: {
      surfaceClassName: "bg-gradient-to-br from-rose-50 via-white to-pink-50",
      borderClassName: "border-rose-200",
      badgeClassName: "bg-rose-100 text-rose-700",
      subtleBadgeClassName: "bg-rose-50 text-rose-700",
      accentTextClassName: "text-rose-700",
      selectedChipClassName: "border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-500/20",
      idleChipClassName: "border-rose-200 bg-white text-rose-700 hover:border-rose-400 hover:bg-rose-50",
      softPanelClassName: "border-rose-100 bg-rose-50/80",
      mutedRowClassName: "border-rose-100 bg-rose-50/60",
    },
  },
];

const normalizeValue = (value: string | null | undefined): string => {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
};

export const getSpecializationTheme = (specializationName: string | null | undefined): SpecializationTheme => {
  const normalizedValue = normalizeValue(specializationName);

  const matchedTheme = specializationThemes.find(({ matches }) =>
    matches.some((matchValue) => normalizedValue.includes(matchValue)),
  );

  return matchedTheme?.theme ?? fallbackTheme;
};