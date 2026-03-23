export default function TabButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[130px] rounded-xl px-4 py-2 text-sm font-medium transition ${
        active
          ? 'bg-[#7a1f3d] text-white shadow-sm ring-1 ring-[#6b1836]'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  )
}
