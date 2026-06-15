export const getIconTheme = (colorClass: string): string => {
  const colorName = colorClass.split('-')[1];
  const map: Record<string, string> = {
    'slate': 'bg-slate-100 text-slate-600',
    'gray': 'bg-gray-100 text-gray-600',
    'stone': 'bg-stone-100 text-stone-600',
    'red': 'bg-red-100 text-red-600',
    'orange': 'bg-orange-100 text-orange-600',
    'amber': 'bg-amber-100 text-amber-600',
    'yellow': 'bg-yellow-100 text-yellow-600',
    'lime': 'bg-lime-100 text-lime-600',
    'green': 'bg-green-100 text-green-600',
    'emerald': 'bg-emerald-100 text-emerald-600',
    'teal': 'bg-teal-100 text-teal-600',
    'cyan': 'bg-cyan-100 text-cyan-600',
    'sky': 'bg-sky-100 text-sky-600',
    'blue': 'bg-blue-100 text-blue-600',
    'indigo': 'bg-indigo-100 text-indigo-600',
    'violet': 'bg-violet-100 text-violet-600',
    'purple': 'bg-purple-100 text-purple-600',
    'fuchsia': 'bg-fuchsia-100 text-fuchsia-600',
    'pink': 'bg-pink-100 text-pink-600',
    'rose': 'bg-rose-100 text-rose-600',
  };
  return map[colorName] || 'bg-slate-100 text-slate-600';
};
